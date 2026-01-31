import type { ReactNode } from 'react';

// ============================================
// System Health Types
// ============================================

export interface SystemHealthData {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  lastScan: Date | null;
  issues: SystemIssue[];
}

export interface SystemIssue {
  id: string;
  type: 'junk' | 'registry' | 'privacy' | 'performance' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  size?: number; // For junk files
  location?: string;
}

export interface SystemInfo {
  cpu: {
    usage: number;
    cores: number;
    speed: number; // in GHz
    model: string;
  };
  memory: {
    total: number; // in bytes
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
    upload: number; // bytes per second
    download: number;
    interface: string;
  };
  os: {
    platform: string;
    release: string;
    arch: string;
    hostname: string;
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

// ============================================
// Module Configuration Types
// ============================================

export type ModuleType = 
  | 'dashboard' 
  | 'clean' 
  | 'optimize' 
  | 'protect' 
  | 'speedup' 
  | 'toolbox' 
  | 'settings';

export interface ModuleConfig {
  id: ModuleType;
  name: string;
  description: string;
  icon: string;
  badge?: number;
  isEnabled: boolean;
  requiresAdmin: boolean;
}

export interface CleanModuleConfig extends ModuleConfig {
  junkFileCategories: JunkFileCategory[];
  registrySections: RegistrySection[];
  privacyTraces: PrivacyTrace[];
}

export interface JunkFileCategory {
  id: string;
  name: string;
  description: string;
  paths: string[];
  isSelected: boolean;
  estimatedSize: number;
}

export interface RegistrySection {
  id: string;
  name: string;
  description: string;
  hive: string;
  isSelected: boolean;
}

export interface PrivacyTrace {
  id: string;
  name: string;
  type: 'browser' | 'system' | 'application';
  isSelected: boolean;
}

export interface OptimizeModuleConfig extends ModuleConfig {
  startupPrograms: StartupProgram[];
  ramOptimization: RAMOptimizationSettings;
  internetOptimization: InternetOptimizationSettings;
}

export interface StartupProgram {
  id: string;
  name: string;
  publisher: string;
  impact: 'low' | 'medium' | 'high';
  isEnabled: boolean;
  command: string;
}

export interface RAMOptimizationSettings {
  autoOptimize: boolean;
  threshold: number; // percentage
  aggressiveMode: boolean;
}

export interface InternetOptimizationSettings {
  dnsOptimization: boolean;
  tcpOptimization: boolean;
  browserOptimization: boolean;
}

export interface ProtectModuleConfig extends ModuleConfig {
  realTimeProtection: boolean;
  malwareScanner: MalwareScannerSettings;
  browserProtection: BrowserProtectionSettings;
  privacyShield: PrivacyShieldSettings;
}

export interface MalwareScannerSettings {
  autoScan: boolean;
  scanSchedule: 'daily' | 'weekly' | 'monthly';
  scanDepth: 'quick' | 'full' | 'custom';
}

export interface BrowserProtectionSettings {
  antiTracking: boolean;
  antiPhishing: boolean;
  homepageProtection: boolean;
}

export interface PrivacyShieldSettings {
  cameraProtection: boolean;
  microphoneProtection: boolean;
  keystrokeEncryption: boolean;
}

export interface SpeedUpModuleConfig extends ModuleConfig {
  turboMode: boolean;
  gameMode: boolean;
  processManager: ProcessManagerSettings;
}

export interface ProcessManagerSettings {
  autoOptimize: boolean;
  whitelist: string[];
}

export interface ToolboxModuleConfig extends ModuleConfig {
  tools: Tool[];
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  isAvailable: boolean;
}

// ============================================
// Navigation Types
// ============================================

export interface NavigationItem {
  id: ModuleType;
  label: string;
  icon: string;
  href: string;
  badge?: number | string;
  isActive: boolean;
  children?: NavigationItem[];
}

export interface SidebarConfig {
  items: NavigationItem[];
  collapsed: boolean;
  showSystemStatus: boolean;
}

// ============================================
// Theme Types
// ============================================

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  theme: Theme;
  followSystem: boolean;
  accentColor: string;
  fontScale: number;
  reduceMotion: boolean;
  highContrast: boolean;
}

// ============================================
// UI Component Types
// ============================================

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type CardVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';

export type ProgressVariant = 'linear' | 'circular' | 'stepped';

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
  dismissible: boolean;
}

export interface Modal {
  id: string;
  title: string;
  content: ReactNode;
  size: 'sm' | 'md' | 'lg' | 'xl';
  onClose?: () => void;
}

// ============================================
// Scan & Optimization Types
// ============================================

export type ScanStatus = 'idle' | 'scanning' | 'paused' | 'completed' | 'error';
export type OptimizationStatus = 'idle' | 'running' | 'completed' | 'error';

export interface ScanProgress {
  status: ScanStatus;
  progress: number; // 0-100
  currentItem: string;
  itemsScanned: number;
  totalItems: number;
  issuesFound: number;
  estimatedTimeRemaining: number; // in seconds
}

export interface OptimizationProgress {
  status: OptimizationStatus;
  progress: number;
  currentOperation: string;
  operationsCompleted: number;
  totalOperations: number;
  results: OptimizationResult[];
}

export interface OptimizationResult {
  id: string;
  operation: string;
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// Settings Types
// ============================================

export interface AppSettings {
  general: GeneralSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  advanced: AdvancedSettings;
}

export interface GeneralSettings {
  language: string;
  startWithWindows: boolean;
  minimizeToTray: boolean;
  autoUpdate: boolean;
  theme: ThemeConfig;
}

export interface NotificationSettings {
  enabled: boolean;
  scanComplete: boolean;
  optimizationComplete: boolean;
  securityAlerts: boolean;
  lowDiskSpace: boolean;
  soundEnabled: boolean;
}

export interface PrivacySettings {
  shareUsageData: boolean;
  autoCleanBrowsingData: boolean;
  passwordProtectSettings: boolean;
}

export interface AdvancedSettings {
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxLogSize: number;
  backupBeforeChanges: boolean;
  excludePaths: string[];
  customTempPaths: string[];
}

// ============================================
// Electron API Types (from preload)
// ============================================

export interface ElectronAPI {
  // System operations
  getSystemInfo: () => Promise<SystemInfo>;

  // Cleanup operations
  scanJunkFiles: () => Promise<{ files: string[]; totalSize: number }>;
  cleanJunkFiles: (paths: string[]) => Promise<{ success: boolean; cleanedSize: number }>;
  scanRegistry: () => Promise<{ issues: string[]; totalIssues: number }>;
  fixRegistry: (issues: string[]) => Promise<{ success: boolean; fixedCount: number }>;

  // Optimization operations
  boostPerformance: () => Promise<{ success: boolean; optimizationsApplied: number }>;
  optimizeStartup: () => Promise<{ success: boolean; programsOptimized: number }>;
  optimizeRAM: () => Promise<{ success: boolean; memoryFreed: number }>;

  // Security operations
  scanMalware: () => Promise<{ threats: string[]; totalThreats: number }>;
  enableRealTimeProtection: (enabled: boolean) => Promise<{ success: boolean; enabled: boolean }>;

  // App operations
  getAppVersion: () => Promise<string>;
  quitApp: () => Promise<void>;

  // Event listeners
  onSystemUpdate: (callback: (data: SystemInfo) => void) => void;
  removeSystemUpdateListener: () => void;
}

// ============================================
// Utility Types
// ============================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ValueOf<T> = T[keyof T];

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
