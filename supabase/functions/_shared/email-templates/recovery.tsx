/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}><span style={{color:'#0F172A'}}>Skill</span><span style={{color:'#1A56DB'}}>Mitra</span></Text>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>We received a request to reset your password for {siteName}. Click the button below to choose a new password.</Text>
        <Button style={button} href={confirmationUrl}>Reset Password</Button>
        <Text style={footer}>If you didn't request a password reset, you can safely ignore this email.</Text>
        <Text style={footerBrand}>Questions? Reply to this email or contact us at contact@skillmitra.online | skillmitra.online</Text>
        <Text style={footerCopy}>© 2026 Learnvate Solutions. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const logo = { fontSize: '24px', fontWeight: 'bold' as const, margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0F172A', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#64748B', lineHeight: '1.5', margin: '0 0 25px' }
const button = { backgroundColor: '#1A56DB', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '30px 0 0' }
const footerBrand = { fontSize: '11px', color: '#94A3B8', margin: '16px 0 0' }
const footerCopy = { fontSize: '11px', color: '#94A3B8', margin: '4px 0 0' }
