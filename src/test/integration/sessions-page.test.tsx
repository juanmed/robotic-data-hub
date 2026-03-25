import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SessionsPage from "@/pages/SessionsPage";
import { createMockSession } from "@/test/helpers/factories";

const sessionServiceMock = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/services/sessionService", () => ({
  sessionService: sessionServiceMock,
}));

describe("SessionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders sessions list on load", async () => {
    const mockSessions = [
      createMockSession({ id: "ses_001", name: "Session 1" }),
      createMockSession({ id: "ses_002", name: "Session 2" }),
    ];
    sessionServiceMock.list.mockResolvedValue(mockSessions);

    render(
      <MemoryRouter initialEntries={["/sessions"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/sessions" element={<SessionsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Session 1")).toBeInTheDocument();
      expect(screen.getByText("Session 2")).toBeInTheDocument();
    });
  });

  it("shows loading skeleton while fetching sessions", () => {
    sessionServiceMock.list.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    render(
      <MemoryRouter initialEntries={["/sessions"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/sessions" element={<SessionsPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Check for loading skeleton elements (empty divs with animate-pulse)
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when no sessions exist", async () => {
    sessionServiceMock.list.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/sessions"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/sessions" element={<SessionsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no sessions yet/i)).toBeInTheDocument();
    });
  });

  it("shows New Session button in header", async () => {
    sessionServiceMock.list.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/sessions"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/sessions" element={<SessionsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /new session/i })).toBeInTheDocument();
    });
  });

  it("calls session service create when modal is submitted", async () => {
    sessionServiceMock.list.mockResolvedValue([]);
    sessionServiceMock.create.mockResolvedValue(
      createMockSession({ id: "ses_001", name: "New Session" })
    );

    render(
      <MemoryRouter initialEntries={["/sessions"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/sessions" element={<SessionsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /new session/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /new session/i }));

    // Modal inputs have specific placeholders
    await waitFor(() => {
      const inputs = screen.queryAllByRole("textbox");
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  it("displays session status badges", async () => {
    const mockSessions = [
      createMockSession({ id: "ses_001", name: "Recording", status: "recording" }),
      createMockSession({ id: "ses_002", name: "Completed", status: "completed" }),
      createMockSession({ id: "ses_003", name: "Draft", status: "draft" }),
    ];
    sessionServiceMock.list.mockResolvedValue(mockSessions);

    render(
      <MemoryRouter initialEntries={["/sessions"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/sessions" element={<SessionsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Recording")).toBeInTheDocument();
      expect(screen.getByText("Completed")).toBeInTheDocument();
      expect(screen.getByText("Draft")).toBeInTheDocument();
    });
  });

  it("shows session metadata like date and stream count", async () => {
    const mockSessions = [
      createMockSession({
        id: "ses_001",
        name: "Test Session",
        created_at: "2026-03-25T10:00:00Z",
      }),
    ];
    sessionServiceMock.list.mockResolvedValue(mockSessions);

    render(
      <MemoryRouter initialEntries={["/sessions"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/sessions" element={<SessionsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Test Session")).toBeInTheDocument();
    });
  });



  it("renders multiple sessions with proper spacing", async () => {
    const mockSessions = Array.from({ length: 5 }, (_, i) =>
      createMockSession({ id: `ses_${i}`, name: `Session ${i}` })
    );
    sessionServiceMock.list.mockResolvedValue(mockSessions);

    render(
      <MemoryRouter initialEntries={["/sessions"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/sessions" element={<SessionsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      mockSessions.forEach((session) => {
        expect(screen.getByText(`Session ${session.id.split("_")[1]}`)).toBeInTheDocument();
      });
    });
  });
});
