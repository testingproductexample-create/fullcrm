// Employee Management System Types for Tailoring CRM
// UAE Labor Law Compliant Employee Management

export interface Department {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  budget_allocation: number | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export interface Employee {
  id: string;
  organization_id: string;
  employee_id: string; // Unique employee number
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: 'Male' | 'Female' | 'Other' | null;
  nationality: string | null;
  emirates_id: string | null;
  passport_number: string | null;
  
  // Employment Information
  department_id: string | null;
  position: string | null;
  employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Intern';
  employment_status: 'Active' | 'Inactive' | 'Terminated' | 'On Leave' | 'Probation';
  hire_date: string | null;
  termination_date: string | null;
  probation_end_date: string | null;
  
  // Compensation (AED)
  basic_salary: number | null;
  housing_allowance: number | null;
  transport_allowance: number | null;
  commission_rate: number | null;
  overtime_rate: number | null;
  
  // Work Schedule
  work_schedule: 'Standard' | 'Flexible' | 'Shift' | 'Remote';
  weekly_hours: number | null;
  
  // Contact & Emergency
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  
  // System Fields
  profile_photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  
  // Relations
  department?: Department;
  skills?: EmployeeSkill[];
  certifications?: EmployeeCertification[];
  contracts?: EmploymentContract[];
  visas?: VisaTracking[];
  performance_reviews?: PerformanceReview[];
  training_enrollments?: EmployeeTraining[];
  workflow_assignments?: EmployeeWorkflowAssignment[];
}

export interface EmployeeSkill {
  id: string;
  employee_id: string;
  skill_name: string;
  skill_category: 'Technical' | 'Soft' | 'Language' | 'Leadership' | 'Specialized';
  proficiency_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  years_of_experience: number | null;
  certification_available: boolean;
  last_assessed: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
  
  // Relations
  employee?: Employee;
}

export interface EmployeeCertification {
  id: string;
  employee_id: string;
  certification_name: string;
  issuing_organization: string;
  issue_date: string | null;
  expiry_date: string | null;
  certification_number: string | null;
  certificate_url: string | null;
  verification_status: 'Verified' | 'Pending' | 'Expired' | 'Invalid';
  notes: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
  
  // Relations
  employee?: Employee;
}

export interface EmploymentContract {
  id: string;
  employee_id: string;
  contract_type: 'Permanent' | 'Fixed-term' | 'Probation' | 'Freelance';
  start_date: string;
  end_date: string | null;
  basic_salary: number;
  housing_allowance: number | null;
  transport_allowance: number | null;
  other_allowances: number | null;
  total_compensation: number;
  working_hours_per_week: number;
  annual_leave_days: number;
  sick_leave_days: number;
  notice_period_days: number;
  probation_period_months: number | null;
  contract_terms: string | null;
  uae_labor_law_compliant: boolean;
  contract_document_url: string | null;
  signed_date: string | null;
  status: 'Draft' | 'Active' | 'Expired' | 'Terminated';
  created_at: string;
  updated_at: string;
  organization_id: string;
  
  // Relations
  employee?: Employee;
}

export interface VisaTracking {
  id: string;
  employee_id: string;
  visa_type: 'Employment' | 'Residence' | 'Visit' | 'Student' | 'Family' | 'UAE National';
  visa_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  sponsor_name: string | null;
  status: 'Valid' | 'Expired' | 'Under Process' | 'Cancelled' | 'UAE National';
  renewal_required: boolean;
  renewal_reminder_date: string | null;
  visa_document_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
  
  // Relations
  employee?: Employee;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string | null;
  review_period_start: string;
  review_period_end: string;
  review_type: 'Annual' | 'Quarterly' | 'Mid-year' | 'Probation' | '360-degree';
  
  // Performance Ratings (1-5 scale)
  overall_rating: number | null;
  technical_skills_rating: number | null;
  communication_rating: number | null;
  teamwork_rating: number | null;
  leadership_rating: number | null;
  initiative_rating: number | null;
  reliability_rating: number | null;
  
  // Goals and Development
  goals_achieved: string | null;
  areas_for_improvement: string | null;
  development_plan: string | null;
  training_recommendations: string | null;
  
  // Comments and Notes
  reviewer_comments: string | null;
  employee_comments: string | null;
  
  // Status and Workflow
  status: 'Draft' | 'In Progress' | 'Completed' | 'Approved' | 'Archived';
  submission_date: string | null;
  approval_date: string | null;
  
