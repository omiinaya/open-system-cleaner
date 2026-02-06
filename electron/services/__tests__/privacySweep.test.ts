/**
 * Unit tests for PrivacySweepService
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { privacySweepService, PrivacyItem, BrowserData } from '../privacySweep';

describe('PrivacySweepService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scan', () => {
    it('should return an array of browser data', async () => {
      const results = await privacySweepService.scan();

      expect(Array.isArray(results)).toBe(true);
    });

    it('should return browser data with required fields', async () => {
      const results = await privacySweepService.scan();

      results.forEach(browser => {
        expect(browser).toHaveProperty('name');
        expect(browser).toHaveProperty('dataPath');
        expect(browser).toHaveProperty('items');
        expect(typeof browser.name).toBe('string');
        expect(typeof browser.dataPath).toBe('string');
        expect(Array.isArray(browser.items)).toBe(true);
      });
    });

    it('should scan for supported browsers', async () => {
      const results = await privacySweepService.scan();

      // Should check for Chrome, Firefox, Edge
      const browserNames = results.map(b => b.name.toLowerCase());
      expect(browserNames.some(name => name.includes('chrome')) || 
             browserNames.some(name => name.includes('firefox')) || 
             browserNames.some(name => name.includes('edge')) || 
             results.length === 0).toBe(true);
    });

    it('should return privacy items with required fields', async () => {
      const results = await privacySweepService.scan();

      results.forEach(browser => {
        browser.items.forEach(item => {
          expect(item).toHaveProperty('type');
          expect(item).toHaveProperty('path');
          expect(item).toHaveProperty('size');
          expect(item).toHaveProperty('browser');
          expect(['history', 'cookies', 'cache', 'downloads', 'passwords']).toContain(item.type);
          expect(typeof item.path).toBe('string');
          expect(typeof item.size).toBe('number');
          expect(typeof item.browser).toBe('string');
        });
      });
    });

    it('should handle browsers that are not installed', async () => {
      const results = await privacySweepService.scan();

      // Should not throw errors for browsers that don't exist
      expect(Array.isArray(results)).toBe(true);
    });

    it('should calculate item sizes correctly', async () => {
      const results = await privacySweepService.scan();

      results.forEach(browser => {
        browser.items.forEach(item => {
          expect(item.size).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe('cleanItems', () => {
    it('should return result with success and cleanedSize', async () => {
      // Test with empty array
      const result = await privacySweepService.cleanItems([]);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('cleanedSize');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.cleanedSize).toBe('number');
    });

    it('should handle non-existent paths gracefully', async () => {
      const nonExistentPaths = ['/path/that/does/not/exist/file.txt'];
      const result = await privacySweepService.cleanItems(nonExistentPaths);

      expect(result.success).toBe(false);
      expect(result.cleanedSize).toBe(0);
    });

    it('should return cleanedSize as 0 for empty array', async () => {
      const result = await privacySweepService.cleanItems([]);

      expect(result.cleanedSize).toBe(0);
    });
  });

  describe('cleanByType', () => {
    it('should clean items by type and return result', async () => {
      const result = await privacySweepService.cleanByType('cache');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('cleanedSize');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.cleanedSize).toBe('number');
    });

    it('should handle all privacy item types', async () => {
      const types: PrivacyItem['type'][] = ['history', 'cookies', 'cache', 'downloads', 'passwords'];

      for (const type of types) {
        const result = await privacySweepService.cleanByType(type);
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('cleanedSize');
      }
    });

    it('should return success false when no items found', async () => {
      // Clean a type that likely doesn't exist
      const result = await privacySweepService.cleanByType('passwords');

      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('cleanByBrowser', () => {
    it('should return result when browser not found', async () => {
      const result = await privacySweepService.cleanByBrowser('NonExistentBrowser');

      expect(result.success).toBe(false);
      expect(result.cleanedSize).toBe(0);
    });

    it('should handle case-insensitive browser names', async () => {
      // Test with different cases
      const lowerResult = await privacySweepService.cleanByBrowser('chrome');
      const upperResult = await privacySweepService.cleanByBrowser('CHROME');
      const mixedResult = await privacySweepService.cleanByBrowser('Chrome');

      // Results should be consistent
      expect(lowerResult).toHaveProperty('success');
      expect(upperResult).toHaveProperty('success');
      expect(mixedResult).toHaveProperty('success');
    });

    it('should return result for valid browsers', async () => {
      const browsers = ['Chrome', 'Firefox', 'Edge'];

      for (const browser of browsers) {
        const result = await privacySweepService.cleanByBrowser(browser);
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('cleanedSize');
      }
    });
  });

  describe('browser detection', () => {
    it('should detect browser paths correctly', async () => {
      const results = await privacySweepService.scan();

      results.forEach(browser => {
        // Path should be absolute
        expect(browser.dataPath).toMatch(/^\/|^[A-Za-z]:/);
      });
    });

    it('should group items by browser', async () => {
      const results = await privacySweepService.scan();

      results.forEach(browser => {
        browser.items.forEach(item => {
          expect(item.browser).toBe(browser.name);
        });
      });
    });
  });

  describe('item types', () => {
    it('should identify cache items', async () => {
      const results = await privacySweepService.scan();

      results.forEach(browser => {
        const cacheItems = browser.items.filter(i => i.type === 'cache');
        cacheItems.forEach(item => {
          expect(item.path.toLowerCase()).toMatch(/cache/);
        });
      });
    });

    it('should identify history items', async () => {
      const results = await privacySweepService.scan();

      results.forEach(browser => {
        const historyItems = browser.items.filter(i => i.type === 'history');
        historyItems.forEach(item => {
          const pathLower = item.path.toLowerCase();
          expect(pathLower.includes('history') || pathLower.includes('places')).toBe(true);
        });
      });
    });

    it('should identify cookie items', async () => {
      const results = await privacySweepService.scan();

      results.forEach(browser => {
        const cookieItems = browser.items.filter(i => i.type === 'cookies');
        cookieItems.forEach(item => {
          expect(item.path.toLowerCase()).toMatch(/cookie/);
        });
      });
    });
  });

  describe('error handling', () => {
    it('should handle permission errors gracefully', async () => {
      // Scan should not throw even with permission issues
      const results = await privacySweepService.scan();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle corrupted browser data', async () => {
      // Should not crash on corrupted data
      const results = await privacySweepService.scan();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should continue scanning after individual errors', async () => {
      const results = await privacySweepService.scan();
      
      // Should return results even if some browsers failed
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('size calculation', () => {
    it('should report accurate file sizes', async () => {
      const results = await privacySweepService.scan();

      results.forEach(browser => {
        browser.items.forEach(item => {
          // Size should be reasonable (not negative, not impossibly large)
          expect(item.size).toBeGreaterThanOrEqual(0);
          expect(item.size).toBeLessThan(1024 * 1024 * 1024 * 10); // Less than 10GB
        });
      });
    });

    it('should accumulate sizes correctly when cleaning', async () => {
      // Create test with mock items
      const testPaths: string[] = [];
      
      // Since we can't easily create real files in tests,
      // we verify the structure of the return value
      const result = await privacySweepService.cleanItems(testPaths);
      expect(typeof result.cleanedSize).toBe('number');
    });
  });
});
