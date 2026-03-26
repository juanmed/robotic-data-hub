# Coverage Expansion Plan

## Goal

Increase coverage of the important and medium-value application code so the suite protects against regressions in:

- auth and session state (`useAuth`, `ProtectedRoute`)
- dataset and upload key data access (`datasetService`, `uploadKeyService`)
- page-level workflows that users actually exercise
- core helpers used across the app

## Coverage Strategy

- Target roughly **40 tests**
- Keep the mix at about **80% unit / 20% integration**
- Focus unit tests on logic-heavy hooks, services, reducers, and pure helpers
- Use integration tests for the main UI flows where multiple modules interact
- De-prioritize generated/static UI primitives unless they contain meaningful logic

## Planned Test Suite

### Unit Tests

| # | Test name | Purpose | Target testing | Pass / fail criteria | Location |
|---|---|---|---|---|---|
| 1 | `cn merges conflicting Tailwind classes` | Verify shared class helper behavior | `src/lib/utils.ts` | Pass if class conflicts are merged deterministically; fail if output keeps the wrong precedence | `src/test/unit/lib/utils.test.ts` |
| 2 | `openVisualizer launches encoded manifest URL` | Verify manifest encoding and window open behavior | `src/lib/visualizer.ts` | Pass if the Supabase function is called and `window.open` receives the expected URL; fail if encoding or invocation is wrong | `src/test/unit/lib/visualizer.test.ts` |
| 3 | `useIsMobile returns false on desktop width` | Verify breakpoint logic | `src/hooks/use-mobile.tsx` | Pass if the hook returns `false` on widths >= 768px | `src/test/unit/hooks/use-mobile.test.tsx` |
| 4 | `useDatasetEpisodes loads the default dataset` | Verify initial dataset mapping | `src/hooks/useDatasetEpisodes.ts` | Pass if the default dataset resolves to the expected episode list and loading flips off | `src/test/unit/hooks/useDatasetEpisodes.test.tsx` |
| 5 | `useDatasetEpisodes switches when dataset id changes` | Verify reactivity to dataset selection | `src/hooks/useDatasetEpisodes.ts` | Pass if changing `datasetId` updates the episode list; fail if stale episodes remain | `src/test/unit/hooks/useDatasetEpisodes.test.tsx` |
| 6 | `useSessionData maps a known session to dataset and episode` | Verify session-to-dataset lookup | `src/hooks/useSessionData.ts` | Pass if the known session id maps to the expected `datasetId` and episode | `src/test/unit/hooks/useSessionData.test.tsx` |
| 7 | `useSessionData loads session and streams` | Verify async data loading | `src/hooks/useSessionData.ts` | Pass if session and stream data are populated from the service mock | `src/test/unit/hooks/useSessionData.test.tsx` |
| 8 | `toast reducer adds a toast` | Verify reducer add path | `src/hooks/use-toast.ts` | Pass if a toast is inserted and limit behavior is preserved | `src/test/unit/hooks/use-toast.test.ts` |
| 9 | `toast reducer dismisses and removes a toast` | Verify dismiss lifecycle | `src/hooks/use-toast.ts` | Pass if dismiss marks the toast closed and removal clears it later | `src/test/unit/hooks/use-toast.test.ts` |
| 10 | `useAuth maps Supabase session users` | Verify session-to-app user mapping | `src/hooks/useAuth.tsx` | Pass if metadata, fallback name, and email verification are mapped correctly | `src/test/unit/hooks/useAuth.test.tsx` |
| 11 | `useAuth hydrates profile and ignores stale fetches` | Verify profile enrichment and stale request protection | `src/hooks/useAuth.tsx` | Pass if the latest profile wins and older profile fetches are ignored | `src/test/unit/hooks/useAuth.test.tsx` |
| 12 | `useAuth login rejects unverified emails` | Verify login guardrail | `src/hooks/useAuth.tsx` | Pass if unverified login signs out and throws the verification message | `src/test/unit/hooks/useAuth.test.tsx` |
| 13 | `useAuth register forwards metadata` | Verify registration payload | `src/hooks/useAuth.tsx` | Pass if signup is called with name metadata and the callback redirect URL | `src/test/unit/hooks/useAuth.test.tsx` |
| 14 | `useAuth logout clears state` | Verify logout flow | `src/hooks/useAuth.tsx` | Pass if local user state clears and Supabase sign-out is called | `src/test/unit/hooks/useAuth.test.tsx` |
| 15 | `datasetService.listDatasets aggregates file counts and sizes` | Verify dataset list mapping | `src/services/datasetService.ts` | Pass if counts, sizes, and file paths are computed correctly | `src/test/unit/services/datasetService.test.ts` |
| 16 | `datasetService.getDataset returns null or mapped dataset` | Verify single dataset fetch | `src/services/datasetService.ts` | Pass if missing rows return `null` and valid rows map to the app shape | `src/test/unit/services/datasetService.test.ts` |
| 17 | `datasetService.getDatasetFiles maps file rows` | Verify dataset file mapping | `src/services/datasetService.ts` | Pass if rows are converted into `DatasetFile` objects with the expected fields | `src/test/unit/services/datasetService.test.ts` |
| 18 | `datasetService.getDatasetFileUrls returns signed urls and errors cleanly` | Verify edge function interaction | `src/services/datasetService.ts` | Pass if URLs are returned on success and thrown errors are surfaced on failure | `src/test/unit/services/datasetService.test.ts` |
| 19 | `uploadKeyService.listUploadKeys maps active and revoked keys` | Verify upload key list normalization | `src/services/uploadKeyService.ts` | Pass if revoked keys become inactive and null timestamps are normalized | `src/test/unit/services/uploadKeyService.test.ts` |
| 20 | `uploadKeyService.createUploadKey inserts a hashed key for the current user` | Verify key creation path | `src/services/uploadKeyService.ts` | Pass if a raw key is generated, hashed, prefixed, and inserted for the authenticated user | `src/test/unit/services/uploadKeyService.test.ts` |
| 21 | `uploadKeyService.createUploadKey rejects unauthenticated users` | Verify auth guardrail | `src/services/uploadKeyService.ts` | Pass if the function throws `Not authenticated` when no user exists | `src/test/unit/services/uploadKeyService.test.ts` |
| 22 | `uploadKeyService.revokeUploadKey sets revoked_at` | Verify revocation path | `src/services/uploadKeyService.ts` | Pass if the update call writes a revocation timestamp | `src/test/unit/services/uploadKeyService.test.ts` |
| 23 | `sessionService.list and get return expected sessions` | Verify session lookup behavior | `src/services/sessionService.ts` | Pass if session list/get returns the expected mock data | `src/test/unit/services/sessionService.test.ts` |
| 24 | `sessionService.create and addStream use expected defaults` | Verify mutation helpers | `src/services/sessionService.ts` | Pass if created sessions default to draft and added streams get the expected format fields | `src/test/unit/services/sessionService.test.ts` |
| 25 | `sessionService.getStreams filters by session id` | Verify stream filtering | `src/services/sessionService.ts` | Pass if only streams for the requested session are returned | `src/test/unit/services/sessionService.test.ts` |
| 26 | `annotationService list create and remove work end to end` | Verify annotation CRUD | `src/services/annotationService.ts` | Pass if annotations list correctly, create prepends a new annotation, and remove deletes it | `src/test/unit/services/annotationService.test.ts` |
| 27 | `searchService returns all sessions for an empty query` | Verify default search behavior | `src/services/searchService.ts` | Pass if all sessions are returned with zero annotation matches | `src/test/unit/services/searchService.test.ts` |
| 28 | `searchService matches sessions by title stream and annotation` | Verify search logic | `src/services/searchService.ts` | Pass if matching content in any of the supported fields returns the expected sessions | `src/test/unit/services/searchService.test.ts` |
| 29 | `apiKeyService list create and revoke behave correctly` | Verify API key service behavior | `src/services/apiKeyService.ts` | Pass if keys list correctly, create returns a new prefixed key, and revoke resolves cleanly | `src/test/unit/services/apiKeyService.test.ts` |
| 30 | `FileUploadZone emits an uploaded AssetFile after selection` | Verify upload simulation and emitted payload | `src/components/FileUploadZone.tsx` | Pass if a selected file produces the expected `AssetFile` shape and upload callback fires once | `src/test/unit/components/FileUploadZone.test.tsx` |
| 31 | `authService login current user register and logout resolve predictably` | Verify mock auth service contract | `src/services/authService.ts` | Pass if the service returns the expected mock user and resolves cleanly | `src/test/unit/services/authService.test.ts` |
| 32 | `ProtectedRoute blocks unauthenticated access` | Verify route guard logic | `src/components/ProtectedRoute.tsx` | Pass if unauthenticated users are redirected and authenticated users see children | `src/test/unit/components/ProtectedRoute.test.tsx` |

