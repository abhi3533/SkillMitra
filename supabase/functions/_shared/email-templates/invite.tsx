/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Text } from 'npm:@react-email/components@0.0.22'
import { EmailLayout } from './email-layout.tsx'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <EmailLayout previewText="You've been invited to join SkillMitra">
    <Text style={h1}>You've Been Invited</Text>
    <Text style={text}>
      You've been invited to join SkillMitra — India's #1 platform for
      personalised 1:1 training with verified expert trainers. Click the button
      below to accept and create your account.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Accept Invitation
    </Button>
    <Text style={footer}>
      If you weren't expecting this invitation, you can safely ignore this
      email.
    </Text>
  </EmailLayout>
)

export default InviteEmail

const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0F172A', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#64748B', lineHeight: '1.6', margin: '0 0 16px' }
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
