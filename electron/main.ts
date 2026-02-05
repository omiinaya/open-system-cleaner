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
import { registryBackupService } from './services/registryBackup';
import { systemRestoreService } from './services/systemRestore';
import { undoManager } from './services/undoManager';
import { fileWatcherService } from './services/fileWatcher';
import { behavioralAnalyzer } from './services/behavioralAnalyzer';
import { streamingFileScanner } from './services/streamingFileScanner';
import { parallelFileProcessor } from './services/workerPool';

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
  try {
    return await systemMetricsService.getMetrics();
  } catch (error) {
    console.error('Error in system:getInfo:', error);
    return {
      error: 'Failed to get system info',
      cpu: { usage: 0, cores: 0, speed: 0, model: 'Unknown' },
      memory: { total: 0, used: 0, free: 0, percentage: 0 },
      disk: { total: 0, used: 0, free: 0, drives: [] },
      network: { upload: 0, download: 0, interface: 'unknown' },
    };
  }
});

// Health Score Calculation
ipcMain.handle('system:getHealthScore', async (_event, factors) => {
  try {
    const metrics = await systemMetricsService.getMetrics();
    return healthScoreService.calculateHealthScore(metrics, factors);
  } catch (error) {
    console.error('Error in system:getHealthScore:', error);
    return {
      score: 0,
      status: 'unknown',
      recommendations: ['Unable to calculate health score'],
    };
  }
});

// Health Check
ipcMain.handle('system:performHealthCheck', async () => {
  return await systemMetricsService.performHealthCheck();
});

// Historical Data
ipcMain.handle('system:getHistoricalData', async (_event, timeRange: '1h' | '24h' | '7d' | '30d') => {
  return await historicalDataService.getMetrics(timeRange);
});

// Cleanup Operations
ipcMain.handle('cleanup:scanJunkFiles', async () => {
  try {
    return await junkFileScanner.scan();
  } catch (error) {
    console.error('Error in cleanup:scanJunkFiles:', error);
    return { 
      success: false, 
      error: 'Scan failed',
      files: [], 
      totalSize: 0, 
      categoryBreakdown: {} 
    };
  }
});

ipcMain.handle('cleanup:cleanJunkFiles', async (_event, args) => {
  try {
    // Validate input
    if (!args || typeof args !== 'object') {
      return { 
        success: false, 
        error: 'Invalid arguments',
        freedSpace: 0,
        errors: ['Arguments must be an object']
      };
    }

    const { paths, options } = args;
    
    if (!Array.isArray(paths)) {
      return { 
        success: false, 
        error: 'Invalid paths: must be an array',
        freedSpace: 0,
        errors: ['Paths must be an array']
      };
    }

    return await junkFileScanner.cleanFiles(paths, options);
  } catch (error) {
    console.error('Error in cleanup:cleanJunkFiles:', error);
    return { 
      success: false, 
      error: String(error),
      freedSpace: 0,
      errors: [String(error)]
    };
  }
});

ipcMain.handle('cleanup:cleanJunkFilesByCategory', async (_event, category: 'temp' | 'cache' | 'logs' | 'thumbnails' | 'recycle') => {
  try {
    // Validate category
    const validCategories = ['temp', 'cache', 'logs', 'thumbnails', 'recycle'];
    if (!validCategories.includes(category)) {
      return { 
        success: false, 
        error: `Invalid category: ${category}. Must be one of: ${validCategories.join(', ')}`,
        freedSpace: 0 
      };
    }

    return await junkFileScanner.cleanByCategory(category);
  } catch (error) {
    console.error('Error in cleanup:cleanJunkFilesByCategory:', error);
    return { 
      success: false, 
      error: String(error),
      freedSpace: 0 
    };
  }
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
  try {
    return await largeFileFinderService.scan(options);
  } catch (error) {
    console.error('Error in files:scanLargeFiles:', error);
    return {
      files: [],
      totalSize: 0,
      count: 0,
      error: String(error),
    };
  }
});

ipcMain.handle('files:getPreview', async (_event, filePath: string) => {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return {
        error: 'Invalid file path',
        type: 'binary',
        preview: '',
        canPreview: false,
        metadata: null,
      };
    }
    return await largeFileFinderService.getFilePreview(filePath);
  } catch (error) {
    console.error('Error in files:getPreview:', error);
    return {
      error: String(error),
      type: 'binary',
      preview: '',
      canPreview: false,
      metadata: null,
    };
  }
});

