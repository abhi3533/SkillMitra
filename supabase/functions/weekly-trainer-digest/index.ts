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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

    // Get all students with course interests
    const { data: students } = await supabase
      .from('students')
      .select('id, user_id, course_interests, trainer_gender_preference')
      .not('course_interests', 'is', null)

    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No students with interests' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get all approved trainers
    const { data: trainers } = await supabase
      .from('trainers')
      .select('id, user_id, skills, teaching_languages, average_rating, current_role, current_company, experience_years')
      .eq('approval_status', 'approved')
      .order('boost_score', { ascending: false })

    if (!trainers || trainers.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No approved trainers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch all trainer profiles in bulk
    const trainerUserIds = trainers.map(t => t.user_id)
    const { data: trainerProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, city, state, gender, profile_picture_url')
      .in('id', trainerUserIds)

    const trainerProfileMap: Record<string, any> = {}
    ;(trainerProfiles || []).forEach(p => { trainerProfileMap[p.id] = p })

    // Get all active enrollments to exclude already-enrolled pairs
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id, trainer_id')
      .in('status', ['active', 'trial', 'completed'])

    const enrollmentSet = new Set(
      (enrollments || []).map(e => `${e.student_id}:${e.trainer_id}`)
    )

    let emailsSent = 0

    for (const student of students) {
      const interests = (student.course_interests as string[]) || []
      if (interests.length === 0) continue

      // Get student profile
      const { data: sProfile } = await supabase
        .from('profiles')
        .select('full_name, email, city, state, language_preference, gender')
        .eq('id', student.user_id)
        .single()

      if (!sProfile?.email) continue

      // Score trainers for this student
      const scored = trainers
        .filter(t => !enrollmentSet.has(`${student.id}:${t.id}`))
        .map(t => {
          let score = 0
          const tProfile = trainerProfileMap[t.user_id]

          // Skill/interest overlap (strongest signal)
          if (t.skills?.length) {
            const overlap = interests.filter((i: string) =>
              t.skills!.some((sk: string) => sk.toLowerCase() === i.toLowerCase())
            )
            score += overlap.length * 4
          }

          // Language match
          if (sProfile.language_preference?.length && t.teaching_languages?.length) {
            const langOverlap = sProfile.language_preference.filter((l: string) =>
              t.teaching_languages!.includes(l)
            )
            score += langOverlap.length * 3
          }

          // City match
          if (sProfile.city && tProfile?.city && sProfile.city.toLowerCase() === tProfile.city.toLowerCase()) {
            score += 5
          }

          // Gender preference
          if (student.trainer_gender_preference && student.trainer_gender_preference !== 'no_preference') {
            if (tProfile?.gender?.toLowerCase() === student.trainer_gender_preference.toLowerCase()) {
              score += 4
            }
          }

          // Rating bonus
          if (t.average_rating && t.average_rating >= 4) {
            score += 2
          }

          return { ...t, profile: tProfile, score }
        })
        .filter(t => t.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)

      if (scored.length === 0) continue

      // Build trainer cards HTML
      const trainerCardsHtml = scored.map(t => {
        const name = t.profile?.full_name || 'Trainer'
        const role = t.current_role || 'Expert Trainer'
        const company = t.current_company ? ` at ${t.current_company}` : ''
        const rating = t.average_rating ? `⭐ ${t.average_rating.toFixed(1)}` : ''
        const skills = t.skills?.slice(0, 3).join(', ') || ''
        const exp = t.experience_years ? `${t.experience_years}+ yrs exp` : ''
        const langs = t.teaching_languages?.slice(0, 2).join(', ') || ''

        return `
          <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-bottom: 12px; background: #f9fafb;">
            <p style="font-size: 16px; font-weight: 600; color: #111; margin: 0;">${name}</p>
            <p style="font-size: 13px; color: #666; margin: 2px 0 0;">${role}${company}</p>
            <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
              ${rating ? `<span style="font-size: 12px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px;">${rating}</span>` : ''}
              ${exp ? `<span style="font-size: 12px; background: #eff6ff; color: #1e40af; padding: 2px 8px; border-radius: 12px;">${exp}</span>` : ''}
              ${langs ? `<span style="font-size: 12px; background: #f0fdf4; color: #166534; padding: 2px 8px; border-radius: 12px;">🗣️ ${langs}</span>` : ''}
            </div>
            ${skills ? `<p style="font-size: 13px; color: #444; margin: 8px 0 0;">Skills: ${skills}</p>` : ''}
          </div>`
      }).join('')

      // Send weekly digest email
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: 'weekly_trainer_digest',
          to: sProfile.email,
          data: {
            name: sProfile.full_name,
            trainer_cards_html: trainerCardsHtml,
          },
        }),
      })

      emailsSent++

      // Small delay to avoid rate limits
      if (emailsSent % 10 === 0) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    console.log(`✅ Weekly digest sent to ${emailsSent} students`)

    return new Response(JSON.stringify({ success: true, emails_sent: emailsSent }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('❌ Weekly digest error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
