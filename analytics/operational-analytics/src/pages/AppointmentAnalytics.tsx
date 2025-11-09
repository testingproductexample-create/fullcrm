import React from 'react';
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import { useDataStore, useAnalyticsStore } from '../store';
import MetricCard from '../components/MetricCard';
import Chart from '../components/Chart';
import DataTable from '../components/DataTable';

const AppointmentAnalytics: React.FC = () => {
  const { selectedTimeRange } = useAnalyticsStore();

  const mockAppointments = Array.from({ length: 50 }, (_, i) => ({
    id: `apt-${i + 1}`,
    appointmentId: `APT${String(i + 1).padStart(4, '0')}`,
    customerName: `Customer ${i + 1}`,
    appointmentType: ['Consultation', 'Service', 'Meeting', 'Follow-up'][Math.floor(Math.random() * 4)],
    scheduledDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    scheduledTime: `${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 4) * 15).padStart(2, '0')}`,
    durationMinutes: [30, 60, 90, 120][Math.floor(Math.random() * 4)],
    status: ['scheduled', 'completed', 'no_show', 'cancelled'][Math.floor(Math.random() * 4)],
    noShow: Math.random() > 0.8,
  }));

  const totalAppointments = mockAppointments.length;
  const completedAppointments = mockAppointments.filter(apt => apt.status === 'completed').length;
  const noShowAppointments = mockAppointments.filter(apt => apt.noShow).length;
  const noShowRate = totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0;
  const averageDuration = mockAppointments.reduce((sum, apt) => sum + apt.durationMinutes, 0) / totalAppointments;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Appointment Analytics</h1>
          <p className="text-gray-400 mt-2">Scheduling efficiency and no-show tracking</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Scheduling Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Appointments"
            value={totalAppointments}
            change={8.5}
            changeType="increase"
            trend="up"
            icon={<Calendar size={20} />}
            description="Appointments scheduled"
          />
          <MetricCard
            title="Completion Rate"
            value={((completedAppointments / totalAppointments) * 100).toFixed(1)}
            unit="%"
            change={3.2}
            changeType="increase"
            trend="up"
            icon={<Users size={20} />}
            description="Successfully completed"
          />
          <MetricCard
            title="No-Show Rate"
            value={noShowRate.toFixed(1)}
            unit="%"
            change={-2.1}
            changeType="decrease"
            trend="down"
            icon={<AlertCircle size={20} />}
            description="Missed appointments"
          />
          <MetricCard
            title="Avg Duration"
            value={Math.round(averageDuration)}
            unit="min"
            icon={<Clock size={20} />}
            description="Average appointment time"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Appointment Status Distribution"
          data={{
            labels: ['Completed', 'Scheduled', 'No Show', 'Cancelled'],
            datasets: [{
              label: 'Appointments',
              data: [
                completedAppointments,
                mockAppointments.filter(apt => apt.status === 'scheduled').length,
                noShowAppointments,
                mockAppointments.filter(apt => apt.status === 'cancelled').length,
              ],
              backgroundColor: [
                'rgba(34, 197, 94, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(107, 114, 128, 0.8)',
              ],
            }]
          }}
          type="pie"
          height={300}
        />
        
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Schedule Performance</h3>
          <div className="space-y-3">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
              <div key={day} className="flex items-center justify-between">
                <span className="text-gray-300">{day}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div className="w-18 bg-blue-500 h-2 rounded-full" />
                  </div>
                  <span className="text-white text-sm">72%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Appointment Details</h2>
        <DataTable
          data={mockAppointments}
          columns={[
            { key: 'customerName', label: 'Customer', sortable: true },
            { key: 'appointmentType', label: 'Type', sortable: true },
            { key: 'scheduledDate', label: 'Date', sortable: true, render: (value) => new Date(value).toLocaleDateString() },
            { key: 'scheduledTime', label: 'Time', sortable: true },
            { key: 'durationMinutes', label: 'Duration', sortable: true, render: (value) => `${value} min` },
            { key: 'status', label: 'Status', sortable: true, render: (value) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value === 'completed' ? 'bg-green-100 text-green-800' :
                value === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                value === 'no_show' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {value.replace('_', ' ').toUpperCase()}
              </span>
            )},
          ]}
          pageSize={15}
        />
      </div>
    </div>
  );
};

export default AppointmentAnalytics;