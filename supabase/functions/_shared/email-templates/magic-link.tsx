/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Text } from 'npm:@react-email/components@0.0.22'
import { EmailLayout } from './email-layout.tsx'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <EmailLayout previewText="Your SkillMitra login link">
    <Text style={h1}>Your Login Link</Text>
    <Text style={text}>
      Click the button below to log in to SkillMitra. This link will expire
      shortly for your security.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Log In to SkillMitra
    </Button>
    <Text style={footer}>
      If you didn't request this link, you can safely ignore this email.
    </Text>
  </EmailLayout>
)

export default MagicLinkEmail

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
