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

    const { user_id, trainer_name, email, phone, city, skills, experience_years, registration_only, application_submitted } = await req.json()

    if (!user_id) throw new Error('user_id is required')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const name = trainer_name || 'Unknown'
    const appliedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    const skillsList = (skills && skills.length > 0) ? skills.join(', ') : 'Not specified'

    let subject: string
    let htmlBody: string

    if (registration_only) {
      // Phase 1: Basic signup only — trainer still needs to complete onboarding
      subject = 'New Trainer Registered — Onboarding Pending'
      htmlBody = layout(`
        <h1 style="font-size: 20px; color: #111; margin-bottom: 16px;">📝 New Trainer Registered</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">A new trainer has registered on SkillMitra. They still need to complete their onboarding profile before review.</p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; font-size: 14px; color: #444;">
            <tr><td style="padding: 6px 0; font-weight: 600; width: 120px;">Trainer Name:</td><td>${name}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Email:</td><td>${email || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Phone:</td><td>${phone || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Registered at:</td><td>${appliedAt}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Status:</td><td style="color: #d97706; font-weight: 600;">Onboarding Pending</td></tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #666;">No action needed yet. You will be notified once the trainer submits their full application.</p>
      `)
    } else {
      // Phase 2: Full application submitted — ready for admin review
      subject = 'New Trainer Application — Action Required'
      htmlBody = layout(`
        <h1 style="font-size: 20px; color: #111; margin-bottom: 16px;">🆕 New Trainer Application</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">A trainer has completed their onboarding and submitted their application for your approval.</p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; font-size: 14px; color: #444;">
            <tr><td style="padding: 6px 0; font-weight: 600; width: 120px;">Trainer Name:</td><td>${name}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Email:</td><td>${email || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Phone:</td><td>${phone || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">City:</td><td>${city || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Skills:</td><td>${skillsList}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Experience:</td><td>${experience_years || 0} years</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Submitted at:</td><td>${appliedAt}</td></tr>
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${APP_URL}/admin/trainers" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Review & Approve</a>
        </div>

        <p style="font-size: 13px; color: #666;">Please review and approve or reject within 24 hours.</p>
      `)
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject,
        html: htmlBody,
      }),
    })

    const resendData = await resendRes.json()
    if (!resendRes.ok) {
      console.error(`Resend error [${resendRes.status}]:`, resendData)
    } else {
      console.log(`✅ Admin notification email sent:`, resendData.id)
    }

    // 2. Send in-app notification to all admins
    const { data: admins } = await supabase.from('admins').select('user_id')
    const notifTitle = registration_only
      ? '📝 New Trainer Registered'
      : '🆕 New Trainer Application'
    const notifBody = registration_only
      ? `${name} registered — onboarding pending.`
      : `${name} submitted their application — review now.`

    for (const admin of admins || []) {
      await supabase.from('notifications').insert({
        user_id: admin.user_id,
        title: notifTitle,
        body: notifBody,
        type: registration_only ? 'new_trainer_registration' : 'new_trainer_application',
        action_url: '/admin/trainers',
        icon: 'user-plus',
      })
    }

    console.log(`✅ In-app notifications sent to ${(admins || []).length} admins`)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('Error in notify-admin-new-trainer:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})