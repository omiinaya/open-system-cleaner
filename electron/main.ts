import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';

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
    mainWindow.loadURL('http://localhost:5173');
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
  // Placeholder: Will be implemented in Phase 2
  return {
    cpu: {
      usage: 0,
      cores: 0,
      speed: 0,
    },
    memory: {
      total: 0,
      used: 0,
      free: 0,
    },
    disk: {
      total: 0,
      used: 0,
      free: 0,
    },
    network: {
      upload: 0,
      download: 0,
    },
  };
});

// Cleanup Operations
ipcMain.handle('cleanup:scanJunkFiles', async () => {
  // Placeholder: Will be implemented in Phase 2
  return {
    files: [],
    totalSize: 0,
  };
});

ipcMain.handle('cleanup:cleanJunkFiles', async (_event, paths: string[]) => {
  // Placeholder: Will be implemented in Phase 2
  console.log('Cleaning junk files:', paths);
  return {
    success: true,
    cleanedSize: 0,
  };
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
  // Placeholder: Will be implemented in Phase 2
  return {
    success: true,
    optimizationsApplied: 0,
  };
});

ipcMain.handle('optimization:optimizeStartup', async () => {
  // Placeholder: Will be implemented in Phase 2
  return {
    success: true,
    programsOptimized: 0,
  };
});

ipcMain.handle('optimization:optimizeRAM', async () => {
  // Placeholder: Will be implemented in Phase 2
  return {
    success: true,
    memoryFreed: 0,
  };
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

console.log('Electron main process initialized');
