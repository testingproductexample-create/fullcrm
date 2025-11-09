import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, TrendingUp, FileText, Truck, 
  ClipboardCheck, Shield, DollarSign, FileSearch, ShoppingCart,
  Star, Bell, Settings, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Suppliers', path: '/suppliers', icon: Users },
  { name: 'Performance', path: '/performance', icon: TrendingUp },
  { name: 'Contracts', path: '/contracts', icon: FileText },
  { name: 'Deliveries', path: '/deliveries', icon: Truck },
  { name: 'Quality', path: '/quality', icon: ClipboardCheck },
  { name: 'Compliance', path: '/compliance', icon: Shield },
  { name: 'Price Comparison', path: '/price-comparison', icon: DollarSign },
  { name: 'RFQ Management', path: '/rfq', icon: FileSearch },
  { name: 'Procurement', path: '/procurement', icon: ShoppingCart },
  { name: 'Evaluations', path: '/evaluations', icon: Star },
  { name: 'Alerts', path: '/alerts', icon: Bell },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function MainLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-screen w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full bg-white/10 backdrop-blur-md border-r border-white/20">
          <div className="flex h-16 items-center justify-between px-6 border-b border-white/20">
            <h1 className="text-xl font-bold text-white">Supplier & Vendor</h1>
            <button 
              className="lg:hidden text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={24} />
            </button>
          </div>
          
          <nav className="space-y-1 px-3 py-4 overflow-y-auto h-[calc(100vh-4rem)]">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="flex items-center justify-between h-full px-6">
            <button 
              className="lg:hidden text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-white/80">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
