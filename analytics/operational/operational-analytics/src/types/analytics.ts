// Comprehensive TypeScript types for Operational Analytics System
// This file provides type safety for all operational analytics features

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface Employee extends BaseEntity {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department: string;
  position?: string;
  hire_date: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'temporary';
  salary?: number;
  hourly_rate?: number;
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  manager_id?: string;
  direct_reports_count: number;
  skills: string[];
  certifications: string[];
}

export interface PerformanceMetric extends BaseEntity {
  employee_id: string;
  metric_date: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  productivity_score?: number;
  task_completion_rate?: number;
  quality_rating?: number;
  time_efficiency_score?: number;
  collaboration_score?: number;
  innovation_rating?: number;
  leadership_score?: number;
  customer_satisfaction?: number;
  goal_achievement_rate?: number;
  overtime_hours: number;
  training_hours_completed: number;
  peer_rating?: number;
  manager_rating?: number;
  self_assessment_score?: number;
  overall_performance_score?: number;
  improvement_areas: string[];
  strengths: string[];
  goals_set: number;
  goals_achieved: number;
  performance_trend: 'improving' | 'declining' | 'stable';
}

export interface TimeTracking extends BaseEntity {
  employee_id: string;
  clock_in_time: string;
  clock_out_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  lunch_start_time?: string;
  lunch_end_time?: string;
  total_hours_worked: number;
  regular_hours: number;
  overtime_hours: number;
  break_time_minutes: number;
  lunch_time_minutes: number;
  productivity_percentage: number;
  project_code?: string;
  task_description?: string;
  location?: string;
  clock_in_method: 'manual' | 'badge' | 'biometric' | 'app';
  clock_out_method?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approval_date?: string;
  notes?: string;
}

export interface Resource extends BaseEntity {
  resource_id: string;
  resource_name: string;
  resource_type: 'equipment' | 'facility' | 'software' | 'vehicle' | 'tool';
  category: string;
  department?: string;
  location?: string;
  purchase_date?: string;
  purchase_cost?: number;
  current_value?: number;
  depreciation_rate: number;
  warranty_expiry?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired' | 'lost';
  utilization_threshold: number;
  efficiency_target: number;
  maintenance_schedule: MaintenanceSchedule[];
  specifications: Record<string, any>;
}

export interface MaintenanceSchedule {
  type: string;
  frequency: string;
  last_performed: string;
  next_due: string;
  cost: number;
  duration_hours: number;
}

export interface ResourceUtilization extends BaseEntity {
  resource_id: string;
  utilization_date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  active_hours: number;
  idle_hours: number;
  maintenance_hours: number;
  downtime_hours: number;
  utilization_rate: number;
  efficiency_score?: number;
  capacity_utilization?: number;
  cost_per_hour?: number;
  total_cost?: number;
  output_quantity: number;
  output_quality_score?: number;
  energy_consumption?: number;
  maintenance_required: boolean;
  issue_reported: boolean;
  issue_description?: string;
  operator_id?: string;
  project_id?: string;
  shift: 'morning' | 'afternoon' | 'night';
}

export interface Order extends BaseEntity {
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_type: 'standard' | 'premium' | 'enterprise';
  order_type: 'standard' | 'urgent' | 'custom' | 'rush';
  priority_level: number;
  status: 'pending' | 'processing' | 'in_production' | 'quality_check' | 'completed' | 'shipped' | 'delivered' | 'cancelled';
  order_date: string;
  requested_delivery_date?: string;
  actual_delivery_date?: string;
  total_amount: number;
  cost_of_goods: number;
  profit_margin: number;
  assigned_to?: string;
  department?: string;
  complexity_score?: number;
  estimated_hours?: number;
  actual_hours?: number;
  resource_requirements: string[];
  special_instructions?: string;
  quality_requirements: QualityRequirement[];
  customer_satisfaction_rating?: number;
  customer_feedback?: string;
}

