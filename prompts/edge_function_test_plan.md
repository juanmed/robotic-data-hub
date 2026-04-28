# Edge Function Test Plan

## Context
The Supabase edge functions have no unit tests, making debugging difficult and regression risk high. This plan implements Option A: Deno-native unit tests with mocked dependencies, hooked into a new CI job alongside the existing Node/Vitest job.

> **Codex review + Lovable review integrated.** Critical changes vs. earlier drafts:
> - Handler split into `handler.ts` + thin `index.ts` (not `import.meta.main` guard)
> - `--no-lock --no-remote` added to test task
> - `supabase/functions/deno.lock` added to `.gitignore`
> - `generate-api-key` and `marketplace-dataset-urls` added to `supabase/config.toml`
> - Mock `insert()` returns real `Promise` (not thenable)
> - `assertRequestId` kept — `x-request-id` IS set by the logging module on all JSON responses

---

## Files to Create / Modify

**New files — infrastructure:**
- `supabase/functions/deno.json`
- `supabase/functions/test/deno.json`
- `supabase/functions/test/deps/supabase_mock.ts`
- `supabase/functions/test/deps/stripe_mock.ts`
- `supabase/functions/test/test_utils.ts`

**New files — handler logic (extracted from index.ts):**
- `supabase/functions/abort-dataset-upload/handler.ts`
- `supabase/functions/create-setup-intent/handler.ts`
- `supabase/functions/dataset-read-urls/handler.ts`
- `supabase/functions/finalize-dataset-upload/handler.ts`
- `supabase/functions/generate-api-key/handler.ts`
- `supabase/functions/get-dataset-manifest/handler.ts`
- `supabase/functions/get-payment-info/handler.ts`
- `supabase/functions/init-dataset-upload/handler.ts`
- `supabase/functions/marketplace-dataset-urls/handler.ts`
- `supabase/functions/update-payment-method/handler.ts`

**New files — tests:**
- `supabase/functions/test/abort_dataset_upload_test.ts`
- `supabase/functions/test/create_setup_intent_test.ts`
- `supabase/functions/test/dataset_read_urls_test.ts`
- `supabase/functions/test/finalize_dataset_upload_test.ts`
- `supabase/functions/test/generate_api_key_test.ts`
- `supabase/functions/test/get_dataset_manifest_test.ts`
- `supabase/functions/test/get_payment_info_test.ts`
- `supabase/functions/test/init_dataset_upload_test.ts`
- `supabase/functions/test/marketplace_dataset_urls_test.ts`
- `supabase/functions/test/update_payment_method_test.ts`

**Modified files:**
- Each `supabase/functions/*/index.ts` — becomes a 2-line wrapper (see Step 1)
- `supabase/config.toml` — add `generate-api-key` and `marketplace-dataset-urls` entries
- `.github/workflows/tests.yml` — add `deno-test` job
- `.gitignore` — add `supabase/functions/deno.lock`

---

## Step 1 — Handler Split (all 10 functions)

### Why not `import.meta.main`
Lovable deploys via Supabase's edge runtime, which can load `index.ts` as a worker import rather than as the main module. In that case `import.meta.main === false` and `Deno.serve` would never run, causing silent 5xx in production.

### The fix: sibling `handler.ts`
Move all logic into `handler.ts` and make `index.ts` a 2-liner. Supabase's edge runtime allows sibling files imported from `index.ts`.

```typescript
// supabase/functions/<name>/handler.ts
// — all current logic, same as the existing index.ts body —
export async function handler(req: Request): Promise<Response> { ... }
```

```typescript
// supabase/functions/<name>/index.ts  (replaces existing file entirely)
import { handler } from "./handler.ts";
Deno.serve(handler);
```

Test files import `handler` from `../create-setup-intent/handler.ts`, so they never touch `Deno.serve`.

> **Constraint**: all env vars (`Deno.env.get(...)`) must be read inside the handler function body, never at module top-level. If a variable is read at import time it won't be injectable in tests via `Deno.env.set`. Currently all 10 functions already follow this pattern — preserve it.

