import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  Package, 
  GitBranch, 
  Calendar, 
  Headphones, 
  Shield, 
  Warehouse, 
  DollarSign, 
  Clock, 
  Target, 
  AlertTriangle, 
  FileText, 
  Settings,
  ChevronRight
} from 'lucide-react';
import { useUIStore, useDataStore } from '../store';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Employee Analytics', href: '/employees', icon: Users },
  { name: 'Order Analytics', href: '/orders', icon: ShoppingCart },
  { name: 'Resource Utilization', href: '/resources', icon: Package },
  { name: 'Workflow Analysis', href: '/workflow', icon: GitBranch },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Customer Service', href: '/customer-service', icon: Headphones },
  { name: 'Quality Control', href: '/quality', icon: Shield },
  { name: 'Inventory', href: '/inventory', icon: Warehouse },
  { name: 'Cost Analysis', href: '/costs', icon: DollarSign },
  { name: 'Time Tracking', href: '/time-tracking', icon: Clock },
  { name: 'Performance Targets', href: '/targets', icon: Target },
  { name: 'Alerts', href: '/alerts', icon: AlertTriangle, badge: 3 },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar: React.FC = () => {
  const { sidebarOpen, systemAlerts } = useUIStore();
  
  const unresolvedAlerts = systemAlerts.filter(alert => !alert.resolved).length;

  return (
    <div className={clsx(
      'fixed left-0 top-0 h-full glass-dark-card border-r border-white/10 transition-all duration-300 ease-in-out z-40',
      sidebarOpen ? 'w-80' : 'w-16'
    )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          {sidebarOpen ? (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <BarChart3 size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">OpAnalytics</h1>
                <p className="text-xs text-gray-400">Business Intelligence</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => clsx(
                  'nav-item group',
                  isActive && 'bg-blue-600 text-white',
                  !isActive && 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="ml-3 font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div className="p-4 border-t border-white/10">
          {sidebarOpen ? (
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-white">System Status</p>
                <p className="text-xs text-gray-400">
                  {unresolvedAlerts === 0 
                    ? 'All systems operational' 
                    : `${unresolvedAlerts} alerts require attention`
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>

        {/* Quick actions (when expanded) */}
        {sidebarOpen && (
          <div className="p-4 border-t border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center">
                <ChevronRight size={16} className="mr-2" />
                Export Report
              </button>
              <button className="w-full text-left p-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center">
                <ChevronRight size={16} className="mr-2" />
                Schedule Alert
              </button>
              <button className="w-full text-left p-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center">
                <ChevronRight size={16} className="mr-2" />
                Compare Period
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;