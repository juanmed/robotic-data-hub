import { assert, assertEquals } from "./assert.ts";
import { handler } from "../generate-api-key/handler.ts";
import { DEFAULT_ENV, makeRequest, MOCK_JWT, setEnv } from "./test_utils.ts";
import { assertQueueExhausted, pushResult, resetMocks } from "./deps/supabase_mock.ts";

Deno.test("generate-api-key: method not allowed", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  const res = await handler(makeRequest("GET", "https://t/gak"));
  assertEquals(res.status, 405);
});

Deno.test("generate-api-key: missing name", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  pushResult("auth.getUser", { data: { user: { id: "u1" } }, error: null });
  const res = await handler(makeRequest("POST", "https://t/gak", {}, { Authorization: MOCK_JWT }));
  assertEquals(res.status, 400);
});

Deno.test("generate-api-key: success", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  pushResult("auth.getUser", { data: { user: { id: "u1" } }, error: null });
  pushResult("from(api_keys).insert.select.single", { data: { id: "k1", name: "cli", key_prefix: "gpai_1234567", created_at: "2026-01-01" }, error: null });

  const res = await handler(makeRequest("POST", "https://t/gak", { name: "cli" }, { Authorization: MOCK_JWT }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.name, "cli");
  assert(typeof body.raw_key === "string");
  assert(body.raw_key.startsWith("gpai_"));
  assertQueueExhausted();
});