export interface QualityRequirement {
  parameter: string;
  specification: string;
  tolerance: string;
  measurement_method: string;
}

export interface OrderProcessingStep extends BaseEntity {
  order_id: string;
  step_name: string;
  step_order: number;
  assigned_to?: string;
  department?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'blocked';
  start_time?: string;
  completion_time?: string;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  quality_score?: number;
  rework_required: boolean;
  rework_reason?: string;
  dependencies: string[];
  resources_used: string[];
  output_measurements: Record<string, any>;
  notes?: string;
}

export interface Workflow extends BaseEntity {
  workflow_name: string;
  workflow_category: string;
  description?: string;
  total_estimated_duration?: number;
  automation_level: number;
  active: boolean;
  version: string;
  approval_required: boolean;
  quality_check_required: boolean;
  sla_target_minutes?: number;
  complexity_level?: number;
  success_rate_target: number;
  cost_per_execution: number;
  created_by?: string;
  approved_by?: string;
  approval_date?: string;
  tags: string[];
}

export interface WorkflowStep extends BaseEntity {
  workflow_id: string;
  step_name: string;
  step_order: number;
  step_type: 'manual' | 'automated' | 'approval' | 'quality_check';
  estimated_duration_minutes: number;
  required_resources: string[];
  required_skills: string[];
  department?: string;
  can_skip: boolean;
  retry_count: number;
  failure_handling: 'block' | 'retry' | 'skip' | 'escalate';
  automation_script?: string;
  quality_criteria: QualityCriterion[];
}

export interface QualityCriterion {
  parameter: string;
  acceptable_range: string;
  measurement_method: string;
  critical: boolean;
}

export interface WorkflowExecution extends BaseEntity {
  workflow_id: string;
  instance_name?: string;
  order_id?: string;
  customer_request_id?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  total_duration_minutes?: number;
  total_cost: number;
  quality_score?: number;
  success_rate?: number;
  bottleneck_score: number;
  automation_executed_steps: number;
  manual_intervention_count: number;
  retry_count: number;
  error_count: number;
  sla_compliance: boolean;
  customer_satisfaction?: number;
  improvement_opportunities: string[];
  execution_data: Record<string, any>;
}

export interface Appointment extends BaseEntity {
  appointment_number: string;
  client_name: string;
  client_contact?: string;
  appointment_type: string;
  category?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority_level: number;
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration_minutes: number;
  actual_start_time?: string;
  actual_end_time?: string;
  total_duration_minutes?: number;
  assigned_to?: string;
  department?: string;
  location?: string;
  service_type?: string;
  preparation_required: boolean;
  preparation_notes?: string;
  special_requirements?: string;
  client_rating?: number;
  client_feedback?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  cancellation_reason?: string;
  reschedule_count: number;
}

export interface CustomerServiceInteraction extends BaseEntity {
  interaction_id: string;
  customer_id?: string;
  customer_name: string;
  interaction_type: 'phone' | 'email' | 'chat' | 'in_person' | 'callback';
  channel: string;
  subject?: string;
  category?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  assigned_to?: string;
  department?: string;
  creation_date: string;
  first_response_time_minutes?: number;
  resolution_time_minutes?: number;
  total_interactions: number;
  customer_satisfaction?: number;
  resolution_quality?: number;
  agent_performance?: number;
  escalation_required: boolean;
  escalation_reason?: string;
  escalation_date?: string;
  resolution_summary?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  tags: string[];
}

export interface QualityControl extends BaseEntity {
  inspection_id: string;
  order_id?: string;
  workflow_execution_id?: string;
  inspection_type: 'incoming' | 'in_process' | 'final' | 'random';
  inspector_id?: string;
  inspection_date: string;
  overall_quality_score: number;
  defect_count: number;
  critical_defects: number;
  major_defects: number;
  minor_defects: number;
  defect_details: DefectDetail[];
  inspection_criteria: InspectionCriterion[];
  passed: boolean;
  rejection_reason?: string;
  corrective_action_required: boolean;
  corrective_action_plan?: string;
  rework_required: boolean;
  rework_estimated_hours?: number;
  cost_of_quality: number;
  prevention_opportunities: string[];
  customer_impact: 'none' | 'minor' | 'major' | 'critical';
  supplier_issues: string[];
  process_improvements: string[];
  inspector_notes?: string;
  approved_by?: string;
  approval_date?: string;
}