---

## Step 2 — Mock Infrastructure

### `supabase/functions/test/deno.json`
Single source of truth for the import map:

```json
{
  "imports": {
    "https://esm.sh/@supabase/supabase-js@2.49.4": "../test/deps/supabase_mock.ts",
    "https://esm.sh/@supabase/supabase-js@2": "../test/deps/supabase_mock.ts",
    "https://esm.sh/stripe@13.11.0": "../test/deps/stripe_mock.ts"
  }
}
```

Both `@2.49.4` and bare `@2` are mapped because the functions use both specifiers. The test task uses `--no-remote`, so any esm.sh URL not covered by this map causes an immediate test failure rather than a silent network call.

### `supabase/functions/test/deps/supabase_mock.ts`

Method-scoped queues prevent order-dependent false positives. A `callLog` array lets tests assert which tables and buckets were actually queried. `insert()` returns a real `Promise` (via `Object.assign`) so `.catch()` chains work correctly in addition to `await`.

```typescript
const _queues: Record<string, Array<unknown>> = {};
export const callLog: Array<{ method: string; args: unknown[] }> = [];

export function pushResult(method: string, result: unknown) {
  (_queues[method] ??= []).push(result);
}

function pop(method: string, fallback: unknown): unknown {
  const q = _queues[method];
  return q?.length ? q.shift() : fallback;
}

export function resetMocks() {
  for (const k of Object.keys(_queues)) delete _queues[k];
  callLog.length = 0;
}

export function assertQueueExhausted() {
  for (const [k, q] of Object.entries(_queues)) {
    if (q.length > 0) throw new Error(`Unconsumed mock results for "${k}": ${q.length} remaining`);
  }
}

class QueryBuilder {
  constructor(private _table: string, private _filters: Record<string, unknown> = {}) {}

  select(_cols?: string) { return this; }
  eq(col: string, val: unknown) { this._filters[col] = val; return this; }
  in(col: string, vals: unknown[]) { this._filters[col] = vals; return this; }
  limit(_n: number) { return this; }
  order(_col: string) { return this; }

  maybeSingle() {
    const key = `from(${this._table}).maybeSingle`;
    callLog.push({ method: key, args: [{ ...this._filters }] });
    return Promise.resolve(pop(key, { data: null, error: null }));
  }
  single() {
    const key = `from(${this._table}).single`;
    callLog.push({ method: key, args: [{ ...this._filters }] });
    return Promise.resolve(pop(key, { data: null, error: null }));
  }

  insert(row: unknown) {
    const key = `from(${this._table}).insert`;
    callLog.push({ method: key, args: [row] });
    // Return a real Promise augmented with .select() so both usage patterns work:
    //   await supabase.from("t").insert({})               → { error }
    //   await supabase.from("t").insert({}).select().single() → { data, error }
    const basePromise = Promise.resolve(pop(key, { error: null }));
    return Object.assign(basePromise, {
      select: (_cols?: string) => ({
        single: () => Promise.resolve(pop(`${key}.select.single`, { data: null, error: null })),
      }),
    });
  }

  update(row: unknown) {
    const key = `from(${this._table}).update`;
    callLog.push({ method: key, args: [row] });
    return {
      eq: (_col: string, _val: unknown) =>
        Promise.resolve(pop(key, { error: null })),
    };
  }

  delete() {
    const key = `from(${this._table}).delete`;
    callLog.push({ method: key, args: [{ ...this._filters }] });
    return {
      eq: (_col: string, _val: unknown) =>
        Promise.resolve(pop(key, { error: null })),
    };
  }
}

class StorageMock {
  private _bucket = "";
  from(bucket: string) { this._bucket = bucket; return this; }

  remove(paths: string[]) {
    const key = `storage(${this._bucket}).remove`;
    callLog.push({ method: key, args: [paths] });
    return Promise.resolve(pop(key, { error: null }));
  }
  list(folder: string, opts?: unknown) {
    const key = `storage(${this._bucket}).list`;
    callLog.push({ method: key, args: [folder, opts] });
    return Promise.resolve(pop(key, { data: [], error: null }));
  }
  createSignedUrls(paths: string[], exp: number) {
    const key = `storage(${this._bucket}).createSignedUrls`;
    callLog.push({ method: key, args: [paths, exp] });
    return Promise.resolve(pop(key, {
      data: paths.map((_, i) => ({ signedUrl: `https://mock-signed-${i}` })),
      error: null,
    }));
  }
  createSignedUploadUrl(path: string) {
    const key = `storage(${this._bucket}).createSignedUploadUrl`;
    callLog.push({ method: key, args: [path] });
    return Promise.resolve(pop(key, { data: { signedUrl: "https://mock-upload-url" }, error: null }));
  }
}

