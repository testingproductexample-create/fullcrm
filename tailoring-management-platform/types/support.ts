/**
 * Customer Service & Support Management System - TypeScript Type Definitions
 * 
 * Complete type definitions for support ticket management including:
 * - Support Tickets & Responses
 * - Support Agents & Teams
 * - SLA Policies & Tracking
 * - Escalation Rules & History
 * - Knowledge Base Articles
 * - Customer Satisfaction Surveys
 * - Support Analytics
 */

import { Database } from './supabase';

// ============================================
// DATABASE TABLE TYPES
// ============================================

export type TicketCategory = Database['public']['Tables']['ticket_categories']['Row'];
export type TicketCategoryInsert = Database['public']['Tables']['ticket_categories']['Insert'];
export type TicketCategoryUpdate = Database['public']['Tables']['ticket_categories']['Update'];

export type SupportAgent = Database['public']['Tables']['support_agents']['Row'];
export type SupportAgentInsert = Database['public']['Tables']['support_agents']['Insert'];
export type SupportAgentUpdate = Database['public']['Tables']['support_agents']['Update'];

export type AgentSkill = Database['public']['Tables']['agent_skills']['Row'];
export type AgentSkillInsert = Database['public']['Tables']['agent_skills']['Insert'];
export type AgentSkillUpdate = Database['public']['Tables']['agent_skills']['Update'];

export type SLAPolicy = Database['public']['Tables']['sla_policies']['Row'];
export type SLAPolicyInsert = Database['public']['Tables']['sla_policies']['Insert'];
export type SLAPolicyUpdate = Database['public']['Tables']['sla_policies']['Update'];

export type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
export type SupportTicketInsert = Database['public']['Tables']['support_tickets']['Insert'];
export type SupportTicketUpdate = Database['public']['Tables']['support_tickets']['Update'];

export type TicketResponse = Database['public']['Tables']['ticket_responses']['Row'];
export type TicketResponseInsert = Database['public']['Tables']['ticket_responses']['Insert'];
export type TicketResponseUpdate = Database['public']['Tables']['ticket_responses']['Update'];

export type TicketAssignment = Database['public']['Tables']['ticket_assignments']['Row'];
export type TicketAssignmentInsert = Database['public']['Tables']['ticket_assignments']['Insert'];
export type TicketAssignmentUpdate = Database['public']['Tables']['ticket_assignments']['Update'];

export type SLATracking = Database['public']['Tables']['sla_tracking']['Row'];
export type SLATrackingInsert = Database['public']['Tables']['sla_tracking']['Insert'];
export type SLATrackingUpdate = Database['public']['Tables']['sla_tracking']['Update'];

export type EscalationRule = Database['public']['Tables']['escalation_rules']['Row'];
export type EscalationRuleInsert = Database['public']['Tables']['escalation_rules']['Insert'];
export type EscalationRuleUpdate = Database['public']['Tables']['escalation_rules']['Update'];

export type TicketEscalation = Database['public']['Tables']['ticket_escalations']['Row'];
export type TicketEscalationInsert = Database['public']['Tables']['ticket_escalations']['Insert'];
export type TicketEscalationUpdate = Database['public']['Tables']['ticket_escalations']['Update'];

export type KnowledgeBaseArticle = Database['public']['Tables']['knowledge_base_articles']['Row'];
export type KnowledgeBaseArticleInsert = Database['public']['Tables']['knowledge_base_articles']['Insert'];
export type KnowledgeBaseArticleUpdate = Database['public']['Tables']['knowledge_base_articles']['Update'];

export type CustomerSatisfactionSurvey = Database['public']['Tables']['customer_satisfaction_surveys']['Row'];
export type CustomerSatisfactionSurveyInsert = Database['public']['Tables']['customer_satisfaction_surveys']['Insert'];
export type CustomerSatisfactionSurveyUpdate = Database['public']['Tables']['customer_satisfaction_surveys']['Update'];

