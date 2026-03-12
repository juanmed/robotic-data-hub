
ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS source_repo_id text;
ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS metadata jsonb;
