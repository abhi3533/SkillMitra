-- Allow trainers to re-upload (update) their own intro and demo videos.
-- The INSERT-only policy that existed before caused upsert to fail silently
-- on resubmission because storage upsert requires both INSERT + UPDATE.
CREATE POLICY "Trainers update own intro video"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'intro-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'intro-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
