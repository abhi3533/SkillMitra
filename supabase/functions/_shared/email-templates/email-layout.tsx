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
          <div style={{ textAlign: 'center', padding: '24px 0 16px 0' }}>
            <span style={{ fontSize: '26px', fontWeight: 900, fontFamily: 'Arial,sans-serif', color: '#0f172a' }}>Skill</span><span style={{ fontSize: '26px', fontWeight: 900, fontFamily: 'Arial,sans-serif', color: '#1A56DB' }}>Mitra</span>
          </div>
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
