/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Html,
  Img,
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
          <Img
            src="https://skillmitra.online/skillmitra-logo.png"
            alt="SkillMitra"
            width="140"
            height="40"
            style={logoImg}
          />
          <Text style={logoText}>
            Skill<span style={{ color: '#1A56DB' }}>Mitra</span>
          </Text>
          <Text style={taglineText}>Learn. Grow. Excel.</Text>
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
const headerSection = { backgroundColor: '#1A56DB', padding: '28px 32px', textAlign: 'center' as const }
const logoImg = { margin: '0 auto 12px', display: 'block', borderRadius: '12px' }
const logoText = { margin: '0', fontSize: '26px', fontWeight: '800' as const, color: '#ffffff', letterSpacing: '-0.5px' }
const taglineText = { margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.5px' }
const contentSection = { padding: '32px 32px 24px' }
const footerSection = { padding: '20px 32px 28px', borderTop: '1px solid #e5e7eb', textAlign: 'center' as const }
const footerText = { fontSize: '12px', color: '#9ca3af', margin: '0 0 4px' }
const footerLinks = { fontSize: '12px', color: '#9ca3af', margin: '0' }
const footerLink = { color: '#9ca3af', textDecoration: 'underline' }
