# Creator + Participant Roles - Final Plan

## Feedback Integration Note
I attempted to request external feedback from Claude Code in the terminal, but the CLI call required network access and was blocked by permission denial in this environment. I integrated a stricter internal review pass instead, focusing on security boundaries, route stability, and minimal schema change.

## Final Implementation Plan

### 1) Routing and navigation cleanup
- Keep creation/edit in editor-only routes:
  - `/dashboard/challenges/new`
  - `/dashboard/challenges/:id/edit`
- Use read-only challenge detail at:
  - `/dashboard/challenges/:id` (protected)
  - `/marketplace/challenges/:id` (public/auth-aware)
- Update dashboard challenge cards:
  - title opens detail route
  - edit button opens edit route

### 2) RLS policy migration for role behavior
Create migration to:
- Allow submitters to submit to any active challenge, including self-created challenges.
- Allow submitters to withdraw only pending submissions (`DELETE` policy with `status = 'pending'` and `submitter_id = auth.uid()`).

### 3) Secure dataset-access expansion for submission review
Update edge functions to preserve owner access while enabling challenge workflow:
- `get-dataset-manifest`:
  - owner access remains
  - challenge owner access allowed for datasets submitted to their challenges (for review visualization)
  - submitter access allowed
- `dataset-read-urls`:
  - owner access remains
  - challenge owner access allowed only for accepted submissions (download access after acceptance)
  - submitter access allowed

This split enforces: review-before-accept via visualization, and full download after acceptance.

### 4) Submission service + types enhancements
- Add `withdraw(id)` in `challengeSubmissionService`.
- Add enriched list methods:
  - `listMineEnriched()` for participant dashboard grouping
  - `listForChallengeEnriched(challengeId)` for creator moderation UX
- Add relation-friendly types in `src/types/index.ts` for submission rows with challenge/dataset/profile metadata.

### 5) Challenge detail page behavior
- Preserve shared read-only challenge detail for creator and participant.
- Add owner `Edit Challenge` button linking to editor route.
- Allow authenticated users (including owner) to submit datasets when challenge is active.
- Owner submission section:
  - show dataset display name + submitter name + status/message/date
  - pending: accept/reject
  - all statuses: visualize dataset
  - accepted: access/download file URLs
- Add accepted file-access modal to list downloadable files.

### 6) Participant dashboard submissions section
Extend dashboard with `My Challenge Submissions`:
- Group by challenge title.
- For each dataset submission show status/date/message.
- Pending -> `Withdraw` action.
- Accepted -> show earned amount using challenge compensation and currency.

### 7) Submit modal de-duplication correctness
- Ensure submission modal receives current user’s existing submissions for the challenge, not only owner-visible list.
- Prevent duplicate dataset re-submission to same challenge from UI side (in addition to DB unique constraint).

### 8) Tests
Update/add:
- Unit tests for `challengeSubmissionService.withdraw` and enriched list methods.
- Integration tests for updated routing/edit links.
- Dashboard integration tests for participant submissions, withdraw, and accepted earnings text.
- Data-isolation tests for withdrawal and submission policy behavior.

### 9) Validation
- Run targeted tests for changed suites first.
- Run full test suite if time allows.
- Manually verify:
  - creator submits to own challenge
  - participant withdraws pending
  - creator visualizes pending submission
  - creator downloads accepted submission files
