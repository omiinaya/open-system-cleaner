import React, { useEffect } from 'react';
import { useThemeStore } from './stores/themeStore';
import { useNavigationStore } from './stores/navigationStore';
import MainLayout from './components/layout/MainLayout';
import { HealthScoreGauge, PerformanceChart, StatusCard, QuickActionCard } from './components/dashboard';
import { CleanModule, OptimizeModule, ProtectModule, SpeedUpModule, ToolboxModule, SettingsModule } from './components/modules';
import Card, { CardHeader, CardContent, CardFooter } from './components/ui/Card';
import Button from './components/ui/Button';
import Badge from './components/ui/Badge';
import Progress from './components/ui/Progress';
import { StatCard } from './components/common';
import {
  Activity, Trash2, Zap, Shield, Cpu, HardDrive, Clock,
  CheckCircle2, AlertCircle, RotateCcw, Globe, Gamepad2,
  List, BarChart3, Package, Download, FolderOpen, Lock, Eye, Keyboard,
  Sparkles, Rocket, Gauge, Wrench, Settings, TrendingUp, TrendingDown, Minus
} from 'lucide-react';

// Dashboard Module Component
const DashboardModule: React.FC = () => {
  const { setCurrentModule } = useNavigationStore();
  
  return (
    <div className="space-y-6">
      {/* Health Score Hero */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="relative">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <HealthScoreGauge score={85} size="lg" animated />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-text-primary mb-2">Your system is in good condition</h3>
              <p className="text-text-secondary mb-4">Last scan: 2 days ago. We found 3 issues that can be fixed to improve performance.</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" leftIcon={<Zap className="w-4 h-4" />} onClick={() => setCurrentModule('clean')}>
                  Quick Fix
                </Button>
                <Button variant="secondary" leftIcon={<RotateCcw className="w-4 h-4" />}>
                  Rescan
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          icon={Trash2}
          label="Junk Files"
          value="2.4 GB"
          subValue="Can be cleaned"
          variant="primary"
          trend="up"
          trendValue="+12%"
          sparklineData={[20, 35, 30, 45, 40, 55, 50, 65, 60, 75]}
          onClick={() => setCurrentModule('clean')}
        />
        <StatusCard
          icon={Cpu}
          label="CPU Usage"
          value="24%"
          subValue="Normal load"
          variant="success"
          trend="down"
          trendValue="-8%"
          sparklineData={[60, 55, 45, 50, 40, 35, 30, 25, 28, 24]}
        />
        <StatusCard
          icon={HardDrive}
          label="Disk Space"
          value="156 GB"
          subValue="Free space"
          variant="warning"
          trend="down"
          trendValue="-5%"
          sparklineData={[180, 175, 170, 168, 165, 162, 160, 158, 157, 156]}
        />
        <StatusCard
          icon={Clock}
          label="Startup Time"
          value="12s"
          subValue="Could be faster"
          variant="danger"
          trend="up"
          trendValue="+2s"
          sparklineData={[8, 9, 9, 10, 10, 11, 11, 12, 12, 12]}
          onClick={() => setCurrentModule('optimize')}
        />
      </div>
      
      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            icon={Sparkles}
            title="Quick Scan"
            description="Scan your system for junk files, registry issues, and privacy traces"
            buttonText="Start Scan"
            onAction={() => setCurrentModule('clean')}
            variant="primary"
          />
          <QuickActionCard
            icon={Zap}
            title="Optimize RAM"
            description="Free up memory and improve system responsiveness instantly"
            buttonText="Optimize Now"
            onAction={() => setCurrentModule('optimize')}
            variant="success"
          />
          <QuickActionCard
            icon={Shield}
            title="Security Scan"
            description="Check for malware and security threats on your system"
            buttonText="Scan Now"
            onAction={() => setCurrentModule('protect')}
            variant="warning"
          />
        </div>
      </div>
      
      {/* Performance Chart & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">Performance Monitor</h3>
          </CardHeader>
          <CardContent>
            <PerformanceChart height={280} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">Issues Summary</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Registry Issues', value: 12, max: 50, color: 'warning' as const },
              { label: 'Privacy Traces', value: 45, max: 100, color: 'primary' as const },
              { label: 'Startup Programs', value: 8, max: 20, color: 'success' as const },
              { label: 'Junk Files', value: 156, max: 200, color: 'danger' as const },
            ].map((issue) => (
              <div key={issue.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-text-secondary">{issue.label}</span>
                  <span className="text-sm font-medium text-text-primary">{issue.value} items</span>
                </div>
                <Progress value={issue.value} max={issue.max} color={issue.color} showLabel />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="primary" fullWidth leftIcon={<Zap className="w-4 h-4" />} onClick={() => setCurrentModule('clean')}>
              Fix All Issues
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { icon: CheckCircle2, color: 'success', title: 'System scan completed', time: '2 days ago', badge: 'Completed' },
              { icon: Trash2, color: 'primary', title: 'Junk files cleaned', time: '1 week ago', badge: '1.2 GB' },
              { icon: AlertCircle, color: 'warning', title: 'Security scan pending', time: 'Overdue by 3 days', badge: 'Pending' },
              { icon: Zap, color: 'success', title: 'RAM optimized', time: '2 weeks ago', badge: '512 MB freed' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg hover:bg-bg-tertiary/80 transition-colors">
                <div className={`p-2 rounded-lg bg-${item.color}-500/10`}>
                  <item.icon className={`w-5 h-5 text-${item.color}-500`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{item.title}</p>
                  <p className="text-xs text-text-secondary">{item.time}</p>
                </div>
                <Badge variant={item.color as any} size="sm">{item.badge}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

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
        return <DashboardModule />;
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
        return <DashboardModule />;
    }
  };

  return (
    <MainLayout
      currentModule={currentModule}
      onModuleChange={setCurrentModule}
      pageTitle=""
    >
      {renderModule()}
    </MainLayout>
  );
};

export default App;