  created_at: string;
  updated_at: string;
  organization_id: string;
  
  // Relations
  employee?: Employee;
  reviewer?: Employee;
}

export interface TrainingProgram {
  id: string;
  program_name: string;
  description: string | null;
  training_type: 'Technical' | 'Leadership' | 'Safety' | 'Compliance' | 'Customer Service' | 'Professional Development';
  duration_hours: number | null;
  format: 'In-person' | 'Online' | 'Hybrid' | 'Workshop' | 'Certification';
  max_participants: number | null;
  cost_per_participant: number | null;
  prerequisites: string | null;
  learning_objectives: string | null;
  trainer_name: string | null;
  training_materials_url: string | null;
  certification_provided: boolean;
  status: 'Active' | 'Inactive' | 'Scheduled' | 'Completed' | 'Cancelled';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
  
  // Relations
  enrollments?: EmployeeTraining[];
}

export interface EmployeeTraining {
  id: string;
  employee_id: string;
  training_program_id: string;
  enrollment_date: string;
  start_date: string | null;
  completion_date: string | null;
  status: 'Enrolled' | 'In Progress' | 'Completed' | 'Dropped' | 'Failed';
  completion_percentage: number;
  final_score: number | null;
  certification_earned: boolean;
  feedback: string | null;
  cost: number | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
  
  // Relations
  employee?: Employee;
  training_program?: TrainingProgram;
}

export interface EmployeeWorkflowAssignment {
  id: string;
  employee_id: string;
  workflow_id: string | null;
  task_id: string | null;
  order_id: string | null;
  assignment_date: string;
  due_date: string | null;
  status: 'Assigned' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  estimated_hours: number | null;
  actual_hours: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
  
  // Relations
  employee?: Employee;
}

export interface EmployeeEmergencyContact {
  id: string;
  employee_id: string;
  contact_name: string;
  relationship: string;
  phone_primary: string;
  phone_secondary: string | null;
  email: string | null;
  address: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  organization_id: string;
  
  // Relations
  employee?: Employee;
}

// Form Types for Employee Management
export interface CreateEmployeeInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  nationality?: string;
  emirates_id?: string;
  passport_number?: string;
  department_id?: string;
  position?: string;
  employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Intern';
  hire_date?: string;
  basic_salary?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  work_schedule: 'Standard' | 'Flexible' | 'Shift' | 'Remote';
  weekly_hours?: number;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  notes?: string;
}

export interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {
  employment_status?: 'Active' | 'Inactive' | 'Terminated' | 'On Leave' | 'Probation';
  termination_date?: string;
  commission_rate?: number;
  overtime_rate?: number;
}

export interface CreatePerformanceReviewInput {
  employee_id: string;
  review_period_start: string;
  review_period_end: string;
  review_type: 'Annual' | 'Quarterly' | 'Mid-year' | 'Probation' | '360-degree';
  overall_rating?: number;
  technical_skills_rating?: number;
  communication_rating?: number;
  teamwork_rating?: number;
  leadership_rating?: number;
  initiative_rating?: number;
  reliability_rating?: number;
  goals_achieved?: string;
  areas_for_improvement?: string;
  development_plan?: string;
  training_recommendations?: string;
  reviewer_comments?: string;
}

export interface CreateTrainingProgramInput {
  program_name: string;
  description?: string;
  training_type: 'Technical' | 'Leadership' | 'Safety' | 'Compliance' | 'Customer Service' | 'Professional Development';
  duration_hours?: number;
  format: 'In-person' | 'Online' | 'Hybrid' | 'Workshop' | 'Certification';
  max_participants?: number;
  cost_per_participant?: number;
  prerequisites?: string;
  learning_objectives?: string;
  trainer_name?: string;
  certification_provided: boolean;
  start_date?: string;
  end_date?: string;
}

export interface EnrollEmployeeInput {
  employee_id: string;
  training_program_id: string;
  start_date?: string;
  notes?: string;
}

// Statistics and Analytics Types
export interface EmployeeStats {
  total_employees: number;
  active_employees: number;
  new_hires_this_month: number;
  employees_on_leave: number;
  terminations_this_month: number;
  average_tenure_months: number;
  departments_count: number;
  pending_performance_reviews: number;
  training_completions_this_month: number;
  visa_expiring_soon: number;
}

