import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Bell, Database, Users, Key, Globe, Save, RefreshCw } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const tabs = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'data', name: 'Data & Storage', icon: Database },
    { id: 'api', name: 'API & Integration', icon: Globe }
  ];

  const handleSave = () => {
    setHasUnsavedChanges(false);
    // Simulate save operation
  };

  const handleReset = () => {
    setHasUnsavedChanges(false);
    // Simulate reset operation
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-white/80 mb-2">Organization Name</label>
            <input 
              type="text" 
              defaultValue="SecureVision Corp"
              className="w-full px-3 py-2 glass-button bg-white/5 text-white focus:outline-none focus:bg-white/10"
            />
          </div>
          <div>
            <label className="block text-sm text-white/80 mb-2">System Timezone</label>
            <select className="w-full px-3 py-2 glass-button bg-white/5 text-white focus:outline-none focus:bg-white/10">
              <option>UTC-5 (Eastern)</option>
              <option>UTC-8 (Pacific)</option>
              <option>UTC+0 (GMT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/80 mb-2">Language</label>
            <select className="w-full px-3 py-2 glass-button bg-white/5 text-white focus:outline-none focus:bg-white/10">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/80 mb-2">Date Format</label>
            <select className="w-full px-3 py-2 glass-button bg-white/5 text-white focus:outline-none focus:bg-white/10">
              <option>MM/DD/YYYY</option>
              <option>DD/MM/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Dashboard Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Auto-refresh Dashboard</p>
              <p className="text-sm text-white/60">Automatically refresh dashboard data every 30 seconds</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Show Real-time Notifications</p>
              <p className="text-sm text-white/60">Display real-time security notifications on dashboard</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Compact View</p>
              <p className="text-sm text-white/60">Use compact layout to show more data on screen</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Authentication</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-white/60">Require 2FA for all admin accounts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Session Timeout</p>
              <p className="text-sm text-white/60">Automatically log out inactive users</p>
            </div>
            <select className="px-3 py-2 glass-button bg-white/5 text-white focus:outline-none focus:bg-white/10">
              <option>15 minutes</option>
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>4 hours</option>
              <option>Never</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Password Policy</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/80 mb-2">Minimum Length</label>
              <input 
                type="number" 
                defaultValue="12"
                min="8"
                max="50"
                className="w-full px-3 py-2 glass-button bg-white/5 text-white focus:outline-none focus:bg-white/10"
              />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-2">Max Failed Attempts</label>
              <input 
                type="number" 
                defaultValue="5"
                min="3"
                max="20"
                className="w-full px-3 py-2 glass-button bg-white/5 text-white focus:outline-none focus:bg-white/10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <input type="checkbox" defaultChecked className="rounded" />
              <label className="text-white/80">Require uppercase letters</label>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" defaultChecked className="rounded" />
              <label className="text-white/80">Require lowercase letters</label>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" defaultChecked className="rounded" />
              <label className="text-white/80">Require numbers</label>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" defaultChecked className="rounded" />
              <label className="text-white/80">Require special characters</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Email Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Critical Security Alerts</p>
              <p className="text-sm text-white/60">Send emails for critical security incidents</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Daily Security Summary</p>
              <p className="text-sm text-white/60">Receive daily security status summary</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Compliance Reports</p>
              <p className="text-sm text-white/60">Receive compliance status updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Notifications</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/80 mb-2">Notification Sound</label>
            <select className="w-full px-3 py-2 glass-button bg-white/5 text-white focus:outline-none focus:bg-white/10">
              <option>Enabled</option>
              <option>Critical Only</option>
              <option>Disabled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/80 mb-2">Alert Retention Period</label>
            <select className="w-full px-3 py-2 glass-button bg-white/5 text-white focus:outline-none focus:bg-white/10">
              <option>7 days</option>
              <option>30 days</option>
              <option>90 days</option>
              <option>1 year</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      default:
        return (
          <div className="glass-card p-12 text-center">
            <SettingsIcon className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white/80 mb-2">Settings Coming Soon</h3>
            <p className="text-white/60">This section is under development and will be available in a future update.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-white/60 mt-1">Configure system preferences and security settings</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasUnsavedChanges && (
            <span className="text-sm text-yellow-400">You have unsaved changes</span>
          )}
          <button 
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 glass-button hover:bg-white/10 text-white"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="glass-card p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                      activeTab === tab.id 
                        ? 'bg-white/20 text-white border border-white/30' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;