'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  SecurityAlert,
  SecurityMonitoringRule,
  SecurityAuditLog,
  UserBehaviorAnalytics,
  SecurityIncident
} from '@/types/database';
import { 
  Shield,
  AlertTriangle,
  Activity,
  Eye,
  Bell,
  Clock,
  TrendingUp,
  TrendingDown,
  Monitor,
  Zap,
  Target,
  Globe,
  Users,
  Database,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Play,
  Pause,
  Stop,
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  LineChart,
  PieChart,
  MapPin,
  Smartphone,
  Laptop,
  Server,
  Wifi,
  WifiOff,
  ArrowUp,
  ArrowDown,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { format, subHours, subDays, isToday, isYesterday } from 'date-fns';

interface MonitoringStats {
  activeAlerts: number;
  criticalAlerts: number;
  activeRules: number;
  totalRules: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  incidentsToday: number;
  anomaliesDetected: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  coveragePercentage: number;
}

interface ThreatMetrics {
  period: string;
  threats: number;
  blocked: number;
  allowed: number;
  falsePositives: number;
}

interface GeographicThreat {
  country: string;
  city: string;
  threatCount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  coordinates: [number, number];
}

export default function SecurityMonitoringPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MonitoringStats>({
    activeAlerts: 0,
    criticalAlerts: 0,
    activeRules: 0,
    totalRules: 0,
    threatLevel: 'low',
    incidentsToday: 0,
    anomaliesDetected: 0,
    systemHealth: 'healthy',
    coveragePercentage: 0
  });
  
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [rules, setRules] = useState<SecurityMonitoringRule[]>([]);
  const [recentActivity, setRecentActivity] = useState<SecurityAuditLog[]>([]);
  const [anomalies, setAnomalies] = useState<UserBehaviorAnalytics[]>([]);
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'alerts' | 'rules' | 'threats' | 'analytics'>('dashboard');
  const [timeRange, setTimeRange] = useState('24h'); // 1h, 24h, 7d, 30d
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchMonitoringData();
      
      // Set up real-time updates if enabled
      if (realTimeEnabled) {
        const interval = setInterval(fetchMonitoringData, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
      }
    }
  }, [profile, timeRange, realTimeEnabled]);

  const fetchMonitoringData = async () => {
    if (!profile?.organization_id) return;
    
    try {
      setRefreshing(true);

      // Calculate time range
      const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const startDate = subHours(new Date(), hours).toISOString();

      // Fetch security alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      // Fetch monitoring rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('security_monitoring_rules')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (rulesError) throw rulesError;

      // Fetch recent security activity
      const { data: activityData, error: activityError } = await supabase
        .from('security_audit_logs')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activityError) throw activityError;

      // Fetch behavior anomalies
      const { data: anomaliesData, error: anomaliesError } = await supabase
        .from('user_behavior_analytics')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_anomaly', true)
        .gte('analyzed_at', startDate)
        .order('analyzed_at', { ascending: false });

      if (anomaliesError) throw anomaliesError;

      // Fetch incidents for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('security_incidents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .gte('created_at', today.toISOString());

      if (incidentsError) throw incidentsError;

      // Update state
      setAlerts(alertsData || []);
      setRules(rulesData || []);
      setRecentActivity(activityData || []);
      setAnomalies(anomaliesData || []);
      
      // Calculate statistics
      const monitoringStats = calculateMonitoringStats(
        alertsData || [],
        rulesData || [],
        anomaliesData || [],
        incidentsData as any // count query
      );
      setStats(monitoringStats);

    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const calculateMonitoringStats = (
    alertsData: SecurityAlert[],
    rulesData: SecurityMonitoringRule[],
    anomaliesData: UserBehaviorAnalytics[],
    incidentsCount: any
  ): MonitoringStats => {
    const activeAlerts = alertsData.filter(a => a.status === 'open').length;
    const criticalAlerts = alertsData.filter(a => a.severity_level === 'critical' && a.status === 'open').length;
    const activeRules = rulesData.filter(r => r.is_active).length;
    const totalRules = rulesData.length;
    
    // Determine threat level
    let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalAlerts > 5) threatLevel = 'critical';
    else if (criticalAlerts > 2 || activeAlerts > 10) threatLevel = 'high';
    else if (criticalAlerts > 0 || activeAlerts > 5) threatLevel = 'medium';
    
    // System health
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (threatLevel === 'critical') systemHealth = 'critical';
    else if (threatLevel === 'high') systemHealth = 'warning';
    
    // Coverage percentage (how many systems have active monitoring)
    const coveragePercentage = totalRules > 0 ? Math.round((activeRules / 25) * 100) : 0; // Assume 25 total systems
    
    return {
      activeAlerts,
      criticalAlerts,
      activeRules,
      totalRules,
      threatLevel,
      incidentsToday: incidentsCount?.count || 0,
      anomaliesDetected: anomaliesData.length,
      systemHealth,
      coveragePercentage: Math.min(coveragePercentage, 100)
    };
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <Info className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open': return 'text-red-700 bg-red-50 border-red-200';
      case 'acknowledged': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'resolved': return 'text-green-700 bg-green-50 border-green-200';
      case 'false_positive': return 'text-gray-700 bg-gray-50 border-gray-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getThreatLevelColor = (level: string): string => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    if (isToday(date)) return `Today ${format(date, 'HH:mm')}`;
    if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
    return format(date, 'MMM dd, HH:mm');
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ 
          status: 'acknowledged',
          acknowledged_by: profile?.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      await fetchMonitoringData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ 
          status: 'resolved',
          resolved_by: profile?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      await fetchMonitoringData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('security_monitoring_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);

      if (error) throw error;
      await fetchMonitoringData();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'all' || alert.severity_level === filterSeverity;
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    return matchesSeverity && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-glass-light rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-glass-light rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Security Monitoring & Threat Detection</h1>
          <p className="text-body text-neutral-700 mt-1">
            Real-time security monitoring, threat detection, and incident response
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Real-time toggle */}
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              realTimeEnabled 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {realTimeEnabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            Real-time {realTimeEnabled ? 'ON' : 'OFF'}
          </button>
          
          {/* Time Range Selector */}
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg bg-white text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button
            onClick={fetchMonitoringData}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Threat Level Alert */}
      {stats.threatLevel !== 'low' && (
        <div className={`glass-card p-4 border-l-4 ${
          stats.threatLevel === 'critical' ? 'border-red-500 bg-red-50' :
          stats.threatLevel === 'high' ? 'border-orange-500 bg-orange-50' :
          'border-yellow-500 bg-yellow-50'
        }`}>
          <div className="flex items-start gap-3">
            <Target className={`w-5 h-5 mt-0.5 ${
              stats.threatLevel === 'critical' ? 'text-red-600' :
              stats.threatLevel === 'high' ? 'text-orange-600' :
              'text-yellow-600'
            }`} />
            <div>
              <h3 className={`font-semibold ${
                stats.threatLevel === 'critical' ? 'text-red-900' :
                stats.threatLevel === 'high' ? 'text-orange-900' :
                'text-yellow-900'
              }`}>
                {stats.threatLevel.toUpperCase()} Threat Level Active
              </h3>
              <p className={`text-sm mt-1 ${
                stats.threatLevel === 'critical' ? 'text-red-800' :
                stats.threatLevel === 'high' ? 'text-orange-800' :
                'text-yellow-800'
              }`}>
                {stats.criticalAlerts} critical alerts and {stats.activeAlerts} total active alerts detected. Immediate attention required.
              </p>
              <div className="flex gap-2 mt-3">
                <Link href="#alerts" className="btn-sm btn-primary">
                  View Alerts
                </Link>
                <Link href="/dashboard/security/incidents/new" className="btn-sm btn-secondary">
                  Create Incident
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Monitoring Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">Active Alerts</p>
              <p className="text-h3 font-bold text-red-600">{stats.activeAlerts}</p>
              <p className="text-tiny text-neutral-600 mt-1">
                {stats.criticalAlerts} critical
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-50">
              <Bell className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${getThreatLevelColor(stats.threatLevel)}`}>
              {stats.threatLevel.toUpperCase()} THREAT
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">Monitoring Rules</p>
              <p className="text-h3 font-bold text-blue-600">{stats.activeRules}</p>
              <p className="text-tiny text-neutral-600 mt-1">
                of {stats.totalRules} total
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${(stats.activeRules / stats.totalRules) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">System Coverage</p>
              <p className="text-h3 font-bold text-green-600">{stats.coveragePercentage}%</p>
              <p className="text-tiny text-neutral-600 mt-1">
                Security monitoring
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.coveragePercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">Anomalies Detected</p>
              <p className="text-h3 font-bold text-purple-600">{stats.anomaliesDetected}</p>
              <p className="text-tiny text-neutral-600 mt-1">
                {timeRange} period
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-xs px-2 py-1 rounded-full ${
              stats.systemHealth === 'healthy' ? 'bg-green-100 text-green-700' :
              stats.systemHealth === 'warning' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {stats.systemHealth.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card p-6">
        <div className="border-b border-neutral-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', label: 'Overview', icon: Monitor },
              { id: 'alerts', label: 'Active Alerts', icon: Bell, badge: stats.activeAlerts },
              { id: 'rules', label: 'Monitoring Rules', icon: Eye },
              { id: 'threats', label: 'Threat Analysis', icon: Target },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm relative ${
                  selectedTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {selectedTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Alerts */}
              <div className="border border-neutral-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Recent Alerts</h3>
                  <Link href="#" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                    View All
                  </Link>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200">
                      <div className={`p-1 rounded ${getSeverityColor(alert.severity_level)}`}>
                        {getSeverityIcon(alert.severity_level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 text-sm truncate">{alert.title}</p>
                        <p className="text-neutral-600 text-xs mt-1">{alert.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-tiny text-neutral-500">{formatRelativeTime(alert.created_at)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-tiny font-medium ${getStatusColor(alert.status)}`}>
                            {alert.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {alerts.length === 0 && (
                    <div className="text-center py-8">
                      <Bell className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-neutral-600 text-sm">No recent alerts</p>
                    </div>
                  )}
                </div>
              </div>

              {/* System Health */}
              <div className="border border-neutral-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">System Health</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    stats.systemHealth === 'healthy' ? 'bg-green-100 text-green-700' :
                    stats.systemHealth === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {stats.systemHealth.toUpperCase()}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-700">Monitoring Coverage</span>
                    <span className="text-sm font-medium text-neutral-900">{stats.coveragePercentage}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{ width: `${stats.coveragePercentage}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-700">Active Rules</span>
                    <span className="text-sm font-medium text-neutral-900">{stats.activeRules}/{stats.totalRules}</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(stats.activeRules / stats.totalRules) * 100}%` }}
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-neutral-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">{stats.activeRules}</p>
                        <p className="text-xs text-neutral-600">Active Rules</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{stats.activeAlerts}</p>
                        <p className="text-xs text-neutral-600">Alerts</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">{stats.anomaliesDetected}</p>
                        <p className="text-xs text-neutral-600">Anomalies</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Security Activity */}
            <div className="border border-neutral-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">Recent Security Activity</h3>
                <Link href="/dashboard/security/audit-logs" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                  View Audit Logs
                </Link>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentActivity.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-neutral-50">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.risk_score > 70 ? 'bg-red-500' :
                      activity.risk_score > 40 ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-900 truncate">
                        {activity.event_type} - {activity.action} on {activity.resource_type}
                      </p>
                      <p className="text-xs text-neutral-500">{formatRelativeTime(activity.created_at)}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.risk_score > 70 ? 'bg-red-100 text-red-700' :
                      activity.risk_score > 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                      Risk: {activity.risk_score}
                    </span>
                  </div>
                ))}
                
                {recentActivity.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-neutral-600 text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {selectedTab === 'alerts' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
              </select>
            </div>

            {/* Alerts List */}
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div key={alert.id} className="border border-neutral-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity_level)}`}>
                          {getSeverityIcon(alert.severity_level)}
                          <span className="ml-1">{alert.severity_level.toUpperCase()}</span>
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(alert.status)}`}>
                          {alert.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-neutral-500">{formatRelativeTime(alert.created_at)}</span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{alert.title}</h3>
                      <p className="text-neutral-700 mb-4">{alert.description}</p>
                      
                      {alert.event_data && (
                        <div className="bg-neutral-50 rounded-lg p-3 mb-4">
                          <h4 className="text-sm font-medium text-neutral-700 mb-2">Event Details:</h4>
                          <pre className="text-xs text-neutral-600 overflow-x-auto">
                            {JSON.stringify(alert.event_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {alert.status === 'open' && (
                        <>
                          <button
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            className="btn-sm btn-secondary"
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="btn-sm btn-primary"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                      
                      <Link href={`/dashboard/security/alerts/${alert.id}`} className="btn-sm btn-secondary">
                        <Eye className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredAlerts.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No alerts found</h3>
                  <p className="text-neutral-600">
                    {alerts.length === 0 ? 'No security alerts detected' : 'No alerts match the selected filters'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other tabs placeholder */}
        {selectedTab === 'rules' && (
          <div className="text-center py-12">
            <Eye className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Monitoring Rules Management</h3>
            <p className="text-neutral-600">Rules configuration interface coming soon...</p>
          </div>
        )}

        {selectedTab === 'threats' && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Threat Analysis</h3>
            <p className="text-neutral-600">Advanced threat analysis interface coming soon...</p>
          </div>
        )}

        {selectedTab === 'analytics' && (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Security Analytics</h3>
            <p className="text-neutral-600">Analytics dashboard coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}