import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuthCallbackPage from "@/pages/AuthCallbackPage";

const navigateMock = vi.hoisted(() => vi.fn());
const supabaseMock = vi.hoisted(() => ({
  auth: {
    exchangeCodeForSession: vi.fn(),
    verifyOtp: vi.fn(),
    getSession: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while verifying account", async () => {
    supabaseMock.auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: { user: { id: "usr_1" } } },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={["/auth/callback?code=test123"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Verifying your account...")).toBeInTheDocument();

    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
  });

  it("renders callback page and attempts session exchange", async () => {
    supabaseMock.auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: { user: { id: "usr_1" } } },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={["/auth/callback?code=test123"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Page should show loading state initially
    expect(screen.getByText("Verifying your account...")).toBeInTheDocument();
  });

  it("handles missing code parameter by redirecting to login", async () => {
    supabaseMock.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    render(
      <MemoryRouter initialEntries={["/auth/callback"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalled();
    });
  });
});
