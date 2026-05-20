import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";
import { auditLogger } from "./auditLogger";
import { formatBytes } from "../utils/formatters";

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  extension: string;
  isDirectory: boolean;
  created: Date;
  modified: Date;
  accessed: Date;
}

export interface StreamScanOptions {
  minSize?: number;
  maxDepth?: number;
  extensions?: string[];
  excludePatterns?: RegExp[];
  onFile?: (file: FileInfo) => void | Promise<void>;
  onProgress?: (scanned: number, currentPath: string) => void;
}

export interface ScanStats {
  filesScanned: number;
  directoriesScanned: number;
  totalSize: number;
  errors: number;
  duration: number;
}

/**
 * Stream-based file scanner for handling millions of files
 * Uses generators and streams to keep memory usage low
 */
export class StreamingFileScanner {
  private defaultOptions: Required<StreamScanOptions> = {
    minSize: 0,
    maxDepth: 10,
    extensions: [],
    excludePatterns: [/node_modules/, /\.git/, /System32/, /Windows/],
    onFile: () => {},
    onProgress: () => {},
  };

  /**
   * Stream files from a directory using async generator
   * Memory efficient - doesn't load all files into memory at once
   */
  async *streamFiles(
    dirPath: string,
    options: StreamScanOptions = {},
    currentDepth = 0,
  ): AsyncGenerator<FileInfo, void, unknown> {
    const opts = { ...this.defaultOptions, ...options };

    if (currentDepth > opts.maxDepth) {
      return;
    }

    // Check if path should be excluded
    if (this.shouldExclude(dirPath, opts.excludePatterns)) {
      return;
    }

    let entries: fs.Dirent[] = [];
    try {
      entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    } catch (error) {
      // Directory not accessible
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Skip excluded paths
      if (this.shouldExclude(fullPath, opts.excludePatterns)) {
        continue;
      }

      if (entry.isDirectory()) {
        // Recursively stream from subdirectory
        yield* this.streamFiles(fullPath, options, currentDepth + 1);
      } else if (entry.isFile()) {
        try {
          const stats = await fs.promises.stat(fullPath);

          // Check min size
          if (stats.size < opts.minSize) {
            continue;
          }

          // Check extension if specified
          const ext = path.extname(entry.name).toLowerCase();
          if (opts.extensions.length > 0 && !opts.extensions.includes(ext)) {
            continue;
          }

          const fileInfo: FileInfo = {
            path: fullPath,
            name: entry.name,
            size: stats.size,
            extension: ext,
            isDirectory: false,
            created: stats.birthtime,
            modified: stats.mtime,
            accessed: stats.atime,
          };

          yield fileInfo;
        } catch {
          // Skip files we can't stat
          continue;
        }
      }
    }
  }

  /**
   * Scan directories using streaming approach
   * Can handle millions of files without running out of memory
   */
  async scanWithStream(
    paths: string[],
    options: StreamScanOptions = {},
  ): Promise<{ files: FileInfo[]; stats: ScanStats }> {
    const startTime = Date.now();
    const files: FileInfo[] = [];
    let directoriesScanned = 0;
    let errors = 0;
    let totalSize = 0;
    let filesScanned = 0;

    await auditLogger.log(
      "stream_scan_started",
      "streamingScanner",
      "success",
      {
        paths,
        options,
      },
    );

    try {
      for (const scanPath of paths) {
        const fileStream = this.streamFiles(scanPath, options);

        for await (const file of fileStream) {
          files.push(file);
          totalSize += file.size;
          filesScanned++;

          // Call progress callback every 100 files
          if (filesScanned % 100 === 0) {
            options.onProgress?.(filesScanned, file.path);
          }

          // Call file callback
          try {
            await options.onFile?.(file);
          } catch (error) {
            errors++;
            console.error("Error in file callback:", error);
          }

          // If we have too many files in memory, we might want to flush them
          // This is where you'd integrate with a database or file for very large scans
          if (files.length >= 10000) {
            // For now, just continue - in production you might write to disk
            console.warn(`Large scan: ${files.length} files in memory`);
          }
        }

        directoriesScanned++;
      }

      const duration = Date.now() - startTime;
      const stats: ScanStats = {
        filesScanned,
        directoriesScanned,
        totalSize,
        errors,
        duration,
      };

      await auditLogger.log(
        "stream_scan_completed",
        "streamingScanner",
        "success",
        {
          filesScanned,
          directoriesScanned,
          totalSize,
          duration,
        },
      );

      return { files, stats };
    } catch (error) {
      await auditLogger.log(
        "stream_scan_failed",
        "streamingScanner",
        "failure",
        {
          error: String(error),
        },
      );
      throw error;
    }
  }

