// Backup & Disaster Recovery System Types
// Created: 2025-11-11 13:43:46
// Description: Comprehensive TypeScript interfaces for backup, disaster recovery, and business continuity management

// ==================== ENUM TYPES ====================

export type BackupType = 'full' | 'incremental' | 'transaction_log' | 'file_system' | 'configuration';
export type BackupScope = 'database' | 'files' | 'system' | 'application' | 'all';
export type BackupFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
export type JobStatus = 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled' | 'retrying';
export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'skipped';
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';
export type StorageType = 'supabase' | 'aws_s3' | 'google_cloud' | 'azure_blob' | 'local';
export type StorageTier = 'hot' | 'cool' | 'cold' | 'archive';
export type AuthenticationMethod = 'access_key' | 'iam_role' | 'managed_identity' | 'service_account';
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'offline';
export type DisasterType = 'data_corruption' | 'hardware_failure' | 'cyber_attack' | 'natural_disaster' | 'human_error' | 'system_outage';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical' | 'catastrophic' | 'emergency';
export type TestType = 'tabletop' | 'walkthrough' | 'simulation' | 'parallel' | 'full_interruption';
export type TestScope = 'single_system' | 'multiple_systems' | 'entire_infrastructure' | 'specific_scenario';
export type TestEnvironment = 'production' | 'staging' | 'development' | 'isolated';
export type TestResult = 'pass' | 'fail' | 'partial_pass' | 'inconclusive';
export type TestStatus = 'planned' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'postponed';
export type PlanType = 'business_continuity' | 'disaster_recovery' | 'crisis_management' | 'incident_response';
export type PlanScope = 'entire_organization' | 'specific_department' | 'critical_processes' | 'specific_location';
export type CriticalityLevel = 'low' | 'medium' | 'high' | 'critical' | 'essential';
export type ImpactLevel = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'severe';
export type ApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'expired';
export type ContactType = 'internal_staff' | 'management' | 'vendor' | 'government' | 'emergency_services' | 'insurance' | 'legal';
export type AuthorityLevel = 'informational' | 'advisory' | 'decision_maker' | 'final_authority';
export type ContactMethod = 'phone' | 'email' | 'sms' | 'whatsapp' | 'in_person';
export type MonitorType = 'backup_job' | 'storage_capacity' | 'system_health' | 'performance' | 'security';
export type MonitorStatus = 'healthy' | 'warning' | 'critical' | 'offline' | 'unknown';
export type IncidentType = 'backup_failure' | 'recovery_failure' | 'data_corruption' | 'security_breach' | 'system_outage' | 'performance_degradation';
export type IncidentStatus = 'open' | 'investigating' | 'resolving' | 'monitoring' | 'resolved' | 'closed';
export type BusinessImpact = 'none' | 'minimal' | 'moderate' | 'significant' | 'severe' | 'critical';

// ==================== BACKUP MANAGEMENT TABLES ====================

// Backup Schedules
export interface BackupSchedule {
  id: string;
  organization_id: string;
  schedule_name: string;
  schedule_description?: string;
  
  // Backup Configuration
  backup_type: BackupType;
  backup_scope: BackupScope;
  source_system?: string;
  
  // Scheduling Details
  frequency: BackupFrequency;
  schedule_time?: string;
  schedule_timezone?: string;
  days_of_week?: number[];
  days_of_month?: number[];
  
  // Backup Settings
  retention_days: number;
  compression_enabled?: boolean;
  encryption_enabled?: boolean;
  compression_level?: number;
  max_backup_size_gb?: number;
  
  // Status and Control
  is_active?: boolean;
  last_execution_at?: string;
  next_execution_at?: string;
  execution_count?: number;
  
  // Performance Tracking
  avg_execution_time_minutes?: number;
  avg_backup_size_mb?: number;
  success_rate?: number;
  
  // UAE Compliance
  data_residency_region?: string;
  cross_border_allowed?: boolean;
  compliance_notes?: string;
  
  // Audit Fields
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  version?: number;
}

// Backup Jobs
export interface BackupJob {
  id: string;
  organization_id: string;
  schedule_id?: string;
  job_name: string;
  
