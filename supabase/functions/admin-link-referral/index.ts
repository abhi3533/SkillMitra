import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts"

// Admin-only: manually link a referral code to an existing trainer who did not
// enter one during signup. Creates a trainer_referrals record (status='pending')
// and sets trainer.referred_by so that complete-trainer-referral will credit the
// referrer when this trainer gets admin-approved.

const BRAND_COLOR = '#1A56DB'
const APP_URL = 'https://skillmitra.online'
const FROM_EMAIL = 'SkillMitra <contact@skillmitra.online>'
const REFERRAL_CAP = 50
const REWARD = 1500

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

async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    })
    const data = await res.json()
    if (!res.ok) console.error(`❌ Resend error sending to ${to} [HTTP ${res.status}]:`, JSON.stringify(data))
    else console.log(`✅ Email sent to ${to}:`, data.id)
  } catch (e) {
    console.error(`❌ Email send failed to ${to}:`, e)
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // ── Auth: caller must have a valid Supabase session ──────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
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
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Service-role callers (internal invocations) are always trusted.
  // Browser callers must be admins verified against user_roles.
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const bearerToken = authHeader.replace('Bearer ', '')
  const isServiceRole = bearerToken === serviceRoleKey

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceRoleKey)

  if (!isServiceRole) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized — admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  // ── Main logic ────────────────────────────────────────────────────────────
  try {
    const { trainer_id, referral_code } = await req.json()

    if (!trainer_id || !referral_code) {
      return new Response(JSON.stringify({ success: false, error: 'trainer_id and referral_code are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const trimmedCode = String(referral_code).toUpperCase().trim()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

    // ── 1. Resolve referrer from referral code ──────────────────────────────
    const { data: referrer, error: referrerErr } = await supabase
      .from('trainers')
      .select('id, user_id, referral_code')
      .eq('referral_code', trimmedCode)
      .maybeSingle()

    if (referrerErr || !referrer) {
      return new Response(JSON.stringify({ success: false, error: `Referral code "${trimmedCode}" not found` }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 2. Resolve the trainer being linked ────────────────────────────────
    const { data: referredTrainer, error: referredErr } = await supabase
      .from('trainers')
      .select('id, user_id, referred_by')
      .eq('id', trainer_id)
      .maybeSingle()

    if (referredErr || !referredTrainer) {
      return new Response(JSON.stringify({ success: false, error: 'Trainer not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 3. Validations ─────────────────────────────────────────────────────

    // Cannot refer yourself
    if (referrer.user_id === referredTrainer.user_id) {
      return new Response(JSON.stringify({ success: false, error: 'Referrer and referred trainer are the same person' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Trainer already has a referral linked
    if (referredTrainer.referred_by) {
      return new Response(JSON.stringify({
        success: false,
        error: `Trainer already has referral code "${referredTrainer.referred_by}" linked`,
      }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check for existing trainer_referrals record for this referred trainer
    const { data: existingReferral } = await supabase
      .from('trainer_referrals')
      .select('id, status')
      .eq('referred_id', referredTrainer.id)
      .maybeSingle()

    if (existingReferral) {
      return new Response(JSON.stringify({
        success: false,
        error: `A referral record already exists for this trainer (status: ${existingReferral.status})`,
      }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Referrer cap: max 50 referrals
    const { count: referralCount } = await supabase
      .from('trainer_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', referrer.id)

    if ((referralCount || 0) >= REFERRAL_CAP) {
      return new Response(JSON.stringify({
        success: false,
        error: `Referrer has reached the maximum of ${REFERRAL_CAP} referrals`,
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 4. Create trainer_referrals record ─────────────────────────────────
    // status='pending' — complete-trainer-referral will flip it to 'paid' on approval
    const { error: insertErr } = await supabase.from('trainer_referrals').insert({
      referrer_id: referrer.id,
      referred_id: referredTrainer.id,
      referral_code: trimmedCode,
      reward_amount: REWARD,
      status: 'pending',
    })

    if (insertErr) {
      // Unique constraint violation means a concurrent insert beat us
      if (insertErr.code === '23505') {
        return new Response(JSON.stringify({ success: false, error: 'Referral record already exists (concurrent insert)' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw insertErr
    }

    // ── 5. Update trainer.referred_by ──────────────────────────────────────
    const { error: updateErr } = await supabase
      .from('trainers')
      .update({ referred_by: trimmedCode })
      .eq('id', referredTrainer.id)

    if (updateErr) throw updateErr

    // ── 6. Fetch profiles for notifications ────────────────────────────────
    const [referrerProfileRes, referredProfileRes] = await Promise.all([
      supabase.from('profiles').select('full_name, email').eq('id', referrer.user_id).single(),
      supabase.from('profiles').select('full_name, email').eq('id', referredTrainer.user_id).single(),
    ])
    const referrerProfile = referrerProfileRes.data
    const referredProfile = referredProfileRes.data
    const referrerName = referrerProfile?.full_name || 'Trainer'
    const referredName = referredProfile?.full_name || 'Trainer'

    // ── 7. In-app notification to referrer ────────────────────────────────
    await supabase.from('notifications').insert({
      user_id: referrer.user_id,
      title: 'New Trainer Referral Linked! 🎯',
      body: `${referredName} has been linked to your referral code by admin. You'll earn ₹${REWARD.toLocaleString('en-IN')} when they get approved.`,
      type: 'referral',
      action_url: '/trainer/referrals',
    })

    // ── 8. Emails ─────────────────────────────────────────────────────────
    if (RESEND_API_KEY) {
      // Email to referrer
      if (referrerProfile?.email) {
        await sendEmail(
          RESEND_API_KEY,
          referrerProfile.email,
          'A trainer has been linked to your referral code!',
          layout(`
            <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${referrerName} 🎯</h1>
            <p style="font-size: 15px; line-height: 1.7; color: #444;">Our admin team has linked <strong>${referredName}</strong> to your referral code <strong>${trimmedCode}</strong>.</p>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
              <p style="font-size: 14px; color: #1e40af; margin: 0;">Pending Reward</p>
              <p style="font-size: 28px; font-weight: 700; color: #1e40af; margin: 4px 0;">₹${REWARD.toLocaleString('en-IN')}</p>
              <p style="font-size: 13px; color: #1e40af; margin: 0;">will be credited after admin approval</p>
            </div>
            <p style="font-size: 15px; line-height: 1.7; color: #444;">Once ${referredName}'s profile is approved, ₹${REWARD.toLocaleString('en-IN')} will be credited to your wallet automatically.</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${APP_URL}/trainer/referrals" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Referrals</a>
            </div>
            <p style="font-size: 14px; color: #666;">Keep sharing your code to earn more!</p>
            <p style="font-size: 14px; color: #666; margin-top: 8px;">— Team SkillMitra</p>
          `)
        )
      }

      // Email to referred trainer confirming the code was applied
      if (referredProfile?.email) {
        await sendEmail(
          RESEND_API_KEY,
          referredProfile.email,
          'Referral code applied to your account!',
          layout(`
            <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${referredName} 👋</h1>
            <p style="font-size: 15px; line-height: 1.7; color: #444;">Our admin team has applied referral code <strong>${trimmedCode}</strong> to your account.</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="font-size: 14px; color: #166534; margin: 0; font-weight: 600;">What's next?</p>
              <ul style="font-size: 14px; line-height: 1.8; color: #166534; padding-left: 20px; margin: 8px 0 0;">
                <li>Complete your trainer profile if not already done</li>
                <li>Get approved by our admin team</li>
                <li>Your referrer earns ₹${REWARD.toLocaleString('en-IN')} upon your approval</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${APP_URL}/trainer/onboarding" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Go to Dashboard</a>
            </div>
            <p style="font-size: 14px; color: #666;">— Team SkillMitra</p>
          `)
        )
      }
    }

    console.log(`✅ Admin linked referral: code=${trimmedCode}, referred_trainer=${trainer_id}, referrer=${referrer.id}`)

    return new Response(JSON.stringify({
      success: true,
      referral_code: trimmedCode,
      referrer_name: referrerName,
      referred_name: referredName,
      reward_amount: REWARD,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('❌ Admin link referral error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
