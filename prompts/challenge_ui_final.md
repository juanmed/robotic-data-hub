# Challenges Feature - Final Implementation Plan

> Integrates feedback from Codex GPT-5.4 review on schema constraints, RLS precision, frontend architecture, UX edge cases, test coverage, and security.

## Overview

Add a **Challenges** feature to GamiphyAI where users can create requests for datasets to automate new tasks using robots. Other users browse challenges on the marketplace and propose matching datasets for compensation. **Compensation is display-only in v1** -- actual payout workflows are deferred to a future iteration.

---

## 1. Database Schema

### 1.1 `challenges` table

```sql
CREATE TABLE public.challenges (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL,
  title           text        NOT NULL CHECK (length(trim(title)) > 0),
  description     text        NOT NULL DEFAULT '',
  status          text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','active','inactive','closed')),
  compensation_amount integer NOT NULL DEFAULT 0 CHECK (compensation_amount >= 0),
  compensation_per text       NOT NULL DEFAULT 'dataset'
                              CHECK (compensation_per IN ('dataset','challenge')),
  currency        text        NOT NULL DEFAULT 'USD'
                              CHECK (currency IN ('USD','KRW')),
  deadline        timestamptz,
  constraints     text        NOT NULL DEFAULT '',
  conditions      text        NOT NULL DEFAULT '',
  tags            text[]      NOT NULL DEFAULT '{}',
  submission_count integer    NOT NULL DEFAULT 0,
  published_at    timestamptz,
  closed_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_challenges_user    ON public.challenges (user_id, created_at DESC);
CREATE INDEX idx_challenges_active  ON public.challenges (created_at DESC) WHERE status = 'active';
CREATE INDEX idx_challenges_deadline ON public.challenges (deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_challenges_tags    ON public.challenges USING GIN (tags);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Owner full CRUD
CREATE POLICY "owner_crud" ON public.challenges FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can read active challenges
CREATE POLICY "public_read_active" ON public.challenges FOR SELECT
  TO anon, authenticated
  USING (status = 'active');
```

**Status transition trigger** -- enforces valid transitions and sets timestamps:

```sql
CREATE OR REPLACE FUNCTION public.validate_challenge_status_transition()
RETURNS trigger AS $$
BEGIN
  -- Only validate if status changed
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  -- Allowed transitions
  IF NOT (
    (OLD.status = 'draft'    AND NEW.status IN ('active','closed')) OR
    (OLD.status = 'active'   AND NEW.status IN ('inactive','closed')) OR
    (OLD.status = 'inactive' AND NEW.status IN ('active','closed'))
  ) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;

  -- Set timestamps
  IF NEW.status = 'active' AND OLD.status = 'draft' THEN
    NEW.published_at := now();
  END IF;
  IF NEW.status = 'closed' THEN
    NEW.closed_at := now();
  END IF;
  NEW.updated_at := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_challenge_status
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.validate_challenge_status_transition();
```

**Submission count trigger** -- keeps `submission_count` accurate:

```sql
CREATE OR REPLACE FUNCTION public.update_challenge_submission_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.challenges SET submission_count = submission_count + 1 WHERE id = NEW.challenge_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.challenges SET submission_count = submission_count - 1 WHERE id = OLD.challenge_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_submission_count
  AFTER INSERT OR DELETE ON public.challenge_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_challenge_submission_count();
```

### 1.2 `challenge_media` table

```sql
CREATE TABLE public.challenge_media (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id  uuid        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL,
  storage_path  text        NOT NULL,
  file_name     text        NOT NULL,
  content_type  text        NOT NULL,
  size_bytes    bigint,
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_challenge_media_order ON public.challenge_media (challenge_id, sort_order);

ALTER TABLE public.challenge_media ENABLE ROW LEVEL SECURITY;

-- Owner full CRUD
CREATE POLICY "owner_crud" ON public.challenge_media FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can read media for active challenges
CREATE POLICY "public_read_active" ON public.challenge_media FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_id AND c.status = 'active'
  ));
```

### 1.3 `challenge_submissions` table

