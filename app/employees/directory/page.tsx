'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Mail, 
  Phone,
  MapPin,
  Calendar,
  Users,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Employee, Department } from '@/types/employee';
import { formatEmployeeName, formatEmployeeId, getEmployeeStatusColor, calculateTotalCompensation, formatAEDCurrency } from '@/types/employee';

interface EmployeeWithDepartment extends Employee {
  department: Department | null;
}

interface FilterOptions {
  department: string;
  employment_status: string;
  employment_type: string;
  search: string;
}

type SortField = 'name' | 'hire_date' | 'position' | 'salary' | 'department';
type SortDirection = 'asc' | 'desc';

export default function EmployeeDirectory() {
  const [filters, setFilters] = useState<FilterOptions>({
    department: '',
    employment_status: '',
    employment_type: '',
    search: ''
  });
  
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithDepartment[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch employees
  const { data: employees, isLoading: employeesLoading, refetch } = useQuery({
    queryKey: ['employees-directory'],
    queryFn: async (): Promise<EmployeeWithDepartment[]> => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(*)
        `)
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch departments for filter dropdown
  const { data: departments } = useQuery({
    queryKey: ['departments-filter'],
    queryFn: async (): Promise<Department[]> => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Apply filters and sorting
  useEffect(() => {
    if (!employees) return;

    let filtered = employees.filter((employee) => {
      const matchesSearch = !filters.search || 
        formatEmployeeName(employee).toLowerCase().includes(filters.search.toLowerCase()) ||
        employee.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        employee.position?.toLowerCase().includes(filters.search.toLowerCase()) ||
        formatEmployeeId(employee).toLowerCase().includes(filters.search.toLowerCase());

      const matchesDepartment = !filters.department || employee.department_id === filters.department;
      const matchesStatus = !filters.employment_status || employee.employment_status === filters.employment_status;
      const matchesType = !filters.employment_type || employee.employment_type === filters.employment_type;

      return matchesSearch && matchesDepartment && matchesStatus && matchesType;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = formatEmployeeName(a).toLowerCase();
          bValue = formatEmployeeName(b).toLowerCase();
          break;
        case 'hire_date':
          aValue = new Date(a.hire_date || a.created_at);
          bValue = new Date(b.hire_date || b.created_at);
          break;
        case 'position':
          aValue = a.position?.toLowerCase() || '';
          bValue = b.position?.toLowerCase() || '';
          break;
        case 'salary':
          aValue = calculateTotalCompensation(a);
          bValue = calculateTotalCompensation(b);
          break;
        case 'department':
          aValue = a.department?.name?.toLowerCase() || '';
          bValue = b.department?.name?.toLowerCase() || '';
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredEmployees(filtered);
  }, [employees, filters, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setFilters({
      department: '',
      employment_status: '',
      employment_type: '',
      search: ''
    });
  };

  const exportEmployees = () => {
    const csvContent = [
      ['Employee ID', 'Name', 'Email', 'Phone', 'Position', 'Department', 'Status', 'Hire Date', 'Total Compensation'],
      ...filteredEmployees.map(emp => [
        formatEmployeeId(emp),
        formatEmployeeName(emp),
        emp.email || '',
        emp.phone || '',
        emp.position || '',
        emp.department?.name || '',
        emp.employment_status || '',
        emp.hire_date || '',
        calculateTotalCompensation(emp).toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (employeesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <SortAsc className="h-4 w-4 text-blue-600" /> : 
      <SortDesc className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Directory</h1>
          <p className="text-gray-600 mt-1">
            {filteredEmployees.length} of {employees?.length || 0} employees
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportEmployees}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <Link
            href={`/employees/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Users className="h-4 w-4 mr-2" />
            Add Employee
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees by name, email, position, or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
              showFilters ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700'
            } hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              >
                <option value="">All Departments</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.employment_status}
                onChange={(e) => setFilters({ ...filters, employment_status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Probation">Probation</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.employment_type}
                onChange={(e) => setFilters({ ...filters, employment_type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Temporary">Temporary</option>
                <option value="Intern">Intern</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Employee Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Employee</span>
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('position')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Position</span>
                    {getSortIcon('position')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('department')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Department</span>
                    {getSortIcon('department')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('hire_date')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Hire Date</span>
                    {getSortIcon('hire_date')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('salary')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Compensation</span>
                    {getSortIcon('salary')}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {employee.profile_photo_url ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={employee.profile_photo_url}
                            alt={formatEmployeeName(employee)}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {employee?.first_name?.[0]}{employee?.last_name?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatEmployeeName(employee)}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {formatEmployeeId(employee)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-3 mt-1">
                          {employee.email && (
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-32">{employee.email}</span>
                            </div>
                          )}
                          {employee.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              <span>{employee.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.position || 'No position'}</div>
                    <div className="text-sm text-gray-500">{employee.employment_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.department?.name || 'No department'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEmployeeStatusColor(employee.employment_status || 'Active')}`}>
                      {employee.employment_status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'No hire date'}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {employee.hire_date ? `${Math.floor((Date.now() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 30))}mo` : '0mo'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatAEDCurrency(calculateTotalCompensation(employee))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/employees/${employee.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/employees/${employee.id}/Edit`}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.department || filters.employment_status || filters.employment_type
                ? "Try adjusting your search criteria or filters."
                : "Get started by adding your first employee."}
            </p>
            {(!filters.search && !filters.department && !filters.employment_status && !filters.employment_type) && (
              <div className="mt-6">
                <Link
                  href={`/employees/new`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Add Employee
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}