export interface Organization {
  id: string;
  name: string;
  business_type?: string;
  country: string;
  currency: string;
  primary_language: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  full_name?: string;
  role: 'owner' | 'manager' | 'tailor' | 'assistant';
  phone?: string;
  avatar_url?: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  organization_id: string;
  customer_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  phone_secondary?: string;
  emirates_id?: string;
  visa_status?: string;
  nationality?: string;
  gender?: string;
  date_of_birth?: string;
  anniversary_date?: string;
  profile_photo_url?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  emirate?: string;
  postal_code?: string;
  classification: 'VIP' | 'Regular' | 'New';
  status: 'Active' | 'Inactive' | 'Blocked';
  customer_since: string;
  last_order_date?: string;
  total_orders: number;
  total_spent: number;
  loyalty_points: number;
  loyalty_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  preferred_communication?: string[];
  communication_opt_in: boolean;
  notes?: string;
  tags?: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CustomerMeasurement {
  id: string;
  organization_id: string;
  customer_id: string;
  measurement_date: string;
  garment_type: string;
  body_type?: string;
  size_standard?: string;
  measurements: Record<string, any>;
  fitting_notes?: string;
  measured_by?: string;
  is_latest: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerCommunication {
  id: string;
  organization_id: string;
  customer_id: string;
  communication_type: 'SMS' | 'Email' | 'WhatsApp' | 'Phone' | 'In-Person';
  direction: 'Inbound' | 'Outbound';
  subject?: string;
  message?: string;
  status: 'Sent' | 'Delivered' | 'Failed' | 'Read';
  sent_by?: string;
  related_order_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CustomerNote {
  id: string;
  organization_id: string;
  customer_id: string;
  note_type: 'General' | 'Complaint' | 'Feedback' | 'Important';
  note: string;
  is_pinned: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerEvent {
  id: string;
  organization_id: string;
  customer_id: string;
  event_type: 'Birthday' | 'Anniversary' | 'Special Occasion';
  event_date: string;
  recurrence: 'Yearly' | 'None';
  reminder_days_before: number[];
  last_reminded?: string;
  is_active: boolean;
  created_at: string;
}

export interface LoyaltyProgram {
  id: string;
  organization_id: string;
  program_name: string;
  description?: string;
  points_per_aed: number;
  tier_thresholds: Record<string, number>;
  tier_benefits: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  organization_id: string;
  customer_id: string;
  transaction_type: 'Earned' | 'Redeemed' | 'Expired' | 'Adjusted';
  points: number;
  description?: string;
  related_order_id?: string;
  created_by?: string;
  created_at: string;
}


export interface Order {
  id: string;
  organization_id: string;
  customer_id: string;
  order_number: string;
  order_type: 'bespoke' | 'casual' | 'alteration' | 'repair' | 'special_occasion';
  status: 'new' | 'confirmed' | 'in_progress' | 'quality_check' | 'ready' | 'delivered' | 'cancelled';
  sub_status?: string;
  priority_level: 'rush' | 'normal' | 'low';
  garment_details: Record<string, any>;
  design_notes?: string;
  special_instructions?: string;
  estimated_completion?: string;
  delivery_date?: string;
  total_amount: number;
  advance_payment: number;
  vat_amount: number;
  final_amount: number;
  assigned_to?: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface OrderItem {
  id: string;
  organization_id: string;
  order_id: string;
  item_type: string;
  item_name?: string;
  specifications: Record<string, any>;
  fabric_details?: string;
  color?: string;
  style_options: Record<string, any>;
  measurements_reference?: string;
  special_requirements?: string;
  estimated_time_hours?: number;
  item_amount: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  organization_id: string;
  order_id: string;
  status: string;
  sub_status?: string;
  previous_status?: string;
  changed_by?: string;
  changed_at: string;
  notes?: string;
  percentage_completion?: number;
}

export interface OrderApproval {
  id: string;
  organization_id: string;
  order_id: string;
  approval_type: 'design' | 'measurement' | 'final' | 'price';
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  customer_id: string;
  approved_by?: string;
  approval_date?: string;
  feedback?: string;
  revision_requests?: string;
  created_at: string;
}

export interface OrderTemplate {
  id: string;
  organization_id: string;
  template_name: string;
  template_type?: string;
  description?: string;
  default_specifications: Record<string, any>;
  template_settings: Record<string, any>;
  usage_count: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}


export interface OrderWorkflow {
  id: string;
  organization_id: string;
  workflow_name: string;
  workflow_type: string;
  description?: string;
  status_definitions: Record<string, any>;
  automation_rules: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderWorkflowStatus {
  id: string;
  organization_id: string;
  order_id: string;
  workflow_id?: string;
  current_status: string;
  sub_status?: string;
  status_order: number;
  entered_at: string;
  completed_at?: string;
  assigned_employee_id?: string;
  status_notes?: string;
  progress_percentage: number;
  automatic_transition: boolean;
  approval_required: boolean;
  created_at: string;
}

export interface WorkflowTransition {
  id: string;
  organization_id: string;
  workflow_id: string;
  from_status?: string;
  to_status: string;
  transition_type: string;
  transition_rules: Record<string, any>;
  trigger_conditions: Record<string, any>;
  approval_requirements: Record<string, any>;
  notification_settings: Record<string, any>;
  created_at: string;
}

export interface WorkflowAnalytics {
  id: string;
  organization_id: string;
  workflow_id?: string;
  status: string;
  average_completion_time?: number;
  bottleneck_score?: number;
  efficiency_rating?: number;
  last_calculated: string;
  performance_metrics: Record<string, any>;
  created_at: string;
}

export interface AutomationRule {
  id: string;
  organization_id: string;
  rule_name: string;
  rule_type: string;
  trigger_conditions: Record<string, any>;
  action_type: string;
  rule_configuration: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowMilestone {
  id: string;
  organization_id: string;
  order_id: string;
  milestone_name: string;
  milestone_type?: string;
  status: string;
  due_date?: string;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
  order_index: number;
  created_at: string;
}

// Employee Management Types
export interface Department {
  id: string;
  organization_id: string;
  department_name: string;
  department_name_arabic?: string;
  department_code?: string;
  description?: string;
  department_type?: string;
  status: 'Active' | 'Inactive';
  location?: string;
  budget_aed?: number;
  manager_id?: string;
  parent_department_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  organization_id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  first_name_arabic?: string;
  last_name_arabic?: string;
  email: string;
  phone_primary?: string;
  phone_secondary?: string;
  emirates_id?: string;
  passport_number?: string;
  nationality?: string;
  gender?: string;
  date_of_birth?: string;
  photo_url?: string;
  department_id?: string;
  job_title: string;
  job_title_arabic?: string;
  employment_type: string;
  employment_status: string;
  hire_date: string;
  termination_date?: string;
  manager_id?: string;
  address?: string;
  city?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  work_location?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSkill {
  id: string;
  organization_id: string;
  employee_id: string;
  skill_category: string;
  skill_name: string;
  skill_subcategory?: string;
  proficiency_level: string;
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
  created_at: string;
  updated_at: string;
}

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
  created_at: string;
  updated_at: string;
}

export interface EmploymentContract {
  id: string;
  organization_id: string;
  employee_id: string;
  contract_number: string;
  contract_type: string;
  contract_status?: string;
  start_date: string;
  end_date?: string;
  renewal_date?: string;
  contract_language?: string;
  contract_file_url?: string;
  contract_file_arabic_url?: string;
  job_description: string;
  job_description_arabic?: string;
  basic_salary_aed: number;
  housing_allowance_aed?: number;
  transport_allowance_aed?: number;
  food_allowance_aed?: number;
  other_allowances_aed?: number;
  total_package_aed?: number;
  working_hours_weekly?: number;
  working_days_weekly?: number;
  annual_leave_days?: number;
  sick_leave_days?: number;
  notice_period_days?: number;
  probation_period_months?: number;
  end_of_service_benefit?: string;
  medical_insurance?: boolean;
  life_insurance?: boolean;
  gratuity_calculation?: string;
  termination_clause?: string;
  non_compete_clause?: string;
  confidentiality_clause?: string;
  created_by?: string;
  signed_by_employee_date?: string;
  signed_by_employer_date?: string;
  witness_name?: string;
  witness_signature_url?: string;
  created_at: string;
  updated_at: string;
}

export interface VisaTracking {
  id: string;
  organization_id: string;
  employee_id: string;
  visa_type: string;
  visa_number?: string;
  passport_number: string;
  visa_status?: string;
  issue_date: string;
  expiry_date: string;
  entry_date?: string;
  sponsor_name?: string;
  sponsor_license_number?: string;
  visa_purpose?: string;
  profession_on_visa?: string;
  salary_on_visa_aed?: number;
  entry_points?: string[];
  exit_reentry_permit?: boolean;
  emirates_id_number?: string;
  emirates_id_expiry_date?: string;
  labor_card_number?: string;
  labor_card_expiry_date?: string;
  medical_insurance_number?: string;
  medical_insurance_expiry_date?: string;
  renewal_fee_aed?: number;
  government_fees_aed?: number;
  typing_center_fees_aed?: number;
  total_renewal_cost_aed?: number;
  renewal_reminder_days?: number;
  last_renewal_date?: string;
  next_renewal_due_date?: string;
  renewal_status?: string;
  authorized_signatory_id?: string;
  visa_file_url?: string;
  emirates_id_copy_url?: string;
  passport_copy_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceReview {
  id: string;
  organization_id: string;
  employee_id: string;
  review_period_start: string;
  review_period_end: string;
  review_type: string;
  review_cycle?: string;
  reviewer_id: string;
  review_status?: string;
  overall_rating?: number;
  overall_rating_text?: string;
  quality_rating?: number;
  productivity_rating?: number;
  reliability_rating?: number;
  teamwork_rating?: number;
  communication_rating?: number;
  initiative_rating?: number;
  leadership_rating?: number;
  customer_service_rating?: number;
  punctuality_rating?: number;
  attendance_rating?: number;
  strengths?: string;
  areas_for_improvement?: string;
  goals_achieved?: string;
  goals_not_achieved?: string;
  goals_next_period?: string;
  development_plan?: string;
  training_recommendations?: string;
  career_aspirations?: string;
  self_assessment_completed?: boolean;
  self_assessment_date?: string;
  self_assessment_comments?: string;
  peer_review_completed?: boolean;
  peer_review_average_rating?: number;
  manager_review_completed?: boolean;
  manager_review_date?: string;
  manager_comments?: string;
  hr_review_completed?: boolean;
  hr_review_date?: string;
  hr_comments?: string;
  employee_acknowledgment?: boolean;
  employee_acknowledgment_date?: string;
  employee_signature_url?: string;
  employee_comments?: string;
  reviewer_signature_url?: string;
  promotion_recommended?: boolean;
  salary_increase_recommended?: boolean;
  salary_increase_percentage?: number;
  bonus_recommended?: boolean;
  bonus_amount_aed?: number;
  performance_improvement_plan?: boolean;
  disciplinary_action?: boolean;
  created_at: string;
  updated_at: string;
}

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
  duration_days?: number;
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
  created_at: string;
  updated_at: string;
}

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
  created_at: string;
  updated_at: string;
}

export interface EmployeeEmergencyContact {
  id: string;
  organization_id: string;
  employee_id: string;
  contact_name: string;
  contact_name_arabic?: string;
  relationship: string;
  phone_primary: string;
  phone_secondary?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  is_primary_contact?: boolean;
  authorized_for_medical?: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Task Assignment & Workload Management System Types

export interface TaskAssignment {
  id: string;
  organization_id: string;
  order_id: string;
  workflow_status_id?: string;
  task_type: string;
  task_name: string;
  task_description?: string;
  primary_employee_id: string;
  supporting_employee_ids?: string[];
  assigned_by_id?: string;
  priority_level: 'urgent' | 'high' | 'medium' | 'low';
  complexity_score?: number;
  estimated_hours?: number;
  actual_hours?: number;
  required_skills?: Record<string, any>;
  skill_match_score?: number;
  assignment_status: 'assigned' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  assignment_method: 'auto' | 'manual' | 'requested';
  assigned_at: string;
  started_at?: string;
  due_date?: string;
  completed_at?: string;
  quality_score?: number;
  quality_notes?: string;
  customer_satisfaction_score?: number;
  collaboration_required?: boolean;
  collaboration_notes?: string;
  assignment_notes?: string;
  completion_notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeWorkload {
  id: string;
  organization_id: string;
  employee_id: string;
  current_active_tasks: number;
  current_workload_hours: number;
  max_capacity_hours: number;
  availability_status: 'available' | 'busy' | 'overloaded' | 'unavailable' | 'on_leave';
  availability_start_date?: string;
  availability_end_date?: string;
  availability_notes?: string;
  avg_task_completion_time?: number;
  avg_quality_score?: number;
  tasks_completed_this_week: number;
  tasks_completed_this_month: number;
  efficiency_score?: number;
  consistency_score?: number;
  collaboration_score?: number;
  is_overloaded: boolean;
  is_underutilized: boolean;
  last_alert_sent?: string;
  week_start_date: string;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentRule {
  id: string;
  organization_id: string;
  rule_name: string;
  rule_description?: string;
  rule_type: 'skill_based' | 'workload_based' | 'priority_based' | 'rotation';
  task_types?: string[];
  priority_levels?: string[];
  customer_types?: string[];
  order_value_min?: number;
  order_value_max?: number;
  required_skills?: Record<string, any>;
  min_proficiency_level?: string;
  certification_required?: boolean;
  department_ids?: string[];
  max_concurrent_tasks?: number;
  preferred_employee_ids?: string[];
  excluded_employee_ids?: string[];
  assignment_logic: 'best_match' | 'round_robin' | 'least_busy' | 'most_experienced';
  load_balancing_enabled: boolean;
  consider_availability: boolean;
  consider_workload: boolean;
  is_active: boolean;
  priority_order: number;
  auto_assign: boolean;
  times_triggered: number;
  successful_assignments: number;
  avg_assignment_quality?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceMetric {
  id: string;
  organization_id: string;
  employee_id: string;
  metric_period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  period_start_date: string;
  period_end_date: string;
  tasks_assigned: number;
  tasks_completed: number;
  tasks_in_progress: number;
  tasks_overdue: number;
  completion_rate: number;
  total_estimated_hours: number;
  total_actual_hours: number;
  avg_task_duration: number;
  time_efficiency_ratio: number;
  avg_quality_score?: number;
  quality_consistency_score?: number;
  rework_requests: number;
  customer_complaints: number;
  customer_satisfaction_avg?: number;
  multi_employee_tasks: number;
  mentoring_sessions: number;
  knowledge_sharing_sessions: number;
  team_collaboration_score?: number;
  new_skills_learned: number;
  certifications_earned: number;
  training_hours_completed: number;
  skill_improvement_score?: number;
  working_days: number;
  absent_days: number;
  late_arrivals: number;
  availability_percentage: number;
  revenue_generated: number;
  cost_savings: number;
  efficiency_cost_ratio: number;
  department_rank?: number;
  department_percentile?: number;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCollaboration {
  id: string;
  organization_id: string;
  task_assignment_id: string;
  collaboration_type: 'mentoring' | 'joint_work' | 'review' | 'knowledge_transfer';
  primary_employee_id: string;
  secondary_employee_id: string;
  primary_role: string;
  secondary_role: string;
  collaboration_status: 'planned' | 'active' | 'completed' | 'cancelled';
  progress_percentage: number;
  estimated_hours_primary?: number;
  estimated_hours_secondary?: number;
  actual_hours_primary?: number;
  actual_hours_secondary?: number;
  collaboration_effectiveness?: number;
  knowledge_transfer_rating?: number;
  synergy_score?: number;
  communication_frequency?: string;
  preferred_communication_method?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  collaboration_notes?: string;
  completion_feedback?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkloadAlert {
  id: string;
  organization_id: string;
  employee_id?: string;
  department_id?: string;
  manager_id?: string;
  alert_type: 'overload' | 'underutilized' | 'skill_gap' | 'deadline_risk' | 'quality_concern';
  alert_severity: 'low' | 'medium' | 'high' | 'critical';
  alert_title: string;
  alert_message: string;
  current_workload_hours?: number;
  capacity_utilization_percentage?: number;
  tasks_at_risk?: number;
  affected_orders?: string[];
  alert_status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  priority_level: number;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  auto_action_taken?: string;
  auto_action_details?: Record<string, any>;
  escalation_level: number;
  escalated_to?: string;
  escalated_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CapacityPlanning {
  id: string;
  organization_id: string;
  planning_period: 'weekly' | 'monthly' | 'quarterly';
  period_start_date: string;
  period_end_date: string;
  department_id?: string;
  employee_id?: string;
  expected_orders?: number;
  expected_order_value?: number;
  peak_periods?: Record<string, any>;
  seasonal_adjustments?: Record<string, any>;
  current_total_capacity?: number;
  projected_demand_hours?: number;
  capacity_gap_hours?: number;
  utilization_target_percentage?: number;
  skill_demand_forecast?: Record<string, any>;
  skill_availability?: Record<string, any>;
  skill_gaps?: Record<string, any>;
  hiring_recommendations?: Record<string, any>;
  training_recommendations?: Record<string, any>;
  equipment_recommendations?: Record<string, any>;
  outsourcing_recommendations?: Record<string, any>;
  best_case_scenario?: Record<string, any>;
  worst_case_scenario?: Record<string, any>;
  most_likely_scenario?: Record<string, any>;
  contingency_plans?: Record<string, any>;
  current_labor_cost?: number;
  projected_labor_cost?: number;
  additional_investment_needed?: number;
  expected_roi?: number;
  plan_status: 'draft' | 'review' | 'approved' | 'implemented';
  approved_by?: string;
  approved_at?: string;
  implementation_start_date?: string;
  actual_vs_planned_variance?: number;
  accuracy_score?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SkillRequirement {
  id: string;
  organization_id: string;
  task_type: string;
  task_complexity_level?: number;
  order_type?: string;
  customer_tier?: string;
  primary_skill_category: string;
  primary_skill_name: string;
  required_proficiency_level: string;
  is_mandatory: boolean;
  secondary_skills?: Record<string, any>;
  nice_to_have_skills?: Record<string, any>;
  minimum_years_experience?: number;
  specific_experience_types?: string[];
  required_certifications?: string[];
  preferred_certifications?: string[];
  minimum_quality_score?: number;
  maximum_rework_tolerance?: number;
  customer_interaction_required?: boolean;
  typical_completion_time_hours?: number;
  maximum_completion_time_hours?: number;
  rush_order_capability_required?: boolean;
  team_work_required?: boolean;
  mentoring_capability_required?: boolean;
  training_others_required?: boolean;
  required_tools?: Record<string, any>;
  workspace_requirements?: string;
  target_efficiency_score?: number;
  target_quality_score?: number;
  target_customer_satisfaction?: number;
  priority_modifier?: number;
  cost_impact_level?: string;
  revenue_impact_level?: string;
  is_active: boolean;
  effective_date?: string;
  retirement_date?: string;
  version_number?: number;
  superseded_by?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Work Schedule & Attendance Management System Types

export interface WorkShift {
  id: string;
  organization_id: string;
  shift_name: string;
  shift_code: string;
  shift_type: 'morning' | 'afternoon' | 'evening' | 'night' | 'flexible' | 'part_time';
  start_time: string; // TIME format
  end_time: string; // TIME format
  break_duration_minutes: number;
  total_work_hours: number;
  days_of_week: number[]; // 0=Sunday, 1=Monday, etc.
  is_active: boolean;
  is_template: boolean;
  overtime_threshold_hours: number;
  minimum_break_hours: number;
  grace_period_minutes: number;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftAssignment {
  id: string;
  organization_id: string;
  employee_id: string;
  shift_id: string;
  assignment_date: string; // DATE format
  assignment_status: 'scheduled' | 'confirmed' | 'completed' | 'absent' | 'cancelled';
  is_mandatory: boolean;
  can_swap: boolean;
  swap_deadline?: string;
  coverage_required: boolean;
  coverage_employee_id?: string;
  assigned_by_id?: string;
  confirmed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  organization_id: string;
  employee_id: string;
  shift_assignment_id?: string;
  attendance_date: string; // DATE format
  check_in_time?: string;
  check_out_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  total_work_hours?: number;
  total_break_hours?: number;
  overtime_hours: number;
  late_arrival_minutes: number;
  early_departure_minutes: number;
  attendance_status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  check_in_location?: Record<string, any>; // JSONB for GPS coordinates
  check_out_location?: Record<string, any>; // JSONB for GPS coordinates
  check_in_device_id?: string;
  check_out_device_id?: string;
  is_manual_entry: boolean;
  manual_entry_reason?: string;
  approved_by?: string;
  approval_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  organization_id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'emergency' | 'unpaid' | 'hajj';
  start_date: string; // DATE format
  end_date: string; // DATE format
  total_days: number;
  working_days: number;
  reason: string;
  supporting_documents?: Record<string, any>; // JSONB for file URLs, certificates
  request_status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requested_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_comments?: string;
  hr_notes?: string;
  is_emergency_leave: boolean;
  pay_status: 'full_pay' | 'half_pay' | 'no_pay';
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: string;
  organization_id: string;
  employee_id: string;
  leave_year: number;
  annual_leave_entitled: number; // UAE: 30 days after 1 year
  annual_leave_used: number;
  annual_leave_balance: number;
  sick_leave_entitled: number; // UAE: 90 days per year
  sick_leave_used: number;
  sick_leave_balance: number;
  maternity_leave_entitled: number; // UAE: 60 days
  maternity_leave_used: number;
  maternity_leave_balance: number;
  emergency_leave_used: number;
  unpaid_leave_used: number;
  leave_accrual_rate: number; // Days per month
  carry_forward_days: number;
  max_carry_forward: number;
  balance_as_of: string; // DATE format
  last_updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OvertimeRecord {
  id: string;
  organization_id: string;
  employee_id: string;
  attendance_record_id?: string;
  overtime_date: string; // DATE format
  regular_hours: number;
  overtime_hours: number;
  overtime_rate: number; // UAE: 1.25x regular rate
  overtime_type: 'daily' | 'weekly' | 'holiday' | 'emergency';
  reason: string;
  pre_approved: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  requested_by?: string;
  approved_by?: string;
  approved_at?: string;
  project_code?: string;
  client_billable: boolean;
  overtime_cost_aed?: number;
  manager_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceDevice {
  id: string;
  organization_id: string;
  device_name: string;
  device_type: 'biometric' | 'rfid' | 'mobile_gps' | 'web_portal' | 'manual';
  device_serial?: string;
  device_location?: string;
  device_coordinates?: Record<string, any>; // JSONB for GPS location
  is_active: boolean;
  requires_gps: boolean;
  gps_radius_meters: number;
  allowed_employee_ids?: string[]; // UUID array
  department_restrictions?: string[]; // UUID array
  device_settings?: Record<string, any>; // JSONB for device configuration
  last_sync_at?: string;
  installation_date?: string;
  maintenance_schedule?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceReport {
  id: string;
  organization_id: string;
  report_name: string;
  report_type: 'monthly' | 'weekly' | 'daily' | 'custom' | 'overtime' | 'leave_summary' | 'compliance';
  report_period_start: string; // DATE format
  report_period_end: string; // DATE format
  employee_ids?: string[]; // UUID array
  department_ids?: string[]; // UUID array
  report_data: Record<string, any>; // JSONB for generated report data
  report_summary?: Record<string, any>; // JSONB for summary statistics
  total_employees?: number;
  total_working_days?: number;
  total_attendance_percentage?: number;
  total_overtime_hours?: number;
  total_leave_days?: number;
  uae_compliance_score?: number; // Compliance with UAE labor law
  generated_by?: string;
  generated_at: string;
  report_format: 'json' | 'pdf' | 'excel';
  file_path?: string;
  is_automated: boolean;
  schedule_frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  created_at: string;
  updated_at: string;
}

// =============================================================================
// PAYROLL SYSTEM INTERFACES
// =============================================================================

export interface SalaryStructure {
  id: string;
  organization_id: string;
  structure_name: string;
  structure_code: string;
  job_title: string;
  department_id?: string;
  experience_level: string;
  base_salary_aed: number;
  min_salary_aed: number;
  max_salary_aed: number;
  salary_currency?: string;
  hourly_rate_aed?: number;
  overtime_rate_multiplier?: number;
  commission_eligible?: boolean;
  commission_base_percentage?: number;
  bonus_eligible?: boolean;
  transportation_allowance_aed?: number;
  meal_allowance_aed?: number;
  accommodation_allowance_aed?: number;
  skills_allowance_aed?: number;
  effective_date: string; // DATE format
  expiry_date?: string; // DATE format
  is_active?: boolean;
  annual_review_month?: number;
  grade_level?: number;
  performance_band?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionRate {
  id: string;
  organization_id: string;
  commission_name: string;
  commission_type: string;
  employee_id?: string;
  job_title?: string;
  department_id?: string;
  task_type?: string;
  min_order_value_aed?: number;
  max_order_value_aed?: number;
  commission_percentage: number;
  flat_amount_aed?: number;
  performance_threshold?: number;
  quality_threshold?: number;
  customer_satisfaction_threshold?: number;
  calculation_frequency?: string;
  is_cumulative?: boolean;
  cap_amount_aed?: number;
  effective_date: string; // DATE format
  expiry_date?: string; // DATE format
  is_active?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SalaryCalculation {
  id: string;
  organization_id: string;
  employee_id: string;
  calculation_period_month: number;
  calculation_period_year: number;
  salary_structure_id?: string;
  base_salary_aed: number;
  hourly_rate_aed: number;
  total_work_hours?: number;
  regular_hours?: number;
  overtime_hours?: number;
  overtime_amount_aed?: number;
  commission_amount_aed?: number;
  bonus_amount_aed?: number;
  allowances_amount_aed?: number;
  gross_salary_aed: number;
  deductions_amount_aed?: number;
  tax_amount_aed?: number;
  insurance_deduction_aed?: number;
  advance_deduction_aed?: number;
  leave_deduction_aed?: number;
  other_deductions_aed?: number;
  net_salary_aed: number;
  calculation_status?: string;
  calculation_date?: string;
  approved_by?: string;
  approved_at?: string;
  paid_at?: string;
  payment_reference?: string;
  notes?: string;
  calculation_details?: Record<string, any>; // JSONB for detailed breakdown
  is_final?: boolean;
  adjustment_reason?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OvertimeCalculation {
  id: string;
  organization_id: string;
  employee_id: string;
  salary_calculation_id?: string;
  calculation_period_month: number;
  calculation_period_year: number;
  regular_hourly_rate_aed: number;
  overtime_multiplier?: number; // Default 1.25 for UAE
  overtime_hourly_rate_aed: number;
  total_overtime_hours: number;
  daily_overtime_hours?: number;
  weekly_overtime_hours?: number;
  holiday_overtime_hours?: number;
  emergency_overtime_hours?: number;
  total_overtime_amount_aed: number;
  uae_compliance_check?: boolean;
  max_daily_limit_exceeded?: boolean;
  max_annual_limit_exceeded?: boolean;
  overtime_source_data?: Record<string, any>; // JSONB for attendance integration
  calculation_method?: string;
  is_manual_adjustment?: boolean;
  adjustment_reason?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Allowance {
  id: string;
  organization_id: string;
  employee_id: string;
  salary_calculation_id?: string;
  allowance_type: string;
  allowance_name: string;
  calculation_method?: string;
  base_amount_aed: number;
  calculation_rate?: number;
  eligible_days?: number;
  eligible_hours?: number;
  percentage_base?: number;
  calculated_amount_aed: number;
  is_taxable?: boolean;
  is_recurring?: boolean;
  effective_date: string; // DATE format
  expiry_date?: string; // DATE format
  calculation_period_month: number;
  calculation_period_year: number;
  approval_required?: boolean;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  supporting_documents?: Record<string, any>; // JSONB for document metadata
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Deduction {
  id: string;
  organization_id: string;
  employee_id: string;
  salary_calculation_id?: string;
  deduction_type: string;
  deduction_name: string;
  calculation_method?: string;
  base_amount_aed?: number;
  deduction_rate?: number;
  calculated_amount_aed: number;
  is_mandatory?: boolean;
  is_statutory?: boolean;
  deduction_period_start?: string; // DATE format
  deduction_period_end?: string; // DATE format
  calculation_period_month: number;
  calculation_period_year: number;
  remaining_amount_aed?: number;
  installment_number?: number;
  total_installments?: number;
  uae_compliance_verified?: boolean;
  approval_required?: boolean;
  approved_by?: string;
  approved_at?: string;
  reference_number?: string;
  notes?: string;
  supporting_documents?: Record<string, any>; // JSONB for document metadata
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BonusRecord {
  id: string;
  organization_id: string;
  employee_id: string;
  salary_calculation_id?: string;
  bonus_type: string;
  bonus_name: string;
  calculation_method?: string;
  base_amount_aed?: number;
  bonus_percentage?: number;
  target_value?: number;
  actual_value?: number;
  achievement_percentage?: number;
  calculated_amount_aed: number;
  performance_period_start?: string; // DATE format
  performance_period_end?: string; // DATE format
  calculation_period_month: number;
  calculation_period_year: number;
  eligibility_criteria?: Record<string, any>; // JSONB for bonus criteria
  performance_metrics?: Record<string, any>; // JSONB for performance data
  is_taxable?: boolean;
  is_recurring?: boolean;
  approval_level?: number;
  approved_by?: string;
  approved_at?: string;
  payout_date?: string; // DATE format
  is_paid?: boolean;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SalaryReport {
  id: string;
  organization_id: string;
  report_name: string;
  report_type: string;
  report_period_month: number;
  report_period_year: number;
  employee_ids?: string[]; // UUID array
  department_ids?: string[]; // UUID array
  report_data: Record<string, any>; // JSONB for generated report data
  summary_statistics?: Record<string, any>; // JSONB for summary data
  total_employees?: number;
  total_gross_salary_aed?: number;
  total_net_salary_aed?: number;
  total_deductions_aed?: number;
  total_overtime_aed?: number;
  total_commissions_aed?: number;
  total_bonuses_aed?: number;
  uae_compliance_score?: number;
  generated_by?: string;
  generated_at?: string;
  report_format?: string;
  file_path?: string;
  is_confidential?: boolean;
  access_level?: number;
  retention_period_months?: number;
  is_automated?: boolean;
  schedule_frequency?: string;
  next_generation_date?: string; // DATE format
  created_at: string;
  updated_at: string;
}
