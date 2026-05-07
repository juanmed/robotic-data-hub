import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { SubmissionsTab } from '@/pages/challenge-tabs/SubmissionsTab';
import { createMockChallenge } from '@/test/helpers/factories';

const submissionServiceMock = vi.hoisted(() => ({
  listForChallengeEnriched: vi.fn(),
  listForChallenge: vi.fn(),
  updateStatus: vi.fn(),
}));

const datasetServiceMock = vi.hoisted(() => ({
  getDatasetFileUrls: vi.fn(),
}));

const visualizerMock = vi.hoisted(() => ({
  openVisualizer: vi.fn(),
}));

const useAuthMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/services/challengeSubmissionService', () => ({
  challengeSubmissionService: submissionServiceMock,
}));

vi.mock('@/services/datasetService', () => ({
  getDatasetFileUrls: datasetServiceMock.getDatasetFileUrls,
}));

vi.mock('@/lib/visualizer', () => ({
  openVisualizer: visualizerMock.openVisualizer,
}));

vi.mock('@/hooks/useAuth', () => useAuthMock);
vi.mock('sonner', () => ({ toast: toastMock }));

const challenge = createMockChallenge({
  id: 'ch_001',
  compensation_amount: 1234,
  compensation_per: 'dataset',
  currency: 'USD',
});

const baseRows = [
  {
    id: 'sub_pending',
    challenge_id: 'ch_001',
    dataset_id: 'ds_pending',
    submitter_id: 'usr_1',
    message: 'pending row',
    status: 'pending',
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
    dataset_display_name: 'Pending Dataset',
    submitter_name: 'Alice',
  },
  {
    id: 'sub_accepted',
    challenge_id: 'ch_001',
    dataset_id: 'ds_accepted',
    submitter_id: 'usr_2',
    message: 'accepted row',
    status: 'accepted',
    created_at: '2026-05-02T00:00:00.000Z',
    updated_at: '2026-05-02T00:00:00.000Z',
    dataset_display_name: 'Accepted Dataset',
    submitter_name: 'Bob',
  },
] as any[];

function renderWithContext(isOwner: boolean) {
  return render(
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <Outlet
              context={{
                challenge,
                isOwner,
                onFieldSaved: vi.fn(),
              }}
            />
          }
        >
          <Route path="/" element={<SubmissionsTab />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

describe('SubmissionsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.useAuth.mockReturnValue({ isAuthenticated: true });
    submissionServiceMock.listForChallengeEnriched.mockResolvedValue(baseRows);
    submissionServiceMock.listForChallenge.mockResolvedValue(baseRows);
    submissionServiceMock.updateStatus.mockResolvedValue(undefined);
    datasetServiceMock.getDatasetFileUrls.mockResolvedValue([]);
    visualizerMock.openVisualizer.mockResolvedValue(undefined);
  });

  it('falls back from enriched fetch to plain fetch and filters accepted for non-owner', async () => {
    submissionServiceMock.listForChallengeEnriched.mockRejectedValueOnce(new Error('forbidden'));
    submissionServiceMock.listForChallenge.mockResolvedValueOnce(baseRows);

    renderWithContext(false);

    expect(await screen.findByText('accepted row')).toBeInTheDocument();
    expect(screen.queryByText('pending row')).not.toBeInTheDocument();
    expect(submissionServiceMock.listForChallenge).toHaveBeenCalledWith('ch_001');
  });

  it('shows empty state when enriched and plain fetch both fail', async () => {
    submissionServiceMock.listForChallengeEnriched.mockRejectedValueOnce(new Error('forbidden'));
    submissionServiceMock.listForChallenge.mockRejectedValueOnce(new Error('still forbidden'));

    renderWithContext(false);

    expect(await screen.findByText('No submissions yet.')).toBeInTheDocument();
  });

  it('owner accept/reject updates local status in-place', async () => {
    renderWithContext(true);

    expect(await screen.findByText('Pending Dataset')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /accept/i }));
    await waitFor(() => {
      expect(submissionServiceMock.updateStatus).toHaveBeenCalledWith('sub_pending', 'accepted');
      expect(screen.getAllByText('accepted').length).toBeGreaterThan(0);
    });

    submissionServiceMock.listForChallengeEnriched.mockResolvedValueOnce(baseRows);
    renderWithContext(true);
    expect(await screen.findByText('Pending Dataset')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reject/i }));
    await waitFor(() => {
      expect(submissionServiceMock.updateStatus).toHaveBeenCalledWith('sub_pending', 'rejected');
      expect(screen.getAllByText('rejected').length).toBeGreaterThan(0);
    });
  });

  it('accepted submission access files dialog handles filtered links + empty', async () => {
    datasetServiceMock.getDatasetFileUrls.mockResolvedValueOnce([
      { relative_path: 'a.txt', signed_url: 'https://example.com/a.txt', content_type: 'text/plain' },
      { relative_path: 'b.txt', signed_url: null, content_type: 'text/plain' },
    ]);

    renderWithContext(true);

    expect(await screen.findByText('Accepted Dataset')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /access files/i }));

    await waitFor(() => {
      expect(screen.getByText('a.txt')).toBeInTheDocument();
      expect(screen.queryByText('b.txt')).not.toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/a.txt');
    });

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    datasetServiceMock.getDatasetFileUrls.mockResolvedValueOnce([
      { relative_path: 'x.txt', signed_url: null, content_type: 'text/plain' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: /access files/i }));

    expect(await screen.findByText('No downloadable files available.')).toBeInTheDocument();
  });

  it('visualize failure shows toast error', async () => {
    visualizerMock.openVisualizer.mockRejectedValueOnce(new Error('cannot open'));
    renderWithContext(true);

    expect(await screen.findByText('Pending Dataset')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /visualize/i })[0]);

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith('cannot open');
    });
  });
});
