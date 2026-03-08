import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { new_user_id, role } = await req.json()
    if (!new_user_id) throw new Error('new_user_id is required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

    if (role === 'student') {
      // Get student's profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, city, state, language_preference, gender')
        .eq('id', new_user_id)
        .single()

      if (!profile?.email) throw new Error('Student profile not found')

      const { data: student } = await supabase
        .from('students')
        .select('trainer_gender_preference, skills_learning, course_interests')
        .eq('user_id', new_user_id)
        .single()

      // Find matching trainers: approved, matching language/city/gender pref
      let trainerQuery = supabase
        .from('trainers')
        .select('id, user_id, skills, teaching_languages, average_rating, current_role, current_company, experience_years')
        .eq('approval_status', 'approved')
        .limit(5)
        .order('boost_score', { ascending: false })

      const { data: matchedTrainers } = await trainerQuery

      if (!matchedTrainers || matchedTrainers.length === 0) {
        return new Response(JSON.stringify({ success: true, message: 'No matching trainers found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Score trainers by match quality
      const scoredTrainers = await Promise.all(matchedTrainers.map(async (trainer) => {
        let score = 0
        const { data: tProfile } = await supabase
          .from('profiles')
          .select('full_name, email, city, state, gender, profile_picture_url')
          .eq('id', trainer.user_id)
          .single()

        // Language match
        if (profile.language_preference?.length && trainer.teaching_languages?.length) {
          const overlap = profile.language_preference.filter((l: string) =>
            trainer.teaching_languages!.includes(l)
          )
          score += overlap.length * 3
        }

        // City match
        if (profile.city && tProfile?.city && profile.city.toLowerCase() === tProfile.city.toLowerCase()) {
          score += 5
        }

        // State match
        if (profile.state && tProfile?.state && profile.state === tProfile.state) {
          score += 2
        }

        // Gender preference match
        if (student?.trainer_gender_preference && student.trainer_gender_preference !== 'no_preference') {
          if (tProfile?.gender && tProfile.gender.toLowerCase() === student.trainer_gender_preference.toLowerCase()) {
            score += 4
          }
        }

        // Rating bonus
        if (trainer.average_rating && trainer.average_rating >= 4) {
          score += 2
        }

        return { ...trainer, profile: tProfile, score }
      }))

      // Sort by score and take top 3
      const topTrainers = scoredTrainers
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)

      // Build trainer cards HTML for student email
      const trainerCardsHtml = topTrainers.map(t => {
        const name = t.profile?.full_name || 'Trainer'
        const role = t.current_role || 'Expert Trainer'
        const company = t.current_company ? ` at ${t.current_company}` : ''
        const rating = t.average_rating ? `⭐ ${t.average_rating.toFixed(1)}` : ''
        const skills = t.skills?.slice(0, 3).join(', ') || ''
        const exp = t.experience_years ? `${t.experience_years}+ yrs exp` : ''
        const langs = t.teaching_languages?.slice(0, 2).join(', ') || ''

        return `
          <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-bottom: 12px; background: #f9fafb;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div>
                <p style="font-size: 16px; font-weight: 600; color: #111; margin: 0;">${name}</p>
                <p style="font-size: 13px; color: #666; margin: 2px 0 0;">${role}${company}</p>
              </div>
            </div>
            <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
              ${rating ? `<span style="font-size: 12px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px;">${rating}</span>` : ''}
              ${exp ? `<span style="font-size: 12px; background: #eff6ff; color: #1e40af; padding: 2px 8px; border-radius: 12px;">${exp}</span>` : ''}
              ${langs ? `<span style="font-size: 12px; background: #f0fdf4; color: #166534; padding: 2px 8px; border-radius: 12px;">🗣️ ${langs}</span>` : ''}
            </div>
            ${skills ? `<p style="font-size: 13px; color: #444; margin: 8px 0 0;">Skills: ${skills}</p>` : ''}
          </div>`
      }).join('')

      // Send email to student with matched trainers
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: 'student_trainer_match',
          to: profile.email,
          data: {
            name: profile.full_name,
            trainer_cards_html: trainerCardsHtml,
            trainer_count: topTrainers.length,
          },
        }),
      })

      // Send email to each matched trainer about new student
      for (const trainer of topTrainers) {
        if (trainer.profile?.email) {
          const matchReasons: string[] = []
          if (profile.city && trainer.profile.city && profile.city.toLowerCase() === trainer.profile.city.toLowerCase()) {
            matchReasons.push(`Same city (${profile.city})`)
          }
          if (profile.language_preference?.length && trainer.teaching_languages?.length) {
            const overlap = profile.language_preference.filter((l: string) =>
              trainer.teaching_languages!.includes(l)
            )
            if (overlap.length) matchReasons.push(`Speaks ${overlap.join(', ')}`)
          }

          await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              type: 'trainer_student_match',
              to: trainer.profile.email,
              data: {
                trainer_name: trainer.profile.full_name,
                student_name: profile.full_name,
                student_city: profile.city,
                student_state: profile.state,
                match_reasons: matchReasons,
              },
            }),
          })
        }
      }

      // Create in-app notifications
      await supabase.from('notifications').insert({
        user_id: new_user_id,
        title: '🎯 Trainers matched for you!',
        body: `We found ${topTrainers.length} trainer(s) who match your preferences. Check your email!`,
        type: 'profile_match',
        action_url: '/browse-trainers',
      })

      for (const trainer of topTrainers) {
        await supabase.from('notifications').insert({
          user_id: trainer.user_id,
          title: '🆕 New student match!',
          body: `${profile.full_name || 'A new student'} from ${profile.city || profile.state || 'your area'} just joined and matches your profile.`,
          type: 'profile_match',
          action_url: '/trainer/students',
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('❌ Profile matching error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