ipcMain.handle('files:deleteLargeFiles', async (_event, filePaths: string[]) => {
  try {
    if (!Array.isArray(filePaths)) {
      return {
        success: false,
        freedSpace: 0,
        errors: ['Invalid input: filePaths must be an array'],
      };
    }
    return await largeFileFinderService.deleteFiles(filePaths);
  } catch (error) {
    console.error('Error in files:deleteLargeFiles:', error);
    return {
      success: false,
      freedSpace: 0,
      errors: [String(error)],
    };
  }
});

ipcMain.handle('files:moveToTrash', async (_event, filePaths: string[]) => {
  try {
    if (!Array.isArray(filePaths)) {
      return {
        success: false,
        freedSpace: 0,
        errors: ['Invalid input: filePaths must be an array'],
      };
    }
    return await largeFileFinderService.moveToTrash(filePaths);
  } catch (error) {
    console.error('Error in files:moveToTrash:', error);
    return {
      success: false,
      freedSpace: 0,
      errors: [String(error)],
    };
  }
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

// Registry Backup Operations
ipcMain.handle('registry:createBackup', async (_event, description: string) => {
  try {
    return await registryBackupService.createBackup(description);
  } catch (error) {
    console.error('Error creating registry backup:', error);
    return {
      success: false,
      error: String(error),
    };
  }
});

ipcMain.handle('registry:listBackups', async () => {
  try {
    return await registryBackupService.listBackups();
  } catch (error) {
    console.error('Error listing registry backups:', error);
    return [];
  }
});

ipcMain.handle('registry:restoreBackup', async (_event, backupId: string) => {
  try {
    return await registryBackupService.restoreBackup(backupId);
  } catch (error) {
    console.error('Error restoring registry backup:', error);
    return false;
  }
});

ipcMain.handle('registry:deleteBackup', async (_event, backupId: string) => {
  try {
    return await registryBackupService.deleteBackup(backupId);
  } catch (error) {
    console.error('Error deleting registry backup:', error);
    return false;
  }
});

// System Restore Operations
ipcMain.handle('systemRestore:create', async (_event, description: string) => {
  try {
    return await systemRestoreService.createRestorePoint(description);
  } catch (error) {
    console.error('Error creating system restore point:', error);
    return {
      success: false,
      message: String(error),
    };
  }
});

ipcMain.handle('systemRestore:list', async () => {
  try {
    return await systemRestoreService.listRestorePoints();
  } catch (error) {
    console.error('Error listing restore points:', error);
    return [];
  }
});

ipcMain.handle('systemRestore:checkAvailable', async () => {
  try {
    return await systemRestoreService.isSystemRestoreAvailable();
  } catch {
    return false;
  }
});

// Undo Manager Operations
ipcMain.handle('undo:canUndo', () => {
  return undoManager.canUndo();
});

ipcMain.handle('undo:canRedo', () => {
  return undoManager.canRedo();
});

ipcMain.handle('undo:undo', async () => {
  try {
    return await undoManager.undo();
  } catch (error) {
    console.error('Error undoing action:', error);
    return {
      success: false,
      message: String(error),
    };
  }
});

ipcMain.handle('undo:redo', async () => {
  try {
    return await undoManager.redo();
  } catch (error) {
    console.error('Error redoing action:', error);
    return {
      success: false,
      message: String(error),
    };
  }
});

ipcMain.handle('undo:getHistory', () => {
  return {
    undoStack: undoManager.getUndoStack(),
    redoStack: undoManager.getRedoStack(),
  };
});

ipcMain.handle('undo:clear', async () => {
  try {
    await undoManager.clearHistory();
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
});

// File Watcher Operations
ipcMain.handle('fileWatcher:start', async (_event, paths: string[]) => {
  try {
    fileWatcherService.startWatching(paths);
    return { success: true };
  } catch (error) {
    console.error('Error starting file watcher:', error);
    return {
      success: false,
      error: String(error),
    };
  }
});

ipcMain.handle('fileWatcher:stop', () => {
  fileWatcherService.stopWatching();
  return { success: true };
});

ipcMain.handle('fileWatcher:isRunning', () => {
  return fileWatcherService.isRunning();
});

ipcMain.handle('fileWatcher:getStats', () => {
  return fileWatcherService.getActivityStats();
});

// Behavioral Analysis Operations
ipcMain.handle('behavioral:start', () => {
  try {
    behavioralAnalyzer.startMonitoring();
    return { success: true };
  } catch (error) {
    console.error('Error starting behavioral analysis:', error);
    return {
      success: false,
      error: String(error),
    };
  }
});

ipcMain.handle('behavioral:stop', () => {
  try {
    behavioralAnalyzer.stopMonitoring();
    return { success: true };
  } catch (error) {
    console.error('Error stopping behavioral analysis:', error);
    return {
      success: false,
      error: String(error),
    };
  }
});

ipcMain.handle('behavioral:analyze', (_event, pid: number) => {
  try {
    return behavioralAnalyzer.analyzeProcess(pid);
  } catch (error) {
    console.error('Error analyzing process:', error);
    return {
      isMalicious: false,
      confidence: 0,
      threatLevel: 'low',
      reasons: [],
      recommendedAction: 'ignore',
    };
  }
});

ipcMain.handle('behavioral:getAll', () => {
  try {
    return behavioralAnalyzer.getAllBehaviors();
  } catch (error) {
    console.error('Error getting behaviors:', error);
    return [];
  }
});

// Streaming File Scanner Operations
ipcMain.handle('streaming:scan', async (_event, { paths, options }) => {
  try {
    const result = await streamingFileScanner.scanWithStream(paths, options);
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error('Error in streaming:scan:', error);
    return {
      success: false,
      error: String(error),
      files: [],
      stats: {
        filesScanned: 0,
        directoriesScanned: 0,
        totalSize: 0,
        errors: 1,
        duration: 0,
      },
    };
  }
});

ipcMain.handle('streaming:findDuplicates', async (_event, { paths, options }) => {
  try {
    const duplicates = await streamingFileScanner.findDuplicatesStream(paths, options);
    
    // Convert Map to array for IPC
    const duplicatesArray = Array.from(duplicates.entries()).map(([hash, files]) => ({
      hash,
      files,
      count: files.length,
      totalSize: files.reduce((acc, f) => acc + f.size, 0),
    }));

    return {
      success: true,
      duplicates: duplicatesArray,
      groupCount: duplicatesArray.length,
      totalDuplicates: duplicatesArray.reduce((acc, g) => acc + g.count, 0),
    };
  } catch (error) {
    console.error('Error in streaming:findDuplicates:', error);
    return {
      success: false,
      error: String(error),
      duplicates: [],
      groupCount: 0,
      totalDuplicates: 0,
    };
  }
});

ipcMain.handle('streaming:getStats', async (_event, { paths, options }) => {
  try {
    const stats = await streamingFileScanner.getStreamStats(paths, options);
    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error('Error in streaming:getStats:', error);
    return {
      success: false,
      error: String(error),
      stats: {
        filesScanned: 0,
        directoriesScanned: 0,
        totalSize: 0,
        errors: 1,
        duration: 0,
      },
    };
  }
});

// Worker Thread Operations
ipcMain.handle('workers:hashFiles', async (_event, filePaths: string[]) => {
  try {
    const startTime = Date.now();
    parallelFileProcessor.initialize();
    
    const results = await parallelFileProcessor.hashFiles(filePaths);
    
    const duration = Date.now() - startTime;
    console.log(`Worker threads hashed ${filePaths.length} files in ${duration}ms`);

    return {
      success: true,
      results,
      duration,
      fileCount: filePaths.length,
    };
  } catch (error) {
    console.error('Error in workers:hashFiles:', error);
    return {
      success: false,
      error: String(error),
      results: [],
      duration: 0,
      fileCount: filePaths.length,
    };
  }
});

ipcMain.handle('workers:getStats', () => {
  try {
    const stats = parallelFileProcessor.getStats();
    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error('Error in workers:getStats:', error);
    return {
      success: false,
      error: String(error),
      stats: null,
    };
  }
});

ipcMain.handle('workers:shutdown', async () => {
  try {
    await parallelFileProcessor.shutdown();
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error in workers:shutdown:', error);
    return {
      success: false,
      error: String(error),
    };
  }
});

console.log('Electron main process initialized');
