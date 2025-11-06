'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Mail,
  MessageSquare,
  Users,
  Shield,
  Calendar,
  ArrowRight,
  AlertCircle,
  Zap,
  Settings,
  Eye,
  Archive,
  Signature,
  Send,
  History
} from 'lucide-react';
import Link from 'next/link';
import { Payslip, PayslipTemplate, PayslipDistribution, EmployeeAccessLog, PayslipArchive } from '@/types/database';

interface PayslipStats {
  totalPayslipsGenerated: number;
  totalEmployeesWithPayslips: number;
  distributedPayslips: number;
  pendingDistribution: number;
  employeeAccessCount: number;
  downloadCount: number;
  complianceScore: number;
  averageGenerationTime: number;
  digitallySignedPayslips: number;
}

interface RecentPayslip extends Payslip {
  employee?: {
    first_name: string;
    last_name: string;
    job_title: string;
  };
  template?: {
    template_name: string;
  };
}

interface RecentActivity {
  id: string;
  type: 'generation' | 'distribution' | 'access' | 'signature' | 'download';
  description: string;
  timestamp: string;
  status: string;
  employee_name?: string;
  distribution_method?: string;
}

export default function PayslipDashboard() {
  const [stats, setStats] = useState<PayslipStats>({
    totalPayslipsGenerated: 0,
    totalEmployeesWithPayslips: 0,
    distributedPayslips: 0,
    pendingDistribution: 0,
    employeeAccessCount: 0,
    downloadCount: 0,
    complianceScore: 0,
    averageGenerationTime: 0,
    digitallySignedPayslips: 0
  });
  const [recentPayslips, setRecentPayslips] = useState<RecentPayslip[]>([]);
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
      
      // Load payslips
      const { data: payslips, error: payslipsError } = await supabase
        .from('payslips')
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name,
            job_title
          ),
          payslip_templates:template_id (
            template_name
          )
        `)
        .order('created_at', { ascending: false });

      if (payslipsError) throw payslipsError;

      // Load payslip distribution
      const { data: distributions, error: distributionsError } = await supabase
        .from('payslip_distribution')
        .select('*')
        .order('created_at', { ascending: false });

      if (distributionsError) throw distributionsError;

      // Load employee access logs
      const { data: accessLogs, error: accessLogsError } = await supabase
        .from('employee_access_log')
        .select('*')
        .order('access_timestamp', { ascending: false });

      if (accessLogsError) throw accessLogsError;

      // Load digital signatures
      const { data: signatures, error: signaturesError } = await supabase
        .from('digital_signatures')
        .select('*')
        .order('signed_at', { ascending: false });

      if (signaturesError) throw signaturesError;

      // Load payslip templates
      const { data: templates, error: templatesError } = await supabase
        .from('payslip_templates')
        .select('*')
        .eq('is_active', true);

      if (templatesError) throw templatesError;

      // Calculate statistics
      const payslipData = payslips || [];
      const distributionData = distributions || [];
      const accessData = accessLogs || [];
      const signatureData = signatures || [];

      const totalPayslips = payslipData.length;
      const uniqueEmployees = new Set(payslipData.map(p => p.employee_id)).size;
      
      const distributedCount = distributionData.filter(d => 
        d.distribution_status === 'delivered' || d.distribution_status === 'opened'
      ).length;
      const pendingCount = distributionData.filter(d => 
        d.distribution_status === 'pending' || d.distribution_status === 'sent'
      ).length;

      const accessCount = accessData.filter(a => a.access_type === 'payslip_view').length;
      const downloadCount = accessData.filter(a => a.access_type === 'payslip_download').length;

      const digitallySignedCount = payslipData.filter(p => p.is_digitally_signed).length;

      // UAE compliance score calculation
      const complianceFactors = [
        payslipData.filter(p => p.compliance_verified).length / Math.max(totalPayslips, 1),
        digitallySignedCount / Math.max(totalPayslips, 1),
        distributedCount / Math.max(distributionData.length, 1),
        (templates || []).filter(t => t.uae_ministry_compliant).length / Math.max((templates || []).length, 1)
      ];
      const complianceScore = Math.round(complianceFactors.reduce((a, b) => a + b, 0) / complianceFactors.length * 100);

      // Average generation time (simplified - based on sample data)
      const avgGenerationTime = 3.5; // minutes

      setStats({
        totalPayslipsGenerated: totalPayslips,
        totalEmployeesWithPayslips: uniqueEmployees,
        distributedPayslips: distributedCount,
        pendingDistribution: pendingCount,
        employeeAccessCount: accessCount,
        downloadCount,
        complianceScore,
        averageGenerationTime: avgGenerationTime,
        digitallySignedPayslips: digitallySignedCount
      });

      // Set recent payslips
      setRecentPayslips(payslipData.slice(0, 6));

      // Build recent activity feed
      const activities: RecentActivity[] = [];
      
      // Add payslip generation activities
      payslipData.slice(0, 3).forEach(payslip => {
        activities.push({
          id: `payslip_${payslip.id}`,
          type: 'generation',
          description: `Payslip generated for ${payslip.employee?.first_name} ${payslip.employee?.last_name}`,
          timestamp: payslip.created_at,
          status: payslip.generation_status || 'generated',
          employee_name: `${payslip.employee?.first_name} ${payslip.employee?.last_name}`
        });
      });

      // Add distribution activities
      distributionData.slice(0, 3).forEach(dist => {
        activities.push({
          id: `distribution_${dist.id}`,
          type: 'distribution',
          description: `Payslip ${dist.distribution_status} via ${dist.distribution_method} to ${dist.recipient_name}`,
          timestamp: dist.sent_at || dist.created_at,
          status: dist.distribution_status || 'pending',
          employee_name: dist.recipient_name,
          distribution_method: dist.distribution_method
        });
      });

      // Add access activities
      accessData.slice(0, 2).forEach(access => {
        if (access.access_type === 'payslip_view' || access.access_type === 'payslip_download') {
          activities.push({
            id: `access_${access.id}`,
            type: access.access_type === 'payslip_download' ? 'download' : 'access',
            description: `Employee ${access.access_type === 'payslip_download' ? 'downloaded' : 'viewed'} payslip`,
            timestamp: access.access_timestamp,
            status: 'completed'
          });
        }
      });

      // Add signature activities
      signatureData.slice(0, 2).forEach(signature => {
        activities.push({
          id: `signature_${signature.id}`,
          type: 'signature',
          description: `Payslip digitally signed by ${signature.signer_name}`,
          timestamp: signature.signed_at,
          status: signature.signature_status || 'active'
        });
      });

      // Sort activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 6));
      
    } catch (error: any) {
      console.error('Error loading payslip dashboard:', error);
      setError(error.message || 'Failed to load payslip data');
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

  const getStatusBadge = (status: string, type: 'generation' | 'distribution' | 'signature' = 'generation') => {
    const baseClass = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'draft':
        return <span className={`${baseClass} bg-gray-100 text-gray-800`}>Draft</span>;
      case 'generated':
        return <span className={`${baseClass} bg-blue-100 text-blue-800`}>Generated</span>;
      case 'signed':
        return <span className={`${baseClass} bg-purple-100 text-purple-800`}>Signed</span>;
      case 'distributed':
        return <span className={`${baseClass} bg-green-100 text-green-800`}>Distributed</span>;
      case 'archived':
        return <span className={`${baseClass} bg-indigo-100 text-indigo-800`}>Archived</span>;
      case 'pending':
        return <span className={`${baseClass} bg-yellow-100 text-yellow-800`}>Pending</span>;
      case 'sent':
        return <span className={`${baseClass} bg-orange-100 text-orange-800`}>Sent</span>;
      case 'delivered':
        return <span className={`${baseClass} bg-green-100 text-green-800`}>Delivered</span>;
      case 'opened':
        return <span className={`${baseClass} bg-teal-100 text-teal-800`}>Opened</span>;
      case 'failed':
        return <span className={`${baseClass} bg-red-100 text-red-800`}>Failed</span>;
      case 'active':
        return <span className={`${baseClass} bg-green-100 text-green-800`}>Active</span>;
      case 'completed':
        return <span className={`${baseClass} bg-blue-100 text-blue-800`}>Completed</span>;
      default:
        return <span className={`${baseClass} bg-gray-100 text-gray-800`}>Unknown</span>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'generation':
        return <Zap className="h-4 w-4 text-blue-600" />;
      case 'distribution':
        return <Send className="h-4 w-4 text-green-600" />;
      case 'access':
        return <Eye className="h-4 w-4 text-purple-600" />;
      case 'signature':
        return <Signature className="h-4 w-4 text-indigo-600" />;
      case 'download':
        return <Download className="h-4 w-4 text-orange-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gradient-to-r from-green-200 to-blue-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="h-4 bg-gradient-to-r from-green-200 to-blue-200 rounded mb-4"></div>
                <div className="h-8 bg-gradient-to-r from-green-200 to-blue-200 rounded"></div>
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
            <h3 className="text-lg font-semibold">Error Loading Payslip Dashboard</h3>
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              UAE Payslip Generation Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Professional Salary Statements & Employee Self-Service Portal for {currentMonth}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Period</p>
              <p className="font-semibold text-gray-700">{currentMonth}</p>
            </div>
            <div className="h-8 w-px bg-gradient-to-b from-green-200 to-blue-200"></div>
            <Link
              href="/dashboard/payslips/generate"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Zap className="h-4 w-4" />
              <span>Generate Payslips</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6 border-gradient-green-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payslips Generated</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPayslipsGenerated}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalEmployeesWithPayslips} employees</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-gradient-blue-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Distributed Payslips</p>
              <p className="text-2xl font-bold text-gray-900">{stats.distributedPayslips}</p>
              <p className="text-xs text-green-600 mt-1">
                <Mail className="h-3 w-3 inline mr-1" />
                Successfully delivered
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-gradient-purple-pink">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Employee Access Count</p>
              <p className="text-2xl font-bold text-gray-900">{stats.employeeAccessCount}</p>
              <p className="text-xs text-purple-600 mt-1">
                <Download className="h-3 w-3 inline mr-1" />
                {stats.downloadCount} downloads
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
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
                {stats.digitallySignedPayslips} digitally signed
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Generation Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Generated Payslips</span>
              </div>
              <span className="font-semibold text-green-600">{stats.totalPayslipsGenerated}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Signature className="h-5 w-5 text-purple-500" />
                <span className="text-gray-700">Digitally Signed</span>
              </div>
              <span className="font-semibold text-purple-600">{stats.digitallySignedPayslips}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-gray-700">Avg. Generation Time</span>
              </div>
              <span className="font-semibold text-blue-600">{stats.averageGenerationTime} min</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribution Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Successfully Delivered</span>
              </div>
              <span className="font-semibold text-green-600">{stats.distributedPayslips}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-gray-700">Pending Distribution</span>
              </div>
              <span className="font-semibold text-yellow-600">{stats.pendingDistribution}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-purple-500" />
                <span className="text-gray-700">Employee Views</span>
              </div>
              <span className="font-semibold text-purple-600">{stats.employeeAccessCount}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/payslips/generate"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg hover:from-green-100 hover:to-blue-100 transition-all duration-200 group"
            >
              <Zap className="h-6 w-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Generate</span>
            </Link>
            <Link
              href="/dashboard/payslips/templates"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all duration-200 group"
            >
              <Settings className="h-6 w-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Templates</span>
            </Link>
            <Link
              href="/dashboard/payslips/distribution"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 group"
            >
              <Send className="h-6 w-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Distribution</span>
            </Link>
            <Link
              href="/dashboard/payslips/archive"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg hover:from-yellow-100 hover:to-orange-100 transition-all duration-200 group"
            >
              <Archive className="h-6 w-6 text-yellow-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Archive</span>
            </Link>
            <Link
              href="/dashboard/payslips/employee-portal"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 group"
            >
              <Users className="h-6 w-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Employee Portal</span>
            </Link>
            <Link
              href="/dashboard/payslips/history"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-teal-50 to-green-50 rounded-lg hover:from-teal-100 hover:to-green-100 transition-all duration-200 group"
            >
              <History className="h-6 w-6 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">History</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Payslips & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Payslips</h3>
            <Link
              href="/dashboard/payslips/history"
              className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors"
            >
              <span className="text-sm">View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentPayslips.length > 0 ? (
              recentPayslips.map((payslip) => (
                <div key={payslip.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {payslip.employee?.first_name} {payslip.employee?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{payslip.employee?.job_title}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">Net: {formatCurrency(payslip.net_salary_aed)}</span>
                      {getStatusBadge(payslip.generation_status || 'generated', 'generation')}
                      {payslip.is_digitally_signed && (
                        <span className="inline-flex items-center text-xs text-purple-600">
                          <Signature className="h-3 w-3 mr-1" />
                          Signed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(payslip.issue_date).toLocaleDateString('en-AE')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No payslips generated yet</p>
                <p className="text-sm">Start by generating payslips for employees</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
            <Link
              href="/dashboard/payslips/history"
              className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors"
            >
              <span className="text-sm">View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <div className="mt-1 flex items-center space-x-2">
                      {getStatusBadge(activity.status, 'generation')}
                      {activity.distribution_method && (
                        <span className="text-xs text-gray-600">
                          via {activity.distribution_method}
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
                <p className="text-sm">Payslip activities will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}