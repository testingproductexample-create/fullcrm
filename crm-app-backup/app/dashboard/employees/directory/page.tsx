'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Search, 
  Filter, 
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  UserCheck,
  AlertTriangle,
  Eye,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import { Employee, Department, VisaTracking } from '@/types/database';

interface EmployeeWithDepartment extends Employee {
  departments?: Department;
  visa_tracking?: VisaTracking[];
}

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<EmployeeWithDepartment[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithDepartment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, selectedDepartment, selectedStatus]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          departments(
            id,
            department_name,
            department_code
          ),
          visa_tracking(
            id,
            visa_type,
            expiry_date,
            renewal_status
          )
        `)
        .order('first_name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('status', 'Active')
        .order('department_name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    // Text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.first_name.toLowerCase().includes(term) ||
        emp.last_name.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.employee_id.toLowerCase().includes(term) ||
        emp.job_title.toLowerCase().includes(term)
      );
    }

    // Department filter
    if (selectedDepartment) {
      filtered = filtered.filter(emp => emp.department_id === selectedDepartment);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(emp => emp.employment_status === selectedStatus);
    }

    setFilteredEmployees(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'On Leave': return 'bg-yellow-100 text-yellow-700';
      case 'Terminated': return 'bg-red-100 text-red-700';
      case 'Suspended': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isVisaExpiringSoon = (employee: EmployeeWithDepartment) => {
    if (!employee.visa_tracking || employee.visa_tracking.length === 0) return false;
    
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    
    return employee.visa_tracking.some(visa => 
      new Date(visa.expiry_date) <= ninetyDaysFromNow
    );
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6">
              <div className="animate-pulse">
                <div className="w-16 h-16 bg-neutral-200 rounded-full mb-4"></div>
                <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
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
            <h1 className="text-h2 font-bold text-neutral-900">Employee Directory</h1>
            <p className="text-body text-neutral-700 mt-1">
              {filteredEmployees.length} of {employees.length} employees
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary-100 text-primary-700' : ''}`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <Link href="/dashboard/employees/profile/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Employee
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search employees by name, email, ID, or job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-glass-light rounded-lg border border-glass-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-small font-medium text-neutral-700 mb-2">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-small font-medium text-neutral-700 mb-2">
                  Employment Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDepartment('');
                    setSelectedStatus('');
                  }}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="glass-card p-6 hover:shadow-lg transition-shadow">
            {/* Header with Photo and Status */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {employee.photo_url ? (
                  <img
                    src={employee.photo_url}
                    alt={`${employee.first_name} ${employee.last_name}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-body font-medium text-primary-600">
                      {employee.first_name[0]}{employee.last_name[0]}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-neutral-900">
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <p className="text-small text-neutral-700">{employee.employee_id}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`px-2 py-1 rounded-full text-tiny font-medium ${getStatusColor(employee.employment_status)}`}>
                  {employee.employment_status}
                </div>
                {isVisaExpiringSoon(employee) && (
                  <div className="flex items-center gap-1 text-orange-600" title="Visa expiring soon">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>

            {/* Job Information */}
            <div className="mb-4">
              <p className="font-medium text-neutral-900">{employee.job_title}</p>
              <div className="flex items-center gap-1 text-small text-neutral-700 mt-1">
                <Building className="w-4 h-4" />
                <span>{employee.departments?.department_name || 'No Department'}</span>
              </div>
              <div className="flex items-center gap-1 text-small text-neutral-700 mt-1">
                <Calendar className="w-4 h-4" />
                <span>Since {new Date(employee.hire_date).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2 mb-4">
              {employee.email && (
                <div className="flex items-center gap-2 text-small text-neutral-700">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{employee.email}</span>
                </div>
              )}
              {employee.phone_primary && (
                <div className="flex items-center gap-2 text-small text-neutral-700">
                  <Phone className="w-4 h-4" />
                  <span>{employee.phone_primary}</span>
                </div>
              )}
              {employee.city && (
                <div className="flex items-center gap-2 text-small text-neutral-700">
                  <MapPin className="w-4 h-4" />
                  <span>{employee.city}, {employee.country}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-glass-border">
              <Link
                href={`/dashboard/employees/profile/${employee.id}`}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Profile
              </Link>
              <Link
                href={`/dashboard/employees/profile/${employee.id}/edit`}
                className="btn-outline p-2"
              >
                <Edit className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && !loading && (
        <div className="glass-card p-12 text-center">
          <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-h3 font-bold text-neutral-900 mb-2">No employees found</h3>
          <p className="text-body text-neutral-700 mb-6">
            {searchTerm || selectedDepartment || selectedStatus
              ? 'Try adjusting your search criteria or filters.'
              : 'Get started by adding your first employee.'}
          </p>
          {(!searchTerm && !selectedDepartment && !selectedStatus) && (
            <Link href="/dashboard/employees/profile/new" className="btn-primary">
              Add First Employee
            </Link>
          )}
        </div>
      )}
    </div>
  );
}