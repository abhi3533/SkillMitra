import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SITE_NAME = 'SkillMitra'
const SITE_URL = 'https://skillmitra.online'
const FROM_EMAIL = 'SkillMitra <contact@skillmitra.online>'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://huszmetnqxrividclgad.supabase.co'

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your SkillMitra email',
  invite: "You've been invited to SkillMitra",
  magiclink: 'Your SkillMitra login link',
  recovery: 'Reset your SkillMitra password',
  email_change: 'Confirm your new email address',
  email_change_current: 'Confirm your email change on SkillMitra',
  email_change_new: 'Confirm your new email on SkillMitra',
  reauthentication: 'Your SkillMitra verification code',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  email_change_current: EmailChangeEmail,
  email_change_new: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

const SAMPLE_DATA: Record<string, object> = {
  signup: {
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    recipient: 'user@example.com',
    confirmationUrl: `${SITE_URL}/auth/confirm?token_hash=sample&type=signup`,
  },
  magiclink: {
    siteName: SITE_NAME,
    confirmationUrl: `${SITE_URL}/auth/confirm?token_hash=sample&type=magiclink`,
  },
  recovery: {
    siteName: SITE_NAME,
    confirmationUrl: `${SITE_URL}/auth/confirm?token_hash=sample&type=recovery`,
  },
  invite: {
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    confirmationUrl: `${SITE_URL}/auth/confirm?token_hash=sample&type=invite`,
  },
  email_change: {
    siteName: SITE_NAME,
    email: 'old@example.com',
    newEmail: 'new@example.com',
    confirmationUrl: `${SITE_URL}/auth/confirm?token_hash=sample&type=email_change`,
  },
  reauthentication: {
    token: '123456',
  },
}

// Preview endpoint
async function handlePreview(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let type: string
  try {
    const body = await req.json()
    type = body.type
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const EmailTemplate = EMAIL_TEMPLATES[type]
  if (!EmailTemplate) {
    return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const sampleData = SAMPLE_DATA[type] || {}
  const html = await renderAsync(React.createElement(EmailTemplate, sampleData))

  return new Response(html, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  })
}

// Main hook handler — handles Lovable managed payload format
async function handleWebhook(req: Request): Promise<Response> {
  let payload: any
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log('Hook payload keys:', JSON.stringify(Object.keys(payload)))

  // ── Extract fields from Lovable managed format ──
  // Format: { event_id, run_id, type, data: { action_type, email, callback_url, token, url, ... } }
  const data = payload.data || {}
  const email = data.email || payload.user?.email || payload.email
  const actionType = data.action_type || payload.email_data?.email_action_type || payload.type
  const callbackUrl = data.callback_url
  const tokenHash = data.token_hash || payload.email_data?.token_hash
  const token = data.token || payload.email_data?.token
  const confirmUrl = data.url || ''
  const newEmail = data.new_email || payload.user?.new_email || ''
  const redirectTo = data.redirect_to || payload.email_data?.redirect_to || SITE_URL
  const runId = payload.run_id

  if (!email || !actionType) {
    console.error('Could not extract email or action_type from payload:', JSON.stringify(payload).slice(0, 1000))
    return new Response(JSON.stringify({ error: 'Invalid payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log('Processing auth email', { actionType, email })

  const EmailTemplate = EMAIL_TEMPLATES[actionType]
  if (!EmailTemplate) {
    console.error('Unknown email type:', actionType)
    return new Response(JSON.stringify({ error: `Unknown email type: ${actionType}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Build confirmation URL
  let confirmationUrl = confirmUrl
  if (!confirmationUrl && tokenHash) {
    confirmationUrl = `${SUPABASE_URL}/auth/v1/verify?token=${tokenHash}&type=${actionType}&redirect_to=${encodeURIComponent(redirectTo)}`
  }
  if (!confirmationUrl) {
    confirmationUrl = SITE_URL
  }

  // Build template props
  const templateProps = {
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    recipient: email,
    confirmationUrl,
    token: token || '',
    email,
    newEmail,
  }

  // Render email
  const html = await renderAsync(React.createElement(EmailTemplate, templateProps))
  const text = await renderAsync(React.createElement(EmailTemplate, templateProps), { plainText: true })

  const toEmail = actionType === 'email_change_new' ? (newEmail || email) : email
  const subject = EMAIL_SUBJECTS[actionType] || 'SkillMitra Notification'

  // ── Send via Lovable callback URL (managed flow) ──
  if (callbackUrl) {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const sendPayload = {
      run_id: runId,
      from: FROM_EMAIL,
      to: toEmail,
      subject,
      html,
      text,
    }

    console.log('Sending via callback URL', { callbackUrl, to: toEmail, subject })

    const sendRes = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendPayload),
    })

    const sendData = await sendRes.text()
    if (!sendRes.ok) {
      console.error('Callback send error', { status: sendRes.status, data: sendData })
      return new Response(JSON.stringify({ error: 'Failed to send email via callback' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Email sent via callback', { to: toEmail, type: actionType })
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // ── Fallback: send via Resend directly ──
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    console.error('No callback_url and no RESEND_API_KEY')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [toEmail],
      subject,
      html,
      text,
    }),
  })

  const resendData = await resendRes.json()
  if (!resendRes.ok) {
    console.error('Resend error', { status: resendRes.status, data: resendData })
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log('Email sent via Resend', { id: resendData.id, type: actionType, to: toEmail })
  return new Response(
    JSON.stringify({ success: true, email_id: resendData.id }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

Deno.serve(async (req) => {
  const url = new URL(req.url)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (url.pathname.endsWith('/preview')) {
    return handlePreview(req)
  }

  try {
    return await handleWebhook(req)
  } catch (error) {
    console.error('Unhandled error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})