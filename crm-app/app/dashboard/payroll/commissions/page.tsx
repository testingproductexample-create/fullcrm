'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp,
  Award,
  Target,
  DollarSign,
  Users,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle,
  Star,
  Zap,
  PieChart,
  Calendar,
  Coins,
  ArrowUp,
  ArrowDown,
  FileText,
  Calculator
} from 'lucide-react';

interface CommissionStats {
  totalCommissions: number;
  averageCommission: number;
  topPerformer: string;
  performanceGrowth: number;
  activeCommissionees: number;
  totalOrders: number;
  conversionRate: number;
  quarterlyGoal: number;
}

interface CommissionRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  job_title: string;
  commission_type: string;
  commission_amount: number;
  base_amount: number;
  commission_rate: number;
  performance_multiplier: number;
  order_count: number;
  achievement_metric: string;
  achievement_value: number;
  period_month: number;
  period_year: number;
  status: string;
  approved_by: string;
  approved_at: string;
}

interface CommissionRate {
  id: string;
  job_title: string;
  commission_type: string;
  base_percentage: number;
  tier_structure: any;
  performance_multiplier: number;
  minimum_threshold: number;
  maximum_cap: number;
  is_active: boolean;
}

interface TopPerformer {
  employee_name: string;
  job_title: string;
  total_commission: number;
  order_count: number;
  performance_score: number;
}

