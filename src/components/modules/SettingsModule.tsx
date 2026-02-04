import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Settings, Bell, Shield, Globe, Moon, Sun, Monitor, Info, Check, Clock, FileText, Trash2, RefreshCw } from 'lucide-react';
import Card, { CardHeader, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import Switch from '../ui/Switch';
import { useThemeStore } from '../../stores/themeStore';

const SettingsModule: React.FC = () => {
  const { isDark, toggleTheme } = useThemeStore();
  const [activeSection, setActiveSection] = useState<string>('general');
  
  const [generalSettings, setGeneralSettings] = useState({
    language: 'English',
    startWithWindows: true,
    minimizeToTray: true,
    autoUpdate: true,
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    scanComplete: true,
    optimizationComplete: true,
    securityAlerts: true,
    lowDiskSpace: true,
    soundEnabled: false,
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    shareUsageData: false,
    autoCleanBrowsingData: false,
    passwordProtectSettings: false,
  });
  
  const [scanSettings, setScanSettings] = useState({
    autoScan: true,
    scanSchedule: 'weekly',
    scanAtStartup: false,
  });
  
  const sections = [
    { id: 'general', icon: Settings, title: 'General', description: 'Language, startup, updates' },
    { id: 'notifications', icon: Bell, title: 'Notifications', description: 'Alerts and sounds' },
    { id: 'privacy', icon: Shield, title: 'Privacy', description: 'Data collection, history' },
    { id: 'scan', icon: RefreshCw, title: 'Scan Settings', description: 'Schedule, what to scan' },
    { id: 'about', icon: Info, title: 'About', description: 'Version, credits' },
  ];
  
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="relative">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Settings className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary mb-1">Settings</h2>
              <p className="text-text-secondary">Configure application preferences and options.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left',
                  activeSection === section.id
                    ? 'bg-primary-500/10 text-primary-600 border border-primary-200'
                    : 'hover:bg-bg-tertiary text-text-secondary'
                )}
              >
                <Icon className={cn('w-5 h-5', activeSection === section.id ? 'text-primary-500' : 'text-text-tertiary')} />
                <div>
                  <p className={cn('font-medium', activeSection === section.id ? 'text-text-primary' : '')}>{section.title}</p>
                  <p className="text-xs text-text-tertiary">{section.description}</p>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="lg:col-span-3">
          {activeSection === 'general' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center"><Settings className="w-5 h-5 text-primary-500" /></div>
                  <div>
                    <h3 className="font-semibold text-text-primary">General Settings</h3>
                    <p className="text-sm text-text-secondary">Configure basic application settings</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-text-secondary" />
                    <div>
                      <p className="font-medium text-text-primary">Language</p>
                      <p className="text-sm text-text-secondary">Select your preferred language</p>
                    </div>
                  </div>
                  <select className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-text-primary">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    {isDark ? <Moon className="w-5 h-5 text-text-secondary" /> : <Sun className="w-5 h-5 text-text-secondary" />}
                    <div>
                      <p className="font-medium text-text-primary">Dark Mode</p>
                      <p className="text-sm text-text-secondary">Toggle dark/light theme</p>
                    </div>
                  </div>
                  <Switch checked={isDark} onCheckedChange={toggleTheme} />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-text-secondary" />
                    <div>
                      <p className="font-medium text-text-primary">Start with Windows</p>
                      <p className="text-sm text-text-secondary">Launch app on system startup</p>
                    </div>
                  </div>
                  <Switch checked={generalSettings.startWithWindows} onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, startWithWindows: checked })} />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-text-secondary" />
                    <div>
                      <p className="font-medium text-text-primary">Auto Update</p>
                      <p className="text-sm text-text-secondary">Automatically install updates</p>
                    </div>
                  </div>
                  <Switch checked={generalSettings.autoUpdate} onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, autoUpdate: checked })} />
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning-500/10 flex items-center justify-center"><Bell className="w-5 h-5 text-warning-500" /></div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Notifications</h3>
                    <p className="text-sm text-text-secondary">Configure notification preferences</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-text-secondary" />
                    <div>
                      <p className="font-medium text-text-primary">Enable Notifications</p>
                      <p className="text-sm text-text-secondary">Show system notifications</p>
                    </div>
                  </div>
                  <Switch checked={notificationSettings.enabled} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, enabled: checked })} />
                </div>
                
                {notificationSettings.enabled && (
                  <>
                    <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-text-secondary" />
                        <div>
                          <p className="font-medium text-text-primary">Scan Complete</p>
                          <p className="text-sm text-text-secondary">Notify when scan finishes</p>
                        </div>
                      </div>
                      <Switch checked={notificationSettings.scanComplete} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, scanComplete: checked })} />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-text-secondary" />
                        <div>
                          <p className="font-medium text-text-primary">Optimization Complete</p>
                          <p className="text-sm text-text-secondary">Notify when optimization finishes</p>
                        </div>
                      </div>
                      <Switch checked={notificationSettings.optimizationComplete} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, optimizationComplete: checked })} />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-text-secondary" />
                        <div>
                          <p className="font-medium text-text-primary">Security Alerts</p>
                          <p className="text-sm text-text-secondary">Notify about security issues</p>
                        </div>
                      </div>
                      <Switch checked={notificationSettings.securityAlerts} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, securityAlerts: checked })} />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-text-secondary" />
                        <div>
                          <p className="font-medium text-text-primary">Sound Effects</p>
                          <p className="text-sm text-text-secondary">Play sounds for notifications</p>
                        </div>
                      </div>
                      <Switch checked={notificationSettings.soundEnabled} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, soundEnabled: checked })} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
          
          {activeSection === 'privacy' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center"><Shield className="w-5 h-5 text-success-500" /></div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Privacy Settings</h3>
                    <p className="text-sm text-text-secondary">Control your privacy preferences</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-text-secondary" />
                    <div>
                      <p className="font-medium text-text-primary">Share Usage Data</p>
                      <p className="text-sm text-text-secondary">Help improve the app by sharing anonymous data</p>
                    </div>
                  </div>
                  <Switch checked={privacySettings.shareUsageData} onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, shareUsageData: checked })} />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-text-secondary" />
                    <div>
                      <p className="font-medium text-text-primary">Auto Clean Browsing Data</p>
                      <p className="text-sm text-text-secondary">Clear browser data after each session</p>
                    </div>
                  </div>
                  <Switch checked={privacySettings.autoCleanBrowsingData} onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, autoCleanBrowsingData: checked })} />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-text-secondary" />
                    <div>
                      <p className="font-medium text-text-primary">Password Protection</p>
                      <p className="text-sm text-text-secondary">Require password to access settings</p>
                    </div>
                  </div>
                  <Switch checked={privacySettings.passwordProtectSettings} onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, passwordProtectSettings: checked })} />
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeSection === 'scan' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center"><RefreshCw className="w-5 h-5 text-primary-500" /></div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Scan Settings</h3>
                    <p className="text-sm text-text-secondary">Configure automatic scanning</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-text-secondary" />
                    <div>
                      <p className="font-medium text-text-primary">Automatic Scan</p>
                      <p className="text-sm text-text-secondary">Schedule regular system scans</p>
                    </div>
                  </div>
                  <Switch checked={scanSettings.autoScan} onCheckedChange={(checked) => setScanSettings({ ...scanSettings, autoScan: checked })} />
                </div>
                
                {scanSettings.autoScan && (
                  <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-text-secondary" />
                      <div>
                        <p className="font-medium text-text-primary">Scan Schedule</p>
                        <p className="text-sm text-text-secondary">How often to run scans</p>
                      </div>
                    </div>
                    <select
                      className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-text-primary"
                      value={scanSettings.scanSchedule}
                      onChange={(e) => setScanSettings({ ...scanSettings, scanSchedule: e.target.value })}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}
                
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-text-secondary" />
                    <div>
                      <p className="font-medium text-text-primary">Scan at Startup</p>
                      <p className="text-sm text-text-secondary">Run a quick scan when app starts</p>
                    </div>
                  </div>
                  <Switch checked={scanSettings.scanAtStartup} onCheckedChange={(checked) => setScanSettings({ ...scanSettings, scanAtStartup: checked })} />
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeSection === 'about' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center"><Info className="w-5 h-5 text-primary-500" /></div>
                  <div>
                    <h3 className="font-semibold text-text-primary">About</h3>
                    <p className="text-sm text-text-secondary">Application information</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
                    <Settings className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary">OSC System Care</h2>
                  <p className="text-text-secondary">Open Source SystemCare Alternative</p>
                  <Badge variant="primary" className="mt-2">Version 1.0.0</Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                    <span className="text-text-secondary">Version</span>
                    <span className="font-medium text-text-primary">1.0.0</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                    <span className="text-text-secondary">Build Date</span>
                    <span className="font-medium text-text-primary">January 2026</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                    <span className="text-text-secondary">License</span>
                    <span className="font-medium text-text-primary">MIT License</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-text-secondary text-center">Made with care for the open source community.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;