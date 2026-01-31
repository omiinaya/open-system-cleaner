import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Zap, Clock, Cpu, Globe, HardDrive, Rocket, Gauge, AlertCircle } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Progress from '../ui/Progress';
import Switch from '../ui/Switch';
import { ScanProgress, StatCard } from '../common';

interface StartupProgram {
  id: string;
  name: string;
  publisher: string;
  impact: 'low' | 'medium' | 'high';
  enabled: boolean;
}

interface DiskDrive {
  letter: string;
  label: string;
  total: number;
  used: number;
  free: number;
  fragmentation: number;
  type: 'SSD' | 'HDD';
}

const OptimizeModule: React.FC = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationComplete, setOptimizationComplete] = useState(false);
  const [currentAction, setCurrentAction] = useState('');
  const [showStartupDetails, setShowStartupDetails] = useState(false);
  const [ramUsage, setRamUsage] = useState(68);
  const [isOptimizingRAM, setIsOptimizingRAM] = useState(false);
  const [internetSettings, setInternetSettings] = useState({
    dnsOptimization: true,
    tcpOptimization: true,
    browserOptimization: false,
  });
  
  const [startupPrograms, setStartupPrograms] = useState<StartupProgram[]>([
    { id: '1', name: 'OneDrive', publisher: 'Microsoft', impact: 'medium', enabled: true },
    { id: '2', name: 'Spotify', publisher: 'Spotify AB', impact: 'high', enabled: true },
    { id: '3', name: 'Discord', publisher: 'Discord Inc.', impact: 'high', enabled: false },
    { id: '4', name: 'Steam', publisher: 'Valve', impact: 'medium', enabled: true },
    { id: '5', name: 'Adobe Creative Cloud', publisher: 'Adobe', impact: 'high', enabled: false },
  ]);
  
  const [drives] = useState<DiskDrive[]>([
    { letter: 'C:', label: 'Windows', total: 512, used: 320, free: 192, fragmentation: 12, type: 'SSD' },
    { letter: 'D:', label: 'Data', total: 1024, used: 680, free: 344, fragmentation: 28, type: 'HDD' },
  ]);
  
  const [defraggingDrive, setDefraggingDrive] = useState<string | null>(null);
  
  const toggleStartupProgram = (id: string) => {
    setStartupPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };
  
  const handleOptimizeRAM = () => {
    setIsOptimizingRAM(true);
    const targetUsage = Math.max(30, ramUsage - 20);
    const interval = setInterval(() => {
      setRamUsage((prev) => {
        if (prev <= targetUsage) {
          clearInterval(interval);
          setIsOptimizingRAM(false);
          return targetUsage;
        }
        return prev - 1;
      });
    }, 100);
  };
  
  const handleDefrag = (letter: string) => {
    setDefraggingDrive(letter);
    setTimeout(() => setDefraggingDrive(null), 5000);
  };
  
  const handleOptimizeAll = () => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    setOptimizationComplete(false);
    const actions = ['Optimizing startup programs...', 'Freeing up RAM...', 'Optimizing network settings...', 'Analyzing disk fragmentation...'];
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setOptimizationComplete(true);
        setIsOptimizing(false);
        setRamUsage(45);
      }
      setOptimizationProgress(progress);
      setCurrentAction(actions[Math.floor((progress / 100) * actions.length)] || 'Finalizing...');
    }, 300);
  };
  
  const enabledCount = startupPrograms.filter((p) => p.enabled).length;
  const highImpactCount = startupPrograms.filter((p) => p.enabled && p.impact === 'high').length;
  
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-success-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="relative">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-lg shadow-success-500/20">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary mb-1">System Optimizer</h2>
              <p className="text-text-secondary">Optimize startup programs, free up RAM, boost internet speed, and defragment disks.</p>
            </div>
            <div className="flex-shrink-0">
              <Button variant="success" size="lg" onClick={handleOptimizeAll} loading={isOptimizing} leftIcon={<Rocket className="w-5 h-5" />}>
                {optimizationComplete ? 'Optimize Again' : 'Optimize All'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isOptimizing && (
        <ScanProgress isScanning={isOptimizing} progress={optimizationProgress} currentAction={currentAction} itemsScanned={Math.floor((optimizationProgress / 100) * 100)} totalItems={100} issuesFound={0} onCancel={() => setIsOptimizing(false)} variant="optimize" />
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={`${enabledCount}`} label="Startup Programs" icon={Clock} iconColor="primary" size="sm" />
        <StatCard value={`${ramUsage}%`} label="RAM Usage" icon={Cpu} iconColor={ramUsage > 80 ? 'warning' : 'success'} size="sm" />
        <StatCard value="45ms" label="Latency" icon={Globe} iconColor="success" size="sm" />
        <StatCard value={`${drives.filter((d) => d.fragmentation > 20).length}`} label="Need Defrag" icon={HardDrive} iconColor={drives.some((d) => d.fragmentation > 20) ? 'warning' : 'success'} size="sm" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader action={<Button variant="ghost" size="sm" onClick={() => setShowStartupDetails(!showStartupDetails)}>{showStartupDetails ? 'Hide' : 'Manage'}</Button>}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center"><Clock className="w-5 h-5 text-primary-500" /></div>
              <div>
                <h3 className="font-semibold text-text-primary">Startup Manager</h3>
                <p className="text-sm text-text-secondary">{enabledCount} programs enabled</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {highImpactCount > 0 && (
              <div className="mb-4 p-3 bg-warning-500/10 border border-warning-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary">{highImpactCount} high-impact programs slowing startup.</p>
              </div>
            )}
            {showStartupDetails ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {startupPrograms.map((program) => (
                  <div key={program.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-bg-secondary flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-text-secondary">{program.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{program.name}</p>
                        <p className="text-xs text-text-tertiary">{program.publisher}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={program.impact === 'high' ? 'danger' : program.impact === 'medium' ? 'warning' : 'success'} size="sm">{program.impact}</Badge>
                      <Switch checked={program.enabled} onCheckedChange={() => toggleStartupProgram(program.id)} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-text-secondary" />
                  <span className="text-text-secondary">Startup Impact</span>
                </div>
                <Badge variant={highImpactCount > 2 ? 'warning' : 'success'}>{highImpactCount > 2 ? 'Slow' : 'Fast'}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center"><Cpu className="w-5 h-5 text-success-500" /></div>
              <div>
                <h3 className="font-semibold text-text-primary">RAM Optimizer</h3>
                <p className="text-sm text-text-secondary">Free up memory for better performance</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Current Usage</span>
              <span className={cn('text-lg font-bold', ramUsage > 80 ? 'text-danger-500' : 'text-text-primary')}>{ramUsage}%</span>
            </div>
            <Progress value={ramUsage} max={100} color={ramUsage > 80 ? 'danger' : ramUsage > 60 ? 'warning' : 'success'} size="lg" showLabel />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-bg-tertiary rounded-lg"><p className="text-lg font-semibold text-text-primary">16 GB</p><p className="text-xs text-text-secondary">Total</p></div>
              <div className="p-2 bg-bg-tertiary rounded-lg"><p className="text-lg font-semibold text-text-primary">{(16 * ramUsage / 100).toFixed(1)} GB</p><p className="text-xs text-text-secondary">Used</p></div>
              <div className="p-2 bg-bg-tertiary rounded-lg"><p className="text-lg font-semibold text-text-primary">{(16 * (100 - ramUsage) / 100).toFixed(1)} GB</p><p className="text-xs text-text-secondary">Free</p></div>
            </div>
            <Button variant="success" fullWidth onClick={handleOptimizeRAM} loading={isOptimizingRAM} leftIcon={<Zap className="w-4 h-4" />}>
              {isOptimizingRAM ? 'Optimizing...' : 'Optimize RAM'}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-500/10 flex items-center justify-center"><Globe className="w-5 h-5 text-warning-500" /></div>
              <div>
                <h3 className="font-semibold text-text-primary">Internet Booster</h3>
                <p className="text-sm text-text-secondary">Optimize network settings</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'dnsOptimization', label: 'DNS Optimization', desc: 'Use faster DNS servers' },
              { key: 'tcpOptimization', label: 'TCP Optimization', desc: 'Optimize TCP settings' },
              { key: 'browserOptimization', label: 'Browser Optimization', desc: 'Optimize browser settings' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                <div>
                  <p className="text-sm font-medium text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-tertiary">{item.desc}</p>
                </div>
                <Switch checked={internetSettings[item.key as keyof typeof internetSettings]} onCheckedChange={(checked) => setInternetSettings((prev) => ({ ...prev, [item.key]: checked }))} size="sm" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center"><HardDrive className="w-5 h-5 text-primary-500" /></div>
              <div>
                <h3 className="font-semibold text-text-primary">Disk Defrag</h3>
                <p className="text-sm text-text-secondary">Analyze and defragment drives</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {drives.map((drive) => (
              <div key={drive.letter} className="p-4 bg-bg-tertiary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-text-secondary" />
                    <span className="font-medium text-text-primary">{drive.letter} {drive.label}</span>
                    <Badge variant={drive.type === 'SSD' ? 'success' : 'default'} size="sm">{drive.type}</Badge>
                  </div>
                  <span className={cn('text-sm font-medium', drive.fragmentation > 20 ? 'text-warning-500' : 'text-success-500')}>{drive.fragmentation}% fragmented</span>
                </div>
                <Progress value={drive.used} max={drive.total} color={drive.fragmentation > 20 ? 'warning' : 'success'} size="md" showLabel />
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-text-tertiary">{drive.free} GB free of {drive.total} GB</span>
                  {drive.type === 'HDD' && (
                    <Button variant="primary" size="sm" onClick={() => handleDefrag(drive.letter)} loading={defraggingDrive === drive.letter}>
                      {defraggingDrive === drive.letter ? 'Defragging...' : 'Defrag'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OptimizeModule;
