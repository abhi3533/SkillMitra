/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  trainerName?: string
  studentName?: string
  courseTitle?: string
  amount?: number
  adminNotes?: string
}

const Email = ({ trainerName, studentName, courseTitle, amount, adminNotes }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>A refund was approved for one of your enrollments</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ padding: '24px 0', textAlign: 'center' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>Skill</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#1A56DB' }}>Mitra</span>
        </Section>
        <Section style={{ padding: '0 32px 24px' }}>
          <Text style={h1}>Refund Approved by Admin</Text>
          <Text style={text}>Hi {trainerName || 'Trainer'},</Text>
          <Text style={text}>
            The admin team has approved a refund of <strong>₹{Number(amount || 0).toLocaleString('en-IN')}</strong> requested by <strong>{studentName || 'a student'}</strong> for <strong>{courseTitle || 'your course'}</strong>.
          </Text>
          <Text style={text}>
            <strong>What this means:</strong> The amount has been deducted from your wallet and refunded to the student. All upcoming sessions for this enrollment have been cancelled.
          </Text>
          {adminNotes && (
            <div style={box}><Text style={noteText}><strong>Admin note:</strong> {adminNotes}</Text></div>
          )}
          <Text style={muted}>If you believe this was processed in error, please contact contact@skillmitra.online.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Refund Approved — ₹${Number(d.amount || 0).toLocaleString('en-IN')} deducted`,
  displayName: 'Refund approved — trainer',
  previewData: { trainerName: 'Priya', studentName: 'Rahul Kumar', courseTitle: 'React Basics', amount: 4999, adminNotes: 'Approved.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '20px', color: '#dc2626', fontWeight: 600, margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 12px' }
const box = { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px', margin: '12px 0' }
const noteText = { fontSize: '14px', color: '#991b1b', lineHeight: '1.6', margin: 0 }
const muted = { fontSize: '13px', color: '#64748b', margin: '16px 0 0' }
