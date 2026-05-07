import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => ({
  storage: {
    from: vi.fn(),
  },
  from: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: supabaseMock }));

import { createMediaService } from '@/services/media/mediaServiceBase';

const testConfig = {
  bucketName: 'test-bucket',
  tableName: 'test_media',
  entityIdColumn: 'entity_id',
};

const mockFile = new File(['data'], 'doc.png', { type: 'image/png' });
Object.defineProperty(mockFile, 'size', { value: 512 });

describe('mediaServiceBase (createMediaService)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upload', () => {
    it('builds storagePath as entityId/uuid-filename and uploads to correct bucket', async () => {
      const storageBucket = {
        upload: vi.fn().mockResolvedValue({ error: null }),
      };
      supabaseMock.storage.from.mockReturnValue(storageBucket);

      const record = { id: 'm1', entity_id: 'ent_1', storage_path: 'ent_1/uuid-doc.png' };
      const single = vi.fn().mockResolvedValue({ data: record, error: null });
      const select = vi.fn(() => ({ single }));
      const insert = vi.fn(() => ({ select }));
      supabaseMock.from.mockReturnValue({ insert });

      const service = createMediaService(testConfig);
      const result = await service.upload('ent_1', 'usr_1', mockFile);

      expect(supabaseMock.storage.from).toHaveBeenCalledWith('test-bucket');
      const uploadCallArgs = storageBucket.upload.mock.calls[0];
      expect(uploadCallArgs[0]).toMatch(/^ent_1\//);
      expect(result).toBeDefined();
    });

    it('inserts record using correct table name and entity id column', async () => {
      const storageBucket = { upload: vi.fn().mockResolvedValue({ error: null }) };
      supabaseMock.storage.from.mockReturnValue(storageBucket);

      const record = { id: 'm1' };
      const single = vi.fn().mockResolvedValue({ data: record, error: null });
      const select = vi.fn(() => ({ single }));
      const insert = vi.fn(() => ({ select }));
      supabaseMock.from.mockReturnValue({ insert });

      const service = createMediaService(testConfig);
      await service.upload('ent_1', 'usr_1', mockFile);

      expect(supabaseMock.from).toHaveBeenCalledWith('test_media');
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_id: 'ent_1',
          uploaded_by: 'usr_1',
        })
      );
    });
  });

  describe('list', () => {
    it('queries correct table and entity id column', async () => {
      const order = vi.fn().mockResolvedValue({ data: [], error: null });
      const eq = vi.fn(() => ({ order }));
      const select = vi.fn(() => ({ eq }));
      supabaseMock.from.mockReturnValue({ select });

      const service = createMediaService(testConfig);
      await service.list('ent_1');

      expect(supabaseMock.from).toHaveBeenCalledWith('test_media');
      expect(eq).toHaveBeenCalledWith('entity_id', 'ent_1');
      expect(order).toHaveBeenCalledWith('sort_order', { ascending: true });
    });
  });

  describe('delete', () => {
    it('calls storage.remove then table delete in order', async () => {
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

      const service = createMediaService(testConfig);
      await service.delete('media_1', 'ent_1/doc.png');

      expect(callOrder).toEqual(['storage.remove', 'db.delete']);
      expect(storageBucket.remove).toHaveBeenCalledWith(['ent_1/doc.png']);
      expect(eq).toHaveBeenCalledWith('id', 'media_1');
    });
  });

  describe('reorder', () => {
    it('updates each item sort_order individually', async () => {
      const updateCalls: any[] = [];
      const eq = vi.fn().mockImplementation((_, val) => {
        updateCalls.push(val);
        return Promise.resolve({ error: null });
      });
      const update = vi.fn(() => ({ eq }));
      supabaseMock.from.mockReturnValue({ update });

      const service = createMediaService(testConfig);
      await service.reorder([
        { id: 'item_a', sort_order: 0 },
        { id: 'item_b', sort_order: 1 },
      ]);

      expect(update).toHaveBeenCalledTimes(2);
      expect(update).toHaveBeenNthCalledWith(1, { sort_order: 0 });
      expect(update).toHaveBeenNthCalledWith(2, { sort_order: 1 });
      expect(updateCalls).toEqual(['item_a', 'item_b']);
    });
  });
});
