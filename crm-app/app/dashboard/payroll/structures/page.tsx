'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Settings,
  Layers,
  DollarSign,
  Users,
  TrendingUp,
  Award,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Edit,
  Eye,
  Copy,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  Building,
  Calendar,
  Star,
  BarChart3,
  FileText,
  Briefcase,
  Crown,
  Shield,
  Zap,
  PieChart
} from 'lucide-react';

interface StructureStats {
  totalStructures: number;
  activeStructures: number;
  employeesCovered: number;
  avgBaseSalary: number;
  structuresNeedingReview: number;
  departmentsCovered: number;
}

interface SalaryStructure {
  id: string;
  structure_name: string;
  structure_code: string;
  job_title: string;
  department_name: string;
  experience_level: string;
  base_salary_aed: number;
  min_salary_aed: number;
  max_salary_aed: number;
  hourly_rate_aed: number;
  overtime_rate_multiplier: number;
  commission_eligible: boolean;
  commission_base_percentage: number;
  bonus_eligible: boolean;
  transportation_allowance_aed: number;
  meal_allowance_aed: number;
  accommodation_allowance_aed: number;
  skills_allowance_aed: number;
  effective_date: string;
  expiry_date: string;
  is_active: boolean;
  annual_review_month: number;
  grade_level: number;
  performance_band: string;
  notes: string;
  employee_count: number;
}

interface Department {
  id: string;
  name: string;
  description: string;
}

