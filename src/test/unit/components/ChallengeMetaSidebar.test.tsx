import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import ChallengeMetaSidebar from '@/components/ChallengeMetaSidebar';
import { createMockChallenge } from '@/test/helpers/factories';

const challenge = createMockChallenge({
  id: 'ch_1',
  status: 'active',
  submission_count: 3,
  compensation_amount: 1000,
  compensation_per: 'dataset',
  currency: 'USD',
  deadline: null,
});

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: any) => <div>{children}</div>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
  AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

describe('ChallengeMetaSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn() },
      configurable: true,
    });
  });

  it('copy-link writes URL and shows temporary copied state', () => {
    render(
      <MemoryRouter>
        <ChallengeMetaSidebar
          challenge={challenge}
          isOwner={false}
          onToggleStatus={vi.fn()}
          onClose={vi.fn()}
          onNavigateEdit={vi.fn()}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
    expect(screen.getByRole('button', { name: /link copied/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
  });

  it('owner active challenge shows Deactivate and calls onToggleStatus(inactive)', () => {
    const onToggleStatus = vi.fn();

    render(
      <MemoryRouter>
        <ChallengeMetaSidebar
          challenge={{ ...challenge, status: 'active' }}
          isOwner={true}
          onToggleStatus={onToggleStatus}
          onClose={vi.fn()}
          onNavigateEdit={vi.fn()}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /deactivate/i }));
    expect(onToggleStatus).toHaveBeenCalledWith('inactive');
  });

  it('owner inactive challenge shows Reactivate and calls onToggleStatus(active)', () => {
    const onToggleStatus = vi.fn();

    render(
      <MemoryRouter>
        <ChallengeMetaSidebar
          challenge={{ ...challenge, status: 'inactive' }}
          isOwner={true}
          onToggleStatus={onToggleStatus}
          onClose={vi.fn()}
          onNavigateEdit={vi.fn()}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /reactivate/i }));
    expect(onToggleStatus).toHaveBeenCalledWith('active');
  });

  it('non-owner hides manage controls', () => {
    render(
      <MemoryRouter>
        <ChallengeMetaSidebar
          challenge={challenge}
          isOwner={false}
          onToggleStatus={vi.fn()}
          onClose={vi.fn()}
          onNavigateEdit={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText(/manage challenge/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /deactivate/i })).not.toBeInTheDocument();
  });
});
