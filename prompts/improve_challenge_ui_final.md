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

## Shared Media Infrastructure — Reusable UI and Logic Layer

> **Read this before Phase 1.** The challenge feature already has a working `challenge-media`
> Supabase Storage bucket, `challenge_media` table, `challengeMediaService`, and
> `ChallengeMediaUpload` component. Rather than leaving those as monolithic challenge-specific
> code, this plan extracts the **UI component and upload logic** into reusable primitives.
> Future features (blog sections, portfolio items, course content, etc.) will get their own
> storage buckets and DB tables — but they reuse the same upload component and the same
> service shape, so the implementation work is minimal and the UX is consistent.

### Design Principles

1. **Each feature owns its storage and data.** The `challenge-media` bucket and `challenge_media`
   table stay challenge-specific. A future blog feature gets a `blog-media` bucket and a
   `blog_media` table. No shared bucket, no polymorphic table. This keeps RLS, quotas, and
   migrations cleanly scoped per feature.

2. **The upload component is context-agnostic.** `ChallengeMediaUpload` is split into a generic
   `MediaUpload` primitive (drag-drop zone, preview grid, delete, upload progress) that knows
   nothing about challenges or any service. It receives all I/O through props. `ChallengeMediaUpload`
   becomes a thin adapter that wires `challengeMediaService` to those props.

3. **New features need only a service adapter.** To add media upload to a blog editor:
   write a `blogMediaService` with the same method signatures as `challengeMediaService`, then
   render `<MediaUpload onUpload={...} onDelete={...} getUrl={...} />`. No changes to the
   component itself.

### Files to Create / Modify

#### `src/components/MediaUpload.tsx` (new — generic primitive)
```ts
interface MediaUploadProps<T> {
  items: T[];                            // already-loaded media items
  onUpload: (file: File) => Promise<T>;  // caller handles storage + DB insert
  onDelete: (item: T) => Promise<void>;
  getUrl: (item: T) => string | undefined;  // signed URL, pre-resolved by caller
  getContentType: (item: T) => string;
  getFileName: (item: T) => string;
  maxFiles?: number;                     // default 10
  maxSizeBytes?: number;                 // default 100MB
  accept?: string;                       // default "video/*,image/*"
}
```
- Preserves all existing `ChallengeMediaUpload` behavior: drag-and-drop zone, file input,
  uploading state, 2–3 column preview grid, video thumbnail (`preload="metadata"` +
  `currentTime = 0.1`), delete button on hover.
- No import of any service or Supabase client — all I/O through props.

#### `src/components/ChallengeMediaUpload.tsx` (refactor — keep public API, replace internals)
```tsx
// Thin adapter: owns state, wires challengeMediaService to MediaUpload props
const ChallengeMediaUpload = ({ challengeId, userId, onMediaChange }) => {
  const [items, setItems] = useState<ChallengeMedia[]>([]);
  const [signedUrls, setSignedUrls] = useState<Map<string, string>>(new Map());
  // load on mount: challengeMediaService.list() + getSignedUrl per item (same as today)
  // onUpload  → challengeMediaService.upload(challengeId, userId, file) + getSignedUrl
  // onDelete  → challengeMediaService.delete(item.id, item.storage_path)
  // getUrl    → signedUrls.get(item.id)
  return <MediaUpload items={items} onUpload={...} onDelete={...} getUrl={...} ... />;
};
```
Existing call sites in `ChallengeEditorPage` require **zero changes**.

#### `src/services/challengeMediaService.ts` (no change required)
The service is already well-scoped. Its public API (`upload`, `list`, `getSignedUrl`, `delete`,
`reorder`) becomes the **reference interface** that future feature services should mirror so they
are plug-compatible with `MediaUpload` adapters.

### Storage and DB Strategy
- Each feature provisions its own bucket and table. Naming convention:
  `{feature}-media` bucket, `{feature}_media` table.
- No cross-feature sharing of storage or DB tables — clean blast radius, independent RLS.
- The `challenge-media` bucket and `challenge_media` table are untouched.

---

## Phase 1 — Tabbed Shell (No DB Changes)

### Goal
Replace `ChallengeDetailPage` with a `ChallengeLayout` hosting nested routes. Preserve all existing
behavior; only reorganize it into tabs. No new database tables or content model changes in this phase.

