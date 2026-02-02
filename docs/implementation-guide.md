# Implementation Guide

## Project Setup and Configuration

### 1. Initialize Electron + TypeScript + React Project

#### Package.json Structure
```json
{
  "name": "osc-system-care",
  "version": "1.0.0",
  "description": "Open Source System Care - Advanced SystemCare Alternative",
  "main": "dist/main/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && electron-builder",
    "preview": "vite preview",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:3000 && electron .\"",
    "electron:pack": "electron-builder",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "zustand": "^4.3.0",
    "recharts": "^2.5.0",
    "lucide-react": "^0.263.1",
    "framer-motion": "^10.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^1.10.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/node": "^18.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.0",
    "concurrently": "^8.0.0",
    "electron": "^22.0.0",
    "electron-builder": "^24.0.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "wait-on": "^7.0.0"
  }
}
```

#### Vite Configuration (vite.config.ts)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: './src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
});
```

#### Tailwind CSS Configuration (tailwind.config.js)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary color scheme
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Success colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Warning colors
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Danger colors
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

## Core Implementation Patterns

### 1. State Management with Zustand

#### App Store Implementation
```typescript
// src/renderer/store/appStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SystemInfo {
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

interface AppState {
  // System state
  systemInfo: SystemInfo;
  healthScore: number;
  
  // UI state
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  currentModule: string;
  
  // Module states
  scanProgress: number;
  optimizationStatus: 'idle' | 'running' | 'completed' | 'error';
  
  // Actions
  setSystemInfo: (info: SystemInfo) => void;
  setHealthScore: (score: number) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setCurrentModule: (module: string) => void;
  setScanProgress: (progress: number) => void;
  setOptimizationStatus: (status: 'idle' | 'running' | 'completed' | 'error') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      systemInfo: {
        cpu: { usage: 0, cores: 0, speed: 0 },
        memory: { total: 0, used: 0, free: 0 },
        disk: { total: 0, used: 0, free: 0 },
        network: { upload: 0, download: 0 },
      },
      healthScore: 0,
      theme: 'light',
      sidebarCollapsed: false,
      currentModule: 'dashboard',
      scanProgress: 0,
      optimizationStatus: 'idle',
      
      // Actions
      setSystemInfo: (info) => set({ systemInfo: info }),
      setHealthScore: (score) => set({ healthScore: score }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setCurrentModule: (module) => set({ currentModule: module }),
      setScanProgress: (progress) => set({ scanProgress: progress }),
      setOptimizationStatus: (status) => set({ optimizationStatus: status }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
```

### 2. Theme System Implementation

#### Theme Provider
```typescript
// src/renderer/providers/ThemeProvider.tsx
import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useAppStore();

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(theme);
    
    // Set data attribute for CSS custom properties
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
};

export default ThemeProvider;
```

#### CSS Custom Properties
```css
/* src/renderer/styles/theme.css */
:root {
  /* Light theme */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --border: #e2e8f0;
  --border-hover: #cbd5e1;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.dark {
  /* Dark theme */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;
  --border: #475569;
  --border-hover: #64748b;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3);
}

/* Apply custom properties to Tailwind */
.bg-primary { background-color: var(--bg-primary); }
.bg-secondary { background-color: var(--bg-secondary); }
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.border-primary { border-color: var(--border); }
```

### 3. Electron Main Process Setup

#### Main Process (main.ts)
```typescript
// src/main/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';

let mainWindow: BrowserWindow;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
};

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for system operations
ipcMain.handle('system:getInfo', async () => {
  // Implement system information gathering
  return await getSystemInfo();
});

ipcMain.handle('cleanup:scanJunkFiles', async () => {
  // Implement junk file scanning
  return await scanJunkFiles();
});

ipcMain.handle('optimization:boostPerformance', async () => {
  // Implement performance optimization
  return await boostPerformance();
});
```

#### Preload Script (preload.ts)
```typescript
// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // System operations
  getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),
  
  // Cleanup operations
  scanJunkFiles: () => ipcRenderer.invoke('cleanup:scanJunkFiles'),
  cleanJunkFiles: (paths: string[]) => ipcRenderer.invoke('cleanup:cleanJunkFiles', paths),
  
  // Optimization operations
  boostPerformance: () => ipcRenderer.invoke('optimization:boostPerformance'),
  optimizeStartup: () => ipcRenderer.invoke('optimization:optimizeStartup'),
  
  // Security operations
  scanVulnerabilities: () => ipcRenderer.invoke('security:scanVulnerabilities'),
  enableSystemHardeningMonitor: () => ipcRenderer.invoke('security:enableSystemHardeningMonitor'),
  
  // Event listeners for real-time updates
  onSystemUpdate: (callback: (data: any) => void) => 
    ipcRenderer.on('system:update', (_event, data) => callback(data)),
});
```

## Component Implementation Examples

### 1. HealthScoreGauge Implementation
```tsx
// src/renderer/components/common/HealthScoreGauge.tsx
import React from 'react';

