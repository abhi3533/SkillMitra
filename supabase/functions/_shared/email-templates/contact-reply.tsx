/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Link, Text } from 'npm:@react-email/components@0.0.22'
import { EmailLayout } from './email-layout.tsx'

interface ContactReplyEmailProps {
  name: string
  subject: string
}

export const ContactReplyEmail = ({ name, subject }: ContactReplyEmailProps) => (
  <EmailLayout previewText={`We've received your message — SkillMitra`}>
    <Text style={h3}>Thanks for reaching out, {name}!</Text>
    <Text style={text}>
      We've received your message and will get back to you within <strong>24 hours</strong>.
    </Text>
    <div style={subjectBox}>
      <Text style={subjectText}>Your subject: {subject}</Text>
    </div>
    <Text style={text}>
      For urgent matters, email us directly at{' '}
      <Link href="mailto:contact@skillmitra.online" style={link}>
        contact@skillmitra.online
      </Link>
      .
    </Text>
  </EmailLayout>
)

export default ContactReplyEmail

const h3 = { margin: '0 0 16px', fontSize: '20px', color: '#0F172A', fontWeight: '600' as const }
const text = { fontSize: '15px', color: '#64748B', lineHeight: '1.6', margin: '0 0 16px' }
const subjectBox = { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const subjectText = { fontSize: '13px', color: '#1A56DB', margin: '0', fontWeight: '600' as const }
const link = { color: '#1A56DB' }
