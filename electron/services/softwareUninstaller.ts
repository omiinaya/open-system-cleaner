import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as path from 'path';

const execAsync = promisify(exec);

export interface InstalledProgram {
  id: string;
  name: string;
  publisher: string;
  version: string;
  installDate: string;
  size: number;
  installLocation: string;
  uninstallString: string;
  icon?: string;
}

export class SoftwareUninstallerService {
  async getInstalledPrograms(): Promise<InstalledProgram[]> {
    if (process.platform === 'win32') {
      return await this.getWindowsPrograms();
    } else if (process.platform === 'darwin') {
      return await this.getMacPrograms();
    } else {
      return await this.getLinuxPrograms();
    }
  }

  private async getWindowsPrograms(): Promise<InstalledProgram[]> {
    const programs: InstalledProgram[] = [];
    
    try {
      // Query registry for installed programs
      const registryPaths = [
        'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
        'HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
      ];

      for (const regPath of registryPaths) {
        try {
          const { stdout } = await execAsync(`reg query "${regPath}" /s`);
          const entries = this.parseRegistryOutput(stdout, regPath);
          programs.push(...entries);
        } catch (error) {
          // Registry path might not exist or be accessible
        }
      }
    } catch (error) {
      console.error('Error getting Windows programs:', error);
    }

    // Remove duplicates based on name
    const unique = new Map<string, InstalledProgram>();
    programs.forEach(p => {
      if (!unique.has(p.name) || p.size > (unique.get(p.name)?.size || 0)) {
        unique.set(p.name, p);
      }
    });

    return Array.from(unique.values()).sort((a, b) => b.size - a.size);
  }

  private parseRegistryOutput(output: string, basePath: string): InstalledProgram[] {
    const programs: InstalledProgram[] = [];
    const entries = output.split('\r\n\r\n').filter(e => e.trim());

    for (const entry of entries) {
      const lines = entry.split('\r\n');
      const program: Partial<InstalledProgram> = {};

      for (const line of lines) {
        const match = line.match(/^\s+(\w+)\s+REG_\w+\s+(.+)$/);
        if (match) {
          const [, key, value] = match;
          switch (key.toLowerCase()) {
            case 'displayname':
              program.name = value;
              break;
            case 'publisher':
              program.publisher = value;
              break;
            case 'displayversion':
              program.version = value;
              break;
            case 'installdate':
              program.installDate = value;
              break;
            case 'estimatedsize':
              program.size = parseInt(value, 10) * 1024; // Convert KB to bytes
              break;
            case 'installlocation':
              program.installLocation = value;
              break;
            case 'uninstallstring':
              program.uninstallString = value;
              break;
          }
        }
      }

      if (program.name && program.uninstallString) {
        programs.push({
          id: `${basePath}\\${program.name}`,
          name: program.name,
          publisher: program.publisher || 'Unknown',
          version: program.version || 'Unknown',
          installDate: program.installDate || 'Unknown',
          size: program.size || 0,
          installLocation: program.installLocation || '',
          uninstallString: program.uninstallString,
        });
      }
    }

    return programs;
  }

  private async getMacPrograms(): Promise<InstalledProgram[]> {
    const programs: InstalledProgram[] = [];

    try {
      // Get applications from /Applications and ~/Applications
      const appDirs = ['/Applications', path.join(os.homedir(), 'Applications')];

      for (const appDir of appDirs) {
        try {
          const { stdout } = await execAsync(`ls -la "${appDir}"`);
          const lines = stdout.split('\n');

          for (const line of lines) {
            if (line.includes('.app')) {
              const match = line.match(/\d+:\d+ (.+\.app)$/);
              if (match) {
                const appName = match[1];
                const appPath = path.join(appDir, appName);
                
                // Try to get app size
                let size = 0;
                try {
                  const { stdout: sizeOutput } = await execAsync(`du -sk "${appPath}"`);
                  size = parseInt(sizeOutput.split('\t')[0]) * 1024;
                } catch {
                  // Size might not be available
                }

                programs.push({
                  id: appPath,
                  name: appName.replace('.app', ''),
                  publisher: 'Unknown',
                  version: 'Unknown',
                  installDate: 'Unknown',
                  size,
                  installLocation: appPath,
                  uninstallString: `rm -rf "${appPath}"`,
                });
              }
            }
          }
        } catch (error) {
          // Directory might not exist
        }
      }
    } catch (error) {
      console.error('Error getting Mac programs:', error);
    }

    return programs;
  }

  private async getLinuxPrograms(): Promise<InstalledProgram[]> {
    const programs: InstalledProgram[] = [];

    try {
      // Use dpkg for Debian-based or rpm for RedHat-based
      let command = '';
      
      try {
        await execAsync('which dpkg');
        command = 'dpkg-query -W -f=\'${Package}|${Version}|${Installed-Size}\n\'';
      } catch {
        try {
          await execAsync('which rpm');
          command = 'rpm -qa --queryformat "%{NAME}|%{VERSION}|%{SIZE}\n"';
        } catch {
          return programs;
        }
      }

      const { stdout } = await execAsync(command);
      const lines = stdout.split('\n');

      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length >= 3) {
          const [name, version, sizeStr] = parts;
          const size = parseInt(sizeStr, 10) * 1024; // Convert KB to bytes

          programs.push({
            id: name,
            name,
            publisher: 'Unknown',
            version,
            installDate: 'Unknown',
            size,
            installLocation: '',
            uninstallString: process.platform === 'linux' && command.includes('dpkg') 
              ? `sudo apt-get remove ${name}` 
              : `sudo rpm -e ${name}`,
          });
        }
      }
    } catch (error) {
      console.error('Error getting Linux programs:', error);
    }

    return programs;
  }

  async uninstallProgram(programId: string): Promise<{ success: boolean; message: string }> {
    try {
      const programs = await this.getInstalledPrograms();
      const program = programs.find(p => p.id === programId);

      if (!program) {
        return { success: false, message: 'Program not found' };
      }

      if (process.platform === 'win32') {
        // Run uninstaller
        await execAsync(`"${program.uninstallString}" /S`);
      } else if (process.platform === 'darwin') {
        // Move to trash
        const trashPath = path.join(os.homedir(), '.Trash', path.basename(program.installLocation));
        await execAsync(`mv "${program.installLocation}" "${trashPath}"`);
      } else {
        // Linux package removal
        await execAsync(program.uninstallString);
      }

      return { success: true, message: `${program.name} has been uninstalled` };
    } catch (error) {
      console.error('Error uninstalling program:', error);
      return { success: false, message: `Failed to uninstall: ${error}` };
    }
  }

  async searchPrograms(query: string): Promise<InstalledProgram[]> {
    const programs = await this.getInstalledPrograms();
    const lowerQuery = query.toLowerCase();
    
    return programs.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.publisher.toLowerCase().includes(lowerQuery)
    );
  }
}

export const softwareUninstallerService = new SoftwareUninstallerService();
