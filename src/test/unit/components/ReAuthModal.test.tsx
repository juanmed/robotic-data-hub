import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ReAuthModal from "@/components/ReAuthModal";

const useAuthMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

const lovableMock = vi.hoisted(() => ({
  lovable: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: useAuthMock.useAuth,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock.supabase,
}));

vi.mock("@/integrations/lovable", () => ({
  lovable: lovableMock.lovable,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ReAuthModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.useAuth.mockReturnValue({
      user: {
        id: "user_001",
        email: "test@example.com",
        name: "Test User",
        email_verified: true,
      },
    });
    supabaseMock.supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            user_metadata: { provider: "password" },
          },
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders password form for password auth users", async () => {
    render(
      <ReAuthModal open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Re-authenticate/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText("Enter your password");
    expect(passwordInput).toBeInTheDocument();
  });

  it("shows email field read-only", async () => {
    render(
      <ReAuthModal open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
    );

    await waitFor(() => {
      const emailInput = screen.getByDisplayValue("test@example.com");
      expect(emailInput).toHaveAttribute("readonly");
    });
  });

  it("submits password and calls onSuccess on success", async () => {
    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();
    supabaseMock.supabase.auth.signInWithPassword.mockResolvedValue({
      error: null,
    });

    render(
      <ReAuthModal
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    );

    const passwordInput = screen.getByPlaceholderText(
      "Enter your password"
    ) as HTMLInputElement;
    const verifyButton = screen.getByRole("button", { name: /verify/i });

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(supabaseMock.supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(onSuccess).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("shows error message on bad password", async () => {
    supabaseMock.supabase.auth.signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    render(
      <ReAuthModal open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
    );

    const passwordInput = screen.getByPlaceholderText(
      "Enter your password"
    ) as HTMLInputElement;
    const verifyButton = screen.getByRole("button", { name: /verify/i });

    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(
        screen.getByText("Invalid login credentials")
      ).toBeInTheDocument();
    });
  });

  it("disables submit button while loading", async () => {
    supabaseMock.supabase.auth.signInWithPassword.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ error: null }), 100)
        )
    );

    render(
      <ReAuthModal open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
    );

    const passwordInput = screen.getByPlaceholderText(
      "Enter your password"
    ) as HTMLInputElement;
    const verifyButton = screen.getByRole("button", { name: /verify/i });

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(verifyButton);

    expect(verifyButton).toBeDisabled();
  });

  it("renders OAuth redirect for Google users", async () => {
    supabaseMock.supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            user_metadata: { provider: "google" },
          },
        },
      },
    });

    const onOpenChange = vi.fn();
    render(
      <ReAuthModal open={true} onOpenChange={onOpenChange} onSuccess={vi.fn()} />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Re-authenticate with Google/i)
      ).toBeInTheDocument();
    });
  });

  it("calls signInWithOAuth when Google button clicked", async () => {
    supabaseMock.supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            user_metadata: { provider: "google" },
          },
        },
      },
    });

    lovableMock.lovable.auth.signInWithOAuth.mockResolvedValue({});

    render(
      <ReAuthModal open={true} onOpenChange={vi.fn()} onSuccess={vi.fn()} />
    );

    await waitFor(() => {
      const googleButton = screen.getByRole("button", {
        name: /Re-authenticate with Google/i,
      });
      fireEvent.click(googleButton);

      expect(lovableMock.lovable.auth.signInWithOAuth).toHaveBeenCalledWith(
        "google"
      );
    });
  });

  it("closes dialog on successful password re-auth", async () => {
    const onOpenChange = vi.fn();
    supabaseMock.supabase.auth.signInWithPassword.mockResolvedValue({
      error: null,
    });

    render(
      <ReAuthModal
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={vi.fn()}
      />
    );

    const passwordInput = screen.getByPlaceholderText(
      "Enter your password"
    ) as HTMLInputElement;
    const verifyButton = screen.getByRole("button", { name: /verify/i });

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
