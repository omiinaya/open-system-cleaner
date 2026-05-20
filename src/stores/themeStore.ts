import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme, ThemeConfig } from "../types";

interface ThemeState {
  // Current theme state
  theme: Theme;
  isDark: boolean;

  // Theme configuration
  config: ThemeConfig;

  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setAccentColor: (color: string) => void;
  setFontScale: (scale: number) => void;
  toggleReduceMotion: () => void;
  toggleHighContrast: () => void;
  updateConfig: (config: Partial<ThemeConfig>) => void;
}

// Detect system preference
const getSystemTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
};

// Apply theme to DOM
const applyThemeToDOM = (theme: Theme, isDark: boolean) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // Remove existing theme classes
  root.classList.remove("light", "dark");

  // Add appropriate class
  if (theme === "system") {
    root.classList.add(getSystemTheme());
  } else {
    root.classList.add(theme);
  }

  // Set data attribute
  root.setAttribute("data-theme", isDark ? "dark" : "light");
};

// Calculate if current theme is dark
const calculateIsDark = (theme: Theme): boolean => {
  if (theme === "system") {
    return getSystemTheme() === "dark";
  }
  return theme === "dark";
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: "system",
      isDark: false,

      config: {
        theme: "system",
        followSystem: true,
        accentColor: "#3b82f6",
        fontScale: 1,
        reduceMotion: false,
        highContrast: false,
      },

      // Set specific theme
      setTheme: (theme) => {
        const isDark = calculateIsDark(theme);
        set({
          theme,
          isDark,
          config: {
            ...get().config,
            theme,
            followSystem: theme === "system",
          },
        });
        applyThemeToDOM(theme, isDark);
      },

      // Toggle between light and dark
      toggleTheme: () => {
        const currentTheme = get().theme;
        const currentIsDark = get().isDark;

        let newTheme: Theme;
        if (currentTheme === "system") {
          newTheme = currentIsDark ? "light" : "dark";
        } else {
          newTheme = currentTheme === "dark" ? "light" : "dark";
        }

        const isDark = calculateIsDark(newTheme);
        set({
          theme: newTheme,
          isDark,
          config: {
            ...get().config,
            theme: newTheme,
            followSystem: false,
          },
        });
        applyThemeToDOM(newTheme, isDark);
      },

      // Set accent color
      setAccentColor: (color) => {
        set({
          config: {
            ...get().config,
            accentColor: color,
          },
        });

        // Apply accent color to CSS variables
        if (typeof document !== "undefined") {
          document.documentElement.style.setProperty("--accent-primary", color);
        }
      },

      // Set font scale
      setFontScale: (scale) => {
        set({
          config: {
            ...get().config,
            fontScale: scale,
          },
        });

        // Apply font scale to document
        if (typeof document !== "undefined") {
          document.documentElement.style.fontSize = `${scale * 100}%`;
        }
      },

      // Toggle reduce motion
      toggleReduceMotion: () => {
        const newValue = !get().config.reduceMotion;
        set({
          config: {
            ...get().config,
            reduceMotion: newValue,
          },
        });

        // Apply to document
        if (typeof document !== "undefined") {
          if (newValue) {
            document.documentElement.classList.add("reduce-motion");
          } else {
            document.documentElement.classList.remove("reduce-motion");
          }
        }
      },

      // Toggle high contrast
      toggleHighContrast: () => {
        const newValue = !get().config.highContrast;
        set({
          config: {
            ...get().config,
            highContrast: newValue,
          },
        });

        // Apply to document
        if (typeof document !== "undefined") {
          if (newValue) {
            document.documentElement.classList.add("high-contrast");
          } else {
            document.documentElement.classList.remove("high-contrast");
          }
        }
      },

      // Update multiple config values at once
      updateConfig: (newConfig) => {
        set({
          config: {
            ...get().config,
            ...newConfig,
          },
        });

        // If theme changed, apply it
        if (newConfig.theme) {
          const isDark = calculateIsDark(newConfig.theme);
          set({
            theme: newConfig.theme,
            isDark,
          });
          applyThemeToDOM(newConfig.theme, isDark);
        }

        // If accent color changed, apply it
        if (newConfig.accentColor) {
          if (typeof document !== "undefined") {
            document.documentElement.style.setProperty(
              "--accent-primary",
              newConfig.accentColor,
            );
          }
        }

        // If font scale changed, apply it
        if (newConfig.fontScale !== undefined) {
          if (typeof document !== "undefined") {
            document.documentElement.style.fontSize = `${newConfig.fontScale * 100}%`;
          }
        }
      },
    }),
    {
      name: "theme-storage",
      partialize: (state) => ({
        theme: state.theme,
        config: state.config,
      }),
      onRehydrateStorage: () => (state) => {
        // Apply theme when store is rehydrated from storage
        if (state) {
          const isDark = calculateIsDark(state.theme);
          state.isDark = isDark;
          applyThemeToDOM(state.theme, isDark);

          // Apply other settings
          if (typeof document !== "undefined") {
            // Apply accent color
            document.documentElement.style.setProperty(
              "--accent-primary",
              state.config.accentColor,
            );

            // Apply font scale
            document.documentElement.style.fontSize = `${state.config.fontScale * 100}%`;

            // Apply reduce motion
            if (state.config.reduceMotion) {
              document.documentElement.classList.add("reduce-motion");
            }

            // Apply high contrast
            if (state.config.highContrast) {
              document.documentElement.classList.add("high-contrast");
            }
          }
        }
      },
    },
  ),
);

// Initialize theme on import (for SSR compatibility)
if (typeof window !== "undefined") {
  // Listen for system theme changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", (e) => {
    const store = useThemeStore.getState();
    if (store.theme === "system") {
      const isDark = e.matches;
      store.isDark = isDark;
      applyThemeToDOM("system", isDark);
    }
  });
}

export default useThemeStore;
