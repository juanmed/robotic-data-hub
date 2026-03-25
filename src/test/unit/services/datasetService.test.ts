import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { listDatasets, getDataset, getDatasetFiles, getDatasetFileUrls } from "@/services/datasetService";

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
  functions: {
    invoke: vi.fn(),
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

function createSelectQuery(data: any[], singleData: any = data[0] ?? null) {
  const query: any = {};
  query.order = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.then = (resolve: any) => Promise.resolve(resolve({ data, error: null }));
  query.maybeSingle = vi.fn(async () => ({ data: singleData, error: null }));
  return query;
}

describe("datasetService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates dataset file counts, sizes, and paths", async () => {
    const datasets = [
      {
        id: "ds_1",
        user_id: "usr_1",
        display_name: "Dataset 1",
        source_repo_id: null,
        status: "ready",
        metadata: null,
        created_at: "2026-03-01T00:00:00Z",
        confirmed_at: "2026-03-02T00:00:00Z",
        dataset_files: [
          { id: "df_1", size_bytes: 100, relative_path: "a.txt" },
          { id: "df_2", size_bytes: 250, relative_path: "b.txt" },
        ],
      },
      {
        id: "ds_2",
        user_id: "usr_2",
        display_name: "Dataset 2",
        source_repo_id: "repo_2",
        status: "uploading",
        metadata: {},
        created_at: "2026-03-03T00:00:00Z",
        confirmed_at: null,
        dataset_files: null,
      },
    ];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "datasets") {
        return { select: vi.fn(() => createSelectQuery(datasets)) };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await listDatasets();

    expect(result).toEqual([
      expect.objectContaining({
        id: "ds_1",
        file_count: 2,
        total_size_bytes: 350,
        file_paths: ["a.txt", "b.txt"],
      }),
      expect.objectContaining({
        id: "ds_2",
        file_count: 0,
        total_size_bytes: 0,
        file_paths: [],
      }),
    ]);
  });

  it("returns a mapped dataset or null", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table !== "datasets") throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: {
                id: "ds_1",
                user_id: "usr_1",
                display_name: "Dataset 1",
                source_repo_id: "repo_1",
                status: "ready",
                metadata: { source: "cli" },
                created_at: "2026-03-01T00:00:00Z",
                confirmed_at: "2026-03-02T00:00:00Z",
              },
              error: null,
            })),
          })),
        })),
      };
    });

    await expect(getDataset("ds_1")).resolves.toEqual(
      expect.objectContaining({
        id: "ds_1",
        display_name: "Dataset 1",
        status: "ready",
      })
    );

    mockSupabase.from.mockImplementation((table: string) => {
      if (table !== "datasets") throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      };
    });

    await expect(getDataset("missing")).resolves.toBeNull();
  });

  it("maps dataset file rows", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table !== "dataset_files") throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn(() => createSelectQuery([
          {
            id: "df_1",
            dataset_id: "ds_1",
            relative_path: "frames/0001.png",
            storage_path: "storage/frames/0001.png",
            content_type: "image/png",
            size_bytes: 4096,
            upload_status: "uploaded",
            created_at: "2026-03-01T00:00:00Z",
          },
        ])),
      };
    });

    await expect(getDatasetFiles("ds_1")).resolves.toEqual([
      expect.objectContaining({
        id: "df_1",
        relative_path: "frames/0001.png",
        upload_status: "uploaded",
      }),
    ]);
  });

  it("returns signed urls or throws when the edge function fails", async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        urls: [
          {
            relative_path: "meta/info.json",
            signed_url: "https://example.com/meta.json",
            content_type: "application/json",
          },
        ],
      },
      error: null,
    });

    await expect(getDatasetFileUrls("ds_1", ["meta/info.json"])).resolves.toEqual([
      expect.objectContaining({
        relative_path: "meta/info.json",
        signed_url: "https://example.com/meta.json",
      }),
    ]);

    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: "Edge function failed" },
    });

    await expect(getDatasetFileUrls("ds_1")).rejects.toThrow("Edge function failed");
  });
});
