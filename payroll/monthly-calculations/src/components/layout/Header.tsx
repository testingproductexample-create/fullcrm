import React from 'react';
import { 
  Menu, 
  Bell, 
  Search, 
  User, 
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  onPeriodChange: (direction: 'prev' | 'next') => void;
  currentPeriod: string;
  isCurrentPeriod: boolean;
  canGoToNext: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  onPeriodChange, 
  currentPeriod, 
  isCurrentPeriod,
  canGoToNext 
}) => {
  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          {/* Period navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPeriodChange('prev')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-300" />
            </button>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <Calendar className="w-4 h-4 text-gray-300" />
              <span className="text-white font-medium">{currentPeriod}</span>
              {isCurrentPeriod && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-md border border-blue-500/30">
                  Current
                </span>
              )}
            </div>
            
            <button
              onClick={() => onPeriodChange('next')}
              disabled={!canGoToNext}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Center section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees, calculations..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5 text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">HR Admin</p>
              <p className="text-xs text-gray-400">hr@company.ae</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees, calculations..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;