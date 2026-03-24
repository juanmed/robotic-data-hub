import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDatasetEpisodes } from '@/hooks/useDatasetEpisodes';

describe('useDatasetEpisodes hook', () => {
  afterEach(() => {
    // Cleanup
  });

  it('should load default pusht episodes', async () => {
    const { result } = renderHook(() => useDatasetEpisodes('lerobot/pusht'));

    expect(result.current.loading).toBe(true);

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.episodes.length).toBe(6);
    expect(result.current.episodes[0].label).toBe('Episode 0');
    expect(result.current.totalEpisodes).toBe(6);
  });

  it('should load aloha_mobile_cabinet episodes', async () => {
    const { result } = renderHook(() => useDatasetEpisodes('lerobot/aloha_mobile_cabinet'));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.episodes.length).toBe(3);
    expect(result.current.totalEpisodes).toBe(3);
  });

  it('should fallback to pusht for unknown dataset', async () => {
    const { result } = renderHook(() => useDatasetEpisodes('unknown/dataset'));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Should fallback to pusht
    expect(result.current.episodes.length).toBe(6);
  });

  it('should have correct frame and duration data', async () => {
    const { result } = renderHook(() => useDatasetEpisodes('lerobot/pusht'));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    const episode0 = result.current.episodes[0];
    expect(episode0.numFrames).toBe(300);
    expect(episode0.duration).toBe('10.0s');
  });
});
