-- ============================================================
-- SECURITY FIXES — Storage policies + rate_limits hardening
-- ============================================================

-- Drop the overly-permissive INSERT policies that allowed any authenticated
-- user to upload to any path within the bucket.
DROP POLICY IF EXISTS "product_photos_insert"   ON storage.objects;
DROP POLICY IF EXISTS "generated_images_insert" ON storage.objects;

-- product-photos: enforce that uploads go to /<user_id>/... only
CREATE POLICY "product_photos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- generated-images: same path enforcement for user uploads.
-- (Edge functions use the service role key and bypass RLS entirely,
--  so they are unaffected by this policy.)
CREATE POLICY "generated_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'generated-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- generated-images DELETE: allow authenticated users to delete their own files,
-- and allow the service role (used by cleanup jobs) to delete any file.
CREATE POLICY "generated_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'generated-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- rate_limits — add foreign key + composite index for cleanup queries
-- ============================================================

-- Foreign key ensures orphan rows are removed when a user is deleted.
ALTER TABLE public.rate_limits
  ADD CONSTRAINT fk_rate_limits_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index optimised for the per-user per-function window query in checkRateLimit().
-- The existing idx_rate_limits_lookup already covers this, but we add a plain
-- created_at index to accelerate the periodic cleanup function.
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
  ON public.rate_limits(created_at);
