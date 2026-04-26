# Challenges Feature - Implementation Plan

## Overview

Add a **Challenges** feature to GamiphyAI where users can create requests for datasets to automate new tasks using robots. Other users can browse challenges on the marketplace and propose matching datasets for compensation.

## Architecture

### Data Model

#### `challenges` table (Supabase/PostgreSQL)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | - | FK to `auth.users`, challenge creator |
| `title` | `text` | - | Challenge title |
| `description` | `text` | `''` | Rich description of the task |
| `status` | `text` | `'draft'` | `draft` / `active` / `inactive` / `closed` |
| `compensation_amount` | `integer` | `0` | Amount in smallest currency unit (cents/won) |
| `compensation_per` | `text` | `'dataset'` | `dataset` or `challenge` (per-dataset vs lump sum) |
| `currency` | `text` | `'USD'` | Currency code |
| `deadline` | `timestamptz` | `null` | Optional submission deadline |
| `constraints` | `text` | `''` | Technical constraints (robot type, format, etc.) |
| `conditions` | `text` | `''` | Acceptance conditions for datasets |
| `tags` | `text[]` | `'{}'` | Searchable tags |
| `submission_count` | `integer` | `0` | Number of dataset proposals received |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

#### `challenge_media` table

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | PK |
| `challenge_id` | `uuid` | - | FK to `challenges` |
| `user_id` | `uuid` | - | FK to `auth.users` (for storage path) |
| `storage_path` | `text` | - | Path in Supabase Storage |
| `file_name` | `text` | - | Original filename |
| `content_type` | `text` | - | MIME type (video/mp4, image/png, etc.) |
| `size_bytes` | `bigint` | `null` | File size |
| `sort_order` | `integer` | `0` | Display ordering |
| `created_at` | `timestamptz` | `now()` | |

#### `challenge_submissions` table (for dataset proposals)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | PK |
| `challenge_id` | `uuid` | - | FK to `challenges` |
| `dataset_id` | `uuid` | - | FK to `datasets` |
| `submitter_id` | `uuid` | - | FK to `auth.users` |
| `message` | `text` | `''` | Proposal message |
| `status` | `text` | `'pending'` | `pending` / `accepted` / `rejected` |
| `created_at` | `timestamptz` | `now()` | |

#### Storage bucket: `challenge-media`
- Path pattern: `{user_id}/{challenge_id}/{filename}`
- Private bucket with RLS policies matching owner

#### RLS Policies

**challenges:**
- `owner_crud`: Authenticated users can CRUD their own challenges (`auth.uid() = user_id`)
- `public_read_active`: Anyone can SELECT where `status = 'active'`

**challenge_media:**
- `owner_crud`: Authenticated users can CRUD their own media (`auth.uid() = user_id`)
- `public_read`: Anyone can SELECT media for active challenges (via join or direct)

**challenge_submissions:**
- `submitter_crud`: Authenticated users can INSERT/SELECT their own submissions
- `challenge_owner_read`: Challenge owners can SELECT submissions for their challenges

---

### TypeScript Types (`src/types/index.ts`)

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
}

