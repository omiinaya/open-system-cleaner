import { exec } from "child_process";
import { promisify } from "util";
import * as os from "os";
import * as path from "path";
import * as fs from "fs/promises";
import { auditLogger } from "./auditLogger";

const execAsync = promisify(exec);

export interface StartupProgram {
  id: string;
  name: string;
  publisher: string;
  command: string;
  location: string;
  enabled: boolean;
  impact: "low" | "medium" | "high";
  startupType: "registry" | "folder" | "task";
}

export class StartupManagerService {
  async getStartupPrograms(): Promise<StartupProgram[]> {
    const programs: StartupProgram[] = [];

    try {
      if (process.platform === "win32") {
        // Get registry startup entries
        const registryPrograms = await this.getRegistryStartupPrograms();
        programs.push(...registryPrograms);

        // Get startup folder entries
        const folderPrograms = await this.getStartupFolderPrograms();
        programs.push(...folderPrograms);

        // Get scheduled task startup entries
        const taskPrograms = await this.getTaskSchedulerPrograms();
        programs.push(...taskPrograms);
      } else if (process.platform === "darwin") {
        // macOS startup items
        const macPrograms = await this.getMacStartupPrograms();
        programs.push(...macPrograms);
      } else {
        // Linux startup items
        const linuxPrograms = await this.getLinuxStartupPrograms();
        programs.push(...linuxPrograms);
      }
    } catch (error) {
      console.error("Error getting startup programs:", error);
    }

    return programs;
  }

