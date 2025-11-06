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
  TrendingUp, 
  DollarSign,
  FileText,
  Banknote,
  Calendar,
  BarChart3,
  Eye,
  Plus,
  ArrowRight
} from 'lucide-react';
import type {
  VATReport,
  ComplianceCalendar,
  FinancialRiskAssessment,
  RegulatoryReport,
  BankReconciliation
} from '@/types/database';

interface ComplianceDashboardStats {
  totalVATDue: number;
  overdueCompliance: number;
  activeRisks: number;
  pendingReports: number;
  reconciliationIssues: number;
}

interface UpcomingDeadline {
  id: string;
  requirement_name: string;
  due_date: string;
  priority: string;
  compliance_type: string;
  status: string;
}

export default function ComplianceDashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ComplianceDashboardStats>({
    totalVATDue: 0,
    overdueCompliance: 0,
    activeRisks: 0,
    pendingReports: 0,
    reconciliationIssues: 0
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [recentVATReports, setRecentVATReports] = useState<VATReport[]>([]);
  const [activeRisks, setActiveRisks] = useState<FinancialRiskAssessment[]>([]);

  useEffect(() => {
    if (profile?.organization_id) {
      loadComplianceDashboard();
    }
  }, [profile]);

  const loadComplianceDashboard = async () => {
    try {
      setLoading(true);

      if (!profile?.organization_id) return;

      // Load VAT reports
      const { data: vatReports } = await supabase
        .from('vat_reports')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('report_period', { ascending: false })
        .limit(3);

      setRecentVATReports(vatReports || []);

      // Calculate total VAT due
      const totalVATDue = vatReports?.reduce((sum, report) => 
        sum + (report.submission_status === 'draft' ? report.net_vat_due_aed : 0), 0) || 0;

      // Load compliance calendar
      const { data: complianceItems } = await supabase
        .from('compliance_calendar')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('due_date', new Date().toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(5);

      setUpcomingDeadlines(complianceItems || []);

      // Count overdue compliance items
      const overdueCount = complianceItems?.filter(item => 
        new Date(item.due_date) < new Date() && item.status === 'pending').length || 0;

      // Load active risks
      const { data: risks } = await supabase
        .from('financial_risk_assessment')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')
        .order('assessment_date', { ascending: false })
        .limit(3);

      setActiveRisks(risks || []);

      // Count pending regulatory reports
      const { data: reports } = await supabase
        .from('regulatory_reports')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('submission_status', 'pending');

      // Count bank reconciliation issues
      const { data: reconciliations } = await supabase
        .from('bank_reconciliation')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .neq('differences_aed', 0);

      setStats({
        totalVATDue,
        overdueCompliance: overdueCount,
        activeRisks: risks?.length || 0,
        pendingReports: reports?.length || 0,
        reconciliationIssues: reconciliations?.length || 0
      });

    } catch (error) {
      console.error('Error loading compliance dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      critical: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      high: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      low: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 }
    };
    const badge = badges[priority] || badges.medium;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getRiskLevelBadge = (level: string) => {
    const badges: Record<string, { color: string }> = {
      critical: { color: 'bg-red-500 text-white' },
      high: { color: 'bg-orange-500 text-white' },
      medium: { color: 'bg-yellow-500 text-white' },
      low: { color: 'bg-green-500 text-white' }
    };
    const badge = badges[level] || badges.medium;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-neutral-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Financial Compliance Center</h1>
            <p className="text-neutral-600">UAE regulatory compliance and risk management dashboard</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/compliance/calendar" className="btn-secondary flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              View Calendar
            </Link>
            <Link href="/dashboard/compliance/vat" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New VAT Report
            </Link>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-5 gap-4">
        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-neutral-500">VAT Due</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{formatCurrency(stats.totalVATDue)}</h3>
            <p className="text-xs text-neutral-600">Outstanding VAT liability</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs text-neutral-500">Overdue</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.overdueCompliance}</h3>
            <p className="text-xs text-neutral-600">Compliance items overdue</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs text-neutral-500">Risks</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.activeRisks}</h3>
            <p className="text-xs text-neutral-600">Active risk assessments</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-xs text-neutral-500">Reports</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.pendingReports}</h3>
            <p className="text-xs text-neutral-600">Pending regulatory reports</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Banknote className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs text-neutral-500">Bank Rec</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.reconciliationIssues}</h3>
            <p className="text-xs text-neutral-600">Reconciliation differences</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">Upcoming Compliance Deadlines</h2>
            <Link href="/dashboard/compliance/calendar" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between p-3 bg-white/30 rounded-lg border border-white/20">
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900 text-sm">{deadline.requirement_name}</h4>
                    <p className="text-xs text-neutral-600 mt-1">
                      {deadline.compliance_type.toUpperCase()} • Due {formatDate(deadline.due_date)}
                    </p>
                  </div>
                  <div className="ml-3">
                    {getPriorityBadge(deadline.priority)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming compliance deadlines</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent VAT Reports */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">Recent VAT Reports</h2>
            <Link href="/dashboard/compliance/vat" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentVATReports.length > 0 ? (
              recentVATReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-white/30 rounded-lg border border-white/20">
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900 text-sm">VAT Return {report.report_period}</h4>
                    <p className="text-xs text-neutral-600 mt-1">
                      Net VAT Due: {formatCurrency(report.net_vat_due_aed)}
                    </p>
                  </div>
                  <div className="ml-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.submission_status === 'approved' ? 'bg-green-100 text-green-800' :
                      report.submission_status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                      report.submission_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.submission_status.charAt(0).toUpperCase() + report.submission_status.slice(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No VAT reports available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Risk Assessments */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-neutral-900">Active Risk Assessments</h2>
          <Link href="/dashboard/compliance/forecasting" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {activeRisks.length > 0 ? (
            activeRisks.map((risk) => (
              <div key={risk.id} className="p-4 bg-white/30 rounded-lg border border-white/20">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900 text-sm mb-1">{risk.risk_type.replace('_', ' ').toUpperCase()}</h4>
                    <p className="text-xs text-neutral-600 line-clamp-2">{risk.description}</p>
                  </div>
                  <div className="ml-2">
                    {getRiskLevelBadge(risk.risk_level)}
                  </div>
                </div>
                <p className="text-xs text-neutral-500">Assessed {formatDate(risk.assessment_date)}</p>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-neutral-500">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No active risk assessments</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <Link href="/dashboard/compliance/vat" className="glass-card glass-card-hover p-6 text-center group">
          <div className="p-3 bg-blue-100 rounded-lg mx-auto mb-4 w-fit">
            <DollarSign className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="font-semibold text-neutral-900 mb-2">VAT Management</h3>
          <p className="text-sm text-neutral-600">File VAT returns and track payments</p>
        </Link>

        <Link href="/dashboard/compliance/banking" className="glass-card glass-card-hover p-6 text-center group">
          <div className="p-3 bg-green-100 rounded-lg mx-auto mb-4 w-fit">
            <Banknote className="w-6 h-6 text-green-600 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="font-semibold text-neutral-900 mb-2">Bank Reconciliation</h3>
          <p className="text-sm text-neutral-600">Reconcile bank statements and accounts</p>
        </Link>

        <Link href="/dashboard/compliance/audit" className="glass-card glass-card-hover p-6 text-center group">
          <div className="p-3 bg-purple-100 rounded-lg mx-auto mb-4 w-fit">
            <Eye className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="font-semibold text-neutral-900 mb-2">Audit Trail</h3>
          <p className="text-sm text-neutral-600">Track all financial changes and activities</p>
        </Link>

        <Link href="/dashboard/compliance/forecasting" className="glass-card glass-card-hover p-6 text-center group">
          <div className="p-3 bg-orange-100 rounded-lg mx-auto mb-4 w-fit">
            <BarChart3 className="w-6 h-6 text-orange-600 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="font-semibold text-neutral-900 mb-2">Risk & Forecasting</h3>
          <p className="text-sm text-neutral-600">Analyze risks and financial projections</p>
        </Link>
      </div>
    </div>
  );
}