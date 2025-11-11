import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Settings, 
  Share2, 
  Download, 
  RefreshCw, 
  Grid, 
  Maximize2,
  Edit3,
  Trash2,
  Copy,
  Eye,
  Clock,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useReportStore, DashboardConfig, ReportComponent } from '../store/reportStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format, subDays, subMonths } from 'date-fns';

const Dashboard: React.FC = () => {
  const { 
    dashboards, 
    currentDashboard, 
    setCurrentDashboard,
    addDashboard, 
    updateDashboard,
    deleteDashboard 
  } = useReportStore();

  const [dashboardsList, setDashboardsList] = useState<DashboardConfig[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<DashboardConfig | null>(null);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    setDashboardsList(dashboards);
    if (dashboards && dashboards.length > 0 && !currentDashboard) {
      setCurrentDashboard(dashboards[0]);
    }
  }, [dashboards, currentDashboard, setCurrentDashboard]);

  // Real-time data simulation
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simulate real-time data updates
      const newData = {
        timestamp: new Date(),
        metrics: {
          totalSales: Math.random() * 100000,
          newCustomers: Math.floor(Math.random() * 50),
          conversionRate: Math.random() * 10,
          avgOrderValue: Math.random() * 500,
        }
      };
      setRealTimeData(prev => [newData, ...prev.slice(0, 19)]); // Keep last 20 updates
      setLastRefresh(new Date());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleCreateDashboard = () => {
    const newDashboard: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'New Dashboard',
      description: 'Custom dashboard',
      layout: 'grid',
      components: [
        {
          id: '1',
          type: 'metric',
          title: 'Total Sales',
          dataSource: 'sales',
          config: { format: 'currency', value: 0 },
          position: { x: 0, y: 0, w: 3, h: 2 },
          visible: true,
          order: 0,
        },
        {
          id: '2',
          type: 'metric',
          title: 'New Customers',
          dataSource: 'customers',
          config: { format: 'number', value: 0 },
          position: { x: 3, y: 0, w: 3, h: 2 },
          visible: true,
          order: 1,
        },
        {
          id: '3',
          type: 'chart',
          title: 'Sales Trend',
          dataSource: 'sales',
          config: { chartType: 'line' },
          position: { x: 0, y: 2, w: 6, h: 4 },
          visible: true,
          order: 2,
        }
      ],
      theme: 'light',
      autoRefresh: true,
      refreshInterval: 5000,
    };

    addDashboard(newDashboard);
    const createdDashboard = dashboardsList[dashboardsList.length - 1];
    setEditingDashboard(createdDashboard);
    setIsCreating(true);
    toast.success('Dashboard created');
  };

  const handleEditDashboard = (dashboard: DashboardConfig) => {
    setEditingDashboard(dashboard);
    setIsEditing(true);
  };

  const handleUpdateDashboard = (updates: Partial<DashboardConfig>) => {
    if (editingDashboard) {
      updateDashboard(editingDashboard.id, updates);
      if (currentDashboard?.id === editingDashboard.id) {
        setCurrentDashboard({ ...editingDashboard, ...updates });
      }
    }
  };

  const handleDeleteDashboard = (dashboardId: string) => {
    if (confirm('Are you sure you want to delete this dashboard?')) {
      deleteDashboard(dashboardId);
      if (currentDashboard?.id === dashboardId) {
        const remaining = dashboardsList.filter(d => d.id !== dashboardId);
        setCurrentDashboard(remaining.length > 0 ? remaining[0] : null);
      }
      toast.success('Dashboard deleted');
    }
  };

  const handleExportDashboard = (format: 'pdf' | 'excel' | 'image') => {
    toast.success(`Dashboard exported as ${format.toUpperCase()}`);
  };

  const handleRefreshData = () => {
    setLastRefresh(new Date());
    // Simulate data refresh
    toast.success('Data refreshed');
  };

  const currentData = realTimeData?.[0];

  return (
    <div className="h-full flex flex-col">
      {/* Dashboard Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboards</h1>
            <p className="text-gray-600 mt-1">
              Create and customize dashboards with real-time data visualization
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              Last updated: {format(lastRefresh, 'HH:mm:ss')}
            </div>
            <button
              onClick={handleRefreshData}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh 
                  ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </button>
            <button
              onClick={handleCreateDashboard}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="flex-1 overflow-auto">
        {!currentDashboard ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Dashboards Found</h3>
            <p className="text-gray-500 mb-6">
              Create your first dashboard to start visualizing your data
            </p>
            <button
              onClick={handleCreateDashboard}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Dashboard
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Dashboard Controls */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{currentDashboard.name}</h2>
                <p className="text-gray-600">{currentDashboard.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditDashboard(currentDashboard)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleExportDashboard('image')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dashboard Widgets */}
            <div className="grid grid-cols-12 gap-6">
              {currentDashboard.components
                .filter(comp => comp.visible)
                .sort((a, b) => a.order - b.order)
                .map((component) => (
                  <div
                    key={component.id}
                    className={`col-span-${component.position.w} row-span-${component.position.h}`}
                    style={{
                      gridColumn: `${component.position.x + 1} / span ${component.position.w}`,
                      gridRow: `${component.position.y + 1} / span ${component.position.h}`,
                    }}
                  >
                    <DashboardWidget 
                      component={component} 
                      realTimeData={currentData?.metrics}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Creation/Edit Modal */}
      <AnimatePresence>
        {(isCreating || isEditing) && (
          <DashboardModal
            dashboard={editingDashboard}
            onSave={handleUpdateDashboard}
            onClose={() => {
              setIsCreating(false);
              setIsEditing(false);
              setEditingDashboard(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Dashboard Widget Component
interface DashboardWidgetProps {
  component: ReportComponent;
  realTimeData?: any;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({ component, realTimeData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-gray-200 rounded-lg p-4 h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">{component.title}</h3>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      <div className="h-full flex items-center justify-center">
        {component.type === 'metric' && (
          <MetricWidget component={component} realTimeData={realTimeData} />
        )}
        {component.type === 'chart' && (
          <ChartWidget component={component} />
        )}
        {component.type === 'table' && (
          <TableWidget component={component} />
        )}
      </div>
    </motion.div>
  );
};

// Metric Widget
const MetricWidget: React.FC<DashboardWidgetProps> = ({ component, realTimeData }) => {
  const getValue = () => {
    if (!realTimeData) return component.config.value || 0;
    
    switch (component.dataSource) {
      case 'sales':
        return realTimeData.totalSales || 0;
      case 'customers':
        return realTimeData.newCustomers || 0;
      case 'financial':
        return realTimeData.avgOrderValue || 0;
      default:
        return Math.random() * 1000;
    }
  };

  const formatValue = (value: number) => {
    switch (component.config.format) {
      case 'currency':
        return new Intl.NumberFormat('en-AE', { 
          style: 'currency', 
          currency: 'AED' 
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  const value = getValue();
  const change = Math.random() > 0.5 ? Math.random() * 20 - 5 : Math.random() * 20 - 15;
  const isPositive = change > 0;

  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-gray-900 mb-2">
        {formatValue(value)}
      </div>
      <div className={`flex items-center justify-center text-sm ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        <TrendingUp className={`w-4 h-4 mr-1 ${!isPositive ? 'rotate-180' : ''}`} />
        {isPositive ? '+' : ''}{change.toFixed(1)}%
      </div>
      <div className="text-xs text-gray-500 mt-1">vs last period</div>
    </div>
  );
};

// Chart Widget
const ChartWidget: React.FC<DashboardWidgetProps> = ({ component }) => {
  // Generate sample data for demonstration
  const sampleData = Array.from({ length: 7 }, (_, i) => ({
    day: format(subDays(new Date(), 6 - i), 'EEE'),
    value: Math.random() * 100 + 50,
  }));

  return (
    <div className="w-full h-full">
      <div className="flex items-end space-x-1 h-full">
        {sampleData.map((item, index) => (
          <div
            key={index}
            className="flex-1 bg-blue-500 rounded-t"
            style={{ height: `${(item.value / 150) * 100}%` }}
            title={`${item.day}: ${item.value.toFixed(0)}`}
          />
        ))}
      </div>
    </div>
  );
};

// Table Widget
const TableWidget: React.FC<DashboardWidgetProps> = ({ component }) => {
  const sampleRows = [
    { metric: 'Revenue', value: 'AED 125,000', change: '+5.2%' },
    { metric: 'Orders', value: '1,247', change: '+3.1%' },
    { metric: 'Customers', value: '892', change: '+2.8%' },
    { metric: 'Conversion', value: '3.4%', change: '-0.2%' },
  ];

  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2">Metric</th>
            <th className="text-right py-2">Value</th>
            <th className="text-right py-2">Change</th>
          </tr>
        </thead>
        <tbody>
          {sampleRows.map((row, index) => (
            <tr key={index} className="border-b border-gray-100">
              <td className="py-2 text-gray-900">{row.metric}</td>
              <td className="py-2 text-right font-medium">{row.value}</td>
              <td className="py-2 text-right">
                <span className={`${
                  row.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {row.change}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Dashboard Modal
const DashboardModal: React.FC<{
  dashboard: DashboardConfig | null;
  onSave: (updates: Partial<DashboardConfig>) => void;
  onClose: () => void;
}> = ({ dashboard, onSave, onClose }) => {
  const [name, setName] = useState(dashboard?.name || '');
  const [description, setDescription] = useState(dashboard?.description || '');
  const [theme, setTheme] = useState(dashboard?.theme || 'light');
  const [autoRefresh, setAutoRefresh] = useState(dashboard?.autoRefresh || true);
  const [refreshInterval, setRefreshInterval] = useState(dashboard?.refreshInterval || 5000);

  const handleSave = () => {
    onSave({ name, description, theme, autoRefresh, refreshInterval });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {dashboard ? 'Edit Dashboard' : 'Create Dashboard'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'colorful')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="colorful">Colorful</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Auto-refresh data</span>
            </label>
          </div>
          
          {autoRefresh && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refresh Interval (seconds)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={refreshInterval / 1000}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value) * 1000)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;