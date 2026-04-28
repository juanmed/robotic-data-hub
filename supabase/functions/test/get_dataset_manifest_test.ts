import { assertEquals } from "./assert.ts";
import { handler } from "../get-dataset-manifest/handler.ts";
import { DEFAULT_ENV, makeRequest, MOCK_JWT, setEnv } from "./test_utils.ts";
import { assertQueueExhausted, pushResult, resetMocks } from "./deps/supabase_mock.ts";

Deno.test("get-dataset-manifest: missing auth", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  const res = await handler(makeRequest("GET", "https://t/gdm?dataset_id=d1"));
  assertEquals(res.status, 401);
});

Deno.test("get-dataset-manifest: post missing dataset_id", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  const res = await handler(makeRequest("POST", "https://t/gdm", {}, { Authorization: MOCK_JWT }));
  assertEquals(res.status, 400);
});

Deno.test("get-dataset-manifest: owner success", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  pushResult("auth.getUser", { data: { user: { id: "u1" } }, error: null });
  pushResult("from(datasets).maybeSingle", { data: { id: "d1", user_id: "u1" }, error: null });
  pushResult("from(dataset_files).select", { data: [{ relative_path: "a", storage_path: "u1/d1/a" }], error: null });
  pushResult("storage(datasets).createSignedUrls", { data: [{ signedUrl: "https://s/a" }], error: null });

  const res = await handler(makeRequest("GET", "https://t/gdm?dataset_id=d1", undefined, { Authorization: MOCK_JWT }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.dataset_id, "d1");
  assertEquals(body.files.length, 1);
  assertQueueExhausted();
});
