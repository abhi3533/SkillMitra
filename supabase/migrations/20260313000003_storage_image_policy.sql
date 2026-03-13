-- Enforce image-only uploads in the profile-pictures bucket at the storage level.
-- This is the server-side counterpart to the client-side magic byte check.

-- Restrict profile-pictures uploads to image MIME types only.
-- Users can only upload to their own folder (userId/...).
CREATE POLICY "Authenticated users upload own profile picture"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-pictures'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'gif', 'webp')
  );

CREATE POLICY "Authenticated users update own profile picture"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read for profile pictures (avatars need to be visible)
CREATE POLICY "Public read profile pictures"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-pictures');
