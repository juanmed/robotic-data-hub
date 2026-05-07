import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BlogPostPreview } from '@/pages/blog/BlogPostPreview';

const blogServiceMock = vi.hoisted(() => ({ getById: vi.fn() }));

vi.mock('@/services/blogService', () => ({ blogService: blogServiceMock }));
vi.mock('@/components/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}));

describe('BlogPostPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads post by id and renders draft badge/content', async () => {
    blogServiceMock.getById.mockResolvedValue({
      id: 'post_1',
      author_id: 'usr_1',
      title: 'Draft Post',
      slug: 'draft-post',
      excerpt: 'x',
      body_md: 'preview body',
      status: 'draft',
      published_at: null,
      created_at: '2026-05-07T00:00:00.000Z',
      updated_at: '2026-05-07T00:00:00.000Z',
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/blog/post_1/preview']}>
        <Routes>
          <Route path="/dashboard/blog/:id/preview" element={<BlogPostPreview />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Draft Post')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('preview body')).toBeInTheDocument();
  });
});
