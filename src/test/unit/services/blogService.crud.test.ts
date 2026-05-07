import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: supabaseMock }));

import { blogService } from '@/services/blogService';

function mockInsertSingle(result: any) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  supabaseMock.from.mockReturnValue({ insert });
  return { insert, select, single };
}

function mockUpdateEqEqSelectSingle(result: any) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn(() => ({ single }));
  const eq2 = vi.fn(() => ({ select }));
  const eq1 = vi.fn(() => ({ eq: eq2, select }));
  const update = vi.fn(() => ({ eq: eq1 }));
  supabaseMock.from.mockReturnValue({ update });
  return { update, eq1, eq2, select, single };
}

function mockSelectEqSingle(result: any) {
  const single = vi.fn().mockResolvedValue(result);
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  supabaseMock.from.mockReturnValue({ select });
  return { select, eq, single };
}

describe('blogService CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create uses authenticated user when author_id missing and auto-generates excerpt', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: 'usr_1' } } });
    const created = {
      id: 'post_1',
      author_id: 'usr_1',
      title: 'Hello',
      slug: 'hello',
      excerpt: 'Generated',
      body_md: '# Heading\n**bold**',
      status: 'draft',
      published_at: null,
      created_at: '2026-05-07T00:00:00.000Z',
      updated_at: '2026-05-07T00:00:00.000Z',
    };
    const chain = mockInsertSingle({ data: created, error: null });

    await blogService.create({
      title: 'Hello',
      slug: 'hello',
      excerpt: '',
      body_md: '# Heading\n**bold**',
    });

    expect(supabaseMock.auth.getUser).toHaveBeenCalled();
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        author_id: 'usr_1',
        excerpt: 'Heading bold',
      })
    );
  });

  it('create throws when unauthenticated and author_id missing', async () => {
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } });

    await expect(
      blogService.create({
        title: 'Hello',
        slug: 'hello',
        excerpt: '',
        body_md: 'body',
      })
    ).rejects.toThrow('Must be authenticated to create a post');
  });

  it('update with expectedUpdatedAt handles concurrency mismatch', async () => {
    const chain = mockUpdateEqEqSelectSingle({
      data: null,
      error: { code: 'PGRST116', message: 'No rows' },
    });

    await expect(
      blogService.update('post_1', {
        title: 'New',
        expectedUpdatedAt: '2026-05-07T00:00:00.000Z',
      })
    ).rejects.toThrow('Post was modified by another user. Please reload and try again.');

    expect(chain.eq1).toHaveBeenCalledWith('id', 'post_1');
    expect(chain.eq2).toHaveBeenCalledWith('updated_at', '2026-05-07T00:00:00.000Z');
  });

  it('publish validates required title/slug and calls update status published', async () => {
    mockSelectEqSingle({
      data: {
        id: 'post_1',
        title: '',
        slug: '',
      },
      error: null,
    });

    await expect(blogService.publish('post_1')).rejects.toThrow('Title and slug are required to publish');

    mockSelectEqSingle({
      data: {
        id: 'post_1',
        title: 'Hello',
        slug: 'hello',
      },
      error: null,
    });

    const updateSpy = vi.spyOn(blogService, 'update').mockResolvedValue({
      id: 'post_1',
      author_id: 'usr_1',
      title: 'Hello',
      slug: 'hello',
      excerpt: 'x',
      body_md: 'y',
      status: 'published',
      published_at: '2026-05-07T00:00:00.000Z',
      created_at: '2026-05-07T00:00:00.000Z',
      updated_at: '2026-05-07T00:00:00.000Z',
    });

    await blogService.publish('post_1');

    expect(updateSpy).toHaveBeenCalledWith('post_1', { status: 'published' });
    updateSpy.mockRestore();
  });
});
