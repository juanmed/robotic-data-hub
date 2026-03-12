
-- Drop trigger+function with CASCADE
DROP TRIGGER IF EXISTS on_datasets_updated ON public.datasets;
DROP FUNCTION IF EXISTS public.handle_datasets_updated_at() CASCADE;

-- Datasets: rename name→display_name, drop source_format & updated_at, add confirmed_at
ALTER TABLE public.datasets RENAME COLUMN name TO display_name;
ALTER TABLE public.datasets DROP COLUMN IF EXISTS source_format;
ALTER TABLE public.datasets DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE public.datasets ALTER COLUMN status SET DEFAULT 'uploading';
UPDATE public.datasets SET status = 'uploading' WHERE status = 'draft';

-- Validation trigger for datasets.status
CREATE OR REPLACE FUNCTION public.validate_dataset_status()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status NOT IN ('uploading', 'ready', 'failed') THEN
    RAISE EXCEPTION 'Invalid dataset status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_dataset_status
  BEFORE INSERT OR UPDATE ON public.datasets
  FOR EACH ROW EXECUTE FUNCTION public.validate_dataset_status();

-- Simplify datasets RLS
DROP POLICY IF EXISTS "Users can delete own datasets" ON public.datasets;
DROP POLICY IF EXISTS "Users can insert own datasets" ON public.datasets;
DROP POLICY IF EXISTS "Users can select own datasets" ON public.datasets;
DROP POLICY IF EXISTS "Users can update own datasets" ON public.datasets;
CREATE POLICY "owner access" ON public.datasets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Dataset files: drop checksum, add unique, validation trigger
ALTER TABLE public.dataset_files DROP COLUMN IF EXISTS checksum;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dataset_files_dataset_id_relative_path_key'
  ) THEN
    ALTER TABLE public.dataset_files ADD CONSTRAINT dataset_files_dataset_id_relative_path_key UNIQUE (dataset_id, relative_path);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.validate_dataset_file_status()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.upload_status NOT IN ('pending', 'uploaded') THEN
    RAISE EXCEPTION 'Invalid upload_status: %', NEW.upload_status;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_dataset_file_status
  BEFORE INSERT OR UPDATE ON public.dataset_files
  FOR EACH ROW EXECUTE FUNCTION public.validate_dataset_file_status();

DROP POLICY IF EXISTS "Users can delete own dataset files" ON public.dataset_files;
DROP POLICY IF EXISTS "Users can insert own dataset files" ON public.dataset_files;
DROP POLICY IF EXISTS "Users can select own dataset files" ON public.dataset_files;
DROP POLICY IF EXISTS "Users can update own dataset files" ON public.dataset_files;
CREATE POLICY "owner access" ON public.dataset_files
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.datasets d WHERE d.id = dataset_files.dataset_id AND d.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.datasets d WHERE d.id = dataset_files.dataset_id AND d.user_id = auth.uid())
  );

-- Upload keys: unique key_hash, simplify RLS
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'upload_keys_key_hash_key'
  ) THEN
    ALTER TABLE public.upload_keys ADD CONSTRAINT upload_keys_key_hash_key UNIQUE (key_hash);
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can insert own upload_keys" ON public.upload_keys;
DROP POLICY IF EXISTS "Users can read own upload_keys" ON public.upload_keys;
DROP POLICY IF EXISTS "Users can update own upload_keys" ON public.upload_keys;
CREATE POLICY "owner access" ON public.upload_keys
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
