# Comments/Discussion Implementation Plan (Lovable Native, Zero-Cost)

## Goal
Implement a modular comments/discussion system that is zero-cost, secure, maintainable, and reusable across multiple platform domains (Challenges now; Datasets and Blog later) using Lovable Cloud (Postgres + RLS + Realtime + Edge Functions).

## Decision Summary
Use a native Lovable architecture instead of external OSS comment platforms.

Rationale:
- Zero additional infra cost and no extra auth system.
- Reuses existing auth, RLS, DB, edge functions, logging, and frontend patterns.
- Clean extension path to domain-scoped comments via a single reusable model.

## Scope
- V1 domain: `challenge` comments.
- Shared architecture from day one for future domains: `dataset`, `blog_post`.
- Threaded comments (1-level replies in V1).
- Moderation basics: report, hide/unhide, soft delete.
- Anti-spam baseline without paid services.

## Architecture

### 1. Data model (generic, domain-extensible)
Prefer one generic comments table keyed by `(target_type, target_id)` to avoid duplicating logic.

#### `public.comments`
- `id uuid pk default gen_random_uuid()`
- `target_type text not null` -- enum-like check: `challenge | dataset | blog_post`
- `target_id uuid not null`
- `parent_id uuid null references public.comments(id) on delete cascade`
- `author_id uuid not null`
- `body_md text not null`
- `status text not null default 'visible'` -- `visible | hidden | flagged | deleted`
- `depth smallint not null default 0` -- v1 enforce `0|1`
- `reply_count integer not null default 0`
- `edited_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:
- `(target_type, target_id, created_at desc)`
- `(parent_id, created_at asc)`
- `(author_id, created_at desc)`
- partial index for moderation: `(target_type, target_id, created_at desc) where status in ('flagged','hidden')`

Constraints/triggers:
- `body_md` length (e.g., 1..5000) validated in trigger.
- `depth` computed server-side from `parent_id` and capped to 1 in V1.
- `parent` must share same `(target_type, target_id)`.
- `updated_at` auto-maintained.
- `reply_count` maintained on insert/delete child rows.

#### `public.comment_reports`
- `id uuid pk`
- `comment_id uuid not null references public.comments(id) on delete cascade`
- `reporter_id uuid not null`
- `reason text not null`
- `created_at timestamptz not null default now()`
- unique `(comment_id, reporter_id)`

#### `public.comment_rate_limits` (optional durable throttle)
Only if trigger-based rolling-window query is too expensive at scale. For current expected load, skip initially and use query-based trigger.

### 2. RLS and authorization

#### Read
- Public (`anon` + `authenticated`) can read `visible` comments only when target resource is publicly visible.
- Resource visibility is delegated by `target_type` helper SQL function:
  - `challenge`: challenge status active.
  - `dataset`: dataset visibility rules.
  - `blog_post`: published status.

#### Insert
- Authenticated + email-verified users only.
- `author_id = auth.uid()` enforced by `with check`.
- Target must be commentable and visible.
- Trigger blocks rate-limit violations and malformed/thread-breaking rows.

#### Update
- Author can edit own visible comment for 15 minutes; cannot change `target_*`, `author_id`, `parent_id`, `depth`.
- Owner/moderator of the target resource can set `status` to `hidden`/`visible` and annotate moderation metadata later if needed.

#### Delete
- Soft delete preferred: set `status='deleted'`, replace body with tombstone marker in trigger/service.
- Hard delete reserved for admin-only maintenance.

### 3. Anti-spam and safety layers

Layer 1: account gate
- Require authenticated, email-verified users to post.

Layer 2: rate-limit trigger (DB)
- Example policy:
  - max 5 comments per 60 seconds per user
  - max 100 comments per 24h per user
- Raise SQL exception with stable error code consumed by UI.

Layer 3: content validation
- Server trigger validates length, emptiness after trim, depth rules.
- Client uses zod mirror validation.

Layer 4: sanitization
- Render markdown with `react-markdown + remark-gfm + rehype-sanitize`.
- Disallow raw HTML/script; allow safe markdown only.

Layer 5: abuse reporting + moderation
- Users can report once per comment.
- Target owner can review flagged/reported comments in moderation panel.

Optional Layer 6 (phase 2): AI moderation edge function
- Async classify spam/toxicity using Lovable AI Gateway.
- If high-risk, set `status='flagged'` and log structured moderation event.
- Keep out of V1 unless spam appears.

### 4. Realtime and delivery
- Add `comments` table to realtime publication.
- UI subscribes by `target_type + target_id` filter.
- Optimistic insert for fast UX; reconcile with realtime payload.

### 5. Logging/observability
- Reuse existing shared edge-function logging helper for moderation events.
- Add minimal `comment_moderation_events` table only if in-app audit trail is required.
- Track metrics (daily cron or SQL view): comments/day, reports/day, hide rate, rate-limit hit rate.

## Frontend plan

### 1. Domain-agnostic modules
Create reusable comment module:
- `src/services/commentService.ts`
- `src/hooks/useComments.ts`
- `src/components/comments/CommentThread.tsx`
- `src/components/comments/CommentItem.tsx`
- `src/components/comments/CommentComposer.tsx`
- `src/components/comments/ModerationPanel.tsx`

Core API shape:
- `list(targetType, targetId)`
- `create(payload)`
- `reply(parentId, payload)`
- `edit(commentId, bodyMd)`
- `softDelete(commentId)`
- `report(commentId, reason)`
- `setStatus(commentId, status)` (owner/moderator)
- `subscribe(targetType, targetId)`

### 2. Challenge integration (V1)
- Replace placeholder `src/pages/challenge-tabs/DiscussionTab.tsx` with shared `CommentThread` container.
- Pass target props: `{ targetType: 'challenge', targetId: challenge.id }`.
- Show owner-only moderation panel when `isOwner`.

### 3. Reuse for Datasets and Blog (V1.1)
- Drop-in same container in dataset detail and blog post pages.
- Only resource permission helpers and page wiring differ.

## Database migration sequence
1. Create `comments` and `comment_reports` tables + indexes.
2. Create helper SQL functions:
- `is_email_verified(uid)`
- `can_read_comment_target(target_type, target_id)`
- `can_moderate_comment_target(target_type, target_id)`
3. Create validation + rate-limit triggers.
4. Enable RLS + policies.
5. Add table to realtime publication.
6. Backfill not required (new feature).

## API/Edge function sequence
1. Implement comment service operations in frontend via Supabase client.
2. Add optional edge endpoint for async moderation (feature-flagged off by default).
3. Standardize error mapping for RLS/trigger violations to user-friendly toasts.

## Rollout plan

### Phase 1 (MVP, recommended)
- Schema + RLS + triggers
- Challenge DiscussionTab with thread, reply, edit, soft delete, report
- Owner moderation panel (hide/unhide)
- Realtime updates
- Basic telemetry/logging

### Phase 2 (only if abuse appears)
- Async AI moderation edge function
- Auto-flag queue + owner notifications
- Optional stricter cooldowns for new accounts

### Phase 3 (engagement enhancements)
- Mentions/notifications
- Reactions/upvotes
- Attachments/image uploads (optional)

## Testing plan

### SQL/RLS tests
- Public can read visible comments on public targets.
- Auth user can insert only as self and only for allowed targets.
- Non-owner cannot moderate others’ comments.
- Edit window enforcement works (<=15m allowed, >15m denied).
- Rate limit trigger rejects excess burst/day usage.
- Reply parent mismatch and depth overflow rejected.

### UI tests
- Thread renders root + replies in stable order.
- Optimistic comment create reconciles with realtime without duplicates.
- Deleted comment preserves thread shape (tombstone behavior).
- Report action disabled after user reports once.

### Security tests
- XSS payload in markdown rendered inert.
- RLS bypass attempts from client rejected.

## Operational defaults
- Body size cap: 5000 chars.
- Reply depth cap: 1.
- Sort order: newest root first, replies oldest first.
- Soft delete retention: indefinite in V1.
- Rate limits: 5/min burst, 100/day steady.

## Risks and mitigations
- Generic polymorphic target checks can become complex.
  - Mitigation: encapsulate in SQL helper functions and test each target type.
- Realtime duplicate events with optimistic UI.
  - Mitigation: idempotent merge by comment id.
- Moderation burden on challenge owners.
  - Mitigation: start with hide/report only, add automation later.

## Why this is the best fit for your platform now
- Zero extra hosting and no external account requirements.
- Full alignment with Lovable’s DB + edge model.
- Minimal moving parts and clear modular extension across Challenges, Datasets, and Blog.
