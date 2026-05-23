import type { ScanResult } from "../services/junkFileScanner";
import type { SystemMetrics } from "../services/systemMetrics";
import type { ProcessInfo } from "../services/ramOptimizer";

/**
 * Type guard for ScanResult
 */
export function isValidScanResult(obj: unknown): obj is ScanResult {
  return (
    obj &&
    typeof obj === "object" &&
    Array.isArray(obj.files) &&
    typeof obj.totalSize === "number" &&
    obj.totalSize >= 0
  );
}

/**
 * Type guard for SystemMetrics
 */
export function isValidSystemMetrics(obj: unknown): obj is SystemMetrics {
  return (
    obj &&
    typeof obj === "object" &&
    obj.cpu &&
    typeof obj.cpu.usage === "number" &&
    obj.memory &&
    typeof obj.memory.total === "number" &&
    obj.memory.total > 0 &&
    obj.disk &&
    typeof obj.disk.total === "number" &&
    obj.disk.total > 0
  );
}

/**
 * Type guard for ProcessInfo array
 */
export function isValidProcessInfoArray(obj: unknown): obj is ProcessInfo[] {
  return (
    Array.isArray(obj) &&
    obj.every(
      (p) =>
        typeof p.pid === "number" &&
        typeof p.name === "string" &&
        typeof p.memory === "number",
    )
  );
}

/**
 * Type guard for string array
 */
export function isValidStringArray(obj: unknown): obj is string[] {
  return Array.isArray(obj) && obj.every((item) => typeof item === "string");
}

/**
 * Validate file paths (prevent path traversal)
 */
export function sanitizeFilePath(filePath: string): string {
  // Normalize path
  const normalized = filePath.replace(/\\/g, "/");

  // Remove path traversal attempts
  const sanitized = normalized
    .replace(/^(\.\.\/)+/, "")
    .replace(/\/\.\.\//g, "/");

  return sanitized;
}

/**
 * Validate that an array is non-empty
 */
export function isNonEmptyArray<T>(obj: unknown): obj is T[] {
  return Array.isArray(obj) && obj.length > 0;
}

/**
 * Validate file extension is safe
 */
export function isSafeFileExtension(
  ext: string,
  protectedExts: string[],
): boolean {
  const lowerExt = ext.toLowerCase();
  return !protectedExts.includes(lowerExt);
}
