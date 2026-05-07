import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: supabaseMock }));

import { blogService } from '@/services/blogService';

describe('blogService extended', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listAll', () => {
    it('returns all posts ordered by created_at desc', async () => {
      const posts = [
        { id: 'p1', title: 'A', status: 'published', created_at: '2026-02-01T00:00:00Z' },
        { id: 'p2', title: 'B', status: 'draft', created_at: '2026-01-01T00:00:00Z' },
      ];
      const order = vi.fn().mockResolvedValue({ data: posts, error: null });
      const select = vi.fn(() => ({ order }));
      supabaseMock.from.mockReturnValue({ select });

      const result = await blogService.listAll();

      expect(result).toHaveLength(2);
      expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('adds eq call when status filter provided', async () => {
      const eq = vi.fn().mockResolvedValue({ data: [], error: null });
      const order = vi.fn(() => ({ eq }));
      const select = vi.fn(() => ({ order }));
      supabaseMock.from.mockReturnValue({ select });

      await blogService.listAll({ status: 'draft' });

      expect(eq).toHaveBeenCalledWith('status', 'draft');
    });
  });

  describe('list', () => {
    it('calls eq with published status by default', async () => {
      const posts = [{ id: 'p1', title: 'Pub', status: 'published' }];
      // list() does: query = select().order(), query = query.eq(...) then await query
      // The eq result must be thenable (a Promise-like)
      const eqResult = Promise.resolve({ data: posts, error: null }) as any;
      const eq = vi.fn(() => eqResult);
      // order result must have .eq but also be awaitable as fallback
      const orderResult: any = { eq };
      const order = vi.fn(() => orderResult);
      const select = vi.fn(() => ({ order }));
      supabaseMock.from.mockReturnValue({ select });

      const result = await blogService.list();

      expect(eq).toHaveBeenCalledWith('status', 'published');
      expect(result).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('calls from.delete.eq with the post id', async () => {
      const eq = vi.fn().mockResolvedValue({ error: null });
      const del = vi.fn(() => ({ eq }));
      supabaseMock.from.mockReturnValue({ delete: del });

      await blogService.delete('post_999');

      expect(del).toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith('id', 'post_999');
    });

    it('throws when supabase returns an error', async () => {
      const eq = vi.fn().mockResolvedValue({ error: { message: 'Permission denied' } });
      const del = vi.fn(() => ({ eq }));
      supabaseMock.from.mockReturnValue({ delete: del });

      await expect(blogService.delete('post_999')).rejects.toMatchObject({ message: 'Permission denied' });
    });
  });

  describe('getById', () => {
    it('returns null when PGRST116 not-found error', async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });
      const eq = vi.fn(() => ({ single }));
      const select = vi.fn(() => ({ eq }));
      supabaseMock.from.mockReturnValue({ select });

      const result = await blogService.getById('nonexistent');

      expect(result).toBeNull();
    });

    it('throws when error code is not PGRST116', async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'Permission denied' },
      });
      const eq = vi.fn(() => ({ single }));
      const select = vi.fn(() => ({ eq }));
      supabaseMock.from.mockReturnValue({ select });

      await expect(blogService.getById('post_1')).rejects.toMatchObject({ code: '42501' });
    });
  });

  describe('unpublish', () => {
    it('calls update with status: draft', async () => {
      const updateSpy = vi.spyOn(blogService, 'update').mockResolvedValue({
        id: 'post_1',
        author_id: 'usr_1',
        title: 'T',
        slug: 's',
        excerpt: '',
        body_md: '',
        status: 'draft',
        published_at: undefined,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      });

      await blogService.unpublish('post_1');

      expect(updateSpy).toHaveBeenCalledWith('post_1', { status: 'draft' });
      updateSpy.mockRestore();
    });
  });
});
