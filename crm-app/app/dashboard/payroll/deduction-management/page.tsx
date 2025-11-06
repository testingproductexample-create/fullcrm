'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Calculator, 
  TrendingDown,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  PlusCircle,
  ArrowRight,
  AlertCircle,
  Building,
  CreditCard,
  Shield,
  PieChart,
  BarChart3,
  Download,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Save,
  X,
  DollarSign,
  Home,
  Car,
  Heart,
  BookOpen,
  Phone,
  Zap,
  Coffee,
  Shirt,
  Wrench
} from 'lucide-react';
import Link from 'next/link';

interface DeductionStats {
  totalDeductions: number;
  totalTaxDeductions: number;
  totalLoanDeductions: number;
  totalInsuranceDeductions: number;
  totalOtherDeductions: number;
  pendingDeductions: number;
  processedDeductions: number;
  complianceScore: number;
}

interface DeductionRecord {
  id: string;
  employee_id: string;
  deduction_type: string;
  deduction_category: string;
  amount_aed: number;
  deduction_date: string;
  description: string;
  status: 'pending' | 'processed' | 'cancelled';
  period_month: number;
  period_year: number;
  is_recurring: boolean;
  created_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    job_title: string;
  };
}

interface EmployeeDeductionPreference {
  id: string;
  employee_id: string;
  auto_deductions: boolean;
  tax_rate_percentage: number;
  insurance_deductions: boolean;
  loan_deductions: boolean;
  other_deductions: boolean;
  preferred_deduction_day: number;
  created_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    job_title: string;
  };
}

type TabType = 'overview' | 'tax' | 'loan' | 'insurance' | 'other' | 'history' | 'preferences';

