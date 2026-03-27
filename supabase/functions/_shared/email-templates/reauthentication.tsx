/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <span style={logoSkill}>Skill</span>
          <span style={logoMitra}>Mitra</span>
        </div>
        <Text style={h1}>Confirm reauthentication</Text>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can
          safely ignore this email.
        </Text>
        <div style={footerSection}>
          <Text style={footerHelp}>
            Questions? Reply to this email or contact us at{' '}
            <Link href="mailto:contact@skillmitra.online" style={footerLink}>contact@skillmitra.online</Link>
            {' | '}
            <Link href="https://skillmitra.online" style={footerLink}>skillmitra.online</Link>
          </Text>
          <Text style={footerCopy}>© {new Date().getFullYear()} Learnvate Solutions Private Limited. All rights reserved.</Text>
        </div>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const header = { textAlign: 'center' as const, marginBottom: '28px' }
const logoSkill = { fontSize: '24px', fontWeight: 700 as const, color: '#0F172A' }
const logoMitra = { fontSize: '24px', fontWeight: 700 as const, color: '#1A56DB' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#444', lineHeight: '1.6', margin: '0 0 16px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '22px', fontWeight: 'bold' as const, color: '#0F172A', margin: '0 0 30px' }
const footer = { fontSize: '13px', color: '#888', margin: '24px 0 0' }
const footerSection = { marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'center' as const }
const footerHelp = { fontSize: '12px', color: '#9ca3af', margin: '0 0 8px' }
const footerLink = { color: '#9ca3af', textDecoration: 'underline' }
const footerCopy = { fontSize: '12px', color: '#9ca3af', margin: '0' }