### Tab Model

**Only `Overview` is mandatory.** All other tabs (`Rules`, `Submissions`, `Discussion`,
`Leaderboard`) are optional and enabled per-challenge by the owner. This is persisted in a new
`enabled_tabs text[]` column on `challenges` (see DB Changes below). Viewers only see enabled tabs.

The available optional tabs and their keys:

| Key | Label | Default enabled? |
|-----|-------|-----------------|
| `submissions` | Submissions | Yes (core action) |
| `rules` | Rules | No |
| `discussion` | Discussion | No |
| `leaderboard` | Leaderboard | No |

Owners can rename tabs in a future polish pass; for now labels are fixed.

### Route Structure (after change)

All optional tab routes are registered in the router regardless of `enabled_tabs` — visibility
is enforced in `ChallengeLayout`'s nav render and by redirecting unknown tab segments to `overview`.

```
/marketplace/challenges/:id/edit         → (keep as sibling, NOT nested) → ChallengeEditorPage
/marketplace/challenges/:id              → index → <Navigate replace to="overview" />
/marketplace/challenges/:id/overview     → OverviewTab          (always visible)
/marketplace/challenges/:id/rules        → RulesTab             (visible if 'rules' in enabled_tabs)
/marketplace/challenges/:id/submissions  → SubmissionsTab       (visible if 'submissions' in enabled_tabs)
/marketplace/challenges/:id/discussion   → DiscussionTab        (visible if 'discussion' in enabled_tabs)
/marketplace/challenges/:id/leaderboard  → LeaderboardTab       (visible if 'leaderboard' in enabled_tabs)

/dashboard/challenges/:id/edit           → (keep as sibling, NOT nested) → ChallengeEditorPage (ProtectedRoute)
/dashboard/challenges/:id                → index → <Navigate replace to="overview" />
/dashboard/challenges/:id/overview       → OverviewTab
/dashboard/challenges/:id/rules          → RulesTab
/dashboard/challenges/:id/submissions    → SubmissionsTab
/dashboard/challenges/:id/discussion     → DiscussionTab
/dashboard/challenges/:id/leaderboard    → LeaderboardTab
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
- **Creator name**: displayed as plain text with a `// TODO: link to /users/:id once public profile feature ships`
  comment at the exact line — no link or route added now.
- Tab navigation uses `<NavLink>` styled to look like tabs, **not** `shadcn <Tabs>` with
  `onValueChange(navigate)`. Reason (from codex): `NavLink` handles deep linking, new-tab behavior,
  and a11y correctly; `onValueChange(navigate)` does not.
  ```tsx
  // Dynamic tab nav — Overview always first, then only enabled optional tabs
  const ALL_OPTIONAL_TABS = [
    { key: 'rules',        to: 'rules',        label: 'Rules' },
    { key: 'submissions',  to: 'submissions',  label: 'Submissions' },
    { key: 'discussion',   to: 'discussion',   label: 'Discussion' },
    { key: 'leaderboard',  to: 'leaderboard',  label: 'Leaderboard' },
  ];
  const visibleTabs = [
    { to: 'overview', label: 'Overview' },
    ...ALL_OPTIONAL_TABS.filter(t => challenge.enabled_tabs.includes(t.key)),
  ];
  // Render each as <NavLink to={t.to} relative="path"> with active class
  ```
- **Tab settings panel** (owner only): a `<Settings>` icon button (lucide-react) in the trailing
  edge of the tab bar. Opens a `<Popover>` with a checkbox list of `ALL_OPTIONAL_TABS`. Toggling
  a checkbox immediately calls `challengeService.update(id, { enabled_tabs: next })` with an
  optimistic update + revert on error. If the currently active tab is unchecked, navigate to
  `overview`.
- **New DB column required**: `enabled_tabs text[] NOT NULL DEFAULT '{submissions}'` on `challenges`.
  See Database Changes below.
- Owner action buttons in header: Edit (→ `:id/edit`), Publish (if draft), Deactivate/Activate,
  Close (with AlertDialog confirmation). **Publish must be added here** — it does not exist on the
  current detail page and lives only on `DashboardPage`.

