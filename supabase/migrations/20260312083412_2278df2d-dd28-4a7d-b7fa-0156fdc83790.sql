
-- Allow service role (edge functions) to delete dataset_files and datasets for abort
-- Add DELETE policies for authenticated users (needed for service role passthrough)
CREATE POLICY "Users can delete own dataset files"
  ON public.dataset_files
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM datasets d
    WHERE d.id = dataset_files.dataset_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own datasets"
  ON public.datasets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
