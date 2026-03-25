CREATE POLICY "Public can read profile name"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);