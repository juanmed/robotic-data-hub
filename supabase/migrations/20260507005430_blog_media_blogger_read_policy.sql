-- Allow bloggers to read their own media for editing/preview (idempotent)

DROP POLICY IF EXISTS "blog_media_blogger_read" ON blog_media;
CREATE POLICY "blog_media_blogger_read"
ON blog_media
FOR SELECT
USING (
  uploaded_by = auth.uid()
);
