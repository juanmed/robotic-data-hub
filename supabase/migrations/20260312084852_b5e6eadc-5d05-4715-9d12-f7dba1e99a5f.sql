
-- Drop existing policies on storage.objects for datasets bucket
DROP POLICY IF EXISTS "Users can upload own dataset files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own dataset files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own dataset files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own dataset files" ON storage.objects;

-- Recreate with correct path pattern: {user_id}/{dataset_id}/{relative_path}
CREATE POLICY "Users can upload own dataset files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'datasets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own dataset files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'datasets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own dataset files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'datasets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
