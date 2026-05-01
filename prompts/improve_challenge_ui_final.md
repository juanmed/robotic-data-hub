# Improve Challenge UI — Final Implementation Plan

## Context

React 18 + Vite + Tailwind + shadcn/ui + Supabase. The current `ChallengeDetailPage.tsx` renders all
content in a single scrolling view. The goal is a Kaggle/HuggingFace-style tabbed layout with rich
authoring, discussion, and a leaderboard.

## Codex Review — Issues Addressed in This Plan

Codex identified 10 issues with the initial plan. All are resolved below:

1. `challengeService.get()` returns plain `Challenge` with no `creator_name` → add enriched single-get
2. Phase 2 conflicts with existing `description`/`constraints`/`conditions` source of truth → explicit migration plan
3. Dashboard auth vs marketplace public distinction is blurry → clarified: keep `isOwner` in-page
4. `/dashboard/challenges/:id/edit` would be swallowed by nested routes → preserve as sibling
5. "Publish" is only on DashboardPage today → Phase 1 must bring publish logic into the layout
6. SubmissionsTab plan missing: Visualize, Access Files, `SubmitDatasetModal` dedup filter → all retained
7. Tag links assume synced URL state on MarketplacePage → tag links work on first load; sync is optional follow-up
8. `@tailwindcss/typography` is already installed → removed from dependency list
9. RLS policies incomplete: missing `WITH CHECK`, owner draft read, and Discussion/Leaderboard RLS → all fixed
10. Tests tied to flat routes will break → test updates added to Phase 1 scope

---

## Phase 1 — Tabbed Shell (No DB Changes)

### Goal
Replace `ChallengeDetailPage` with a `ChallengeLayout` hosting nested routes. Preserve all existing
behavior; only reorganize it into tabs. No new database tables or content model changes in this phase.

### Route Structure (after change)

```
/marketplace/challenges/:id/edit         → (keep as sibling, NOT nested) → ChallengeEditorPage
/marketplace/challenges/:id              → index → <Navigate replace to="overview" />
/marketplace/challenges/:id/overview     → OverviewTab
/marketplace/challenges/:id/rules        → RulesTab
/marketplace/challenges/:id/submissions  → SubmissionsTab
/marketplace/challenges/:id/discussion   → DiscussionTab (placeholder)
/marketplace/challenges/:id/leaderboard  → LeaderboardTab (placeholder)

/dashboard/challenges/:id/edit           → (keep as sibling, NOT nested) → ChallengeEditorPage (ProtectedRoute)
/dashboard/challenges/:id                → index → <Navigate replace to="overview" />
/dashboard/challenges/:id/overview       → OverviewTab
/dashboard/challenges/:id/rules          → RulesTab
/dashboard/challenges/:id/submissions    → SubmissionsTab
/dashboard/challenges/:id/discussion     → DiscussionTab (placeholder)
/dashboard/challenges/:id/leaderboard    → LeaderboardTab (placeholder)
```

> **Key rule**: `:id/edit` must remain a sibling (not a child) of the `:id` layout parent, or `edit`
> will be matched as a tab segment.

### Access control
Keep `isOwner` computed in `ChallengeLayout` via `user.id === challenge.user_id`. Do NOT gate tabs
by route; gate UI within tabs using the `isOwner` flag from context. The dashboard route remains
"any authenticated user can view any challenge"; owner-only controls are in-page.

### Files to Create / Modify

#### `src/services/challengeService.ts` (modify)
Add `getEnriched(id)` method that fetches the challenge then resolves the creator profile name:
```ts
async getEnriched(id: string): Promise<EnrichedChallenge>
```
This is needed because `get()` returns plain `Challenge` with no `creator_name`. The layout header
will use `getEnriched`; the editor continues using `get`.

#### `src/context/ChallengeContext.tsx` (new)
```ts
interface ChallengeContextValue {
  challenge: EnrichedChallenge;
  isOwner: boolean;
  refetch: () => void;
}
export const ChallengeContext = createContext<ChallengeContextValue | null>(null);
export const useChallengeContext = () => { /* throws if outside provider */ };
```

#### `src/pages/ChallengeLayout.tsx` (new)
- Fetches challenge via `challengeService.getEnriched(id)` with React Query
- Renders: hero header (title, `ChallengeStatusBadge`, deadline, compensation, creator name), tab nav,
  `<Outlet />`
