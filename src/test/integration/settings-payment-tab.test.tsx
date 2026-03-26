import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import SettingsPage from "@/pages/SettingsPage";

const useAuthMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

const toastMock = vi.hoisted(() => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: useAuthMock.useAuth,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock.supabase,
}));

vi.mock("sonner", () => ({
  toast: toastMock.toast,
}));

vi.mock("@/components/ReAuthModal", () => ({
  default: ({ open, onOpenChange, onSuccess }: any) => (
    open && (
      <div data-testid="reauth-modal">
        <button onClick={() => onSuccess()}>Mock Success</button>
        <button onClick={() => onOpenChange(false)}>Mock Close</button>
      </div>
    )
  ),
}));

describe("SettingsPage - Payment Information Tab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.useAuth.mockReturnValue({
      user: {
        id: "user_001",
        email: "test@example.com",
        name: "Test User",
        avatar_url: null,
        email_verified: true,
      },
      refreshUser: vi.fn(),
    });
    supabaseMock.supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "test_jwt_token",
        },
      },
    });
    supabaseMock.supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    });
    supabaseMock.supabase.storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: "https://example.com/avatar.jpg" },
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("displays payment information tab in settings", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("tab", { name: /payment information/i })).toBeInTheDocument();
  });

  it("renders payment tab button with correct name", () => {
    render(<SettingsPage />);
    const paymentTab = screen.getByRole("tab", { name: /payment information/i });
    expect(paymentTab).toHaveAttribute("data-state", "inactive");
  });

  it("allows clicking the payment information tab", () => {
    render(<SettingsPage />);
    const paymentTab = screen.getByRole("tab", { name: /payment information/i });

    expect(() => fireEvent.click(paymentTab)).not.toThrow();
  });

  it("shows settings page with both information and payment tabs", () => {
    render(<SettingsPage />);

    // Payment information tab should be present
    expect(screen.getByRole("tab", { name: /payment information/i })).toBeInTheDocument();

    // Settings page header should be visible
    expect(screen.getByRole("heading", { name: /settings/i })).toBeInTheDocument();
  });

  it("renders information tab content by default", () => {
    render(<SettingsPage />);

    // Default tab (information) should show user info
    // The Information tab content should be visible
    expect(screen.getByText(/manage your account/i)).toBeInTheDocument();
  });
});
