import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Package, 
  Settings, 
  Workflow, 
  Calendar, 
  Headphones, 
  Shield, 
  Archive, 
  TrendingUp, 
  Menu, 
  X,
  Home,
  Bell,
  Search,
  User,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import dashboard components
import OperationalDashboard from './components/OperationalDashboard';
import EmployeePerformanceAnalytics from './components/EmployeePerformanceAnalytics';
import OrderCompletionAnalytics from './components/OrderCompletionAnalytics';
import ResourceUtilizationAnalytics from './components/ResourceUtilizationAnalytics';

// Navigation items
const navigationItems = [
  {
    id: 'dashboard',
    name: 'Operational Dashboard',
    icon: Home,
    description: 'Overview of all operational metrics',
    component: OperationalDashboard,
    color: 'bg-blue-500'
  },
  {
    id: 'employee-performance',
    name: 'Employee Performance',
    icon: Users,
    description: 'Employee productivity and performance analytics',
    component: EmployeePerformanceAnalytics,
    color: 'bg-green-500'
  },
  {
    id: 'order-completion',
    name: 'Order Completion',
    icon: Package,
    description: 'Order processing and completion analytics',
    component: OrderCompletionAnalytics,
    color: 'bg-purple-500'
  },
  {
    id: 'resource-utilization',
    name: 'Resource Utilization',
    icon: Settings,
    description: 'Equipment and resource utilization tracking',
    component: ResourceUtilizationAnalytics,
    color: 'bg-orange-500'
  },
  {
    id: 'workflow-analytics',
    name: 'Workflow Analytics',
    icon: Workflow,
    description: 'Process efficiency and bottleneck analysis',
    component: null, // To be implemented
    color: 'bg-indigo-500'
  },
  {
    id: 'appointment-analytics',
    name: 'Appointment Analytics',
    icon: Calendar,
    description: 'Scheduling and appointment metrics',
    component: null, // To be implemented
    color: 'bg-pink-500'
  },
  {
    id: 'customer-service',
    name: 'Customer Service',
    icon: Headphones,
    description: 'Customer service performance metrics',
    component: null, // To be implemented
    color: 'bg-teal-500'
  },
  {
    id: 'quality-control',
    name: 'Quality Control',
    icon: Shield,
    description: 'Quality metrics and defect tracking',
    component: null, // To be implemented
    color: 'bg-red-500'
  },
  {
    id: 'inventory-analytics',
    name: 'Inventory Analytics',
    icon: Archive,
    description: 'Inventory turnover and stock optimization',
    component: null, // To be implemented
    color: 'bg-yellow-500'
  },
  {
    id: 'cost-analysis',
    name: 'Cost Analysis',
    icon: TrendingUp,
    description: 'Cost per order and efficiency analysis',
    component: null, // To be implemented
    color: 'bg-cyan-500'
  }
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentItem = navigationItems.find(item => item.id === activeView);
  const CurrentComponent = currentItem?.component;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={cn(
        "bg-white shadow-lg transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-80" : "w-20"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-gray-900">Operational Analytics</h1>
                <p className="text-sm text-gray-600">Business Intelligence Platform</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = activeView === item.id;
              const Icon = item.icon;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-3",
                    isActive && "bg-blue-50 text-blue-700 border-blue-200",
                    !sidebarOpen && "px-2"
                  )}
                  onClick={() => setActiveView(item.id)}
                >
                  <div className={cn(
                    "p-2 rounded-lg mr-3 flex-shrink-0",
                    item.color
                  )}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  {sidebarOpen && (
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </div>
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Admin User</p>
                <p className="text-xs text-gray-600">admin@company.com</p>
              </div>
              <Button variant="ghost" size="sm" className="p-1">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {currentItem && (
                <div className="flex items-center space-x-3">
                  <div className={cn("p-2 rounded-lg", currentItem.color)}>
                    <currentItem.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {currentItem.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {currentItem.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search analytics..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  3
                </Badge>
              </Button>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">All Systems Operational</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {CurrentComponent ? (
            <CurrentComponent />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  {currentItem && <currentItem.icon className="h-8 w-8 text-gray-400" />}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {currentItem?.name} - Coming Soon
                </h3>
                <p className="text-gray-600 mb-6">
                  This analytics module is currently under development and will be available soon.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>Features planned:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {currentItem?.id === 'workflow-analytics' && (
                      <>
                        <li>Process flow visualization</li>
                        <li>Bottleneck identification</li>
                        <li>Workflow optimization recommendations</li>
                      </>
                    )}
                    {currentItem?.id === 'appointment-analytics' && (
                      <>
                        <li>Appointment scheduling metrics</li>
                        <li>No-show rate analysis</li>
                        <li>Resource allocation optimization</li>
                      </>
                    )}
                    {currentItem?.id === 'customer-service' && (
                      <>
                        <li>Response time analytics</li>
                        <li>Customer satisfaction tracking</li>
                        <li>Agent performance metrics</li>
                      </>
                    )}
                    {currentItem?.id === 'quality-control' && (
                      <>
                        <li>Defect rate tracking</li>
                        <li>Quality trend analysis</li>
                        <li>Inspection compliance</li>
                      </>
                    )}
                    {currentItem?.id === 'inventory-analytics' && (
                      <>
                        <li>Stock turnover analysis</li>
                        <li>Reorder point optimization</li>
                        <li>Inventory cost tracking</li>
                      </>
                    )}
                    {currentItem?.id === 'cost-analysis' && (
                      <>
                        <li>Cost per order analysis</li>
                        <li>Department cost allocation</li>
                        <li>Cost efficiency benchmarking</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
