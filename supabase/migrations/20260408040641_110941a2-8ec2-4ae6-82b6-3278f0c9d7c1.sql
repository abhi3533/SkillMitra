CREATE POLICY "Trainers update own docs"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'trainer-documents' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'trainer-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);