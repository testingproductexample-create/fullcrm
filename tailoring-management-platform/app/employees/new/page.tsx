'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  ArrowLeft,
  Save,
  User,
  Building,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CreateEmployeeInput, Department } from '@/types/employee';
import { UAE_LABOR_LAW } from '@/types/employee';

interface FormStep {
  id: string;
  name: string;
  icon: React.ReactNode;
  fields: string[];
}

const formSteps: FormStep[] = [
  {
    id: 'personal',
    name: 'Personal Information',
    icon: <User className="h-5 w-5" />,
    fields: ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'nationality', 'emirates_id', 'passport_number']
  },
  {
    id: 'employment',
    name: 'Employment Details',
    icon: <Building className="h-5 w-5" />,
    fields: ['department_id', 'position', 'employment_type', 'hire_date', 'work_schedule', 'weekly_hours']
  },
  {
    id: 'compensation',
    name: 'Compensation',
    icon: <CreditCard className="h-5 w-5" />,
    fields: ['basic_salary', 'housing_allowance', 'transport_allowance']
  },
  {
    id: 'contact',
    name: 'Contact & Emergency',
    icon: <MapPin className="h-5 w-5" />,
    fields: ['address', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship']
  },
  {
    id: 'review',
    name: 'Review & Submit',
    icon: <CheckCircle className="h-5 w-5" />,
    fields: ['notes']
  }
];