### Integration Tests

| # | Test name | Purpose | Target testing | Pass / fail criteria | Location |
|---|---|---|---|---|---|
| 33 | `auth flow bootstraps session login and logout` | Verify the auth provider and login page work together | `src/hooks/useAuth.tsx`, `src/pages/LoginPage.tsx`, `src/pages/AuthCallbackPage.tsx` | Pass if a logged-in session hydrates, login succeeds, and logout clears the state | `src/test/integration/auth-flow.test.tsx` |
| 34 | `protected route redirects unauthenticated users to login` | Verify real routing behavior | `src/components/ProtectedRoute.tsx`, `src/App.tsx` | Pass if protected routes redirect when no user is available | `src/test/integration/protected-route-flow.test.tsx` |
| 35 | `session detail loads data and supports adding streams` | Protect the session workflow from regressions | `src/pages/SessionDetailPage.tsx`, `src/components/AddStreamModal.tsx`, `src/components/FileUploadZone.tsx` | Pass if session data loads and adding a stream updates the rendered list | `src/test/integration/session-detail-flow.test.tsx` |
| 36 | `session viewer loads annotations and supports create and delete` | Verify the viewer/annotation workflow | `src/pages/SessionViewerPage.tsx`, `src/components/AnnotationPanel.tsx`, `src/components/TimelineMarkers.tsx` | Pass if annotations render, new annotations appear, and deletion removes them | `src/test/integration/session-viewer-flow.test.tsx` |
| 37 | `dataset detail loads files and launches the visualizer` | Verify dataset detail regression coverage | `src/pages/DatasetDetailPage.tsx`, `src/lib/visualizer.ts`, `src/components/DatasetListCard.tsx` | Pass if file metadata loads and the visualizer action is triggered correctly | `src/test/integration/dataset-detail-flow.test.tsx` |
| 38 | `datasets page renders datasets and opens dataset cards` | Verify dataset browsing flow | `src/pages/DatasetsPage.tsx`, `src/components/DatasetListCard.tsx` | Pass if datasets render and the primary navigation/card interactions work | `src/test/integration/datasets-page-flow.test.tsx` |
| 39 | `keys page supports creating revoking and copying keys` | Verify key management UX | `src/pages/KeysPage.tsx`, `src/components/CreateUploadKeyModal.tsx` | Pass if API keys and upload keys can be created, revoked, and copied in the UI | `src/test/integration/keys-page-flow.test.tsx` |
| 40 | `marketplace flow supports search filtering and purchase paths` | Verify marketplace behavior | `src/pages/MarketplacePage.tsx`, `src/pages/ListingPage.tsx`, `src/components/CheckoutModal.tsx`, `src/components/DownloadModal.tsx` | Pass if search/filtering works and the correct purchase/download states are reachable | `src/test/integration/marketplace-flow.test.tsx` |

