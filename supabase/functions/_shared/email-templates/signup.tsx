/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
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
    <Preview>Verify your email to get started on SkillMitra</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://huszmetnqxrividclgad.supabase.co/storage/v1/object/public/email-assets/skillmitra-logo.png"
          alt="SkillMitra"
          width="140"
          height="auto"
          style={{ marginBottom: '24px' }}
        />
        <Heading style={h1}>Welcome to SkillMitra</Heading>
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
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 28px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#0F172A',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#64748B',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const link = { color: '#1A56DB', textDecoration: 'underline' }
const button = {
  backgroundColor: '#1A56DB',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#94A3B8', margin: '32px 0 0' }
