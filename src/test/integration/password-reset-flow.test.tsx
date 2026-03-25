import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

const navigateMock = vi.hoisted(() => vi.fn());
const useAuthMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));
const supabaseMock = vi.hoisted(() => ({
  auth: {
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

vi.mock("@/hooks/useAuth", () => useAuthMock);
vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("successfully submits password reset request with valid email", async () => {
    const resetPassword = vi.fn().mockResolvedValue(undefined);
    useAuthMock.useAuth.mockReturnValue({
      resetPassword,
    });

    render(
      <MemoryRouter initialEntries={["/forgot-password"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => expect(resetPassword).toHaveBeenCalledWith("user@example.com"));
    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument());
  });

  it("shows error when email field is empty", async () => {
    const resetPassword = vi.fn();
    useAuthMock.useAuth.mockReturnValue({
      resetPassword,
    });

    render(
      <MemoryRouter initialEntries={["/forgot-password"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(screen.getByText("Please enter your email.")).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("shows error from auth service when email not found", async () => {
    const resetPassword = vi.fn().mockRejectedValue(new Error("Email not found."));
    useAuthMock.useAuth.mockReturnValue({
      resetPassword,
    });

    render(
      <MemoryRouter initialEntries={["/forgot-password"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "nonexistent@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => expect(screen.getByText("Email not found.")).toBeInTheDocument());
  });

  it("shows success message with email address", async () => {
    const resetPassword = vi.fn().mockResolvedValue(undefined);
    useAuthMock.useAuth.mockReturnValue({
      resetPassword,
    });

    render(
      <MemoryRouter initialEntries={["/forgot-password"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    const testEmail = "user@example.com";
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: testEmail },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(testEmail))).toBeInTheDocument();
    });
  });

  it("shows link back to login page", async () => {
    const resetPassword = vi.fn().mockResolvedValue(undefined);
    useAuthMock.useAuth.mockReturnValue({
      resetPassword,
    });

    render(
      <MemoryRouter initialEntries={["/forgot-password"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument());

    const loginLink = screen.getByRole("link", { name: /back to sign in/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("successfully resets password with valid input", async () => {
    const updatePassword = vi.fn().mockResolvedValue(undefined);
    useAuthMock.useAuth.mockReturnValue({
      updatePassword,
    });
    supabaseMock.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "usr_1" } } },
    });

    render(
      <MemoryRouter initialEntries={["/reset-password"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(supabaseMock.auth.getSession).toHaveBeenCalled());

    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[0], {
      target: { value: "NewPassword123!" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[1], {
      target: { value: "NewPassword123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => expect(updatePassword).toHaveBeenCalledWith("NewPassword123!"));
    await waitFor(() => expect(screen.getByText(/password updated/i)).toBeInTheDocument());
  });

  it("shows error when password is too short", async () => {
    const updatePassword = vi.fn();
    useAuthMock.useAuth.mockReturnValue({
      updatePassword,
    });
    supabaseMock.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "usr_1" } } },
    });

    render(
      <MemoryRouter initialEntries={["/reset-password"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(supabaseMock.auth.getSession).toHaveBeenCalled());

    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[0], {
      target: { value: "Short1!" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[1], {
      target: { value: "Short1!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("shows error when passwords do not match", async () => {
    const updatePassword = vi.fn();
    useAuthMock.useAuth.mockReturnValue({
      updatePassword,
    });
    supabaseMock.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "usr_1" } } },
    });

    render(
      <MemoryRouter initialEntries={["/reset-password"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(supabaseMock.auth.getSession).toHaveBeenCalled());

    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[0], {
      target: { value: "NewPassword123!" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[1], {
      target: { value: "DifferentPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("shows error when no active session", async () => {
    useAuthMock.useAuth.mockReturnValue({
      updatePassword: vi.fn(),
    });
    supabaseMock.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    render(
      <MemoryRouter initialEntries={["/reset-password"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/no active session/i)).toBeInTheDocument()
    );
  });

  it("shows success message and link to login", async () => {
    const updatePassword = vi.fn().mockResolvedValue(undefined);
    useAuthMock.useAuth.mockReturnValue({
      updatePassword,
    });
    supabaseMock.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "usr_1" } } },
    });

    render(
      <MemoryRouter initialEntries={["/reset-password"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(supabaseMock.auth.getSession).toHaveBeenCalled());

    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[0], {
      target: { value: "NewPassword123!" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("••••••••")[1], {
      target: { value: "NewPassword123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => expect(screen.getByText(/password updated/i)).toBeInTheDocument());

    const loginLink = screen.getByRole("link", { name: /sign in/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