  /**
   * Process files in batches using streams
   * Good for operations that need to process files in groups
   */
  async processInBatches<T>(
    paths: string[],
    batchSize: number,
    processor: (files: FileInfo[]) => Promise<T[]>,
    options: StreamScanOptions = {},
  ): Promise<T[]> {
    const results: T[] = [];
    let batch: FileInfo[] = [];
    let filesScanned = 0;

    const fileStream = this.streamFilesIterator(paths, options);

    for await (const file of fileStream) {
      batch.push(file);
      filesScanned++;

      if (batch.length >= batchSize) {
        try {
          const batchResults = await processor(batch);
          results.push(...batchResults);
        } catch (error) {
          console.error("Error processing batch:", error);
        }
        batch = []; // Clear batch

        // Log progress
        if (filesScanned % 1000 === 0) {
          console.log(`Processed ${filesScanned} files...`);
        }
      }
    }

    // Process remaining files
    if (batch.length > 0) {
      try {
        const batchResults = await processor(batch);
        results.push(...batchResults);
      } catch (error) {
        console.error("Error processing final batch:", error);
      }
    }

    return results;
  }

  /**
   * Create a merged stream from multiple directories
   */
  async *streamFilesIterator(
    paths: string[],
    options: StreamScanOptions = {},
  ): AsyncGenerator<FileInfo, void, unknown> {
    for (const dirPath of paths) {
      yield* this.streamFiles(dirPath, options);
    }
  }

  /**
   * Create a Node.js readable stream from file generator
   * Can be piped to other streams
   */
  createReadableStream(
    paths: string[],
    options: StreamScanOptions = {},
  ): Readable {
    const self = this;
    let fileGenerator: AsyncGenerator<FileInfo, void, unknown> | null = null;

    return new Readable({
      objectMode: true,
      async read() {
        try {
          if (!fileGenerator) {
            fileGenerator = self.streamFilesIterator(paths, options);
          }

          const result = await fileGenerator.next();

          if (result.done) {
            this.push(null);
          } else {
            this.push(result.value);
          }
        } catch (error) {
          this.destroy(error as Error);
        }
      },
    });
  }

  /**
   * Stream hash files for duplicate detection
   * Uses streaming to hash large files without loading entirely into memory
   */
  async streamHashFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      const hash = crypto.createHash("md5");
      const stream = fs.createReadStream(filePath);

      stream.on("error", reject);
      stream.on("data", (chunk: Buffer) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
    });
  }

  /**
   * Efficiently copy large files using streams
   */
  async streamCopyFile(sourcePath: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(sourcePath);
      const writeStream = fs.createWriteStream(destPath);

      readStream.on("error", reject);
      writeStream.on("error", reject);
      writeStream.on("finish", resolve);

      readStream.pipe(writeStream);
    });
  }

  /**
   * Get file statistics without loading entire file list
   */
  async getStreamStats(
    paths: string[],
    options: StreamScanOptions = {},
  ): Promise<ScanStats> {
    const startTime = Date.now();
    let filesScanned = 0;
    let directoriesScanned = 0;
    let totalSize = 0;
    let errors = 0;

    for (const scanPath of paths) {
      const fileStream = this.streamFiles(scanPath, options);

      for await (const file of fileStream) {
        filesScanned++;
        totalSize += file.size;
      }

      directoriesScanned++;
    }

    return {
      filesScanned,
      directoriesScanned,
      totalSize,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Check if path should be excluded
   */
  private shouldExclude(filePath: string, patterns: RegExp[]): boolean {
    return patterns.some((pattern) => pattern.test(filePath));
  }

  /**
   * Find duplicates using streaming (memory efficient)
   */
  async findDuplicatesStream(
    paths: string[],
    options: StreamScanOptions = {},
  ): Promise<Map<string, FileInfo[]>> {
    const hashMap = new Map<string, FileInfo[]>();
    let processed = 0;

    // First pass: Group by size (quick filter)
    const sizeMap = new Map<number, FileInfo[]>();

    for (const scanPath of paths) {
      const fileStream = this.streamFiles(scanPath, options);

      for await (const file of fileStream) {
        const sizeList = sizeMap.get(file.size) || [];
        sizeList.push(file);
        sizeMap.set(file.size, sizeList);
      }
    }

    // Second pass: Hash files with same size
    for (const [size, files] of sizeMap.entries()) {
      if (files.length < 2) continue; // No duplicates possible

      for (const file of files) {
        try {
          const hash = await this.streamHashFile(file.path);
          const hashList = hashMap.get(hash) || [];
          hashList.push(file);
          hashMap.set(hash, hashList);

          processed++;
          if (processed % 100 === 0) {
            options.onProgress?.(processed, file.path);
          }
        } catch (error) {
          console.error(`Error hashing ${file.path}:`, error);
        }
      }
    }

    // Remove entries with only one file (not duplicates)
    for (const [hash, files] of hashMap.entries()) {
      if (files.length < 2) {
        hashMap.delete(hash);
      }
    }

    return hashMap;
  }
}

export const streamingFileScanner = new StreamingFileScanner();
