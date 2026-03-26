# Phase 3: Stripe Payment Method Collection

## Overview
Phase 3 implements the complete payment method collection flow using Stripe Elements. Users can now add and update payment methods through the PaymentInfoTab component. The implementation includes a new PaymentElementModal component that handles SetupIntent creation and payment method confirmation.

## Files to Create / Modify

| File | Action |
|---|---|
| `src/components/PaymentElementModal.tsx` | New — Stripe Elements form for card collection |
| `src/test/unit/components/PaymentElementModal.test.tsx` | New — 8 unit tests |
| `src/components/PaymentInfoTab.tsx` | Edit — Add PaymentElementModal integration + implement updating state |
| `src/test/unit/components/PaymentInfoTab.test.tsx` | Edit — Add 5 tests for payment element modal integration |
| `src/test/integration/settings-payment-flow.test.tsx` | New — 3 integration tests for complete flow |

## Implementation Steps

### Step 1 — PaymentElementModal Component (~280 lines)

**Purpose**: Modal dialog that collects card information via Stripe Elements and confirms SetupIntent.

**Props**:
- `open: boolean` — Dialog open state
- `onOpenChange: (open: boolean) => void` — Callback to change open state
- `onSuccess: () => void` — Callback after successful payment method attachment
- `mode: "add" | "update"` — Mode determines dialog title and messaging

**Component Logic**:
1. **Setup Phase**:
   - On modal open: call `create-setup-intent` edge function to get `clientSecret`
   - Load Stripe using `loadStripe(VITE_STRIPE_PUBLISHABLE_KEY)`
   - Wrap children with `<Elements stripe={stripePromise} options={{ clientSecret }}>`

2. **Form Phase**:
   - Render `<PaymentElement />` for card input
   - Show submit button "Save card" or "Update card" based on mode
   - Show loading spinner during submission
   - Display error messages on validation/submission failures

3. **Confirmation Phase**:
   - On submit: `stripe.confirmSetup({ elements, redirect: "if_required" })`
   - If successful: extract `payment_method_id` from response
   - Call `update-payment-method` edge function with `setup_intent_id` and `payment_method_id`
   - On success: call `onSuccess()` callback and close modal

4. **Error Handling**:
   - Handle `create-setup-intent` failures (e.g., network error)
   - Handle Stripe validation errors from PaymentElement
   - Handle `confirmSetup` errors
   - Handle `update-payment-method` edge function errors
   - Display error messages with retry capability

**Styling**: Use same pattern as CheckoutModal:
- `Dialog` with `sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl`
- Card input in bordered container with proper spacing

**Race Guard**: Include `sessionVersion` check to prevent stale updates (from parent PaymentInfoTab)

### Step 2 — Unit Tests for PaymentElementModal (8 tests)

**Test File**: `src/test/unit/components/PaymentElementModal.test.tsx`

**Mocking Strategy**:
```ts
vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: any) => <>{children}</>,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => mockUseStripe(),
  useElements: () => mockUseElements(),
}));
vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn().mockResolvedValue(mockStripeInstance),
}));
```

**Tests** (Happy + Failure paths):

1. **Renders dialog with title based on mode** — "Add payment method" vs "Update payment method"
2. **Creates SetupIntent on mount** — `invoke("create-setup-intent")` called
3. **Shows loading spinner while creating SetupIntent** — Loading state visible
4. **Renders PaymentElement once SetupIntent created** — Card input visible
5. **Submits form and calls confirmSetup** — On button click → `stripe.confirmSetup` called
6. **Calls update-payment-method on confirmSetup success** — Edge function called with correct args
7. **Shows error when create-setup-intent fails** — Error message visible; modal can be closed
8. **Shows error when confirmSetup fails** — Stripe error displayed; form not submitted

**All tests PASSING before moving to Step 3.**

### Step 3 — Update PaymentInfoTab Component

**Changes**:

1. **Add state management**:
   - Add `showPaymentElementModal: boolean` state
   - Add `paymentElementMode: "add" | "update"` state

2. **Update no_card state**:
   - Change "Add payment method (Coming soon)" button to functional
   - On click: set `showPaymentElementModal = true`, `paymentElementMode = "add"`
   - Add PaymentElementModal with `onSuccess` callback that refetches payment info

