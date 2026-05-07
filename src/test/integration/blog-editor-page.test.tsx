import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BlogEditorPage } from '@/pages/blog/BlogEditorPage';

const navigateMock = vi.hoisted(() => vi.fn());

const blogServiceMock = vi.hoisted(() => ({
  create: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  publish: vi.fn(),
  unpublish: vi.fn(),
}));

const useAuthMock = vi.hoisted(() => ({ useAuth: vi.fn() }));
const useIsBloggerMock = vi.hoisted(() => ({ useIsBlogger: vi.fn() }));
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@/services/blogService', () => ({ blogService: blogServiceMock }));
vi.mock('@/services/blogMediaService', () => ({ blogMediaService: { upload: vi.fn() } }));
vi.mock('@/hooks/useAuth', () => useAuthMock);
vi.mock('@/hooks/useIsBlogger', () => useIsBloggerMock);
vi.mock('sonner', () => ({ toast: toastMock }));

describe('BlogEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.useAuth.mockReturnValue({ user: { id: 'usr_1' } });
    useIsBloggerMock.useIsBlogger.mockReturnValue({ isBlogger: true, isLoading: false });

    blogServiceMock.create.mockResolvedValue({
      id: 'post_1',
      author_id: 'usr_1',
      title: 'Untitled Post',
      slug: 'untitled-post-123',
      excerpt: '',
      body_md: '',
      status: 'draft',
      published_at: null,
      created_at: '2026-05-07T00:00:00.000Z',
      updated_at: '2026-05-07T00:00:00.000Z',
    });

    blogServiceMock.publish.mockResolvedValue({
      id: 'post_1',
      author_id: 'usr_1',
      title: 'My Title',
      slug: 'custom-slug',
      excerpt: '',
      body_md: '',
      status: 'published',
      published_at: '2026-05-07T00:00:00.000Z',
      created_at: '2026-05-07T00:00:00.000Z',
      updated_at: '2026-05-07T00:00:00.000Z',
    });
  });

  it('create mode bootstrap + slug rules + publish redirect', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/blog/new']}>
        <Routes>
          <Route path="/dashboard/blog/new" element={<BlogEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('Untitled Post')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/post title/i);
    const slugInput = screen.getByPlaceholderText(/url-friendly-slug/i) as HTMLInputElement;

    fireEvent.change(titleInput, { target: { value: 'My Title' } });
    expect(slugInput.value).toBe('my-title');

    fireEvent.change(slugInput, { target: { value: 'custom-slug' } });
    fireEvent.change(titleInput, { target: { value: 'Another Title' } });
    expect(slugInput.value).toBe('custom-slug');

    fireEvent.click(screen.getByRole('button', { name: /publish/i }));

    await waitFor(() => {
      expect(blogServiceMock.publish).toHaveBeenCalledWith('post_1');
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard/blog/post_1/preview');
    }, { timeout: 3000 });
  });
});
