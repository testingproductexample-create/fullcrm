import React, { useState } from 'react';
import { CustomerAnalyticsDashboard } from './components/dashboard/CustomerAnalyticsDashboard';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Heart, 
  Target, 
  ShoppingCart, 
  Route, 
  Star, 
  MessageCircle, 
  Share, 
  Calculator, 
  Brain, 
  Mail,
  Menu,
  X
} from 'lucide-react';

const navigation = [
  { name: 'Analytics Dashboard', icon: BarChart3, component: 'dashboard' },
  { name: 'Customer Overview', icon: Users, component: 'overview' },
  { name: 'Segmentation', icon: Target, component: 'segmentation' },
  { name: 'CLV Analysis', icon: DollarSign, component: 'clv' },
  { name: 'Satisfaction', icon: Heart, component: 'satisfaction' },
  { name: 'Retention', icon: TrendingUp, component: 'retention' },
  { name: 'Purchase Behavior', icon: ShoppingCart, component: 'purchase' },
  { name: 'Journey Mapping', icon: Route, component: 'journey' },
  { name: 'Loyalty Program', icon: Star, component: 'loyalty' },
  { name: 'Feedback Analysis', icon: MessageCircle, component: 'feedback' },
  { name: 'Referral Analytics', icon: Share, component: 'referral' },
  { name: 'CAC Analysis', icon: Calculator, component: 'cac' },
  { name: 'Predictive Analytics', icon: Brain, component: 'predictive' },
  { name: 'Communication Metrics', icon: Mail, component: 'communication' },
];

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderCurrentView = () => {
    return <CustomerAnalyticsDashboard />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Customer Analytics</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setCurrentView(item.component);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentView === item.component
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
          <div className="text-xs text-gray-500">
            <p>Customer Analytics System</p>
            <p className="mt-1">Version 1.0.0</p>
            <p className="mt-2">© 2024 All rights reserved</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex h-16 bg-white shadow-sm border-b">
          <Button
            variant="ghost"
            size="sm"
            className="px-4 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="flex flex-1 justify-between px-6">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {navigation.find(item => item.component === currentView)?.name || 'Analytics Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live Data</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            {renderCurrentView()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
