
-- SKILLMITRA COMPLETE DATABASE MIGRATION
-- Fix: quote "current_role", cast all string literals to app_role

-- 1. Role enum and user_roles
CREATE TYPE public.app_role AS ENUM ('student', 'trainer', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1 $$;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text, email text UNIQUE, phone text, city text, state text,
  profile_picture_url text, gender text, language_preference text[] DEFAULT '{}',
  is_verified boolean DEFAULT false, is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can read verified profiles" ON public.profiles FOR SELECT USING (is_verified = true);

-- 3. ADMINS
CREATE TABLE public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text, email text UNIQUE, permissions text[] DEFAULT '{}',
  is_active boolean DEFAULT true, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read own record" ON public.admins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all" ON public.admins FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. TRAINERS
CREATE TABLE public.trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bio text, skills text[] DEFAULT '{}', experience_years integer DEFAULT 0,
  "current_role" text, current_company text, previous_companies text[] DEFAULT '{}',
  linkedin_url text, intro_video_url text, teaching_languages text[] DEFAULT '{}',
  approval_status text DEFAULT 'pending', rejection_reason text,
  subscription_plan text DEFAULT 'basic', boost_score integer DEFAULT 0,
  average_rating decimal DEFAULT 0, total_students integer DEFAULT 0,
  total_earnings decimal DEFAULT 0, available_balance decimal(10,2) DEFAULT 0,
  total_withdrawn decimal(10,2) DEFAULT 0, bank_account_number text,
  ifsc_code text, account_holder_name text, upi_id text, pan_number text,
  is_job_seeker boolean DEFAULT false, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainers read own" ON public.trainers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Trainers update own" ON public.trainers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Trainers insert own" ON public.trainers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public read approved trainers" ON public.trainers FOR SELECT USING (approval_status = 'approved');
CREATE POLICY "Admins manage trainers" ON public.trainers FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. STUDENTS
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  college_name text, course_of_study text, graduation_year integer,
  skills_learning text[] DEFAULT '{}', trainer_gender_preference text DEFAULT 'no_preference',
  total_sessions_attended integer DEFAULT 0, total_spent decimal DEFAULT 0,
  referral_code text UNIQUE, referral_credits decimal DEFAULT 0, referred_by text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own" ON public.students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students update own" ON public.students FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Students insert own" ON public.students FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage students" ON public.students FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Trainers read students" ON public.students FOR SELECT USING (public.has_role(auth.uid(), 'trainer'::app_role));

-- 6. TRAINER DOCUMENTS
CREATE TABLE public.trainer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid REFERENCES public.trainers(id) ON DELETE CASCADE NOT NULL,
  document_type text, document_url text, document_name text,
  verification_status text DEFAULT 'pending', rejection_reason text,
  uploaded_at timestamptz DEFAULT now()
);
ALTER TABLE public.trainer_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainers manage own docs" ON public.trainer_documents FOR ALL USING (EXISTS (SELECT 1 FROM public.trainers WHERE id = trainer_id AND user_id = auth.uid()));
CREATE POLICY "Admins manage docs" ON public.trainer_documents FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. COURSES
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid REFERENCES public.trainers(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL, description text, what_you_learn text[] DEFAULT '{}',
  who_is_it_for text, duration_days integer, total_sessions integer,
  session_frequency text, session_duration_mins integer DEFAULT 60,
  course_fee decimal NOT NULL DEFAULT 0, language text, level text DEFAULT 'beginner',
  has_free_trial boolean DEFAULT true, approval_status text DEFAULT 'pending',
  is_active boolean DEFAULT true, total_enrolled integer DEFAULT 0,
  average_rating decimal DEFAULT 0, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainers manage own courses" ON public.courses FOR ALL USING (EXISTS (SELECT 1 FROM public.trainers WHERE id = trainer_id AND user_id = auth.uid()));
CREATE POLICY "Public read approved courses" ON public.courses FOR SELECT USING (approval_status = 'approved' AND is_active = true);
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 8. COURSE CURRICULUM
CREATE TABLE public.course_curriculum (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  week_number integer, week_title text, topics text[] DEFAULT '{}',
  session_count integer DEFAULT 1, learning_outcome text
);
ALTER TABLE public.course_curriculum ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read curriculum" ON public.course_curriculum FOR SELECT USING (EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND approval_status = 'approved'));
CREATE POLICY "Trainers manage curriculum" ON public.course_curriculum FOR ALL USING (EXISTS (SELECT 1 FROM public.courses c JOIN public.trainers t ON c.trainer_id = t.id WHERE c.id = course_id AND t.user_id = auth.uid()));
CREATE POLICY "Admins manage curriculum" ON public.course_curriculum FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 9. TRAINER AVAILABILITY
CREATE TABLE public.trainer_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid REFERENCES public.trainers(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time, end_time time, is_available boolean DEFAULT true
);
ALTER TABLE public.trainer_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read availability" ON public.trainer_availability FOR SELECT USING (true);
CREATE POLICY "Trainers manage availability" ON public.trainer_availability FOR ALL USING (EXISTS (SELECT 1 FROM public.trainers WHERE id = trainer_id AND user_id = auth.uid()));
CREATE POLICY "Admins manage availability" ON public.trainer_availability FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 10. ENROLLMENTS
CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  trainer_id uuid REFERENCES public.trainers(id) ON DELETE CASCADE NOT NULL,
  amount_paid decimal DEFAULT 0, platform_commission decimal DEFAULT 0,
  trainer_payout decimal DEFAULT 0, razorpay_payment_id text,
  enrollment_date timestamptz DEFAULT now(), start_date date, end_date date,
  progress_percent integer DEFAULT 0, sessions_completed integer DEFAULT 0,
  sessions_total integer, milestones_reached text[] DEFAULT '{}',
  resume_unlocked boolean DEFAULT false, certificate_eligible boolean DEFAULT false,
  last_session_date timestamptz, status text DEFAULT 'active'
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read enrollments" ON public.enrollments FOR SELECT USING (EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid()));
CREATE POLICY "Students insert enrollments" ON public.enrollments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid()));
CREATE POLICY "Trainers read enrollments" ON public.enrollments FOR SELECT USING (EXISTS (SELECT 1 FROM public.trainers WHERE id = trainer_id AND user_id = auth.uid()));
CREATE POLICY "Trainers update enrollments" ON public.enrollments FOR UPDATE USING (EXISTS (SELECT 1 FROM public.trainers WHERE id = trainer_id AND user_id = auth.uid()));
CREATE POLICY "Admins manage enrollments" ON public.enrollments FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 11. COURSE SESSIONS
CREATE TABLE public.course_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  trainer_id uuid REFERENCES public.trainers(id) ON DELETE CASCADE NOT NULL,
  session_number integer, title text, scheduled_at timestamptz,
  duration_mins integer DEFAULT 60, meet_link text, status text DEFAULT 'upcoming',
  recording_url text, notes text, is_trial boolean DEFAULT false,
  joined_by_student boolean DEFAULT false, joined_by_trainer boolean DEFAULT false,
  student_join_time timestamptz, trainer_join_time timestamptz,
  actual_duration_mins integer, no_show_by text, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read sessions" ON public.course_sessions FOR SELECT USING (EXISTS (SELECT 1 FROM public.enrollments e JOIN public.students s ON e.student_id = s.id WHERE e.id = enrollment_id AND s.user_id = auth.uid()));
