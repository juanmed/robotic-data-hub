# Test Coverage Improvement Plan

## Goal
Raise test coverage on files below 50% that contain critical application functionality, focusing on the challenge system, marketplace services, and key UI components.

## Current State (overall: 54.76% stmts)

Critical files with <50% coverage:
| File | Stmts | Branch | Funcs |
|------|-------|--------|-------|
| `ChallengeDetailPage.tsx` | 0% | 0% | 0% |
| `ChallengeEditorPage.tsx` | 0% | 0% | 0% |
| `ChallengeMediaUpload.tsx` | 0% | 0% | 0% |
| `SubmitDatasetModal.tsx` | 0% | 0% | 0% |
| `marketplaceService.ts` | 33% | 100% | 0% |
| `TimelineMarkers.tsx` | 44% | 43% | 100% |
| `SettingsPage.tsx` | 47% | 92% | 14% |

Also below 75% on critical logic:
| File | Stmts | Branch | Funcs |
|------|-------|--------|-------|
| `challengeService.ts` | 69% | 63% | 100% |
| `listingService.ts` | 54% | 77% | 71% |
| `challengeSubmissionService.ts` | 73% | 50% | 86% |

---

## Task 1 — `TimelineMarkers.tsx` (unit test)

**File:** `src/components/TimelineMarkers.tsx`
**Missing:** The `assignRows` greedy interval scheduling logic (lines 20–29) and the rendered annotation strips (lines 61–99).

**Test file:** `src/test/unit/components/TimelineMarkers.test.tsx`

**Test cases:**
1. Returns `null` when `totalDuration <= 0`
2. Renders correct number of annotation strips for non-overlapping annotations
3. Assigns separate rows to overlapping time-range annotations
4. Calculates `left`/`width` percentages correctly relative to `totalDuration`
5. Ignores annotations that are not `target: "time_range"`
6. Renders the `0s` and total duration time labels
7. Shows quarter-mark grid lines at 25%, 50%, 75%
8. Handles an empty `annotations` array gracefully

---

## Task 2 — `marketplaceService.ts` (unit test)

**File:** `src/services/marketplaceService.ts`
**Missing:** `getMarketplaceFileUrls` is the only function and has 0% function coverage.

**Test file:** `src/test/unit/services/marketplaceService.test.ts`

**Test cases:**
1. Calls `supabase.functions.invoke` with `"marketplace-dataset-urls"` and the correct body
2. Returns the `urls` array from the response on success
3. Returns `[]` when `data.urls` is absent
4. Throws an error with the message from Supabase when `error` is present
5. Throws a generic message when `error.message` is empty

---

## Task 3 — `listingService.ts` (unit test extension)

**File:** `src/services/listingService.ts`
**Missing:** `listEnriched` (lines 15–53), `update` (lines 85–93), `unpublish` (lines 96–102).

**Test file:** `src/test/unit/services/listingService.test.ts` (extend existing)

**Test cases for `listEnriched`:**
1. Returns `[]` when no listings exist
2. Fetches datasets and profiles in batch and merges into enriched result
3. Falls back to `"Unknown"` when creator profile is missing

**Test cases for `update`:**
4. Updates specified listing fields and returns updated record

**Test cases for `unpublish`:**
5. Sets `published: false` on the target listing

---

## Task 4 — `challengeService.ts` — `listEnriched` (unit test extension)

**File:** `src/services/challengeService.ts`
**Missing:** `listEnriched` (lines 5–60) which joins challenges, profiles, and media, then generates signed URLs.

**Test file:** `src/test/unit/services/challengeService.test.ts` (extend existing)

**Test cases:**
1. Returns `[]` when no active challenges exist
2. Merges profile names onto each challenge (`creator_name`)
3. Sets `preview_url` to the signed URL when media exists for the challenge
4. Sets `preview_url` to `null` when no media exists
5. Only picks the first (lowest sort_order) media item as the preview
6. Falls back to `"Unknown"` creator name when profile is not found

---

## Task 5 — `ChallengeMediaUpload.tsx` (unit test)

**File:** `src/components/ChallengeMediaUpload.tsx`
**Missing:** All functionality — initial media load, file upload flow, drag-and-drop, delete.

**Test file:** `src/test/unit/components/ChallengeMediaUpload.test.tsx`

**Mocks needed:** `@/services/challengeMediaService`

**Test cases:**
1. Loads and displays existing media on mount via `challengeMediaService.list`
2. Calls `onMediaChange` with initial media list after load
3. Accepts dropped image/video files and calls `challengeMediaService.upload`
4. Rejects files larger than 100MB
5. Rejects files that are not image or video
6. Prevents upload when already at `MAX_FILES` (10) limit
7. Delete button calls `challengeMediaService.delete` and removes item from list
8. Shows "Uploading..." text while uploading is in progress

---

## Task 6 — `SubmitDatasetModal.tsx` (unit test)

**File:** `src/components/SubmitDatasetModal.tsx`
**Missing:** All functionality — dataset loading, filtering, submission flow.

**Test file:** `src/test/unit/components/SubmitDatasetModal.test.tsx`

**Mocks needed:** `@/services/datasetService`, `@/services/challengeSubmissionService`

**Test cases:**
1. Renders nothing (closed) when `open=false`
2. Loads datasets with `status: "ready"` when modal opens
3. Excludes datasets already in `existingSubmissions`
4. Shows "No eligible datasets" message when all datasets are submitted/not-ready
5. Submit button is disabled when no dataset is selected
6. Calls `challengeSubmissionService.submit` with correct payload on submit
7. Calls `onSubmitted` and `onClose` on success
8. Shows error toast on submission failure

---

## Task 7 — `ChallengeEditorPage.tsx` (integration test)

