import * as os from 'os';
import si from 'systeminformation';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';

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
  type: 'SSD' | 'HDD';
}

export class SystemMetricsService {
  private interval: NodeJS.Timeout | null = null;
  private metricsHistory: SystemMetrics[] = [];
  private readonly maxHistoryLength = 1440; // 24 hours of minute-by-minute data

  async getMetrics(): Promise<SystemMetrics> {
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
      type: 'SSD' as const, // Default, would need additional detection
    }));

    const metrics: SystemMetrics = {
      cpu: {
        usage: Math.round(cpuLoad.currentLoad),
        cores: os.cpus().length,
        speed: cpuInfo ? cpuInfo.speed : 0,
        model: cpuInfo ? cpuInfo.model : 'Unknown',
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
        interface: networkStats[0]?.iface || 'unknown',
      },
    };

    // Store in history
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistoryLength) {
      this.metricsHistory.shift();
    }

    return metrics;
  }

  startMonitoring(callback: (metrics: SystemMetrics) => void, interval = 5000) {
    this.interval = setInterval(async () => {
      try {
        const metrics = await this.getMetrics();
        callback(metrics);
      } catch (error) {
        console.error('Error collecting system metrics:', error);
      }
    }, interval);
  }

  stopMonitoring() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  getHistory(timeRange: '1h' | '24h' | '7d' | '30d'): SystemMetrics[] {
    const now = Date.now();
    const startTime = {
      '1h': now - 60 * 60 * 1000,
      '24h': now - 24 * 60 * 60 * 1000,
      '7d': now - 7 * 24 * 60 * 60 * 1000,
      '30d': now - 30 * 24 * 60 * 60 * 1000,
    }[timeRange];

    // Return appropriate slice based on time range
    // Since we collect every 5 seconds, we need to adjust
    const points = {
      '1h': 720, // 1 hour at 5 second intervals
      '24h': 2880, // 24 hours at 30 second intervals
      '7d': 2016, // 7 days at 5 minute intervals
      '30d': 2880, // 30 days at 15 minute intervals
    }[timeRange];

    return this.metricsHistory.slice(-points);
  }
}

export const systemMetricsService = new SystemMetricsService();