- Tab navigation uses `<NavLink>` styled to look like tabs, **not** `shadcn <Tabs>` with
  `onValueChange(navigate)`. Reason (from codex): `NavLink` handles deep linking, new-tab behavior,
  and a11y correctly; `onValueChange(navigate)` does not.
  ```tsx
  // Tab nav pattern
  const tabs = [
    { to: "overview", label: "Overview" },
    { to: "rules", label: "Rules" },
    { to: "submissions", label: "Submissions" },
    { to: "discussion", label: "Discussion" },
    { to: "leaderboard", label: "Leaderboard" },
  ];
  // Render each as <NavLink to={t.to} relative="path"> with active class
  ```
- Owner action buttons in header: Edit (→ `:id/edit`), Publish (if draft), Deactivate/Activate,
  Close (with AlertDialog confirmation). **Publish must be added here** — it does not exist on the
  current detail page and lives only on `DashboardPage`.

#### `src/pages/challenge-tabs/OverviewTab.tsx` (new)
- Reads `challenge.description` from context
- Renders description with `react-markdown` + `remark-gfm` (prose styling via `@tailwindcss/typography`
  which is already installed)
- Renders media carousel (calls `challengeMediaService.list()`, signs URLs per item)
- Sidebar: tags, deadline countdown, compensation card, submission count
- Tag pills link to `/marketplace?tab=challenges&tag={tag}` — works on first load

#### `src/pages/challenge-tabs/RulesTab.tsx` (new)
- Reads `challenge.constraints` and `challenge.conditions` from context
- Renders both as `react-markdown` sections with `@tailwindcss/typography`
- Phase 1: read-only; edit capability deferred to Phase 2

#### `src/pages/challenge-tabs/SubmissionsTab.tsx` (new)
Carries over **all** existing submission behavior from `ChallengeDetailPage`:
- **Participant view**: own submissions list with status badges; withdraw button per submission;
  "Submit Dataset" button that opens `<SubmitDatasetModal>` (passes `existingSubmissions` for dedup
  filtering, exactly as today)
- **Owner view** (`isOwner === true`): enriched submission list per `challengeSubmissionService.listForChallengeEnriched()`;
  per-row actions: Accept, Reject (pending only), Visualize (calls `openVisualizer(datasetId)`),
  Access Files (opens file dialog for accepted submissions via `getDatasetFileUrls`)
- The file access dialog currently in `ChallengeDetailPage` moves into this tab as a local `<Dialog>`

#### `src/pages/challenge-tabs/DiscussionTab.tsx` (new, placeholder)
- Renders a "Coming soon" card; will be replaced in Phase 3

#### `src/pages/challenge-tabs/LeaderboardTab.tsx` (new, placeholder)
- Renders a "Coming soon" card; will be replaced in Phase 4

#### `src/App.tsx` (modify)
```tsx
// Marketplace challenges — layout parent + sibling edit
<Route path="/marketplace/challenges/:id" element={<ChallengeLayout />}>
  <Route index element={<Navigate replace to="overview" />} />
  <Route path="overview" element={<OverviewTab />} />
  <Route path="rules" element={<RulesTab />} />
  <Route path="submissions" element={<SubmissionsTab />} />
  <Route path="discussion" element={<DiscussionTab />} />
  <Route path="leaderboard" element={<LeaderboardTab />} />
</Route>

// Dashboard challenges — layout parent + sibling edit (both ProtectedRoute wrapped)
<Route path="/dashboard/challenges/:id" element={<ProtectedRoute><ChallengeLayout /></ProtectedRoute>}>
  <Route index element={<Navigate replace to="overview" />} />
  <Route path="overview" element={<OverviewTab />} />
  <Route path="rules" element={<RulesTab />} />
  <Route path="submissions" element={<SubmissionsTab />} />
  <Route path="discussion" element={<DiscussionTab />} />
  <Route path="leaderboard" element={<LeaderboardTab />} />
</Route>
// Sibling — stays outside layout tree
<Route path="/dashboard/challenges/:id/edit" element={<ProtectedRoute><ChallengeEditorPage /></ProtectedRoute>} />
```

