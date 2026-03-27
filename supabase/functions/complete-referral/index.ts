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

async function creditWallet(supabase: any, userId: string, amount: number, description: string, referenceId: string) {
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance, total_earned')
    .eq('user_id', userId)
    .single()

  if (!wallet) {
    console.error(`No wallet found for user ${userId}`)
    return false
  }

  await supabase.from('wallets').update({
    balance: Number(wallet.balance) + amount,
    total_earned: Number(wallet.total_earned) + amount,
    last_updated: new Date().toISOString(),
  }).eq('id', wallet.id)

  await supabase.from('wallet_transactions').insert({
    wallet_id: wallet.id,
    user_id: userId,
    type: 'credit',
    amount,
    description,
    reference_id: referenceId,
  })

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
    const { student_id, course_value } = await req.json()
    if (!student_id) throw new Error('student_id is required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

    // Check if this student was referred and referral is still pending
    const { data: student } = await supabase
      .from('students')
      .select('id, user_id, referred_by')
      .eq('id', student_id)
      .single()

    if (!student || !student.referred_by) {
      return new Response(JSON.stringify({ success: false, message: 'No pending referral' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find pending referral for this student
    const { data: referral } = await supabase
      .from('referrals')
      .select('*, referrer:referrer_id(id, user_id)')
      .eq('referred_id', student_id)
      .eq('status', 'pending')
      .single()

    if (!referral) {
      return new Response(JSON.stringify({ success: false, message: 'No pending referral found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const REFERRER_REWARD = Number(referral.reward_amount || 500)
    const REFERRED_BONUS = 100

    // Update referral status to paid
    await supabase.from('referrals').update({ status: 'paid' }).eq('id', referral.id)

    // Credit referrer wallet — ₹500
    const referrerUserId = (referral.referrer as any)?.user_id
    if (referrerUserId) {
      await creditWallet(supabase, referrerUserId, REFERRER_REWARD, 'Referral reward — referred student completed first paid enrollment', student_id)

      // Update referral_credits on students table
      const { data: referrerStudent } = await supabase
        .from('students')
        .select('id, referral_credits')
        .eq('id', referral.referrer_id)
        .single()

      if (referrerStudent) {
        await supabase.from('students').update({
          referral_credits: Number(referrerStudent.referral_credits || 0) + REFERRER_REWARD,
        }).eq('id', referrerStudent.id)
      }

      // Notify referrer in-app
      await supabase.from('notifications').insert({
        user_id: referrerUserId,
        title: 'Referral Reward Credited! 🎉',
        body: `Your friend enrolled in a course! ₹${REFERRER_REWARD} has been added to your wallet.`,
        type: 'referral',
        action_url: '/student/wallet',
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
            'Your friend joined SkillMitra! ₹500 credited 🎉',
            layout(`
              <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${referrerProfile.full_name || 'Student'} 🎉</h1>
              <p style="font-size: 15px; line-height: 1.7; color: #444;">Great news! Your referred friend just completed their first paid enrollment on SkillMitra.</p>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                <p style="font-size: 14px; color: #166534; margin: 0;">Referral Reward</p>
                <p style="font-size: 28px; font-weight: 700; color: #166534; margin: 4px 0;">₹${REFERRER_REWARD.toLocaleString('en-IN')}</p>
                <p style="font-size: 13px; color: #166534; margin: 0;">credited to your wallet</p>
              </div>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${APP_URL}/student/wallet" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Wallet</a>
              </div>
              <p style="font-size: 14px; color: #666;">Keep referring and keep earning! Share your code with more friends.</p>
              <p style="font-size: 14px; color: #666; margin-top: 8px;">— Team SkillMitra</p>
            `)
          )
        }
      }
    }

    // Credit referred student wallet — ₹100 bonus
    await creditWallet(supabase, student.user_id, REFERRED_BONUS, 'Welcome referral bonus — ₹100 credited on first enrollment', referral.referrer_id)

    // Notify referred student
    await supabase.from('notifications').insert({
      user_id: student.user_id,
      title: 'Welcome Bonus! 🎉',
      body: `Congratulations on your first enrollment! ₹${REFERRED_BONUS} referral bonus has been added to your wallet.`,
      type: 'referral',
      action_url: '/student/wallet',
    })

    // Email referred student
    if (RESEND_API_KEY) {
      const { data: referredProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', student.user_id)
        .single()

      if (referredProfile?.email) {
        await sendEmail(RESEND_API_KEY, referredProfile.email,
          'Welcome! ₹100 discount applied on your first course 🎓',
          layout(`
            <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${referredProfile.full_name || 'Student'} 👋</h1>
            <p style="font-size: 15px; line-height: 1.7; color: #444;">Welcome to SkillMitra! You joined through a referral and just completed your first enrollment.</p>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
              <p style="font-size: 14px; color: #1e40af; margin: 0;">Welcome Bonus</p>
              <p style="font-size: 28px; font-weight: 700; color: #1e40af; margin: 4px 0;">₹${REFERRED_BONUS}</p>
              <p style="font-size: 13px; color: #1e40af; margin: 0;">added to your wallet</p>
            </div>
            <p style="font-size: 15px; line-height: 1.7; color: #444;">Use your wallet balance towards your next course enrollment!</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${APP_URL}/student/dashboard" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Go to Dashboard</a>
            </div>
            <p style="font-size: 14px; color: #666;">— Team SkillMitra</p>
          `)
        )
      }
    }

    console.log(`✅ Student referral completed: student ${student_id}, ₹${REFERRER_REWARD} to referrer, ₹${REFERRED_BONUS} to referred`)

    return new Response(JSON.stringify({ success: true, referrer_reward: REFERRER_REWARD, referred_bonus: REFERRED_BONUS }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('❌ Complete referral error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
