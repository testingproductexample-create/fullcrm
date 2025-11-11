/**
 * Marketing & Campaign Management System - TypeScript Type Definitions
 * 
 * Complete type definitions for the marketing automation and campaign management system including:
 * - Marketing Campaigns (Email, SMS, Multi-channel)
 * - Email Templates & Design
 * - Customer Segmentation & Targeting
 * - Campaign Analytics & Performance Tracking
 * - Email Automation Workflows
 * - A/B Testing & Optimization
 * - Marketing Budgets & ROI
 * - Third-party Integrations
 * - Customer Journey Mapping
 */

import { Database } from './supabase';

// ============================================
// DATABASE TABLE TYPES
// ============================================

export type MarketingCampaign = Database['public']['Tables']['marketing_campaigns']['Row'];
export type MarketingCampaignInsert = Database['public']['Tables']['marketing_campaigns']['Insert'];
export type MarketingCampaignUpdate = Database['public']['Tables']['marketing_campaigns']['Update'];

export type EmailTemplate = Database['public']['Tables']['email_templates']['Row'];
export type EmailTemplateInsert = Database['public']['Tables']['email_templates']['Insert'];
export type EmailTemplateUpdate = Database['public']['Tables']['email_templates']['Update'];

export type CustomerSegment = Database['public']['Tables']['customer_segments']['Row'];
export type CustomerSegmentInsert = Database['public']['Tables']['customer_segments']['Insert'];
export type CustomerSegmentUpdate = Database['public']['Tables']['customer_segments']['Update'];

export type CampaignAnalytics = Database['public']['Tables']['campaign_analytics']['Row'];
export type CampaignAnalyticsInsert = Database['public']['Tables']['campaign_analytics']['Insert'];
export type CampaignAnalyticsUpdate = Database['public']['Tables']['campaign_analytics']['Update'];

export type EmailAutomationWorkflow = Database['public']['Tables']['email_automation_workflows']['Row'];
export type EmailAutomationWorkflowInsert = Database['public']['Tables']['email_automation_workflows']['Insert'];
export type EmailAutomationWorkflowUpdate = Database['public']['Tables']['email_automation_workflows']['Update'];

export type WorkflowStep = Database['public']['Tables']['workflow_steps']['Row'];
export type WorkflowStepInsert = Database['public']['Tables']['workflow_steps']['Insert'];
export type WorkflowStepUpdate = Database['public']['Tables']['workflow_steps']['Update'];

export type CampaignRecipient = Database['public']['Tables']['campaign_recipients']['Row'];
export type CampaignRecipientInsert = Database['public']['Tables']['campaign_recipients']['Insert'];
export type CampaignRecipientUpdate = Database['public']['Tables']['campaign_recipients']['Update'];

export type EmailClickTracking = Database['public']['Tables']['email_click_tracking']['Row'];
export type EmailClickTrackingInsert = Database['public']['Tables']['email_click_tracking']['Insert'];
export type EmailClickTrackingUpdate = Database['public']['Tables']['email_click_tracking']['Update'];

export type MarketingBudget = Database['public']['Tables']['marketing_budgets']['Row'];
export type MarketingBudgetInsert = Database['public']['Tables']['marketing_budgets']['Insert'];
export type MarketingBudgetUpdate = Database['public']['Tables']['marketing_budgets']['Update'];

export type MarketingIntegration = Database['public']['Tables']['marketing_integrations']['Row'];
export type MarketingIntegrationInsert = Database['public']['Tables']['marketing_integrations']['Insert'];
export type MarketingIntegrationUpdate = Database['public']['Tables']['marketing_integrations']['Update'];

export type CampaignAbTest = Database['public']['Tables']['campaign_ab_tests']['Row'];
export type CampaignAbTestInsert = Database['public']['Tables']['campaign_ab_tests']['Insert'];
export type CampaignAbTestUpdate = Database['public']['Tables']['campaign_ab_tests']['Update'];

export type CustomerJourneyStage = Database['public']['Tables']['customer_journey_stages']['Row'];
export type CustomerJourneyStageInsert = Database['public']['Tables']['customer_journey_stages']['Insert'];
export type CustomerJourneyStageUpdate = Database['public']['Tables']['customer_journey_stages']['Update'];

