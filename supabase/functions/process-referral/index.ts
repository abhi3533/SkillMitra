import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { referral_code, new_user_id } = await req.json()
    if (!referral_code || !new_user_id) {
      throw new Error('referral_code and new_user_id are required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find referrer student by referral_code
    const { data: referrer, error: refErr } = await supabase
      .from('students')
      .select('id, user_id, referral_code')
      .eq('referral_code', referral_code.toUpperCase().trim())
      .single()

    if (refErr || !referrer) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid referral code' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find new student
    const { data: newStudent, error: nsErr } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('user_id', new_user_id)
      .single()

    if (nsErr || !newStudent) {
      return new Response(JSON.stringify({ success: false, error: 'New student not found' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Prevent self-referral
    if (referrer.user_id === new_user_id) {
      return new Response(JSON.stringify({ success: false, error: 'Cannot refer yourself' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if already referred
    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', newStudent.id)
      .limit(1)

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ success: false, error: 'Already referred' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const REWARD = 200

    // Create referral record
    await supabase.from('referrals').insert({
      referrer_id: referrer.id,
      referred_id: newStudent.id,
      referral_code: referral_code.toUpperCase().trim(),
      reward_amount: REWARD,
      status: 'paid',
    })

    // Update referred_by on new student
    await supabase.from('students').update({ referred_by: referral_code.toUpperCase().trim() }).eq('id', newStudent.id)

    // Credit referrer wallet
    const { data: referrerWallet } = await supabase
      .from('wallets')
      .select('id, balance, total_earned')
      .eq('user_id', referrer.user_id)
      .single()

    if (referrerWallet) {
      await supabase.from('wallets').update({
        balance: Number(referrerWallet.balance) + REWARD,
        total_earned: Number(referrerWallet.total_earned) + REWARD,
        last_updated: new Date().toISOString(),
      }).eq('id', referrerWallet.id)

      await supabase.from('wallet_transactions').insert({
        wallet_id: referrerWallet.id,
        user_id: referrer.user_id,
        type: 'credit',
        amount: REWARD,
        description: 'Referral reward — new student signed up',
        reference_id: newStudent.id,
      })
    }

    // Credit new student wallet
    const { data: newWallet } = await supabase
      .from('wallets')
      .select('id, balance, total_earned')
      .eq('user_id', new_user_id)
      .single()

    if (newWallet) {
      await supabase.from('wallets').update({
        balance: Number(newWallet.balance) + REWARD,
        total_earned: Number(newWallet.total_earned) + REWARD,
        last_updated: new Date().toISOString(),
      }).eq('id', newWallet.id)

      await supabase.from('wallet_transactions').insert({
        wallet_id: newWallet.id,
        user_id: new_user_id,
        type: 'credit',
        amount: REWARD,
        description: 'Welcome bonus — signed up with referral code',
        reference_id: referrer.id,
      })
    }

    // Update referrer credits on students table
    await supabase.rpc('increment_referral_credits' as any, { student_id: referrer.id, amount: REWARD }).catch(() => {
      // fallback: direct update
      supabase.from('students').update({
        referral_credits: Number(referrer.referral_code ? REWARD : 0),
      }).eq('id', referrer.id)
    })

    // Notify referrer
    await supabase.from('notifications').insert({
      user_id: referrer.user_id,
      title: 'Referral Reward! 🎉',
      body: `Someone signed up using your referral code! ₹${REWARD} has been added to your wallet.`,
      type: 'referral',
      action_url: '/student/wallet',
    })

    console.log(`✅ Referral processed: ${referral_code} → ₹${REWARD} each`)

    return new Response(JSON.stringify({ success: true, reward: REWARD }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('❌ Referral error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
