import React, { useState, useEffect } from 'react';
import { Package, Gauge, Wrench, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { useDataStore, useAnalyticsStore } from '../store';
import MetricCard from '../components/MetricCard';
import Chart from '../components/Chart';
import DataTable from '../components/DataTable';
import { 
  formatPercentage,
  formatCurrency,
  aggregateBy,
  sortBy
} from '../utils';
import { ChartData } from '../types';

const ResourceAnalytics: React.FC = () => {
  const { employees } = useDataStore();
  const { selectedTimeRange } = useAnalyticsStore();
  const [resources, setResources] = useState<any[]>([]);
  const [utilization, setUtilization] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate mock resource data
    const generateMockData = () => {
      const resourceTypes = ['equipment', 'staff', 'materials', 'facility'];
      const mockResources = Array.from({ length: 30 }, (_, i) => ({
        id: `resource-${i + 1}`,
        resourceId: `RES${String(i + 1).padStart(3, '0')}`,
        resourceName: `Resource ${i + 1}`,
        resourceType: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
        department: ['Sales', 'Support', 'Development', 'Operations', 'HR'][Math.floor(Math.random() * 5)],
        capacity: Math.floor(Math.random() * 100) + 10,
        hourlyCost: Math.random() * 50 + 10,
        purchaseDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        status: ['available', 'in_use', 'maintenance', 'unavailable'][Math.floor(Math.random() * 4)],
        maintenanceSchedule: `Every ${Math.floor(Math.random() * 6) + 1} months`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // Generate utilization data
      const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
      const mockUtilization = Array.from({ length: 30 * days }, (_, i) => {
        const resource = mockResources[Math.floor(Math.random() * mockResources.length)];
        return {
          id: `util-${i + 1}`,
          resourceId: resource.resourceId,
          utilizationDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          utilizationHours: Math.random() * 8,
          efficiencyPercentage: 60 + Math.random() * 40,
          downtimeHours: Math.random() * 2,
          maintenanceHours: Math.random() * 1,
        };
      });

      return { mockResources, mockUtilization };
    };

    setTimeout(() => {
      const { mockResources, mockUtilization } = generateMockData();
      setResources(mockResources);
      setUtilization(mockUtilization);
      setLoading(false);
    }, 1000);
  }, [selectedTimeRange]);

  // Calculate resource metrics
  const totalResources = resources.length;
  const availableResources = resources.filter(r => r.status === 'available').length;
  const inUseResources = resources.filter(r => r.status === 'in_use').length;
  const maintenanceResources = resources.filter(r => r.status === 'maintenance').length;
  const unavailableResources = resources.filter(r => r.status === 'unavailable').length;

  const totalCapacity = resources.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const totalUtilization = utilization.reduce((sum, u) => sum + u.utilizationHours, 0);
  const avgUtilizationRate = totalCapacity > 0 ? (totalUtilization / totalCapacity) * 100 : 0;

  const totalCost = utilization.reduce((sum, u) => {
    const resource = resources.find(r => r.resourceId === u.resourceId);
    return sum + (u.utilizationHours * (resource?.hourlyCost || 0));
  }, 0);

  const avgEfficiency = utilization.length > 0 
    ? utilization.reduce((sum, u) => sum + u.efficiencyPercentage, 0) / utilization.length 
    : 0;

  // Generate charts data
  const resourceTypeData = aggregateBy(resources, 'resourceType', 'id', 'count');
  const resourceTypeChartData: ChartData = {
    labels: Object.keys(resourceTypeData),
    datasets: [{
      label: 'Resources by Type',
      data: Object.values(resourceTypeData),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(168, 85, 247, 0.8)',
      ],
    }]
  };

  const departmentData = aggregateBy(resources, 'department', 'id', 'count');
  const departmentChartData: ChartData = {
    labels: Object.keys(departmentData),
    datasets: [{
      label: 'Resources by Department',
      data: Object.values(departmentData),
      backgroundColor: 'rgba(20, 184, 166, 0.6)',
      borderColor: 'rgba(20, 184, 166, 1)',
      borderWidth: 1,
    }]
  };

  // Generate efficiency trends (mock data)
  const efficiencyTrendData: ChartData = {
    labels: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Efficiency %',
      data: Array.from({ length: 30 }, () => 70 + Math.random() * 25),
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 2,
      fill: true,
    }]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
        <span className="ml-3 text-white">Loading resource analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Resource Analytics</h1>
          <p className="text-gray-400 mt-2">Equipment, staff, materials, and facility utilization</p>
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
        <h2 className="text-xl font-semibold text-white mb-4">Resource Utilization Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Resources"
            value={totalResources}
            change={3.2}
            changeType="increase"
            trend="up"
            icon={<Package size={20} />}
            description="All resources tracked"
          />
          <MetricCard
            title="Utilization Rate"
            value={Math.round(avgUtilizationRate * 10) / 10}
            unit="%"
            change={5.8}
            changeType="increase"
            trend="up"
            icon={<Gauge size={20} />}
            description="Overall resource usage"
          />
          <MetricCard
            title="Average Efficiency"
            value={Math.round(avgEfficiency * 10) / 10}
            unit="%"
            change={2.1}
            changeType="increase"
            trend="up"
            icon={<TrendingUp size={20} />}
            description="Resource efficiency rating"
          />
          <MetricCard
            title="Total Utilization Cost"
            value={Math.round(totalCost)}
            unit="$"
            change={8.4}
            changeType="increase"
            trend="up"
            icon={<DollarSign size={20} />}
            description="Cost of resource usage"
          />
        </div>
      </div>

      {/* Resource Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Available"
          value={availableResources}
          change={-2.3}
          changeType="decrease"
          trend="down"
          icon={<Package size={20} />}
          description="Ready to use"
        />
        <MetricCard
          title="In Use"
          value={inUseResources}
          change={12.7}
          changeType="increase"
          trend="up"
          icon={<Gauge size={20} />}
          description="Currently being used"
        />
        <MetricCard
          title="Maintenance"
          value={maintenanceResources}
          change={15.2}
          changeType="increase"
          trend="up"
          icon={<Wrench size={20} />}
          description="Under maintenance"
        />
        <MetricCard
          title="Unavailable"
          value={unavailableResources}
          change={-25.0}
          changeType="decrease"
          trend="down"
          icon={<AlertTriangle size={20} />}
          description="Out of service"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Resource Distribution by Type"
          data={resourceTypeChartData}
          type="pie"
          height={300}
        />
        <Chart
          title="Resources by Department"
          data={departmentChartData}
          type="bar"
          height={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Efficiency Trends (Last 30 Days)"
          data={efficiencyTrendData}
          type="line"
          height={300}
        />
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Resource Health Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Overall Health</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-700 rounded-full h-2">
                  <div className="w-16 bg-green-500 h-2 rounded-full" />
                </div>
                <span className="text-green-400 text-sm font-medium">80%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Maintenance Status</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-700 rounded-full h-2">
                  <div className="w-12 bg-yellow-500 h-2 rounded-full" />
                </div>
                <span className="text-yellow-400 text-sm font-medium">60%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Utilization</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-700 rounded-full h-2">
                  <div className="w-18 bg-blue-500 h-2 rounded-full" />
                </div>
                <span className="text-blue-400 text-sm font-medium">90%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Cost Efficiency</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-700 rounded-full h-2">
                  <div className="w-14 bg-purple-500 h-2 rounded-full" />
                </div>
                <span className="text-purple-400 text-sm font-medium">70%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Table */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Resource Details</h2>
        <DataTable
          data={sortBy(resources, 'resourceName')}
          columns={[
            { key: 'resourceName', label: 'Resource Name', sortable: true },
            { key: 'resourceType', label: 'Type', sortable: true },
            { key: 'department', label: 'Department', sortable: true },
            { key: 'capacity', label: 'Capacity', sortable: true, align: 'right' },
            { key: 'hourlyCost', label: 'Cost/Hour', sortable: true, align: 'right', render: (value) => formatCurrency(value || 0) },
            { key: 'status', label: 'Status', sortable: true, render: (value) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value === 'available' ? 'bg-green-100 text-green-800' :
                value === 'in_use' ? 'bg-blue-100 text-blue-800' :
                value === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {value}
              </span>
            )},
            { key: 'maintenanceSchedule', label: 'Maintenance', sortable: true },
            { key: 'purchaseDate', label: 'Purchased', sortable: true, render: (value) => new Date(value).toLocaleDateString() },
          ]}
          pageSize={15}
        />
      </div>
    </div>
  );
};

export default ResourceAnalytics;