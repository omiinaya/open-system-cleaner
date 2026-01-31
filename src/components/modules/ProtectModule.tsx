import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Shield, ShieldCheck, ShieldAlert, Search, Eye, Lock, Globe, Camera, Mic, Keyboard, Check, AlertCircle, RefreshCw, Zap, Activity } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Switch from '../ui/Switch';
import { ScanProgress, StatCard } from '../common';

interface ProtectionFeature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  critical?: boolean;
}

const ProtectModule: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [currentAction, setCurrentAction] = useState('');
  const [threatsFound, setThreatsFound] = useState(0);
  const [securityScore, setSecurityScore] = useState(85);
  const [realTimeProtection, setRealTimeProtection] = useState(true);
  const [firewallEnabled, setFirewallEnabled] = useState(true);
  
  const [protectionFeatures, setProtectionFeatures] = useState<ProtectionFeature[]>([
    { id: 'anti-tracking', icon: <Eye className="w-5 h-5" />, title: 'Anti-Tracking', description: 'Block online tracking and fingerprinting', enabled: true },
    { id: 'anti-phishing', icon: <Globe className="w-5 h-5" />, title: 'Anti-Phishing', description: 'Protect against phishing websites', enabled: true, critical: true },
    { id: 'camera-protection', icon: <Camera className="w-5 h-5" />, title: 'Camera Protection', description: 'Block unauthorized camera access', enabled: true },
    { id: 'microphone-protection', icon: <Mic className="w-5 h-5" />, title: 'Microphone Protection', description: 'Block unauthorized microphone access', enabled: false },
    { id: 'keystroke-encryption', icon: <Keyboard className="w-5 h-5" />, title: 'Keystroke Encryption', description: 'Encrypt keystrokes to prevent keyloggers', enabled: true },
    { id: 'homepage-protection', icon: <Lock className="w-5 h-5" />, title: 'Homepage Protection', description: 'Prevent unauthorized browser homepage changes', enabled: true },
  ]);
  
  const toggleFeature = (id: string) => {
    setProtectionFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));
  };
  
  const handleScan = (type: 'quick' | 'full') => {
    setIsScanning(true);
    setScanProgress(0);
    setScanComplete(false);
    setThreatsFound(0);
    const actions = ['Initializing scan engine...', 'Scanning memory...', 'Checking startup items...', 'Scanning system files...', 'Analyzing registry...', 'Checking browser extensions...'];
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 12;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        const foundThreats = Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0;
        setThreatsFound(foundThreats);
        setScanComplete(true);
        setIsScanning(false);
        setSecurityScore(foundThreats > 0 ? 75 : 98);
      }
      setScanProgress(progress);
      setCurrentAction(actions[Math.floor((progress / 100) * actions.length)] || 'Completing scan...');
    }, type === 'quick' ? 150 : 300);
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success-500';
    if (score >= 70) return 'text-warning-500';
    return 'text-danger-500';
  };
  
  const enabledCount = protectionFeatures.filter((f) => f.enabled).length;
  
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-warning-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="relative">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0">
              <div className={cn('w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg', securityScore >= 90 ? 'bg-success-500 shadow-success-500/20' : securityScore >= 70 ? 'bg-warning-500 shadow-warning-500/20' : 'bg-danger-500 shadow-danger-500/20')}>
                {securityScore >= 90 ? <ShieldCheck className="w-10 h-10 text-white" /> : <ShieldAlert className="w-10 h-10 text-white" />}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-text-primary">Security Center</h2>
                <Badge variant={securityScore >= 90 ? 'success' : securityScore >= 70 ? 'warning' : 'danger'} size="md" dot pulse={securityScore < 90}>
                  {securityScore >= 90 ? 'Protected' : securityScore >= 70 ? 'At Risk' : 'Critical'}
                </Badge>
              </div>
              <p className="text-text-secondary">Real-time protection is {realTimeProtection ? 'active' : 'disabled'}. {threatsFound > 0 ? ` ${threatsFound} threats found.` : ' No threats detected.'}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <span className={cn('text-4xl font-bold', getScoreColor(securityScore))}>{securityScore}</span>
                <p className="text-xs text-text-secondary">Security Score</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isScanning && <ScanProgress isScanning={isScanning} progress={scanProgress} currentAction={currentAction} itemsScanned={Math.floor((scanProgress / 100) * 50000)} totalItems={50000} issuesFound={threatsFound} onCancel={() => setIsScanning(false)} variant="protect" />}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={realTimeProtection ? 'On' : 'Off'} label="Real-time Protection" icon={Shield} iconColor={realTimeProtection ? 'success' : 'danger'} size="sm" />
        <StatCard value={`${enabledCount}/${protectionFeatures.length}`} label="Features Active" icon={Check} iconColor="primary" size="sm" />
        <StatCard value={firewallEnabled ? 'Active' : 'Disabled'} label="Firewall" icon={Lock} iconColor={firewallEnabled ? 'success' : 'warning'} size="sm" />
        <StatCard value={threatsFound.toString()} label="Threats Blocked" icon={AlertCircle} iconColor={threatsFound > 0 ? 'danger' : 'success'} size="sm" />
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center"><Search className="w-5 h-5 text-primary-500" /></div>
            <div>
              <h3 className="font-semibold text-text-primary">Malware Scanner</h3>
              <p className="text-sm text-text-secondary">Scan your system for threats</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!scanComplete && !isScanning ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-bg-tertiary rounded-lg border border-border hover:border-primary-500/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-500/10 rounded-lg"><Zap className="w-5 h-5 text-primary-500" /></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-text-primary">Quick Scan</h4>
                    <p className="text-sm text-text-secondary mt-1">Scan critical areas and running processes</p>
                    <p className="text-xs text-text-tertiary mt-2">~2 minutes</p>
                  </div>
                </div>
                <Button variant="primary" className="w-full mt-4" onClick={() => handleScan('quick')} leftIcon={<Search className="w-4 h-4" />}>Quick Scan</Button>
              </div>
              <div className="p-4 bg-bg-tertiary rounded-lg border border-border hover:border-primary-500/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-500/10 rounded-lg"><Activity className="w-5 h-5 text-primary-500" /></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-text-primary">Full Scan</h4>
                    <p className="text-sm text-text-secondary mt-1">Comprehensive scan of all files and drives</p>
                    <p className="text-xs text-text-tertiary mt-2">~30-60 minutes</p>
                  </div>
                </div>
                <Button variant="secondary" className="w-full mt-4" onClick={() => handleScan('full')} leftIcon={<Search className="w-4 h-4" />}>Full Scan</Button>
              </div>
            </div>
          ) : scanComplete && threatsFound > 0 ? (
            <div className="space-y-4">
              <div className="p-4 bg-danger-500/10 border border-danger-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-danger-500">Threats Detected!</h4>
                    <p className="text-sm text-text-secondary mt-1">{threatsFound} threats were found on your system. We recommend removing them immediately.</p>
                  </div>
                </div>
              </div>
              <Button variant="danger" fullWidth leftIcon={<Shield className="w-4 h-4" />}>Remove All Threats</Button>
            </div>
          ) : scanComplete ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-success-500/20 flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-success-500" /></div>
              <h4 className="font-semibold text-text-primary">No Threats Found</h4>
              <p className="text-text-secondary mt-1">Your system is clean and secure</p>
              <Button variant="secondary" className="mt-4" onClick={() => setScanComplete(false)} leftIcon={<RefreshCw className="w-4 h-4" />}>Scan Again</Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', realTimeProtection ? 'bg-success-500/10 text-success-500' : 'bg-danger-500/10 text-danger-500')}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Real-time Protection</h3>
                  <p className="text-sm text-text-secondary">Continuously monitor and block threats in real-time</p>
                </div>
              </div>
              <Switch checked={realTimeProtection} onCheckedChange={setRealTimeProtection} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', firewallEnabled ? 'bg-success-500/10 text-success-500' : 'bg-warning-500/10 text-warning-500')}>
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Firewall</h3>
                  <p className="text-sm text-text-secondary">Monitor and control network traffic</p>
                </div>
              </div>
              <Switch checked={firewallEnabled} onCheckedChange={setFirewallEnabled} />
            </div>
          </CardContent>
        </Card>
        
        {protectionFeatures.map((feature) => (
          <Card key={feature.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', feature.enabled ? 'bg-primary-500/10 text-primary-500' : 'bg-bg-tertiary text-text-tertiary')}>
                    {feature.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-primary">{feature.title}</h3>
                      {feature.critical && <Badge variant="danger" size="sm">Critical</Badge>}
                    </div>
                    <p className="text-sm text-text-secondary">{feature.description}</p>
                  </div>
                </div>
                <Switch checked={feature.enabled} onCheckedChange={() => toggleFeature(feature.id)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProtectModule;