export interface EnrichedChallenge extends Challenge {
  creator_name: string;
  media: ChallengeMedia[];
}
```

---

### Service Layer

#### `src/services/challengeService.ts`

```typescript
const challengeService = {
  // List all active challenges (for marketplace)
  async listActive(): Promise<Challenge[]>;

  // List enriched challenges (with creator name + media)
  async listEnriched(): Promise<EnrichedChallenge[]>;

  // List user's own challenges (for dashboard, all statuses)
  async listMine(): Promise<Challenge[]>;

  // Get single challenge by ID
  async get(id: string): Promise<Challenge | undefined>;

  // Create new challenge (draft status)
  async create(data: Omit<Challenge, 'id' | 'submission_count' | 'created_at' | 'updated_at'>): Promise<Challenge>;

  // Update challenge (save draft progress or edit)
  async update(id: string, updates: Partial<Challenge>): Promise<Challenge>;

  // Publish challenge (set status to 'active')
  async publish(id: string): Promise<Challenge>;

  // Toggle active/inactive
  async setStatus(id: string, status: 'active' | 'inactive' | 'closed'): Promise<Challenge>;

  // Delete draft challenge
  async deleteDraft(id: string): Promise<void>;
};
```

#### `src/services/challengeMediaService.ts`

```typescript
const challengeMediaService = {
  // Upload media file to Supabase Storage + create record
  async upload(challengeId: string, userId: string, file: File): Promise<ChallengeMedia>;

  // List media for a challenge
  async list(challengeId: string): Promise<ChallengeMedia[]>;

  // Get signed URL for a media file
  async getSignedUrl(storagePath: string): Promise<string>;

  // Delete media file
  async delete(mediaId: string, storagePath: string): Promise<void>;

  // Reorder media
  async reorder(mediaIds: string[]): Promise<void>;
};
```

#### `src/services/challengeSubmissionService.ts`

```typescript
const challengeSubmissionService = {
  // Submit a dataset to a challenge
  async submit(data: { challenge_id: string; dataset_id: string; message: string }): Promise<ChallengeSubmission>;

  // List submissions for a challenge (owner view)
  async listForChallenge(challengeId: string): Promise<ChallengeSubmission[]>;

  // List user's own submissions
  async listMine(): Promise<ChallengeSubmission[]>;

  // Update submission status (challenge owner)
  async updateStatus(id: string, status: 'accepted' | 'rejected'): Promise<void>;
};
```

---

### Frontend Components

#### New Components

1. **`ChallengeCard.tsx`** - Marketplace card for challenges (similar to `MarketplaceCard`)
   - Shows: thumbnail (first media), title, description snippet, compensation badge, deadline, tags, creator
   - Compensation badge: green for per-dataset, blue for lump sum
   - Deadline indicator: shows days remaining, red if < 3 days
   - Submission count badge

2. **`CreateChallengeModal.tsx`** - Multi-step modal for creating/editing challenges
   - Step 1: Basic info (title, description)
   - Step 2: Media upload (drag & drop videos/images)
   - Step 3: Compensation & conditions (amount, per-type, currency, deadline, constraints, conditions)
   - Step 4: Tags & review
   - "Save Draft" button available at every step
   - "Publish" button on final step
   - Uses existing Dialog, Button, Input, Textarea, Select from shadcn/ui

3. **`ChallengeStatusBadge.tsx`** - Status indicator component
   - draft: gray, active: green, inactive: yellow, closed: red

4. **`ChallengeListCard.tsx`** - Dashboard list item (similar to `DatasetListCard`)
   - Shows: title, status badge, compensation, deadline, submission count
   - Actions: Edit, Publish/Unpublish, Delete (draft only)

5. **`ChallengeMediaUpload.tsx`** - Media upload zone for challenges
   - Drag & drop zone (reuses patterns from `FileUploadZone`)
   - Accepts: video/*, image/*
   - Shows thumbnails/previews of uploaded files
   - Reorder via sort_order
   - Delete individual files

6. **`SubmitDatasetModal.tsx`** - Modal for submitting a dataset to a challenge
   - Select from user's own datasets
   - Add a proposal message
   - Submit button

#### Modified Components

1. **`MarketplacePage.tsx`** - Add tab navigation: "Datasets" | "Challenges"
   - Default tab: Datasets (current behavior)
   - Challenges tab: grid of ChallengeCards
   - Shared search bar filters both tabs
   - Tag filtering works across both
   - Tab state preserved in URL query param (`?tab=challenges`)

2. **`DashboardPage.tsx`** - Add Challenges section
   - New stats card: "Challenges" count
   - "My Challenges" section below datasets
   - "Create Challenge" button (opens CreateChallengeModal)
   - List of user's challenges with ChallengeListCard

3. **`Navbar.tsx`** - No changes needed (marketplace link already exists)

#### New Pages

1. **`ChallengeDetailPage.tsx`** (`/marketplace/challenges/:id`)
   - Full challenge description with rich text
   - Media gallery (video player + image gallery)
   - Compensation details
   - Deadline countdown
   - Constraints and conditions
   - "Submit Dataset" button (for other authenticated users)
   - Status management (for owner): toggle active/inactive
   - Submissions list (for owner)

2. **`EditChallengePage.tsx`** (`/dashboard/challenges/:id`)
   - Full edit form (reuses CreateChallengeModal logic as a page)
   - Save progress, publish, manage status
   - Media management

---

### Routes (`App.tsx`)

```
/marketplace                       - MarketplacePage (with tabs)
/marketplace/challenges/:id        - ChallengeDetailPage (public, active only)
/dashboard                         - DashboardPage (with challenges section)
/dashboard/challenges/new          - EditChallengePage (create mode)
/dashboard/challenges/:id          - EditChallengePage (edit mode)
```

---

### User Flows

#### Creating a Challenge
1. User navigates to Dashboard
2. Clicks "Create Challenge" button
3. Redirected to `/dashboard/challenges/new`
4. Fills in title, description
5. Uploads videos/images showing the task
6. Sets compensation (amount, per-dataset or per-challenge, currency)
7. Sets deadline (optional)
8. Adds constraints and conditions
9. Adds tags
10. Can "Save Draft" at any point (creates/updates with status='draft')
11. Clicks "Publish" to set status='active' and make visible on marketplace

#### Browsing Challenges
1. User navigates to Marketplace
2. Sees tab navigation: "Datasets" | "Challenges"
3. Clicks "Challenges" tab
4. Sees grid of active challenges with ChallengeCards
5. Can search and filter by tags
6. Clicks a challenge card to see full details

#### Submitting a Dataset to a Challenge
1. User views a challenge detail page
2. Clicks "Submit Dataset"
3. Selects from their uploaded datasets
4. Adds a proposal message
5. Submits — creates a challenge_submission record
6. Challenge owner can see submissions and accept/reject

#### Managing Challenge Status
1. Owner navigates to Dashboard > My Challenges
2. Can toggle status: active -> inactive (stop receiving submissions)
3. Can reactivate: inactive -> active
4. Can close: any -> closed (permanent)

---

## Unit Tests

### `src/test/unit/services/challengeService.test.ts`

```
describe("challengeService")
  describe("listActive")
    - returns array of active challenges
    - returns empty array when no challenges exist

  describe("listMine")
    - returns user's challenges of all statuses

  describe("get")
    - returns challenge by id
    - returns undefined for non-existent id

  describe("create")
    - creates challenge with draft status
    - includes all provided fields

  describe("update")
    - updates specified fields
    - updates updated_at timestamp

  describe("publish")
    - sets status to active

  describe("setStatus")
    - toggles between active and inactive
    - sets to closed

  describe("deleteDraft")
    - deletes draft challenge