export default function DeductionManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<DeductionStats>({
    totalDeductions: 0,
    totalTaxDeductions: 0,
    totalLoanDeductions: 0,
    totalInsuranceDeductions: 0,
    totalOtherDeductions: 0,
    pendingDeductions: 0,
    processedDeductions: 0,
    complianceScore: 0
  });
  const [deductionRecords, setDeductionRecords] = useState<DeductionRecord[]>([]);
  const [employeePreferences, setEmployeePreferences] = useState<EmployeeDeductionPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadDeductionData();
    
    // Set current month
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    setCurrentMonth(`${monthNames[now.getMonth()]} ${now.getFullYear()}`);
  }, []);

  useEffect(() => {
    if (activeTab !== 'overview') {
      loadDeductionData();
    }
  }, [activeTab]);

  const loadDeductionData = async () => {
    try {
      setError(null);
      
      const now = new Date();
      const currentMonthNum = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      // Load deduction statistics
      const { data: deductions, error: deductionsError } = await supabase
        .from('deductions')
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name,
            job_title
          )
        `)
        .eq('period_month', currentMonthNum)
        .eq('period_year', currentYear)
        .order('created_at', { ascending: false });

      if (deductionsError) throw deductionsError;

      // Calculate statistics
      const deductionData = deductions || [];
      const totalDeductions = deductionData.reduce((sum, ded) => sum + (ded.amount_aed || 0), 0);
      const taxDeductions = deductionData.filter(ded => ded.deduction_category === 'tax').reduce((sum, ded) => sum + (ded.amount_aed || 0), 0);
      const loanDeductions = deductionData.filter(ded => ded.deduction_category === 'loan').reduce((sum, ded) => sum + (ded.amount_aed || 0), 0);
      const insuranceDeductions = deductionData.filter(ded => ded.deduction_category === 'insurance').reduce((sum, ded) => sum + (ded.amount_aed || 0), 0);
      const otherDeductions = deductionData.filter(ded => !['tax', 'loan', 'insurance'].includes(ded.deduction_category)).reduce((sum, ded) => sum + (ded.amount_aed || 0), 0);
      
      const pendingCount = deductionData.filter(ded => ded.status === 'pending').length;
      const processedCount = deductionData.filter(ded => ded.status === 'processed').length;
      
      // UAE compliance score
      const complianceScore = deductionData.length > 0 ? 
        Math.round((processedCount / deductionData.length) * 100) : 100;

      setStats({
        totalDeductions,
        totalTaxDeductions: taxDeductions,
        totalLoanDeductions: loanDeductions,
        totalInsuranceDeductions: insuranceDeductions,
        totalOtherDeductions: otherDeductions,
        pendingDeductions: pendingCount,
        processedDeductions: processedCount,
        complianceScore
      });

      setDeductionRecords(deductionData);
      
      // Load employee preferences
      const { data: preferences, error: preferencesError } = await supabase
        .from('employee_deduction_preferences')
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name,
            job_title
          )
        `)
        .order('created_at', { ascending: false });

      if (preferencesError) throw preferencesError;
      setEmployeePreferences(preferences || []);
      
    } catch (error: any) {
      console.error('Error loading deduction data:', error);
      setError(error.message || 'Failed to load deduction data');
    } finally {
      setLoading(false);
    }
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
      case 'processed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Processed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const getDeductionIcon = (category: string) => {
    switch (category) {
      case 'tax':
        return <Calculator className="h-5 w-5 text-red-600" />;
      case 'loan':
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case 'insurance':
        return <Shield className="h-5 w-5 text-green-600" />;
      case 'housing':
        return <Home className="h-5 w-5 text-purple-600" />;
      case 'transportation':
        return <Car className="h-5 w-5 text-indigo-600" />;
      case 'healthcare':
        return <Heart className="h-5 w-5 text-pink-600" />;
      case 'education':
        return <BookOpen className="h-5 w-5 text-yellow-600" />;
      case 'communication':
        return <Phone className="h-5 w-5 text-cyan-600" />;
      case 'utilities':
        return <Zap className="h-5 w-5 text-orange-600" />;
      case 'meals':
        return <Coffee className="h-5 w-5 text-amber-600" />;
      case 'uniform':
        return <Shirt className="h-5 w-5 text-teal-600" />;
      case 'maintenance':
        return <Wrench className="h-5 w-5 text-gray-600" />;
      default:
        return <TrendingDown className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredDeductions = deductionRecords.filter(deduction => {
    const matchesSearch = deduction.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deduction.employee?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deduction.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || deduction.deduction_category === filterType;
    
    return matchesSearch && matchesFilter;
  });

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
            <h3 className="text-lg font-semibold">Error Loading Deduction Management</h3>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => loadDeductionData()}
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
              Deduction Management
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive deduction calculations, loan management, and UAE compliance tracking for {currentMonth}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Period</p>
              <p className="font-semibold text-gray-700">{currentMonth}</p>
            </div>
            <div className="h-8 w-px bg-gradient-to-b from-purple-200 to-pink-200"></div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Deduction</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: PieChart },
              { id: 'tax', label: 'Tax Deductions', icon: Calculator },
              { id: 'loan', label: 'Loans & Advances', icon: CreditCard },
              { id: 'insurance', label: 'Insurance & Benefits', icon: Shield },
              { id: 'other', label: 'Other Deductions', icon: TrendingDown },
              { id: 'history', label: 'History & Reports', icon: FileText },
              { id: 'preferences', label: 'Employee Preferences', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-card p-6 border-gradient-purple-pink">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Deductions</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalDeductions)}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.processedDeductions} processed</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border-gradient-red-pink">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tax Deductions</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalTaxDeductions)}</p>
                  <p className="text-xs text-red-600 mt-1">UAE compliant</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg">
                  <Calculator className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border-gradient-blue-purple">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Loan Deductions</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalLoanDeductions)}</p>
                  <p className="text-xs text-blue-600 mt-1">Employee loans</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border-gradient-green-blue">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Insurance Deductions</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalInsuranceDeductions)}</p>
                  <p className="text-xs text-green-600 mt-1">Health & life</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions and Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Deduction Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span className="text-gray-700">Pending</span>
                  </div>
                  <span className="font-semibold text-yellow-600">{stats.pendingDeductions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">Processed</span>
                  </div>
                  <span className="font-semibold text-green-600">{stats.processedDeductions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <span className="text-gray-700">Compliance Score</span>
                  </div>
                  <span className="font-semibold text-blue-600">{stats.complianceScore}%</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('tax')}
                  className="flex flex-col items-center p-3 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg hover:from-red-100 hover:to-pink-100 transition-all duration-200 group"
                >
                  <Calculator className="h-6 w-6 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-700">Tax</span>
                </button>
                <button
                  onClick={() => setActiveTab('loan')}
                  className="flex flex-col items-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-all duration-200 group"
                >
                  <CreditCard className="h-6 w-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-700">Loans</span>
                </button>
                <button
                  onClick={() => setActiveTab('insurance')}
                  className="flex flex-col items-center p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg hover:from-green-100 hover:to-blue-100 transition-all duration-200 group"
                >
                  <Shield className="h-6 w-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-700">Insurance</span>
                </button>
                <button
                  onClick={() => setActiveTab('other')}
                  className="flex flex-col items-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all duration-200 group"
                >
                  <TrendingDown className="h-6 w-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-700">Other</span>
                </button>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {deductionRecords.slice(0, 3).map((deduction) => (
                  <div key={deduction.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getDeductionIcon(deduction.deduction_category)}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {deduction.employee?.first_name} {deduction.employee?.last_name}
                        </p>
                        <p className="text-xs text-gray-600">{deduction.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">{formatCurrency(deduction.amount_aed)}</p>
                      {getStatusBadge(deduction.status)}
                    </div>
                  </div>
                ))}
                {deductionRecords.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <TrendingDown className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">No recent deductions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Tabs Content */}
      {activeTab !== 'overview' && (
        <div>
          {/* Search and Filter Bar */}
          <div className="glass-card p-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search deductions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {activeTab === 'tax' && <option value="tax">Tax</option>}
                  {activeTab === 'loan' && <option value="loan">Loan</option>}
                  {activeTab === 'insurance' && <option value="insurance">Insurance</option>}
                  {activeTab === 'other' && <option value="housing">Housing</option>}
                  {activeTab === 'other' && <option value="transportation">Transportation</option>}
                  {activeTab === 'other' && <option value="healthcare">Healthcare</option>}
                  {activeTab === 'other' && <option value="education">Education</option>}
                  {activeTab === 'other' && <option value="communication">Communication</option>}
                  {activeTab === 'other' && <option value="utilities">Utilities</option>}
                  {activeTab === 'other' && <option value="meals">Meals</option>}
                  {activeTab === 'other' && <option value="uniform">Uniform</option>}
                  {activeTab === 'other' && <option value="maintenance">Maintenance</option>}
                </select>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Deduction</span>
              </button>
            </div>
          </div>

          {/* Deductions List */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {activeTab === 'tax' && 'Tax Deductions'}
                {activeTab === 'loan' && 'Loan & Advance Deductions'}
                {activeTab === 'insurance' && 'Insurance & Benefits Deductions'}
                {activeTab === 'other' && 'Other Deductions'}
                {activeTab === 'history' && 'Deduction History & Reports'}
                {activeTab === 'preferences' && 'Employee Deduction Preferences'}
              </h3>
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                  <BarChart3 className="h-4 w-4" />
                  <span>Report</span>
                </button>
              </div>
            </div>

            {activeTab === 'preferences' ? (
              /* Employee Preferences List */
              <div className="space-y-4">
                {employeePreferences.length > 0 ? (
                  employeePreferences.map((preference) => (
                    <div key={preference.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                          <Settings className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {preference.employee?.first_name} {preference.employee?.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{preference.employee?.job_title}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>Tax Rate: {preference.tax_rate_percentage}%</span>
                            <span>Pay Day: {preference.preferred_deduction_day}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right mr-4">
                          <div className="flex items-center space-x-2">
                            {preference.auto_deductions ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Auto</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Manual</span>
                            )}
                            {preference.insurance_deductions && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Insurance</span>
                            )}
                            {preference.loan_deductions && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Loans</span>
                            )}
                          </div>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p>No employee preferences configured</p>
                    <p className="text-sm">Set up automatic deduction preferences for employees</p>
                  </div>
                )}
              </div>
            ) : (
              /* Deductions List */
              <div className="space-y-4">
                {filteredDeductions.length > 0 ? (
                  filteredDeductions.map((deduction) => (
                    <div key={deduction.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                          {getDeductionIcon(deduction.deduction_category)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {deduction.employee?.first_name} {deduction.employee?.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{deduction.description}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>{deduction.deduction_type}</span>
                            <span>{new Date(deduction.deduction_date).toLocaleDateString('en-AE')}</span>
                            {deduction.is_recurring && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Recurring</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(deduction.amount_aed)}</p>
                          {getStatusBadge(deduction.status)}
                        </div>
                        <div className="flex items-center space-x-1">
                          <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingDown className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p>No deductions found</p>
                    <p className="text-sm">
                      {searchTerm || filterType !== 'all' 
                        ? 'Try adjusting your search or filter criteria' 
                        : 'Start by adding deductions for employees'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Deduction Modal - Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add New Deduction</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">Deduction creation form will be implemented here</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}