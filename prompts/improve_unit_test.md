# Unit/Integration Test Coverage Improvement Plan

## Goal
Raise practical confidence on the current production paths by adding the highest-impact tests first, focusing on:
1. Current routing shell and challenge tabs (`ChallengeLayout`, `SubmissionsTab`, `RulesTab`)
2. Blog CRUD/publish lifecycle (`blogService`, blog pages)
3. Complex async UI/transform logic (`MarkdownRenderer`)

This plan converts the previously prioritized top-20 scenarios into concrete implementation steps, with exact file targets, test names, mock strategies, and rollout order.

---

## Scope and Principles
- Prefer behavior tests over implementation details.
- For page-level behavior, use integration-style tests with `MemoryRouter`.
- For pure service behavior, use unit tests with explicit Supabase chain mocks.
- Keep tests deterministic: fake timers for debounce/timeouts, fixed timestamps where assertions compare date output.
- Add tests in small batches and run `npm run test:coverage` after each batch.

---

## New/Updated Test Files

### A. Challenge Route Shell and Tabs
1. `src/test/integration/challenge-layout-page.test.tsx` (new)
2. `src/test/unit/pages/challenge-tabs/SubmissionsTab.test.tsx` (new)
3. `src/test/unit/pages/challenge-tabs/RulesTab.test.tsx` (new)

### B. Blog Service and Blog Pages
4. `src/test/unit/services/blogService.crud.test.ts` (new)
5. `src/test/integration/blog-editor-page.test.tsx` (new)
6. `src/test/integration/blog-list-page.test.tsx` (new)
7. `src/test/integration/blog-post-page.test.tsx` (new)
8. `src/test/integration/blog-post-preview-page.test.tsx` (new)

### C. Async Renderer Logic
9. `src/test/unit/components/MarkdownRenderer.test.tsx` (new)

---

## Shared Test Utilities to Add

### 1) Router render helper
Create local helper in each integration file (or extract to `src/test/helpers/router.tsx` if reused heavily):
- `renderWithRoutes(initialPath, routes)` wrapping `MemoryRouter` + `Routes`.

### 2) Challenge fixtures
Use a stable `baseChallenge` fixture in test files that touch challenge routes:
- Include `enabled_tabs`, `status`, `user_id`, `submission_count`, timestamps.

### 3) Supabase chain builders (for service tests)
In `blogService.crud.test.ts`, add minimal chain helpers:
- `mockFromInsertSingle({ data, error })`
- `mockFromUpdateEqEqSelectSingle({ data, error })`
- `mockFromSelectEqSingle({ data, error })`
- `mockFromDeleteEq({ error })`
- `mockFromSelectOrder({ data, error })`

This avoids brittle one-off mock objects per test.

### 4) Toast mocks
For page tests using Sonner:
- `vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))`

### 5) Time control
For publish redirect and copy-link reset timing:
- `vi.useFakeTimers()` and `vi.advanceTimersByTime(...)`.

---

## Concrete Test Cases (Top 20)

## Batch 1: ChallengeLayout critical route shell (5 tests)
File: `src/test/integration/challenge-layout-page.test.tsx`

1. `loads challenge + creator profile and renders enabled optional tabs`
- Mock `challengeService.get` returning challenge with `enabled_tabs: ['rules']`.
- Mock `supabase.from('profiles').select().eq().maybeSingle()` returning creator name.
- Assert title, creator name, and that `Rules` tab is visible while non-enabled optional tab is absent.

2. `rolls back tab toggle when update fails`
- Owner context.
- Open settings popover, toggle optional tab on.
- Mock `challengeService.update` reject.
- Assert checkbox/state reverts and error toast shown.

3. `navigates away when active optional tab is unchecked`
- Start route at `/dashboard/challenges/ch_001/rules` with rules enabled.
- Owner unchecks rules.
- Assert current route/content moves to overview.

4. `shows draft banner only for owner on draft challenge`
- Parametrize owner and non-owner user.
- Assert draft banner visible only for owner branch.

5. `owner status actions call setStatus and update UI state`
- Test deactivate/reactivate and close actions.
- Mock `challengeService.setStatus` responses.
- Assert calls and resulting status text/banner changes.