  // Job Details
  backup_type: BackupType;
  backup_scope: BackupScope;
  source_system?: string;
  
  // Execution Tracking
  job_status: JobStatus;
  execution_priority?: number;
  started_at?: string;
  completed_at?: string;
  execution_time_minutes?: number;
  
  // Backup Results
  backup_size_mb?: number;
  compression_ratio?: number;
  files_backed_up?: number;
  records_backed_up?: number;
  
  // Storage Information
  storage_location?: string;
  backup_filename?: string;
  backup_hash?: string;
  encryption_key_id?: string;
  
  // Error Handling
  error_message?: string;
  error_code?: string;
  retry_count?: number;
  max_retries?: number;
  
  // Verification
  verification_status?: VerificationStatus;
  verification_at?: string;
  integrity_check_passed?: boolean;
  
  // Performance Metrics
  cpu_usage_percent?: number;
  memory_usage_mb?: number;
  network_usage_mb?: number;
  storage_iops?: number;
  
  // UAE Compliance
  data_classification?: DataClassification;
  contains_personal_data?: boolean;
  gdpr_applicable?: boolean;
  pdpl_compliant?: boolean;
  
  // Audit Fields
  created_at?: string;
  updated_at?: string;
}

// Backup Locations
export interface BackupLocation {
  id: string;
  organization_id: string;
  location_name: string;
  location_description?: string;
  
  // Storage Configuration
  storage_type: StorageType;
  storage_tier?: StorageTier;
  region?: string;
  endpoint_url?: string;
  bucket_name?: string;
  path_prefix?: string;
  
  // Authentication
  access_key_id?: string;
  secret_access_key?: string;
  connection_string?: string;
  authentication_method?: AuthenticationMethod;
  
  // Capacity and Limits
  total_capacity_gb?: number;
  used_capacity_gb?: number;
  capacity_warning_threshold?: number;
  max_file_size_gb?: number;
  max_files?: number;
  
  // Performance Configuration
  concurrent_uploads?: number;
  upload_chunk_size_mb?: number;
  download_timeout_minutes?: number;
  retry_attempts?: number;
  
  // Security Settings
  encryption_at_rest?: boolean;
  encryption_in_transit?: boolean;
  encryption_algorithm?: string;
  access_control_list?: string;
  public_access_blocked?: boolean;
  
  // Monitoring
  is_active?: boolean;
  health_status?: HealthStatus;
  last_health_check?: string;
  connectivity_test_passed?: boolean;
  last_successful_backup?: string;
  last_failed_backup?: string;
  
  // UAE Compliance
  data_residency_compliant?: boolean;
  cross_border_transfer_allowed?: boolean;
  government_access_restrictions?: string;
  encryption_key_location?: string;
  
  // Cost Management
  monthly_cost_estimate?: number;
  cost_per_gb?: number;
  data_transfer_cost?: number;
  
  // Audit Fields
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
}

// ==================== DISASTER RECOVERY TABLES ====================

// Recovery Procedures
export interface RecoveryProcedure {
  id: string;
  organization_id: string;
  procedure_name: string;
  procedure_description?: string;
  
  // Recovery Classification
  disaster_type: DisasterType;
  severity_level: SeverityLevel;
  affected_systems?: string[];
  
  // Recovery Objectives
  recovery_time_objective_hours: number;
  recovery_point_objective_minutes: number;
  maximum_tolerable_downtime_hours?: number;
  data_loss_tolerance_minutes?: number;
  
  // Procedure Details
  detection_steps: string;
  assessment_steps: string;
  recovery_steps: string;
  validation_steps: string;
  communication_steps: string;
  
  // Resource Requirements
  required_personnel?: string[];
  required_tools?: string[];
  required_credentials?: string[];
  estimated_recovery_cost?: number;
  external_vendors_required?: string[];
  
  // Dependencies
  prerequisite_procedures?: string[];
  dependent_procedures?: string[];
  required_backup_types?: string[];
  minimum_backup_age_hours?: number;
  
