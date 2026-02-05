import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';
import { systemMetricsService } from './services/systemMetrics';
import { healthScoreService } from './services/healthScore';
import { historicalDataService } from './services/historicalData';
import { junkFileScanner } from './services/junkFileScanner';
import { privacySweepService } from './services/privacySweep';
import { largeFileFinderService } from './services/largeFileFinder';
import { ramOptimizerService } from './services/ramOptimizer';
import { startupManagerService } from './services/startupManager';
import { internetOptimizerService } from './services/internetOptimizer';
import { turboModeService } from './services/turboMode';
import { softwareUninstallerService } from './services/softwareUninstaller';
import { fileShredderService } from './services/fileShredder';
import { gameModeService } from './services/gameMode';
import { duplicateFinderService } from './services/duplicateFinder';

// Keep a global reference of the window object to prevent garbage collection
let mainWindow: BrowserWindow | null = null;

const isDevelopment = process.env.NODE_ENV === 'development';

const createWindow = (): void => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
      sandbox: false, // Required for preload script functionality
    },
    titleBarStyle: 'hiddenInset',
    show: false,
    backgroundColor: '#0f172a', // Dark background for initial load
  });

  // Load the app
  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:5273');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    
    // Focus window on show
    if (mainWindow) {
      mainWindow.focus();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
};

// App event handlers
app.whenReady().then(() => {
  createWindow();

  // Start system metrics monitoring
  systemMetricsService.startMonitoring((metrics) => {
    // Send metrics to renderer
    mainWindow?.webContents.send('system:metricsUpdate', metrics);
    
    // Store in historical data
    historicalDataService.storeMetrics(metrics);
  }, 5000); // Update every 5 seconds

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, applications stay active until user quits explicitly
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================
// IPC Handlers - Placeholders
// ============================

// System Information
ipcMain.handle('system:getInfo', async () => {
  return await systemMetricsService.getMetrics();
});

// Health Score Calculation
ipcMain.handle('system:getHealthScore', async (_event, factors) => {
  const metrics = await systemMetricsService.getMetrics();
  return healthScoreService.calculateHealthScore(metrics, factors);
});

// Historical Data
ipcMain.handle('system:getHistoricalData', async (_event, timeRange: '1h' | '24h' | '7d' | '30d') => {
  return await historicalDataService.getMetrics(timeRange);
});

// Cleanup Operations
ipcMain.handle('cleanup:scanJunkFiles', async () => {
  return await junkFileScanner.scan();
});

ipcMain.handle('cleanup:cleanJunkFiles', async (_event, paths: string[]) => {
  return await junkFileScanner.cleanFiles(paths);
});

ipcMain.handle('cleanup:cleanJunkFilesByCategory', async (_event, category: 'temp' | 'cache' | 'logs' | 'thumbnails' | 'recycle') => {
  return await junkFileScanner.cleanByCategory(category);
});

// Privacy Sweep Operations
ipcMain.handle('privacy:scanBrowserData', async () => {
  return await privacySweepService.scan();
});

ipcMain.handle('privacy:cleanBrowserData', async (_event, itemPaths: string[]) => {
  return await privacySweepService.cleanItems(itemPaths);
});

ipcMain.handle('privacy:cleanByType', async (_event, type: 'history' | 'cookies' | 'cache' | 'downloads' | 'passwords') => {
  return await privacySweepService.cleanByType(type);
});

ipcMain.handle('privacy:cleanByBrowser', async (_event, browserName: string) => {
  return await privacySweepService.cleanByBrowser(browserName);
});

// Large File Finder Operations
ipcMain.handle('files:scanLargeFiles', async (_event, options) => {
  return await largeFileFinderService.scan(options);
});

ipcMain.handle('files:deleteLargeFiles', async (_event, filePaths: string[]) => {
  return await largeFileFinderService.deleteFiles(filePaths);
});

ipcMain.handle('cleanup:scanRegistry', async () => {
  // Placeholder: Will be implemented in Phase 2
  return {
    issues: [],
    totalIssues: 0,
  };
});

ipcMain.handle('cleanup:fixRegistry', async (_event, issues: string[]) => {
  // Placeholder: Will be implemented in Phase 2
  console.log('Fixing registry issues:', issues);
  return {
    success: true,
    fixedCount: 0,
  };
});

// Optimization Operations
ipcMain.handle('optimization:boostPerformance', async () => {
  // Run RAM optimization and clean junk files
  const ramResult = await ramOptimizerService.optimize({ aggressive: false });
  const junkResult = await junkFileScanner.cleanByCategory('temp');
  
  return {
    success: ramResult.success,
    optimizationsApplied: ramResult.processesTerminated + (junkResult.success ? 1 : 0),
    memoryFreed: ramResult.memoryFreed,
    spaceFreed: junkResult.freedSpace,
  };
});

ipcMain.handle('optimization:getRunningProcesses', async () => {
  return await ramOptimizerService.getRunningProcesses();
});

ipcMain.handle('optimization:killProcess', async (_event, pid: number) => {
  return await ramOptimizerService.killProcess(pid);
});

ipcMain.handle('optimization:getStartupPrograms', async () => {
  return await startupManagerService.getStartupPrograms();
});

ipcMain.handle('optimization:disableStartupProgram', async (_event, programId: string) => {
  return await startupManagerService.disableStartupProgram(programId);
});

ipcMain.handle('optimization:enableStartupProgram', async (_event, programId: string) => {
  return await startupManagerService.enableStartupProgram(programId);
});

ipcMain.handle('optimization:optimizeRAM', async (_event, options) => {
  return await ramOptimizerService.optimize(options);
});

ipcMain.handle('optimization:getMemoryInfo', async () => {
  return await ramOptimizerService.getMemoryInfo();
});

// Security Operations
ipcMain.handle('security:scanVulnerabilities', async () => {
  // Placeholder: Will be implemented in Phase 2
  return {
    issues: [],
    totalIssues: 0,
  };
});

ipcMain.handle('security:enableSystemHardeningMonitor', async (_event, enabled: boolean) => {
  // Placeholder: Will be implemented in Phase 2
  console.log('System hardening monitor:', enabled);
  return {
    success: true,
    enabled,
  };
});

// App Operations
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:quit', () => {
  app.quit();
});

