import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Gamepad2, Activity, List, Zap, Rocket, Gauge, Play, Pause, X, Check, AlertCircle, ChevronRight } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Switch from '../ui/Switch';
import Progress from '../ui/Progress';
import { StatCard } from '../common';

interface Game {
  id: string;
  name: string;
  path: string;
  optimized: boolean;
}

interface Process {
  id: string;
  name: string;
  pid: number;
  cpu: number;
  memory: number;
}

const SpeedUpModule: React.FC = () => {
  const [turboMode, setTurboMode] = useState(false);
  const [gameMode, setGameMode] = useState(false);
  const [showProcesses, setShowProcesses] = useState(false);
  
  const [games] = useState<Game[]>([
    { id: '1', name: 'Steam', path: 'C:\\Program Files\\Steam', optimized: true },
    { id: '2', name: 'Epic Games Launcher', path: 'C:\\Program Files\\Epic Games', optimized: false },
    { id: '3', name: 'Valorant', path: 'C:\\Riot Games\\VALORANT', optimized: true },
    { id: '4', name: 'Cyberpunk 2077', path: 'D:\\Games\\Cyberpunk 2077', optimized: false },
  ]);
  
  const [processes] = useState<Process[]>([
    { id: '1', name: 'chrome.exe', pid: 1234, cpu: 12.5, memory: 450 },
    { id: '2', name: 'spotify.exe', pid: 5678, cpu: 3.2, memory: 180 },
    { id: '3', name: 'discord.exe', pid: 9012, cpu: 5.8, memory: 320 },
    { id: '4', name: 'OneDrive.exe', pid: 3456, cpu: 1.2, memory: 95 },
  ]);
  
  const optimizedCount = games.filter((g) => g.optimized).length;
  
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="relative">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Rocket className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary mb-1">Speed Up</h2>
              <p className="text-text-secondary">Boost gaming performance, manage processes, and activate turbo mode for maximum speed.</p>
            </div>
            <div className="flex-shrink-0">
              <Button variant="primary" size="lg" onClick={() => setTurboMode(!turboMode)} leftIcon={<Zap className="w-5 h-5" />}>
                {turboMode ? 'Disable Turbo' : 'Activate Turbo'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={turboMode ? 'Active' : 'Inactive'} label="Turbo Mode" icon={Rocket} iconColor={turboMode ? 'success' : 'primary'} size="sm" />
        <StatCard value={gameMode ? 'On' : 'Off'} label="Game Mode" icon={Gamepad2} iconColor={gameMode ? 'success' : 'primary'} size="sm" />
        <StatCard value={`${optimizedCount}/${games.length}`} label="Games Optimized" icon={Check} iconColor="primary" size="sm" />
        <StatCard value="45" label="Processes" icon={List} iconColor="primary" size="sm" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center"><Gamepad2 className="w-5 h-5 text-success-500" /></div>
              <div>
                <h3 className="font-semibold text-text-primary">Game Booster</h3>
                <p className="text-sm text-text-secondary">Optimize games for better performance</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-5 h-5 text-text-secondary" />
                <div>
                  <p className="font-medium text-text-primary">Game Mode</p>
                  <p className="text-sm text-text-secondary">Optimize system for gaming</p>
                </div>
              </div>
              <Switch checked={gameMode} onCheckedChange={setGameMode} />
            </div>
            <div className="space-y-2">
              {games.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-bg-secondary flex items-center justify-center"><span className="text-xs font-medium text-text-secondary">{game.name.charAt(0)}</span></div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{game.name}</p>
                      <p className="text-xs text-text-tertiary truncate max-w-[150px]">{game.path}</p>
                    </div>
                  </div>
                  <Badge variant={game.optimized ? 'success' : 'default'} size="sm">{game.optimized ? 'Optimized' : 'Not Optimized'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center"><Activity className="w-5 h-5 text-primary-500" /></div>
              <div>
                <h3 className="font-semibold text-text-primary">Performance Monitor</h3>
                <p className="text-sm text-text-secondary">Real-time system performance</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'CPU Usage', value: 34, color: 'primary' as const },
              { label: 'Memory Usage', value: 68, color: 'success' as const },
              { label: 'Disk Usage', value: 12, color: 'warning' as const },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1"><span className="text-sm text-text-secondary">{item.label}</span><span className="text-sm font-medium text-text-primary">{item.value}%</span></div>
                <Progress value={item.value} max={100} color={item.color} size="sm" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader action={<Button variant="ghost" size="sm" onClick={() => setShowProcesses(!showProcesses)}>{showProcesses ? 'Hide' : 'Show All'}</Button>}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-500/10 flex items-center justify-center"><List className="w-5 h-5 text-warning-500" /></div>
              <div>
                <h3 className="font-semibold text-text-primary">Process Manager</h3>
                <p className="text-sm text-text-secondary">Manage background processes</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {processes.slice(0, showProcesses ? processes.length : 4).map((process) => (
                <div key={process.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-bg-secondary flex items-center justify-center"><span className="text-xs font-medium text-text-secondary">{process.name.charAt(0)}</span></div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{process.name}</p>
                      <p className="text-xs text-text-tertiary">PID: {process.pid}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-text-secondary">{process.cpu}% CPU</span>
                    <span className="text-text-secondary">{process.memory} MB</span>
                    <Button variant="ghost" size="sm" className="p-1"><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center"><Rocket className="w-5 h-5 text-primary-500" /></div>
              <div>
                <h3 className="font-semibold text-text-primary">System Turbo Mode</h3>
                <p className="text-sm text-text-secondary">One-click maximum performance</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn('p-4 rounded-lg border-2 transition-all', turboMode ? 'bg-primary-500/10 border-primary-500' : 'bg-bg-tertiary border-transparent')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', turboMode ? 'bg-primary-500 text-white' : 'bg-bg-secondary text-text-secondary')}>
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">Turbo Boost</h4>
                    <p className="text-sm text-text-secondary">Maximize system performance</p>
                  </div>
                </div>
                <Switch checked={turboMode} onCheckedChange={setTurboMode} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-primary">What Turbo Mode does:</p>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-500" /> Disables unnecessary visual effects</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-500" /> Prioritizes CPU for active applications</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-500" /> Frees up RAM automatically</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-500" /> Disables background updates</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SpeedUpModule;
