import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface StartupProgram {
  id: string;
  name: string;
  publisher: string;
  command: string;
  location: string;
  enabled: boolean;
  impact: 'low' | 'medium' | 'high';
  startupType: 'registry' | 'folder' | 'task';
}

export class StartupManagerService {
  async getStartupPrograms(): Promise<StartupProgram[]> {
    const programs: StartupProgram[] = [];

    try {
      if (process.platform === 'win32') {
        // Get registry startup entries
        const registryPrograms = await this.getRegistryStartupPrograms();
        programs.push(...registryPrograms);

        // Get startup folder entries
        const folderPrograms = await this.getStartupFolderPrograms();
        programs.push(...folderPrograms);

        // Get scheduled task startup entries
        const taskPrograms = await this.getTaskSchedulerPrograms();
        programs.push(...taskPrograms);
      } else if (process.platform === 'darwin') {
        // macOS startup items
        const macPrograms = await this.getMacStartupPrograms();
        programs.push(...macPrograms);
      } else {
        // Linux startup items
        const linuxPrograms = await this.getLinuxStartupPrograms();
        programs.push(...linuxPrograms);
      }
    } catch (error) {
      console.error('Error getting startup programs:', error);
    }

    return programs;
  }

  private async getRegistryStartupPrograms(): Promise<StartupProgram[]> {
    const programs: StartupProgram[] = [];
    const registryPaths = [
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
      'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce',
      'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce',
    ];

    for (const regPath of registryPaths) {
      try {
        const { stdout } = await execAsync(`reg query "${regPath}" /s`);
        const lines = stdout.split('\n');
        let currentName = '';

        for (const line of lines) {
          const trimmed = line.trim();
          
          // Parse registry entry
          if (trimmed && !trimmed.startsWith('HKEY') && trimmed.includes('    ')) {
            const parts = trimmed.split(/\s{2,}/);
            if (parts.length >= 3) {
              const name = parts[0];
              const type = parts[1];
              const value = parts[2];

              programs.push({
                id: `${regPath}\\${name}`,
                name: this.extractProgramName(name, value),
                publisher: 'Unknown',
                command: value,
                location: regPath,
                enabled: true,
                impact: this.calculateImpact(value),
                startupType: 'registry',
              });
            }
          }
        }
      } catch (error) {
        // Registry key might not exist or be accessible
      }
    }

    return programs;
  }

  private async getStartupFolderPrograms(): Promise<StartupProgram[]> {
    const programs: StartupProgram[] = [];
    const startupFolders = [
      path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup'),
      'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\StartUp',
    ];

    for (const folder of startupFolders) {
      try {
        const entries = await fs.readdir(folder, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isFile() && (entry.name.endsWith('.lnk') || entry.name.endsWith('.exe'))) {
            const fullPath = path.join(folder, entry.name);
            const name = entry.name.replace('.lnk', '').replace('.exe', '');
            
            programs.push({
              id: fullPath,
              name,
              publisher: 'Unknown',
              command: fullPath,
              location: folder,
              enabled: true,
              impact: this.calculateImpact(fullPath),
              startupType: 'folder',
            });
          }
        }
      } catch (error) {
        // Folder might not exist
      }
    }

