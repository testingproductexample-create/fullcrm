// Training & Certification Management System Types
// Created: 2025-11-11 10:47:35
// Description: Comprehensive TypeScript interfaces for training system

// ==================== ENUM TYPES ====================

export type TrainingCourseType = 'technical_skills' | 'customer_service' | 'leadership' | 'compliance' | 'safety' | 'quality_control' | 'tailoring_craft' | 'software_systems';
export type TrainingDeliveryMethod = 'in_person' | 'online' | 'blended' | 'self_paced' | 'mentoring' | 'workshop';
export type TrainingStatus = 'draft' | 'active' | 'archived' | 'maintenance' | 'under_review';
export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'failed' | 'dropped' | 'suspended';
export type TcContentType = 'video' | 'text' | 'audio' | 'interactive' | 'document' | 'quiz' | 'simulation';
export type TcAssessmentType = 'quiz' | 'practical_exam' | 'project' | 'presentation' | 'observation' | 'portfolio';
export type TcSessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
export type TcCareerLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director';
export type TcComplianceStatus = 'compliant' | 'non_compliant' | 'pending' | 'warning' | 'overdue';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
export type CertificationStatus = 'not_started' | 'in_progress' | 'completed' | 'expired' | 'renewed' | 'suspended';

// ==================== EXISTING TABLES (Enhanced) ====================

