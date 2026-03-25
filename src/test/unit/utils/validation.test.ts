import { describe, it, expect } from "vitest";

// Common validation utilities
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return { valid: errors.length === 0, errors };
};

const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

describe("Validation Utilities", () => {
  describe("validateEmail", () => {
    it("accepts valid email addresses", () => {
      expect(validateEmail("user@example.com")).toBe(true);
      expect(validateEmail("test.user@domain.co.uk")).toBe(true);
      expect(validateEmail("user+tag@example.org")).toBe(true);
    });

    it("rejects invalid email addresses", () => {
      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("user @example.com")).toBe(false);
    });

    it("handles edge cases", () => {
      expect(validateEmail("")).toBe(false);
      expect(validateEmail("   ")).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("accepts strong passwords", () => {
      const result = validatePassword("StrongPass123!");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects short passwords", () => {
      const result = validatePassword("Short1!");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("at least 8 characters"))).toBe(true);
    });

    it("requires uppercase letter", () => {
      const result = validatePassword("lowercase123!");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("uppercase"))).toBe(true);
    });

    it("requires number", () => {
      const result = validatePassword("NoNumber!");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("number"))).toBe(true);
    });

    it("requires special character", () => {
      const result = validatePassword("NoSpecial123");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("special"))).toBe(true);
    });

    it("identifies multiple validation failures", () => {
      const result = validatePassword("weak");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe("validateUrl", () => {
    it("accepts valid URLs", () => {
      expect(validateUrl("https://example.com")).toBe(true);
      expect(validateUrl("http://localhost:3000")).toBe(true);
      expect(validateUrl("https://sub.example.co.uk/path?query=value")).toBe(true);
    });

    it("rejects invalid URLs", () => {
      expect(validateUrl("not a url")).toBe(false);
      expect(validateUrl("example.com")).toBe(false);
      expect(validateUrl("")).toBe(false);
    });

    it("handles edge cases", () => {
      expect(validateUrl("   ")).toBe(false);
      expect(validateUrl("://invalid")).toBe(false);
    });
  });
});
