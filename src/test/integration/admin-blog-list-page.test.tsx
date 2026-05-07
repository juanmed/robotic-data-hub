import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminBlogListPage } from '@/pages/blog/AdminBlogListPage';

const blogServiceMock = vi.hoisted(() => ({
  listAll: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/services/blogService', () => ({
  blogService: blogServiceMock,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div role="dialog">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogCancel: ({ children, disabled }: any) => (
    <button disabled={disabled}>{children}</button>
  ),
  AlertDialogAction: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

const mockDraft = {
  id: 'post_draft',
  title: 'Draft Post',
  slug: 'draft-post',
  status: 'draft',
  published_at: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  author_id: 'usr_1',
  excerpt: '',
  body_md: '',
};

const mockPublished = {
  id: 'post_pub',
  title: 'Published Post',
  slug: 'published-post',
  status: 'published',
  published_at: '2026-02-01T00:00:00.000Z',
  created_at: '2026-01-15T00:00:00.000Z',
  updated_at: '2026-02-01T00:00:00.000Z',
  author_id: 'usr_1',
  excerpt: 'An excerpt',
  body_md: '# Body',
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminBlogListPage />
    </MemoryRouter>
  );

describe('AdminBlogListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders posts table with title, status badges, and action buttons', async () => {
    blogServiceMock.listAll.mockResolvedValue([mockDraft, mockPublished]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Draft Post')).toBeInTheDocument();
      expect(screen.getByText('Published Post')).toBeInTheDocument();
    });

    expect(screen.getByText('Draft Post')).toBeInTheDocument();
    expect(screen.getByText('Published Post')).toBeInTheDocument();
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Published').length).toBeGreaterThan(0);
  });

  it('shows empty state with create button when no posts exist', async () => {
    blogServiceMock.listAll.mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no posts yet/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/create one to get started/i)).toBeInTheDocument();
  });

  it('shows error message when post list fetch fails', async () => {
    blogServiceMock.listAll.mockRejectedValue(new Error('Network error'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/failed to load blog posts/i)).toBeInTheDocument();
    });
  });

  it('Drafts button fetches posts with status: draft filter', async () => {
    blogServiceMock.listAll.mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(blogServiceMock.listAll).toHaveBeenCalled();
    });

    blogServiceMock.listAll.mockResolvedValue([mockDraft]);

    fireEvent.click(screen.getByRole('button', { name: /^Drafts$/i }));

    await waitFor(() => {
      expect(blogServiceMock.listAll).toHaveBeenCalledWith({ status: 'draft' });
    });
  });

  it('delete flow: opens confirm dialog then removes row on confirm', async () => {
    blogServiceMock.listAll.mockResolvedValue([mockDraft]);
    blogServiceMock.delete.mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Draft Post')).toBeInTheDocument();
    });

    const allButtons = screen.getAllByRole('button');
    const trashButton = allButtons.find(
      (btn) => btn.querySelector('svg[data-lucide="trash-2"]') || btn.querySelector('path[d*="M3"]')
    ) ?? allButtons[allButtons.length - 1];
    fireEvent.click(trashButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /^Delete$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(blogServiceMock.delete).toHaveBeenCalledWith('post_draft');
    });

    await waitFor(() => {
      expect(screen.queryByText('Draft Post')).not.toBeInTheDocument();
    });
  });

  it('delete failure: shows error toast when blogService.delete rejects', async () => {
    const { toast } = await import('sonner');
    blogServiceMock.listAll.mockResolvedValue([mockDraft]);
    blogServiceMock.delete.mockRejectedValue(new Error('DB error'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Draft Post')).toBeInTheDocument();
    });

    const allButtons = screen.getAllByRole('button');
    const trashButton = allButtons.find(
      (btn) => btn.querySelector('svg[data-lucide="trash-2"]') || btn.querySelector('path[d*="M3"]')
    ) ?? allButtons[allButtons.length - 1];
    fireEvent.click(trashButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /^Delete$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete post');
    });

    expect(screen.getByText('Draft Post')).toBeInTheDocument();
  });
});
