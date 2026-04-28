export type LogDetails = Record<string, unknown>;

type CorsHeaders = Record<string, string>;

export function serializeError(error: unknown): LogDetails {
  if (error instanceof Error) {
    return {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack ?? null,
    };
  }
  if (typeof error === "object" && error !== null) {
    return { error };
  }
  return { error_message: String(error) };
}

function emit(
  level: "info" | "warn" | "error",
  payload: Record<string, unknown>,
) {
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export function createEdgeLogger(
  functionName: string,
  req: Request,
  corsHeaders: CorsHeaders,
) {
  const startedAt = Date.now();
  const requestId = req.headers.get("x-request-id")?.trim() || crypto.randomUUID();
  const url = new URL(req.url);

  const base = {
    function_name: functionName,
    request_id: requestId,
    method: req.method,
    path: url.pathname,
  };

  const info = (message: string, details: LogDetails = {}) =>
    emit("info", {
      level: "info",
      timestamp: new Date().toISOString(),
      message,
      ...base,
      ...details,
    });

  const warn = (message: string, details: LogDetails = {}) =>
    emit("warn", {
      level: "warn",
      timestamp: new Date().toISOString(),
      message,
      ...base,
      ...details,
    });

  const error = (message: string, details: LogDetails = {}) =>
    emit("error", {
      level: "error",
      timestamp: new Date().toISOString(),
      message,
      ...base,
      ...details,
    });

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "x-request-id": requestId,
      },
    });

  const jsonError = (
    message: string,
    status: number,
    extra: LogDetails = {},
  ) => json(status, { error: message, ...extra });

  const jsonOk = (body: unknown, status = 200) => json(status, body);

  // Logs request_complete with duration and HTTP status, then returns the response.
  // Wrap every return statement with complete() to ensure all paths are instrumented.
  const complete = (response: Response): Response => {
    info("request_complete", {
      http_status: response.status,
      duration_ms: Date.now() - startedAt,
    });
    return response;
  };

  return {
    requestId,
    url,
    info,
    warn,
    error,
    jsonError,
    jsonOk,
    complete,
  };
}
