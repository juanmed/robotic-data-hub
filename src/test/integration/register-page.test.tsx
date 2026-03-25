import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RegisterPage from "@/pages/RegisterPage";

const useAuthMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => useAuthMock);

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("successfully registers a new user with valid credentials", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    useAuthMock.useAuth.mockReturnValue({
      register,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/register"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Alex Chen"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "john@example.com" },
    });
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordInputs[0], {
      target: { value: "SecurePass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith("john@example.com", "SecurePass123!", "John Doe")
    );

    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument());
  });

  it("shows error when name field is empty", async () => {
    const register = vi.fn();
    useAuthMock.useAuth.mockReturnValue({
      register,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/register"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "john@example.com" },
    });
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordInputs[0], {
      target: { value: "SecurePass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText("Please fill in all fields.")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("shows error when email field is empty", async () => {
    const register = vi.fn();
    useAuthMock.useAuth.mockReturnValue({
      register,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/register"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Alex Chen"), {
      target: { value: "John Doe" },
    });
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordInputs[0], {
      target: { value: "SecurePass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText("Please fill in all fields.")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("shows error when password is too short", async () => {
    const register = vi.fn();
    useAuthMock.useAuth.mockReturnValue({
      register,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/register"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Alex Chen"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "john@example.com" },
    });
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordInputs[0], {
      target: { value: "Short1!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText("Password does not meet the requirements.")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("validates password strength requirements", async () => {
    const register = vi.fn();
    useAuthMock.useAuth.mockReturnValue({
      register,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/register"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Password input should show helper text about requirements
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordInputs[0], {
      target: { value: "weakpass" },
    });

    // Helper text should be visible
    expect(screen.getByText(/Must be at least 8 characters/i)).toBeInTheDocument();
  });

  it("shows error when password lacks special characters", async () => {
    const register = vi.fn();
    useAuthMock.useAuth.mockReturnValue({
      register,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/register"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Alex Chen"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "john@example.com" },
    });
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordInputs[0], {
      target: { value: "NoSpecial123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText("Password does not meet the requirements.")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("shows registration error from auth service", async () => {
    const register = vi.fn().mockRejectedValue(new Error("Email already exists."));
    useAuthMock.useAuth.mockReturnValue({
      register,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/register"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Alex Chen"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "existing@example.com" },
    });
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordInputs[0], {
      target: { value: "SecurePass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(screen.getByText("Email already exists.")).toBeInTheDocument());
  });

  it("shows success message with verification email address", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    useAuthMock.useAuth.mockReturnValue({
      register,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/register"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    );

    const testEmail = "newuser@example.com";
    fireEvent.change(screen.getByPlaceholderText("Alex Chen"), {
      target: { value: "Jane Smith" },
    });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: testEmail },
    });
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordInputs[0], {
      target: { value: "SecurePass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(testEmail))).toBeInTheDocument();
    });
  });

  it("shows link back to login page", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    useAuthMock.useAuth.mockReturnValue({
      register,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={["/register"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Alex Chen"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "john@example.com" },
    });
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordInputs[0], {
      target: { value: "SecurePass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument());

    const loginLink = screen.getByRole("link", { name: /back to sign in/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
