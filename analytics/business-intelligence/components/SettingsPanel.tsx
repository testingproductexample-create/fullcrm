import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Settings, 
  Save, 
  RotateCcw, 
  Palette, 
  Bell, 
  Shield, 
  Database,
  Clock,
  Monitor,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  RefreshCw,
  Globe,
  Download
} from 'lucide-react';
import { Dashboard, UserPreferences } from '../../types';
import { usePreferences } from '../../hooks';
import { cn } from '../../utils/helpers';
import { GLASSMORPHISM, COLOR_SCHEMES } from '../../data/constants';

interface SettingsPanelProps {
  dashboard: Dashboard;
  onClose: () => void;
  onSave?: (settings: any) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  dashboard,
  onClose,
  onSave
}) => {
  const { preferences, updatePreference } = usePreferences();
  const [activeTab, setActiveTab] = useState('display');
  const [tempSettings, setTempSettings] = useState({
    theme: preferences.theme,
    language: preferences.language,
    timezone: preferences.timezone,
    notifications: preferences.notifications,
    refreshInterval: preferences.refreshInterval,
    exportFormat: preferences.exportFormat,
    glassmorphismIntensity: preferences.glassmorphismIntensity,
    animations: preferences.animations
  });
  const [hasChanges, setHasChanges] = useState(false);

  const tabs = [
    { id: 'display', name: 'Display', icon: Monitor },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'data', name: 'Data', icon: Database },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'export', name: 'Export', icon: Download }
  ];

  const handleSettingChange = (key: string, value: any) => {
    setTempSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Update preferences
    Object.entries(tempSettings).forEach(([key, value]) => {
      if (key === 'notifications') {
        updatePreference('notifications', value);
      } else {
        updatePreference(key as keyof UserPreferences, value);
      }
    });
    
    if (onSave) {
      onSave(tempSettings);
    }
    
    setHasChanges(false);
  };

  const handleReset = () => {
    setTempSettings({
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        inApp: true,
        frequency: 'immediate'
      },
      refreshInterval: 30000,
      exportFormat: 'pdf',
      glassmorphismIntensity: 0.1,
      animations: true
    });
    setHasChanges(true);
  };

  const renderDisplaySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Palette className="w-4 h-4 inline mr-1" />
          Theme
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', name: 'Light', icon: Sun },
            { id: 'dark', name: 'Dark', icon: Moon },
            { id: 'auto', name: 'Auto', icon: Monitor }
          ].map(theme => {
            const Icon = theme.icon;
            return (
              <button
                key={theme.id}
                onClick={() => handleSettingChange('theme', theme.id)}
                className={cn(
                  "p-4 border-2 rounded-lg transition-all text-center",
                  tempSettings.theme === theme.id
                    ? "border-blue-500 bg-blue-50/20"
                    : "border-gray-200 hover:border-gray-300 bg-white/5"
                )}
              >
                <Icon className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <div className="text-sm font-medium text-gray-800">{theme.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Glassmorphism Intensity
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.05"
            value={tempSettings.glassmorphismIntensity}
            onChange={(e) => handleSettingChange('glassmorphismIntensity', parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-12">
            {Math.round(tempSettings.glassmorphismIntensity * 100)}%
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Adjust the transparency and blur effects
        </p>
      </div>

      <div>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={tempSettings.animations}
            onChange={(e) => handleSettingChange('animations', e.target.checked)}
            className="rounded border-gray-300"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">Enable Animations</span>
            <p className="text-xs text-gray-500">Smooth transitions and effects</p>
          </div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Language
        </label>
        <select
          value={tempSettings.language}
          onChange={(e) => handleSettingChange('language', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="zh">中文</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Timezone
        </label>
        <select
          value={tempSettings.timezone}
          onChange={(e) => handleSettingChange('timezone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
        >
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="Europe/London">London</option>
          <option value="Europe/Paris">Paris</option>
          <option value="Asia/Tokyo">Tokyo</option>
        </select>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Bell className="w-4 h-4 inline mr-1" />
          Notification Channels
        </label>
        <div className="space-y-3">
          {[
            { key: 'email', name: 'Email', desc: 'Receive notifications via email' },
            { key: 'push', name: 'Push Notifications', desc: 'Browser push notifications' },
            { key: 'inApp', name: 'In-App', desc: 'Show notifications in the dashboard' }
          ].map(channel => (
            <label key={channel.key} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
              <input
                type="checkbox"
                checked={tempSettings.notifications[channel.key as keyof typeof tempSettings.notifications]}
                onChange={(e) => {
                  const newNotifications = {
                    ...tempSettings.notifications,
                    [channel.key]: e.target.checked
                  };
                  handleSettingChange('notifications', newNotifications);
                }}
                className="rounded border-gray-300"
              />
              <div>
                <div className="text-sm font-medium text-gray-800">{channel.name}</div>
                <div className="text-xs text-gray-500">{channel.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notification Frequency
        </label>
        <select
          value={tempSettings.notifications.frequency}
          onChange={(e) => {
            const newNotifications = {
              ...tempSettings.notifications,
              frequency: e.target.value as any
            };
            handleSettingChange('notifications', newNotifications);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
        >
          <option value="immediate">Immediate</option>
          <option value="hourly">Hourly Digest</option>
          <option value="daily">Daily Digest</option>
          <option value="weekly">Weekly Digest</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quiet Hours
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start</label>
            <input
              type="time"
              value={tempSettings.notifications.quietHours?.start || '22:00'}
              onChange={(e) => {
                const newQuietHours = {
                  start: e.target.value,
                  end: tempSettings.notifications.quietHours?.end || '08:00'
                };
                const newNotifications = {
                  ...tempSettings.notifications,
                  quietHours: newQuietHours
                };
                handleSettingChange('notifications', newNotifications);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white/50 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End</label>
            <input
              type="time"
              value={tempSettings.notifications.quietHours?.end || '08:00'}
              onChange={(e) => {
                const newQuietHours = {
                  start: tempSettings.notifications.quietHours?.start || '22:00',
                  end: e.target.value
                };
                const newNotifications = {
                  ...tempSettings.notifications,
                  quietHours: newQuietHours
                };
                handleSettingChange('notifications', newNotifications);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white/50 text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Notifications will be suppressed during quiet hours
        </p>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <RefreshCw className="w-4 h-4 inline mr-1" />
          Auto Refresh Interval
        </label>
        <select
          value={tempSettings.refreshInterval}
          onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
        >
          <option value={10000}>10 seconds</option>
          <option value={30000}>30 seconds</option>
          <option value={60000}>1 minute</option>
          <option value={300000}>5 minutes</option>
          <option value={900000}>15 minutes</option>
          <option value={1800000}>30 minutes</option>
          <option value={0}>Never</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          How often dashboard data should be automatically refreshed
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Database className="w-4 h-4 inline mr-1" />
          Data Retention
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
        >
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="180">6 months</option>
          <option value="365">1 year</option>
          <option value="0">Forever</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          How long to keep historical data
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Globe className="w-4 h-4 inline mr-1" />
          Regional Settings
        </label>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Number Format</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded bg-white/50 text-sm">
              <option value="en-US">1,234.56 (US)</option>
              <option value="en-GB">1,234.56 (UK)</option>
              <option value="de-DE">1.234,56 (Germany)</option>
              <option value="fr-FR">1 234,56 (France)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Currency</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded bg-white/50 text-sm">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Shield className="w-4 h-4 inline mr-1" />
          Access Control
        </label>
        <div className="space-y-3">
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-800">Dashboard Visibility</div>
                <div className="text-xs text-gray-500">Who can see this dashboard</div>
              </div>
              <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                <option value="private">Private</option>
                <option value="team">Team Members</option>
                <option value="organization">Organization</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>
          
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-800">Edit Permissions</div>
                <div className="text-xs text-gray-500">Who can modify this dashboard</div>
              </div>
              <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                <option value="owner">Owner Only</option>
                <option value="team">Team Members</option>
                <option value="admins">Admins</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Session Timeout
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm">
          <option value={900}>15 minutes</option>
          <option value={1800}>30 minutes</option>
          <option value={3600}>1 hour</option>
          <option value={7200}>2 hours</option>
          <option value={0}>Never</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Automatically log out after inactivity
        </p>
      </div>

      <div>
        <label className="flex items-center space-x-3">
          <input type="checkbox" className="rounded border-gray-300" defaultChecked />
          <div>
            <span className="text-sm font-medium text-gray-700">Two-Factor Authentication</span>
            <p className="text-xs text-gray-500">Add extra security to your account</p>
          </div>
        </label>
      </div>
    </div>
  );

  const renderExportSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Download className="w-4 h-4 inline mr-1" />
          Default Export Format
        </label>
        <select
          value={tempSettings.exportFormat}
          onChange={(e) => handleSettingChange('exportFormat', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
        >
          <option value="pdf">PDF Document</option>
          <option value="excel">Excel Spreadsheet</option>
          <option value="csv">CSV Data</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Default format for dashboard exports
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Export Quality
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm">
          <option value="high">High Quality (Slow)</option>
          <option value="medium">Medium Quality</option>
          <option value="low">Low Quality (Fast)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email for Exports
        </label>
        <input
          type="email"
          placeholder="your@email.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Where to send large export files
        </p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'display':
        return renderDisplaySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'data':
        return renderDataSettings();
      case 'security':
        return renderSecuritySettings();
      case 'export':
        return renderExportSettings();
      default:
        return renderDisplaySettings();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Dashboard Settings</h2>
                <p className="text-gray-600">Customize your dashboard experience</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/20 p-4">
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors",
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderTabContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <div className="flex items-center space-x-2 text-orange-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span className="text-sm">You have unsaved changes</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};