## Execution Order

1. Finish the unit tests for `useAuth`, `datasetService`, and `uploadKeyService` first.
2. Add the session and viewer integration flows next.
3. Add the page-level regression tests for datasets, keys, and marketplace.
4. Keep `src/test/setup.ts` as the shared browser mock layer and expand it only when a test needs a real browser API.

## Coverage Notes

- This plan prioritizes code with real business impact.
- Generated UI primitives under `src/components/ui/**` are intentionally not the first target.
- The goal is not to test every line of JSX, but to protect the behavior that would break user flows if it regressed.

## Acceptance Criteria

- Unit tests remain about 80% of the suite.
- Integration tests cover the main user journeys.
- Coverage meaningfully improves in the files that were previously at 0%, especially:
  - `src/hooks/useAuth.tsx`
  - `src/services/datasetService.ts`
  - `src/services/uploadKeyService.ts`
  - page-level flows under `src/pages/**`

## Claude Review Feedback

Claude’s review of the plan was directionally supportive, with three concrete recommendations:

- Keep the `32/8` unit-to-integration split. That ratio is reasonable for this stack.
- Do not add more pure utility coverage right now. Pure helpers such as validation and array utilities are lower regression risk than auth and page workflows.
- Implement the auth and page-flow gaps first, especially:
  - `useAuth.test.tsx`
  - `ProtectedRoute.test.tsx`
  - the missing integration flows for session viewer, dataset detail, datasets, keys, and route protection

The practical takeaway is that this plan should be executed in the listed order, with `useAuth` and page-level integration tests treated as the regression shield, not the utility helpers.
