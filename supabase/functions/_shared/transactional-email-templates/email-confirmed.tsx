/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SkillMitra'
const SITE_URL = 'https://www.skillmitra.online'

interface Props {
  name?: string
}

const EmailConfirmedEmail = ({ name }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your email is confirmed — start browsing trainers on {SITE_NAME}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%' }}>
            <tr>
              <td style={{ textAlign: 'center', padding: '28px 0 20px 0' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, fontFamily, color: '#0F172A' }}>Skill</span>
                <span style={{ fontSize: '24px', fontWeight: 700, fontFamily, color: '#1A56DB' }}>Mitra</span>
              </td>
            </tr>
          </table>
        </Section>
        <Section style={contentSection}>
          <Text style={h3}>Email confirmed{name ? `, ${name}` : ''}! ✅</Text>
          <Text style={text}>
            Your email address has been successfully verified. You're all set to explore {SITE_NAME} and find the perfect trainer for your learning goals.
          </Text>
          <div style={tipBox}>
            <Text style={tipText}>💡 <strong>What's next?</strong> Browse our verified trainers, book a free trial session, and start learning 1-on-1 with an industry expert.</Text>
          </div>
          <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%', margin: '24px 0' }}>
            <tr>
              <td style={{ textAlign: 'center' }}>
                <Button href={`${SITE_URL}/browse`} style={button}>
                  Browse Trainers
                </Button>
              </td>
            </tr>
          </table>
        </Section>
        <Section style={footerSection}>
          <Text style={footerHelpText}>
            Questions? Reply to this email or contact us at{' '}
            <Link href="mailto:contact@skillmitra.online" style={footerLink}>contact@skillmitra.online</Link>
            {' | '}
            <Link href={SITE_URL} style={footerLink}>skillmitra.online</Link>
          </Text>
          <Text style={footerCopyright}>© {new Date().getFullYear()} Learnvate Solutions. All rights reserved.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: EmailConfirmedEmail,
  subject: 'Your email is confirmed! Start browsing trainers on SkillMitra',
  displayName: 'Email confirmed (student)',
  previewData: { name: 'Priya' },
} satisfies TemplateEntry

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const main = { backgroundColor: '#ffffff', fontFamily }
const container = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff' }
const headerSection = { backgroundColor: '#ffffff', padding: '0', textAlign: 'center' as const }
const contentSection = { padding: '0 32px 24px' }
const footerSection = { padding: '20px 32px 28px', borderTop: '1px solid #e5e7eb', textAlign: 'center' as const }
const h3 = { margin: '0 0 16px', fontSize: '20px', color: '#111', fontWeight: '600' as const }
const text = { fontSize: '15px', color: '#444', lineHeight: '1.6', margin: '0 0 16px' }
const tipBox = { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const tipText = { fontSize: '14px', color: '#1e40af', margin: '0', lineHeight: '1.5' }
const button = { backgroundColor: '#1A56DB', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none', display: 'inline-block' }
const footerHelpText = { fontSize: '12px', color: '#9ca3af', margin: '0 0 8px' }
const footerLink = { color: '#9ca3af', textDecoration: 'underline' }
const footerCopyright = { fontSize: '12px', color: '#9ca3af', margin: '0' }