#### `src/pages/challenge-tabs/OverviewTab.tsx` (new)
- Reads `challenge.description` from context
- Renders description with `react-markdown` + `remark-gfm` (prose styling via `@tailwindcss/typography`
  which is already installed)
- **Media gallery** (replaces the flat carousel from `ChallengeDetailPage`):
  - Fetches items via `challengeMediaService.list()` + per-item `getSignedUrl`
  - Renders a **featured media slot** (first item, full-width, aspect-video) above the description.
    If the first item is a video: native `<video controls preload="metadata">`. If image: full display.
  - Below the featured slot: horizontal thumbnail strip for remaining items. Clicking a thumbnail
    promotes it to the featured slot (local state swap — no refetch).
  - Video-first ordering: `challengeMediaService.list()` returns items sorted by `sort_order`;
    challenge creators should place video first (enforced by drag-to-reorder in the editor).
  - Empty state: renders description full-width with no gallery (no placeholder shown to viewers).
  - Uses `ChallengeMediaUpload` (owner-only, shown below description when `isOwner`) so owners
    can manage media without leaving the tab. This replaces the editor Step 2 as the canonical
    media management surface once Phase 2 is complete.
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

One new column on `challenges` to persist per-challenge tab visibility:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_challenges_enabled_tabs.sql
ALTER TABLE public.challenges
  ADD COLUMN enabled_tabs text[] NOT NULL DEFAULT '{submissions}';
```

- `overview` is never stored here — it is always rendered unconditionally.
- Default `'{submissions}'` means existing challenges show Overview + Submissions with no
  data migration required.
- No new RLS policies needed: existing `challenges_owner_crud` covers the UPDATE path;
  existing `challenges_public_read_active` covers SELECT for non-owners.
- Add `enabled_tabs: string[]` to the `Challenge` TypeScript interface and to the Supabase
  generated types (`Row`, `Insert?: string[]`, `Update?: string[]`).
- Add `enabled_tabs: ['submissions']` to `createMockChallenge` in `src/test/helpers/factories.ts`.

---

## Phase 1.5 — Behavior Parity Checkpoint

Before adding any new feature, verify:
- [ ] All submission actions (accept, reject, withdraw, visualize, access files) work in `SubmissionsTab`
- [ ] Owner controls (publish, activate, deactivate, close) work from layout header
- [ ] Existing test suite passes (`npm test`)
- [ ] No regressions in `ChallengeEditorPage` tests
- [ ] Deep links to each tab resolve correctly

---

## Phase 2 — Markdown Authoring

> **Decision:** Challenge creators are technical users. TipTap is not needed.
> Use a **markdown textarea + toggle preview** for `OverviewTab` and `RulesTab`.
> No new DB table is required — writes go directly to the existing `description`,
> `constraints`, and `conditions` columns on `challenges` via `challengeService.update()`.
> The `challenge_content` table and `challengeContentService` are **not created**.

### Database Changes
None. Existing `challenges.description`, `challenges.constraints`, and `challenges.conditions`
columns are the source of truth. No migration required.

### New Libraries to Install
```bash
npm install react-markdown remark-gfm
```
(`@tailwindcss/typography` is already in devDependencies — no install needed.
Register it in `tailwind.config.ts` plugins array if not already present.)

### New Component: `src/components/MarkdownEditor.tsx`

A reusable edit/preview toggle editor. No dependency on any challenge-specific service.

```ts
interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;  // omit when readOnly
  onBlur?: () => void;                 // fires after 1s debounce on textarea blur
  readOnly?: boolean;                  // default false
  placeholder?: string;
  minRows?: number;                    // default 6
  className?: string;
}
```

**Edit mode** (`readOnly` false):
- Small toolbar above the pane with two buttons: **Edit** | **Preview**. Default: Edit.
- Edit pane: shadcn `<Textarea>` wired to `value`/`onChange`.
- Preview pane: `<div className="prose prose-invert prose-sm max-w-none">` with
  `<ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>`.
- Debounce (internal): `useRef<ReturnType<typeof setTimeout>>` clears and resets a 1s timer
  on textarea `onBlur`; fires `onBlur` prop after timeout. Cleared on unmount.

**Read-only mode** (`readOnly` true):
- No toolbar, no textarea. Renders prose div only.
- If `value` is empty/whitespace: renders `<p className="text-sm text-muted-foreground">No content provided.</p>`.

### Files to Modify

#### `src/pages/challenge-tabs/OverviewTab.tsx` (modify)
- Owner view: replaces the plain `react-markdown` render (from Phase 1) with `<MarkdownEditor>`
  wired to `challenge.description`. On `onBlur`, calls `challengeService.update(id, { description })`.
  Shows a subtle "Saved" toast on success.
- Non-owner view: `<MarkdownEditor readOnly value={challenge.description} />`.
- Media gallery from Phase 1 is unchanged — stays above the editor.

#### `src/pages/challenge-tabs/RulesTab.tsx` (modify)
- Two independent `<MarkdownEditor>` instances: one for `constraints`, one for `conditions`.
- Each has its own independent debounced save — updating one field does not overwrite the other.
- Owner view: editable. Non-owner view: `readOnly`.
- If both fields are empty in read-only mode: render a muted "No rules specified." message.

#### `src/services/challengeService.ts` (modify)
Widen the `update()` Pick type to include `"enabled_tabs"` (see Phase 1 tab settings).
No other logic changes needed — `description`, `constraints`, and `conditions` are already
in the pick list.

### Future reuse of MarkdownEditor and MediaUpload
When a blog or course feature is added:
- **`MarkdownEditor`** is already prop-driven with no challenge coupling. Drop it directly into
  any new editor context.
- **`MediaUpload`**: provision a new `blog-media` bucket and `blog_media` table, write a
  `blogMediaService` matching the `challengeMediaService` method signatures, then wrap it
  in a thin `BlogMediaUpload` adapter. No changes to `MediaUpload` itself.

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
- Creator name (from `EnrichedChallenge.creator_name`) — displayed as plain text
  - A `// TODO: link to /users/:id once public profile feature ships` comment must appear at the
    exact render site in both `ChallengeLayout` (header) and `ChallengeMetaSidebar`. When the
    public profile feature is built, replace the `<span>` with a `<Link to={/users/${challenge.user_id}}>`.
    No route, no component, and no placeholder link should be added before that feature ships.

