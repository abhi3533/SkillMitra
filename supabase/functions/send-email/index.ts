import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const BRAND_COLOR = '#1A56DB'
const FROM_EMAIL = 'SkillMitra <contact@skillmitra.online>'
const APP_URL = 'https://skillmitra-learn-grow.lovable.app'

type EmailType = 
  | 'trainer_approved' 
  | 'trainer_rejected' 
  | 'student_welcome' 
  | 'trainer_welcome'
  | 'enrollment_confirmation' 
  | 'session_reminder'

interface EmailPayload {
  type: EmailType
  to: string
  data: Record<string, any>
}

function layout(content: string): string {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
    <div style="text-align: center; margin-bottom: 28px;">
      <h2 style="margin: 0; font-size: 22px; color: #111;">Skill<span style="color: ${BRAND_COLOR};">Mitra</span></h2>
    </div>
    ${content}
    <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">© ${new Date().getFullYear()} SkillMitra. All rights reserved.</p>
      <p style="font-size: 12px; color: #9ca3af; margin: 4px 0 0;">
        <a href="${APP_URL}/privacy" style="color: #9ca3af;">Privacy</a> · 
        <a href="${APP_URL}/terms" style="color: #9ca3af;">Terms</a>
      </p>
    </div>
  </div>`
}

function btn(text: string, url: string): string {
  return `<div style="text-align: center; margin: 24px 0;">
    <a href="${url}" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">${text}</a>
  </div>`
}

function buildEmail(type: EmailType, data: Record<string, any>): { subject: string; html: string } {
  const name = data.name || 'there'

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
            <p style="font-size: 14px; color: #991b1b; margin: 0;"><strong>Reason:</strong> ${data.reason}</p>
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

    default:
      throw new Error(`Unknown email type: ${type}`)
  }
}

Deno.serve(async (req) => {
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
      // Direct email (for admin replies etc.)
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
