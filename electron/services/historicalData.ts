import * as path from 'path';
import * as fs from 'fs/promises';
import { app } from 'electron';
import type { SystemMetrics } from './systemMetrics';

export interface HistoricalDataPoint {
  timestamp: number;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    percentage: number;
  };
  network: {
    upload: number;
    download: number;
  };
}

export class HistoricalDataService {
  private dataDir: string;
  private currentData: HistoricalDataPoint[] = [];
  private readonly maxInMemoryPoints = 2880; // 24 hours of 30-second intervals
  private saveInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Use userData directory for Electron apps
    this.dataDir = app.getPath('userData');
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadData();
      
      // Auto-save every 5 minutes
      this.saveInterval = setInterval(() => {
        this.saveData();
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  private getStoragePath(): string {
    return path.join(this.dataDir, 'historical-metrics.json');
  }

  async storeMetrics(metrics: SystemMetrics) {
    const dataPoint: HistoricalDataPoint = {
      timestamp: Date.now(),
      cpu: {
        usage: metrics.cpu.usage,
        cores: metrics.cpu.cores,
      },
      memory: {
        total: metrics.memory.total,
        used: metrics.memory.used,
        percentage: metrics.memory.percentage,
      },
      disk: {
        total: metrics.disk.total,
        used: metrics.disk.used,
        percentage: metrics.disk.total > 0 
          ? (metrics.disk.used / metrics.disk.total) * 100 
          : 0,
      },
      network: {
        upload: metrics.network.upload,
        download: metrics.network.download,
      },
    };

    this.currentData.push(dataPoint);

    // Keep only recent data in memory
    if (this.currentData.length > this.maxInMemoryPoints) {
      this.currentData = this.currentData.slice(-this.maxInMemoryPoints);
    }
  }

  async getMetrics(timeRange: '1h' | '24h' | '7d' | '30d'): Promise<HistoricalDataPoint[]> {
    const now = Date.now();
    const startTime = {
      '1h': now - 60 * 60 * 1000,
      '24h': now - 24 * 60 * 60 * 1000,
      '7d': now - 7 * 24 * 60 * 60 * 1000,
      '30d': now - 30 * 24 * 60 * 60 * 1000,
    }[timeRange];

    // Aggregate data based on time range
    const filtered = this.currentData.filter(d => d.timestamp >= startTime);
    
    // For longer time ranges, aggregate data points
    if (timeRange === '7d' || timeRange === '30d') {
      return this.aggregateData(filtered, timeRange === '7d' ? 10 : 30);
    }

    return filtered;
  }

  private aggregateData(data: HistoricalDataPoint[], pointsPerGroup: number): HistoricalDataPoint[] {
    const aggregated: HistoricalDataPoint[] = [];
    
    for (let i = 0; i < data.length; i += pointsPerGroup) {
      const group = data.slice(i, i + pointsPerGroup);
      if (group.length === 0) continue;

      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

      aggregated.push({
        timestamp: group[Math.floor(group.length / 2)].timestamp,
        cpu: {
          usage: Math.round(avg(group.map(d => d.cpu.usage))),
          cores: group[0].cpu.cores,
        },
        memory: {
          total: group[0].memory.total,
          used: Math.round(avg(group.map(d => d.memory.used))),
          percentage: Math.round(avg(group.map(d => d.memory.percentage))),
        },
        disk: {
          total: group[0].disk.total,
          used: Math.round(avg(group.map(d => d.disk.used))),
          percentage: Math.round(avg(group.map(d => d.disk.percentage))),
        },
        network: {
          upload: Math.round(avg(group.map(d => d.network.upload))),
          download: Math.round(avg(group.map(d => d.network.download))),
        },
      });
    }

    return aggregated;
  }

  private async loadData() {
    try {
      const filePath = this.getStoragePath();
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      this.currentData = parsed.data || [];
    } catch (error) {
      // File doesn't exist or is corrupted, start fresh
      this.currentData = [];
    }
  }

  private async saveData() {
    try {
      const filePath = this.getStoragePath();
      const data = {
        lastUpdated: Date.now(),
        data: this.currentData,
      };
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving historical data:', error);
    }
  }

  async cleanupOldData(retentionDays = 30) {
    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    this.currentData = this.currentData.filter(d => d.timestamp >= cutoffTime);
    await this.saveData();
  }

  stop() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    this.saveData();
  }
}

export const historicalDataService = new HistoricalDataService();
