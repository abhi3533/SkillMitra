/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SkillMitra'
const SITE_URL = 'https://www.skillmitra.online'

interface Props {
  name?: string
}

const WelcomeTrainerEmail = ({ name }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — Please read before starting your onboarding</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={headerSection}>
          <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%' }}>
            <tr>
              <td style={{ textAlign: 'center' as const, padding: '28px 0 20px 0' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, fontFamily, color: '#0F172A' }}>Skill</span>
                <span style={{ fontSize: '24px', fontWeight: 700, fontFamily, color: '#1A56DB' }}>Mitra</span>
              </td>
            </tr>
          </table>
        </Section>

        {/* Content */}
        <Section style={contentSection}>
          <Heading as="h3" style={h3}>
            {name ? `Dear ${name},` : 'Dear Trainer,'}
          </Heading>

          <Text style={text}>
            Welcome to <strong>SkillMitra — India's Premier 1-on-1 Training Platform!</strong>
          </Text>
          <Text style={text}>
            We are thrilled to have you here. Before you begin your onboarding, please take 2 minutes to read this email carefully. It will help you complete your application smoothly without any interruptions.
          </Text>

          <Hr style={divider} />

          {/* About SkillMitra */}
          <Heading as="h4" style={sectionHeading}>ABOUT SKILLMITRA</Heading>
          <Text style={text}>
            SkillMitra is India's fastest growing 1-on-1 personalized training platform. We specialize in connecting passionate trainers with motivated students across India.
          </Text>
          <Text style={text}>
            <strong>We are focused on:</strong>
          </Text>
          <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%', marginBottom: '16px' }}>
            <tr><td style={bulletRow}>•</td><td style={bulletText}>Advanced Technologies: AI, Machine Learning, Data Science, Java, Python, Cloud Computing</td></tr>
            <tr><td style={bulletRow}>•</td><td style={bulletText}>IT & Software Development</td></tr>
            <tr><td style={bulletRow}>•</td><td style={bulletText}>Non-IT Skills: Communication, Leadership, Finance, Design</td></tr>
            <tr><td style={bulletRow}>•</td><td style={bulletText}>All trending and in-demand skills</td></tr>
          </table>

          <Section style={statsBox}>
            <Text style={statsTitle}>Our Numbers:</Text>
            <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%' }}>
              <tr><td style={statsBulletRow}>•</td><td style={statsBulletText}>Currently onboarding students across India</td></tr>
              <tr><td style={statsBulletRow}>•</td><td style={statsBulletText}>Target: <strong>5 Lakh+</strong> active students by this year end</td></tr>
              <tr><td style={statsBulletRow}>•</td><td style={statsBulletText}>Target: <strong>15 Lakh+</strong> students by next year</td></tr>
              <tr><td style={statsBulletRow}>•</td><td style={statsBulletText}>Target: <strong>50 Lakh+</strong> students across India in 2 years</td></tr>
            </table>
          </Section>

          <Text style={text}>
            We are not just a platform — we are a <strong>movement</strong> to make quality 1-on-1 training accessible to every student in India.
          </Text>

          <Hr style={divider} />

          {/* Why Selective */}
          <Heading as="h4" style={sectionHeading}>WHY WE ARE SELECTIVE ABOUT TRAINERS</Heading>
          <Text style={text}>
            At SkillMitra, we believe that great students deserve great trainers. We onboard only passionate, skilled, and committed trainers who are serious about making a difference.
          </Text>
          <Text style={text}>
            <strong>We do not onboard:</strong>
          </Text>
          <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%', marginBottom: '16px' }}>
            <tr><td style={bulletRow}>•</td><td style={bulletText}>Fake or unverified profiles</td></tr>
            <tr><td style={bulletRow}>•</td><td style={bulletText}>Trainers without genuine expertise</td></tr>
            <tr><td style={bulletRow}>•</td><td style={bulletText}>Anyone who is not committed to their students</td></tr>
          </table>
          <Text style={{ ...text, fontStyle: 'italic', color: '#1A56DB' }}>
            If you are reading this, we believe YOU have what it takes. Let us make this official!
          </Text>

          <Hr style={divider} />

          {/* Keep Ready */}
          <Heading as="h4" style={sectionHeading}>BEFORE YOU START YOUR ONBOARDING — PLEASE KEEP READY</Heading>
          <Text style={text}>
            To complete your application without interruptions, please prepare the following in advance:
          </Text>

          <Section style={checklistBox}>
            <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%' }}>
              <tr><td style={checklistNum}>1.</td><td style={checklistContent}><strong>SELFIE PHOTO</strong> — A clear, well-lit selfie for identity verification (not shown publicly)</td></tr>
              <tr><td style={checklistSpacer} colSpan={2}></td></tr>
              <tr><td style={checklistNum}>2.</td><td style={checklistContent}><strong>PROFESSIONAL PROFILE PHOTO</strong> — A clean, professional photo that will be displayed to students</td></tr>
              <tr><td style={checklistSpacer} colSpan={2}></td></tr>
              <tr><td style={checklistNum}>3.</td><td style={checklistContent}><strong>RESUME</strong> — Updated resume in PDF or image format</td></tr>
              <tr><td style={checklistSpacer} colSpan={2}></td></tr>
              <tr><td style={checklistNum}>4.</td><td style={checklistContent}><strong>COURSE DETAILS</strong> — Course name, description, curriculum outline</td></tr>
              <tr><td style={checklistSpacer} colSpan={2}></td></tr>
              <tr><td style={checklistNum}>5.</td><td style={checklistContent}><strong>COURSE DURATION</strong> — Total hours, session duration, number of sessions</td></tr>
              <tr><td style={checklistSpacer} colSpan={2}></td></tr>
              <tr><td style={checklistNum}>6.</td><td style={checklistContent}><strong>COURSE FEE</strong> — Your pricing per student</td></tr>
              <tr><td style={checklistSpacer} colSpan={2}></td></tr>
              <tr><td style={checklistNum}>7.</td><td style={checklistContent}><strong>AVAILABILITY</strong> — Your weekly schedule and available time slots</td></tr>
              <tr><td style={checklistSpacer} colSpan={2}></td></tr>
              <tr><td style={checklistNum}>8.</td><td style={checklistContent}><strong>DEMO CLASS TIMING</strong> — When you can conduct a free demo session</td></tr>
              <tr><td style={checklistSpacer} colSpan={2}></td></tr>
              <tr><td style={checklistNum}>9.</td><td style={checklistContent}><strong>BANK DETAILS</strong> — For receiving your earnings</td></tr>
              <tr><td style={checklistSpacer} colSpan={2}></td></tr>
              <tr><td style={checklistNum}>10.</td><td style={checklistContent}><strong>EDUCATION & CERTIFICATIONS</strong> — Your qualifications and credentials</td></tr>
            </table>
          </Section>

          <Text style={tipText}>
            💡 Having all of this ready will help you complete onboarding in one sitting without any interruptions.
          </Text>

          <Hr style={divider} />

          {/* What Happens After */}
          <Heading as="h4" style={sectionHeading}>WHAT HAPPENS AFTER YOU SUBMIT?</Heading>
          <Section style={stepsBox}>
            <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%' }}>
              <tr><td style={stepNum}>1.</td><td style={stepContent}>Our team will review your application within 24 hours</td></tr>
              <tr><td style={stepNum}>2.</td><td style={stepContent}>If approved, you will receive an email to create your first course</td></tr>
              <tr><td style={stepNum}>3.</td><td style={stepContent}>Once your course is approved, you go LIVE on SkillMitra</td></tr>
              <tr><td style={stepNum}>4.</td><td style={stepContent}>Students across India can find and book you</td></tr>
              <tr><td style={stepNum}>5.</td><td style={stepContent}>You start earning! 🎉</td></tr>
            </table>
          </Section>

          <Hr style={divider} />

          <Text style={{ ...text, textAlign: 'center' as const, fontSize: '16px', fontWeight: '600' as const }}>
            We are building something truly special for India.{'\n'}And we want YOU to be part of it.
          </Text>

          <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
            <Button href={`${SITE_URL}/trainer/onboarding`} style={button}>
              START MY ONBOARDING →
            </Button>
          </Section>

          <Text style={{ ...text, margin: '24px 0 4px' }}>Warm regards,</Text>
          <Text style={{ ...text, margin: '0 0 4px', fontWeight: '600' as const }}>Team SkillMitra</Text>
          <Text style={{ ...text, margin: '0', fontSize: '13px', color: '#666' }}>
            India's 1-on-1 Training Platform{'\n'}
            <Link href={SITE_URL} style={{ color: '#1A56DB', textDecoration: 'underline' }}>skillmitra.online</Link>
          </Text>
        </Section>

        {/* Footer */}
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
  component: WelcomeTrainerEmail,
  subject: 'Welcome to SkillMitra — Please Read Before Starting Your Onboarding',
  displayName: 'Welcome trainer (pre-onboarding)',
  previewData: { name: 'Mohith' },
} satisfies TemplateEntry

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const main: React.CSSProperties = { backgroundColor: '#f4f4f5', fontFamily, margin: '0', padding: '40px 0' }
const container: React.CSSProperties = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden' as const, border: '1px solid #e5e7eb' }
const headerSection: React.CSSProperties = { backgroundColor: '#ffffff', padding: '0', textAlign: 'center' as const, borderBottom: '1px solid #e5e7eb' }
const contentSection: React.CSSProperties = { padding: '32px 40px 24px' }
const footerSection: React.CSSProperties = { padding: '20px 40px 28px', borderTop: '1px solid #e5e7eb', textAlign: 'center' as const, backgroundColor: '#f9fafb' }
const h3: React.CSSProperties = { margin: '0 0 20px', fontSize: '20px', color: '#111', fontWeight: '600' as const, lineHeight: '1.4' }
const sectionHeading: React.CSSProperties = { margin: '0 0 14px', fontSize: '15px', color: '#0F172A', fontWeight: '700' as const, letterSpacing: '0.5px' }
const text: React.CSSProperties = { fontSize: '15px', color: '#444', lineHeight: '1.7', margin: '0 0 16px' }
const divider: React.CSSProperties = { borderColor: '#e5e7eb', margin: '28px 0' }

