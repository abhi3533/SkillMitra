/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

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
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}><span style={{color:'#0F172A'}}>Skill</span><span style={{color:'#1A56DB'}}>Mitra</span></Text>
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>!
        </Text>
        <Text style={text}>
          Please confirm your email address ({recipient}) by clicking the button below:
        </Text>
        <Button style={button} href={confirmationUrl}>Verify Email</Button>
        <Text style={footer}>If you didn't create an account, you can safely ignore this email.</Text>
        <Text style={footerBrand}>Questions? Reply to this email or contact us at contact@skillmitra.online | skillmitra.online</Text>
        <Text style={footerCopy}>© 2026 Learnvate Solutions. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const logo = { fontSize: '24px', fontWeight: 'bold' as const, margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0F172A', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#64748B', lineHeight: '1.5', margin: '0 0 25px' }
const link = { color: '#1A56DB', textDecoration: 'underline' }
const button = { backgroundColor: '#1A56DB', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '30px 0 0' }
const footerBrand = { fontSize: '11px', color: '#94A3B8', margin: '16px 0 0' }
const footerCopy = { fontSize: '11px', color: '#94A3B8', margin: '4px 0 0' }
