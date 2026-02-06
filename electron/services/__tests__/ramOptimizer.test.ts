/**
 * Unit tests for RAMOptimizerService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ramOptimizerService, ProcessInfo, RAMOptimizationResult } from '../ramOptimizer';

describe('RAMOptimizerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRunningProcesses', () => {
    it('should return an array of process information', async () => {
      const processes = await ramOptimizerService.getRunningProcesses();

      expect(Array.isArray(processes)).toBe(true);
    });

    it('should return processes with required fields', async () => {
      const processes = await ramOptimizerService.getRunningProcesses();

      if (processes.length > 0) {
        const process = processes[0];
        expect(process).toHaveProperty('pid');
        expect(process).toHaveProperty('name');
        expect(process).toHaveProperty('cpu');
        expect(process).toHaveProperty('memory');
        expect(process).toHaveProperty('memoryPercent');
        expect(process).toHaveProperty('isSystem');
        expect(typeof process.pid).toBe('number');
        expect(typeof process.name).toBe('string');
        expect(typeof process.memory).toBe('number');
      }
    });

    it('should sort processes by memory usage (highest first)', async () => {
      const processes = await ramOptimizerService.getRunningProcesses();

      if (processes.length > 1) {
        for (let i = 0; i < processes.length - 1; i++) {
          expect(processes[i].memory).toBeGreaterThanOrEqual(processes[i + 1].memory);
        }
      }
    });

    it('should only include processes using more than 10MB', async () => {
      const processes = await ramOptimizerService.getRunningProcesses();

      processes.forEach(process => {
        expect(process.memory).toBeGreaterThanOrEqual(10);
      });
    });
  });

  describe('optimize', () => {
    it('should return optimization result with proper structure', async () => {
      const result = await ramOptimizerService.optimize();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('memoryFreed');
      expect(result).toHaveProperty('processesTerminated');
      expect(result).toHaveProperty('processes');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.memoryFreed).toBe('number');
      expect(typeof result.processesTerminated).toBe('number');
      expect(Array.isArray(result.processes)).toBe(true);
    });

    it('should not terminate whitelisted processes', async () => {
      const result = await ramOptimizerService.optimize();

      // Check that no critical system processes were terminated
      const criticalProcesses = ['system', 'kernel', 'explorer.exe', 'finder'];
      const terminatedCritical = result.processes.some(p => 
        criticalProcesses.some(cp => p.name.toLowerCase().includes(cp))
      );

      // In a real scenario, these should never be terminated
      // Note: This test might be environment-dependent
      expect(terminatedCritical).toBe(false);
    });

    it('should respect aggressive mode option', async () => {
      const normalResult = await ramOptimizerService.optimize({ aggressive: false });
      const aggressiveResult = await ramOptimizerService.optimize({ aggressive: true });

      // Aggressive mode might terminate more processes
      // But we can't guarantee this in tests, so we just check structure
      expect(normalResult).toHaveProperty('success');
      expect(aggressiveResult).toHaveProperty('success');
    });

    it('should respect includeUserApps option', async () => {
      const systemOnlyResult = await ramOptimizerService.optimize({ includeUserApps: false });
      const includeUserResult = await ramOptimizerService.optimize({ includeUserApps: true });

      expect(systemOnlyResult).toHaveProperty('success');
      expect(includeUserResult).toHaveProperty('success');
    });

    it('should limit terminated processes to 10', async () => {
      const result = await ramOptimizerService.optimize({ aggressive: true, includeUserApps: true });

      expect(result.processesTerminated).toBeLessThanOrEqual(10);
      expect(result.processes.length).toBeLessThanOrEqual(10);
    });

    it('should report memory freed as positive number when processes terminated', async () => {
      const result = await ramOptimizerService.optimize();

      if (result.processesTerminated > 0) {
        expect(result.memoryFreed).toBeGreaterThan(0);
      }
    });
  });

  describe('getMemoryInfo', () => {
    it('should return memory information with required fields', async () => {
      const memoryInfo = await ramOptimizerService.getMemoryInfo();

      expect(memoryInfo).toHaveProperty('total');
      expect(memoryInfo).toHaveProperty('used');
      expect(memoryInfo).toHaveProperty('free');
      expect(memoryInfo).toHaveProperty('percentage');
      expect(typeof memoryInfo.total).toBe('number');
      expect(typeof memoryInfo.used).toBe('number');
      expect(typeof memoryInfo.free).toBe('number');
      expect(typeof memoryInfo.percentage).toBe('number');
    });

    it('should return consistent memory values', async () => {
      const memoryInfo = await ramOptimizerService.getMemoryInfo();

      // Total should equal used + free (approximately, due to rounding)
      const calculatedTotal = memoryInfo.used + memoryInfo.free;
      expect(Math.abs(memoryInfo.total - calculatedTotal)).toBeLessThan(memoryInfo.total * 0.1);
    });

    it('should return percentage between 0 and 100', async () => {
      const memoryInfo = await ramOptimizerService.getMemoryInfo();

      expect(memoryInfo.percentage).toBeGreaterThanOrEqual(0);
      expect(memoryInfo.percentage).toBeLessThanOrEqual(100);
    });

    it('should calculate percentage correctly', async () => {
      const memoryInfo = await ramOptimizerService.getMemoryInfo();

      const calculatedPercentage = Math.round((memoryInfo.used / memoryInfo.total) * 100);
      expect(memoryInfo.percentage).toBe(calculatedPercentage);
    });
  });

  describe('killProcess', () => {
    it('should return boolean indicating success', async () => {
      // Test with a non-existent PID to avoid killing actual processes
      const result = await ramOptimizerService.killProcess(99999);

      expect(typeof result).toBe('boolean');
    });

    it('should handle invalid PID gracefully', async () => {
      const result = await ramOptimizerService.killProcess(-1);

      expect(result).toBe(false);
    });

    it('should handle non-existent process', async () => {
      const result = await ramOptimizerService.killProcess(999999);

      expect(result).toBe(false);
    });
  });

  describe('process identification', () => {
    it('should identify system processes correctly', async () => {
      const processes = await ramOptimizerService.getRunningProcesses();

      // Check that processes with PID < 1000 are marked as system
      const systemProcesses = processes.filter(p => p.pid < 1000);
      systemProcesses.forEach(p => {
        expect(p.isSystem).toBe(true);
      });
    });

    it('should identify user processes correctly', async () => {
      const processes = await ramOptimizerService.getRunningProcesses();

      // Check that processes with high PIDs are typically user processes
      const userProcesses = processes.filter(p => p.pid > 1000);
      // Most user processes should not be marked as system
      const systemUserProcesses = userProcesses.filter(p => p.isSystem);
      expect(systemUserProcesses.length).toBeLessThan(userProcesses.length / 2);
    });
  });

  describe('memory calculation', () => {
    it('should report memory in MB', async () => {
      const processes = await ramOptimizerService.getRunningProcesses();

      if (processes.length > 0) {
        // Memory should be in reasonable MB range (not bytes)
        const maxReasonableMB = 1024 * 64; // 64GB
        processes.forEach(p => {
          expect(p.memory).toBeLessThan(maxReasonableMB);
        });
      }
    });

    it('should calculate memory percentage correctly', async () => {
      const processes = await ramOptimizerService.getRunningProcesses();

      if (processes.length > 0) {
        const memoryInfo = await ramOptimizerService.getMemoryInfo();
        const process = processes[0];
        
        // Memory percent should be proportional to memory usage
        const expectedPercent = (process.memory / memoryInfo.total) * 100;
        expect(Math.abs(process.memoryPercent - expectedPercent)).toBeLessThan(1);
      }
    });
  });
});