export default function NewEmployeePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreateEmployeeInput>({
    first_name: '',
    last_name: '',
    email: '',
    employment_type: 'Full-time',
    work_schedule: 'Standard'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch departments for dropdown
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async (): Promise<Department[]> => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData: CreateEmployeeInput) => {
      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (employee) => {
      router.push("/employees/${employee.id}" as any as any);
    },
    onError: (error) => {
      console.error('Error creating employee:', error);
      setErrors({ general: 'Failed to create employee. Please try again.' });
    },
  });

  const validateStep = (stepIndex: number): boolean => {
    const step = formSteps[stepIndex];
    const newErrors: Record<string, string> = {};

    step.fields.forEach(field => {
      if (field === 'first_name' && !formData.first_name?.trim()) {
        newErrors.first_name = 'First name is required';
      }
      if (field === 'last_name' && !formData.last_name?.trim()) {
        newErrors.last_name = 'Last name is required';
      }
      if (field === 'email') {
        if (!formData.email?.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
      }
      if (field === 'employment_type' && !formData.employment_type) {
        newErrors.employment_type = 'Employment type is required';
      }
      if (field === 'work_schedule' && !formData.work_schedule) {
        newErrors.work_schedule = 'Work schedule is required';
      }
    });

    // UAE-specific validations
    if (step.id === 'personal') {
      if (formData.emirates_id && !/^\d{3}-\d{4}-\d{7}-\d{1}$/.test(formData.emirates_id)) {
        newErrors.emirates_id = 'Emirates ID format should be XXX-XXXX-XXXXXXX-X';
      }
    }

    if (step.id === 'employment') {
      if (formData.weekly_hours && formData.weekly_hours > UAE_LABOR_LAW.STANDARD_WORK_HOURS_PER_WEEK) {
        newErrors.weekly_hours = `Weekly hours cannot exceed ${UAE_LABOR_LAW.STANDARD_WORK_HOURS_PER_WEEK} hours per UAE Labor Law`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, formSteps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  const handleInputChange = (field: keyof CreateEmployeeInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      await createEmployeeMutation.mutateAsync(formData);
    } catch (error) {
      // Error handling is done in mutation's onError
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateEmployeeId = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EMP${year}${month}${random}`;
  };

  const calculateTotalCompensation = () => {
    const basic = formData.basic_salary || 0;
    const housing = formData.housing_allowance || 0;
    const transport = formData.transport_allowance || 0;
    return basic + housing + transport;
  };

  const currentStepData = formSteps[currentStep];
  const isLastStep = currentStep === formSteps.length - 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            href={`/employees/directory`}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
            <p className="text-gray-600">Create a comprehensive employee profile</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Step Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress</h2>
            <nav className="space-y-2">
              {formSteps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    index === currentStep
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : index < currentStep
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-gray-50 text-gray-500 border border-gray-200'
                  } ${index <= currentStep ? 'hover:bg-opacity-80 cursor-pointer' : 'cursor-not-allowed'}`}
                  disabled={index > currentStep}
                >
                  <div className={`flex-shrink-0 ${
                    index === currentStep
                      ? 'text-blue-600'
                      : index < currentStep
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}>
                    {index < currentStep ? <CheckCircle className="h-5 w-5" /> : step.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{step.name}</p>
                    <p className="text-xs opacity-75">
                      {index < currentStep ? 'Completed' : index === currentStep ? 'In Progress' : 'Pending'}
                    </p>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Form Content */}
        <div className="lg:col-span-3">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="text-blue-600">{currentStepData.icon}</div>
              <h2 className="text-xl font-semibold text-gray-900">{currentStepData.name}</h2>
            </div>

            {/* Error Display */}
            {errors.general && (
              <div className="mb-6 p-4 border border-red-200 rounded-lg bg-red-50 flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-700">{errors.general}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Personal Information */}
              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.first_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter first name"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.last_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter last name"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+971 XX XXX XXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.date_of_birth || ''}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                    <input
                      type="text"
                      value={formData.nationality || ''}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter nationality"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emirates ID
                      <span className="text-xs text-gray-500 ml-1">(Format: XXX-XXXX-XXXXXXX-X)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.emirates_id || ''}
                      onChange={(e) => handleInputChange('emirates_id', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.emirates_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="784-1234-1234567-1"
                    />
                    {errors.emirates_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.emirates_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                    <input
                      type="text"
                      value={formData.passport_number || ''}
                      onChange={(e) => handleInputChange('passport_number', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter passport number"
                    />
                  </div>
                </div>
              )}

              {/* Employment Details */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={formData.department_id || ''}
                      onChange={(e) => handleInputChange('department_id', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select department</option>
                      {departments?.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="text"
                      value={formData.position || ''}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter job position"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employment Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.employment_type}
                      onChange={(e) => handleInputChange('employment_type', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.employment_type ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Intern">Intern</option>
                    </select>
                    {errors.employment_type && (
                      <p className="mt-1 text-sm text-red-600">{errors.employment_type}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                    <input
                      type="date"
                      value={formData.hire_date || ''}
                      onChange={(e) => handleInputChange('hire_date', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Schedule <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.work_schedule}
                      onChange={(e) => handleInputChange('work_schedule', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.work_schedule ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="Standard">Standard</option>
                      <option value="Flexible">Flexible</option>
                      <option value="Shift">Shift</option>
                      <option value="Remote">Remote</option>
                    </select>
                    {errors.work_schedule && (
                      <p className="mt-1 text-sm text-red-600">{errors.work_schedule}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weekly Hours
                      <span className="text-xs text-gray-500 ml-1">(Max {UAE_LABOR_LAW.STANDARD_WORK_HOURS_PER_WEEK} per UAE Law)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={UAE_LABOR_LAW.STANDARD_WORK_HOURS_PER_WEEK}
                      value={formData.weekly_hours || ''}
                      onChange={(e) => handleInputChange('weekly_hours', parseInt(e.target.value))}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.weekly_hours ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="48"
                    />
                    {errors.weekly_hours && (
                      <p className="mt-1 text-sm text-red-600">{errors.weekly_hours}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Compensation */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Basic Salary (AED/month)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formData.basic_salary || ''}
                        onChange={(e) => handleInputChange('basic_salary', parseFloat(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="5000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Housing Allowance (AED/month)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formData.housing_allowance || ''}
                        onChange={(e) => handleInputChange('housing_allowance', parseFloat(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="2000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transport Allowance (AED/month)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formData.transport_allowance || ''}
                        onChange={(e) => handleInputChange('transport_allowance', parseFloat(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Compensation (AED/month)
                      </label>
                      <div className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-lg font-semibold text-green-600">
                        AED {calculateTotalCompensation().toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">UAE Labor Law Compliance</h4>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p>• Compensation must comply with UAE minimum wage requirements</p>
                      <p>• Housing and transport allowances are common benefits in UAE</p>
                      <p>• End-of-service gratuity will be calculated based on basic salary</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact & Emergency */}
              {currentStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter full address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={formData.emergency_contact_name || ''}
                      onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter emergency contact name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.emergency_contact_phone || ''}
                      onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+971 XX XXX XXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    <select
                      value={formData.emergency_contact_relationship || ''}
                      onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select relationship</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Review & Submit */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional notes or comments about the employee..."
                    />
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-2 font-medium">{formData.first_name} {formData.last_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-medium">{formData.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Position:</span>
                        <span className="ml-2 font-medium">{formData.position || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Employment Type:</span>
                        <span className="ml-2 font-medium">{formData.employment_type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Compensation:</span>
                        <span className="ml-2 font-medium text-green-600">AED {calculateTotalCompensation().toLocaleString()}/month</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Employee ID:</span>
                        <span className="ml-2 font-medium">{generateEmployeeId()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  currentStep === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </button>

              <div className="flex space-x-3">
                {!isLastStep ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Next
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isSubmitting ? 'Creating...' : 'Create Employee'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}