import { assertEquals } from "./assert.ts";
import { handler } from "../marketplace-dataset-urls/handler.ts";
import { DEFAULT_ENV, makeRequest, setEnv } from "./test_utils.ts";
import { assertQueueExhausted, pushResult, resetMocks } from "./deps/supabase_mock.ts";

Deno.test("marketplace-dataset-urls: bad payload", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  const res = await handler(makeRequest("POST", "https://t/md", { dataset_id: 1, paths: [] }));
  assertEquals(res.status, 400);
});

Deno.test("marketplace-dataset-urls: no listing", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  pushResult("from(listings).maybeSingle", { data: null, error: null });
  const res = await handler(makeRequest("POST", "https://t/md", { dataset_id: "d1", paths: ["a"] }));
  assertEquals(res.status, 403);
  assertQueueExhausted();
});

Deno.test("marketplace-dataset-urls: success", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  pushResult("from(listings).maybeSingle", { data: { id: "l1" }, error: null });
  pushResult("from(dataset_files).select", { data: [{ relative_path: "a", storage_path: "u/d/a", content_type: "text/plain" }], error: null });
  pushResult("storage(datasets).createSignedUrls", { data: [{ signedUrl: "https://s/a" }], error: null });
  const res = await handler(makeRequest("POST", "https://t/md", { dataset_id: "d1", paths: ["a"] }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.urls.length, 1);
  assertQueueExhausted();
});