  // Testing and Validation
  last_tested_at?: string;
  test_frequency_months?: number;
  next_test_due?: string;
  test_success_rate?: number;
  known_issues?: string;
  
  // Approval and Maintenance
  is_approved?: boolean;
  approved_by?: string;
  approved_at?: string;
  review_frequency_months?: number;
  next_review_due?: string;
  
  // UAE Specific
  regulatory_requirements?: string;
  government_notification_required?: boolean;
  cross_border_considerations?: string;
  local_law_compliance_notes?: string;
  
  // Audit Fields
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  version?: number;
}

// Recovery Testing
export interface RecoveryTesting {
  id: string;
  organization_id: string;
  test_name: string;
  test_description?: string;
  
  // Test Configuration
  procedure_id?: string;
  test_type: TestType;
  test_scope?: TestScope;
  affected_systems?: string[];
  
  // Test Scheduling
  scheduled_start: string;
  scheduled_duration_hours: number;
  actual_start?: string;
  actual_end?: string;
  actual_duration_hours?: number;
  
  // Test Execution
  test_status: TestStatus;
  test_environment?: TestEnvironment;
  participants?: string[];
  test_coordinator?: string;
  
  // Test Results
  overall_result?: TestResult;
  rto_achieved_hours?: number;
  rto_target_met?: boolean;
  rpo_achieved_minutes?: number;
  rpo_target_met?: boolean;
  data_integrity_verified?: boolean;
  
  // Performance Metrics
  recovery_speed_rating?: number;
  team_preparedness_rating?: number;
  procedure_effectiveness_rating?: number;
  communication_effectiveness_rating?: number;
  
  // Issues and Improvements
  issues_identified?: string;
  lessons_learned?: string;
  improvement_recommendations?: string;
  action_items?: string;
  follow_up_required?: boolean;
  
  // Cost Analysis
  test_cost?: number;
  resource_hours_used?: number;
  downtime_cost_estimate?: number;
  
  // Documentation
  test_report_url?: string;
  evidence_files?: string[];
  photos_videos?: string[];
  
  // Audit Fields
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
}

// ==================== BUSINESS CONTINUITY TABLES ====================

// Continuity Plans
export interface ContinuityPlan {
  id: string;
  organization_id: string;
  plan_name: string;
  plan_description?: string;
  
  // Plan Classification
  plan_type: PlanType;
  scope: PlanScope;
  criticality_level: CriticalityLevel;
  
  // Business Impact Analysis
  critical_business_functions?: string[];
  maximum_tolerable_downtime_hours?: number;
  financial_impact_per_hour?: number;
  reputation_impact_level?: ImpactLevel;
  regulatory_impact_level?: ImpactLevel;
  
  // Resource Requirements
  minimum_staffing_requirements?: string;
  critical_suppliers?: string[];
  essential_technology_systems?: string[];
  required_workspace_locations?: string[];
  communication_requirements?: string;
  
  // Recovery Strategies
  primary_recovery_strategy?: string;
  alternative_recovery_strategies?: string[];
  workaround_procedures?: string;
  manual_processes?: string;
  third_party_dependencies?: string[];
  
  // Activation Procedures
  activation_criteria: string;
  decision_makers?: string[];
  activation_authority_levels?: string;
  escalation_procedures?: string;
  
  // Communication Plan
  internal_communication_plan?: string;
  external_communication_plan?: string;
  customer_communication_plan?: string;
  media_communication_plan?: string;
  regulatory_notification_requirements?: string;
  
  // Recovery Phases
  immediate_response_actions?: string;
  short_term_recovery_actions?: string;
  medium_term_recovery_actions?: string;
  long_term_recovery_actions?: string;
  
  // Plan Maintenance
  last_reviewed_at?: string;
  review_frequency_months?: number;
  next_review_due?: string;
  last_updated_by?: string;
  approval_status?: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  
  // Testing and Training
  last_tested_at?: string;
  test_frequency_months?: number;
  next_test_due?: string;
  training_requirements?: string;
  training_frequency_months?: number;
  
  // UAE Specific
  uae_regulatory_requirements?: string;
  government_coordination_required?: boolean;
  local_emergency_services_contact?: string;
  consular_notification_required?: boolean;
  
