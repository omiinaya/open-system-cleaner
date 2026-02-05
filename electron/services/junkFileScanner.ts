import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import * as os from 'os';

export interface JunkFile {
  path: string;
  size: number;
  category: 'temp' | 'cache' | 'logs' | 'thumbnails' | 'recycle';
  lastModified: Date;
}

export interface ScanResult {
  files: JunkFile[];
  totalSize: number;
  categoryBreakdown: Record<string, number>;
}

export class JunkFileScanner {
  private junkPatterns = [
    // Temp files
    { pattern: path.join(os.tmpdir(), '*'), category: 'temp' as const },
    { pattern: path.join(os.tmpdir(), '**', '*'), category: 'temp' as const },
    { pattern: path.join(os.homedir(), 'AppData', 'Local', 'Temp', '*'), category: 'temp' as const },
    
    // Browser cache
    { pattern: path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', '**', 'Cache', '*'), category: 'cache' as const },
    { pattern: path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', '**', 'Cache', '*'), category: 'cache' as const },
    { pattern: path.join(os.homedir(), '.cache', '**', '*'), category: 'cache' as const },
    
    // Logs
    { pattern: path.join(os.homedir(), 'AppData', 'Local', '*', 'logs', '*'), category: 'logs' as const },
    { pattern: path.join(os.homedir(), '.var', 'log', '**', '*'), category: 'logs' as const },
    
    // Thumbnails
    { pattern: path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Windows', 'Explorer', 'ThumbCache_*.db'), category: 'thumbnails' as const },
    { pattern: path.join(os.homedir(), '.thumbnails', '**', '*'), category: 'thumbnails' as const },
  ];

  private excludedPaths = [
    'System32',
    'SysWOW64',
    'Windows',
    'ProgramData',
    path.join(os.homedir(), 'Documents'),
    path.join(os.homedir(), 'Desktop'),
  ];

  async scan(onProgress?: (progress: number, currentFile: string) => void): Promise<ScanResult> {
    const files: JunkFile[] = [];
    let totalSize = 0;
    const categoryBreakdown: Record<string, number> = {};
    let processedCount = 0;

    for (const { pattern, category } of this.junkPatterns) {
      try {
        const dirPath = pattern.replace(/\*$/, '').replace(/\*\*\/\*$/, '');
        const filesInDir = await this.scanDirectory(dirPath, category, pattern.includes('**'));
        
        for (const file of filesInDir) {
          files.push(file);
          totalSize += file.size;
          categoryBreakdown[category] = (categoryBreakdown[category] || 0) + file.size;
        }
        
        processedCount++;
        if (onProgress) {
          const progress = Math.round((processedCount / this.junkPatterns.length) * 100);
          onProgress(progress, `Scanning ${category}...`);
        }
      } catch (error) {
        console.error(`Error scanning pattern ${pattern}:`, error);
      }
    }

    return { files, totalSize, categoryBreakdown };
  }

  private async scanDirectory(dirPath: string, category: JunkFile['category'], recursive: boolean): Promise<JunkFile[]> {
    const files: JunkFile[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip excluded paths
        if (this.excludedPaths.some(excluded => fullPath.includes(excluded))) {
          continue;
        }

        if (entry.isDirectory() && recursive) {
          const subFiles = await this.scanDirectory(fullPath, category, recursive);
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

  async cleanFiles(filePaths: string[]): Promise<{ success: boolean; freedSpace: number }> {
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

  async cleanByCategory(category: JunkFile['category']): Promise<{ success: boolean; freedSpace: number }> {
    const scanResult = await this.scan();
    const filesToClean = scanResult.files.filter(f => f.category === category);
    
    return await this.cleanFiles(filesToClean.map(f => f.path));
  }
}

export const junkFileScanner = new JunkFileScanner();
