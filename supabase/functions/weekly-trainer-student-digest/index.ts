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

    const { data: trainers } = await supabase
      .from('trainers')
      .select('id, user_id, skills, teaching_languages')
      .eq('approval_status', 'approved')
      .not('skills', 'is', null)

    if (!trainers || trainers.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No trainers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: students } = await supabase
      .from('students')
      .select('id, user_id, course_interests')
      .not('course_interests', 'is', null)

    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No students with interests' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id, trainer_id')
      .in('status', ['active', 'trial', 'completed'])

    const enrollmentSet = new Set(
      (enrollments || []).map(e => `${e.student_id}:${e.trainer_id}`)
    )

    let emailsSent = 0

    for (const trainer of trainers) {
      if (!trainer.skills?.length) continue

      // Check email preferences
      const { data: prefs } = await supabase
        .from('email_preferences')
        .select('digest_emails_enabled')
        .eq('user_id', trainer.user_id)
        .single()

      if (prefs?.digest_emails_enabled === false) continue

      const matchingStudents = students.filter(s => {
        if (enrollmentSet.has(`${s.id}:${trainer.id}`)) return false
        const interests = (s.course_interests as string[]) || []
        return interests.some(i =>
          trainer.skills!.some((sk: string) => sk.toLowerCase() === i.toLowerCase())
        )
      })

      if (matchingStudents.length === 0) continue

      const { data: tProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', trainer.user_id)
        .single()

      if (!tProfile?.email) continue

      // Build skill demand breakdown
      const skillDemand: Record<string, number> = {}
      for (const s of matchingStudents) {
        const interests = (s.course_interests as string[]) || []
        for (const interest of interests) {
          if (trainer.skills!.some((sk: string) => sk.toLowerCase() === interest.toLowerCase())) {
            skillDemand[interest] = (skillDemand[interest] || 0) + 1
          }
        }
      }

      const skillDemandHtml = Object.entries(skillDemand)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([skill, count]) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; background: #f9fafb;">
            <span style="font-size: 14px; font-weight: 600; color: #111;">🎯 ${skill}</span>
            <span style="font-size: 13px; background: #eff6ff; color: #1e40af; padding: 2px 10px; border-radius: 12px;">${count} student${count > 1 ? 's' : ''}</span>
          </div>
        `).join('')

      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: 'weekly_trainer_student_digest',
          to: tProfile.email,
          data: {
            trainer_name: tProfile.full_name,
            student_count: matchingStudents.length,
            skill_demand_html: skillDemandHtml,
          },
        }),
      })

      emailsSent++
      if (emailsSent % 10 === 0) await new Promise(r => setTimeout(r, 1000))
    }

    console.log(`✅ Weekly trainer student digest sent to ${emailsSent} trainers`)
    return new Response(JSON.stringify({ success: true, emails_sent: emailsSent }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('❌ Weekly trainer student digest error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
