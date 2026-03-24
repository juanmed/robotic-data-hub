import { vi } from 'vitest';

/**
 * Mock Supabase client for testing
 * Supports query chaining: from(...).select(...).order(...).eq(...)
 */

const createChainableQuery = (mockData: any[]) => ({
  order: vi.fn(function() {
    return this;
  }),
  eq: vi.fn(function() {
    return this;
  }),
  gt: vi.fn(function() {
    return this;
  }),
  lt: vi.fn(function() {
    return this;
  }),
  limit: vi.fn(function() {
    return this;
  }),
  single: vi.fn().mockResolvedValue({
    data: mockData[0],
    error: null,
  }),
  maybeSingle: vi.fn().mockResolvedValue({
    data: mockData[0],
    error: null,
  }),
  then: vi.fn(function(callback) {
    return Promise.resolve(callback({
      data: mockData,
      error: null,
    }));
  }),
});

export const createMockSupabaseClient = () => {
  const mockData = new Map<string, any[]>();

  return {
    from: vi.fn((table: string) => ({
      select: vi.fn(function() {
        return createChainableQuery(mockData.get(table) || []);
      }),
      insert: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
      update: vi.fn(function() {
        return {
          eq: vi.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
          then: vi.fn(function(callback) {
            return Promise.resolve(callback({
              data: {},
              error: null,
            }));
          }),
        };
      }),
      delete: vi.fn(function() {
        return {
          eq: vi.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
          then: vi.fn(function(callback) {
            return Promise.resolve(callback({
              data: {},
              error: null,
            }));
          }),
        };
      }),
    })),
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: null,
        },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: null,
        },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null,
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
    },
    storage: {
      from: vi.fn((bucket: string) => ({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        download: vi.fn().mockResolvedValue({
          data: new Blob(),
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: {
            publicUrl: 'https://example.com/file.txt',
          },
        }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: {
            signedUrl: 'https://example.com/signed-file.txt',
          },
          error: null,
        }),
      })),
    },
  };
};

export const mockSupabaseError = (message: string) => ({
  code: 'ERROR',
  message,
  details: '',
  hint: '',
  status: 500,
});
