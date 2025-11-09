import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Settings, 
  User, 
  Moon, 
  Sun, 
  Menu,
  X
} from 'lucide-react';
import { useUIStore, useDataStore } from '../store';
import { clsx } from 'clsx';
import { formatDateTime } from '../utils';

const Header: React.FC = () => {
  const { 
    theme, 
    sidebarOpen, 
    notifications, 
    toggleSidebar, 
    setTheme,
    markNotificationAsRead 
  } = useUIStore();
  
  const { systemAlerts, lastUpdated } = useDataStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalAlerts = systemAlerts.filter(alert => !alert.resolved && alert.severity === 'critical').length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="glass-dark-card border-b border-white/10 p-4">
      <div className="flex items-center justify-between">
        {/* Left side - Menu and Search */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden glass-button p-2 rounded-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search orders, employees, metrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-dark-input w-80 pl-10 pr-4 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none"
            />
          </form>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          {/* Real-time status */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">Live Data</span>
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Updated {formatDateTime(lastUpdated)}
              </span>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="glass-dark-button p-2 rounded-lg"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="glass-dark-button p-2 rounded-lg relative"
            >
              <Bell size={20} />
              {(unreadCount > 0 || criticalAlerts > 0) && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount + criticalAlerts}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 glass-dark-card rounded-lg border border-white/10 shadow-lg z-50">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={clsx(
                          'p-4 border-b border-white/5 cursor-pointer hover:bg-white/5',
                          !notification.read && 'bg-blue-500/10'
                        )}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={clsx(
                            'w-2 h-2 rounded-full mt-2',
                            notification.type === 'success' && 'bg-green-400',
                            notification.type === 'error' && 'bg-red-400',
                            notification.type === 'warning' && 'bg-yellow-400',
                            notification.type === 'info' && 'bg-blue-400'
                          )} />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                            <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDateTime(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 10 && (
                  <div className="p-4 border-t border-white/10 text-center">
                    <button className="text-sm text-blue-400 hover:text-blue-300">
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <button className="glass-dark-button p-2 rounded-lg">
            <Settings size={20} />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="glass-dark-button p-2 rounded-lg flex items-center space-x-2"
            >
              <User size={20} />
              <span className="hidden md:inline text-sm text-white">Admin User</span>
            </button>

            {/* Profile dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 glass-dark-card rounded-lg border border-white/10 shadow-lg z-50">
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Admin User</h3>
                      <p className="text-gray-400 text-sm">admin@company.com</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button className="w-full text-left p-2 text-gray-300 hover:bg-white/5 rounded-lg">
                    View Profile
                  </button>
                  <button className="w-full text-left p-2 text-gray-300 hover:bg-white/5 rounded-lg">
                    Account Settings
                  </button>
                  <button className="w-full text-left p-2 text-gray-300 hover:bg-white/5 rounded-lg">
                    Preferences
                  </button>
                  <hr className="my-2 border-white/10" />
                  <button className="w-full text-left p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;