  // Audit Fields
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  version?: number;
}

// Emergency Contacts
export interface EmergencyContact {
  id: string;
  organization_id: string;
  contact_name: string;
  contact_title?: string;
  department?: string;
  
  // Contact Information
  primary_phone?: string;
  secondary_phone?: string;
  email?: string;
  alternative_email?: string;
  address?: string;
  
  // Contact Classification
  contact_type: ContactType;
  responsibility_area?: string;
  escalation_level?: number;
  availability_24_7?: boolean;
  
  // Contact Scenarios
  applicable_scenarios?: string[];
  required_disasters?: string[];
  authority_level?: AuthorityLevel;
  
  // Availability and Preferences
  business_hours_start?: string;
  business_hours_end?: string;
  timezone?: string;
  preferred_contact_method?: ContactMethod;
  language_preferences?: string[];
  
  // Backup Contacts
  backup_contact_1?: string;
  backup_phone_1?: string;
  backup_contact_2?: string;
  backup_phone_2?: string;
  
  // Contact Verification
  last_verified_at?: string;
  verification_frequency_months?: number;
  next_verification_due?: string;
  contact_is_active?: boolean;
  
  // Emergency Protocols
  special_instructions?: string;
  security_clearance_level?: string;
  notification_priority?: number;
  
  // Audit Fields
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
}

// ==================== MONITORING & ANALYTICS TABLES ====================

// Backup Monitoring
export interface BackupMonitoring {
  id: string;
  organization_id: string;
  monitor_name: string;
  monitor_description?: string;
  
  // Monitoring Configuration
  monitor_type: MonitorType;
  monitored_resource: string;
  check_interval_minutes?: number;
  
  // Thresholds and Alerts
  warning_threshold?: number;
  critical_threshold?: number;
  threshold_unit?: string;
  consecutive_failures_alert?: number;
  
  // Current Status
  current_status: MonitorStatus;
  current_value?: number;
  last_check_at?: string;
  last_status_change?: string;
  
  // Performance Metrics
  uptime_percentage?: number;
  average_response_time_ms?: number;
  total_checks_performed?: number;
  successful_checks?: number;
  failed_checks?: number;
  
  // Alert Configuration
  alert_enabled?: boolean;
  alert_cooldown_minutes?: number;
  last_alert_sent?: string;
  alert_recipients?: string[];
  escalation_rules?: string;
  
  // Historical Data
  status_history?: any;
  performance_history?: any;
  
  // Maintenance
  is_active?: boolean;
  maintenance_mode?: boolean;
  maintenance_until?: string;
  notes?: string;
  
  // Audit Fields
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
}

// Backup Analytics
export interface BackupAnalytics {
  organization_id: string;
  metric_date: string;
  metric_hour?: number;
  
  // Backup Performance
  total_backups_scheduled?: number;
  total_backups_completed?: number;
  total_backups_failed?: number;
  backup_success_rate?: number;
  average_backup_time_minutes?: number;
  total_backup_size_gb?: number;
  
  // Storage Analytics
  total_storage_used_gb?: number;
  storage_growth_rate_gb_per_day?: number;
  deduplication_savings_gb?: number;
  compression_savings_percent?: number;
  
  // Recovery Analytics
  recovery_tests_performed?: number;
  recovery_tests_successful?: number;
  average_recovery_time_minutes?: number;
  rto_compliance_rate?: number;
  rpo_compliance_rate?: number;
  
  // System Health
  system_availability_percent?: number;
  average_cpu_usage_percent?: number;
  average_memory_usage_percent?: number;
  network_bandwidth_used_mbps?: number;
  storage_iops?: number;
  
  // Error Analytics
  total_errors?: number;
  error_types?: any;
  most_common_error?: string;
  error_resolution_time_minutes?: number;
  
  // Cost Analytics
  daily_storage_cost?: number;
  daily_transfer_cost?: number;
  daily_compute_cost?: number;
  cost_per_gb?: number;
  cost_optimization_savings?: number;
  
