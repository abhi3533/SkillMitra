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
    if (!referral_code || !new_user_id) throw new Error('referral_code and new_user_id required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

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

    // Check duplicate
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

    // Create referral (status pending — paid when referred trainer completes first paid session)
    await supabase.from('trainer_referrals').insert({
      referrer_id: referrer.id,
      referred_id: newTrainer.id,
      referral_code: referral_code.toUpperCase().trim(),
      reward_amount: 500,
      status: 'pending',
    })

    // Update referred_by
    await supabase.from('trainers').update({ referred_by: referral_code.toUpperCase().trim() }).eq('id', newTrainer.id)

    // Notify referrer
    await supabase.from('notifications').insert({
      user_id: referrer.user_id,
      title: 'New Trainer Referral! 🎯',
      body: `A trainer signed up using your referral code! You'll earn ₹500 when they complete their first paid session.`,
      type: 'referral',
      action_url: '/trainer/referrals',
    })

    console.log(`✅ Trainer referral created: ${referral_code} (pending)`)

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
