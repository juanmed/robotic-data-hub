import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/pages/DashboardPage";
import { createMockChallenge } from "@/test/helpers/factories";

const datasetServiceMock = vi.hoisted(() => ({
  listDatasets: vi.fn(),
}));

const challengeServiceMock = vi.hoisted(() => ({
  listEnriched: vi.fn(),
  listMine: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  publish: vi.fn(),
  setStatus: vi.fn(),
  deleteDraft: vi.fn(),
}));

vi.mock("@/services/datasetService", () => ({
  listDatasets: datasetServiceMock.listDatasets,
}));

vi.mock("@/services/challengeService", () => ({
  challengeService: challengeServiceMock,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: "usr_001", name: "Test User", email: "test@test.com" },
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    refreshUser: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/challenges/new" element={<div>Create Challenge</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("DashboardPage - Challenges Section", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    datasetServiceMock.listDatasets.mockResolvedValue([]);
    challengeServiceMock.listMine.mockResolvedValue([]);
  });

  it("shows challenge count in stats", async () => {
    const challenges = [
      createMockChallenge({ id: "ch_001" }),
      createMockChallenge({ id: "ch_002" }),
    ];
    challengeServiceMock.listMine.mockResolvedValue(challenges);

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Challenges").length).toBeGreaterThan(0);
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("renders Create Challenge button", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("create-challenge-btn")).toBeInTheDocument();
    });
  });

  it("lists user's challenges", async () => {
    const challenges = [
      createMockChallenge({ id: "ch_001", title: "Kitchen Task" }),
    ];
    challengeServiceMock.listMine.mockResolvedValue(challenges);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Kitchen Task")).toBeInTheDocument();
    });
  });

  it("shows empty state when no challenges", async () => {
    challengeServiceMock.listMine.mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no challenges yet/i)).toBeInTheDocument();
    });
  });
});
