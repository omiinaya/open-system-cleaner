import * as fs from "fs/promises";
import * as path from "path";
import { app, shell, dialog } from "electron";
import * as os from "os";
import { CONSTANTS } from "../constants";
import { formatBytes } from "../utils/formatters";
import { auditLogger } from "./auditLogger";
import { sanitizeFilePath, isNonEmptyArray } from "../types/guards";

export interface JunkFile {
  path: string;
  size: number;
  category: "temp" | "cache" | "logs" | "thumbnails" | "recycle";
  lastModified: Date;
}

export interface ScanResult {
  files: JunkFile[];
  totalSize: number;
  categoryBreakdown: Record<string, number>;
}

export class JunkFileScanner {
  /**
   * Safely execute an operation with error recovery
   */
  private async safeOperation<T>(
    operation: () => Promise<T>,
    context: string,
    defaultValue: T,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`[${context}] Operation failed:`, error);
      await auditLogger.log("operation_failed", "junkFileScanner", "failure", {
        context,
        error: String(error),
      });
      return defaultValue;
    }
  }

  /**
   * Check if a file should be protected from deletion
   */
  private shouldProtectFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    if (CONSTANTS.PROTECTED_EXTENSIONS.includes(ext)) {
      return true;
    }

    // Check if in system directory
    const normalizedPath = filePath.toLowerCase();
    return CONSTANTS.SYSTEM_DIRECTORIES.some((dir) =>
      normalizedPath.includes(dir.toLowerCase()),
    );
  }

  /**
   * Show confirmation dialog before destructive operations
   */
  async confirmDelete(
    filePaths: string[],
    totalSize: number,
  ): Promise<"cancel" | "trash" | "delete"> {
    try {
      if (!dialog) {
        // In test environments without Electron, default to cancel
        return "cancel";
      }
      const { response } = await dialog.showMessageBox({
        type: "warning",
        buttons: ["Cancel", "Move to Trash", "Delete Permanently"],
        defaultId: 0,
        title: "Confirm Deletion",
        message: `Delete ${filePaths.length} junk files?`,
        detail: `This will free up ${formatBytes(totalSize)} of space.`,
        checkboxLabel: "Do not ask again for this session",
      });

      const actions: ("cancel" | "trash" | "delete")[] = [
        "cancel",
        "trash",
        "delete",
      ];
      return actions[response] || "cancel";
    } catch {
      // If dialog fails, default to cancel for safety
      return "cancel";
    }
  }

  private junkPatterns = [
    // Temp files
    { pattern: path.join(os.tmpdir(), "*"), category: "temp" as const },
    { pattern: path.join(os.tmpdir(), "**", "*"), category: "temp" as const },
    {
      pattern: path.join(os.homedir(), "AppData", "Local", "Temp", "*"),
      category: "temp" as const,
    },

    // Browser cache
    {
      pattern: path.join(
        os.homedir(),
        "AppData",
        "Local",
        "Google",
        "Chrome",
        "User Data",
        "**",
        "Cache",
        "*",
      ),
      category: "cache" as const,
    },
    {
      pattern: path.join(
        os.homedir(),
        "AppData",
        "Local",
        "Microsoft",
        "Edge",
        "User Data",
        "**",
        "Cache",
        "*",
      ),
      category: "cache" as const,
    },
    {
      pattern: path.join(os.homedir(), ".cache", "**", "*"),
      category: "cache" as const,
    },

    // Logs
    {
      pattern: path.join(os.homedir(), "AppData", "Local", "*", "logs", "*"),
      category: "logs" as const,
    },
    {
      pattern: path.join(os.homedir(), ".var", "log", "**", "*"),
      category: "logs" as const,
    },

    // Thumbnails
    {
      pattern: path.join(
        os.homedir(),
        "AppData",
        "Local",
        "Microsoft",
        "Windows",
        "Explorer",
        "ThumbCache_*.db",
      ),
      category: "thumbnails" as const,
    },
    {
      pattern: path.join(os.homedir(), ".thumbnails", "**", "*"),
      category: "thumbnails" as const,
    },
  ];

  private excludedPaths = [
    "System32",
    "SysWOW64",
    "Windows",
    "ProgramData",
    path.join(os.homedir(), "Documents"),
    path.join(os.homedir(), "Desktop"),
  ];

  /**
   * Scan for junk files with progress tracking and error recovery
   */
  async scan(
    onProgress?: (progress: number, currentFile: string) => void,
  ): Promise<ScanResult> {
    return await this.safeOperation(
      async () => {
        const files: JunkFile[] = [];
        let totalSize = 0;
        const categoryBreakdown: Record<string, number> = {};
        let processedCount = 0;

        await auditLogger.log("scan_started", "junkFileScanner", "success", {
          patternsCount: this.junkPatterns.length,
        });

        for (const { pattern, category } of this.junkPatterns) {
          const dirPath = pattern.replace(/\*$/, "").replace(/\*\*\/\*$/, "");
          const filesInDir = await this.scanDirectory(
            dirPath,
            category,
            pattern.includes("**"),
          );

          for (const file of filesInDir) {
            files.push(file);
            totalSize += file.size;
            categoryBreakdown[category] =
              (categoryBreakdown[category] || 0) + file.size;
          }

          processedCount++;
          if (onProgress) {
            const progress = Math.round(
              (processedCount / this.junkPatterns.length) * 100,
            );
            onProgress(progress, `Scanning ${category}...`);
          }
        }

        await auditLogger.log("scan_completed", "junkFileScanner", "success", {
          filesFound: files.length,
          totalSize,
          categories: Object.keys(categoryBreakdown),
        });

        return { files, totalSize, categoryBreakdown };
      },
      "junkFileScanner.scan",
      { files: [], totalSize: 0, categoryBreakdown: {} },
    );
  }

  private async scanDirectory(
    dirPath: string,
    category: JunkFile["category"],
    recursive: boolean,
  ): Promise<JunkFile[]> {
    const files: JunkFile[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip excluded paths
        if (
          this.excludedPaths.some((excluded) => fullPath.includes(excluded))
        ) {
          continue;
        }

        if (entry.isDirectory() && recursive) {
          const subFiles = await this.scanDirectory(
            fullPath,
            category,
            recursive,
          );
          files.push(...subFiles);
        } else if (entry.isFile()) {
          try {
            const stats = await fs.stat(fullPath);

            // Only include files older than 24 hours
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            if (stats.mtimeMs < oneDayAgo) {
              files.push({
                path: fullPath,
                size: stats.size,
                category,
                lastModified: stats.mtime,
              });
            }
          } catch (error) {
            // Skip files we can't stat
            continue;
          }
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }

    return files;
  }

  /**
   * Clean junk files with validation and safety checks
   */
  async cleanFiles(
    filePaths: string[],
    options: { useTrash?: boolean; skipConfirmation?: boolean } = {},
  ): Promise<{ success: boolean; freedSpace: number; errors: string[] }> {
    const { useTrash = true, skipConfirmation = false } = options;
    const errors: string[] = [];

    // Validate input
    if (!isNonEmptyArray<string>(filePaths)) {
      return {
        success: false,
        freedSpace: 0,
        errors: ["Invalid input: filePaths must be a non-empty array"],
      };
    }

    // Sanitize paths
    const sanitizedPaths = filePaths.map((p) => sanitizeFilePath(p));

    // Filter protected files
    const safePaths = sanitizedPaths.filter((p) => {
      if (this.shouldProtectFile(p)) {
        errors.push(`Protected file skipped: ${p}`);
        return false;
      }
      return true;
    });

    if (safePaths.length === 0) {
      return {
        success: false,
        freedSpace: 0,
        errors: ["No safe files to delete"],
      };
    }

    // Calculate total size
    let totalSize = 0;
    for (const filePath of safePaths) {
      try {
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      } catch {
        // File might not exist
      }
    }

    // Show confirmation if not skipped
    if (!skipConfirmation) {
      const action = await this.confirmDelete(safePaths, totalSize);
      if (action === "cancel") {
        return { success: false, freedSpace: 0, errors: ["User cancelled"] };
      }
      // Update useTrash based on user choice
      const shouldUseTrash = action === "trash";
    }

    // Perform deletion
    let freedSpace = 0;
    let success = true;

    for (const filePath of safePaths) {
      try {
        const stats = await fs.stat(filePath);

        if (useTrash) {
          // Move to trash
          await shell.trashItem(filePath);
        } else {
          // Permanent delete
          await fs.unlink(filePath);
        }

        freedSpace += stats.size;

        await auditLogger.log("file_deleted", "junkFileScanner", "success", {
          filePath,
          size: stats.size,
          useTrash,
        });
      } catch (error) {
        const errorMsg = `Failed to delete ${filePath}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        success = false;

        await auditLogger.log(
          "file_delete_failed",
          "junkFileScanner",
          "failure",
          {
            filePath,
            error: String(error),
          },
        );
      }
    }

    return { success: success && errors.length === 0, freedSpace, errors };
  }

  async cleanByCategory(
    category: JunkFile["category"],
  ): Promise<{ success: boolean; freedSpace: number }> {
    const scanResult = await this.scan();
    const filesToClean = scanResult.files.filter(
      (f) => f.category === category,
    );

    return await this.cleanFiles(filesToClean.map((f) => f.path));
  }
}

export const junkFileScanner = new JunkFileScanner();
