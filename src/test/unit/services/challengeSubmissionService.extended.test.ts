import { describe, it, expect, beforeEach, vi } from 'vitest';
import { challengeSubmissionService } from '@/services/challengeSubmissionService';

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: supabaseMock.supabase,
}));

const mockRow = {
  id: 'sub_001',
  challenge_id: 'ch_001',
  dataset_id: 'ds_001',
  submitter_id: 'usr_002',
  message: 'test',
  status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('challengeSubmissionService extended', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listForChallengeEnriched', () => {
    it('returns enriched rows with dataset_display_name and submitter_name', async () => {
      vi.spyOn(challengeSubmissionService, 'listForChallenge').mockResolvedValue([mockRow as any]);

      supabaseMock.supabase.from
        .mockImplementationOnce(() => ({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: 'ds_001', display_name: 'Robotics Dataset' }],
              error: null,
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: 'usr_002', name: 'Jane Doe' }],
              error: null,
            }),
          }),
        }));

      const result = await challengeSubmissionService.listForChallengeEnriched('ch_001');

      expect(result).toHaveLength(1);
      expect(result[0].dataset_display_name).toBe('Robotics Dataset');
      expect(result[0].submitter_name).toBe('Jane Doe');
    });

    it('returns empty array and makes no supabase calls when no submissions exist', async () => {
      vi.spyOn(challengeSubmissionService, 'listForChallenge').mockResolvedValue([]);

      const result = await challengeSubmissionService.listForChallengeEnriched('ch_001');

      expect(result).toEqual([]);
      expect(supabaseMock.supabase.from).not.toHaveBeenCalled();
    });

    it('falls back to null names when profile/dataset not in batch results', async () => {
      vi.spyOn(challengeSubmissionService, 'listForChallenge').mockResolvedValue([mockRow as any]);

      supabaseMock.supabase.from
        .mockImplementationOnce(() => ({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }))
        .mockImplementationOnce(() => ({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }));

      const result = await challengeSubmissionService.listForChallengeEnriched('ch_001');

      expect(result[0].dataset_display_name).toBeNull();
      expect(result[0].submitter_name).toBeNull();
    });
  });

  describe('updateStatus error path', () => {
    it('throws when supabase returns error', async () => {
      supabaseMock.supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Permission denied' } }),
        }),
      });

      await expect(
        challengeSubmissionService.updateStatus('sub_001', 'accepted')
      ).rejects.toMatchObject({ message: 'Permission denied' });
    });
  });

  describe('withdraw error path', () => {
    it('throws when supabase returns error', async () => {
      supabaseMock.supabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Foreign key violation' } }),
        }),
      });

      await expect(
        challengeSubmissionService.withdraw('sub_001')
      ).rejects.toMatchObject({ message: 'Foreign key violation' });
    });
  });
});
