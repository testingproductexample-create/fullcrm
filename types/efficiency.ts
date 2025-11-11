// ============================================================================
// EFFICIENCY & PERFORMANCE ANALYTICS SYSTEM - TYPESCRIPT TYPES
// ============================================================================
// Purpose: Type definitions for operational efficiency monitoring and analytics
// Created: 2025-11-11
// Tables: All efficiency analytics database entities with full type safety

// ============================================================================
// BASE TYPES AND ENUMS
// ============================================================================

export type MetricType = 'productivity' | 'efficiency' | 'quality' | 'utilization' | 'throughput' | 'cost' | 'time' | 'customer_satisfaction';
export type MetricCategory = 'operations' | 'production' | 'customer_service' | 'inventory' | 'financial' | 'human_resources' | 'quality';
export type TrendDirection = 'improving' | 'declining' | 'stable' | 'volatile';
export type MeasurementPeriod = 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly';

export type CalculationType = 'ratio' | 'percentage' | 'index' | 'rate' | 'productivity_score';
export type BottleneckType = 'capacity' | 'resource' | 'skill' | 'system' | 'workflow' | 'dependency';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
export type ImpactScope = 'department' | 'division' | 'organization' | 'customer_facing';
export type DetectionMethod = 'automated' | 'manual' | 'customer_complaint' | 'audit' | 'monitoring_alert';
export type BottleneckStatus = 'identified' | 'analyzing' | 'resolving' | 'resolved' | 'recurring';

export type ResourceType = 'human' | 'equipment' | 'material' | 'facility' | 'technology' | 'financial';
export type ScopeType = 'individual' | 'team' | 'department' | 'process' | 'organization';

export type OptimizationCategory = 'process' | 'resource' | 'technology' | 'workflow' | 'cost' | 'quality' | 'efficiency';
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';
export type ImplementationComplexity = 'low' | 'medium' | 'high' | 'very_high';
export type RiskLevel = 'low' | 'medium' | 'high';
export type RecommendationStatus = 'pending' | 'approved' | 'implementing' | 'completed' | 'rejected' | 'deferred';

export type AlertType = 'threshold_breach' | 'anomaly_detection' | 'trend_alert' | 'sla_violation' | 'bottleneck_detected';
export type ThresholdType = 'upper_limit' | 'lower_limit' | 'range' | 'percentage_change' | 'duration';
export type AlertStatus = 'active' | 'acknowledged' | 'investigating' | 'resolved' | 'suppressed';

export type BenchmarkType = 'industry' | 'historical' | 'best_practice' | 'competitor' | 'internal';
export type TrendType = 'linear' | 'exponential' | 'logarithmic' | 'polynomial' | 'seasonal' | 'cyclical';
export type TrendStrength = 'strong' | 'moderate' | 'weak' | 'none';

export type TargetType = 'minimum' | 'maximum' | 'exact' | 'range';
export type TargetPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
export type TargetStatus = 'active' | 'achieved' | 'missed' | 'revised' | 'cancelled';

// ============================================================================
// 1. OPERATIONAL EFFICIENCY METRICS
// ============================================================================

export interface EffOperationalMetric {
  id: string;
  organization_id: string;
  
  // Metric Identification
  metric_name: string;
  metric_type: MetricType;
  category: MetricCategory;
  department?: string;
  
  // Metric Values
  current_value: number;
  target_value?: number;
  baseline_value?: number;
  unit_of_measure: string;
  
  // Performance Analysis
  performance_score?: number;
  trend_direction?: TrendDirection;
  variance_percentage?: number;
  
  // Context Information
  measurement_period: MeasurementPeriod;
  data_source: string;
  calculation_method?: string;
  
