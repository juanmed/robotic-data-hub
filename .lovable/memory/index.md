# Memory: index.md
Updated: now

Project domain is gamiphy.ai - never use Lovable project URLs. All auth redirects must point to https://gamiphy.ai. Deployed via GitHub Pages with Cloudflare DNS. Font: DM Sans (not SF Pro Display).

## Marketplace
- Listings table backed by Supabase with `price_amount` (smallest currency unit) + `currency` (ISO 4217) instead of `price_cents`
- `platform_fee_bps` stored per-listing (default 1000 = 10%), configurable in `src/lib/marketplace.ts`
- License stored as text field per-listing
- One listing per dataset (UNIQUE constraint on dataset_id)
- Orders table with `amount` + `currency` fields
- All marketplace config centralized in `src/lib/marketplace.ts` (currencies, licenses, fee)
