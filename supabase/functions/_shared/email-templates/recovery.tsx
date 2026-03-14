/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Text } from 'npm:@react-email/components@0.0.22'
import { EmailLayout } from './email-layout.tsx'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <EmailLayout previewText="Reset your SkillMitra password">
    <Text style={h1}>Reset Your Password</Text>
    <Text style={text}>
      We received a request to reset your SkillMitra password. Click the
      button below to choose a new password.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Reset Password
    </Button>
    <Text style={footer}>
      If you didn't request a password reset, you can safely ignore this
      email. Your password will not be changed.
    </Text>
  </EmailLayout>
)

export default RecoveryEmail

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
