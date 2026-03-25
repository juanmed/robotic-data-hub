import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "@/pages/SettingsPage";

const useAuthMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: useAuthMock.useAuth,
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders settings page with header", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: "test@example.com", name: "John Doe", email_verified: true },
      isAuthenticated: true,
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText(/manage your account/i)).toBeInTheDocument();
    });
  });

  it("displays user name and email", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: "john@example.com", name: "John Doe", email_verified: true },
      isAuthenticated: true,
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const allJohnDoes = screen.getAllByText("John Doe");
      expect(allJohnDoes.length).toBeGreaterThan(0);
      const allEmails = screen.getAllByText("john@example.com");
      expect(allEmails.length).toBeGreaterThan(0);
    });
  });

  it("displays avatar with initials", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: "alice@example.com", name: "Alice Smith", email_verified: true },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("AS")).toBeInTheDocument();
    });
  });

  it("displays email verified status as yes when verified", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: "verified@example.com", name: "Verified User", email_verified: true },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Yes")).toBeInTheDocument();
    });
  });

  it("displays email verified status as no when not verified", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: "unverified@example.com", name: "Unverified User", email_verified: false },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No")).toBeInTheDocument();
    });
  });

  it("displays info fields with correct labels", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: "test@example.com", name: "Test User", email_verified: true },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Email Verified")).toBeInTheDocument();
    });
  });

  it("displays dashes when user fields are null", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: null, name: null, email_verified: false },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  it("generates correct initials for names with multiple words", async () => {
    useAuthMock.useAuth.mockReturnValue({
      user: { id: "user_001", email: "test@example.com", name: "Mary Jane Watson", email_verified: true },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/settings"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("MJ")).toBeInTheDocument();
    });
  });
});
