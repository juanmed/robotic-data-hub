# Public User Profile Feature — Phased Implementation Plan

## Feedback Integration Note (Claude CLI)
Integrated review feedback from Claude Code (v2.1.126), including:
- explicit removal of public read access on private `profiles`
- deterministic display-name fallback (`user_<last8uuid>`)
- profile-to-public-profile sync trigger on profile updates
- explicit aggregate filters in stats RPC (do not rely on RLS)
- pre-adding `challenges(user_id, status)` index for profile queries
- documenting stats cache staleness and invalidation expectations

## Objective
Implement a privacy-first public user profile at `/users/:id` that is readable by anonymous users, exposes only safe profile fields + platform contribution stats, and links from challenge creator surfaces.

## Scope Boundaries
- In scope:
  - Public display name, avatar, member-since
  - Public stats: active challenges created, successful challenge participations, ready datasets uploaded
  - Public list of created challenges (active only)
  - Creator-name links to `/users/:id`
- Out of scope (Phase 1):
  - Payments/billing visibility
  - Legal name/private settings/email exposure
  - Badge system and extended activity timeline

## Current-State Findings (Codebase)
- `public.profiles` currently stores private + public fields together: `name`, `email`, `email_verified`, `avatar_url`.
- There is a broad select policy: `Public can read profile name` with `USING (true)`, which permits public reads of the full row (including `email`).
- Challenge visibility is already constrained for public readers via RLS: `public.challenges` select is limited to `status = 'active'`.
- Dataset rows are owner-only by RLS, so public stats cannot rely on direct anon reads from `datasets`.

## Phase 1 — Foundation

### 1) Database + RLS (Privacy First)

#### 1.1 Create `public.public_profiles`
Rationale: avoid exposing private data from `profiles` while allowing anonymous profile reads.

Proposed table:
- `id uuid primary key references auth.users(id) on delete cascade`
- `display_name text not null default ''`
- `avatar_url text null`
- `member_since timestamptz not null default now()`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:
- `idx_public_profiles_display_name` on `(display_name)`

#### 1.2 Backfill + Sync
- Backfill from `profiles`:
  - `id = profiles.id`
  - `display_name = COALESCE(NULLIF(TRIM(profiles.name), ''), 'user_' || RIGHT(profiles.id::text, 8))`
  - `avatar_url = profiles.avatar_url`
  - `member_since = profiles.created_at`
- Update signup trigger path so new users also get `public_profiles` rows.
- Add sync trigger on `profiles` update to propagate `name/avatar_url` changes to `public_profiles`.

#### 1.3 RLS Policies
- `public_profiles`:
  - `SELECT` for `anon, authenticated` with `USING (true)`
  - `UPDATE` for owner only (`auth.uid() = id`)
  - `INSERT` owner/service only
- `profiles` (private):
  - explicit owner-only `SELECT` and `UPDATE` policies
  - drop permissive `Public can read profile name` policy

#### 1.4 Public Stats RPC (security definer)
Create RPC function `public.get_public_profile_stats(target_user_id uuid)` returning:
- `total_challenges_created` (`challenges.user_id = target_user_id AND challenges.status = 'active'`)
- `total_successful_participations` (`challenge_submissions.submitter_id = target_user_id AND status = 'accepted'`)
- `total_datasets_uploaded` (`datasets.user_id = target_user_id AND datasets.status = 'ready'`)

Security notes:
- `SECURITY DEFINER` with controlled `search_path`
- returns aggregates only
- explicit filters in SQL; does not rely on caller RLS
- grant execute to `anon, authenticated`

#### 1.5 Query Indexes
- Add `idx_challenges_user_id_status` on `public.challenges(user_id, status)`.

### 2) Type Model

Add to `src/types/index.ts`:
- `PublicUserProfile`: `id`, `display_name`, `avatar_url`, `member_since`
- `PublicUserProfileStats`: `total_challenges_created`, `total_successful_participations`, `total_datasets_uploaded`
- `PublicUserProfilePageData`: `profile`, `stats`, `created_challenges`

Keep private profile types separated from public interfaces.

### 3) Service Layer

Create `src/services/userProfileService.ts` using existing service conventions.

Methods:
- `getPublicProfile(userId: string)`
- `getProfileStats(userId: string)` via RPC
- `listPublicChallengesByUser(userId: string, page = 1, pageSize = 12)` using offset pagination
- `getPublicProfilePageData(userId: string)` with parallel fetch

Caching plan:
- `['public-profile', userId]` staleTime 10m
- `['public-profile-stats', userId]` staleTime 5m
- `['public-profile-challenges', userId, page]` staleTime 2m

Staleness note:
- Stats can be stale for up to 5m by design unless explicitly invalidated after challenge/submission mutations.

### 4) UI + Routing

#### 4.1 Route
- Add `/users/:id` route in `src/App.tsx` mapped to `PublicUserProfilePage`.

#### 4.2 Page component
Create `src/pages/PublicUserProfilePage.tsx`:
- Header: avatar, display name, member-since
- Stats cards row (3 metrics)
- Active created challenges list
- Empty states: profile not found / no active challenges
- Mobile-first responsive layout

### 5) Integration Points (Link Activation)

Replace creator name text with links where creator/user id is available:
- Challenge detail creator display area (current equivalent surfaces)
- `ChallengeCard` creator line
- `MarketplaceCard` and listing creator line

Constraint: no behavior change to challenge detail flow besides link activation.

### 6) Test Strategy

#### 6.1 Unit tests
- `userProfileService` mapping, missing profile handling, stats RPC mapping, active-only query behavior.

#### 6.2 Integration tests (RLS)
- anon can read `public_profiles`
- anon cannot read `profiles.email`
- public profile challenge list excludes non-active statuses

#### 6.3 UI integration tests
- `/users/:id` route rendering
- empty states
- creator link navigation from challenge/marketplace surfaces

### 7) Performance Targets
- 2-3 parallel requests for profile load
- paginate challenges (default 12)
- pre-index `challenges(user_id, status)`
- target <200ms under normal load

---

## Phase 2 — Optional Enhancements
- Participation history timeline
- Public badges/reputation
- Optional denormalized/materialized stats if traffic grows
- Broader profile linking from submissions/leaderboards

---

## Implementation Sequence
1. Migration: `public_profiles`, backfill, sync triggers, RLS tightening, stats RPC, index.
2. Update Supabase types.
3. Implement `userProfileService` + unit tests.
4. Build `PublicUserProfilePage` and route.
5. Activate creator links in challenge/marketplace/listing surfaces.
6. Add/update integration tests.
7. Run targeted then full tests.
