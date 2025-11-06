'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  ShoppingBag, 
  Calendar, 
  CreditCard,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  Plus,
  Camera,
  Ruler,
  FileText,
  UserCheck,
  Building2,
  BarChart3,
  Package,
  MessageSquare,
  Clock,
  Shield
} from 'lucide-react';
import { usePWA } from './PWAProvider';

interface MobileNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobilePortal?: boolean;
}

const mainNavItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/customers', icon: Users, label: 'Customers' },
  { href: '/dashboard/orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/dashboard/appointments', icon: Calendar, label: 'Appointments' },
  { href: '/dashboard/measurements', icon: Ruler, label: 'Measurements' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
];

const mobileNavItems = [
  { href: '/mobile', icon: Home, label: 'Home' },
  { href: '/mobile/orders', icon: Package, label: 'My Orders' },
  { href: '/dashboard/appointments', icon: Calendar, label: 'Appointments' },
  { href: '/dashboard/measurements', icon: Ruler, label: 'Measurements' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
];

const secondaryNavItems = [
  { href: '/dashboard/employees', icon: UserCheck, label: 'Employees' },
  { href: '/dashboard/schedule', icon: Clock, label: 'Schedule' },
  { href: '/dashboard/designs', icon: FileText, label: 'Designs' },
  { href: '/dashboard/finance', icon: BarChart3, label: 'Finance' },
  { href: '/dashboard/communication', icon: MessageSquare, label: 'Communication' },
  { href: '/dashboard/documents', icon: Package, label: 'Documents' },
  { href: '/dashboard/visa-compliance', icon: Shield, label: 'Compliance' },
];

const quickActions = [
  { href: '/dashboard/orders/new', icon: Plus, label: 'New Order', color: 'bg-blue-500' },
  { href: '/mobile/scanner', icon: Camera, label: 'Scanner', color: 'bg-green-500' },
  { href: '/dashboard/customers/new', icon: Users, label: 'Add Customer', color: 'bg-purple-500' },
  { href: '/dashboard/measurements/new', icon: Ruler, label: 'Measure', color: 'bg-orange-500' },
];

export default function MobileNavigation({ isOpen, onToggle, isMobilePortal = false }: MobileNavigationProps) {
  const pathname = usePathname();
  const { isMobile, isOnline, canInstall, showInstallPrompt } = usePWA();
  const [notifications, setNotifications] = useState(3);

  // Select navigation items based on mode
  const currentNavItems = isMobilePortal ? mobileNavItems : mainNavItems;

  // Close navigation when route changes
  useEffect(() => {
    onToggle();
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu Button */}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-white/50 hover:bg-white/70 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Tailoring CRM</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button className="p-2 rounded-lg bg-white/50 hover:bg-white/70 transition-colors">
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg bg-white/50 hover:bg-white/70 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* PWA Install Banner */}
        {canInstall && isMobile && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Install app for better experience</span>
              <button
                onClick={showInstallPrompt}
                className="bg-white/20 px-3 py-1 rounded text-xs font-medium"
              >
                Install
              </button>
            </div>
          </div>
        )}

        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-red-500 text-white px-4 py-2 text-sm text-center">
            Offline mode - Changes will sync when connected
          </div>
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-80 z-40 bg-white/95 backdrop-blur-xl border-r border-gray-200 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Tailoring CRM</h2>
                <p className="text-sm text-gray-600">Business Management</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Main</h3>
              <nav className="space-y-1">
                {currentNavItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Management</h3>
              <nav className="space-y-1">
                {secondaryNavItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          {currentNavItems.slice(0, 5).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  active ? 'text-purple-600' : 'text-gray-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
                {active && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-purple-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}