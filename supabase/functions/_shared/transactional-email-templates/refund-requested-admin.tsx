/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Html, Preview, Section, Text, Hr, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  studentName?: string
  trainerName?: string
  courseTitle?: string
  amount?: number
  reason?: string
  enrollmentId?: string
  reviewUrl?: string
}

const Email = ({ studentName, trainerName, courseTitle, amount, reason, enrollmentId, reviewUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New refund request awaiting your approval</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ padding: '24px 0', textAlign: 'center' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>Skill</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#1A56DB' }}>Mitra</span>
        </Section>
        <Section style={{ padding: '0 32px 24px' }}>
          <Text style={h1}>💰 Refund Request — Review Required</Text>
          <Text style={text}>A student has requested a refund. Please review and approve or reject.</Text>
          <div style={box}>
            <Text style={row}><strong>Student:</strong> {studentName || '—'}</Text>
            <Text style={row}><strong>Trainer:</strong> {trainerName || '—'}</Text>
            <Text style={row}><strong>Course:</strong> {courseTitle || '—'}</Text>
            <Text style={row}><strong>Amount:</strong> ₹{Number(amount || 0).toLocaleString('en-IN')}</Text>
            <Text style={row}><strong>Enrollment ID:</strong> {enrollmentId || '—'}</Text>
          </div>
          {reason && (
            <>
              <Text style={label}>Student's Reason:</Text>
              <div style={reasonBox}><Text style={reasonText}>{reason}</Text></div>
            </>
          )}
          <Hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />
          <Button style={btn} href={reviewUrl || 'https://skillmitra.online/admin/refunds'}>Review Request</Button>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Refund Request: ₹${Number(d.amount || 0).toLocaleString('en-IN')} — ${d.courseTitle || 'Course'}`,
  displayName: 'Refund requested — admin',
  to: 'contact@skillmitra.online',
  previewData: { studentName: 'Rahul Kumar', trainerName: 'Priya Sharma', courseTitle: 'React Basics', amount: 4999, reason: 'Schedule conflict, cannot continue.', enrollmentId: 'abc-123', reviewUrl: 'https://skillmitra.online/admin/refunds' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '20px', color: '#111', fontWeight: 600, margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const box = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }
const row = { fontSize: '14px', color: '#334155', margin: '0 0 8px', lineHeight: '1.5' }
const label = { fontSize: '13px', color: '#64748b', fontWeight: 600, margin: '16px 0 8px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const reasonBox = { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '14px' }
const reasonText = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' as const }
const btn = { backgroundColor: '#1A56DB', color: '#fff', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }
