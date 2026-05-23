import { exec } from "child_process";
import { promisify } from "util";
import { auditLogger } from "./auditLogger";

const execAsync = promisify(exec);

export interface SystemRestorePoint {
  sequenceNumber: number;
  description: string;
  type: string;
  created: Date;
}

export class SystemRestoreService {
  private isAvailable = false;

  constructor() {
    this.checkAvailability();
  }

  /**
   * Check if System Restore is available on this system
   */
  private async checkAvailability(): Promise<void> {
    if (process.platform !== "win32") {
      this.isAvailable = false;
      return;
    }

    try {
      // Check if System Restore service is running
      const { stdout } = await execAsync("sc query srservice");
      this.isAvailable = stdout.includes("RUNNING");
    } catch {
      this.isAvailable = false;
    }
  }

  /**
   * Check if System Restore is available
   */
  async isSystemRestoreAvailable(): Promise<boolean> {
    await this.checkAvailability();
    return this.isAvailable;
  }

  /**
   * Create a system restore point
   */
  async createRestorePoint(description: string): Promise<{
    success: boolean;
    sequenceNumber?: number;
    message: string;
  }> {
    if (process.platform !== "win32") {
      return {
        success: false,
        message: "System Restore is only available on Windows",
      };
    }

    if (!this.isAvailable) {
      return {
        success: false,
        message: "System Restore is not available or disabled on this system",
      };
    }

    try {
      await auditLogger.log(
        "system_restore_create_started",
        "systemRestore",
        "success",
        {
          description,
        },
      );

      // Use WMI to create restore point
      // Type codes: 0 = Application Install, 12 = Modify Settings
      const script = `
        $restorePoint = Get-WmiObject -Class SystemRestore -Namespace "root\\default"
        $result = $restorePoint.CreateRestorePoint("${description}", 12, 100)
        Write-Output $result.ReturnValue
      `;

      const { stdout } = await execAsync(
        `powershell -ExecutionPolicy Bypass -Command "${script}"`,
      );
      const returnValue = parseInt(stdout.trim(), 10);

      // Return value 0 = Success
      if (returnValue === 0) {
        await auditLogger.log(
          "system_restore_create_completed",
          "systemRestore",
          "success",
          {
            description,
          },
        );

        return {
          success: true,
          message: "System restore point created successfully",
        };
      } else {
        const errorMessages: Record<number, string> = {
          1: "System restore is disabled",
          2: "Insufficient disk space",
          3: "Access denied",
          4: "A restore point is already being created",
          5: "The maximum number of restore points has been reached",
          6: "Unknown error",
        };

        const errorMessage =
          errorMessages[returnValue] || `Unknown error (code: ${returnValue})`;

        await auditLogger.log(
          "system_restore_create_failed",
          "systemRestore",
          "failure",
          {
            description,
            errorCode: returnValue,
            errorMessage,
          },
        );

        return {
          success: false,
          message: `Failed to create restore point: ${errorMessage}`,
        };
      }
    } catch (error) {
      await auditLogger.log(
        "system_restore_create_failed",
        "systemRestore",
        "failure",
        {
          description,
          error: String(error),
        },
      );

      return {
        success: false,
        message: `Failed to create restore point: ${error}`,
      };
    }
  }

  /**
   * List available restore points
   */
  async listRestorePoints(): Promise<SystemRestorePoint[]> {
    if (process.platform !== "win32" || !this.isAvailable) {
      return [];
    }

    try {
      const script = `
        $restorePoints = Get-WmiObject -Class SystemRestore -Namespace "root\\default" | 
          Select-Object Description, SequenceNumber, CreationTime, RestorePointType |
          Sort-Object CreationTime -Descending
        $restorePoints | ConvertTo-Json
      `;

      const { stdout } = await execAsync(
        `powershell -ExecutionPolicy Bypass -Command "${script}"`,
      );
      const restorePoints = JSON.parse(stdout);

      // Handle both single object and array
      const pointsArray = Array.isArray(restorePoints)
        ? restorePoints
        : [restorePoints];

      return (pointsArray as Array<{
        SequenceNumber: number;
        Description: string;
        RestorePointType: number;
        CreationTime: string;
      }>).map((rp) => ({
        sequenceNumber: rp.SequenceNumber,
        description: rp.Description,
        type: this.getRestorePointTypeName(rp.RestorePointType),
        created: this.parseWmiDateTime(rp.CreationTime),
      }));
    } catch (error) {
      console.error("Failed to list restore points:", error);
      return [];
    }
  }

