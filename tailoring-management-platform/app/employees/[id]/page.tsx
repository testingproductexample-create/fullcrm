'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Building,
  CreditCard,
  FileText,
  Award,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  Badge,
  Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  Employee, 
  EmployeeSkill, 
  EmployeeCertification, 
  EmploymentContract, 
  VisaTracking, 
  PerformanceReview,
  EmployeeTraining,
  Department
} from '@/types/employee';
import { 
  formatEmployeeName, 
  formatEmployeeId, 
  getEmployeeStatusColor, 
  calculateTotalCompensation, 
  formatAEDCurrency,
  getProficiencyColor,
  getPerformanceRatingColor,
  calculateEmployeeTenure,
  isVisaExpiringSoon,
  calculateGratuity,
  getRequiredNoticePeriod
} from '@/types/employee';

interface EmployeeProfile extends Employee {
  department: Department | null;
  skills: EmployeeSkill[];
  certifications: EmployeeCertification[];
  contracts: EmploymentContract[];
  visas: VisaTracking[];
  performance_reviews: PerformanceReview[];
  training_enrollments: EmployeeTraining[];
}

export default function EmployeeProfilePage() {
  const params = useParams();
  const employeeId = params.id as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'performance' | 'training' | 'documents'>('overview');

  // Fetch employee profile with all related data
  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['employee-profile', employeeId],
    queryFn: async (): Promise<EmployeeProfile> => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(*),
          skills:employee_skills(*),
          certifications:employee_certifications(*),
          contracts:employment_contracts(*),
          visas:visa_tracking(*),
          performance_reviews:performance_reviews(*),
          training_enrollments:employee_training(
            *,
            training_program:training_programs(*)
          )
        `)
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!employeeId
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Employee not found</h3>
          <p className="mt-1 text-sm text-gray-500">The employee you're looking for doesn't exist or you don't have access to view it.</p>
          <div className="mt-6">
            <Link
              href="/employees/directory"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tenure = employee.hire_date ? calculateEmployeeTenure(employee.hire_date) : 0;
  const tenureYears = Math.floor(tenure / 12);
  const totalCompensation = calculateTotalCompensation(employee);
  const gratuity = employee.basic_salary ? calculateGratuity(employee.basic_salary, tenureYears) : 0;
  const noticePeriod = getRequiredNoticePeriod(tenureYears);
  
  const activeVisa = employee.visas?.find(visa => visa.status === 'Valid');
  const visaExpiringSoon = activeVisa ? isVisaExpiringSoon(activeVisa) : false;
  
  const latestReview = employee.performance_reviews?.[0];
  const activeTrainings = employee.training_enrollments?.filter(t => t.status === 'In Progress');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'skills', name: 'Skills & Certifications', icon: Award },
    { id: 'performance', name: 'Performance', icon: CheckCircle },
    { id: 'training', name: 'Training', icon: BookOpen },
    { id: 'documents', name: 'Documents', icon: FileText },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <Link
            href="/employees/directory"
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{formatEmployeeName(employee)}</h1>
            <p className="text-gray-600">Employee ID: {formatEmployeeId(employee)}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/employees/${employee.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Employee Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Photo and Basic Info */}
          <div className="flex-shrink-0">
            {employee.profile_photo_url ? (
              <img
                className="h-32 w-32 rounded-lg object-cover"
                src={employee.profile_photo_url}
                alt={formatEmployeeName(employee)}
              />
            ) : (
              <div className="h-32 w-32 rounded-lg bg-gray-300 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">
                  {employee.first_name[0]}{employee.last_name[0]}
                </span>
              </div>
            )}
          </div>

          {/* Employee Details */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{employee.position || 'No position assigned'}</h3>
                <p className="text-gray-600">{employee.department?.name || 'No department'}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEmployeeStatusColor(employee.employment_status || 'Active')}`}>
                  {employee.employment_status || 'Active'}
                </span>
              </div>

              <div className="space-y-2">
                {employee.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <a href={`mailto:${employee.email}`} className="hover:text-blue-600">
                      {employee.email}
                    </a>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <a href={`tel:${employee.phone}`} className="hover:text-blue-600">
                      {employee.phone}
                    </a>
                  </div>
                )}
                {employee.address && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{employee.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Employment Details</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Employment Type:</span>
                    <span className="font-medium">{employee.employment_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hire Date:</span>
                    <span className="font-medium">
                      {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tenure:</span>
                    <span className="font-medium">{tenure} months ({tenureYears} years)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Work Schedule:</span>
                    <span className="font-medium">{employee.work_schedule}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Compensation</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Compensation:</span>
                    <span className="font-bold text-green-600">{formatAEDCurrency(totalCompensation)}</span>
                  </div>
                  {employee.basic_salary && (
                    <div className="flex justify-between">
                      <span>Basic Salary:</span>
                      <span className="font-medium">{formatAEDCurrency(employee.basic_salary)}</span>
                    </div>
                  )}
                  {employee.housing_allowance && (
                    <div className="flex justify-between">
                      <span>Housing Allowance:</span>
                      <span className="font-medium">{formatAEDCurrency(employee.housing_allowance)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">Tenure</p>
                <p className="text-lg font-bold text-blue-700">{tenure}mo</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Award className="h-6 w-6 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-900">Skills</p>
                <p className="text-lg font-bold text-green-700">{employee.skills?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-purple-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-purple-900">Performance</p>
                <p className="text-lg font-bold text-purple-700">
                  {latestReview?.overall_rating ? `${latestReview.overall_rating}/5` : 'No reviews'}
                </p>
              </div>
            </div>
          </div>

          <div className={`${visaExpiringSoon ? 'bg-red-50' : 'bg-gray-50'} rounded-lg p-4`}>
            <div className="flex items-center">
              <AlertTriangle className={`h-6 w-6 ${visaExpiringSoon ? 'text-red-600' : 'text-gray-600'} mr-2`} />
              <div>
                <p className={`text-sm font-medium ${visaExpiringSoon ? 'text-red-900' : 'text-gray-900'}`}>Visa Status</p>
                <p className={`text-lg font-bold ${visaExpiringSoon ? 'text-red-700' : 'text-gray-700'}`}>
                  {activeVisa ? (visaExpiringSoon ? 'Expiring' : 'Valid') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
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
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="font-medium">
                      {employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : 'Not provided'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-medium">{employee.gender || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nationality:</span>
                    <span className="font-medium">{employee.nationality || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Emirates ID:</span>
                    <span className="font-medium">{employee.emirates_id || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Passport Number:</span>
                    <span className="font-medium">{employee.passport_number || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{employee.emergency_contact_name || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{employee.emergency_contact_phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Relationship:</span>
                    <span className="font-medium">{employee.emergency_contact_relationship || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* UAE Labor Law Compliance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">UAE Labor Compliance</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Required Notice Period:</span>
                    <span className="font-medium">{noticePeriod} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accrued Gratuity:</span>
                    <span className="font-medium text-green-600">{formatAEDCurrency(gratuity)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weekly Hours:</span>
                    <span className="font-medium">{employee.weekly_hours || 48} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Overtime Rate:</span>
                    <span className="font-medium">{((employee.overtime_rate || 1.25) * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Visa Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visa Information</h3>
                {activeVisa ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Visa Type:</span>
                      <span className="font-medium">{activeVisa.visa_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Visa Number:</span>
                      <span className="font-medium">{activeVisa.visa_number || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expiry Date:</span>
                      <span className={`font-medium ${visaExpiringSoon ? 'text-red-600' : ''}`}>
                        {activeVisa.expiry_date ? new Date(activeVisa.expiry_date).toLocaleDateString() : 'Not provided'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${activeVisa.status === 'Valid' ? 'text-green-600' : 'text-red-600'}`}>
                        {activeVisa.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No active visa information available</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-6">
              {/* Skills */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Expertise</h3>
                {employee.skills && employee.skills.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {employee.skills.map((skill) => (
                      <div key={skill.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{skill.skill_name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProficiencyColor(skill.proficiency_level)}`}>
                            {skill.proficiency_level}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{skill.skill_category}</p>
                        <div className="text-xs text-gray-500">
                          {skill.years_of_experience && `${skill.years_of_experience} years experience`}
                          {skill.last_assessed && ` • Last assessed: ${new Date(skill.last_assessed).toLocaleDateString()}`}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No skills recorded</p>
                )}
              </div>

              {/* Certifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
                {employee.certifications && employee.certifications.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {employee.certifications.map((cert) => (
                      <div key={cert.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{cert.certification_name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cert.verification_status === 'Verified' 
                              ? 'text-green-600 bg-green-100'
                              : cert.verification_status === 'Expired'
                              ? 'text-red-600 bg-red-100'
                              : 'text-yellow-600 bg-yellow-100'
                          }`}>
                            {cert.verification_status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{cert.issuing_organization}</p>
                        <div className="text-xs text-gray-500">
                          {cert.issue_date && `Issued: ${new Date(cert.issue_date).toLocaleDateString()}`}
                          {cert.expiry_date && ` • Expires: ${new Date(cert.expiry_date).toLocaleDateString()}`}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No certifications recorded</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Reviews</h3>
              {employee.performance_reviews && employee.performance_reviews.length > 0 ? (
                <div className="space-y-4">
                  {employee.performance_reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">{review.review_type} Review</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(review.review_period_start).toLocaleDateString()} - {new Date(review.review_period_end).toLocaleDateString()}
                          </p>
                        </div>
                        {review.overall_rating && (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPerformanceRatingColor(review.overall_rating)}`}>
                            {review.overall_rating}/5
                          </span>
                        )}
                      </div>
                      
                      {/* Rating Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {[
                          { label: 'Technical Skills', value: review.technical_skills_rating },
                          { label: 'Communication', value: review.communication_rating },
                          { label: 'Teamwork', value: review.teamwork_rating },
                          { label: 'Leadership', value: review.leadership_rating },
                          { label: 'Initiative', value: review.initiative_rating },
                          { label: 'Reliability', value: review.reliability_rating }
                        ].map((rating) => (
                          <div key={rating.label} className="text-center">
                            <p className="text-xs text-gray-500">{rating.label}</p>
                            <p className="text-lg font-semibold text-gray-900">{rating.value || '-'}</p>
                          </div>
                        ))}
                      </div>

                      {/* Comments */}
                      {review.reviewer_comments && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-900 mb-1">Reviewer Comments</h5>
                          <p className="text-sm text-gray-600">{review.reviewer_comments}</p>
                        </div>
                      )}
                      
                      {review.development_plan && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-1">Development Plan</h5>
                          <p className="text-sm text-gray-600">{review.development_plan}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No performance reviews recorded</p>
              )}
            </div>
          )}

          {activeTab === 'training' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Training & Development</h3>
              {employee.training_enrollments && employee.training_enrollments.length > 0 ? (
                <div className="space-y-4">
                  {employee.training_enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{enrollment.training_program?.program_name}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          enrollment.status === 'Completed' 
                            ? 'text-green-600 bg-green-100'
                            : enrollment.status === 'In Progress'
                            ? 'text-blue-600 bg-blue-100'
                            : 'text-yellow-600 bg-yellow-100'
                        }`}>
                          {enrollment.status}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{enrollment.training_program?.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Type:</span> {enrollment.training_program?.training_type}
                        </div>
                        <div>
                          <span className="font-medium">Format:</span> {enrollment.training_program?.format}
                        </div>
                        <div>
                          <span className="font-medium">Progress:</span> {enrollment.completion_percentage}%
                        </div>
                        <div>
                          <span className="font-medium">Score:</span> {enrollment.final_score || 'N/A'}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${enrollment.completion_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No training enrollments recorded</p>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents & Contracts</h3>
              {employee.contracts && employee.contracts.length > 0 ? (
                <div className="space-y-4">
                  {employee.contracts.map((contract) => (
                    <div key={contract.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{contract.contract_type} Contract</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          contract.status === 'Active' 
                            ? 'text-green-600 bg-green-100'
                            : contract.status === 'Expired'
                            ? 'text-red-600 bg-red-100'
                            : 'text-yellow-600 bg-yellow-100'
                        }`}>
                          {contract.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Start Date:</span>
                          <p className="font-medium">{new Date(contract.start_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">End Date:</span>
                          <p className="font-medium">
                            {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Open-ended'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Basic Salary:</span>
                          <p className="font-medium">{formatAEDCurrency(contract.basic_salary)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Compensation:</span>
                          <p className="font-medium">{formatAEDCurrency(contract.total_compensation)}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          UAE Labor Law Compliant: {contract.uae_labor_law_compliant ? '✅ Yes' : '❌ No'}
                        </div>
                        {contract.contract_document_url && (
                          <a
                            href={contract.contract_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            View Document →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No contracts recorded</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}