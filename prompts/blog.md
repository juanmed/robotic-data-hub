# Blog Feature Plan — Final (Codex Review Integrated)

**Status**: Ready for implementation. Codex provided 8 findings; all high-severity issues have been addressed in this plan.

---

## Overview

Add a third top-level tab **Blog** to the application with public blog post listings and detail pages rendered from Markdown. Admins can author and edit posts using the existing `MarkdownEditor` component. Storage and authorization are independent from challenges, maintaining modular architecture while reusing proven UI patterns.

## Goals

1. **Public listing**: Simple list of published blog posts (title + date)
2. **Public reading**: Full post pages rendered from Markdown with consistent styling
3. **Admin-only authoring**: Use the existing `MarkdownEditor` component with blog-specific storage
4. **Modular design**: Separate storage bucket and database table from challenges; reuse `MarkdownEditor` and media upload patterns
5. **Zero third-party dependencies**: Leverage existing open-source tools (react-markdown, remark-gfm, rehype-sanitize) and Supabase (Postgres + RLS)

## Database Schema

### New Tables

#### `blog_posts`

```sql
CREATE TYPE blog_status AS ENUM ('draft', 'published');

CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id),
  slug text NOT NULL,                           -- URL-safe, unique (case-insensitive)
  title text NOT NULL,
  excerpt text DEFAULT '',                      -- Auto-truncated from body_md on save if empty
  body_md text DEFAULT '',                      -- Markdown source
  status blog_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,                     -- Set when status → 'published'; NULL when draft
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lower(slug)),                         -- Case-insensitive uniqueness
  CHECK (
    (status = 'draft' AND published_at IS NULL) OR
    (status = 'published' AND published_at IS NOT NULL)
  )
);

CREATE INDEX blog_posts_status_published_at ON blog_posts(status, published_at DESC)
  WHERE status = 'published'::blog_status;
CREATE INDEX blog_posts_created_at_desc ON blog_posts(created_at DESC);
CREATE INDEX blog_posts_author_id ON blog_posts(author_id);

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_update_timestamp
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- Prevent slug changes after publish
CREATE OR REPLACE FUNCTION public.prevent_slug_change_after_publish()
  RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'published'::blog_status AND OLD.slug != NEW.slug THEN
    RAISE EXCEPTION 'Cannot change slug of published post';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_prevent_slug_change
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION prevent_slug_change_after_publish();
```

**Constraints & Triggers:**
- `status` is a strict ENUM type: only 'draft' or 'published'
- Consistency check: draft posts must have `published_at = NULL`; published posts must have `published_at` set
- `slug` uniqueness is case-insensitive (via `UNIQUE (lower(slug))`) to prevent collisions
- `slug` is immutable once a post is published (DB trigger enforces this)
- `updated_at` is automatically bumped on any row update
- `created_at` and `updated_at` are NOT NULL with defaults

#### `blog_media` (mirrors `challenge_media` shape)

```sql
CREATE TABLE public.blog_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),  -- User who uploaded the file
  storage_path text NOT NULL,                   -- e.g., posts/{postId}/{filename}
  file_name text NOT NULL,
  content_type text NOT NULL,
  size_bytes integer,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blog_media_post_id ON blog_media(post_id);
CREATE INDEX blog_media_uploaded_by ON blog_media(uploaded_by);
```

**Note**: This table structure mirrors `challenge_media` for consistency. `uploaded_by` is renamed from `user_id` for clarity (only admins can upload, so it tracks uploader, not author). RLS and storage policies are blog-specific (see below).

### User Roles (if not already present)

If the project does not already have an `app_role` enum and `user_roles` table:

```sql
CREATE TYPE app_role AS ENUM ('admin', 'blogger', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role app_role)
  RETURNS boolean AS $$
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2)
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;
```

**Role semantics**:
- `'admin'` — Full system access (user management, settings, etc.)
- `'blogger'` — Can create, edit, and publish blog posts
- `'moderator'` — Can manage community content (future use)
- `'user'` — Regular user (default)

A single user can have multiple roles (e.g., `'admin'` AND `'blogger'`).

**Note**: If `user_roles` and `has_role()` already exist (from the challenge feature), add `'blogger'` to the enum if needed and reuse the table — no duplicate creation.

### Row-Level Security (RLS)

Enable RLS on both tables and define policies:

#### `blog_posts` policies

