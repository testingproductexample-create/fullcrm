'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Camera, 
  MapPin, 
  Clock, 
  Bell, 
  User, 
  CreditCard, 
  Package, 
  BarChart3,
  Users,
  Calendar,
  ShoppingBag,
  Ruler,
  Smartphone,
  Wifi,
  WifiOff,
  Download,
  Fingerprint,
  Shield,
  Building2
} from 'lucide-react';
import { usePWA } from '@/components/PWAProvider';
import { PullToRefresh, TouchButton, FloatingActionButton } from '@/components/MobileComponents';
import MobileScanner from '@/components/MobileScanner';

export default function MobilePage() {
  const { isOnline, canInstall, showInstallPrompt, capabilities, isMobile } = usePWA();
  const [showScanner, setShowScanner] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [quickStats, setQuickStats] = useState({
    todayOrders: 0,
    pendingTasks: 0,
    unreadMessages: 0,
    todayRevenue: 0
  });

  useEffect(() => {
    // Get user location for attendance tracking
    if (capabilities.hasGeolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location access denied:', error);
        }
      );
    }

    // Load quick stats
    loadQuickStats();
    
    // Set last sync time
    const lastSyncTime = localStorage.getItem('lastSyncTime');
    if (lastSyncTime) {
      setLastSync(new Date(lastSyncTime));
    }
  }, [capabilities.hasGeolocation]);

  const loadQuickStats = async () => {
    try {
      // Simulate loading stats - in real app this would fetch from Supabase
      setQuickStats({
        todayOrders: 12,
        pendingTasks: 5,
        unreadMessages: 3,
        todayRevenue: 4580
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = async () => {
    console.log('Refreshing mobile data...');
    await loadQuickStats();
    setLastSync(new Date());
    localStorage.setItem('lastSyncTime', new Date().toISOString());
  };

  const handleScanCapture = (imageData: string, scanType: string) => {
    console.log('Captured scan:', { scanType, imageData: imageData.length });
    // Handle the captured image - upload to Supabase, process, etc.
    setShowScanner(false);
  };

  const handleAttendanceCheckIn = async () => {
    if (!currentLocation) {
      alert('Location access required for attendance check-in');
      return;
    }

    try {
      // In real app, send to Supabase
      console.log('Checking in at location:', currentLocation);
      alert('Attendance recorded successfully!');
    } catch (error) {
      console.error('Check-in failed:', error);
      alert('Check-in failed. Please try again.');
    }
  };

  const quickActions = [
    { 
      href: '/dashboard/orders/new', 
      icon: ShoppingBag, 
      label: 'New Order',
      color: 'bg-blue-500',
      description: 'Create new customer order'
    },
    { 
      action: () => setShowScanner(true), 
      icon: Camera, 
      label: 'Scanner',
      color: 'bg-green-500',
      description: 'Scan documents & measurements'
    },
    { 
      href: '/dashboard/customers/new', 
      icon: Users, 
      label: 'Add Customer',
      color: 'bg-purple-500',
      description: 'Register new customer'
    },
    { 
      action: handleAttendanceCheckIn, 
      icon: MapPin, 
      label: 'Check In',
      color: 'bg-orange-500',
      description: 'Record attendance'
    },
  ];

  const mobileFeatures = [
    {
      icon: Camera,
      title: 'Document Scanner',
      description: 'Scan IDs, contracts, and measurements with your camera',
      available: capabilities.hasCamera
    },
    {
      icon: MapPin,
      title: 'GPS Attendance',
      description: 'Location-based check-in and work tracking',
      available: capabilities.hasGeolocation
    },
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Real-time alerts for orders and appointments',
      available: capabilities.hasNotifications
    },
    {
      icon: WifiOff,
      title: 'Offline Mode',
      description: 'Work without internet, sync when connected',
      available: capabilities.hasServiceWorker
    },
    {
      icon: Fingerprint,
      title: 'Biometric Login',
      description: 'Secure login with fingerprint or face ID',
      available: capabilities.hasBiometrics
    },
    {
      icon: Smartphone,
      title: 'Native Experience',
      description: 'App-like interface with native feel',
      available: true
    }
  ];

  const dashboardLinks = [
    { href: '/dashboard', icon: BarChart3, label: 'Dashboard', color: 'text-blue-600' },
    { href: '/mobile/orders', icon: Package, label: 'My Orders', color: 'text-green-600' },
    { href: '/dashboard/customers', icon: Users, label: 'Customers', color: 'text-green-600' },
    { href: '/dashboard/orders', icon: ShoppingBag, label: 'All Orders', color: 'text-purple-600' },
    { href: '/dashboard/appointments', icon: Calendar, label: 'Appointments', color: 'text-orange-600' },
    { href: '/dashboard/measurements', icon: Ruler, label: 'Measurements', color: 'text-pink-600' },
    { href: '/dashboard/billing', icon: CreditCard, label: 'Billing', color: 'text-indigo-600' },
  ];

  if (showScanner) {
    return (
      <MobileScanner
        onCapture={handleScanCapture}
        onClose={() => setShowScanner(false)}
        defaultType="document"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <PullToRefresh onRefresh={handleRefresh} className="h-screen">
        <div className="pb-24">
          {/* Mobile Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 pt-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Tailoring CRM</h1>
                  <p className="text-purple-100 text-sm">Mobile Portal</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-300" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-300" />
                )}
                
                {canInstall && (
                  <TouchButton
                    onClick={showInstallPrompt}
                    size="sm"
                    className="bg-white/20 text-white border-white/30"
                  >
                    <Download className="w-4 h-4" />
                  </TouchButton>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{quickStats.todayOrders}</p>
                <p className="text-xs text-purple-100">Today's Orders</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{quickStats.pendingTasks}</p>
                <p className="text-xs text-purple-100">Pending Tasks</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{quickStats.unreadMessages}</p>
                <p className="text-xs text-purple-100">Messages</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{quickStats.todayRevenue}</p>
                <p className="text-xs text-purple-100">Revenue (AED)</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <div key={index}>
                  {action.href ? (
                    <Link href={action.href}>
                      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/20 hover:bg-white/80 transition-colors">
                        <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3`}>
                          <action.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{action.label}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </Link>
                  ) : (
                    <button
                      onClick={action.action}
                      className="w-full bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/20 hover:bg-white/80 transition-colors text-left"
                    >
                      <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{action.label}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Links */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
            <div className="grid grid-cols-3 gap-4">
              {dashboardLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <div className="bg-white/70 backdrop-blur-xl rounded-xl p-4 border border-white/20 hover:bg-white/80 transition-colors text-center">
                    <link.icon className={`w-8 h-8 ${link.color} mx-auto mb-2`} />
                    <p className="text-sm font-medium text-gray-900">{link.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile Features */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mobile Features</h2>
            <div className="space-y-3">
              {mobileFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={`bg-white/70 backdrop-blur-xl rounded-xl p-4 border border-white/20 ${
                    feature.available ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      feature.available ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <feature.icon className={`w-5 h-5 ${
                        feature.available ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      feature.available ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Info */}
          <div className="p-6">
            <div className="bg-white/70 backdrop-blur-xl rounded-xl p-4 border border-white/20">
              <h3 className="font-medium text-gray-900 mb-3">System Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Connection:</span>
                  <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Sync:</span>
                  <span className="text-gray-900">
                    {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Device:</span>
                  <span className="text-gray-900">
                    {isMobile ? 'Mobile' : 'Desktop'}
                  </span>
                </div>
                {currentLocation && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="text-gray-900">Available</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={<Camera className="w-6 h-6" />}
        onClick={() => setShowScanner(true)}
        position="bottom-right"
      />
    </div>
  );
}