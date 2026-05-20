import { exec } from "child_process";
import { promisify } from "util";
import * as os from "os";
import { ramOptimizerService } from "./ramOptimizer";
import { junkFileScanner } from "./junkFileScanner";

const execAsync = promisify(exec);

export interface TurboModeResult {
  enabled: boolean;
  optimizations: string[];
  processesTerminated: number;
  memoryFreed: number;
  spaceFreed: number;
}

export class TurboModeService {
  private isActive = false;
  private originalPowerPlan: string | null = null;
  private originalProcesses: number[] = [];

  async enable(): Promise<TurboModeResult> {
    const optimizations: string[] = [];
    let processesTerminated = 0;
    let memoryFreed = 0;
    let spaceFreed = 0;

    try {
      // 1. Optimize power plan (Windows only)
      if (process.platform === "win32") {
        const powerResult = await this.setHighPerformancePowerPlan();
        if (powerResult) {
          optimizations.push("Power plan set to High Performance");
        }
      }

      // 2. Clear system caches
      const cacheResult = await this.clearSystemCaches();
      if (cacheResult > 0) {
        optimizations.push("System caches cleared");
        spaceFreed += cacheResult;
      }

      // 3. Stop unnecessary services
      const serviceResult = await this.optimizeServices();
      if (serviceResult.stopped > 0) {
        optimizations.push(
          `${serviceResult.stopped} unnecessary services stopped`,
        );
      }

      // 4. Aggressive RAM optimization
      const ramResult = await ramOptimizerService.optimize({
        aggressive: true,
        includeUserApps: true,
      });
      if (ramResult.success) {
        optimizations.push(`Freed ${ramResult.memoryFreed} MB of RAM`);
        processesTerminated = ramResult.processesTerminated;
        memoryFreed = ramResult.memoryFreed;
      }

      // 5. Clean temp files
      const junkResult = await junkFileScanner.cleanByCategory("temp");
      if (junkResult.success) {
        optimizations.push("Temporary files cleaned");
        spaceFreed += junkResult.freedSpace;
      }

      // 6. Disable visual effects (Windows)
      if (process.platform === "win32") {
        await this.disableVisualEffects();
        optimizations.push("Visual effects disabled for maximum performance");
      }

      // 7. Set CPU priority
      await this.setHighPriority();
      optimizations.push("Process priority elevated");

      this.isActive = true;

      return {
        enabled: true,
        optimizations,
        processesTerminated,
        memoryFreed,
        spaceFreed,
      };
    } catch (error) {
      console.error("Error enabling Turbo Mode:", error);
      return {
        enabled: false,
        optimizations: [],
        processesTerminated: 0,
        memoryFreed: 0,
        spaceFreed: 0,
      };
    }
  }

  async disable(): Promise<boolean> {
    try {
      // Restore power plan
      if (process.platform === "win32" && this.originalPowerPlan) {
        await execAsync(`powercfg /setactive ${this.originalPowerPlan}`);
      }

      // Re-enable visual effects
      if (process.platform === "win32") {
        await execAsync(
          'reg add "HKCU\\Control Panel\\Desktop" /v UserPreferencesMask /t REG_BINARY /d 9012008010000000 /f',
        );
      }

      // Restore process priority
      await this.setNormalPriority();

      this.isActive = false;
      return true;
    } catch (error) {
      console.error("Error disabling Turbo Mode:", error);
      return false;
    }
  }

  private async setHighPerformancePowerPlan(): Promise<boolean> {
    try {
      if (process.platform !== "win32") return false;

      // Get current power plan
      const { stdout } = await execAsync("powercfg /getactivescheme");
      this.originalPowerPlan = stdout.match(/GUID: ([\w-]+)/)?.[1] || null;

      // Set to high performance (GUID: 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c)
      await execAsync(
        "powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c",
      );
      return true;
    } catch (error) {
      console.error("Error setting power plan:", error);
      return false;
    }
  }

  private async clearSystemCaches(): Promise<number> {
    let freedSpace = 0;

    try {
      if (process.platform === "win32") {
        // Clear Windows temp
        await execAsync("del /q/f/s %TEMP%\\*");

        // Clear Windows Update cache
        await execAsync("net stop wuauserv");
        await execAsync(
          "rmdir /s /q C:\\Windows\\SoftwareDistribution\\Download",
        );
        await execAsync("net start wuauserv");

        freedSpace = 500 * 1024 * 1024; // Estimate 500MB
      } else if (process.platform === "linux") {
        // Clear various caches
        await execAsync("sudo sync && sudo sysctl -w vm.drop_caches=3");
        freedSpace = 200 * 1024 * 1024; // Estimate 200MB
      }
    } catch (error) {
      console.error("Error clearing caches:", error);
    }

    return freedSpace;
  }

  private async optimizeServices(): Promise<{
    stopped: number;
    services: string[];
  }> {
    const stopped = 0;
    const services: string[] = [];

    try {
      if (process.platform === "win32") {
        // Services that can be safely stopped temporarily
        const safeToStop = [
          "wuauserv", // Windows Update
          "bits", // Background Intelligent Transfer
          "dosvc", // Delivery Optimization
        ];

        for (const service of safeToStop) {
          try {
            await execAsync(`net stop ${service}`);
            services.push(service);
          } catch {
            // Service might not be running
          }
        }
      }
    } catch (error) {
      console.error("Error optimizing services:", error);
    }

    return { stopped: services.length, services };
  }

  private async disableVisualEffects(): Promise<void> {
    try {
      if (process.platform === "win32") {
        // Disable visual effects
        await execAsync(
          'reg add "HKCU\\Control Panel\\Desktop" /v UserPreferencesMask /t REG_BINARY /d 9032078010000000 /f',
        );
        await execAsync(
          'reg add "HKCU\\Control Panel\\Desktop\\WindowMetrics" /v MinAnimate /t REG_SZ /d 0 /f',
        );

        // Set performance options
        await execAsync(
          'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 2 /f',
        );
      }
    } catch (error) {
      console.error("Error disabling visual effects:", error);
    }
  }

  private async setHighPriority(): Promise<void> {
    try {
      // Set our process to high priority
      if (process.platform === "win32") {
        await execAsync(
          `wmic process where "ProcessId=${process.pid}" CALL setpriority 128`,
        );
      } else {
        // Use nice command on Unix systems
        await execAsync(`renice -n -10 -p ${process.pid}`);
      }
    } catch (error) {
      console.error("Error setting high priority:", error);
    }
  }

  private async setNormalPriority(): Promise<void> {
    try {
      if (process.platform === "win32") {
        await execAsync(
          `wmic process where "ProcessId=${process.pid}" CALL setpriority 32`,
        );
      } else {
        // Reset nice value
        await execAsync(`renice -n 0 -p ${process.pid}`);
      }
    } catch (error) {
      console.error("Error setting normal priority:", error);
    }
  }

  isEnabled(): boolean {
    return this.isActive;
  }
}

export const turboModeService = new TurboModeService();