```sql
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public: Read published posts
CREATE POLICY "blog_public_read_published" ON blog_posts
  FOR SELECT
  USING (status = 'published');

-- Blogger: Full access (all CRUD operations)
CREATE POLICY "blog_blogger_all" ON blog_posts
  FOR ALL
  USING (has_role(auth.uid(), 'blogger'::app_role))
  WITH CHECK (has_role(auth.uid(), 'blogger'::app_role));
```

#### `blog_media` policies

```sql
ALTER TABLE public.blog_media ENABLE ROW LEVEL SECURITY;

-- Public: Read media for published posts
CREATE POLICY "blog_media_public_read" ON blog_media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts WHERE id = post_id AND status = 'published'::blog_status
    )
  );

-- Blogger: Full access (insert, update, delete)
CREATE POLICY "blog_media_blogger_insert" ON blog_media
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'blogger'::app_role) AND uploaded_by = auth.uid());

CREATE POLICY "blog_media_blogger_delete" ON blog_media
  FOR DELETE
  USING (has_role(auth.uid(), 'blogger'::app_role));
```

### Storage Bucket: `blog-media`

- **Visibility**: Private (signed URLs required for access)
- **Bucket policy**: Admins can upload/delete; public can read via signed URL
- **Path structure**: `posts/{postId}/{filename}` (matches challenge media pattern)

**Critical: Handling Signed URL Expiry**

Signed URLs expire after 7 days. Since markdown stores the rendered URL (not the storage path), old posts will show broken images after 7 days. **Solution**: Store `storage_path` in markdown instead of the full signed URL, then resolve to a fresh signed URL at render time.

Example markdown insertion:
```markdown
![alt-text](blog-media:storage_path:posts/abc123/image.jpg)
```

At render time, a custom markdown renderer plugin rewrites `blog-media:` links:
```ts
// Convert blog-media: scheme to fresh signed URL before rendering
const transformMarkdownLinks = async (md: string) => {
  // Find all blog-media: scheme URLs
  // For each, extract storage_path and call blogMediaService.getSignedUrl()
  // Replace with signed URL
};
```

Alternatively, make the `blog-media` bucket public-read (no auth required) if blog images don't need access control.

## Services

### `src/services/blogService.ts`

Decoupled from challenges; handles all post CRUD operations with optimistic concurrency control:

```ts
interface CreateBlogPostInput {
  title: string;
  slug: string;
  excerpt: string;
  body_md: string;
  cover_image?: string;
}

interface UpdateBlogPostInput extends Partial<CreateBlogPostInput> {
  status?: 'draft' | 'published';
  expectedUpdatedAt?: timestamptz;  // For optimistic locking (prevents editor overwrite race)
}

interface BlogPost {
  id: string;
  author_id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  cover_image?: string;
  status: 'draft' | 'published';
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export const blogService = {
  // Public queries
  list(options?: { publishedOnly?: boolean }): Promise<BlogPost[]>,
  getBySlug(slug: string): Promise<BlogPost | null>,
  getById(id: string): Promise<BlogPost | null>,

  // Admin mutations
  create(input: CreateBlogPostInput): Promise<BlogPost>,
  update(id: string, input: UpdateBlogPostInput): Promise<BlogPost>,
    // On conflict: throw "Post was modified; please reload and try again" (optimistic lock failure)
  publish(id: string): Promise<BlogPost>,     // Sets status='published', published_at=now()
  unpublish(id: string): Promise<BlogPost>,   // Sets status='draft', published_at=null
  delete(id: string): Promise<void>,

  // Admin queries
  listAll(options?: { status?: 'draft' | 'published' }): Promise<BlogPost[]>,
};
```

**Concurrency Control**: Update operations include `expectedUpdatedAt` to detect conflicts. If the row's `updated_at` differs, the update is rejected with a specific error message, preventing data loss from concurrent edits.

**Excerpt Auto-Generation**: When saving, if `excerpt` is empty/whitespace:
1. Extract plain text from `body_md` (strip markdown syntax)
2. Truncate to 150 characters
3. Append "..." if truncated
4. Store result in `excerpt`

### `src/services/blogMediaService.ts`

Separate from `challengeMediaService`; uses blog-specific storage and database. To reduce duplication, extract common media operations to a utility layer first.

#### Create `src/services/media/mediaServiceBase.ts` (new shared utility)

