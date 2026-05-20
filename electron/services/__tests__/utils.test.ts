/**
 * Unit tests for utility functions
 */
import { describe, it, expect } from "vitest";
import {
  formatBytes,
  formatDuration,
  formatNumber,
  formatPercentage,
} from "../../utils/formatters";
import {
  isValidStringArray,
  isNonEmptyArray,
  sanitizeFilePath,
} from "../../types/guards";
import { CircuitBreaker } from "../../utils/circuitBreaker";

describe("formatBytes", () => {
  it("should format 0 bytes correctly", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("should format bytes correctly", () => {
    expect(formatBytes(512)).toBe("512 Bytes");
  });

  it("should format KB correctly", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });

  it("should format MB correctly", () => {
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
  });

  it("should format GB correctly", () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
  });

  it("should respect decimal places", () => {
    expect(formatBytes(1536, 0)).toBe("2 KB");
    expect(formatBytes(1536, 2)).toBe("1.5 KB");
  });
});

describe("formatDuration", () => {
  it("should format milliseconds", () => {
    expect(formatDuration(500)).toBe("500ms");
  });

  it("should format seconds", () => {
    expect(formatDuration(5000)).toBe("5s");
  });

  it("should format minutes", () => {
    expect(formatDuration(120000)).toBe("2m");
  });

  it("should format hours", () => {
    expect(formatDuration(7200000)).toBe("2h");
  });
});

describe("formatNumber", () => {
  it("should format small numbers", () => {
    expect(formatNumber(100)).toBe("100");
  });

  it("should format thousands with commas", () => {
    expect(formatNumber(1000)).toBe("1,000");
  });

  it("should format large numbers", () => {
    expect(formatNumber(1000000)).toBe("1,000,000");
  });
});

describe("formatPercentage", () => {
  it("should format percentage with default decimals", () => {
    expect(formatPercentage(50)).toBe("50.0%");
  });

  it("should format percentage with custom decimals", () => {
    expect(formatPercentage(50, 0)).toBe("50%");
    expect(formatPercentage(50.123, 2)).toBe("50.12%");
  });
});

describe("Type Guards", () => {
  describe("isValidStringArray", () => {
    it("should return true for valid string array", () => {
      expect(isValidStringArray(["a", "b", "c"])).toBe(true);
    });

    it("should return false for non-array", () => {
      expect(isValidStringArray("not an array")).toBe(false);
    });

    it("should return false for array with non-strings", () => {
      expect(isValidStringArray(["a", 1, "c"])).toBe(false);
    });
  });

  describe("isNonEmptyArray", () => {
    it("should return true for non-empty array", () => {
      expect(isNonEmptyArray([1, 2, 3])).toBe(true);
    });

    it("should return false for empty array", () => {
      expect(isNonEmptyArray([])).toBe(false);
    });

    it("should return false for non-array", () => {
      expect(isNonEmptyArray(null)).toBe(false);
    });
  });

  describe("sanitizeFilePath", () => {
    it("should normalize backslashes", () => {
      expect(sanitizeFilePath("path\\to\\file")).toBe("path/to/file");
    });

    it("should remove path traversal attempts", () => {
      expect(sanitizeFilePath("../../etc/passwd")).toBe("etc/passwd");
    });

    it("should handle normal paths", () => {
      expect(sanitizeFilePath("/home/user/file.txt")).toBe(
        "/home/user/file.txt",
      );
    });
  });
});

describe("CircuitBreaker", () => {
  it("should start in CLOSED state", () => {
    const cb = new CircuitBreaker("test", { failureThreshold: 3 });
    expect(cb.getState()).toBe("CLOSED");
  });

  it("should execute successfully", async () => {
    const cb = new CircuitBreaker("test");
    const result = await cb.execute(async () => "success");
    expect(result).toBe("success");
  });

  it("should track failures", async () => {
    const cb = new CircuitBreaker("test", { failureThreshold: 3 });

    try {
      await cb.execute(async () => {
        throw new Error("fail");
      });
    } catch {}

    expect(cb.getFailureCount()).toBe(1);
  });

  it("should trip after threshold failures", async () => {
    const cb = new CircuitBreaker("test", { failureThreshold: 2 });

    try {
      await cb.execute(async () => {
        throw new Error("fail");
      });
    } catch {}

    try {
      await cb.execute(async () => {
        throw new Error("fail");
      });
    } catch {}

    expect(cb.getState()).toBe("OPEN");
  });

  it("should allow manual reset", async () => {
    const cb = new CircuitBreaker("test", { failureThreshold: 1 });

    try {
      await cb.execute(async () => {
        throw new Error("fail");
      });
    } catch {}

    expect(cb.getState()).toBe("OPEN");

    cb.forceReset();
    expect(cb.getState()).toBe("CLOSED");
  });
});
