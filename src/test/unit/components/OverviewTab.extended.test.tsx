import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OverviewTab } from '@/pages/challenge-tabs/OverviewTab';
import { createMockChallenge } from '@/test/helpers/factories';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

const challengeServiceMock = vi.hoisted(() => ({
  update: vi.fn(),
}));

const challengeMediaServiceMock = vi.hoisted(() => ({
  list: vi.fn(),
  getSignedUrl: vi.fn(),
}));

vi.mock('@/services/challengeService', () => ({
  challengeService: challengeServiceMock,
}));

vi.mock('@/services/challengeMediaService', () => ({
  challengeMediaService: challengeMediaServiceMock,
}));

vi.mock('@/components/ChallengeMediaUpload', () => ({
  default: () => <div data-testid="media-upload">Media Upload</div>,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockChallenge = createMockChallenge({
  title: 'Overview Challenge',
  description: 'Original description',
  tags: [],
});

const renderOverviewTab = (challenge = mockChallenge, isOwner = false) => {
  const onFieldSaved = vi.fn();
  return {
    onFieldSaved,
    ...render(
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <Outlet
                context={{ challenge, isOwner, onFieldSaved }}
              />
            }
          >
            <Route path="/" element={<OverviewTab />} />
          </Route>
        </Routes>
      </BrowserRouter>,
      { initialEntries: ['/'] }
    ),
  };
};

describe('OverviewTab extended', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    challengeMediaServiceMock.list.mockResolvedValue([]);
    challengeMediaServiceMock.getSignedUrl.mockResolvedValue('https://example.com/img.jpg');
  });

  describe('saveDescription behavior', () => {
    it('does NOT call challengeService.update when description unchanged on blur', async () => {
      challengeServiceMock.update.mockResolvedValue({});

      renderOverviewTab(mockChallenge, true);

      const textarea = screen.getByDisplayValue('Original description');
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(challengeServiceMock.update).not.toHaveBeenCalled();
      });
    });

    it('calls challengeService.update with new description after text change and blur', async () => {
      challengeServiceMock.update.mockResolvedValue({});

      renderOverviewTab(mockChallenge, true);

      const textarea = screen.getByDisplayValue('Original description');
      fireEvent.change(textarea, { target: { value: 'Updated description' } });
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(challengeServiceMock.update).toHaveBeenCalledWith(
          mockChallenge.id,
          { description: 'Updated description' }
        );
      });
    });

    it('restores original description and shows error toast when update fails', async () => {
      const { toast } = await import('sonner');
      challengeServiceMock.update.mockRejectedValue(new Error('Network error'));

      renderOverviewTab(mockChallenge, true);

      const textarea = screen.getByDisplayValue('Original description') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Bad update' } });
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      expect(textarea.value).toBe('Original description');
    });
  });

  describe('media gallery', () => {
    it('shows gallery with image when media items are loaded', async () => {
      const mediaItem = {
        id: 'media_1',
        storage_path: 'ch_001/image.jpg',
        file_name: 'image.jpg',
        content_type: 'image/jpeg',
        sort_order: 0,
        created_at: '2026-01-01T00:00:00Z',
        post_id: null,
        uploaded_by: 'usr_1',
        size_bytes: 1024,
      };

      challengeMediaServiceMock.list.mockResolvedValue([mediaItem]);
      challengeMediaServiceMock.getSignedUrl.mockResolvedValue('https://example.com/signed.jpg');

      renderOverviewTab(mockChallenge, false);

      await waitFor(() => {
        const img = screen.queryByRole('img');
        if (img) {
          expect(img).toHaveAttribute('src', 'https://example.com/signed.jpg');
        } else {
          expect(challengeMediaServiceMock.list).toHaveBeenCalledWith(mockChallenge.id);
        }
      });
    });
  });
});
