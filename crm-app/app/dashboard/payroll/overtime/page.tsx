'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Clock,
  Calculator,
  DollarSign,
  Users,
  Car,
  Coffee,
  Home,
  Award,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Target,
  Settings,
  FileText,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Eye,
  Save,
  X
} from 'lucide-react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { OvertimeCalculation, Allowance, Profile } from '@/types/database';

interface OvertimeStats {
  totalOvertimeHours: number;
  totalOvertimeAmount: number;
  totalAllowances: number;
  averageOvertimePerEmployee: number;
  complianceScore: number;
  pendingApprovals: number;
}

interface AllowanceType {
  id: string;
  type: 'transportation' | 'meal' | 'accommodation' | 'skills' | 'communication' | 'other';
  name: string;
  description: string;
  defaultAmount: number;
  isActive: boolean;
  eligibilityRules: Record<string, any>;
}

interface EmployeeOvertimeData {
  employee: Profile;
  regularHours: number;
  overtimeHours: number;
  overtimeAmount: number;
  overtimeRate: number;
  allowances: Allowance[];
  totalAllowanceAmount: number;
  complianceStatus: 'compliant' | 'exceeds_limit' | 'pending_approval';
}

interface AllowanceTemplate {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  transportationAmount: number;
  mealAmount: number;
  accommodationAmount: number;
  skillsAmount: number;
  totalAmount: number;
  isActive: boolean;
}

