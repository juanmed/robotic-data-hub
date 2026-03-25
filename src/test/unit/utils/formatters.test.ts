import { describe, it, expect } from "vitest";

// Common formatter utilities
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};

describe("Formatter Utilities", () => {
  describe("formatBytes", () => {
    it("formats bytes to human-readable size", () => {
      expect(formatBytes(0)).toBe("0 Bytes");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1024 * 1024)).toBe("1 MB");
      expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
    });

    it("handles fractional sizes", () => {
      const result = formatBytes(1536); // 1.5 KB
      expect(result).toContain("KB");
      expect(result).toMatch(/1\.\d+ KB/);
    });

    it("handles large files", () => {
      const result = formatBytes(1024 * 1024 * 1024 * 5);
      expect(result).toContain("GB");
    });
  });

  describe("formatDuration", () => {
    it("formats seconds", () => {
      expect(formatDuration(30)).toBe("30s");
      expect(formatDuration(45)).toBe("45s");
    });

    it("formats minutes and seconds", () => {
      expect(formatDuration(90)).toBe("1m 30s");
      expect(formatDuration(125)).toBe("2m 5s");
    });

    it("formats hours, minutes, and seconds", () => {
      expect(formatDuration(3661)).toBe("1h 1m 1s");
      expect(formatDuration(7200)).toBe("2h");
    });

    it("handles zero", () => {
      expect(formatDuration(0)).toBe("0s");
    });
  });

  describe("formatDate", () => {
    it("formats date to readable string", () => {
      const date = new Date("2026-03-15");
      const formatted = formatDate(date);
      expect(formatted).toContain("Mar");
      expect(formatted).toContain("15");
      expect(formatted).toContain("2026");
    });

    it("handles different dates", () => {
      const date1 = new Date("2026-01-01");
      const date2 = new Date("2026-12-31");

      expect(formatDate(date1)).toContain("Jan");
      expect(formatDate(date2)).toContain("Dec");
    });
  });

  describe("truncateText", () => {
    it("returns full text if under max length", () => {
      const text = "Short";
      expect(truncateText(text, 10)).toBe("Short");
    });

    it("truncates and adds ellipsis", () => {
      const text = "This is a long text that needs truncation";
      expect(truncateText(text, 20)).toBe("This is a long te...");
      expect(truncateText(text, 20).length).toBeLessThanOrEqual(20);
    });

    it("handles exact length match", () => {
      const text = "Exact";
      expect(truncateText(text, 5)).toBe("Exact");
    });

    it("handles very short max length", () => {
      expect(truncateText("Hello World", 3)).toContain("...");
    });

    it("handles edge case of max length 3", () => {
      const result = truncateText("Hello", 3);
      expect(result).toBe("...");
    });
  });
});
