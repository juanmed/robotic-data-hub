import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PaymentInfoTab from "@/components/PaymentInfoTab";

const useAuthMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

const toastMock = vi.hoisted(() => ({
  toast: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: useAuthMock.useAuth,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock.supabase,
}));

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: any) => <>{children}</>,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => ({
    confirmSetup: vi.fn().mockResolvedValue({
      setupIntent: {
        id: "seti_test",
        status: "succeeded",
        payment_method: "pm_test",
      },
    }),
  }),
  useElements: () => ({}),
}));

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn().mockResolvedValue({}),
}));

vi.mock("sonner", () => ({
  toast: toastMock.toast,
}));

vi.mock("@/components/ReAuthModal", () => ({
  default: ({ open, onOpenChange, onSuccess }: any) => (
    open && (
      <div data-testid="reauth-modal">
        <button onClick={() => onSuccess()}>Mock Success</button>
      </div>
    )
  ),
}));

vi.mock("@/components/PaymentElementModal", () => ({
  default: ({ open, onOpenChange, onSuccess, mode }: any) => (
    open && (
      <div data-testid="payment-element-modal">
        <p>Mode: {mode}</p>
        <button onClick={() => onSuccess()}>Payment Success</button>
      </div>
    )
  ),
}));

describe("Payment Flow Integration - PaymentInfoTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.useAuth.mockReturnValue({
      user: {
        id: "user_001",
        email: "test@example.com",
      },
    });
    supabaseMock.supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "test_jwt_token",
        },
      },
    });
  });

  it("shows locked state by default and opens payment info on auth", async () => {
    supabaseMock.supabase.functions.invoke.mockResolvedValue({
      data: {
        hasPaymentMethod: false,
      },
    });

    render(<PaymentInfoTab />);

    // Should show view payment info button
    expect(screen.getByRole("button", { name: /view payment info/i })).toBeInTheDocument();

    // Click to unlock
    fireEvent.click(screen.getByRole("button", { name: /view payment info/i }));

    // ReAuthModal should open
    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    // Complete auth
    fireEvent.click(screen.getByRole("button", { name: /mock success/i }));

    // Should show no card state
    await waitFor(() => {
      expect(screen.getByText(/no payment method on file/i)).toBeInTheDocument();
    });
  });

  it("opens PaymentElementModal in add mode from no_card state", async () => {
    supabaseMock.supabase.functions.invoke.mockResolvedValue({
      data: {
        hasPaymentMethod: false,
      },
    });

    render(<PaymentInfoTab />);

    // Unlock
    fireEvent.click(screen.getByRole("button", { name: /view payment info/i }));

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /mock success/i }));

    // Click add button
    await waitFor(() => {
      expect(screen.getByText(/no payment method on file/i)).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole("button", { name: /add payment method/i });
    fireEvent.click(addButtons[addButtons.length - 1]);

    // Payment element modal should open
    await waitFor(() => {
      expect(screen.getByTestId("payment-element-modal")).toBeInTheDocument();
      expect(screen.getByText("Mode: add")).toBeInTheDocument();
    });
  });

  it("opens PaymentElementModal in update mode from ready state", async () => {
    supabaseMock.supabase.functions.invoke.mockResolvedValue({
      data: {
        hasPaymentMethod: true,
        card: {
          last4: "4242",
          brand: "visa",
          exp_month: 12,
          exp_year: 2028,
        },
        billing: {
          name: "John Doe",
          country: "US",
          postal_code: "10001",
        },
        charges: [],
      },
    });

    render(<PaymentInfoTab />);

    // Unlock
    fireEvent.click(screen.getByRole("button", { name: /view payment info/i }));

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /mock success/i }));

    // Should show card in ready state
    await waitFor(() => {
      expect(screen.getByText(/•••• •••• •••• 4242/)).toBeInTheDocument();
    });

    // Click update button
    fireEvent.click(screen.getByRole("button", { name: /update payment method/i }));

    // Payment element modal should open in update mode
    await waitFor(() => {
      expect(screen.getByTestId("payment-element-modal")).toBeInTheDocument();
      expect(screen.getByText("Mode: update")).toBeInTheDocument();
    });
  });
});
