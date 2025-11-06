'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  SecurityDashboardData,
  SecurityIncident,
  SecurityAlert,
  SecurityAuditLog,
  CybersecurityCompliance
} from '@/types/database';
import { 
  Shield,
  AlertTriangle,
  Lock,
  Users,
  Activity,
  Eye,
  Settings,
  FileCheck,
  Database,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  BarChart3,
  Globe,
  Smartphone,
  Monitor,
  UserCheck,
  Key,
  Bell,
  FileText,
  Calendar,
  Filter,
  Download,
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { format, subDays, isToday, isYesterday } from 'date-fns';

interface SecurityStats {
  totalIncidents: number;
  activeIncidents: number;
  criticalAlerts: number;
  totalAlerts: number;
  complianceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  activeSessions: number;
  failedLogins: number;
  mfaAdoption: number;
  dataBreaches: number;
  lastBackup: string | null;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface RecentActivity {
  id: string;
  type: 'incident' | 'alert' | 'audit' | 'compliance';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  user?: string;
  action?: string;
}

export default function SecurityDashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<SecurityDashboardData | null>(null);
  const [stats, setStats] = useState<SecurityStats>({
    totalIncidents: 0,
    activeIncidents: 0,
    criticalAlerts: 0,
    totalAlerts: 0,
    complianceScore: 0,
    riskLevel: 'low',
    activeSessions: 0,
    failedLogins: 0,
    mfaAdoption: 0,
    dataBreaches: 0,
    lastBackup: null,
    systemHealth: 'healthy'
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [timeRange, setTimeRange] = useState('7d'); // 1d, 7d, 30d, 90d
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchSecurityDashboardData();
    }
  }, [profile, timeRange]);

  const fetchSecurityDashboardData = async () => {
    if (!profile?.organization_id) return;
    
    try {
      setLoading(true);
      setRefreshing(true);

      // Calculate date range
      const days = parseInt(timeRange.replace('d', ''));
      const startDate = subDays(new Date(), days).toISOString();

      // Fetch security incidents
      const { data: incidents, error: incidentsError } = await supabase
        .from('security_incidents')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (incidentsError) throw incidentsError;

      // Fetch security alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      // Fetch audit logs (recent activity)
      const { data: auditLogs, error: auditError } = await supabase
        .from('security_audit_logs')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(20);

      if (auditError) throw auditError;

      // Fetch compliance data
      const { data: compliance, error: complianceError } = await supabase
        .from('cybersecurity_compliance')
        .select('*')
        .eq('organization_id', profile.organization_id);

      if (complianceError) throw complianceError;

      // Fetch additional security metrics
      await fetchSecurityStats(profile.organization_id);

      // Process dashboard data
      const processedData: SecurityDashboardData = {
        incidents: incidents || [],
        alerts: alerts || [],
        auditLogs: auditLogs || [],
        compliance: compliance || [],
        stats: calculateSecurityStats(incidents || [], alerts || [], compliance || [])
      };

      setDashboardData(processedData);
      
      // Process recent activity
      const activity = processRecentActivity(incidents || [], alerts || [], auditLogs || []);
      setRecentActivity(activity);

    } catch (error) {
      console.error('Error fetching security dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSecurityStats = async (organizationId: string) => {
    try {
      // Fetch active sessions count
      const { count: sessionCount } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      // Fetch failed login attempts (last 24h)
      const yesterday = subDays(new Date(), 1).toISOString();
      const { count: failedLoginCount } = await supabase
        .from('failed_login_attempts')
        .select('*', { count: 'exact', head: true })
        .gte('last_attempt_at', yesterday);

      // Fetch MFA adoption rate
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      const { count: mfaUsers } = await supabase
        .from('mfa_settings')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_enabled', true);

      // Fetch last backup info
      const { data: lastBackupData } = await supabase
        .from('data_backups')
        .select('completed_at')
        .eq('organization_id', organizationId)
        .eq('backup_status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      setStats(prev => ({
        ...prev,
        activeSessions: sessionCount || 0,
        failedLogins: failedLoginCount || 0,
        mfaAdoption: totalUsers > 0 ? Math.round(((mfaUsers || 0) / totalUsers) * 100) : 0,
        lastBackup: lastBackupData?.completed_at || null
      }));

    } catch (error) {
      console.error('Error fetching security stats:', error);
    }
  };

  const calculateSecurityStats = (
    incidents: SecurityIncident[],
    alerts: SecurityAlert[],
    compliance: CybersecurityCompliance[]
  ) => {
    const activeIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length;
    const criticalAlerts = alerts.filter(a => a.severity_level === 'critical' && a.status === 'open').length;
    
    // Calculate compliance score
    const implementedControls = compliance.filter(c => c.implementation_status === 'implemented').length;
    const totalControls = compliance.length;
    const complianceScore = totalControls > 0 ? Math.round((implementedControls / totalControls) * 100) : 0;
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalAlerts > 5 || activeIncidents > 10) riskLevel = 'critical';
    else if (criticalAlerts > 2 || activeIncidents > 5) riskLevel = 'high';
    else if (criticalAlerts > 0 || activeIncidents > 2) riskLevel = 'medium';

    setStats(prev => ({
      ...prev,
      totalIncidents: incidents.length,
      activeIncidents,
      criticalAlerts,
      totalAlerts: alerts.length,
      complianceScore,
      riskLevel,
      dataBreaches: incidents.filter(i => i.incident_type === 'data_breach').length,
      systemHealth: riskLevel === 'critical' ? 'critical' : riskLevel === 'high' ? 'warning' : 'healthy'
    }));

    return {
      activeIncidents,
      criticalAlerts,
      complianceScore,
      riskLevel
    };
  };

  const processRecentActivity = (
    incidents: SecurityIncident[],
    alerts: SecurityAlert[],
    auditLogs: SecurityAuditLog[]
  ): RecentActivity[] => {
    const activity: RecentActivity[] = [];

    // Add incidents
    incidents.slice(0, 5).forEach(incident => {
      activity.push({
        id: incident.id,
        type: 'incident',
        title: incident.title,
        description: incident.description || 'Security incident detected',
        severity: incident.severity_level,
        timestamp: incident.created_at
      });
    });

    // Add alerts
    alerts.slice(0, 5).forEach(alert => {
      activity.push({
        id: alert.id,
        type: 'alert',
        title: alert.title,
        description: alert.description || 'Security alert triggered',
        severity: alert.severity_level as any,
        timestamp: alert.created_at
      });
    });

    // Add audit logs
    auditLogs.slice(0, 10).forEach(log => {
      activity.push({
        id: log.id,
        type: 'audit',
        title: `${log.event_type} - ${log.action}`,
        description: `${log.resource_type || 'System'} ${log.action}`,
        severity: log.risk_score > 70 ? 'high' : log.risk_score > 40 ? 'medium' : 'low',
        timestamp: log.created_at,
        user: log.user_id,
        action: log.action
      });
    });

    // Sort by timestamp and return recent 15
    return activity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15);
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'incident': return <Shield className="w-4 h-4" />;
      case 'alert': return <Bell className="w-4 h-4" />;
      case 'audit': return <Activity className="w-4 h-4" />;
      case 'compliance': return <FileCheck className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getRiskLevelColor = (level: string): string => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-glass-light rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-glass-light rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-glass-light rounded-lg animate-pulse"></div>
          <div className="h-96 bg-glass-light rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Security & Compliance Dashboard</h1>
          <p className="text-body text-neutral-700 mt-1">
            Monitor security posture, incidents, and UAE compliance status
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg bg-white text-sm"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <button
            onClick={fetchSecurityDashboardData}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Security Risk Level Alert */}
      {stats.riskLevel !== 'low' && (
        <div className={`glass-card p-4 border-l-4 ${
          stats.riskLevel === 'critical' ? 'border-red-500 bg-red-50' :
          stats.riskLevel === 'high' ? 'border-orange-500 bg-orange-50' :
          'border-yellow-500 bg-yellow-50'
        }`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 mt-0.5 ${
              stats.riskLevel === 'critical' ? 'text-red-600' :
              stats.riskLevel === 'high' ? 'text-orange-600' :
              'text-yellow-600'
            }`} />
            <div>
              <h3 className={`font-semibold ${
                stats.riskLevel === 'critical' ? 'text-red-900' :
                stats.riskLevel === 'high' ? 'text-orange-900' :
                'text-yellow-900'
              }`}>
                {stats.riskLevel.toUpperCase()} Security Risk Detected
              </h3>
              <p className={`text-sm mt-1 ${
                stats.riskLevel === 'critical' ? 'text-red-800' :
                stats.riskLevel === 'high' ? 'text-orange-800' :
                'text-yellow-800'
              }`}>
                {stats.activeIncidents} active incident{stats.activeIncidents !== 1 ? 's' : ''} and {stats.criticalAlerts} critical alert{stats.criticalAlerts !== 1 ? 's' : ''} require immediate attention.
              </p>
              <div className="flex gap-2 mt-3">
                <Link href="/dashboard/security/incidents" className="btn-sm btn-primary">
                  View Incidents
                </Link>
                <Link href="/dashboard/security/alerts" className="btn-sm btn-secondary">
                  View Alerts
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Security Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Incidents */}
        <div className="glass-card p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">Active Incidents</p>
              <p className="text-h3 font-bold text-red-600">{stats.activeIncidents}</p>
              <p className="text-tiny text-neutral-600 mt-1">
                {stats.totalIncidents} total ({timeRange})
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-50">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link href="/dashboard/security/incidents" className="text-sm text-red-600 hover:text-red-700 font-medium">
              Manage Incidents →
            </Link>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="glass-card p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">Critical Alerts</p>
              <p className="text-h3 font-bold text-orange-600">{stats.criticalAlerts}</p>
              <p className="text-tiny text-neutral-600 mt-1">
                {stats.totalAlerts} total alerts
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link href="/dashboard/security/alerts" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
              View Alerts →
            </Link>
          </div>
        </div>

        {/* Compliance Score */}
        <div className="glass-card p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">UAE Compliance</p>
              <p className="text-h3 font-bold text-primary-600">{stats.complianceScore}%</p>
              <p className="text-tiny text-neutral-600 mt-1">
                CSA Framework
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary-50">
              <FileCheck className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link href="/dashboard/security/compliance" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View Compliance →
            </Link>
          </div>
        </div>

        {/* System Health */}
        <div className="glass-card p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">System Health</p>
              <p className={`text-h3 font-bold ${
                stats.systemHealth === 'healthy' ? 'text-green-600' :
                stats.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {stats.systemHealth === 'healthy' ? 'Healthy' :
                 stats.systemHealth === 'warning' ? 'Warning' : 'Critical'}
              </p>
              <p className="text-tiny text-neutral-600 mt-1">
                MFA: {stats.mfaAdoption}% adoption
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              stats.systemHealth === 'healthy' ? 'bg-green-50' :
              stats.systemHealth === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
            }`}>
              <Activity className={`w-6 h-6 ${
                stats.systemHealth === 'healthy' ? 'text-green-600' :
                stats.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </div>
          <div className="mt-4">
            <Link href="/dashboard/security/settings" className="text-sm text-neutral-600 hover:text-neutral-700 font-medium">
              Security Settings →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/security/authentication" className="glass-card p-4 glass-card-hover group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900">Authentication</h3>
              <p className="text-sm text-neutral-600">MFA & Access Control</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/security/data-protection" className="glass-card p-4 glass-card-hover group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900">Data Protection</h3>
              <p className="text-sm text-neutral-600">Encryption & Privacy</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/security/monitoring" className="glass-card p-4 glass-card-hover group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors">
              <Monitor className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900">Monitoring</h3>
              <p className="text-sm text-neutral-600">Real-time Security</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/security/audit-logs" className="glass-card p-4 glass-card-hover group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50 group-hover:bg-orange-100 transition-colors">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900">Audit Logs</h3>
              <p className="text-sm text-neutral-600">Activity Tracking</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Security Activity */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-large font-semibold text-neutral-900">Recent Security Activity</h3>
            <Link href="/dashboard/security/audit-logs" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
              View All
            </Link>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600">No recent security activity</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50">
                  <div className={`p-1 rounded ${getSeverityColor(activity.severity)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 text-sm truncate">{activity.title}</p>
                    <p className="text-neutral-600 text-xs mt-1">{activity.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-tiny text-neutral-500">{formatRelativeTime(activity.timestamp)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-tiny font-medium ${getSeverityColor(activity.severity)}`}>
                        {activity.severity}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Metrics & Charts */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-large font-semibold text-neutral-900">Security Metrics</h3>
            <select 
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="text-sm border border-neutral-300 rounded px-3 py-1"
            >
              <option value="overview">Overview</option>
              <option value="incidents">Incidents</option>
              <option value="authentication">Authentication</option>
              <option value="compliance">Compliance</option>
            </select>
          </div>

          <div className="space-y-4">
            {/* Key Security Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-neutral-50">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-neutral-600" />
                  <span className="text-sm font-medium text-neutral-700">Active Sessions</span>
                </div>
                <p className="text-xl font-bold text-neutral-900">{stats.activeSessions}</p>
              </div>
              
              <div className="p-3 rounded-lg bg-neutral-50">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-neutral-600" />
                  <span className="text-sm font-medium text-neutral-700">Failed Logins (24h)</span>
                </div>
                <p className="text-xl font-bold text-neutral-900">{stats.failedLogins}</p>
              </div>
              
              <div className="p-3 rounded-lg bg-neutral-50">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-neutral-600" />
                  <span className="text-sm font-medium text-neutral-700">MFA Adoption</span>
                </div>
                <p className="text-xl font-bold text-neutral-900">{stats.mfaAdoption}%</p>
              </div>
              
              <div className="p-3 rounded-lg bg-neutral-50">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-neutral-600" />
                  <span className="text-sm font-medium text-neutral-700">Last Backup</span>
                </div>
                <p className="text-sm font-medium text-neutral-900">
                  {stats.lastBackup ? formatRelativeTime(stats.lastBackup) : 'No backups'}
                </p>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="p-4 rounded-lg border border-neutral-200">
              <h4 className="font-medium text-neutral-900 mb-3">Current Risk Assessment</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-700">Overall Risk Level</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(stats.riskLevel)}`}>
                  {stats.riskLevel.toUpperCase()}
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    stats.riskLevel === 'critical' ? 'bg-red-500' :
                    stats.riskLevel === 'high' ? 'bg-orange-500' :
                    stats.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${
                      stats.riskLevel === 'critical' ? 100 :
                      stats.riskLevel === 'high' ? 75 :
                      stats.riskLevel === 'medium' ? 50 : 25
                    }%` 
                  }}
                />
              </div>
              <p className="text-xs text-neutral-600 mt-2">
                Based on active incidents, alerts, and system vulnerabilities
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/security/incidents/new" className="btn-sm btn-primary">
                <Plus className="w-3 h-3 mr-1" />
                Report Incident
              </Link>
              <Link href="/dashboard/security/backup" className="btn-sm btn-secondary">
                <Database className="w-3 h-3 mr-1" />
                Backup Now
              </Link>
              <Link href="/dashboard/security/scan" className="btn-sm btn-secondary">
                <Search className="w-3 h-3 mr-1" />
                Security Scan
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-large font-semibold text-neutral-900">UAE Compliance Status</h3>
          <Link href="/dashboard/security/compliance" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
            Full Compliance Report →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-neutral-200">
            <div className="flex items-center gap-3 mb-3">
              <Globe className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-neutral-900">PDPL Compliance</h4>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">92%</span>
              <span className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +5% this month
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-1">Data protection compliance</p>
          </div>

          <div className="p-4 rounded-lg border border-neutral-200">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-neutral-900">CSA Framework</h4>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-purple-600">{stats.complianceScore}%</span>
              <span className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +3% this month
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-1">Cybersecurity standards</p>
          </div>

          <div className="p-4 rounded-lg border border-neutral-200">
            <div className="flex items-center gap-3 mb-3">
              <FileCheck className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-neutral-900">Data Governance</h4>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600">87%</span>
              <span className="text-sm text-red-600 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                -2% this month
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-1">Data handling policies</p>
          </div>
        </div>
      </div>
    </div>
  );
}