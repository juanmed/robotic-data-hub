import { assertEquals } from "./assert.ts";
import { handler } from "../finalize-dataset-upload/handler.ts";
import { DEFAULT_ENV, makeRequest, MOCK_UPLOAD_KEY, setEnv } from "./test_utils.ts";
import { assertQueueExhausted, pushResult, resetMocks } from "./deps/supabase_mock.ts";

Deno.test("finalize-dataset-upload: unauthorized", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  const res = await handler(makeRequest("POST", "https://t/fdu", { dataset_id: "d1" }));
  assertEquals(res.status, 401);
});

Deno.test("finalize-dataset-upload: missing dataset_id", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  pushResult("from(upload_keys).maybeSingle", { data: { id: "k1", user_id: "u1", revoked_at: null }, error: null });
  const res = await handler(makeRequest("POST", "https://t/fdu", { nope: true }, { Authorization: MOCK_UPLOAD_KEY }));
  assertEquals(res.status, 400);
});

Deno.test("finalize-dataset-upload: ready status", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  pushResult("from(upload_keys).maybeSingle", { data: { id: "k1", user_id: "u1", revoked_at: null }, error: null });
  pushResult("from(datasets).maybeSingle", { data: { id: "d1", user_id: "u1", status: "uploading" }, error: null });
  pushResult("from(dataset_files).select", { data: [{ id: "f1", relative_path: "a", storage_path: "u1/d1/a", upload_status: "pending" }], error: null });
  pushResult("storage(datasets).list", { data: [{ name: "a" }], error: null });
  pushResult("from(dataset_files).update", { error: null });
  pushResult("from(datasets).update", { error: null });
  pushResult("from(upload_keys).update", { error: null });

  const res = await handler(makeRequest("POST", "https://t/fdu", { dataset_id: "d1" }, { Authorization: MOCK_UPLOAD_KEY }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.status, "ready");
  assertQueueExhausted();
});
