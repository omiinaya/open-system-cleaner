import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { shell } from 'electron';
import { CONSTANTS } from '../constants';
import { formatBytes } from '../utils/formatters';
import { auditLogger } from './auditLogger';
import { sanitizeFilePath, isNonEmptyArray } from '../types/guards';

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

  formatSize(bytes: number): string {
    return formatBytes(bytes);
  }

  /**
   * Get preview information for a file
   */
  async getFilePreview(filePath: string): Promise<{
    type: 'image' | 'text' | 'video' | 'audio' | 'document' | 'archive' | 'binary';
    preview: string;
    canPreview: boolean;
    metadata: {
      size: number;
      created: Date;
      modified: Date;
      accessed: Date;
    };
  }> {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      const metadata = {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
      };

      // Image files
      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(ext)) {
        return {
          type: 'image',
          preview: filePath, // Return path for image preview
          canPreview: true,
          metadata,
        };
      }

      // Text files
      if (['.txt', '.log', '.md', '.json', '.xml', '.csv', '.js', '.ts', '.css', '.html'].includes(ext)) {
        try {
          // Read first 2000 characters
          const content = await fs.readFile(filePath, 'utf-8');
          return {
            type: 'text',
            preview: content.slice(0, 2000) + (content.length > 2000 ? '\n... (truncated)' : ''),
            canPreview: true,
            metadata,
          };
        } catch {
          return {
            type: 'text',
            preview: 'Unable to read text content',
            canPreview: false,
            metadata,
          };
        }
      }

      // Video files
      if (['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'].includes(ext)) {
        return {
          type: 'video',
          preview: filePath,
          canPreview: true,
          metadata,
        };
      }

      // Audio files
      if (['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'].includes(ext)) {
        return {
          type: 'audio',
          preview: filePath,
          canPreview: true,
          metadata,
        };
      }

      // Document files
      if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) {
        return {
          type: 'document',
          preview: `${ext.toUpperCase()} document`,
          canPreview: ext === '.pdf', // Only PDFs can be previewed easily
          metadata,
        };
      }

      // Archive files
      if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(ext)) {
        return {
          type: 'archive',
          preview: `${ext.toUpperCase()} archive`,
          canPreview: false,
          metadata,
        };
      }

      // Default: binary
      return {
        type: 'binary',
        preview: `${ext.toUpperCase()} file (${formatBytes(stats.size)})`,
        canPreview: false,
        metadata,
      };
    } catch (error) {
      return {
        type: 'binary',
        preview: 'Unable to preview file',
        canPreview: false,
        metadata: {
          size: 0,
          created: new Date(),
          modified: new Date(),
          accessed: new Date(),
        },
      };
    }
  }

  /**
   * Delete files with validation and safety checks
   */
  async deleteFiles(filePaths: string[]): Promise<{ 
    success: boolean; 
    freedSpace: number; 
    errors: string[];
  }> {
    const errors: string[] = [];

    // Validate input
    if (!isNonEmptyArray<string>(filePaths)) {
      return { success: false, freedSpace: 0, errors: ['Invalid input: filePaths must be a non-empty array'] };
    }

    // Sanitize paths
    const sanitizedPaths = filePaths.map(p => sanitizeFilePath(p));

    let freedSpace = 0;
    let success = true;

    for (const filePath of sanitizedPaths) {
      // Check if file is protected
      const ext = path.extname(filePath).toLowerCase();
      if (CONSTANTS.PROTECTED_EXTENSIONS.includes(ext)) {
        errors.push(`Protected file skipped: ${filePath}`);
        continue;
      }

      try {
        const stats = await fs.stat(filePath);
        await fs.unlink(filePath);
        freedSpace += stats.size;

        await auditLogger.log('large_file_deleted', 'largeFileFinder', 'success', {
          filePath,
          size: stats.size,
        });
      } catch (error) {
        const errorMsg = `Failed to delete ${filePath}: ${error}`;
        errors.push(errorMsg);
        success = false;

        await auditLogger.log('large_file_delete_failed', 'largeFileFinder', 'failure', {
          filePath,
          error: String(error),
        });
      }
    }

    return { success: success && errors.length === 0, freedSpace, errors };
  }

  /**
   * Move files to trash/recycle bin
   */
  async moveToTrash(filePaths: string[]): Promise<{ 
    success: boolean; 
    freedSpace: number;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!isNonEmptyArray<string>(filePaths)) {
      return { success: false, freedSpace: 0, errors: ['Invalid input: filePaths must be a non-empty array'] };
    }

    const sanitizedPaths = filePaths.map(p => sanitizeFilePath(p));
    let freedSpace = 0;
    let success = true;

    for (const filePath of sanitizedPaths) {
      try {
        const stats = await fs.stat(filePath);
        await shell.trashItem(filePath);
        freedSpace += stats.size;

        await auditLogger.log('large_file_moved_to_trash', 'largeFileFinder', 'success', {
          filePath,
          size: stats.size,
        });
      } catch (error) {
        const errorMsg = `Failed to move ${filePath} to trash: ${error}`;
        errors.push(errorMsg);
        success = false;

        await auditLogger.log('large_file_trash_failed', 'largeFileFinder', 'failure', {
          filePath,
          error: String(error),
        });
      }
    }

    return { success: success && errors.length === 0, freedSpace, errors };
  }
}

export const largeFileFinderService = new LargeFileFinderService();
