import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts"

const BRAND_COLOR = '#1A56DB'
const APP_URL = 'https://skillmitra.online'
const FROM_EMAIL = 'SkillMitra <contact@skillmitra.online>'
const ADMIN_EMAIL = 'contact@skillmitra.online'

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
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verify valid user JWT (trainer calling for 'requested', admin calling for 'approved'/'rejected')
  const authClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured')

    const { payout_request_id, action, transaction_reference } = await req.json()
    if (!payout_request_id || !action) throw new Error('payout_request_id and action are required')
    if (!['requested', 'approved', 'rejected'].includes(action)) throw new Error('Invalid action')

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Fetch payout request
    const { data: payoutReq, error: payoutErr } = await supabase
      .from('payout_requests')
      .select('id, requested_amount, upi_id, bank_account_number, transaction_reference, trainer_id')
      .eq('id', payout_request_id)
      .single()
    if (payoutErr || !payoutReq) throw new Error('Payout request not found')

    // Fetch trainer → profile
    const { data: trainer } = await supabase
      .from('trainers')
      .select('user_id')
      .eq('id', payoutReq.trainer_id)
      .single()
    if (!trainer) throw new Error('Trainer not found')

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', trainer.user_id)
      .single()
    if (!profile?.email) throw new Error('Trainer email not found')

    const trainerName = profile.full_name || 'Trainer'
    const amountFormatted = `₹${Number(payoutReq.requested_amount).toLocaleString('en-IN')}`
    const txRef = transaction_reference || payoutReq.transaction_reference

    let subject: string
    let htmlBody: string
    let recipientEmail: string

    if (action === 'requested') {
      // Email goes to admin so they can review the request
      recipientEmail = ADMIN_EMAIL
      const paymentMethod = payoutReq.upi_id
        ? `UPI: ${payoutReq.upi_id}`
        : payoutReq.bank_account_number
          ? `Bank: ****${String(payoutReq.bank_account_number).slice(-4)}`
          : 'No payment details on file'

      subject = `New payout request — ${amountFormatted} from ${trainerName}`
      htmlBody = layout(`
        <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">New Payout Request</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #444;"><strong>${trainerName}</strong> has requested a payout of <strong>${amountFormatted}</strong>.</p>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="font-size: 14px; color: #444; margin: 4px 0;"><strong>Trainer:</strong> ${trainerName}</p>
          <p style="font-size: 14px; color: #444; margin: 4px 0;"><strong>Amount:</strong> ${amountFormatted}</p>
          <p style="font-size: 14px; color: #444; margin: 4px 0;"><strong>Payment method:</strong> ${paymentMethod}</p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${APP_URL}/admin/payouts" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Review Payout</a>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 24px;">— SkillMitra Admin System</p>
      `)

    } else if (action === 'approved') {
      recipientEmail = profile.email
      subject = `Your ${amountFormatted} payout has been processed`
      htmlBody = layout(`
        <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${trainerName} 🎉</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">Great news — your payout request has been <strong style="color: #059669;">approved and processed</strong>!</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="font-size: 14px; color: #166534; margin: 4px 0;"><strong>Amount:</strong> ${amountFormatted}</p>
          ${txRef ? `<p style="font-size: 14px; color: #166534; margin: 4px 0;"><strong>Transaction Ref:</strong> ${txRef}</p>` : ''}
          <p style="font-size: 14px; color: #166534; margin: 4px 0;"><strong>Timeline:</strong> 3–5 business days</p>
        </div>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">The funds will reflect in your bank account or UPI within 3–5 business days.</p>
        <p style="font-size: 14px; color: #666; margin-top: 24px;">— Team SkillMitra</p>
      `)

    } else {
      // rejected
      recipientEmail = profile.email
      subject = `Your payout request could not be processed`
      htmlBody = layout(`
        <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${trainerName},</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">Unfortunately, your payout request of <strong>${amountFormatted}</strong> could not be processed at this time.</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="font-size: 14px; color: #991b1b; margin: 0;">The requested amount has been <strong>reversed back to your SkillMitra wallet</strong>. You can request another payout at any time.</p>
        </div>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">If you have questions, write to us at <a href="mailto:contact@skillmitra.online" style="color: ${BRAND_COLOR};">contact@skillmitra.online</a>.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${APP_URL}/trainer/wallet" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Your Wallet</a>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 24px;">— Team SkillMitra</p>
      `)
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [recipientEmail], subject, html: htmlBody }),
    })
    const resendData = await resendRes.json()
    if (!resendRes.ok) {
      console.error(`Resend API error [${resendRes.status}]:`, resendData)
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`)
    }

    console.log(`✅ Payout ${action} email sent to ${recipientEmail}:`, resendData.id)

    return new Response(JSON.stringify({ success: true, email_id: resendData.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('Error in notify-payout-status:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