export interface DepartmentStats {
  department_id: string;
  department_name: string;
  total_employees: number;
  average_salary: number;
  total_payroll: number;
  performance_rating_avg: number;
  training_hours_completed: number;
  employee_satisfaction: number;
}

export interface SkillsAnalytics {
  skill_name: string;
  skill_category: string;
  employee_count: number;
  average_proficiency: number;
  skill_gaps: number;
  training_programs_available: number;
}

export interface PerformanceAnalytics {
  period: string;
  total_reviews: number;
  average_overall_rating: number;
  top_performers: Employee[];
  improvement_needed: Employee[];
  goal_achievement_rate: number;
  training_recommendations_count: number;
}

// Utility Functions
export const formatEmployeeName = (employee: Employee): string => {
  return `${employee.first_name} ${employee.last_name}`;
};

export const formatEmployeeId = (employee: Employee): string => {
  return employee.employee_id || employee.id.slice(0, 8).toUpperCase();
};

export const calculateTotalCompensation = (employee: Employee): number => {
  const basic = employee.basic_salary || 0;
  const housing = employee.housing_allowance || 0;
  const transport = employee.transport_allowance || 0;
  return basic + housing + transport;
};

export const formatAEDCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED'
  }).format(amount);
};

export const calculateEmployeeTenure = (hireDate: string): number => {
  const hire = new Date(hireDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - hire.getTime());
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
  return diffMonths;
};

export const isVisaExpiringSoon = (visa: VisaTracking): boolean => {
  if (!visa.expiry_date || visa.status !== 'Valid') return false;
  const expiryDate = new Date(visa.expiry_date);
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  return expiryDate <= threeMonthsFromNow;
};

export const getEmployeeStatusColor = (status: string): string => {
  switch (status) {
    case 'Active': return 'text-green-600 bg-green-100';
    case 'Probation': return 'text-yellow-600 bg-yellow-100';
    case 'On Leave': return 'text-blue-600 bg-blue-100';
    case 'Inactive': return 'text-gray-600 bg-gray-100';
    case 'Terminated': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getProficiencyColor = (level: string): string => {
  switch (level) {
    case 'Expert': return 'text-purple-600 bg-purple-100';
    case 'Advanced': return 'text-green-600 bg-green-100';
    case 'Intermediate': return 'text-blue-600 bg-blue-100';
    case 'Beginner': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getPerformanceRatingColor = (rating: number): string => {
  if (rating >= 4.5) return 'text-green-600 bg-green-100';
  if (rating >= 4.0) return 'text-blue-600 bg-blue-100';
  if (rating >= 3.5) return 'text-yellow-600 bg-yellow-100';
  if (rating >= 3.0) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
};

// UAE Labor Law Compliance
export const UAE_LABOR_LAW = {
  STANDARD_WORK_HOURS_PER_WEEK: 48,
  OVERTIME_RATE: 1.25,
  MINIMUM_ANNUAL_LEAVE_DAYS: 21,
  MAXIMUM_PROBATION_PERIOD_MONTHS: 6,
  NOTICE_PERIOD_DAYS: {
    UNDER_1_YEAR: 30,
    OVER_1_YEAR: 60,
    OVER_5_YEARS: 90
  },
  GRATUITY_CALCULATION: {
    FIRST_5_YEARS: 21, // days per year
    AFTER_5_YEARS: 30  // days per year
  }
};

export const calculateGratuity = (basicSalary: number, yearsOfService: number): number => {
  let gratuityDays = 0;
  
  if (yearsOfService <= 5) {
    gratuityDays = yearsOfService * UAE_LABOR_LAW.GRATUITY_CALCULATION.FIRST_5_YEARS;
  } else {
    gratuityDays = (5 * UAE_LABOR_LAW.GRATUITY_CALCULATION.FIRST_5_YEARS) + 
                   ((yearsOfService - 5) * UAE_LABOR_LAW.GRATUITY_CALCULATION.AFTER_5_YEARS);
  }
  
  const dailyWage = basicSalary / 30;
  return gratuityDays * dailyWage;
};

export const getRequiredNoticePeriod = (yearsOfService: number): number => {
  if (yearsOfService < 1) return UAE_LABOR_LAW.NOTICE_PERIOD_DAYS.UNDER_1_YEAR;
  if (yearsOfService < 5) return UAE_LABOR_LAW.NOTICE_PERIOD_DAYS.OVER_1_YEAR;
  return UAE_LABOR_LAW.NOTICE_PERIOD_DAYS.OVER_5_YEARS;
};