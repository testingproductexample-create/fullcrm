import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Monitor, 
  AlertTriangle, 
  Users, 
  FileCheck, 
  BarChart3, 
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const menuItems = [
  { path: '/', icon: Shield, label: 'Dashboard' },
  { path: '/monitoring', icon: Monitor, label: 'Security Monitoring' },
  { path: '/alerts', icon: AlertTriangle, label: 'Threat Alerts' },
  { path: '/users', icon: Users, label: 'User Management' },
  { path: '/compliance', icon: FileCheck, label: 'Compliance Tracking' },
  { path: '/reports', icon: BarChart3, label: 'Security Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' }
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="glass h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">SecureVision</h1>
                  <p className="text-xs text-white/60">Security Control Center</p>
                </div>
              </div>
              
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                        ${isActive 
                          ? 'bg-white/20 text-white border border-white/30' 
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Status indicator */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center space-x-3 p-3 glass-card">
              <div className="w-3 h-3 bg-green-500 rounded-full pulse-glow"></div>
              <div>
                <p className="text-sm font-medium text-white">System Status</p>
                <p className="text-xs text-white/60">All systems operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;