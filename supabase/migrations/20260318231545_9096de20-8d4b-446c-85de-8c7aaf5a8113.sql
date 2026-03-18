
-- Create generated-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- Make product-photos bucket public
UPDATE storage.buckets SET public = true WHERE id = 'product-photos';

-- RLS policies for product-photos
CREATE POLICY "Authenticated users can upload product photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-photos');

CREATE POLICY "Anyone can view product photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-photos');

CREATE POLICY "Users can delete their own product photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policies for generated-images
CREATE POLICY "Service role can insert generated images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'generated-images');

CREATE POLICY "Anyone can view generated images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'generated-images');
