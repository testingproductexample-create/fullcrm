'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Plus, 
  BookOpen, 
  Users, 
  Clock,
  CheckCircle,
  PlayCircle,
  Award,
  TrendingUp,
  Calendar,
  Target,
  User,
  Edit,
  Eye,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { 
  Employee, 
  TrainingProgram,
  EmployeeTraining,
  CreateTrainingProgramInput,
  EnrollEmployeeInput
} from '@/types/employee';
import { 
  formatEmployeeName, 
  getEmployeeStatusColor,
  formatAEDCurrency
} from '@/types/employee';

interface TrainingProgramWithEnrollments extends TrainingProgram {
  enrollments: EmployeeTraining[];
}

interface EmployeeTrainingWithDetails extends EmployeeTraining {
  employee: Employee;
  training_program: TrainingProgram;
}

export default function TrainingProgramsPage() {
  const [activeTab, setActiveTab] = useState<'programs' | 'enrollments' | 'analytics'>('programs');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainingType, setSelectedTrainingType] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const queryClient = useQueryClient();

  // Fetch training programs
  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ['training-programs'],
    queryFn: async (): Promise<TrainingProgramWithEnrollments[]> => {
      const { data, error } = await supabase
        .from('training_programs')
        .select(`
          *,
          enrollments:employee_training(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch employee training enrollments
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['employee-training'],
    queryFn: async (): Promise<EmployeeTrainingWithDetails[]> => {
      const { data, error } = await supabase
        .from('employee_training')
        .select(`
          *,
          employee:employees(*),
          training_program:training_programs(*)
        `)
        .order('enrollment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch employees for enrollment
  const { data: employees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employment_status', 'Active')
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Filter programs
  const filteredPrograms = programs?.filter(program => {
    const matchesSearch = !searchTerm || 
      program.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.trainer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !selectedTrainingType || program.training_type === selectedTrainingType;
    const matchesFormat = !selectedFormat || program.format === selectedFormat;
    const matchesStatus = !selectedStatus || program.status === selectedStatus;

    return matchesSearch && matchesType && matchesFormat && matchesStatus;
  }) || [];

  // Filter enrollments
  const filteredEnrollments = enrollments?.filter(enrollment => {
    const matchesSearch = !searchTerm || 
      formatEmployeeName(enrollment.employee).toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.training_program?.program_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !selectedStatus || enrollment.status === selectedStatus;

    return matchesSearch && matchesStatus;
  }) || [];

  // Analytics calculations
  const totalPrograms = programs?.length || 0;
  const activePrograms = programs?.filter(p => p.status === 'Active').length || 0;
  const totalEnrollments = enrollments?.length || 0;
  const completedTrainings = enrollments?.filter(e => e.status === 'Completed').length || 0;
  const inProgressTrainings = enrollments?.filter(e => e.status === 'In Progress').length || 0;
  const completionRate = totalEnrollments > 0 ? (completedTrainings / totalEnrollments) * 100 : 0;
  const totalTrainingHours = programs?.reduce((sum, p) => sum + (p.duration_hours || 0), 0) || 0;

  // Training type distribution
  const typeDistribution = programs?.reduce((acc, program) => {
    acc[program.training_type] = (acc[program.training_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const statsCards = [
    {
      title: 'Total Programs',
      value: totalPrograms,
      subtitle: `${activePrograms} active`,
      icon: <BookOpen className="h-6 w-6" />,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Enrollments',
      value: totalEnrollments,
      subtitle: `${inProgressTrainings} in progress`,
      icon: <Users className="h-6 w-6" />,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'Completion Rate',
      value: `${completionRate.toFixed(1)}%`,
      subtitle: `${completedTrainings} completed`,
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: 'Training Hours',
      value: totalTrainingHours,
      subtitle: 'Total available',
      icon: <Clock className="h-6 w-6" />,
      color: 'text-orange-600 bg-orange-100'
    }
  ];

  const getEnrollmentStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Enrolled': return 'text-gray-600 bg-gray-100';
      case 'Dropped': return 'text-red-600 bg-red-100';
      case 'Failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgramStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-100';
      case 'Scheduled': return 'text-blue-600 bg-blue-100';
      case 'Completed': return 'text-purple-600 bg-purple-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      case 'Inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (programsLoading || enrollmentsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training Programs</h1>
          <p className="text-gray-600 mt-1">Manage employee training and development programs</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowEnrollModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <User className="h-4 w-4 mr-2" />
            Enroll Employee
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Program
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
              <p className="text-sm text-gray-600">{card.title}</p>
              <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs and Content */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'programs', name: 'Training Programs', icon: BookOpen },
              { id: 'enrollments', name: 'Enrollments', icon: Users },
              { id: 'analytics', name: 'Analytics', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-6 flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'programs' ? "Search programs..." : "Search enrollments..."}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              {activeTab === 'programs' && (
                <>
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedTrainingType}
                    onChange={(e) => setSelectedTrainingType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="Technical">Technical</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Safety">Safety</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Customer Service">Customer Service</option>
                    <option value="Professional Development">Professional Development</option>
                  </select>

                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                  >
                    <option value="">All Formats</option>
                    <option value="In-person">In-person</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Certification">Certification</option>
                  </select>
                </>
              )}

              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {activeTab === 'programs' ? (
                  <>
                    <option value="Active">Active</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Inactive">Inactive</option>
                  </>
                ) : (
                  <>
                    <option value="Enrolled">Enrolled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Dropped">Dropped</option>
                    <option value="Failed">Failed</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Programs Tab */}
          {activeTab === 'programs' && (
            <div className="space-y-4">
              {filteredPrograms.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredPrograms.map((program) => (
                    <div key={program.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {program.program_name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">{program.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {program.duration_hours || 0} hours
                            </span>
                            <span>{program.format}</span>
                            <span>{program.training_type}</span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProgramStatusColor(program.status)}`}>
                          {program.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-xs text-gray-500">Enrollments</span>
                          <p className="text-sm font-medium text-gray-900">
                            {program.enrollments?.length || 0}
                            {program.max_participants && ` / ${program.max_participants}`}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Cost per participant</span>
                          <p className="text-sm font-medium text-gray-900">
                            {program.cost_per_participant ? formatAEDCurrency(program.cost_per_participant) : 'Free'}
                          </p>
                        </div>
                      </div>

                      {program.trainer_name && (
                        <div className="mb-4">
                          <span className="text-xs text-gray-500">Trainer</span>
                          <p className="text-sm font-medium text-gray-900">{program.trainer_name}</p>
                        </div>
                      )}

                      {(program.start_date || program.end_date) && (
                        <div className="mb-4 text-xs text-gray-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {program.start_date && new Date(program.start_date).toLocaleDateString()}
                          {program.start_date && program.end_date && ' - '}
                          {program.end_date && new Date(program.end_date).toLocaleDateString()}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          {program.certification_provided && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              <Award className="h-3 w-3 mr-1" />
                              Certification
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-700">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-700">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No training programs found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || selectedTrainingType || selectedFormat || selectedStatus
                      ? "Try adjusting your search criteria."
                      : "Get started by creating your first training program."}
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Program
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enrollments Tab */}
          {activeTab === 'enrollments' && (
            <div className="space-y-4">
              {filteredEnrollments.length > 0 ? (
                <div className="space-y-4">
                  {filteredEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center space-x-4 mb-4 md:mb-0">
                          <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {enrollment.employee?.first_name?.[0]}{enrollment.employee?.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {formatEmployeeName(enrollment.employee)}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {enrollment.employee.position}
                            </p>
                            <p className="text-sm text-blue-600">
                              {enrollment.training_program?.program_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          {/* Progress */}
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {enrollment.completion_percentage}% Complete
                            </p>
                            <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${enrollment.completion_percentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Status */}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEnrollmentStatusColor(enrollment.status)}`}>
                            {enrollment.status}
                          </span>

                          {/* Score */}
                          {enrollment.final_score && (
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-900">
                                {enrollment.final_score}%
                              </p>
                              <p className="text-xs text-gray-500">Score</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-gray-500">
                        <div>
                          <span className="block">Enrolled</span>
                          <span className="font-medium">{new Date(enrollment.enrollment_date).toLocaleDateString()}</span>
                        </div>
                        {enrollment.start_date && (
                          <div>
                            <span className="block">Started</span>
                            <span className="font-medium">{new Date(enrollment.start_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {enrollment.completion_date && (
                          <div>
                            <span className="block">Completed</span>
                            <span className="font-medium">{new Date(enrollment.completion_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {enrollment.cost && (
                          <div>
                            <span className="block">Cost</span>
                            <span className="font-medium">{formatAEDCurrency(enrollment.cost)}</span>
                          </div>
                        )}
                      </div>

                      {enrollment.certification_earned && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            <Award className="h-3 w-3 mr-1" />
                            Certification Earned
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No enrollments found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || selectedStatus
                      ? "Try adjusting your search criteria."
                      : "Get started by enrolling employees in training programs."}
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowEnrollModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Enroll Employee
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Completion Rate</p>
                        <p className="text-2xl font-bold text-blue-700">{completionRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center">
                      <PlayCircle className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-green-900">In Progress</p>
                        <p className="text-2xl font-bold text-green-700">{inProgressTrainings}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="flex items-center">
                      <Target className="h-8 w-8 text-purple-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-purple-900">Total Hours</p>
                        <p className="text-2xl font-bold text-purple-700">{totalTrainingHours}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Training Type Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Type Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(typeDistribution).map(([type, count]) => (
                    <div key={type} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">{type}</span>
                        <span className="text-lg font-bold text-blue-600">{count}</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / totalPrograms) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {totalPrograms === 0 && (
                <div className="text-center py-12">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create training programs and enroll employees to see analytics.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Program Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Training Program</h3>
            <p className="text-gray-600 mb-4">Modal implementation coming soon...</p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Enroll Employee Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Enroll Employee in Training</h3>
            <p className="text-gray-600 mb-4">Modal implementation coming soon...</p>
            <button
              onClick={() => setShowEnrollModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}