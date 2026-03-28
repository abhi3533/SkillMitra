/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  email?: string
  phone?: string
  subject?: string
  message?: string
}

const ContactAdminNotifyEmail = ({ name, email, phone, subject, message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact form submission from {name || 'a visitor'}</Preview>
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
          <Text style={h3}>📩 New Contact Form Submission</Text>
          <div style={detailBox}>
            <Text style={detailRow}><strong>Name:</strong> {name || '—'}</Text>
            <Text style={detailRow}><strong>Email:</strong> {email || '—'}</Text>
            {phone && <Text style={detailRow}><strong>Phone:</strong> {phone}</Text>}
            <Text style={detailRow}><strong>Subject:</strong> {subject || '—'}</Text>
          </div>
          <Hr style={{ borderColor: '#e5e7eb', margin: '16px 0' }} />
          <Text style={labelText}>Message:</Text>
          <div style={messageBox}>
            <Text style={messageText}>{message || '—'}</Text>
          </div>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactAdminNotifyEmail,
  subject: (data: Record<string, any>) => `New Contact: ${data.subject || 'No subject'}`,
  displayName: 'Contact admin notification',
  to: 'contact@skillmitra.online',
  previewData: { name: 'Rahul Kumar', email: 'rahul@example.com', phone: '+91 98765 43210', subject: 'Partnership inquiry', message: 'I would like to discuss a potential partnership with SkillMitra for our college students.' },
} satisfies TemplateEntry

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const main = { backgroundColor: '#ffffff', fontFamily }
const container = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff' }
const headerSection = { backgroundColor: '#ffffff', padding: '0', textAlign: 'center' as const }
const contentSection = { padding: '0 32px 24px' }
const h3 = { margin: '0 0 16px', fontSize: '20px', color: '#111', fontWeight: '600' as const }
const detailBox = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '0 0 16px' }
const detailRow = { fontSize: '14px', color: '#334155', margin: '0 0 8px', lineHeight: '1.5' }
const labelText = { fontSize: '13px', color: '#64748b', fontWeight: '600' as const, margin: '0 0 8px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const messageBox = { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px' }
const messageText = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0', whiteSpace: 'pre-wrap' as const }
