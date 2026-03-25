import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useSessionData } from '@/hooks/useSessionData';
import { sessionService } from '@/services/sessionService';

// Mock the sessionService
vi.mock('@/services/sessionService', () => ({
  sessionService: {
    get: vi.fn(),
    getStreams: vi.fn(),
  },
}));

describe('useSessionData hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should map ses_001 to lerobot/pusht dataset', () => {
    const { result } = renderHook(() => useSessionData('ses_001'));

    expect(result.current.datasetId).toBe('lerobot/pusht');
    expect(result.current.episode).toBe(0);
  });

  it('should map ses_002 to aloha_mobile_cabinet dataset', () => {
    const { result } = renderHook(() => useSessionData('ses_002'));

    expect(result.current.datasetId).toBe('lerobot/aloha_mobile_cabinet');
    expect(result.current.episode).toBe(0);
  });

  it('should map ses_004 to pusht episode 3', () => {
    const { result } = renderHook(() => useSessionData('ses_004'));

    expect(result.current.datasetId).toBe('lerobot/pusht');
    expect(result.current.episode).toBe(3);
  });

  it('should handle missing session ID with default values', () => {
    const { result } = renderHook(() => useSessionData(undefined));

    expect(result.current.datasetId).toBe('lerobot/pusht');
    expect(result.current.episode).toBe(0);
    expect(result.current.session).toBe(null);
    expect(result.current.streams).toEqual([]);
  });

  it('should fetch session and streams when session ID is provided', async () => {
    const mockSession = {
      id: 'ses_001',
      user_id: 'usr_001',
      name: 'Test Session',
      status: 'completed' as const,
      stream_count: 2,
      total_size_bytes: 1000000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockStreams = [
      {
        id: 'str_001',
        session_id: 'ses_001',
        name: 'Video Stream',
        type: 'video' as const,
        format: 'mp4',
        file_count: 5,
      },
    ];

    (sessionService.get as any).mockResolvedValue(mockSession);
    (sessionService.getStreams as any).mockResolvedValue(mockStreams);

    const { result } = renderHook(() => useSessionData('ses_001'));
    await act(async () => {
      await Promise.resolve();
    });

    // Wait for data to load
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.streams).toEqual(mockStreams);
  });

  it('should handle missing session gracefully', async () => {
    (sessionService.get as any).mockResolvedValue(null);
    (sessionService.getStreams as any).mockResolvedValue([]);

    const { result } = renderHook(() => useSessionData('nonexistent'));
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.session).toBe(null);
    expect(result.current.streams).toEqual([]);
  });
});