  // Timestamps
  measured_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOperationalMetricData {
  organization_id: string;
  metric_name: string;
  metric_type: MetricType;
  category: MetricCategory;
  department?: string;
  current_value: number;
  target_value?: number;
  baseline_value?: number;
  unit_of_measure: string;
  performance_score?: number;
  trend_direction?: TrendDirection;
  variance_percentage?: number;
  measurement_period: MeasurementPeriod;
  data_source: string;
  calculation_method?: string;
}

export interface UpdateOperationalMetricData extends Partial<CreateOperationalMetricData> {
  measured_at?: string;
}

// ============================================================================
// 2. EFFICIENCY CALCULATIONS
// ============================================================================

export interface EffCalculation {
  id: string;
  organization_id: string;
  
  // Calculation Identification
  calculation_name: string;
  calculation_type: CalculationType;
  process_name: string;
  department?: string;
  
  // Calculation Values
  input_value?: number;
  output_value?: number;
  efficiency_ratio: number;
  efficiency_percentage: number;
  
  // Benchmark Comparison
  industry_benchmark?: number;
  historical_average?: number;
  performance_gap?: number;
  improvement_potential?: number;
  
  // Calculation Details
  formula_used: string;
  input_sources?: string[];
  calculation_period: string;
  confidence_level?: number;
  
  // Timestamps
  calculated_at: string;
  valid_from: string;
  valid_to: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCalculationData {
  organization_id: string;
  calculation_name: string;
  calculation_type: CalculationType;
  process_name: string;
  department?: string;
  input_value?: number;
  output_value?: number;
  efficiency_ratio: number;
  efficiency_percentage: number;
  industry_benchmark?: number;
  historical_average?: number;
  performance_gap?: number;
  improvement_potential?: number;
  formula_used: string;
  input_sources?: string[];
  calculation_period: string;
  confidence_level?: number;
  valid_from: string;
  valid_to: string;
}

// ============================================================================
// 3. BOTTLENECK ANALYTICS
// ============================================================================

export interface EffBottleneckAnalytic {
  id: string;
  organization_id: string;
  
  // Bottleneck Identification
  bottleneck_name: string;
  process_area: string;
  bottleneck_type: BottleneckType;
  severity_level: SeverityLevel;
  
  // Impact Analysis
  affected_processes?: string[];
  impact_scope: ImpactScope;
  delay_minutes: number;
  cost_impact_daily: number;
  productivity_loss_percentage: number;
  
  // Root Cause Analysis
  root_causes?: string[];
  contributing_factors?: string[];
  frequency_pattern?: string;
  typical_duration_minutes?: number;
  
  // Detection Information
  detection_method: DetectionMethod;
  detection_threshold_exceeded: boolean;
  alert_triggered: boolean;
  
  // Status and Resolution
  status: BottleneckStatus;
  resolution_priority?: number;
  assigned_to?: string;
  estimated_resolution_date?: string;
  
  // Timestamps
  first_detected_at: string;
  last_occurrence_at: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBottleneckData {
  organization_id: string;
  bottleneck_name: string;
  process_area: string;
  bottleneck_type: BottleneckType;
  severity_level: SeverityLevel;
  affected_processes?: string[];
  impact_scope: ImpactScope;
  delay_minutes?: number;
  cost_impact_daily?: number;
  productivity_loss_percentage?: number;
  root_causes?: string[];
  contributing_factors?: string[];
  frequency_pattern?: string;
  typical_duration_minutes?: number;
  detection_method: DetectionMethod;
  detection_threshold_exceeded?: boolean;
  alert_triggered?: boolean;
  resolution_priority?: number;
  assigned_to?: string;
  estimated_resolution_date?: string;
  first_detected_at: string;
}

// ============================================================================
// 4. RESOURCE UTILIZATION
// ============================================================================

export interface EffResourceUtilization {
  id: string;
  organization_id: string;
  
  // Resource Identification
  resource_id: string;
  resource_name: string;
  resource_type: ResourceType;
  resource_category?: string;
  department?: string;
  
  // Utilization Metrics
  total_capacity: number;
  utilized_capacity: number;
  utilization_percentage: number;
  idle_time_minutes: number;
  
  // Efficiency Metrics
  productive_time_percentage?: number;
  efficiency_rating?: number;
  output_per_hour?: number;
  cost_per_unit?: number;
  