```

### `src/test/unit/services/challengeMediaService.test.ts`

```
describe("challengeMediaService")
  describe("upload")
    - uploads file to storage and creates record
    - returns ChallengeMedia with storage path

  describe("list")
    - returns media for challenge ordered by sort_order

  describe("getSignedUrl")
    - returns signed URL string

  describe("delete")
    - removes storage file and database record
```

### `src/test/unit/services/challengeSubmissionService.test.ts`

```
describe("challengeSubmissionService")
  describe("submit")
    - creates submission with pending status

  describe("listForChallenge")
    - returns submissions for a given challenge

  describe("listMine")
    - returns user's own submissions

  describe("updateStatus")
    - updates submission status to accepted/rejected
```

### `src/test/unit/components/ChallengeCard.test.tsx`

```
describe("ChallengeCard")
  - renders challenge title and description
  - shows compensation badge with correct formatting
  - shows deadline when set
  - shows "No deadline" when deadline is null
  - shows submission count
  - renders tags
  - links to challenge detail page
  - shows creator name
```

### `src/test/unit/components/ChallengeStatusBadge.test.tsx`

```
describe("ChallengeStatusBadge")
  - renders "Draft" with gray styling
  - renders "Active" with green styling
  - renders "Inactive" with yellow styling
  - renders "Closed" with red styling
```

### `src/test/unit/components/ChallengeListCard.test.tsx`

```
describe("ChallengeListCard")
  - renders title and status badge
  - shows edit button
  - shows delete button only for draft status
  - shows publish button for draft challenges
  - shows activate/deactivate toggle for published challenges
```

### `src/test/integration/marketplace-challenges.test.tsx`

```
describe("MarketplacePage - Challenges Tab")
  - renders Datasets tab by default
  - switches to Challenges tab on click
  - displays challenge cards in grid
  - filters challenges by search query
  - filters challenges by tag
  - shows empty state when no challenges match
  - preserves tab state in URL
```

### `src/test/integration/dashboard-challenges.test.tsx`

```
describe("DashboardPage - Challenges Section")
  - shows challenge count in stats
  - renders Create Challenge button
  - lists user's challenges
  - shows empty state when no challenges
```

### `src/test/integration/challenge-detail.test.tsx`

```
describe("ChallengeDetailPage")
  - renders challenge title and description
  - displays media gallery
  - shows compensation details
  - shows deadline countdown
  - shows Submit Dataset button for non-owner authenticated users
  - hides Submit Dataset button for challenge owner
  - shows status controls for owner
```

---

## Implementation Order

1. **Database**: Create Supabase migration (tables, RLS, storage bucket)
2. **Types**: Add Challenge interfaces to `src/types/index.ts`
3. **Services**: Implement challengeService, challengeMediaService, challengeSubmissionService
4. **Components**: Build ChallengeCard, ChallengeStatusBadge, ChallengeListCard, ChallengeMediaUpload
5. **Pages**: Build ChallengeDetailPage, EditChallengePage
6. **Integration**: Update MarketplacePage (tabs), DashboardPage (challenges section)
7. **Routes**: Add new routes to App.tsx
8. **Tests**: Unit tests for services, component tests, integration tests
9. **Polish**: Responsive design, loading states, error handling

## Design Consistency

All new components follow existing patterns:
- **Cards**: Use `rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm` pattern
- **Badges**: Use `px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider` pattern
- **Icons**: Lucide React icons consistently
- **Colors**: Primary (cyan/teal) for main actions, Secondary (purple) for accents
- **Transitions**: `transition-all duration-300` or `duration-500` for hover effects
- **Neon glow**: `shadow-[0_0_40px_hsl(var(--primary)/0.12)]` on hover
- **Typography**: DM Sans for body, JetBrains Mono for code/prices
- **Layout**: Container with `mx-auto px-6`, responsive grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
