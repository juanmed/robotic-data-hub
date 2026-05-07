import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIsBlogger } from '@/hooks/useIsBlogger';

const useAuthMock = vi.hoisted(() => ({ useAuth: vi.fn() }));
const supabaseMock = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock('@/hooks/useAuth', () => useAuthMock);
vi.mock('@/integrations/supabase/client', () => ({ supabase: supabaseMock }));

describe('useIsBlogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false/false when no authenticated user', async () => {
    useAuthMock.useAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useIsBlogger());

    await waitFor(() => {
      expect(result.current).toEqual({ isBlogger: false, isLoading: false });
    });
  });

  it('returns blogger=true when role row exists', async () => {
    useAuthMock.useAuth.mockReturnValue({ user: { id: 'usr_1' } });

    const single = vi.fn().mockResolvedValue({ data: { role: 'blogger' }, error: null });
    const eqRole = vi.fn(() => ({ single }));
    const eqUser = vi.fn(() => ({ eq: eqRole }));
    const select = vi.fn(() => ({ eq: eqUser }));
    supabaseMock.from.mockReturnValue({ select });

    const { result } = renderHook(() => useIsBlogger());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isBlogger).toBe(true);
    });
  });

  it('returns blogger=false when role row is missing (PGRST116)', async () => {
    useAuthMock.useAuth.mockReturnValue({ user: { id: 'usr_1' } });

    const single = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    const eqRole = vi.fn(() => ({ single }));
    const eqUser = vi.fn(() => ({ eq: eqRole }));
    const select = vi.fn(() => ({ eq: eqUser }));
    supabaseMock.from.mockReturnValue({ select });

    const { result } = renderHook(() => useIsBlogger());

    await waitFor(() => {
      expect(result.current).toEqual({ isBlogger: false, isLoading: false });
    });
  });

  it('returns blogger=false and ends loading when supabase throws', async () => {
    useAuthMock.useAuth.mockReturnValue({ user: { id: 'usr_1' } });

    const single = vi.fn().mockRejectedValue(new Error('db down'));
    const eqRole = vi.fn(() => ({ single }));
    const eqUser = vi.fn(() => ({ eq: eqRole }));
    const select = vi.fn(() => ({ eq: eqUser }));
    supabaseMock.from.mockReturnValue({ select });

    const { result } = renderHook(() => useIsBlogger());

    await waitFor(() => {
      expect(result.current).toEqual({ isBlogger: false, isLoading: false });
    });
  });
});