// Bullet point styles using table layout for proper indentation
const bulletRow: React.CSSProperties = { width: '20px', verticalAlign: 'top' as const, fontSize: '14px', color: '#444', lineHeight: '1.8', paddingRight: '4px' }
const bulletText: React.CSSProperties = { verticalAlign: 'top' as const, fontSize: '14px', color: '#444', lineHeight: '1.8', paddingBottom: '2px' }

// Stats box
const statsBox: React.CSSProperties = { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '20px 24px', margin: '16px 0' }
const statsTitle: React.CSSProperties = { fontSize: '14px', color: '#1e40af', margin: '0 0 12px', fontWeight: '600' as const }
const statsBulletRow: React.CSSProperties = { width: '20px', verticalAlign: 'top' as const, fontSize: '14px', color: '#1e40af', lineHeight: '1.8', paddingRight: '4px' }
const statsBulletText: React.CSSProperties = { verticalAlign: 'top' as const, fontSize: '14px', color: '#1e40af', lineHeight: '1.8', paddingBottom: '2px' }

// Checklist box
const checklistBox: React.CSSProperties = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px 24px 16px', margin: '16px 0' }
const checklistNum: React.CSSProperties = { width: '28px', verticalAlign: 'top' as const, fontSize: '14px', color: '#334155', fontWeight: '600' as const, lineHeight: '1.6', paddingRight: '4px' }
const checklistContent: React.CSSProperties = { verticalAlign: 'top' as const, fontSize: '14px', color: '#334155', lineHeight: '1.6' }
const checklistSpacer: React.CSSProperties = { height: '10px' }

// Tip
const tipText: React.CSSProperties = { fontSize: '14px', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px 20px', margin: '16px 0', lineHeight: '1.5' }

// Steps box
const stepsBox: React.CSSProperties = { background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '20px 24px', margin: '16px 0' }
const stepNum: React.CSSProperties = { width: '24px', verticalAlign: 'top' as const, fontSize: '14px', color: '#713f12', fontWeight: '600' as const, lineHeight: '1.8', paddingRight: '4px' }
const stepContent: React.CSSProperties = { verticalAlign: 'top' as const, fontSize: '14px', color: '#713f12', lineHeight: '1.8', paddingBottom: '2px' }

// Button
const button: React.CSSProperties = { backgroundColor: '#1A56DB', color: '#ffffff', padding: '14px 32px', borderRadius: '8px', fontSize: '16px', fontWeight: '700' as const, textDecoration: 'none', display: 'inline-block' }

// Footer
const footerHelpText: React.CSSProperties = { fontSize: '12px', color: '#9ca3af', margin: '0 0 8px' }
const footerLink: React.CSSProperties = { color: '#9ca3af', textDecoration: 'underline' }
const footerCopyright: React.CSSProperties = { fontSize: '12px', color: '#9ca3af', margin: '0' }