export interface DefectDetail {
  defect_type: string;
  severity: 'critical' | 'major' | 'minor';
  location: string;
  description: string;
  root_cause?: string;
  corrective_action?: string;
  inspector: string;
}

export interface InspectionCriterion {
  parameter: string;
  specification: string;
  actual_value: string;
  passed: boolean;
  notes?: string;
}

export interface InventoryItem extends BaseEntity {
  item_code: string;
  item_name: string;
  category: string;
  subcategory?: string;
  unit_of_measure: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  reorder_point: number;
  reorder_quantity: number;
  unit_cost: number;
  total_value: number;
  supplier?: string;
  lead_time_days: number;
  storage_location?: string;
  shelf_life_days?: number;
  expiry_date?: string;
  condition_status: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  last_restocked_date?: string;
  usage_frequency: 'low' | 'medium' | 'high' | 'very_high';
  seasonal_item: boolean;
  critical_item: boolean;
  barcode?: string;
  description?: string;
  specifications: Record<string, any>;
}

export interface InventoryTransaction extends BaseEntity {
  transaction_id: string;
  item_id: string;
  transaction_type: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return' | 'damage' | 'expiration';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  unit_price?: number;
  total_revenue?: number;
  reference_number?: string;
  order_id?: string;
  supplier_id?: string;
  warehouse_location?: string;
  transaction_date: string;
  performed_by?: string;
  approved_by?: string;
  notes?: string;
  batch_number?: string;
  expiry_date?: string;
}

export interface CostAnalysis extends BaseEntity {
  analysis_id: string;
  order_id?: string;
  workflow_execution_id?: string;
  analysis_type: 'per_order' | 'per_project' | 'per_department' | 'per_period';
  period_start: string;
  period_end: string;
  direct_costs: number;
  indirect_costs: number;
  labor_costs: number;
  material_costs: number;
  overhead_costs: number;
  equipment_costs: number;
  energy_costs: number;
  maintenance_costs: number;
  total_costs: number;
  revenue: number;
  profit: number;
  profit_margin: number;
  cost_per_unit?: number;
  cost_efficiency_score?: number;
  cost_variance?: number;
  benchmark_comparison?: number;
  cost_optimization_suggestions: string[];
}

export interface PerformanceBenchmark extends BaseEntity {
  benchmark_name: string;
  category: 'productivity' | 'quality' | 'efficiency' | 'cost' | 'time';
  metric_name: string;
  target_value: number;
  current_value: number;
  previous_value: number;
  unit: string;
  measurement_type: 'absolute' | 'percentage' | 'ratio';
  benchmark_type: 'industry' | 'internal' | 'historical' | 'best_practice';
  industry_standard?: number;
  best_in_class?: number;
  organizational_average?: number;
  department?: string;
  role?: string;
  measurement_period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  last_measurement_date?: string;
  trend_direction?: 'improving' | 'declining' | 'stable' | 'volatile';
  achievement_rate: number;
  performance_level: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  action_required: boolean;
  improvement_suggestions: string[];
}

export interface ReportSchedule extends BaseEntity {
  report_name: string;
  report_type: 'performance' | 'cost' | 'quality' | 'productivity' | 'summary';
  report_category: string;
  schedule_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  custom_cron_expression?: string;
  report_parameters: Record<string, any>;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  delivery_method: 'email' | 'dashboard' | 'download' | 'api';
  active: boolean;
  last_generated?: string;
  next_generation?: string;
  generation_count: number;
  success_count: number;
  failure_count: number;
  last_success?: string;
  last_failure?: string;
  failure_reason?: string;
  created_by?: string;
  approved_by?: string;
}

