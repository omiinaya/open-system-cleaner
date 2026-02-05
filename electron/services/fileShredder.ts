import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type ShreddingMethod = 'standard' | 'secure' | 'military';

export interface ShredResult {
  success: boolean;
  filesShredded: number;
  spaceFreed: number;
  errors: string[];
}

export class FileShredderService {
  private methods = {
    standard: { passes: 1, pattern: 'random' },
    secure: { passes: 3, pattern: 'dod5220' },
    military: { passes: 7, pattern: 'gutmann' },
  };

  async shredFiles(filePaths: string[], method: ShreddingMethod = 'standard'): Promise<ShredResult> {
    const result: ShredResult = {
      success: true,
      filesShredded: 0,
      spaceFreed: 0,
      errors: [],
    };

    for (const filePath of filePaths) {
      try {
        const shredResult = await this.shredFile(filePath, method);
        if (shredResult.success) {
          result.filesShredded++;
          result.spaceFreed += shredResult.size;
        } else {
          result.errors.push(`Failed to shred ${filePath}: ${shredResult.error}`);
        }
      } catch (error) {
        result.errors.push(`Error shredding ${filePath}: ${error}`);
        result.success = false;
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }

  private async shredFile(
    filePath: string,
    method: ShreddingMethod
  ): Promise<{ success: boolean; size: number; error?: string }> {
    try {
      const stats = await fs.stat(filePath);
      const isDirectory = stats.isDirectory();

      if (isDirectory) {
        // For directories, recursively shred all files then remove the directory
        await this.shredDirectory(filePath, method);
        return { success: true, size: stats.size };
      }

      // Get file size for result
      const fileSize = stats.size;

      // Open file for writing
      const fd = await fs.open(filePath, 'r+');

      try {
        const config = this.methods[method];

        for (let pass = 0; pass < config.passes; pass++) {
          const pattern = this.getPattern(config.pattern, pass, fileSize);
          await this.writePattern(fd, pattern);
        }

        // Final pass: fill with zeros
        const zeroBuffer = Buffer.alloc(4096, 0);
        let written = 0;
        while (written < fileSize) {
          const toWrite = Math.min(4096, fileSize - written);
          await fd.write(zeroBuffer.slice(0, toWrite), 0, toWrite, written);
          written += toWrite;
        }

        // Sync to ensure data is written to disk
        await fd.sync();
      } finally {
        await fd.close();
      }

      // Rename file multiple times to obscure the name
      await this.obscureFilename(filePath);

      // Finally delete the file
      await fs.unlink(filePath);

      return { success: true, size: fileSize };
    } catch (error) {
      return { success: false, size: 0, error: String(error) };
    }
  }

  private async shredDirectory(dirPath: string, method: ShreddingMethod): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        await this.shredDirectory(fullPath, method);
      } else {
        await this.shredFile(fullPath, method);
      }
    }

    // Remove the directory itself
    await fs.rmdir(dirPath);
  }

  private getPattern(pattern: string, pass: number, fileSize: number): Buffer {
    switch (pattern) {
      case 'dod5220':
        // DoD 5220.22-M standard: pass 1 = 0x00, pass 2 = 0xFF, pass 3 = random
        if (pass === 0) return Buffer.alloc(fileSize, 0x00);
        if (pass === 1) return Buffer.alloc(fileSize, 0xFF);
        return crypto.randomBytes(fileSize);
      
      case 'gutmann':
        // Gutmann method: use specific patterns for each pass
        return this.getGutmannPattern(pass, fileSize);
      
      case 'random':
      default:
        // Standard random overwrite
        return crypto.randomBytes(fileSize);
    }
  }

  private getGutmannPattern(pass: number, fileSize: number): Buffer {
    // Simplified Gutmann patterns
    const patterns = [
      Buffer.from([0x55, 0x55]),
      Buffer.from([0xAA, 0xAA]),
      Buffer.from([0x92, 0x49, 0x24]),
      Buffer.from([0x49, 0x24, 0x92]),
      Buffer.from([0x24, 0x92, 0x49]),
      Buffer.from([0x00]),
      Buffer.from([0x11]),
      Buffer.from([0x22]),
      Buffer.from([0x33]),
      Buffer.from([0x44]),
      Buffer.from([0x55]),
      Buffer.from([0x66]),
      Buffer.from([0x77]),
      Buffer.from([0x88]),
      Buffer.from([0x99]),
      Buffer.from([0xAA]),
      Buffer.from([0xBB]),
      Buffer.from([0xCC]),
      Buffer.from([0xDD]),
      Buffer.from([0xEE]),
      Buffer.from([0xFF]),
      Buffer.from([0x92, 0x49, 0x24]),
      Buffer.from([0x49, 0x24, 0x92]),
      Buffer.from([0x24, 0x92, 0x49]),
      Buffer.from([0x6D, 0xB6, 0xDB]),
      Buffer.from([0xB6, 0xDB, 0x6D]),
      Buffer.from([0xDB, 0x6D, 0xB6]),
    ];

    if (pass < patterns.length) {
      return Buffer.alloc(fileSize, patterns[pass][0]);
    }
    
    // Random for remaining passes
    return crypto.randomBytes(fileSize);
  }

  private async writePattern(fd: fs.FileHandle, pattern: Buffer): Promise<void> {
    const bufferSize = 4096;
    const fileSize = pattern.length;
    let written = 0;

    while (written < fileSize) {
      const toWrite = Math.min(bufferSize, fileSize - written);
      const chunk = pattern.slice(written, written + toWrite);
      await fd.write(chunk, 0, toWrite, written);
      written += toWrite;
    }

    await fd.sync();
  }

  private async obscureFilename(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    
    // Rename file multiple times with random names
    let currentPath = filePath;
    for (let i = 0; i < 3; i++) {
      const randomName = crypto.randomBytes(16).toString('hex') + ext;
      const newPath = path.join(dir, randomName);
      await fs.rename(currentPath, newPath);
      currentPath = newPath;
    }
  }

  async shredFreeSpace(drive: string, method: ShreddingMethod = 'secure'): Promise<ShredResult> {
    const result: ShredResult = {
      success: true,
      filesShredded: 0,
      spaceFreed: 0,
      errors: [],
    };

    try {
      // Create a temporary file that fills the free space
      const tempFile = path.join(drive, `shred_temp_${Date.now()}.tmp`);
      
      // Get available space
      const { stdout } = await execAsync(`df -B1 ${drive}`);
      const lines = stdout.trim().split('\n');
      const parts = lines[1].split(/\s+/);
      const availableSpace = parseInt(parts[3], 10);

      // Create and shred temp file
      const fd = await fs.open(tempFile, 'w');
      
      try {
        const config = this.methods[method];
        const chunkSize = 1024 * 1024; // 1MB chunks
        
        for (let pass = 0; pass < config.passes; pass++) {
          await fd.truncate(0);
          let written = 0;
          
          while (written < availableSpace) {
            const toWrite = Math.min(chunkSize, availableSpace - written);
            const chunk = this.getPattern(config.pattern, pass, toWrite);
            await fd.write(chunk, 0, toWrite, written);
            written += toWrite;
          }
          
          await fd.sync();
        }
      } finally {
        await fd.close();
      }

      // Shred and delete the temp file
      await this.shredFile(tempFile, method);
      
      result.filesShredded = 1;
      result.spaceFreed = availableSpace;
    } catch (error) {
      result.success = false;
      result.errors.push(`Failed to shred free space: ${error}`);
    }

    return result;
  }
}

export const fileShredderService = new FileShredderService();