**File:** `src/pages/ChallengeEditorPage.tsx`
**Missing:** All functionality — multi-step form, create/edit modes, publish flow.

**Test file:** `src/test/integration/challenge-editor-page.test.tsx`

**Mocks needed:** `@/services/challengeService`, `@/hooks/useAuth`, `react-router-dom` (useNavigate)

**Test cases:**
1. Renders "Basic Info" step on mount for new challenge (`/challenges/new`)
2. Loads existing challenge data and pre-fills fields when editing (`/challenges/:id/edit`)
3. Navigates to next step when "Next" is clicked with valid Basic Info
4. "Back" button returns to previous step
5. Calls `challengeService.create` on first "Save" in new mode
6. Calls `challengeService.update` on subsequent saves
7. Calls `challengeService.publish` when "Publish" is clicked on final step
8. Redirects to `/dashboard` if challenge not found in edit mode
9. Shows compensation amount field only when `isVolunteer` is false

---

## Task 8 — `ChallengeDetailPage.tsx` (integration test)

**File:** `src/pages/ChallengeDetailPage.tsx`
**Missing:** All functionality — challenge display, owner vs participant views, submission flow, status toggles.

**Test file:** `src/test/integration/challenge-detail-page.test.tsx`

**Mocks needed:** `@/services/challengeService`, `@/services/challengeMediaService`, `@/services/challengeSubmissionService`, `@/services/datasetService`, `@/hooks/useAuth`

**Test cases:**
1. Renders challenge title, description, tags, and compensation when loaded
2. Shows "Submit Dataset" button for authenticated non-owners on active challenges
3. Hides "Submit Dataset" button for challenge owner
4. Owner sees "Pause" / "Close" challenge controls
5. Owner sees all submissions (enriched view)
6. Non-owner participant sees only their own submissions ("My Submissions")
7. Calls `challengeService.setStatus` with `"inactive"` when owner clicks Pause
8. Calls `challengeService.setStatus` with `"closed"` when owner clicks Close
9. Opens `SubmitDatasetModal` when "Submit Dataset" is clicked
10. Shows "Challenge Closed" indicator when status is `"closed"` or `"inactive"`

---

## Task 9 — `SettingsPage.tsx` (integration test extension)

**File:** `src/pages/SettingsPage.tsx`
**Missing:** Avatar upload handler, name editing flow (lines 26–129, 179–203).

**Test file:** `src/test/integration/settings-page.test.tsx` (extend existing)

**Mocks needed:** `@/integrations/supabase/client`, `@/hooks/useAuth`

**Test cases:**
1. Displays user initials in avatar fallback
2. Clicking the avatar triggers file input
3. Rejects files over 2MB with error toast
4. Rejects non-image files with error toast
5. Clicking "Edit" name button shows inline input with current name
6. Saving an edited name calls Supabase profile update
7. "Cancel" edit discards changes

---

## Implementation Order

Execute tasks in this order to maximize incremental coverage gain with least complexity first:

1. Task 1 — TimelineMarkers (pure logic + render, no service mocks)
2. Task 2 — marketplaceService (single function, minimal mock)
3. Task 3 — listingService (extend existing test file)
4. Task 4 — challengeService listEnriched (extend existing test file)
5. Task 5 — ChallengeMediaUpload (component with service mock)
6. Task 6 — SubmitDatasetModal (component with service mock)
7. Task 7 — ChallengeEditorPage (full page integration)
8. Task 8 — ChallengeDetailPage (full page integration, most complex)
9. Task 9 — SettingsPage (extend existing integration test)

---

## Codex Feedback Integration (reviewed 2026-04-26)

### High-priority corrections

1. **New Task 10 added** — `challengeSubmissionService.ts` (73% stmts / 50% branch) needs coverage for `listForChallengeEnriched` and error paths on `updateStatus`/`withdraw`.
2. **Task 8 corrected** — `ChallengeDetailPage` shows "Submit Dataset" to ALL authenticated users on active challenges (including owner). Test #3 was incorrect; replaced with "also shows for owner on active challenges".
3. **Failure paths** — Each task now includes at minimum one async failure/error case.

### Per-task additions from Codex

**Task 1 (TimelineMarkers):** add unsorted input, missing `time_end`, width/left clamp cases.  
**Task 2 (marketplaceService):** add invoke-throws case, empty-paths body.  
**Task 3 (listingService):** add error propagation, missing join data, assert `updated_at` set.  
**Task 4 (challengeService.listEnriched):** add query failure paths, `createSignedUrl` returning no URL.  
**Task 5 (ChallengeMediaUpload):** add upload/delete/list failure, mixed valid+invalid files, MAX_FILES from initial load disables zone.  
**Task 6 (SubmitDatasetModal):** add dataset-load failure, message-trim assertion, double-submit prevention.  
**Task 7 (ChallengeEditorPage):** add required-field validation, publish in new-mode flow, already-published disables publish button, load failure in edit mode.  
**Task 8 (ChallengeDetailPage):** add unauthenticated "Sign in" CTA, not-found rendering, accept/reject actions, files-dialog flow.  
**Task 9 (SettingsPage):** add avatar upload happy path.

---

## Notes for Implementation

- Mock `supabase` via `vi.hoisted` + `vi.mock("@/integrations/supabase/client", ...)` pattern used throughout the codebase
- Mock `useAuth` via `vi.mock("@/hooks/useAuth", ...)` returning `{ user, isAuthenticated, refreshUser }`
- Wrap all page/component renders in `<MemoryRouter initialEntries={[...]}>` or use `createMemoryRouter` from react-router-dom v6
- Use `@testing-library/user-event` for interactions (click, type, drag-drop)
- For async data loading, use `waitFor` / `findBy*` queries
- All service mocks should use the same `vi.hoisted` pattern for consistency
