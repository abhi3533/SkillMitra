import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BRAND_COLOR = '#1A56DB'
const APP_URL = 'https://skillmitra-online.lovable.app'
const FROM_EMAIL = 'SkillMitra <contact@skillmitra.online>'
const ADMIN_EMAIL = 'contact@skillmitra.online'

function layout(content: string): string {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
    <div style="text-align: center; margin-bottom: 28px;">
      <h2 style="margin: 0; font-size: 22px; color: #111;">Skill<span style="color: ${BRAND_COLOR};">Mitra</span></h2>
    </div>
    ${content}
    <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">© ${new Date().getFullYear()} SkillMitra. All rights reserved.</p>
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

      const step = trainer.onboarding_step || 0
      const html = layout(`
        <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">Hi ${profile.full_name || 'there'},</h1>
        <p style="font-size: 15px; line-height: 1.6; color: #444;">Your SkillMitra trainer profile is ${step > 0 ? `${Math.round((step / 6) * 100)}% complete` : 'waiting to be set up'}. Complete your onboarding to start teaching and earning!</p>
        ${btn(step > 0 ? 'Continue Where I Left Off' : 'Complete My Profile', `${APP_URL}/trainer/onboarding`)}
        <p style="font-size: 13px; color: #888; text-align: center;">Need help? Call us at +91 99855 12332</p>
      `)

      await sendEmail(RESEND_API_KEY, profile.email, 'Complete Your SkillMitra Profile', html)
      return new Response(JSON.stringify({ success: true, sent_to: profile.full_name }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Scheduled: process all draft trainers
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
      const step = trainer.onboarding_step || 0
      const name = profile.full_name || 'there'

      let subject = ''
      let html = ''

      // 24h reminder
      if (hoursSinceSignup >= 24 && hoursSinceSignup < 48) {
        subject = 'Complete Your SkillMitra Profile'
        html = layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">Hi ${name},</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">You signed up as a trainer on SkillMitra but haven't completed your profile yet. It only takes a few minutes!</p>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Complete your profile to get verified and start teaching students across India.</p>
          ${btn('Complete My Profile', `${APP_URL}/trainer/onboarding`)}
        `)
      }
      // 48h reminder
      else if (hoursSinceSignup >= 48 && hoursSinceSignup < 72) {
        subject = 'Your SkillMitra Profile is Waiting'
        html = layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">Hi ${name},</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Your trainer profile on SkillMitra is ${step > 0 ? `${Math.round((step / 6) * 100)}% complete` : 'still waiting'}. Students are looking for trainers like you!</p>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">Pick up right where you left off — it only takes a few minutes to complete.</p>
          ${btn('Continue Where I Left Off', `${APP_URL}/trainer/onboarding`)}
        `)
      }
      // 72h final reminder
      else if (hoursSinceSignup >= 72 && hoursSinceSignup < 96) {
        subject = 'Last Reminder — Complete Your SkillMitra Profile'
        html = layout(`
          <h1 style="font-size: 20px; color: #111; margin-bottom: 12px;">Hi ${name},</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">This is our final reminder to complete your SkillMitra trainer profile. Don't miss out on the opportunity to teach and earn!</p>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">If you're facing any issues, our support team is here to help:</p>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
            <p style="font-size: 15px; color: ${BRAND_COLOR}; margin: 0; font-weight: 600;">📞 Call us: +91 99855 12332</p>
            <p style="font-size: 13px; color: #666; margin: 4px 0 0;">We'll help you complete your profile over the phone</p>
          </div>
          ${btn('Complete My Profile Now', `${APP_URL}/trainer/onboarding`)}
        `)
      }

      if (subject && html) {
        try {
          await sendEmail(RESEND_API_KEY, profile.email, subject, html)
          sent++
          console.log(`✅ Onboarding reminder sent to ${profile.email} (${Math.floor(hoursSinceSignup)}h)`)
        } catch (e) {
          console.error(`❌ Failed to send to ${profile.email}:`, e)
        }
      }
    }

    // Daily admin digest — also check if it's around 9 AM IST (3:30 UTC)
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
          const lastActive = new Date(t.last_saved_at || t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
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
