import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/pages/LoginPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";

const navigateMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));
const lovableMock = vi.hoisted(() => ({
  auth: {
    signInWithOAuth: vi.fn(),
  },
}));
const supabaseMock = vi.hoisted(() => ({
  auth: {
    resend: vi.fn(),
    exchangeCodeForSession: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/hooks/useAuth", () => useAuthMock);
vi.mock("@/integrations/lovable/index", () => ({ lovable: lovableMock }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

describe("auth flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    supabaseMock.auth.resend.mockResolvedValue({ error: null });
    supabaseMock.auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: { user: { id: "usr_1" } } },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("submits login and navigates to the dashboard", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    useAuthMock.useAuth.mockReturnValue({
      login,
      isLoginLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/login"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith("test@example.com", "password"));
    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });

  it("shows verification recovery and redirects through auth callback", async () => {
    const login = vi.fn().mockRejectedValue(new Error("Please verify your email before signing in. Check your inbox for the verification link."));
    useAuthMock.useAuth.mockReturnValue({
      login,
      isLoginLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/login"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "verify@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/verify your email/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }));
    await waitFor(() => expect(supabaseMock.auth.resend).toHaveBeenCalledTimes(1));

    navigateMock.mockReset();

    window.history.pushState({}, "", "/auth/callback?code=abc&type=recovery");
    render(
      <MemoryRouter initialEntries={["/auth/callback?code=abc&type=recovery"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(supabaseMock.auth.exchangeCodeForSession).toHaveBeenCalledWith("abc");
      expect(navigateMock).toHaveBeenCalledWith("/reset-password", { replace: true });
    });
  });
});
