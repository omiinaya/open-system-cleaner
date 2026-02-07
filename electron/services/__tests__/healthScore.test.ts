/**
 * Unit tests for HealthScoreService
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { healthScoreService, HealthFactors, HealthResult } from '../healthScore';
import type { SystemMetrics } from '../systemMetrics';

describe('HealthScoreService', () => {
  let mockMetrics: SystemMetrics;

  beforeEach(() => {
    mockMetrics = {
      cpu: {
        usage: 30,
        cores: 4,
        model: 'Test CPU',
        speed: 2500,
      },
      memory: {
        total: 16384,
        used: 8192,
        free: 8192,
        percentage: 50,
      },
      disk: {
        total: 500000,
        used: 200000,
        free: 300000,
        drives: [],
      },
      network: {
        upload: 50,
        download: 100,
        interface: 'eth0',
      },
    };
  });

  describe('calculateHealthScore', () => {
    it('should return a health result with valid structure', () => {
      const result = healthScoreService.calculateHealthScore(mockMetrics);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('recommendations');
      expect(typeof result.score).toBe('number');
      expect(typeof result.status).toBe('string');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should calculate score between 0 and 100', () => {
      const result = healthScoreService.calculateHealthScore(mockMetrics);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should return excellent status for high score', () => {
      const excellentMetrics: SystemMetrics = {
        ...mockMetrics,
        cpu: { ...mockMetrics.cpu, usage: 5 },
        memory: { ...mockMetrics.memory, percentage: 10 },
        disk: { total: 500000, used: 50000, free: 450000, drives: [] },
      };

      const result = healthScoreService.calculateHealthScore(excellentMetrics, {
        securityIssues: 0,
        startupPrograms: 1,
        systemAge: 0,
      });

      expect(result.status).toBe('excellent');
      expect(result.score).toBeGreaterThanOrEqual(90);
    });

    it('should return poor status for low score', () => {
      const poorMetrics: SystemMetrics = {
        ...mockMetrics,
        cpu: { ...mockMetrics.cpu, usage: 95 },
        memory: { ...mockMetrics.memory, percentage: 95 },
        disk: { total: 500000, used: 475000, free: 25000, drives: [] },
      };

      const result = healthScoreService.calculateHealthScore(poorMetrics, {
        securityIssues: 5,
        startupPrograms: 20,
        systemAge: 30,
      });

      expect(result.status).toBe('poor');
      expect(result.score).toBeLessThan(40);
    });

    it('should consider security issues in score', () => {
      const baseResult = healthScoreService.calculateHealthScore(mockMetrics, {
        securityIssues: 0,
      });

      const withSecurityIssues = healthScoreService.calculateHealthScore(mockMetrics, {
        securityIssues: 5,
      });

      expect(withSecurityIssues.score).toBeLessThan(baseResult.score);
      expect(withSecurityIssues.recommendations.some(r => r.includes('security'))).toBe(true);
    });

    it('should consider startup programs in score', () => {
      const fewStartups = healthScoreService.calculateHealthScore(mockMetrics, {
        startupPrograms: 2,
      });

      const manyStartups = healthScoreService.calculateHealthScore(mockMetrics, {
        startupPrograms: 15,
      });

      expect(manyStartups.score).toBeLessThan(fewStartups.score);
      expect(manyStartups.recommendations.some(r => r.includes('startup'))).toBe(true);
    });

    it('should consider system age in score', () => {
      const recent = healthScoreService.calculateHealthScore(mockMetrics, {
        systemAge: 1,
      });

      const old = healthScoreService.calculateHealthScore(mockMetrics, {
        systemAge: 14,
      });

      expect(old.score).toBeLessThan(recent.score);
      expect(old.recommendations.some(r => r.includes('optimized'))).toBe(true);
    });

    it('should generate appropriate recommendations', () => {
      const highUsageMetrics: SystemMetrics = {
        ...mockMetrics,
        cpu: { ...mockMetrics.cpu, usage: 85 },
        memory: { ...mockMetrics.memory, percentage: 90 },
        disk: { total: 500000, used: 475000, free: 25000, drives: [] },
      };

      const result = healthScoreService.calculateHealthScore(highUsageMetrics, {
        securityIssues: 3,
        startupPrograms: 12,
        systemAge: 10,
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('CPU'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('Memory'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('Disk'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('security'))).toBe(true);
    });

    it('should handle edge case of zero disk total', () => {
      const zeroDiskMetrics: SystemMetrics = {
        ...mockMetrics,
        disk: { ...mockMetrics.disk, total: 0 },
      };

      const result = healthScoreService.calculateHealthScore(zeroDiskMetrics);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should use default values for missing factors', () => {
      const result = healthScoreService.calculateHealthScore(mockMetrics);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.status).toBeDefined();
    });

    it('should handle all status levels', () => {
      // Test excellent status (90+)
      const excellentMetrics: SystemMetrics = {
        ...mockMetrics,
        cpu: { ...mockMetrics.cpu, usage: 10 },
        memory: { ...mockMetrics.memory, percentage: 20 },
        disk: { total: 500000, used: 100000, free: 400000, drives: [] },
      };

      const excellentResult = healthScoreService.calculateHealthScore(excellentMetrics, {
        securityIssues: 0,
        startupPrograms: 1,
        systemAge: 0,
      });

      expect(excellentResult.status).toBe('excellent');

      // Test fair status (40-69)
      const fairMetrics: SystemMetrics = {
        ...mockMetrics,
        cpu: { ...mockMetrics.cpu, usage: 70 },
        memory: { ...mockMetrics.memory, percentage: 80 },
        disk: { total: 500000, used: 450000, free: 50000, drives: [] },
      };

      const fairResult = healthScoreService.calculateHealthScore(fairMetrics, {
        securityIssues: 4,
        startupPrograms: 15,
        systemAge: 10,
      });

      expect(['fair', 'poor']).toContain(fairResult.status);

      // Test poor status (<40)
      const poorMetrics: SystemMetrics = {
        ...mockMetrics,
        cpu: { ...mockMetrics.cpu, usage: 95 },
        memory: { ...mockMetrics.memory, percentage: 95 },
        disk: { total: 500000, used: 490000, free: 10000, drives: [] },
      };

      const poorResult = healthScoreService.calculateHealthScore(poorMetrics, {
        securityIssues: 10,
        startupPrograms: 25,
        systemAge: 30,
      });

      expect(poorResult.status).toBe('poor');
    });
  });

  describe('score calculation weights', () => {
    it('should apply correct weight to CPU score', () => {
      const lowCpu = healthScoreService.calculateHealthScore({
        ...mockMetrics,
        cpu: { ...mockMetrics.cpu, usage: 10 },
      });

      const highCpu = healthScoreService.calculateHealthScore({
        ...mockMetrics,
        cpu: { ...mockMetrics.cpu, usage: 90 },
      });

      // CPU has 20% weight, difference of 80% should affect score by ~16 points
      const scoreDiff = lowCpu.score - highCpu.score;
      expect(scoreDiff).toBeGreaterThan(10);
      expect(scoreDiff).toBeLessThan(25);
    });

    it('should apply correct weight to security score', () => {
      const noSecurityIssues = healthScoreService.calculateHealthScore(mockMetrics, {
        securityIssues: 0,
      });

      const withSecurityIssues = healthScoreService.calculateHealthScore(mockMetrics, {
        securityIssues: 5,
      });

      // Security has 25% weight, each issue deducts 10 points from security score
      // 5 issues = 50 point deduction in security = 12.5 points total
      const scoreDiff = noSecurityIssues.score - withSecurityIssues.score;
      expect(scoreDiff).toBeGreaterThan(10);
      expect(scoreDiff).toBeLessThan(20);
    });
  });
});
