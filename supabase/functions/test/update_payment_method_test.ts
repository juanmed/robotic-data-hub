import { assertEquals } from "./assert.ts";
import { handler } from "../update-payment-method/handler.ts";
import { DEFAULT_ENV, makeRequest, MOCK_JWT, setEnv } from "./test_utils.ts";
import { assertQueueExhausted, pushResult, resetMocks } from "./deps/supabase_mock.ts";
import { pushStripeMock, resetStripeMocks } from "./deps/stripe_mock.ts";

Deno.test("update-payment-method: missing auth", async () => {
  resetMocks();
  resetStripeMocks();
  setEnv(DEFAULT_ENV);
  const res = await handler(makeRequest("POST", "https://t/upm", {}));
  assertEquals(res.status, 401);
});

Deno.test("update-payment-method: missing fields", async () => {
  resetMocks();
  resetStripeMocks();
  setEnv(DEFAULT_ENV);
  pushResult("auth.getUser", { data: { user: { id: "u1" } }, error: null });
  const res = await handler(makeRequest("POST", "https://t/upm", {}, { Authorization: MOCK_JWT }));
  assertEquals(res.status, 400);
});

Deno.test("update-payment-method: success", async () => {
  resetMocks();
  resetStripeMocks();
  setEnv(DEFAULT_ENV);
  pushResult("auth.getUser", { data: { user: { id: "u1" } }, error: null });
  pushResult("from(stripe_customers).maybeSingle", { data: { stripe_customer_id: "cus_1" }, error: null });
  pushStripeMock("setupIntents.retrieve", { status: "succeeded", customer: "cus_1" });
  pushStripeMock("paymentMethods.attach", {});
  pushStripeMock("customers.update", {});
  pushResult("from(payment_audit_log).insert", { error: null });

  const res = await handler(makeRequest("POST", "https://t/upm", { setup_intent_id: "seti_1", payment_method_id: "pm_1" }, { Authorization: MOCK_JWT }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
  assertQueueExhausted();
});