// Turbo Mode Operations
ipcMain.handle('turbo:enable', async () => {
  return await turboModeService.enable();
});

ipcMain.handle('turbo:disable', async () => {
  return await turboModeService.disable();
});

ipcMain.handle('turbo:getStatus', () => {
  return turboModeService.isEnabled();
});

// Internet Optimization Operations
ipcMain.handle('internet:optimize', async (_event, options) => {
  return await internetOptimizerService.optimize(options);
});

ipcMain.handle('internet:reset', async () => {
  return await internetOptimizerService.resetToDefault();
});

ipcMain.handle('internet:getSpeed', async () => {
  return await internetOptimizerService.measureNetworkSpeed();
});

// Software Uninstaller Operations
ipcMain.handle('uninstaller:getPrograms', async () => {
  return await softwareUninstallerService.getInstalledPrograms();
});

ipcMain.handle('uninstaller:search', async (_event, query: string) => {
  return await softwareUninstallerService.searchPrograms(query);
});

ipcMain.handle('uninstaller:uninstall', async (_event, programId: string) => {
  return await softwareUninstallerService.uninstallProgram(programId);
});

// File Shredder Operations
ipcMain.handle('shredder:shredFiles', async (_event, { filePaths, method }) => {
  return await fileShredderService.shredFiles(filePaths, method);
});

ipcMain.handle('shredder:shredFreeSpace', async (_event, { drive, method }) => {
  return await fileShredderService.shredFreeSpace(drive, method);
});

// Game Mode Operations
ipcMain.handle('gameMode:enable', async (_event, gameName?: string) => {
  return await gameModeService.enable(gameName);
});

ipcMain.handle('gameMode:disable', async () => {
  return await gameModeService.disable();
});

ipcMain.handle('gameMode:getStatus', () => {
  return {
    enabled: gameModeService.isEnabled(),
    currentGame: gameModeService.getCurrentGame(),
  };
});

ipcMain.handle('gameMode:getKnownGames', () => {
  return gameModeService.getKnownGames();
});

// Duplicate Finder Operations
ipcMain.handle('duplicateFinder:scan', async (_event, options) => {
  return await duplicateFinderService.scan(options);
});

ipcMain.handle('duplicateFinder:delete', async (_event, filePaths: string[]) => {
  return await duplicateFinderService.deleteDuplicates(filePaths);
});

ipcMain.handle('duplicateFinder:moveToTrash', async (_event, filePaths: string[]) => {
  return await duplicateFinderService.moveDuplicatesToTrash(filePaths);
});

console.log('Electron main process initialized');
