

# Publish-to-Marketplace Flow

## Overview
Add a real `listings` table to the database and a "Publish to Marketplace" flow on the dataset detail page. Datasets with status "ready" get a publish button that opens a modal where users set price, currency, license, and description. Published listings appear on the marketplace. Prices, currency, platform fee, and license are all configurable and stored in the DB for future flexibility (e.g., Korean Won support).

## Database Changes

### 1. Create `listings` table (migration)
```sql
CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dataset_id uuid NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_amount integer NOT NULL DEFAULT 0,       -- price in smallest currency unit (cents, won)
  currency text NOT NULL DEFAULT 'USD',           -- ISO 4217 code
  platform_fee_bps integer NOT NULL DEFAULT 1000, -- platform fee in basis points (1000 = 10%)
  license text NOT NULL DEFAULT 'CC-BY-4.0',      -- license identifier
  tags text[] NOT NULL DEFAULT '{}',
  download_count integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(dataset_id)
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Owner can CRUD their own listings
CREATE POLICY "owner_crud" ON public.listings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone can read published listings
CREATE POLICY "public_read" ON public.listings FOR SELECT
  TO anon, authenticated
  USING (published = true);
```

Key design decisions:
- `price_amount` + `currency` instead of `price_cents` — supports any currency
- `platform_fee_bps` stored per-listing so fee changes don't retroactively affect old listings
- `license` is a text field for flexibility
- `UNIQUE(dataset_id)` — one listing per dataset

### 2. Create `orders` table (migration)
```sql
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
```

## Code Changes

### 3. Update `Listing` type in `src/types/index.ts`
Replace the mock-oriented `Listing` type with fields matching the new table: `dataset_id`, `price_amount`, `currency`, `platform_fee_bps`, `license`. Keep `Order` type aligned with new `orders` table.

### 4. Rewrite `src/services/listingService.ts`
Replace mock implementation with real Supabase queries:
- `list()` — select published listings (public read)
- `get(id)` — single listing by id
- `getByDataset(datasetId)` — check if dataset already has a listing
- `publish(data)` — insert new listing
- `update(id, data)` — update price/license/description
- `unpublish(id)` — set published = false

### 5. Update `src/services/orderService.ts`
Point at real `orders` table instead of mock data.

### 6. Create `PublishDatasetModal` component
A modal with:
- **Price input**: numeric field + currency selector (USD default, KRW placeholder for future)
- **Free toggle**: switch to set price to 0
- **License selector**: dropdown with options (CC-BY-4.0, CC-BY-NC-4.0, MIT, Commercial, Research-Only)
- **Description & tags**: text area + tag input
- **Fee transparency**: "You receive $X.XX (10% platform fee)" calculated display
- Platform fee percentage read from a constant (easily changeable)

### 7. Add "Publish to Marketplace" button on `DatasetDetailPage`
- Show button only when `dataset.status === "ready"` and no existing listing
- If already published, show "Edit Listing" and "Unpublish" options
- Opens `PublishDatasetModal`

### 8. Update `MarketplacePage` and `ListingPage`
- Fetch from real `listings` table instead of mock service
- Display currency-aware prices (format USD as `$X.XX`, KRW as `₩X`)
- Show license badge on listing cards and detail page

### 9. Update tests
- Update `listingService` tests for new Supabase-backed methods
- Update marketplace integration tests

## Configuration Constants
Create `src/lib/marketplace.ts`:
```typescript
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', decimals: 2 },
  { code: 'KRW', symbol: '₩', decimals: 0 },
] as const;

export const LICENSE_OPTIONS = [
  { value: 'CC-BY-4.0', label: 'CC BY 4.0' },
  { value: 'CC-BY-NC-4.0', label: 'CC BY-NC 4.0' },
  { value: 'MIT', label: 'MIT License' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'research-only', label: 'Research Only' },
] as const;

export const DEFAULT_PLATFORM_FEE_BPS = 1000; // 10%

export function formatPrice(amount: number, currency: string): string { ... }
export function calcSellerReceives(amount: number, feeBps: number): number { ... }
```

This centralizes all marketplace config so changing currencies, fees, or licenses is a single-file edit.

