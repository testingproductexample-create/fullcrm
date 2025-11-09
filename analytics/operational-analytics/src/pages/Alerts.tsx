import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useDataStore } from '../store';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import { formatDateTime } from '../utils';

const Alerts: React.FC = () => {
  const { systemAlerts } = useDataStore();

  const totalAlerts = systemAlerts.length;
  const criticalAlerts = systemAlerts.filter(alert => alert.severity === 'critical' && !alert.resolved).length;
  const highAlerts = systemAlerts.filter(alert => alert.severity === 'high' && !alert.resolved).length;
  const resolvedAlerts = systemAlerts.filter(alert => alert.resolved).length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle size={16} className="text-red-400" />;
      case 'high': return <AlertTriangle size={16} className="text-orange-400" />;
      case 'medium': return <Info size={16} className="text-yellow-400" />;
      case 'low': return <CheckCircle size={16} className="text-blue-400" />;
      default: return <Info size={16} className="text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Alerts</h1>
          <p className="text-gray-400 mt-2">Automated efficiency reports and notifications</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Alert Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Alerts"
            value={totalAlerts}
            change={-12.3}
            changeType="decrease"
            trend="down"
            icon={<AlertTriangle size={20} />}
            description="All system alerts"
          />
          <MetricCard
            title="Critical Alerts"
            value={criticalAlerts}
            change={-25.0}
            changeType="decrease"
            trend="down"
            icon={<XCircle size={20} />}
            description="High priority issues"
          />
          <MetricCard
            title="High Priority"
            value={highAlerts}
            change={-18.5}
            changeType="decrease"
            trend="down"
            icon={<AlertTriangle size={20} />}
            description="Requires attention"
          />
          <MetricCard
            title="Resolved"
            value={resolvedAlerts}
            change={45.2}
            changeType="increase"
            trend="up"
            icon={<CheckCircle size={20} />}
            description="Issues resolved"
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Alert Details</h2>
        <DataTable
          data={systemAlerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
          columns={[
            { key: 'severity', label: 'Severity', sortable: true, render: (value) => (
              <div className="flex items-center space-x-2">
                {getSeverityIcon(value)}
                <span className={`text-sm font-medium ${getSeverityColor(value)}`}>
                  {value.toUpperCase()}
                </span>
              </div>
            )},
            { key: 'alertType', label: 'Type', sortable: true },
            { key: 'title', label: 'Title', sortable: true },
            { key: 'message', label: 'Message', sortable: true },
            { key: 'sourceTable', label: 'Source', sortable: true },
            { key: 'createdAt', label: 'Created', sortable: true, render: (value) => formatDateTime(value) },
            { key: 'resolved', label: 'Status', sortable: true, render: (value) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {value ? 'RESOLVED' : 'UNRESOLVED'}
              </span>
            )},
            { key: 'resolvedAt', label: 'Resolved At', sortable: true, render: (value) => value ? formatDateTime(value) : 'N/A' },
          ]}
          pageSize={20}
        />
      </div>
    </div>
  );
};

export default Alerts;