interface HealthScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  animate?: boolean;
  strokeWidth?: number;
  className?: string;
}

const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  animate = true,
  strokeWidth,
  className = ''
}) => {
  const sizes = {
    sm: { diameter: 120, stroke: 8 },
    md: { diameter: 160, stroke: 10 },
    lg: { diameter: 200, stroke: 12 },
    xl: { diameter: 240, stroke: 14 }
  };

  const { diameter, stroke: defaultStroke } = sizes[size];
  const stroke = strokeWidth || defaultStroke;
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColorForScore = (score: number): string => {
    if (score <= 40) return '#ef4444'; // Red
    if (score <= 70) return '#f59e0b'; // Yellow
    return '#22c55e'; // Green
  };

  const getStatusText = (score: number): string => {
    if (score <= 40) return 'Poor';
    if (score <= 70) return 'Fair';
    return 'Excellent';
  };

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <div className="relative">
        <svg width={diameter} height={diameter} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={stroke}
            fill="none"
            className="dark:stroke-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            stroke={getColorForScore(score)}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className={animate ? 'transition-all duration-1000 ease-out' : ''}
            strokeLinecap="round"
          />
        </svg>
        
        {showLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {score}%
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {getStatusText(score)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthScoreGauge;
```

### 2. Dashboard Page Implementation
```tsx
// src/renderer/pages/Dashboard.tsx
import React from 'react';
import { useAppStore } from '../store/appStore';
import HealthScoreGauge from '../components/common/HealthScoreGauge';
import SystemCard from '../components/common/SystemCard';
import PerformanceChart from '../components/charts/PerformanceChart';
import { Cpu, Memory, HardDrive, Wifi } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { systemInfo, healthScore } = useAppStore();

  const quickActions = [
    {
      title: 'Quick Scan',
      description: 'Scan for junk files and optimization opportunities',
      icon: <Cpu className="w-6 h-6" />,
      action: () => console.log('Quick scan started'),
    },
    {
      title: 'Optimize Now',
      description: 'Apply all recommended optimizations',
      icon: <Memory className="w-6 h-6" />,
      action: () => console.log('Optimization started'),
    },
    {
      title: 'Clean System',
      description: 'Remove junk files and free up space',
      icon: <HardDrive className="w-6 h-6" />,
      action: () => console.log('Clean started'),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Health Score Section */}
      <div className="flex items-center justify-center">
        <HealthScoreGauge score={healthScore} size="xl" />
      </div>

      {/* Performance Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PerformanceChart type="cpu" timeRange="5m" />
        <PerformanceChart type="memory" timeRange="5m" />
        <PerformanceChart type="disk" timeRange="5m" />
        <PerformanceChart type="network" timeRange="5m" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <SystemCard
            key={index}
            title={action.title}
            description={action.description}
            icon={action.icon}
            actions={[
              {
                label: 'Run',
                onClick: action.action,
                variant: 'primary',
              },
            ]}
            variant="info"
          />
        ))}
      </div>

      {/* System Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          System Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {systemInfo.cpu.usage}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Memory</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {Math.round(systemInfo.memory.used / 1024 / 1024)} MB / {Math.round(systemInfo.memory.total / 1024 / 1024)} MB
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Disk Space</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {Math.round(systemInfo.disk.used / 1024 / 1024 / 1024)} GB / {Math.round(systemInfo.disk.total / 1024 / 1024 / 1024)} GB
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Network</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              ↑ {systemInfo.network.upload} ↓ {systemInfo.network.download}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

## Development Workflow

### 1. Running the Application
```bash
# Development mode
npm run dev                    # Start Vite dev server
npm run electron:dev          # Start Electron with dev server

# Production build
npm run build                 # Build the application
npm run electron:pack         # Package for distribution
```

### 2. Code Quality Tools
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

### 3. Git Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run type-check && npm run test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

This implementation guide provides a complete foundation for building the Advanced SystemCare alternative with modern technologies and best practices.