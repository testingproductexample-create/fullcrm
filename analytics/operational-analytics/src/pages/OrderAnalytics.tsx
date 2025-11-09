import React, { useState, useEffect } from 'react';
import { ShoppingCart, Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { useDataStore, useAnalyticsStore } from '../store';
import MetricCard from '../components/MetricCard';
import Chart from '../components/Chart';
import DataTable from '../components/DataTable';
import { 
  formatCurrency, 
  formatNumber, 
  formatDuration,
  aggregateBy,
  groupBy,
  sortBy
} from '../utils';
import { ChartData, Order } from '../types';

const OrderAnalytics: React.FC = () => {
  const { orders, employees } = useDataStore();
  const { selectedTimeRange } = useAnalyticsStore();
  const [loading, setLoading] = useState(true);
  const [bottlenecks, setBottlenecks] = useState<any[]>([]);

  useEffect(() => {
    // Simulate API call for bottleneck analysis
    setTimeout(() => {
      // Mock bottleneck data
      const mockBottlenecks = [
        { step: 'Order Processing', avgTime: 45, target: 30, efficiency: 67 },
        { step: 'Quality Check', avgTime: 20, target: 15, efficiency: 75 },
        { step: 'Shipping', avgTime: 35, target: 25, efficiency: 71 },
        { step: 'Final Review', avgTime: 15, target: 10, efficiency: 67 },
      ];
      setBottlenecks(mockBottlenecks);
      setLoading(false);
    }, 1000);
  }, [selectedTimeRange]);

  // Filter orders by time range
  const filterOrdersByTimeRange = (orders: Order[]) => {
    const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return orders.filter(order => new Date(order.createdAt) >= cutoffDate);
  };

  const filteredOrders = filterOrdersByTimeRange(orders);

  // Calculate metrics
  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(order => order.status === 'completed').length;
  const pendingOrders = filteredOrders.filter(order => order.status === 'pending').length;
  const inProgressOrders = filteredOrders.filter(order => order.status === 'in_progress').length;
  
  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
  const avgCompletionTime = filteredOrders
    .filter(order => order.actualCompletionTime)
    .reduce((sum, order) => sum + (order.actualCompletionTime || 0), 0) / Math.max(1, filteredOrders.filter(order => order.actualCompletionTime).length);
  
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.revenue || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const onTimeDelivery = filteredOrders
    .filter(order => order.actualCompletionTime && order.estimatedCompletionTime)
    .filter(order => (order.actualCompletionTime || 0) <= (order.estimatedCompletionTime || 0)).length;

  const onTimeRate = filteredOrders.filter(order => order.estimatedCompletionTime).length > 0
    ? (onTimeDelivery / filteredOrders.filter(order => order.estimatedCompletionTime).length) * 100
    : 0;

  // Generate charts data
  const statusDistribution = aggregateBy(filteredOrders, 'status', 'id', 'count');
  const statusChartData: ChartData = {
    labels: Object.keys(statusDistribution),
    datasets: [{
      label: 'Orders',
      data: Object.values(statusDistribution),
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',  // completed
        'rgba(59, 130, 246, 0.8)',  // in_progress
        'rgba(249, 115, 22, 0.8)',  // pending
        'rgba(239, 68, 68, 0.8)',   // cancelled
      ],
    }]
  };

  const priorityData = aggregateBy(filteredOrders, 'priorityLevel', 'id', 'count');
  const priorityChartData: ChartData = {
    labels: Object.keys(priorityData).map(p => `Priority ${p}`),
    datasets: [{
      label: 'Orders by Priority',
      data: Object.values(priorityData),
      backgroundColor: 'rgba(168, 85, 247, 0.6)',
      borderColor: 'rgba(168, 85, 247, 1)',
      borderWidth: 1,
    }]
  };

  // Generate order trends (mock data for demonstration)
  const orderTrendData: ChartData = {
    labels: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Daily Orders',
      data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 20) + 5),
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      fill: true,
    }]
  };

  // Add employee names to orders
  const ordersWithEmployeeNames = filteredOrders.map(order => ({
    ...order,
    employeeName: employees.find(emp => emp.employeeId === order.assignedEmployeeId)?.firstName || 'Unassigned',
    statusFormatted: order.status.replace('_', ' ').toUpperCase(),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
        <span className="ml-3 text-white">Loading order analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Order Analytics</h1>
          <p className="text-gray-400 mt-2">Order processing, completion times, and bottleneck analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            className="glass-input px-4 py-2 rounded-lg text-white"
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Order Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Orders"
            value={totalOrders}
            change={8.2}
            changeType="increase"
            trend="up"
            icon={<ShoppingCart size={20} />}
            description={`Orders in ${selectedTimeRange.toUpperCase()}`}
          />
          <MetricCard
            title="Completion Rate"
            value={Math.round(completionRate * 10) / 10}
            unit="%"
            change={3.1}
            changeType="increase"
            trend="up"
            icon={<TrendingUp size={20} />}
            description="Orders completed successfully"
          />
          <MetricCard
            title="Avg Completion Time"
            value={Math.round(avgCompletionTime)}
            unit="min"
            change={-12.5}
            changeType="decrease"
            trend="down"
            icon={<Clock size={20} />}
            description="Average time to complete"
          />
          <MetricCard
            title="Average Order Value"
            value={Math.round(avgOrderValue)}
            unit="$"
            change={5.7}
            changeType="increase"
            trend="up"
            icon={<DollarSign size={20} />}
            description="Revenue per order"
          />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="On-Time Delivery"
          value={Math.round(onTimeRate * 10) / 10}
          unit="%"
          change={2.8}
          changeType="increase"
          trend="up"
          icon={<Clock size={20} />}
          description="Orders delivered on time"
        />
        <MetricCard
          title="Pending Orders"
          value={pendingOrders}
          change={-15.3}
          changeType="decrease"
          trend="down"
          icon={<AlertCircle size={20} />}
          description="Orders waiting processing"
        />
        <MetricCard
          title="In Progress"
          value={inProgressOrders}
          change={4.2}
          changeType="increase"
          trend="up"
          icon={<Clock size={20} />}
          description="Currently being processed"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Order Status Distribution"
          data={statusChartData}
          type="pie"
          height={300}
        />
        <Chart
          title="Order Volume Trend (Last 30 Days)"
          data={orderTrendData}
          type="line"
          height={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Orders by Priority Level"
          data={priorityChartData}
          type="bar"
          height={300}
        />
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Workflow Bottlenecks</h3>
          <div className="space-y-4">
            {bottlenecks.map((bottleneck, index) => (
              <div key={index} className="border-b border-white/10 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{bottleneck.step}</h4>
                  <div className="text-right">
                    <div className="text-white font-semibold">{formatDuration(bottleneck.avgTime)}</div>
                    <div className="text-gray-400 text-sm">Target: {formatDuration(bottleneck.target)}</div>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${bottleneck.efficiency >= 90 ? 'bg-green-500' : 
                      bottleneck.efficiency >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, bottleneck.efficiency)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Efficiency: {Math.round(bottleneck.efficiency)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Table */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Order Details</h2>
        <DataTable
          data={sortBy(ordersWithEmployeeNames, 'createdAt', 'desc')}
          columns={[
            { key: 'orderNumber', label: 'Order #', sortable: true },
            { key: 'orderType', label: 'Type', sortable: true },
            { key: 'statusFormatted', label: 'Status', sortable: true },
            { key: 'priorityLevel', label: 'Priority', sortable: true, align: 'center' },
            { key: 'employeeName', label: 'Assigned To', sortable: true },
            { key: 'estimatedCompletionTime', label: 'Est. Time', sortable: true, render: (value) => value ? formatDuration(value) : 'N/A' },
            { key: 'actualCompletionTime', label: 'Actual Time', sortable: true, render: (value) => value ? formatDuration(value) : 'In Progress' },
            { key: 'revenue', label: 'Revenue', sortable: true, align: 'right', render: (value) => formatCurrency(value || 0) },
            { key: 'profitMargin', label: 'Margin', sortable: true, align: 'right', render: (value) => `${Math.round(value * 10) / 10}%` },
          ]}
          pageSize={15}
        />
      </div>
    </div>
  );
};

export default OrderAnalytics;