  // Performance Analysis
  target_utilization_percentage?: number;
  variance_from_target?: number;
  trend_analysis?: string;
  peak_usage_hours?: number[];
  
  // Quality Metrics
  error_rate_percentage: number;
  rework_required: boolean;
  maintenance_required: boolean;
  
  // Time Period
  measurement_date: string;
  shift_period?: string;
  measurement_duration_hours?: number;
  
  // Timestamps
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateResourceUtilizationData {
  organization_id: string;
  resource_id: string;
  resource_name: string;
  resource_type: ResourceType;
  resource_category?: string;
  department?: string;
  total_capacity: number;
  utilized_capacity: number;
  utilization_percentage: number;
  idle_time_minutes?: number;
  productive_time_percentage?: number;
  efficiency_rating?: number;
  output_per_hour?: number;
  cost_per_unit?: number;
  target_utilization_percentage?: number;
  variance_from_target?: number;
  trend_analysis?: string;
  peak_usage_hours?: number[];
  error_rate_percentage?: number;
  rework_required?: boolean;
  maintenance_required?: boolean;
  measurement_date: string;
  shift_period?: string;
  measurement_duration_hours?: number;
}

// ============================================================================
// 5. PRODUCTIVITY ANALYTICS
// ============================================================================

export interface EffProductivityAnalytic {
  id: string;
  organization_id: string;
  
  // Analysis Scope
  analysis_name: string;
  scope_type: ScopeType;
  scope_identifier?: string;
  time_period: string;
  
  // Productivity Metrics
  output_quantity: number;
  input_hours: number;
  productivity_rate: number;
  productivity_index: number;
  
  // Comparison Metrics
  previous_period_rate?: number;
  percentage_change?: number;
  benchmark_rate?: number;
  performance_vs_benchmark?: number;
  
  // Quality Integration
  quality_score?: number;
  rework_percentage: number;
  first_time_quality: number;
  
  // Cost Analysis
  labor_cost_per_unit?: number;
  overhead_cost_per_unit?: number;
  total_cost_per_unit?: number;
  cost_efficiency_ratio?: number;
  
  // Improvement Potential
  improvement_opportunities?: string[];
  potential_gain_percentage?: number;
  recommended_actions?: string[];
  
  // Analysis Details
  methodology_used?: string;
  data_sources?: string[];
  confidence_interval?: number;
  margin_of_error?: number;
  
  // Timestamps
  analysis_period_start: string;
  analysis_period_end: string;
  analyzed_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductivityAnalyticData {
  organization_id: string;
  analysis_name: string;
  scope_type: ScopeType;
  scope_identifier?: string;
  time_period: string;
  output_quantity: number;
  input_hours: number;
  productivity_rate: number;
  productivity_index: number;
  previous_period_rate?: number;
  percentage_change?: number;
  benchmark_rate?: number;
  performance_vs_benchmark?: number;
  quality_score?: number;
  rework_percentage?: number;
  first_time_quality?: number;
  labor_cost_per_unit?: number;
  overhead_cost_per_unit?: number;
  total_cost_per_unit?: number;
  cost_efficiency_ratio?: number;
  improvement_opportunities?: string[];
  potential_gain_percentage?: number;
  recommended_actions?: string[];
  methodology_used?: string;
  data_sources?: string[];
  confidence_interval?: number;
  margin_of_error?: number;
  analysis_period_start: string;
  analysis_period_end: string;
}

// ============================================================================
// 6. OPTIMIZATION RECOMMENDATIONS
// ============================================================================

export interface EffOptimizationRecommendation {
  id: string;
  organization_id: string;
  
  // Recommendation Details
  title: string;
  description: string;
  category: OptimizationCategory;
  priority_level: PriorityLevel;
  
  // Impact Analysis
  affected_areas?: string[];
  expected_improvement_percentage?: number;
  estimated_cost_savings?: number;
  roi_percentage?: number;
  payback_period_months?: number;
  
  // Implementation Details
  implementation_complexity?: ImplementationComplexity;
  estimated_implementation_days?: number;
  required_resources?: string[];
  prerequisites?: string[];
  
