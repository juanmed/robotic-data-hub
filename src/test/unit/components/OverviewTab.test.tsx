import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverviewTab } from '@/pages/challenge-tabs/OverviewTab';
import { createMockChallenge } from '@/test/helpers/factories';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

vi.mock('@/services/challengeService', () => ({
  challengeService: {
    update: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/services/challengeMediaService', () => ({
  challengeMediaService: {
    list: vi.fn().mockResolvedValue([]),
    getSignedUrl: vi.fn().mockResolvedValue('https://example.com/media'),
  },
}));

vi.mock('@/components/ChallengeMediaUpload', () => ({
  default: () => <div data-testid="media-upload">Media Upload</div>,
}));

describe('OverviewTab', () => {
  const mockChallenge = createMockChallenge({
    title: 'Test Challenge',
    description: 'This is a test description',
    tags: ['test', 'sample'],
  });

  const mockOnFieldSaved = vi.fn();

  const renderWithContext = (challenge = mockChallenge, isOwner = false) => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <Outlet
                context={{
                  challenge,
                  isOwner,
                  onFieldSaved: mockOnFieldSaved,
                }}
              />
            }
          >
            <Route path="/" element={<OverviewTab />} />
          </Route>
        </Routes>
      </BrowserRouter>,
      { initialEntries: ['/'] }
    );
  };

  it('renders description in read-only mode for non-owner', () => {
    renderWithContext(mockChallenge, false);
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('renders description editor for owner', () => {
    renderWithContext(mockChallenge, true);
    expect(screen.getByDisplayValue('This is a test description')).toBeInTheDocument();
  });

  it('renders tags when present', () => {
    renderWithContext(mockChallenge, false);
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('sample')).toBeInTheDocument();
  });

  it('shows media upload section only for owner', () => {
    const { rerender } = render(
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <Outlet
                context={{
                  challenge: mockChallenge,
                  isOwner: false,
                  onFieldSaved: mockOnFieldSaved,
                }}
              />
            }
          >
            <Route path="/" element={<OverviewTab />} />
          </Route>
        </Routes>
      </BrowserRouter>,
      { initialEntries: ['/'] }
    );

    expect(screen.queryByTestId('media-upload')).not.toBeInTheDocument();

    rerender(
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <Outlet
                context={{
                  challenge: mockChallenge,
                  isOwner: true,
                  onFieldSaved: mockOnFieldSaved,
                }}
              />
            }
          >
            <Route path="/" element={<OverviewTab />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByTestId('media-upload')).toBeInTheDocument();
  });

  it('displays description placeholder text when empty', () => {
    const emptyChallenge = createMockChallenge({ description: '' });
    renderWithContext(emptyChallenge, false);
    expect(screen.getByText('No content provided.')).toBeInTheDocument();
  });
});