### Creator UX Improvements
- Draft banner visible only to owner (from `ChallengeLayout`)
- "Share" button with `navigator.clipboard.writeText(window.location.href)`
- Owner controls consolidated in layout header (already in Phase 1)

---

## Implementation Order

| Phase | Work | DB Changes | Risk |
|-------|------|-----------|------|
| 0 | Generic media layer (`MediaUpload`, refactor `ChallengeMediaUpload`) | None | Low — pure refactor, no call site changes |
| 1 | Tabbed shell, dynamic nav, `enabled_tabs` toggle, video gallery in OverviewTab | `enabled_tabs` column | Low |
| 1.5 | Test parity checkpoint | None | None |
| 5 | Sidebar polish | None | Low |
| 2 | Markdown authoring (`MarkdownEditor`, edit/preview in OverviewTab + RulesTab) | None | Low |
| 3 | Discussion | New tables | Medium |
| 4 | Leaderboard | New table | High (scoring model TBD) |

---

## Resolved Decisions

| Decision | Resolution |
|----------|------------|
| **TipTap vs markdown textarea** | **Markdown textarea** — creators are technical. `MarkdownEditor` component with Edit/Preview toggle. No TipTap packages installed. |
| **Mandatory vs optional tabs** | **Overview only is mandatory.** All other tabs are owner-toggled per challenge via `enabled_tabs` column. Default: `{submissions}`. |
| **Video file size cap** | **100MB** — existing cap is correct, no change needed. |
| **Public creator profiles** | **Future feature.** Show creator name as plain text now. Leave `// TODO: link to /users/:id once public profile feature ships` at every render site. No route or placeholder link added until the feature ships. |

## Open Decisions

1. **Leaderboard scoring model**: Manual owner entry, edge-function scoring, or community vote?
   Must be decided before Phase 4 begins.

2. **MarketplacePage tag URL sync**: Tag pill links from the sidebar work on first load (MarketplacePage
   reads `?tag=` from search params), but the marketplace does not persist `activeTag` back to the URL
   during browsing. If shareable filtered views matter, add URL sync to MarketplacePage as a separate
   task.
