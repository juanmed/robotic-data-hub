-- Allow unauthenticated users to view accepted submissions
CREATE POLICY "submissions_public_select_accepted" ON public.challenge_submissions FOR SELECT
  TO anon
  USING (status = 'accepted');
