import * as os from "os";
import si from "systeminformation";
import { app } from "electron";
import * as path from "path";
import * as fs from "fs/promises";
import { CONSTANTS } from "../constants";
import { auditLogger } from "./auditLogger";

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    speed: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    drives: DiskDrive[];
  };
  network: {
    upload: number;
    download: number;
    interface: string;
  };
}

export interface DiskDrive {
  letter: string;
  label: string;
  total: number;
  used: number;
  free: number;
  type: "SSD" | "HDD";
}

export class SystemMetricsService {
  private interval: NodeJS.Timeout | null = null;
  private metricsHistory: SystemMetrics[] = [];
  private readonly maxHistoryLength = 1440; // 24 hours of minute-by-minute data

  // Adaptive polling
  private adaptiveInterval = CONSTANTS.METRICS_UPDATE_INTERVAL_MS;
  private lastCpuUsage = 0;
  private consecutiveIdleChecks = 0;

  // Caching
  private cache = new Map<string, { value: any; timestamp: number }>();
  private readonly CACHE_TTL = CONSTANTS.CACHE_TTL_MS;

  /**
   * Adjust polling interval based on system activity
   */
  private adjustPollingInterval(currentCpuUsage: number): void {
    const isIdle = currentCpuUsage < 10 && this.lastCpuUsage < 10;

    if (isIdle) {
      this.consecutiveIdleChecks++;
      // Gradually increase interval up to 30 seconds when idle
      if (this.consecutiveIdleChecks > 3) {
        this.adaptiveInterval = Math.min(30000, this.adaptiveInterval + 1000);
      }
    } else {
      this.consecutiveIdleChecks = 0;
      this.adaptiveInterval = CONSTANTS.METRICS_UPDATE_INTERVAL_MS;
    }

    this.lastCpuUsage = currentCpuUsage;
  }

  /**
   * Get cached value or compute new value
   */
  private async getCachedOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
  ): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    const value = await compute();
    this.cache.set(key, { value, timestamp: Date.now() });
    return value;
  }

  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const metrics = await this.getMetrics();

      // Check disk space
      const freeGB = metrics.disk.free / (1024 * 1024 * 1024);
      if (freeGB < CONSTANTS.LOW_DISK_SPACE_GB) {
        issues.push(
          `Critical: Less than ${CONSTANTS.LOW_DISK_SPACE_GB}GB disk space remaining (${freeGB.toFixed(2)}GB free)`,
        );
      }

      // Check memory
      if (metrics.memory.percentage > CONSTANTS.HIGH_MEMORY_PERCENTAGE) {
        issues.push(
          `Warning: Memory usage critical (${metrics.memory.percentage.toFixed(1)}%)`,
        );
      }

      // Check CPU
      if (metrics.cpu.usage > CONSTANTS.HIGH_CPU_PERCENTAGE) {
        issues.push(`Warning: High CPU usage (${metrics.cpu.usage}%)`);
      }

      await auditLogger.log(
        "health_check",
        "systemMetrics",
        issues.length === 0 ? "success" : "warning",
        {
          healthy: issues.length === 0,
          issueCount: issues.length,
          cpuUsage: metrics.cpu.usage,
          memoryUsage: metrics.memory.percentage,
          diskFree: freeGB,
        },
      );
    } catch (error) {
      issues.push(`Error performing health check: ${error}`);
      await auditLogger.log("health_check_failed", "systemMetrics", "failure", {
        error: String(error),
      });
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
  }

  async getMetrics(): Promise<SystemMetrics> {
    return await this.getCachedOrCompute("system_metrics", async () => {
      const [cpuLoad, mem, fsSize, networkStats] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
      ]);

      const cpuInfo = os.cpus()[0];
      const drives = fsSize.map((drive: any) => ({
        letter: drive.fs,
        label: drive.fs,
        total: drive.size,
        used: drive.used,
        free: drive.available,
        type: "SSD" as const, // Default, would need additional detection
      }));

      const metrics: SystemMetrics = {
        cpu: {
          usage: Math.round(cpuLoad.currentLoad),
          cores: os.cpus().length,
          speed: cpuInfo ? cpuInfo.speed : 0,
          model: cpuInfo ? cpuInfo.model : "Unknown",
        },
        memory: {
          total: mem.total,
          used: mem.active,
          free: mem.available,
          percentage: Math.round((mem.active / mem.total) * 100),
        },
        disk: {
          total: drives.reduce((acc, d) => acc + d.total, 0),
          used: drives.reduce((acc, d) => acc + d.used, 0),
          free: drives.reduce((acc, d) => acc + d.free, 0),
          drives,
        },
        network: {
          upload: networkStats[0]?.tx_sec || 0,
          download: networkStats[0]?.rx_sec || 0,
          interface: networkStats[0]?.iface || "unknown",
        },
      };

      // Store in history
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > this.maxHistoryLength) {
        this.metricsHistory.shift();
      }

      // Adjust polling interval based on CPU usage
      this.adjustPollingInterval(metrics.cpu.usage);

      return metrics;
    });
  }

  startMonitoring(
    callback: (metrics: SystemMetrics) => void,
    _interval = 5000,
  ) {
    // Use adaptive interval instead of fixed interval
    const runCheck = async () => {
      try {
        const metrics = await this.getMetrics();
        callback(metrics);

        // Schedule next check with adaptive interval
        this.interval = setTimeout(runCheck, this.adaptiveInterval);
      } catch (error) {
        console.error("Error collecting system metrics:", error);
        // Retry after a delay on error
        this.interval = setTimeout(runCheck, 10000);
      }
    };

    // Start first check immediately
    runCheck();
  }

  stopMonitoring() {
    if (this.interval) {
      clearTimeout(this.interval);
      this.interval = null;
    }
  }

  getHistory(timeRange: "1h" | "24h" | "7d" | "30d"): SystemMetrics[] {
    const now = Date.now();
    const startTime = {
      "1h": now - 60 * 60 * 1000,
      "24h": now - 24 * 60 * 60 * 1000,
      "7d": now - 7 * 24 * 60 * 60 * 1000,
      "30d": now - 30 * 24 * 60 * 60 * 1000,
    }[timeRange];

    // Return appropriate slice based on time range
    // Since we collect every 5 seconds, we need to adjust
    const points = {
      "1h": 720, // 1 hour at 5 second intervals
      "24h": 2880, // 24 hours at 30 second intervals
      "7d": 2016, // 7 days at 5 minute intervals
      "30d": 2880, // 30 days at 15 minute intervals
    }[timeRange];

    return this.metricsHistory.slice(-points);
  }
}

export const systemMetricsService = new SystemMetricsService();
