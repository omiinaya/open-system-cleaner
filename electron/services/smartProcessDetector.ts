import { exec } from "child_process";
import { promisify } from "util";
import * as os from "os";
import { auditLogger } from "./auditLogger";

const execAsync = promisify(exec);

export interface ProcessContext {
  pid: number;
  name: string;
  windowTitle?: string;
  isForeground: boolean;
  hasUserInput: boolean;
  lastActivityTime: number;
  unsavedWork: boolean;
  cpuHistory: number[];
  memoryTrend: "increasing" | "decreasing" | "stable";
}

export class SmartProcessDetector {
  private processHistory = new Map<
    number,
    {
      cpuReadings: number[];
      memoryReadings: number[];
      lastCheck: number;
    }
  >();

  private readonly HISTORY_WINDOW = 5; // Keep last 5 readings
  private readonly ACTIVITY_THRESHOLD = 60000; // 1 minute

  /**
   * Get detailed context about a process
   */
  async getProcessContext(
    pid: number,
    processName: string,
  ): Promise<ProcessContext> {
    const context: ProcessContext = {
      pid,
      name: processName,
      isForeground: false,
      hasUserInput: false,
      lastActivityTime: Date.now(),
      unsavedWork: false,
      cpuHistory: [],
      memoryTrend: "stable",
    };

    try {
      // Check if process has visible windows
      context.windowTitle = await this.getWindowTitle(pid);
      context.isForeground = await this.isForegroundProcess(pid);

      // Check last user interaction
      context.lastActivityTime = await this.getLastActivity(pid);
      context.hasUserInput =
        Date.now() - context.lastActivityTime < this.ACTIVITY_THRESHOLD;

      // Check for unsaved work
      context.unsavedWork = await this.hasUnsavedWork(pid, context.windowTitle);

      // Get CPU and memory history
      const history = this.getProcessHistory(pid);
      context.cpuHistory = history.cpuReadings;
      context.memoryTrend = this.calculateMemoryTrend(history.memoryReadings);

      // Update history
      this.updateProcessHistory(pid);
    } catch (error) {
      console.error(`Error getting context for process ${pid}:`, error);
    }

    return context;
  }

  /**
   * Check if a process should be terminated
   */
  async shouldTerminateProcess(
    pid: number,
    processName: string,
  ): Promise<{
    shouldTerminate: boolean;
    reason: string;
  }> {
    const context = await this.getProcessContext(pid, processName);

    // Never terminate if user is actively using it
    if (context.isForeground) {
      return {
        shouldTerminate: false,
        reason: "Process is currently in focus",
      };
    }

    // Never terminate if user recently interacted with it
    if (context.hasUserInput) {
      return {
        shouldTerminate: false,
        reason: `User activity detected ${Math.round((Date.now() - context.lastActivityTime) / 1000)}s ago`,
      };
    }

    // Never terminate if it has unsaved work
    if (context.unsavedWork) {
      return {
        shouldTerminate: false,
        reason: "Process may have unsaved work",
      };
    }

    // Check if memory is actively being used (not a leak)
    if (context.memoryTrend === "increasing") {
      await auditLogger.log(
        "process_memory_increasing",
        "smartProcessDetector",
        "warning",
        {
          pid,
          name: processName,
        },
      );
      // Still allow termination, but log it
    }

    // Check CPU history - if consistently high, might be important
    const avgCpu =
      context.cpuHistory.reduce((a, b) => a + b, 0) / context.cpuHistory.length;
    if (avgCpu > 50 && context.cpuHistory.length >= 3) {
      return {
        shouldTerminate: false,
        reason: `High CPU usage (${avgCpu.toFixed(1)}%) - process may be performing important work`,
      };
    }

    return {
      shouldTerminate: true,
      reason: "Process is safe to terminate",
    };
  }

  /**
   * Get the window title of a process
   */
  private async getWindowTitle(pid: number): Promise<string | undefined> {
    if (process.platform !== "win32") {
      // On Linux, try using xdotool or wmctrl
      try {
        const { stdout } = await execAsync(
          `xdotool getwindowname $(xdotool search --pid ${pid} | head -1) 2>/dev/null || echo ""`,
        );
        return stdout.trim() || undefined;
      } catch {
        return undefined;
      }
    }

    try {
      // Use PowerShell to get window title
      const script = `
        Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        public class WinAPI {
          [DllImport("user32.dll")]
          public static extern IntPtr GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
          
          [DllImport("user32.dll", CharSet = CharSet.Auto)]
          public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
        }
        "@
        
        Get-Process -Id ${pid} | Select-Object -ExpandProperty MainWindowTitle
      `;
      const { stdout } = await execAsync(`powershell -Command "${script}"`);
      const title = stdout.trim();
      return title || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Check if process is currently in foreground
   */
  private async isForegroundProcess(pid: number): Promise<boolean> {
    if (process.platform !== "win32") {
      // On Linux, check if window is active
      try {
        const { stdout } = await execAsync(
          'xdotool getactivewindow getwindowpid 2>/dev/null || echo "0"',
        );
        return parseInt(stdout.trim(), 10) === pid;
      } catch {
        return false;
      }
    }

    try {
      const script = `
        Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        public class ForegroundWindow {
          [DllImport("user32.dll")]
          public static extern IntPtr GetForegroundWindow();
          
          [DllImport("user32.dll")]
          public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
        }
        "@
        
        $hwnd = [ForegroundWindow]::GetForegroundWindow()
        $pid = 0
        [void][ForegroundWindow]::GetWindowThreadProcessId($hwnd, [ref]$pid)
        $pid
      `;
      const { stdout } = await execAsync(`powershell -Command "${script}"`);
      return parseInt(stdout.trim(), 10) === pid;
    } catch {
      return false;
    }
  }

  /**
   * Get the last activity time for a process
   */
  private async getLastActivity(pid: number): Promise<number> {
    // This is a simplified implementation
    // In reality, you'd need to hook into system APIs to track actual user input per process
    try {
      // Check process start time as fallback
      const { stdout } = await execAsync(
        `ps -p ${pid} -o lstart= 2>/dev/null || echo ""`,
      );
      if (stdout.trim()) {
        return new Date(stdout.trim()).getTime();
      }
    } catch {
      // Fall through to default
    }

    // Default to current time if we can't determine
    return Date.now();
  }

  /**
   * Check if a process has unsaved work
   */
  private async hasUnsavedWork(
    pid: number,
    windowTitle?: string,
  ): Promise<boolean> {
    // Check window title for indicators of unsaved work
    if (windowTitle) {
      const unsavedIndicators = ["*", "●", "modified", "edited", "unsaved"];
      if (
        unsavedIndicators.some((indicator) => windowTitle.includes(indicator))
      ) {
        return true;
      }
    }

    // Check for common applications with unsaved work indicators
    try {
      // This is platform-specific and simplified
      // A real implementation would check application-specific APIs
      if (process.platform === "win32") {
        // Could check for specific window classes or behaviors
        return false;
      }
    } catch {
      // Ignore errors
    }

    return false;
  }

  /**
   * Get process history
   */
  private getProcessHistory(pid: number): {
    cpuReadings: number[];
    memoryReadings: number[];
  } {
    const history = this.processHistory.get(pid);
    if (history) {
      return {
        cpuReadings: history.cpuReadings,
        memoryReadings: history.memoryReadings,
      };
    }
    return { cpuReadings: [], memoryReadings: [] };
  }

  /**
   * Update process history with current metrics
   */
  private async updateProcessHistory(pid: number): Promise<void> {
    try {
      // Get current CPU and memory usage for this process
      // This would require platform-specific implementations
      // For now, we'll just track that we checked it
      const existing = this.processHistory.get(pid) || {
        cpuReadings: [],
        memoryReadings: [],
        lastCheck: Date.now(),
      };

      // Clean up old history entries
      if (Date.now() - existing.lastCheck > 300000) {
        // 5 minutes
        this.processHistory.delete(pid);
        return;
      }

      existing.lastCheck = Date.now();
      this.processHistory.set(pid, existing);
    } catch (error) {
      console.error(`Error updating history for process ${pid}:`, error);
    }
  }

  /**
   * Calculate memory usage trend
   */
  private calculateMemoryTrend(
    readings: number[],
  ): "increasing" | "decreasing" | "stable" {
    if (readings.length < 3) {
      return "stable";
    }

    const first = readings[0];
    const last = readings[readings.length - 1];
    const change = ((last - first) / first) * 100;

    if (change > 20) {
      return "increasing";
    } else if (change < -20) {
      return "decreasing";
    }

    return "stable";
  }

  /**
   * Clean up old history entries
   */
  cleanupOldHistory(): void {
    const now = Date.now();
    for (const [pid, history] of this.processHistory.entries()) {
      if (now - history.lastCheck > 600000) {
        // 10 minutes
        this.processHistory.delete(pid);
      }
    }
  }
}

export const smartProcessDetector = new SmartProcessDetector();
