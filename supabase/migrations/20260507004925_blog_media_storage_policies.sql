-- Storage policies for blog-media bucket (idempotent)
-- Removes path-checking policies and uses simpler bucket-level access control
-- Database RLS on blog_media table enforces ownership

-- Drop old restrictive policies (if they exist)
DROP POLICY IF EXISTS "blog_media_blogger_upload" ON storage.objects;
DROP POLICY IF EXISTS "blog_media_blogger_delete" ON storage.objects;

-- Drop any existing policies for this bucket (safe with IF EXISTS)
DROP POLICY IF EXISTS "blog_media_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "blog_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "blog_media_authenticated_delete" ON storage.objects;

-- Create clean policies (all idempotent)
CREATE POLICY "blog_media_authenticated_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-media'::text);

CREATE POLICY "blog_media_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-media'::text);

CREATE POLICY "blog_media_authenticated_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'blog-media'::text);