export default function SalaryStructuresPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StructureStats>({
    totalStructures: 0,
    activeStructures: 0,
    employeesCovered: 0,
    avgBaseSalary: 0,
    structuresNeedingReview: 0,
    departmentsCovered: 0
  });
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<SalaryStructure | null>(null);

  useEffect(() => {
    if (user?.organization_id) {
      fetchData();
    }
  }, [user?.organization_id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSalaryStructures(),
        fetchDepartments(),
        fetchStats()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryStructures = async () => {
    const { data, error } = await supabase
      .from('salary_structures')
      .select(`
        *,
        departments (name)
      `)
      .eq('organization_id', user?.organization_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get employee count for each structure
    const structureIds = data?.map(s => s.id) || [];
    const { data: employeeData, error: empError } = await supabase
      .from('employees')
      .select('id, salary_structure_id')
      .eq('organization_id', user?.organization_id)
      .in('salary_structure_id', structureIds);

    if (empError) throw empError;

    const employeeCountMap = employeeData?.reduce((acc: any, emp) => {
      acc[emp.salary_structure_id] = (acc[emp.salary_structure_id] || 0) + 1;
      return acc;
    }, {}) || {};

    const formattedData = data?.map(structure => ({
      ...structure,
      department_name: structure.departments?.name || 'Unassigned',
      employee_count: employeeCountMap[structure.id] || 0
    })) || [];

    setStructures(formattedData);
  };

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('organization_id', user?.organization_id);

    if (error) throw error;
    setDepartments(data || []);
  };

  const fetchStats = async () => {
    const activeStructures = structures.filter(s => s.is_active).length;
    const employeesCovered = structures.reduce((sum, s) => sum + s.employee_count, 0);
    const avgBaseSalary = structures.length > 0 
      ? structures.reduce((sum, s) => sum + s.base_salary_aed, 0) / structures.length 
      : 0;
    
    const needsReview = structures.filter(s => {
      const effectiveDate = new Date(s.effective_date);
      const now = new Date();
      const monthsDiff = (now.getFullYear() - effectiveDate.getFullYear()) * 12 
        + now.getMonth() - effectiveDate.getMonth();
      return monthsDiff >= 12; // Needs review if older than 12 months
    }).length;

    const departmentsCovered = new Set(structures.map(s => s.department_id).filter(Boolean)).size;

    setStats({
      totalStructures: structures.length,
      activeStructures,
      employeesCovered,
      avgBaseSalary,
      structuresNeedingReview: needsReview,
      departmentsCovered
    });
  };

  const duplicateStructure = async (structureId: string) => {
    try {
      const structure = structures.find(s => s.id === structureId);
      if (!structure) return;

      const { data, error } = await supabase
        .from('salary_structures')
        .insert({
          organization_id: user?.organization_id,
          structure_name: `${structure.structure_name} (Copy)`,
          structure_code: `${structure.structure_code}_COPY`,
          job_title: structure.job_title,
          department_id: structure.department_id,
          experience_level: structure.experience_level,
          base_salary_aed: structure.base_salary_aed,
          min_salary_aed: structure.min_salary_aed,
          max_salary_aed: structure.max_salary_aed,
          hourly_rate_aed: structure.hourly_rate_aed,
          overtime_rate_multiplier: structure.overtime_rate_multiplier,
          commission_eligible: structure.commission_eligible,
          commission_base_percentage: structure.commission_base_percentage,
          bonus_eligible: structure.bonus_eligible,
          transportation_allowance_aed: structure.transportation_allowance_aed,
          meal_allowance_aed: structure.meal_allowance_aed,
          accommodation_allowance_aed: structure.accommodation_allowance_aed,
          skills_allowance_aed: structure.skills_allowance_aed,
          effective_date: new Date().toISOString().split('T')[0],
          is_active: false,
          grade_level: structure.grade_level,
          performance_band: structure.performance_band,
          notes: structure.notes,
          created_by: user?.id
        });

      if (error) throw error;
      await fetchSalaryStructures();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate structure');
    }
  };

  const toggleStructureStatus = async (structureId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('salary_structures')
        .update({ is_active: !isActive })
        .eq('id', structureId);

      if (error) throw error;
      await fetchSalaryStructures();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update structure status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED'
    }).format(amount);
  };

  const getExperienceLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'entry':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'junior':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'mid':
      case 'mid-level':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'senior':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'lead':
      case 'principal':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'executive':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceBandColor = (band: string) => {
    switch (band.toLowerCase()) {
      case 'exceeds':
        return 'text-green-600';
      case 'meets':
        return 'text-blue-600';
      case 'below':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getGradeLevelIcon = (level: number) => {
    if (level >= 10) return <Crown className="w-4 h-4 text-yellow-600" />;
    if (level >= 7) return <Shield className="w-4 h-4 text-purple-600" />;
    if (level >= 4) return <Star className="w-4 h-4 text-blue-600" />;
    return <Briefcase className="w-4 h-4 text-gray-600" />;
  };

  const filteredStructures = structures.filter(structure => {
    const matchesSearch = structure.structure_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         structure.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || structure.department_id === filterDepartment;
    const matchesLevel = filterLevel === 'all' || structure.experience_level === filterLevel;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && structure.is_active) ||
                         (filterStatus === 'inactive' && !structure.is_active);
    
    return matchesSearch && matchesDepartment && matchesLevel && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Salary Structure Templates</h1>
          <p className="text-gray-600">Manage salary structures and compensation templates</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Structure
        </button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="backdrop-blur-sm bg-white/70 rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Layers className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total Structures</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalStructures}</div>
          <div className="text-sm text-green-600 mt-1">
            {stats.activeStructures} active
          </div>
        </div>

        <div className="backdrop-blur-sm bg-white/70 rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Employees Covered</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.employeesCovered}</div>
          <div className="text-sm text-gray-600 mt-1">
            {stats.departmentsCovered} departments
          </div>
        </div>

        <div className="backdrop-blur-sm bg-white/70 rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Average Base Salary</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avgBaseSalary)}</div>
          <div className="text-sm text-yellow-600 mt-1">
            {stats.structuresNeedingReview} need review
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="backdrop-blur-sm bg-white/70 rounded-2xl p-6 border border-white/20 shadow-xl mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search structures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="entry">Entry</option>
                <option value="junior">Junior</option>
                <option value="mid-level">Mid-Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
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

      {/* Structures Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStructures.length === 0 ? (
          <div className="col-span-full backdrop-blur-sm bg-white/70 rounded-2xl p-12 border border-white/20 shadow-xl text-center">
            <Layers className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Salary Structures Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterDepartment !== 'all' || filterLevel !== 'all' || filterStatus !== 'all'
                ? 'No structures match your current filters.'
                : 'Get started by creating your first salary structure template.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Structure
            </button>
          </div>
        ) : (
          filteredStructures.map((structure) => (
            <div key={structure.id} className="backdrop-blur-sm bg-white/70 rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getGradeLevelIcon(structure.grade_level)}
                    <h3 className="font-semibold text-gray-900 truncate">{structure.structure_name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{structure.job_title}</p>
                  <p className="text-xs text-gray-500">{structure.department_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${structure.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-xs text-gray-500">{structure.structure_code}</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Experience Level</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getExperienceLevelColor(structure.experience_level)}`}>
                    {structure.experience_level}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Base Salary</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(structure.base_salary_aed)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Salary Range</span>
                  <span className="text-sm text-gray-700">
                    {formatCurrency(structure.min_salary_aed)} - {formatCurrency(structure.max_salary_aed)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Employees</span>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-sm font-medium">{structure.employee_count}</span>
                  </div>
                </div>

                {structure.commission_eligible && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Commission</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-sm text-green-600">{structure.commission_base_percentage}%</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Performance</span>
                  <span className={`text-sm font-medium ${getPerformanceBandColor(structure.performance_band)}`}>
                    {structure.performance_band}
                  </span>
                </div>
              </div>

              {/* Allowances Summary */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-xs text-gray-600 mb-2">Monthly Allowances</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Transport: {formatCurrency(structure.transportation_allowance_aed)}</div>
                  <div>Meals: {formatCurrency(structure.meal_allowance_aed)}</div>
                  <div>Housing: {formatCurrency(structure.accommodation_allowance_aed)}</div>
                  <div>Skills: {formatCurrency(structure.skills_allowance_aed)}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedStructure(structure)}
                    className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                    title="Edit Structure"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => duplicateStructure(structure.id)}
                    className="p-2 text-green-600 hover:text-green-800 transition-colors"
                    title="Duplicate Structure"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => toggleStructureStatus(structure.id, structure.is_active)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    structure.is_active
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {structure.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Structure Detail Modal */}
      {selectedStructure && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{selectedStructure.structure_name}</h3>
              <button
                onClick={() => setSelectedStructure(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Structure Code:</span>
                      <span>{selectedStructure.structure_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Job Title:</span>
                      <span>{selectedStructure.job_title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span>{selectedStructure.department_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience Level:</span>
                      <span>{selectedStructure.experience_level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grade Level:</span>
                      <span>{selectedStructure.grade_level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Performance Band:</span>
                      <span>{selectedStructure.performance_band}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Compensation Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Salary:</span>
                      <span className="font-semibold">{formatCurrency(selectedStructure.base_salary_aed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Salary Range:</span>
                      <span>{formatCurrency(selectedStructure.min_salary_aed)} - {formatCurrency(selectedStructure.max_salary_aed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hourly Rate:</span>
                      <span>{formatCurrency(selectedStructure.hourly_rate_aed || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">OT Multiplier:</span>
                      <span>{selectedStructure.overtime_rate_multiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission Eligible:</span>
                      <span>{selectedStructure.commission_eligible ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bonus Eligible:</span>
                      <span>{selectedStructure.bonus_eligible ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Monthly Allowances</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transportation:</span>
                      <span>{formatCurrency(selectedStructure.transportation_allowance_aed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Meals:</span>
                      <span>{formatCurrency(selectedStructure.meal_allowance_aed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Accommodation:</span>
                      <span>{formatCurrency(selectedStructure.accommodation_allowance_aed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Skills Bonus:</span>
                      <span>{formatCurrency(selectedStructure.skills_allowance_aed)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Administrative</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effective Date:</span>
                      <span>{new Date(selectedStructure.effective_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Review Month:</span>
                      <span>{new Date(0, selectedStructure.annual_review_month - 1).toLocaleString('en', {month:'long'})}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={selectedStructure.is_active ? 'text-green-600' : 'text-red-600'}>
                        {selectedStructure.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Employees:</span>
                      <span>{selectedStructure.employee_count}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedStructure.notes && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    {selectedStructure.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}