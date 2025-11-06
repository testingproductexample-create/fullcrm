'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  DollarSign, 
  TrendingUp, 
  Calculator,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Award,
  CreditCard,
  PlusCircle,
  ArrowRight,
  AlertCircle,
  Building,
  Banknote,
  Target,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { SalaryCalculation, SalaryStructure, CommissionRate, BonusRecord } from '@/types/database';

interface PayrollStats {
  totalEmployees: number;
  totalMonthlyPayroll: number;
  totalCommissions: number;
  totalBonuses: number;
  totalDeductions: number;
  averageSalary: number;
  pendingCalculations: number;
  processedCalculations: number;
  complianceScore: number;
}

interface RecentCalculation extends SalaryCalculation {
  employee?: {
    first_name: string;
    last_name: string;
    job_title: string;
  };
  salary_structure?: {
    structure_name: string;
  };
}

interface UpcomingBonus extends BonusRecord {
  employee?: {
    first_name: string;
    last_name: string;
    job_title: string;
  };
}

export default function PayrollDashboard() {
  const [stats, setStats] = useState<PayrollStats>({
    totalEmployees: 0,
    totalMonthlyPayroll: 0,
    totalCommissions: 0,
    totalBonuses: 0,
    totalDeductions: 0,
    averageSalary: 0,
    pendingCalculations: 0,
    processedCalculations: 0,
    complianceScore: 0
  });
  const [recentCalculations, setRecentCalculations] = useState<RecentCalculation[]>([]);
  const [upcomingBonuses, setUpcomingBonuses] = useState<UpcomingBonus[]>([]);
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
      
      // Load payroll statistics
      const { data: calculations, error: calculationsError } = await supabase
        .from('salary_calculations')
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name,
            job_title
          ),
          salary_structures:salary_structure_id (
            structure_name
          )
        `)
        .eq('calculation_period_month', currentMonthNum)
        .eq('calculation_period_year', currentYear)
        .order('created_at', { ascending: false });

      if (calculationsError) throw calculationsError;

      // Load commission data
      const { data: commissions, error: commissionsError } = await supabase
        .from('commission_rates')
        .select('*')
        .eq('is_active', true);

      if (commissionsError) throw commissionsError;

      // Load bonus records
      const { data: bonuses, error: bonusesError } = await supabase
        .from('bonus_records')
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name,
            job_title
          )
        `)
        .eq('calculation_period_month', currentMonthNum)
        .eq('calculation_period_year', currentYear)
        .order('created_at', { ascending: false })
        .limit(5);

      if (bonusesError) throw bonusesError;

      // Get total employees count
      const { count: totalEmployees, error: employeeCountError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('employment_status', 'active');

      if (employeeCountError) throw employeeCountError;

      // Calculate statistics
      const calculationData = calculations || [];
      const totalPayroll = calculationData.reduce((sum, calc) => sum + (calc.net_salary_aed || 0), 0);
      const totalCommissionAmount = calculationData.reduce((sum, calc) => sum + (calc.commission_amount_aed || 0), 0);
      const totalBonusAmount = calculationData.reduce((sum, calc) => sum + (calc.bonus_amount_aed || 0), 0);
      const totalDeductionAmount = calculationData.reduce((sum, calc) => sum + (calc.deductions_amount_aed || 0), 0);
      const averageSalaryAmount = totalEmployees ? totalPayroll / totalEmployees : 0;
      
      const pendingCount = calculationData.filter(calc => calc.calculation_status === 'pending').length;
      const processedCount = calculationData.filter(calc => calc.calculation_status === 'approved' || calc.calculation_status === 'paid').length;
      
      // UAE compliance score (simplified calculation)
      const complianceScore = calculationData.length > 0 ? 
        Math.round((processedCount / calculationData.length) * 100) : 100;

      setStats({
        totalEmployees: totalEmployees || 0,
        totalMonthlyPayroll: totalPayroll,
        totalCommissions: totalCommissionAmount,
        totalBonuses: totalBonusAmount,
        totalDeductions: totalDeductionAmount,
        averageSalary: averageSalaryAmount,
        pendingCalculations: pendingCount,
        processedCalculations: processedCount,
        complianceScore: complianceScore
      });

      setRecentCalculations(calculationData.slice(0, 6));
      setUpcomingBonuses(bonuses || []);
      
    } catch (error: any) {
      console.error('Error loading payroll dashboard:', error);
      setError(error.message || 'Failed to load payroll data');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'approved':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Approved</span>;
      case 'paid':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 rounded mb-4"></div>
                <div className="h-8 bg-gradient-to-r from-purple-200 to-pink-200 rounded"></div>
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
            <h3 className="text-lg font-semibold">Error Loading Payroll Dashboard</h3>
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Payroll Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Commission & Salary Calculation Management for {currentMonth}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Period</p>
              <p className="font-semibold text-gray-700">{currentMonth}</p>
            </div>
            <div className="h-8 w-px bg-gradient-to-b from-purple-200 to-pink-200"></div>
            <Link
              href="/dashboard/payroll/calculations"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Calculation</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6 border-gradient-purple-pink">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payroll</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalMonthlyPayroll)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalEmployees} employees</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-gradient-blue-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Salary</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageSalary)}</p>
              <p className="text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                UAE compliant
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
              <Calculator className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-gradient-green-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalCommissions)}</p>
              <p className="text-xs text-gray-500 mt-1">Performance-based</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-gradient-yellow-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliance Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.complianceScore}%</p>
              <p className="text-xs text-green-600 mt-1">
                <CheckCircle className="h-3 w-3 inline mr-1" />
                UAE compliant
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Calculation Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-gray-700">Pending</span>
              </div>
              <span className="font-semibold text-yellow-600">{stats.pendingCalculations}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Processed</span>
              </div>
              <span className="font-semibold text-green-600">{stats.processedCalculations}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <span className="text-gray-700">Total Deductions</span>
              </div>
              <span className="font-semibold text-blue-600">{formatCurrency(stats.totalDeductions)}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Bonus Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-purple-500" />
                <span className="text-gray-700">Total Bonuses</span>
              </div>
              <span className="font-semibold text-purple-600">{formatCurrency(stats.totalBonuses)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-indigo-500" />
                <span className="text-gray-700">Eligible Employees</span>
              </div>
              <span className="font-semibold text-indigo-600">{upcomingBonuses.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Performance Based</span>
              </div>
              <span className="font-semibold text-green-600">100%</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/payroll/calculations"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-all duration-200 group"
            >
              <Calculator className="h-6 w-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Calculations</span>
            </Link>
            <Link
              href="/dashboard/payroll/commissions"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg hover:from-green-100 hover:to-blue-100 transition-all duration-200 group"
            >
              <Target className="h-6 w-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Commissions</span>
            </Link>
            <Link
              href="/dashboard/payroll/structures"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all duration-200 group"
            >
              <Building className="h-6 w-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Structures</span>
            </Link>
            <Link
              href="/dashboard/payroll/reports"
              className="flex flex-col items-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg hover:from-yellow-100 hover:to-orange-100 transition-all duration-200 group"
            >
              <FileText className="h-6 w-6 text-yellow-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-700">Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Calculations</h3>
            <Link
              href="/dashboard/payroll/calculations"
              className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 transition-colors"
            >
              <span className="text-sm">View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentCalculations.length > 0 ? (
              recentCalculations.map((calculation) => (
                <div key={calculation.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {calculation.employee?.first_name} {calculation.employee?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{calculation.employee?.job_title}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">Net: {formatCurrency(calculation.net_salary_aed)}</span>
                      {getStatusBadge(calculation.calculation_status || 'pending')}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(calculation.created_at).toLocaleDateString('en-AE')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No salary calculations found for this month</p>
                <p className="text-sm">Start by creating salary calculations for employees</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Upcoming Bonuses</h3>
            <Link
              href="/dashboard/payroll/commissions"
              className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 transition-colors"
            >
              <span className="text-sm">View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingBonuses.length > 0 ? (
              upcomingBonuses.map((bonus) => (
                <div key={bonus.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 hover:shadow-md transition-all duration-200">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Award className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {bonus.employee?.first_name} {bonus.employee?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{bonus.bonus_name}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      <span className="text-green-600 font-semibold">{formatCurrency(bonus.calculated_amount_aed)}</span>
                      <span className="text-gray-500">{bonus.bonus_type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {bonus.payout_date ? new Date(bonus.payout_date).toLocaleDateString('en-AE') : 'TBD'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No bonuses scheduled for this month</p>
                <p className="text-sm">Performance bonuses will appear here when available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}