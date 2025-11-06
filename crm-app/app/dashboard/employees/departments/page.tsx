'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building, 
  Plus, 
  Search,
  Users,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  DollarSign,
  Target,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { Department, Employee } from '@/types/database';

interface DepartmentWithStats extends Department {
  employee_count?: number;
  employees?: Employee[];
  total_salary?: number;
  manager?: {
    first_name: string;
    last_name: string;
    job_title: string;
  };
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<DepartmentWithStats[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDepartments();
    loadEmployees();
  }, []);

  useEffect(() => {
    filterDepartments();
  }, [departments, searchTerm, selectedStatus]);

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select(`
          *,
          manager:employees!departments_manager_id_fkey(
            first_name,
            last_name,
            job_title
          )
        `)
        .order('department_name', { ascending: true });

      if (error) throw error;

      // Load employee counts and salary totals for each department
      const departmentsWithStats = await Promise.all((data || []).map(async (dept) => {
        const { data: employeeData, error: empError } = await supabase
          .from('employees')
          .select('id, first_name, last_name, job_title, employment_status')
          .eq('department_id', dept.id)
          .eq('employment_status', 'Active');

        const { data: contractData, error: contractError } = await supabase
          .from('employment_contracts')
          .select('basic_salary_aed, housing_allowance_aed, transport_allowance_aed, food_allowance_aed, other_allowances_aed')
          .in('employee_id', (employeeData || []).map(emp => emp.id));

        const totalSalary = (contractData || []).reduce((sum, contract) => {
          return sum + (contract.basic_salary_aed || 0) + 
                 (contract.housing_allowance_aed || 0) + 
                 (contract.transport_allowance_aed || 0) + 
                 (contract.food_allowance_aed || 0) + 
                 (contract.other_allowances_aed || 0);
        }, 0);

        return {
          ...dept,
          employee_count: employeeData?.length || 0,
          employees: employeeData || [],
          total_salary: totalSalary
        };
      }));

      setDepartments(departmentsWithStats);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, organization_id, employee_id, first_name, last_name, email, job_title, department_id, employment_type, employment_status, hire_date, created_at, updated_at')
        .eq('employment_status', 'Active')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const filterDepartments = () => {
    let filtered = departments;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(dept => 
        dept.department_name.toLowerCase().includes(term) ||
        dept.department_code?.toLowerCase().includes(term) ||
        dept.description?.toLowerCase().includes(term)
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter(dept => dept.status === selectedStatus);
    }

    setFilteredDepartments(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Inactive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getUnassignedEmployees = () => {
    return employees.filter(emp => !emp.department_id);
  };

  // Statistics
  const stats = {
    totalDepartments: departments.filter(d => d.status === 'Active').length,
    totalEmployees: departments.reduce((sum, dept) => sum + (dept.employee_count || 0), 0),
    totalBudget: departments.reduce((sum, dept) => sum + (dept.total_salary || 0), 0),
    unassignedEmployees: getUnassignedEmployees().length,
    averageTeamSize: departments.length > 0 
      ? Math.round(departments.reduce((sum, dept) => sum + (dept.employee_count || 0), 0) / departments.filter(d => d.status === 'Active').length)
      : 0
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-neutral-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-h2 font-bold text-neutral-900">Department Management</h1>
            <p className="text-body text-neutral-700 mt-1">
              Organize departments, manage hierarchy, and track team performance
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/employees/departments/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Department
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span className="text-small font-medium text-blue-700">Departments</span>
            </div>
            <p className="text-h3 font-bold text-blue-900 mt-1">{stats.totalDepartments}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-small font-medium text-green-700">Total Employees</span>
            </div>
            <p className="text-h3 font-bold text-green-900 mt-1">{stats.totalEmployees}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <span className="text-small font-medium text-purple-700">Total Budget</span>
            </div>
            <p className="text-h3 font-bold text-purple-900 mt-1">
              AED {(stats.totalBudget / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              <span className="text-small font-medium text-orange-700">Avg Team Size</span>
            </div>
            <p className="text-h3 font-bold text-orange-900 mt-1">{stats.averageTeamSize}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-red-600" />
              <span className="text-small font-medium text-red-700">Unassigned</span>
            </div>
            <p className="text-h3 font-bold text-red-900 mt-1">{stats.unassignedEmployees}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-glass-border">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-small transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-700 hover:text-neutral-900'
              }`}
            >
              Department Overview
            </button>
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`py-2 px-1 border-b-2 font-medium text-small transition-colors ${
                activeTab === 'hierarchy'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-700 hover:text-neutral-900'
              }`}
            >
              Organizational Chart
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-small transition-colors ${
                activeTab === 'analytics'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-700 hover:text-neutral-900'
              }`}
            >
              Performance Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Search and Filters */}
      {activeTab === 'overview' && (
        <div className="glass-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search departments by name, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 w-full"
                />
              </div>
            </div>
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field w-full"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDepartments.map((department) => (
            <div key={department.id} className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-h3 font-bold text-neutral-900">{department.department_name}</h3>
                    {department.department_code && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-tiny font-medium">
                        {department.department_code}
                      </span>
                    )}
                    <div className={`px-2 py-1 rounded-full text-tiny font-medium ${getStatusColor(department.status)}`}>
                      {department.status}
                    </div>
                  </div>
                  
                  {department.description && (
                    <p className="text-small text-neutral-700 mb-3">{department.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-glass-light rounded-lg">
                      <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-h3 font-bold text-neutral-900">{department.employee_count || 0}</p>
                      <p className="text-tiny text-neutral-600">Employees</p>
                    </div>
                    <div className="text-center p-3 bg-glass-light rounded-lg">
                      <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <p className="text-h3 font-bold text-neutral-900">
                        {department.total_salary ? `AED ${(department.total_salary / 1000).toFixed(0)}K` : 'N/A'}
                      </p>
                      <p className="text-tiny text-neutral-600">Monthly Cost</p>
                    </div>
                  </div>

                  {department.manager && (
                    <div className="mb-4">
                      <p className="text-small font-medium text-neutral-700">Department Manager</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-tiny font-medium text-primary-600">
                            {department.manager.first_name[0]}{department.manager.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-small font-medium text-neutral-900">
                            {department.manager.first_name} {department.manager.last_name}
                          </p>
                          <p className="text-tiny text-neutral-600">{department.manager.job_title}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {department.location && (
                    <div className="text-small text-neutral-700">
                      <span className="font-medium">Location:</span> {department.location}
                    </div>
                  )}

                  {department.department_type && (
                    <div className="text-small text-neutral-700 mt-1">
                      <span className="font-medium">Type:</span> {department.department_type}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-glass-border">
                <Link
                  href={`/dashboard/employees/departments/${department.id}`}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Link>
                <Link
                  href={`/dashboard/employees/departments/${department.id}/edit`}
                  className="btn-outline p-2"
                  title="Edit Department"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button 
                  className="btn-outline p-2 text-red-600 hover:bg-red-50" 
                  title="Delete Department"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Unassigned Employees Card */}
          {stats.unassignedEmployees > 0 && (
            <div className="glass-card p-6 border-2 border-orange-200">
              <div className="flex items-center gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-orange-600" />
                <h3 className="text-h3 font-bold text-neutral-900">Unassigned Employees</h3>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-tiny font-medium">
                  {stats.unassignedEmployees}
                </span>
              </div>
              
              <p className="text-small text-neutral-700 mb-4">
                These employees are not assigned to any department and should be placed in appropriate teams.
              </p>

              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {getUnassignedEmployees().map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <div>
                      <p className="font-medium text-neutral-900">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <p className="text-small text-neutral-700">{employee.job_title}</p>
                    </div>
                    <Link
                      href={`/dashboard/employees/profile/${employee.id}/edit`}
                      className="btn-outline btn-sm"
                    >
                      Assign
                    </Link>
                  </div>
                ))}
              </div>

              <button className="btn-primary w-full">
                Assign All Employees
              </button>
            </div>
          )}

          {filteredDepartments.length === 0 && (
            <div className="col-span-2 glass-card p-12 text-center">
              <Building className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-h3 font-bold text-neutral-900 mb-2">No departments found</h3>
              <p className="text-body text-neutral-700 mb-6">
                {searchTerm || selectedStatus
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Get started by creating your first department.'}
              </p>
              {(!searchTerm && !selectedStatus) && (
                <Link href="/dashboard/employees/departments/new" className="btn-primary">
                  Create First Department
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'hierarchy' && (
        <div className="glass-card p-12 text-center">
          <Building className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-h3 font-bold text-neutral-900 mb-2">Organizational Chart</h3>
          <p className="text-body text-neutral-700">
            Interactive organizational chart view is coming soon. Visualize department hierarchy and reporting relationships.
          </p>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="glass-card p-12 text-center">
          <BarChart3 className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-h3 font-bold text-neutral-900 mb-2">Performance Analytics</h3>
          <p className="text-body text-neutral-700">
            Department performance analytics dashboard is coming soon. Track productivity, costs, and team effectiveness.
          </p>
        </div>
      )}
    </div>
  );
}