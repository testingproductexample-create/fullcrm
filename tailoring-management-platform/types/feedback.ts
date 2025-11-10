// Complaints & Feedback System TypeScript Interfaces
// Unified Tailoring Management Platform
// Created: 2025-11-11 00:50:09
// Purpose: Type definitions for complaints, feedback, and customer satisfaction management

// =============================================
// ENUM TYPES
// =============================================

export type FeedbackCategoryType = 
  | 'feedback' 
  | 'complaint' 
  | 'suggestion' 
  | 'compliment' 
  | 'inquiry';

export type ComplaintSeverity = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'critical' 
  | 'urgent';

export type ComplaintStatus = 
  | 'submitted' 
  | 'acknowledged' 
  | 'investigating' 
  | 'resolved' 
  | 'closed' 
  | 'escalated';

export type SatisfactionRating = 
  | 'very_dissatisfied' 
  | 'dissatisfied' 
  | 'neutral' 
  | 'satisfied' 
  | 'very_satisfied';

export type SurveyStatus = 
  | 'draft' 
  | 'active' 
  | 'paused' 
  | 'completed' 
  | 'archived';

export type FeedbackSource = 
  | 'web' 
  | 'email' 
  | 'phone' 
  | 'in_person' 
  | 'survey' 
  | 'mobile_app';

export type ResponseType = 
  | 'internal' 
  | 'customer' 
  | 'escalation' 
  | 'follow_up';

export type DeliveryMethod = 
  | 'email' 
  | 'sms' 
  | 'push' 
  | 'in_app' 
  | 'phone';

export type DeliveryStatus = 
  | 'pending' 
  | 'sent' 
  | 'delivered' 
  | 'failed' 
  | 'cancelled';

export type TemplateType = 
  | 'response' 
  | 'escalation' 
  | 'closure' 
  | 'follow_up';

export type SurveyType = 
  | 'general' 
  | 'post_order' 
  | 'post_complaint' 
  | 'periodic' 
  | 'nps' 
  | 'exit';

// =============================================
// CORE INTERFACES
// =============================================

export interface FeedbackCategory {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  category_type: FeedbackCategoryType;
  priority_level: number; // 1-5
  auto_escalate_hours: number;
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CustomerFeedback {
  id: string;
  organization_id: string;
  customer_id?: string;
  order_id?: string;
  branch_id?: string;
  category_id?: string;
  feedback_type: FeedbackCategoryType;
  subject: string;
  description: string;
  severity: ComplaintSeverity;
  status: ComplaintStatus;
  source: FeedbackSource;
  priority_score: number; // 1-10
  is_anonymous: boolean;
  customer_email?: string;
  customer_phone?: string;
  location_details?: string;
  service_date?: string;
  staff_involved?: string;
  expected_resolution_date?: string;
  actual_resolution_date?: string;
  satisfaction_rating?: SatisfactionRating;
  follow_up_required: boolean;
  escalated_at?: string;
  escalated_to?: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Related data (populated via joins)
  category?: FeedbackCategory;
  customer?: any; // Customer interface from existing system
  order?: any; // Order interface from existing system
  branch?: any; // Branch interface from existing system
  resolutions?: ComplaintResolution[];
  responses?: FeedbackResponse[];
  attachments?: FeedbackAttachment[];
}

export interface ComplaintResolution {
  id: string;
  organization_id: string;
  complaint_id: string;
  assigned_to?: string;
  resolution_steps: string[];
  current_step: number;
  resolution_notes?: string;
  time_spent_minutes: number;
  cost_impact: number;
  customer_contacted: boolean;
  contact_method?: string;
  contact_notes?: string;
  resolution_category?: string;
  customer_satisfaction_score?: number; // 1-5
  lessons_learned?: string;
  preventive_actions?: string;
  is_final_resolution: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Related data
  complaint?: CustomerFeedback;
  assigned_employee?: any; // Employee interface from existing system
}

export interface SatisfactionSurvey {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  survey_type: SurveyType;
  status: SurveyStatus;
  questions: SurveyQuestion[];
  trigger_conditions: Record<string, any>;
  target_audience: string;
  send_delay_hours: number;
  reminder_schedule: number[];
  expiry_days: number;
  anonymous_allowed: boolean;
  incentive_offered?: string;
  branch_ids: string[];
  customer_segments: string[];
  start_date?: string;
  end_date?: string;
  response_goal?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Calculated fields
  response_count?: number;
  completion_rate?: number;
  average_satisfaction?: number;
  nps_score?: number;
}

export interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: 'rating' | 'text' | 'multiple_choice' | 'yes_no' | 'nps';
  required: boolean;
  options?: string[];
  rating_scale?: {
    min: number;
    max: number;
    labels?: Record<number, string>;
  };
  order_index: number;
  category?: string;
}

