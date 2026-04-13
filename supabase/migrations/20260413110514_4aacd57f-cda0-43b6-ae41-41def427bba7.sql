-- Add new media and metadata columns to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS sessions_per_week integer;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS free_trial_enabled boolean DEFAULT true;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS weekly_curriculum jsonb;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS intro_video_url text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS demo_video_url text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS curriculum_pdf_url text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS certification_url text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS verification_selfie_url text;

-- Admin read policy for course-materials bucket (PDF curriculum)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
    AND policyname = 'Admins read course materials'
  ) THEN
    CREATE POLICY "Admins read course materials" ON storage.objects
      FOR SELECT USING (bucket_id = 'course-materials' AND public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Trainers can update their own files in course-materials (for upsert on re-upload)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
    AND policyname = 'Trainers update materials'
  ) THEN
    CREATE POLICY "Trainers update materials" ON storage.objects
      FOR UPDATE USING (bucket_id = 'course-materials' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;