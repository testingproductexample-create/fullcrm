import React from 'react';
import { Clock, Calendar, TrendingUp, Users } from 'lucide-react';
import { useDataStore, useAnalyticsStore } from '../store';
import MetricCard from '../components/MetricCard';
import Chart from '../components/Chart';
import DataTable from '../components/DataTable';

const TimeTrackingAnalytics: React.FC = () => {
  const mockTimeData = Array.from({ length: 40 }, (_, i) => ({
    id: `tt-${i + 1}`,
    employeeId: `EMP${String(Math.floor(Math.random() * 25) + 1).padStart(3, '0')}`,
    workDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalHours: 6 + Math.random() * 2,
    overtimeHours: Math.random() > 0.7 ? Math.random() * 3 : 0,
    department: ['Sales', 'Support', 'Development', 'Operations', 'HR'][Math.floor(Math.random() * 5)],
    projectCode: `PRJ${Math.floor(Math.random() * 10) + 1}`,
  }));

  const totalTimeTracked = mockTimeData.reduce((sum, entry) => sum + entry.totalHours, 0);
  const totalOvertime = mockTimeData.reduce((sum, entry) => sum + entry.overtimeHours, 0);
  const avgHoursPerDay = totalTimeTracked / mockTimeData.length;
  const utilizationRate = (totalTimeTracked / (8 * mockTimeData.length)) * 100;
  const overtimePercentage = (totalOvertime / totalTimeTracked) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Time Tracking Analytics</h1>
          <p className="text-gray-400 mt-2">Employee utilization and overtime analysis</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Time Tracking Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Hours Tracked"
            value={Math.round(totalTimeTracked)}
            unit="hrs"
            change={5.8}
            changeType="increase"
            trend="up"
            icon={<Clock size={20} />}
            description="Total work hours"
          />
          <MetricCard
            title="Average Hours/Day"
            value={avgHoursPerDay.toFixed(1)}
            change={2.3}
            changeType="increase"
            trend="up"
            icon={<Calendar size={20} />}
            description="Daily average"
          />
          <MetricCard
            title="Utilization Rate"
            value={utilizationRate.toFixed(1)}
            unit="%"
            change={3.7}
            changeType="increase"
            trend="up"
            icon={<TrendingUp size={20} />}
            description="Time utilization"
          />
          <MetricCard
            title="Overtime Hours"
            value={Math.round(totalOvertime)}
            unit="hrs"
            change={-8.2}
            changeType="decrease"
            trend="down"
            icon={<Clock size={20} />}
            description="Overtime worked"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Hours Distribution by Department"
          data={{
            labels: ['Sales', 'Support', 'Development', 'Operations', 'HR'],
            datasets: [{
              label: 'Total Hours',
              data: mockTimeData.reduce((acc, entry) => {
                acc[entry.department] = (acc[entry.department] || 0) + entry.totalHours;
                return acc;
              }, {} as Record<string, number>),
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
            }]
          }}
          type="bar"
          height={300}
        />
        
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Overtime Analysis</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Total Overtime</span>
              <span className="text-white font-semibold">{Math.round(totalOvertime)} hours</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Overtime Percentage</span>
              <span className="text-yellow-400 font-semibold">{overtimePercentage.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Overtime Days</span>
              <span className="text-white font-semibold">
                {mockTimeData.filter(entry => entry.overtimeHours > 0).length} days
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Avg Overtime/Day</span>
              <span className="text-white font-semibold">
                {mockTimeData.filter(entry => entry.overtimeHours > 0).length > 0 
                  ? (totalOvertime / mockTimeData.filter(entry => entry.overtimeHours > 0).length).toFixed(1)
                  : '0'
                } hours
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Time Tracking Details</h2>
        <DataTable
          data={mockTimeData}
          columns={[
            { key: 'employeeId', label: 'Employee ID', sortable: true },
            { key: 'workDate', label: 'Date', sortable: true, render: (value) => new Date(value).toLocaleDateString() },
            { key: 'department', label: 'Department', sortable: true },
            { key: 'projectCode', label: 'Project', sortable: true },
            { key: 'totalHours', label: 'Total Hours', sortable: true, align: 'right', render: (value) => `${value.toFixed(1)}h` },
            { key: 'overtimeHours', label: 'Overtime', sortable: true, align: 'right', render: (value) => `${value.toFixed(1)}h` },
            { key: 'totalHours', label: 'Efficiency', sortable: true, render: (value) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value >= 8 ? 'bg-green-100 text-green-800' :
                value >= 6 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {value >= 8 ? 'HIGH' : value >= 6 ? 'MEDIUM' : 'LOW'}
              </span>
            )},
          ]}
          pageSize={15}
        />
      </div>
    </div>
  );
};

export default TimeTrackingAnalytics;