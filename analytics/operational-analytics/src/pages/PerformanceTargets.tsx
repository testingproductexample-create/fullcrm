import React from 'react';
import { Target, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { useDataStore, useAnalyticsStore } from '../store';
import MetricCard from '../components/MetricCard';
import Chart from '../components/Chart';
import DataTable from '../components/DataTable';

const PerformanceTargets: React.FC = () => {
  const mockTargets = Array.from({ length: 20 }, (_, i) => ({
    id: `target-${i + 1}`,
    targetName: `Target ${i + 1}`,
    category: ['productivity', 'quality', 'efficiency', 'customer_satisfaction'][Math.floor(Math.random() * 4)],
    metricType: ['tasks_per_day', 'response_time', 'quality_score', 'satisfaction'][Math.floor(Math.random() * 4)],
    targetValue: Math.floor(Math.random() * 100) + 50,
    unit: ['tasks', 'minutes', 'score', 'rating'][Math.floor(Math.random() * 4)],
    department: ['Sales', 'Support', 'Development', 'Operations', 'HR'][Math.floor(Math.random() * 5)],
    status: ['active', 'achieved', 'missed', 'inactive'][Math.floor(Math.random() * 4)],
    progress: Math.random() * 100,
  }));

  const activeTargets = mockTargets.filter(target => target.status === 'active').length;
  const achievedTargets = mockTargets.filter(target => target.status === 'achieved').length;
  const missedTargets = mockTargets.filter(target => target.status === 'missed').length;
  const avgProgress = mockTargets.reduce((sum, target) => sum + target.progress, 0) / mockTargets.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Performance Targets</h1>
          <p className="text-gray-400 mt-2">Goal tracking and achievement analysis</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Target Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Active Targets"
            value={activeTargets}
            icon={<Target size={20} />}
            description="Current active goals"
          />
          <MetricCard
            title="Achieved Targets"
            value={achievedTargets}
            change={15.2}
            changeType="increase"
            trend="up"
            icon={<Award size={20} />}
            description="Goals completed"
          />
          <MetricCard
            title="Missed Targets"
            value={missedTargets}
            change={-8.3}
            changeType="decrease"
            trend="down"
            icon={<AlertCircle size={20} />}
            description="Goals not met"
          />
          <MetricCard
            title="Avg Progress"
            value={avgProgress.toFixed(1)}
            unit="%"
            change={3.7}
            changeType="increase"
            trend="up"
            icon={<TrendingUp size={20} />}
            description="Target progress"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Target Status Distribution"
          data={{
            labels: ['Active', 'Achieved', 'Missed', 'Inactive'],
            datasets: [{
              label: 'Targets',
              data: [
                mockTargets.filter(t => t.status === 'active').length,
                mockTargets.filter(t => t.status === 'achieved').length,
                mockTargets.filter(t => t.status === 'missed').length,
                mockTargets.filter(t => t.status === 'inactive').length,
              ],
              backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(107, 114, 128, 0.8)',
              ],
            }]
          }}
          type="pie"
          height={300}
        />
        
        <Chart
          title="Progress by Category"
          data={{
            labels: ['Productivity', 'Quality', 'Efficiency', 'Satisfaction'],
            datasets: [{
              label: 'Average Progress %',
              data: mockTargets.reduce((acc, target) => {
                if (!acc[target.category]) acc[target.category] = { total: 0, count: 0 };
                acc[target.category].total += target.progress;
                acc[target.category].count += 1;
                return acc;
              }, {} as Record<string, { total: number; count: number }>),
              backgroundColor: 'rgba(168, 85, 247, 0.6)',
              borderColor: 'rgba(168, 85, 247, 1)',
              borderWidth: 1,
            }]
          }}
          type="bar"
          height={300}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Target Details</h2>
        <DataTable
          data={mockTargets}
          columns={[
            { key: 'targetName', label: 'Target Name', sortable: true },
            { key: 'category', label: 'Category', sortable: true },
            { key: 'metricType', label: 'Metric Type', sortable: true },
            { key: 'targetValue', label: 'Target Value', sortable: true, align: 'right' },
            { key: 'unit', label: 'Unit', sortable: true },
            { key: 'department', label: 'Department', sortable: true },
            { key: 'progress', label: 'Progress', sortable: true, align: 'right', render: (value) => `${value.toFixed(1)}%` },
            { key: 'status', label: 'Status', sortable: true, render: (value) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value === 'achieved' ? 'bg-green-100 text-green-800' :
                value === 'active' ? 'bg-blue-100 text-blue-800' :
                value === 'missed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {value.toUpperCase()}
              </span>
            )},
          ]}
          pageSize={15}
        />
      </div>
    </div>
  );
};

export default PerformanceTargets;