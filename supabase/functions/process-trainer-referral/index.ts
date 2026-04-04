import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

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

async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    })
    const data = await res.json()
    if (!res.ok) console.error('Resend error:', data)
    else console.log(`✅ Email sent to ${to}:`, data.id)
  } catch (e) {
    console.error('Email send failed:', e)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { referral_code, new_user_id } = await req.json()
    if (!referral_code || !new_user_id) throw new Error('referral_code and new_user_id required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

    // Find referrer trainer
    const { data: referrer, error: refErr } = await supabase
      .from('trainers')
      .select('id, user_id, referral_code')
      .eq('referral_code', referral_code.toUpperCase().trim())
      .single()

    if (refErr || !referrer) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid trainer referral code' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check 50 referral cap
    const { count: refCount } = await supabase
      .from('trainer_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', referrer.id)

    if ((refCount || 0) >= 50) {
      return new Response(JSON.stringify({ success: false, error: 'Referrer has reached the maximum of 50 referrals' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find new trainer
    const { data: newTrainer, error: ntErr } = await supabase
      .from('trainers')
      .select('id, user_id')
      .eq('user_id', new_user_id)
      .single()

    if (ntErr || !newTrainer) {
      return new Response(JSON.stringify({ success: false, error: 'New trainer not found' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (referrer.user_id === new_user_id) {
      return new Response(JSON.stringify({ success: false, error: 'Cannot refer yourself' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check duplicate — one reward per referred trainer
    const { data: existing } = await supabase
      .from('trainer_referrals')
      .select('id')
      .eq('referred_id', newTrainer.id)
      .limit(1)

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ success: false, error: 'Already referred' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const REWARD = 1500
    const trimmedCode = referral_code.toUpperCase().trim()

    // Create referral — status PENDING until referred trainer gets admin approved
    const { error: insertErr } = await supabase.from('trainer_referrals').insert({
      referrer_id: referrer.id,
      referred_id: newTrainer.id,
      referral_code: trimmedCode,
      reward_amount: REWARD,
      status: 'pending',
    })

    if (insertErr) {
      if (insertErr.code === '23505') {
        return new Response(JSON.stringify({ success: false, error: 'Already referred' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw insertErr
    }

    // Update referred_by
    await supabase.from('trainers').update({ referred_by: trimmedCode }).eq('id', newTrainer.id)

    // Fetch profiles for emails
    const [referrerProfileRes, newTrainerProfileRes] = await Promise.all([
      supabase.from('profiles').select('full_name, email').eq('id', referrer.user_id).single(),
      supabase.from('profiles').select('full_name, email').eq('id', new_user_id).single(),
    ])
    const referrerProfile = referrerProfileRes.data
    const newTrainerProfile = newTrainerProfileRes.data
    const referrerName = referrerProfile?.full_name || 'Trainer'
    const newTrainerName = newTrainerProfile?.full_name || 'New Trainer'

    // Notify referrer (in-app)
    await supabase.from('notifications').insert({
      user_id: referrer.user_id,
      title: 'New Trainer Referral! 🎯',
      body: `${newTrainerName} signed up using your referral code! You'll earn ₹${REWARD} when they get admin approved.`,
      type: 'referral',
      action_url: '/trainer/referrals',
    })

    // === EMAILS ===
    if (RESEND_API_KEY) {
      // 1. Email to referrer
      if (referrerProfile?.email) {
        await sendEmail(RESEND_API_KEY, referrerProfile.email,
          'Someone used your referral code!',
          layout(`
            <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${referrerName} 🎯</h1>
            <p style="font-size: 15px; line-height: 1.7; color: #444;"><strong>${newTrainerName}</strong> signed up using your referral code <strong>${trimmedCode}</strong>.</p>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
              <p style="font-size: 14px; color: #1e40af; margin: 0;">Pending Reward</p>
              <p style="font-size: 28px; font-weight: 700; color: #1e40af; margin: 4px 0;">₹${REWARD.toLocaleString('en-IN')}</p>
              <p style="font-size: 13px; color: #1e40af; margin: 0;">will be credited after admin approval</p>
            </div>
            <p style="font-size: 15px; line-height: 1.7; color: #444;">Once the referred trainer's profile is approved by our admin team, ₹${REWARD.toLocaleString('en-IN')} will be credited to your wallet.</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${APP_URL}/trainer/referrals" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Referrals</a>
            </div>
            <p style="font-size: 14px; color: #666;">Keep sharing your code to earn more!</p>
            <p style="font-size: 14px; color: #666; margin-top: 8px;">— Team SkillMitra</p>
          `)
        )
      }

      // 2. Email to new trainer
      if (newTrainerProfile?.email) {
        await sendEmail(RESEND_API_KEY, newTrainerProfile.email,
          'Referral code applied!',
          layout(`
            <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${newTrainerName} 👋</h1>
            <p style="font-size: 15px; line-height: 1.7; color: #444;">Your referral code <strong>${trimmedCode}</strong> has been successfully applied!</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="font-size: 14px; color: #166534; margin: 0; font-weight: 600;">What's next?</p>
              <ul style="font-size: 14px; line-height: 1.8; color: #166534; padding-left: 20px; margin: 8px 0 0;">
                <li>Complete your trainer profile</li>
                <li>Get approved by our admin team</li>
                <li>Earn ₹${REWARD.toLocaleString('en-IN')} bonus upon approval!</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${APP_URL}/trainer/onboarding" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Complete My Profile</a>
            </div>
            <p style="font-size: 14px; color: #666;">— Team SkillMitra</p>
          `)
        )
      }

      // 3. Email to admin
      const ADMIN_EMAIL = 'contact@skillmitra.online'
      await sendEmail(RESEND_API_KEY, ADMIN_EMAIL,
        'New referral signup — review needed',
        layout(`
          <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">New Referral Signup 🎯</h1>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <table cellPadding="0" cellSpacing="0" style="width: 100%; font-size: 14px; color: #444;">
              <tr><td style="padding: 6px 0; font-weight: 600;">New Trainer:</td><td style="padding: 6px 0;">${newTrainerName} (${newTrainerProfile?.email || '—'})</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600;">Referral Code:</td><td style="padding: 6px 0;">${trimmedCode}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600;">Referred By:</td><td style="padding: 6px 0;">${referrerName} (${referrerProfile?.email || '—'})</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600;">Bonus Pending:</td><td style="padding: 6px 0;">₹${REWARD.toLocaleString('en-IN')} (credited on approval)</td></tr>
            </table>
          </div>
          <p style="font-size: 15px; line-height: 1.7; color: #444;">₹${REWARD.toLocaleString('en-IN')} referral bonus is pending for <strong>${referrerName}</strong>. It will be credited once this trainer's profile is approved.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${APP_URL}/admin/trainers" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Review Trainers</a>
          </div>
          <p style="font-size: 14px; color: #666;">— SkillMitra System</p>
        `)
      )
    }

    console.log(`✅ Trainer referral created: ${trimmedCode} (pending admin approval)`)

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('❌ Trainer referral error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
