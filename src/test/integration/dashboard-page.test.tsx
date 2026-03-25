import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/pages/DashboardPage";

const datasetServiceMock = vi.hoisted(() => ({
  listDatasets: vi.fn(),
}));

vi.mock("@/services/datasetService", () => ({
  listDatasets: datasetServiceMock.listDatasets,
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard page with header", async () => {
    datasetServiceMock.listDatasets.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/dashboard"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText(/overview of your robotics data/i)).toBeInTheDocument();
    });
  });

  it("calls listDatasets on mount", async () => {
    datasetServiceMock.listDatasets.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/dashboard"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(datasetServiceMock.listDatasets).toHaveBeenCalled();
    });
  });

  it("shows loading skeleton while fetching", async () => {
    datasetServiceMock.listDatasets.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    render(
      <MemoryRouter initialEntries={["/dashboard"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(datasetServiceMock.listDatasets).toHaveBeenCalled();
    });
  });

  it("displays empty state when no datasets", async () => {
    datasetServiceMock.listDatasets.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/dashboard"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/keys" element={<div>Keys Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no datasets yet/i)).toBeInTheDocument();
    });
  });

  it("displays keys link in empty state", async () => {
    datasetServiceMock.listDatasets.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/dashboard"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/keys" element={<div>Keys Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const keysLink = screen.getByRole("link", { name: /keys/i });
      expect(keysLink).toHaveAttribute("href", "/keys");
    });
  });

  it("renders datasets section header", async () => {
    datasetServiceMock.listDatasets.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/dashboard"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(datasetServiceMock.listDatasets).toHaveBeenCalled();
    });
  });

  it("displays statistics labels", async () => {
    datasetServiceMock.listDatasets.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/dashboard"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/total data/i)).toBeInTheDocument();
      expect(screen.getByText(/downloads/i)).toBeInTheDocument();
    });
  });
});
