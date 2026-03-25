import { describe, it, expect, beforeEach, vi } from 'vitest';
import { openVisualizer } from '@/lib/visualizer';
import * as visualizerModule from '@/lib/visualizer';

// Since encodeManifest is private, we'll test it indirectly through openVisualizer
// or by accessing it via the module if needed

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('visualizer - openVisualizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window.open as any).mockClear();
  });

  it('should invoke edge function with correct dataset_id', async () => {
    const mockSupabase = supabase as any;
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { files: [], metadata: {} },
      error: null,
    });

    await openVisualizer('ds_test_123');

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      'get-dataset-manifest',
      expect.objectContaining({
        body: expect.objectContaining({ dataset_id: 'ds_test_123' }),
      })
    );
  });

  it('should open visualizer URL with encoded manifest', async () => {
    const mockSupabase = supabase as any;
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { files: [], metadata: {} },
      error: null,
    });

    await openVisualizer('ds_test_123');

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://viz.gamiphy.ai/?manifest='),
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('should encode manifest in URL-safe base64', async () => {
    const mockSupabase = supabase as any;
    const testManifest = { files: [{ name: 'test.txt', size: 1024 }], metadata: { created: '2026-03-25' } };
    mockSupabase.functions.invoke.mockResolvedValue({
      data: testManifest,
      error: null,
    });

    await openVisualizer('ds_test_123');

    const callArgs = (window.open as any).mock.calls[0][0] as string;
    const manifestParam = callArgs.split('manifest=')[1];

    // Check that it's URL-safe (no +, /, or =)
    expect(manifestParam).not.toContain('+');
    expect(manifestParam).not.toContain('/');
    expect(manifestParam).not.toMatch(/=+$/);
  });

  it('should throw error when edge function fails', async () => {
    const mockSupabase = supabase as any;
    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Network error occurred' },
    });

    await expect(openVisualizer('ds_test_123')).rejects.toThrow(
      'Network error occurred'
    );
  });

  it('should throw with default message if error has no message', async () => {
    const mockSupabase = supabase as any;
    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: {},
    });

    await expect(openVisualizer('ds_test_123')).rejects.toThrow(
      'Failed to fetch dataset manifest'
    );
  });

  it('should handle unicode in manifest data', async () => {
    const mockSupabase = supabase as any;
    const testManifest = { text: '🚀 test 中文', description: 'Émojis and spëcial chars' };
    mockSupabase.functions.invoke.mockResolvedValue({
      data: testManifest,
      error: null,
    });

    await openVisualizer('ds_test_123');

    // Should complete without error
    expect(window.open).toHaveBeenCalled();
  });

  it('should handle empty manifest', async () => {
    const mockSupabase = supabase as any;
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {},
      error: null,
    });

    await openVisualizer('ds_test_123');

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://viz.gamiphy.ai/?manifest='),
      '_blank',
      'noopener,noreferrer'
    );
  });
});
