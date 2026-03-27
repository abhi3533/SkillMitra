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
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">© ${new Date().getFullYear()} Learnvate Solutions Private Limited. All rights reserved.</p>
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

    const REWARD = Number(referral.reward_amount || 1500)

    // Update referral status to paid
    await supabase.from('trainer_referrals').update({ status: 'paid' }).eq('id', referral.id)

    // Credit referrer wallet
    const referrerUserId = (referral.referrer as any)?.user_id
    if (referrerUserId) {
      await creditWallet(
        supabase, referrerUserId, REWARD,
        'Trainer referral reward — referred trainer got admin approved',
        trainer_id
      )

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
            'Congratulations! ₹1,500 credited to your wallet 🎉',
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

    // Email referred trainer — welcome bonus
    if (RESEND_API_KEY) {
      const { data: referredProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', trainer.user_id)
        .single()

      if (referredProfile?.email) {
        await sendEmail(RESEND_API_KEY, referredProfile.email,
          'Welcome to SkillMitra — You joined via referral! 🎓',
          layout(`
            <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${referredProfile.full_name || 'Trainer'} 👋</h1>
            <p style="font-size: 15px; line-height: 1.7; color: #444;">Welcome to SkillMitra! You joined through a referral, and your profile has been approved.</p>
            <p style="font-size: 15px; line-height: 1.7; color: #444;">Start creating courses and teaching students right away!</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${APP_URL}/trainer/dashboard" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Go to Dashboard</a>
            </div>
            <p style="font-size: 14px; color: #666;">— Team SkillMitra</p>
          `)
        )
      }
    }

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
