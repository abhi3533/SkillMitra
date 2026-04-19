/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  studentName?: string
  courseTitle?: string
  amount?: number
  adminNotes?: string
}

const Email = ({ studentName, courseTitle, amount, adminNotes }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Update on your refund request</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ padding: '24px 0', textAlign: 'center' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>Skill</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#1A56DB' }}>Mitra</span>
        </Section>
        <Section style={{ padding: '0 32px 24px' }}>
          <Text style={h1}>Refund Request Update</Text>
          <Text style={text}>Hi {studentName || 'there'},</Text>
          <Text style={text}>
            After review, your refund request of <strong>₹{Number(amount || 0).toLocaleString('en-IN')}</strong> for <strong>{courseTitle || 'your course'}</strong> could not be approved at this time.
          </Text>
          <div style={box}>
            <Text style={label}>Reason from our admin team:</Text>
            <Text style={reasonText}>{adminNotes || 'Please contact support for more details.'}</Text>
          </div>
          <Text style={text}>
            Your enrollment is still active and your sessions will continue as scheduled.
          </Text>
          <Text style={muted}>If you have questions or want to appeal, reply to this email or reach out at contact@skillmitra.online.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Update on your refund request',
  displayName: 'Refund rejected — student',
  previewData: { studentName: 'Rahul', courseTitle: 'React Basics', amount: 4999, adminNotes: 'You have already attended 3 sessions which is above our refund threshold.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '20px', color: '#111', fontWeight: 600, margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 12px' }
const box = { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px', margin: '12px 0' }
const label = { fontSize: '12px', color: '#991b1b', fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase' as const }
const reasonText = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' as const }
const muted = { fontSize: '13px', color: '#64748b', margin: '16px 0 0' }
