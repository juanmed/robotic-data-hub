import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import ChallengeLayout from '@/pages/ChallengeLayout';
import { createMockChallenge } from '@/test/helpers/factories';

const challengeServiceMock = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
  setStatus: vi.fn(),
}));

const useAuthMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock('@/services/challengeService', () => ({
  challengeService: challengeServiceMock,
}));

vi.mock('@/hooks/useAuth', () => useAuthMock);

vi.mock('sonner', () => ({ toast: toastMock }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: supabaseMock,
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ id, checked, onCheckedChange }: any) => (
    <input
      aria-label={id}
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}));

const baseChallenge = createMockChallenge({
  id: 'ch_001',
  user_id: 'usr_owner',
  title: 'Layout Test Challenge',
  status: 'active',
  enabled_tabs: ['rules'],
  submission_count: 2,
  created_at: '2026-05-01T00:00:00.000Z',
  updated_at: '2026-05-01T00:00:00.000Z',
});

const renderLayout = (path = '/dashboard/challenges/ch_001/overview') => {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dashboard/challenges/:id" element={<ChallengeLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<div>Overview Content</div>} />
          <Route path="submissions" element={<div>Submissions Content</div>} />
          <Route path="rules" element={<div>Rules Content</div>} />
          <Route path="discussion" element={<div>Discussion Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('ChallengeLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.useAuth.mockReturnValue({ user: { id: 'usr_owner' } });
    challengeServiceMock.get.mockResolvedValue(baseChallenge);
    challengeServiceMock.update.mockResolvedValue(baseChallenge);
    challengeServiceMock.setStatus.mockImplementation(async (_id: string, status: string) => ({
      ...baseChallenge,
      status,
    }));
    supabaseMock.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { name: 'Creator Name' } }),
        }),
      }),
    });
  });

  it('loads challenge + creator profile and renders enabled optional tabs', async () => {
    renderLayout();

    expect(await screen.findByText('Layout Test Challenge')).toBeInTheDocument();
    expect(screen.getByText('Creator Name')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Rules' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Discussion' })).not.toBeInTheDocument();
  });

  it('rolls back tab toggle when update fails', async () => {
    challengeServiceMock.update.mockRejectedValueOnce(new Error('nope'));
    renderLayout();

    expect(await screen.findByText('Layout Test Challenge')).toBeInTheDocument();
    const rulesToggle = screen.getByRole('checkbox', { name: 'rules' }) as HTMLInputElement;
    expect(rulesToggle.checked).toBe(true);

    fireEvent.click(rulesToggle);

    await waitFor(() => {
      expect(challengeServiceMock.update).toHaveBeenCalledWith('ch_001', { enabled_tabs: [] });
      expect(toastMock.error).toHaveBeenCalledWith('Failed to update tab settings');
      expect(rulesToggle.checked).toBe(true);
    });
  });

  it('navigates away when active optional tab is unchecked', async () => {
    renderLayout('/dashboard/challenges/ch_001/rules');

    expect(await screen.findByText('Rules Content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'rules' }));

    await waitFor(() => {
      expect(screen.getByText('Overview Content')).toBeInTheDocument();
    });
  });

  it('shows draft banner only for owner on draft challenge', async () => {
    challengeServiceMock.get.mockResolvedValue({ ...baseChallenge, status: 'draft' });
    useAuthMock.useAuth.mockReturnValue({ user: { id: 'usr_owner' } });
    const { rerender } = renderLayout();

    expect(await screen.findByText(/This challenge is in draft/i)).toBeInTheDocument();

    useAuthMock.useAuth.mockReturnValue({ user: { id: 'usr_other' } });
    rerender(
      <MemoryRouter initialEntries={['/dashboard/challenges/ch_001/overview']}>
        <Routes>
          <Route path="/dashboard/challenges/:id" element={<ChallengeLayout />}>
            <Route path="overview" element={<div>Overview Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/This challenge is in draft/i)).not.toBeInTheDocument();
    });
  });

  it('owner status actions call setStatus and update UI state', async () => {
    renderLayout();

    expect(await screen.findByText('Layout Test Challenge')).toBeInTheDocument();
    expect(screen.getByTestId('challenge-status-badge')).toHaveTextContent('Active');

    fireEvent.click(screen.getByRole('button', { name: /deactivate/i }));
    await waitFor(() => {
      expect(challengeServiceMock.setStatus).toHaveBeenCalledWith('ch_001', 'inactive');
      expect(screen.getByTestId('challenge-status-badge')).toHaveTextContent('Inactive');
    });

    fireEvent.click(screen.getByRole('button', { name: /reactivate/i }));
    await waitFor(() => {
      expect(challengeServiceMock.setStatus).toHaveBeenCalledWith('ch_001', 'active');
      expect(screen.getByTestId('challenge-status-badge')).toHaveTextContent('Active');
    });

    fireEvent.click(screen.getByRole('button', { name: /close permanently/i }));
    fireEvent.click(await screen.findByRole('button', { name: /close challenge/i }));

    await waitFor(() => {
      expect(challengeServiceMock.setStatus).toHaveBeenCalledWith('ch_001', 'closed');
      expect(screen.getByTestId('challenge-status-badge')).toHaveTextContent('Closed');
      expect(screen.getByText(/no longer accepting submissions/i)).toBeInTheDocument();
    });
  });
});
