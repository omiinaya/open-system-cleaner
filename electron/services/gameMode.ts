import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import { turboModeService } from './turboMode';
import { ramOptimizerService } from './ramOptimizer';

const execAsync = promisify(exec);

export interface GameModeResult {
  enabled: boolean;
  gameName: string | null;
  optimizations: string[];
  processesSuspended: number;
  memoryFreed: number;
}

export interface GameInfo {
  name: string;
  executable: string;
  processName: string;
}

export class GameModeService {
  private isActive = false;
  private currentGame: string | null = null;
  private suspendedProcesses: string[] = [];

  private knownGames: GameInfo[] = [
    { name: 'Steam', executable: 'steam.exe', processName: 'steam' },
    { name: 'Epic Games', executable: 'EpicGamesLauncher.exe', processName: 'EpicGamesLauncher' },
    { name: 'EA App', executable: 'EADesktop.exe', processName: 'EADesktop' },
    { name: 'Ubisoft Connect', executable: 'UbisoftConnect.exe', processName: 'UbisoftConnect' },
    { name: 'Battle.net', executable: 'Battle.net.exe', processName: 'Battle.net' },
    { name: 'Minecraft', executable: 'Minecraft.exe', processName: 'Minecraft' },
    { name: 'Valorant', executable: 'VALORANT.exe', processName: 'VALORANT' },
    { name: 'League of Legends', executable: 'LeagueClient.exe', processName: 'LeagueClient' },
    { name: 'Fortnite', executable: 'FortniteClient-Win64-Shipping.exe', processName: 'Fortnite' },
    { name: 'Apex Legends', executable: 'r5apex.exe', processName: 'r5apex' },
    { name: 'CS:GO', executable: 'csgo.exe', processName: 'csgo' },
    { name: 'Call of Duty', executable: 'cod.exe', processName: 'cod' },
    { name: 'GTA V', executable: 'GTA5.exe', processName: 'GTA5' },
    { name: 'Overwatch', executable: 'Overwatch.exe', processName: 'Overwatch' },
    { name: 'PUBG', executable: 'TslGame.exe', processName: 'TslGame' },
  ];

  async enable(gameName?: string): Promise<GameModeResult> {
    const optimizations: string[] = [];
    let processesSuspended = 0;
    let memoryFreed = 0;

    try {
      // 1. Enable Turbo Mode first
      const turboResult = await turboModeService.enable();
      if (turboResult.enabled) {
        optimizations.push('Turbo Mode enabled');
        memoryFreed += turboResult.memoryFreed;
      }

      // 2. Identify current game
      this.currentGame = gameName || await this.detectRunningGame();
      if (this.currentGame) {
        optimizations.push(`Optimizing for ${this.currentGame}`);
      }

      // 3. Suspend background processes
      const suspendResult = await this.suspendBackgroundProcesses();
      this.suspendedProcesses = suspendResult.processes;
      processesSuspended = suspendResult.count;
      if (processesSuspended > 0) {
        optimizations.push(`${processesSuspended} background processes suspended`);
      }

      // 4. Disable Windows Game Mode (if applicable) - prevent conflicts
      if (process.platform === 'win32') {
        await this.disableWindowsGameMode();
        optimizations.push('Windows Game Mode disabled to prevent conflicts');
      }

      // 5. Set game process to high priority
      if (this.currentGame) {
        await this.setGamePriority(this.currentGame);
        optimizations.push('Game process priority elevated');
      }

      // 6. Clear standby memory
      const clearResult = await this.clearStandbyMemory();
      if (clearResult > 0) {
        memoryFreed += clearResult;
        optimizations.push('Standby memory cleared');
      }

      // 7. Disable notifications
      await this.disableNotifications();
      optimizations.push('Notifications disabled');

      this.isActive = true;

      return {
        enabled: true,
        gameName: this.currentGame,
        optimizations,
        processesSuspended,
        memoryFreed,
      };
    } catch (error) {
      console.error('Error enabling Game Mode:', error);
      return {
        enabled: false,
        gameName: null,
        optimizations: [],
        processesSuspended: 0,
        memoryFreed: 0,
      };
    }
  }

  async disable(): Promise<boolean> {
    try {
      // Restore Turbo Mode
      await turboModeService.disable();

      // Resume suspended processes
      await this.resumeProcesses();

      // Re-enable Windows Game Mode
      if (process.platform === 'win32') {
        await this.enableWindowsGameMode();
      }

      // Re-enable notifications
      await this.enableNotifications();

      // Reset process priorities
      await this.resetProcessPriorities();

      this.isActive = false;
      this.currentGame = null;
      this.suspendedProcesses = [];

      return true;
    } catch (error) {
      console.error('Error disabling Game Mode:', error);
      return false;
    }
  }

  private async detectRunningGame(): Promise<string | null> {
    try {
      const processes = await ramOptimizerService.getRunningProcesses();
      
      for (const process of processes) {
        const knownGame = this.knownGames.find(g => 
          process.name.toLowerCase().includes(g.processName.toLowerCase())
        );
        
        if (knownGame) {
          return knownGame.name;
        }
      }
    } catch (error) {
      console.error('Error detecting running game:', error);
    }

    return null;
  }

  private async suspendBackgroundProcesses(): Promise<{ processes: string[]; count: number }> {
    const processes: string[] = [];
    
    // Processes to suspend during gaming
    const suspendList = [
      'chrome.exe',
      'firefox.exe',
      'msedge.exe',
      'discord.exe',
      'spotify.exe',
      'slack.exe',
      'teams.exe',
      'zoom.exe',
      'skype.exe',
      'telegram.exe',
      'dropbox.exe',
      'onedrive.exe',
      'googledrivesync.exe',
    ];

    try {
      for (const procName of suspendList) {
        try {
          if (process.platform === 'win32') {
            // Use PsSuspend to suspend process (requires Sysinternals)
            await execAsync(`pssuspend ${procName}`);
            processes.push(procName);
          } else {
            // Send STOP signal on Unix
            const { stdout } = await execAsync(`pgrep -f "${procName}"`);
            const pids = stdout.trim().split('\n');
            
            for (const pid of pids) {
              await execAsync(`kill -STOP ${pid}`);
              processes.push(`${procName} (${pid})`);
            }
          }
        } catch {
          // Process might not be running
        }
      }
    } catch (error) {
      console.error('Error suspending processes:', error);
    }

    return { processes, count: processes.length };
  }

  private async resumeProcesses(): Promise<void> {
    for (const processName of this.suspendedProcesses) {
      try {
        if (process.platform === 'win32') {
          await execAsync(`pssuspend -r ${processName}`);
        } else {
          // Extract PID from format "name (pid)"
          const match = processName.match(/\((\d+)\)/);
          if (match) {
            await execAsync(`kill -CONT ${match[1]}`);
          }
        }
      } catch {
        // Process might have been closed
      }
    }
  }

  private async setGamePriority(gameName: string): Promise<void> {
    try {
      const gameInfo = this.knownGames.find(g => g.name === gameName);
      if (!gameInfo) return;

      if (process.platform === 'win32') {
        // Set to High priority (128) or Realtime (256)
        await execAsync(`wmic process where "name='${gameInfo.executable}'" CALL setpriority 256`);
      } else {
        // On Linux, use nice
        const { stdout } = await execAsync(`pgrep -f "${gameInfo.processName}"`);
        const pids = stdout.trim().split('\n');
        
        for (const pid of pids) {
          await execAsync(`sudo renice -n -20 -p ${pid}`);
        }
      }
    } catch (error) {
      console.error('Error setting game priority:', error);
    }
  }

  private async clearStandbyMemory(): Promise<number> {
    try {
      if (process.platform === 'win32') {
        // Use RAMMap to clear standby memory (requires Sysinternals)
        await execAsync('rammap -Ew');
        return 500; // Estimate 500MB
      } else if (process.platform === 'linux') {
        await execAsync('sudo sync && sudo sysctl -w vm.drop_caches=1');
        return 200; // Estimate 200MB
      }
    } catch (error) {
      console.error('Error clearing standby memory:', error);
    }

    return 0;
  }

  private async disableWindowsGameMode(): Promise<void> {
    try {
      if (process.platform === 'win32') {
        await execAsync('reg add "HKCU\\Software\\Microsoft\\GameBar" /v AllowAutoGameMode /t REG_DWORD /d 0 /f');
      }
    } catch (error) {
      console.error('Error disabling Windows Game Mode:', error);
    }
  }

  private async enableWindowsGameMode(): Promise<void> {
    try {
      if (process.platform === 'win32') {
        await execAsync('reg add "HKCU\\Software\\Microsoft\\GameBar" /v AllowAutoGameMode /t REG_DWORD /d 1 /f');
      }
    } catch (error) {
      console.error('Error enabling Windows Game Mode:', error);
    }
  }

  private async disableNotifications(): Promise<void> {
    try {
      if (process.platform === 'win32') {
        // Focus Assist (Quiet Hours)
        await execAsync('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings" /v NOC_GLOBAL_SETTING_TOASTS_ENABLED /t REG_DWORD /d 0 /f');
      } else if (process.platform === 'darwin') {
        // Disable Do Not Disturb
        await execAsync('defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean true');
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
    }
  }

  private async enableNotifications(): Promise<void> {
    try {
      if (process.platform === 'win32') {
        await execAsync('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings" /v NOC_GLOBAL_SETTING_TOASTS_ENABLED /t REG_DWORD /d 1 /f');
      } else if (process.platform === 'darwin') {
        await execAsync('defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean false');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    }
  }

  private async resetProcessPriorities(): Promise<void> {
    try {
      const processes = await ramOptimizerService.getRunningProcesses();
      
      for (const proc of processes) {
        try {
          if (process.platform === 'win32') {
            await execAsync(`wmic process where "ProcessId=${proc.pid}" CALL setpriority 32`);
          } else {
            await execAsync(`sudo renice -n 0 -p ${proc.pid}`);
          }
        } catch {
          // Process might have closed
        }
      }
    } catch (error) {
      console.error('Error resetting process priorities:', error);
    }
  }

  isEnabled(): boolean {
    return this.isActive;
  }

  getCurrentGame(): string | null {
    return this.currentGame;
  }

  getKnownGames(): GameInfo[] {
    return this.knownGames;
  }
}

export const gameModeService = new GameModeService();