class MockAuthClient {
  getUser() {
    callLog.push({ method: "auth.getUser", args: [] });
    return Promise.resolve(pop("auth.getUser", { data: { user: null }, error: { message: "no mock" } }));
  }
}

class MockClient {
  auth = new MockAuthClient();
  storage = new StorageMock();
  from(table: string) { return new QueryBuilder(table); }
}

export function createClient(_url: string, _key: string, _opts?: unknown) {
  return new MockClient();
}
```

### `supabase/functions/test/deps/stripe_mock.ts`

```typescript
const _queues: Record<string, Array<unknown>> = {};
export const stripeCallLog: Array<{ method: string; args: unknown[] }> = [];

export function pushStripeMock(method: string, val: unknown) {
  (_queues[method] ??= []).push(val);
}

function pop(method: string, fallback: unknown): unknown {
  const q = _queues[method];
  return q?.length ? q.shift() : fallback;
}

export function resetStripeMocks() {
  for (const k of Object.keys(_queues)) delete _queues[k];
  stripeCallLog.length = 0;
}

export class Stripe {
  constructor(_key: string) {}
  customers = {
    create: async (args: unknown) => {
      stripeCallLog.push({ method: "customers.create", args: [args] });
      return pop("customers.create", { id: "cus_mock" });
    },
    retrieve: async (id: string, opts?: unknown) => {
      stripeCallLog.push({ method: "customers.retrieve", args: [id, opts] });
      return pop("customers.retrieve", { invoice_settings: { default_payment_method: null } });
    },
    update: async (id: string, args: unknown) => {
      stripeCallLog.push({ method: "customers.update", args: [id, args] });
      return pop("customers.update", {});
    },
  };
  setupIntents = {
    create: async (args: unknown) => {
      stripeCallLog.push({ method: "setupIntents.create", args: [args] });
      return pop("setupIntents.create", { client_secret: "seti_mock_secret" });
    },
    retrieve: async (id: string) => {
      stripeCallLog.push({ method: "setupIntents.retrieve", args: [id] });
      return pop("setupIntents.retrieve", { status: "succeeded", customer: "cus_mock" });
    },
  };
  paymentMethods = {
    attach: async (id: string, args: unknown) => {
      stripeCallLog.push({ method: "paymentMethods.attach", args: [id, args] });
      return pop("paymentMethods.attach", {});
    },
  };
  charges = {
    list: async (args: unknown) => {
      stripeCallLog.push({ method: "charges.list", args: [args] });
      return pop("charges.list", { data: [] });
    },
  };
}
```

### `supabase/functions/test/test_utils.ts`

```typescript
import { assertEquals } from "jsr:@std/assert";

export const DEFAULT_ENV = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "mock-service-key",
  SUPABASE_ANON_KEY: "mock-anon-key",
  SUPABASE_PUBLISHABLE_KEY: "mock-publishable-key",
  STRIPE_SECRET_KEY: "sk_test_mock",
};

