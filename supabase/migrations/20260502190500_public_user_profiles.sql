-- Public user profiles and stats for /users/:id

CREATE TABLE IF NOT EXISTS public.public_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  member_since timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.public_profiles
  ADD COLUMN IF NOT EXISTS display_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS member_since timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_public_profiles_display_name
  ON public.public_profiles (display_name);

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_profiles_read" ON public.public_profiles;
CREATE POLICY "public_profiles_read"
  ON public.public_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "public_profiles_owner_update" ON public.public_profiles;
CREATE POLICY "public_profiles_owner_update"
  ON public.public_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "public_profiles_owner_insert" ON public.public_profiles;
CREATE POLICY "public_profiles_owner_insert"
  ON public.public_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Remove permissive read policy from private profiles table
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can read profile name" ON public.profiles';
  END IF;
END
$$;

-- Sync private profile fields to public profile projection
CREATE OR REPLACE FUNCTION public.sync_public_profile_from_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.public_profiles (id, display_name, avatar_url, member_since, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.name), ''), 'user_' || RIGHT(NEW.id::text, 8)),
    NEW.avatar_url,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    member_since = LEAST(public.public_profiles.member_since, EXCLUDED.member_since),
    updated_at = now();

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_profiles_sync_public_profile ON public.profiles';
    EXECUTE 'CREATE TRIGGER trg_profiles_sync_public_profile
      AFTER INSERT OR UPDATE OF name, avatar_url ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_public_profile_from_profiles()';
  END IF;
END
$$;

-- Backfill public profiles
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    INSERT INTO public.public_profiles (id, display_name, avatar_url, member_since, created_at, updated_at)
    SELECT
      p.id,
      COALESCE(NULLIF(TRIM(p.name), ''), 'user_' || RIGHT(p.id::text, 8)),
      p.avatar_url,
      p.created_at,
      p.created_at,
      now()
    FROM public.profiles p
    ON CONFLICT (id) DO UPDATE
    SET
      display_name = EXCLUDED.display_name,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = now();
  END IF;
END
$$;

-- Public profile stats RPC (explicit filters; no private row payloads)
CREATE OR REPLACE FUNCTION public.get_public_profile_stats(target_user_id uuid)
RETURNS TABLE (
  total_challenges_created bigint,
  total_successful_participations bigint,
  total_datasets_uploaded bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      SELECT COUNT(*)
      FROM public.challenges c
      WHERE c.user_id = target_user_id
        AND c.status = 'active'
    ) AS total_challenges_created,
    (
      SELECT COUNT(*)
      FROM public.challenge_submissions cs
      WHERE cs.submitter_id = target_user_id
        AND cs.status = 'accepted'
    ) AS total_successful_participations,
    (
      SELECT COUNT(*)
      FROM public.datasets d
      WHERE d.user_id = target_user_id
        AND d.status = 'ready'
    ) AS total_datasets_uploaded;
$$;

REVOKE ALL ON FUNCTION public.get_public_profile_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile_stats(uuid) TO anon, authenticated;

DO $$
BEGIN
  IF to_regclass('public.challenges') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_challenges_user_id_status ON public.challenges (user_id, status)';
  END IF;
END
$$;
