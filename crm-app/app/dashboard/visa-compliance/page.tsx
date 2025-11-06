'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users,
  FileText,
  AlertCircle,
  TrendingUp,
  Calendar,
  Building2,
  Eye,
  Plus,
  ArrowRight
} from 'lucide-react';
import type {
  VisaTracking,
  ComplianceViolation,
  VisaRenewalAlert,
  GovernmentPortalTracking,
  RegulatoryUpdate
} from '@/types/visa-compliance';

interface VisaComplianceDashboardStats {
  totalEmployees: number;
  visasExpiringSoon: number;
  activeViolations: number;
  pendingAlerts: number;
  governmentApplications: number;
  regulatoryUpdates: number;
}

export default function VisaComplianceDashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VisaComplianceDashboardStats>({
    totalEmployees: 0,
    visasExpiringSoon: 0,
    activeViolations: 0,
    pendingAlerts: 0,
    governmentApplications: 0,
    regulatoryUpdates: 0
  });
  const [expiringVisas, setExpiringVisas] = useState<any[]>([]);
  const [recentViolations, setRecentViolations] = useState<ComplianceViolation[]>([]);
  const [pendingAlerts, setPendingAlerts] = useState<VisaRenewalAlert[]>([]);
  const [governmentApplications, setGovernmentApplications] = useState<GovernmentPortalTracking[]>([]);

  useEffect(() => {
    if (profile?.organization_id) {
      loadVisaComplianceDashboard();
    }
  }, [profile]);

  const loadVisaComplianceDashboard = async () => {
    try {
      setLoading(true);

      if (!profile?.organization_id) return;

      // Load visas expiring in next 90 days
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

      const { data: visas, error: visasError } = await supabase
        .from('visa_tracking')
        .select(`
          *,
          employee:employees(id, first_name, last_name, employee_id, department)
        `)
        .eq('organization_id', profile.organization_id)
        .lte('expiry_date', ninetyDaysFromNow.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true })
        .limit(5);

      if (visasError) {
        console.error('Error loading visas:', visasError);
      } else {
        setExpiringVisas(visas || []);
      }

      // Load active compliance violations
      const { data: violations, error: violationsError } = await supabase
        .from('compliance_violations')
        .select(`
          *,
          employee:employees(first_name, last_name)
        `)
        .eq('organization_id', profile.organization_id)
        .in('status', ['active', 'investigating'])
        .order('detected_date', { ascending: false })
        .limit(5);

      if (violationsError) {
        console.error('Error loading violations:', violationsError);
      } else {
        setRecentViolations(violations || []);
      }

      // Load pending alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('visa_renewal_alerts')
        .select(`
          *,
          employee:employees(first_name, last_name)
        `)
        .eq('organization_id', profile.organization_id)
        .eq('status', 'pending')
        .order('alert_date', { ascending: true })
        .limit(5);

      if (alertsError) {
        console.error('Error loading alerts:', alertsError);
      } else {
        setPendingAlerts(alerts || []);
      }

      // Load government applications
      const { data: applications, error: applicationsError } = await supabase
        .from('government_portal_tracking')
        .select(`
          *,
          employee:employees(first_name, last_name)
        `)
        .eq('organization_id', profile.organization_id)
        .in('status', ['submitted', 'under_review'])
        .order('submission_date', { ascending: false })
        .limit(5);

      if (applicationsError) {
        console.error('Error loading applications:', applicationsError);
      } else {
        setGovernmentApplications(applications || []);
      }

      // Calculate stats
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id);

      const { count: visasExpiringSoon } = await supabase
        .from('visa_tracking')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .lte('expiry_date', ninetyDaysFromNow.toISOString().split('T')[0]);

      const { count: activeViolations } = await supabase
        .from('compliance_violations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .in('status', ['active', 'investigating']);

      const { count: pendingAlertsCount } = await supabase
        .from('visa_renewal_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('status', 'pending');

      const { count: governmentApplicationsCount } = await supabase
        .from('government_portal_tracking')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .in('status', ['submitted', 'under_review']);

      const { count: regulatoryUpdatesCount } = await supabase
        .from('regulatory_updates')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .in('compliance_status', ['pending', 'in_progress']);

      setStats({
        totalEmployees: totalEmployees || 0,
        visasExpiringSoon: visasExpiringSoon || 0,
        activeViolations: activeViolations || 0,
        pendingAlerts: pendingAlertsCount || 0,
        governmentApplications: governmentApplicationsCount || 0,
        regulatoryUpdates: regulatoryUpdatesCount || 0
      });

    } catch (error) {
      console.error('Error loading visa compliance dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVisaExpiryStatus = (expiryDate: string) => {
    const days = Math.floor((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { status: 'expired', color: 'text-red-600 bg-red-50', label: 'Expired' };
    if (days <= 15) return { status: 'critical', color: 'text-red-600 bg-red-50', label: `${days} days` };
    if (days <= 30) return { status: 'urgent', color: 'text-orange-600 bg-orange-50', label: `${days} days` };
    if (days <= 60) return { status: 'warning', color: 'text-yellow-600 bg-yellow-50', label: `${days} days` };
    return { status: 'ok', color: 'text-green-600 bg-green-50', label: `${days} days` };
  };

  const getSeverityBadge = (severity: string) => {
    const badges: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return badges[severity] || badges.low;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800'
    };
    return badges[status] || badges.draft;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Visa & Compliance Management
            </h1>
            <p className="text-gray-600 mt-2">
              UAE regulatory compliance and visa tracking system
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/visa-compliance/violations/new">
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity">
                <Plus className="w-5 h-5" />
                Report Violation
              </button>
            </Link>
            <Link href="/dashboard/visa-compliance/government-portals/new">
              <button className="flex items-center gap-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
                <Building2 className="w-5 h-5" />
                New Application
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalEmployees}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Visas Expiring Soon</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.visasExpiringSoon}</p>
              <p className="text-xs text-gray-500 mt-1">Within 90 days</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Violations</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.activeViolations}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Alerts</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pendingAlerts}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gov. Applications</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.governmentApplications}</p>
              <p className="text-xs text-gray-500 mt-1">In progress</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Regulatory Updates</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.regulatoryUpdates}</p>
              <p className="text-xs text-gray-500 mt-1">Requiring action</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Visas */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Visas Expiring Soon</h2>
            <Link href="/dashboard/visa-compliance/visas">
              <button className="text-purple-600 hover:text-purple-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <div className="space-y-3">
            {expiringVisas.length > 0 ? (
              expiringVisas.map((visa) => {
                const expiryStatus = getVisaExpiryStatus(visa.expiry_date);
                return (
                  <div key={visa.id} className="p-4 bg-white/50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {visa.employee?.first_name} {visa.employee?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {visa.visa_type} - {visa.visa_number || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${expiryStatus.color}`}>
                          {expiryStatus.label}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Expires: {new Date(visa.expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 py-4">No visas expiring soon</p>
            )}
          </div>
        </div>

        {/* Recent Violations */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Active Compliance Issues</h2>
            <Link href="/dashboard/visa-compliance/violations">
              <button className="text-purple-600 hover:text-purple-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentViolations.length > 0 ? (
              recentViolations.map((violation) => (
                <div key={violation.id} className="p-4 bg-white/50 rounded-lg border border-gray-200 hover:border-red-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadge(violation.severity)}`}>
                          {violation.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(violation.detected_date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 text-sm">
                        {violation.description}
                      </p>
                      {violation.employee && (
                        <p className="text-xs text-gray-600 mt-1">
                          Employee: {violation.employee.first_name} {violation.employee.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No active violations</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Alerts */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Pending Renewal Alerts</h2>
            <Link href="/dashboard/visa-compliance/alerts">
              <button className="text-purple-600 hover:text-purple-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <div className="space-y-3">
            {pendingAlerts.length > 0 ? (
              pendingAlerts.map((alert) => (
                <div key={alert.id} className="p-4 bg-white/50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {alert.employee?.first_name} {alert.employee?.last_name}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">
                        {alert.alert_type.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">
                        {alert.days_until_expiry} days
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(alert.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No pending alerts</p>
            )}
          </div>
        </div>

        {/* Government Applications */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Government Applications</h2>
            <Link href="/dashboard/visa-compliance/government-portals">
              <button className="text-purple-600 hover:text-purple-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <div className="space-y-3">
            {governmentApplications.length > 0 ? (
              governmentApplications.map((app) => (
                <div key={app.id} className="p-4 bg-white/50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{app.portal_name}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {app.application_type.replace('_', ' ')}
                      </p>
                      {app.employee && (
                        <p className="text-xs text-gray-500 mt-1">
                          {app.employee.first_name} {app.employee.last_name}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(app.status)}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No active applications</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/visa-compliance/visas">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
              <FileText className="w-8 h-8 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Visa Tracking</p>
            </div>
          </Link>
          <Link href="/dashboard/visa-compliance/violations">
            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
              <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
              <p className="font-medium text-gray-900">Violations</p>
            </div>
          </Link>
          <Link href="/dashboard/visa-compliance/regulatory-updates">
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
              <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">Regulatory Updates</p>
            </div>
          </Link>
          <Link href="/dashboard/visa-compliance/wps">
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
              <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">WPS Compliance</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
