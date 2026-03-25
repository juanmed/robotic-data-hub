import { describe, it, expect } from "vitest";

// Common array utilities
const unique = <T,>(arr: T[]): T[] => {
  return Array.from(new Set(arr));
};

const groupBy = <T,>(arr: T[], key: keyof T): Record<string, T[]> => {
  return arr.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
};

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const flatten = <T,>(arr: (T | T[])[]): T[] => {
  return arr.reduce((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item as (T | T[])[]) : [item]);
  }, [] as T[]);
};

const findIndex = <T,>(arr: T[], predicate: (item: T) => boolean): number => {
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i])) {
      return i;
    }
  }
  return -1;
};

describe("Array Helper Utilities", () => {
  describe("unique", () => {
    it("removes duplicate primitive values", () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(["a", "b", "a", "c"])).toEqual(["a", "b", "c"]);
    });

    it("preserves order of first occurrence", () => {
      const result = unique([3, 1, 2, 1, 3]);
      expect(result[0]).toBe(3);
      expect(result[1]).toBe(1);
      expect(result[2]).toBe(2);
    });

    it("handles empty array", () => {
      expect(unique([])).toEqual([]);
    });

    it("handles single element", () => {
      expect(unique([1])).toEqual([1]);
    });
  });

  describe("groupBy", () => {
    it("groups objects by property", () => {
      const data = [
        { id: 1, category: "A" },
        { id: 2, category: "B" },
        { id: 3, category: "A" },
      ];

      const grouped = groupBy(data, "category");

      expect(Object.keys(grouped)).toEqual(["A", "B"]);
      expect(grouped["A"]).toHaveLength(2);
      expect(grouped["B"]).toHaveLength(1);
    });

    it("handles numeric grouping keys", () => {
      const data = [
        { id: 1, priority: 1 },
        { id: 2, priority: 2 },
        { id: 3, priority: 1 },
      ];

      const grouped = groupBy(data, "priority");

      expect(grouped["1"]).toHaveLength(2);
      expect(grouped["2"]).toHaveLength(1);
    });
  });

  describe("chunk", () => {
    it("splits array into chunks of specified size", () => {
      const arr = [1, 2, 3, 4, 5];
      const chunks = chunk(arr, 2);

      expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("handles exact division", () => {
      const arr = [1, 2, 3, 4];
      const chunks = chunk(arr, 2);

      expect(chunks).toEqual([[1, 2], [3, 4]]);
    });

    it("handles chunk size larger than array", () => {
      const arr = [1, 2];
      const chunks = chunk(arr, 5);

      expect(chunks).toEqual([[1, 2]]);
    });

    it("handles empty array", () => {
      expect(chunk([], 2)).toEqual([]);
    });
  });

  describe("flatten", () => {
    it("flattens nested arrays", () => {
      const arr = [1, [2, 3], [4, [5, 6]]];
      expect(flatten(arr)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("handles mixed types", () => {
      const arr = [1, [2], 3, [4, 5]];
      expect(flatten(arr)).toEqual([1, 2, 3, 4, 5]);
    });

    it("handles deeply nested arrays", () => {
      const arr = [1, [2, [3, [4, [5]]]]];
      expect(flatten(arr)).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("findIndex", () => {
    it("finds index of matching element", () => {
      const arr = [1, 2, 3, 4, 5];
      expect(findIndex(arr, (x) => x === 3)).toBe(2);
    });

    it("returns -1 when not found", () => {
      const arr = [1, 2, 3];
      expect(findIndex(arr, (x) => x === 99)).toBe(-1);
    });

    it("works with objects", () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
      expect(findIndex(arr, (x) => x.id === 2)).toBe(1);
    });

    it("returns first matching index", () => {
      const arr = [1, 2, 2, 3];
      expect(findIndex(arr, (x) => x === 2)).toBe(1);
    });
  });
});
