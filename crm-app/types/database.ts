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

// =============================================================================
// PAYROLL PROCESSING SYSTEM INTERFACES
// =============================================================================

export interface PayrollRun {
  id: string;
  organization_id: string;
  run_name: string;
  run_period_month: number;
  run_period_year: number;
  run_type?: string;
  processing_status?: string;
  total_employees?: number;
  processed_employees?: number;
  failed_employees?: number;
  total_gross_amount_aed?: number;
  total_net_amount_aed?: number;
  total_deductions_aed?: number;
  total_taxes_aed?: number;
  total_bonuses_aed?: number;
  total_commissions_aed?: number;
  total_overtime_aed?: number;
  uae_compliance_verified?: boolean;
  wps_file_generated?: boolean;
  bank_transfer_ready?: boolean;
  calculation_started_at?: string;
  calculation_completed_at?: string;
  approved_at?: string;
  approved_by?: string;
  processed_at?: string;
  processed_by?: string;
  include_bonuses?: boolean;
  include_commissions?: boolean;
  include_overtime?: boolean;
  auto_approve?: boolean;
  notes?: string;
  processing_logs?: Record<string, any>; // JSONB for logs
  error_details?: Record<string, any>; // JSONB for error details
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollItem {
  id: string;
  organization_id: string;
  payroll_run_id: string;
  employee_id: string;
  salary_calculation_id?: string;
  employee_number?: string;
  employee_name: string;
  job_title?: string;
  department_name?: string;
  bank_account_number?: string;
  bank_name?: string;
  bank_iban?: string;
  base_salary_aed: number;
  overtime_amount_aed?: number;
  commission_amount_aed?: number;
  bonus_amount_aed?: number;
  allowances_amount_aed?: number;
  gross_salary_aed: number;
  tax_deduction_aed?: number;
  insurance_deduction_aed?: number;
  advance_deduction_aed?: number;
  leave_deduction_aed?: number;
  other_deductions_aed?: number;
  total_deductions_aed?: number;
  net_salary_aed: number;
  item_status?: string;
  processing_order?: number;
  total_work_hours?: number;
  overtime_hours?: number;
  leave_days_taken?: number;
  minimum_wage_compliance?: boolean;
  overtime_limit_compliance?: boolean;
  working_hours_compliance?: boolean;
  payment_method?: string;
  payment_reference?: string;
  payment_date?: string;
  payment_status?: string;
  calculation_breakdown?: Record<string, any>; // JSONB for calculation details
  error_messages?: string[];
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EndOfService {
  id: string;
  organization_id: string;
  employee_id: string;
  employee_name: string;
  employee_number?: string;
  job_title?: string;
  hire_date: string; // DATE format
  termination_date: string; // DATE format
  termination_reason?: string;
  termination_type?: string;
  total_service_years: number;
  total_service_months: number;
  total_service_days: number;
  last_basic_salary_aed: number;
  average_salary_last_6_months_aed?: number;
  daily_salary_rate_aed: number;
  gratuity_years_full?: number;
  gratuity_months_partial?: number;
  gratuity_days_calculation: number;
  gratuity_amount_aed: number;
  unused_annual_leave_days?: number;
  leave_compensation_aed?: number;
  notice_period_required_days?: number;
  notice_period_paid_days?: number;
  notice_period_amount_aed?: number;
  overtime_pending_aed?: number;
  bonus_pending_aed?: number;
  commission_pending_aed?: number;
  allowances_pending_aed?: number;
  advance_recovery_aed?: number;
  loan_recovery_aed?: number;
  insurance_deduction_aed?: number;
  equipment_charges_aed?: number;
  other_deductions_aed?: number;
  total_deductions_aed?: number;
  gross_settlement_aed: number;
  net_settlement_aed: number;
  calculation_status?: string;
  approval_level?: number;
  uae_labor_law_compliance?: boolean;
  ministry_notification_required?: boolean;
  ministry_notification_sent?: boolean;
  payment_method?: string;
  payment_reference?: string;
  payment_date?: string;
  calculation_details?: Record<string, any>; // JSONB for calculation breakdown
  supporting_documents?: Record<string, any>; // JSONB for document metadata
  legal_requirements?: string;
  notes?: string;
  calculated_by?: string;
  calculated_at?: string;
  approved_by?: string;
  approved_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BankTransfer {
  id: string;
  organization_id: string;
  payroll_run_id?: string;
  transfer_batch_id: string;
  transfer_type?: string;
  transfer_date: string; // DATE format
  value_date?: string; // DATE format
  total_amount_aed: number;
  total_employees: number;
  successful_transfers?: number;
  failed_transfers?: number;
  pending_transfers?: number;
  originating_bank?: string;
  originating_account?: string;
  processing_bank?: string;
  wps_file_generated?: boolean;
  wps_file_path?: string;
  wps_reference_number?: string;
  wps_submission_status?: string;
  wps_submission_date?: string;
  transfer_status?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  central_bank_reference?: string;
  central_bank_status?: string;
  central_bank_response?: Record<string, any>; // JSONB for bank response
  failed_employee_ids?: string[]; // UUID array
  error_summary?: Record<string, any>; // JSONB for error details
  retry_count?: number;
  max_retries?: number;
  bank_confirmation_received?: boolean;
  bank_confirmation_date?: string;
  bank_reference_number?: string;
  reconciliation_status?: string;
  compliance_check_passed?: boolean;
  audit_trail?: Record<string, any>; // JSONB for audit logs
  regulatory_notifications?: Record<string, any>; // JSONB for regulatory data
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TaxReport {
  id: string;
  organization_id: string;
  report_name: string;
  report_type: string;
  report_period_start: string; // DATE format
  report_period_end: string; // DATE format
  tax_year: number;
  tax_quarter?: number;
  tax_month?: number;
  total_gross_payroll_aed?: number;
  total_basic_salary_aed?: number;
  total_allowances_aed?: number;
  total_overtime_aed?: number;
  total_bonuses_aed?: number;
  total_commissions_aed?: number;
  total_income_tax_aed?: number;
  total_social_security_aed?: number;
  total_pension_contributions_aed?: number;
  total_health_insurance_aed?: number;
  total_employees?: number;
  uae_nationals?: number;
  expatriate_employees?: number;
  new_hires?: number;
  terminations?: number;
  working_hours_compliance_rate?: number;
  overtime_compliance_rate?: number;
  minimum_wage_compliance_rate?: number;
  leave_compliance_rate?: number;
  wps_submission_count?: number;
  wps_success_rate?: number;
  wps_penalty_amount_aed?: number;
  detailed_calculations?: Record<string, any>; // JSONB for calculations
  employee_breakdown?: Record<string, any>; // JSONB for employee data
  compliance_details?: Record<string, any>; // JSONB for compliance info
  regulatory_requirements?: Record<string, any>; // JSONB for regulatory data
  report_status?: string;
  generation_method?: string;
  submitted_to?: string;
  submission_reference?: string;
  submission_date?: string;
  submission_deadline?: string; // DATE format
  report_file_path?: string;
  report_format?: string;
  file_size_bytes?: number;
  validation_passed?: boolean;
  validation_errors?: string[];
  compliance_score?: number;
  generated_by?: string;
  generated_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollApproval {
  id: string;
  organization_id: string;
  approval_type: string;
  reference_id: string;
  reference_table: string;
  approval_level?: number;
  approval_step: string;
  required_approval_count?: number;
  current_approval_count?: number;
  approval_status?: string;
  is_final_approval?: boolean;
  requested_by: string;
  requested_at?: string;
  assigned_to: string[]; // UUID array
  department_approvers?: string[]; // UUID array
  role_approvers?: string[];
  amount_aed?: number;
  approval_threshold_aed?: number;
  requires_ceo_approval?: boolean;
  requires_hr_approval?: boolean;
  requires_finance_approval?: boolean;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  approval_notes?: string;
  approval_deadline?: string;
  escalation_level?: number;
  escalated_to?: string;
  escalated_at?: string;
  notification_sent?: boolean;
  reminder_count?: number;
  last_reminder_sent?: string;
  approval_criteria?: Record<string, any>; // JSONB for criteria
  approval_documents?: Record<string, any>; // JSONB for documents
  system_generated?: boolean;
  uae_compliance_check?: boolean;
  ministry_approval_required?: boolean;
  legal_review_required?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollAudit {
  id: string;
  organization_id: string;
  audit_type: string;
  audit_scope: string;
  audit_title: string;
  audit_description?: string;
  audit_period_start: string; // DATE format
  audit_period_end: string; // DATE format
  payroll_run_ids?: string[]; // UUID array
  employee_ids?: string[]; // UUID array
  department_ids?: string[]; // UUID array
  process_areas?: string[];
  audit_status?: string;
  priority_level?: string;
  lead_auditor?: string;
  audit_team?: string[]; // UUID array
  external_auditor_firm?: string;
  external_auditor_contact?: Record<string, any>; // JSONB for contact details
  total_findings?: number;
  critical_findings?: number;
  high_findings?: number;
  medium_findings?: number;
  low_findings?: number;
  financial_discrepancies_aed?: number;
  overpayments_identified_aed?: number;
  underpayments_identified_aed?: number;
  compliance_score?: number;
  uae_labor_law_compliance?: boolean;
  wps_compliance?: boolean;
  tax_compliance?: boolean;
  evidence_collected?: Record<string, any>; // JSONB for evidence
  documents_reviewed?: Record<string, any>; // JSONB for documents
  interviews_conducted?: Record<string, any>; // JSONB for interviews
  system_tests?: Record<string, any>; // JSONB for tests
  audit_findings?: Record<string, any>; // JSONB for findings
  recommendations?: Record<string, any>; // JSONB for recommendations
  management_responses?: Record<string, any>; // JSONB for responses
  corrective_actions?: Record<string, any>; // JSONB for actions
  follow_up_required?: boolean;
  follow_up_date?: string; // DATE format
  follow_up_responsible?: string;
  implementation_deadline?: string; // DATE format
  regulatory_body?: string;
  regulatory_reference?: string;
  regulatory_deadline?: string; // DATE format
  regulatory_submission_required?: boolean;
  draft_report_date?: string; // DATE format
  final_report_date?: string; // DATE format
  report_file_path?: string;
  executive_summary?: string;
  management_sign_off?: boolean;
  management_sign_off_by?: string;
  management_sign_off_date?: string;
  external_sign_off?: boolean;
  external_sign_off_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeStatement {
  id: string;
  organization_id: string;
  employee_id: string;
  statement_type: string;
  statement_period_start: string; // DATE format
  statement_period_end: string; // DATE format
  statement_year: number;
  statement_month?: number;
  employee_number?: string;
  employee_name: string;
  employee_name_arabic?: string;
  job_title?: string;
  department_name?: string;
  emirates_id?: string;
  basic_salary_aed?: number;
  overtime_earnings_aed?: number;
  commission_earnings_aed?: number;
  bonus_earnings_aed?: number;
  allowances_total_aed?: number;
  gross_earnings_aed?: number;
  income_tax_aed?: number;
  social_security_aed?: number;
  health_insurance_aed?: number;
  advance_deductions_aed?: number;
  loan_deductions_aed?: number;
  other_deductions_aed?: number;
  total_deductions_aed?: number;
  net_pay_aed?: number;
  ytd_gross_earnings_aed?: number;
  ytd_total_deductions_aed?: number;
  ytd_net_pay_aed?: number;
  ytd_tax_paid_aed?: number;
  days_worked?: number;
  overtime_hours?: number;
  leave_days_taken?: number;
  leave_balance_remaining?: number;
  transportation_allowance_aed?: number;
  meal_allowance_aed?: number;
  accommodation_allowance_aed?: number;
  skills_allowance_aed?: number;
  bank_name?: string;
  bank_account_number?: string;
  iban?: string;
  transfer_reference?: string;
  transfer_date?: string; // DATE format
  statement_status?: string;
  generation_method?: string;
  statement_file_path?: string;
  statement_format?: string;
  file_size_bytes?: number;
  is_encrypted?: boolean;
  distributed_via?: string;
  distribution_date?: string;
  employee_acknowledged?: boolean;
  acknowledgment_date?: string;
  acknowledgment_ip_address?: string;
  primary_language?: string;
  include_arabic?: boolean;
  currency_format?: string;
  uae_compliant?: boolean;
  includes_legal_notices?: boolean;
  privacy_consent?: boolean;
  data_retention_period_months?: number;
  detailed_calculations?: Record<string, any>; // JSONB for calculations
  allowances_breakdown?: Record<string, any>; // JSONB for allowances
  deductions_breakdown?: Record<string, any>; // JSONB for deductions
  attendance_details?: Record<string, any>; // JSONB for attendance
  is_correction?: boolean;
  original_statement_id?: string;
  correction_reason?: string;
  correction_approved_by?: string;
  access_level?: string;
  viewing_restrictions?: Record<string, any>; // JSONB for access restrictions
  generated_by?: string;
  generated_at?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

// ======================================
// PAYSLIP GENERATION SYSTEM INTERFACES
// 6 comprehensive interfaces for UAE-compliant payslip management
// ======================================

export interface Payslip {
  id: string;
  organization_id: string;
  employee_id: string;
  payroll_run_id: string;
  
  // Payslip identification
  payslip_number: string;
  payslip_reference?: string;
  
  // Period information
  pay_period_start: string; // Date
  pay_period_end: string; // Date
  issue_date: string; // Date
  
  // Salary breakdown (in AED)
  base_salary_aed: number;
  commission_amount_aed?: number;
  bonus_amount_aed?: number;
  allowances_aed?: number;
  overtime_amount_aed?: number;
  gross_salary_aed: number;
  
  // Deductions
  income_tax_aed?: number;
  social_security_aed?: number;
  insurance_aed?: number;
  advance_deduction_aed?: number;
  other_deductions_aed?: number;
  total_deductions_aed: number;
  
  // Final amounts
  net_salary_aed: number;
  
  // PDF and template information
  template_id?: string;
  pdf_storage_path?: string;
  pdf_file_size?: number;
  pdf_generated_at?: string;
  
  // Digital signature
  digital_signature_id?: string;
  is_digitally_signed?: boolean;
  signature_timestamp?: string;
  
  // UAE compliance
  emirates_id?: string;
  visa_number?: string;
  bank_account_number?: string;
  bank_name?: string;
  
  // Status and validation
  generation_status?: 'draft' | 'generated' | 'signed' | 'distributed' | 'archived';
  validation_status?: 'pending' | 'validated' | 'error' | 'compliance_verified';
  compliance_verified?: boolean;
  
  // Metadata
  generated_by?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface PayslipTemplate {
  id: string;
  organization_id: string;
  
  // Template identification
  template_name: string;
  template_code: string;
  template_type?: 'standard' | 'premium' | 'government_compliant' | 'executive' | 'contractor';
  
  // Template configuration
  template_version?: string;
  template_description?: string;
  
  // Design settings
  logo_url?: string;
  company_header_text?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  font_size?: number;
  
  // Layout configuration
  layout_style?: 'professional' | 'modern' | 'classic' | 'minimal' | 'government';
  include_logo?: boolean;
  include_company_address?: boolean;
  include_employee_photo?: boolean;
  include_qr_code?: boolean;
  include_signature_line?: boolean;
  
  // Content settings
  show_detailed_breakdown?: boolean;
  show_year_to_date?: boolean;
  show_leave_balance?: boolean;
  show_tax_details?: boolean;
  show_bank_details?: boolean;
  
  // UAE compliance settings
  uae_ministry_compliant?: boolean;
  include_arabic_translation?: boolean;
  include_emirates_id?: boolean;
  include_visa_details?: boolean;
  include_wps_reference?: boolean;
  
  // Usage and status
  is_active?: boolean;
  is_default?: boolean;
  usage_count?: number;
  last_used_at?: string;
  
  // Approval and validation
  approved_by?: string;
  approved_at?: string;
  approval_status?: 'pending' | 'approved' | 'rejected' | 'under_review';
  
  // Metadata
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DigitalSignature {
  id: string;
  organization_id: string;
  
  // Signature identification
  signature_reference: string;
  signature_type?: 'payslip' | 'contract' | 'approval' | 'compliance';
  
  // Payslip association
  payslip_id?: string;
  employee_id: string;
  
  // Signer information
  signer_name: string;
  signer_title?: string;
  signer_employee_id?: string;
  signer_email?: string;
  
  // Signature data
  signature_hash: string;
  signature_algorithm?: string;
  certificate_serial?: string;
  certificate_issuer?: string;
  
  // Verification data
  verification_code: string;
  verification_url?: string;
  verification_method?: 'digital_certificate' | 'biometric' | 'two_factor' | 'government_id';
  
  // Timestamps and validity
  signed_at: string;
  valid_from: string;
  valid_until?: string;
  is_valid?: boolean;
  
  // Compliance and audit
  signature_purpose: string;
  legal_framework?: string;
  compliance_level?: 'basic' | 'standard' | 'high' | 'government_grade';
  audit_trail?: Record<string, any>; // JSONB
  
  // Status
  signature_status?: 'active' | 'expired' | 'revoked' | 'suspended';
  revocation_reason?: string;
  revoked_at?: string;
  revoked_by?: string;
  
  // Metadata
  ip_address?: string;
  user_agent?: string;
  device_fingerprint?: string;
  geo_location?: Record<string, any>; // JSONB
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface PayslipDistribution {
  id: string;
  organization_id: string;
  
  // Distribution identification
  distribution_reference: string;
  distribution_batch_id?: string;
  
  // Payslip and employee association
  payslip_id: string;
  employee_id: string;
  
  // Distribution method
  distribution_method: 'email' | 'sms' | 'whatsapp' | 'portal_notification' | 'physical_delivery';
  
  // Recipient information
  recipient_email?: string;
  recipient_phone?: string;
  recipient_whatsapp?: string;
  recipient_name: string;
  
  // Distribution content
  subject_line?: string;
  message_content?: string;
  attachment_size?: number;
  attachment_type?: string;
  
  // Delivery tracking
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  downloaded_at?: string;
  
  // Status tracking
  distribution_status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'downloaded';
  delivery_attempts?: number;
  max_delivery_attempts?: number;
  
  // Error handling
  error_message?: string;
  error_code?: string;
  last_error_at?: string;
  
  // Provider information
  service_provider?: string;
  provider_message_id?: string;
  provider_status?: string;
  provider_response?: Record<string, any>; // JSONB
  
  // Security and compliance
  is_secure_delivery?: boolean;
  encryption_method?: string;
  access_code?: string;
  expires_at?: string;
  
  // Employee interaction
  employee_accessed_at?: string;
  access_count?: number;
  access_ip_addresses?: Record<string, any>; // JSONB
  last_access_device?: string;
  
  // Retry and scheduling
  next_retry_at?: string;
  scheduled_for?: string;
  priority_level?: 'low' | 'normal' | 'high' | 'urgent';
  
  // Metadata
  initiated_by: string;
  notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EmployeeAccessLog {
  id: string;
  organization_id: string;
  
  // Employee and session information
  employee_id: string;
  session_id?: string;
  
  // Access details
  access_type: 'login' | 'logout' | 'payslip_view' | 'payslip_download' | 'password_change' | 'profile_update';
  accessed_resource?: string;
  payslip_id?: string;
  
  // Authentication information
  authentication_method?: 'password' | 'two_factor' | 'biometric' | 'sso' | 'oauth';
  login_successful?: boolean;
  failure_reason?: string;
  
  // Device and location information
  ip_address: string;
  user_agent?: string;
  device_type?: string;
  operating_system?: string;
  browser_name?: string;
  browser_version?: string;
  
  // Geographic information
  country_code?: string;
  city?: string;
  geo_location?: Record<string, any>; // JSONB
  timezone?: string;
  
  // Security analysis
  is_suspicious_activity?: boolean;
  risk_score?: number;
  security_flags?: Record<string, any>; // JSONB
  vpn_detected?: boolean;
  proxy_detected?: boolean;
  
  // Session duration and activity
  session_duration?: number; // in seconds
  pages_visited?: number;
  actions_performed?: number;
  session_end_reason?: 'logout' | 'timeout' | 'forced_logout' | 'system_maintenance';
  
  // Compliance and audit
  compliance_purpose?: string;
  data_accessed?: Record<string, any>; // JSONB
  data_downloaded?: Record<string, any>; // JSONB
  retention_period_days?: number;
  
  // Timestamps
  access_timestamp: string;
  session_start_time?: string;
  session_end_time?: string;
  created_at: string;
}

export interface PayslipArchive {
  id: string;
  organization_id: string;
  
  // Archive identification
  archive_reference: string;
  archive_batch_id?: string;
  
  // Original payslip information
  original_payslip_id: string;
  employee_id: string;
  
  // Archive timing
  pay_period_year: number;
  pay_period_month: number;
  archived_date: string; // Date
  
  // Storage information
  storage_location: string;
  storage_type?: 'cloud' | 'local' | 'hybrid' | 'external';
  storage_provider?: string;
  storage_region?: string;
  
  // File information
  archived_file_path: string;
  archived_file_size: number;
  file_format?: string;
  compression_method?: string;
  encrypted?: boolean;
  encryption_method?: string;
  
  // Checksums and integrity
  file_checksum: string;
  checksum_algorithm?: string;
  integrity_verified?: boolean;
  last_integrity_check?: string;
  
  // Legal and compliance
  retention_period_years?: number;
  legal_hold?: boolean;
  legal_hold_reason?: string;
  legal_hold_until?: string; // Date
  disposal_eligible_date: string; // Date
  disposal_status?: 'retained' | 'scheduled_disposal' | 'disposed' | 'permanent_retention';
  
  // Access control
  access_level?: 'public' | 'internal' | 'restricted' | 'confidential';
  authorized_roles?: Record<string, any>; // JSONB
  access_log_required?: boolean;
  
  // Migration and recovery
  migration_status?: 'archived' | 'migrating' | 'restored' | 'corrupted';
  backup_locations?: Record<string, any>; // JSONB
  recovery_point_objective?: number; // hours
  last_backup_timestamp?: string;
  
  // Metadata and search
  search_metadata?: Record<string, any>; // JSONB
  tags?: Record<string, any>; // JSONB
  employee_name: string;
  employee_emirates_id?: string;
  department_name?: string;
  
  // Audit trail
  archived_by: string;
  archive_reason?: string;
  archive_method?: string;
  verified_by?: string;
  verified_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}
