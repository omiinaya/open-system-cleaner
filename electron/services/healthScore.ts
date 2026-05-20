import type { SystemMetrics } from "./systemMetrics";

export interface HealthFactors {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  securityIssues: number;
  startupPrograms: number;
  systemAge: number; // days since last optimization
}

export interface HealthResult {
  score: number;
  status: "excellent" | "good" | "fair" | "poor";
  recommendations: string[];
}

export class HealthScoreService {
  calculateHealthScore(
    metrics: SystemMetrics,
    factors: Partial<HealthFactors> = {},
  ): HealthResult {
    const defaults: HealthFactors = {
      cpuUsage: metrics.cpu.usage,
      memoryUsage: metrics.memory.percentage,
      diskUsage:
        metrics.disk.total > 0
          ? (metrics.disk.used / metrics.disk.total) * 100
          : 0,
      securityIssues: factors.securityIssues || 0,
      startupPrograms: factors.startupPrograms || 0,
      systemAge: factors.systemAge || 0,
    };

    const healthFactors = { ...defaults, ...factors };

    // Individual scores (0-100)
    const cpuScore = Math.max(0, 100 - healthFactors.cpuUsage);
    const memoryScore = Math.max(0, 100 - healthFactors.memoryUsage);
    const diskScore = Math.max(0, 100 - healthFactors.diskUsage);
    const securityScore =
      healthFactors.securityIssues === 0
        ? 100
        : Math.max(0, 100 - healthFactors.securityIssues * 10);
    const startupScore = Math.max(0, 100 - healthFactors.startupPrograms * 5);
    const ageScore = Math.max(0, 100 - healthFactors.systemAge * 0.5);

    // Weighted average
    const weights = {
      cpu: 0.2,
      memory: 0.2,
      disk: 0.15,
      security: 0.25,
      startup: 0.1,
      age: 0.1,
    };

    const totalScore =
      cpuScore * weights.cpu +
      memoryScore * weights.memory +
      diskScore * weights.disk +
      securityScore * weights.security +
      startupScore * weights.startup +
      ageScore * weights.age;

    const score = Math.round(totalScore);

    return {
      score,
      status: this.getStatusFromScore(score),
      recommendations: this.getHealthRecommendations(healthFactors),
    };
  }

  private getStatusFromScore(
    score: number,
  ): "excellent" | "good" | "fair" | "poor" {
    if (score >= 90) return "excellent";
    if (score >= 70) return "good";
    if (score >= 40) return "fair";
    return "poor";
  }

  private getHealthRecommendations(factors: HealthFactors): string[] {
    const recommendations: string[] = [];

    if (factors.cpuUsage > 80) {
      recommendations.push(
        "High CPU usage detected. Consider closing unnecessary applications.",
      );
    }

    if (factors.memoryUsage > 85) {
      recommendations.push(
        "Memory usage is high. Run RAM optimizer to free up memory.",
      );
    }

    if (factors.diskUsage > 90) {
      recommendations.push(
        "Disk space is critically low. Clean junk files and remove large files.",
      );
    }

    if (factors.securityIssues > 0) {
      recommendations.push(
        `${factors.securityIssues} security issues found. Run vulnerability scan immediately.`,
      );
    }

    if (factors.startupPrograms > 10) {
      recommendations.push(
        "Too many startup programs. Disable unnecessary ones to improve boot time.",
      );
    }

    if (factors.systemAge > 7) {
      recommendations.push(
        "System hasn't been optimized in over a week. Run full optimization.",
      );
    }

    return recommendations;
  }
}

export const healthScoreService = new HealthScoreService();