CREATE POLICY "Students update sessions" ON public.course_sessions FOR UPDATE USING (EXISTS (SELECT 1 FROM public.enrollments e JOIN public.students s ON e.student_id = s.id WHERE e.id = enrollment_id AND s.user_id = auth.uid()));
CREATE POLICY "Trainers manage sessions" ON public.course_sessions FOR ALL USING (EXISTS (SELECT 1 FROM public.trainers WHERE id = trainer_id AND user_id = auth.uid()));
CREATE POLICY "Admins manage sessions" ON public.course_sessions FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_sessions;

-- 12. PAYMENTS
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  razorpay_order_id text, razorpay_payment_id text, razorpay_signature text,
  amount decimal NOT NULL DEFAULT 0, status text DEFAULT 'created',
  payment_method text, refund_amount decimal DEFAULT 0, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read payments" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid()));
CREATE POLICY "Students insert payments" ON public.payments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid()));
CREATE POLICY "Trainers read payments" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.enrollments e JOIN public.trainers t ON e.trainer_id = t.id WHERE e.id = enrollment_id AND t.user_id = auth.uid()));
CREATE POLICY "Admins manage payments" ON public.payments FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 13. RATINGS
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  trainer_id uuid REFERENCES public.trainers(id) ON DELETE CASCADE NOT NULL,
  student_to_trainer_rating integer, student_to_trainer_review text,
  trainer_to_student_rating integer, trainer_to_student_review text,
  technical_score integer, communication_score integer, punctuality_score integer,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage ratings" ON public.ratings FOR ALL USING (EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid()));