export type SupportAnalytics = Database['public']['Tables']['support_analytics']['Row'];
export type SupportAnalyticsInsert = Database['public']['Tables']['support_analytics']['Insert'];
export type SupportAnalyticsUpdate = Database['public']['Tables']['support_analytics']['Update'];

export type TicketTag = Database['public']['Tables']['ticket_tags']['Row'];
export type TicketTagInsert = Database['public']['Tables']['ticket_tags']['Insert'];
export type TicketTagUpdate = Database['public']['Tables']['ticket_tags']['Update'];

export type SupportTeam = Database['public']['Tables']['support_teams']['Row'];
export type SupportTeamInsert = Database['public']['Tables']['support_teams']['Insert'];
export type SupportTeamUpdate = Database['public']['Tables']['support_teams']['Update'];

// ============================================
// ENUM TYPES
// ============================================

export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';

export type TicketStatus = 
  | 'new'
  | 'open'
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'cancelled';

export type AgentStatus = 'available' | 'busy' | 'offline' | 'break';

export type SkillLevel = 'junior' | 'intermediate' | 'senior' | 'expert';

export type ResponseType = 
  | 'agent_reply'
  | 'customer_reply'
  | 'internal_note'
  | 'system_message';

export type AuthorType = 'agent' | 'customer' | 'system';

export type AssignmentType = 
  | 'initial'
  | 'transfer'
  | 'escalation'
  | 'reassignment';

export type EscalationType = 
  | 'automatic'
  | 'manual'
  | 'sla_breach'
  | 'customer_request';

export type EscalationStatus = 
  | 'pending'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'cancelled';

export type SourceChannel = 
  | 'email'
  | 'phone'
  | 'chat'
  | 'web'
  | 'mobile'
  | 'social'
  | 'walk_in';

export type ArticleType = 
  | 'how_to'
  | 'troubleshooting'
  | 'faq'
  | 'policy'
  | 'tutorial'
  | 'reference';

export type SurveyType = 'csat' | 'nps' | 'ces' | 'custom';

export type SurveyStatus = 
  | 'sent'
  | 'opened'
  | 'completed'
  | 'expired'
  | 'declined';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

export interface SupportTicketWithDetails extends SupportTicket {
  category?: TicketCategory;
  assigned_agent?: SupportAgent;
  sla_policy?: SLAPolicy;
  sla_tracking?: SLATracking;
  responses?: TicketResponse[];
  assignments?: TicketAssignment[];
  escalations?: TicketEscalation[];
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  order?: {
    id: string;
    order_number: string;
    status: string;
  };
}

export interface SupportAgentWithDetails extends SupportAgent {
  skills?: AgentSkill[];
  active_tickets?: SupportTicket[];
  team?: SupportTeam;
  performance_metrics?: {
    resolution_rate: number;
    average_rating: number;
    tickets_this_week: number;
    sla_compliance: number;
  };
}

export interface TicketResponseWithDetails extends TicketResponse {
  ticket?: SupportTicket;
  author?: {
    id: string;
    name: string;
    type: AuthorType;
  };
}

export interface KnowledgeBaseArticleWithDetails extends KnowledgeBaseArticle {
  category?: TicketCategory;
  author?: {
    id: string;
    name: string;
  };
  related_articles_details?: KnowledgeBaseArticle[];
  usage_stats?: {
    views: number;
    helpful_rate: number;
    linked_tickets: number;
  };
}

export interface SLATrackingWithDetails extends SLATracking {
  ticket?: SupportTicket;
  policy?: SLAPolicy;
  compliance_status: 'met' | 'at_risk' | 'breached';
  time_remaining_minutes?: number;
}

export interface TicketEscalationWithDetails extends TicketEscalation {
  ticket?: SupportTicket;
  escalated_from_agent?: SupportAgent;
  escalated_to_agent?: SupportAgent;
  rule?: EscalationRule;
}

// ============================================
// DASHBOARD & ANALYTICS TYPES
// ============================================

