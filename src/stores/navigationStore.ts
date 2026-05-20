import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModuleType, ModuleConfig, NavigationItem } from "../types";

// Module configurations
export const moduleConfigs: Record<ModuleType, ModuleConfig> = {
  dashboard: {
    id: "dashboard",
    name: "Overview",
    description: "System health overview and quick actions",
    icon: "LayoutDashboard",
    isEnabled: true,
    requiresAdmin: false,
  },
  clean: {
    id: "clean",
    name: "Clean",
    description: "Remove junk files and clean registry",
    icon: "Sparkles",
    isEnabled: true,
    requiresAdmin: true,
  },
  optimize: {
    id: "optimize",
    name: "Optimize",
    description: "Optimize startup, RAM, and internet",
    icon: "Zap",
    isEnabled: true,
    requiresAdmin: false,
  },
  protect: {
    id: "protect",
    name: "Protect",
    description: "Security and privacy protection",
    icon: "Shield",
    isEnabled: true,
    requiresAdmin: true,
  },
  speedup: {
    id: "speedup",
    name: "Speed Up",
    description: "Boost performance and gaming",
    icon: "Gauge",
    isEnabled: true,
    requiresAdmin: false,
  },
  toolbox: {
    id: "toolbox",
    name: "Toolbox",
    description: "Additional system utilities",
    icon: "Wrench",
    isEnabled: true,
    requiresAdmin: false,
  },
  settings: {
    id: "settings",
    name: "Settings",
    description: "Application settings",
    icon: "Settings",
    isEnabled: true,
    requiresAdmin: false,
  },
};

// Navigation history entry
interface NavigationHistoryEntry {
  module: ModuleType;
  timestamp: number;
  params?: Record<string, unknown>;
}

// Navigation state interface
interface NavigationState {
  // Current state
  currentModule: ModuleType;
  previousModule: ModuleType | null;
  navigationHistory: NavigationHistoryEntry[];

  // Module states
  activeModules: ModuleType[];
  moduleConfigs: Record<ModuleType, ModuleConfig>;

  // UI state
  sidebarCollapsed: boolean;

  // Actions
  setCurrentModule: (
    module: ModuleType,
    params?: Record<string, unknown>,
  ) => void;
  goBack: () => void;
  goToPreviousModule: () => void;
  canGoBack: () => boolean;

  // Module management
  enableModule: (module: ModuleType) => void;
  disableModule: (module: ModuleType) => void;
  toggleModule: (module: ModuleType) => void;
  isModuleEnabled: (module: ModuleType) => boolean;
  isModuleActive: (module: ModuleType) => boolean;

  // Sidebar
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // History management
  clearHistory: () => void;
  getLastVisitedModule: () => ModuleType | null;
  getNavigationStats: () => {
    totalVisits: number;
    mostVisited: ModuleType | null;
  };
}

// Maximum history entries to keep
const MAX_HISTORY_ENTRIES = 50;

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentModule: "dashboard",
      previousModule: null,
      navigationHistory: [],
      activeModules: [
        "dashboard",
        "clean",
        "optimize",
        "protect",
        "speedup",
        "toolbox",
        "settings",
      ],
      moduleConfigs: { ...moduleConfigs },
      sidebarCollapsed: false,

      // Set current module and update history
      setCurrentModule: (module, params) => {
        const state = get();
        const timestamp = Date.now();

        // Don't navigate if module is disabled
        if (!state.moduleConfigs[module]?.isEnabled) {
          console.warn(`Module ${module} is disabled`);
          return;
        }

        set({
          previousModule: state.currentModule,
          currentModule: module,
          navigationHistory: [
            { module, timestamp, params },
            ...state.navigationHistory.slice(0, MAX_HISTORY_ENTRIES - 1),
          ],
        });
      },

      // Go back to previous module
      goBack: () => {
        const state = get();
        const history = state.navigationHistory;

        if (history.length > 1) {
          const previousEntry = history[1];
          set({
            previousModule: state.currentModule,
            currentModule: previousEntry.module,
            navigationHistory: history.slice(1),
          });
        }
      },

      // Go to previous module (shortcut)
      goToPreviousModule: () => {
        const state = get();
        if (
          state.previousModule &&
          state.moduleConfigs[state.previousModule]?.isEnabled
        ) {
          get().setCurrentModule(state.previousModule);
        }
      },

      // Check if can go back
      canGoBack: () => {
        return get().navigationHistory.length > 1;
      },

      // Enable a module
      enableModule: (module) => {
        set((state) => ({
          moduleConfigs: {
            ...state.moduleConfigs,
            [module]: {
              ...state.moduleConfigs[module],
              isEnabled: true,
            },
          },
        }));
      },

      // Disable a module
      disableModule: (module) => {
        // Don't disable dashboard
        if (module === "dashboard") return;

        set((state) => ({
          moduleConfigs: {
            ...state.moduleConfigs,
            [module]: {
              ...state.moduleConfigs[module],
              isEnabled: false,
            },
          },
        }));

        // If current module is being disabled, go to dashboard
        const state = get();
        if (state.currentModule === module) {
          get().setCurrentModule("dashboard");
        }
      },

      // Toggle module enabled state
      toggleModule: (module) => {
        const state = get();
        if (state.moduleConfigs[module]?.isEnabled) {
          get().disableModule(module);
        } else {
          get().enableModule(module);
        }
      },

      // Check if module is enabled
      isModuleEnabled: (module) => {
        return get().moduleConfigs[module]?.isEnabled ?? false;
      },

      // Check if module is currently active
      isModuleActive: (module) => {
        return get().currentModule === module;
      },

      // Toggle sidebar
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      // Set sidebar collapsed state
      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      // Clear navigation history
      clearHistory: () => {
        set({ navigationHistory: [] });
      },

      // Get last visited module (excluding current)
      getLastVisitedModule: () => {
        const history = get().navigationHistory;
        const current = get().currentModule;

        for (const entry of history) {
          if (entry.module !== current) {
            return entry.module;
          }
        }
        return null;
      },

      // Get navigation statistics
      getNavigationStats: () => {
        const history = get().navigationHistory;
        const moduleVisits: Record<string, number> = {};

        history.forEach((entry) => {
          moduleVisits[entry.module] = (moduleVisits[entry.module] || 0) + 1;
        });

        let mostVisited: ModuleType | null = null;
        let maxVisits = 0;

        Object.entries(moduleVisits).forEach(([module, visits]) => {
          if (visits > maxVisits) {
            maxVisits = visits;
            mostVisited = module as ModuleType;
          }
        });

        return {
          totalVisits: history.length,
          mostVisited,
        };
      },
    }),
    {
      name: "navigation-storage",
      partialize: (state) => ({
        currentModule: state.currentModule,
        moduleConfigs: state.moduleConfigs,
        sidebarCollapsed: state.sidebarCollapsed,
        navigationHistory: state.navigationHistory.slice(0, 20), // Keep only recent history
      }),
    },
  ),
);

// Hook for getting current module config
export const useCurrentModuleConfig = () => {
  const { currentModule, moduleConfigs } = useNavigationStore();
  return moduleConfigs[currentModule];
};

// Hook for getting navigation items
export const useNavigationItems = (): NavigationItem[] => {
  const { moduleConfigs, currentModule } = useNavigationStore();

  return Object.values(moduleConfigs)
    .filter((config) => config.isEnabled)
    .map((config) => ({
      id: config.id,
      label: config.name,
      icon: config.icon,
      href: `/${config.id}`,
      isActive: config.id === currentModule,
    }));
};

export default useNavigationStore;
