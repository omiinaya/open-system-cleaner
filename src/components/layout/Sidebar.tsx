import React from 'react';
import { cn } from '../../utils/cn';
import type { ModuleType } from '../../types';
import {
  LayoutDashboard,
  Sparkles,
  Zap,
  Shield,
  Gauge,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';

export interface SidebarProps {
  currentModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavigationItem {
  id: ModuleType;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Overview',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    id: 'clean',
    label: 'Clean',
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: 'optimize',
    label: 'Optimize',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: 'protect',
    label: 'Protect',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: 'speedup',
    label: 'Speed Up',
    icon: <Gauge className="w-5 h-5" />,
  },
  {
    id: 'toolbox',
    label: 'Toolbox',
    icon: <Wrench className="w-5 h-5" />,
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onModuleChange,
  collapsed,
  onToggleCollapse,
}) => {
  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-bg-secondary border-r border-border transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo/Header */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-border px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-text-primary text-sm">OSC</h1>
              <p className="text-xs text-text-secondary">System Care</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = currentModule === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onModuleChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                    'hover:bg-bg-tertiary',
                    isActive
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <span
                    className={cn(
                      'flex-shrink-0 transition-colors duration-200',
                      isActive
                        ? 'text-primary-500'
                        : 'text-text-tertiary group-hover:text-text-secondary'
                    )}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="font-medium text-sm truncate">
                      {item.label}
                    </span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="ml-auto text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-3 space-y-1">
        {/* Settings Button */}
        <button
          onClick={() => onModuleChange('settings')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
            'hover:bg-bg-tertiary',
            currentModule === 'settings'
              ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
              : 'text-text-secondary hover:text-text-primary'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <span
            className={cn(
              'flex-shrink-0 transition-colors duration-200',
              currentModule === 'settings'
                ? 'text-primary-500'
                : 'text-text-tertiary group-hover:text-text-secondary'
            )}
          >
            <Settings className="w-5 h-5" />
          </span>
          {!collapsed && (
            <span className="font-medium text-sm">Settings</span>
          )}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
            'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
            collapsed ? 'justify-center' : ''
          )}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
