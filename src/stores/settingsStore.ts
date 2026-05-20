import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NotificationSettings, ScanSettings } from "../types";

interface SettingsState {
  // Notification settings
  notifications: NotificationSettings;

  // Scan settings
  scan: ScanSettings;

  // Actions
  setNotifications: (settings: Partial<NotificationSettings>) => void;
  setScan: (settings: Partial<ScanSettings>) => void;
  toggleSoundEnabled: () => void;
  resetSettings: () => void;
}

const defaultNotifications: NotificationSettings = {
  enabled: true,
  scanComplete: true,
  optimizationComplete: true,
  securityAlerts: true,
  lowDiskSpace: true,
  soundEnabled: false,
};

const defaultScan: ScanSettings = {
  autoScan: true,
  scanSchedule: "weekly",
  scanAtStartup: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: defaultNotifications,
      scan: defaultScan,

      // Set notification settings
      setNotifications: (newSettings) => {
        set({
          notifications: {
            ...get().notifications,
            ...newSettings,
          },
        });
      },

      // Set scan settings
      setScan: (newSettings) => {
        set({
          scan: {
            ...get().scan,
            ...newSettings,
          },
        });
      },

      // Toggle sound enabled
      toggleSoundEnabled: () => {
        set({
          notifications: {
            ...get().notifications,
            soundEnabled: !get().notifications.soundEnabled,
          },
        });
      },

      // Reset all settings to defaults
      resetSettings: () => {
        set({
          notifications: defaultNotifications,
          scan: defaultScan,
        });
      },
    }),
    {
      name: "settings-storage",
      partialize: (state) => ({
        notifications: state.notifications,
        scan: state.scan,
      }),
    },
  ),
);

export default useSettingsStore;