export interface SupportDashboardMetrics {
  // Ticket Overview
  total_tickets: number;
  open_tickets: number;
  pending_tickets: number;
  resolved_today: number;
  
  // Performance
  average_response_time_minutes: number;
  average_resolution_time_hours: number;
  first_contact_resolution_rate: number;
  sla_compliance_rate: number;
  
  // Agent Metrics
  available_agents: number;
  busy_agents: number;
  average_tickets_per_agent: number;
  agent_utilization_rate: number;
  
  // Satisfaction
  average_csat_score: number;
  average_nps_score: number;
  survey_response_rate: number;
  
  // Escalations
  escalated_tickets: number;
  escalation_rate: number;
  critical_tickets: number;
  
  // Trends
  tickets_trend: Array<{
    date: string;
    created: number;
    resolved: number;
  }>;
  
  // Channel Distribution
  tickets_by_channel: Record<SourceChannel, number>;
  
  // Category Distribution
  tickets_by_category: Array<{
    category_name: string;
    count: number;
    percentage: number;
  }>;
}

export interface AgentPerformanceMetrics {
  agent_id: string;
  agent_name: string;
  
  // Workload
  active_tickets: number;
  total_tickets_handled: number;
  tickets_resolved: number;
  
  // Performance
  average_response_time_minutes: number;
  average_resolution_time_hours: number;
  first_contact_resolution_rate: number;
  
  // SLA
  sla_compliance_rate: number;
  sla_breaches: number;
  
  // Satisfaction
  average_csat_score: number;
  total_surveys_received: number;
  
  // Activity
  last_ticket_assigned: string;
  status: AgentStatus;
  utilization_rate: number;
}

export interface SLAComplianceReport {
  period: string;
  
  // Overall Compliance
  total_tickets: number;
  sla_met_count: number;
  sla_breached_count: number;
  overall_compliance_rate: number;
  
  // Response Time
  first_response_met: number;
  first_response_breached: number;
  average_first_response_minutes: number;
  
  // Resolution Time
  resolution_met: number;
  resolution_breached: number;
  average_resolution_hours: number;
  
  // By Priority
  by_priority: Array<{
    priority: TicketPriority;
    compliance_rate: number;
    breach_count: number;
  }>;
  
  // By Category
  by_category: Array<{
    category_name: string;
    compliance_rate: number;
    breach_count: number;
  }>;
}

export interface TicketAnalytics {
  period: string;
  
  // Volume
  tickets_created: number;
  tickets_resolved: number;
  tickets_closed: number;
  backlog: number;
  
  // Status Distribution
  by_status: Record<TicketStatus, number>;
  
  // Priority Distribution
  by_priority: Record<TicketPriority, number>;
  
  // Resolution Metrics
  average_resolution_time_hours: number;
  first_contact_resolution_rate: number;
  reopen_rate: number;
  
  // Escalation Metrics
  escalated_count: number;
  escalation_rate: number;
  average_escalation_time_hours: number;
}

export interface KnowledgeBaseMetrics {
  total_articles: number;
  published_articles: number;
  draft_articles: number;
  
  // Usage
  total_views: number;
  average_views_per_article: number;
  helpful_rate: number;
  
  // Popular Articles
  most_viewed: Array<{
    article_id: string;
    title: string;
    views: number;
    helpful_rate: number;
  }>;
  
  // Categories
  by_category: Array<{
    category_name: string;
    article_count: number;
    view_count: number;
  }>;
  
  // Impact
  tickets_resolved_via_kb: number;
  estimated_time_saved_hours: number;
}

// ============================================
// FORM & INPUT TYPES
// ============================================

export interface CreateTicketInput {
  ticket_title: string;
  ticket_description: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  category_id?: string;
  priority: TicketPriority;
  order_id?: string;
  source_channel: SourceChannel;
  tags?: string[];
  custom_fields?: Record<string, any>;
}

export interface UpdateTicketInput {
  ticket_title?: string;
  ticket_description?: string;
  category_id?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigned_agent_id?: string;
  tags?: string[];
  internal_notes?: string;
}

