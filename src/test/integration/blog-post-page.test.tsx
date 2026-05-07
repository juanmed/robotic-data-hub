import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BlogPostPage } from '@/pages/blog/BlogPostPage';

const blogServiceMock = vi.hoisted(() => ({ getBySlug: vi.fn() }));
const useAuthMock = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock('@/services/blogService', () => ({ blogService: blogServiceMock }));
vi.mock('@/hooks/useAuth', () => useAuthMock);
vi.mock('@/components/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}));

describe('BlogPostPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.useAuth.mockReturnValue({ user: { id: 'usr_1' } });
  });

  it('loads post by slug and shows edit for author', async () => {
    blogServiceMock.getBySlug.mockResolvedValue({
      id: 'post_1',
      author_id: 'usr_1',
      title: 'Published Post',
      slug: 'published-post',
      excerpt: 'x',
      body_md: '# hello body',
      status: 'published',
      published_at: '2026-05-07T00:00:00.000Z',
      created_at: '2026-05-07T00:00:00.000Z',
      updated_at: '2026-05-07T00:00:00.000Z',
    });

    render(
      <MemoryRouter initialEntries={['/blog/published-post']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Published Post')).toBeInTheDocument();
    expect(screen.getByText('# hello body')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /edit/i })).toHaveAttribute('href', '/dashboard/blog/post_1/edit');
  });
});
