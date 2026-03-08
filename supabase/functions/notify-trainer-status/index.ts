import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    // Get trainer + profile info
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

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
      subject = '🎉 Your SkillMitra Trainer Application is Approved!'
      htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="margin: 0; font-size: 20px; color: #111;">Skill<span style="color: #7c3aed;">Mitra</span></h2>
          </div>
          <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Congratulations, ${trainerName}! 🎉</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Your trainer application on <strong>SkillMitra</strong> has been <strong style="color: #059669;">approved</strong>.</p>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">You can now:</p>
          <ul style="font-size: 15px; line-height: 1.8; color: #444; padding-left: 20px;">
            <li>Create and publish courses</li>
            <li>Set your availability schedule</li>
            <li>Start accepting students</li>
          </ul>
          <div style="text-align: center; margin: 28px 0;">
            <a href="https://skillmitra-learn-grow.lovable.app/trainer/login" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Go to Dashboard</a>
          </div>
          <p style="font-size: 13px; color: #888; margin-top: 32px; text-align: center;">— The SkillMitra Team</p>
        </div>`
    } else {
      subject = 'Update on Your SkillMitra Trainer Application'
      htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="margin: 0; font-size: 20px; color: #111;">Skill<span style="color: #7c3aed;">Mitra</span></h2>
          </div>
          <h1 style="font-size: 22px; color: #111; margin-bottom: 16px;">Hi ${trainerName},</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Thank you for applying to be a trainer on <strong>SkillMitra</strong>. After reviewing your application, we are unable to approve it at this time.</p>
          ${rejection_reason ? `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="font-size: 14px; color: #991b1b; margin: 0;"><strong>Reason:</strong> ${rejection_reason}</p>
          </div>` : ''}
          <p style="font-size: 15px; line-height: 1.6; color: #444;">You are welcome to update your profile and re-apply. If you have questions, please reach out via our contact page.</p>
          <p style="font-size: 13px; color: #888; margin-top: 32px; text-align: center;">— The SkillMitra Team</p>
        </div>`
    }

    // Send via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SkillMitra <contact@skillmitra.online>',
        to: [profile.email],
        subject,
        html: htmlBody,
      }),
    })

    const resendData = await resendRes.json()
    if (!resendRes.ok) {
      throw new Error(`Resend API error [${resendRes.status}]: ${JSON.stringify(resendData)}`)
    }

    // Also create an in-app notification
    await supabase.from('notifications').insert({
      user_id: trainer.user_id,
      title: status === 'approved' ? 'Application Approved!' : 'Application Update',
      body: status === 'approved'
        ? 'Your trainer application has been approved. You can now create courses!'
        : `Your application was not approved. ${rejection_reason || ''}`,
      type: 'trainer_status',
      action_url: '/trainer/dashboard',
    })

    return new Response(JSON.stringify({ success: true, email_id: resendData.id }), {
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