export interface CreateTicketResponseInput {
  ticket_id: string;
  response_type: ResponseType;
  response_content: string;
  author_type: AuthorType;
  author_id?: string;
  author_name?: string;
  is_public?: boolean;
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
    type: string;
  }>;
}

export interface AssignTicketInput {
  ticket_id: string;
  agent_id: string;
  assignment_type: AssignmentType;
  assignment_reason?: string;
}

export interface EscalateTicketInput {
  ticket_id: string;
  escalation_reason: string;
  escalation_type: EscalationType;
  escalated_to_agent_id?: string;
  escalated_to_team_id?: string;
  change_priority?: TicketPriority;
}

export interface CreateKBArticleInput {
  article_title: string;
  article_content: string;
  article_summary?: string;
  category_id?: string;
  article_type: ArticleType;
  is_public?: boolean;
  search_tags?: string[];
  related_articles?: string[];
}

export interface CreateSurveyInput {
  ticket_id: string;
  customer_id: string;
  customer_email?: string;
  agent_id?: string;
  survey_type: SurveyType;
}

export interface SubmitSurveyInput {
  survey_id: string;
  overall_rating?: number;
  agent_rating?: number;
  response_time_rating?: number;
  resolution_rating?: number;
  nps_score?: number;
  effort_score?: number;
  feedback_comment?: string;
}

export interface CreateSLAPolicyInput {
  policy_name: string;
  policy_code: string;
  priority_level: TicketPriority;
  first_response_time_hours: number;
  resolution_time_hours: number;
  escalation_time_hours?: number;
  uses_business_hours?: boolean;
}

// ============================================
// FILTER & QUERY TYPES
// ============================================

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category_ids?: string[];
  assigned_agent_ids?: string[];
  customer_id?: string;
  order_id?: string;
  
  source_channel?: SourceChannel[];
  tags?: string[];
  
  created_from?: string;
  created_to?: string;
  due_from?: string;
  due_to?: string;
  
  is_escalated?: boolean;
  is_overdue?: boolean;
  has_sla_breach?: boolean;
  
  search_query?: string;
}

export interface AgentFilters {
  status?: AgentStatus[];
  skill_level?: SkillLevel[];
  team_id?: string;
  is_available?: boolean;
  max_capacity_reached?: boolean;
  search_query?: string;
}

export interface KBArticleFilters {
  category_ids?: string[];
  article_type?: ArticleType[];
  is_published?: boolean;
  is_featured?: boolean;
  author_id?: string;
  search_query?: string;
  tags?: string[];
}

export interface SurveyFilters {
  survey_type?: SurveyType[];
  survey_status?: SurveyStatus[];
  agent_id?: string;
  customer_id?: string;
  rating_min?: number;
  rating_max?: number;
  sentiment?: Sentiment[];
  date_from?: string;
  date_to?: string;
}

// ============================================
// RESPONSE & RESULT TYPES
// ============================================

export interface TicketAssignmentResult {
  success: boolean;
  assigned_agent: SupportAgent;
  assignment_method: 'auto' | 'manual';
  reason?: string;
}

export interface SLACalculationResult {
  first_response_due: string;
  resolution_due: string;
  time_to_breach_minutes: number;
  is_at_risk: boolean;
  breach_risk_level: 'none' | 'low' | 'medium' | 'high';
}

export interface EscalationEligibility {
  is_eligible: boolean;
  reasons: string[];
  suggested_escalation_level: number;
  suggested_agent?: SupportAgent;
  auto_escalate: boolean;
}

export interface AgentAvailability {
  agent_id: string;
  is_available: boolean;
  current_capacity: number;
  max_capacity: number;
  utilization_percentage: number;
  estimated_response_time_minutes: number;
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

export interface TicketActivityLog {
  id: string;
  ticket_id: string;
  activity_type: string;
  description: string;
  performed_by: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SLAStatusBadge {
  label: string;
  color: string;
  is_breached: boolean;
  time_remaining?: string;
}
