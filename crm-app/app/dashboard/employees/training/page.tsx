'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Award,
  TrendingUp,
  Eye,
  Edit,
  UserPlus,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { TrainingProgram, EmployeeTraining, Employee } from '@/types/database';

interface TrainingWithEnrollments extends TrainingProgram {
  employee_training?: (EmployeeTraining & {
    employees?: {
      first_name: string;
      last_name: string;
      job_title: string;
    };
  })[];
}

interface EnrollmentWithDetails extends EmployeeTraining {
  employees?: {
    first_name: string;
    last_name: string;
    job_title: string;
    departments?: {
      department_name: string;
    };
  };
  training_programs?: TrainingProgram;
}

export default function TrainingDevelopment() {
  const [activeTab, setActiveTab] = useState('programs');
  const [programs, setPrograms] = useState<TrainingWithEnrollments[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<TrainingWithEnrollments[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'programs') {
      filterPrograms();
    } else {
      filterEnrollments();
    }
  }, [programs, enrollments, searchTerm, selectedCategory, selectedStatus, activeTab]);

  const loadData = async () => {
    try {
      // Load training programs with enrollments
      const { data: programsData } = await supabase
        .from('training_programs')
        .select(`
          *,
          employee_training(
            *,
            employees(
              first_name,
              last_name,
              job_title
            )
          )
        `)
        .order('program_name', { ascending: true });

      // Load enrollments with program and employee details
      const { data: enrollmentsData } = await supabase
        .from('employee_training')
        .select(`
          *,
          employees(
            first_name,
            last_name,
            job_title,
            departments(department_name)
          ),
          training_programs(*)
        `)
        .order('enrollment_date', { ascending: false });

      // Load employees
      const { data: employeesData } = await supabase
        .from('employees')
        .select('id, organization_id, employee_id, first_name, last_name, email, job_title, department_id, employment_type, employment_status, hire_date, created_at, updated_at')
        .eq('employment_status', 'Active')
        .order('first_name');

      setPrograms(programsData || []);
      setEnrollments(enrollmentsData || []);
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPrograms = () => {
    let filtered = programs;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(program => 
        program.program_name.toLowerCase().includes(term) ||
        program.description?.toLowerCase().includes(term) ||
        program.training_provider?.toLowerCase().includes(term)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(program => program.program_category === selectedCategory);
    }

    if (selectedStatus) {
      if (selectedStatus === 'active') {
        filtered = filtered.filter(program => program.is_active);
      } else if (selectedStatus === 'inactive') {
        filtered = filtered.filter(program => !program.is_active);
      }
    }

    setFilteredPrograms(filtered);
  };

  const filterEnrollments = () => {
    let filtered = enrollments;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(enrollment => 
        enrollment.employees?.first_name.toLowerCase().includes(term) ||
        enrollment.employees?.last_name.toLowerCase().includes(term) ||
        enrollment.training_programs?.program_name.toLowerCase().includes(term)
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter(enrollment => enrollment.training_status === selectedStatus);
    }

    setFilteredEnrollments(filtered);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Enrolled': return 'bg-purple-100 text-purple-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Technical Skills': return 'bg-blue-100 text-blue-700';
      case 'Soft Skills': return 'bg-green-100 text-green-700';
      case 'Leadership': return 'bg-purple-100 text-purple-700';
      case 'Cultural Heritage': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getEnrollmentCount = (programId: string) => {
    return enrollments.filter(e => e.training_program_id === programId).length;
  };

  const getCompletionRate = (programId: string) => {
    const programEnrollments = enrollments.filter(e => e.training_program_id === programId);
    if (programEnrollments.length === 0) return 0;
    const completed = programEnrollments.filter(e => e.training_status === 'Completed').length;
    return Math.round((completed / programEnrollments.length) * 100);
  };

  // Statistics
  const stats = {
    totalPrograms: programs.length,
    activePrograms: programs.filter(p => p.is_active).length,
    totalEnrollments: enrollments.length,
    completedTraining: enrollments.filter(e => e.training_status === 'Completed').length,
    inProgressTraining: enrollments.filter(e => e.training_status === 'In Progress').length,
    totalBudget: programs.reduce((sum, p) => sum + (p.total_budget_aed || 0), 0)
  };

  const categories = [...new Set(programs.map(p => p.program_category).filter(Boolean))];

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
            <h1 className="text-h2 font-bold text-neutral-900">Training & Development</h1>
            <p className="text-body text-neutral-700 mt-1">
              Manage training programs and track employee development progress
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
            <Link href="/dashboard/employees/training/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Program
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="text-small font-medium text-blue-700">Programs</span>
            </div>
            <p className="text-h3 font-bold text-blue-900 mt-1">{stats.activePrograms}</p>
            <p className="text-tiny text-blue-600">of {stats.totalPrograms} total</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-small font-medium text-purple-700">Enrollments</span>
            </div>
            <p className="text-h3 font-bold text-purple-900 mt-1">{stats.totalEnrollments}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-small font-medium text-green-700">Completed</span>
            </div>
            <p className="text-h3 font-bold text-green-900 mt-1">{stats.completedTraining}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-small font-medium text-blue-700">In Progress</span>
            </div>
            <p className="text-h3 font-bold text-blue-900 mt-1">{stats.inProgressTraining}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <span className="text-small font-medium text-orange-700">Budget</span>
            </div>
            <p className="text-h3 font-bold text-orange-900 mt-1">
              AED {(stats.totalBudget / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
              <span className="text-small font-medium text-yellow-700">Completion</span>
            </div>
            <p className="text-h3 font-bold text-yellow-900 mt-1">
              {stats.totalEnrollments > 0 ? Math.round((stats.completedTraining / stats.totalEnrollments) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-glass-border">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('programs')}
              className={`py-2 px-1 border-b-2 font-medium text-small transition-colors ${
                activeTab === 'programs'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-700 hover:text-neutral-900'
              }`}
            >
              Training Programs ({filteredPrograms.length})
            </button>
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`py-2 px-1 border-b-2 font-medium text-small transition-colors ${
                activeTab === 'enrollments'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-700 hover:text-neutral-900'
              }`}
            >
              Employee Enrollments ({filteredEnrollments.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-small transition-colors ${
                activeTab === 'analytics'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-700 hover:text-neutral-900'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder={activeTab === 'programs' ? 'Search training programs...' : 'Search enrollments...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          {showFilters && (
            <div className="p-4 bg-glass-light rounded-lg border border-glass-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeTab === 'programs' && (
                  <>
                    <div>
                      <label className="block text-small font-medium text-neutral-700 mb-2">
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="input-field w-full"
                      >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-small font-medium text-neutral-700 mb-2">
                        Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="input-field w-full"
                      >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </>
                )}
                {activeTab === 'enrollments' && (
                  <div>
                    <label className="block text-small font-medium text-neutral-700 mb-2">
                      Training Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">All Statuses</option>
                      <option value="Enrolled">Enrolled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('');
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
      </div>

      {/* Content */}
      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPrograms.map((program) => (
            <div key={program.id} className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-h3 font-bold text-neutral-900">{program.program_name}</h3>
                    {program.program_category && (
                      <div className={`px-2 py-1 rounded-full text-tiny font-medium ${getCategoryColor(program.program_category)}`}>
                        {program.program_category}
                      </div>
                    )}
                    <div className={`px-2 py-1 rounded-full text-tiny font-medium ${
                      program.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {program.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <p className="text-small text-neutral-700 mb-3">{program.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-small text-neutral-700 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{program.duration_hours}h ({program.duration_days}d)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{getEnrollmentCount(program.id)} enrolled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>AED {program.cost_per_participant_aed?.toLocaleString() || 'Free'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>{getCompletionRate(program.id)}% completion</span>
                    </div>
                  </div>

                  {program.instructor_name && (
                    <div className="text-small text-neutral-700 mb-2">
                      <span className="font-medium">Instructor:</span> {program.instructor_name}
                    </div>
                  )}

                  {program.certification_provided && (
                    <div className="flex items-center gap-1 text-small text-green-700 mb-4">
                      <Award className="w-4 h-4" />
                      <span>Certificate provided by {program.certification_authority}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-glass-border">
                <Link
                  href={`/dashboard/employees/training/${program.id}`}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Link>
                <Link
                  href={`/dashboard/employees/training/${program.id}/enroll`}
                  className="btn-outline p-2"
                  title="Enroll Employees"
                >
                  <UserPlus className="w-4 h-4" />
                </Link>
                <Link
                  href={`/dashboard/employees/training/${program.id}/edit`}
                  className="btn-outline p-2"
                  title="Edit Program"
                >
                  <Edit className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
          {filteredPrograms.length === 0 && (
            <div className="col-span-2 glass-card p-12 text-center">
              <GraduationCap className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-h3 font-bold text-neutral-900 mb-2">No training programs found</h3>
              <p className="text-body text-neutral-700">
                {searchTerm || selectedCategory || selectedStatus
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Get started by creating your first training program.'}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'enrollments' && (
        <div className="space-y-4">
          {filteredEnrollments.map((enrollment) => (
            <div key={enrollment.id} className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-h3 font-bold text-neutral-900">
                      {enrollment.employees?.first_name} {enrollment.employees?.last_name}
                    </h3>
                    <div className={`px-2 py-1 rounded-full text-tiny font-medium ${getStatusColor(enrollment.training_status)}`}>
                      {enrollment.training_status || 'Enrolled'}
                    </div>
                    {enrollment.certificate_issued && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-tiny">
                        <Award className="w-3 h-3" />
                        Certified
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6 text-small text-neutral-700 mb-2">
                    <span className="font-medium">{enrollment.training_programs?.program_name}</span>
                    <span>{enrollment.employees?.job_title}</span>
                    {enrollment.employees?.departments && (
                      <span>{enrollment.employees.departments.department_name}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-small text-neutral-700">
                    {enrollment.training_start_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(enrollment.training_start_date).toLocaleDateString()}
                          {enrollment.training_end_date && (
                            <> - {new Date(enrollment.training_end_date).toLocaleDateString()}</>
                          )}
                        </span>
                      </div>
                    )}
                    {enrollment.attendance_percentage && (
                      <span>Attendance: {enrollment.attendance_percentage}%</span>
                    )}
                    {enrollment.assessment_score && (
                      <span>Score: {enrollment.assessment_score}%</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/employees/profile/${enrollment.employee_id}`}
                    className="btn-outline p-2"
                    title="View Employee"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button className="btn-outline p-2" title="Edit Enrollment">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredEnrollments.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-h3 font-bold text-neutral-900 mb-2">No enrollments found</h3>
              <p className="text-body text-neutral-700">
                {searchTerm || selectedStatus
                  ? 'Try adjusting your search criteria or filters.'
                  : 'No employees are currently enrolled in training programs.'}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="glass-card p-12 text-center">
          <TrendingUp className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-h3 font-bold text-neutral-900 mb-2">Training Analytics</h3>
          <p className="text-body text-neutral-700">
            Detailed training analytics and reporting dashboard is coming soon.
          </p>
        </div>
      )}
    </div>
  );
}