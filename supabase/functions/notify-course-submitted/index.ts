import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const BRAND_COLOR = '#1A56DB'
const APP_URL = 'https://skillmitra.online'
const ADMIN_EMAIL = 'contact@skillmitra.online'
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
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">© ${new Date().getFullYear()} Learnvate Solutions Private Limited. All rights reserved.</p>
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

    const { trainer_name, trainer_email, course_title, course_fee, duration_days, total_sessions } = await req.json()

    if (!course_title) throw new Error('course_title is required')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const submittedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    const feeFormatted = `₹${Number(course_fee || 0).toLocaleString('en-IN')}`

    // 1. Email to Admin
    const adminHtml = layout(`
      <h1 style="font-size: 20px; color: #111; margin-bottom: 16px;">📚 New Course Submitted for Review</h1>
      <p style="font-size: 15px; line-height: 1.7; color: #444;">A trainer has submitted a new course for your approval.</p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; font-size: 14px; color: #444;">
          <tr><td style="padding: 6px 0; font-weight: 600; width: 130px;">Course Title:</td><td>${course_title}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Trainer:</td><td>${trainer_name || 'Unknown'}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Fee:</td><td>${feeFormatted}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Duration:</td><td>${duration_days || 'N/A'} days</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Sessions:</td><td>${total_sessions || 'N/A'}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Submitted at:</td><td>${submittedAt}</td></tr>
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${APP_URL}/admin/courses" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Review Course</a>
      </div>

      <p style="font-size: 13px; color: #666;">Please review and approve or reject this course.</p>
    `)

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [ADMIN_EMAIL], subject: `New Course Submitted: ${course_title}`, html: adminHtml }),
    })

    console.log('✅ Admin course notification sent')

    // 2. Email to Trainer
    if (trainer_email) {
      const trainerHtml = layout(`
        <h1 style="font-size: 20px; color: #111; margin-bottom: 16px;">📚 Your Course is Under Review</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">Hi ${trainer_name || 'there'},</p>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">Thank you for submitting your course <strong>"${course_title}"</strong>. Our team is reviewing it and you'll be notified once it's approved.</p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; font-size: 14px; color: #444;">
            <tr><td style="padding: 6px 0; font-weight: 600; width: 130px;">Course:</td><td>${course_title}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Fee:</td><td>${feeFormatted}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Status:</td><td style="color: #d97706; font-weight: 600;">Under Review</td></tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #666;">This usually takes 24-48 hours. You'll receive an email once your course is approved.</p>
      `)

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: [trainer_email], subject: `Your course "${course_title}" is under review`, html: trainerHtml }),
      })

      console.log('✅ Trainer course review notification sent')
    }

    // 3. In-app notification to admins
    const { data: admins } = await supabase.from('admins').select('user_id')
    for (const admin of admins || []) {
      await supabase.from('notifications').insert({
        user_id: admin.user_id,
        title: '📚 New Course Submitted',
        body: `${trainer_name || 'A trainer'} submitted "${course_title}" for review.`,
        type: 'new_course_submission',
        action_url: '/admin/courses',
        icon: 'book-open',
      })
    }

    console.log(`✅ In-app notifications sent to ${(admins || []).length} admins`)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('Error in notify-course-submitted:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
