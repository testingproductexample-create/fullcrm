import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  AlertTriangle, 
  Shield,
  GraduationCap,
  FileCheck,
  CheckCircle2,
  MessageSquare,
  BarChart3,
  Settings
} from 'lucide-react';

const MainLayout = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inspections', href: '/inspections', icon: ClipboardCheck },
    { name: 'Defects', href: '/defects', icon: AlertTriangle },
    { name: 'Audits', href: '/audits', icon: Shield },
    { name: 'Training', href: '/training', icon: GraduationCap },
    { name: 'Standards', href: '/standards', icon: FileCheck },
    { name: 'Compliance', href: '/compliance', icon: CheckCircle2 },
    { name: 'Feedback', href: '/feedback', icon: MessageSquare },
    { name: 'Metrics', href: '/metrics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-black/20 backdrop-blur-xl border-r border-white/10">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <h1 className="text-2xl font-bold text-white">Quality Control</h1>
            <p className="text-sm text-white/60 mt-1">Standards Management</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-white/20 text-white shadow-lg shadow-purple-500/20'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
