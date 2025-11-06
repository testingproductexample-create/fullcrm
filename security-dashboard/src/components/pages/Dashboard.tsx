import React from 'react';
import { useSecurity } from '../../context/SecurityContext';
import SecurityMetrics from '../components/SecurityMetrics';
import ThreatOverview from '../components/ThreatOverview';
import ComplianceStatus from '../components/ComplianceStatus';
import RecentActivity from '../components/RecentActivity';
import SecurityHealth from '../components/SecurityHealth';
import TopThreats from '../components/TopThreats';
import SystemStatus from '../components/SystemStatus';

const Dashboard: React.FC = () => {
  const { metrics, alerts, compliance, events } = useSecurity();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Overview</h1>
          <p className="text-white/60 mt-1">Real-time security monitoring and threat intelligence</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-white/60">Last Updated</p>
            <p className="text-sm text-white font-medium">{new Date().toLocaleTimeString()}</p>
          </div>
          <div className="w-3 h-3 bg-green-500 rounded-full pulse-glow"></div>
        </div>
      </div>

      {/* Security Metrics Grid */}
      <SecurityMetrics metrics={metrics} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Threat Overview */}
          <ThreatOverview alerts={alerts} />
          
          {/* Security Health */}
          <SecurityHealth />
          
          {/* Top Threats */}
          <TopThreats />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* System Status */}
          <SystemStatus />
          
          {/* Compliance Status */}
          <ComplianceStatus compliance={compliance} />
          
          {/* Recent Activity */}
          <RecentActivity events={events} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;