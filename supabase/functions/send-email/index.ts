import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { getCorsHeaders } from "../_shared/cors.ts"

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c)
  );
}

const BRAND_COLOR = '#1A56DB'
const FROM_EMAIL = 'SkillMitra <contact@skillmitra.online>'
const APP_URL = 'https://skillmitra.online'

type EmailType = 
  | 'trainer_approved' 
  | 'trainer_rejected' 
  | 'student_welcome' 
  | 'trainer_welcome'
  | 'enrollment_confirmation' 
  | 'new_enrollment_trainer'
  | 'session_reminder'
  | 'student_trainer_match'
  | 'trainer_student_match'
  | 'student_new_trainer_match'
  | 'weekly_trainer_digest'

interface EmailPayload {
  type: EmailType
  to: string
  data: Record<string, any>
}

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

function btn(text: string, url: string): string {
  return `<div style="text-align: center; margin: 24px 0;">
    <a href="${url}" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">${text}</a>
  </div>`
}

function buildEmail(type: EmailType, data: Record<string, any>): { subject: string; html: string } {
  const name = escapeHtml(String(data.name || 'there'))

  switch (type) {
    case 'trainer_approved':
      return {
        subject: '🎉 Your SkillMitra Trainer Application is Approved!',
        html: layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">Congratulations, ${name}! 🎉</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Your trainer application on <strong>SkillMitra</strong> has been <strong style="color: #059669;">approved</strong>.</p>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">You can now:</p>
          <ul style="font-size: 15px; line-height: 1.8; color: #444; padding-left: 20px;">
            <li>Create and publish courses</li>
            <li>Set your availability schedule</li>
            <li>Start accepting students</li>
          </ul>
          ${btn('Go to Dashboard', `${APP_URL}/trainer/login`)}
        `)
      }

    case 'trainer_rejected':
      return {
        subject: 'Update on Your SkillMitra Trainer Application',
        html: layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">Hi ${name},</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Thank you for applying to be a trainer on <strong>SkillMitra</strong>. After reviewing your application, we are unable to approve it at this time.</p>
          ${data.reason ? `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="font-size: 14px; color: #991b1b; margin: 0;"><strong>Reason:</strong> ${escapeHtml(String(data.reason))}</p>
          </div>` : ''}
          <p style="font-size: 15px; line-height: 1.6; color: #444;">You are welcome to update your profile and re-apply. If you have questions, reach out via our contact page.</p>
        `)
      }

    case 'student_welcome':
      return {
        subject: 'Welcome to SkillMitra! 🚀',
        html: layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">Welcome aboard, ${name}! 🚀</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">You've successfully joined <strong>SkillMitra</strong> — India's platform for 1-on-1 skill training with expert trainers.</p>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Here's how to get started:</p>
          <ul style="font-size: 15px; line-height: 1.8; color: #444; padding-left: 20px;">
            <li>Browse trainers and find the right match</li>
            <li>Book a free trial session</li>
            <li>Start learning at your own pace</li>
          </ul>
          ${btn('Explore Courses', `${APP_URL}/browse-trainers`)}
        `)
      }

    case 'trainer_welcome':
      return {
        subject: 'Welcome to SkillMitra, Trainer! 🎓',
        html: layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">Welcome aboard, ${name}! 🎓</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Thank you for signing up as a trainer on <strong>SkillMitra</strong> — India's platform for 1-on-1 skill training.</p>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Your application is under review. Here's what happens next:</p>
          <ul style="font-size: 15px; line-height: 1.8; color: #444; padding-left: 20px;">
            <li>Our team will verify your profile within 48 hours</li>
            <li>You'll receive an email once your profile is approved</li>
            <li>After approval, you can create courses and start teaching</li>
          </ul>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="font-size: 14px; color: ${BRAND_COLOR}; margin: 0; font-weight: 600;">💡 Tip: Complete your profile fully to get approved faster!</p>
          </div>
          ${btn('Check Application Status', `${APP_URL}/trainer/login`)}
        `)
      }

    case 'enrollment_confirmation':
      return {
        subject: `You're enrolled in ${data.course_name || 'a course'}! 📚`,
        html: layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">Enrollment Confirmed! 📚</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Hi ${name}, you've been successfully enrolled in:</p>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="font-size: 16px; font-weight: 600; color: ${BRAND_COLOR}; margin: 0 0 4px;">${data.course_name || 'Course'}</p>
            <p style="font-size: 13px; color: #444; margin: 0;">Trainer: ${data.trainer_name || 'Your Trainer'}</p>
            ${data.start_date ? `<p style="font-size: 13px; color: #444; margin: 4px 0 0;">Starts: ${data.start_date}</p>` : ''}
          </div>
          ${btn('View Dashboard', `${APP_URL}/student/courses`)}
        `)
      }

    case 'session_reminder':
      return {
        subject: `⏰ Session in 1 hour: ${data.session_title || 'Upcoming Session'}`,
        html: layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">Session Reminder ⏰</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Hi ${name}, your session is starting in <strong>1 hour</strong>.</p>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="font-size: 16px; font-weight: 600; color: ${BRAND_COLOR}; margin: 0 0 4px;">${data.session_title || 'Session'}</p>
            <p style="font-size: 13px; color: #444; margin: 0;">Time: ${data.scheduled_time || ''}</p>
            ${data.meet_link ? `<p style="font-size: 13px; margin: 4px 0 0;"><a href="${data.meet_link}" style="color: ${BRAND_COLOR};">Join Meeting</a></p>` : ''}
          </div>
          ${data.meet_link ? btn('Join Session', data.meet_link) : ''}
        `)
      }

    case 'new_enrollment_trainer':
      return {
        subject: `🎉 New Student Enrolled in ${data.course_name || 'Your Course'}!`,
        html: layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">New Enrollment! 🎉</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Hi ${name}, a student has enrolled in your course:</p>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="font-size: 16px; font-weight: 600; color: ${BRAND_COLOR}; margin: 0 0 4px;">${data.course_name || 'Course'}</p>
            <p style="font-size: 13px; color: #444; margin: 0;">Student: ${data.student_name || 'New Student'}</p>
            ${data.start_date ? `<p style="font-size: 13px; color: #444; margin: 4px 0 0;">First session: ${data.start_date}</p>` : ''}
          </div>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Check your sessions page to review the schedule and prepare for the session.</p>
          ${btn('View Sessions', `${APP_URL}/trainer/sessions`)}
        `)
      }

    case 'student_trainer_match':
      return {
        subject: `🎯 ${data.trainer_count || ''} Trainers matched for you, ${name}!`,
        html: layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">Great news, ${name}! 🎯</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">We've found <strong>${data.trainer_count || 'some'} trainer(s)</strong> on SkillMitra who match your profile and preferences.</p>
          <p style="font-size: 15px; line-height: 1.6; color: #444; margin-bottom: 16px;">Here are your top matches:</p>
          ${data.trainer_cards_html || ''}
          <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 16px;">Book a <strong>free trial session</strong> to find your perfect trainer!</p>
          ${btn('Browse All Trainers', `${APP_URL}/browse-trainers`)}
        `)
      }

    case 'trainer_student_match': {
      const reasons = data.match_reasons?.length
        ? `<p style="font-size: 14px; color: #444; margin-top: 8px;"><strong>Why you matched:</strong> ${data.match_reasons.join(' · ')}</p>`
        : ''
      return {
        subject: `🆕 New student ${data.student_name || ''} just joined SkillMitra!`,
        html: layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">New Student Match! 🆕</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Hi ${data.trainer_name || 'Trainer'},</p>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">A new student just signed up who matches your profile:</p>
          <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 16px 0; background: #f9fafb;">
            <p style="font-size: 16px; font-weight: 600; color: #111; margin: 0;">📚 ${data.student_name || 'New Student'}</p>
            ${data.student_city || data.student_state ? `<p style="font-size: 13px; color: #666; margin: 4px 0 0;">📍 ${[data.student_city, data.student_state].filter(Boolean).join(', ')}</p>` : ''}
            ${reasons}
          </div>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Make sure your courses are up-to-date and your availability is set so students can find and book you easily!</p>
          ${btn('View Your Dashboard', `${APP_URL}/trainer/dashboard`)}
        `)
      }
    }

    case 'student_new_trainer_match':
      return {
        subject: `🎓 New trainer ${data.trainer_name || ''} just joined SkillMitra — matches your interests!`,
        html: layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">New Trainer Alert! 🎓</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Hi ${name},</p>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">A new trainer just joined SkillMitra who matches your course interests:</p>
          <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 16px 0; background: #f9fafb;">
            <p style="font-size: 16px; font-weight: 600; color: #111; margin: 0;">🎓 ${data.trainer_name || 'New Trainer'}</p>
            ${data.trainer_role ? `<p style="font-size: 13px; color: #666; margin: 4px 0 0;">${data.trainer_role}${data.trainer_company ? ` at ${data.trainer_company}` : ''}</p>` : ''}
            ${data.matched_skills?.length ? `<p style="font-size: 14px; color: #444; margin: 8px 0 0;"><strong>Matching skills:</strong> ${data.matched_skills.join(', ')}</p>` : ''}
            ${data.trainer_experience ? `<p style="font-size: 13px; color: #666; margin: 4px 0 0;">📊 ${data.trainer_experience}+ years experience</p>` : ''}
          </div>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Book a free trial session to see if they're the right fit for you!</p>
          ${btn('Browse Trainers', `${APP_URL}/browse-trainers`)}
        `)
      }

    default:
      throw new Error(`Unknown email type: ${type}`)
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured')

    const body = await req.json()
    
    let subject: string
    let html: string
    let to: string

    if (body.type) {
      // Typed template email
      const payload = body as EmailPayload
      if (!payload.type || !payload.to) throw new Error('type and to are required')
      to = payload.to
      const built = buildEmail(payload.type, payload.data || {})
      subject = built.subject
      html = built.html
    } else if (body.to && body.subject && body.html) {
      // Direct email (admin replies etc.) — require service-role Authorization
      const authHeader = req.headers.get('Authorization') ?? ''
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      to = body.to
      subject = body.subject
      html = body.html
    } else {
      throw new Error('Provide either {type, to, data} or {to, subject, html}')
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    })

    const resData = await res.json()
    if (!res.ok) throw new Error(`Resend error [${res.status}]: ${JSON.stringify(resData)}`)

    console.log(`✅ Email sent: ${body.type || 'direct'} → ${to}`, resData.id)

    return new Response(JSON.stringify({ success: true, email_id: resData.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('❌ Email error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