  // Risk Assessment
  implementation_risks?: string[];
  risk_level?: RiskLevel;
  mitigation_strategies?: string[];
  
  // Status Tracking
  status: RecommendationStatus;
  approved_by?: string;
  assigned_to?: string;
  
  // Results Tracking
  actual_improvement_percentage?: number;
  actual_cost_savings?: number;
  implementation_success_rating?: number;
  lessons_learned?: string;
  
  // Timestamps
  generated_at: string;
  approved_at?: string;
  implementation_started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOptimizationRecommendationData {
  organization_id: string;
  title: string;
  description: string;
  category: OptimizationCategory;
  priority_level: PriorityLevel;
  affected_areas?: string[];
  expected_improvement_percentage?: number;
  estimated_cost_savings?: number;
  roi_percentage?: number;
  payback_period_months?: number;
  implementation_complexity?: ImplementationComplexity;
  estimated_implementation_days?: number;
  required_resources?: string[];
  prerequisites?: string[];
  implementation_risks?: string[];
  risk_level?: RiskLevel;
  mitigation_strategies?: string[];
  approved_by?: string;
  assigned_to?: string;
}

// ============================================================================
// 7. PERFORMANCE ALERTS
// ============================================================================

export interface EffPerformanceAlert {
  id: string;
  organization_id: string;
  
  // Alert Details
  alert_name: string;
  alert_type: AlertType;
  severity: SeverityLevel;
  
  // Trigger Information
  metric_source: string;
  threshold_type: ThresholdType;
  threshold_value?: number;
  actual_value?: number;
  variance_percentage?: number;
  
  // Alert Content
  message: string;
  detailed_description?: string;
  affected_systems?: string[];
  recommended_actions?: string[];
  
  // Escalation
  escalation_level: number;
  escalated_to?: string;
  requires_immediate_action: boolean;
  auto_escalate_after_minutes?: number;
  
  // Status and Resolution
  status: AlertStatus;
  acknowledged_by?: string;
  resolved_by?: string;
  resolution_notes?: string;
  
  // Timestamps
  triggered_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePerformanceAlertData {
  organization_id: string;
  alert_name: string;
  alert_type: AlertType;
  severity: SeverityLevel;
  metric_source: string;
  threshold_type: ThresholdType;
  threshold_value?: number;
  actual_value?: number;
  variance_percentage?: number;
  message: string;
  detailed_description?: string;
  affected_systems?: string[];
  recommended_actions?: string[];
  escalation_level?: number;
  escalated_to?: string;
  requires_immediate_action?: boolean;
  auto_escalate_after_minutes?: number;
}

// ============================================================================
// 8. SYSTEM BENCHMARKS
// ============================================================================

export interface EffSystemBenchmark {
  id: string;
  organization_id: string;
  
  // Benchmark Details
  benchmark_name: string;
  benchmark_type: BenchmarkType;
  category: string;
  
  // Benchmark Values
  metric_name: string;
  benchmark_value: number;
  unit_of_measure: string;
  percentile_ranking?: number;
  
  // Source Information
  data_source: string;
  sample_size?: number;
  geographic_scope?: string;
  industry_sector?: string;
  
  // Validity Period
  valid_from: string;
  valid_to: string;
  last_updated: string;
  
  // Metadata
  methodology?: string;
  reliability_score?: number;
  confidence_interval?: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateSystemBenchmarkData {
  organization_id: string;
  benchmark_name: string;
  benchmark_type: BenchmarkType;
  category: string;
  metric_name: string;
  benchmark_value: number;
  unit_of_measure: string;
  percentile_ranking?: number;
  data_source: string;
  sample_size?: number;
  geographic_scope?: string;
  industry_sector?: string;
  valid_from: string;
  valid_to: string;
  last_updated: string;
  methodology?: string;
  reliability_score?: number;
  confidence_interval?: number;
}

// ============================================================================
// 9. TREND ANALYSIS
// ============================================================================

export interface EffTrendAnalysis {
  id: string;
  organization_id: string;
  
