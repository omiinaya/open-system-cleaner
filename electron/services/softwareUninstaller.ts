import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { auditLogger } from './auditLogger';

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

  private async detectPackageManager(): Promise<'apt' | 'dnf' | 'pacman' | 'snap' | 'flatpak' | null> {
    const managers = [
      { cmd: 'apt-get', name: 'apt' as const },
      { cmd: 'dnf', name: 'dnf' as const },
      { cmd: 'pacman', name: 'pacman' as const },
      { cmd: 'snap', name: 'snap' as const },
      { cmd: 'flatpak', name: 'flatpak' as const },
    ];

    for (const manager of managers) {
      try {
        await execAsync(`which ${manager.cmd}`);
        return manager.name;
      } catch {
        continue;
      }
    }
    
    return null;
  }

  private async getLinuxPrograms(): Promise<InstalledProgram[]> {
    const programs: InstalledProgram[] = [];

    try {
      const packageManager = await this.detectPackageManager();
      
      if (!packageManager) {
        console.warn('No supported package manager found');
        return programs;
      }

      await auditLogger.log('linux_package_scan', 'softwareUninstaller', 'success', {
        packageManager,
      });

      switch (packageManager) {
        case 'apt':
          programs.push(...await this.getAptPackages());
          break;
        case 'dnf':
          programs.push(...await this.getDnfPackages());
          break;
        case 'pacman':
          programs.push(...await this.getPacmanPackages());
          break;
        case 'snap':
          programs.push(...await this.getSnapPackages());
          break;
        case 'flatpak':
          programs.push(...await this.getFlatpakPackages());
          break;
      }
    } catch (error) {
      console.error('Error getting Linux programs:', error);
      await auditLogger.log('linux_package_scan_failed', 'softwareUninstaller', 'failure', {
        error: String(error),
      });
    }

    return programs;
  }

  private async getAptPackages(): Promise<InstalledProgram[]> {
    const programs: InstalledProgram[] = [];
    try {
      const { stdout } = await execAsync("dpkg-query -W -f='${Package}|${Version}|${Installed-Size}\n'");
      const lines = stdout.split('\n');

      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length >= 3) {
          const [name, version, sizeStr] = parts;
          const size = parseInt(sizeStr, 10) * 1024;

          programs.push({
            id: `apt:${name}`,
            name,
            publisher: 'Debian/Ubuntu Repository',
            version,
            installDate: 'Unknown',
            size,
            installLocation: '',
            uninstallString: `sudo apt-get remove ${name}`,
          });
        }
      }
    } catch (error) {
      console.error('Error getting apt packages:', error);
    }
    return programs;
  }

  private async getDnfPackages(): Promise<InstalledProgram[]> {
    const programs: InstalledProgram[] = [];
    try {
      const { stdout } = await execAsync('rpm -qa --queryformat "%{NAME}|%{VERSION}|%{SIZE}\n"');
      const lines = stdout.split('\n');

      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length >= 3) {
          const [name, version, sizeStr] = parts;
          const size = parseInt(sizeStr, 10);

          programs.push({
            id: `dnf:${name}`,
            name,
            publisher: 'Fedora/RHEL Repository',
            version,
            installDate: 'Unknown',
            size,
            installLocation: '',
            uninstallString: `sudo dnf remove ${name}`,
          });
        }
      }
    } catch (error) {
      console.error('Error getting dnf packages:', error);
    }
    return programs;
  }

  private async getPacmanPackages(): Promise<InstalledProgram[]> {
    const programs: InstalledProgram[] = [];
    try {
      const { stdout } = await execAsync("pacman -Q --format '%n|%v|%m\n'");
      const lines = stdout.split('\n');

      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length >= 2) {
          const [name, version] = parts;
          
          programs.push({
            id: `pacman:${name}`,
            name,
            publisher: 'Arch Repository',
            version,
            installDate: 'Unknown',
            size: 0, // Would need additional command to get size
            installLocation: '',
            uninstallString: `sudo pacman -R ${name}`,
          });
        }
      }
    } catch (error) {
      console.error('Error getting pacman packages:', error);
    }
    return programs;
  }

  private async getSnapPackages(): Promise<InstalledProgram[]> {
    const programs: InstalledProgram[] = [];
    try {
      const { stdout } = await execAsync("snap list | awk 'NR>1 {print $1\"|\"$2\"|\"$6}'");
      const lines = stdout.split('\n');

      for (const line of lines) {
        const parts = line.split('|');
        if (parts.length >= 2) {
          const [name, version, notes] = parts;
          
          programs.push({
            id: `snap:${name}`,
            name,
            publisher: notes || 'Snap Store',
            version,
            installDate: 'Unknown',
            size: 0, // Snap doesn't expose size easily
            installLocation: `/snap/${name}`,
            uninstallString: `sudo snap remove ${name}`,
          });
        }
      }
    } catch (error) {
      console.error('Error getting snap packages:', error);
    }
    return programs;
  }

  private async getFlatpakPackages(): Promise<InstalledProgram[]> {
    const programs: InstalledProgram[] = [];
    try {
      const { stdout } = await execAsync("flatpak list --app --columns=application,version,size,origin | tail -n +1");
      const lines = stdout.split('\n');

      for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length >= 3) {
          const [id, version, sizeStr, origin] = parts;
          
          // Parse size (usually in MB or GB)
          let size = 0;
          if (sizeStr) {
            if (sizeStr.includes('GB')) {
              size = parseFloat(sizeStr) * 1024 * 1024 * 1024;
            } else if (sizeStr.includes('MB')) {
              size = parseFloat(sizeStr) * 1024 * 1024;
            }
          }
          
          programs.push({
            id: `flatpak:${id}`,
            name: id.split('.').pop() || id,
            publisher: origin || 'Flathub',
            version: version || 'Unknown',
            installDate: 'Unknown',
            size,
            installLocation: '',
            uninstallString: `flatpak uninstall ${id}`,
          });
        }
      }
    } catch (error) {
      console.error('Error getting flatpak packages:', error);
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
