DROP POLICY IF EXISTS "blog_media_blogger_upload" ON storage.objects;
CREATE POLICY "blog_media_blogger_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-media'::text
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "blog_media_public_read" ON storage.objects;
CREATE POLICY "blog_media_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-media'::text);

DROP POLICY IF EXISTS "blog_media_blogger_delete" ON storage.objects;
CREATE POLICY "blog_media_blogger_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-media'::text
  AND auth.uid()::text = (storage.foldername(name))[1]
);