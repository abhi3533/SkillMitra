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

async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error(`❌ Resend error sending to ${to} [HTTP ${res.status}]:`, JSON.stringify(data))
    } else {
      console.log(`✅ Email sent to ${to}:`, data.id)
    }
  } catch (e) {
    console.error(`❌ Email send failed to ${to}:`, e)
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { referral_id, table } = await req.json()
    if (!referral_id || !table) throw new Error('referral_id and table are required')
    if (table !== 'referrals' && table !== 'trainer_referrals') throw new Error('Invalid table')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

    // Verify caller is admin — use user_roles table (same as complete-trainer-referral)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) throw new Error('Unauthorized')

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
    if (!roleData) throw new Error('Unauthorized — admin access required')

    if (table === 'trainer_referrals') {
      // ===== TRAINER REFERRAL =====
      const { data: referral, error: refErr } = await supabase
        .from('trainer_referrals')
        .select('*, referrer:referrer_id(id, user_id), referred:referred_id(id, user_id)')
        .eq('id', referral_id)
        .single()

      if (refErr || !referral) throw new Error('Referral not found')
      if (referral.status === 'paid') {
        return new Response(JSON.stringify({ success: false, error: 'Already marked as paid' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const REWARD = Number(referral.reward_amount || 1500)
      const referrerUserId = (referral.referrer as any)?.user_id

      // Update status first (acts as idempotency guard against double-click)
      await supabase.from('trainer_referrals').update({ status: 'paid' }).eq('id', referral_id)

      // Credit referrer wallet atomically — single statement eliminates race condition
      if (referrerUserId) {
        const { error: rpcError } = await supabase.rpc('credit_wallet_atomic', {
          p_user_id: referrerUserId,
          p_amount: REWARD,
          p_description: 'Trainer referral reward — admin approved',
          p_reference_id: `trainer_referral_${referral_id}`,
        })
        if (rpcError) {
          console.error('credit_wallet_atomic failed:', rpcError)
          // Revert status so admin can retry
          await supabase.from('trainer_referrals').update({ status: 'pending' }).eq('id', referral_id)
          throw new Error(`Wallet credit failed: ${rpcError.message}`)
        }

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

        // In-app notification
        await supabase.from('notifications').insert({
          user_id: referrerUserId,
          title: 'Referral Reward Credited! 🎉',
          body: `Your referral bonus of ₹${REWARD.toLocaleString('en-IN')} has been credited to your wallet!`,
          type: 'referral',
          action_url: '/trainer/wallet',
        })

        // Email Trainer A — same template as complete-trainer-referral automatic flow
        if (RESEND_API_KEY) {
          const { data: referrerProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', referrerUserId)
            .single()

          if (referrerProfile?.email) {
            await sendEmail(RESEND_API_KEY, referrerProfile.email,
              `Your ₹${REWARD.toLocaleString('en-IN')} referral bonus has been credited!`,
              layout(`
                <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${referrerProfile.full_name || 'Trainer'} 🎉</h1>
                <p style="font-size: 15px; line-height: 1.7; color: #444;">Great news! Your referral reward has been <strong style="color: #059669;">credited</strong> to your wallet by our team.</p>
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

      console.log(`✅ Trainer referral ${referral_id} marked paid, ₹${REWARD} credited`)

    } else {
      // ===== STUDENT REFERRAL =====
      const { data: referral, error: refErr } = await supabase
        .from('referrals')
        .select('*, referrer:referrer_id(id, user_id), referred:referred_id(id, user_id)')
        .eq('id', referral_id)
        .single()

      if (refErr || !referral) throw new Error('Referral not found')
      if (referral.status === 'paid') {
        return new Response(JSON.stringify({ success: false, error: 'Already marked as paid' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const REFERRER_REWARD = Number(referral.reward_amount || 500)
      const REFERRED_BONUS = 100
      const referrerUserId = (referral.referrer as any)?.user_id
      const referredUserId = (referral.referred as any)?.user_id

      // Update status first (acts as idempotency guard)
      await supabase.from('referrals').update({ status: 'paid' }).eq('id', referral_id)

      // Credit referrer wallet atomically
      if (referrerUserId) {
        const { error: rpcError } = await supabase.rpc('credit_wallet_atomic', {
          p_user_id: referrerUserId,
          p_amount: REFERRER_REWARD,
          p_description: 'Student referral reward — admin approved',
          p_reference_id: `student_referral_referrer_${referral_id}`,
        })
        if (rpcError) {
          console.error('credit_wallet_atomic failed for referrer:', rpcError)
          await supabase.from('referrals').update({ status: 'pending' }).eq('id', referral_id)
          throw new Error(`Wallet credit failed: ${rpcError.message}`)
        }

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

        await supabase.from('notifications').insert({
          user_id: referrerUserId,
          title: 'Referral Reward Credited! 🎉',
          body: `Your referral bonus of ₹${REFERRER_REWARD.toLocaleString('en-IN')} has been credited to your wallet!`,
          type: 'referral',
          action_url: '/student/wallet',
        })
      }

      // Credit referred student wallet atomically
      if (referredUserId) {
        const { error: rpcError } = await supabase.rpc('credit_wallet_atomic', {
          p_user_id: referredUserId,
          p_amount: REFERRED_BONUS,
          p_description: 'Welcome referral bonus — ₹100 credited by admin',
          p_reference_id: `student_referral_referred_${referral_id}`,
        })
        if (!rpcError) {
          await supabase.from('notifications').insert({
            user_id: referredUserId,
            title: 'Welcome Bonus! 🎉',
            body: `₹${REFERRED_BONUS} referral bonus has been added to your wallet!`,
            type: 'referral',
            action_url: '/student/wallet',
          })
        } else {
          console.error('credit_wallet_atomic failed for referred student:', rpcError)
        }
      }

      console.log(`✅ Student referral ${referral_id} marked paid, ₹${REFERRER_REWARD} to referrer, ₹${REFERRED_BONUS} to referred`)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('❌ Admin mark referral paid error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
