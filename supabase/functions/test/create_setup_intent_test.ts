import { assertEquals } from "./assert.ts";
import { handler } from "../create-setup-intent/handler.ts";
import { assertCorsHeaders, DEFAULT_ENV, makeRequest, MOCK_JWT, setEnv } from "./test_utils.ts";
import { assertQueueExhausted, pushResult, resetMocks } from "./deps/supabase_mock.ts";
import { pushStripeMock, resetStripeMocks } from "./deps/stripe_mock.ts";

Deno.test("create-setup-intent: OPTIONS", async () => {
  resetMocks();
  resetStripeMocks();
  setEnv(DEFAULT_ENV);
  const res = await handler(new Request("https://t/csi", { method: "OPTIONS" }));
  assertEquals(res.status, 200);
  assertCorsHeaders(res);
});

Deno.test("create-setup-intent: unauthorized", async () => {
  resetMocks();
  resetStripeMocks();
  setEnv(DEFAULT_ENV);
  const res = await handler(makeRequest("POST", "https://t/csi", {}));
  assertEquals(res.status, 401);
});

Deno.test("create-setup-intent: success existing customer", async () => {
  resetMocks();
  resetStripeMocks();
  setEnv(DEFAULT_ENV);
  pushResult("auth.getUser", { data: { user: { id: "u1", email: "a@b.co" } }, error: null });
  pushResult("from(stripe_customers).maybeSingle", { data: { stripe_customer_id: "cus_1" }, error: null });
  pushStripeMock("setupIntents.create", { client_secret: "seti_secret" });

  const res = await handler(makeRequest("POST", "https://t/csi", {}, { Authorization: MOCK_JWT }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.customerId, "cus_1");
  assertEquals(body.client_secret, "seti_secret");
  assertQueueExhausted();
});