## Batch 2: SubmissionsTab behavior and resilience (5 tests)
File: `src/test/unit/pages/challenge-tabs/SubmissionsTab.test.tsx`

6. `falls back from enriched fetch to plain fetch and filters accepted for non-owner`
- Mock enriched call reject; plain call returns accepted + pending.
- Non-owner context; assert only accepted rendered.

7. `shows empty state when enriched and plain fetch both fail`
- Both service calls reject.
- Assert `No submissions yet.` and no crash.

8. `owner accept/reject updates local status in-place`
- Owner with pending row.
- Click Accept then Reject in separate test blocks.
- Assert `challengeSubmissionService.updateStatus` args and row status text update.

9. `accepted submission access files dialog handles loading + filtered links + empty`
- Open files dialog from accepted row.
- Case A: URLs include null signed_url -> assert only valid download links shown.
- Case B: no valid signed URLs -> assert empty-file message.

10. `visualize failure shows toast error`
- Mock `openVisualizer` reject.
- Click Visualize.
- Assert toast error called.

## Batch 3: RulesTab editing semantics (3 tests)
File: `src/test/unit/pages/challenge-tabs/RulesTab.test.tsx`

11. `does not call update when constraints unchanged`
- Owner mode.
- Trigger blur without edits.
- Assert `challengeService.update` not called.

12. `on save failure restores local constraints/conditions and shows error`
- Edit field then blur.
- Mock reject.
- Assert editor value reset to original challenge values + toast error.

13. `non-owner with empty constraints and conditions sees no-rules state`
- Non-owner + both empty.
- Assert `No rules specified.` only.

## Batch 4: blogService actual CRUD logic (4 tests)
File: `src/test/unit/services/blogService.crud.test.ts`

14. `create uses authenticated user when author_id missing and auto-generates excerpt`
- Mock `auth.getUser` with user.
- `insert().select().single()` returns created row.
- Assert inserted payload has `author_id` from auth and excerpt derived from `body_md`.

15. `create throws when unauthenticated and author_id missing`
- `auth.getUser` returns null.
- Expect throw `Must be authenticated to create a post`.

16. `update with expectedUpdatedAt handles concurrency mismatch`
- Mock `update(...).eq('id', id).eq('updated_at', expected).select().single()` returning `PGRST116`.
- Assert human conflict error message.

17. `publish validates required title/slug and calls update status published`
- Case A: `get(id)` result missing title/slug -> throws validation error.
- Case B: valid post -> spy `blogService.update` called with `{ status: 'published' }`.

## Batch 5: Blog pages + renderer async transforms (3 tests)

File: `src/test/integration/blog-editor-page.test.tsx`

18. `create mode bootstrap + slug rules + publish redirect`
- No `id` route.
- Mock `blogService.create` success with temporary slug.
- Type title and verify slug auto-updates only while temporary.
- Set custom slug then type title again and assert slug unchanged.
- Publish path: mock `blogService.publish`, use fake timers, assert navigate to preview after 500ms.

File: `src/test/unit/components/MarkdownRenderer.test.tsx`

19. `replaces blog-media storage links with signed URLs`
- Provide markdown with 2 `blog-media:storage_path:*` tokens.
- Mock `blogMediaService.getSignedUrl` for both.
- Assert rendered anchor/image src content contains signed URLs.

20. `continues rendering when one signed-url lookup fails`
- One resolve, one reject.
- Assert component exits loading state and renders content without crashing.
- Assert failed token remains original (or at least render still contains other transformed token).

---

## Additional High-Value Follow-Ups (after top 20)
- `useIsBlogger` real hook tests replacing placeholder test in `src/hooks/useIsBlogger.test.ts`.
- `ChallengeMetaSidebar` tests for clipboard copy/reset timer and owner controls.
- `Navbar` tests for blogger menu item visibility (`isLoading` vs `isBlogger`).
- `App.tsx` route-level smoke tests to protect route regressions.

---

## Execution Order and Checkpoints

1. Implement Batch 1, run:
- `npm run test -- src/test/integration/challenge-layout-page.test.tsx`

