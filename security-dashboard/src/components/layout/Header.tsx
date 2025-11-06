import React from 'react';
import { 
  Menu, 
  Bell, 
  Search, 
  User, 
  Settings,
  LogOut,
  Shield
} from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  return (
    <header className="glass border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>
            <p className="text-sm text-white/60">Real-time security monitoring and control center</p>
          </div>
        </div>

        {/* Center section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search threats, users, or events..."
              className="w-full pl-10 pr-4 py-2 glass-button bg-white/5 text-white placeholder-white/40 focus:outline-none focus:bg-white/10 transition-colors"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-3">
          {/* Quick status indicators */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full pulse-glow"></div>
              <span className="text-white/80">Live</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-white/80">Protected</span>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">3</span>
              </div>
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 glass-card p-4 z-50">
                <h3 className="text-white font-semibold mb-3">Security Alerts</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-white font-medium">Critical Alert</p>
                    <p className="text-xs text-white/70">Multiple failed login attempts detected</p>
                    <p className="text-xs text-white/50">2 minutes ago</p>
                  </div>
                  <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-white font-medium">Warning</p>
                    <p className="text-xs text-white/70">Unusual data access pattern</p>
                    <p className="text-xs text-white/50">5 minutes ago</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-white font-medium">Info</p>
                    <p className="text-xs text-white/70">Security scan completed</p>
                    <p className="text-xs text-white/50">15 minutes ago</p>
                  </div>
                </div>
                <button className="w-full mt-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  View All Alerts
                </button>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm text-white font-medium">Admin User</p>
                <p className="text-xs text-white/60">System Administrator</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-48 glass-card p-2 z-50">
                <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <hr className="my-2 border-white/10" />
                <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search threats, users, or events..."
            className="w-full pl-10 pr-4 py-2 glass-button bg-white/5 text-white placeholder-white/40 focus:outline-none focus:bg-white/10 transition-colors"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;