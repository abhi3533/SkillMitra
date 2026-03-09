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
      <h2 style="margin: 0; font-size: 22px; color: #111;">Skill<span style="color: ${BRAND_COLOR};">Mitra</span></h2>
    </div>
    ${content}
    <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">© ${new Date().getFullYear()} Learnvate Solutions Private Limited. All rights reserved.</p>
      <p style="font-size: 12px; color: #9ca3af; margin: 4px 0 0;">
        <a href="${APP_URL}/privacy" style="color: #9ca3af;">Privacy</a> · 
        <a href="${APP_URL}/terms" style="color: #9ca3af;">Terms</a> · 
        <a href="mailto:contact@skillmitra.online" style="color: #9ca3af;">Contact</a>
      </p>
    </div>
  </div>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const { trainer_id, status, rejection_reason } = await req.json()

    if (!trainer_id || !status) {
      throw new Error('trainer_id and status are required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get trainer + profile info
    const { data: trainer, error: trainerErr } = await supabase
      .from('trainers')
      .select('user_id')
      .eq('id', trainer_id)
      .single()

    if (trainerErr || !trainer) {
      throw new Error('Trainer not found')
    }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', trainer.user_id)
      .single()

    if (profileErr || !profile?.email) {
      throw new Error('Trainer profile or email not found')
    }

    const trainerName = profile.full_name || 'Trainer'

    let subject: string
    let htmlBody: string

    if (status === 'approved') {
      subject = 'Congratulations! Your SkillMitra Trainer Application is Approved'
      htmlBody = layout(`
        <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Congratulations, ${trainerName}! 🎉</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">We are excited to welcome you to <strong>SkillMitra</strong> as a verified trainer!</p>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">Your application has been reviewed and <strong style="color: #059669;">approved</strong>. You can now login and start creating courses.</p>
        
        <div style="text-align: center; margin: 28px 0;">
          <a href="${APP_URL}/trainer/login" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Login to Your Dashboard</a>
        </div>

        <p style="font-size: 15px; line-height: 1.7; color: #444;">Your profile is now live and visible to students. Start earning by creating your first course today!</p>
        
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="font-size: 14px; color: #166534; margin: 0; font-weight: 600;">🚀 Quick Start Checklist:</p>
          <ul style="font-size: 14px; line-height: 1.8; color: #166534; padding-left: 20px; margin: 8px 0 0;">
            <li>Create your first course</li>
            <li>Set your availability schedule</li>
            <li>Share your profile link with students</li>
          </ul>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #666;">Welcome aboard!</p>
        <p style="font-size: 14px; color: #666; margin-top: 8px;">— Team SkillMitra</p>
      `)
    } else {
      subject = 'Update on Your SkillMitra Trainer Application'
      htmlBody = layout(`
        <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Dear ${trainerName},</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">Thank you for applying to become a trainer on <strong>SkillMitra</strong>.</p>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">After reviewing your application, we are unable to approve it at this time.</p>
        
        ${rejection_reason ? `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="font-size: 14px; color: #991b1b; margin: 0;"><strong>Reason:</strong> ${rejection_reason}</p>
        </div>` : ''}
        
        <p style="font-size: 15px; line-height: 1.7; color: #444;">You are welcome to reapply after 30 days with updated documents and an improved profile.</p>
        <p style="font-size: 15px; line-height: 1.7; color: #444;">If you have any questions, contact us at <a href="mailto:contact@skillmitra.online" style="color: ${BRAND_COLOR};">contact@skillmitra.online</a>.</p>
        
        <p style="font-size: 14px; color: #666; margin-top: 24px;">— Team SkillMitra</p>
      `)
    }

    // Send email via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [profile.email],
        subject,
        html: htmlBody,
      }),
    })

    const resendData = await resendRes.json()
    if (!resendRes.ok) {
      console.error(`Resend API error [${resendRes.status}]:`, resendData)
      throw new Error(`Resend API error [${resendRes.status}]: ${JSON.stringify(resendData)}`)
    }

    console.log(`✅ Email sent to ${profile.email} (${status}):`, resendData.id)

    // Create in-app notification
    const notifTitle = status === 'approved'
      ? 'Application Approved! 🎉'
      : 'Application Update'
    const notifBody = status === 'approved'
      ? 'Your trainer application has been approved! Start creating courses and accepting students.'
      : `Your application was not approved.${rejection_reason ? ` Reason: ${rejection_reason}` : ' Please check your email for details.'}`

    await supabase.from('notifications').insert({
      user_id: trainer.user_id,
      title: notifTitle,
      body: notifBody,
      type: 'trainer_status',
      action_url: status === 'approved' ? '/trainer/courses' : '/trainer/dashboard',
    })

    return new Response(JSON.stringify({ 
      success: true, 
      email_id: resendData.id,
      trainer_name: trainerName,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('Error sending trainer notification:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})