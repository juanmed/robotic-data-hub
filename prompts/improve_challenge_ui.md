# Improve Challenge UI — Implementation Plan

## Context

The platform is a React 18 + Vite + Tailwind + shadcn/ui + Supabase application. Users can create
challenges that appear in the marketplace. Each challenge has a detail page (`ChallengeDetailPage.tsx`)
that currently shows all content in a single scrolling view. The goal is to replace this with a
Kaggle/HuggingFace-style tabbed layout.

## Current State

- **Routes**: `/marketplace/challenges/:id` and `/dashboard/challenges/:id` both render `ChallengeDetailPage.tsx`
- **Data model**: `challenges` table has `description`, `constraints`, `conditions`, `tags`, `deadline`,
  `compensation_amount`, `compensation_per`, `currency`, `status`, `submission_count`
- **Existing services**: `challengeService`, `challengeMediaService`, `challengeSubmissionService`
- **Already installed**: `react-router-dom` v6, `@tanstack/react-query`, `shadcn/ui` (Tabs included),
  `date-fns`, `lucide-react`, `recharts`, `react-hook-form`, `zod`
- **Missing for this feature**: TipTap, `react-markdown`, `@tanstack/react-table`

---

## Phase 1 — Tabbed Shell with Nested Routes

### Goal
Replace the flat `ChallengeDetailPage` with a `ChallengeLayout` that hosts nested routes. Each tab is a
bookmarkable URL segment.

### New Route Structure

```
/marketplace/challenges/:id             → redirect to /marketplace/challenges/:id/overview
/marketplace/challenges/:id/overview    → OverviewTab
/marketplace/challenges/:id/rules       → RulesTab
/marketplace/challenges/:id/submissions → SubmissionsTab
/marketplace/challenges/:id/discussion  → DiscussionTab (placeholder)
/marketplace/challenges/:id/leaderboard → LeaderboardTab (placeholder)

/dashboard/challenges/:id               → redirect to /dashboard/challenges/:id/overview
/dashboard/challenges/:id/overview      → OverviewTab
/dashboard/challenges/:id/rules         → RulesTab
/dashboard/challenges/:id/submissions   → SubmissionsTab (owner view with accept/reject)
/dashboard/challenges/:id/discussion    → DiscussionTab (placeholder)
/dashboard/challenges/:id/leaderboard   → LeaderboardTab (placeholder)
```

### Files to Create / Modify

#### `src/pages/ChallengeLayout.tsx` (new)
- Fetches challenge by `id` using `challengeService.get(id)`
- Renders: hero header (title, status badge, deadline, compensation, creator), shadcn `<Tabs>` nav,
  `<Outlet />` for tab content
- Computes `isOwner` via `useAuth()` comparing `challenge.user_id` to current user id
- Passes `challenge` and `isOwner` down via React context (`ChallengeContext`)
- Shows owner action buttons (Edit, Publish, Close, Activate/Deactivate) in the header

#### `src/context/ChallengeContext.tsx` (new)
- `ChallengeContext` with `challenge: Challenge`, `isOwner: boolean`, `refetch: () => void`
- `useChallengeContext()` hook

#### `src/pages/challenge-tabs/OverviewTab.tsx` (new)
- Renders `challenge.description` as markdown (using `react-markdown` + `remark-gfm`)
- Renders challenge media carousel (reuse existing `challengeMediaService.list()`)
- Shows sidebar: tags, deadline countdown, compensation details, submission count

#### `src/pages/challenge-tabs/RulesTab.tsx` (new)
- Renders `challenge.constraints` and `challenge.conditions` as markdown sections
- If `isOwner`, shows an Edit button that opens TipTap inline editor (Phase 2)
- Phase 1: read-only markdown render only

#### `src/pages/challenge-tabs/SubmissionsTab.tsx` (new)
- Participants: shows their own submissions with status badges, withdraw button
- Owners: shows all submissions with enriched dataset + submitter info, accept/reject actions
- Reuses `challengeSubmissionService.listForChallengeEnriched()` and `challengeSubmissionService.listMine()`
- For participants who haven't submitted: shows `<SubmitDatasetModal>` trigger

#### `src/pages/challenge-tabs/DiscussionTab.tsx` (new, placeholder)
- "Coming soon" placeholder with card + icon
- Will be implemented in Phase 3

#### `src/pages/challenge-tabs/LeaderboardTab.tsx` (new, placeholder)
- "Coming soon" placeholder with card + icon
- Will be implemented in Phase 4

#### `src/App.tsx` (modify)
- Replace current flat challenge routes with nested route structure using `ChallengeLayout` as parent
- Add index redirect from `:id` to `:id/overview` using `<Navigate replace />`

### shadcn Tabs Integration
Use `<Tabs value={activeTab} onValueChange={(v) => navigate(v)}>` where `activeTab` is derived from
`useLocation()` (last URL segment). This keeps tab state in the URL without a separate router `<Link>`
workaround.

### New Libraries to Install
```bash
npm install react-markdown remark-gfm
```

### Database Changes
None for Phase 1. Existing columns (`description`, `constraints`, `conditions`) are sufficient.

---

## Phase 2 — Rich Content Authoring (TipTap)

