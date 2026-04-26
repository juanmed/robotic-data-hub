# Creator + Participant Roles Implementation Plan

## Objective
Implement creator/participant role behavior for Challenges UI without introducing separate auth roles. The same authenticated user can act as creator and participant.

## Scope Summary
- Creator can view created challenges from dashboard and open non-edit detail page.
- Creator can click `Edit` from challenge detail to modify challenge.
- Creator can submit to own challenges.
- Creator can view all submissions for owned challenges, open each submission dataset with existing visualization flow, and accept/reject submissions.
- Participant can submit datasets to challenges.
- Participant dashboard shows submissions grouped by challenge with per-submission status.
- Participant can withdraw pending submissions.
- Accepted submissions show earned amount for participant.

## Existing Gaps Identified
1. Dashboard challenge links route to editor (`/dashboard/challenges/:id`) instead of a read-only challenge detail page.
2. No dashboard participant view for own challenge submissions.
3. RLS currently blocks creator self-submission (`c.user_id != auth.uid()` in insert policy).
4. No RLS delete policy for submitter withdrawal of pending submissions.
5. Submission records do not expose challenge metadata in dashboard UI.
6. Dataset visibility/download for creator reviewing submissions requires explicit accepted-submission access path (current dataset functions are owner-only).

## Implementation Plan

### 1) Database + RLS migrations
Create a new migration with focused policy updates and authorization helper function:
- Update `submissions_submitter_insert` policy to allow submissions to any active challenge, including own challenge.
- Add `submissions_submitter_delete_pending` policy:
  - `FOR DELETE` for authenticated users.
  - `USING (auth.uid() = submitter_id AND status = 'pending')`.
- Add SQL function `public.can_user_access_submission_dataset(dataset_uuid uuid)` returning boolean:
  - true when `auth.uid()` is dataset owner.
  - true when `auth.uid()` is challenge owner or submitter for a `challenge_submissions` row referencing the dataset.
  - if challenge owner path is used, require submission status = `accepted` for download access; allow pending for visualization review only if required by story (we will allow read-only visualization review for challenge owner, but keep downloadable file URLs restricted to accepted submissions).

Note: trigger `trg_submission_count` already handles decrement on delete, so withdrawal updates counts automatically.

### 2) Edge function access updates for dataset viewing/downloading
Update edge functions to support authorized submission access:
- `supabase/functions/get-dataset-manifest/index.ts`
  - Replace strict owner-only check with helper authorization:
    - owner always allowed.
    - challenge owner allowed when a submission exists for that dataset in their challenge.
    - submitter allowed for own submitted dataset.
  - Keep returning manifest used by existing visualizer (`openVisualizer`) so UI can reuse the current visualization flow.
- `supabase/functions/dataset-read-urls/index.ts`
  - Keep owner access.
  - Add access for challenge owner only when there is an accepted submission for that dataset in their challenge.
  - Add access for submitter for own dataset.
  - This enforces “freely access/download after acceptance.”

### 3) Service layer enhancements
Update `src/services/challengeSubmissionService.ts`:
- Add `withdraw(id: string): Promise<void>` that deletes submission row.
- Add `listMineEnriched(): Promise<ParticipantSubmissionItem[]>` selecting:
  - submission fields
  - challenge fields via relation (`challenges(id,title,compensation_amount,currency,compensation_per,user_id,status)`)
  - dataset display name via relation (`datasets(id,display_name,status)`)
- Add helper `listForChallengeWithDatasets(challengeId: string)` to include dataset display name + submitter profile name for creator review UI.

Update `src/types/index.ts`:
- Add `ChallengeSubmissionWithRelations` and `ParticipantSubmissionItem` types for strongly typed dashboard/detail rendering.

### 4) Routing and page flow changes
Update routes in `src/App.tsx`:
- Keep editor route at `/dashboard/challenges/new`.
- Move edit route to `/dashboard/challenges/:id/edit`.
- Add read-only detail route `/dashboard/challenges/:id` pointing to `ChallengeDetailPage` (protected).
- Keep marketplace detail route `/marketplace/challenges/:id`.

Update links/buttons:
- `ChallengeListCard`:
  - title click -> `/dashboard/challenges/:id`.
  - edit button -> `/dashboard/challenges/:id/edit`.
- `DashboardPage` challenge cards remain same component but now land on read-only detail.
- `ChallengeDetailPage`:
  - back link should route to `/dashboard` when opened from dashboard context; keep marketplace back link fallback.
  - add owner `Edit Challenge` button to `/dashboard/challenges/:id/edit`.

### 5) Creator detail-page submission review UX
In `ChallengeDetailPage` owner section:
- Render richer submission cards with:
  - dataset display name and dataset id
  - submitter name/id
  - message + created date + status
- Add actions:
  - `Visualize` button (for owner) using existing `openVisualizer(sub.dataset_id)`.
  - `Open Dataset`/`Download` button shown when submission is accepted (navigates to new accepted-access view or triggers file URL retrieval).
  - existing `Accept` / `Reject` actions retained for pending submissions.
- Improve accepted-state copy to indicate payout amount equals challenge compensation settings.

### 6) Participant dashboard submissions UX
Extend `DashboardPage` with a “My Challenge Submissions” section:
- Fetch `challengeSubmissionService.listMineEnriched()` in initial load.
- Group by challenge and render:
  - challenge title (link to challenge detail)
  - each submitted dataset row with status badge and submitted date
  - if pending: `Withdraw` action
  - if accepted: show earnings label using challenge compensation info (`formatPrice(ch.compensation_amount, ch.currency)` plus `/dataset` or `lump sum` descriptor)
- Keep existing datasets + created challenges sections intact.

### 7) Submission modal adjustments
Update `SubmitDatasetModal` usage in `ChallengeDetailPage`:
- Ensure `existingSubmissions` for modal dedupe uses caller’s own submissions for that challenge (not only owner list).
- Add creator self-submission support by showing submit button to authenticated users including owner (story requirement).

### 8) Test updates
Add/update tests:
- Unit tests for `challengeSubmissionService`:
  - `withdraw` issues delete by id.
  - `listMineEnriched` shape mapping.
- Integration tests for dashboard:
  - participant submissions section renders grouped entries.
  - pending submission shows withdraw button.
  - accepted submission shows earned amount text.
- Integration test for challenge detail:
  - owner sees edit button and submission moderation actions.
- Data isolation tests:
  - submitter can withdraw pending; cannot withdraw non-pending (RLS error propagation).
  - creator self-submission path is no longer blocked at policy level.

### 9) Validation checklist
- `npm run test -- src/test/unit/auth/data-isolation.test.ts`
- `npm run test -- src/test/integration/dashboard-challenges.test.tsx`
- `npm run test -- src/test/integration/marketplace-challenges.test.tsx`
- `npm run test` (full if timing permits)

## Non-goals for this story
- Real payment transfer execution and ledgering.
- Multi-winner budget accounting for `compensation_per = challenge`.
- Ownership transfer of dataset rows.

## Risks and mitigations
- Risk: broadening dataset access could leak files.
  - Mitigation: keep download URLs restricted to owner and accepted-submission challenge owner only; centralize checks in edge functions.
- Risk: route changes break existing tests/links.
  - Mitigation: update all links + integration tests in same patch.
- Risk: relation selects vary with generated Supabase typings.
  - Mitigation: cast API responses to local relation types after runtime null checks.
