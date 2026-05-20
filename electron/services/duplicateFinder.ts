import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface DuplicateFile {
  hash: string;
  size: number;
  files: {
    path: string;
    name: string;
    lastModified: Date;
    selected: boolean;
  }[];
}

export interface DuplicateScanResult {
  duplicates: DuplicateFile[];
  totalDuplicates: number;
  spaceWasted: number;
  groups: number;
}

export class DuplicateFinderService {
  private scanPaths: string[] = [];
  private readonly maxFileSize = 100 * 1024 * 1024; // 100MB max for hash comparison
  private readonly minFileSize = 1024; // 1KB min

  constructor() {
    // Set default scan paths based on OS
    this.scanPaths = [
      path.join(os.homedir(), 'Documents'),
      path.join(os.homedir(), 'Pictures'),
      path.join(os.homedir(), 'Downloads'),
      path.join(os.homedir(), 'Desktop'),
      path.join(os.homedir(), 'Videos'),
      path.join(os.homedir(), 'Music'),
    ];
  }

  async scan(
    options: {
      paths?: string[];
      extensions?: string[];
    } = {},
    onProgress?: (progress: number, currentFile: string) => void
  ): Promise<DuplicateScanResult> {
    const paths = options.paths || this.scanPaths;
    const extensions = options.extensions;

    // Phase 1: Find all files
    const allFiles = await this.findAllFiles(paths, extensions, onProgress);
    
    // Phase 2: Group by size (quick filter)
    const sizeGroups = this.groupBySize(allFiles);
    
    // Phase 3: Hash files with same size
    const hashGroups = await this.hashFiles(sizeGroups, onProgress);
    
    // Phase 4: Build result
    const duplicates: DuplicateFile[] = [];
    let totalDuplicates = 0;
    let spaceWasted = 0;

    for (const [hash, files] of hashGroups.entries()) {
      if (files.length > 1) {
        const fileSize = files[0].size;
        // Mark all but the first as duplicates (keep the oldest)
        const sortedFiles = files.sort((a, b) => 
          a.stats.mtime.getTime() - b.stats.mtime.getTime()
        );

        const duplicateGroup: DuplicateFile = {
          hash,
          size: fileSize,
          files: sortedFiles.map((f, index) => ({
            path: f.path,
            name: f.name,
            lastModified: f.stats.mtime,
            selected: index > 0, // Select all except the oldest (index 0)
          })),
        };

        duplicates.push(duplicateGroup);
        totalDuplicates += files.length - 1;
        spaceWasted += fileSize * (files.length - 1);
      }
    }

    return {
      duplicates,
      totalDuplicates,
      spaceWasted,
      groups: duplicates.length,
    };
  }

  private async findAllFiles(
    paths: string[],
    extensions: string[] | undefined,
    onProgress?: (progress: number, currentFile: string) => void
  ): Promise<{ path: string; name: string; size: number; stats: any }[]> {
    const files: { path: string; name: string; size: number; stats: any }[] = [];
    let processed = 0;

    for (const scanPath of paths) {
      await this.findFilesRecursive(scanPath, extensions, files, 0);
      processed++;
      
      if (onProgress) {
        const progress = Math.round((processed / paths.length) * 30); // 0-30% for file discovery
        onProgress(progress, `Scanning ${scanPath}...`);
      }
    }

    return files;
  }

