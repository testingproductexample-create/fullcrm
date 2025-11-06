/**
 * Real-time Monitoring Dashboard
 * Comprehensive interface for security event monitoring, user behavior analytics, and system health
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  Eye, 
  Lock,
  Clock,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface AuditLog {
  id: string;
  event_id: string;
  user_id: string;
  event_type: string;
  event_category: string;
  action: string;
  risk_level: string;
  status: string;
  timestamp: string;
  details: any;
  ip_address: string;
  user_agent: string;
}

interface SecurityEvent {
  id: string;
  event_id: string;
  event_type: string;
  severity: string;
  resolved: boolean;
  created_at: string;
  details: any;
  source_ip: string;
}

interface FailedLogin {
  id: string;
  email: string;
  ip_address: string;
  failure_reason: string;
  blocked: boolean;
  created_at: string;
}

interface UserAnalytics {
  user_id: string;
  event_date: string;
  session_count: number;
  total_actions: number;
  login_count: number;
  failed_login_count: number;
  risk_score: number;
}

interface Anomaly {
  id: string;
  anomaly_type: string;
  severity: string;
  status: string;
  created_at: string;
  description: string;
  user_id: string;
}

export default function MonitoringDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [failedLogins, setFailedLogins] = useState<FailedLogin[]>([]);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    status: 'all',
    timeRange: '24h',
    eventType: 'all'
  });

  // Real-time data fetching
  const fetchData = useCallback(async () => {
    try {
      const [auditRes, securityRes, failedRes, analyticsRes, anomalyRes] = await Promise.all([
        fetch('/api/audit/logs?limit=100&' + new URLSearchParams(filters)),
        fetch('/api/audit/security-events'),
        fetch('/api/audit/failed-logins'),
        fetch('/api/audit/user-analytics'),
        fetch('/api/audit/anomalies')
      ]);

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.data || []);
      }

      if (securityRes.ok) {
        const securityData = await securityRes.json();
        setSecurityEvents(securityData.data || []);
      }

      if (failedRes.ok) {
        const failedData = await failedRes.json();
        setFailedLogins(failedData.data || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setUserAnalytics(analyticsData.data || []);
      }

      if (anomalyRes.ok) {
        const anomalyData = await anomalyRes.json();
        setAnomalies(anomalyData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'critical': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'critical': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'partial': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Security Monitoring Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'audit-logs', label: 'Audit Logs', icon: Eye },
              { id: 'security-events', label: 'Security Events', icon: Shield },
              { id: 'failed-logins', label: 'Failed Logins', icon: Lock },
              { id: 'analytics', label: 'User Analytics', icon: TrendingUp },
              { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewDashboard 
              securityEvents={securityEvents}
              failedLogins={failedLogins}
              userAnalytics={userAnalytics}
              anomalies={anomalies}
            />}
            
            {activeTab === 'audit-logs' && <AuditLogsView 
              logs={auditLogs}
              filters={filters}
              setFilters={setFilters}
            />}
            
            {activeTab === 'security-events' && <SecurityEventsView 
              events={securityEvents}
            />}
            
            {activeTab === 'failed-logins' && <FailedLoginsView 
              failedLogins={failedLogins}
            />}
            
            {activeTab === 'analytics' && <UserAnalyticsView 
              analytics={userAnalytics}
            />}
            
            {activeTab === 'anomalies' && <AnomaliesView 
              anomalies={anomalies}
            />}
          </>
        )}
      </div>
    </div>
  );
}

// Overview Dashboard Component
function OverviewDashboard({ 
  securityEvents, 
  failedLogins, 
  userAnalytics, 
  anomalies 
}: {
  securityEvents: SecurityEvent[];
  failedLogins: FailedLogin[];
  userAnalytics: UserAnalytics[];
  anomalies: Anomaly[];
}) {
  const totalSecurityEvents = securityEvents.length;
  const unresolvedSecurityEvents = securityEvents.filter(e => !e.resolved).length;
  const totalFailedLogins = failedLogins.length;
  const highRiskUsers = userAnalytics.filter(u => u.risk_score > 0.7).length;
  const totalAnomalies = anomalies.length;
  const openAnomalies = anomalies.filter(a => a.status === 'OPEN').length;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Security Events</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalSecurityEvents} ({unresolvedSecurityEvents} open)
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Lock className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Failed Logins</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalFailedLogins}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">High Risk Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{highRiskUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Anomalies</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalAnomalies} ({openAnomalies} open)
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Security Events</h3>
            <div className="space-y-3">
              {securityEvents.slice(0, 5).map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.event_type}</p>
                    <p className="text-xs text-gray-500">{event.source_ip}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                    {event.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Failed Logins</h3>
            <div className="space-y-3">
              {failedLogins.slice(0, 5).map(login => (
                <div key={login.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{login.email || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{login.ip_address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{login.failure_reason}</p>
                    {login.blocked && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Blocked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Audit Logs View Component
function AuditLogsView({ 
  logs, 
  filters, 
  setFilters 
}: {
  logs: AuditLog[];
  filters: any;
  setFilters: (filters: any) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filters.riskLevel}
            onChange={(e) => setFilters({...filters, riskLevel: e.target.value})}
            className="rounded-md border-gray-300"
          >
            <option value="all">All Risk Levels</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="rounded-md border-gray-300"
          >
            <option value="all">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PARTIAL">Partial</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Audit Logs</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.event_type}</div>
                      <div className="text-sm text-gray-500">{log.event_category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user_id || 'Anonymous'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(log.risk_level)}`}>
                        {log.risk_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(log.status)}
                        <span className="ml-2 text-sm text-gray-900">{log.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Security Events View Component
function SecurityEventsView({ events }: { events: SecurityEvent[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Security Events</h3>
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{event.event_type}</h4>
                      <p className="text-sm text-gray-500">{event.source_ip}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                    {event.resolved ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Resolved
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Open
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {JSON.stringify(event.details, null, 2)}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Failed Logins View Component
function FailedLoginsView({ failedLogins }: { failedLogins: FailedLogin[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Failed Login Attempts</h3>
          <div className="space-y-4">
            {failedLogins.map(login => (
              <div key={login.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Lock className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{login.email || 'Unknown User'}</h4>
                      <p className="text-sm text-gray-500">{login.ip_address}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{login.failure_reason}</span>
                    {login.blocked && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Blocked
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(login.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// User Analytics View Component
function UserAnalyticsView({ analytics }: { analytics: UserAnalytics[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">User Behavior Analytics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logins</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.map(analytic => (
                  <tr key={`${analytic.user_id}-${analytic.event_date}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {analytic.user_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(analytic.event_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {analytic.session_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {analytic.total_actions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {analytic.login_count} ({analytic.failed_login_count} failed)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(analytic.risk_score > 0.7 ? 'HIGH' : 'LOW')}`}>
                        {analytic.risk_score.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Anomalies View Component
function AnomaliesView({ anomalies }: { anomalies: Anomaly[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Anomaly Detection</h3>
          <div className="space-y-4">
            {anomalies.map(anomaly => (
              <div key={anomaly.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{anomaly.anomaly_type}</h4>
                      <p className="text-sm text-gray-500">{anomaly.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.severity}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      anomaly.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                      anomaly.status === 'INVESTIGATED' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {anomaly.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(anomaly.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}