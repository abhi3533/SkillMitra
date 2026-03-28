/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SkillMitra'
const SITE_URL = 'https://www.skillmitra.online'

interface Props {
  studentName?: string
  courseName?: string
  trainerName?: string
  amountPaid?: string
}

const EnrollmentConfirmationEmail = ({ studentName, courseName, trainerName, amountPaid }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're enrolled! {courseName || 'Your course'} starts soon</Preview>
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
          <Text style={h3}>🎉 Enrollment Confirmed!</Text>
          <Text style={text}>
            {studentName ? `Hi ${studentName}, you` : 'You'} have been successfully enrolled in <strong>{courseName || 'your course'}</strong>.
          </Text>
          <div style={detailBox}>
            {courseName && <Text style={detailRow}><strong>Course:</strong> {courseName}</Text>}
            {trainerName && <Text style={detailRow}><strong>Trainer:</strong> {trainerName}</Text>}
            {amountPaid && <Text style={detailRow}><strong>Amount Paid:</strong> ₹{amountPaid}</Text>}
          </div>
          <Text style={text}>
            Your trainer will schedule sessions shortly. You can view your upcoming sessions in your dashboard.
          </Text>
          <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%', margin: '24px 0' }}>
            <tr>
              <td style={{ textAlign: 'center' }}>
                <Button href={`${SITE_URL}/student/dashboard`} style={button}>
                  Go to Dashboard
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
  component: EnrollmentConfirmationEmail,
  subject: (data: Record<string, any>) => `Enrollment confirmed — ${data.courseName || 'Your course'}`,
  displayName: 'Enrollment confirmation',
  previewData: { studentName: 'Priya', courseName: 'Full-Stack Web Development', trainerName: 'Rahul Kumar', amountPaid: '4,999' },
} satisfies TemplateEntry

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const main = { backgroundColor: '#ffffff', fontFamily }
const container = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff' }
const headerSection = { backgroundColor: '#ffffff', padding: '0', textAlign: 'center' as const }
const contentSection = { padding: '0 32px 24px' }
const footerSection = { padding: '20px 32px 28px', borderTop: '1px solid #e5e7eb', textAlign: 'center' as const }
const h3 = { margin: '0 0 16px', fontSize: '20px', color: '#111', fontWeight: '600' as const }
const text = { fontSize: '15px', color: '#444', lineHeight: '1.6', margin: '0 0 16px' }
const detailBox = { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const detailRow = { fontSize: '14px', color: '#1e40af', margin: '0 0 8px', lineHeight: '1.5' }
const button = { backgroundColor: '#1A56DB', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none', display: 'inline-block' }
const footerHelpText = { fontSize: '12px', color: '#9ca3af', margin: '0 0 8px' }
const footerLink = { color: '#9ca3af', textDecoration: 'underline' }
const footerCopyright = { fontSize: '12px', color: '#9ca3af', margin: '0' }