  // Compliance Analytics
  compliance_checks_performed?: number;
  compliance_violations?: number;
  data_residency_compliance_rate?: number;
  encryption_compliance_rate?: number;
  
  // Business Metrics
  business_critical_backups?: number;
  customer_data_backups?: number;
  financial_data_backups?: number;
  employee_data_backups?: number;
  
  // Regional Analytics
  uae_data_backups?: number;
  cross_border_backups?: number;
  pdpl_compliant_backups?: number;
  
  // Audit Fields
  created_at?: string;
  updated_at?: string;
}

// Incident Logs
export interface IncidentLog {
  id: string;
  organization_id: string;
  incident_title: string;
  incident_description?: string;
  
  // Incident Classification
  incident_type: IncidentType;
  severity_level: SeverityLevel;
  affected_systems?: string[];
  business_impact?: BusinessImpact;
  
  // Incident Timeline
  detected_at: string;
  reported_at?: string;
  acknowledged_at?: string;
  investigation_started_at?: string;
  resolved_at?: string;
  closed_at?: string;
  
  // Response Information
  incident_status: IncidentStatus;
  assigned_to?: string;
  response_team?: string[];
  escalated_to?: string;
  escalation_level?: number;
  
  // Root Cause Analysis
  root_cause?: string;
  contributing_factors?: string;
  failure_points?: string[];
  lessons_learned?: string;
  
  // Resolution Details
  resolution_summary?: string;
  resolution_steps?: string;
  workarounds_used?: string;
  external_assistance_required?: string;
  
  // Impact Assessment
  downtime_duration_minutes?: number;
  data_loss_amount_gb?: number;
  affected_users_count?: number;
  financial_impact?: number;
  reputation_impact_level?: ImpactLevel;
  
  // Prevention Measures
  preventive_actions?: string;
  process_improvements?: string;
  technology_changes?: string;
  training_requirements?: string;
  follow_up_items?: string;
  
  // Communication
  customer_notified?: boolean;
  management_notified?: boolean;
  regulator_notified?: boolean;
  public_communication?: string;
  
  // Documentation
  incident_report_url?: string;
  evidence_files?: string[];
  log_files?: string[];
  
  // UAE Specific
  government_reporting_required?: boolean;
  pdpl_notification_required?: boolean;
  cross_border_implications?: string;
  
  // Audit Fields
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
}

// ==================== DASHBOARD & API TYPES ====================

// Dashboard Statistics
export interface BackupDashboardStats {
  // Backup Performance
  total_active_schedules: number;
  total_completed_backups_today: number;
  total_failed_backups_today: number;
  backup_success_rate_7_days: number;
  average_backup_duration_minutes: number;
  total_storage_used_gb: number;
  storage_growth_rate_7_days: number;
  
  // Recovery Readiness
  total_recovery_procedures: number;
  approved_recovery_procedures: number;
  overdue_recovery_tests: number;
  average_rto_hours: number;
  average_rpo_minutes: number;
  
  // System Health
  healthy_storage_locations: number;
  warning_storage_locations: number;
  critical_storage_locations: number;
  active_monitors: number;
  critical_alerts: number;
  
  // Business Continuity
  approved_continuity_plans: number;
  overdue_plan_reviews: number;
  emergency_contacts_verified: number;
  recent_incidents_7_days: number;
}

// API Response Types
export interface BackupApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
}

export interface BackupListResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters?: any;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

// Form Types
export interface BackupScheduleFormData {
  schedule_name: string;
  schedule_description?: string;
  backup_type: BackupType;
  backup_scope: BackupScope;
  source_system?: string;
  frequency: BackupFrequency;
  schedule_time?: string;
  retention_days: number;
  compression_enabled?: boolean;
  encryption_enabled?: boolean;
}

export interface RecoveryProcedureFormData {
  procedure_name: string;
  procedure_description?: string;
  disaster_type: DisasterType;
  severity_level: SeverityLevel;
  affected_systems?: string[];
  recovery_time_objective_hours: number;
  recovery_point_objective_minutes: number;
  detection_steps: string;
  assessment_steps: string;
  recovery_steps: string;
  validation_steps: string;
  communication_steps: string;
}