export function setEnv(vars: Record<string, string>) {
  for (const [k, v] of Object.entries(vars)) Deno.env.set(k, v);
}

export function makeRequest(
  method: string,
  url: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/** Assert CORS headers are present (required on all responses). */
export function assertCorsHeaders(res: Response) {
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
}

/**
 * Assert x-request-id is present.
 * All JSON responses set this via the logging module's json() helper,
 * which always injects "x-request-id": requestId into response headers.
 */
export function assertRequestId(res: Response) {
  const id = res.headers.get("x-request-id");
  if (!id) throw new Error("Missing x-request-id header");
}

/** A valid upload-key-format Bearer value (won't match any DB hash). */
export const MOCK_UPLOAD_KEY = "Bearer gpai_upl_testkey1234567890abcdefghij";

/** A JWT-format Bearer value (won't pass real auth). */
export const MOCK_JWT = "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEifQ.mock";
```

---

## Step 3 — Test Isolation Strategy

- **Serial execution**: `--jobs=1` prevents global mock state contamination between concurrent tests.
- **Per-test reset**: every test calls `resetMocks()` and `resetStripeMocks()` at the top.
- **Queue exhaustion**: every happy-path test ends with `assertQueueExhausted()` to catch misconfigured mock setup.
- **Env writes**: `Deno.env.set` is idempotent for these keys across tests. No teardown needed as long as env vars are never read at module load time (enforced by the handler split in Step 1).

---

## Step 4 — config.toml Addition

`supabase/config.toml` currently lists 8 functions with `verify_jwt = false`. `generate-api-key` and `marketplace-dataset-urls` are absent, meaning they default to `verify_jwt = true` — which conflicts with their code doing manual auth (or no auth at all for marketplace). Add both:

```toml
[functions.generate-api-key]
verify_jwt = false

[functions.marketplace-dataset-urls]
verify_jwt = false
```

---

## Step 5 — Critical Test Cases Per Function

Standard cases that apply to **every** function:
- OPTIONS → 200 + CORS headers
- Wrong method → 405 + CORS headers
- Missing/malformed Bearer → 401
- Dependency throws unexpectedly → 500 `{"error":"Internal server error"}`

### abort-dataset-upload

| # | Scenario | Expected |
|---|----------|----------|
| 1 | OPTIONS | 200, CORS |
| 2 | GET method | 405 |
| 3 | Missing Authorization | 401 |
| 4 | Bearer without `gpai_upl_` prefix | 401 |
| 5 | Bearer `gpai_upl_` but extra whitespace in token | 401 |
| 6 | Key hash not in DB | 401 |
| 7 | Key revoked | 403 |
| 8 | Malformed JSON body | 400 |
| 9 | `dataset_id` is a number, not string | 400 |
| 10 | Dataset not found | 404 |
| 11 | Dataset owned by different user | 403 |
| 12 | Storage delete fails (non-fatal) — DB cleanup succeeds | 200 `{status:"aborted"}` |
| 13 | File records delete fails | 500 |
| 14 | Dataset delete fails | 500 |
| 15 | Dependency throws unexpectedly | 500 |
| 16 | Happy path | 200 `{status:"aborted", dataset_id}`, `x-request-id` present |
| 17 | Idempotent repeat call (dataset already gone) | 404 |

### create-setup-intent

| # | Scenario | Expected |
|---|----------|----------|
| 1 | OPTIONS | 200, CORS |
| 2 | GET method | 405 |
| 3 | Missing Bearer | 401 |
| 4 | Lowercase `bearer` prefix | 401 |
| 5 | JWT auth fails | 401 |
| 6 | `STRIPE_SECRET_KEY` env unset | 500 |
| 7 | Existing Stripe customer | 200 `{client_secret, customerId}` |
| 8 | New customer — Stripe API throws | 500 |
| 9 | New customer — DB insert fails | 500 |
| 10 | New customer — success | 200 `{client_secret, customerId}` |

### dataset-read-urls

| # | Scenario | Expected |
|---|----------|----------|
| 1 | OPTIONS | 200, CORS |
| 2 | GET method | 405 |
| 3 | Missing Bearer | 401 |
| 4 | Invalid JWT | 401 |
| 5 | Malformed JSON | 400 |
| 6 | `dataset_id` is `null` | 400 |
| 7 | `dataset_id` is a number | 400 |
| 8 | Dataset not found | 404 |
| 9 | Owner access | 200 `{urls:[...]}` |
| 10 | Submitter access | 200 `{urls:[...]}` |
| 11 | Challenge owner access | 200 `{urls:[...]}` |
| 12 | Access denied | 403 |
| 13 | No files with `upload_status=uploaded` | 200 `{urls:[]}` |
| 14 | `paths` filter applied | 200 with filtered subset |
| 15 | Signed URL generation fails | 500 |
| 16 | DB throws on challenge_submissions lookup | 500 |

### finalize-dataset-upload

| # | Scenario | Expected |
|---|----------|----------|
| 1 | OPTIONS | 200, CORS |
| 2 | GET method | 405 |
| 3 | Invalid key format | 401 |
| 4 | Key not in DB | 401 |
| 5 | Revoked key | 403 |
| 6 | Invalid dataset_id | 400 |
| 7 | Dataset not found | 404 |
| 8 | Access denied | 403 |
| 9 | All files present → `status:"ready"` | 200 |
| 10 | Partial upload → `status:"uploading"`, `missing_files` present | 200 |
| 11 | Empty dataset (no files) → status stays `"uploading"` | 200 |
| 12 | Storage list error | 500 |
| 13 | File status update error | 500 |
| 14 | Dataset status update error | 500 |
| 15 | Idempotent re-finalize (all already uploaded) | 200 `{status:"ready"}` |

### generate-api-key

| # | Scenario | Expected |
|---|----------|----------|
| 1 | OPTIONS | 200, CORS |
| 2 | GET method | 405 |
| 3 | Missing Authorization | 401 |
| 4 | Invalid JWT | 401 |
| 5 | Malformed JSON | 400 |
| 6 | `name` missing | 400 |
| 7 | `name` is `123` (not string) | 400 |
| 8 | DB insert fails | 500 |
| 9 | Success — assert `raw_key` starts with `gpai_` and shape matches `{id, name, key_prefix, created_at, raw_key}` (value is non-deterministic; assert shape only) | 200 |

### get-dataset-manifest

| # | Scenario | Expected |
|---|----------|----------|
| 1 | OPTIONS | 200, CORS |
| 2 | Missing Bearer | 401 |
| 3 | DELETE method | 405 |
| 4 | POST — malformed JSON | 400 |
| 5 | POST — missing dataset_id | 400 |
| 6 | GET — `?dataset_id=uuid` | 200 |
| 7 | GET — path-based `/get-dataset-manifest/uuid` | 200 |
| 8 | Invalid JWT | 401 |
| 9 | Dataset not found | 404 |
| 10 | Owner access | 200 `{dataset_id, files:[{relative_path, signed_url}]}` |
| 11 | Submitter access | 200 |
| 12 | Challenge owner access | 200 |
| 13 | Access denied | 403 with `reason` field |
| 14 | No uploaded files | 404 |
| 15 | Signed URL error | 500 |

### get-payment-info

| # | Scenario | Expected |
|---|----------|----------|
| 1 | OPTIONS | 200, CORS |
| 2 | POST method | 405 |
| 3 | Missing Bearer | 401 |
| 4 | Invalid JWT | 401 |
| 5 | DB error on `stripe_customers` | 500 |
| 6 | No stripe customer | 200 `{hasPaymentMethod:false}` |
| 7 | Stripe key missing | 500 |
| 8 | Customer deleted on Stripe side (`{ deleted: true }`) | 200 `{hasPaymentMethod:false}` |
| 9 | No default payment method | 200 `{hasPaymentMethod:false}` |
| 10 | Default payment method is non-card | 200 `{hasPaymentMethod:false}` |
| 11 | Success with card + charges | 200 `{hasPaymentMethod:true, card, billing, charges}` |
| 12 | Audit log insert fails (non-fatal) | 200 |

### init-dataset-upload

| # | Scenario | Expected |
|---|----------|----------|
| 1 | OPTIONS | 200, CORS |
| 2 | GET method | 405 |
| 3 | Invalid key format | 401 |
| 4 | Key not in DB | 401 |
| 5 | Revoked key | 403 |
| 6 | Missing `display_name` | 400 |
| 7 | `display_name` is a number | 400 |
| 8 | `files` is not an array | 400 |
| 9 | `files` is empty array | 400 |
| 10 | File entry missing `path` | 400 |
| 11 | File entry with `path: ""` | 400 |
| 12 | Dataset insert fails | 500 |
| 13 | File record insert fails (second file in multi-file upload) | 500 |
| 14 | Signed upload URL fails | 500 |
| 15 | Single file success | 200 `{dataset_id, upload_instructions}` |
| 16 | Multi-file success — assert all paths present in `upload_instructions` | 200 |

### marketplace-dataset-urls

| # | Scenario | Expected |
|---|----------|----------|
| 1 | OPTIONS | 200, CORS |
| 2 | GET method | 405 |
| 3 | Malformed JSON | 400 |
| 4 | Missing `dataset_id` | 400 |
| 5 | `dataset_id` is a number | 400 |
| 6 | Missing `paths` | 400 |
| 7 | `paths` is a string | 400 |
| 8 | `paths` is empty array | 400 |
| 9 | `paths.length === 11` (over limit) | 400 |
| 10 | `paths.length === 10` (boundary) | 200 |
| 11 | Listing lookup DB error | 500 |
| 12 | No published listing | 403 |
| 13 | Files lookup DB error | 500 |
| 14 | No files match given paths | 200 `{urls:[]}` |
| 15 | Success | 200 `{urls:[{relative_path, signed_url, content_type}]}` |

### update-payment-method

| # | Scenario | Expected |
|---|----------|----------|
| 1 | OPTIONS | 200, CORS |
| 2 | GET method | 405 |
| 3 | Missing Bearer | 401 |
| 4 | Invalid JWT | 401 |
| 5 | Malformed JSON | 400 |
| 6 | Missing `setup_intent_id` | 400 |
| 7 | Missing `payment_method_id` | 400 |
| 8 | DB error on `stripe_customers` | 500 |
| 9 | Stripe customer not found | 404 |
| 10 | Stripe key missing | 500 |
| 11 | SetupIntent status `"requires_payment_method"` | 400 |
| 12 | SetupIntent status `"requires_action"` | 400 |
| 13 | SetupIntent status `"processing"` | 400 |
| 14 | SetupIntent customer mismatch | 403 |
| 15 | `paymentMethods.attach` throws | 500 |
| 16 | Success | 200 `{success:true}` |
| 17 | Audit log insert fails (non-fatal) | 200 |
| 18 | Idempotent re-call (`attach` is idempotent in Stripe) | 200 |

---

## Step 6 — Deno Config

### `supabase/functions/deno.json`
```json
{
  "tasks": {
    "test": "deno test --allow-env --jobs=1 --no-lock --no-remote --config test/deno.json test/"
  }
}
```

- `--jobs=1`: serial execution, prevents global mock state contamination
- `--no-lock`: prevents generating/reading `deno.lock` (Lovable excludes this file from the repo)
- `--no-remote`: any esm.sh URL not covered by the import map causes an immediate hard failure rather than a silent network fetch

---

## Step 7 — `.gitignore` Addition

```
# Deno lock file — excluded per Lovable deployment requirements
supabase/functions/deno.lock
```

---

## Step 8 — CI Workflow Addition

Add a second job to `.github/workflows/tests.yml`. Use `deno task test` so all flags stay in one place (`deno.json`) and the CI command automatically stays in sync:

```yaml
deno-test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: denoland/setup-deno@v2
      with:
        deno-version: v2.x
    - name: Run edge function tests
      run: cd supabase/functions && deno task test
```

No secrets needed — all external calls are intercepted by mocks. This job is independent from the existing `test` job and will not be blocked by fork-PR secret unavailability.

---

## Verification

1. `cd supabase/functions && deno task test` — all tests pass locally, no network calls
2. Confirm `supabase/functions/deno.lock` is not generated (due to `--no-lock`)
3. Open a PR to `develop` → CI shows both `test` (Node/Vitest) and `deno-test` jobs green
4. Introduce an intentional bug in one `handler.ts` (e.g. return 200 instead of 404 for dataset-not-found) and confirm the relevant test fails
5. Verify Lovable deploys successfully — `index.ts` is still the entry point and `Deno.serve` is unconditional


---

## Original feedback from lovable:


I got the following feedback from Lovable. Read the feedback carefully and make the necessary changes such that the testing and modifications are in line with what lovable expected when deploying edge functions, etc:

Review: Issues with the Edge Function Test Plan
The plan is solid overall — handler extraction, mocked deps, and a parallel CI job are all reasonable. But there are several concrete issues that will bite you given how Lovable deploys edge functions and how your existing code is structured.

🔴 Critical issues
1. import.meta.main is unreliable for Lovable's edge function deployment. Lovable Cloud deploys functions via Supabase's edge runtime, which does not always invoke index.ts as the main module — it can be loaded as a worker import, where import.meta.main is false. If that happens, Deno.serve(handler) never runs and your function returns 5xx in production. This is the single highest-risk change in the plan. Fix: export the handler AND keep an unconditional Deno.serve(handler) at the bottom. Tests import handler directly and never trigger Deno.serve because they don't import the module — wait, they do. Better fix: put the handler in a sibling file (e.g. handler.ts) and have index.ts be a 2-liner: import { handler } from "./handler.ts"; Deno.serve(handler);. Tests import handler.ts only.

Note however: Lovable's deployer expects a single index.ts per function folder. Sibling files are allowed as long as they're imported from index.ts — confirm by inspecting supabase/functions/get-dataset-manifest/index.ts if it already uses helpers (it likely doesn't, but multi-file functions do work in Supabase edge runtime).

2. The import map at supabase/functions/test/deno.json will silently fail to apply unless invoked correctly. deno test --config test/deno.json test/ sets the config relative to CWD (supabase/functions), which works — but the handler files themselves live in supabase/functions/<name>/index.ts and import esm.sh URLs. The import map paths use ../test/deps/..., which resolves correctly only for handler files one level deep. ✅ This part actually works. However, if you ever add a handler that imports something else from esm.sh that's not in the map (e.g., adding zod later), tests will hit the network. The plan acknowledges this but doesn't enforce --no-remote or --cached-only, which would make the failure loud immediately. Fix: add --no-remote to the test task so any unmapped esm.sh import fails fast offline.

3. The plan does not mention deno.lock, which is the #1 cause of silent edge function deploy failures on Lovable. Lovable's memory note explicitly says: "the deno.lock file should be excluded from the repository". Running deno test locally or in CI will generate or update deno.lock in supabase/functions/. If that file gets committed via a sync from your local machine, edge function redeploys may start failing silently. Fix: add supabase/functions/deno.lock to .gitignore as part of this PR, and pass --no-lock to the test task.

🟡 Medium issues
4. CI job will fail on PRs from forks because denoland/setup-deno@v2 is fine, but your existing tests.yml references secrets.VITE_SUPABASE_* — these aren't available to fork PRs. The new deno-test job doesn't need secrets (good), but make sure it doesn't get gated by a failing test job. Since they're independent jobs in the matrix, this is fine — just confirm.

5. Deno.env.set is not actually idempotent across tests in the way the plan claims. If any handler reads STRIPE_SECRET_KEY at module load (none currently do — all read inside the handler ✅), you'd be stuck. Worth a one-line note: "all secrets must be read inside the handler, never at module top-level." Several future-developer footguns avoided.

6. Mock QueryBuilder.insert().then(...) is a thenable, not a Promise. Most existing handlers use await adminClient.from(...).insert(...) — a thenable works for await, but .catch() chains won't. None of your current handlers chain .catch() on inserts (I verified create-setup-intent and update-payment-method), so this is fine today, but brittle. Consider returning a real Promise.

7. update-payment-method test #11 expects 400 for SetupIntent status "requires_payment_method" — the actual code returns "SetupIntent not confirmed" for any non-succeeded status. Test is correct in outcome but should probably parametrize over requires_action, processing, etc., not just one value. Cosmetic.

🟢 Minor / cosmetic
8. test/test_utils.ts references assertRequestId and x-request-id headers — none of your current handlers set this header. Either add it to handlers (probably a good idea for observability) or drop the assertion from the standard suite.

9. Plan says "10 functions" but supabase/config.toml lists 8 functions with verify_jwt = false, plus generate-api-key and marketplace-dataset-urls (which aren't in config.toml — they default to verify_jwt = true). Verify the count and confirm whether those two should also be verify_jwt = false (they probably should, given they do their own auth).

10. supabase/functions/deno.json task is deno test --config test/deno.json test/ — but the test files import handlers via relative paths like ../create-setup-intent/index.ts. That works. Just confirm Deno picks up the config when CWD is supabase/functions/ (it does with the cd in CI ✅).

Summary of required changes before implementation
Don't rely on import.meta.main — split into handler.ts + thin index.ts, OR test via fetch against a locally-spawned Deno.serve (slower but bulletproof).
Add supabase/functions/deno.lock to .gitignore and pass --no-lock --no-remote to the test task.
Verify marketplace-dataset-urls and generate-api-key have correct verify_jwt settings in config.toml — the plan tests them assuming manual JWT handling.
Drop assertRequestId unless you're also adding the header to handlers in the same PR.
Convert mock thenables to real Promises for forward-compat.
Everything else (method-scoped queues, serial execution, queue exhaustion checks, mock isolation strategy) is well-designed and aligns with Lovable's constraints. The plan is ~85% there — fix items 1–3 and you're good to implement.

---


## Here's what's been completed so far and what remains for Codex:

Done:

supabase/functions/deno.json — Deno task config with --jobs=1 --no-lock --no-remote
supabase/functions/test/deno.json — Import map redirecting esm.sh URLs to mocks
supabase/functions/test/deps/supabase_mock.ts — Method-scoped mock queues, pushResult/resetMocks/assertQueueExhausted, real Promise from insert()
supabase/functions/test/deps/stripe_mock.ts — Stripe mock with per-method queues
supabase/functions/test/test_utils.ts — makeRequest, assertCorsHeaders, assertRequestId, MOCK_UPLOAD_KEY, MOCK_JWT, DEFAULT_ENV
supabase/functions/abort-dataset-upload/handler.ts — Logic extracted from index.ts
supabase/functions/create-setup-intent/handler.ts — Logic extracted from index.ts

Remaining for Codex (per prompts/edge_function_test_plan.md):

Create handler.ts for the remaining 8 functions (dataset-read-urls, finalize-dataset-upload, generate-api-key, get-dataset-manifest, get-payment-info, init-dataset-upload, marketplace-dataset-urls, update-payment-method)
Rewrite all 10 index.ts files to 2-line wrappers: import { handler } from "./handler.ts"; Deno.serve(handler);
Write all 10 *_test.ts files under supabase/functions/test/
Update supabase/config.toml to add [functions.generate-api-key] and [functions.marketplace-dataset-urls] with verify_jwt = false
Add supabase/functions/deno.lock to .gitignore
Add deno-test job to .github/workflows/tests.yml