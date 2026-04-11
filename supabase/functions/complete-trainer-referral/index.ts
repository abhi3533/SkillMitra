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

async function creditWallet(supabase: any, userId: string, amount: number, description: string, referenceId: string) {
  // Single atomic RPC: UPDATE balance + INSERT transaction in one DB round-trip.
  // Eliminates the read-modify-write race condition that caused duplicate credits
  // when two concurrent calls read the same balance before either wrote back.
  const { error } = await supabase.rpc('credit_wallet_atomic', {
    p_user_id: userId,
    p_amount: amount,
    p_description: description,
    p_reference_id: referenceId,
  })

  if (error) {
    console.error(`Failed to credit wallet for user ${userId}:`, error)
    return false
  }

  return true
}

async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error(`❌ Resend error sending to ${to} (subject: "${subject}") [HTTP ${res.status}]:`, JSON.stringify(data))
    } else {
      console.log(`✅ Email sent to ${to}:`, data.id)
    }
  } catch (e) {
    console.error(`❌ Email send failed to ${to} (subject: "${subject}"):`, e)
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Auth guard — caller must have a valid Supabase session token
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user: callerUser }, error: authErr } = await anonClient.auth.getUser()
  if (authErr || !callerUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // BUG-A-02: Only service-role or admin users may trigger referral completion.
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const bearerToken = authHeader.replace('Bearer ', '')
  const isServiceRole = bearerToken === serviceRoleKey

  if (!isServiceRole) {
    const adminCheck = createClient(Deno.env.get('SUPABASE_URL')!, serviceRoleKey)
    const { data: roleData } = await adminCheck
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  try {
    const { trainer_id } = await req.json()
    if (!trainer_id) throw new Error('trainer_id is required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

    // Check if this trainer was referred and referral is still pending
    const { data: trainer } = await supabase
      .from('trainers')
      .select('id, user_id, referred_by')
      .eq('id', trainer_id)
      .single()

    if (!trainer || !trainer.referred_by) {
      return new Response(JSON.stringify({ success: false, message: 'No pending referral' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find pending referral for this trainer
    const { data: referral } = await supabase
      .from('trainer_referrals')
      .select('*, referrer:referrer_id(id, user_id)')
      .eq('referred_id', trainer_id)
      .eq('status', 'pending')
      .single()

    if (!referral) {
      return new Response(JSON.stringify({ success: false, message: 'No pending referral found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Atomically claim the referral: only update if status is still 'pending'.
    // If two admin approvals race, only one UPDATE will match the eq('status','pending')
    // filter — the other gets 0 rows back and returns early, preventing double-credit.
    const { data: claimed } = await supabase
      .from('trainer_referrals')
      .update({ status: 'processing' })
      .eq('id', referral.id)
      .eq('status', 'pending')
      .select('id')

    if (!claimed || claimed.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Referral already being processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const REWARD = Number(referral.reward_amount || 1500)

    // Ensure referrer account still exists before crediting
    const referrerUserId = (referral.referrer as any)?.user_id
    if (!referrerUserId) {
      return new Response(JSON.stringify({ success: false, error: 'Referrer account has been deleted — cannot process reward' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Credit referrer wallet (mark paid only after this succeeds)
    if (referrerUserId) {
      const credited = await creditWallet(
        supabase, referrerUserId, REWARD,
        'Trainer referral reward — referred trainer got admin approved',
        trainer_id
      )
      if (!credited) {
        throw new Error(`Failed to credit referrer wallet for user ${referrerUserId}`)
      }

      // Mark referral as paid only after wallet credit succeeded
      await supabase.from('trainer_referrals').update({ status: 'paid' }).eq('id', referral.id)

      // Update referral_credits on trainers table
      const { data: referrerTrainer } = await supabase
        .from('trainers')
        .select('id, referral_credits')
        .eq('id', referral.referrer_id)
        .single()

      if (referrerTrainer) {
        await supabase.from('trainers').update({
          referral_credits: Number(referrerTrainer.referral_credits || 0) + REWARD,
        }).eq('id', referrerTrainer.id)
      }

      // Notify referrer in-app
      await supabase.from('notifications').insert({
        user_id: referrerUserId,
        title: 'Referral Reward Credited! 🎉',
        body: `Your referred trainer got approved! ₹${REWARD} has been added to your wallet.`,
        type: 'referral',
        action_url: '/trainer/wallet',
      })

      // Email referrer
      if (RESEND_API_KEY) {
        const { data: referrerProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', referrerUserId)
          .single()

        if (referrerProfile?.email) {
          await sendEmail(RESEND_API_KEY, referrerProfile.email,
            `Your ₹${REWARD.toLocaleString('en-IN')} bonus will be credited shortly!`,
            layout(`
              <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${referrerProfile.full_name || 'Trainer'} 🎉</h1>
              <p style="font-size: 15px; line-height: 1.7; color: #444;">Great news! The trainer you referred has been <strong style="color: #059669;">approved</strong> by our team.</p>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                <p style="font-size: 14px; color: #166534; margin: 0;">Referral Reward</p>
                <p style="font-size: 28px; font-weight: 700; color: #166534; margin: 4px 0;">₹${REWARD.toLocaleString('en-IN')}</p>
                <p style="font-size: 13px; color: #166534; margin: 0;">credited to your wallet</p>
              </div>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${APP_URL}/trainer/wallet" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Wallet</a>
              </div>
              <p style="font-size: 14px; color: #666;">Keep referring and keep earning! Share your code with more trainers.</p>
              <p style="font-size: 14px; color: #666; margin-top: 8px;">— Team SkillMitra</p>
            `)
          )
        }
      }
    }

    // Note: no separate email to Trainer B here — notify-trainer-status already sends
    // an approval email when admin approves, avoiding a duplicate message.

    console.log(`✅ Trainer referral completed: trainer ${trainer_id}, reward ₹${REWARD} to referrer`)

    return new Response(JSON.stringify({ success: true, reward: REWARD }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('❌ Complete trainer referral error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
