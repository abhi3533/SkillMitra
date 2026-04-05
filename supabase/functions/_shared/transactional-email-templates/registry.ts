/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as contactConfirmation } from './contact-confirmation.tsx'
import { template as contactAdminNotify } from './contact-admin-notify.tsx'
import { template as welcomeStudent } from './welcome-student.tsx'
import { template as enrollmentConfirmation } from './enrollment-confirmation.tsx'
import { template as emailConfirmed } from './email-confirmed.tsx'
import { template as welcomeTrainer } from './welcome-trainer.tsx'
import { template as referralSignupReferrer } from './referral-signup-referrer.tsx'
import { template as referralSignupReferred } from './referral-signup-referred.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-confirmation': contactConfirmation,
  'contact-admin-notify': contactAdminNotify,
  'welcome-student': welcomeStudent,
  'enrollment-confirmation': enrollmentConfirmation,
  'email-confirmed': emailConfirmed,
  'welcome-trainer': welcomeTrainer,
  'referral-signup-referrer': referralSignupReferrer,
  'referral-signup-referred': referralSignupReferred,
}