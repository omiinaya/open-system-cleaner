import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Define the API interface for type safety
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export interface ElectronAPI {
  // System operations
  getSystemInfo: () => Promise<SystemInfo>;

  // Cleanup operations
  scanJunkFiles: () => Promise<JunkFileScanResult>;
  cleanJunkFiles: (paths: string[]) => Promise<CleanResult>;
  scanRegistry: () => Promise<RegistryScanResult>;
  fixRegistry: (issues: string[]) => Promise<RegistryFixResult>;

  // Optimization operations
  boostPerformance: () => Promise<OptimizationResult>;
  optimizeStartup: () => Promise<StartupOptimizationResult>;
  optimizeRAM: () => Promise<RAMOptimizationResult>;

  // Security operations
  scanMalware: () => Promise<MalwareScanResult>;
  enableRealTimeProtection: (enabled: boolean) => Promise<ProtectionResult>;

  // App operations
  getAppVersion: () => Promise<string>;
  quitApp: () => Promise<void>;

  // Event listeners
  onSystemUpdate: (callback: (data: SystemInfo) => void) => void;
  removeSystemUpdateListener: () => void;
}

// Type definitions for API responses
export interface SystemInfo {
  cpu: {
    usage: number;
    cores: number;
    speed: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
  network: {
    upload: number;
    download: number;
  };
}

export interface JunkFileScanResult {
  files: string[];
  totalSize: number;
}

export interface CleanResult {
  success: boolean;
  cleanedSize: number;
}

export interface RegistryScanResult {
  issues: string[];
  totalIssues: number;
}

export interface RegistryFixResult {
  success: boolean;
  fixedCount: number;
}

export interface OptimizationResult {
  success: boolean;
  optimizationsApplied: number;
}

export interface StartupOptimizationResult {
  success: boolean;
  programsOptimized: number;
}

export interface RAMOptimizationResult {
  success: boolean;
  memoryFreed: number;
}

export interface MalwareScanResult {
  threats: string[];
  totalThreats: number;
}

export interface ProtectionResult {
  success: boolean;
  enabled: boolean;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const api: ElectronAPI = {
  // System operations
  getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),

  // Cleanup operations
  scanJunkFiles: () => ipcRenderer.invoke('cleanup:scanJunkFiles'),
  cleanJunkFiles: (paths: string[]) => ipcRenderer.invoke('cleanup:cleanJunkFiles', paths),
  scanRegistry: () => ipcRenderer.invoke('cleanup:scanRegistry'),
  fixRegistry: (issues: string[]) => ipcRenderer.invoke('cleanup:fixRegistry', issues),

  // Optimization operations
  boostPerformance: () => ipcRenderer.invoke('optimization:boostPerformance'),
  optimizeStartup: () => ipcRenderer.invoke('optimization:optimizeStartup'),
  optimizeRAM: () => ipcRenderer.invoke('optimization:optimizeRAM'),

  // Security operations
  scanMalware: () => ipcRenderer.invoke('security:scanMalware'),
  enableRealTimeProtection: (enabled: boolean) => ipcRenderer.invoke('security:enableRealTimeProtection', enabled),

  // App operations
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  quitApp: () => ipcRenderer.invoke('app:quit'),

  // Event listeners for real-time updates
  onSystemUpdate: (callback: (data: SystemInfo) => void) => {
    const handler = (_event: IpcRendererEvent, data: SystemInfo) => callback(data);
    ipcRenderer.on('system:update', handler);
  },
  removeSystemUpdateListener: () => {
    ipcRenderer.removeAllListeners('system:update');
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', api);

console.log('Preload script loaded successfully');
