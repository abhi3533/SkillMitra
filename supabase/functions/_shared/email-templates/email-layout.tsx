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
          {/* Graduation cap + SkillMitra text — matches navbar */}
          <table cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: '0 auto' }}>
            <tr>
              <td style={{ verticalAlign: 'middle', paddingRight: '8px' }}>
                {/* Graduation cap icon as inline SVG data URI for max compatibility */}
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z' fill='white'/%3E%3C/svg%3E"
                  alt=""
                  width="28"
                  height="28"
                  style={{ display: 'block' }}
                />
              </td>
              <td style={{ verticalAlign: 'middle' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                  <span style={{ color: '#ffffff' }}>Skill</span>
                  <span style={{ color: '#BFDBFE' }}>Mitra</span>
                </span>
              </td>
            </tr>
          </table>
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
const taglineText = { margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.5px' }
const contentSection = { padding: '32px 32px 24px' }
const footerSection = { padding: '20px 32px 28px', borderTop: '1px solid #e5e7eb', textAlign: 'center' as const }
const footerText = { fontSize: '12px', color: '#9ca3af', margin: '0 0 4px' }
const footerLinks = { fontSize: '12px', color: '#9ca3af', margin: '0' }
const footerLink = { color: '#9ca3af', textDecoration: 'underline' }