#### `src/test/integration/challenge-detail-page.test.tsx` (modify)
Update to use new nested route structure. Add tests for:
- Index redirect (`/marketplace/challenges/:id` → `/overview`)
- Deep link to each tab (`/rules`, `/submissions`)
- Tab nav active state

### New Libraries to Install
```bash
npm install react-markdown remark-gfm
```
(`@tailwindcss/typography` is already in devDependencies — no install needed.)

### Database Changes
None.

---

## Phase 1.5 — Behavior Parity Checkpoint

Before adding any new feature, verify:
- [ ] All submission actions (accept, reject, withdraw, visualize, access files) work in `SubmissionsTab`
- [ ] Owner controls (publish, activate, deactivate, close) work from layout header
- [ ] Existing test suite passes (`npm test`)
- [ ] No regressions in `ChallengeEditorPage` tests
- [ ] Deep links to each tab resolve correctly

---

## Phase 2 — Rich Content Authoring (TipTap)

### Decision Gate
Only proceed if rich WYSIWYG is a hard requirement. If challenge creators are technical, Phase 2 can be
replaced with a simpler **markdown textarea + preview toggle** on `OverviewTab` and `RulesTab`, which
requires no new DB table.

If WYSIWYG is needed, proceed with the full plan below.

### New Database Table: `challenge_content`
```sql
create table challenge_content (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges(id) on delete cascade not null,
  tab_key text not null check (tab_key in ('overview', 'rules')),
  body_json jsonb,        -- TipTap JSON (primary for editor)
  body_md text,           -- Markdown fallback for rendering
  updated_at timestamptz default now(),
  unique(challenge_id, tab_key)
);

alter table challenge_content enable row level security;

-- Public can read content for active challenges
create policy "public read active" on challenge_content
  for select using (
    exists (select 1 from challenges where id = challenge_id and status = 'active')
  );

-- Owner can read their own content regardless of status (needed for draft editing)
create policy "owner read own" on challenge_content
  for select using (
    exists (select 1 from challenges where id = challenge_id and user_id = auth.uid())
  );

-- Owner can insert/update (WITH CHECK enforces same constraint as USING)
create policy "owner write" on challenge_content
  for insert with check (
    exists (select 1 from challenges where id = challenge_id and user_id = auth.uid())
  );

create policy "owner update" on challenge_content
  for update using (
    exists (select 1 from challenges where id = challenge_id and user_id = auth.uid())
  ) with check (
    exists (select 1 from challenges where id = challenge_id and user_id = auth.uid())
  );
```

### Migration Strategy for Existing Content
The existing `description`, `constraints`, and `conditions` columns on `challenges` remain as the
**fallback source**. When a `challenge_content` row exists for a tab, it wins; otherwise fall back to
the column. This means:
- No data migration required; existing challenges keep working
- `ChallengeEditorPage` continues writing to `description`/`constraints`/`conditions`
- Tab editing (Phase 2) writes to `challenge_content`
- This dual-source state is acknowledged as technical debt; a future cleanup can sync or migrate

### New Libraries to Install
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image
```

### Files to Create / Modify

#### `src/services/challengeContentService.ts` (new)
```ts
get(challengeId: string, tabKey: 'overview' | 'rules'): Promise<ChallengeContent | null>
upsert(challengeId: string, tabKey: string, bodyJson: JSONContent, bodyMd: string): Promise<void>
```

#### `src/components/TipTapEditor.tsx` (new)
- Props: `content: JSONContent | null`, `onChange: (json, md) => void`, `readOnly: boolean`
- Toolbar: bold, italic, headings, links, bullet/numbered lists
- `readOnly=true`: renders with prose classes, no toolbar

#### `src/pages/challenge-tabs/OverviewTab.tsx` (modify)
- Load `challenge_content` (tab_key='overview') via React Query
- Fallback: render `challenge.description` as markdown if no content row
- `isOwner`: show Edit toggle → TipTap in write mode; auto-save on blur with 1s debounce

#### `src/pages/challenge-tabs/RulesTab.tsx` (modify)
- Same pattern; tab_key='rules'; fallback: `challenge.constraints` + `challenge.conditions`

---

## Phase 3 — Discussion Threads

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

-- RLS for both tables
alter table challenge_threads enable row level security;
alter table challenge_comments enable row level security;

-- Public read for active challenges
create policy "public read threads" on challenge_threads
  for select using (
    exists (select 1 from challenges where id = challenge_id and status = 'active')
  );

-- Authenticated users can create threads on active challenges
create policy "auth create thread" on challenge_threads
  for insert with check (
    auth.uid() = user_id and
    exists (select 1 from challenges where id = challenge_id and status = 'active')
  );

-- Same pattern for challenge_comments (read = thread's challenge is active; insert = authenticated)
create policy "public read comments" on challenge_comments
  for select using (
    exists (
      select 1 from challenge_threads t
      join challenges c on c.id = t.challenge_id
      where t.id = thread_id and c.status = 'active'
    )
  );

create policy "auth create comment" on challenge_comments
  for insert with check (
    auth.uid() = user_id and
    exists (select 1 from challenge_threads where id = thread_id)
  );
```

