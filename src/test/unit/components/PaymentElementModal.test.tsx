import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PaymentElementModal from "@/components/PaymentElementModal";

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

const stripeMocks = vi.hoisted(() => ({
  loadStripe: vi.fn(),
  Elements: ({ children }: any) => <>{children}</>,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: vi.fn(),
  useElements: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  toast: vi.fn(),
}));

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: stripeMocks.Elements,
  PaymentElement: stripeMocks.PaymentElement,
  useStripe: stripeMocks.useStripe,
  useElements: stripeMocks.useElements,
}));

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: stripeMocks.loadStripe,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock.supabase,
}));

vi.mock("sonner", () => ({
  toast: toastMock.toast,
}));

describe("PaymentElementModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock.supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "test_jwt_token",
        },
      },
    });
    stripeMocks.useStripe.mockReturnValue({
      confirmSetup: vi.fn(),
    });
    stripeMocks.useElements.mockReturnValue({});
  });

  it("renders dialog with correct title for add mode", () => {
    supabaseMock.supabase.functions.invoke.mockResolvedValue({
      data: {
        client_secret: "seti_test_secret",
      },
    });

    render(
      <PaymentElementModal
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        mode="add"
      />
    );

    expect(screen.getByText("Add Payment Method")).toBeInTheDocument();
    expect(screen.getByText(/Add a new card/)).toBeInTheDocument();
  });

  it("renders dialog with correct title for update mode", () => {
    supabaseMock.supabase.functions.invoke.mockResolvedValue({
      data: {
        client_secret: "seti_test_secret",
      },
    });

    render(
      <PaymentElementModal
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        mode="update"
      />
    );

    expect(screen.getByText("Update Payment Method")).toBeInTheDocument();
    expect(screen.getByText(/Replace your current/)).toBeInTheDocument();
  });

  it("calls create-setup-intent when modal opens", async () => {
    supabaseMock.supabase.functions.invoke.mockResolvedValue({
      data: {
        client_secret: "seti_test_secret",
      },
    });

    render(
      <PaymentElementModal
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        mode="add"
      />
    );

    await waitFor(() => {
      expect(supabaseMock.supabase.functions.invoke).toHaveBeenCalledWith(
        "create-setup-intent",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test_jwt_token",
          }),
        })
      );
    });
  });

  it("shows loading spinner while creating SetupIntent", async () => {
    let resolveInvoke: any;
    supabaseMock.supabase.functions.invoke.mockReturnValue(
      new Promise((resolve) => {
        resolveInvoke = resolve;
      })
    );

    render(
      <PaymentElementModal
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        mode="add"
      />
    );

    // Find the loading spinner
    expect(screen.getByTestId("setup-intent-loading")).toBeInTheDocument();

    resolveInvoke({
      data: {
        client_secret: "seti_test_secret",
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    });
  });

  it("renders PaymentElement once SetupIntent created", async () => {
    supabaseMock.supabase.functions.invoke.mockResolvedValue({
      data: {
        client_secret: "seti_test_secret",
      },
    });

    render(
      <PaymentElementModal
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        mode="add"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    });
  });

  it("calls confirmSetup on form submission", async () => {
    const mockConfirmSetup = vi.fn().mockResolvedValue({
      setupIntent: {
        id: "seti_test",
        status: "succeeded",
        payment_method: "pm_test",
      },
    });

    stripeMocks.useStripe.mockReturnValue({
      confirmSetup: mockConfirmSetup,
    });

    supabaseMock.supabase.functions.invoke.mockResolvedValue({
      data: {
        client_secret: "seti_test_secret",
      },
    });

    render(
      <PaymentElementModal
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        mode="add"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", {
      name: /add payment method/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockConfirmSetup).toHaveBeenCalled();
    });
  });

  it("calls update-payment-method on confirmSetup success", async () => {
    const mockConfirmSetup = vi.fn().mockResolvedValue({
      setupIntent: {
        id: "seti_test",
        status: "succeeded",
        payment_method: "pm_test",
      },
    });

    stripeMocks.useStripe.mockReturnValue({
      confirmSetup: mockConfirmSetup,
    });

    supabaseMock.supabase.functions.invoke
      .mockResolvedValueOnce({
        data: {
          client_secret: "seti_test_secret",
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
        },
      });

    const onSuccess = vi.fn();

    render(
      <PaymentElementModal
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={onSuccess}
        mode="add"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", {
      name: /add payment method/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(supabaseMock.supabase.functions.invoke).toHaveBeenCalledWith(
        "update-payment-method",
        expect.objectContaining({
          body: {
            setup_intent_id: "seti_test",
            payment_method_id: "pm_test",
          },
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("shows error when create-setup-intent fails", async () => {
    supabaseMock.supabase.functions.invoke.mockResolvedValue({
      error: {
        message: "Stripe not configured",
      },
    });

    render(
      <PaymentElementModal
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        mode="add"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Stripe not configured")).toBeInTheDocument();
      expect(screen.getByTestId("error-close-button")).toBeInTheDocument();
    });
  });

  it("shows error when confirmSetup fails", async () => {
    const mockConfirmSetup = vi.fn().mockResolvedValue({
      error: {
        message: "Card declined",
      },
    });

    stripeMocks.useStripe.mockReturnValue({
      confirmSetup: mockConfirmSetup,
    });

    supabaseMock.supabase.functions.invoke.mockResolvedValue({
      data: {
        client_secret: "seti_test_secret",
      },
    });

    render(
      <PaymentElementModal
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        mode="add"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", {
      name: /add payment method/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId("form-error-message")).toBeInTheDocument();
      expect(screen.getByText("Card declined")).toBeInTheDocument();
    });
  });
});