CREATE POLICY "Trainers read ratings" ON public.ratings FOR SELECT USING (EXISTS (SELECT 1 FROM public.trainers WHERE id = trainer_id AND user_id = auth.uid()));
CREATE POLICY "Trainers update ratings" ON public.ratings FOR UPDATE USING (EXISTS (SELECT 1 FROM public.trainers WHERE id = trainer_id AND user_id = auth.uid()));
CREATE POLICY "Public read ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Admins manage ratings" ON public.ratings FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 14. CERTIFICATES
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id text UNIQUE NOT NULL DEFAULT 'SM-' || upper(substr(md5(random()::text), 1, 8)),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  trainer_id uuid REFERENCES public.trainers(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  course_name text, overall_score decimal, technical_score decimal,
  communication_score decimal, punctuality_score decimal, interview_score decimal,
  trainer_approved boolean DEFAULT false, trainer_comments text,
  certificate_url text, issue_date timestamptz DEFAULT now(), is_valid boolean DEFAULT true
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read certs" ON public.certificates FOR SELECT USING (EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid()));
CREATE POLICY "Trainers manage certs" ON public.certificates FOR ALL USING (EXISTS (SELECT 1 FROM public.trainers WHERE id = trainer_id AND user_id = auth.uid()));
CREATE POLICY "Public verify certs" ON public.certificates FOR SELECT USING (is_valid = true);
CREATE POLICY "Admins manage certs" ON public.certificates FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 15. TRAINER SUBSCRIPTIONS
CREATE TABLE public.trainer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid REFERENCES public.trainers(id) ON DELETE CASCADE NOT NULL,
  plan text DEFAULT 'basic', amount decimal DEFAULT 0,
  start_date date DEFAULT CURRENT_DATE, end_date date,
  razorpay_subscription_id text, status text DEFAULT 'active',
  auto_renew boolean DEFAULT true, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.trainer_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainers read subs" ON public.trainer_subscriptions FOR SELECT USING (EXISTS (SELECT 1 FROM public.trainers WHERE id = trainer_id AND user_id = auth.uid()));
CREATE POLICY "Trainers insert subs" ON public.trainer_subscriptions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.trainers WHERE id = trainer_id AND user_id = auth.uid()));
CREATE POLICY "Admins manage subs" ON public.trainer_subscriptions FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 16. NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text, body text, type text, is_read boolean DEFAULT false,
  action_url text, icon text, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read notifs" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update notifs" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage notifs" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 17. PARENT ACCOUNTS
CREATE TABLE public.parent_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  parent_name text, relationship text, phone text, email text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.parent_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage parents" ON public.parent_accounts FOR ALL USING (EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid()));
CREATE POLICY "Admins manage parents" ON public.parent_accounts FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 18. STUDENT RESUMES
CREATE TABLE public.student_resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  objective text, skills text[] DEFAULT '{}', projects jsonb DEFAULT '[]',
  education jsonb DEFAULT '[]', certifications jsonb DEFAULT '[]',
  ai_improved_objective text, ats_score integer DEFAULT 0,
  pdf_url text, updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.student_resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage resumes" ON public.student_resumes FOR ALL USING (EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid()));
CREATE POLICY "Admins read resumes" ON public.student_resumes FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 19. AI INTERVIEWS
CREATE TABLE public.ai_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  job_role text, difficulty text, questions jsonb DEFAULT '[]',
  answers jsonb DEFAULT '[]', overall_score decimal, technical_score decimal,
  communication_score decimal, confidence_score decimal,
  status text DEFAULT 'in_progress', completed_at timestamptz
);
ALTER TABLE public.ai_interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage interviews" ON public.ai_interviews FOR ALL USING (EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid()));
CREATE POLICY "Admins read interviews" ON public.ai_interviews FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 20. REFERRALS
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  referral_code text, reward_amount decimal(10,2) DEFAULT 200,
  status text DEFAULT 'pending', created_at timestamptz DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read referrals" ON public.referrals FOR SELECT USING (EXISTS (SELECT 1 FROM public.students WHERE id = referrer_id AND user_id = auth.uid()));
