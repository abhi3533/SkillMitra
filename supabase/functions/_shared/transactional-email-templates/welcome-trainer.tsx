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
    <Preview>Welcome to {SITE_NAME} – Complete Your Trainer Profile</Preview>
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
            Welcome to <strong>SkillMitra — India's 1-on-1 Training Platform!</strong>
          </Text>
          <Text style={text}>
            We're excited to have you join us. You're just a few steps away from becoming a SkillMitra trainer.
          </Text>

          <Hr style={divider} />

          {/* About SkillMitra */}
          <Heading as="h4" style={sectionHeading}>🌟 ABOUT SKILLMITRA</Heading>
          <Text style={text}>
            SkillMitra is a fast-growing platform focused on personalized 1-on-1 training, connecting passionate trainers with motivated students across India.
          </Text>
          <Text style={text}>
            <strong>We specialize in:</strong>
          </Text>
          <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%', marginBottom: '16px' }}>
            <tr><td style={bulletRow}>•</td><td style={bulletText}><strong>Advanced Technologies:</strong> AI, Machine Learning, Data Science, Java, Python, Cloud</td></tr>
            <tr><td style={bulletRow}>•</td><td style={bulletText}>IT & Software Development</td></tr>
            <tr><td style={bulletRow}>•</td><td style={bulletText}><strong>Non-IT Skills:</strong> Communication, Leadership, Finance, Design</td></tr>
            <tr><td style={bulletRow}>•</td><td style={bulletText}>All trending and in-demand skills</td></tr>
          </table>

          <Section style={statsBox}>
            <Text style={statsTitle}>Our Vision:</Text>
            <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%' }}>
              <tr><td style={statsBulletRow}>•</td><td style={statsBulletText}><strong>5 Lakh+</strong> students by this year</td></tr>
              <tr><td style={statsBulletRow}>•</td><td style={statsBulletText}><strong>15 Lakh+</strong> students next year</td></tr>
              <tr><td style={statsBulletRow}>•</td><td style={statsBulletText}><strong>50 Lakh+</strong> students across India in the next 2 years</td></tr>
            </table>
          </Section>

          <Text style={text}>
            We are not just a platform — we are building a <strong>movement</strong> to make quality learning accessible to every student.
          </Text>

          <Hr style={divider} />

          {/* How It Works */}
          <Heading as="h4" style={sectionHeading}>🚀 HOW IT WORKS (2 SIMPLE STEPS)</Heading>
          <Section style={stepsBox}>
            <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%' }}>
              <tr><td style={stepNum}>Step 1:</td><td style={stepContent}><strong>Complete Your Basic Profile</strong> (2–3 minutes){'\n'}Share your personal and professional details.</td></tr>
              <tr><td style={{ height: '12px' }} colSpan={2}></td></tr>
              <tr><td style={stepNum}>Step 2:</td><td style={stepContent}><strong>Set Up Your Course & Go Live</strong>{'\n'}Add your course details, videos, and verification to start receiving students.</td></tr>
            </table>
          </Section>

          <Hr style={divider} />

          {/* Keep Ready */}
          <Heading as="h4" style={sectionHeading}>📌 BEFORE YOU START — KEEP THESE READY</Heading>
          <Text style={text}>
            To complete your profile smoothly:
          </Text>

          <Section style={checklistBox}>
            <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%' }}>
              <tr><td style={bulletRow}>•</td><td style={checklistContent}><strong>Profile Photo</strong> (for students)</td></tr>
              <tr><td style={checklistSpacer} colSpan={2}></td></tr>
              <tr><td style={bulletRow}>•</td><td style={checklistContent}><strong>Selfie</strong> (for verification – not public)</td></tr>
              <tr><td style={checklistSpacer} colSpan={2}></td></tr>
              <tr><td style={bulletRow}>•</td><td style={checklistContent}><strong>Resume</strong></td></tr>
              <tr><td style={checklistSpacer} colSpan={2}></td></tr>
              <tr><td style={bulletRow}>•</td><td style={checklistContent}><strong>Aadhaar / Govt ID</strong></td></tr>
              <tr><td style={checklistSpacer} colSpan={2}></td></tr>
              <tr><td style={bulletRow}>•</td><td style={checklistContent}><strong>Basic course idea</strong> (what you want to teach)</td></tr>
            </table>
          </Section>

          <Text style={tipText}>
            👉 You can complete Step 1 quickly and continue Step 2 anytime from your dashboard.
          </Text>

          <Hr style={divider} />

          {/* What Happens Next */}
          <Heading as="h4" style={sectionHeading}>🎯 WHAT HAPPENS NEXT?</Heading>
          <Section style={stepsBoxAlt}>
            <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%' }}>
              <tr><td style={stepNumAlt}>1.</td><td style={stepContentAlt}>Complete your basic profile</td></tr>
              <tr><td style={stepNumAlt}>2.</td><td style={stepContentAlt}>Set up your course</td></tr>
              <tr><td style={stepNumAlt}>3.</td><td style={stepContentAlt}>Submit for review</td></tr>
              <tr><td style={stepNumAlt}>4.</td><td style={stepContentAlt}>Get approved and go LIVE</td></tr>
              <tr><td style={stepNumAlt}>5.</td><td style={stepContentAlt}>Start receiving students and earning 🎉</td></tr>
            </table>
          </Section>

          <Hr style={divider} />

          {/* Why Selective */}
          <Heading as="h4" style={sectionHeading}>🔒 WHY WE ARE SELECTIVE</Heading>
          <Text style={text}>
            We onboard only trainers who are:
          </Text>
          <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%', marginBottom: '16px' }}>
            <tr><td style={bulletRow}>•</td><td style={bulletText}>Genuine and verified</td></tr>
            <tr><td style={bulletRow}>•</td><td style={bulletText}>Skilled and experienced</td></tr>
            <tr><td style={bulletRow}>•</td><td style={bulletText}>Committed to students</td></tr>
          </table>
          <Text style={{ ...text, fontStyle: 'italic', color: '#1A56DB' }}>
            If you've signed up, we already see strong potential in you.
          </Text>

          <Hr style={divider} />

          <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
            <Button href={`${SITE_URL}/trainer/onboarding`} style={button}>
              👉 Start Your Profile Setup Now
            </Button>
          </Section>

          <Text style={{ ...text, margin: '24px 0 4px' }}>Warm regards,</Text>
          <Text style={{ ...text, margin: '0 0 4px', fontWeight: '600' as const }}>Team SkillMitra</Text>
          <Text style={{ ...text, margin: '0', fontSize: '13px', color: '#666' }}>
            India's 1-on-1 Training Platform{'\n'}
            <Link href="mailto:contact@skillmitra.online" style={{ color: '#1A56DB', textDecoration: 'underline' }}>contact@skillmitra.online</Link>
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
  subject: 'Welcome to SkillMitra – Complete Your Trainer Profile',
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

