
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read skills" ON public.skills FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage skills" ON public.skills FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.skills (name) VALUES
  ('Python'),
  ('UI/UX'),
  ('Data Science'),
  ('Spoken English'),
  ('Digital Marketing'),
  ('AI'),
  ('Web Development'),
  ('Machine Learning'),
  ('React'),
  ('Node.js'),
  ('Figma'),
  ('SEO'),
  ('Interview Prep'),
  ('Coding'),
  ('Tally & GST'),
  ('Public Speaking'),
  ('Financial Planning'),
  ('Content Marketing');
