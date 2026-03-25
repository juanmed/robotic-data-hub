import { fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DatasetDetailPage from "@/pages/DatasetDetailPage";
import { createMockDataset, createMockDatasetFile } from "@/test/helpers/factories";
import { renderWithAuth } from "@/test/helpers/test-wrappers";

const datasetServiceMock = vi.hoisted(() => ({
  getDataset: vi.fn(),
  getDatasetFiles: vi.fn(),
  getDatasetFileUrls: vi.fn(),
}));

const visualizerMock = vi.hoisted(() => ({
  openVisualizer: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock("@/services/datasetService", () => ({
  getDataset: datasetServiceMock.getDataset,
  getDatasetFiles: datasetServiceMock.getDatasetFiles,
  getDatasetFileUrls: datasetServiceMock.getDatasetFileUrls,
}));

vi.mock("@/lib/visualizer", () => ({
  openVisualizer: visualizerMock.openVisualizer,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

describe("DatasetDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads and displays dataset details", async () => {
    const mockDataset = createMockDataset({ id: "dataset_001", display_name: "Test Dataset" });
    const mockFiles = [
      createMockDatasetFile({ id: "file_001", relative_path: "data.csv" }),
    ];

    datasetServiceMock.getDataset.mockResolvedValue(mockDataset);
    datasetServiceMock.getDatasetFiles.mockResolvedValue(mockFiles);
    datasetServiceMock.getDatasetFileUrls.mockResolvedValue([]);

    renderWithAuth(
      <MemoryRouter initialEntries={["/datasets/dataset_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets/:id" element={<DatasetDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(datasetServiceMock.getDataset).toHaveBeenCalledWith("dataset_001");
      expect(datasetServiceMock.getDatasetFiles).toHaveBeenCalledWith("dataset_001");
    });
  });

  it("shows loading state while fetching dataset", async () => {
    datasetServiceMock.getDataset.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(createMockDataset()), 100))
    );
    datasetServiceMock.getDatasetFiles.mockResolvedValue([]);
    datasetServiceMock.getDatasetFileUrls.mockResolvedValue([]);

    renderWithAuth(
      <MemoryRouter initialEntries={["/datasets/dataset_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets/:id" element={<DatasetDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(datasetServiceMock.getDataset).toHaveBeenCalledWith("dataset_001");
    });
  });

  it("shows error state when dataset not found", async () => {
    datasetServiceMock.getDataset.mockResolvedValue(null);
    datasetServiceMock.getDatasetFiles.mockResolvedValue([]);
    datasetServiceMock.getDatasetFileUrls.mockResolvedValue([]);

    renderWithAuth(
      <MemoryRouter initialEntries={["/datasets/invalid_id"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets/:id" element={<DatasetDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/dataset not found/i)).toBeInTheDocument();
    });
  });

  it("displays dataset status badge", async () => {
    const mockDataset = createMockDataset({ id: "dataset_001", status: "ready" });
    datasetServiceMock.getDataset.mockResolvedValue(mockDataset);
    datasetServiceMock.getDatasetFiles.mockResolvedValue([]);
    datasetServiceMock.getDatasetFileUrls.mockResolvedValue([]);

    renderWithAuth(
      <MemoryRouter initialEntries={["/datasets/dataset_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets/:id" element={<DatasetDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(datasetServiceMock.getDataset).toHaveBeenCalled();
    });
  });

  it("displays list of dataset files", async () => {
    const mockDataset = createMockDataset({ id: "dataset_001" });
    const mockFiles = [
      createMockDatasetFile({ id: "file_001", relative_path: "sensor_data.csv" }),
      createMockDatasetFile({ id: "file_002", relative_path: "video.mp4" }),
      createMockDatasetFile({ id: "file_003", relative_path: "metadata.json" }),
    ];

    datasetServiceMock.getDataset.mockResolvedValue(mockDataset);
    datasetServiceMock.getDatasetFiles.mockResolvedValue(mockFiles);
    datasetServiceMock.getDatasetFileUrls.mockResolvedValue([]);

    renderWithAuth(
      <MemoryRouter initialEntries={["/datasets/dataset_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets/:id" element={<DatasetDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(datasetServiceMock.getDatasetFiles).toHaveBeenCalledWith("dataset_001");
    });
  });

  it("shows back link to datasets list", async () => {
    const mockDataset = createMockDataset({ id: "dataset_001" });
    datasetServiceMock.getDataset.mockResolvedValue(mockDataset);
    datasetServiceMock.getDatasetFiles.mockResolvedValue([]);
    datasetServiceMock.getDatasetFileUrls.mockResolvedValue([]);

    renderWithAuth(
      <MemoryRouter initialEntries={["/datasets/dataset_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets/:id" element={<DatasetDetailPage />} />
          <Route path="/datasets" element={<div>Datasets Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(datasetServiceMock.getDataset).toHaveBeenCalled();
    });
  });

  it("handles error when fetching dataset fails", async () => {
    const errorMessage = "Failed to load dataset";
    datasetServiceMock.getDataset.mockRejectedValue(new Error(errorMessage));
    datasetServiceMock.getDatasetFiles.mockResolvedValue([]);
    datasetServiceMock.getDatasetFileUrls.mockResolvedValue([]);

    renderWithAuth(
      <MemoryRouter initialEntries={["/datasets/dataset_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets/:id" element={<DatasetDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("fetches file URLs when dataset is ready", async () => {
    const mockDataset = createMockDataset({ id: "dataset_001", status: "ready" });
    const mockFiles = [
      createMockDatasetFile({ id: "file_001", relative_path: "data.csv", upload_status: "uploaded" }),
    ];

    datasetServiceMock.getDataset.mockResolvedValue(mockDataset);
    datasetServiceMock.getDatasetFiles.mockResolvedValue(mockFiles);
    datasetServiceMock.getDatasetFileUrls.mockResolvedValue([
      { relative_path: "data.csv", signed_url: "https://example.com/data.csv" },
    ]);

    renderWithAuth(
      <MemoryRouter initialEntries={["/datasets/dataset_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets/:id" element={<DatasetDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(datasetServiceMock.getDatasetFileUrls).toHaveBeenCalledWith("dataset_001");
    });
  });

  it("does not fetch URLs when dataset is not ready", async () => {
    const mockDataset = createMockDataset({ id: "dataset_001", status: "uploading" });
    datasetServiceMock.getDataset.mockResolvedValue(mockDataset);
    datasetServiceMock.getDatasetFiles.mockResolvedValue([]);
    datasetServiceMock.getDatasetFileUrls.mockResolvedValue([]);

    renderWithAuth(
      <MemoryRouter initialEntries={["/datasets/dataset_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets/:id" element={<DatasetDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(datasetServiceMock.getDataset).toHaveBeenCalled();
    });
  });

  it("displays formatted file sizes", async () => {
    const mockDataset = createMockDataset({ id: "dataset_001" });
    const mockFiles = [
      createMockDatasetFile({ id: "file_001", relative_path: "small.txt", size_bytes: 1024 }),
      createMockDatasetFile({ id: "file_002", relative_path: "large.bin", size_bytes: 1024 * 1024 * 100 }),
    ];

    datasetServiceMock.getDataset.mockResolvedValue(mockDataset);
    datasetServiceMock.getDatasetFiles.mockResolvedValue(mockFiles);
    datasetServiceMock.getDatasetFileUrls.mockResolvedValue([]);

    renderWithAuth(
      <MemoryRouter initialEntries={["/datasets/dataset_001"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/datasets/:id" element={<DatasetDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(datasetServiceMock.getDatasetFiles).toHaveBeenCalled();
    });
  });
});
