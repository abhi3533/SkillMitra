import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      
      // Get trainer user_id
      const { data: trainer } = await supabase.from('trainers').select('user_id').eq('id', s.trainer_id).single()

      // Check preferences & notify student
      if (studentUserId) {
        const { data: pref } = await supabase.from('notification_preferences').select('session_24h_inapp, session_24h_email').eq('user_id', studentUserId).single()
        const sendInApp = pref?.session_24h_inapp !== false
        const sendEmail = pref?.session_24h_email !== false

        if (sendInApp) {
          // Check if already notified
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

        if (sendEmail) {
          const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', studentUserId).single()
          if (profile?.email) {
            await supabase.functions.invoke('send-email', {
              body: { type: 'session_reminder', to: profile.email, data: { name: profile.full_name, session_title: courseTitle, scheduled_time: time, meet_link: s.meet_link } },
            }).catch(() => {})
          }
        }
      }

      // Notify trainer
      if (trainer?.user_id) {
        const { data: pref } = await supabase.from('notification_preferences').select('session_24h_inapp').eq('user_id', trainer.user_id).single()
        if (pref?.session_24h_inapp !== false) {
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
          results.push(`1h notification → ${userId}`)
        }
      }
    }

    // 15min reminders
    const in15m = new Date(now.getTime() + 15 * 60 * 1000)
    const in15mEnd = new Date(in15m.getTime() + 60 * 60 * 1000)
    const { data: sessions15m } = await supabase
      .from('course_sessions')
      .select('id, title, session_number, scheduled_at, meet_link, trainer_id, enrollment_id, enrollments(student_id, students(user_id), courses(title))')
      .eq('status', 'upcoming')
      .gte('scheduled_at', in15m.toISOString())
      .lt('scheduled_at', in15mEnd.toISOString())

    for (const s of sessions15m || []) {
      const enrollment = s.enrollments as any
      const studentUserId = enrollment?.students?.user_id
      const courseTitle = enrollment?.courses?.title || s.title || `Session #${s.session_number}`
      const { data: trainer } = await supabase.from('trainers').select('user_id').eq('id', s.trainer_id).single()

      for (const userId of [studentUserId, trainer?.user_id].filter(Boolean)) {
        const { data: existing } = await supabase.from('notifications').select('id').eq('user_id', userId!).eq('type', 'session_15m').eq('action_url', s.id).limit(1)
        if (!existing?.length) {
          await supabase.from('notifications').insert({
            user_id: userId!, type: 'session_15m',
            title: '🚀 Session Starting Now!',
            body: `"${courseTitle}" starts in 15 minutes. Join now!`,
            action_url: s.meet_link || s.id, icon: 'zap',
          })
          results.push(`15m notification → ${userId}`)
        }
      }
    }

    // ============ MISSED SESSION CHECK ============
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
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

      // Notify student
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

      // Notify admins
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
      if (total < 5) continue // Need enough data points
      const present = (attData || []).filter(a => a.status === 'present').length
      const pct = Math.round((present / total) * 100)
      if (pct < 75) {
        // Check if already warned recently (within 7 days)
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { data: existing } = await supabase.from('notifications').select('id').eq('user_id', student.user_id).eq('type', 'low_attendance').gte('created_at', weekAgo).limit(1)
        if (!existing?.length) {
          const { data: pref } = await supabase.from('notification_preferences').select('low_attendance_inapp').eq('user_id', student.user_id).single()
          if (pref?.low_attendance_inapp !== false) {
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
    }

    // ============ PAYMENT DUE (Trainer subscriptions expiring in 3 days) ============
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
