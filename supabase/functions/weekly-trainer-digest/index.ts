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

    // Get students with course interests
    const { data: students } = await supabase
      .from('students')
      .select('id, user_id, course_interests, trainer_gender_preference')
      .not('course_interests', 'is', null)

    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No students with interests' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get approved trainers
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

    // Bulk fetch trainer profiles and courses
    const trainerUserIds = trainers.map(t => t.user_id)
    const trainerIds = trainers.map(t => t.id)

    const [{ data: trainerProfiles }, { data: trainerCourses }, { data: enrollments }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, city, state, gender, profile_picture_url').in('id', trainerUserIds),
      supabase.from('courses').select('trainer_id, course_fee, has_free_trial').in('trainer_id', trainerIds).eq('approval_status', 'approved'),
      supabase.from('enrollments').select('student_id, trainer_id').in('status', ['active', 'trial', 'completed'])
    ])

    const tProfileMap: Record<string, any> = {}
    ;(trainerProfiles || []).forEach(p => { tProfileMap[p.id] = p })

    const courseMap: Record<string, any[]> = {}
    ;(trainerCourses || []).forEach(c => {
      if (!courseMap[c.trainer_id]) courseMap[c.trainer_id] = []
      courseMap[c.trainer_id].push(c)
    })

    const enrollmentSet = new Set(
      (enrollments || []).map(e => `${e.student_id}:${e.trainer_id}`)
    )

    let emailsSent = 0

    for (const student of students) {
      const interests = (student.course_interests as string[]) || []
      if (interests.length === 0) continue

      // Check email preferences
      const { data: prefs } = await supabase
        .from('email_preferences')
        .select('digest_emails_enabled')
        .eq('user_id', student.user_id)
        .single()

      if (prefs?.digest_emails_enabled === false) continue

      const { data: sProfile } = await supabase
        .from('profiles')
        .select('full_name, email, city, state, language_preference, gender')
        .eq('id', student.user_id)
        .single()

      if (!sProfile?.email) continue

      // Score trainers with enhanced criteria
      const scored = trainers
        .filter(t => !enrollmentSet.has(`${student.id}:${t.id}`))
        .map(t => {
          let score = 0
          const tProfile = tProfileMap[t.user_id]
          const courses = courseMap[t.id] || []

          // 1. Skill match (weight: 5)
          const skillOverlap = interests.filter((i: string) =>
            t.skills?.some((sk: string) => sk.toLowerCase() === i.toLowerCase())
          )
          score += skillOverlap.length * 5

          // 2. Language match (weight: 4)
          if (sProfile.language_preference?.length && t.teaching_languages?.length) {
            const langOverlap = sProfile.language_preference.filter((l: string) =>
              t.teaching_languages!.includes(l)
            )
            score += langOverlap.length * 4
          }

          // 3. Budget - affordable courses (weight: 3)
          if (courses.length > 0) {
            const minFee = Math.min(...courses.map((c: any) => c.course_fee || 0))
            if (courses.some((c: any) => c.has_free_trial)) score += 3
            if (minFee <= 5000) score += 2
            else if (minFee <= 10000) score += 1
          }

          // 4. Location proximity (weight: 2)
          if (sProfile.city && tProfile?.city && sProfile.city.toLowerCase() === tProfile.city.toLowerCase()) {
            score += 3
          }

          // 5. Experience (weight: 2)
          if (t.experience_years) {
            if (t.experience_years >= 5) score += 3
            else if (t.experience_years >= 3) score += 2
            else score += 1
          }

          // Gender preference
          if (student.trainer_gender_preference && student.trainer_gender_preference !== 'no_preference') {
            if (tProfile?.gender?.toLowerCase() === student.trainer_gender_preference.toLowerCase()) score += 2
          }

          // Rating bonus
          if (t.average_rating && t.average_rating >= 4) score += 2

          return { ...t, profile: tProfile, score, matchedSkills: skillOverlap }
        })
        .filter(t => t.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)

      if (scored.length === 0) continue

      const trainerCardsHtml = scored.map(t => {
        const name = t.profile?.full_name || 'Trainer'
        const trainerRole = t.current_role || 'Expert Trainer'
        const company = t.current_company ? ` at ${t.current_company}` : ''
        const rating = t.average_rating ? `⭐ ${t.average_rating.toFixed(1)}` : ''
        const skills = t.matchedSkills?.slice(0, 3).join(', ') || t.skills?.slice(0, 3).join(', ') || ''
        const exp = t.experience_years ? `${t.experience_years}+ yrs exp` : ''
        const langs = t.teaching_languages?.slice(0, 2).join(', ') || ''
        const courses = courseMap[t.id] || []
        const minFee = courses.length > 0 ? Math.min(...courses.map((c: any) => c.course_fee || 0)) : null
        const priceTag = minFee !== null ? `₹${minFee.toLocaleString('en-IN')}` : ''

        return `
          <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-bottom: 12px; background: #f9fafb;">
            <p style="font-size: 16px; font-weight: 600; color: #111; margin: 0;">${name}</p>
            <p style="font-size: 13px; color: #666; margin: 2px 0 0;">${trainerRole}${company}</p>
            <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
              ${rating ? `<span style="font-size: 12px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px;">${rating}</span>` : ''}
              ${exp ? `<span style="font-size: 12px; background: #eff6ff; color: #1e40af; padding: 2px 8px; border-radius: 12px;">${exp}</span>` : ''}
              ${langs ? `<span style="font-size: 12px; background: #f0fdf4; color: #166534; padding: 2px 8px; border-radius: 12px;">🗣️ ${langs}</span>` : ''}
              ${priceTag ? `<span style="font-size: 12px; background: #faf5ff; color: #7c3aed; padding: 2px 8px; border-radius: 12px;">💰 From ${priceTag}</span>` : ''}
            </div>
            ${skills ? `<p style="font-size: 13px; color: #444; margin: 8px 0 0;">Skills: ${skills}</p>` : ''}
          </div>`
      }).join('')

      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: 'weekly_trainer_digest',
          to: sProfile.email,
          data: { name: sProfile.full_name, trainer_cards_html: trainerCardsHtml },
        }),
      })

      emailsSent++
      if (emailsSent % 10 === 0) await new Promise(r => setTimeout(r, 1000))
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
