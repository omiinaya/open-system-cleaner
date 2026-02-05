import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface LargeFile {
  path: string;
  size: number;
  name: string;
  extension: string;
  lastAccessed: Date;
}

export interface LargeFileScanResult {
  files: LargeFile[];
  totalSize: number;
  count: number;
}

export class LargeFileFinderService {
  private minSizeMB = 100; // Default 100MB minimum
  private maxDepth = 5;
  private maxFiles = 1000; // Limit to prevent memory issues
  private scannedCount = 0;
  
  private excludedPaths = [
    'Windows',
    'Program Files',
    'Program Files (x86)',
    'System32',
    'SysWOW64',
    'node_modules',
    '.git',
    '$Recycle.Bin',
    'Recovery',
  ];

  private scanPaths: string[] = [];

  constructor() {
    // Set default scan paths based on OS
    if (process.platform === 'win32') {
      this.scanPaths = [
        os.homedir(),
        path.join(os.homedir(), 'Downloads'),
        path.join(os.homedir(), 'Documents'),
        path.join(os.homedir(), 'Desktop'),
        path.join(os.homedir(), 'Videos'),
        'C:\\',
      ];
    } else {
      this.scanPaths = [
        os.homedir(),
        path.join(os.homedir(), 'Downloads'),
        path.join(os.homedir(), 'Documents'),
        '/home',
        '/media',
        '/mnt',
      ];
    }
  }

  async scan(
    options: { 
      minSizeMB?: number; 
      paths?: string[];
      extensions?: string[];
    } = {},
    onProgress?: (progress: number, currentFile: string) => void
  ): Promise<LargeFileScanResult> {
    const minSize = (options.minSizeMB || this.minSizeMB) * 1024 * 1024;
    const paths = options.paths || this.scanPaths;
    const targetExtensions = options.extensions;
    
    const files: LargeFile[] = [];
    this.scannedCount = 0;

    for (const scanPath of paths) {
      try {
        await this.scanDirectory(
          scanPath, 
          minSize, 
          targetExtensions, 
          files, 
          0,
          onProgress,
          paths.length
        );
      } catch (error) {
        console.error(`Error scanning path ${scanPath}:`, error);
      }
    }

    // Sort by size (largest first)
    files.sort((a, b) => b.size - a.size);

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    return {
      files,
      totalSize,
      count: files.length,
    };
  }

  private async scanDirectory(
    dirPath: string,
    minSize: number,
    targetExtensions: string[] | undefined,
    files: LargeFile[],
    depth: number,
    onProgress: ((progress: number, currentFile: string) => void) | undefined,
    totalPaths: number
  ): Promise<void> {
    if (depth > this.maxDepth || files.length >= this.maxFiles) {
      return;
    }

    // Check if path is excluded
    if (this.excludedPaths.some(excluded => dirPath.includes(excluded))) {
      return;
    }

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this.scanDirectory(
            fullPath,
            minSize,
            targetExtensions,
            files,
            depth + 1,
            onProgress,
            totalPaths
          );
        } else if (entry.isFile()) {
          this.scannedCount++;
          
          try {
            const stats = await fs.stat(fullPath);

            // Check if file is large enough
            if (stats.size < minSize) {
              continue;
            }

            // Check extension if specified
            const extension = path.extname(entry.name).toLowerCase();
            if (targetExtensions && targetExtensions.length > 0) {
              if (!targetExtensions.includes(extension)) {
                continue;
              }
            }

            files.push({
              path: fullPath,
              size: stats.size,
              name: entry.name,
              extension,
              lastAccessed: stats.atime,
            });

            // Report progress every 100 files
            if (this.scannedCount % 100 === 0 && onProgress) {
              const progress = Math.min(95, Math.round((this.scannedCount / 5000) * 100));
              onProgress(progress, entry.name);
            }

          } catch {
            // Skip files we can't access
          }
        }

        // Stop if we hit the limit
        if (files.length >= this.maxFiles) {
          break;
        }
      }
    } catch {
      // Directory might not exist or be accessible
    }
  }

  async deleteFiles(filePaths: string[]): Promise<{ success: boolean; freedSpace: number }> {
    let freedSpace = 0;
    let success = true;

    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath);
        await fs.unlink(filePath);
        freedSpace += stats.size;
      } catch (error) {
        console.error(`Failed to delete ${filePath}:`, error);
        success = false;
      }
    }

    return { success, freedSpace };
  }

  async moveToTrash(filePaths: string[]): Promise<{ success: boolean; freedSpace: number }> {
    // For now, just delete the files
    // In a real implementation, you'd move them to the system trash/recycle bin
    return await this.deleteFiles(filePaths);
  }

  formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

export const largeFileFinderService = new LargeFileFinderService();