  // Analysis Details
  analysis_name: string;
  metric_name: string;
  analysis_period: string;
  data_points_count: number;
  
  // Trend Characteristics
  trend_type: TrendType;
  trend_direction: TrendDirection;
  trend_strength: TrendStrength;
  
  // Statistical Measures
  correlation_coefficient?: number;
  r_squared?: number;
  slope?: number;
  intercept?: number;
  standard_deviation?: number;
  
  // Predictions
  forecast_horizon_days?: number;
  predicted_values?: any;
  prediction_confidence?: number;
  
  // Seasonality Analysis
  seasonal_pattern_detected: boolean;
  seasonal_period_days?: number;
  seasonal_amplitude?: number;
  
  // Analysis Period
  period_start: string;
  period_end: string;
  
  // Timestamps
  analyzed_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTrendAnalysisData {
  organization_id: string;
  analysis_name: string;
  metric_name: string;
  analysis_period: string;
  data_points_count: number;
  trend_type: TrendType;
  trend_direction: TrendDirection;
  trend_strength: TrendStrength;
  correlation_coefficient?: number;
  r_squared?: number;
  slope?: number;
  intercept?: number;
  standard_deviation?: number;
  forecast_horizon_days?: number;
  predicted_values?: any;
  prediction_confidence?: number;
  seasonal_pattern_detected?: boolean;
  seasonal_period_days?: number;
  seasonal_amplitude?: number;
  period_start: string;
  period_end: string;
}

// ============================================================================
// 10. KPI TARGETS
// ============================================================================

export interface EffKpiTarget {
  id: string;
  organization_id: string;
  
  // Target Details
  kpi_name: string;
  kpi_category: string;
  department?: string;
  responsible_person?: string;
  
  // Target Values
  target_value: number;
  unit_of_measure: string;
  target_type: TargetType;
  
  // Range Targets (if applicable)
  min_acceptable_value?: number;
  max_acceptable_value?: number;
  stretch_target?: number;
  
  // Time Frame
  target_period: TargetPeriod;
  start_date: string;
  end_date: string;
  
  // Performance Tracking
  current_value?: number;
  achievement_percentage?: number;
  on_track?: boolean;
  
  // Status
  status: TargetStatus;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateKpiTargetData {
  organization_id: string;
  kpi_name: string;
  kpi_category: string;
  department?: string;
  responsible_person?: string;
  target_value: number;
  unit_of_measure: string;
  target_type: TargetType;
  min_acceptable_value?: number;
  max_acceptable_value?: number;
  stretch_target?: number;
  target_period: TargetPeriod;
  start_date: string;
  end_date: string;
  current_value?: number;
  achievement_percentage?: number;
  on_track?: boolean;
}

// ============================================================================
// DASHBOARD AND ANALYTICS TYPES
// ============================================================================

export interface EfficiencyDashboardMetrics {
  totalMetrics: number;
  activeAlerts: number;
  criticalBottlenecks: number;
  avgEfficiency: number;
  productivityTrend: TrendDirection;
  topRecommendations: EffOptimizationRecommendation[];
  recentAlerts: EffPerformanceAlert[];
  utilizationSummary: {
    human: number;
    equipment: number;
    material: number;
  };
}

export interface BottleneckSummary {
  id: string;
  name: string;
  severity: SeverityLevel;
  impact: number;
  status: BottleneckStatus;
  daysOpen: number;
}

export interface ProductivityTrendData {
  period: string;
  productivity: number;
  efficiency: number;
  quality: number;
}

export interface ResourceUtilizationSummary {
  resourceType: ResourceType;
  totalResources: number;
  avgUtilization: number;
  efficiency: number;
  trend: TrendDirection;
}

export interface OptimizationImpact {
  category: OptimizationCategory;
  totalRecommendations: number;
  implemented: number;
  estimatedSavings: number;
  actualSavings: number;
  roi: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface AnalyticsFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  departments?: string[];
  categories?: MetricCategory[];
  metricTypes?: MetricType[];
  severityLevels?: SeverityLevel[];
  resourceTypes?: ResourceType[];
}