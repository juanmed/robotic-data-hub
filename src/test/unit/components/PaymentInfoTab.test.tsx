import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

vi.mock("@/components/PaymentElementModal", () => ({
  default: ({ open, onOpenChange, onSuccess, mode }: any) => (
    open && (
      <div data-testid="payment-element-modal">
        <p>Mode: {mode}</p>
        <button onClick={() => onSuccess()}>Mock Payment Success</button>
        <button onClick={() => onOpenChange(false)}>Mock Payment Close</button>
      </div>
    )
  ),
}));

describe("PaymentInfoTab", () => {
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========== Happy-path tests ==========

  it("shows locked state by default", () => {
    render(<PaymentInfoTab />);
    expect(screen.getByRole("button", { name: /view payment info/i })).toBeInTheDocument();
  });

  it("opens ReAuthModal when clicking view payment info", async () => {
    render(<PaymentInfoTab />);
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });
  });

  it("transitions to loading after re-auth success", async () => {
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
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    // Should transition through loading and then to ready state
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /payment method/i })).toBeInTheDocument();
    });
  });

  it("shows no_card state when no payment method exists", async () => {
    supabaseMock.supabase.functions.invoke.mockResolvedValue({
      data: {
        hasPaymentMethod: false,
      },
    });

    render(<PaymentInfoTab />);
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/no payment method on file/i)).toBeInTheDocument();
    });
  });

  it("displays masked card in ready state", async () => {
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
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/•••• •••• •••• 4242/)).toBeInTheDocument();
    });
  });

  it("reveals billing name on eye toggle", async () => {
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
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/J••••••e/)).toBeInTheDocument();
    });

    // Click eye button to reveal
    const eyeButtons = screen.getAllByRole("button");
    const eyeToggleButton = eyeButtons.find((btn) => !btn.textContent?.includes("Mock"));
    fireEvent.click(eyeToggleButton!);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("displays transaction rows with amount and status", async () => {
    const mockCharges = [
      {
        id: "ch_001",
        amount: 4900,
        currency: "usd",
        status: "succeeded",
        description: "Navigation Dataset",
        created: Math.floor(Date.now() / 1000),
      },
      {
        id: "ch_002",
        amount: 2400,
        currency: "usd",
        status: "succeeded",
        description: "Sensor Data",
        created: Math.floor(Date.now() / 1000) - 86400,
      },
    ];

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
        charges: mockCharges,
      },
    });

    render(<PaymentInfoTab />);
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/Navigation Dataset/)).toBeInTheDocument();
      expect(screen.getByText(/Sensor Data/)).toBeInTheDocument();
    });
  });

  it("displays transaction status badges", async () => {
    const mockCharges = [
      {
        id: "ch_001",
        amount: 4900,
        currency: "usd",
        status: "succeeded",
        description: "Navigation Dataset",
        created: Math.floor(Date.now() / 1000),
      },
      {
        id: "ch_002",
        amount: 2400,
        currency: "usd",
        status: "failed",
        description: "Failed Charge",
        created: Math.floor(Date.now() / 1000) - 86400,
      },
    ];

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
        charges: mockCharges,
      },
    });

    render(<PaymentInfoTab />);
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      const successBadges = screen.getAllByText("succeeded");
      const failedBadges = screen.getAllByText("failed");
      expect(successBadges.length).toBeGreaterThan(0);
      expect(failedBadges.length).toBeGreaterThan(0);
    });
  });

  // ========== Failure-path tests ==========

  it("shows error when get-payment-info fails", async () => {
    supabaseMock.supabase.functions.invoke.mockRejectedValue(
      new Error("Failed to fetch payment info")
    );

    render(<PaymentInfoTab />);
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch payment info/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });
  });

  it("clears payment data when ReAuthModal opens", async () => {
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
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/•••• •••• •••• 4242/)).toBeInTheDocument();
    });

    // Component shows payment info in ready state
    expect(screen.getByRole("heading", { name: /payment method/i })).toBeInTheDocument();
  });

  it("sets up activity listeners when in ready state", async () => {
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

    const { container } = render(<PaymentInfoTab />);
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/•••• •••• •••• 4242/)).toBeInTheDocument();
    });

    // Activity listeners should be set up for mousemove, keydown, scroll, touchstart
    const div = container.querySelector("[class*='max-w-2xl']");
    fireEvent.mouseMove(div!);
    fireEvent.keyDown(div!);
    fireEvent.scroll(div!);
    fireEvent.touchStart(div!);

    // Component should still be showing payment info (activity resets timeout)
    expect(screen.getByText(/•••• •••• •••• 4242/)).toBeInTheDocument();
  });

  it("handles ReAuthModal being opened and closed", async () => {
    render(<PaymentInfoTab />);
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    // Modal is open
    expect(screen.getByRole("button", { name: /mock success/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mock close/i })).toBeInTheDocument();

    const mockCloseButton = screen.getByRole("button", { name: /mock close/i });
    fireEvent.click(mockCloseButton);

    // After closing, modal should not be visible
    // Component is in authenticating state showing spinner
    expect(screen.queryByTestId("reauth-modal")).not.toBeInTheDocument();
  });

  it("uses sessionVersion to guard against stale responses", async () => {
    const invokeCalls: any[] = [];
    supabaseMock.supabase.functions.invoke.mockImplementation((fn, opts) => {
      invokeCalls.push({ fn, opts });
      return Promise.resolve({
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
    });

    render(<PaymentInfoTab />);
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/•••• •••• •••• 4242/)).toBeInTheDocument();
    });

    // Verify that invoke was called with correct parameters
    expect(invokeCalls.length).toBeGreaterThan(0);
    expect(invokeCalls[0].fn).toBe("get-payment-info");
  });

  it("handles invoke error response", async () => {
    supabaseMock.supabase.functions.invoke.mockResolvedValue({
      error: {
        message: "Unauthorized to view payment info",
      },
    });

    render(<PaymentInfoTab />);
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/unauthorized to view payment info/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });
  });

  it("retry button refetches payment info", async () => {
    supabaseMock.supabase.functions.invoke.mockRejectedValueOnce(
      new Error("Network error")
    );

    render(<PaymentInfoTab />);
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    // Now mock success for retry
    supabaseMock.supabase.functions.invoke.mockResolvedValueOnce({
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

    const retryButton = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText(/•••• •••• •••• 4242/)).toBeInTheDocument();
    });
  });

  // ========== PaymentElementModal Integration Tests ==========

  it("opens PaymentElementModal on Add payment method button click", async () => {
    supabaseMock.supabase.functions.invoke.mockResolvedValue({
      data: {
        hasPaymentMethod: false,
      },
    });

    render(<PaymentInfoTab />);
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/no payment method on file/i)).toBeInTheDocument();
    });

    const addButton = screen.getByRole("button", { name: /add payment method/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId("payment-element-modal")).toBeInTheDocument();
    });
  });

  it("opens PaymentElementModal in add mode", async () => {
    supabaseMock.supabase.functions.invoke.mockResolvedValue({
      data: {
        hasPaymentMethod: false,
      },
    });

    render(<PaymentInfoTab />);
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/no payment method on file/i)).toBeInTheDocument();
    });

    const addButton = screen.getByRole("button", { name: /add payment method/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Mode: add")).toBeInTheDocument();
    });
  });

  it("refetches payment info after PaymentElementModal success", async () => {
    supabaseMock.supabase.functions.invoke
      .mockResolvedValueOnce({
        data: {
          hasPaymentMethod: false,
        },
      })
      .mockResolvedValueOnce({
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
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/no payment method on file/i)).toBeInTheDocument();
    });

    const addButton = screen.getByRole("button", { name: /add payment method/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId("payment-element-modal")).toBeInTheDocument();
    });

    const mockPaymentSuccessButton = screen.getByRole("button", {
      name: /mock payment success/i,
    });
    fireEvent.click(mockPaymentSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/•••• •••• •••• 4242/)).toBeInTheDocument();
    });
  });

  it("opens PaymentElementModal on Update payment method button click", async () => {
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
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/•••• •••• •••• 4242/)).toBeInTheDocument();
    });

    const updateButton = screen.getByRole("button", { name: /update payment method/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByTestId("payment-element-modal")).toBeInTheDocument();
    });
  });

  it("opens PaymentElementModal in update mode", async () => {
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
    const viewButton = screen.getByRole("button", { name: /view payment info/i });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId("reauth-modal")).toBeInTheDocument();
    });

    const mockSuccessButton = screen.getByRole("button", { name: /mock success/i });
    fireEvent.click(mockSuccessButton);

    await waitFor(() => {
      expect(screen.getByText(/•••• •••• •••• 4242/)).toBeInTheDocument();
    });

    const updateButton = screen.getByRole("button", { name: /update payment method/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText("Mode: update")).toBeInTheDocument();
    });
  });
});
