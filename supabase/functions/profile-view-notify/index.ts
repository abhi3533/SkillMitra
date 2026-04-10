import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { trainer_user_id, viewer_city } = await req.json()
    if (!trainer_user_id) throw new Error('trainer_user_id is required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

    // Get trainer's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', trainer_user_id)
      .single()

    if (!profile?.email) {
      return new Response(JSON.stringify({ success: true, message: 'Trainer profile not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Rate-limit: check if we already sent a profile view email to this trainer in the last 24 hours
    const { data: recentNotifs } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', trainer_user_id)
      .eq('type', 'profile_view')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1)

    if (recentNotifs && recentNotifs.length > 0) {
      return new Response(JSON.stringify({ success: true, message: 'Already notified recently' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send email
    await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        type: 'trainer_profile_viewed',
        to: profile.email,
        data: {
          trainer_name: profile.full_name,
          student_city: viewer_city || '',
        },
      }),
    })

    // In-app notification
    await supabase.from('notifications').insert({
      user_id: trainer_user_id,
      title: '👀 Someone viewed your profile!',
      body: `A student${viewer_city ? ` from ${viewer_city}` : ''} just viewed your trainer profile. Keep your availability updated!`,
      type: 'profile_view',
      action_url: '/trainer/my-profile',
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('❌ Profile view notify error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
