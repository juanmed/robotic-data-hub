
-- ============================================================
-- Table: datasets
-- Stores metadata for each uploaded dataset
-- ============================================================
CREATE TABLE public.datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  source_format text NOT NULL DEFAULT 'lerobot',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'uploading', 'ready', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.datasets IS 'User datasets uploaded via CLI or web';
COMMENT ON COLUMN public.datasets.status IS 'One of: draft, uploading, ready, failed';

-- Index for user lookups
CREATE INDEX idx_datasets_user_id ON public.datasets(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_datasets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_datasets_updated
  BEFORE UPDATE ON public.datasets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_datasets_updated_at();

-- RLS
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own datasets"
  ON public.datasets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own datasets"
  ON public.datasets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own datasets"
  ON public.datasets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Table: dataset_files
-- Individual files within a dataset
-- ============================================================
CREATE TABLE public.dataset_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  relative_path text NOT NULL,
  storage_path text NOT NULL,
  content_type text,
  size_bytes bigint,
  checksum text,
  upload_status text NOT NULL DEFAULT 'pending'
    CHECK (upload_status IN ('pending', 'uploaded', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.dataset_files IS 'Files belonging to a dataset upload';

-- Index for dataset lookups
CREATE INDEX idx_dataset_files_dataset_id ON public.dataset_files(dataset_id);

-- RLS: access scoped through dataset ownership
ALTER TABLE public.dataset_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own dataset files"
  ON public.dataset_files FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.datasets d WHERE d.id = dataset_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own dataset files"
  ON public.dataset_files FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.datasets d WHERE d.id = dataset_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own dataset files"
  ON public.dataset_files FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.datasets d WHERE d.id = dataset_id AND d.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.datasets d WHERE d.id = dataset_id AND d.user_id = auth.uid()
  ));

-- ============================================================
-- Index on upload_keys.user_id (if not already present)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_upload_keys_user_id ON public.upload_keys(user_id);
