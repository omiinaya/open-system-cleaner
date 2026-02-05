import { exec } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';
import * as os from 'os';
import { CONSTANTS } from '../constants';
import { auditLogger } from './auditLogger';
import { formatBytes } from '../utils/formatters';

const execAsync = promisify(exec);

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number; // MB
  memoryPercent: number;
  isSystem: boolean;
  path?: string;
}

export interface RAMOptimizationResult {
  success: boolean;
  memoryFreed: number; // MB
  processesTerminated: number;
  processes: ProcessInfo[];
}

export class RAMOptimizerService {
  // Use constants for process lists
  private blacklistedProcesses = CONSTANTS.PROCESS_WHITELIST;
  private safeToCloseProcesses = CONSTANTS.PROCESS_BLACKLIST;

  /**
   * Check if a process is in the whitelist (never kill)
   */
  private isWhitelisted(processName: string): boolean {
    return this.blacklistedProcesses.some(bp => 
      processName.toLowerCase().includes(bp.toLowerCase())
    );
  }

  /**
   * Check if a process is in the blacklist (safe to kill)
   */
  private isBlacklisted(processName: string): boolean {
    return this.safeToCloseProcesses.some(sp => 
      processName.toLowerCase().includes(sp.toLowerCase())
    );
  }

  async getRunningProcesses(): Promise<ProcessInfo[]> {
    try {
      const processes = await si.processes();
      
      return processes.list
        .filter(p => p.memRss > 10) // Only processes using more than 10MB
        .map(p => ({
          pid: p.pid,
          name: p.name,
          cpu: p.cpu,
          memory: Math.round(p.memRss / 1024), // Convert to MB
          memoryPercent: p.memRss ? (p.memRss / (os.totalmem() / 1024)) * 100 : 0,
          isSystem: p.pid < 1000 || p.command?.includes('system') || false,
          path: p.command,
        }))
        .sort((a, b) => b.memory - a.memory);
    } catch (error) {
      console.error('Error getting running processes:', error);
      return [];
    }
  }

  async optimize(options: {
    aggressive?: boolean;
    includeUserApps?: boolean;
  } = {}): Promise<RAMOptimizationResult> {
    const { aggressive = false, includeUserApps = false } = options;
    
    await auditLogger.log('ram_optimization_started', 'ramOptimizer', 'success', {
      aggressive,
      includeUserApps,
    });
    
    const processes = await this.getRunningProcesses();
    const processesToTerminate: ProcessInfo[] = [];
    
    // Identify processes to terminate
    for (const proc of processes) {
      // Skip whitelisted processes
      if (this.isWhitelisted(proc.name)) {
        continue;
      }

      // Skip system processes unless aggressive mode
      if (proc.isSystem && !aggressive) {
        continue;
      }

      // Only terminate safe-to-close processes unless includeUserApps
      if (!includeUserApps && !this.isBlacklisted(proc.name)) {
        continue;
      }

      // Only terminate high memory usage processes
      if (proc.memory < 50 && !aggressive) {
        continue;
      }

      processesToTerminate.push(proc);
    }

    let memoryFreed = 0;
    let terminatedCount = 0;
    const errors: string[] = [];

    // Terminate processes
    for (const proc of processesToTerminate.slice(0, 10)) { // Limit to 10 processes
      try {
        if (process.platform === 'win32') {
          await execAsync(`taskkill /F /PID ${proc.pid}`);
        } else {
          await execAsync(`kill -9 ${proc.pid}`);
        }
        memoryFreed += proc.memory;
        terminatedCount++;
        
        await auditLogger.log('process_terminated', 'ramOptimizer', 'success', {
          pid: proc.pid,
          name: proc.name,
          memory: proc.memory,
        });
      } catch (error) {
        const errorMsg = `Failed to terminate process ${proc.name} (${proc.pid}): ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        
        await auditLogger.log('process_terminate_failed', 'ramOptimizer', 'failure', {
          pid: proc.pid,
          name: proc.name,
          error: String(error),
        });
      }
    }

    // Clear system caches
    try {
      if (process.platform !== 'win32') {
        // On Linux, drop caches
        await execAsync('echo 3 | sudo tee /proc/sys/vm/drop_caches');
      }
    } catch (error) {
      console.error('Error clearing system caches:', error);
    }

    const result: RAMOptimizationResult = {
      success: terminatedCount > 0,
      memoryFreed,
      processesTerminated: terminatedCount,
      processes: processesToTerminate.slice(0, terminatedCount),
    };

    await auditLogger.log('ram_optimization_completed', 'ramOptimizer', result.success ? 'success' : 'warning', {
      memoryFreed,
      processesTerminated: terminatedCount,
      errorCount: errors.length,
    });

    return result;
  }

  async getMemoryInfo(): Promise<{
    total: number;
    used: number;
    free: number;
    percentage: number;
  }> {
    const mem = await si.mem();
    const total = Math.round(mem.total / 1024 / 1024); // MB
    const used = Math.round(mem.active / 1024 / 1024);
    const free = Math.round(mem.available / 1024 / 1024);
    
    return {
      total,
      used,
      free,
      percentage: Math.round((used / total) * 100),
    };
  }

  async killProcess(pid: number): Promise<boolean> {
    try {
      if (process.platform === 'win32') {
        await execAsync(`taskkill /F /PID ${pid}`);
      } else {
        await execAsync(`kill -9 ${pid}`);
      }
      return true;
    } catch (error) {
      console.error(`Failed to kill process ${pid}:`, error);
      return false;
    }
  }
}

export const ramOptimizerService = new RAMOptimizerService();
