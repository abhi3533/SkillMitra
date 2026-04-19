/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_URL = 'https://www.skillmitra.online'

interface Props {
  trainerName?: string
  studentName?: string
  courseName?: string
  firstSessionAt?: string
  trainerPayout?: string
}

const EnrollmentTrainerNotifyEmail = ({ trainerName, studentName, courseName, firstSessionAt, trainerPayout }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New enrollment! {studentName || 'A student'} just enrolled in {courseName || 'your course'}</Preview>
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
          <Text style={h3}>💰 New Enrollment Confirmed!</Text>
          <Text style={text}>
            {trainerName ? `Hi ${trainerName}, great news!` : 'Great news!'} <strong>{studentName || 'A student'}</strong> has just enrolled in your course <strong>{courseName || 'your course'}</strong>.
          </Text>
          <div style={detailBox}>
            {studentName && <Text style={detailRow}><strong>Student:</strong> {studentName}</Text>}
            {courseName && <Text style={detailRow}><strong>Course:</strong> {courseName}</Text>}
            {firstSessionAt && <Text style={detailRow}><strong>First Session:</strong> {firstSessionAt}</Text>}
            {trainerPayout && <Text style={detailRow}><strong>Your Earning:</strong> ₹{trainerPayout}</Text>}
          </div>
          <Text style={text}>
            Sessions have been scheduled and added to your dashboard. The earning has been credited to your wallet.
          </Text>
          <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%', margin: '24px 0' }}>
            <tr>
              <td style={{ textAlign: 'center' }}>
                <Button href={`${SITE_URL}/trainer/sessions`} style={button}>
                  View Sessions
                </Button>
              </td>
            </tr>
          </table>
          <Text style={tip}>
            💡 <strong>Tip:</strong> Reach out to your new student before the first session to introduce yourself and set expectations.
          </Text>
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
  component: EnrollmentTrainerNotifyEmail,
  subject: (data: Record<string, any>) => `New enrollment — ${data.studentName || 'A student'} joined ${data.courseName || 'your course'}`,
  displayName: 'Enrollment — trainer notify',
  previewData: { trainerName: 'Rahul', studentName: 'Priya Sharma', courseName: 'Full-Stack Web Development', firstSessionAt: '25 Apr 2026, 6:00 PM IST', trainerPayout: '4,499' },
} satisfies TemplateEntry

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const main = { backgroundColor: '#ffffff', fontFamily }
const container = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff' }
const headerSection = { backgroundColor: '#ffffff', padding: '0', textAlign: 'center' as const }
const contentSection = { padding: '0 32px 24px' }
const footerSection = { padding: '20px 32px 28px', borderTop: '1px solid #e5e7eb', textAlign: 'center' as const }
const h3 = { margin: '0 0 16px', fontSize: '20px', color: '#111', fontWeight: '600' as const }
const text = { fontSize: '15px', color: '#444', lineHeight: '1.6', margin: '0 0 16px' }
const detailBox = { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const detailRow = { fontSize: '14px', color: '#166534', margin: '0 0 8px', lineHeight: '1.5' }
const button = { backgroundColor: '#1A56DB', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none', display: 'inline-block' }
const tip = { fontSize: '13px', color: '#666', lineHeight: '1.6', margin: '16px 0 0', padding: '12px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }
const footerHelpText = { fontSize: '12px', color: '#9ca3af', margin: '0 0 8px' }
const footerLink = { color: '#9ca3af', textDecoration: 'underline' }
const footerCopyright = { fontSize: '12px', color: '#9ca3af', margin: '0' }
