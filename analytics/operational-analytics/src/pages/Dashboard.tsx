import React, { useEffect, useState } from 'react';
import { 
  Users, 
  ShoppingCart, 
  Clock, 
  DollarSign, 
  Package, 
  AlertTriangle,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useDataStore, useAnalyticsStore } from '../store';
import MetricCard from '../components/MetricCard';
import Chart from '../components/Chart';
import DataTable from '../components/DataTable';
import { 
  formatCurrency, 
  formatNumber, 
  formatPercentage, 
  generateKPIs,
  generateMockTimeSeriesData,
  generateTimeSeriesData,
  aggregateBy,
  groupBy
} from '../utils';
import { ChartData } from '../types';

const Dashboard: React.FC = () => {
  const { 
    dashboardMetrics, 
    employees, 
    orders, 
    systemAlerts,
    setDashboardMetrics,
    setEmployees,
    setOrders,
    setSystemAlerts 
  } = useDataStore();
  
  const { selectedTimeRange } = useAnalyticsStore();
  const [isLoading, setIsLoading] = useState(true);

  // Mock data generation for development
  useEffect(() => {
    const generateMockData = () => {
      // Generate mock employees
      const mockEmployees = Array.from({ length: 25 }, (_, i) => ({
        id: `emp-${i + 1}`,
        employeeId: `EMP${String(i + 1).padStart(3, '0')}`,
        firstName: `Employee${i + 1}`,
        lastName: `LastName${i + 1}`,
        email: `employee${i + 1}@company.com`,
        department: ['Sales', 'Support', 'Development', 'Operations', 'HR'][Math.floor(Math.random() * 5)],
        position: ['Manager', 'Analyst', 'Specialist', 'Coordinator'][Math.floor(Math.random() * 4)],
        hireDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        salary: 50000 + Math.floor(Math.random() * 50000),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // Generate mock orders
      const mockOrders = Array.from({ length: 150 }, (_, i) => ({
        id: `order-${i + 1}`,
        orderNumber: `ORD${String(i + 1).padStart(5, '0')}`,
        customerId: `CUST${Math.floor(Math.random() * 100) + 1}`,
        orderType: ['Product', 'Service', 'Subscription'][Math.floor(Math.random() * 3)],
        priorityLevel: Math.floor(Math.random() * 4) + 1,
        status: ['pending', 'in_progress', 'completed', 'cancelled'][Math.floor(Math.random() * 4)],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedCompletionTime: 60 + Math.floor(Math.random() * 120),
        actualCompletionTime: 45 + Math.floor(Math.random() * 150),
        totalCost: 100 + Math.floor(Math.random() * 1000),
        revenue: 150 + Math.floor(Math.random() * 1500),
        profitMargin: 10 + Math.random() * 50,
        assignedEmployeeId: mockEmployees[Math.floor(Math.random() * mockEmployees.length)].employeeId,
        workflowStep: Math.floor(Math.random() * 5) + 1,
      }));

      // Generate mock system alerts
      const mockAlerts = Array.from({ length: 8 }, (_, i) => ({
        id: `alert-${i + 1}`,
        alertId: `ALERT${String(i + 1).padStart(4, '0')}`,
        alertType: ['performance', 'inventory', 'quality', 'system'][Math.floor(Math.random() * 4)],
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        title: `Alert Title ${i + 1}`,
        message: `This is a sample alert message for alert ${i + 1}`,
        sourceTable: ['orders', 'inventory', 'employees', 'quality'][Math.floor(Math.random() * 4)],
        sourceId: `${Math.floor(Math.random() * 100) + 1}`,
        resolved: Math.random() > 0.3,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      // Calculate dashboard metrics
      const completedOrders = mockOrders.filter(order => order.status === 'completed').length;
      const totalRevenue = mockOrders.reduce((sum, order) => sum + (order.revenue || 0), 0);
      const totalCost = mockOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0);
      const activeEmployees = mockEmployees.filter(emp => emp.status === 'active').length;
      const openTickets = Math.floor(Math.random() * 25) + 5;
      const averageResponseTime = Math.floor(Math.random() * 120) + 30;
      const lowStockItems = Math.floor(Math.random() * 10) + 1;
      const outOfStockItems = Math.floor(Math.random() * 3);
      const criticalAlerts = mockAlerts.filter(alert => !alert.resolved && alert.severity === 'critical').length;
      const totalQualityIssues = Math.floor(Math.random() * 15) + 2;
      const qualityPassRate = 85 + Math.random() * 12;

      const mockDashboardMetrics = {
        totalOrders: mockOrders.length,
        completedOrders,
        pendingOrders: mockOrders.filter(order => order.status === 'pending').length,
        averageCompletionTime: mockOrders
          .filter(order => order.actualCompletionTime)
          .reduce((sum, order) => sum + (order.actualCompletionTime || 0), 0) / completedOrders || 0,
        totalRevenue,
        totalProfit: totalRevenue - totalCost,
        averageProfitMargin: ((totalRevenue - totalCost) / totalRevenue) * 100,
        totalEmployees: mockEmployees.length,
        activeEmployees,
        averageUtilization: 70 + Math.random() * 20,
        totalTickets: openTickets + Math.floor(Math.random() * 50),
        openTickets,
        averageResponseTime,
        averageResolutionTime: averageResponseTime + Math.floor(Math.random() * 240),
        totalInventoryItems: 250 + Math.floor(Math.random() * 100),
        lowStockItems,
        outOfStockItems,
        inventoryTurnover: 4.2 + Math.random() * 2.8,
        totalQualityIssues,
        qualityPassRate,
        systemAlerts: mockAlerts.length,
        criticalAlerts,
      };

      return { mockEmployees, mockOrders, mockAlerts, mockDashboardMetrics };
    };

    // Simulate API call
    setTimeout(() => {
      const { mockEmployees, mockOrders, mockAlerts, mockDashboardMetrics } = generateMockData();
      setEmployees(mockEmployees);
      setOrders(mockOrders);
      setSystemAlerts(mockAlerts);
      setDashboardMetrics(mockDashboardMetrics);
      setIsLoading(false);
    }, 1500);
  }, [setEmployees, setOrders, setSystemAlerts, setDashboardMetrics]);

  // Generate chart data
  const [orderTrendsData, setOrderTrendsData] = useState<ChartData>({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (orders.length > 0) {
      // Generate order trends over time
      const timeSeriesData = generateMockTimeSeriesData(30);
      setOrderTrendsData(generateTimeSeriesData(timeSeriesData));
    }
  }, [orders]);

  // Generate department performance data
  const departmentData = employees.length > 0 
    ? aggregateBy(employees, 'department', 'id', 'count')
    : {};

  const departmentChartData: ChartData = {
    labels: Object.keys(departmentData),
    datasets: [{
      label: 'Employee Count',
      data: Object.values(departmentData),
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    }]
  };

  // Generate status distribution
  const statusData = orders.length > 0
    ? aggregateBy(orders, 'status', 'id', 'count')
    : {};

  const statusChartData: ChartData = {
    labels: Object.keys(statusData),
    datasets: [{
      label: 'Orders',
      data: Object.values(statusData),
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',  // completed - green
        'rgba(59, 130, 246, 0.8)',  // in_progress - blue
        'rgba(249, 115, 22, 0.8)',  // pending - orange
        'rgba(239, 68, 68, 0.8)',   // cancelled - red
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(249, 115, 22, 1)',
        'rgba(239, 68, 68, 1)',
      ],
      borderWidth: 1,
    }]
  };

  // Generate recent orders table data
  const recentOrders = orders
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map(order => ({
      ...order,
      employeeName: employees.find(emp => emp.employeeId === order.assignedEmployeeId)?.firstName || 'Unassigned',
      createdAtFormatted: new Date(order.createdAt).toLocaleDateString(),
    }));

  const kpis = dashboardMetrics ? generateKPIs(dashboardMetrics) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
        <span className="ml-3 text-white">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Operational Analytics Dashboard</h1>
          <p className="text-gray-400 mt-2">Real-time business intelligence and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Orders"
            value={dashboardMetrics?.totalOrders || 0}
            change={5.2}
            changeType="increase"
            trend="up"
            icon={<ShoppingCart size={20} />}
            description="Total orders processed"
          />
          <MetricCard
            title="Completion Rate"
            value={dashboardMetrics ? (dashboardMetrics.completedOrders / dashboardMetrics.totalOrders) * 100 : 0}
            unit="%"
            change={2.1}
            changeType="increase"
            trend="up"
            icon={<TrendingUp size={20} />}
            description="Order completion percentage"
          />
          <MetricCard
            title="Average Completion Time"
            value={dashboardMetrics?.averageCompletionTime || 0}
            unit="min"
            change={-8.3}
            changeType="decrease"
            trend="down"
            icon={<Clock size={20} />}
            description="Average time to complete orders"
          />
          <MetricCard
            title="Total Revenue"
            value={dashboardMetrics?.totalRevenue || 0}
            unit="$"
            change={12.4}
            changeType="increase"
            trend="up"
            icon={<DollarSign size={20} />}
            description="Total revenue generated"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Order Trends (Last 30 Days)"
          data={orderTrendsData}
          type="area"
          height={300}
        />
        <Chart
          title="Department Distribution"
          data={departmentChartData}
          type="bar"
          height={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Order Status Distribution"
          data={statusChartData}
          type="pie"
          height={300}
        />
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Active Employees</span>
              <span className="text-white font-semibold">{dashboardMetrics?.activeEmployees || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Open Tickets</span>
              <span className="text-white font-semibold">{dashboardMetrics?.openTickets || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Low Stock Items</span>
              <span className="text-white font-semibold">{dashboardMetrics?.lowStockItems || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Critical Alerts</span>
              <span className="text-red-400 font-semibold">{dashboardMetrics?.criticalAlerts || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Quality Pass Rate</span>
              <span className="text-green-400 font-semibold">
                {formatPercentage(dashboardMetrics?.qualityPassRate || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Recent Orders</h2>
        <DataTable
          data={recentOrders}
          columns={[
            { key: 'orderNumber', label: 'Order #', sortable: true },
            { key: 'orderType', label: 'Type', sortable: true },
            { key: 'status', label: 'Status', sortable: true, render: (value) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value === 'completed' ? 'bg-green-100 text-green-800' :
                value === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {value}
              </span>
            )},
            { key: 'priorityLevel', label: 'Priority', sortable: true },
            { key: 'employeeName', label: 'Assigned To', sortable: true },
            { key: 'createdAtFormatted', label: 'Created', sortable: true },
            { key: 'revenue', label: 'Revenue', sortable: true, render: (value) => formatCurrency(value || 0) },
          ]}
          pageSize={8}
        />
      </div>
    </div>
  );
};

export default Dashboard;