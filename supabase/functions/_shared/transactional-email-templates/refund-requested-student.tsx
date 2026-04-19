/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  studentName?: string
  courseTitle?: string
  amount?: number
}

const Email = ({ studentName, courseTitle, amount }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your refund request</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ padding: '24px 0', textAlign: 'center' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>Skill</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#1A56DB' }}>Mitra</span>
        </Section>
        <Section style={{ padding: '0 32px 24px' }}>
          <Text style={h1}>✅ Refund Request Received</Text>
          <Text style={text}>Hi {studentName || 'there'},</Text>
          <Text style={text}>
            We've received your refund request of <strong>₹{Number(amount || 0).toLocaleString('en-IN')}</strong> for <strong>{courseTitle || 'your course'}</strong>.
          </Text>
          <Text style={text}>
            Our admin team will review your request within <strong>1–2 business days</strong>. You'll get another email with their decision.
          </Text>
          <Text style={muted}>If approved, the amount will be credited to your wallet automatically.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'We received your refund request',
  displayName: 'Refund requested — student',
  previewData: { studentName: 'Rahul', courseTitle: 'React Basics', amount: 4999 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '20px', color: '#111', fontWeight: 600, margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 12px' }
const muted = { fontSize: '13px', color: '#64748b', margin: '16px 0 0' }
