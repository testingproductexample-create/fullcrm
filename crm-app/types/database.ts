// Database Types

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  role: 'owner' | 'manager' | 'tailor' | 'assistant';
  phone: string | null;
  avatar_url: string | null;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  business_type: string;
  country: string;
  currency: string;
  primary_language: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  organization_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  notes: string | null;
  customer_type: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  organization_id: string;
  customer_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  payment_terms: string;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  subtotal_aed: number;
  vat_rate: number;
  vat_amount_aed: number;
  total_amount_aed: number;
  paid_amount_aed: number;
  balance_due_aed: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_aed: number;
  subtotal_aed: number;
  vat_amount_aed: number;
  total_aed: number;
  sort_order: number;
  created_at: string;
}

export interface Payment {
  id: string;
  organization_id: string;
  invoice_id: string;
  amount_aed: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'online';
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

// Advanced Financial Features & Compliance Types

export interface VATReport {
  id: string;
  organization_id: string;
  report_period: string;
  total_sales_aed: number;
  total_vat_collected_aed: number;
  total_purchases_aed: number;
  total_vat_paid_aed: number;
  net_vat_due_aed: number;
  submission_status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submission_date: string | null;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface AuditTrail {
  id: string;
  organization_id: string;
  table_name: string;
  record_id: string;
  action_type: 'insert' | 'update' | 'delete';
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  user_id: string | null;
  timestamp: string;
  description: string | null;
}

export interface BankReconciliation {
  id: string;
  organization_id: string;
  bank_account: string;
  statement_date: string;
  opening_balance_aed: number;
  closing_balance_aed: number;
  transactions_count: number;
  reconciled_amount_aed: number;
  differences_aed: number;
  status: 'pending' | 'reconciled' | 'disputed';
  created_at: string;
  updated_at: string;
}

export interface ComplianceCalendar {
  id: string;
  organization_id: string;
  compliance_type: string;
  requirement_name: string;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue' | 'exempted';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialRiskAssessment {
  id: string;
  organization_id: string;
  assessment_date: string;
  risk_type: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation_plan: string | null;
  status: 'active' | 'mitigated' | 'monitoring' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface RegulatoryReport {
  id: string;
  organization_id: string;
  report_type: string;
  report_period: string;
  submission_status: 'pending' | 'submitted' | 'approved' | 'rejected';
  due_date: string;
  submitted_date: string | null;
  report_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialForecasting {
  id: string;
  organization_id: string;
  forecast_type: string;
  forecast_period: string;
  revenue_projection_aed: number;
  expense_projection_aed: number;
  confidence_level: number;
  assumptions: string | null;
  created_at: string;
  updated_at: string;
}

// Communication System Types

export interface CommunicationChannel {
  id: string;
  organization_id: string;
  channel_type: string;
  provider_name: string;
  api_config: Record<string, any>;
  is_active: boolean | null;
  rate_limits: Record<string, any> | null;
  compliance_status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MessageTemplate {
  id: string;
  organization_id: string;
  template_name: string;
  template_type: string;
  language: string | null;
  subject: string | null;
  content: string;
  variables: string[] | null;
  is_active: boolean | null;
  category: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CustomerCommunication {
  id: string;
  organization_id: string;
  customer_id: string;
  channel_type: string;
  message_type: string;
  subject: string | null;
  content: string;
  status: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  error_message: string | null;
  external_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string | null;
}

export interface AutomatedNotification {
  id: string;
  organization_id: string;
  trigger_type: string;
  trigger_conditions: Record<string, any>;
  template_id: string;
  channel_type: string;
  schedule_type: string | null;
  schedule_delay: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ChatSession {
  id: string;
  organization_id: string;
  customer_id: string;
  employee_id: string | null;
  status: string;
  priority: string | null;
  tags: string[] | null;
  started_at: string | null;
  ended_at: string | null;
  satisfaction_rating: number | null;
  satisfaction_feedback: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: string;
  sender_id: string | null;
  message_content: string;
  message_type: string | null;
  attachment_url: string | null;
  timestamp: string | null;
  read_status: boolean | null;
  edited_at: string | null;
  metadata: Record<string, any> | null;
}

export interface VideoConsultation {
  id: string;
  organization_id: string;
  customer_id: string;
  employee_id: string | null;
  appointment_id: string | null;
  consultation_type: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  status: string | null;
  meeting_link: string | null;
  meeting_id: string | null;
  recording_url: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CommunicationPreference {
  id: string;
  customer_id: string;
  preferred_channels: Record<string, any> | null;
  notification_settings: Record<string, any> | null;
  language_preference: string | null;
  timezone: string | null;
  opt_out_categories: string[] | null;
  marketing_consent: boolean | null;
  sms_consent: boolean | null;
  whatsapp_consent: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BulkMessaging {
  id: string;
  organization_id: string;
  campaign_name: string;
  target_criteria: Record<string, any>;
  message_template_id: string | null;
  channel_type: string;
  scheduled_at: string | null;
  status: string | null;
  total_recipients: number | null;
  sent_count: number | null;
  delivered_count: number | null;
  failed_count: number | null;
  opt_out_count: number | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CommunicationAnalytics {
  id: string;
  organization_id: string;
  date: string;
  channel_type: string;
  message_type: string | null;
  messages_sent: number | null;
  messages_delivered: number | null;
  messages_read: number | null;
  messages_failed: number | null;
  response_rate: number | null;
  average_response_time: number | null;
  satisfaction_score: number | null;
  created_at: string | null;
}

// Payroll System Types

export interface SalaryStructure {
  id: string;
  organization_id: string;
  structure_name: string;
  structure_code: string;
  job_title: string;
  department_id: string | null;
  experience_level: string;
  base_salary_aed: number;
  min_salary_aed: number;
  max_salary_aed: number;
  salary_currency: string;
  hourly_rate_aed: number | null;
  overtime_rate_multiplier: number;
  commission_eligible: boolean;
  commission_base_percentage: number;
  bonus_eligible: boolean;
  transportation_allowance_aed: number;
  meal_allowance_aed: number;
  accommodation_allowance_aed: number;
  skills_allowance_aed: number;
  effective_date: string;
  expiry_date: string | null;
  is_active: boolean;
  annual_review_month: number;
  grade_level: number;
  performance_band: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalaryCalculation {
  id: string;
  organization_id: string;
  employee_id: string;
  calculation_period_month: number;
  calculation_period_year: number;
  salary_structure_id: string | null;
  base_salary_aed: number;
  hourly_rate_aed: number;
  total_work_hours: number | null;
  regular_hours: number | null;
  overtime_hours: number | null;
  overtime_amount_aed: number | null;
  commission_amount_aed: number | null;
  bonus_amount_aed: number | null;
  allowances_amount_aed: number | null;
  gross_salary_aed: number;
  deductions_amount_aed: number | null;
  tax_amount_aed: number | null;
  insurance_deduction_aed: number | null;
  advance_deduction_aed: number | null;
  leave_deduction_aed: number | null;
  other_deductions_aed: number | null;
  net_salary_aed: number;
  calculation_status: string | null;
  calculation_date: string | null;
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  notes: string | null;
  calculation_details: Record<string, any> | null;
  is_final: boolean | null;
  adjustment_reason: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CommissionRate {
  id: string;
  organization_id: string;
  employee_id: string | null;
  job_title: string | null;
  commission_type: string;
  base_percentage: number;
  tier_structure: Record<string, any> | null;
  performance_multiplier: number;
  minimum_threshold: number | null;
  maximum_cap: number | null;
  effective_date: string;
  expiry_date: string | null;
  is_active: boolean;
  applies_to_orders: boolean;
  applies_to_tasks: boolean;
  quality_bonus_percentage: number | null;
  customer_satisfaction_bonus: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface OvertimeCalculation {
  id: string;
  organization_id: string;
  employee_id: string;
  calculation_period_month: number;
  calculation_period_year: number;
  regular_hours: number;
  overtime_hours: number;
  holiday_hours: number | null;
  weekend_hours: number | null;
  regular_rate_aed: number;
  overtime_rate_aed: number;
  holiday_rate_aed: number | null;
  total_overtime_amount_aed: number;
  overtime_type: string;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Allowance {
  id: string;
  organization_id: string;
  employee_id: string;
  allowance_type: string;
  allowance_name: string;
  amount_aed: number;
  frequency: string;
  effective_date: string;
  expiry_date: string | null;
  is_active: boolean;
  is_taxable: boolean;
  eligibility_criteria: Record<string, any> | null;
  notes: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Deduction {
  id: string;
  organization_id: string;
  employee_id: string;
  deduction_type: string;
  deduction_name: string;
  amount_aed: number;
  percentage: number | null;
  frequency: string;
  effective_date: string;
  expiry_date: string | null;
  is_active: boolean;
  is_statutory: boolean;
  maximum_amount_aed: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BonusRecord {
  id: string;
  organization_id: string;
  employee_id: string;
  bonus_type: string;
  bonus_name: string;
  amount_aed: number;
  bonus_period_month: number | null;
  bonus_period_year: number | null;
  performance_rating: string | null;
  achievement_metric: string | null;
  achievement_value: number | null;
  payout_date: string | null;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SalaryReport {
  id: string;
  organization_id: string;
  report_type: string;
  report_name: string;
  report_period_month: number | null;
  report_period_year: number | null;
  total_employees: number | null;
  total_gross_salary_aed: number | null;
  total_net_salary_aed: number | null;
  total_deductions_aed: number | null;
  total_overtime_aed: number | null;
  total_bonuses_aed: number | null;
  total_commissions_aed: number | null;
  report_data: Record<string, any> | null;
  generated_by: string | null;
  generated_at: string | null;
  created_at: string | null;
}


// Advanced Calendar & Multi-Location Management Types

export interface BusinessLocation {
  id: string;
  organization_id: string;
  location_code: string;
  location_name: string;
  location_type: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  emirate: string | null;
  country: string;
  postal_code: string | null;
  phone_number: string | null;
  email: string | null;
  manager_id: string | null;
  timezone: string;
  operating_hours: Record<string, any>;
  prayer_breaks_enabled: boolean;
  prayer_break_duration: number;
  max_concurrent_appointments: number;
  total_staff_count: number;
  total_resources_count: number;
  is_active: boolean;
  is_primary: boolean;
  amenities: string[] | null;
  specializations: string[] | null;
  parking_available: boolean;
  wheelchair_accessible: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffSkill {
  id: string;
  organization_id: string;
  staff_id: string;
  skill_name: string;
  skill_category: string | null;
  proficiency_level: string;
  is_certified: boolean;
  certification_date: string | null;
  certification_expiry: string | null;
  certification_number: string | null;
  years_of_experience: number;
  applicable_service_types: string[] | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffAvailability {
  id: string;
  organization_id: string;
  staff_id: string;
  location_id: string | null;
  availability_date: string;
  start_time: string;
  end_time: string;
  availability_type: string;
  status: string;
  is_recurring: boolean;
  recurrence_pattern: Record<string, any> | null;
  break_times: Record<string, any>;
  max_concurrent_appointments: number;
  current_bookings_count: number;
  is_override: boolean;
  override_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExternalCalendarConnection {
  id: string;
  organization_id: string;
  user_id: string;
  provider: string;
  calendar_id: string | null;
  calendar_name: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  sync_direction: string;
  sync_enabled: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  sync_errors_count: number;
  sync_settings: Record<string, any>;
  appointment_type_mappings: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExternalCalendarEvent {
  id: string;
  connection_id: string;
  organization_id: string;
  external_event_id: string;
  event_title: string | null;
  event_description: string | null;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  external_location: string | null;
  appointment_id: string | null;
  mapping_status: string;
  sync_status: string;
  last_synced_at: string;
  has_conflict: boolean;
  conflict_details: Record<string, any> | null;
  event_metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentConflict {
  id: string;
  organization_id: string;
  appointment_id_1: string;
  appointment_id_2: string | null;
  external_event_id: string | null;
  conflict_type: string;
  conflict_severity: string;
  conflict_description: string | null;
  conflict_data: Record<string, any> | null;
  conflicting_staff_ids: string[] | null;
  conflicting_resource_ids: string[] | null;
  resolution_status: string;
  resolution_action: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  auto_resolution_attempted: boolean;
  auto_resolution_suggestion: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceUtilizationLog {
  id: string;
  organization_id: string;
  location_id: string | null;
  resource_id: string | null;
  resource_type: string | null;
  log_date: string;
  hour_of_day: number | null;
  total_capacity_minutes: number;
  utilized_minutes: number;
  available_minutes: number;
  maintenance_minutes: number;
  utilization_percentage: number;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  no_show_bookings: number;
  revenue_generated_aed: number;
  created_at: string;
}

export interface StaffUtilizationLog {
  id: string;
  organization_id: string;
  location_id: string | null;
  staff_id: string;
  log_date: string;
  scheduled_work_minutes: number;
  actual_work_minutes: number;
  break_minutes: number;
  idle_minutes: number;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  utilization_percentage: number;
  average_appointment_duration: number;
  customer_satisfaction_avg: number | null;
  revenue_generated_aed: number;
  created_at: string;
}


// =======================================================================================
// DOCUMENT MANAGEMENT SYSTEM TYPES
// =======================================================================================

export interface DocumentCategory {
  id: string;
  organization_id: string;
  category_code: string;
  category_name: string;
  parent_category_id: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  retention_period_years: number;
  is_system_category: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Document {
  id: string;
  organization_id: string;
  document_number: string;
  title: string;
  description: string | null;
  category_id: string | null;
  document_type: string;
  file_name: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  storage_path: string;
  storage_bucket: string;
  file_hash: string | null;
  version_number: number;
  is_latest_version: boolean;
  parent_document_id: string | null;
  customer_id: string | null;
  employee_id: string | null;
  order_id: string | null;
  appointment_id: string | null;
  invoice_id: string | null;
  supplier_id: string | null;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'archived' | 'deleted';
  approval_status: 'pending' | 'approved' | 'rejected' | 'revision_required';
  retention_date: string | null;
  is_confidential: boolean;
  is_encrypted: boolean;
  encryption_algorithm: string | null;
  compliance_flags: string[];
  access_level: 'private' | 'internal' | 'public' | 'restricted';
  allowed_roles: string[];
  tags: string[];
  metadata: Record<string, any>;
  uploaded_by: string;
  last_accessed_at: string | null;
  last_accessed_by: string | null;
  download_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
  notes: string | null;
  is_active: boolean;
}

export interface DocumentVersion {
  id: string;
  organization_id: string;
  document_id: string;
  version_number: number;
  version_label: string | null;
  file_name: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  storage_path: string;
  storage_bucket: string;
  file_hash: string | null;
  change_summary: string | null;
  change_type: string | null;
  previous_version_id: string | null;
  is_current: boolean;
  uploaded_by: string;
  created_at: string;
}

export interface DocumentPermission {
  id: string;
  organization_id: string;
  document_id: string;
  permission_type: 'user' | 'role' | 'department' | 'team';
  target_user_id: string | null;
  target_role: string | null;
  target_department_id: string | null;
  can_view: boolean;
  can_download: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_share: boolean;
  can_approve: boolean;
  can_comment: boolean;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  granted_by: string;
  granted_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  revocation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplate {
  id: string;
  organization_id: string;
  template_code: string;
  template_name: string;
  description: string | null;
  category_id: string | null;
  template_type: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  storage_bucket: string;
  template_fields: any[];
  default_values: Record<string, any>;
  is_system_template: boolean;
  is_active: boolean;
  usage_count: number;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface DocumentApproval {
  id: string;
  organization_id: string;
  document_id: string;
  approval_step: number;
  total_steps: number;
  approval_level: string | null;
  approver_id: string;
  approver_role: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'revision_required';
  decision: string | null;
  comments: string | null;
  conditions: string | null;
  requested_at: string;
  responded_at: string | null;
  due_date: string | null;
  notification_sent: boolean;
  reminder_sent_count: number;
  last_reminder_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface DocumentAuditLog {
  id: string;
  organization_id: string;
  document_id: string;
  action: string;
  action_category: string | null;
  action_details: Record<string, any>;
  user_id: string | null;
  user_name: string | null;
  user_role: string | null;
  user_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_info: Record<string, any>;
  geo_location: Record<string, any>;
  document_version: number | null;
  document_status: string | null;
  before_state: Record<string, any>;
  after_state: Record<string, any>;
  compliance_event: boolean;
  retention_required: boolean;
  action_timestamp: string;
  created_at: string;
}

export interface DocumentShare {
  id: string;
  organization_id: string;
  document_id: string;
  share_token: string;
  share_type: 'link' | 'email' | 'external';
  recipient_email: string | null;
  recipient_name: string | null;
  can_view: boolean;
  can_download: boolean;
  can_comment: boolean;
  requires_password: boolean;
  password_hash: string | null;
  expires_at: string | null;
  max_access_count: number | null;
  access_count: number;
  is_active: boolean;
  revoked_at: string | null;
  revoked_by: string | null;
  revocation_reason: string | null;
  last_accessed_at: string | null;
  last_accessed_from: string | null;
  created_at: string;
  created_by: string;
  notification_sent: boolean;
}

export interface DocumentComment {
  id: string;
  organization_id: string;
  document_id: string;
  parent_comment_id: string | null;
  comment_text: string;
  comment_type: 'general' | 'review' | 'approval' | 'question' | 'suggestion';
  page_number: number | null;
  position_data: Record<string, any>;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  mentions: string[];
  attachments: any[];
  created_at: string;
  updated_at: string;
  created_by: string;
  edited_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface DocumentTag {
  id: string;
  organization_id: string;
  tag_name: string;
  tag_color: string | null;
  tag_description: string | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

// ============================================================================
// SECURITY & COMPLIANCE HARDENING SYSTEM TYPES
// ============================================================================

// Multi-factor authentication settings
export interface MFASettings {
  id: string;
  user_id: string;
  organization_id: string;
  is_enabled: boolean;
  backup_codes: string[];
  totp_secret: string | null;
  sms_enabled: boolean;
  email_enabled: boolean;
  biometric_enabled: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

// Session management and security
export interface UserSession {
  id: string;
  user_id: string;
  organization_id: string;
  session_token: string;
  device_info: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  location_info: Record<string, any> | null;
  is_active: boolean;
  last_activity: string;
  expires_at: string | null;
  created_at: string;
}

// Failed login attempts tracking
export interface FailedLoginAttempt {
  id: string;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  attempt_count: number;
  is_blocked: boolean;
  blocked_until: string | null;
  last_attempt_at: string;
  created_at: string;
}

// Password history to prevent reuse
export interface PasswordHistory {
  id: string;
  user_id: string;
  password_hash: string;
  created_at: string;
}

// Security roles with granular permissions
export interface SecurityRole {
  id: string;
  organization_id: string;
  role_name: string;
  role_description: string | null;
  is_system_role: boolean;
  permissions: Record<string, any>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// User role assignments with time-based access
export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  organization_id: string;
  assigned_by: string | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  assignment_reason: string | null;
  created_at: string;
  updated_at: string;
}

// Resource permissions for fine-grained access control
export interface ResourcePermission {
  id: string;
  organization_id: string;
  resource_type: string;
  resource_id: string | null;
  user_id: string | null;
  role_id: string | null;
  permissions: Record<string, any>;
  granted_by: string | null;
  expires_at: string | null;
  created_at: string;
}

// Enhanced audit trail for all system activities
export interface SecurityAuditLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  session_id: string | null;
  event_type: string;
  event_category: 'authentication' | 'authorization' | 'data' | 'system';
  resource_type: string | null;
  resource_id: string | null;
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout';
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  risk_score: number;
  event_source: 'web' | 'api' | 'mobile' | 'system';
  additional_context: Record<string, any> | null;
  created_at: string;
}

// User behavior analytics for anomaly detection
export interface UserBehaviorAnalytics {
  id: string;
  user_id: string;
  organization_id: string;
  session_id: string | null;
  behavior_type: string;
  behavior_data: Record<string, any>;
  anomaly_score: number;
  is_anomaly: boolean;
  baseline_data: Record<string, any> | null;
  detection_rules: string[];
  analyzed_at: string;
  created_at: string;
}

// Security incidents and alerts
export interface SecurityIncident {
  id: string;
  organization_id: string;
  incident_type: string;
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  title: string;
  description: string | null;
  affected_users: string[];
  affected_resources: Record<string, any> | null;
  detection_method: 'automated' | 'manual' | 'external';
  response_actions: Record<string, any> | null;
  resolved_by: string | null;
  resolved_at: string | null;
  assigned_to: string | null;
  escalated_at: string | null;
  additional_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// Encryption keys management
export interface EncryptionKey {
  id: string;
  organization_id: string;
  key_type: 'field_encryption' | 'file_encryption' | 'backup';
  key_purpose: 'pii' | 'financial' | 'medical' | 'business';
  key_algorithm: string;
  key_version: number;
  is_active: boolean;
  created_by: string | null;
  rotated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

// Sensitive data classification and handling
export interface DataClassification {
  id: string;
  organization_id: string;
  table_name: string;
  column_name: string;
  classification_level: 'public' | 'internal' | 'confidential' | 'restricted';
  data_type: 'pii' | 'financial' | 'health' | 'business';
  encryption_required: boolean;
  retention_period_days: number | null;
  access_restrictions: Record<string, any> | null;
  compliance_tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Data anonymization and pseudonymization tracking
export interface DataAnonymizationLog {
  id: string;
  organization_id: string;
  operation_type: 'anonymize' | 'pseudonymize' | 'restore';
  table_name: string;
  record_ids: string[];
  fields_affected: string[];
  anonymization_method: 'masking' | 'randomization' | 'generalization' | null;
  request_reason: string | null;
  performed_by: string | null;
  is_reversible: boolean;
  reversal_key: string | null;
  created_at: string;
}

// Data consent management (PDPL compliance)
export interface DataConsent {
  id: string;
  organization_id: string;
  subject_id: string;
  subject_type: 'customer' | 'employee' | 'vendor';
  consent_type: 'marketing' | 'processing' | 'sharing' | 'storage';
  consent_status: 'pending' | 'granted' | 'denied' | 'withdrawn' | 'expired';
  consent_method: 'website_form' | 'paper_form' | 'verbal' | 'email' | null;
  purpose: string;
  data_categories: string[];
  retention_period_days: number | null;
  consent_language: string;
  legal_basis: string | null;
  granted_at: string | null;
  withdrawn_at: string | null;
  expires_at: string | null;
  evidence_url: string | null;
  additional_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Data subject rights requests (PDPL Article 13)
export interface DataSubjectRequest {
  id: string;
  organization_id: string;
  subject_id: string;
  subject_type: string;
  request_type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  status: 'received' | 'processing' | 'completed' | 'rejected';
  request_details: string | null;
  identity_verified: boolean;
  verification_method: string | null;
  requested_data: Record<string, any> | null;
  response_data: Record<string, any> | null;
  legal_basis_for_processing: string | null;
  rejection_reason: string | null;
  requested_by_email: string | null;
  requested_by_phone: string | null;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// UAE Cybersecurity compliance tracking
export interface CybersecurityCompliance {
  id: string;
  organization_id: string;
  framework: 'UAE_CSA' | 'NIST' | 'ISO27001';
  control_id: string;
  control_name: string;
  control_description: string | null;
  implementation_status: 'implemented' | 'partially' | 'not_implemented';
  compliance_level: 'basic' | 'advanced' | 'critical' | null;
  evidence_documents: string[];
  assessment_date: string | null;
  next_review_date: string | null;
  responsible_person: string | null;
  risk_rating: 'low' | 'medium' | 'high' | 'critical';
  remediation_plan: string | null;
  implementation_cost: number | null;
  created_at: string;
  updated_at: string;
}

// Real-time security monitoring rules
export interface SecurityMonitoringRule {
  id: string;
  organization_id: string;
  rule_name: string;
  rule_type: 'threshold' | 'pattern' | 'anomaly' | 'compliance';
  rule_category: 'authentication' | 'data_access' | 'system';
  conditions: Record<string, any>;
  threshold_values: Record<string, any> | null;
  is_active: boolean;
  severity_level: string;
  alert_channels: string[];
  auto_response_actions: Record<string, any> | null;
  created_by: string | null;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

// Security alerts and notifications
export interface SecurityAlert {
  id: string;
  organization_id: string;
  rule_id: string | null;
  alert_type: string;
  severity_level: string;
  title: string;
  description: string | null;
  status: 'open' | 'acknowledged' | 'resolved' | 'false_positive';
  affected_users: string[];
  event_data: Record<string, any> | null;
  auto_actions_taken: Record<string, any> | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

// API security and rate limiting
export interface APISecurityLog {
  id: string;
  organization_id: string;
  api_endpoint: string;
  user_id: string | null;
  api_key_id: string | null;
  request_method: string;
  request_size: number | null;
  response_status: number | null;
  response_time_ms: number | null;
  ip_address: string | null;
  user_agent: string | null;
  rate_limit_hit: boolean;
  rate_limit_window: string | null;
  rate_limit_count: number | null;
  authentication_method: string | null;
  request_headers: Record<string, any> | null;
  error_details: string | null;
  created_at: string;
}

// Data backup tracking and management
export interface DataBackup {
  id: string;
  organization_id: string;
  backup_type: 'full' | 'incremental' | 'differential';
  backup_scope: 'database' | 'files' | 'complete';
  backup_status: 'completed' | 'failed' | 'in_progress';
  backup_location: string;
  backup_size_bytes: number | null;
  encryption_used: boolean;
  encryption_algorithm: string;
  checksum: string | null;
  retention_until: string | null;
  restore_tested_at: string | null;
  restore_test_status: 'passed' | 'failed' | 'pending' | null;
  initiated_by: string | null;
  error_details: string | null;
  created_at: string;
  completed_at: string | null;
}

// Disaster recovery procedures and testing
export interface DisasterRecoveryProcedure {
  id: string;
  organization_id: string;
  procedure_name: string;
  procedure_type: 'data_breach' | 'system_failure' | 'cyber_attack';
  priority_level: number;
  steps: Record<string, any>;
  responsible_roles: string[];
  estimated_recovery_time: string | null;
  last_tested_at: string | null;
  test_results: string | null;
  next_test_due: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Organization security policies and settings
export interface SecurityPolicy {
  id: string;
  organization_id: string;
  policy_type: 'password' | 'access' | 'data_handling' | 'incident_response';
  policy_name: string;
  policy_content: Record<string, any>;
  is_active: boolean;
  enforcement_level: 'advisory' | 'recommended' | 'mandatory';
  applies_to_roles: string[];
  effective_from: string;
  expires_at: string | null;
  created_by: string | null;
  approved_by: string | null;
  approval_date: string | null;
  created_at: string;
  updated_at: string;
}

// Security configuration settings
export interface SecuritySetting {
  id: string;
  organization_id: string;
  setting_category: 'authentication' | 'session' | 'encryption' | 'monitoring';
  setting_key: string;
  setting_value: Record<string, any>;
  setting_type: 'boolean' | 'integer' | 'string' | 'json';
  is_sensitive: boolean;
  description: string | null;
  validation_rules: Record<string, any> | null;
  modified_by: string | null;
  created_at: string;
  updated_at: string;
}

// Combined types for complex queries
export interface SecurityDashboardData {
  incidents: SecurityIncident[];
  alerts: SecurityAlert[];
  auditLogs: SecurityAuditLog[];
  compliance: CybersecurityCompliance[];
  stats: {
    activeIncidents: number;
    criticalAlerts: number;
    complianceScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface UserSecurityProfile {
  user: Profile;
  mfaSettings: MFASettings;
  roles: (UserRoleAssignment & { role: SecurityRole })[];
  permissions: ResourcePermission[];
  sessions: UserSession[];
  behaviorAnalytics: UserBehaviorAnalytics[];
  riskScore: number;
}

export interface ComplianceReport {
  framework: string;
  overallScore: number;
  controls: CybersecurityCompliance[];
  gaps: CybersecurityCompliance[];
  recommendations: string[];
  nextActions: {
    control: CybersecurityCompliance;
    priority: 'high' | 'medium' | 'low';
    dueDate: string;
  }[];
}