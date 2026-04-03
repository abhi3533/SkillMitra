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
              <td style={{ textAlign: 'center', padding: '28px 0 20px 0' }}>
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
          <Text style={listText}>
            • Advanced Technologies: AI, Machine Learning, Data Science, Java, Python, Cloud Computing{'\n'}
            • IT & Software Development{'\n'}
            • Non-IT Skills: Communication, Leadership, Finance, Design{'\n'}
            • All trending and in-demand skills
          </Text>

          <Section style={statsBox}>
            <Text style={statsTitle}>Our Numbers:</Text>
            <Text style={statsText}>
              • Currently onboarding students across India{'\n'}
              • Target: <strong>5 Lakh+</strong> active students by this year end{'\n'}
              • Target: <strong>15 Lakh+</strong> students by next year{'\n'}
              • Target: <strong>50 Lakh+</strong> students across India in 2 years
            </Text>
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
          <Text style={listText}>
            • Fake or unverified profiles{'\n'}
            • Trainers without genuine expertise{'\n'}
            • Anyone who is not committed to their students
          </Text>
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
            <Text style={checklistText}>
              1. <strong>SELFIE PHOTO</strong> — A clear, well-lit selfie for identity verification (not shown publicly){'\n\n'}
              2. <strong>PROFESSIONAL PROFILE PHOTO</strong> — A clean, professional photo that will be displayed to students{'\n\n'}
              3. <strong>RESUME</strong> — Updated resume in PDF or image format{'\n\n'}
              4. <strong>COURSE DETAILS</strong> — Course name, description, curriculum outline{'\n\n'}
              5. <strong>COURSE DURATION</strong> — Total hours, session duration, number of sessions{'\n\n'}
              6. <strong>COURSE FEE</strong> — Your pricing per student{'\n\n'}
              7. <strong>AVAILABILITY</strong> — Your weekly schedule and available time slots{'\n\n'}
              8. <strong>DEMO CLASS TIMING</strong> — When you can conduct a free demo session{'\n\n'}
              9. <strong>BANK DETAILS</strong> — For receiving your earnings{'\n\n'}
              10. <strong>EDUCATION & CERTIFICATIONS</strong> — Your qualifications and credentials
            </Text>
          </Section>

          <Text style={tipText}>
            💡 Having all of this ready will help you complete onboarding in one sitting without any interruptions.
          </Text>

          <Hr style={divider} />

          {/* What Happens After */}
          <Heading as="h4" style={sectionHeading}>WHAT HAPPENS AFTER YOU SUBMIT?</Heading>
          <Section style={stepsBox}>
            <Text style={stepsText}>
              1. Our team will review your application within 24 hours{'\n'}
              2. If approved, you will receive an email to create your first course{'\n'}
              3. Once your course is approved, you go LIVE on SkillMitra{'\n'}
              4. Students across India can find and book you{'\n'}
              5. You start earning! 🎉
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={{ ...text, textAlign: 'center' as const, fontSize: '16px', fontWeight: '600' as const }}>
            We are building something truly special for India.{'\n'}And we want YOU to be part of it.
          </Text>

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
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
const main = { backgroundColor: '#ffffff', fontFamily }
const container = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff' }
const headerSection = { backgroundColor: '#ffffff', padding: '0', textAlign: 'center' as const }
const contentSection = { padding: '0 32px 24px' }
const footerSection = { padding: '20px 32px 28px', borderTop: '1px solid #e5e7eb', textAlign: 'center' as const }
const h3 = { margin: '0 0 16px', fontSize: '20px', color: '#111', fontWeight: '600' as const }
const sectionHeading = { margin: '0 0 12px', fontSize: '15px', color: '#0F172A', fontWeight: '700' as const, letterSpacing: '0.5px' }
const text = { fontSize: '15px', color: '#444', lineHeight: '1.7', margin: '0 0 16px' }
const listText = { fontSize: '14px', color: '#444', lineHeight: '1.8', margin: '0 0 16px', whiteSpace: 'pre-line' as const }
const divider = { borderColor: '#e5e7eb', margin: '24px 0' }
const statsBox = { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const statsTitle = { fontSize: '14px', color: '#1e40af', margin: '0 0 8px', fontWeight: '600' as const }
const statsText = { fontSize: '14px', color: '#1e40af', margin: '0', lineHeight: '1.8', whiteSpace: 'pre-line' as const }
const checklistBox = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', margin: '16px 0' }
const checklistText = { fontSize: '14px', color: '#334155', margin: '0', lineHeight: '1.6', whiteSpace: 'pre-line' as const }
const tipText = { fontSize: '14px', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', margin: '16px 0', lineHeight: '1.5' }
const stepsBox = { background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const stepsText = { fontSize: '14px', color: '#713f12', margin: '0', lineHeight: '1.8', whiteSpace: 'pre-line' as const }
const button = { backgroundColor: '#1A56DB', color: '#ffffff', padding: '14px 32px', borderRadius: '8px', fontSize: '16px', fontWeight: '700' as const, textDecoration: 'none', display: 'inline-block' }
const footerHelpText = { fontSize: '12px', color: '#9ca3af', margin: '0 0 8px' }
const footerLink = { color: '#9ca3af', textDecoration: 'underline' }
const footerCopyright = { fontSize: '12px', color: '#9ca3af', margin: '0' }