CREATE POLICY "Admins manage referrals" ON public.referrals FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 21. PROGRESS MILESTONES
CREATE TABLE public.progress_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  milestone_type text, reached_at timestamptz DEFAULT now(), notified boolean DEFAULT false
);
ALTER TABLE public.progress_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read milestones" ON public.progress_milestones FOR SELECT USING (EXISTS (SELECT 1 FROM public.enrollments e JOIN public.students s ON e.student_id = s.id WHERE e.id = enrollment_id AND s.user_id = auth.uid()));
CREATE POLICY "Trainers read milestones" ON public.progress_milestones FOR SELECT USING (EXISTS (SELECT 1 FROM public.enrollments e JOIN public.trainers t ON e.trainer_id = t.id WHERE e.id = enrollment_id AND t.user_id = auth.uid()));
CREATE POLICY "Admins manage milestones" ON public.progress_milestones FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 22. PAYOUT REQUESTS
CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid REFERENCES public.trainers(id) ON DELETE CASCADE NOT NULL,
  requested_amount decimal(10,2), processed_amount decimal(10,2),
  bank_account_number text, ifsc_code text, upi_id text,
  transaction_reference text, status text DEFAULT 'pending',
  rejection_reason text, requested_at timestamptz DEFAULT now(),
  processed_at timestamptz, processed_by uuid REFERENCES public.admins(id)
);
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainers read payouts" ON public.payout_requests FOR SELECT USING (EXISTS (SELECT 1 FROM public.trainers WHERE id = trainer_id AND user_id = auth.uid()));
CREATE POLICY "Trainers insert payouts" ON public.payout_requests FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.trainers WHERE id = trainer_id AND user_id = auth.uid()));
CREATE POLICY "Admins manage payouts" ON public.payout_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 23. SEARCH LOGS
CREATE TABLE public.search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query text, results_count integer DEFAULT 0,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read logs" ON public.search_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone insert logs" ON public.search_logs FOR INSERT WITH CHECK (true);

-- 24. DISPUTES
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raised_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE CASCADE,
  subject text, description text, status text DEFAULT 'open',
  resolution text, resolved_by uuid REFERENCES public.admins(id),
  created_at timestamptz DEFAULT now(), resolved_at timestamptz
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read disputes" ON public.disputes FOR SELECT USING (auth.uid() = raised_by);
CREATE POLICY "Users create disputes" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = raised_by);
CREATE POLICY "Admins manage disputes" ON public.disputes FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- TRIGGER: Auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role app_role;
  _referral_code text;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'::app_role);
  INSERT INTO public.profiles (id, full_name, email, phone) VALUES (
    NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  IF _role = 'student'::app_role THEN
    _referral_code := 'SM-' || upper(substr(md5(random()::text), 1, 6));
    INSERT INTO public.students (user_id, referral_code) VALUES (NEW.id, _referral_code);
  END IF;
  IF _role = 'trainer'::app_role THEN
    INSERT INTO public.trainers (user_id) VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-pictures', 'profile-pictures', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('trainer-documents', 'trainer-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('course-materials', 'course-materials', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('intro-videos', 'intro-videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-interview-audio', 'ai-interview-audio', false);

-- STORAGE POLICIES
CREATE POLICY "Public read profile pics" ON storage.objects FOR SELECT USING (bucket_id = 'profile-pictures');
CREATE POLICY "Users upload profile pic" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update profile pic" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Trainers upload docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'trainer-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Trainers read own docs" ON storage.objects FOR SELECT USING (bucket_id = 'trainer-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins read all docs" ON storage.objects FOR SELECT USING (bucket_id = 'trainer-documents' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Trainers upload materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-materials' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Trainers read materials" ON storage.objects FOR SELECT USING (bucket_id = 'course-materials' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public read intro videos" ON storage.objects FOR SELECT USING (bucket_id = 'intro-videos');
CREATE POLICY "Trainers upload intro video" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'intro-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public read certificates" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
CREATE POLICY "Students upload audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ai-interview-audio' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Students read audio" ON storage.objects FOR SELECT USING (bucket_id = 'ai-interview-audio' AND auth.uid()::text = (storage.foldername(name))[1]);
