'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building, 
  Award,
  FileText,
  CreditCard,
  Star,
  GraduationCap,
  Edit,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { 
  Employee, 
  Department, 
  EmployeeSkill, 
  EmployeeCertification,
  EmploymentContract,
  VisaTracking,
  PerformanceReview,
  EmployeeTraining,
  EmployeeEmergencyContact
} from '@/types/database';

interface EmployeeProfileData extends Employee {
  departments?: Department;
  employee_skills?: EmployeeSkill[];
  employee_certifications?: EmployeeCertification[];
  employment_contracts?: EmploymentContract[];
  visa_tracking?: VisaTracking[];
  performance_reviews?: PerformanceReview[];
  employee_training?: (EmployeeTraining & { training_programs?: { program_name: string } })[];
  employee_emergency_contacts?: EmployeeEmergencyContact[];
}

export default function EmployeeProfile() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (params?.id) {
      loadEmployee(params.id as string);
    }
  }, [params?.id]);

  const loadEmployee = async (employeeId: string) => {
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
          employee_skills(*),
          employee_certifications(*),
          employment_contracts(*),
          visa_tracking(*),
          performance_reviews(*),
          employee_training(
            *,
            training_programs(program_name)
          ),
          employee_emergency_contacts(*)
        `)
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      setEmployee(data);
    } catch (error) {
      console.error('Error loading employee:', error);
      router.push('/dashboard/employees/directory' as any);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <div className="animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-neutral-200 rounded-full"></div>
              <div>
                <div className="h-8 bg-neutral-200 rounded w-48 mb-2"></div>
                <div className="h-6 bg-neutral-200 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="glass-card p-12 text-center">
        <User className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-h3 font-bold text-neutral-900 mb-2">Employee not found</h3>
        <p className="text-body text-neutral-700 mb-6">
          The employee you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/dashboard/employees/directory" className="btn-primary">
          Back to Directory
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'On Leave': return 'bg-yellow-100 text-yellow-700';
      case 'Terminated': return 'bg-red-100 text-red-700';
      case 'Suspended': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isVisaExpiringSoon = (visaTracking: VisaTracking[]) => {
    if (!visaTracking || visaTracking.length === 0) return false;
    
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    
    return visaTracking.some(visa => 
      new Date(visa.expiry_date) <= ninetyDaysFromNow
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'skills', label: 'Skills & Certifications', icon: Award },
    { id: 'contract', label: 'Contract & Visa', icon: FileText },
    { id: 'performance', label: 'Performance', icon: Star },
    { id: 'training', label: 'Training', icon: GraduationCap },
    { id: 'emergency', label: 'Emergency Contacts', icon: Users }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/employees/directory"
              className="p-2 hover:bg-glass-light rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
            </Link>
            <div className="flex items-center gap-4">
              {employee.photo_url ? (
                <img
                  src={employee.photo_url}
                  alt={`${employee.first_name} ${employee.last_name}`}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-h3 font-bold text-primary-600">
                    {employee.first_name[0]}{employee.last_name[0]}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-h2 font-bold text-neutral-900">
                  {employee.first_name} {employee.last_name}
                </h1>
                <p className="text-body text-neutral-700">{employee.job_title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`px-3 py-1 rounded-full text-small font-medium ${getStatusColor(employee.employment_status)}`}>
                    {employee.employment_status}
                  </div>
                  {employee.visa_tracking && isVisaExpiringSoon(employee.visa_tracking) && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-small">
                      <AlertTriangle className="w-4 h-4" />
                      Visa Expiring
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/employees/profile/${employee.id}/edit`}
              className="btn-primary flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-glass-border">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-small transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-700 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="glass-card p-6">
              <h2 className="text-h3 font-bold text-neutral-900 mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-small font-medium text-neutral-700">Employee ID</label>
                    <p className="text-body text-neutral-900">{employee.employee_id}</p>
                  </div>
                  <div>
                    <label className="text-small font-medium text-neutral-700">Gender</label>
                    <p className="text-body text-neutral-900">{employee.gender || 'Not specified'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-small font-medium text-neutral-700">Date of Birth</label>
                    <p className="text-body text-neutral-900">
                      {employee.date_of_birth 
                        ? new Date(employee.date_of_birth).toLocaleDateString()
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-small font-medium text-neutral-700">Nationality</label>
                    <p className="text-body text-neutral-900">{employee.nationality || 'Not specified'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-small font-medium text-neutral-700">Emirates ID</label>
                  <p className="text-body text-neutral-900">{employee.emirates_id || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-small font-medium text-neutral-700">Passport Number</label>
                  <p className="text-body text-neutral-900">{employee.passport_number || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="glass-card p-6">
              <h2 className="text-h3 font-bold text-neutral-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-neutral-500" />
                  <div>
                    <label className="text-small font-medium text-neutral-700">Email</label>
                    <p className="text-body text-neutral-900">{employee.email}</p>
                  </div>
                </div>
                {employee.phone_primary && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-neutral-500" />
                    <div>
                      <label className="text-small font-medium text-neutral-700">Primary Phone</label>
                      <p className="text-body text-neutral-900">{employee.phone_primary}</p>
                    </div>
                  </div>
                )}
                {employee.phone_secondary && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-neutral-500" />
                    <div>
                      <label className="text-small font-medium text-neutral-700">Secondary Phone</label>
                      <p className="text-body text-neutral-900">{employee.phone_secondary}</p>
                    </div>
                  </div>
                )}
                {employee.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-neutral-500" />
                    <div>
                      <label className="text-small font-medium text-neutral-700">Address</label>
                      <p className="text-body text-neutral-900">
                        {employee.address}
                        {employee.city && `, ${employee.city}`}
                        {employee.country && `, ${employee.country}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Employment Information */}
            <div className="glass-card p-6">
              <h2 className="text-h3 font-bold text-neutral-900 mb-4">Employment Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-neutral-500" />
                  <div>
                    <label className="text-small font-medium text-neutral-700">Department</label>
                    <p className="text-body text-neutral-900">
                      {employee.departments?.department_name || 'No Department'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-neutral-500" />
                  <div>
                    <label className="text-small font-medium text-neutral-700">Hire Date</label>
                    <p className="text-body text-neutral-900">
                      {new Date(employee.hire_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-small font-medium text-neutral-700">Employment Type</label>
                    <p className="text-body text-neutral-900">{employee.employment_type}</p>
                  </div>
                  <div>
                    <label className="text-small font-medium text-neutral-700">Work Location</label>
                    <p className="text-body text-neutral-900">{employee.work_location || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h2 className="text-h3 font-bold text-neutral-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={`/dashboard/employees/reviews/new?employee=${employee.id}`}
                  className="btn-secondary flex items-center gap-2 justify-center"
                >
                  <Star className="w-4 h-4" />
                  New Review
                </Link>
                <Link
                  href={`/dashboard/employees/training?employee=${employee.id}`}
                  className="btn-secondary flex items-center gap-2 justify-center"
                >
                  <GraduationCap className="w-4 h-4" />
                  Assign Training
                </Link>
                <Link
                  href={`/dashboard/employees/skills?employee=${employee.id}`}
                  className="btn-secondary flex items-center gap-2 justify-center"
                >
                  <Award className="w-4 h-4" />
                  Update Skills
                </Link>
                <button className="btn-secondary flex items-center gap-2 justify-center">
                  <FileText className="w-4 h-4" />
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-h3 font-bold text-neutral-900">Skills</h2>
                <Link
                  href={`/dashboard/employees/skills?employee=${employee.id}`}
                  className="btn-secondary btn-sm"
                >
                  Manage Skills
                </Link>
              </div>
              <div className="space-y-3">
                {employee.employee_skills?.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-3 bg-glass-light rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">{skill.skill_name}</p>
                      <p className="text-small text-neutral-700">{skill.skill_category}</p>
                    </div>
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded-full text-tiny font-medium ${
                        skill.proficiency_level === 'Expert' ? 'bg-green-100 text-green-700' :
                        skill.proficiency_level === 'Advanced' ? 'bg-blue-100 text-blue-700' :
                        skill.proficiency_level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {skill.proficiency_level}
                      </div>
                      {skill.is_certified && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span className="text-tiny text-green-600">Certified</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(!employee.employee_skills || employee.employee_skills.length === 0) && (
                  <p className="text-center text-neutral-500 py-8">No skills recorded</p>
                )}
              </div>
            </div>

            {/* Certifications */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-h3 font-bold text-neutral-900">Certifications</h2>
                <Link
                  href={`/dashboard/employees/skills?employee=${employee.id}&tab=certifications`}
                  className="btn-secondary btn-sm"
                >
                  Manage Certifications
                </Link>
              </div>
              <div className="space-y-3">
                {employee.employee_certifications?.map((cert) => (
                  <div key={cert.id} className="p-3 bg-glass-light rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">{cert.certification_name}</p>
                        <p className="text-small text-neutral-700">{cert.issuing_authority}</p>
                        <p className="text-tiny text-neutral-600">
                          Issued: {new Date(cert.issue_date).toLocaleDateString()}
                          {cert.expiry_date && (
                            <> • Expires: {new Date(cert.expiry_date).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-tiny font-medium ${
                        cert.verification_status === 'Verified' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {cert.verification_status || 'Pending'}
                      </div>
                    </div>
                  </div>
                ))}
                {(!employee.employee_certifications || employee.employee_certifications.length === 0) && (
                  <p className="text-center text-neutral-500 py-8">No certifications recorded</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add other tab content as needed */}
        {activeTab !== 'overview' && activeTab !== 'skills' && (
          <div className="glass-card p-12 text-center">
            <Clock className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-h3 font-bold text-neutral-900 mb-2">Coming Soon</h3>
            <p className="text-body text-neutral-700">
              This section is under development and will be available soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}