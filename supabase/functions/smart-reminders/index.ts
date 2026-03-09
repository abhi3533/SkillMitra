import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

// Helper to send email via the send-email edge function
async function sendEmail(supabaseUrl: string, serviceKey: string, payload: { type: string; to: string; data: Record<string, any> }) {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error(`Email send failed for ${payload.type} → ${payload.to}:`, err)
    }
  } catch (e) {
    console.error(`Email send error for ${payload.type}:`, e)
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const now = new Date()
    const results: string[] = []

    // ============ SESSION REMINDERS ============
    
    // 24h reminders
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const in24hEnd = new Date(in24h.getTime() + 60 * 60 * 1000) // 1hr window
    const { data: sessions24h } = await supabase
      .from('course_sessions')
      .select('id, title, session_number, scheduled_at, meet_link, trainer_id, enrollment_id, enrollments(student_id, students(user_id), courses(title))')
      .eq('status', 'upcoming')
      .gte('scheduled_at', in24h.toISOString())
      .lt('scheduled_at', in24hEnd.toISOString())

    for (const s of sessions24h || []) {
      const enrollment = s.enrollments as any
      const studentUserId = enrollment?.students?.user_id
      const courseTitle = enrollment?.courses?.title || s.title || `Session #${s.session_number}`
      const time = new Date(s.scheduled_at!).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      
      const { data: trainer } = await supabase.from('trainers').select('user_id').eq('id', s.trainer_id).single()

      if (studentUserId) {
        const { data: existing } = await supabase.from('notifications').select('id').eq('user_id', studentUserId).eq('type', 'session_24h').eq('action_url', s.id).limit(1)
        if (!existing?.length) {
          await supabase.from('notifications').insert({
            user_id: studentUserId, type: 'session_24h',
            title: '📅 Session Tomorrow',
            body: `Your "${courseTitle}" session is scheduled for ${time}`,
            action_url: s.id, icon: 'calendar',
          })
          results.push(`24h notification → student ${studentUserId}`)
        }
      }

      if (trainer?.user_id) {
        const { data: existing } = await supabase.from('notifications').select('id').eq('user_id', trainer.user_id).eq('type', 'session_24h').eq('action_url', s.id).limit(1)
        if (!existing?.length) {
          await supabase.from('notifications').insert({
            user_id: trainer.user_id, type: 'session_24h',
            title: '📅 Session Tomorrow',
            body: `Your "${courseTitle}" session is scheduled for ${time}`,
            action_url: s.id, icon: 'calendar',
          })
          results.push(`24h notification → trainer ${trainer.user_id}`)
        }
      }
    }

    // 1h reminders
    const in1h = new Date(now.getTime() + 60 * 60 * 1000)
    const in1hEnd = new Date(in1h.getTime() + 60 * 60 * 1000)
    const { data: sessions1h } = await supabase
      .from('course_sessions')
      .select('id, title, session_number, scheduled_at, meet_link, trainer_id, enrollment_id, enrollments(student_id, students(user_id), courses(title))')
      .eq('status', 'upcoming')
      .gte('scheduled_at', in1h.toISOString())
      .lt('scheduled_at', in1hEnd.toISOString())

    for (const s of sessions1h || []) {
      const enrollment = s.enrollments as any
      const studentUserId = enrollment?.students?.user_id
      const courseTitle = enrollment?.courses?.title || s.title || `Session #${s.session_number}`
      const time = new Date(s.scheduled_at!).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      const { data: trainer } = await supabase.from('trainers').select('user_id').eq('id', s.trainer_id).single()

      for (const userId of [studentUserId, trainer?.user_id].filter(Boolean)) {
        const { data: existing } = await supabase.from('notifications').select('id').eq('user_id', userId!).eq('type', 'session_1h').eq('action_url', s.id).limit(1)
        if (!existing?.length) {
          await supabase.from('notifications').insert({
            user_id: userId!, type: 'session_1h',
            title: '⏰ Session in 1 Hour',
            body: `"${courseTitle}" starts in 1 hour. ${s.meet_link ? 'Click to join!' : ''}`,
            action_url: s.meet_link || s.id, icon: 'clock',
          })
          // Send email reminder
          const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', userId!).single()
          if (profile?.email) {
            await sendEmail(supabaseUrl, serviceKey, {
              type: 'session_reminder',
              to: profile.email,
              data: { name: profile.full_name || 'there', session_title: courseTitle, scheduled_time: time, meet_link: s.meet_link },
            })
          }
          results.push(`1h notification + email → ${userId}`)
        }
      }
    }

    // 10min reminders
    const in10m = new Date(now.getTime() + 10 * 60 * 1000)
    const in10mEnd = new Date(in10m.getTime() + 60 * 60 * 1000)
    const { data: sessions10m } = await supabase
      .from('course_sessions')
      .select('id, title, session_number, scheduled_at, meet_link, trainer_id, enrollment_id, enrollments(student_id, students(user_id), courses(title))')
      .eq('status', 'upcoming')
      .gte('scheduled_at', in10m.toISOString())
      .lt('scheduled_at', in10mEnd.toISOString())

    for (const s of sessions10m || []) {
      const enrollment = s.enrollments as any
      const studentUserId = enrollment?.students?.user_id
      const courseTitle = enrollment?.courses?.title || s.title || `Session #${s.session_number}`
      const { data: trainer } = await supabase.from('trainers').select('user_id').eq('id', s.trainer_id).single()

      for (const userId of [studentUserId, trainer?.user_id].filter(Boolean)) {
        const { data: existing } = await supabase.from('notifications').select('id').eq('user_id', userId!).eq('type', 'session_10m').eq('action_url', s.id).limit(1)
        if (!existing?.length) {
          await supabase.from('notifications').insert({
            user_id: userId!, type: 'session_10m',
            title: '🔔 Session in 10 Minutes!',
            body: `"${courseTitle}" starts in 10 minutes. Get ready to join!`,
            action_url: s.meet_link || s.id, icon: 'bell',
          })
          results.push(`10m notification → ${userId}`)
        }
      }
    }

    // ============ AUTO-COMPLETE SESSIONS ============
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const { data: expiredSessions } = await supabase
      .from('course_sessions')
      .select('id, title, session_number, trainer_id, enrollment_id, duration_mins, scheduled_at, enrollments(student_id, courses(title))')
      .eq('status', 'upcoming')
      .lt('scheduled_at', twoHoursAgo.toISOString())
      .gte('scheduled_at', oneDayAgo.toISOString())

    for (const s of expiredSessions || []) {
      // Mark session as completed
      await supabase.from('course_sessions').update({ status: 'completed' }).eq('id', s.id)

      // Update enrollment progress
      const enrollment = s.enrollments as any
      if (enrollment) {
        const { data: enrollData } = await supabase.from('enrollments')
          .select('sessions_completed, sessions_total')
          .eq('id', s.enrollment_id).single()
        
        if (enrollData) {
          const newCompleted = (enrollData.sessions_completed || 0) + 1
          const total = enrollData.sessions_total || 1
          const progress = Math.min(100, Math.round((newCompleted / total) * 100))
          await supabase.from('enrollments').update({
            sessions_completed: newCompleted,
            progress_percent: progress,
            last_session_date: now.toISOString(),
          }).eq('id', s.enrollment_id)
        }
      }

      results.push(`auto-completed session ${s.id}`)
    }

    // ============ MISSED SESSION CHECK ============
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const { data: missedSessions } = await supabase
      .from('course_sessions')
      .select('id, title, session_number, trainer_id, enrollment_id, enrollments(student_id, students(user_id), courses(title))')
      .eq('status', 'upcoming')
      .eq('joined_by_trainer', false)
      .gte('scheduled_at', twoHoursAgo.toISOString())
      .lt('scheduled_at', oneHourAgo.toISOString())

    for (const s of missedSessions || []) {
      const enrollment = s.enrollments as any
      const studentUserId = enrollment?.students?.user_id
      const courseTitle = enrollment?.courses?.title || s.title

      if (studentUserId) {
        const { data: existing } = await supabase.from('notifications').select('id').eq('user_id', studentUserId).eq('type', 'missed_session').eq('action_url', s.id).limit(1)
        if (!existing?.length) {
          await supabase.from('notifications').insert({
            user_id: studentUserId, type: 'missed_session',
            title: '⚠️ Trainer Missed Session',
            body: `Your trainer did not join the "${courseTitle}" session. We've been notified and will follow up.`,
            action_url: s.id, icon: 'alert-triangle',
          })
          results.push(`missed session notif → student ${studentUserId}`)
        }
      }

      const { data: admins } = await supabase.from('admins').select('user_id')
      for (const admin of admins || []) {
        const { data: existing } = await supabase.from('notifications').select('id').eq('user_id', admin.user_id).eq('type', 'missed_session').eq('action_url', s.id).limit(1)
        if (!existing?.length) {
          await supabase.from('notifications').insert({
            user_id: admin.user_id, type: 'missed_session',
            title: '🚨 Trainer No-Show',
            body: `Trainer missed "${courseTitle}" session. Requires follow-up.`,
            action_url: s.id, icon: 'alert-triangle',
          })
          results.push(`missed session notif → admin ${admin.user_id}`)
        }
      }
    }

    // ============ LOW ATTENDANCE WARNING ============
    const { data: allStudents } = await supabase.from('students').select('id, user_id')
    for (const student of allStudents || []) {
      const { data: attData } = await supabase.from('attendance').select('status').eq('student_id', student.id)
      const total = (attData || []).length
      if (total < 5) continue
      const present = (attData || []).filter(a => a.status === 'present').length
      const pct = Math.round((present / total) * 100)
      if (pct < 75) {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { data: existing } = await supabase.from('notifications').select('id').eq('user_id', student.user_id).eq('type', 'low_attendance').gte('created_at', weekAgo).limit(1)
        if (!existing?.length) {
          await supabase.from('notifications').insert({
            user_id: student.user_id, type: 'low_attendance',
            title: '📉 Low Attendance Warning',
            body: `Your attendance is at ${pct}%. Minimum 90% is required for certificate eligibility.`,
            icon: 'alert-circle',
          })
          results.push(`low attendance warning → ${student.user_id} (${pct}%)`)
        }
      }
    }

    // ============ PAYMENT DUE ============
    const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const in3dStr = in3d.toISOString().split('T')[0]
    const { data: expiringSubs } = await supabase
      .from('trainer_subscriptions')
      .select('trainer_id, plan, end_date, trainers(user_id)')
      .eq('status', 'active')
      .eq('end_date', in3dStr)

    for (const sub of expiringSubs || []) {
      const userId = (sub.trainers as any)?.user_id
      if (!userId) continue
      const { data: existing } = await supabase.from('notifications').select('id').eq('user_id', userId).eq('type', 'payment_due').eq('action_url', sub.trainer_id).limit(1)
      if (!existing?.length) {
        await supabase.from('notifications').insert({
          user_id: userId, type: 'payment_due',
          title: '💳 Subscription Expiring Soon',
          body: `Your ${sub.plan} plan expires on ${sub.end_date}. Renew to continue listing courses.`,
          action_url: sub.trainer_id, icon: 'credit-card',
        })
        results.push(`payment due → trainer ${userId}`)
      }
    }

    // ============ RATING PROMPT AFTER COMPLETION ============
    // Find recently completed sessions without ratings
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000)
    const { data: recentCompleted } = await supabase
      .from('course_sessions')
      .select('id, title, session_number, trainer_id, enrollment_id, enrollments(student_id, students(user_id), courses(title))')
      .eq('status', 'completed')
      .gte('scheduled_at', sixHoursAgo.toISOString())
      .lt('scheduled_at', twoHoursAgo.toISOString())

    for (const s of recentCompleted || []) {
      const enrollment = s.enrollments as any
      const studentUserId = enrollment?.students?.user_id
      const studentId = enrollment?.student_id
      const courseTitle = enrollment?.courses?.title || s.title || `Session #${s.session_number}`

      if (!studentUserId || !studentId) continue

      const { data: existingRating } = await supabase.from('ratings')
        .select('id').eq('session_id', s.id).eq('student_id', studentId)
        .not('student_rated_at', 'is', null).limit(1)
      if (existingRating?.length) continue

      const { data: existingNotif2 } = await supabase.from('notifications')
        .select('id').eq('user_id', studentUserId).eq('type', 'rate_session')
        .ilike('body', `%${s.id.slice(0, 8)}%`).limit(1)
      if (existingNotif2?.length) continue

      await supabase.from('notifications').insert({
        user_id: studentUserId, type: 'rate_session',
        title: '⭐ Rate Your Session',
        body: `How was your "${courseTitle}" session? Share your feedback to help other students. [${s.id.slice(0, 8)}]`,
        action_url: `/student/sessions`, icon: 'star',
      })
      results.push(`rate prompt → student ${studentUserId} for session ${s.id}`)
    }

    // ============ PENDING TRAINER APPLICATION 24H REMINDER ============
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const { data: stalePending } = await supabase
      .from('trainers')
      .select('id, user_id, skills, experience_years, created_at')
      .eq('approval_status', 'pending')
      .lt('created_at', twentyFourHoursAgo.toISOString())
      .gte('created_at', fortyEightHoursAgo.toISOString())

    for (const trainer of stalePending || []) {
      // Check if reminder already sent for this trainer
      const { data: existingReminder } = await supabase.from('notifications')
        .select('id').eq('type', 'pending_trainer_reminder').eq('action_url', trainer.id).limit(1)
      if (existingReminder?.length) continue

      // Get trainer profile
      const { data: profile } = await supabase.from('profiles')
        .select('full_name, email').eq('id', trainer.user_id).single()
      const trainerName = profile?.full_name || 'Unknown'

      // Send reminder to all admins
      const { data: admins } = await supabase.from('admins').select('user_id')
      for (const admin of admins || []) {
        await supabase.from('notifications').insert({
          user_id: admin.user_id, type: 'pending_trainer_reminder',
          title: '⏰ Pending Review Reminder',
          body: `Reminder — ${trainerName}'s application is still pending review (applied ${new Date(trainer.created_at!).toLocaleDateString('en-IN')}).`,
          action_url: trainer.id, icon: 'clock',
        })
      }

      // Send reminder email to admin
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
      if (RESEND_API_KEY) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'SkillMitra <contact@skillmitra.online>',
              to: ['contact@skillmitra.online'],
              subject: `Reminder — ${trainerName}'s application is still pending review`,
              html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #111;">⏰ Pending Trainer Review</h2>
                <p style="color: #444; line-height: 1.7;"><strong>${trainerName}</strong>'s trainer application has been pending for over 24 hours.</p>
                <p style="color: #444;">Applied: ${new Date(trainer.created_at!).toLocaleString('en-IN')}</p>
                <p style="color: #444;">Skills: ${(trainer.skills || []).join(', ') || 'N/A'}</p>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="https://skillmitra.online/admin/trainers" style="background: #1A56DB; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Review Now</a>
                </div>
              </div>`,
            }),
          })
        } catch (e) {
          console.error('Reminder email failed:', e)
        }
      }

      results.push(`24h pending reminder → trainer ${trainerName}`)
    }

    console.log(`✅ Smart reminders processed: ${results.length} actions`, results)
    return new Response(JSON.stringify({ success: true, actions: results.length, details: results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('❌ Smart reminders error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