const bulletRow: React.CSSProperties = { width: '20px', verticalAlign: 'top' as const, fontSize: '14px', color: '#444', lineHeight: '1.8', paddingRight: '4px' }
const bulletText: React.CSSProperties = { verticalAlign: 'top' as const, fontSize: '14px', color: '#444', lineHeight: '1.8', paddingBottom: '2px' }

const statsBox: React.CSSProperties = { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '20px 24px', margin: '16px 0' }
const statsTitle: React.CSSProperties = { fontSize: '14px', color: '#1e40af', margin: '0 0 12px', fontWeight: '600' as const }
const statsBulletRow: React.CSSProperties = { width: '20px', verticalAlign: 'top' as const, fontSize: '14px', color: '#1e40af', lineHeight: '1.8', paddingRight: '4px' }
const statsBulletText: React.CSSProperties = { verticalAlign: 'top' as const, fontSize: '14px', color: '#1e40af', lineHeight: '1.8', paddingBottom: '2px' }

const checklistBox: React.CSSProperties = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px 24px 16px', margin: '16px 0' }
const checklistContent: React.CSSProperties = { verticalAlign: 'top' as const, fontSize: '14px', color: '#334155', lineHeight: '1.6' }
const checklistSpacer: React.CSSProperties = { height: '10px' }

const tipText: React.CSSProperties = { fontSize: '14px', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px 20px', margin: '16px 0', lineHeight: '1.5' }

const stepsBox: React.CSSProperties = { background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '20px 24px', margin: '16px 0' }
const stepNum: React.CSSProperties = { width: '56px', verticalAlign: 'top' as const, fontSize: '14px', color: '#713f12', fontWeight: '600' as const, lineHeight: '1.8', paddingRight: '4px', whiteSpace: 'nowrap' as const }
const stepContent: React.CSSProperties = { verticalAlign: 'top' as const, fontSize: '14px', color: '#713f12', lineHeight: '1.8', paddingBottom: '2px' }

const stepsBoxAlt: React.CSSProperties = { background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '20px 24px', margin: '16px 0' }
const stepNumAlt: React.CSSProperties = { width: '24px', verticalAlign: 'top' as const, fontSize: '14px', color: '#713f12', fontWeight: '600' as const, lineHeight: '1.8', paddingRight: '4px' }
const stepContentAlt: React.CSSProperties = { verticalAlign: 'top' as const, fontSize: '14px', color: '#713f12', lineHeight: '1.8', paddingBottom: '2px' }

const button: React.CSSProperties = { backgroundColor: '#1A56DB', color: '#ffffff', padding: '14px 32px', borderRadius: '8px', fontSize: '16px', fontWeight: '700' as const, textDecoration: 'none', display: 'inline-block' }

const footerHelpText: React.CSSProperties = { fontSize: '12px', color: '#9ca3af', margin: '0 0 8px' }
const footerLink: React.CSSProperties = { color: '#9ca3af', textDecoration: 'underline' }
const footerCopyright: React.CSSProperties = { fontSize: '12px', color: '#9ca3af', margin: '0' }