// ============================================
// ENUM TYPES
// ============================================

export type CampaignType = 'email' | 'sms' | 'push' | 'multichannel' | 'automated_sequence';

export type TargetAudience = 'all_customers' | 'segment' | 'manual_list';

export type SendType = 'immediate' | 'scheduled' | 'triggered' | 'recurring';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled' | 'completed';

export type AbWinnerMetric = 'open_rate' | 'click_rate' | 'conversion_rate';

export type TemplateType = 'campaign' | 'transactional' | 'automated' | 'newsletter';

export type SegmentCriteriaType = 'demographic' | 'behavioral' | 'transactional' | 'engagement' | 'custom';

export type WorkflowTriggerType = 'welcome' | 'abandoned_cart' | 'birthday' | 'anniversary' | 'behavioral' | 'date_based' | 'api_trigger';

export type WorkflowStepType = 'email' | 'delay' | 'condition' | 'action' | 'split_test';

export type DelayUnit = 'minutes' | 'hours' | 'days' | 'weeks';

export type RecipientSendStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'failed';

export type AbTestVariant = 'A' | 'B';

export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export type IntegrationType = 'email_provider' | 'sms_provider' | 'analytics' | 'crm' | 'ecommerce' | 'social_media' | 'webhook';

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export type AbTestType = 'subject_line' | 'content' | 'send_time' | 'from_name' | 'cta_button';

export type AbTestStatus = 'draft' | 'running' | 'completed' | 'stopped';

export type AbWinnerCriteria = 'open_rate' | 'click_rate' | 'conversion_rate' | 'revenue';

export type JourneyStage = 'awareness' | 'consideration' | 'purchase' | 'retention' | 'advocacy';

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

export interface MarketingCampaignWithRelations extends MarketingCampaign {
  email_template?: EmailTemplate;
  segment?: CustomerSegment;
  analytics?: CampaignAnalytics[];
  recipients?: CampaignRecipient[];
  ab_tests?: CampaignAbTest[];
  click_tracking?: EmailClickTracking[];
  
  // Computed fields
  open_rate?: number;
  click_rate?: number;
  conversion_rate?: number;
  roi_percentage?: number;
  estimated_revenue?: number;
}

export interface EmailTemplateWithMetrics extends EmailTemplate {
  usage_campaigns: number;
  avg_open_rate: number;
  avg_click_rate: number;
  total_sends: number;
  last_used_date?: string;
  performance_score: number;
}

export interface CustomerSegmentWithAnalytics extends CustomerSegment {
  customer_list?: Array<{
    customer_id: string;
    email_address: string;
    full_name: string;
    join_date: string;
    last_order_date?: string;
    total_spent: number;
    engagement_score: number;
  }>;
  
  segment_analytics?: {
    campaign_performance: {
      campaigns_sent: number;
      avg_open_rate: number;
      avg_click_rate: number;
      total_conversions: number;
      total_revenue: number;
    };
    
    growth_metrics: {
      size_change_30d: number;
      size_change_90d: number;
      churn_rate: number;
      engagement_trend: 'up' | 'down' | 'stable';
    };
  };
}

export interface WorkflowWithSteps extends EmailAutomationWorkflow {
  workflow_steps: WorkflowStep[];
  performance_metrics: {
    total_subscribers: number;
    active_subscribers: number;
    completion_rate: number;
    avg_revenue_per_subscriber: number;
    conversion_rate_by_step: Record<string, number>;
  };
}

export interface CampaignAnalyticsWithTrends extends CampaignAnalytics {
  trend_data: {
    previous_period?: CampaignAnalytics;
    percentage_changes: {
      open_rate_change: number;
      click_rate_change: number;
      conversion_rate_change: number;
      revenue_change: number;
    };
  };
  
  benchmarks: {
    industry_open_rate: number;
    industry_click_rate: number;
    company_average_open_rate: number;
    company_average_click_rate: number;
  };
}

export interface AbTestWithResults extends CampaignAbTest {
  results_analysis: {
    winner_declared: boolean;
    confidence_interval: number;
    improvement_percentage: number;
    recommendation: string;
    
    variant_a_metrics: {
      open_rate: number;
      click_rate: number;
      conversion_rate: number;
      revenue_per_recipient: number;
    };
    
    variant_b_metrics: {
      open_rate: number;
      click_rate: number;
      conversion_rate: number;
      revenue_per_recipient: number;
    };
  };
}

