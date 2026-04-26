-- ============================================================
-- Challenges Feature: tables, triggers, indexes, RLS, storage
-- ============================================================

-- 1. challenges table
CREATE TABLE public.challenges (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL,
  title               text        NOT NULL CHECK (length(trim(title)) > 0),
  description         text        NOT NULL DEFAULT '',
  status              text        NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft','active','inactive','closed')),
  compensation_amount integer     NOT NULL DEFAULT 0 CHECK (compensation_amount >= 0),
  compensation_per    text        NOT NULL DEFAULT 'dataset'
                                  CHECK (compensation_per IN ('dataset','challenge')),
  currency            text        NOT NULL DEFAULT 'USD'
                                  CHECK (currency IN ('USD','KRW')),
  deadline            timestamptz,
  constraints         text        NOT NULL DEFAULT '',
  conditions          text        NOT NULL DEFAULT '',
  tags                text[]      NOT NULL DEFAULT '{}',
  submission_count    integer     NOT NULL DEFAULT 0,
  published_at        timestamptz,
  closed_at           timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_challenges_user     ON public.challenges (user_id, created_at DESC);
CREATE INDEX idx_challenges_active   ON public.challenges (created_at DESC) WHERE status = 'active';
CREATE INDEX idx_challenges_deadline  ON public.challenges (deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_challenges_tags     ON public.challenges USING GIN (tags);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges_owner_crud" ON public.challenges FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "challenges_public_read_active" ON public.challenges FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Status transition trigger
CREATE OR REPLACE FUNCTION public.validate_challenge_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.status = 'draft'    AND NEW.status IN ('active','closed')) OR
    (OLD.status = 'active'   AND NEW.status IN ('inactive','closed')) OR
    (OLD.status = 'inactive' AND NEW.status IN ('active','closed'))
  ) THEN
    RAISE EXCEPTION 'Invalid challenge status transition from % to %', OLD.status, NEW.status;
  END IF;

  IF NEW.status = 'active' AND OLD.status = 'draft' THEN
    NEW.published_at := now();
  END IF;
  IF NEW.status = 'closed' THEN
    NEW.closed_at := now();
  END IF;
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_challenge_status
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.validate_challenge_status_transition();

-- 2. challenge_media table
CREATE TABLE public.challenge_media (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id  uuid        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL,
  storage_path  text        NOT NULL,
  file_name     text        NOT NULL,
  content_type  text        NOT NULL,
  size_bytes    bigint,
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_challenge_media_order ON public.challenge_media (challenge_id, sort_order);

ALTER TABLE public.challenge_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenge_media_owner_crud" ON public.challenge_media FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "challenge_media_public_read" ON public.challenge_media FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_id AND c.status = 'active'
  ));

-- 3. challenge_submissions table
CREATE TABLE public.challenge_submissions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id  uuid        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  dataset_id    uuid        NOT NULL REFERENCES public.datasets(id),
  submitter_id  uuid        NOT NULL,
  message       text        NOT NULL DEFAULT '',
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','accepted','rejected')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, dataset_id)
);

CREATE INDEX idx_submissions_challenge ON public.challenge_submissions (challenge_id, created_at DESC);
CREATE INDEX idx_submissions_submitter ON public.challenge_submissions (submitter_id, created_at DESC);

ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

-- Submitter can view own submissions
CREATE POLICY "submissions_submitter_select" ON public.challenge_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = submitter_id);

-- Submitter can insert (active challenges, own datasets, not own challenge)
CREATE POLICY "submissions_submitter_insert" ON public.challenge_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = submitter_id
    AND EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND c.status = 'active' AND c.user_id != auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.datasets d
      WHERE d.id = dataset_id AND d.user_id = auth.uid() AND d.status = 'ready'
    )
  );

-- Challenge owner can view submissions for their challenges
CREATE POLICY "submissions_owner_select" ON public.challenge_submissions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_id AND c.user_id = auth.uid()
  ));

-- Challenge owner can update submission status
CREATE POLICY "submissions_owner_update" ON public.challenge_submissions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_id AND c.user_id = auth.uid()
  ));

-- Submission count trigger
CREATE OR REPLACE FUNCTION public.update_challenge_submission_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.challenges SET submission_count = submission_count + 1 WHERE id = NEW.challenge_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.challenges SET submission_count = submission_count - 1 WHERE id = OLD.challenge_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_submission_count
  AFTER INSERT OR DELETE ON public.challenge_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_challenge_submission_count();

-- 4. Storage bucket for challenge media
INSERT INTO storage.buckets (id, name, public)
VALUES ('challenge-media', 'challenge-media', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "challenge_media_storage_insert" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'challenge-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "challenge_media_storage_select" ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'challenge-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "challenge_media_storage_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'challenge-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read via signed URLs
CREATE POLICY "challenge_media_storage_public_read" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'challenge-media');
