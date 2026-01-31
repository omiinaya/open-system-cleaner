import React, { useEffect } from 'react';
import { useThemeStore } from './stores/themeStore';
import { useNavigationStore } from './stores/navigationStore';
import MainLayout from './components/layout/MainLayout';
import { DashboardOverview } from './components/dashboard';
import { CleanModule, OptimizeModule, ProtectModule, SpeedUpModule, ToolboxModule, SettingsModule } from './components/modules';

// Main App Component
const App: React.FC = () => {
  const { isDark } = useThemeStore();
  const { currentModule, setCurrentModule } = useNavigationStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const renderModule = () => {
    switch (currentModule) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'clean':
        return <CleanModule />;
      case 'optimize':
        return <OptimizeModule />;
      case 'protect':
        return <ProtectModule />;
      case 'speedup':
        return <SpeedUpModule />;
      case 'toolbox':
        return <ToolboxModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <MainLayout
      currentModule={currentModule}
      onModuleChange={setCurrentModule}
      pageTitle=""
    >
      <div className="animate-fade-in">
        {renderModule()}
      </div>
    </MainLayout>
  );
};

export default App;