3. **Update ready state**:
   - Change "Update payment method (Coming soon)" button to functional
   - On click: set `showPaymentElementModal = true`, `paymentElementMode = "update"`
   - Add PaymentElementModal with `onSuccess` callback that refetches payment info

4. **Add updating state render** (optional placeholder):
   - While PaymentElementModal is open and submitting, could show visual feedback
   - For now, can be handled by modal's own loading states

5. **Implement refetch logic**:
   - Create `handlePaymentSuccess` callback that:
     - Closes modal
     - Calls `handleReAuthSuccess()` to refetch and show updated card
     - Shows success toast

**Integration Point**:
```tsx
<PaymentElementModal
  open={showPaymentElementModal}
  onOpenChange={setShowPaymentElementModal}
  onSuccess={handlePaymentSuccess}
  mode={paymentElementMode}
/>
```

### Step 4 — Update PaymentInfoTab Tests (5 new tests)

**New Tests** for PaymentElementModal integration:

1. **Opens PaymentElementModal on "Add payment method" click** — Modal visible after button click
2. **Opens PaymentElementModal in "add" mode** — Correct mode passed to modal
3. **Refetches payment info on modal success** — After successful payment, shows card data
4. **Opens PaymentElementModal on "Update payment method" click** — Modal visible after button click
5. **Opens PaymentElementModal in "update" mode** — Correct mode passed to modal

These tests complement the existing 15 tests (bringing total to 20 PaymentInfoTab tests).

**All tests PASSING** before moving to Step 5.

### Step 5 — Integration Tests (3 tests)

**Test File**: `src/test/integration/settings-payment-flow.test.tsx`

**Setup**: Render full `SettingsPage`, navigate to Payment Information tab.

**Tests**:

1. **No card → Add payment method → Success**:
   - Click "View payment info" → re-auth
   - See "No payment method on file"
   - Click "Add payment method" → modal opens
   - Mock Stripe confirmSetup + edge function success
   - Verify payment info refetched and card displayed

2. **Ready → Update payment method → Success**:
   - Click "View payment info" → re-auth
   - See existing card
   - Click "Update payment method" → modal opens
   - Mock Stripe confirmSetup + edge function success
   - Verify payment info refetched with new card

3. **Modal error handling**:
   - Click "Add payment method" → modal opens
   - Mock edge function error (e.g., "Stripe not configured")
   - Verify error message shown in modal
   - Verify modal can be closed without crashing

**All tests PASSING** before verification.

## Verification Checklist

1. ✅ All unit tests for PaymentElementModal (8 tests)
2. ✅ All PaymentInfoTab tests including modal integration (20 tests total)
3. ✅ All integration tests for payment flow (3 tests)
4. ✅ `npm test` — All ~370+ tests passing
5. ✅ Manual testing:
   - Navigate to Settings → Payment Information
   - "No payment method" state → "Add payment method" → form appears → card input works
   - Fill Stripe test card (4242 4242 4242 4242) → Submit → Card saved and displayed
   - Click "Update payment method" → form appears → change card → saved
   - Wait 5 minutes → session timeout → locked state

## Test Coverage Summary

- **Phase 1 (Profile Management)**: 343 existing tests
- **Phase 2 (Payment Info Display)**:
  - ReAuthModal: 8 tests
  - PaymentInfoTab (view payment): 15 tests
  - Subtotal: 23 tests
- **Phase 3 (Payment Method Collection)**:
  - PaymentElementModal: 8 tests
  - PaymentInfoTab (with modal integration): 5 new tests
  - Settings payment flow: 3 tests
  - Subtotal: 16 tests
- **Total**: ~382 tests passing

## Constraints & Notes

- Stripe Elements requires `loadStripe()` to be called with publishable key from environment
- SetupIntent `client_secret` should not be exposed to multiple Elements instances — create fresh instance per modal open
- `confirmSetup()` with `redirect: "if_required"` handles 3D Secure automatically
- Payment method attachment is idempotent on the backend (no race condition risk)
- Session timeout still applies during payment method collection (5-minute inactivity limit)
- Modal should close on success, returning to previous state (no_card or ready with new card shown)