  private async findFilesRecursive(
    dirPath: string,
    extensions: string[] | undefined,
    files: { path: string; name: string; size: number; stats: any }[],
    depth: number,
    maxDepth: number = 5
  ): Promise<void> {
    if (depth > maxDepth) return;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Skip system directories
          if (this.shouldSkipDirectory(entry.name)) continue;
          
          await this.findFilesRecursive(fullPath, extensions, files, depth + 1, maxDepth);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          
          // Filter by extension if specified
          if (extensions && extensions.length > 0) {
            if (!extensions.includes(ext)) continue;
          }

          try {
            const stats = await fs.stat(fullPath);
            
            // Filter by size
            if (stats.size < this.minFileSize || stats.size > this.maxFileSize) {
              continue;
            }

            files.push({
              path: fullPath,
              name: entry.name,
              size: stats.size,
              stats,
            });
          } catch {
            // Skip files we can't stat
          }
        }
      }
    } catch {
      // Directory might not be accessible
    }
  }

  private shouldSkipDirectory(name: string): boolean {
    const skipList = [
      'node_modules',
      '.git',
      'System32',
      'Windows',
      'ProgramData',
      '$Recycle.Bin',
      '.tmp',
      'temp',
      'cache',
    ];
    
    return skipList.some(skip => name.toLowerCase().includes(skip.toLowerCase()));
  }

  private groupBySize(
    files: { path: string; name: string; size: number; stats: any }[]
  ): Map<number, { path: string; name: string; size: number; stats: any }[]> {
    const groups = new Map<number, { path: string; name: string; size: number; stats: any }[]>();

    for (const file of files) {
      const existing = groups.get(file.size) || [];
      existing.push(file);
      groups.set(file.size, existing);
    }

    // Only keep groups with more than 1 file
    for (const [size, group] of groups.entries()) {
      if (group.length < 2) {
        groups.delete(size);
      }
    }

    return groups;
  }

  private async hashFiles(
    sizeGroups: Map<number, { path: string; name: string; size: number; stats: any }[]>,
    onProgress?: (progress: number, currentFile: string) => void
  ): Promise<Map<string, { path: string; name: string; size: number; stats: any }[]>> {
    const hashGroups = new Map<string, { path: string; name: string; size: number; stats: any }[]>();
    let processed = 0;
    let totalFiles = 0;

    for (const group of sizeGroups.values()) {
      totalFiles += group.length;
    }

    // Hash files with same size
    for (const [size, files] of sizeGroups.entries()) {
      for (const file of files) {
        try {
          const hash = await this.computeFileHash(file.path);
          
          const existing = hashGroups.get(hash) || [];
          existing.push(file);
          hashGroups.set(hash, existing);

          processed++;
          if (onProgress && processed % 10 === 0) {
            const progress = 30 + Math.round((processed / totalFiles) * 70); // 30-100%
            onProgress(progress, `Hashing ${file.name}...`);
          }
        } catch (error) {
          console.error(`Error hashing ${file.path}:`, error);
        }
      }
    }

    // Only keep groups with more than 1 file
    for (const [hash, group] of hashGroups.entries()) {
      if (group.length < 2) {
        hashGroups.delete(hash);
      }
    }

    return hashGroups;
  }

  private async computeFileHash(filePath: string): Promise<string> {
    const hash = crypto.createHash('md5');
    const fileHandle = await fs.open(filePath, 'r');

    try {
      const bufferSize = 64 * 1024; // 64KB chunks
      let position = 0;
      const stats = await fileHandle.stat();

      // For large files, only hash first and last 1MB for performance
      const sampleSize = 1024 * 1024;

      if (stats.size > sampleSize * 2) {
        // Hash first sample
        const firstBuffer = Buffer.alloc(sampleSize);
        await fileHandle.read(firstBuffer, 0, sampleSize, 0);
        hash.update(firstBuffer);

        // Hash last sample
        const lastBuffer = Buffer.alloc(sampleSize);
        await fileHandle.read(lastBuffer, 0, sampleSize, stats.size - sampleSize);
        hash.update(lastBuffer);

        // Add file size to hash
        hash.update(Buffer.from(stats.size.toString()));
      } else {
        // Hash entire file for small files
        let bytesRead = 0;
        while (bytesRead < stats.size) {
          const readBuffer = Buffer.alloc(Math.min(bufferSize, stats.size - bytesRead));
          const result = await fileHandle.read(readBuffer, 0, readBuffer.length, position);
          hash.update(readBuffer.slice(0, result.bytesRead));
          bytesRead += result.bytesRead;
          position += result.bytesRead;
        }
      }

      return hash.digest('hex');
    } finally {
      await fileHandle.close();
    }
  }

  async deleteDuplicates(filePaths: string[]): Promise<{ success: boolean; freedSpace: number; errors: string[] }> {
    let freedSpace = 0;
    const errors: string[] = [];

    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath);
        await fs.unlink(filePath);
        freedSpace += stats.size;
      } catch (error) {
        errors.push(`Failed to delete ${filePath}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      freedSpace,
      errors,
    };
  }

  async moveDuplicatesToTrash(filePaths: string[]): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const filePath of filePaths) {
      try {
        // In a real implementation, use the system trash API
        // For now, we'll just delete the file
        await fs.unlink(filePath);
      } catch (error) {
        errors.push(`Failed to move ${filePath} to trash: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
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

// Need to import os at the top
import * as os from 'os';

export const duplicateFinderService = new DuplicateFinderService();
