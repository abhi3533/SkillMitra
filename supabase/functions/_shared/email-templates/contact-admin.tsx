/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Link, Text } from 'npm:@react-email/components@0.0.22'
import { EmailLayout } from './email-layout.tsx'

interface ContactAdminEmailProps {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

export const ContactAdminEmail = ({
  name,
  email,
  phone,
  subject,
  message,
}: ContactAdminEmailProps) => (
  <EmailLayout previewText={`New contact form submission: ${subject}`}>
    <Text style={h3}>New Message Received</Text>
    <table style={table}>
      <tbody>
        <tr>
          <td style={labelCell}>Name:</td>
          <td style={valueCell}>{name}</td>
        </tr>
        <tr>
          <td style={labelCell}>Email:</td>
          <td style={valueCell}>
            <Link href={`mailto:${email}`} style={link}>{email}</Link>
          </td>
        </tr>
        <tr>
          <td style={labelCell}>Phone:</td>
          <td style={valueCell}>{phone || 'Not provided'}</td>
        </tr>
        <tr>
          <td style={labelCell}>Subject:</td>
          <td style={valueCell}>{subject}</td>
        </tr>
      </tbody>
    </table>
    <div style={messageBox}>
      <Text style={messageLabel}>Message:</Text>
      <Text style={messageText}>{message}</Text>
    </div>
  </EmailLayout>
)

export default ContactAdminEmail

const h3 = { margin: '0 0 16px', fontSize: '18px', color: '#111', fontWeight: '600' as const }
const table = { width: '100%', borderCollapse: 'collapse' as const, marginTop: '8px' }
const labelCell = { padding: '8px 0', fontWeight: '600' as const, color: '#444', width: '100px', verticalAlign: 'top' as const, fontSize: '14px' }
const valueCell = { padding: '8px 0', color: '#111', fontSize: '14px' }
const link = { color: '#1A56DB' }
const messageBox = { marginTop: '16px', padding: '16px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px' }
const messageLabel = { fontWeight: '600' as const, color: '#444', margin: '0 0 8px', fontSize: '13px' }
const messageText = { color: '#111', margin: '0', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }
