import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { RulesTab } from '@/pages/challenge-tabs/RulesTab';
import { createMockChallenge } from '@/test/helpers/factories';

const challengeServiceMock = vi.hoisted(() => ({
  update: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/services/challengeService', () => ({
  challengeService: challengeServiceMock,
}));
vi.mock('sonner', () => ({ toast: toastMock }));

vi.mock('@/components/MarkdownEditor', () => ({
  MarkdownEditor: ({ value, onChange, onBlur, readOnly }: any) => (
    readOnly ? (
      <div>{value || 'No content provided.'}</div>
    ) : (
      <textarea
        aria-label="markdown-editor"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={() => onBlur?.()}
      />
    )
  ),
}));

const challenge = createMockChallenge({
  id: 'ch_001',
  constraints: 'Original constraints',
  conditions: 'Original conditions',
});

function renderWithContext(isOwner: boolean, overrides: any = {}) {
  const ch = { ...challenge, ...overrides };
  return render(
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <Outlet
              context={{
                challenge: ch,
                isOwner,
                onFieldSaved: vi.fn(),
              }}
            />
          }
        >
          <Route path="/" element={<RulesTab />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

describe('RulesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    challengeServiceMock.update.mockResolvedValue(challenge);
  });

  it('does not call update when constraints unchanged', async () => {
    renderWithContext(true);

    const editors = await screen.findAllByRole('textbox', { name: 'markdown-editor' });
    fireEvent.blur(editors[0]);

    await waitFor(() => {
      expect(challengeServiceMock.update).not.toHaveBeenCalled();
    });
  });

  it('on save failure restores local constraints/conditions and shows error', async () => {
    challengeServiceMock.update.mockRejectedValueOnce(new Error('save failed'));
    renderWithContext(true);

    const editors = await screen.findAllByRole('textbox', { name: 'markdown-editor' });
    fireEvent.change(editors[0], { target: { value: 'New constraints' } });
    fireEvent.blur(editors[0]);

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalled();
      expect((screen.getAllByRole('textbox', { name: 'markdown-editor' })[0] as HTMLTextAreaElement).value).toBe('Original constraints');
    });
  });

  it('non-owner with empty constraints and conditions sees no-rules state', async () => {
    renderWithContext(false, { constraints: '', conditions: '' });

    expect(await screen.findByText('No rules specified.')).toBeInTheDocument();
  });
});