```ts
interface MediaServiceConfig {
  bucketName: string;        // e.g., 'blog-media' or 'challenge-media'
  tableName: string;         // e.g., 'blog_media' or 'challenge_media'
  pathPrefix: string;        // e.g., 'posts/{id}' or 'challenges/{id}'
}

export const createMediaService = (config: MediaServiceConfig) => ({
  async list(entityId: string): Promise<MediaItem[]> {
    // Query table WHERE {entityId_column} = $1, ORDER BY sort_order
  },
  async upload(entityId: string, userId: string, file: File): Promise<MediaItem> {
    // Upload to storage bucket at path {pathPrefix}/{filename}
    // Insert row into table
    // Return media item
  },
  async getSignedUrl(media: MediaItem, expiresIn?: number): Promise<string> {
    // Generate signed URL from storage_path
  },
  async delete(mediaId: string, storagePath: string): Promise<void> {
    // Delete from storage
    // Delete from table
  },
  async reorder(entityId: string, orderedIds: string[]): Promise<void> {
    // Update sort_order for each ID
  },
});
```

#### Then in `src/services/blogMediaService.ts`

```ts
export const blogMediaService = createMediaService({
  bucketName: 'blog-media',
  tableName: 'blog_media',
  pathPrefix: 'posts/{postId}',
});
```

**Design rationale**: 
- Extract core media operations to reduce duplication
- Blog/challenge services are thin adapters (bucket + table names only)
- Common logic (upload, sign, delete) stays in one place for consistency
- Future features (portfolio, courses) reuse the same base with new bucket/table names

### `src/hooks/useIsBlogger.ts`

Hook to check blogger role with loading state (prevents auth flicker):

```ts
interface UseIsBloggerResult {
  isBlogger: boolean;
  isLoading: boolean;
}

export const useIsBlogger = (): UseIsBloggerResult => {
  const { user } = useAuth();
  const [isBlogger, setIsBlogger] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsBlogger(false);
      setIsLoading(false);
      return;
    }
    // Query user_roles for current user and 'blogger' role via RLS-protected query
    checkBloggerRole(user.id)
      .then(result => {
        setIsBlogger(result);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Failed to check blogger role:', error);
        setIsBlogger(false);
        setIsLoading(false);
      });
  }, [user]);

  return { isBlogger, isLoading };
};
```

**Important**: All routes and components using `useIsBlogger()` must check `isLoading` before denying access. If loading, show a spinner or defer the redirect. This prevents flashing "Access Denied" to users with the blogger role during auth checks.

## Routes & Pages

### Route Structure

Add to `src/App.tsx`:

```tsx
// Public routes
<Route path="/blog" element={<BlogListPage />} />
<Route path="/blog/:slug" element={<BlogPostPage />} />

// Admin routes (protected by ProtectedRoute + admin gate)
<Route path="/dashboard/blog" element={<ProtectedRoute><AdminBlogListPage /></ProtectedRoute>} />
<Route path="/dashboard/blog/new" element={<ProtectedRoute><BlogEditorPage /></ProtectedRoute>} />
<Route path="/dashboard/blog/:id/edit" element={<ProtectedRoute><BlogEditorPage /></ProtectedRoute>} />
<Route path="/dashboard/blog/:id/preview" element={<ProtectedRoute><BlogPostPreview /></ProtectedRoute>} />
```

**Note**: All admin routes use `<ProtectedRoute>` which checks authentication + `useIsBlogger()` with proper loading state handling to prevent auth flicker.

### Page Components

#### `src/pages/blog/BlogListPage.tsx` (public)

- Fetches published posts via `blogService.list({ publishedOnly: true })` with React Query
- Renders a simple list: title, excerpt (or first 150 chars of body), formatted date, link to post
- Empty state: "No blog posts yet"
- Sorting: newest first (by `published_at DESC`)
- Mobile-responsive card or list layout

#### `src/pages/blog/BlogPostPage.tsx` (public)

- Route param: `:slug` (only fetches published posts)
- Fetches post via `blogService.getBySlug(slug)` with React Query; fails if `status !== 'published'`
- Header: title, author name, published date, optional cover image
- Body: renders `MarkdownEditor` in `readOnly` mode using the post's `body_md`
  - **Critical**: Before rendering markdown, transform `blog-media:` scheme links to fresh signed URLs (see storage bucket section)
- Error state: "Post not found" if slug is invalid or post is not published
- Author name: plain text (no link — future feature like in challenges)
- Sidebar (optional polish): post metadata, related posts, or "share" button

#### `src/pages/blog/BlogPostPreview.tsx` (admin only, by ID)