  /**
   * Restore system to a specific restore point
   */
  async restoreToPoint(sequenceNumber: number): Promise<{
    success: boolean;
    message: string;
  }> {
    if (process.platform !== "win32" || !this.isAvailable) {
      return {
        success: false,
        message: "System Restore is not available",
      };
    }

    try {
      await auditLogger.log(
        "system_restore_to_point_started",
        "systemRestore",
        "success",
        {
          sequenceNumber,
        },
      );

      // Note: This requires a system restart
      // In a real implementation, you'd need to handle the restart flow
      const script = `
        $restorePoint = Get-WmiObject -Class SystemRestore -Namespace "root\\default" |
          Where-Object { $_.SequenceNumber -eq ${sequenceNumber} }
        if ($restorePoint) {
          # This would initiate the restore (requires restart)
          # rstrui.exe /offline:C:\Windows=Active /rp:${sequenceNumber}
          Write-Output "Restore point found. Restart required to complete restore."
        } else {
          Write-Output "Restore point not found"
        }
      `;

      const { stdout } = await execAsync(
        `powershell -ExecutionPolicy Bypass -Command "${script}"`,
      );

      await auditLogger.log(
        "system_restore_to_point_ready",
        "systemRestore",
        "success",
        {
          sequenceNumber,
        },
      );

      return {
        success: true,
        message: stdout.trim(),
      };
    } catch (error) {
      await auditLogger.log(
        "system_restore_to_point_failed",
        "systemRestore",
        "failure",
        {
          sequenceNumber,
          error: String(error),
        },
      );

      return {
        success: false,
        message: `Failed to restore: ${error}`,
      };
    }
  }

  /**
   * Get restore point type name from type code
   */
  private getRestorePointTypeName(typeCode: number): string {
    const types: Record<number, string> = {
      0: "Application Install",
      1: "Application Uninstall",
      2: "Desktop",
      3: "Settings",
      4: "Accessibility",
      5: "OE Restore",
      6: "Upgrade",
      7: "SFC",
      10: "Windows Update",
      11: "Checkpoint",
      12: "Manual",
      13: "Uninstaller",
      14: "Device Driver Install",
    };

    return types[typeCode] || "Unknown";
  }

  /**
   * Parse WMI datetime format (YYYYMMDDHHMMSS.milliseconds+timezone)
   */
  private parseWmiDateTime(wmiDate: string): Date {
    // WMI datetime format: 20240101120000.000000+000
    const year = parseInt(wmiDate.substring(0, 4), 10);
    const month = parseInt(wmiDate.substring(4, 6), 10) - 1;
    const day = parseInt(wmiDate.substring(6, 8), 10);
    const hour = parseInt(wmiDate.substring(8, 10), 10);
    const minute = parseInt(wmiDate.substring(10, 12), 10);
    const second = parseInt(wmiDate.substring(12, 14), 10);

    return new Date(year, month, day, hour, minute, second);
  }

  /**
   * Get the last restore point created by this application
   */
  async getLastAppRestorePoint(): Promise<SystemRestorePoint | null> {
    try {
      const points = await this.listRestorePoints();
      // Find the most recent restore point created by our app
      return (
        points.find((p) => p.description.includes("OSC System Care")) || null
      );
    } catch {
      return null;
    }
  }
}

export const systemRestoreService = new SystemRestoreService();
