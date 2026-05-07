import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => ({
  storage: {
    from: vi.fn(),
  },
  from: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: supabaseMock }));

import { blogMediaService } from '@/services/blogMediaService';

const mockFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
Object.defineProperty(mockFile, 'size', { value: 1024 });

describe('blogMediaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upload', () => {
    it('calls storage.upload then inserts DB row and returns record', async () => {
      const uploadResult = { error: null };
      const storageBucket = {
        upload: vi.fn().mockResolvedValue(uploadResult),
        remove: vi.fn(),
      };
      supabaseMock.storage.from.mockReturnValue(storageBucket);

      const insertedRecord = {
        id: 'media_1',
        post_id: 'post_1',
        uploaded_by: 'usr_1',
        storage_path: 'post_1/uuid-photo.jpg',
        file_name: 'photo.jpg',
        content_type: 'image/jpeg',
        size_bytes: 1024,
        sort_order: 0,
        created_at: '2026-01-01T00:00:00Z',
      };
      const single = vi.fn().mockResolvedValue({ data: insertedRecord, error: null });
      const select = vi.fn(() => ({ single }));
      const insert = vi.fn(() => ({ select }));
      supabaseMock.from.mockReturnValue({ insert });

      const result = await blogMediaService.upload('post_1', 'usr_1', mockFile);

      expect(storageBucket.upload).toHaveBeenCalled();
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          post_id: 'post_1',
          uploaded_by: 'usr_1',
          file_name: 'photo.jpg',
          content_type: 'image/jpeg',
        })
      );
      expect(result.id).toBe('media_1');
    });

    it('rolls back storage file when DB insert fails', async () => {
      const storageBucket = {
        upload: vi.fn().mockResolvedValue({ error: null }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      };
      supabaseMock.storage.from.mockReturnValue(storageBucket);

      const single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB insert failed' },
      });
      const select = vi.fn(() => ({ single }));
      const insert = vi.fn(() => ({ select }));
      supabaseMock.from.mockReturnValue({ insert });

      await expect(blogMediaService.upload('post_1', 'usr_1', mockFile)).rejects.toThrow(
        'Failed to save media record'
      );

      expect(storageBucket.remove).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('returns media ordered by sort_order', async () => {
      const items = [
        { id: 'm1', sort_order: 0, storage_path: 'post_1/a.jpg' },
        { id: 'm2', sort_order: 1, storage_path: 'post_1/b.jpg' },
      ];
      const order = vi.fn().mockResolvedValue({ data: items, error: null });
      const eq = vi.fn(() => ({ order }));
      const select = vi.fn(() => ({ eq }));
      supabaseMock.from.mockReturnValue({ select });

      const result = await blogMediaService.list('post_1');

      expect(order).toHaveBeenCalledWith('sort_order', { ascending: true });
      expect(result).toHaveLength(2);
    });
  });

  describe('getSignedUrl', () => {
    it('returns signedUrl from storage', async () => {
      const storageBucket = {
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://signed.example.com/photo.jpg' },
          error: null,
        }),
      };
      supabaseMock.storage.from.mockReturnValue(storageBucket);

      const url = await blogMediaService.getSignedUrl('post_1/photo.jpg');

      expect(url).toBe('https://signed.example.com/photo.jpg');
      expect(storageBucket.createSignedUrl).toHaveBeenCalledWith('post_1/photo.jpg', 604800);
    });

    it('throws when storage returns error', async () => {
      const storageBucket = {
        createSignedUrl: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Bucket not found' },
        }),
      };
      supabaseMock.storage.from.mockReturnValue(storageBucket);

      await expect(blogMediaService.getSignedUrl('bad/path')).rejects.toMatchObject({
        message: 'Bucket not found',
      });
    });
  });

  describe('delete', () => {
    it('removes storage file then deletes DB record', async () => {
      const callOrder: string[] = [];
      const storageBucket = {
        remove: vi.fn().mockImplementation(() => {
          callOrder.push('storage.remove');
          return Promise.resolve({ error: null });
        }),
      };
      supabaseMock.storage.from.mockReturnValue(storageBucket);

      const eq = vi.fn().mockImplementation(() => {
        callOrder.push('db.delete');
        return Promise.resolve({ error: null });
      });
      const del = vi.fn(() => ({ eq }));
      supabaseMock.from.mockReturnValue({ delete: del });

      await blogMediaService.delete('media_1', 'post_1/photo.jpg');

      expect(callOrder).toEqual(['storage.remove', 'db.delete']);
      expect(storageBucket.remove).toHaveBeenCalledWith(['post_1/photo.jpg']);
      expect(eq).toHaveBeenCalledWith('id', 'media_1');
    });
  });
});
