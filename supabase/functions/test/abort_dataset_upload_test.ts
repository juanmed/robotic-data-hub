import { assertEquals } from "./assert.ts";
import { handler } from "../abort-dataset-upload/handler.ts";
import { assertCorsHeaders, assertRequestId, DEFAULT_ENV, makeRequest, MOCK_UPLOAD_KEY, setEnv } from "./test_utils.ts";
import { assertQueueExhausted, pushResult, resetMocks } from "./deps/supabase_mock.ts";

Deno.test("abort-dataset-upload: OPTIONS", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  const res = await handler(new Request("https://t/abort", { method: "OPTIONS" }));
  assertEquals(res.status, 200);
  assertCorsHeaders(res);
  assertRequestId(res);
});

Deno.test("abort-dataset-upload: unauthorized without bearer", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  const res = await handler(makeRequest("POST", "https://t/abort", { dataset_id: "d1" }));
  assertEquals(res.status, 401);
});

Deno.test("abort-dataset-upload: success", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  pushResult("from(upload_keys).maybeSingle", { data: { id: "k1", user_id: "u1", revoked_at: null }, error: null });
  pushResult("from(datasets).maybeSingle", { data: { id: "d1", user_id: "u1" }, error: null });
  pushResult("from(dataset_files).select", { data: [{ storage_path: "u1/d1/a.txt" }], error: null });
  pushResult("storage(datasets).remove", { error: null });
  pushResult("from(dataset_files).delete", { error: null });
  pushResult("from(datasets).delete", { error: null });

  const res = await handler(makeRequest("POST", "https://t/abort", { dataset_id: "d1" }, { Authorization: MOCK_UPLOAD_KEY }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.status, "aborted");
  assertRequestId(res);
  assertQueueExhausted();
});
