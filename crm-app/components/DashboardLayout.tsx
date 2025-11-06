'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePWA } from '@/components/PWAProvider';
import MobileNavigation from '@/components/MobileNavigation';
import { 
  Users, 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  Award, 
  LogOut,
  Menu,
  X,
  Settings,
  Ruler,
  ShoppingBag,
  GitBranch,
  Palette,
  CreditCard,
  FileText,
  Clock,
  Building2,
  BarChart3,
  Shield,
  UserCheck,
  Package,
  Smartphone,
  Bell,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, profile, loading, signOut } = useAuth();
  const { isMobile, canInstall, showInstallPrompt, isOnline } = usePWA();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
    { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
    { name: 'Measurements', href: '/dashboard/measurements', icon: Ruler },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Employees', href: '/dashboard/employees', icon: UserCheck },
    { name: 'Schedule', href: '/dashboard/schedule', icon: Clock },
    { name: 'Designs', href: '/dashboard/designs', icon: Palette },
    { name: 'Finance', href: '/dashboard/finance', icon: BarChart3 },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Communication', href: '/dashboard/communication', icon: MessageSquare },
    { name: 'Security', href: '/dashboard/security', icon: Shield },
    { name: 'Visa Compliance', href: '/dashboard/visa-compliance', icon: Shield },
    { name: 'Workflow', href: '/dashboard/workflow', icon: GitBranch },
    { name: 'Payroll', href: '/dashboard/payroll', icon: Package },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <MobileNavigation 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)} 
          isMobilePortal={pathname.startsWith('/mobile')}
        />
        
        {/* Main Content - Mobile */}
        <main className="pt-16 pb-20 px-4">
          {/* Mobile header spacing */}
          <div className="mb-4">
            {canInstall && (
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    <span className="text-sm font-medium">Install app for better experience</span>
                  </div>
                  <button
                    onClick={showInstallPrompt}
                    className="bg-white/20 px-3 py-1 rounded text-sm font-medium hover:bg-white/30 transition-colors"
                  >
                    <Download className="w-4 h-4 inline mr-1" />
                    Install
                  </button>
                </div>
              </div>
            )}
          </div>
          {children}
        </main>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Glass Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md hover:bg-white/50 transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-3 ml-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Tailoring CRM</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Install PWA Button */}
              {canInstall && (
                <button
                  onClick={showInstallPrompt}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Install App
                </button>
              )}

              {/* Online/Offline indicator */}
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} 
                   title={isOnline ? 'Online' : 'Offline'} />

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-white/50 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>

              {/* User menu */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-600 capitalize">{profile?.role}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Side Navigation - Desktop */}
        <aside className="hidden lg:block w-64 min-h-screen backdrop-blur-xl bg-white/50 border-r border-white/20 p-4">
          <div className="space-y-6">
            {/* Quick actions */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Access</h3>
              <div className="space-y-1">
                <Link
                  href="/dashboard/orders/new"
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  New Order
                </Link>
                <Link
                  href="/mobile"
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-white/50 transition-colors"
                >
                  <Smartphone className="w-4 h-4" />
                  Mobile Portal
                </Link>
              </div>
            </div>

            {/* Main navigation */}
            <nav>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Navigation</h3>
              <div className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || 
                    (pathname.startsWith(item.href) && item.href !== '/dashboard');
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-purple-100 text-purple-700 shadow-sm'
                          : 'text-gray-700 hover:bg-white/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
            <aside className="absolute left-0 top-0 h-full w-80 backdrop-blur-xl bg-white/90 p-4" onClick={(e) => e.stopPropagation()}>
              <div className="mt-16 space-y-4">
                {/* PWA Install */}
                {canInstall && (
                  <button
                    onClick={showInstallPrompt}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium"
                  >
                    <Download className="w-5 h-5" />
                    Install App
                  </button>
                )}

                <nav className="space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || 
                      (pathname.startsWith(item.href) && item.href !== '/dashboard');
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-gray-700 hover:bg-white/50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