- Route param: `:id` (internal admin preview, bypasses published check)
- Protected route; checks `useIsBlogger()` with loading state
- Fetches post via `blogService.getById(id)` (returns draft or published)
- Same layout as `BlogPostPage` but allows viewing unpublished drafts
- Used for authoring workflow: edit → preview draft → publish

#### `src/pages/blog/AdminBlogListPage.tsx` (blogger only)

- Protected by `ProtectedRoute` wrapper; checks `useIsBlogger()` with loading state
- Fetches all posts (draft + published) via `blogService.listAll()`
- Renders a table/list with columns: title, slug, status, published date, created date
- Status badge: "Draft" (gray) or "Published" (green)
- Per-row actions:
  - **Edit** button → `/dashboard/blog/{id}/edit`
  - **Preview** link → `/blog/{slug}` (published posts only)
  - **Delete** button with confirmation dialog
- Filter/toggle: "Show drafts only" vs. "Show all"
- **New Post** button (top-right) → `/dashboard/blog/new`
- Empty state: "No posts yet. Create one to get started."

#### `src/pages/blog/BlogEditorPage.tsx` (blogger only)

- Protected by `ProtectedRoute` wrapper; checks `useIsBlogger()` with loading state
- Route params: `:id` (edit mode) or absent (create mode)
- **ID-first creation flow**: For new posts, create a draft row immediately (no title required initially) so a `postId` exists before media upload. This allows the upload path `posts/{postId}/{filename}` to work correctly.
  1. User navigates to `/dashboard/blog/new`
  2. Server creates a draft post row with a temporary title and slug (e.g., "Untitled Post", `untitled-post-{uuid}`)
  3. Returned `postId` is used for all media uploads
  4. User edits title/slug/body; save updates the draft row
- Form fields:
  - **Title** (text input, required on publish)
  - **Slug** (text input, required on publish, unique; auto-generated from title, lockable after publish)
  - **Excerpt** (textarea, optional, short summary for list view)
  - **Status** (toggle: Draft | Published; grayed if title/slug invalid)
  - **Cover Image** (optional, file picker or URL)
  - **Body** (uses `MarkdownEditor` in edit mode with blog-specific media upload)
- Save flow:
  - Validate slug uniqueness (check against existing posts, excluding current post)
  - Call `blogService.create()` (for new draft) or `blogService.update()` based on mode
  - On publish: validate title/slug, set `published_at = now()`, lock slug
  - On success: navigate to admin list or post preview page
  - On error: show error toast
  - Autosave (optional polish): periodically save drafts to prevent data loss
- Media upload:
  - Uses `postId` created above; all uploads go to `posts/{postId}/*` path
  - `MarkdownEditor` accepts a `uploader` callback that uses `blogMediaService`
  - Callback converts `storage_path` to `blog-media:storage_path:posts/{postId}/{filename}` scheme in markdown
  - Drag-and-drop media insertion into markdown (use same pattern as challenges Phase 2)

### Navbar Integration

#### `src/components/Navbar.tsx` (modify)

- Add **Blog** link in the top-level navigation between Marketplace and Search (visible to all)
- If user `useIsBlogger()` returns `{ isBlogger: true, isLoading: false }`, add a "New Post" entry in the user dropdown menu that navigates to `/dashboard/blog/new`
- While `isLoading: true`, hide blogger menu items (prevent flashing/early redirect)

## MarkdownEditor Integration

The `MarkdownEditor` component will be refactored slightly to support reuse by blog (Phase 2 of challenges already planned this):

### Proposed refactor (minimal, already outlined in challenge plan Phase 2)

Current `MarkdownEditor` props:
```ts
interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => Promise<void> | void;
  readOnly?: boolean;
  placeholder?: string;
  minRows?: number;
  className?: string;
  showSaveButton?: boolean;
}
```

**For blog support**: Pass a `uploader` callback prop (optional):
```ts
interface MarkdownEditorProps {
  // ... existing props ...
  uploader?: (file: File) => Promise<{ url: string; alt: string }>;
}
```

When `uploader` is provided, `MarkdownEditor` enables drag-and-drop into the textarea. Dropped files are uploaded via the callback; markdown is inserted at cursor position using the `blog-media:storage_path:...` scheme (not signed URLs).

