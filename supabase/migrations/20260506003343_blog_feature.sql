-- Blog feature: posts, media, roles, and RLS policies

-- Create app_role enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'blogger', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create has_role function if it doesn't exist
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role app_role)
  RETURNS boolean AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = $1 AND role = $2)
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- Blog status enum
DO $$ BEGIN
  CREATE TYPE public.blog_status AS ENUM ('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Blog posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id),
  slug text NOT NULL,
  title text NOT NULL,
  excerpt text DEFAULT '',
  body_md text DEFAULT '',
  status blog_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (status = 'draft' AND published_at IS NULL) OR
    (status = 'published' AND published_at IS NOT NULL)
  )
);

-- Indexes for common queries
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_unique ON public.blog_posts(lower(slug));
CREATE INDEX IF NOT EXISTS blog_posts_status_published_at ON public.blog_posts(status, published_at DESC)
  WHERE status = 'published'::blog_status;
CREATE INDEX IF NOT EXISTS blog_posts_created_at_desc ON public.blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_author_id ON public.blog_posts(author_id);

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_posts_update_timestamp ON public.blog_posts;
CREATE TRIGGER blog_posts_update_timestamp
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- Prevent slug changes after publish
CREATE OR REPLACE FUNCTION public.prevent_slug_change_after_publish()
  RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'published'::blog_status AND OLD.slug != NEW.slug THEN
    RAISE EXCEPTION 'Cannot change slug of published post';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_posts_prevent_slug_change ON public.blog_posts;
CREATE TRIGGER blog_posts_prevent_slug_change
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION prevent_slug_change_after_publish();

-- Blog media table
CREATE TABLE IF NOT EXISTS public.blog_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  content_type text NOT NULL,
  size_bytes integer,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_media_post_id ON public.blog_media(post_id);
CREATE INDEX IF NOT EXISTS blog_media_uploaded_by ON public.blog_media(uploaded_by);

-- Enable RLS on blog_posts (idempotent: enabling on already-enabled table is safe)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for blog_posts (DROP IF EXISTS + CREATE makes this safe to replay)
DROP POLICY IF EXISTS "blog_public_read_published" ON public.blog_posts;
CREATE POLICY "blog_public_read_published" ON public.blog_posts
  FOR SELECT
  USING (status = 'published'::blog_status);

DROP POLICY IF EXISTS "blog_blogger_all" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_blogger_insert" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_blogger_update_own" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_blogger_delete_own" ON public.blog_posts;

-- Bloggers can create posts
CREATE POLICY "blog_blogger_insert" ON public.blog_posts
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'blogger'::app_role) AND author_id = auth.uid());

-- Bloggers can update only their own posts
CREATE POLICY "blog_blogger_update_own" ON public.blog_posts
  FOR UPDATE
  USING (has_role(auth.uid(), 'blogger'::app_role) AND author_id = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'blogger'::app_role) AND author_id = auth.uid());

-- Bloggers can delete only their own posts
CREATE POLICY "blog_blogger_delete_own" ON public.blog_posts
  FOR DELETE
  USING (has_role(auth.uid(), 'blogger'::app_role) AND author_id = auth.uid());

-- Enable RLS on blog_media (idempotent: enabling on already-enabled table is safe)
ALTER TABLE public.blog_media ENABLE ROW LEVEL SECURITY;

-- RLS policies for blog_media (DROP IF EXISTS + CREATE makes this safe to replay)
DROP POLICY IF EXISTS "blog_media_public_read" ON public.blog_media;
CREATE POLICY "blog_media_public_read" ON public.blog_media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.blog_posts WHERE id = post_id AND status = 'published'::blog_status
    )
  );

DROP POLICY IF EXISTS "blog_media_blogger_insert" ON public.blog_media;
CREATE POLICY "blog_media_blogger_insert" ON public.blog_media
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'blogger'::app_role) AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS "blog_media_blogger_delete" ON public.blog_media;
CREATE POLICY "blog_media_blogger_delete" ON public.blog_media
  FOR DELETE
  USING (has_role(auth.uid(), 'blogger'::app_role));

-- Seed first blogger role for fer@gamiphy.ai (only if user exists)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'blogger'::app_role FROM auth.users WHERE email = 'fer@gamiphy.ai'
ON CONFLICT (user_id, role) DO NOTHING;
