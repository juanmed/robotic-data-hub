
-- Create listings table
CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dataset_id uuid NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  platform_fee_bps integer NOT NULL DEFAULT 1000,
  license text NOT NULL DEFAULT 'CC-BY-4.0',
  tags text[] NOT NULL DEFAULT '{}',
  download_count integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(dataset_id)
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_crud" ON public.listings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "public_read" ON public.listings FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- Create orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id),
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer_read" ON public.orders FOR SELECT
  TO authenticated USING (auth.uid() = buyer_id);

CREATE POLICY "buyer_insert" ON public.orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = buyer_id);
