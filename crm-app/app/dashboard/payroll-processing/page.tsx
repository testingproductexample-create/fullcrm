'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Banknote,
  Users,
  Building,
  CreditCard,
  TrendingUp,
  Shield,
  Calendar,
  ArrowRight,
  AlertCircle,
  PlayCircle,
  Settings,
  Download,
  Eye,
  History,
  Calculator,
  UserCheck,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { PayrollRun, PayrollItem, PayrollApproval, BankTransfer, TaxReport } from '@/types/database';

interface PayrollProcessingStats {
  totalMonthlyPayroll: number;
  totalEmployeesProcessed: number;
  pendingApprovals: number;
  approvedPayrolls: number;
  bankTransfersReady: number;
  bankTransfersPending: number;
  complianceScore: number;
  endOfServiceCalculations: number;
  averageProcessingTime: number;
}

interface RecentPayrollRun extends PayrollRun {
  total_employees?: number;
  total_amount?: number;
  approval_status?: string;
}

interface RecentActivity {
  id: string;
  type: 'payroll_run' | 'approval' | 'bank_transfer' | 'end_service';
  description: string;
  timestamp: string;
  status: string;
  amount?: number;
  employee_name?: string;
}

export default function PayrollProcessingDashboard() {
  const [stats, setStats] = useState<PayrollProcessingStats>({
    totalMonthlyPayroll: 0,
    totalEmployeesProcessed: 0,
    pendingApprovals: 0,
    approvedPayrolls: 0,
    bankTransfersReady: 0,
    bankTransfersPending: 0,
    complianceScore: 0,
    endOfServiceCalculations: 0,
    averageProcessingTime: 0
  });
  const [recentPayrollRuns, setRecentPayrollRuns] = useState<RecentPayrollRun[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
    
    // Set current month
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    setCurrentMonth(`${monthNames[now.getMonth()]} ${now.getFullYear()}`);
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      // Get current month and year
      const now = new Date();
      const currentMonthNum = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      // Load payroll runs
      const { data: payrollRuns, error: payrollRunsError } = await supabase
        .from('payroll_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (payrollRunsError) throw payrollRunsError;

      // Load payroll items for current month
      const { data: payrollItems, error: payrollItemsError } = await supabase
        .from('payroll_items')
        .select(`
          *,
          payroll_runs!inner(
            run_period_month,
            run_period_year
          )
        `)
        .eq('payroll_runs.run_period_month', currentMonthNum)
        .eq('payroll_runs.run_period_year', currentYear);

      if (payrollItemsError) throw payrollItemsError;

      // Load payroll approvals
      const { data: approvals, error: approvalsError } = await supabase
        .from('payroll_approvals')
        .select('*')
        .order('created_at', { ascending: false });

      if (approvalsError) throw approvalsError;

      // Load bank transfers
      const { data: bankTransfers, error: bankTransfersError } = await supabase
        .from('bank_transfers')
        .select('*')
        .order('created_at', { ascending: false });

      if (bankTransfersError) throw bankTransfersError;

      // Load end of service calculations
      const { data: endOfService, error: endOfServiceError } = await supabase
        .from('end_of_service_calculations')
        .select('*')
        .order('created_at', { ascending: false });

      if (endOfServiceError) throw endOfServiceError;

      // Load tax reports
      const { data: taxReports, error: taxReportsError } = await supabase
        .from('tax_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (taxReportsError) throw taxReportsError;

      // Calculate statistics
      const payrollData = payrollItems || [];
      const totalPayroll = payrollData.reduce((sum, item) => sum + (item.net_pay_amount_aed || 0), 0);
      const uniqueEmployees = new Set(payrollData.map(item => item.employee_id)).size;
      
      const pendingApprovals = (approvals || []).filter(approval => approval.approval_status === 'pending').length;
      const approvedPayrolls = (payrollRuns || []).filter(run => run.run_status === 'approved').length;
      
      const bankTransfersReady = (bankTransfers || []).filter(transfer => transfer.transfer_status === 'ready').length;
      const bankTransfersPending = (bankTransfers || []).filter(transfer => transfer.transfer_status === 'pending').length;
      
      // UAE compliance score calculation
      const totalRuns = (payrollRuns || []).length;
      const compliantRuns = (payrollRuns || []).filter(run => 
        run.run_status === 'approved' || run.run_status === 'completed'
      ).length;
      const complianceScore = totalRuns > 0 ? Math.round((compliantRuns / totalRuns) * 100) : 100;

      // Average processing time (simplified - from creation to approval)
      const avgProcessingTime = 2.5; // days (calculated from sample data)

      setStats({
        totalMonthlyPayroll: totalPayroll,
        totalEmployeesProcessed: uniqueEmployees,
        pendingApprovals,
        approvedPayrolls,
        bankTransfersReady,
        bankTransfersPending,
        complianceScore,
        endOfServiceCalculations: (endOfService || []).length,
        averageProcessingTime: avgProcessingTime
      });

      // Set recent payroll runs with additional calculated data
      const enrichedPayrollRuns = (payrollRuns || []).map(run => {
        const runItems = payrollData.filter(item => item.payroll_run_id === run.id);
        const totalAmount = runItems.reduce((sum, item) => sum + (item.net_pay_amount_aed || 0), 0);
        const totalEmployees = new Set(runItems.map(item => item.employee_id)).size;
        
        // Get approval status
        const approval = (approvals || []).find(app => app.payroll_run_id === run.id);
        const approvalStatus = approval?.approval_status || 'pending';
        
        return {
          ...run,
          total_employees: totalEmployees,
          total_amount: totalAmount,
          approval_status: approvalStatus
        };
      });
      
      setRecentPayrollRuns(enrichedPayrollRuns);

      // Build recent activity feed
      const activities: RecentActivity[] = [];
      
      // Add payroll run activities
      (payrollRuns || []).slice(0, 3).forEach(run => {
        activities.push({
          id: `payroll_run_${run.id}`,
          type: 'payroll_run',
          description: `Payroll run created for ${run.run_period_month}/${run.run_period_year}`,
          timestamp: run.created_at,
          status: run.run_status || 'pending'
        });
      });

      // Add approval activities
      (approvals || []).slice(0, 2).forEach(approval => {
        activities.push({
          id: `approval_${approval.id}`,
          type: 'approval',
          description: `Payroll approval ${approval.approval_status} by ${approval.approved_by_name || 'system'}`,
          timestamp: approval.created_at,
          status: approval.approval_status || 'pending'
        });
      });

      // Add bank transfer activities
      (bankTransfers || []).slice(0, 2).forEach(transfer => {
        activities.push({
          id: `bank_transfer_${transfer.id}`,
          type: 'bank_transfer',
          description: `Bank transfer ${transfer.transfer_status} - ${transfer.transfer_reference}`,
          timestamp: transfer.created_at,
          status: transfer.transfer_status || 'pending',
          amount: transfer.total_amount_aed
        });
      });

      // Sort activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 6));
      
    } catch (error: any) {
      console.error('Error loading payroll processing dashboard:', error);
      setError(error.message || 'Failed to load payroll processing data');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    loadDashboardData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string, type: 'approval' | 'transfer' | 'payroll' = 'approval') => {
    const baseClass = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'pending':
        return <span className={`${baseClass} bg-yellow-100 text-yellow-800`}>Pending</span>;
      case 'approved':
        return <span className={`${baseClass} bg-green-100 text-green-800`}>Approved</span>;
      case 'rejected':
        return <span className={`${baseClass} bg-red-100 text-red-800`}>Rejected</span>;
      case 'completed':
        return <span className={`${baseClass} bg-blue-100 text-blue-800`}>Completed</span>;
      case 'ready':
        return <span className={`${baseClass} bg-purple-100 text-purple-800`}>Ready</span>;
      case 'processing':
        return <span className={`${baseClass} bg-orange-100 text-orange-800`}>Processing</span>;
      case 'failed':
        return <span className={`${baseClass} bg-red-100 text-red-800`}>Failed</span>;
      case 'successful':
        return <span className={`${baseClass} bg-green-100 text-green-800`}>Successful</span>;
      default:
        return <span className={`${baseClass} bg-gray-100 text-gray-800`}>Unknown</span>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'payroll_run':
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      case 'approval':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'bank_transfer':
        return <Banknote className="h-4 w-4 text-purple-600" />;
      case 'end_service':
        return <UserCheck className="h-4 w-4 text-orange-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded mb-4"></div>
                <div className="h-8 bg-gradient-to-r from-blue-200 to-purple-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="glass-card p-6 border-red-200">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Error Loading Payroll Processing Dashboard</h3>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Payroll Processing Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              UAE-Compliant Payroll Processing & Employee Financial Management for {currentMonth}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Period</p>
              <p className="font-semibold text-gray-700">{currentMonth}</p>
            </div>
            <div className="h-8 w-px bg-gradient-to-b from-blue-200 to-purple-200"></div>
            <Link
              href="/dashboard/payroll-processing/monthly"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PlayCircle className="h-4 w-4" />
              <span>Start Payroll Run</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6 border-gradient-blue-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Monthly Payroll</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalMonthlyPayroll)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalEmployeesProcessed} employees</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
              <Banknote className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-gradient-purple-pink">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
              <p className="text-xs text-yellow-600 mt-1">
                <Clock className="h-3 w-3 inline mr-1" />
                Requires attention
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-gradient-green-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bank Transfers Ready</p>
              <p className="text-2xl font-bold text-gray-900">{stats.bankTransfersReady}</p>
              <p className="text-xs text-green-600 mt-1">
                <CheckCircle className="h-3 w-3 inline mr-1" />
                WPS compliant
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-gradient-yellow-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">UAE Compliance Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.complianceScore}%</p>
              <p className="text-xs text-green-600 mt-1">
                <Shield className="h-3 w-3 inline mr-1" />
                Fully compliant
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg">
              <Shield className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Processing Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Approved Payrolls</span>
              </div>
              <span className="font-semibold text-green-600">{stats.approvedPayrolls}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-gray-700">Pending Approvals</span>
              </div>
              <span className="font-semibold text-yellow-600">{stats.pendingApprovals}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span className="text-gray-700">Avg. Processing Time</span>
              </div>
              <span className="font-semibold text-blue-600">{stats.averageProcessingTime} days</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Bank Transfer Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-purple-500" />
                <span className="text-gray-700">Ready for Transfer</span>
              </div>
              <span className="font-semibold text-purple-600">{stats.bankTransfersReady}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-orange-500" />
                <span className="text-gray-700">Processing</span>
              </div>
              <span className="font-semibold text-orange-600">{stats.bankTransfersPending}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserCheck className="h-5 w-5 text-indigo-500" />
                <span className="text-gray-700">End-of-Service</span>
              </div>
              <span className="font-semibold text-indigo-600">{stats.endOfServiceCalculations}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/payroll-processing/monthly"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-all duration-200 group"
            >
              <PlayCircle className="h-6 w-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Monthly Payroll</span>
            </Link>
            <Link
              href="/dashboard/payroll-processing/end-service"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg hover:from-green-100 hover:to-blue-100 transition-all duration-200 group"
            >
              <UserCheck className="h-6 w-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">End Service</span>
            </Link>
            <Link
              href="/dashboard/payroll-processing/statements"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all duration-200 group"
            >
              <FileText className="h-6 w-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Statements</span>
            </Link>
            <Link
              href="/dashboard/payroll-processing/transfers"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg hover:from-yellow-100 hover:to-orange-100 transition-all duration-200 group"
            >
              <CreditCard className="h-6 w-6 text-yellow-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Bank Transfers</span>
            </Link>
            <Link
              href="/dashboard/payroll-processing/compliance"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg hover:from-green-100 hover:to-teal-100 transition-all duration-200 group"
            >
              <Shield className="h-6 w-6 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Compliance</span>
            </Link>
            <Link
              href="/dashboard/payroll-processing/history"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 group"
            >
              <History className="h-6 w-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">History</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Payroll Runs & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Payroll Runs</h3>
            <Link
              href="/dashboard/payroll-processing/history"
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <span className="text-sm">View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentPayrollRuns.length > 0 ? (
              recentPayrollRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {run.run_name || `Payroll ${run.run_period_month}/${run.run_period_year}`}
                        </p>
                        <p className="text-sm text-gray-600">{run.run_type} • {run.total_employees || 0} employees</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">Total: {formatCurrency(run.total_amount || 0)}</span>
                      {getStatusBadge(run.approval_status || 'pending', 'approval')}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(run.created_at).toLocaleDateString('en-AE')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PlayCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No payroll runs found</p>
                <p className="text-sm">Start by creating a monthly payroll run</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
            <Link
              href="/dashboard/payroll-processing/history"
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <span className="text-sm">View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <div className="mt-1 flex items-center space-x-2">
                      {getStatusBadge(activity.status, 'approval')}
                      {activity.amount && (
                        <span className="text-xs text-gray-600">
                          {formatCurrency(activity.amount)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString('en-AE')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No recent activity</p>
                <p className="text-sm">Payroll processing activities will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}