/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailLayoutProps {
  previewText: string
  children: React.ReactNode
}

const SITE_URL = 'https://skillmitra.online'

export const EmailLayout = ({ previewText, children }: EmailLayoutProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{previewText}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Brand header */}
        <Section style={headerSection}>
          <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%' }}>
            <tr>
              <td style={{ textAlign: 'center', padding: '28px 0 8px 0' }}>
                {/* Graduation cap SVG */}
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='%231A56DB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z'/%3E%3Cpath d='M22 10v6'/%3E%3Cpath d='M6 12.5V16a6 3 0 0 0 12 0v-3.5'/%3E%3C/svg%3E"
                  alt=""
                  width="36"
                  height="36"
                  style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}
                />
                <span style={{ fontSize: '30px', fontWeight: 900, fontFamily: 'Arial,sans-serif', color: '#0F172A', verticalAlign: 'middle' }}>Skill</span>
                <span style={{ fontSize: '30px', fontWeight: 900, fontFamily: 'Arial,sans-serif', color: '#1A56DB', verticalAlign: 'middle' }}>Mitra</span>
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center', paddingBottom: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'Arial,sans-serif', color: '#64748B', letterSpacing: '0.3px' }}>Find Your Trainer in 30 Minutes</span>
              </td>
            </tr>
          </table>
        </Section>

        {/* Main content */}
        <Section style={contentSection}>
          {children}
        </Section>

        {/* Footer */}
        <Section style={footerSection}>
          <Text style={footerText}>
            © {new Date().getFullYear()} SkillMitra · Learnvate Solutions Pvt. Ltd.
          </Text>
          <Text style={footerLinks}>
            <Link href={SITE_URL} style={footerLink}>skillmitra.online</Link>
            {' · '}
            <Link href="mailto:contact@skillmitra.online" style={footerLink}>contact@skillmitra.online</Link>
            {' · '}
            <Link href={`${SITE_URL}/privacy`} style={footerLink}>Privacy</Link>
            {' · '}
            <Link href={`${SITE_URL}/terms`} style={footerLink}>Terms</Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailLayout

const main = { backgroundColor: '#f8fafc', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden' }
const headerSection = { backgroundColor: '#ffffff', padding: '0', textAlign: 'center' as const }
const contentSection = { padding: '32px 32px 24px' }
const footerSection = { padding: '20px 32px 28px', borderTop: '1px solid #e5e7eb', textAlign: 'center' as const }
const footerText = { fontSize: '12px', color: '#9ca3af', margin: '0 0 4px' }
const footerLinks = { fontSize: '12px', color: '#9ca3af', margin: '0' }
const footerLink = { color: '#9ca3af', textDecoration: 'underline' }
