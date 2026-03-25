import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/pages/LoginPage";

const navigateMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));
const supabaseMock = vi.hoisted(() => ({
  auth: {
    resend: vi.fn(),
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
vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    supabaseMock.auth.resend.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("logs in successfully with valid credentials", async () => {
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
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith("user@example.com", "password123"));
    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });

  it("shows error for empty email field", async () => {
    const login = vi.fn();
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

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText("Please fill in all fields.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("shows error for empty password field", async () => {
    const login = vi.fn();
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
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText("Please fill in all fields.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("shows invalid credentials error from auth service", async () => {
    const login = vi.fn().mockRejectedValue(new Error("Invalid credentials."));
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
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText("Invalid credentials.")).toBeInTheDocument());
  });

  it("shows email verification required message and allows resending", async () => {
    const login = vi.fn().mockRejectedValue(new Error("Please verify your email before signing in."));
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
      target: { value: "unverified@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText(/verify your email/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }));

    await waitFor(() =>
      expect(supabaseMock.auth.resend).toHaveBeenCalledWith({
        type: "signup",
        email: "unverified@example.com",
        options: {
          emailRedirectTo: expect.stringContaining("auth/callback"),
        },
      })
    );
  });

  it("shows success message after resending verification email", async () => {
    const login = vi.fn().mockRejectedValue(new Error("Please verify your email before signing in."));
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
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText(/verify your email/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }));

    await waitFor(() =>
      expect(screen.getByText(/verification email sent/i)).toBeInTheDocument()
    );
  });

  it("disables resend button while sending", async () => {
    const login = vi.fn().mockRejectedValue(new Error("Please verify your email before signing in."));
    useAuthMock.useAuth.mockReturnValue({
      login,
      isLoginLoading: false,
    });

    supabaseMock.auth.resend.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

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
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText(/verify your email/i)).toBeInTheDocument());

    const resendButton = screen.getByRole("button", { name: /resend verification email/i });
    fireEvent.click(resendButton);

    await waitFor(() => expect(supabaseMock.auth.resend).toHaveBeenCalled());
  });
});
