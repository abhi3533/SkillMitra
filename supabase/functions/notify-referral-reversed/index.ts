import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts"

const BRAND_COLOR = '#1A56DB'
const APP_URL = 'https://skillmitra.online'
const FROM_EMAIL = 'SkillMitra <contact@skillmitra.online>'

function layout(content: string): string {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
    <div style="text-align: center; margin-bottom: 28px;">
      <span style="font-size: 24px; font-weight: 700; color: #0F172A;">Skill</span><span style="font-size: 24px; font-weight: 700; color: ${BRAND_COLOR};">Mitra</span>
    </div>
    ${content}
    <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0 0 8px;">Questions? Reply to this email or contact us at <a href="mailto:contact@skillmitra.online" style="color: #9ca3af; text-decoration: underline;">contact@skillmitra.online</a> | <a href="https://skillmitra.online" style="color: #9ca3af; text-decoration: underline;">skillmitra.online</a></p>
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">© ${new Date().getFullYear()} Learnvate Solutions. All rights reserved.</p>
    </div>
  </div>`
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured')

    const { referrer_user_id, amount } = await req.json()
    if (!referrer_user_id || !amount) throw new Error('referrer_user_id and amount are required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get referrer's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', referrer_user_id)
      .maybeSingle()

    if (!profile?.email) throw new Error('Referrer profile or email not found')

    const referrerName = profile.full_name || 'Trainer'
    const amountFormatted = Number(amount).toLocaleString('en-IN')

    const subject = `Your referral reward of ₹${amountFormatted} was reversed by admin`
    const htmlBody = layout(`
      <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${referrerName},</h1>
      <p style="font-size: 15px; line-height: 1.7; color: #444;">We're writing to let you know that your referral reward has been <strong style="color: #dc2626;">reversed</strong> by our admin team.</p>

      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
        <p style="font-size: 14px; color: #991b1b; margin: 0;">Amount Reversed</p>
        <p style="font-size: 28px; font-weight: 700; color: #991b1b; margin: 4px 0;">₹${amountFormatted}</p>
        <p style="font-size: 13px; color: #991b1b; margin: 0;">debited from your wallet</p>
      </div>

      <p style="font-size: 15px; line-height: 1.7; color: #444;">This transaction is reflected in your wallet history. If you believe this was done in error, please contact us.</p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${APP_URL}/trainer/wallet" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Wallet</a>
      </div>

      <p style="font-size: 15px; line-height: 1.7; color: #444;">If you have questions, contact us at <a href="mailto:contact@skillmitra.online" style="color: ${BRAND_COLOR};">contact@skillmitra.online</a>.</p>

      <p style="font-size: 14px; color: #666; margin-top: 8px;">— Team SkillMitra</p>
    `)

    // Send email via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [profile.email], subject, html: htmlBody }),
    })
    const resendData = await resendRes.json()
    if (!resendRes.ok) {
      console.error(`❌ Resend error [${resendRes.status}]:`, resendData)
    } else {
      console.log(`✅ Referral reversal email sent to ${profile.email}:`, resendData.id)
    }

    // In-app notification for Trainer A
    await supabase.from('notifications').insert({
      user_id: referrer_user_id,
      title: 'Referral reward reversed',
      body: `Your referral reward of ₹${amountFormatted} was reversed by admin. Check your wallet for details.`,
      type: 'referral',
      action_url: '/trainer/wallet',
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('❌ Error in notify-referral-reversed:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
