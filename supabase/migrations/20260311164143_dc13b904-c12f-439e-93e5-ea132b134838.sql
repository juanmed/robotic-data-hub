
-- Create private storage bucket for dataset files
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the datasets bucket
-- Users can upload to their own path: datasets/{user_id}/*
CREATE POLICY "Users can upload to own path"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'datasets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own files
CREATE POLICY "Users can read own dataset files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'datasets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role can manage all (for edge functions)
CREATE POLICY "Service role full access on datasets bucket"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'datasets')
  WITH CHECK (bucket_id = 'datasets');
