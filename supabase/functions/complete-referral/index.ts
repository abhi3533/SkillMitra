import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function creditWallet(supabase: any, userId: string, amount: number, description: string, referenceId: string) {
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance, total_earned')
    .eq('user_id', userId)
    .single()

  if (!wallet) {
    console.error(`No wallet found for user ${userId}`)
    return
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
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { student_id, session_id, course_value } = await req.json()
    if (!student_id) throw new Error('student_id is required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

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

    // Find pending or eligible referral for this student
    const { data: referral } = await supabase
      .from('referrals')
      .select('*, referrer:referrer_id(id, user_id)')
      .eq('referred_id', student_id)
      .in('status', ['pending', 'eligible'])
      .single()


    if (!referral) {
      return new Response(JSON.stringify({ success: false, message: 'No pending referral found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate course value ≥ ₹5000
    const courseVal = Number(course_value || 0)
    if (courseVal < 5000) {
      // Mark as eligible but don't pay yet — course value too low
      await supabase.from('referrals').update({ status: 'eligible' }).eq('id', referral.id)
      console.log(`⏳ Referral ${referral.id} marked eligible but course value ₹${courseVal} < ₹5000`)
      return new Response(JSON.stringify({ success: false, message: 'Course value must be ≥ ₹5,000 to unlock referral reward' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const REWARD = Number(referral.reward_amount || 400)

    // Update referral status to paid
    await supabase.from('referrals').update({ status: 'paid' }).eq('id', referral.id)

    // Credit referrer wallet
    const referrerUserId = (referral.referrer as any)?.user_id
    if (referrerUserId) {
      await creditWallet(supabase, referrerUserId, REWARD, 'Referral reward — referred student completed first paid course (₹5,000+)', student_id)

      // Update referral_credits on students table
      const { data: referrerStudent } = await supabase
        .from('students')
        .select('id, referral_credits')
        .eq('id', referral.referrer_id)
        .single()

      if (referrerStudent) {
        await supabase.from('students').update({
          referral_credits: Number(referrerStudent.referral_credits || 0) + REWARD,
        }).eq('id', referrerStudent.id)
      }

      // Notify referrer
      await supabase.from('notifications').insert({
        user_id: referrerUserId,
        title: 'Referral Reward Credited! 🎉',
        body: `Your referral completed their first paid course! ₹${REWARD} has been added to your wallet.`,
        type: 'referral',
        action_url: '/student/wallet',
      })
    }

    // Credit referred student wallet
    await creditWallet(supabase, student.user_id, REWARD, 'Referral bonus — completed first paid course (₹5,000+)', referral.referrer_id)

    // Notify referred student
    await supabase.from('notifications').insert({
      user_id: student.user_id,
      title: 'Welcome Reward! 🎉',
      body: `Congratulations on completing your first course! ₹${REWARD} referral bonus has been added to your wallet.`,
      type: 'referral',
      action_url: '/student/wallet',
    })

    console.log(`✅ Referral completed: student ${student_id}, reward ₹${REWARD} each`)

    return new Response(JSON.stringify({ success: true, reward: REWARD }), {
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
