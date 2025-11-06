'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Calculator,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Calendar,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Search,
  Edit,
  Eye,
  Send,
  Archive,
  Settings,
  Coins,
  Award,
  CreditCard,
  PiggyBank,
  Target,
  BarChart3,
  Zap
} from 'lucide-react';

interface MonthlyStats {
  totalEmployees: number;
  calculationsCompleted: number;
  pendingApproval: number;
  totalPayroll: number;
  averageSalary: number;
  totalOvertime: number;
  totalCommissions: number;
  totalDeductions: number;
}

interface SalaryCalculation {
  id: string;
  employee_id: string;
  employee_name: string;
  job_title: string;
  calculation_period_month: number;
  calculation_period_year: number;
  base_salary_aed: number;
  overtime_amount_aed: number;
  commission_amount_aed: number;
  bonus_amount_aed: number;
  allowances_amount_aed: number;
  gross_salary_aed: number;
  deductions_amount_aed: number;
  tax_amount_aed: number;
  net_salary_aed: number;
  calculation_status: string;
  calculation_date: string;
  approved_by: string;
  approved_at: string;
  paid_at: string;
  payment_reference: string;
}

interface Employee {
  id: string;
  full_name: string;
  job_title: string;
  department: string;
  salary_structure_id: string;
}

export default function SalaryCalculationsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MonthlyStats>({
    totalEmployees: 0,
    calculationsCompleted: 0,
    pendingApproval: 0,
    totalPayroll: 0,
    averageSalary: 0,
    totalOvertime: 0,
    totalCommissions: 0,
    totalDeductions: 0
  });
  const [calculations, setCalculations] = useState<SalaryCalculation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear()
    };
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user?.organization_id) {
      fetchData();
    }
  }, [user?.organization_id, selectedPeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCalculations(),
        fetchStats(),
        fetchEmployees()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalculations = async () => {
    const { data, error } = await supabase
      .from('salary_calculations')
      .select(`
        id,
        employee_id,
        calculation_period_month,
        calculation_period_year,
        base_salary_aed,
        overtime_amount_aed,
        commission_amount_aed,
        bonus_amount_aed,
        allowances_amount_aed,
        gross_salary_aed,
        deductions_amount_aed,
        tax_amount_aed,
        net_salary_aed,
        calculation_status,
        calculation_date,
        approved_by,
        approved_at,
        paid_at,
        payment_reference,
        employees!salary_calculations_employee_id_fkey (
          full_name,
          job_title
        )
      `)
      .eq('organization_id', user?.organization_id)
      .eq('calculation_period_month', selectedPeriod.month)
      .eq('calculation_period_year', selectedPeriod.year)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedData = data?.map(calc => ({
      ...calc,
      employee_name: calc.employees?.full_name || 'Unknown',
      job_title: calc.employees?.job_title || 'Unknown'
    })) || [];

    setCalculations(formattedData);
  };

  const fetchStats = async () => {
    const { data: calcData, error: calcError } = await supabase
      .from('salary_calculations')
      .select('*')
      .eq('organization_id', user?.organization_id)
      .eq('calculation_period_month', selectedPeriod.month)
      .eq('calculation_period_year', selectedPeriod.year);

    if (calcError) throw calcError;

    const { count: empCount, error: empError } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', user?.organization_id)
      .eq('employment_status', 'active');

    if (empError) throw empError;

    const completed = calcData?.filter(c => c.calculation_status === 'completed').length || 0;
    const pending = calcData?.filter(c => c.calculation_status === 'pending_approval').length || 0;
    const totalPayroll = calcData?.reduce((sum, c) => sum + (c.net_salary_aed || 0), 0) || 0;
    const totalOvertime = calcData?.reduce((sum, c) => sum + (c.overtime_amount_aed || 0), 0) || 0;
    const totalCommissions = calcData?.reduce((sum, c) => sum + (c.commission_amount_aed || 0), 0) || 0;
    const totalDeductions = calcData?.reduce((sum, c) => sum + (c.deductions_amount_aed || 0), 0) || 0;
    const averageSalary = calcData?.length ? totalPayroll / calcData.length : 0;

    setStats({
      totalEmployees: empCount || 0,
      calculationsCompleted: completed,
      pendingApproval: pending,
      totalPayroll,
      averageSalary,
      totalOvertime,
      totalCommissions,
      totalDeductions
    });
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        id,
        full_name,
        job_title,
        departments (name)
      `)
      .eq('organization_id', user?.organization_id)
      .eq('employment_status', 'active');

    if (error) throw error;

    const formattedData = data?.map(emp => ({
      ...emp,
      department: emp.departments?.name || 'Unassigned'
    })) || [];

    setEmployees(formattedData);
  };

  const runBulkCalculation = async () => {
    try {
      setProcessing(true);
      
      // Here you would implement the bulk calculation logic
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await fetchData();
      setShowCalculateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setProcessing(false);
    }
  };

  const approveCalculation = async (calculationId: string) => {
    try {
      const { error } = await supabase
        .from('salary_calculations')
        .update({
          calculation_status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', calculationId);

      if (error) throw error;
      await fetchCalculations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    }
  };

  const markAsPaid = async (calculationId: string) => {
    try {
      const paymentRef = `PAY-${Date.now()}`;
      const { error } = await supabase
        .from('salary_calculations')
        .update({
          calculation_status: 'paid',
          paid_at: new Date().toISOString(),
          payment_reference: paymentRef
        })
        .eq('id', calculationId);

      if (error) throw error;
      await fetchCalculations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment marking failed');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED'
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending_approval':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredCalculations = calculations.filter(calc => {
    const matchesStatus = filterStatus === 'all' || calc.calculation_status === filterStatus;
    const matchesSearch = calc.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         calc.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Monthly Salary Calculations</h1>
          <p className="text-gray-600">Manage salary calculations for {periodName}</p>
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
            onClick={() => setShowCalculateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Calculator className="w-4 h-4" />
            Calculate Salaries
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
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total Employees</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</div>
          <div className="text-sm text-green-600 mt-1">
            {stats.calculationsCompleted}/{stats.totalEmployees} calculated
          </div>
        </div>

        <div className="backdrop-blur-sm bg-white/70 rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Total Payroll</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPayroll)}</div>
          <div className="text-sm text-gray-600 mt-1">
            Avg: {formatCurrency(stats.averageSalary)}
          </div>
        </div>

        <div className="backdrop-blur-sm bg-white/70 rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-500">Pending Approval</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.pendingApproval}</div>
          <div className="text-sm text-yellow-600 mt-1">
            Requires attention
          </div>
        </div>

        <div className="backdrop-blur-sm bg-white/70 rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Overtime</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalOvertime)}</div>
          <div className="text-sm text-gray-600 mt-1">
            Commissions: {formatCurrency(stats.totalCommissions)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="backdrop-blur-sm bg-white/70 rounded-2xl p-6 border border-white/20 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending_calculation">Pending Calculation</option>
              <option value="completed">Calculated</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
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
      </div>

      {/* Calculations Table */}
      <div className="backdrop-blur-sm bg-white/70 rounded-2xl border border-white/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/50">
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Employee</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Base Salary</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Overtime</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Commission</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Gross</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Deductions</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Net Salary</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalculations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    {searchTerm || filterStatus !== 'all' ? 'No calculations match your filters' : 'No salary calculations found for this period'}
                  </td>
                </tr>
              ) : (
                filteredCalculations.map((calculation) => (
                  <tr key={calculation.id} className="border-b border-gray-100/50 hover:bg-gray-50/50">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{calculation.employee_name}</div>
                        <div className="text-sm text-gray-500">{calculation.job_title}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium">{formatCurrency(calculation.base_salary_aed)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-orange-600">
                        {formatCurrency(calculation.overtime_amount_aed || 0)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-green-600">
                        {formatCurrency(calculation.commission_amount_aed || 0)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold">{formatCurrency(calculation.gross_salary_aed)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-red-600">
                        -{formatCurrency(calculation.deductions_amount_aed || 0)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-blue-600">
                        {formatCurrency(calculation.net_salary_aed)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(calculation.calculation_status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(calculation.calculation_status)}`}>
                          {calculation.calculation_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-600 hover:text-gray-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        {calculation.calculation_status === 'pending_approval' && (
                          <button 
                            onClick={() => approveCalculation(calculation.id)}
                            className="p-1 text-green-600 hover:text-green-800"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {calculation.calculation_status === 'approved' && (
                          <button 
                            onClick={() => markAsPaid(calculation.id)}
                            className="p-1 text-green-600 hover:text-green-800"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Calculation Modal */}
      {showCalculateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Calculate Monthly Salaries</h3>
            <p className="text-gray-600 mb-6">
              This will calculate salaries for all active employees for {periodName}.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCalculateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={runBulkCalculation}
                disabled={processing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    Calculate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}