export default function CommissionManagementPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CommissionStats>({
    totalCommissions: 0,
    averageCommission: 0,
    topPerformer: '',
    performanceGrowth: 0,
    activeCommissionees: 0,
    totalOrders: 0,
    conversionRate: 0,
    quarterlyGoal: 0
  });
  const [commissionRecords, setCommissionRecords] = useState<CommissionRecord[]>([]);
  const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear()
    };
  });
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRateModal, setShowRateModal] = useState(false);

  useEffect(() => {
    if (user?.organization_id) {
      fetchData();
    }
  }, [user?.organization_id, selectedPeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCommissionRecords(),
        fetchCommissionRates(),
        fetchTopPerformers(),
        fetchStats()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionRecords = async () => {
    // Fetch from bonus_records table as commission data
    const { data, error } = await supabase
      .from('bonus_records')
      .select(`
        id,
        employee_id,
        bonus_type,
        amount_aed,
        bonus_period_month,
        bonus_period_year,
        performance_rating,
        achievement_metric,
        achievement_value,
        approval_status,
        approved_by,
        approved_at,
        employees!bonus_records_employee_id_fkey (
          full_name,
          job_title
        )
      `)
      .eq('organization_id', user?.organization_id)
      .eq('bonus_type', 'commission')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedData = data?.map(record => ({
      id: record.id,
      employee_id: record.employee_id,
      employee_name: record.employees?.full_name || 'Unknown',
      job_title: record.employees?.job_title || 'Unknown',
      commission_type: 'sales',
      commission_amount: record.amount_aed,
      base_amount: record.amount_aed * 0.8, // Estimated base
      commission_rate: 5.0, // Default rate
      performance_multiplier: 1.0,
      order_count: Math.floor(Math.random() * 10) + 1,
      achievement_metric: record.achievement_metric || 'sales_target',
      achievement_value: record.achievement_value || 100,
      period_month: record.bonus_period_month || selectedPeriod.month,
      period_year: record.bonus_period_year || selectedPeriod.year,
      status: record.approval_status,
      approved_by: record.approved_by || '',
      approved_at: record.approved_at || ''
    })) || [];

    setCommissionRecords(formattedData);
  };

  const fetchCommissionRates = async () => {
    const { data, error } = await supabase
      .from('commission_rates')
      .select('*')
      .eq('organization_id', user?.organization_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setCommissionRates(data || []);
  };

  const fetchTopPerformers = async () => {
    // Mock data for top performers
    const performers: TopPerformer[] = [
      {
        employee_name: 'Ahmed Al-Rashid',
        job_title: 'Senior Sales Associate',
        total_commission: 5680.00,
        order_count: 24,
        performance_score: 98.5
      },
      {
        employee_name: 'Sara Mohammed',
        job_title: 'Sales Manager',
        total_commission: 4320.00,
        order_count: 18,
        performance_score: 96.2
      },
      {
        employee_name: 'Omar Hassan',
        job_title: 'Senior Tailor',
        total_commission: 3890.00,
        order_count: 15,
        performance_score: 94.8
      },
      {
        employee_name: 'Fatima Al-Zahra',
        job_title: 'Design Consultant',
        total_commission: 3240.00,
        order_count: 12,
        performance_score: 92.1
      },
      {
        employee_name: 'Khalid Ibrahim',
        job_title: 'Customer Relations',
        total_commission: 2850.00,
        order_count: 10,
        performance_score: 89.7
      }
    ];
    setTopPerformers(performers);
  };

  const fetchStats = async () => {
    const totalCommissions = commissionRecords.reduce((sum, record) => sum + record.commission_amount, 0);
    const activeCommissionees = new Set(commissionRecords.map(r => r.employee_id)).size;
    const averageCommission = activeCommissionees > 0 ? totalCommissions / activeCommissionees : 0;
    const totalOrders = commissionRecords.reduce((sum, record) => sum + record.order_count, 0);

    setStats({
      totalCommissions,
      averageCommission,
      topPerformer: topPerformers[0]?.employee_name || 'N/A',
      performanceGrowth: 12.5, // Mock growth percentage
      activeCommissionees,
      totalOrders,
      conversionRate: 78.5, // Mock conversion rate
      quarterlyGoal: 50000 // Mock quarterly goal
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED'
    }).format(amount);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredRecords = commissionRecords.filter(record => {
    const matchesType = filterType === 'all' || record.commission_type === filterType;
    const matchesSearch = record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const periodName = new Date(selectedPeriod.year, selectedPeriod.month - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Commission Management</h1>
          <p className="text-gray-600">Track and manage sales commissions for {periodName}</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={`${selectedPeriod.year}-${selectedPeriod.month.toString().padStart(2, '0')}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              setSelectedPeriod({ year: parseInt(year), month: parseInt(month) });
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const year = date.getFullYear();
              const month = date.getMonth() + 1;
              return (
                <option key={i} value={`${year}-${month.toString().padStart(2, '0')}`}>
                  {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </option>
              );
            })}
          </select>
          <button
            onClick={() => setShowRateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Manage Rates
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="backdrop-blur-sm bg-white/70 rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Total Commissions</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalCommissions)}</div>
          <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
            <ArrowUp className="w-4 h-4" />
            {stats.performanceGrowth}% vs last month
          </div>
        </div>

        <div className="backdrop-blur-sm bg-white/70 rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Active Performers</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.activeCommissionees}</div>
          <div className="text-sm text-gray-600 mt-1">
            Avg: {formatCurrency(stats.averageCommission)}
          </div>
        </div>

        <div className="backdrop-blur-sm bg-white/70 rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Orders Generated</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
          <div className="text-sm text-purple-600 mt-1">
            {stats.conversionRate}% conversion rate
          </div>
        </div>

        <div className="backdrop-blur-sm bg-white/70 rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-500">Top Performer</span>
          </div>
          <div className="text-lg font-bold text-gray-900 truncate">{stats.topPerformer}</div>
          <div className="text-sm text-gray-600 mt-1">
            Goal: {formatCurrency(stats.quarterlyGoal)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="backdrop-blur-sm bg-white/70 rounded-2xl border border-white/20 shadow-xl mb-6">
        <div className="flex border-b border-gray-200/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'records'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Commission Records
          </button>
          <button
            onClick={() => setActiveTab('performers')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'performers'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Top Performers
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'rates'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Commission Rates
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Chart */}
              <div className="backdrop-blur-sm bg-white/50 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Monthly Performance
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    Performance chart placeholder
                  </div>
                </div>
              </div>

              {/* Commission Distribution */}
              <div className="backdrop-blur-sm bg-white/50 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  Commission Distribution
                </h3>
                <div className="space-y-4">
                  {topPerformers.slice(0, 3).map((performer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{performer.employee_name}</div>
                        <div className="text-sm text-gray-500">{performer.job_title}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(performer.total_commission)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {performer.order_count} orders
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div>
              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="sales">Sales Commission</option>
                    <option value="performance">Performance Bonus</option>
                    <option value="target">Target Achievement</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={fetchData} className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200/50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Employee</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Base Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Rate</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Commission</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Orders</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-gray-500">
                          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          {searchTerm || filterType !== 'all' ? 'No records match your filters' : 'No commission records found'}
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((record) => (
                        <tr key={record.id} className="border-b border-gray-100/50 hover:bg-gray-50/50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{record.employee_name}</div>
                              <div className="text-sm text-gray-500">{record.job_title}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize">{record.commission_type}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">{formatCurrency(record.base_amount)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-blue-600">{record.commission_rate}%</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-green-600">
                              {formatCurrency(record.commission_amount)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">{record.order_count}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(record.status)}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                                {record.status.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button className="p-1 text-blue-600 hover:text-blue-800">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-600 hover:text-gray-800">
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'performers' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topPerformers.map((performer, index) => (
                  <div key={index} className="backdrop-blur-sm bg-white/50 rounded-xl p-6 border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          index === 0 ? 'bg-yellow-100' :
                          index === 1 ? 'bg-gray-100' :
                          index === 2 ? 'bg-orange-100' : 'bg-blue-100'
                        }`}>
                          <Award className={`w-5 h-5 ${
                            index === 0 ? 'text-yellow-600' :
                            index === 1 ? 'text-gray-600' :
                            index === 2 ? 'text-orange-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      </div>
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    </div>
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900">{performer.employee_name}</h3>
                      <p className="text-sm text-gray-500">{performer.job_title}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Commission</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(performer.total_commission)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Orders</span>
                        <span className="font-medium">{performer.order_count}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Performance Score</span>
                        <span className={`font-medium ${getPerformanceColor(performer.performance_score)}`}>
                          {performer.performance_score}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rates' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Commission Rate Structure</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Rate
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {commissionRates.map((rate) => (
                  <div key={rate.id} className="backdrop-blur-sm bg-white/50 rounded-xl p-6 border border-white/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{rate.job_title}</h4>
                        <p className="text-sm text-gray-500 capitalize">{rate.commission_type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-gray-600 hover:text-gray-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        <div className={`w-2 h-2 rounded-full ${rate.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Base Rate</span>
                        <span className="font-medium">{rate.base_percentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Performance Multiplier</span>
                        <span className="font-medium">{rate.performance_multiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Minimum Threshold</span>
                        <span className="font-medium">{formatCurrency(rate.minimum_threshold || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Maximum Cap</span>
                        <span className="font-medium">{formatCurrency(rate.maximum_cap || 0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}