### Goal
Allow challenge owners to edit Overview and Rules content using a WYSIWYG editor. Store content as
TipTap JSON in a new `challenge_content` table.

### New Database Table: `challenge_content`
```sql
create table challenge_content (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges(id) on delete cascade not null,
  tab_key text not null check (tab_key in ('overview', 'rules')),
  body_json jsonb,
  body_md text,
  updated_at timestamptz default now(),
  unique(challenge_id, tab_key)
);

-- RLS
alter table challenge_content enable row level security;
create policy "public read active challenges" on challenge_content
  for select using (
    exists (select 1 from challenges where id = challenge_id and status = 'active')
  );
create policy "owner write" on challenge_content
  for all using (
    exists (select 1 from challenges where id = challenge_id and user_id = auth.uid())
  );
```

### New Libraries to Install
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tailwindcss/typography
```

### Files to Create / Modify

#### `src/services/challengeContentService.ts` (new)
- `get(challengeId, tabKey)` — fetch content for a tab
- `upsert(challengeId, tabKey, bodyJson, bodyMd)` — save content

#### `src/components/TipTapEditor.tsx` (new)
- Wraps `@tiptap/react` `<EditorContent>` with a toolbar (bold, italic, headings, links, lists)
- Props: `content: JSONContent | null`, `onChange: (json: JSONContent, md: string) => void`, `readOnly: boolean`
- When `readOnly=true`, renders content without toolbar using `@tailwindcss/typography` prose classes

#### `src/pages/challenge-tabs/OverviewTab.tsx` (modify)
- Load content from `challenge_content` (tab_key='overview') via React Query
- Fall back to `challenge.description` markdown if no `challenge_content` row exists yet
- If `isOwner`: show Edit toggle that switches `TipTapEditor` between read/write mode
- Auto-save on blur with 1-second debounce

#### `src/pages/challenge-tabs/RulesTab.tsx` (modify)
- Same pattern as OverviewTab but tab_key='rules'
- Fall back to `challenge.constraints` + `challenge.conditions` if no content row

---

## Phase 3 — Discussion Threads

### Goal
Add community discussion per challenge, similar to Kaggle's discussion forum.

### New Database Tables
```sql
create table challenge_threads (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  title text not null,
  body_md text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table challenge_comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references challenge_threads(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  body_md text not null,
  created_at timestamptz default now()
);
```

### Files to Create
- `src/services/challengeDiscussionService.ts` — CRUD for threads and comments
- `src/pages/challenge-tabs/DiscussionTab.tsx` — thread list + new thread form + thread detail view
- `src/components/MarkdownComment.tsx` — render markdown with `react-markdown`

---

## Phase 4 — Leaderboard

### Goal
Surface a ranked leaderboard of accepted submissions.

### New Database Table
```sql
create table challenge_leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges(id) on delete cascade not null,
  submission_id uuid references challenge_submissions(id) on delete cascade not null,
  submitter_id uuid references auth.users(id) not null,
  score numeric,
  rank integer,
  metadata jsonb,
  updated_at timestamptz default now()
);
```

### New Libraries to Install
```bash
npm install @tanstack/react-table
```

### Files to Create
- `src/services/challengeLeaderboardService.ts`
- `src/pages/challenge-tabs/LeaderboardTab.tsx` — sortable table with rank, submitter, score, date

---

## Phase 5 — Polish

### Challenge Metadata Sidebar
- Right-rail sidebar component (desktop) / collapsed accordion (mobile) showing:
  - Deadline with live countdown (`date-fns` `formatDistanceToNow`)
  - Prize / compensation details
  - Tags as clickable pills that link back to marketplace with filter applied
  - Submission stats (count, accepted count)
  - Challenge creator profile card (avatar, name, link to profile)

### Creator UX Improvements
- Inline status controls in the layout header (no need to go back to dashboard)
- Draft banner for unpublished challenges visible only to owner
- "Share" button with clipboard copy of challenge URL

---

## Implementation Order (Recommended)

1. **Phase 1** — Tabbed shell (no new DB migrations, immediate UX improvement)
2. **Phase 2** — TipTap authoring (owner-facing, unblocks rich challenge descriptions)
3. **Phase 5** — Polish sidebar (high visual impact, pure frontend)
4. **Phase 3** — Discussion (requires new tables, adds community engagement)
5. **Phase 4** — Leaderboard (requires scoring logic decision before building)

---

## Open Questions / Decisions Needed

1. **Scoring**: How are leaderboard scores computed? Manually by the owner, auto-scored by an edge
   function, or community-voted? This decision gates Phase 4.
2. **TipTap vs plain Markdown**: If challenge creators are technical, plain markdown textarea +
   `react-markdown` render is simpler and avoids TipTap bundle size (~150 KB gzipped). TipTap is
   better UX for non-technical users.
3. **Dashboard vs marketplace routes**: Should dashboard and marketplace share the same
   `ChallengeLayout`, or should the dashboard have a separate layout with different tabs (e.g., a
   "Manage" tab with owner-only controls)? Current proposal: same layout, `isOwner` flag controls
   visibility of edit controls.
4. **Migration of existing `description`/`constraints`/`conditions` fields**: Phase 2 introduces
   `challenge_content`. Should we migrate existing text into the new table, or keep the old columns
   as fallback indefinitely?
