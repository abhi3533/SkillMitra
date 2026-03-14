/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Link, Text } from 'npm:@react-email/components@0.0.22'
import { EmailLayout } from './email-layout.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <EmailLayout previewText="Verify your email to get started on SkillMitra">
    <Text style={h1}>Welcome to SkillMitra</Text>
    <Text style={text}>
      Thank you for signing up! You're one step away from accessing
      verified expert trainers for personalised 1:1 training.
    </Text>
    <Text style={text}>
      Please verify your email address (
      <Link href={`mailto:${recipient}`} style={link}>
        {recipient}
      </Link>
      ) to activate your account:
    </Text>
    <Button style={button} href={confirmationUrl}>
      Verify Email Address
    </Button>
    <Text style={footer}>
      If you didn't create an account on SkillMitra, you can safely ignore
      this email.
    </Text>
  </EmailLayout>
)

export default SignupEmail

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
