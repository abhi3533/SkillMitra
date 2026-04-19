/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  trainerName?: string
  studentName?: string
  courseTitle?: string
  amount?: number
  reason?: string
}

const Email = ({ trainerName, studentName, courseTitle, amount, reason }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>A student has requested a refund for your course</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ padding: '24px 0', textAlign: 'center' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>Skill</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#1A56DB' }}>Mitra</span>
        </Section>
        <Section style={{ padding: '0 32px 24px' }}>
          <Text style={h1}>Refund Request Received</Text>
          <Text style={text}>Hi {trainerName || 'Trainer'},</Text>
          <Text style={text}>
            <strong>{studentName || 'A student'}</strong> has requested a refund for <strong>{courseTitle || 'your course'}</strong> (₹{Number(amount || 0).toLocaleString('en-IN')}).
          </Text>
          <Text style={text}>
            Our admin team will review the request. <strong>No money has moved yet</strong> — your wallet remains unchanged until a decision is made.
          </Text>
          {reason && (
            <div style={box}>
              <Text style={label}>Reason given:</Text>
              <Text style={reasonText}>{reason}</Text>
            </div>
          )}
          <Text style={muted}>You'll receive another email once the request is approved or rejected.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Refund request received — under review',
  displayName: 'Refund requested — trainer',
  previewData: { trainerName: 'Priya', studentName: 'Rahul Kumar', courseTitle: 'React Basics', amount: 4999, reason: 'Schedule conflict.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '20px', color: '#111', fontWeight: 600, margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 12px' }
const box = { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '14px', margin: '12px 0' }
const label = { fontSize: '12px', color: '#64748b', fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase' as const }
const reasonText = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: 0 }
const muted = { fontSize: '13px', color: '#64748b', margin: '16px 0 0' }
