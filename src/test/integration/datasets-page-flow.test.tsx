import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DatasetsPage from "@/pages/DatasetsPage";

const datasetServiceMock = vi.hoisted(() => ({
  listDatasets: vi.fn(),
}));
const visualizerMock = vi.hoisted(() => ({
  openVisualizer: vi.fn(),
}));

vi.mock("@/services/datasetService", () => datasetServiceMock);
vi.mock("@/lib/visualizer", () => visualizerMock);
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

describe("datasets page flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    datasetServiceMock.listDatasets.mockResolvedValue([
      {
        id: "ds_1",
        user_id: "usr_1",
        display_name: "Warehouse Dataset",
        source_repo_id: "repo_1",
        status: "ready",
        metadata: null,
        created_at: "2026-03-25T00:00:00Z",
        confirmed_at: "2026-03-26T00:00:00Z",
        file_count: 3,
        total_size_bytes: 1000,
        file_paths: ["videos/front.mp4"],
      },
      {
        id: "ds_2",
        user_id: "usr_1",
        display_name: "Uploading Dataset",
        source_repo_id: null,
        status: "uploading",
        metadata: null,
        created_at: "2026-03-24T00:00:00Z",
        confirmed_at: null,
        file_count: 1,
        total_size_bytes: 100,
        file_paths: [],
      },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders datasets and opens the visualizer for ready items", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DatasetsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Warehouse Dataset")).toBeInTheDocument();
    expect(screen.getByText("Uploading Dataset")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /visualize/i })[0]);

    await waitFor(() => expect(visualizerMock.openVisualizer).toHaveBeenCalledWith("ds_1"));
  });
});
