import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  module: string;
  status: 'success' | 'failure' | 'warning';
  details: Record<string, any>;
  userId?: string;
}

export class AuditLogger {
  private logDir: string;
  private currentLogFile: string;
  private maxLogSize = 10 * 1024 * 1024; // 10MB
  private maxLogFiles = 5;

  constructor() {
    this.logDir = path.join(app.getPath('userData'), 'logs');
    this.currentLogFile = path.join(this.logDir, 'audit.log');
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async log(
    action: string,
    module: string,
    status: 'success' | 'failure' | 'warning',
    details: Record<string, any> = {}
  ): Promise<void> {
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      action,
      module,
      status,
      details,
    };

    try {
      // Check if we need to rotate logs
      await this.rotateLogsIfNeeded();

      // Append to log file
      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(this.currentLogFile, logLine, 'utf-8');
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  private async rotateLogsIfNeeded(): Promise<void> {
    try {
      const stats = await fs.stat(this.currentLogFile);
      if (stats.size > this.maxLogSize) {
        await this.rotateLogs();
      }
    } catch {
      // File doesn't exist yet, no rotation needed
    }
  }

  private async rotateLogs(): Promise<void> {
    // Rotate existing log files
    for (let i = this.maxLogFiles - 1; i > 0; i--) {
      const oldFile = path.join(this.logDir, `audit.log.${i}`);
      const newFile = path.join(this.logDir, `audit.log.${i + 1}`);

      try {
        await fs.rename(oldFile, newFile);
      } catch {
        // File might not exist
      }
    }

    // Move current log to .1
    try {
      await fs.rename(this.currentLogFile, path.join(this.logDir, 'audit.log.1'));
    } catch {
      // File might not exist
    }
  }

  async getRecentLogs(count = 100): Promise<AuditEntry[]> {
    try {
      const content = await fs.readFile(this.currentLogFile, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line);
      const entries = lines.map(line => JSON.parse(line) as AuditEntry);
      return entries.slice(-count);
    } catch {
      return [];
    }
  }

  async getLogsByAction(action: string, count = 50): Promise<AuditEntry[]> {
    const logs = await this.getRecentLogs(count * 2);
    return logs.filter(log => log.action === action).slice(0, count);
  }

  async getLogsByModule(module: string, count = 50): Promise<AuditEntry[]> {
    const logs = await this.getRecentLogs(count * 2);
    return logs.filter(log => log.module === module).slice(0, count);
  }

  async clearLogs(): Promise<void> {
    try {
      await fs.unlink(this.currentLogFile);
      // Also delete rotated logs
      for (let i = 1; i <= this.maxLogFiles; i++) {
        try {
          await fs.unlink(path.join(this.logDir, `audit.log.${i}`));
        } catch {
          // File might not exist
        }
      }
    } catch {
      // File might not exist
    }
  }
}

export const auditLogger = new AuditLogger();
