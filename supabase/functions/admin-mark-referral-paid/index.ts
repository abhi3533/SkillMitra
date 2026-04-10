import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts"

async function creditWallet(supabase: any, userId: string, amount: number, description: string, referenceId: string): Promise<boolean> {
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance, total_earned')
    .eq('user_id', userId)
    .single()

  if (!wallet) {
    console.error(`No wallet found for user ${userId}`)
    return false
  }

  // Check for existing transaction to prevent double-credit
  const { data: existingTx } = await supabase
    .from('wallet_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('reference_id', referenceId)
    .eq('type', 'credit')
    .limit(1)

  if (existingTx && existingTx.length > 0) {
    console.log(`⚠️ Wallet already credited for user ${userId}, reference ${referenceId} — skipping`)
    return false // Already credited
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

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) throw new Error('Unauthorized')

    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()
    if (!adminCheck) throw new Error('Unauthorized — admin access required')

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

      // Update status
      await supabase.from('trainer_referrals').update({ status: 'paid' }).eq('id', referral_id)

      // Credit referrer wallet
      if (referrerUserId) {
        const credited = await creditWallet(
          supabase, referrerUserId, REWARD,
          'Trainer referral reward — admin approved',
          `trainer_referral_${referral_id}`
        )

        if (credited) {
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

          // Notify referrer
          await supabase.from('notifications').insert({
            user_id: referrerUserId,
            title: 'Referral Reward Credited! 🎉',
            body: `Your referral bonus of ₹${REWARD.toLocaleString('en-IN')} has been credited to your wallet!`,
            type: 'referral',
            action_url: '/trainer/wallet',
          })
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

      // Update status
      await supabase.from('referrals').update({ status: 'paid' }).eq('id', referral_id)

      // Credit referrer wallet — ₹500
      if (referrerUserId) {
        const credited = await creditWallet(
          supabase, referrerUserId, REFERRER_REWARD,
          'Student referral reward — admin approved',
          `student_referral_referrer_${referral_id}`
        )

        if (credited) {
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

          // Notify referrer
          await supabase.from('notifications').insert({
            user_id: referrerUserId,
            title: 'Referral Reward Credited! 🎉',
            body: `Your referral bonus of ₹${REFERRER_REWARD.toLocaleString('en-IN')} has been credited to your wallet!`,
            type: 'referral',
            action_url: '/student/wallet',
          })
        }
      }

      // Credit referred student wallet — ₹100
      if (referredUserId) {
        const credited = await creditWallet(
          supabase, referredUserId, REFERRED_BONUS,
          'Welcome referral bonus — ₹100 credited by admin',
          `student_referral_referred_${referral_id}`
        )

        if (credited) {
          await supabase.from('notifications').insert({
            user_id: referredUserId,
            title: 'Welcome Bonus! 🎉',
            body: `₹${REFERRED_BONUS} referral bonus has been added to your wallet!`,
            type: 'referral',
            action_url: '/student/wallet',
          })
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
