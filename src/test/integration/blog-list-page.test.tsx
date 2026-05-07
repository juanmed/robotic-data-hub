import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BlogListPage } from '@/pages/blog/BlogListPage';

const blogServiceMock = vi.hoisted(() => ({ list: vi.fn() }));

vi.mock('@/services/blogService', () => ({ blogService: blogServiceMock }));

describe('BlogListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and renders published posts', async () => {
    blogServiceMock.list.mockResolvedValue([
      {
        id: 'post_1',
        author_id: 'usr_1',
        title: 'Post One',
        slug: 'post-one',
        excerpt: 'First excerpt',
        body_md: 'Body',
        status: 'published',
        published_at: '2026-05-07T00:00:00.000Z',
        created_at: '2026-05-07T00:00:00.000Z',
        updated_at: '2026-05-07T00:00:00.000Z',
      },
    ]);

    render(
      <MemoryRouter initialEntries={['/blog']}>
        <Routes>
          <Route path="/blog" element={<BlogListPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Post One')).toBeInTheDocument();
    expect(screen.getByText('First excerpt')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /read more/i })).toHaveAttribute('href', '/blog/post-one');
  });
});
