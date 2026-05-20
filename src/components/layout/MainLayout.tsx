import React, { useState } from "react";
import { cn } from "../../utils/cn";
import Sidebar from "./Sidebar";
import Header from "./Header";
import type { ModuleType } from "../../types";

export interface MainLayoutProps {
  children: React.ReactNode;
  currentModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  pageTitle: string;
  className?: string;
}

const moduleTitles: Record<ModuleType, string> = {
  dashboard: "Overview",
  clean: "System Clean",
  optimize: "System Optimize",
  protect: "System Protect",
  speedup: "Speed Up",
  toolbox: "Toolbox",
  settings: "Settings",
};

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentModule,
  onModuleChange,
  pageTitle,
  className,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const displayTitle =
    pageTitle || moduleTitles[currentModule] || "OSC System Care";

  return (
    <div
      className={cn(
        "flex h-screen w-full overflow-hidden bg-bg-primary",
        className,
      )}
    >
      {/* Sidebar */}
      <Sidebar
        currentModule={currentModule}
        onModuleChange={onModuleChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header title={displayTitle} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