  private async getRegistryStartupPrograms(): Promise<StartupProgram[]> {
    const programs: StartupProgram[] = [];
    const registryPaths = [
      "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
      "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
      "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce",
      "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce",
    ];

    for (const regPath of registryPaths) {
      try {
        const { stdout } = await execAsync(`reg query "${regPath}" /s`);
        const lines = stdout.split("\n");
        let currentName = "";

        for (const line of lines) {
          const trimmed = line.trim();

          // Parse registry entry
          if (
            trimmed &&
            !trimmed.startsWith("HKEY") &&
            trimmed.includes("    ")
          ) {
            const parts = trimmed.split(/\s{2,}/);
            if (parts.length >= 3) {
              const name = parts[0];
              const type = parts[1];
              const value = parts[2];

              programs.push({
                id: `${regPath}\\${name}`,
                name: this.extractProgramName(name, value),
                publisher: "Unknown",
                command: value,
                location: regPath,
                enabled: true,
                impact: this.calculateImpact(value),
                startupType: "registry",
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
      path.join(
        os.homedir(),
        "AppData",
        "Roaming",
        "Microsoft",
        "Windows",
        "Start Menu",
        "Programs",
        "Startup",
      ),
      "C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\StartUp",
    ];

    for (const folder of startupFolders) {
      try {
        const entries = await fs.readdir(folder, { withFileTypes: true });

        for (const entry of entries) {
          if (
            entry.isFile() &&
            (entry.name.endsWith(".lnk") || entry.name.endsWith(".exe"))
          ) {
            const fullPath = path.join(folder, entry.name);
            const name = entry.name.replace(".lnk", "").replace(".exe", "");

            programs.push({
              id: fullPath,
              name,
              publisher: "Unknown",
              command: fullPath,
              location: folder,
              enabled: true,
              impact: this.calculateImpact(fullPath),
              startupType: "folder",
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
      const { stdout } = await execAsync("schtasks /query /fo CSV /nh");
      const lines = stdout.split("\n");

      for (const line of lines) {
        const parts = line.split(",");
        if (parts.length >= 3) {
          const taskName = parts[0].replace(/"/g, "");
          const taskPath = parts[2]?.replace(/"/g, "") || "";

          // Only include startup/logon tasks
          if (
            taskPath.toLowerCase().includes("startup") ||
            taskPath.toLowerCase().includes("logon")
          ) {
            programs.push({
              id: taskName,
              name: taskName,
              publisher: "Unknown",
              command: taskPath,
              location: "Task Scheduler",
              enabled: true,
              impact: this.calculateImpact(taskPath),
              startupType: "task",
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
        path.join(os.homedir(), "Library", "LaunchAgents"),
        "/Library/LaunchAgents",
        "/Library/LaunchDaemons",
        "/System/Library/LaunchAgents",
        "/System/Library/LaunchDaemons",
      ];

      for (const dir of launchDirs) {
        try {
          const entries = await fs.readdir(dir);

          for (const entry of entries) {
            if (entry.endsWith(".plist")) {
              const fullPath = path.join(dir, entry);

              try {
                // Try to parse plist file for better info
                const plistInfo = await this.parsePlistFile(fullPath);

                programs.push({
                  id: fullPath,
                  name: plistInfo.label || entry.replace(".plist", ""),
                  publisher: this.extractPublisherFromPlist(plistInfo),
                  command:
                    plistInfo.program ||
                    plistInfo.programArguments?.[0] ||
                    "LaunchAgent",
                  location: dir,
                  enabled: await this.isLaunchAgentEnabled(fullPath),
                  impact: this.calculateMacImpact(plistInfo),
                  startupType: dir.includes("Daemon") ? "task" : "folder",
                });
              } catch {
                // If parsing fails, add basic info
                programs.push({
                  id: fullPath,
                  name: entry.replace(".plist", ""),
                  publisher: "Unknown",
                  command: "LaunchAgent/LaunchDaemon",
                  location: dir,
                  enabled: true,
                  impact: "medium",
                  startupType: dir.includes("Daemon") ? "task" : "folder",
                });
              }
            }
          }
        } catch {
          // Directory might not exist or not be accessible
        }
      }

      // Also check Login Items using osascript
      try {
        const { stdout } = await execAsync(
          "osascript -e 'tell application \"System Events\" to get the name of every login item'",
        );
        const loginItems = stdout.trim().split(", ");

        for (const item of loginItems) {
          if (item && item !== "missing value") {
            programs.push({
              id: `loginitem-${item}`,
              name: item,
              publisher: "User Login Item",
              command: item,
              location: "Login Items",
              enabled: true,
              impact: "medium",
              startupType: "folder",
            });
          }
        }
      } catch {
        // May not have permission to access login items
      }

      await auditLogger.log("mac_startup_scan", "startupManager", "success", {
        programsFound: programs.length,
      });
    } catch (error) {
      console.error("Error getting macOS startup programs:", error);
      await auditLogger.log(
        "mac_startup_scan_failed",
        "startupManager",
        "failure",
        {
          error: String(error),
        },
      );
    }

    return programs;
  }

  /**
   * Parse a plist file to extract information
   */
  private async parsePlistFile(plistPath: string): Promise<Record<string, string | number | boolean>> {
    try {
      // Use plutil to convert plist to JSON
      const { stdout } = await execAsync(
        `plutil -convert json -o - "${plistPath}"`,
      );
      return JSON.parse(stdout);
    } catch {
      // Fallback: try to read as binary plist (simplified)
      return {};
    }
  }

  /**
   * Extract publisher from plist info
   */
  private extractPublisherFromPlist(plistInfo: Record<string, string | number | boolean | undefined>): string {
    // Try to extract from various plist fields
    if (plistInfo.CFBundleIdentifier) {
      const parts = plistInfo.CFBundleIdentifier.split(".");
      if (parts.length > 1) {
        return parts[1]; // Usually the company name (com.company.app)
      }
    }
    return "Unknown";
  }

  /**
   * Calculate impact for macOS launch agents
   */
  private calculateMacImpact(plistInfo: Record<string, string | number | boolean | undefined>): "low" | "medium" | "high" {
    // Check for high impact indicators
    if (plistInfo.KeepAlive === true) {
      return "high";
    }
    if (plistInfo.RunAtLoad === true) {
      return "medium";
    }
    return "low";
  }

  /**
   * Check if a launch agent is currently enabled
   */
  private async isLaunchAgentEnabled(plistPath: string): Promise<boolean> {
    try {
      // Check if the service is loaded
      const label = path.basename(plistPath, ".plist");
      const { stdout } = await execAsync(`launchctl list | grep "${label}"`);
      return stdout.trim().length > 0;
    } catch {
      return true; // Assume enabled if we can't check
    }
  }

  private async getLinuxStartupPrograms(): Promise<StartupProgram[]> {
    const programs: StartupProgram[] = [];

    try {
      // Check autostart directories
      const autostartDirs = [
        path.join(os.homedir(), ".config", "autostart"),
        "/etc/xdg/autostart",
      ];

      for (const dir of autostartDirs) {
        try {
          const entries = await fs.readdir(dir);

          for (const entry of entries) {
            if (entry.endsWith(".desktop")) {
              const fullPath = path.join(dir, entry);

              programs.push({
                id: fullPath,
                name: entry.replace(".desktop", ""),
                publisher: "Unknown",
                command: fullPath,
                location: dir,
                enabled: true,
                impact: "medium",
                startupType: "folder",
              });
            }
          }
        } catch (error) {
          // Directory might not exist
        }
      }
    } catch (error) {
      console.error("Error getting Linux startup programs:", error);
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

  private calculateImpact(command: string): "low" | "medium" | "high" {
    const lowerCommand = command.toLowerCase();

    // High impact programs
    if (
      lowerCommand.includes("chrome") ||
      lowerCommand.includes("firefox") ||
      lowerCommand.includes("edge") ||
      lowerCommand.includes("spotify") ||
      lowerCommand.includes("discord") ||
      lowerCommand.includes("steam")
    ) {
      return "high";
    }

    // Medium impact
    if (
      lowerCommand.includes("update") ||
      lowerCommand.includes("sync") ||
      lowerCommand.includes("cloud")
    ) {
      return "medium";
    }

    return "low";
  }

  async disableStartupProgram(programId: string): Promise<boolean> {
    try {
      if (process.platform === "win32") {
        // Try to remove from registry
        if (programId.includes("HKEY")) {
          const parts = programId.split("\\\\");
          const regPath = parts.slice(0, -1).join("\\\\");
          const name = parts[parts.length - 1];

          await execAsync(`reg delete "${regPath}" /v "${name}" /f`);
          return true;
        }

        // Try to remove from startup folder (move to disabled folder)
        if (programId.includes("Startup")) {
          const disabledFolder = path.join(
            os.homedir(),
            "AppData",
            "Roaming",
            "Microsoft",
            "Windows",
            "Start Menu",
            "Programs",
            "Startup",
            "Disabled",
          );
          await fs.mkdir(disabledFolder, { recursive: true });
          const destPath = path.join(disabledFolder, path.basename(programId));
          await fs.rename(programId, destPath);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error disabling startup program:", error);
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
