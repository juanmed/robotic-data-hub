import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DatasetDetailPage from "@/pages/DatasetDetailPage";

const datasetServiceMock = vi.hoisted(() => ({
  getDataset: vi.fn(),
  getDatasetFiles: vi.fn(),
  getDatasetFileUrls: vi.fn(),
}));
const visualizerMock = vi.hoisted(() => ({
  openVisualizer: vi.fn(),
}));

vi.mock("@/services/datasetService", () => datasetServiceMock);
vi.mock("@/lib/visualizer", () => visualizerMock);
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

describe("dataset detail flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    datasetServiceMock.getDataset.mockResolvedValue({
      id: "ds_1",
      user_id: "usr_1",
      display_name: "Ready Dataset",
      source_repo_id: "repo_1",
      status: "ready",
      metadata: null,
      created_at: "2026-03-25T00:00:00Z",
      confirmed_at: "2026-03-26T00:00:00Z",
    });
    datasetServiceMock.getDatasetFiles.mockResolvedValue([
      {
        id: "df_1",
        dataset_id: "ds_1",
        relative_path: "videos/front.mp4",
        storage_path: "storage/videos/front.mp4",
        content_type: "video/mp4",
        size_bytes: 1024,
        upload_status: "uploaded",
        created_at: "2026-03-25T00:00:00Z",
      },
    ]);
    datasetServiceMock.getDatasetFileUrls.mockResolvedValue([
      {
        relative_path: "videos/front.mp4",
        signed_url: "https://example.com/front.mp4",
        content_type: "video/mp4",
      },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads dataset details and launches the visualizer", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/datasets/ds_1"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard/datasets/:id" element={<DatasetDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Ready Dataset")).toBeInTheDocument();
    expect(screen.getByText("videos/front.mp4")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /visualize dataset/i })[0]);

    await waitFor(() => expect(visualizerMock.openVisualizer).toHaveBeenCalledWith("ds_1"));
  });
});