2. Implement Batch 2 and 3, run:
- `npm run test -- src/test/unit/pages/challenge-tabs/SubmissionsTab.test.tsx`
- `npm run test -- src/test/unit/pages/challenge-tabs/RulesTab.test.tsx`

3. Implement Batch 4, run:
- `npm run test -- src/test/unit/services/blogService.crud.test.ts`

4. Implement Batch 5, run:
- `npm run test -- src/test/integration/blog-editor-page.test.tsx`
- `npm run test -- src/test/unit/components/MarkdownRenderer.test.tsx`

5. Full verification:
- `npm run test:coverage`

At each checkpoint:
- Fix flaky assertions before moving forward.
- Prefer role/text queries over class selectors.
- Keep mocks local to each file unless extraction clearly reduces duplication.

---

## Definition of Done
- All new test files pass locally.
- No existing tests regress.
- Coverage increases in target modules:
  - `ChallengeLayout.tsx`, `SubmissionsTab.tsx`, `RulesTab.tsx`
  - `blogService.ts`, blog pages
  - `MarkdownRenderer.tsx`
- Placeholder-only coverage for critical modules eliminated (notably blog and `useIsBlogger` as follow-up).

---

## Augmented Plan (Post-Report Focus)

### Why this augmentation
Based on the latest failure report and feature-priority prompts (`creator_participant_*`, `blog.md`), the most critical remaining gaps are:
1. **Role gating correctness** (`useIsBlogger`, navbar entry points)
2. **Owner control safety/UX** (`ChallengeMetaSidebar` actions + copy-link behavior)
3. **Async teardown stability** (`SearchPage` unmount while async request resolves)

These areas directly impact production access control and reliability, and are not fully covered by the original top-20 set.

### New test files / updates (Augmented only)
1. `src/test/unit/hooks/useIsBlogger.test.tsx` (new)
2. `src/test/unit/components/Navbar.test.tsx` (new)
3. `src/test/unit/components/ChallengeMetaSidebar.test.tsx` (new)
4. `src/test/integration/search-page.test.tsx` (extend with teardown regression test)

### Augmented test cases

#### A1: `useIsBlogger` real hook behavior (4 tests)
File: `src/test/unit/hooks/useIsBlogger.test.tsx`

1. returns `{ isBlogger: false, isLoading: false }` when no authenticated user
2. returns blogger=true when `user_roles` lookup returns a row
3. returns blogger=false when Supabase returns `PGRST116` (no role row)
4. returns blogger=false and ends loading when Supabase throws/unexpected error

#### A2: `Navbar` role-gated actions (3 tests)
File: `src/test/unit/components/Navbar.test.tsx`

1. authenticated + `isLoading=true` hides `New Post` menu item
2. authenticated + `isLoading=false` + `isBlogger=false` hides `New Post`
3. authenticated + `isLoading=false` + `isBlogger=true` shows `New Post` and navigates to `/dashboard/blog/new` on select

#### A3: `ChallengeMetaSidebar` critical owner and link-copy behavior (4 tests)
File: `src/test/unit/components/ChallengeMetaSidebar.test.tsx`

1. copy-link writes current URL to clipboard and shows temporary `Link Copied!` state, then resets after 2s
2. owner + active challenge shows `Deactivate` and triggers `onToggleStatus('inactive')`
3. owner + inactive challenge shows `Reactivate` and triggers `onToggleStatus('active')`
4. non-owner hides manage controls entirely

#### A4: `SearchPage` async teardown regression guard (1 test)
File: `src/test/integration/search-page.test.tsx` (append)

1. unmounting before initial search promise resolves does not trigger post-teardown state-update failure (`window is not defined` class regression)

### Augmented execution checkpoints
1. `npm run test -- src/test/unit/hooks/useIsBlogger.test.tsx`
2. `npm run test -- src/test/unit/components/Navbar.test.tsx`
3. `npm run test -- src/test/unit/components/ChallengeMetaSidebar.test.tsx`
4. `npm run test -- src/test/integration/search-page.test.tsx`

### Augmented Definition of Done
- All augmented tests pass.
- Placeholder-only test for `useIsBlogger` is replaced by behavior tests.
- Role-gated blog entry visibility is explicitly verified at navbar level.
- Search page async teardown regression is protected by an automated test.