// Training Programs (existing table)
export interface TrainingProgram {
  id: string;
  organization_id: string;
  program_code: string;
  program_name: string;
  program_name_arabic?: string;
  description?: string;
  program_category?: string;
  training_type?: string;
  skill_level?: string;
  duration_hours: number;
  duration_days: number;
  max_participants?: number;
  min_participants?: number;
  cost_per_participant_aed?: number;
  total_budget_aed?: number;
  instructor_name?: string;
  instructor_credentials?: string;
  training_provider?: string;
  training_location?: string;
  training_format?: string;
  certification_provided?: boolean;
  certification_authority?: string;
  certification_validity_months?: number;
  prerequisites?: string;
  target_audience?: string;
  learning_objectives?: string[];
  training_materials?: string[];
  assessment_method?: string;
  passing_score?: number;
  is_mandatory?: boolean;
  is_active?: boolean;
  approval_required?: boolean;
  approved_by?: string;
  approval_date?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TrainingProgramInsert extends Omit<TrainingProgram, 'id' | 'created_at' | 'updated_at'> {}
export interface TrainingProgramUpdate extends Partial<TrainingProgramInsert> {}

// Employee Training (existing table)
export interface EmployeeTraining {
  id: string;
  organization_id: string;
  employee_id: string;
  training_program_id: string;
  enrollment_date?: string;
  training_start_date?: string;
  training_end_date?: string;
  training_status?: string;
  attendance_percentage?: number;
  assessment_score?: number;
  assessment_passed?: boolean;
  completion_date?: string;
  certificate_issued?: boolean;
  certificate_number?: string;
  certificate_url?: string;
  cost_aed?: number;
  approved_by?: string;
  approval_date?: string;
  feedback_rating?: number;
  feedback_comments?: string;
  trainer_feedback?: string;
  skills_gained?: string[];
  next_level_training_id?: string;
  reminder_sent?: boolean;
  mandatory_completion_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeTrainingInsert extends Omit<EmployeeTraining, 'id' | 'created_at' | 'updated_at'> {}
export interface EmployeeTrainingUpdate extends Partial<EmployeeTrainingInsert> {}

// Employee Skills (existing table)
export interface EmployeeSkill {
  id: string;
  organization_id: string;
  employee_id: string;
  skill_category: string;
  skill_name: string;
  skill_subcategory?: string;
  proficiency_level?: string;
  years_experience?: number;
  verified_by?: string;
  verification_date?: string;
  verification_notes?: string;
  last_assessment_date?: string;
  next_assessment_date?: string;
  quality_rating?: number;
  speed_rating?: number;
  consistency_rating?: number;
  is_primary_skill?: boolean;
  is_certified?: boolean;
  certification_authority?: string;
  certification_date?: string;
  certification_expiry_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeSkillInsert extends Omit<EmployeeSkill, 'id' | 'created_at' | 'updated_at'> {}
export interface EmployeeSkillUpdate extends Partial<EmployeeSkillInsert> {}

// Employee Certifications (existing table)
export interface EmployeeCertification {
  id: string;
  organization_id: string;
  employee_id: string;
  certification_name: string;
  certification_name_arabic?: string;
  issuing_authority: string;
  certification_number?: string;
  issue_date: string;
  expiry_date?: string;
  certification_level?: string;
  certification_type?: string;
  certification_category?: string;
  certificate_file_url?: string;
  verification_status?: string;
  verified_by?: string;
  verification_date?: string;
  renewal_required?: boolean;
  renewal_reminder_days?: number;
  cost_aed?: number;
  training_hours?: number;
  cpe_credits?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeCertificationInsert extends Omit<EmployeeCertification, 'id' | 'created_at' | 'updated_at'> {}
export interface EmployeeCertificationUpdate extends Partial<EmployeeCertificationInsert> {}

// ==================== NEW ENHANCED TABLES ====================

// Course Modules
export interface TcCourseModule {
  id: string;
  organization_id: string;
  training_program_id: string;
  module_order: number;
  module_title: string;
  module_description?: string;
  content_type: TcContentType;
  content_url?: string;
  content_text?: string;
  duration_minutes: number;
  is_mandatory: boolean;
  resources: any[];
  learning_objectives?: string[];
  completion_criteria?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TcCourseModuleInsert extends Omit<TcCourseModule, 'id' | 'created_at' | 'updated_at'> {}
export interface TcCourseModuleUpdate extends Partial<TcCourseModuleInsert> {}

// Training Assessments
export interface TcTrainingAssessment {
  id: string;
  organization_id: string;
  training_program_id: string;
  module_id?: string;
  assessment_type: TcAssessmentType;
  assessment_title: string;
  assessment_description?: string;
  questions: any[];
  total_points: number;
  passing_points: number;
  time_limit_minutes?: number;
  attempts_allowed: number;
  instructions?: string;
  is_final_assessment: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TcTrainingAssessmentInsert extends Omit<TcTrainingAssessment, 'id' | 'created_at' | 'updated_at'> {}
export interface TcTrainingAssessmentUpdate extends Partial<TcTrainingAssessmentInsert> {}

// Training Sessions
export interface TcTrainingSession {
  id: string;
  organization_id: string;
  training_program_id: string;
  session_title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  virtual_meeting_link?: string;
  instructor_id?: string;
  max_attendees?: number;
  registered_count: number;
  attended_count: number;
  session_status: TcSessionStatus;
  session_notes?: string;
  materials: any[];
  created_at?: string;
  updated_at?: string;
}

export interface TcTrainingSessionInsert extends Omit<TcTrainingSession, 'id' | 'created_at' | 'updated_at'> {}
export interface TcTrainingSessionUpdate extends Partial<TcTrainingSessionInsert> {}

// Skill Assessments
export interface TcSkillAssessment {
  id: string;
  organization_id: string;
  employee_id: string;
  skill_id: string;
  assessment_date: string;
  assessment_type: string;
  assessor_id?: string;
  skill_level_before?: string;
  skill_level_after: string;
  score?: number;
  strengths?: string;
  improvement_areas?: string;
  recommendations?: string;
  evidence_files: any[];
  assessment_criteria?: string;
  follow_up_date?: string;
  created_at?: string;
}

export interface TcSkillAssessmentInsert extends Omit<TcSkillAssessment, 'id' | 'created_at'> {}
export interface TcSkillAssessmentUpdate extends Partial<TcSkillAssessmentInsert> {}

// Career Paths
export interface TcCareerPath {
  id: string;
  organization_id: string;
  path_name: string;
  path_description?: string;
  department?: string;
  entry_level: TcCareerLevel;
  progression_levels: any[];
  required_skills: any[];
  required_certifications?: string[];
  recommended_training_programs?: string[];
  average_progression_months?: number;
  success_criteria?: string;
  mentor_assignment: boolean;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TcCareerPathInsert extends Omit<TcCareerPath, 'id' | 'created_at' | 'updated_at'> {}
export interface TcCareerPathUpdate extends Partial<TcCareerPathInsert> {}

// Employee Career Progress
export interface TcEmployeeCareerProgress {
  id: string;
  organization_id: string;
  employee_id: string;
  career_path_id: string;
  current_level: TcCareerLevel;
  target_level?: TcCareerLevel;
  progress_percentage: number;
  started_date: string;
  target_completion_date?: string;
  completed_requirements: any[];
  pending_requirements: any[];
  mentor_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TcEmployeeCareerProgressInsert extends Omit<TcEmployeeCareerProgress, 'id' | 'created_at' | 'updated_at'> {}
export interface TcEmployeeCareerProgressUpdate extends Partial<TcEmployeeCareerProgressInsert> {}

// Training Analytics
export interface TcTrainingAnalytics {
  id: string;
  organization_id: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  calculation_period: string;
  period_start: string;
  period_end: string;
  employee_id?: string;
  training_program_id?: string;
  department?: string;
  additional_data: Record<string, any>;
  created_at?: string;
}

export interface TcTrainingAnalyticsInsert extends Omit<TcTrainingAnalytics, 'id' | 'created_at'> {}
export interface TcTrainingAnalyticsUpdate extends Partial<TcTrainingAnalyticsInsert> {}

// Compliance Tracking
export interface TcComplianceTracking {
  id: string;
  organization_id: string;
  employee_id: string;
  compliance_type: string;
  compliance_requirement: string;
  required_training_programs?: string[];
  required_certifications?: string[];
  deadline: string;
  completion_date?: string;
  status: TcComplianceStatus;
  risk_level: number;
  last_review_date?: string;
  next_review_date?: string;
  responsible_manager?: string;
  notes?: string;
  evidence_documents: any[];
  remediation_plan?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TcComplianceTrackingInsert extends Omit<TcComplianceTracking, 'id' | 'created_at' | 'updated_at'> {}
export interface TcComplianceTrackingUpdate extends Partial<TcComplianceTrackingInsert> {}

// Learning Preferences
export interface TcLearningPreferences {
  id: string;
  organization_id: string;
  employee_id: string;
  preferred_language: string;
  learning_style?: string;
  preferred_time_of_day?: string;
  preferred_duration_minutes: number;
  device_preference?: string;
  notification_preferences: Record<string, any>;
  accessibility_requirements?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TcLearningPreferencesInsert extends Omit<TcLearningPreferences, 'id' | 'created_at' | 'updated_at'> {}
export interface TcLearningPreferencesUpdate extends Partial<TcLearningPreferencesInsert> {}

// ==================== COMPUTED/VIEW TYPES ====================

export interface TrainingDashboardStats {
  total_programs: number;
  active_enrollments: number;
  completed_trainings: number;
  pending_certifications: number;
  compliance_rate: number;
  average_completion_time: number;
}

export interface EmployeeTrainingProfile {
  employee_id: string;
  employee_name: string;
  department: string;
  current_trainings: number;
  completed_trainings: number;
  certifications: number;
  skills_count: number;
  compliance_status: TcComplianceStatus;
  career_progress_percentage: number;
}

export interface TrainingCompletionTrend {
  period: string;
  completed: number;
  enrolled: number;
  completion_rate: number;
}

export interface SkillGapAnalysis {
  skill_category: string;
  required_level: SkillLevel;
  current_avg_level: SkillLevel;
  gap_percentage: number;
  affected_employees: number;
  recommended_training: string[];
}

export interface CertificationRenewalAlert {
  employee_id: string;
  employee_name: string;
  certification_name: string;
  expiry_date: string;
  days_until_expiry: number;
  priority: 'high' | 'medium' | 'low';
}

export interface TrainingROIAnalysis {
  training_program_id: string;
  training_name: string;
  total_cost: number;
  participants: number;
  completion_rate: number;
  performance_improvement: number;
  estimated_roi: number;
}

// ==================== API RESPONSE TYPES ====================

export interface TrainingApiResponse<T> {
  data: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface TrainingFilters {
  program_type?: string;
  status?: TrainingStatus;
  department?: string;
  skill_level?: SkillLevel;
  mandatory?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface TrainingPagination {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ==================== FORM TYPES ====================

export interface TrainingProgramFormData {
  program_name: string;
  program_name_arabic?: string;
  description: string;
  program_category: string;
  training_type: string;
  skill_level: SkillLevel;
  duration_hours: number;
  max_participants: number;
  instructor_name: string;
  training_location: string;
  certification_provided: boolean;
  is_mandatory: boolean;
  learning_objectives: string[];
  prerequisites: string;
  target_audience: string;
}

export interface EmployeeEnrollmentFormData {
  employee_id: string;
  training_program_id: string;
  target_completion_date: string;
  is_mandatory: boolean;
  notes?: string;
}

export interface SkillAssessmentFormData {
  employee_id: string;
  skill_id: string;
  assessment_type: string;
  skill_level_after: SkillLevel;
  score: number;
  strengths: string;
  improvement_areas: string;
  recommendations: string;
}

export interface CertificationFormData {
  employee_id: string;
  certification_name: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date?: string;
  certification_number?: string;
  cost_aed?: number;
}

export interface CareerPathFormData {
  path_name: string;
  path_description: string;
  department: string;
  entry_level: TcCareerLevel;
  progression_levels: {
    level: TcCareerLevel;
    requirements: string[];
    estimated_months: number;
  }[];
  required_skills: string[];
  recommended_training_programs: string[];
}