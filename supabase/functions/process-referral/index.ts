import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
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

    // Check 50 referral cap
    const { count: refCount } = await supabase
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', referrer.id)

    if ((refCount || 0) >= 50) {
      return new Response(JSON.stringify({ success: false, error: 'Referrer has reached the maximum of 50 referrals' }), {
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

    const REWARD = 400

    // Create referral record — status PENDING until first paid course ≥ ₹5000.
    // The DB enforces UNIQUE (referred_id) so a race condition between concurrent
    // requests will result in a constraint violation rather than a duplicate row.
    const { error: insertErr } = await supabase.from('referrals').insert({
      referrer_id: referrer.id,
      referred_id: newStudent.id,
      referral_code: referral_code.toUpperCase().trim(),
      reward_amount: REWARD,
      status: 'pending',
    })

    if (insertErr) {
      // Unique violation (23505) means a concurrent request already created the referral.
      if (insertErr.code === '23505') {
        return new Response(JSON.stringify({ success: false, error: 'Already referred' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw insertErr
    }

    // Update referred_by on new student
    await supabase.from('students').update({ referred_by: referral_code.toUpperCase().trim() }).eq('id', newStudent.id)

    // Notify referrer
    await supabase.from('notifications').insert({
      user_id: referrer.user_id,
      title: 'New Referral! 🎉',
      body: `Someone signed up using your referral code! You'll earn ₹${REWARD} when they complete their first paid course (₹5,000+).`,
      type: 'referral',
      action_url: '/student/referrals',
    })

    console.log(`✅ Student referral created: ${referral_code} (pending)`)

    return new Response(JSON.stringify({ success: true }), {
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