export interface OperationalAlert extends BaseEntity {
  alert_id: string;
  alert_name: string;
  category: 'performance' | 'quality' | 'cost' | 'time' | 'resource' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  alert_type: 'threshold_breach' | 'anomaly' | 'SLA_violation' | 'system_error' | 'trend_alert';
  trigger_condition: Record<string, any>;
  current_value?: number;
  threshold_value?: number;
  unit?: string;
  message: string;
  description?: string;
  affected_entity_type?: 'employee' | 'department' | 'resource' | 'order' | 'workflow';
  affected_entity_id?: string;
  department?: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  triggered_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  escalation_level: number;
  notification_sent: boolean;
  notification_recipients: string[];
  auto_resolve: boolean;
  auto_resolve_delay_hours: number;
  recurrence_rule?: Record<string, any>;
}

export interface SystemConfiguration extends BaseEntity {
  config_key: string;
  config_value: Record<string, any>;
  config_type: 'threshold' | 'calculation' | 'display' | 'integration' | 'security';
  category: string;
  description?: string;
  default_value?: Record<string, any>;
  validation_rules?: Record<string, any>;
  is_system_config: boolean;
  is_user_configurable: boolean;
  requires_restart: boolean;
  version: string;
  created_by?: string;
  modified_by?: string;
}

// Dashboard Data Types
export interface DashboardSummary {
  total_employees: number;
  active_employees: number;
  avg_performance_score: number;
  total_orders_today: number;
  orders_completed_today: number;
  resource_utilization_rate: number;
  quality_score_average: number;
  cost_efficiency_index: number;
  active_alerts: number;
  critical_alerts: number;
}

export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
  color: 'green' | 'yellow' | 'red' | 'blue';
  description: string;
}

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
  department?: string;
}

// Filter Types
export interface DateRange {
  start: string;
  end: string;
}

export interface FilterOptions {
  departments?: string[];
  timeRange?: DateRange;
  employeeTypes?: string[];
  status?: string[];
  priority?: number[];
  categories?: string[];
}

// Analytics Calculation Results
export interface AnalyticsResult {
  metric_name: string;
  value: number;
  previous_value: number;
  change: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
  target_achievement: number;
  status: 'good' | 'warning' | 'critical';
}

export interface PerformanceSummary {
  department: string;
  employee_count: number;
  avg_performance: number;
  productivity_index: number;
  efficiency_score: number;
  quality_rating: number;
  goal_achievement: number;
  improvement_trend: 'improving' | 'stable' | 'declining';
}

export interface ResourceUtilizationSummary {
  resource_type: string;
  total_resources: number;
  utilization_rate: number;
  efficiency_score: number;
  cost_per_hour: number;
  roi_percentage: number;
  maintenance_required: number;
  downtime_hours: number;
}

export interface WorkflowAnalysis {
  workflow_name: string;
  completion_rate: number;
  avg_duration: number;
  bottleneck_score: number;
  automation_level: number;
  quality_score: number;
  cost_per_execution: number;
  improvement_opportunities: string[];
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Form Types
export interface CreatePerformanceMetricForm {
  employee_id: string;
  metric_date: string;
  period_type: string;
  productivity_score: number;
  task_completion_rate: number;
  quality_rating: number;
  goals_achieved: number;
  goals_set: number;
  notes?: string;
}

export interface CreateAppointmentForm {
  client_name: string;
  appointment_type: string;
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration_minutes: number;
  assigned_to: string;
  location?: string;
  special_requirements?: string;
}

export interface CreateOrderForm {
  customer_name: string;
  order_type: string;
  priority_level: number;
  total_amount: number;
  assigned_to: string;
  estimated_hours: number;
  special_instructions?: string;
}

// Export all types
export * from './supabase';
