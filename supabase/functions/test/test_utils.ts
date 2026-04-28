import { assertEquals } from "./assert.ts";

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

export function assertCorsHeaders(res: Response) {
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
}

export function assertRequestId(res: Response) {
  const id = res.headers.get("x-request-id");
  if (!id) throw new Error("Missing x-request-id header");
}

/** A valid upload-key-format Bearer value (won't match any DB hash). */
export const MOCK_UPLOAD_KEY = "Bearer gpai_upl_testkey1234567890abcdefghij";

/** A JWT-format Bearer value (won't pass real auth). */
export const MOCK_JWT = "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEifQ.mock";
