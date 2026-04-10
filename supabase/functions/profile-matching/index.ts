import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts"

// Check if we already sent a match email to this recipient today
async function canSendEmail(supabase: any, email: string, emailType: string): Promise<boolean> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('match_email_log')
    .select('id')
    .eq('recipient_email', email)
    .eq('email_type', emailType)
    .gte('sent_at', oneDayAgo)
    .limit(1)
  return !data || data.length === 0
}

// Log that we sent an email
async function logEmailSent(supabase: any, email: string, emailType: string) {
  await supabase.from('match_email_log').insert({ recipient_email: email, email_type: emailType })
}

// Check if user has match emails enabled
async function isMatchEmailEnabled(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('email_preferences')
    .select('match_emails_enabled')
    .eq('user_id', userId)
    .single()
  // Default to enabled if no preference row exists
  return data?.match_emails_enabled !== false
}

// Enhanced scoring function with all 5 criteria
function scoreTrainerForStudent(
  trainer: any, 
  trainerProfile: any, 
  studentProfile: any, 
  student: any,
  trainerCourses: any[]
): { score: number; matchedSkills: string[]; matchedLangs: string[] } {
  let score = 0
  const matchedSkills: string[] = []
  const matchedLangs: string[] = []

  // 1. Skill/subject match (MOST IMPORTANT - weight: 5)
  if (student?.course_interests?.length && trainer.skills?.length) {
    const skillOverlap = student.course_interests.filter((interest: string) =>
      trainer.skills!.some((skill: string) => skill.toLowerCase() === interest.toLowerCase())
    )
    score += skillOverlap.length * 5
    matchedSkills.push(...skillOverlap)
  }

  // 2. Language preference match (weight: 4)
  if (studentProfile.language_preference?.length && trainer.teaching_languages?.length) {
    const langOverlap = studentProfile.language_preference.filter((l: string) =>
      trainer.teaching_languages!.includes(l)
    )
    score += langOverlap.length * 4
    matchedLangs.push(...langOverlap)
  }

  // 3. Budget range match (weight: 3) - check if trainer has courses within student's expected range
  if (trainerCourses.length > 0) {
    const minFee = Math.min(...trainerCourses.map((c: any) => c.course_fee || 0))
    const hasFreeTrial = trainerCourses.some((c: any) => c.has_free_trial)
    // Affordable trainers score higher; free trial is a bonus
    if (hasFreeTrial) score += 3
    if (minFee <= 5000) score += 2
    else if (minFee <= 10000) score += 1
  }

  // 4. Availability timing - city/timezone proximity as proxy (weight: 2)
  if (studentProfile.city && trainerProfile?.city && 
      studentProfile.city.toLowerCase() === trainerProfile.city.toLowerCase()) {
    score += 3 // Same city = likely same timezone + can meet offline
  }
  if (studentProfile.state && trainerProfile?.state && studentProfile.state === trainerProfile.state) {
    score += 1
  }

  // 5. Experience level (weight: 2)
  if (trainer.experience_years) {
    if (trainer.experience_years >= 5) score += 3
    else if (trainer.experience_years >= 3) score += 2
    else if (trainer.experience_years >= 1) score += 1
  }

  // Bonus: Gender preference match
  if (student?.trainer_gender_preference && student.trainer_gender_preference !== 'no_preference') {
    if (trainerProfile?.gender && trainerProfile.gender.toLowerCase() === student.trainer_gender_preference.toLowerCase()) {
      score += 2
    }
  }

  // Bonus: High rating
  if (trainer.average_rating && trainer.average_rating >= 4) {
    score += 2
  }

  return { score, matchedSkills, matchedLangs }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, city, state, language_preference, gender')
        .eq('id', new_user_id)
        .single()

      if (!profile?.email) throw new Error('Student profile not found')

      // Check if student wants match emails
      if (!(await isMatchEmailEnabled(supabase, new_user_id))) {
        return new Response(JSON.stringify({ success: true, message: 'Student has match emails disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: student } = await supabase
        .from('students')
        .select('id, trainer_gender_preference, skills_learning, course_interests')
        .eq('user_id', new_user_id)
        .single()

      // Get approved trainers with more data
      const { data: matchedTrainers } = await supabase
        .from('trainers')
        .select('id, user_id, skills, teaching_languages, average_rating, current_role, current_company, experience_years, course_fee')
        .eq('approval_status', 'approved')
        .limit(20)
        .order('boost_score', { ascending: false })

      if (!matchedTrainers || matchedTrainers.length === 0) {
        return new Response(JSON.stringify({ success: true, message: 'No matching trainers found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Exclude trainers where student already has enrollment
      const { data: existingEnrollments } = await supabase
        .from('enrollments')
        .select('trainer_id')
        .eq('student_id', student?.id)
        .in('status', ['active', 'trial', 'completed'])

      const enrolledTrainerIds = new Set((existingEnrollments || []).map(e => e.trainer_id))

      // Fetch trainer profiles and courses in bulk
      const trainerUserIds = matchedTrainers.map(t => t.user_id)
      const trainerIds = matchedTrainers.map(t => t.id)

      const [{ data: trainerProfiles }, { data: trainerCourses }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, city, state, gender, profile_picture_url').in('id', trainerUserIds),
        supabase.from('courses').select('trainer_id, course_fee, has_free_trial').in('trainer_id', trainerIds).eq('approval_status', 'approved')
      ])

      const profileMap: Record<string, any> = {}
      ;(trainerProfiles || []).forEach(p => { profileMap[p.id] = p })

      const courseMap: Record<string, any[]> = {}
      ;(trainerCourses || []).forEach(c => {
        if (!courseMap[c.trainer_id]) courseMap[c.trainer_id] = []
        courseMap[c.trainer_id].push(c)
      })

      // Score and rank
      const scoredTrainers = matchedTrainers
        .filter(t => !enrolledTrainerIds.has(t.id))
        .map(trainer => {
          const tProfile = profileMap[trainer.user_id]
          const courses = courseMap[trainer.id] || []
          const { score, matchedSkills, matchedLangs } = scoreTrainerForStudent(
            trainer, tProfile, profile, student, courses
          )
          return { ...trainer, profile: tProfile, score, matchedSkills, matchedLangs }
        })
        .filter(t => t.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)

      if (scoredTrainers.length === 0) {
        return new Response(JSON.stringify({ success: true, message: 'No matching trainers' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Rate limit check: only 1 match email per day to same student
      if (await canSendEmail(supabase, profile.email, 'student_trainer_match')) {
        // Build trainer cards HTML
        const trainerCardsHtml = scoredTrainers.map(t => {
          const name = t.profile?.full_name || 'Trainer'
          const trainerRole = t.current_role || 'Expert Trainer'
          const company = t.current_company ? ` at ${t.current_company}` : ''
          const rating = t.average_rating ? `⭐ ${t.average_rating.toFixed(1)}` : ''
          const skills = t.matchedSkills?.slice(0, 3).join(', ') || t.skills?.slice(0, 3).join(', ') || ''
          const exp = t.experience_years ? `${t.experience_years}+ yrs exp` : ''
          const langs = t.matchedLangs?.slice(0, 2).join(', ') || t.teaching_languages?.slice(0, 2).join(', ') || ''
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
            type: 'student_trainer_match',
            to: profile.email,
            data: {
              name: profile.full_name,
              trainer_cards_html: trainerCardsHtml,
              trainer_count: scoredTrainers.length,
            },
          }),
        })

        await logEmailSent(supabase, profile.email, 'student_trainer_match')
      }

      // Send email to each matched trainer (with rate limit)
      for (const trainer of scoredTrainers) {
        if (!trainer.profile?.email) continue
        if (!(await isMatchEmailEnabled(supabase, trainer.user_id))) continue
        if (!(await canSendEmail(supabase, trainer.profile.email, 'trainer_student_match'))) continue

        const matchReasons: string[] = []
        if (trainer.matchedSkills.length) matchReasons.push(`Interested in ${trainer.matchedSkills.join(', ')}`)
        if (trainer.matchedLangs.length) matchReasons.push(`Speaks ${trainer.matchedLangs.join(', ')}`)
        if (profile.city && trainer.profile.city && profile.city.toLowerCase() === trainer.profile.city.toLowerCase()) {
          matchReasons.push(`Same city (${profile.city})`)
        }

        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            type: 'trainer_student_match',
            to: trainer.profile.email,
            data: {
              trainer_name: trainer.profile.full_name,
              student_name: profile.full_name,
              student_city: profile.city,
              student_state: profile.state,
              match_reasons: matchReasons,
              matched_skills: trainer.matchedSkills,
              matched_languages: trainer.matchedLangs,
            },
          }),
        })

        await logEmailSent(supabase, trainer.profile.email, 'trainer_student_match')
      }

      // In-app notifications (always)
      await supabase.from('notifications').insert({
        user_id: new_user_id,
        title: '🎯 Trainers matched for you!',
        body: `We found ${scoredTrainers.length} trainer(s) who match your preferences. Check your email!`,
        type: 'profile_match',
        action_url: '/browse-trainers',
      })

      for (const trainer of scoredTrainers) {
        await supabase.from('notifications').insert({
          user_id: trainer.user_id,
          title: '🆕 New student match!',
          body: `${profile.full_name || 'A new student'} from ${profile.city || profile.state || 'your area'} just joined and matches your profile.`,
          type: 'profile_match',
          action_url: '/trainer/students',
        })
      }

    } else if (role === 'trainer') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, city, state, gender')
        .eq('id', new_user_id)
        .single()

      if (!profile) throw new Error('Trainer profile not found')

      const { data: trainer } = await supabase
        .from('trainers')
        .select('id, skills, teaching_languages, current_role, current_company, experience_years')
        .eq('user_id', new_user_id)
        .single()

      if (!trainer?.skills?.length) {
        return new Response(JSON.stringify({ success: true, message: 'Trainer has no skills set' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Get trainer's courses for budget matching
      const { data: trainerCourses } = await supabase
        .from('courses')
        .select('course_fee, has_free_trial')
        .eq('trainer_id', trainer.id)
        .eq('approval_status', 'approved')

      const { data: allStudents } = await supabase
        .from('students')
        .select('id, user_id, course_interests, trainer_gender_preference')
        .not('course_interests', 'is', null)
        .limit(50)

      if (!allStudents || allStudents.length === 0) {
        return new Response(JSON.stringify({ success: true, message: 'No students with interests found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: existingEnrollments } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('trainer_id', trainer.id)
        .in('status', ['active', 'trial', 'completed'])

      const enrolledStudentIds = new Set((existingEnrollments || []).map(e => e.student_id))

      // Score students using enhanced criteria
      const studentUserIds = allStudents.filter(s => !enrolledStudentIds.has(s.id)).map(s => s.user_id)
      
      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, city, state, language_preference, gender')
        .in('id', studentUserIds)

      const sProfileMap: Record<string, any> = {}
      ;(studentProfiles || []).forEach(p => { sProfileMap[p.id] = p })

      const matchedStudents = allStudents
        .filter(s => !enrolledStudentIds.has(s.id))
        .map(s => {
          const sProfile = sProfileMap[s.user_id]
          if (!sProfile) return null
          
          // Use reverse scoring - how well does this trainer match the student
          const trainerObj = { ...trainer, teaching_languages: trainer.teaching_languages }
          const trainerProfileObj = { ...profile }
          const { score, matchedSkills, matchedLangs } = scoreTrainerForStudent(
            trainerObj, trainerProfileObj, sProfile, s, trainerCourses || []
          )
          return { ...s, profile: sProfile, matchedSkills, matchedLangs, score }
        })
        .filter((s): s is NonNullable<typeof s> => s !== null && s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)

      if (matchedStudents.length === 0) {
        return new Response(JSON.stringify({ success: true, message: 'No matching students' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Send emails to matched students (rate limited)
      for (const student of matchedStudents) {
        if (!student.profile?.email) continue
        if (!(await isMatchEmailEnabled(supabase, student.user_id))) continue
        if (!(await canSendEmail(supabase, student.profile.email, 'student_new_trainer_match'))) continue

        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            type: 'student_new_trainer_match',
            to: student.profile.email,
            data: {
              name: student.profile.full_name,
              trainer_name: profile.full_name,
              trainer_role: trainer.current_role,
              trainer_company: trainer.current_company,
              trainer_experience: trainer.experience_years,
              matched_skills: student.matchedSkills,
              matched_languages: student.matchedLangs,
            },
          }),
        })

        await logEmailSent(supabase, student.profile.email, 'student_new_trainer_match')

        await supabase.from('notifications').insert({
          user_id: student.user_id,
          title: '🎓 New trainer matches your interests!',
          body: `${profile.full_name || 'A new trainer'} just joined with skills in ${student.matchedSkills.slice(0, 2).join(', ')}${student.matchedSkills.length > 2 ? ' and more' : ''}.`,
          type: 'profile_match',
          action_url: '/browse-trainers',
        })
      }

      await supabase.from('notifications').insert({
        user_id: new_user_id,
        title: '🎯 Students interested in your skills!',
        body: `${matchedStudents.length} student(s) are looking for training in skills you offer. Create courses to attract them!`,
        type: 'profile_match',
        action_url: '/trainer/courses',
      })
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
