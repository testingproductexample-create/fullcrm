'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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
  GitBranch
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
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
    { name: 'Workflow', href: '/dashboard/workflow', icon: GitBranch },
    { name: 'Measurements', href: '/dashboard/measurements', icon: Ruler },
    { name: 'Events', href: '/dashboard/events', icon: Calendar },
    { name: 'Communications', href: '/dashboard/communications', icon: MessageSquare },
    { name: 'Loyalty', href: '/dashboard/loyalty', icon: Award },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen">
      {/* Glass Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-glass-emphasized backdrop-blur-standard border-b border-glass-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md hover:bg-glass-light transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="text-h3 font-bold text-primary-600 ml-2">CRM Pro</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-small font-medium text-neutral-900">{profile?.full_name || 'User'}</p>
                <p className="text-tiny text-neutral-700 capitalize">{profile?.role}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-md hover:bg-glass-light transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5 text-neutral-700" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Side Navigation - Desktop */}
        <aside className="hidden lg:block w-64 min-h-screen bg-glass-subtle backdrop-blur-light border-r border-glass-border p-4">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'hover:bg-glass-light text-neutral-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
            <aside className="absolute left-0 top-0 h-full w-64 bg-glass-emphasized backdrop-blur-strong p-4" onClick={(e) => e.stopPropagation()}>
              <nav className="space-y-2 mt-16">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
                        isActive
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'hover:bg-glass-light text-neutral-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
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
