import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import { app } from 'electron';
import { auditLogger } from './auditLogger';
import { formatBytes } from '../utils/formatters';

const execAsync = promisify(exec);

export interface RegistryBackup {
  id: string;
  timestamp: number;
  description: string;
  filePath: string;
  size: number;
  hives: string[];
}

export class RegistryBackupService {
  private backupDir: string;
  private maxBackups = 10;

  constructor() {
    this.backupDir = path.join(app.getPath('userData'), 'registry-backups');
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create registry backup directory:', error);
    }
  }

  /**
   * Create a registry backup before making changes
   */
  async createBackup(description: string): Promise<RegistryBackup> {
    const timestamp = Date.now();
    const id = `reg-${timestamp}`;
    const fileName = `registry-backup-${timestamp}.reg`;
    const filePath = path.join(this.backupDir, fileName);

    try {
      await auditLogger.log('registry_backup_started', 'registryBackup', 'success', {
        description,
      });

      // Export key registry hives
      const hives = [
        { name: 'HKCU-Software', path: 'HKCU\\Software' },
        { name: 'HKLM-Software', path: 'HKLM\\Software' },
        { name: 'HKCU-Run', path: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' },
        { name: 'HKLM-Run', path: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' },
      ];

      let totalSize = 0;
      const backedUpHives: string[] = [];

      for (const hive of hives) {
        try {
          const hiveFileName = `registry-backup-${timestamp}-${hive.name}.reg`;
          const hiveFilePath = path.join(this.backupDir, hiveFileName);
          
          await execAsync(`reg export "${hive.path}" "${hiveFilePath}" /y`);
          
          const stats = await fs.stat(hiveFilePath);
          totalSize += stats.size;
          backedUpHives.push(hive.name);
        } catch (error) {
          console.warn(`Failed to backup ${hive.path}:`, error);
        }
      }

      // Create a consolidated backup file (manifest)
      const backup: RegistryBackup = {
        id,
        timestamp,
        description,
        filePath,
        size: totalSize,
        hives: backedUpHives,
      };

      // Save backup manifest
      const manifestPath = path.join(this.backupDir, `${id}.json`);
      await fs.writeFile(manifestPath, JSON.stringify(backup, null, 2));

      // Cleanup old backups
      await this.cleanupOldBackups();

      await auditLogger.log('registry_backup_completed', 'registryBackup', 'success', {
        id,
        description,
        size: totalSize,
        hives: backedUpHives,
      });

      return backup;
    } catch (error) {
      await auditLogger.log('registry_backup_failed', 'registryBackup', 'failure', {
        description,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Restore registry from a backup
   */
  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const manifestPath = path.join(this.backupDir, `${backupId}.json`);
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const backup: RegistryBackup = JSON.parse(manifestContent);

      await auditLogger.log('registry_restore_started', 'registryBackup', 'success', {
        backupId,
        description: backup.description,
      });

      // Restore each hive
      for (const hiveName of backup.hives) {
        const hiveFileName = `registry-backup-${backup.timestamp}-${hiveName}.reg`;
        const hiveFilePath = path.join(this.backupDir, hiveFileName);

        try {
          await execAsync(`reg import "${hiveFilePath}"`);
          console.log(`Restored ${hiveName}`);
        } catch (error) {
          console.error(`Failed to restore ${hiveName}:`, error);
          throw error;
        }
      }

      await auditLogger.log('registry_restore_completed', 'registryBackup', 'success', {
        backupId,
      });

      return true;
    } catch (error) {
      await auditLogger.log('registry_restore_failed', 'registryBackup', 'failure', {
        backupId,
        error: String(error),
      });
      return false;
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<RegistryBackup[]> {
    try {
      const entries = await fs.readdir(this.backupDir);
      const backups: RegistryBackup[] = [];

      for (const entry of entries) {
        if (entry.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(this.backupDir, entry), 'utf-8');
            backups.push(JSON.parse(content));
          } catch {
            // Skip corrupted manifests
          }
        }
      }

      // Sort by timestamp (newest first)
      return backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const manifestPath = path.join(this.backupDir, `${backupId}.json`);
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const backup: RegistryBackup = JSON.parse(manifestContent);

      // Delete manifest
      await fs.unlink(manifestPath);

      // Delete hive files
      for (const hiveName of backup.hives) {
        const hiveFileName = `registry-backup-${backup.timestamp}-${hiveName}.reg`;
        const hiveFilePath = path.join(this.backupDir, hiveFileName);
        try {
          await fs.unlink(hiveFilePath);
        } catch {
          // File might not exist
        }
      }

      await auditLogger.log('registry_backup_deleted', 'registryBackup', 'success', {
        backupId,
      });

      return true;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  }

  /**
   * Cleanup old backups, keeping only the most recent ones
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);
        
        for (const backup of toDelete) {
          await this.deleteBackup(backup.id);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup: Date | null;
    newestBackup: Date | null;
  }> {
    try {
      const backups = await this.listBackups();
      const totalSize = backups.reduce((acc, b) => acc + b.size, 0);

      return {
        totalBackups: backups.length,
        totalSize,
        oldestBackup: backups.length > 0 ? new Date(backups[backups.length - 1].timestamp) : null,
        newestBackup: backups.length > 0 ? new Date(backups[0].timestamp) : null,
      };
    } catch {
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null,
      };
    }
  }
}

export const registryBackupService = new RegistryBackupService();