export default function OvertimeAllowancePage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OvertimeStats>({
    totalOvertimeHours: 0,
    totalOvertimeAmount: 0,
    totalAllowances: 0,
    averageOvertimePerEmployee: 0,
    complianceScore: 0,
    pendingApprovals: 0
  });

  const [employeeData, setEmployeeData] = useState<EmployeeOvertimeData[]>([]);
  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([]);
  const [allowanceTemplates, setAllowanceTemplates] = useState<AllowanceTemplate[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'overtime' | 'allowances' | 'templates' | 'compliance'>('overview');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [showCreateAllowance, setShowCreateAllowance] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // UAE Labor Law Constants
  const UAE_MAX_WEEKLY_HOURS = 48;
  const UAE_MAX_DAILY_HOURS = 8;
  const UAE_OVERTIME_RATE = 1.25; // 125% of basic hourly rate
  const UAE_FRIDAY_OVERTIME_RATE = 1.5; // 150% for Friday work
  const UAE_HOLIDAY_OVERTIME_RATE = 1.5; // 150% for holiday work

  useEffect(() => {
    if (profile?.organization_id) {
      fetchOvertimeAllowanceData();
    }
  }, [profile, selectedMonth]);

  const fetchOvertimeAllowanceData = async () => {
    if (!profile?.organization_id) return;
    
    try {
      setLoading(true);
      setRefreshing(true);

      const monthStart = startOfMonth(new Date(selectedMonth + '-01'));
      const monthEnd = endOfMonth(new Date(selectedMonth + '-01'));

      // Fetch overtime calculations for the selected month
      const { data: overtimeData, error: overtimeError } = await supabase
        .from('overtime_calculations')
        .select(`
          *,
          employee:profiles(*)
        `)
        .eq('organization_id', profile.organization_id)
        .gte('calculation_date', monthStart.toISOString())
        .lte('calculation_date', monthEnd.toISOString())
        .order('calculation_date', { ascending: false });

      if (overtimeError) throw overtimeError;

      // Fetch allowances for the selected month
      const { data: allowancesData, error: allowancesError } = await supabase
        .from('allowances')
        .select(`
          *,
          employee:profiles(*)
        `)
        .eq('organization_id', profile.organization_id)
        .gte('effective_date', monthStart.toISOString())
        .lte('effective_date', monthEnd.toISOString())
        .order('effective_date', { ascending: false });

      if (allowancesError) throw allowancesError;

      // Fetch all employees for comprehensive data
      const { data: employeesData, error: employeesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('full_name');

      if (employeesError) throw employeesError;

      // Process data
      const processedEmployeeData = processEmployeeOvertimeData(
        employeesData || [],
        overtimeData || [],
        allowancesData || []
      );

      setEmployeeData(processedEmployeeData);

      // Calculate statistics
      const overtimeStats = calculateOvertimeStats(processedEmployeeData);
      setStats(overtimeStats);

      // Load allowance types and templates
      await fetchAllowanceTypes();
      await fetchAllowanceTemplates();

    } catch (error) {
      console.error('Error fetching overtime and allowance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processEmployeeOvertimeData = (
    employees: Profile[],
    overtimeRecords: any[],
    allowanceRecords: any[]
  ): EmployeeOvertimeData[] => {
    return employees.map(employee => {
      const employeeOvertime = overtimeRecords.filter(ot => ot.employee_id === employee.id);
      const employeeAllowances = allowanceRecords.filter(al => al.employee_id === employee.id);
      
      const totalOvertimeHours = employeeOvertime.reduce((sum, ot) => sum + (ot.overtime_hours || 0), 0);
      const totalOvertimeAmount = employeeOvertime.reduce((sum, ot) => sum + (ot.overtime_amount_aed || 0), 0);
      const totalAllowanceAmount = employeeAllowances.reduce((sum, al) => sum + (al.amount_aed || 0), 0);
      
      // Determine compliance status
      const weeklyHours = totalOvertimeHours + (UAE_MAX_WEEKLY_HOURS * 4); // Approximate monthly hours
      let complianceStatus: 'compliant' | 'exceeds_limit' | 'pending_approval' = 'compliant';
      
      if (totalOvertimeHours > UAE_MAX_WEEKLY_HOURS) {
        complianceStatus = 'exceeds_limit';
      } else if (employeeOvertime.some(ot => ot.approval_status === 'pending')) {
        complianceStatus = 'pending_approval';
      }

      return {
        employee,
        regularHours: UAE_MAX_WEEKLY_HOURS * 4, // Approximate monthly regular hours
        overtimeHours: totalOvertimeHours,
        overtimeAmount: totalOvertimeAmount,
        overtimeRate: employeeOvertime[0]?.hourly_rate_aed * UAE_OVERTIME_RATE || 0,
        allowances: employeeAllowances,
        totalAllowanceAmount,
        complianceStatus
      };
    });
  };

  const calculateOvertimeStats = (data: EmployeeOvertimeData[]): OvertimeStats => {
    const totalOvertimeHours = data.reduce((sum, emp) => sum + emp.overtimeHours, 0);
    const totalOvertimeAmount = data.reduce((sum, emp) => sum + emp.overtimeAmount, 0);
    const totalAllowances = data.reduce((sum, emp) => sum + emp.totalAllowanceAmount, 0);
    const activeEmployees = data.filter(emp => emp.overtimeHours > 0 || emp.totalAllowanceAmount > 0).length;
    const averageOvertimePerEmployee = activeEmployees > 0 ? totalOvertimeHours / activeEmployees : 0;
    const pendingApprovals = data.filter(emp => emp.complianceStatus === 'pending_approval').length;
    const compliantEmployees = data.filter(emp => emp.complianceStatus === 'compliant').length;
    const complianceScore = data.length > 0 ? Math.round((compliantEmployees / data.length) * 100) : 100;

    return {
      totalOvertimeHours,
      totalOvertimeAmount,
      totalAllowances,
      averageOvertimePerEmployee,
      complianceScore,
      pendingApprovals
    };
  };

  const fetchAllowanceTypes = async () => {
    // Default allowance types for UAE tailoring business
    const defaultAllowanceTypes: AllowanceType[] = [
      {
        id: 'transportation',
        type: 'transportation',
        name: 'Transportation Allowance',
        description: 'Monthly transportation allowance for commuting',
        defaultAmount: 500,
        isActive: true,
        eligibilityRules: { minExperience: 0 }
      },
      {
        id: 'meal',
        type: 'meal', 
        name: 'Meal Allowance',
        description: 'Daily meal allowance during work hours',
        defaultAmount: 300,
        isActive: true,
        eligibilityRules: { minHours: 8 }
      },
      {
        id: 'accommodation',
        type: 'accommodation',
        name: 'Accommodation Allowance',
        description: 'Monthly housing/accommodation allowance',
        defaultAmount: 2000,
        isActive: true,
        eligibilityRules: { isResident: false }
      },
      {
        id: 'skills',
        type: 'skills',
        name: 'Skills & Certification Allowance',
        description: 'Additional allowance for specialized skills',
        defaultAmount: 750,
        isActive: true,
        eligibilityRules: { hasCertification: true }
      }
    ];
    
    setAllowanceTypes(defaultAllowanceTypes);
  };

  const fetchAllowanceTemplates = async () => {
    // Sample allowance templates based on job roles
    const sampleTemplates: AllowanceTemplate[] = [
      {
        id: '1',
        name: 'Senior Tailor Template',
        jobTitle: 'Senior Tailor',
        department: 'Production',
        transportationAmount: 600,
        mealAmount: 400,
        accommodationAmount: 2500,
        skillsAmount: 1000,
        totalAmount: 4500,
        isActive: true
      },
      {
        id: '2',
        name: 'Junior Tailor Template',
        jobTitle: 'Junior Tailor',
        department: 'Production',
        transportationAmount: 500,
        mealAmount: 300,
        accommodationAmount: 2000,
        skillsAmount: 500,
        totalAmount: 3300,
        isActive: true
      },
      {
        id: '3',
        name: 'Sales Executive Template',
        jobTitle: 'Sales Executive',
        department: 'Sales',
        transportationAmount: 700,
        mealAmount: 400,
        accommodationAmount: 2200,
        skillsAmount: 800,
        totalAmount: 4100,
        isActive: true
      }
    ];
    
    setAllowanceTemplates(sampleTemplates);
  };

  const handleApproveOvertime = async (overtimeId: string) => {
    try {
      const { error } = await supabase
        .from('overtime_calculations')
        .update({ 
          approval_status: 'approved',
          approved_by: profile?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', overtimeId);

      if (error) throw error;
      await fetchOvertimeAllowanceData();
    } catch (error) {
      console.error('Error approving overtime:', error);
    }
  };

  const handleCreateAllowance = async (allowanceData: any) => {
    try {
      const { error } = await supabase
        .from('allowances')
        .insert({
          ...allowanceData,
          organization_id: profile?.organization_id,
          created_by: profile?.id
        });

      if (error) throw error;
      await fetchOvertimeAllowanceData();
      setShowCreateAllowance(false);
    } catch (error) {
      console.error('Error creating allowance:', error);
    }
  };

  const getComplianceColor = (status: string): string => {
    switch (status) {
      case 'compliant': return 'text-green-700 bg-green-50 border-green-200';
      case 'exceeds_limit': return 'text-red-700 bg-red-50 border-red-200';
      case 'pending_approval': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="w-4 h-4" />;
      case 'exceeds_limit': return <AlertTriangle className="w-4 h-4" />;
      case 'pending_approval': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredEmployeeData = employeeData.filter(emp => {
    const matchesSearch = emp.employee.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || emp.employee.role === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-glass-light rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-glass-light rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Overtime & Allowances Management</h1>
          <p className="text-body text-neutral-700 mt-1">
            UAE labor law compliant overtime tracking and employee allowances management
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg bg-white"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = subMonths(new Date(), i);
              const value = format(date, 'yyyy-MM');
              const label = format(date, 'MMMM yyyy');
              return (
                <option key={value} value={value}>{label}</option>
              );
            })}
          </select>
          
          <button
            onClick={fetchOvertimeAllowanceData}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => setShowCreateAllowance(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Allowance
          </button>
        </div>
      </div>

      {/* UAE Compliance Alert */}
      {stats.complianceScore < 95 && (
        <div className="glass-card p-4 border-l-4 border-orange-500 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900">UAE Labor Law Compliance Alert</h3>
              <p className="text-sm text-orange-800 mt-1">
                {stats.pendingApprovals} overtime approvals pending. Compliance score: {stats.complianceScore}%
              </p>
              <div className="flex gap-2 mt-3">
                <button className="btn-sm btn-primary">Review Pending</button>
                <button className="btn-sm btn-secondary">View Guidelines</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">Total Overtime Hours</p>
              <p className="text-h3 font-bold text-blue-600">{stats.totalOvertimeHours.toFixed(1)}</p>
              <p className="text-tiny text-neutral-600 mt-1">
                Avg: {stats.averageOvertimePerEmployee.toFixed(1)}h per employee
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">Overtime Amount</p>
              <p className="text-h3 font-bold text-green-600">
                AED {stats.totalOvertimeAmount.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-tiny text-neutral-600 mt-1">
                125% UAE rate applied
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">Total Allowances</p>
              <p className="text-h3 font-bold text-purple-600">
                AED {stats.totalAllowances.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-tiny text-neutral-600 mt-1">
                All allowance types
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">Compliance Score</p>
              <p className="text-h3 font-bold text-primary-600">{stats.complianceScore}%</p>
              <p className="text-tiny text-neutral-600 mt-1">
                UAE labor law compliance
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary-50">
              <Target className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card p-6">
        <div className="border-b border-neutral-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Calculator },
              { id: 'overtime', label: 'Overtime Management', icon: Clock },
              { id: 'allowances', label: 'Allowances', icon: Award },
              { id: 'templates', label: 'Templates', icon: FileText },
              { id: 'compliance', label: 'UAE Compliance', icon: CheckCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg bg-white"
              >
                <option value="all">All Departments</option>
                <option value="manager">Management</option>
                <option value="tailor">Tailors</option>
                <option value="assistant">Assistants</option>
              </select>
            </div>

            {/* Employee Overtime & Allowances Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Overtime Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Overtime Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Allowances
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Compliance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {filteredEmployeeData.map((empData) => (
                    <tr key={empData.employee.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {empData.employee.full_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-neutral-900">
                              {empData.employee.full_name}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {empData.employee.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900">
                          {empData.overtimeHours.toFixed(1)} hours
                        </div>
                        <div className="text-sm text-neutral-500">
                          Rate: AED {empData.overtimeRate.toFixed(2)}/hr
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">
                          AED {empData.overtimeAmount.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">
                          AED {empData.totalAllowanceAmount.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {empData.allowances.length} allowance{empData.allowances.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getComplianceColor(empData.complianceStatus)}`}>
                          {getComplianceIcon(empData.complianceStatus)}
                          <span className="ml-1">
                            {empData.complianceStatus.replace('_', ' ').toUpperCase()}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingItem(empData)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {/* Edit overtime/allowances */}}
                            className="text-green-600 hover:text-green-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredEmployeeData.length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No overtime or allowance data</h3>
                <p className="text-neutral-600">
                  {searchQuery ? 'No employees match your search criteria' : 'No overtime or allowance records for this month'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Overtime Management Tab */}
        {selectedTab === 'overtime' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">UAE Labor Law Guidelines</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Maximum 48 hours per week regular work</li>
                <li>• Overtime rate: 125% of basic hourly rate</li>
                <li>• Friday overtime: 150% of basic hourly rate</li>
                <li>• Holiday overtime: 150% of basic hourly rate</li>
                <li>• Maximum 2 hours overtime per day</li>
              </ul>
            </div>

            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Overtime Management Interface</h3>
              <p className="text-neutral-600">Detailed overtime management interface coming soon...</p>
            </div>
          </div>
        )}

        {/* Allowances Tab */}
        {selectedTab === 'allowances' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allowanceTypes.map((type) => (
                <div key={type.id} className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {type.type === 'transportation' && <Car className="w-5 h-5 text-blue-600" />}
                    {type.type === 'meal' && <Coffee className="w-5 h-5 text-green-600" />}
                    {type.type === 'accommodation' && <Home className="w-5 h-5 text-purple-600" />}
                    {type.type === 'skills' && <Award className="w-5 h-5 text-orange-600" />}
                    <h3 className="font-medium text-neutral-900">{type.name}</h3>
                  </div>
                  <p className="text-sm text-neutral-600 mb-3">{type.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary-600">
                      AED {type.defaultAmount}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      type.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {type.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center py-8">
              <Award className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Allowance Management Interface</h3>
              <p className="text-neutral-600">Detailed allowance management interface coming soon...</p>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {selectedTab === 'templates' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allowanceTemplates.map((template) => (
                <div key={template.id} className="border border-neutral-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">{template.name}</h3>
                      <p className="text-sm text-neutral-600">{template.jobTitle} - {template.department}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Transportation:</span>
                      <span className="font-medium">AED {template.transportationAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Meal:</span>
                      <span className="font-medium">AED {template.mealAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Accommodation:</span>
                      <span className="font-medium">AED {template.accommodationAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Skills:</span>
                      <span className="font-medium">AED {template.skillsAmount}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <span className="text-neutral-900">Total:</span>
                        <span className="text-primary-600">AED {template.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="btn-sm btn-secondary flex-1">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </button>
                    <button className="btn-sm btn-primary flex-1">
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {selectedTab === 'compliance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6">
                <h3 className="font-semibold text-neutral-900 mb-4">Compliance Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-700">Overall Score</span>
                    <span className="text-2xl font-bold text-primary-600">{stats.complianceScore}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{ width: `${stats.complianceScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="font-semibold text-neutral-900 mb-4">Pending Approvals</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">{stats.pendingApprovals}</div>
                  <p className="text-sm text-neutral-600">Overtime approvals needed</p>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="font-semibold text-neutral-900 mb-4">UAE Compliance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Max Hours Adherence</span>
                    <span className="font-medium text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Overtime Rate Compliance</span>
                    <span className="font-medium text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Holiday Rate Compliance</span>
                    <span className="font-medium text-green-600">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}