```sql
CREATE TABLE public.challenge_submissions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id  uuid        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  dataset_id    uuid        NOT NULL REFERENCES public.datasets(id),
  submitter_id  uuid        NOT NULL,
  message       text        NOT NULL DEFAULT '',
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','accepted','rejected')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, dataset_id)
);

CREATE INDEX idx_submissions_challenge ON public.challenge_submissions (challenge_id, created_at DESC);
CREATE INDEX idx_submissions_submitter ON public.challenge_submissions (submitter_id, created_at DESC);

ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

-- Submitter can view own submissions
CREATE POLICY "submitter_select" ON public.challenge_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = submitter_id);

-- Submitter can insert (only to active challenges, own datasets, not own challenge)
CREATE POLICY "submitter_insert" ON public.challenge_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = submitter_id
    AND EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND c.status = 'active' AND c.user_id != auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.datasets d
      WHERE d.id = dataset_id AND d.user_id = auth.uid() AND d.status = 'ready'
    )
  );

-- Challenge owner can view submissions for their challenges
CREATE POLICY "owner_select" ON public.challenge_submissions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_id AND c.user_id = auth.uid()
  ));

-- Challenge owner can update submission status
CREATE POLICY "owner_update_status" ON public.challenge_submissions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_id AND c.user_id = auth.uid()
  ));
```

### 1.4 Storage Bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('challenge-media', 'challenge-media', false);

