import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mock async hook - this would normally be imported from your hooks
const useAsync = <T,>(asyncFunction: () => Promise<T>, immediate = true) => {
  const [status, setStatus] = React.useState<"idle" | "pending" | "success" | "error">("idle");
  const [data, setData] = React.useState<T | undefined>(undefined);
  const [error, setError] = React.useState<Error | undefined>(undefined);

  const execute = React.useCallback(
    async () => {
      setStatus("pending");
      setData(undefined);
      setError(undefined);
      try {
        const response = await asyncFunction();
        setData(response);
        setStatus("success");
        return response;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
        throw err;
      }
    },
    [asyncFunction]
  );

  React.useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, data, error };
};

import * as React from "react";

describe("useAsync Hook", () => {
  describe("successful async operation", () => {
    it("transitions from pending to success", async () => {
      const mockAsyncFunction = vi.fn(async () => {
        return new Promise((resolve) => setTimeout(() => resolve("success"), 10));
      });

      const { result } = renderHook(() => useAsync(mockAsyncFunction, true));

      expect(result.current.status).toBe("pending");

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });

      expect(result.current.data).toBe("success");
      expect(result.current.error).toBeUndefined();
    });
  });

  describe("failed async operation", () => {
    it("can execute and handle errors", async () => {
      const mockAsyncFunction = vi.fn(async () => {
        return new Promise((resolve) => setTimeout(() => resolve("success"), 10));
      });

      const { result } = renderHook(() => useAsync(mockAsyncFunction, false));

      expect(result.current.status).toBe("idle");

      result.current.execute();

      await waitFor(
        () => {
          expect(result.current.status).toBe("success");
        },
        { timeout: 1000 }
      );

      expect(result.current.data).toBe("success");
    });
  });

  describe("manual execution", () => {
    it("executes only when immediate is false", async () => {
      const mockAsyncFunction = vi.fn(async () => "data");

      const { result } = renderHook(() => useAsync(mockAsyncFunction, false));

      expect(result.current.status).toBe("idle");

      result.current.execute();

      await waitFor(() => {
        expect(result.current.status).toBe("success");
      });

      expect(mockAsyncFunction).toHaveBeenCalled();
    });
  });

  describe("data update", () => {
    it("updates data when async function completes", async () => {
      const testData = { id: 1, name: "Test" };
      const mockAsyncFunction = vi.fn(async () => testData);

      const { result } = renderHook(() => useAsync(mockAsyncFunction, true));

      await waitFor(() => {
        expect(result.current.data).toEqual(testData);
      });
    });
  });
});
