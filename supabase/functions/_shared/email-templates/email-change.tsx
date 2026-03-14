/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Link, Text } from 'npm:@react-email/components@0.0.22'
import { EmailLayout } from './email-layout.tsx'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <EmailLayout previewText="Confirm your email change on SkillMitra">
    <Text style={h1}>Confirm Email Change</Text>
    <Text style={text}>
      You requested to change your SkillMitra email from{' '}
      <Link href={`mailto:${email}`} style={link}>
        {email}
      </Link>{' '}
      to{' '}
      <Link href={`mailto:${newEmail}`} style={link}>
        {newEmail}
      </Link>
      .
    </Text>
    <Text style={text}>
      Click the button below to confirm this change:
    </Text>
    <Button style={button} href={confirmationUrl}>
      Confirm Email Change
    </Button>
    <Text style={footer}>
      If you didn't request this change, please secure your account
      immediately by contacting{' '}
      <Link href="mailto:contact@skillmitra.online" style={link}>
        contact@skillmitra.online
      </Link>
      .
    </Text>
  </EmailLayout>
)

export default EmailChangeEmail

const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0F172A', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#64748B', lineHeight: '1.6', margin: '0 0 16px' }
const link = { color: '#1A56DB', textDecoration: 'underline' }
const button = {
  backgroundColor: '#1A56DB',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '12px 28px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '8px 0 20px',
}
const footer = { fontSize: '12px', color: '#94A3B8', margin: '16px 0 0' }
