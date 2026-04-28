import { assertEquals } from "./assert.ts";
import { handler } from "../init-dataset-upload/handler.ts";
import { DEFAULT_ENV, makeRequest, MOCK_UPLOAD_KEY, setEnv } from "./test_utils.ts";
import { assertQueueExhausted, pushResult, resetMocks } from "./deps/supabase_mock.ts";

Deno.test("init-dataset-upload: invalid auth", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  const res = await handler(makeRequest("POST", "https://t/idu", {}));
  assertEquals(res.status, 401);
});

Deno.test("init-dataset-upload: invalid files", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  pushResult("from(upload_keys).maybeSingle", { data: { id: "k1", user_id: "u1", revoked_at: null }, error: null });
  const res = await handler(makeRequest("POST", "https://t/idu", { display_name: "d", files: [] }, { Authorization: MOCK_UPLOAD_KEY }));
  assertEquals(res.status, 400);
});

Deno.test("init-dataset-upload: success", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  pushResult("from(upload_keys).maybeSingle", { data: { id: "k1", user_id: "u1", revoked_at: null }, error: null });
  pushResult("from(datasets).insert.select.single", { data: { id: "d1" }, error: null });
  pushResult("from(dataset_files).insert", { error: null });
  pushResult("storage(datasets).createSignedUploadUrl", { data: { signedUrl: "https://up/a" }, error: null });
  pushResult("from(upload_keys).update", { error: null });

  const res = await handler(makeRequest("POST", "https://t/idu", { display_name: "dataset", files: [{ path: "a.txt" }] }, { Authorization: MOCK_UPLOAD_KEY }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.dataset_id, "d1");
  assertEquals(body.upload_instructions["a.txt"].url, "https://up/a");
  assertQueueExhausted();
});