export interface SurveyResponse {
  id: string;
  organization_id: string;
  survey_id: string;
  customer_id?: string;
  order_id?: string;
  branch_id?: string;
  responses: Record<string, any>;
  overall_satisfaction?: number; // 1-5
  nps_score?: number; // 0-10
  completion_percentage: number;
  time_taken_minutes?: number;
  device_type?: string;
  ip_address?: string;
  user_agent?: string;
  is_anonymous: boolean;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  survey?: SatisfactionSurvey;
  customer?: any;
  order?: any;
  branch?: any;
}

export interface FeedbackResponse {
  id: string;
  organization_id: string;
  feedback_id: string;
  response_type: ResponseType;
  message: string;
  response_method?: string;
  is_public: boolean;
  customer_notified: boolean;
  notification_sent_at?: string;
  attachments: string[];
  follow_up_date?: string;
  follow_up_completed: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Related data
  feedback?: CustomerFeedback;
  author?: any; // Employee interface from existing system
}

export interface EscalationRule {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  trigger_conditions: Record<string, any>;
  escalation_hierarchy: string[];
  notification_template?: string;
  auto_assign: boolean;
  escalation_delay_hours: number;
  max_escalation_level: number;
  business_hours_only: boolean;
  priority_levels: number[];
  categories: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface FeedbackAttachment {
  id: string;
  organization_id: string;
  feedback_id: string;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  upload_source: string;
  is_evidence: boolean;
  description?: string;
  created_at: string;
  created_by?: string;
  
  // Related data
  feedback?: CustomerFeedback;
}

export interface FeedbackAnalytics {
  id: string;
  organization_id: string;
  metric_date: string;
  branch_id?: string;
  metric_category: string;
  metric_name: string;
  metric_value: number;
  metric_count: number;
  calculation_method?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Related data
  branch?: any; // Branch interface from existing system
}

export interface ResolutionTemplate {
  id: string;
  organization_id: string;
  name: string;
  category: string;
  template_type: TemplateType;
  subject_template?: string;
  content_template: string;
  variables: Record<string, any>;
  approval_required: boolean;
  auto_apply_conditions: Record<string, any>;
  usage_count: number;
  effectiveness_score?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface FeedbackNotification {
  id: string;
  organization_id: string;
  feedback_id: string;
  notification_type: string;
  recipient_email?: string;
  recipient_phone?: string;
  subject?: string;
  message?: string;
  delivery_method: DeliveryMethod;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  delivery_status: DeliveryStatus;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  scheduled_for?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  feedback?: CustomerFeedback;
}

// =============================================
// REQUEST/RESPONSE TYPES
// =============================================

export interface CreateFeedbackRequest {
  customer_id?: string;
  order_id?: string;
  branch_id?: string;
  category_id?: string;
  feedback_type: FeedbackCategoryType;
  subject: string;
  description: string;
  severity?: ComplaintSeverity;
  source?: FeedbackSource;
  is_anonymous?: boolean;
  customer_email?: string;
  customer_phone?: string;
  location_details?: string;
  service_date?: string;
  staff_involved?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateFeedbackRequest {
  category_id?: string;
  subject?: string;
  description?: string;
  severity?: ComplaintSeverity;
  status?: ComplaintStatus;
  priority_score?: number;
  expected_resolution_date?: string;
  satisfaction_rating?: SatisfactionRating;
  follow_up_required?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateResolutionRequest {
  complaint_id: string;
  assigned_to?: string;
  resolution_steps?: string[];
  resolution_notes?: string;
  contact_method?: string;
  contact_notes?: string;
  resolution_category?: string;
}

export interface UpdateResolutionRequest {
  assigned_to?: string;
  resolution_steps?: string[];
  current_step?: number;
  resolution_notes?: string;
  time_spent_minutes?: number;
  cost_impact?: number;
  customer_contacted?: boolean;
  contact_method?: string;
  contact_notes?: string;
  resolution_category?: string;
  customer_satisfaction_score?: number;
  lessons_learned?: string;
  preventive_actions?: string;
  is_final_resolution?: boolean;
}

export interface CreateSurveyRequest {
  title: string;
  description?: string;
  survey_type?: SurveyType;
  questions: SurveyQuestion[];
  trigger_conditions?: Record<string, any>;
  target_audience?: string;
  send_delay_hours?: number;
  reminder_schedule?: number[];
  expiry_days?: number;
  anonymous_allowed?: boolean;
  incentive_offered?: string;
  branch_ids?: string[];
  customer_segments?: string[];
  start_date?: string;
  end_date?: string;
  response_goal?: number;
}

export interface CreateSurveyResponseRequest {
  survey_id: string;
  customer_id?: string;
  order_id?: string;
  branch_id?: string;
  responses: Record<string, any>;
  overall_satisfaction?: number;
  nps_score?: number;
  completion_percentage: number;
  time_taken_minutes?: number;
  device_type?: string;
  is_anonymous?: boolean;
}

export interface CreateFeedbackResponseRequest {
  feedback_id: string;
  response_type: ResponseType;
  message: string;
  response_method?: string;
  is_public?: boolean;
  attachments?: string[];
  follow_up_date?: string;
}

export interface CreateTemplateRequest {
  name: string;
  category: string;
  template_type: TemplateType;
  subject_template?: string;
  content_template: string;
  variables?: Record<string, any>;
  approval_required?: boolean;
  auto_apply_conditions?: Record<string, any>;
}

// =============================================
// ANALYTICS & REPORTING TYPES
// =============================================

export interface FeedbackMetrics {
  total_feedback: number;
  total_complaints: number;
  total_suggestions: number;
  total_compliments: number;
  resolution_rate: number;
  average_resolution_time: number;
  customer_satisfaction_score: number;
  nps_score: number;
  escalation_rate: number;
  repeat_complaint_rate: number;
}

export interface FeedbackTrend {
  date: string;
  feedback_count: number;
  complaint_count: number;
  satisfaction_score: number;
  resolution_time: number;
}

export interface CategoryAnalytics {
  category_name: string;
  count: number;
  percentage: number;
  avg_resolution_time: number;
  satisfaction_score: number;
  escalation_rate: number;
}

export interface BranchFeedbackMetrics {
  branch_id: string;
  branch_name: string;
  total_feedback: number;
  satisfaction_score: number;
  resolution_time: number;
  complaint_rate: number;
  nps_score: number;
}

export interface SurveyAnalytics {
  survey_id: string;
  survey_title: string;
  response_count: number;
  completion_rate: number;
  average_satisfaction: number;
  nps_score: number;
  response_distribution: Record<string, number>;
}

// =============================================
// FILTER & QUERY TYPES
// =============================================

export interface FeedbackFilters {
  feedback_type?: FeedbackCategoryType[];
  status?: ComplaintStatus[];
  severity?: ComplaintSeverity[];
  source?: FeedbackSource[];
  category_id?: string[];
  branch_id?: string[];
  customer_id?: string[];
  date_from?: string;
  date_to?: string;
  has_attachments?: boolean;
  is_escalated?: boolean;
  satisfaction_rating?: SatisfactionRating[];
  tags?: string[];
  search?: string;
}

export interface SurveyFilters {
  survey_type?: SurveyType[];
  status?: SurveyStatus[];
  branch_id?: string[];
  date_from?: string;
  date_to?: string;
  target_audience?: string[];
  has_responses?: boolean;
}

export interface AnalyticsFilters {
  date_from: string;
  date_to: string;
  branch_id?: string[];
  category_id?: string[];
  metric_category?: string[];
  group_by?: 'day' | 'week' | 'month' | 'quarter';
}

// =============================================
// DASHBOARD TYPES
// =============================================

export interface FeedbackDashboardData {
  metrics: FeedbackMetrics;
  trends: FeedbackTrend[];
  category_analytics: CategoryAnalytics[];
  branch_metrics: BranchFeedbackMetrics[];
  recent_feedback: CustomerFeedback[];
  urgent_complaints: CustomerFeedback[];
  overdue_resolutions: CustomerFeedback[];
  satisfaction_trend: Array<{
    date: string;
    score: number;
  }>;
}

export interface ComplaintWorkflowData {
  pending_assignments: CustomerFeedback[];
  in_progress: CustomerFeedback[];
  escalated: CustomerFeedback[];
  require_follow_up: CustomerFeedback[];
  resolved_today: number;
  average_resolution_time: number;
  overdue_count: number;
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface FeedbackApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    has_more?: boolean;
  };
}

export interface PaginatedFeedbackResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// =============================================
// FORM TYPES
// =============================================

export interface FeedbackFormData extends CreateFeedbackRequest {
  attachments?: File[];
}

export interface SurveyFormData extends CreateSurveyRequest {
  preview_mode?: boolean;
}

export interface ResolutionFormData extends CreateResolutionRequest {
  send_notification?: boolean;
  use_template?: boolean;
  template_id?: string;
}

// =============================================
// UTILITY TYPES
// =============================================

export type FeedbackStatusUpdate = {
  status: ComplaintStatus;
  notes?: string;
  notify_customer?: boolean;
};

export type BulkFeedbackAction = {
  feedback_ids: string[];
  action: 'assign' | 'update_status' | 'add_tags' | 'escalate';
  params: Record<string, any>;
};

export type FeedbackExportFormat = 'csv' | 'excel' | 'pdf';

export type FeedbackExportRequest = {
  filters: FeedbackFilters;
  format: FeedbackExportFormat;
  include_attachments?: boolean;
  date_range?: {
    from: string;
    to: string;
  };
};

// Re-export for convenience
export * from './customer';
export * from './order';
export * from './branch';
export * from './employee';