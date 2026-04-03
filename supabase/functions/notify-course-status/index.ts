import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const BRAND_COLOR = '#1A56DB'
const APP_URL = 'https://skillmitra.online'
const FROM_EMAIL = 'SkillMitra <contact@skillmitra.online>'

function layout(content: string): string {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
    <div style="text-align: center; margin-bottom: 28px;">
      <span style="font-size: 24px; font-weight: 700; color: #0F172A;">Skill</span><span style="font-size: 24px; font-weight: 700; color: ${BRAND_COLOR};">Mitra</span>
    </div>
    ${content}
    <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0 0 8px;">Questions? Reply to this email or contact us at <a href="mailto:contact@skillmitra.online" style="color: #9ca3af; text-decoration: underline;">contact@skillmitra.online</a> | <a href="https://skillmitra.online" style="color: #9ca3af; text-decoration: underline;">skillmitra.online</a></p>
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">© ${new Date().getFullYear()} Learnvate Solutions. All rights reserved.</p>
    </div>
  </div>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured')

    const { course_id, status, comment } = await req.json()
    if (!course_id || !status) throw new Error('course_id and status are required')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get course + trainer + profile
    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('title, trainer_id')
      .eq('id', course_id)
      .single()
    if (courseErr || !course) throw new Error('Course not found')

    const { data: trainer } = await supabase
      .from('trainers')
      .select('user_id')
      .eq('id', course.trainer_id)
      .single()
    if (!trainer) throw new Error('Trainer not found')

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', trainer.user_id)
      .single()
    if (!profile?.email) throw new Error('Trainer email not found')

    const trainerName = profile.full_name || 'Trainer'
    const courseTitle = course.title

    let subject: string
    let htmlBody: string
    let notifTitle: string
    let notifBody: string
    let notifUrl: string

    if (status === 'approved') {
      subject = `Your course "${courseTitle}" is approved! 🎉`
      htmlBody = layout(`
        <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${trainerName} 🎉</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">Great news — your course <strong>"${courseTitle}"</strong> has been <strong style="color: #059669;">approved</strong>!</p>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">Your course is now live and visible to students on SkillMitra.</p>
        
        <div style="text-align: center; margin: 28px 0;">
          <a href="${APP_URL}/trainer/courses" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">View Your Course</a>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="font-size: 14px; color: #166534; margin: 0; font-weight: 600;">What happens next:</p>
          <ul style="font-size: 14px; line-height: 1.8; color: #166534; padding-left: 20px; margin: 8px 0 0;">
            <li>Students can now discover and enroll in your course</li>
            <li>Set your availability to accept trial bookings</li>
            <li>Share your profile link to attract more students</li>
          </ul>
        </div>

        <p style="font-size: 14px; color: #666; margin-top: 24px;">— Team SkillMitra</p>
      `)
      notifTitle = 'Course Approved! 🎉'
      notifBody = `Your course "${courseTitle}" is now live and visible to students.`
      notifUrl = '/trainer/courses'
    } else if (status === 'rejected') {
      subject = `Update on your course "${courseTitle}"`
      htmlBody = layout(`
        <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${trainerName},</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">We've reviewed your course <strong>"${courseTitle}"</strong> and unfortunately we're unable to approve it at this time.</p>
        
        ${comment ? `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="font-size: 14px; color: #991b1b; margin: 0;"><strong>Reason:</strong> ${comment}</p>
        </div>` : ''}
        
        <p style="font-size: 15px; line-height: 1.7; color: #444;">You can create a new course after addressing the feedback.</p>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">If you have questions, write to us at <a href="mailto:contact@skillmitra.online" style="color: ${BRAND_COLOR};">contact@skillmitra.online</a>.</p>
        
        <p style="font-size: 14px; color: #666; margin-top: 24px;">— Team SkillMitra</p>
      `)
      notifTitle = 'Course Not Approved'
      notifBody = `Your course "${courseTitle}" was not approved.${comment ? ` Reason: ${comment}` : ''}`
      notifUrl = '/trainer/courses'
    } else if (status === 'changes_requested') {
      subject = `Changes requested for your course "${courseTitle}"`
      htmlBody = layout(`
        <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${trainerName},</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">We've reviewed your course <strong>"${courseTitle}"</strong> and would like you to make some changes before we can approve it.</p>
        
        ${comment ? `<div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="font-size: 14px; color: #92400e; margin: 0;"><strong>Requested changes:</strong> ${comment}</p>
        </div>` : ''}
        
        <div style="text-align: center; margin: 28px 0;">
          <a href="${APP_URL}/trainer/courses" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Update Your Course</a>
        </div>

        <p style="font-size: 15px; line-height: 1.7; color: #444;">Once you've updated your course, it will be re-reviewed by our team.</p>
        <p style="font-size: 14px; color: #666; margin-top: 24px;">— Team SkillMitra</p>
      `)
      notifTitle = 'Course Changes Requested'
      notifBody = `Please update your course "${courseTitle}".${comment ? ` Feedback: ${comment}` : ''}`
      notifUrl = '/trainer/courses'
    } else {
      throw new Error(`Invalid status: ${status}`)
    }

    // Send email
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [profile.email], subject, html: htmlBody }),
    })

    const resendData = await resendRes.json()
    if (!resendRes.ok) {
      console.error(`Resend API error [${resendRes.status}]:`, resendData)
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`)
    }

    console.log(`✅ Course status email sent to ${profile.email} (${status}):`, resendData.id)

    // In-app notification
    await supabase.from('notifications').insert({
      user_id: trainer.user_id,
      title: notifTitle,
      body: notifBody,
      type: 'course_status',
      action_url: notifUrl,
    })

    return new Response(JSON.stringify({ success: true, email_id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('Error in notify-course-status:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})