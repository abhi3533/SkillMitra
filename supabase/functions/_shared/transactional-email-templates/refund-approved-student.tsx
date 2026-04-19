/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Html, Preview, Section, Text, Button } from 'npm:@react-email/components@0.0.22'
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
    <Preview>Your refund has been approved</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ padding: '24px 0', textAlign: 'center' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>Skill</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#1A56DB' }}>Mitra</span>
        </Section>
        <Section style={{ padding: '0 32px 24px' }}>
          <Text style={h1}>🎉 Refund Approved</Text>
          <Text style={text}>Hi {studentName || 'there'},</Text>
          <Text style={text}>
            Good news — your refund of <strong>₹{Number(amount || 0).toLocaleString('en-IN')}</strong> for <strong>{courseTitle || 'your course'}</strong> has been approved and credited to your SkillMitra wallet.
          </Text>
          {adminNotes && (
            <div style={box}><Text style={noteText}><strong>Admin note:</strong> {adminNotes}</Text></div>
          )}
          <Button style={btn} href="https://skillmitra.online/student/wallet">View Wallet</Button>
          <Text style={muted}>You can use the wallet balance to book another trainer or course.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Refund Approved — ₹${Number(d.amount || 0).toLocaleString('en-IN')} credited to wallet`,
  displayName: 'Refund approved — student',
  previewData: { studentName: 'Rahul', courseTitle: 'React Basics', amount: 4999, adminNotes: 'Approved as per refund policy.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '20px', color: '#16a34a', fontWeight: 600, margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 12px' }
const box = { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px', margin: '12px 0' }
const noteText = { fontSize: '14px', color: '#166534', lineHeight: '1.6', margin: 0 }
const btn = { backgroundColor: '#1A56DB', color: '#fff', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', display: 'inline-block', margin: '8px 0' }
const muted = { fontSize: '13px', color: '#64748b', margin: '16px 0 0' }
