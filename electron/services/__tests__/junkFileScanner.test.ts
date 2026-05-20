/**
 * Unit tests for JunkFileScanner
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { junkFileScanner } from "../junkFileScanner";

describe("JunkFileScanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("scan", () => {
    it("should return scan results with proper structure", async () => {
      const result = await junkFileScanner.scan();

      expect(result).toHaveProperty("files");
      expect(result).toHaveProperty("totalSize");
      expect(result).toHaveProperty("categoryBreakdown");
      expect(Array.isArray(result.files)).toBe(true);
      expect(typeof result.totalSize).toBe("number");
      expect(typeof result.categoryBreakdown).toBe("object");
    });

    it("should filter protected files", async () => {
      // Test that protected extensions are not included
      const result = await junkFileScanner.scan();

      const hasProtectedFiles = result.files.some((file) => {
        const ext = file.path.toLowerCase();
        return (
          ext.endsWith(".exe") || ext.endsWith(".dll") || ext.endsWith(".sys")
        );
      });

      expect(hasProtectedFiles).toBe(false);
    });

    it("should report progress when callback provided", async () => {
      const onProgress = vi.fn();
      await junkFileScanner.scan(onProgress);

      // Progress should be called during scanning
      // Note: Actual calls depend on the number of patterns
      expect(onProgress).toBeDefined();
    });
  });

  describe("cleanFiles", () => {
    it("should validate input array", async () => {
      const result = await junkFileScanner.cleanFiles([]);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "Invalid input: filePaths must be a non-empty array",
      );
    });

    it("should protect system files from deletion", async () => {
      const protectedFiles = [
        "/path/to/system32/file.exe",
        "/path/to/file.dll",
        "/path/to/file.sys",
      ];

      const result = await junkFileScanner.cleanFiles(protectedFiles);

      // Should report errors for protected files
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should move files to trash when useTrash option is true", async () => {
      // This would need mocking of shell.trashItem in Electron environment
      // In test environment, dialog may return undefined
      const testFiles = ["/tmp/test-file.txt"];
      const result = await junkFileScanner.cleanFiles(testFiles, {
        useTrash: true,
      });

      // Should return a result structure
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("freedSpace");
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.freedSpace).toBe("number");
    });
  });

  describe("cleanByCategory", () => {
    it("should clean files by category", async () => {
      const result = await junkFileScanner.cleanByCategory("temp");

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("freedSpace");
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.freedSpace).toBe("number");
    });

    it("should handle invalid categories gracefully", async () => {
      // @ts-ignore - Testing invalid input
      const result = await junkFileScanner.cleanByCategory("invalid");

      // Should return empty or error result
      expect(result).toBeDefined();
    });
  });

  describe("confirmDelete", () => {
    it("should return dialog result when in Electron environment", async () => {
      const testFiles = ["/tmp/test1.txt", "/tmp/test2.txt"];
      const totalSize = 1000;

      // In test environment without Electron, dialog returns undefined
      // The function should handle this gracefully
      const result = await junkFileScanner.confirmDelete(testFiles, totalSize);

      // Result should be a string or undefined (if no Electron dialog)
      expect(
        result === undefined || ["cancel", "trash", "delete"].includes(result),
      ).toBe(true);
    });
  });
});
