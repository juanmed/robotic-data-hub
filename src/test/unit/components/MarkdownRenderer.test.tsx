import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

const blogMediaServiceMock = vi.hoisted(() => ({
  getSignedUrl: vi.fn(),
}));

vi.mock('@/services/blogMediaService', () => ({
  blogMediaService: blogMediaServiceMock,
}));

describe('MarkdownRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('replaces blog-media storage links with signed URLs', async () => {
    blogMediaServiceMock.getSignedUrl
      .mockResolvedValueOnce('https://cdn.example.com/a.png')
      .mockResolvedValueOnce('https://cdn.example.com/b.jpg');

    render(
      <MarkdownRenderer
        content={'![a](blog-media:storage_path:path/a.png)\n![b](blog-media:storage_path:path/b.jpg)'}
      />
    );

    await waitFor(() => {
      const imgs = screen.getAllByRole('img');
      expect(imgs[0]).toHaveAttribute('src', 'https://cdn.example.com/a.png');
      expect(imgs[1]).toHaveAttribute('src', 'https://cdn.example.com/b.jpg');
    });
  });

  it('continues rendering when one signed-url lookup fails', async () => {
    blogMediaServiceMock.getSignedUrl
      .mockResolvedValueOnce('https://cdn.example.com/a.png')
      .mockRejectedValueOnce(new Error('boom'));

    render(
      <MarkdownRenderer
        content={'[ok](blog-media:storage_path:path/a.png) and ![fail](blog-media:storage_path:path/b.jpg)'}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'ok' })).toHaveAttribute('href', 'https://cdn.example.com/a.png');
      const failedImg = screen.getByRole('img', { name: 'fail' });
      expect(failedImg).toBeInTheDocument();
      expect(failedImg.getAttribute('src')).toBe('');
    });
  });
});
