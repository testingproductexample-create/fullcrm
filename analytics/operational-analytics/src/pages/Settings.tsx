import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Database, Shield, Palette, Users } from 'lucide-react';
import { useUIStore, useAnalyticsStore } from '../store';
import { formatNumber } from '../utils';

const Settings: React.FC = () => {
  const { theme, setTheme } = useUIStore();
  const { refreshInterval, setRefreshInterval, isRealTimeEnabled, toggleRealTime } = useAnalyticsStore();
  const [notifications, setNotifications] = useState({
    email: true,
    browser: true,
    mobile: false,
    weekly: true,
    monthly: false,
  });
  const [dataRetention, setDataRetention] = useState(365);
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-2">Configure your operational analytics dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <SettingsIcon size={20} className="mr-2" />
            General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                className="glass-input w-full px-3 py-2 rounded-lg text-white"
              >
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Auto Refresh Interval (seconds)
              </label>
              <input
                type="number"
                value={refreshInterval / 1000}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value) * 1000)}
                className="glass-input w-full px-3 py-2 rounded-lg text-white"
                min="10"
                max="300"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Real-time Updates</span>
              <button
                onClick={toggleRealTime}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isRealTimeEnabled ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  isRealTimeEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Bell size={20} className="mr-2" />
            Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Email Notifications</span>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications.email ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  notifications.email ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Browser Notifications</span>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, browser: !prev.browser }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications.browser ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  notifications.browser ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Mobile Notifications</span>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, mobile: !prev.mobile }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications.mobile ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  notifications.mobile ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Weekly Summaries</span>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, weekly: !prev.weekly }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications.weekly ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  notifications.weekly ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Monthly Reports</span>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, monthly: !prev.monthly }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notifications.monthly ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  notifications.monthly ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Database size={20} className="mr-2" />
            Data Management
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data Retention (days)
              </label>
              <input
                type="number"
                value={dataRetention}
                onChange={(e) => setDataRetention(parseInt(e.target.value))}
                className="glass-input w-full px-3 py-2 rounded-lg text-white"
                min="30"
                max="1095"
              />
            </div>
            <div className="space-y-2">
              <button className="w-full glass-button px-4 py-2 rounded-lg text-white hover:bg-green-600">
                Export All Data
              </button>
              <button className="w-full glass-button px-4 py-2 rounded-lg text-white hover:bg-blue-600">
                Backup Database
              </button>
              <button className="w-full glass-button px-4 py-2 rounded-lg text-white hover:bg-yellow-600">
                Import Data
              </button>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Users size={20} className="mr-2" />
            User Management
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <button className="w-full glass-button px-4 py-2 rounded-lg text-white hover:bg-blue-600">
                Add New User
              </button>
              <button className="w-full glass-button px-4 py-2 rounded-lg text-white hover:bg-green-600">
                Manage Permissions
              </button>
              <button className="w-full glass-button px-4 py-2 rounded-lg text-white hover:bg-purple-600">
                User Roles
              </button>
            </div>
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-white font-medium mb-2">Current Users</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <span className="text-gray-300 text-sm">admin@company.com</span>
                  <span className="text-green-400 text-xs">Admin</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <span className="text-gray-300 text-sm">manager@company.com</span>
                  <span className="text-blue-400 text-xs">Manager</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Settings */}
      <div className="glass-card rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Records per Page
            </label>
            <select className="glass-input w-full px-3 py-2 rounded-lg text-white">
              <option>10</option>
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Chart Animation Speed
            </label>
            <select className="glass-input w-full px-3 py-2 rounded-lg text-white">
              <option>Slow</option>
              <option>Normal</option>
              <option>Fast</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Compression Level
            </label>
            <select className="glass-input w-full px-3 py-2 rounded-lg text-white">
              <option>None</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="glass-button px-8 py-3 rounded-lg text-white hover:bg-blue-600 font-medium">
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;