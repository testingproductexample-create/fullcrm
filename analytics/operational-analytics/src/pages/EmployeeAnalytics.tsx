import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Clock, Award, Target, BarChart3 } from 'lucide-react';
import { useDataStore, useAnalyticsStore } from '../store';
import MetricCard from '../components/MetricCard';
import Chart from '../components/Chart';
import DataTable from '../components/DataTable';
import { 
  formatNumber, 
  generateMockPerformanceData,
  aggregateBy,
  sortBy
} from '../utils';
import { ChartData, PerformanceMetric, Employee } from '../types';

const EmployeeAnalytics: React.FC = () => {
  const { employees } = useDataStore();
  const { selectedTimeRange } = useAnalyticsStore();
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate mock performance metrics
    const generatePerformanceData = (): PerformanceMetric[] => {
      const data: PerformanceMetric[] = [];
      const departments = ['Sales', 'Support', 'Development', 'Operations', 'HR'];
      
      employees.forEach(employee => {
        const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
        for (let i = 0; i < days; i++) {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          data.push({
            id: `perf-${employee.employeeId}-${i}`,
            employeeId: employee.employeeId,
            metricDate: date.toISOString().split('T')[0],
            tasksCompleted: Math.floor(Math.random() * 20) + 5,
            qualityScore: 70 + Math.random() * 30,
            efficiencyRating: 65 + Math.random() * 35,
            customerSatisfaction: 75 + Math.random() * 25,
            goalAchievementPercentage: 60 + Math.random() * 40,
            createdAt: new Date().toISOString(),
          });
        }
      });
      
      return data;
    };

    setTimeout(() => {
      setPerformanceMetrics(generatePerformanceData());
      setLoading(false);
    }, 1000);
  }, [employees, selectedTimeRange]);

  // Calculate employee metrics
  const employeeMetrics = employees.map(employee => {
    const employeePerf = performanceMetrics.filter(perf => perf.employeeId === employee.employeeId);
    const avgTasks = employeePerf.length > 0 
      ? employeePerf.reduce((sum: number, perf: PerformanceMetric) => sum + perf.tasksCompleted, 0) / employeePerf.length 
      : 0;
    const avgQuality = employeePerf.length > 0 
      ? employeePerf.reduce((sum: number, perf: PerformanceMetric) => sum + perf.qualityScore, 0) / employeePerf.length 
      : 0;
    const avgEfficiency = employeePerf.length > 0 
      ? employeePerf.reduce((sum: number, perf: PerformanceMetric) => sum + perf.efficiencyRating, 0) / employeePerf.length 
      : 0;

    return {
      ...employee,
      avgTasks: Math.round(avgTasks * 10) / 10,
      avgQuality: Math.round(avgQuality * 10) / 10,
      avgEfficiency: Math.round(avgEfficiency * 10) / 10,
      totalDaysWorked: employeePerf.length,
    };
  });

  // Generate department performance chart
  const departmentPerf = aggregateBy(performanceMetrics, 'employeeId', 'efficiencyRating', 'avg');
  const departmentData = Object.keys(departmentPerf).map(empId => {
    const emp = employees.find(e => e.employeeId === empId);
    return {
      department: emp?.department || 'Unknown',
      efficiency: departmentPerf[empId],
    };
  });

  const avgDepartmentPerf = departmentData.reduce((acc: Record<string, { total: number; count: number }>, curr: { department: string; efficiency: number }) => {
    if (!acc[curr.department]) {
      acc[curr.department] = { total: 0, count: 0 };
    }
    acc[curr.department].total += curr.efficiency;
    acc[curr.department].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const departmentChartData: ChartData = {
    labels: Object.keys(avgDepartmentPerf),
    datasets: [{
      label: 'Average Efficiency',
      data: Object.values(avgDepartmentPerf).map(d => Math.round((d.total / d.count) * 10) / 10),
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    }]
  };

  // Generate performance trend chart
  const performanceTrend = performanceMetrics.length > 0 
    ? generateMockPerformanceData(selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90)
    : [];

  const trendChartData: ChartData = {
    labels: performanceTrend.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Tasks Completed',
        data: performanceTrend.map(d => d.value),
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        fill: true,
      },
      {
        label: 'Target',
        data: performanceTrend.map(d => d.target || 80),
        backgroundColor: 'transparent',
        borderColor: 'rgba(239, 68, 68, 0.8)',
        borderWidth: 1,
        borderDash: [5, 5],
      }
    ]
  };

  // Calculate summary metrics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const avgEfficiency = employeeMetrics.length > 0 
    ? employeeMetrics.reduce((sum: number, emp: typeof employeeMetrics[0]) => sum + emp.avgEfficiency, 0) / employeeMetrics.length 
    : 0;
  const topPerformer = employeeMetrics.length > 0 
    ? Math.max(...employeeMetrics.map(emp => emp.avgEfficiency)) 
    : 0;

  const topPerformers = sortBy(employeeMetrics, 'avgEfficiency', 'desc').slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
        <span className="ml-3 text-white">Loading employee analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Employee Analytics</h1>
          <p className="text-gray-400 mt-2">Performance metrics and productivity insights</p>
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
        <h2 className="text-xl font-semibold text-white mb-4">Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Employees"
            value={totalEmployees}
            change={2.1}
            changeType="increase"
            trend="up"
            icon={<Users size={20} />}
            description="Active team members"
          />
          <MetricCard
            title="Average Efficiency"
            value={Math.round(avgEfficiency * 10) / 10}
            unit="%"
            change={5.3}
            changeType="increase"
            trend="up"
            icon={<TrendingUp size={20} />}
            description="Team efficiency rating"
          />
          <MetricCard
            title="Active Employees"
            value={activeEmployees}
            change={1.8}
            changeType="increase"
            trend="up"
            icon={<Clock size={20} />}
            description="Currently working"
          />
          <MetricCard
            title="Top Performance"
            value={Math.round(topPerformer * 10) / 10}
            unit="%"
            change={8.7}
            changeType="increase"
            trend="up"
            icon={<Award size={20} />}
            description="Highest individual score"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Team Performance Trend"
          data={trendChartData}
          type="line"
          height={300}
        />
        <Chart
          title="Department Performance"
          data={departmentChartData}
          type="bar"
          height={300}
        />
      </div>

      {/* Top Performers */}
      <div className="glass-card rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Performers</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topPerformers.map((employee, index) => (
            <div key={employee.id} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-xl">#{index + 1}</span>
              </div>
              <h4 className="text-white font-medium text-sm">{employee.firstName} {employee.lastName}</h4>
              <p className="text-gray-400 text-xs">{employee.department}</p>
              <p className="text-green-400 text-sm font-semibold mt-1">
                {Math.round(employee.avgEfficiency * 10) / 10}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Table */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Employee Performance Details</h2>
        <DataTable
          data={employeeMetrics}
          columns={[
            { key: 'firstName', label: 'First Name', sortable: true },
            { key: 'lastName', label: 'Last Name', sortable: true },
            { key: 'department', label: 'Department', sortable: true },
            { key: 'position', label: 'Position', sortable: true },
            { key: 'avgTasks', label: 'Avg Tasks/Day', sortable: true, align: 'right' },
            { key: 'avgQuality', label: 'Quality Score', sortable: true, align: 'right', render: (value) => `${Math.round(value * 10) / 10}%` },
            { key: 'avgEfficiency', label: 'Efficiency', sortable: true, align: 'right', render: (value) => `${Math.round(value * 10) / 10}%` },
            { key: 'totalDaysWorked', label: 'Days Tracked', sortable: true, align: 'right' },
            { key: 'status', label: 'Status', sortable: true, render: (value) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {value}
              </span>
            )},
          ]}
          pageSize={15}
        />
      </div>
    </div>
  );
};

export default EmployeeAnalytics;