import { exec } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';
import * as os from 'os';

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
  private blacklistedProcesses = [
    'System',
    'System Idle Process',
    'explorer.exe',
    'winlogon.exe',
    'csrss.exe',
    'smss.exe',
    'services.exe',
    'lsass.exe',
    'svchost.exe',
    'chrome.exe', // Keep browsers
    'firefox.exe',
    'msedge.exe',
    'code.exe', // Keep editor
    'electron.exe', // Keep Electron apps
  ];

  private safeToCloseProcesses = [
    'notepad.exe',
    'calc.exe',
    'mspaint.exe',
    'cmd.exe',
    'powershell.exe',
    'discord.exe',
    'spotify.exe',
    'steam.exe',
    'slack.exe',
    'teams.exe',
    'zoom.exe',
  ];

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
    
    const processes = await this.getRunningProcesses();
    const processesToTerminate: ProcessInfo[] = [];
    
    // Identify processes to terminate
    for (const proc of processes) {
      // Skip blacklisted processes
      if (this.blacklistedProcesses.some(bp => 
        proc.name.toLowerCase().includes(bp.toLowerCase())
      )) {
        continue;
      }

      // Skip system processes unless aggressive mode
      if (proc.isSystem && !aggressive) {
        continue;
      }

      // Only terminate safe-to-close processes unless includeUserApps
      if (!includeUserApps) {
        if (!this.safeToCloseProcesses.some(sp => 
          proc.name.toLowerCase().includes(sp.toLowerCase())
        )) {
          continue;
        }
      }

      // Only terminate high memory usage processes
      if (proc.memory < 50 && !aggressive) {
        continue;
      }

      processesToTerminate.push(proc);
    }

    let memoryFreed = 0;
    let terminatedCount = 0;

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
      } catch (error) {
        console.error(`Failed to terminate process ${proc.name} (${proc.pid}):`, error);
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

    return {
      success: terminatedCount > 0,
      memoryFreed,
      processesTerminated: terminatedCount,
      processes: processesToTerminate.slice(0, terminatedCount),
    };
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
