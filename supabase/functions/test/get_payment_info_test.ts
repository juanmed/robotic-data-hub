import { assertEquals } from "./assert.ts";
import { handler } from "../get-payment-info/handler.ts";
import { DEFAULT_ENV, makeRequest, MOCK_JWT, setEnv } from "./test_utils.ts";
import { assertQueueExhausted, pushResult, resetMocks } from "./deps/supabase_mock.ts";
import { pushStripeMock, resetStripeMocks } from "./deps/stripe_mock.ts";

Deno.test("get-payment-info: method not allowed", async () => {
  resetMocks();
  resetStripeMocks();
  setEnv(DEFAULT_ENV);
  const res = await handler(makeRequest("POST", "https://t/gpi"));
  assertEquals(res.status, 405);
});

Deno.test("get-payment-info: no stripe customer", async () => {
  resetMocks();
  resetStripeMocks();
  setEnv(DEFAULT_ENV);
  pushResult("auth.getUser", { data: { user: { id: "u1" } }, error: null });
  pushResult("from(stripe_customers).maybeSingle", { data: null, error: null });
  const res = await handler(makeRequest("GET", "https://t/gpi", undefined, { Authorization: MOCK_JWT }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.hasPaymentMethod, false);
  assertQueueExhausted();
});

Deno.test("get-payment-info: success", async () => {
  resetMocks();
  resetStripeMocks();
  setEnv(DEFAULT_ENV);
  pushResult("auth.getUser", { data: { user: { id: "u1" } }, error: null });
  pushResult("from(stripe_customers).maybeSingle", { data: { stripe_customer_id: "cus_1" }, error: null });
  pushStripeMock("customers.retrieve", { invoice_settings: { default_payment_method: { card: { last4: "4242", brand: "visa", exp_month: 12, exp_year: 2030 }, billing_details: { name: "A", address: { country: "US", postal_code: "12345" } } } } });
  pushStripeMock("charges.list", { data: [{ id: "ch_1", amount: 100, currency: "usd", status: "succeeded", description: "d", created: 1 }] });
  pushResult("from(payment_audit_log).insert", { error: null });

  const res = await handler(makeRequest("GET", "https://t/gpi", undefined, { Authorization: MOCK_JWT }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.hasPaymentMethod, true);
  assertEquals(body.charges.length, 1);
  assertQueueExhausted();
});
