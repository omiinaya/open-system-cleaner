import React from "react";
import { cn } from "../../utils/cn";
import { useThemeStore } from "../../stores/themeStore";
import { Sun, Moon, Minus, Square, X } from "lucide-react";

export interface HeaderProps {
  title: string;
  showWindowControls?: boolean;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showWindowControls = false,
  className,
}) => {
  const { isDark, toggleTheme } = useThemeStore();

  const handleMinimize = () => {
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      (window as any).electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      (window as any).electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      (window as any).electronAPI.closeWindow();
    }
  };

  return (
    <header
      className={cn(
        "h-16 bg-bg-primary border-b border-border flex items-center justify-between px-6",
        className,
      )}
    >
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "p-2 rounded-lg transition-all duration-200",
            "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
            "dark:focus:ring-offset-bg-primary",
          )}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Window Controls (Electron) */}
        {showWindowControls && (
          <div className="flex items-center gap-1 ml-4 pl-4 border-l border-border">
            <button
              onClick={handleMinimize}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary",
              )}
              title="Minimize"
              aria-label="Minimize window"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={handleMaximize}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary",
              )}
              title="Maximize"
              aria-label="Maximize window"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                "text-text-secondary hover:text-white hover:bg-danger-500",
              )}
              title="Close"
              aria-label="Close window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