### Files to Create
- `src/services/challengeDiscussionService.ts`
- `src/pages/challenge-tabs/DiscussionTab.tsx` — thread list, new thread form, thread detail view
- `src/components/MarkdownComment.tsx` — render markdown with `react-markdown`

---

## Phase 4 — Leaderboard

### Decision Gate
Decide scoring model before building: manual owner entry, edge-function scoring, or community vote.
This gates the entire phase.

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

alter table challenge_leaderboard_entries enable row level security;

-- Public read for active challenges
create policy "public read leaderboard" on challenge_leaderboard_entries
  for select using (
    exists (select 1 from challenges where id = challenge_id and status = 'active')
  );

-- Owner can insert/update scores
create policy "owner write scores" on challenge_leaderboard_entries
  for all using (
    exists (select 1 from challenges where id = challenge_id and user_id = auth.uid())
  ) with check (
    exists (select 1 from challenges where id = challenge_id and user_id = auth.uid())
  );
```

### New Libraries to Install
Only install `@tanstack/react-table` when the leaderboard needs interactive sorting/filtering.
A plain `<table>` is sufficient for MVP — install on demand.

### Files to Create
- `src/services/challengeLeaderboardService.ts`
- `src/pages/challenge-tabs/LeaderboardTab.tsx` — rank table (plain table initially)

---

## Phase 5 — Polish

### Challenge Metadata Sidebar (desktop right-rail, mobile accordion)
Move the existing sidebar content from `ChallengeDetailPage` into a standalone
`src/components/ChallengeMetaSidebar.tsx`:
- Compensation card (existing logic)
- Deadline with `formatDistanceToNow` from `date-fns` (already installed)
- Tag pills → `/marketplace?tab=challenges&tag={tag}`
- Submission count
- Creator name (from `EnrichedChallenge.creator_name`)
  - Note: no public profile route (`/users/:id`) exists yet; link to creator is omitted until a
    public profile feature is added

### Creator UX Improvements
- Draft banner visible only to owner (from `ChallengeLayout`)
- "Share" button with `navigator.clipboard.writeText(window.location.href)`
- Owner controls consolidated in layout header (already in Phase 1)

---

## Implementation Order

| Phase | Work | DB Changes | Risk |
|-------|------|-----------|------|
| 1 | Tabbed shell, routes, behavior parity | None | Low |
| 1.5 | Test parity checkpoint | None | None |
| 5 | Sidebar polish | None | Low |
| 2 | TipTap / markdown authoring | New table | Medium |
| 3 | Discussion | New tables | Medium |
| 4 | Leaderboard | New table | High (scoring model) |

---

## Open Decisions

1. **TipTap vs markdown textarea**: If challenge creators are technical, skip TipTap and use a
   markdown textarea with live preview. Simpler, no extra bundle, and the existing data model
   (`description` as plain text) is already correct. TipTap is only worth it for non-technical users.

2. **Leaderboard scoring model**: Manual owner entry, edge-function scoring, or community vote?
   Must be decided before Phase 4 begins.

3. **Public creator profiles**: Phase 5 sidebar currently shows creator name only (no link) because
   there is no public `/users/:id` route. If a profile feature is planned, add a public profile route
   and wire the link at that time.

4. **MarketplacePage tag URL sync**: Tag pill links from the sidebar work on first load (MarketplacePage
   reads `?tag=` from search params), but the marketplace does not persist `activeTag` back to the URL
   during browsing. If shareable filtered views matter, add URL sync to MarketplacePage as a separate
   task.
