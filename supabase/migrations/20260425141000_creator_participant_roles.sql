-- Creator/Participant role support for challenge submissions

-- Allow submitting to any active challenge, including own challenges
DROP POLICY IF EXISTS "submissions_submitter_insert" ON public.challenge_submissions;

CREATE POLICY "submissions_submitter_insert" ON public.challenge_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = submitter_id
    AND EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND c.status = 'active'
    )
    AND EXISTS (
      SELECT 1 FROM public.datasets d
      WHERE d.id = dataset_id AND d.user_id = auth.uid() AND d.status = 'ready'
    )
  );

-- Allow submitters to withdraw only pending submissions
CREATE POLICY "submissions_submitter_delete_pending" ON public.challenge_submissions FOR DELETE
  TO authenticated
  USING (auth.uid() = submitter_id AND status = 'pending');
