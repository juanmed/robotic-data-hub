-- Allow unauthenticated users to view accepted submissions for active challenges
CREATE POLICY "submissions_public_select_accepted" ON public.challenge_submissions FOR SELECT
  TO anon
  USING (
    status = 'accepted'
    AND EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND c.status = 'active'
    )
  );
