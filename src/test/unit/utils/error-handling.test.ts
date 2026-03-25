import { describe, it, expect } from "vitest";

// Error handling utilities
class AppError extends Error {
  constructor(public code: string, message: string, public statusCode: number = 500) {
    super(message);
    this.name = "AppError";
  }
}

const createError = (code: string, message: string, statusCode: number = 500): AppError => {
  return new AppError(code, message, statusCode);
};

const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
};

const shouldRetry = (error: AppError): boolean => {
  return (
    error.statusCode >= 500 || // Server errors
    error.statusCode === 408 || // Request timeout
    error.code === "NETWORK_ERROR" ||
    error.code === "TIMEOUT"
  );
};

const safeJsonParse = <T,>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

describe("Error Handling Utilities", () => {
  describe("createError", () => {
    it("creates an AppError with code and message", () => {
      const error = createError("INVALID_INPUT", "Input validation failed", 400);

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe("INVALID_INPUT");
      expect(error.message).toBe("Input validation failed");
      expect(error.statusCode).toBe(400);
    });

    it("defaults to status 500", () => {
      const error = createError("INTERNAL_ERROR", "Something went wrong");

      expect(error.statusCode).toBe(500);
    });
  });

  describe("isAppError", () => {
    it("identifies AppError instances", () => {
      const appError = createError("TEST", "Test error");
      const regularError = new Error("Regular error");

      expect(isAppError(appError)).toBe(true);
      expect(isAppError(regularError)).toBe(false);
    });

    it("handles non-Error values", () => {
      expect(isAppError("string")).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
    });
  });

  describe("getErrorMessage", () => {
    it("extracts message from Error objects", () => {
      const error = new Error("Error message");
      expect(getErrorMessage(error)).toBe("Error message");
    });

    it("returns string as-is", () => {
      expect(getErrorMessage("String error")).toBe("String error");
    });

    it("handles non-Error values", () => {
      expect(getErrorMessage(null)).toBe("An unknown error occurred");
      expect(getErrorMessage(123)).toBe("An unknown error occurred");
      expect(getErrorMessage({})).toBe("An unknown error occurred");
    });

    it("works with AppError", () => {
      const error = createError("TEST", "Test message");
      expect(getErrorMessage(error)).toBe("Test message");
    });
  });

  describe("shouldRetry", () => {
    it("returns true for server errors (5xx)", () => {
      expect(shouldRetry(createError("SERVER_ERROR", "Error", 500))).toBe(true);
      expect(shouldRetry(createError("SERVICE_UNAVAILABLE", "Error", 503))).toBe(true);
    });

    it("returns true for request timeout", () => {
      expect(shouldRetry(createError("TIMEOUT", "Request timeout", 408))).toBe(true);
    });

    it("returns true for network errors", () => {
      expect(shouldRetry(createError("NETWORK_ERROR", "Network failed"))).toBe(true);
    });

    it("returns false for client errors (4xx excluding 408)", () => {
      expect(shouldRetry(createError("INVALID_INPUT", "Bad request", 400))).toBe(false);
      expect(shouldRetry(createError("UNAUTHORIZED", "Unauthorized", 401))).toBe(false);
      expect(shouldRetry(createError("NOT_FOUND", "Not found", 404))).toBe(false);
    });

    it("returns false for non-retryable errors", () => {
      expect(shouldRetry(createError("PERMISSION_DENIED", "Access denied", 403))).toBe(false);
    });
  });

  describe("safeJsonParse", () => {
    it("parses valid JSON", () => {
      const result = safeJsonParse('{"key": "value"}', {});
      expect(result).toEqual({ key: "value" });
    });

    it("returns fallback on invalid JSON", () => {
      const fallback = { default: true };
      const result = safeJsonParse("invalid json", fallback);
      expect(result).toEqual(fallback);
    });

    it("parses arrays", () => {
      const result = safeJsonParse("[1, 2, 3]", []);
      expect(result).toEqual([1, 2, 3]);
    });

    it("parses null and primitives", () => {
      expect(safeJsonParse("null", {})).toBeNull();
      expect(safeJsonParse('"string"', "")).toBe("string");
      expect(safeJsonParse("123", 0)).toBe(123);
    });

    it("handles malformed JSON with fallback", () => {
      const fallback = { error: true };
      const result = safeJsonParse('{"incomplete": ', fallback);
      expect(result).toEqual(fallback);
    });
  });
});
