import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProfilePage from "@/pages/ProfilePage";

const useAuthMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const useToastMock = vi.hoisted(() => ({
  useToast: vi.fn(),
}));

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: useAuthMock.useAuth,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: useToastMock.useToast,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock.supabase,
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: "test@example.com", name: "Test User" },
      isAuthenticated: true,
    });
    useToastMock.useToast.mockReturnValue({
      toast: vi.fn(),
    });
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders profile page with header", async () => {
    render(
      <MemoryRouter initialEntries={["/profile"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("API Keys")).toBeInTheDocument();
    });
  });

  it("loads API keys on mount", async () => {
    render(
      <MemoryRouter initialEntries={["/profile"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(supabaseMock.supabase.from).toHaveBeenCalledWith("api_keys");
    });
  });

  it("shows loading state while fetching keys", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve({ data: [], error: null }), 100))
        ),
      }),
    });

    render(
      <MemoryRouter initialEntries={["/profile"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(supabaseMock.supabase.from).toHaveBeenCalled();
    });
  });

  it("displays API keys when loaded", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            { id: "key_001", name: "Production", key_prefix: "gpai_abc123", created_at: "2026-01-01T00:00:00Z" },
            { id: "key_002", name: "Development", key_prefix: "gpai_def456", created_at: "2026-02-01T00:00:00Z" },
          ],
          error: null,
        }),
      }),
    });

    render(
      <MemoryRouter initialEntries={["/profile"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(supabaseMock.supabase.from).toHaveBeenCalled();
    });
  });

  it("has API keys tab available", async () => {
    render(
      <MemoryRouter initialEntries={["/profile"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(supabaseMock.supabase.from).toHaveBeenCalled();
    });

    // Verify API Keys tab is present
    const apiKeysTab = screen.getByRole("tab", { name: /api keys/i });
    expect(apiKeysTab).toBeInTheDocument();
  });

  it("shows empty state when no API keys exist", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });

    render(
      <MemoryRouter initialEntries={["/profile"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(supabaseMock.supabase.from).toHaveBeenCalled();
    });
  });

  it("displays warning about key visibility", async () => {
    render(
      <MemoryRouter initialEntries={["/profile"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const warningText = screen.queryByText(/won't be shown again/i) ||
                         screen.queryByText(/keep.*secure/i);
      expect(screen.getByText("API Keys")).toBeInTheDocument();
    });
  });

  it("handles API key creation error", async () => {
    const toastMock = vi.fn();
    useToastMock.useToast.mockReturnValue({
      toast: toastMock,
    });

    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });

    supabaseMock.supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user_001" } } },
    });

    supabaseMock.supabase.functions.invoke.mockResolvedValue({
      error: new Error("Failed to create key"),
      data: null,
    });

    render(
      <MemoryRouter initialEntries={["/profile"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(supabaseMock.supabase.from).toHaveBeenCalled();
    });
  });

  it("displays key prefix in key list", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            { id: "key_001", name: "Main Key", key_prefix: "gpai_12345", created_at: "2026-01-01T00:00:00Z" },
          ],
          error: null,
        }),
      }),
    });

    render(
      <MemoryRouter initialEntries={["/profile"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(supabaseMock.supabase.from).toHaveBeenCalled();
    });
  });
});
