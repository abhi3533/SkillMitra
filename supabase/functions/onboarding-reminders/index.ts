import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const BRAND_COLOR = '#1A56DB'
const APP_URL = 'https://skillmitra.online'
const FROM_EMAIL = 'SkillMitra <contact@skillmitra.online>'
const ADMIN_EMAIL = 'contact@skillmitra.online'

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json().catch(() => ({}))

    // If called with trainer_id, send immediate reminder to specific trainer
    if (body.trainer_id) {
      const { data: trainer } = await supabase.from('trainers').select('*').eq('id', body.trainer_id).single()
      if (!trainer) throw new Error('Trainer not found')
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', trainer.user_id).single()
      if (!profile?.email) throw new Error('No email found')

      const name = profile.full_name || 'there'
      const step = Math.min(trainer.onboarding_step || 0, 6)
      const isAdminNudge = body.reminder_type === 'admin_nudge'

      const subject = isAdminNudge
        ? 'Action Required — Complete your SkillMitra application'
        : 'Please complete your SkillMitra onboarding to get approved'

      const html = isAdminNudge
        ? layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">Hi ${name},</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Please login and complete your application to get approved as a trainer on SkillMitra.</p>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Your profile is ${step > 0 ? `${Math.round((step / 6) * 100)}% complete` : 'not yet started'}. Finish it now to start teaching and earning!</p>
          ${btn('Complete My Application', `${APP_URL}/trainer/onboarding`)}
          <p style="font-size: 13px; color: #888; text-align: center;">Need help? Email us at <a href="mailto:contact@skillmitra.online" style="color: ${BRAND_COLOR};">contact@skillmitra.online</a></p>
        `)
        : layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">Hi ${name},</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Please complete your SkillMitra onboarding to get approved as a trainer.</p>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Your profile is ${step > 0 ? `${Math.round((step / 6) * 100)}% done` : 'not set up yet'}. Finish it to start teaching and earning!</p>
          ${btn(step > 0 ? 'Continue Where I Left Off' : 'Complete My Profile', `${APP_URL}/trainer/onboarding`)}
          <p style="font-size: 13px; color: #888; text-align: center;">Need help? Email us at <a href="mailto:contact@skillmitra.online" style="color: ${BRAND_COLOR};">contact@skillmitra.online</a></p>
        `)

      await sendEmail(RESEND_API_KEY, profile.email, subject, html)
      return new Response(JSON.stringify({ success: true, sent_to: profile.full_name }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Scheduled: send DAILY reminder to ALL trainers who haven't submitted yet
    // Trainers with onboarding_status 'draft' or 'registered' get a daily email
    // Stops once they submit (status changes to 'pending', 'submitted', 'approved', etc.)
    const { data: draftTrainers } = await supabase
      .from('trainers')
      .select('*')
      .in('onboarding_status', ['draft', 'registered'])
      .order('created_at', { ascending: true })

    if (!draftTrainers?.length) {
      return new Response(JSON.stringify({ success: true, message: 'No pending trainers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userIds = draftTrainers.map(t => t.user_id)
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds)
    const profileMap: Record<string, any> = {}
    ;(profiles || []).forEach(p => { profileMap[p.id] = p })

    const now = new Date()
    let sent = 0

    for (const trainer of draftTrainers) {
      const profile = profileMap[trainer.user_id]
      if (!profile?.email) continue

      const createdAt = new Date(trainer.created_at)
      const hoursSinceSignup = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

      // Skip if signed up less than 24 hours ago (give them time)
      if (hoursSinceSignup < 24) continue

      const step = trainer.onboarding_step || 0
      const name = profile.full_name || 'there'
      const daysSince = Math.floor(hoursSinceSignup / 24)

      const subject = 'Please complete your SkillMitra onboarding to get approved'
      const html = layout(`
        <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">Hi ${name},</h1>
        <p style="font-size: 15px; line-height: 1.6; color: #444;">Please complete your SkillMitra onboarding to get approved as a trainer.</p>
        <p style="font-size: 15px; line-height: 1.6; color: #444;">Your profile is ${step > 0 ? `${Math.round((step / 6) * 100)}% complete` : 'not yet started'}. Finish it now to start teaching and earning on SkillMitra!</p>
        ${daysSince > 3 ? `<p style="font-size: 14px; line-height: 1.6; color: #666;">It's been ${daysSince} days since you signed up. Don't miss out — complete your application today!</p>` : ''}
        ${btn(step > 0 ? 'Continue Where I Left Off' : 'Complete My Application', `${APP_URL}/trainer/onboarding`)}
        <p style="font-size: 13px; color: #888; text-align: center;">Need help? Email us at <a href="mailto:contact@skillmitra.online" style="color: ${BRAND_COLOR};">contact@skillmitra.online</a></p>
      `)

      try {
        await sendEmail(RESEND_API_KEY, profile.email, subject, html)
        sent++
        console.log(`✅ Daily onboarding reminder sent to ${profile.email} (day ${daysSince})`)
      } catch (e) {
        console.error(`❌ Failed to send to ${profile.email}:`, e)
      }
    }

    // Daily admin digest — check if it's around 9 AM IST (3:30 UTC)
    const utcHour = now.getUTCHours()
    const utcMin = now.getUTCMinutes()
    const isDigestTime = (utcHour === 3 && utcMin >= 20) || (utcHour === 3 && utcMin <= 40)

    if (isDigestTime) {
      const inactiveTrainers = draftTrainers.filter(t => {
        const lastActive = new Date(t.last_saved_at || t.created_at)
        return (now.getTime() - lastActive.getTime()) > 24 * 60 * 60 * 1000
      })

      if (inactiveTrainers.length > 0) {
        const rows = inactiveTrainers.map(t => {
          const p = profileMap[t.user_id]
          const daysSince = Math.floor((now.getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24))
          const lastActive = new Date(t.last_saved_at || t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
          return `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p?.full_name || 'Unknown'}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p?.phone || '—'}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p?.email || '—'}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Step ${t.onboarding_step || 0}/6</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${lastActive}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${daysSince}d</td>
          </tr>`
        }).join('')

        const digestHtml = layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">Daily Trainer Onboarding Digest</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;"><strong>${inactiveTrainers.length}</strong> trainer(s) have been inactive for more than 24 hours and need follow-up calls:</p>
          <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin: 16px 0;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Name</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Mobile</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Email</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Step</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Last Active</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Days</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          ${btn('View Onboarding Pipeline', `${APP_URL}/admin/trainers`)}
        `)

        await sendEmail(RESEND_API_KEY, ADMIN_EMAIL, `Daily Digest: ${inactiveTrainers.length} Trainers Need Follow-Up`, digestHtml)
        console.log(`✅ Admin daily digest sent with ${inactiveTrainers.length} inactive trainers`)
      }
    }

    return new Response(JSON.stringify({ success: true, reminders_sent: sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('❌ Onboarding reminders error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(`Resend error [${res.status}]: ${JSON.stringify(data)}`)
  }
  return res.json()
}