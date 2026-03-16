
-- Performance indexes for common query patterns
-- Referrals: lookup by referrer
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);

-- Trainer referrals: lookup by referrer
CREATE INDEX IF NOT EXISTS idx_trainer_referrals_referrer_id ON public.trainer_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_referrals_referral_code ON public.trainer_referrals(referral_code);

-- Wallet transactions: lookup by user and wallet
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);

-- Payout requests: lookup by trainer and status
CREATE INDEX IF NOT EXISTS idx_payout_requests_trainer_id ON public.payout_requests(trainer_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);

-- AI chat sessions: lookup by user
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON public.ai_chat_sessions(user_id);

-- Contact messages: status filter for admin
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);

-- Certificates: lookup by student and trainer
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_trainer_id ON public.certificates(trainer_id);

-- Trainer documents: lookup by trainer
CREATE INDEX IF NOT EXISTS idx_trainer_documents_trainer_id ON public.trainer_documents(trainer_id);

-- Disputes: status filter
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

-- Progress milestones: enrollment lookup
CREATE INDEX IF NOT EXISTS idx_progress_milestones_enrollment_id ON public.progress_milestones(enrollment_id);

-- Trainer subscriptions: trainer lookup
CREATE INDEX IF NOT EXISTS idx_trainer_subscriptions_trainer_id ON public.trainer_subscriptions(trainer_id);

-- Session reflections: student and session lookups
CREATE INDEX IF NOT EXISTS idx_session_reflections_student_id ON public.session_reflections(student_id);
CREATE INDEX IF NOT EXISTS idx_session_reflections_session_id ON public.session_reflections(session_id);
