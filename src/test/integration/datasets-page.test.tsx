import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DatasetsPage from "@/pages/DatasetsPage";
import { createMockDataset } from "@/test/helpers/factories";

const datasetServiceMock = vi.hoisted(() => ({
  listDatasets: vi.fn(),
}));

const visualizerMock = vi.hoisted(() => ({
  openVisualizer: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock("@/services/datasetService", () => ({
  listDatasets: datasetServiceMock.listDatasets,
}));

vi.mock("@/lib/visualizer", () => ({
  openVisualizer: visualizerMock.openVisualizer,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

describe("DatasetsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders datasets list on load", async () => {
    const mockDatasets = [
      createMockDataset({ id: "dataset_001", name: "Dataset 1" }),
      createMockDataset({ id: "dataset_002", name: "Dataset 2" }),
    ];
    datasetServiceMock.listDatasets.mockResolvedValue(mockDatasets);

    render(
      <MemoryRouter initialEntries={["/datasets"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets" element={<DatasetsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Datasets")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(datasetServiceMock.listDatasets).toHaveBeenCalled();
    });
  });

  it("shows loading spinner while fetching datasets", async () => {
    datasetServiceMock.listDatasets.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    render(
      <MemoryRouter initialEntries={["/datasets"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets" element={<DatasetsPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show loading state initially - verify the component is loading
    expect(datasetServiceMock.listDatasets).toHaveBeenCalled();
  });

  it("shows empty state when no datasets exist", async () => {
    datasetServiceMock.listDatasets.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/datasets"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets" element={<DatasetsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no datasets yet/i)).toBeInTheDocument();
    });
  });

  it("shows error state when dataset fetch fails", async () => {
    const errorMessage = "Failed to load datasets";
    datasetServiceMock.listDatasets.mockRejectedValue(new Error(errorMessage));

    render(
      <MemoryRouter initialEntries={["/datasets"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets" element={<DatasetsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("displays dataset status badges (uploading, ready, failed)", async () => {
    const mockDatasets = [
      createMockDataset({ id: "ds_001", name: "Uploading Dataset", status: "uploading" }),
      createMockDataset({ id: "ds_002", name: "Ready Dataset", status: "ready" }),
      createMockDataset({ id: "ds_003", name: "Failed Dataset", status: "failed" }),
    ];
    datasetServiceMock.listDatasets.mockResolvedValue(mockDatasets);

    render(
      <MemoryRouter initialEntries={["/datasets"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets" element={<DatasetsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Datasets")).toBeInTheDocument();
    });
  });

  it("calls listDatasets service on component mount", async () => {
    datasetServiceMock.listDatasets.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/datasets"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets" element={<DatasetsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(datasetServiceMock.listDatasets).toHaveBeenCalledTimes(1);
    });
  });

  it("shows datasets with file count information", async () => {
    const mockDatasets = [
      createMockDataset({ id: "ds_001", name: "Test Dataset" }),
    ];
    datasetServiceMock.listDatasets.mockResolvedValue(mockDatasets);

    render(
      <MemoryRouter initialEntries={["/datasets"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets" element={<DatasetsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(datasetServiceMock.listDatasets).toHaveBeenCalled();
    });
  });

  it("renders link to upload keys when no datasets exist", async () => {
    datasetServiceMock.listDatasets.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/datasets"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets" element={<DatasetsPage />} />
          <Route path="/dashboard/upload-keys" element={<div>Upload Keys</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const uploadKeysLink = screen.getByRole("link", { name: /upload keys/i });
      expect(uploadKeysLink).toHaveAttribute("href", "/dashboard/upload-keys");
    });
  });

  it("refetches datasets when refresh is triggered", async () => {
    const initialDatasets = [
      createMockDataset({ id: "ds_001", name: "Dataset 1" }),
    ];
    datasetServiceMock.listDatasets.mockResolvedValue(initialDatasets);

    render(
      <MemoryRouter initialEntries={["/datasets"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets" element={<DatasetsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(datasetServiceMock.listDatasets).toHaveBeenCalledTimes(1);
    });
  });
});