    return programs;
  }

  private async getTaskSchedulerPrograms(): Promise<StartupProgram[]> {
    const programs: StartupProgram[] = [];
    
    try {
      const { stdout } = await execAsync('schtasks /query /fo CSV /nh');
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 3) {
          const taskName = parts[0].replace(/"/g, '');
          const taskPath = parts[2]?.replace(/"/g, '') || '';
          
          // Only include startup/logon tasks
          if (taskPath.toLowerCase().includes('startup') || taskPath.toLowerCase().includes('logon')) {
            programs.push({
              id: taskName,
              name: taskName,
              publisher: 'Unknown',
              command: taskPath,
              location: 'Task Scheduler',
              enabled: true,
              impact: this.calculateImpact(taskPath),
              startupType: 'task',
            });
          }
        }
      }
    } catch (error) {
      // Task scheduler might not be accessible
    }

    return programs;
  }

  private async getMacStartupPrograms(): Promise<StartupProgram[]> {
    const programs: StartupProgram[] = [];
    
    try {
      // Check LaunchAgents and LaunchDaemons
      const launchDirs = [
        path.join(os.homedir(), 'Library', 'LaunchAgents'),
        '/Library/LaunchAgents',
        '/Library/LaunchDaemons',
      ];

      for (const dir of launchDirs) {
        try {
          const entries = await fs.readdir(dir);
          
          for (const entry of entries) {
            if (entry.endsWith('.plist')) {
              const fullPath = path.join(dir, entry);
              const content = await fs.readFile(fullPath, 'utf-8');
              
              programs.push({
                id: fullPath,
                name: entry.replace('.plist', ''),
                publisher: 'Unknown',
                command: content.includes('ProgramArguments') ? 'LaunchAgent' : 'LaunchDaemon',
                location: dir,
                enabled: true,
                impact: 'medium',
                startupType: 'folder',
              });
            }
          }
        } catch (error) {
          // Directory might not exist
        }
      }
    } catch (error) {
      console.error('Error getting macOS startup programs:', error);
    }

    return programs;
  }

  private async getLinuxStartupPrograms(): Promise<StartupProgram[]> {
    const programs: StartupProgram[] = [];
    
    try {
      // Check autostart directories
      const autostartDirs = [
        path.join(os.homedir(), '.config', 'autostart'),
        '/etc/xdg/autostart',
      ];

      for (const dir of autostartDirs) {
        try {
          const entries = await fs.readdir(dir);
          
          for (const entry of entries) {
            if (entry.endsWith('.desktop')) {
              const fullPath = path.join(dir, entry);
              
              programs.push({
                id: fullPath,
                name: entry.replace('.desktop', ''),
                publisher: 'Unknown',
                command: fullPath,
                location: dir,
                enabled: true,
                impact: 'medium',
                startupType: 'folder',
              });
            }
          }
        } catch (error) {
          // Directory might not exist
        }
      }
    } catch (error) {
      console.error('Error getting Linux startup programs:', error);
    }

    return programs;
  }

  private extractProgramName(name: string, command: string): string {
    // Try to extract a readable name from the command
    const match = command.match(/\\([^\\]+)\.(exe|dll)/i);
    if (match) {
      return match[1];
    }
    return name;
  }

  private calculateImpact(command: string): 'low' | 'medium' | 'high' {
    const lowerCommand = command.toLowerCase();
    
    // High impact programs
    if (lowerCommand.includes('chrome') || 
        lowerCommand.includes('firefox') || 
        lowerCommand.includes('edge') ||
        lowerCommand.includes('spotify') ||
        lowerCommand.includes('discord') ||
        lowerCommand.includes('steam')) {
      return 'high';
    }
    
    // Medium impact
    if (lowerCommand.includes('update') ||
        lowerCommand.includes('sync') ||
        lowerCommand.includes('cloud')) {
      return 'medium';
    }
    
    return 'low';
  }

  async disableStartupProgram(programId: string): Promise<boolean> {
    try {
      if (process.platform === 'win32') {
        // Try to remove from registry
        if (programId.includes('HKEY')) {
          const parts = programId.split('\\\\');
          const regPath = parts.slice(0, -1).join('\\\\');
          const name = parts[parts.length - 1];
          
          await execAsync(`reg delete "${regPath}" /v "${name}" /f`);
          return true;
        }
        
        // Try to remove from startup folder (move to disabled folder)
        if (programId.includes('Startup')) {
          const disabledFolder = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'Disabled');
          await fs.mkdir(disabledFolder, { recursive: true });
          const destPath = path.join(disabledFolder, path.basename(programId));
          await fs.rename(programId, destPath);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error disabling startup program:', error);
      return false;
    }
  }

  async enableStartupProgram(programId: string): Promise<boolean> {
    // Implementation to re-enable a disabled startup program
    // This would require storing information about where the program was moved from
    return false;
  }
}

export const startupManagerService = new StartupManagerService();
