import { assertEquals } from "./assert.ts";
import { handler } from "../dataset-read-urls/handler.ts";
import { DEFAULT_ENV, makeRequest, MOCK_JWT, setEnv } from "./test_utils.ts";
import { assertQueueExhausted, pushResult, resetMocks } from "./deps/supabase_mock.ts";

Deno.test("dataset-read-urls: method not allowed", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  const res = await handler(makeRequest("GET", "https://t/dru"));
  assertEquals(res.status, 405);
});

Deno.test("dataset-read-urls: invalid body", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  pushResult("auth.getUser", { data: { user: { id: "u1" } }, error: null });
  const req = new Request("https://t/dru", { method: "POST", headers: { Authorization: MOCK_JWT, "Content-Type": "application/json" }, body: JSON.stringify({ dataset_id: 3 }) });
  const res = await handler(req);
  assertEquals(res.status, 400);
});

Deno.test("dataset-read-urls: owner success", async () => {
  resetMocks();
  setEnv(DEFAULT_ENV);
  pushResult("auth.getUser", { data: { user: { id: "u1" } }, error: null });
  pushResult("from(datasets).maybeSingle", { data: { id: "d1", user_id: "u1" }, error: null });
  pushResult("from(dataset_files).select", { data: [{ relative_path: "a.txt", storage_path: "u1/d1/a.txt", content_type: "text/plain" }], error: null });
  pushResult("storage(datasets).createSignedUrls", { data: [{ signedUrl: "https://s/a" }], error: null });

  const res = await handler(makeRequest("POST", "https://t/dru", { dataset_id: "d1" }, { Authorization: MOCK_JWT }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.urls.length, 1);
  assertEquals(body.urls[0].relative_path, "a.txt");
  assertQueueExhausted();
});
