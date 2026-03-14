/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { EmailLayout } from './email-layout.tsx'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <EmailLayout previewText="Your SkillMitra verification code">
    <Text style={h1}>Verification Code</Text>
    <Text style={text}>Use the code below to confirm your identity on SkillMitra:</Text>
    <Text style={codeBox}>{token}</Text>
    <Text style={footer}>
      This code expires shortly. If you didn't request this, you can
      safely ignore this email.
    </Text>
  </EmailLayout>
)

export default ReauthenticationEmail

const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0F172A', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#64748B', lineHeight: '1.6', margin: '0 0 16px' }
const codeBox = {
  fontFamily: 'Courier New, Courier, monospace',
  fontSize: '36px',
  fontWeight: 'bold' as const,
  color: '#1A56DB',
  letterSpacing: '8px',
  textAlign: 'center' as const,
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '16px',
  margin: '8px 0 24px',
}
const footer = { fontSize: '12px', color: '#94A3B8', margin: '16px 0 0' }