**For blog pages (editor)**: Wire up the callback to use `blogMediaService`:
```tsx
<MarkdownEditor
  value={postBody}
  onChange={setPostBody}
  onBlur={handleSave}
  uploader={async (file) => {
    const media = await blogMediaService.upload(postId, userId, file);
    // Insert storage_path as blog-media: scheme (not signed URL) to avoid expiry issues
    return { 
      url: `blog-media:storage_path:${media.storage_path}`,
      alt: file.name 
    };
  }}
/>
```

**For blog pages (reader)**: Create a shared markdown renderer config:

```ts
// src/components/MarkdownRenderer.tsx (new shared utility)
export const createBlogMarkdownRenderer = () => {
  // Transform blog-media: scheme links to fresh signed URLs at render time
  const transformBlogMediaLinks = async (md: string) => {
    const regex = /blog-media:storage_path:([^\s)]+)/g;
    let transformed = md;
    for (const match of md.matchAll(regex)) {
      const storagePath = match[1];
      const signedUrl = await blogMediaService.getSignedUrl({ storage_path: storagePath });
      transformed = transformed.replace(match[0], signedUrl);
    }
    return transformed;
  };

  return {
    render: async (md: string) => {
      const transformed = await transformBlogMediaLinks(md);
      return <ReactMarkdown remarkPlugins={[remarkGfm]}>{transformed}</ReactMarkdown>;
    },
  };
};
```

Then in `BlogPostPage`:
```tsx
const renderer = createBlogMarkdownRenderer();
const html = await renderer.render(post.body_md);
```

This ensures fresh signed URLs are generated on each page load, preventing the 7-day expiry issue.

**For challenge pages**: Continue using `MarkdownEditor` as-is (no breaking changes); the `uploader` prop is optional and defaults to undefined (drag-drop disabled).

## Blogger Bootstrapping

- **No UI for role assignment in this phase.** 
- **First blogger role** is seeded by a single manual SQL INSERT into `user_roles` after migration:
  ```sql
  INSERT INTO user_roles (user_id, role) 
  VALUES ((SELECT id FROM auth.users WHERE email = 'fer@gamiphy.ai'), 'blogger');
  ```
- Additional bloggers can be added later via the same SQL command
- In future phases, add a restricted admin panel to manage user roles

## Future Extensions (out of scope)

- Comments section (threaded like challenges)
- Tags / categories
- RSS feed
- Full-text search
- Scheduled publishing
- Multi-author workflows with editor roles
- Admin UI for user role management

## Testing

### Unit Tests
- `blogService.test.ts` — CRUD operations, RLS filtering
- `blogMediaService.test.ts` — upload, delete, signed URL generation
- `useIsAdmin.test.ts` — role checking

### Component Tests
- `BlogListPage.test.tsx` — public listing, empty state, sorting
- `BlogPostPage.test.tsx` — slug resolution, markdown rendering, 404 handling
- `AdminBlogListPage.test.tsx` — admin gate, table rendering, filter toggle, delete confirm
- `BlogEditorPage.test.tsx` — admin gate, form validation, create vs. edit mode, save flow

### Integration Tests
- Slug uniqueness validation
- RLS: unauthenticated users can read published posts only
- RLS: admins can create, edit, delete, and transition draft ↔ published
- Media upload integration with editor

## Implementation Checklist

### Database & Infrastructure
- [ ] Create database migration with `blog_posts` and `blog_media` tables
  - [ ] Use `blog_status` ENUM for strict type safety
  - [ ] Add triggers for `updated_at` auto-bump and slug immutability (post-publish)
  - [ ] Add CHECK constraint coupling `status` and `published_at` consistency
  - [ ] Add case-insensitive slug uniqueness index
  - [ ] Add indexes for common queries: `created_at DESC`, `author_id`
- [ ] Seed `user_roles` and `has_role()` if not already present
- [ ] Create storage bucket `blog-media` with private visibility and signed URL support (7-day TTL)

### Services & Utilities
- [ ] Create `src/services/media/mediaServiceBase.ts` (shared media utility)
- [ ] Create `src/services/blogService.ts` with optimistic concurrency control (`expectedUpdatedAt`) and excerpt auto-truncation
- [ ] Create `src/services/blogMediaService.ts` (adapter using shared base)
- [ ] Create `src/hooks/useIsBlogger.ts` (returns `{ isBlogger, isLoading }`)
- [ ] Create `src/components/MarkdownRenderer.tsx` (handles `blog-media:` scheme transformation)