-- Owner upload (path: user_id/challenge_id/uuid-filename)
CREATE POLICY "owner_upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'challenge-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner manage
CREATE POLICY "owner_manage" ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'challenge-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read for active challenges (via signed URLs, not direct)
CREATE POLICY "public_read" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'challenge-media');
```

---

## 2. TypeScript Types (`src/types/index.ts`)

```typescript
export interface Challenge {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: "draft" | "active" | "inactive" | "closed";
  compensation_amount: number;
  compensation_per: "dataset" | "challenge";
  currency: string;
  deadline: string | null;
  constraints: string;
  conditions: string;
  tags: string[];
  submission_count: number;
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChallengeMedia {
  id: string;
  challenge_id: string;
  user_id: string;
  storage_path: string;
  file_name: string;
  content_type: string;
  size_bytes: number | null;
  sort_order: number;
  created_at: string;
}

export interface ChallengeSubmission {
  id: string;
  challenge_id: string;
  dataset_id: string;
  submitter_id: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface EnrichedChallenge extends Challenge {
  creator_name: string;
  preview_url: string | null; // Single preview image/video for card
}
```

---

## 3. Service Layer

### 3.1 `src/services/challengeService.ts`

All methods use Supabase client. Privileged fields (`user_id`, `submission_count`, `published_at`, `closed_at`) are never set client-side.

```typescript
const challengeService = {
  // Marketplace: list active challenges with creator names + first media preview
  async listEnriched(): Promise<EnrichedChallenge[]>;

  // Dashboard: list user's own challenges (all statuses)
  async listMine(): Promise<Challenge[]>;

  // Single challenge by ID
  async get(id: string): Promise<Challenge | undefined>;

  // Create draft
  async create(data: {
    title: string; description: string; compensation_amount: number;
    compensation_per: "dataset"|"challenge"; currency: string;
    deadline: string|null; constraints: string; conditions: string; tags: string[];
  }): Promise<Challenge>;

  // Save draft progress / edit
  async update(id: string, updates: Partial<Omit<Challenge,
    'id'|'user_id'|'submission_count'|'published_at'|'closed_at'|'created_at'|'updated_at'
  >>): Promise<Challenge>;

  // Publish (draft -> active)
  async publish(id: string): Promise<Challenge>;

  // Toggle active/inactive
  async setStatus(id: string, status: 'active'|'inactive'|'closed'): Promise<Challenge>;

  // Delete (draft only, enforced by service check)
  async deleteDraft(id: string): Promise<void>;
};
```

### 3.2 `src/services/challengeMediaService.ts`

Storage path: `{user_id}/{challenge_id}/{uuid}-{sanitized_filename}`

```typescript
const challengeMediaService = {
  // Upload file to storage + create DB record
  async upload(challengeId: string, userId: string, file: File): Promise<ChallengeMedia>;

  // List media for a challenge (ordered by sort_order)
  async list(challengeId: string): Promise<ChallengeMedia[]>;

  // Get signed URL (short TTL)
  async getSignedUrl(storagePath: string): Promise<string>;

  // Delete file + record
  async delete(mediaId: string, storagePath: string): Promise<void>;

  // Reorder
  async reorder(items: { id: string; sort_order: number }[]): Promise<void>;
};
```

### 3.3 `src/services/challengeSubmissionService.ts`

```typescript
const challengeSubmissionService = {
  // Submit dataset to challenge
  async submit(data: {
    challenge_id: string; dataset_id: string; message: string;
  }): Promise<ChallengeSubmission>;

  // List for challenge (owner view)
  async listForChallenge(challengeId: string): Promise<ChallengeSubmission[]>;

  // List user's own submissions
  async listMine(): Promise<ChallengeSubmission[]>;

  // Owner: accept/reject
  async updateStatus(id: string, status: 'accepted'|'rejected'): Promise<void>;
};
```

---

## 4. Frontend Architecture

### 4.1 Component Hierarchy

Following Codex feedback: page-based editor, extracted panels, React Query for server state.

```
MarketplacePage
  MarketplaceHeader (hero, search bar)
  MarketplaceTabs ("Datasets" | "Challenges")
  DatasetMarketplacePanel (existing grid)
  ChallengeMarketplacePanel
    ChallengeCard[] (grid of active challenges)

DashboardPage
  (existing stats + datasets)
  MyChallengesSection
    "Create Challenge" button
    ChallengeListCard[] (user's challenges)

ChallengeEditorPage (/dashboard/challenges/new | /dashboard/challenges/:id)
  ChallengeForm (react-hook-form + zod validation)
    Step 1: BasicInfoFields (title, description)
    Step 2: ChallengeMediaUpload (drag & drop)
    Step 3: CompensationFields (amount, per-type, currency, deadline, constraints, conditions)
    Step 4: TagsAndReview (tags, pre-publish checklist, preview)
  "Save Draft" + "Publish" actions

ChallengeDetailPage (/marketplace/challenges/:id)
  ChallengeMediaGallery (video player + image grid)
  ChallengeInfo (description, constraints, conditions)
  CompensationBadge
  DeadlineCountdown
  SubmitDatasetModal (for other users)
  SubmissionsPanel (for owner only)
  StatusControls (for owner only)
```

### 4.2 New Components

| Component | Purpose |
|-----------|---------|
| `ChallengeCard` | Marketplace card: preview thumbnail, title, compensation badge, deadline indicator, tags, creator, submission count |
| `ChallengeListCard` | Dashboard list item: title, status badge, compensation, deadline, actions (edit/publish/toggle/delete) |
| `ChallengeStatusBadge` | Status pill: draft=gray, active=green, inactive=yellow, closed=red |
| `ChallengeForm` | Multi-step form with react-hook-form + zod. Save draft at any step. Pre-publish checklist on final step. |
| `ChallengeMediaUpload` | Drag-drop zone for video/image. Shows previews. Reorder. Delete. Max 10 files, 100MB each. |
| `ChallengeMediaGallery` | Public detail: video player + image thumbnails |
| `CompensationBadge` | Shows amount + per-type: "per dataset" or "lump sum" |
| `DeadlineCountdown` | Shows days remaining. Red if < 3 days. "No deadline" if null. |
| `SubmitDatasetModal` | Select from user's ready datasets (filtered: not already submitted, not own challenge). Message field. |
| `SubmissionsPanel` | Owner view: list of submissions with accept/reject actions |
| `MyChallengesSection` | Dashboard section with own challenges query, create button |
| `ChallengeMarketplacePanel` | Marketplace panel with challenges grid, loading/empty states |
| `DatasetMarketplacePanel` | Extracted from current MarketplacePage dataset grid |
| `MarketplaceTabs` | Tab bar for Datasets/Challenges with URL sync |

### 4.3 New Pages

| Page | Route | Auth | Purpose |
|------|-------|------|---------|
| `ChallengeEditorPage` | `/dashboard/challenges/new` | Protected | Create new challenge |
| `ChallengeEditorPage` | `/dashboard/challenges/:id` | Protected | Edit own challenge |
| `ChallengeDetailPage` | `/marketplace/challenges/:id` | Public | View active challenge |

### 4.4 Routes Addition (`App.tsx`)

```tsx
<Route path="/dashboard/challenges/new" element={<ProtectedRoute><ChallengeEditorPage /></ProtectedRoute>} />
<Route path="/dashboard/challenges/:id" element={<ProtectedRoute><ChallengeEditorPage /></ProtectedRoute>} />
<Route path="/marketplace/challenges/:id" element={<ChallengeDetailPage />} />
```

### 4.5 URL State

MarketplacePage URL params: `?tab=datasets|challenges&q=searchterm&tag=tagname`

---

## 5. User Flows

### 5.1 Creating a Challenge
1. Dashboard -> "Create Challenge" button -> navigates to `/dashboard/challenges/new`
2. ChallengeForm with 4 steps (can navigate freely between steps)
3. "Save Draft" available at every step (creates/updates record with status='draft')
4. Unsaved changes warning on browser navigation (beforeunload)
5. Pre-publish checklist on Step 4:
   - Title set (required)
   - Description set (required)
   - Compensation configured
   - At least one condition or constraint
6. "Publish" sets status to 'active', redirects to challenge detail page
7. Challenge appears in marketplace

### 5.2 Editing a Challenge
1. Dashboard -> click challenge -> navigates to `/dashboard/challenges/:id`
2. Same ChallengeForm, pre-populated with existing data
3. Can edit all fields while draft
4. Active challenges: can edit description, constraints, conditions, tags, deadline. Cannot change compensation.
5. Save updates immediately

### 5.3 Browsing Challenges (Marketplace)
1. Marketplace page -> "Challenges" tab (URL: `?tab=challenges`)
2. Grid of ChallengeCards for active challenges
3. Search filters by title, description, tags
4. Tag chips filter challenges
5. Click card -> `/marketplace/challenges/:id`
6. Empty state: "No challenges yet. Be the first to create one!"

### 5.4 Challenge Detail (Public)
1. Shows full description, media gallery, compensation, deadline, constraints, conditions
2. Non-owner authenticated user: "Submit Dataset" button
3. Owner: Status controls (Deactivate/Reactivate/Close) + Submissions panel
4. Unauthenticated: "Sign in to submit a dataset" CTA
5. Closed/inactive: "This challenge is no longer accepting submissions" banner

### 5.5 Submitting a Dataset
1. Click "Submit Dataset" on challenge detail
2. Modal shows dropdown of user's eligible datasets (status='ready', not already submitted to this challenge)
3. Message textarea for proposal
4. Submit -> creates challenge_submission record
5. Confirmation toast
6. Duplicate prevention: already-submitted datasets hidden from dropdown

### 5.6 Managing Status
- Draft -> Active (via Publish on editor) -- sets `published_at`
- Active -> Inactive (via toggle on detail/dashboard) -- stops new submissions
- Inactive -> Active (via toggle) -- resumes submissions
- Any -> Closed (via close button with confirmation dialog) -- permanent, sets `closed_at`

### 5.7 Deadline Behavior
- Deadline is optional
- Display-only in v1: expired challenges remain visible but show "Deadline passed" badge
- Submissions still technically allowed (enforcement deferred to v2)

---

## 6. Unit Tests

### 6.1 `src/test/unit/services/challengeService.test.ts`

```
describe("challengeService")
  describe("listEnriched")
    - returns array of enriched challenges with creator_name and preview_url
    - returns empty array when no active challenges
    - handles missing profiles gracefully

  describe("listMine")
    - returns user's challenges of all statuses

  describe("get")
    - returns challenge by id
    - returns undefined for non-existent id

  describe("create")
    - creates challenge with draft status
    - includes all provided fields
    - rejects empty title (validation)

  describe("update")
    - updates specified fields
    - does not allow setting privileged fields (user_id, submission_count)

  describe("publish")
    - sets status to active
    - rejects publish with missing required fields (title, description)

  describe("setStatus")
    - toggles between active and inactive
    - sets to closed
    - rejects invalid transitions (e.g., closed -> active)

  describe("deleteDraft")
    - deletes draft challenge
    - rejects deletion of non-draft challenges
```

### 6.2 `src/test/unit/services/challengeMediaService.test.ts`

```
describe("challengeMediaService")
  describe("upload")
    - uploads file to storage and creates record
    - generates uuid-prefixed storage path
    - returns ChallengeMedia object

  describe("list")
    - returns media ordered by sort_order
    - returns empty array for challenge with no media

  describe("getSignedUrl")
    - returns signed URL string

  describe("delete")
    - removes storage file and database record

  describe("reorder")
    - updates sort_order for given items
```

### 6.3 `src/test/unit/services/challengeSubmissionService.test.ts`

```
describe("challengeSubmissionService")
  describe("submit")
    - creates submission with pending status
    - handles duplicate submission error

  describe("listForChallenge")
    - returns submissions for a given challenge

  describe("listMine")
    - returns user's own submissions

  describe("updateStatus")
    - updates to accepted
    - updates to rejected
```

### 6.4 `src/test/unit/components/ChallengeCard.test.tsx`

```
describe("ChallengeCard")
  - renders title and description
  - shows compensation badge with correct formatting (per-dataset vs lump sum)
  - shows deadline with days remaining
  - shows "No deadline" when null
  - shows "Deadline passed" for past dates
  - shows submission count
  - renders up to 4 tags
  - links to /marketplace/challenges/:id
  - shows creator name
  - shows preview media when available
  - shows fallback icon when no media
```

### 6.5 `src/test/unit/components/ChallengeStatusBadge.test.tsx`

```
describe("ChallengeStatusBadge")
  - renders "Draft" with gray styling for draft
  - renders "Active" with green styling for active
  - renders "Inactive" with yellow styling for inactive
  - renders "Closed" with red styling for closed
```

### 6.6 `src/test/unit/components/ChallengeListCard.test.tsx`

```
describe("ChallengeListCard")
  - renders title and status badge
  - shows edit link to /dashboard/challenges/:id
  - shows delete button only for draft
  - shows publish button for draft
  - shows deactivate button for active
  - shows activate button for inactive
  - hides actions for closed
  - shows compensation and deadline info
  - shows submission count
```

### 6.7 `src/test/integration/marketplace-challenges.test.tsx`

```
describe("MarketplacePage - Challenges Tab")
  - renders Datasets tab by default
  - switches to Challenges tab on click
  - updates URL with tab parameter
  - displays challenge cards in grid
  - filters challenges by search query
  - filters challenges by tag
  - shows empty state when no challenges
  - shows loading skeletons while fetching
```

### 6.8 `src/test/integration/dashboard-challenges.test.tsx`

```
describe("DashboardPage - Challenges Section")
  - shows challenge count in stats
  - renders "Create Challenge" button
  - navigates to /dashboard/challenges/new on create click
  - lists user's challenges with ChallengeListCard
  - shows empty state when no challenges
```

### 6.9 `src/test/integration/challenge-detail.test.tsx`

```
describe("ChallengeDetailPage")
  - renders challenge title and description
  - displays media gallery
  - shows compensation details with per-type label
  - shows deadline countdown
  - shows "Submit Dataset" for non-owner authenticated user
  - hides "Submit Dataset" for unauthenticated user (shows sign-in CTA)
  - hides "Submit Dataset" for challenge owner
  - shows status controls for owner
  - shows "no longer accepting" banner for inactive/closed
  - shows submissions panel for owner
```

### 6.10 `src/test/integration/challenge-editor.test.tsx`

```
describe("ChallengeEditorPage")
  - renders form with 4 steps
  - can navigate between steps
  - saves draft on button click
  - validates required fields before publish
  - shows pre-publish checklist
  - publishes and redirects
  - pre-populates form when editing existing challenge
```

---

## 7. Implementation Order

1. **Migration**: Supabase SQL migration with tables, constraints, triggers, indexes, RLS, storage bucket
2. **Types**: Add Challenge, ChallengeMedia, ChallengeSubmission, EnrichedChallenge to `src/types/index.ts`
3. **Services**: challengeService, challengeMediaService, challengeSubmissionService
4. **Shared Components**: ChallengeStatusBadge, CompensationBadge, DeadlineCountdown
5. **Cards**: ChallengeCard, ChallengeListCard
6. **Upload**: ChallengeMediaUpload, ChallengeMediaGallery
7. **Forms**: ChallengeForm (multi-step with zod)
8. **Pages**: ChallengeEditorPage, ChallengeDetailPage
9. **Marketplace Update**: Extract DatasetMarketplacePanel, add MarketplaceTabs, ChallengeMarketplacePanel
10. **Dashboard Update**: Add MyChallengesSection
11. **Routes**: Add to App.tsx
12. **Modals**: SubmitDatasetModal
13. **Tests**: Unit + integration tests
14. **Polish**: Loading states, error handling, responsive design, empty states

---

## 8. Design Consistency

All new components follow existing patterns:
- **Cards**: `rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm`
- **Badges**: `px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`
- **Icons**: Lucide React (Target for challenges, Trophy for compensation)
- **Colors**: Primary (cyan) for actions, Secondary (purple) for accents, green/yellow/red for status
- **Neon glow**: `shadow-[0_0_40px_hsl(var(--primary)/0.12)]` on hover
- **Typography**: DM Sans body, JetBrains Mono for prices
- **Layout**: `container mx-auto px-6`, `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Transitions**: `transition-all duration-300` for hover effects

## 9. Security Notes

- Description rendered as plain text (no rich HTML) in v1 to avoid XSS
- Media upload: enforce `accept="video/*,image/*"` client-side + validate content_type server-side
- File size limit: 100MB per file, 10 files per challenge (enforced client-side, storage policy server-side)
- Storage paths use UUID prefix to prevent collisions: `{user_id}/{challenge_id}/{uuid}-{name}`
- Signed URLs with short TTL (60s) for media access
- Privileged fields (user_id, submission_count, published_at, closed_at) set only by DB defaults/triggers
- RLS prevents: self-submission, submission to inactive challenges, submission with non-owned datasets
- Status transitions enforced by DB trigger, not just client-side
- IDOR protection: draft/inactive/closed challenges only visible to owner via RLS
