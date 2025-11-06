'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Users,
  Calendar,
  FileText,
  Download,
  Upload,
  RefreshCw,
  CreditCard,
  Building2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import type { WPSCompliance } from '@/types/visa-compliance';

interface WPSWithSubmitter extends WPSCompliance {
  submitted_by?: {
    first_name: string;
    last_name: string;
  };
}

export default function WPSCompliancePage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wpsRecords, setWPSRecords] = useState<WPSWithSubmitter[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<WPSWithSubmitter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchWPSRecords();
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    filterRecords();
  }, [wpsRecords, searchTerm, statusFilter, yearFilter]);

  const fetchWPSRecords = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('wps_compliance')
        .select(`
          *,
          submitted_by:users!wps_compliance_submitted_by_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('month', { ascending: false });

      if (error) throw error;
      setWPSRecords(data || []);
    } catch (error) {
      console.error('Error fetching WPS records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...wpsRecords];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.month?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.confirmation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.bank_reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter(record => {
        const recordYear = new Date(record.month).getFullYear().toString();
        return recordYear === yearFilter;
      });
    }

    setFilteredRecords(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'submitted':
        return 'text-blue-600 bg-blue-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'submitted':
        return <Upload className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <AlertTriangle className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMonth = (monthString: string) => {
    return new Date(monthString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '0 AED';
    return `${amount.toLocaleString()} AED`;
  };

  const getDaysUntilDeadline = (deadlineDate: string | null) => {
    if (!deadlineDate) return null;
    const today = new Date();
    const deadline = new Date(deadlineDate);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isDeadlineClose = (deadlineDate: string | null) => {
    const days = getDaysUntilDeadline(deadlineDate);
    return days !== null && days <= 7 && days >= 0;
  };

  const isOverdue = (deadlineDate: string | null) => {
    const days = getDaysUntilDeadline(deadlineDate);
    return days !== null && days < 0;
  };

  const getUniqueYears = () => {
    const years = wpsRecords.map(record => new Date(record.month).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        </div>
      </div>
    );
  }

  const totalSalaries = wpsRecords.reduce((sum, record) => sum + (record.total_salary_aed || 0), 0);
  const pendingRecords = wpsRecords.filter(record => ['pending', 'processing'].includes(record.status));
  const overdueRecords = wpsRecords.filter(record => isOverdue(record.submission_deadline));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/visa-compliance">
              <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WPS Compliance</h1>
              <p className="text-gray-600 mt-1">Wages Protection System submissions and compliance tracking</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/70 text-gray-700 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2 border border-white/20">
              <Download className="w-4 h-4" />
              Export WPS Report
            </button>
            <Link href="/dashboard/visa-compliance/wps/new">
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New WPS Submission
              </button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search month, confirmation number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Years</option>
              {getUniqueYears().map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setYearFilter('all');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{wpsRecords.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending/Processing</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingRecords.length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{overdueRecords.length}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {wpsRecords.filter(record => record.status === 'approved').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Salaries</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {totalSalaries > 0 ? `${(totalSalaries / 1000000).toFixed(1)}M` : '0'} AED
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* WPS Records List */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">WPS Submissions ({filteredRecords.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => {
                  const deadlineDays = getDaysUntilDeadline(record.submission_deadline);
                  const isClose = isDeadlineClose(record.submission_deadline);
                  const isOverdueRecord = isOverdue(record.submission_deadline);
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatMonth(record.month)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {record.confirmation_number ? `Ref: ${record.confirmation_number}` : 'No confirmation'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          {record.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {record.total_employees}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(record.total_salary_aed)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${isOverdueRecord ? 'text-red-500' : isClose ? 'text-yellow-500' : 'text-gray-400'}`} />
                          <div>
                            <div className={`text-sm font-medium ${isOverdueRecord ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatDate(record.submission_deadline)}
                            </div>
                            {deadlineDays !== null && (
                              <div className={`text-xs ${isOverdueRecord ? 'text-red-600 font-medium' : isClose ? 'text-yellow-600 font-medium' : 'text-gray-500'}`}>
                                {deadlineDays > 0 ? `${deadlineDays} days left` : 
                                 deadlineDays === 0 ? 'Due today' : 
                                 `${Math.abs(deadlineDays)} days overdue`}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {record.submission_date ? (
                          <div>
                            <div className="text-sm text-gray-900">{formatDate(record.submission_date)}</div>
                            {record.submitted_by && (
                              <div className="text-xs text-gray-500">
                                by {record.submitted_by.first_name} {record.submitted_by.last_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Not submitted</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {record.sif_file_url && (
                            <a href={record.sif_file_url} target="_blank" rel="noopener noreferrer">
                              <button className="p-1 text-gray-400 hover:text-green-600 transition-colors" title="Download SIF file">
                                <Download className="w-4 h-4" />
                              </button>
                            </a>
                          )}
                          <Link href={`/dashboard/visa-compliance/wps/${record.id}`}>
                            <button className="p-1 text-gray-400 hover:text-purple-600 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <Link href={`/dashboard/visa-compliance/wps/${record.id}/edit`}>
                            <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No WPS submissions found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || yearFilter !== 'all'
                  ? 'Try adjusting your search filters'
                  : 'Start by creating your first WPS submission'
                }
              </p>
              {(!searchTerm && statusFilter === 'all' && yearFilter === 'all') && (
                <Link href="/dashboard/visa-compliance/wps/new">
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors">
                    Create First Submission
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Important WPS Information */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            WPS Compliance Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Important Deadlines:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• WPS submission due by 7th of each month</li>
                <li>• Late submissions may result in penalties</li>
                <li>• Bank file must be generated from approved payroll</li>
                <li>• Confirmation required within 48 hours</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Required Documents:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• SIF (Salary Information File) from bank</li>
                <li>• Approved payroll records</li>
                <li>• Employee salary certificates</li>
                <li>• Bank confirmation receipt</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}