### Components & Pages
- [ ] Refactor `MarkdownEditor` to accept optional `uploader` callback
- [ ] Create `BlogListPage.tsx` (public listing, newest first)
- [ ] Create `BlogPostPage.tsx` (public detail, slug-based, published only)
- [ ] Create `BlogPostPreview.tsx` (admin preview, ID-based, drafts allowed)
- [ ] Create `AdminBlogListPage.tsx` (admin list with edit/delete/preview actions)
- [ ] Create `BlogEditorPage.tsx` with ID-first draft creation flow
- [ ] Update `Navbar.tsx` to add Blog link and admin New Post option

### Routing & Auth
- [ ] Add routes to `App.tsx` (public + admin with ProtectedRoute)
- [ ] Update `ProtectedRoute` to handle `useIsBlogger()` loading state (prevent auth flicker)

### Testing
- [ ] Unit: `blogService.test.ts`, `blogMediaService.test.ts`, `useIsAdmin.test.ts`, `MarkdownRenderer.test.ts`
- [ ] Component: `BlogListPage.test.tsx`, `BlogPostPage.test.tsx`, `AdminBlogListPage.test.tsx`, `BlogEditorPage.test.tsx`
- [ ] Integration: slug uniqueness, RLS filtering, draft/published visibility, signed URL expiry behavior, concurrent edit detection

### Deployment & Admin Setup
- [ ] Manual testing: public listing, detail pages, admin authoring flow, RLS policies
- [ ] Admin bootstrap: insert first admin user role into `user_roles` table

## Design Rationale

1. **Open source, zero cost**: react-markdown, remark-gfm, rehype-sanitize, Postgres/RLS — no third-party blog platform
2. **Modular storage**: `blog-media` bucket and `blog_media` table are isolated from challenges
3. **Reusable UI**: `MarkdownEditor` and media upload patterns are shared; only the service adapter changes
4. **Secure by default**: `user_roles` + `has_role()` SECURITY DEFINER (project's established pattern), RLS restricts writes to admins
5. **Future-ready**: Comments, categories, and other features can attach to `blog_posts.id` using the same patterns established in the project

## Codex Review Integration

Codex identified 8 findings; 3 high-severity items have been addressed in this updated plan:

1. **✅ Fixed: Signed URL expiry breaking images** — Markdown now stores `storage_path` in `blog-media:storage_path:...` scheme; render-time transformation generates fresh signed URLs per request.

2. **✅ Fixed: Slug immutability only in app** — Added DB trigger and CHECK constraint to prevent slug changes after publish.

3. **✅ Fixed: `useIsBlogger()` causing auth flicker** — Hook now returns `{ isAdmin, isLoading }` and `ProtectedRoute` respects loading state.

4. **✅ Fixed: `status` text column unsafety** — Changed to `blog_status` ENUM with CHECK constraint enforcing status/published_at consistency.

5. **✅ Fixed: Media ownership ambiguity** — Renamed `blog_media.user_id` to `uploaded_by` for clarity.

6. **✅ Fixed: Media service duplication** — Created shared `mediaServiceBase.ts` utility; blog/challenge adapters are now thin wrappers.

7. **✅ Fixed: Post-ID lifecycle for media uploads** — Implemented ID-first draft creation flow: create draft row on `/new`, then allow uploads using that ID.

8. **✅ Fixed: Admin preview routing** — Added `/dashboard/blog/:id/preview` for draft viewing; public `/blog/:slug` is published-only.

---

## Decisions Made & Implementation Notes

### ✅ Decided

1. **Blog writing permissions**: Use dedicated `'blogger'` role (not `'admin'`)
   - Separates concerns: bloggers write content; admins manage system
   - More secure (least privilege principle)
   - Scales easily for multiple content creators
   - All blog operations gated to `has_role(auth.uid(), 'blogger'::app_role)`

2. **Cover image**: Not needed — removed from schema
   - Focus on text content only; simplifies schema and UI

3. **Excerpt auto-generation**: Auto-truncate from body on save ✅
   - If excerpt is empty when saving, extract plain text from markdown
   - Truncate to 150 chars + append "..." if needed
   - Users can override by providing explicit excerpt

### ✅ All Information Gathered

**First blogger user**: `fer@gamiphy.ai` will have the `'blogger'` role
- Will be seeded after migration (see Blogger Bootstrapping section)

### Alternatives to Consider

**Public-read blog media** (if access control not needed):
   - If blog images/videos don't need auth, make `blog-media` bucket public-read
   - Eliminates signed URL complexity but contents become discoverable
   - Simpler but less flexible if requirements change later