export interface MarketingBudgetWithSpending extends MarketingBudget {
  spending_breakdown: {
    categories: Array<{
      category: string;
      budgeted: number;
      spent: number;
      remaining: number;
      percentage_used: number;
    }>;
    
    monthly_trends: Array<{
      month: string;
      total_spent: number;
      campaigns_count: number;
      cost_per_campaign: number;
      roi: number;
    }>;
  };
  
  alerts: Array<{
    type: 'budget_warning' | 'budget_exceeded' | 'low_roi';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

// ============================================
// DASHBOARD & ANALYTICS TYPES
// ============================================

export interface MarketingDashboardMetrics {
  overview: {
    total_campaigns: number;
    active_campaigns: number;
    total_subscribers: number;
    total_revenue_generated: number;
    
    this_month: {
      campaigns_sent: number;
      emails_delivered: number;
      avg_open_rate: number;
      avg_click_rate: number;
      conversion_rate: number;
      revenue_generated: number;
      roi_percentage: number;
    };
    
    previous_month: {
      campaigns_sent: number;
      emails_delivered: number;
      avg_open_rate: number;
      avg_click_rate: number;
      conversion_rate: number;
      revenue_generated: number;
      roi_percentage: number;
    };
    
    percentage_changes: {
      campaigns_change: number;
      open_rate_change: number;
      click_rate_change: number;
      conversion_change: number;
      revenue_change: number;
      roi_change: number;
    };
  };
  
  top_performing_campaigns: MarketingCampaignWithRelations[];
  
  segmentation_insights: {
    most_engaged_segments: CustomerSegment[];
    fastest_growing_segments: CustomerSegment[];
    high_value_segments: CustomerSegment[];
  };
  
  automation_performance: {
    total_workflows: number;
    active_workflows: number;
    avg_completion_rate: number;
    total_automation_revenue: number;
    
    top_workflows: Array<{
      workflow: EmailAutomationWorkflow;
      subscribers: number;
      completion_rate: number;
      revenue_generated: number;
    }>;
  };
  
  budget_overview: {
    total_budget: number;
    total_spent: number;
    remaining_budget: number;
    budget_utilization: number;
    projected_overspend: number;
    cost_per_acquisition: number;
    return_on_ad_spend: number;
  };
}

export interface CampaignPerformanceReport {
  campaign: MarketingCampaignWithRelations;
  
  delivery_metrics: {
    emails_sent: number;
    delivery_rate: number;
    bounce_rate: number;
    unsubscribe_rate: number;
    spam_complaints: number;
  };
  
  engagement_metrics: {
    open_rate: number;
    unique_open_rate: number;
    click_rate: number;
    click_to_open_rate: number;
    time_to_open: number; // Average minutes
    time_to_click: number; // Average minutes
  };
  
  conversion_metrics: {
    conversion_rate: number;
    revenue_generated: number;
    revenue_per_recipient: number;
    cost_per_conversion: number;
    roi_percentage: number;
  };
  
  device_analytics: {
    desktop_opens: number;
    mobile_opens: number;
    tablet_opens: number;
    desktop_clicks: number;
    mobile_clicks: number;
    tablet_clicks: number;
  };
  
  geographic_data: {
    top_countries: Array<{
      country: string;
      opens: number;
      clicks: number;
      conversions: number;
    }>;
    
    top_cities: Array<{
      city: string;
      opens: number;
      clicks: number;
      conversions: number;
    }>;
  };
  
  timeline_data: {
    hourly_opens: Array<{
      hour: number;
      opens: number;
      clicks: number;
    }>;
    
    daily_performance: Array<{
      date: string;
      opens: number;
      clicks: number;
      conversions: number;
      revenue: number;
    }>;
  };
}

export interface SegmentationAnalytics {
  segment: CustomerSegmentWithAnalytics;
  
  demographic_breakdown: {
    age_groups: Record<string, number>;
    gender_distribution: Record<string, number>;
    location_distribution: Record<string, number>;
  };
  
  behavioral_insights: {
    purchase_frequency: {
      frequent_buyers: number; // >5 orders
      regular_buyers: number; // 2-5 orders
      new_buyers: number; // 1 order
      inactive: number; // 0 orders in period
    };
    
    engagement_levels: {
      highly_engaged: number; // >80% email open rate
      moderately_engaged: number; // 40-80% open rate
      low_engaged: number; // 10-40% open rate
      unengaged: number; // <10% open rate
    };
    
    spending_tiers: {
      high_value: number; // Top 20%
      medium_value: number; // Middle 60%
      low_value: number; // Bottom 20%
    };
  };
  
  campaign_performance: {
    best_performing_campaigns: MarketingCampaign[];
    preferred_content_types: string[];
    optimal_send_times: Array<{
      day_of_week: string;
      hour: number;
      engagement_rate: number;
    }>;
  };
  
  lifecycle_stage_distribution: {
    awareness: number;
    consideration: number;
    purchase: number;
    retention: number;
    advocacy: number;
  };
}

// ============================================
// FORM & INPUT TYPES
// ============================================

export interface CreateCampaignInput {
  campaign_name: string;
  campaign_code: string;
  campaign_type: CampaignType;
  campaign_description?: string;
  
  // Email specific
  subject_line?: string;
  email_template_id?: string;
  
  // Targeting
  target_audience: TargetAudience;
  segment_id?: string;
  manual_recipient_list?: string[]; // Email addresses
  
  // Scheduling
  send_type: SendType;
  scheduled_send_date?: string;
  timezone?: string;
  
  // Recurring settings
  is_recurring?: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  
  // A/B Testing
  is_ab_test?: boolean;
  ab_test_percentage?: number;
  ab_winner_metric?: AbWinnerMetric;
  
  // Budget & Goals
  campaign_budget?: number;
  expected_revenue_goal?: number;
  conversion_goal?: number;
}

export interface CreateEmailTemplateInput {
  template_name: string;
  template_code: string;
  template_type: TemplateType;
  
  subject_line: string;
  html_content: string;
  text_content?: string;
  preview_text?: string;
  
  // Design
  template_theme?: string;
  primary_color?: string;
  secondary_color?: string;
  header_image_url?: string;
  footer_content?: string;
  
  // Personalization
  dynamic_content?: Record<string, any>;
  personalization_tags?: string[];
}

export interface CreateCustomerSegmentInput {
  segment_name: string;
  segment_code: string;
  segment_description?: string;
  
  criteria_type: SegmentCriteriaType;
  criteria_rules: SegmentCriteriaRules;
  
  is_dynamic?: boolean;
  targeting_tags?: string[];
  exclude_segments?: string[]; // Segment IDs to exclude
}

export interface SegmentCriteriaRules {
  demographic?: {
    age_min?: number;
    age_max?: number;
    gender?: string[];
    location_countries?: string[];
    location_cities?: string[];
  };
  
  behavioral?: {
    min_orders?: number;
    max_orders?: number;
    last_order_days_ago?: number;
    avg_order_value_min?: number;
    avg_order_value_max?: number;
    total_spent_min?: number;
    total_spent_max?: number;
    preferred_categories?: string[];
  };
  
  engagement?: {
    email_open_rate_min?: number;
    email_click_rate_min?: number;
    last_email_engagement_days?: number;
    website_visits_min?: number;
    loyalty_tier?: string[];
  };
  
  transactional?: {
    first_purchase_date_from?: string;
    first_purchase_date_to?: string;
    last_purchase_date_from?: string;
    last_purchase_date_to?: string;
    purchase_frequency?: 'high' | 'medium' | 'low';
  };
  
  custom?: {
    custom_field_filters: Array<{
      field_name: string;
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
      value: any;
    }>;
  };
}

export interface CreateAutomationWorkflowInput {
  workflow_name: string;
  workflow_code: string;
  workflow_description?: string;
  
  trigger_type: WorkflowTriggerType;
  trigger_conditions: WorkflowTriggerConditions;
  
  entry_conditions?: Record<string, any>;
  exit_conditions?: Record<string, any>;
  
  delay_settings?: {
    initial_delay?: number;
    initial_delay_unit?: DelayUnit;
  };
  
  frequency_cap?: number;
  frequency_period?: 'hour' | 'day' | 'week' | 'month';
}

export interface WorkflowTriggerConditions {
  welcome?: {
    trigger_on_signup: boolean;
    trigger_on_first_purchase: boolean;
    delay_hours: number;
  };
  
  abandoned_cart?: {
    cart_idle_hours: number;
    min_cart_value?: number;
    exclude_completed_purchase: boolean;
  };
  
  birthday?: {
    send_days_before: number;
    time_zone_consideration: boolean;
  };
  
  behavioral?: {
    page_visits?: string[];
    product_views?: string[];
    category_browsing?: string[];
    engagement_score_threshold?: number;
  };
  
  date_based?: {
    anniversary_type: 'signup' | 'first_purchase' | 'custom';
    custom_date_field?: string;
    send_on_exact_date: boolean;
  };
}

export interface CreateWorkflowStepInput {
  workflow_id: string;
  step_name: string;
  step_type: WorkflowStepType;
  step_order: number;
  
  // Email step
  email_template_id?: string;
  personalization_data?: Record<string, any>;
  
  // Delay step
  delay_amount?: number;
  delay_unit?: DelayUnit;
  
  // Condition step
  condition_rules?: {
    field: string;
    operator: string;
    value: any;
    next_step_true?: string;
    next_step_false?: string;
  };
  
  // Split test step
  is_split_test?: boolean;
  split_percentage?: number;
  variant_a_template_id?: string;
  variant_b_template_id?: string;
}

export interface CreateAbTestInput {
  campaign_id: string;
  test_name: string;
  test_type: AbTestType;
  
  variant_a_config: AbTestVariantConfig;
  variant_b_config: AbTestVariantConfig;
  traffic_split_percentage?: number;
  
  winner_criteria: AbWinnerCriteria;
  minimum_sample_size?: number;
  confidence_level?: number;
  test_duration_days?: number;
}

export interface AbTestVariantConfig {
  name: string;
  
  // Subject line test
  subject_line?: string;
  
  // Content test
  email_template_id?: string;
  content_variation?: string;
  
  // Send time test
  send_hour?: number;
  send_day_offset?: number; // Days from original send date
  
  // From name test
  from_name?: string;
  from_email?: string;
  
  // CTA test
  cta_text?: string;
  cta_color?: string;
  cta_position?: string;
}

export interface CreateMarketingBudgetInput {
  budget_name: string;
  budget_period: BudgetPeriod;
  start_date: string;
  end_date: string;
  
  total_budget: number;
  email_marketing_budget?: number;
  sms_marketing_budget?: number;
  automation_budget?: number;
  analytics_budget?: number;
  other_budget?: number;
  
  alert_threshold?: number; // Percentage
}

export interface CreateMarketingIntegrationInput {
  integration_name: string;
  integration_type: IntegrationType;
  provider_name: string;
  
  api_endpoint?: string;
  api_key?: string; // Will be encrypted
  webhook_url?: string;
  configuration_data?: Record<string, any>;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface CampaignSendResult {
  success: boolean;
  campaign_id: string;
  
  send_summary: {
    total_recipients: number;
    emails_queued: number;
    emails_sent: number;
    send_errors: number;
    estimated_delivery_time: string;
  };
  
  errors?: Array<{
    recipient_email: string;
    error_code: string;
    error_message: string;
  }>;
  
  warnings?: string[];
  send_job_id: string;
}

export interface SegmentCalculationResult {
  success: boolean;
  segment_id: string;
  
  calculation_summary: {
    total_customers_matched: number;
    calculation_time_ms: number;
    criteria_breakdown: Record<string, number>;
  };
  
  sample_customers: Array<{
    customer_id: string;
    email_address: string;
    full_name: string;
    match_score: number;
  }>;
  
  errors?: string[];
}

export interface WorkflowExecutionResult {
  success: boolean;
  workflow_id: string;
  execution_id: string;
  
  execution_summary: {
    subscribers_entered: number;
    current_active_subscribers: number;
    steps_completed: number;
    total_steps: number;
    emails_sent: number;
  };
  
  step_results: Array<{
    step_id: string;
    step_name: string;
    subscribers_processed: number;
    emails_sent?: number;
    errors?: number;
    completion_rate: number;
  }>;
}

export interface CampaignPreviewResult {
  success: boolean;
  
  preview_data: {
    subject_line: string;
    html_content: string;
    text_content: string;
    estimated_send_time: string;
  };
  
  validation_results: {
    is_valid: boolean;
    warnings: string[];
    errors: string[];
  };
  
  audience_preview: {
    total_recipients: number;
    sample_recipients: Array<{
      email_address: string;
      personalization_preview: Record<string, string>;
    }>;
  };
  
  deliverability_score: {
    score: number; // 0-100
    spam_risk: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
}

export interface EmailDeliverabilityAnalysis {
  overall_score: number; // 0-100
  
  content_analysis: {
    spam_words_count: number;
    spam_words_found: string[];
    html_to_text_ratio: number;
    image_to_text_ratio: number;
    link_count: number;
    suspicious_links: string[];
  };
  
  technical_analysis: {
    spf_record_valid: boolean;
    dkim_configured: boolean;
    dmarc_policy: string;
    reputation_score: number;
  };
  
  recommendations: Array<{
    category: 'content' | 'technical' | 'reputation';
    priority: 'high' | 'medium' | 'low';
    issue: string;
    recommendation: string;
  }>;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_more: boolean;
}

export interface DateRangeOption {
  label: string;
  value: string;
  start_date: string;
  end_date: string;
}

export interface CampaignStatusBadgeProps {
  status: CampaignStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export interface PerformanceMetricProps {
  value: number;
  label: string;
  format: 'percentage' | 'number' | 'currency' | 'decimal';
  trend?: 'up' | 'down' | 'neutral';
  benchmark?: number;
}

export interface SegmentCriteriaDisplayProps {
  criteria: SegmentCriteriaRules;
  isEditable?: boolean;
  onUpdate?: (criteria: SegmentCriteriaRules) => void;
}

export interface CampaignTypeIconProps {
  type: CampaignType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface EmailTemplatePreviewProps {
  template: EmailTemplate;
  personalization_data?: Record<string, string>;
  viewport?: 'desktop' | 'mobile';
}

export interface WorkflowStepVisualizerProps {
  steps: WorkflowStep[];
  currentStep?: string;
  onStepClick?: (step: WorkflowStep) => void;
  isEditable?: boolean;
}

// ============================================
// FILTER & SEARCH TYPES
// ============================================

export interface CampaignFilters {
  status?: CampaignStatus[];
  campaign_type?: CampaignType[];
  date_range?: {
    start_date: string;
    end_date: string;
  };
  created_by?: string[];
  segment_ids?: string[];
  performance_threshold?: {
    min_open_rate?: number;
    min_click_rate?: number;
    min_conversion_rate?: number;
  };
  search_query?: string;
}

export interface SegmentFilters {
  criteria_type?: SegmentCriteriaType[];
  is_dynamic?: boolean;
  is_active?: boolean;
  size_range?: {
    min_customers: number;
    max_customers: number;
  };
  engagement_range?: {
    min_engagement_rate: number;
    max_engagement_rate: number;
  };
  search_query?: string;
}

export interface AnalyticsFilters {
  date_range: {
    start_date: string;
    end_date: string;
  };
  campaign_ids?: string[];
  segment_ids?: string[];
  device_types?: DeviceType[];
  countries?: string[];
  metric_thresholds?: {
    min_open_rate?: number;
    min_click_rate?: number;
    min_revenue?: number;
  };
}

// ============================================
// CHART & VISUALIZATION TYPES
// ============================================

export interface MetricTrendData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension?: number;
  }>;
}

export interface PerformanceHeatmapData {
  x_labels: string[]; // Hours or days
  y_labels: string[]; // Days or campaigns
  data_points: Array<{
    x: number;
    y: number;
    value: number;
    label?: string;
  }>;
}

export interface ConversionFunnelData {
  stages: Array<{
    stage_name: string;
    count: number;
    percentage: number;
    drop_off_rate?: number;
  }>;
}

export interface SegmentDistributionData {
  segments: Array<{
    segment_name: string;
    customer_count: number;
    percentage: number;
    color: string;
  }>;
}