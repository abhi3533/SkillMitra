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
    'authorization, x-client-info, apikey, content-type',
}

// Branding / sender config
const SITE_NAME = 'SkillMitra'
const SITE_URL = 'https://skillmitra.online'
const FROM_EMAIL = 'SkillMitra <contact@skillmitra.online>'
const SUPABASE_URL = 'https://gxrxyjjvlicuphoubbdv.supabase.co'

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

// Preview sample data (non-production use only)
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

// Verify the request is from Supabase Auth Hook using the shared secret
function verifyAuth(req: Request): boolean {
  const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')
  if (!hookSecret) return false
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${hookSecret}`
}

// Preview endpoint — returns rendered HTML (requires SEND_EMAIL_HOOK_SECRET)
async function handlePreview(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (!verifyAuth(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
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

// Main hook handler — called by Supabase Auth when sending auth emails
async function handleWebhook(req: Request): Promise<Response> {
  if (!verifyAuth(req)) {
    console.error('Unauthorized hook request')
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Supabase Send Email Hook payload: { user, email_data }
  const user = payload.user
  const emailData = payload.email_data

  if (!user?.email || !emailData?.email_action_type) {
    console.error('Invalid hook payload: missing user.email or email_data.email_action_type')
    return new Response(JSON.stringify({ error: 'Invalid payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const emailType = emailData.email_action_type
  console.log('Auth hook received', { emailType, email: user.email })

  const EmailTemplate = EMAIL_TEMPLATES[emailType]
  if (!EmailTemplate) {
    console.error('Unknown email type', { emailType })
    return new Response(JSON.stringify({ error: `Unknown email type: ${emailType}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Build confirmation URL from token_hash (Supabase Auth verify endpoint)
  const redirectTo = emailData.redirect_to || SITE_URL
  const confirmationUrl = emailData.token_hash
    ? `${SUPABASE_URL}/auth/v1/verify?token=${emailData.token_hash}&type=${emailType}&redirect_to=${encodeURIComponent(redirectTo)}`
    : redirectTo

  // Build template props
  const templateProps = {
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    recipient: user.email,
    confirmationUrl,
    token: emailData.token,            // OTP for reauthentication
    email: user.email,
    newEmail: user.new_email || emailData.new_email || '',
  }

  // Render React Email templates
  const html = await renderAsync(React.createElement(EmailTemplate, templateProps))
  const text = await renderAsync(React.createElement(EmailTemplate, templateProps), {
    plainText: true,
  })

  // Determine recipient (email_change_new → send to new email)
  const toEmail = emailType === 'email_change_new'
    ? (user.new_email || emailData.new_email || user.email)
    : user.email

  // Send via Resend
  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: EMAIL_SUBJECTS[emailType] || 'SkillMitra Notification',
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

  console.log('Email sent', { id: resendData.id, type: emailType, to: toEmail })

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
