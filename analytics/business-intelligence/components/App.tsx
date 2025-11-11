import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Plus, 
  Settings, 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Menu,
  X,
  Home,
  FileText,
  Download,
  Share2,
  RefreshCw
} from 'lucide-react';
import { DashboardComponent } from './DashboardComponent';
import { useDashboards, useUser, useAlerts, useKPIs, useRealTime } from './hooks';
import { useDashboardStore, useUserStore, useAlertStore } from './stores/dashboardStore';
import { cn } from './utils/helpers';
import { GLASSMORPHISM } from './data/constants';

// Main Application Component
const BusinessIntelligenceApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'dashboards' | 'settings'>('dashboard');
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Store hooks
  const { dashboards, setCurrentDashboard } = useDashboards();
  const { user, logout } = useUser();
  const { unreadCount } = useAlerts();
  const { isConnected } = useRealTime();

  // Set default dashboard on mount
  useEffect(() => {
    if (dashboards && dashboards.length > 0 && !selectedDashboardId) {
      const defaultDashboard = dashboards.find(d => d.isDefault) || dashboards[0];
      setCurrentDashboard(defaultDashboard);
      setSelectedDashboardId(defaultDashboard.id);
    }
  }, [dashboards, selectedDashboardId, setCurrentDashboard]);

  const handleDashboardSelect = (dashboardId: string) => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (dashboard) {
      setCurrentDashboard(dashboard);
      setSelectedDashboardId(dashboardId);
      setCurrentView('dashboard');
      setSidebarOpen(false);
    }
  };

  const filteredDashboards = dashboards.filter(dashboard =>
    dashboard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dashboard.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/10 backdrop-blur-md border-b border-white/20 shadow-sm sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-white/10 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    Business Intelligence
                  </h1>
                  <p className="text-sm text-gray-600 hidden sm:block">
                    Real-time analytics & insights
                  </p>
                </div>
              </div>
            </div>

            {/* Center - Search (hidden on mobile) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search dashboards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2">
              {/* Connection Status */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-white/20 rounded-lg">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )} />
                <span className="text-xs text-gray-600">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>

              {/* Alerts */}
              <button
                className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-white/10 rounded-lg transition-colors"
                title="Alerts"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-800 hover:bg-white/10 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.name || 'User'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || window.innerWidth >= 1024) && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white/10 backdrop-blur-md border-r border-white/20 lg:block"
            >
              <div className="flex flex-col h-full">
                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors",
                      currentView === 'dashboard'
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-white/10"
                    )}
                  >
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Dashboard</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('dashboards')}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors",
                      currentView === 'dashboards'
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-white/10"
                    )}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">All Dashboards</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('settings')}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors",
                      currentView === 'settings'
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-white/10"
                    )}
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Settings</span>
                  </button>
                </nav>

                {/* Dashboard List */}
                <div className="p-4 border-t border-white/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Dashboards</h3>
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="New Dashboard"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {filteredDashboards.map(dashboard => (
                      <button
                        key={dashboard.id}
                        onClick={() => handleDashboardSelect(dashboard.id)}
                        className={cn(
                          "w-full text-left p-2 rounded-lg transition-colors text-sm",
                          selectedDashboardId === dashboard.id
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-600 hover:bg-white/10"
                        )}
                      >
                        <div className="font-medium truncate">{dashboard.name}</div>
                        {dashboard.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {dashboard.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* User Actions */}
                <div className="p-4 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {user?.email}
                    </div>
                    <button
                      onClick={logout}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <AnimatePresence mode="wait">
            {currentView === 'dashboard' && selectedDashboardId && (
              <motion.div
                key={selectedDashboardId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DashboardComponent
                  dashboardId={selectedDashboardId}
                  isEditMode={isEditMode}
                />
              </motion.div>
            )}

            {currentView === 'dashboards' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                <div className="max-w-7xl mx-auto">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      All Dashboards
                    </h2>
                    <p className="text-gray-600">
                      Manage and organize your business intelligence dashboards
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDashboards.map(dashboard => (
                      <motion.div
                        key={dashboard.id}
                        whileHover={{ y: -4 }}
                        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => handleDashboardSelect(dashboard.id)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex items-center space-x-1">
                            {dashboard.isPublic && (
                              <Share2 className="w-4 h-4 text-green-600" title="Public" />
                            )}
                            <span className="text-xs text-gray-500">
                              {dashboard.widgets.length} widgets
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {dashboard.name}
                        </h3>
                        {dashboard.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {dashboard.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Modified {dashboard.updatedAt.toLocaleDateString()}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle dashboard actions
                            }}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentView === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                <div className="max-w-4xl mx-auto">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      Settings
                    </h2>
                    <p className="text-gray-600">
                      Configure your dashboard preferences and system settings
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                    <p className="text-gray-600">
                      Settings panel will be implemented here with user preferences,
                      system configuration, and dashboard management options.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
        />
      )}

      {/* Floating Action Button for Edit Mode */}
      {currentView === 'dashboard' && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsEditMode(!isEditMode)}
          className={cn(
            "fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors",
            isEditMode
              ? "bg-blue-600 text-white"
              : "bg-white/10 backdrop-blur-md text-gray-700 border border-white/20 hover:bg-white/20"
          )}
          title={isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
        >
          {isEditMode ? <X className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
        </motion.button>
      )}
    </div>
  );
};

export default BusinessIntelligenceApp;