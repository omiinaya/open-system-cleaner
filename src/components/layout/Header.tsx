import React from "react";
import { cn } from "../../utils/cn";
import { useThemeStore } from "../../stores/themeStore";
import { Sun, Moon, Minus, Square, X } from "lucide-react";

export interface HeaderProps {
  title: string;
  showWindowControls?: boolean;
  className?: string;
}

// Electron API types
declare global {
  interface Window {
    electronAPI?: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
    };
  }
}

const Header: React.FC<HeaderProps> = ({
  title,
  showWindowControls = false,
  className,
}) => {
  const { isDark, toggleTheme } = useThemeStore();

  const handleMinimize = () => {
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <header
      className={cn(
        "flex items-center justify-between px-4 py-2 bg-bg-primary border-b border-border select-none drag",
        className,
      )}
    >
      <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors no-drag cursor-pointer"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {showWindowControls && (
          <div className="flex items-center gap-1 no-drag ml-2">
            <button
              onClick={handleMinimize}
              className="p-1.5 rounded-md hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Minimize"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={handleMaximize}
              className="p-1.5 rounded-md hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Maximize"
            >
              <Square size={12} />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-md hover:bg-red-500/10 text-text-secondary hover:text-red-500 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
