/**
 * Marketing & Campaign Management System - React Query Hooks
 * 
 * Comprehensive data fetching and mutation hooks for:
 * - Marketing Campaigns & Email Marketing
 * - Email Templates & Design
 * - Customer Segmentation & Targeting
 * - Campaign Analytics & Performance
 * - Email Automation Workflows
 * - A/B Testing & Optimization
 * - Marketing Budgets & ROI Tracking
 * - Third-party Integrations
 * - Customer Journey Management
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import {
  MarketingCampaign, MarketingCampaignInsert, MarketingCampaignUpdate,
  EmailTemplate, EmailTemplateInsert, EmailTemplateUpdate,
  CustomerSegment, CustomerSegmentInsert, CustomerSegmentUpdate,
  CampaignAnalytics, CampaignAnalyticsInsert, CampaignAnalyticsUpdate,
  EmailAutomationWorkflow, EmailAutomationWorkflowInsert, EmailAutomationWorkflowUpdate,
  WorkflowStep, WorkflowStepInsert, WorkflowStepUpdate,
  CampaignRecipient, CampaignRecipientInsert, CampaignRecipientUpdate,
  EmailClickTracking, EmailClickTrackingInsert,
  MarketingBudget, MarketingBudgetInsert, MarketingBudgetUpdate,
  MarketingIntegration, MarketingIntegrationInsert, MarketingIntegrationUpdate,
  CampaignAbTest, CampaignAbTestInsert, CampaignAbTestUpdate,
  CustomerJourneyStage, CustomerJourneyStageInsert, CustomerJourneyStageUpdate,
  MarketingCampaignWithRelations,
  EmailTemplateWithMetrics,
  CustomerSegmentWithAnalytics,
  WorkflowWithSteps,
  CampaignAnalyticsWithTrends,
  AbTestWithResults,
  MarketingBudgetWithSpending,
  MarketingDashboardMetrics,
  CampaignPerformanceReport,
  SegmentationAnalytics,
  CreateCampaignInput,
  CreateEmailTemplateInput,
  CreateCustomerSegmentInput,
  SegmentCriteriaRules,
  CreateAutomationWorkflowInput,
  CreateWorkflowStepInput,
  CreateAbTestInput,
  CreateMarketingBudgetInput,
  CreateMarketingIntegrationInput,
  CampaignSendResult,
  SegmentCalculationResult,
  WorkflowExecutionResult,
  CampaignPreviewResult,
  EmailDeliverabilityAnalysis,
  CampaignFilters,
  SegmentFilters,
  AnalyticsFilters,
  PaginatedResponse,
} from '@/types/marketing';

// ============================================
// QUERY KEYS
// ============================================

export const marketingKeys = {
  all: ['marketing'] as const,
  campaigns: (filters?: CampaignFilters) => [...marketingKeys.all, 'campaigns', filters] as const,
  campaign: (id: string) => [...marketingKeys.all, 'campaign', id] as const,
  campaignWithRelations: (id: string) => [...marketingKeys.all, 'campaign-relations', id] as const,
  campaignAnalytics: (campaignId: string, dateRange?: { from: string; to: string }) => [...marketingKeys.all, 'campaign-analytics', campaignId, dateRange] as const,
  campaignRecipients: (campaignId: string) => [...marketingKeys.all, 'campaign-recipients', campaignId] as const,
  templates: (templateType?: string) => [...marketingKeys.all, 'templates', templateType] as const,
  template: (id: string) => [...marketingKeys.all, 'template', id] as const,
  templateWithMetrics: (id: string) => [...marketingKeys.all, 'template-metrics', id] as const,
  segments: (filters?: SegmentFilters) => [...marketingKeys.all, 'segments', filters] as const,
  segment: (id: string) => [...marketingKeys.all, 'segment', id] as const,
  segmentWithAnalytics: (id: string) => [...marketingKeys.all, 'segment-analytics', id] as const,
  segmentCustomers: (segmentId: string) => [...marketingKeys.all, 'segment-customers', segmentId] as const,
  workflows: (isActive?: boolean) => [...marketingKeys.all, 'workflows', isActive] as const,
  workflow: (id: string) => [...marketingKeys.all, 'workflow', id] as const,
  workflowWithSteps: (id: string) => [...marketingKeys.all, 'workflow-steps', id] as const,
  workflowSteps: (workflowId: string) => [...marketingKeys.all, 'steps', workflowId] as const,
  abTests: (campaignId?: string) => [...marketingKeys.all, 'ab-tests', campaignId] as const,
  abTest: (id: string) => [...marketingKeys.all, 'ab-test', id] as const,
  abTestResults: (id: string) => [...marketingKeys.all, 'ab-test-results', id] as const,
  budgets: (period?: string) => [...marketingKeys.all, 'budgets', period] as const,
  budget: (id: string) => [...marketingKeys.all, 'budget', id] as const,
  budgetWithSpending: (id: string) => [...marketingKeys.all, 'budget-spending', id] as const,
  integrations: (type?: string) => [...marketingKeys.all, 'integrations', type] as const,
  integration: (id: string) => [...marketingKeys.all, 'integration', id] as const,
  journeyStages: (customerId?: string) => [...marketingKeys.all, 'journey-stages', customerId] as const,
  clickTracking: (campaignId: string) => [...marketingKeys.all, 'click-tracking', campaignId] as const,
  analytics: (filters?: AnalyticsFilters) => [...marketingKeys.all, 'analytics', filters] as const,
  dashboard: (dateRange?: { from: string; to: string }) => [...marketingKeys.all, 'dashboard', dateRange] as const,
  performanceReport: (campaignId: string) => [...marketingKeys.all, 'performance-report', campaignId] as const,
  segmentationAnalytics: (segmentId: string) => [...marketingKeys.all, 'segmentation-analytics', segmentId] as const,
};

// ============================================
// MARKETING CAMPAIGNS HOOKS
// ============================================

/**
 * Fetch all marketing campaigns with filters
 */
export function useMarketingCampaigns(filters?: CampaignFilters): UseQueryResult<PaginatedResponse<MarketingCampaign>, Error> {
  return useQuery({
    queryKey: marketingKeys.campaigns(filters),
    queryFn: async () => {
      let query = supabase
        .from('marketing_campaigns')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.campaign_type?.length) {
        query = query.in('campaign_type', filters.campaign_type);
      }
      if (filters?.date_range) {
        query = query
          .gte('created_at', filters.date_range.start_date)
          .lte('created_at', filters.date_range.end_date);
      }
      if (filters?.created_by?.length) {
        query = query.in('created_by', filters.created_by);
      }
      if (filters?.segment_ids?.length) {
        query = query.in('segment_id', filters.segment_ids);
      }
      if (filters?.search_query) {
        query = query.or(`campaign_name.ilike.%${filters.search_query}%,subject_line.ilike.%${filters.search_query}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      return {
        data: data || [],
        total_count: count || 0,
        page: 1,
        page_size: data?.length || 0,
        total_pages: Math.ceil((count || 0) / (data?.length || 1)),
        has_more: false,
      };
    },
  });
}

/**
 * Fetch single marketing campaign
 */
export function useMarketingCampaign(campaignId: string): UseQueryResult<MarketingCampaign, Error> {
  return useQuery({
    queryKey: marketingKeys.campaign(campaignId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });
}

/**
 * Fetch campaign with relations (template, segment, analytics)
 */
export function useMarketingCampaignWithRelations(campaignId: string): UseQueryResult<MarketingCampaignWithRelations, Error> {
  return useQuery({
    queryKey: marketingKeys.campaignWithRelations(campaignId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select(`
          *,
          email_template:email_templates(*),
          segment:customer_segments(*),
          analytics:campaign_analytics(*),
          recipients:campaign_recipients(count),
          ab_tests:campaign_ab_tests(*),
          click_tracking:email_click_tracking(count)
        `)
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      
      // Calculate computed metrics
      const campaign = data as MarketingCampaignWithRelations;
      if (campaign.analytics?.length) {
        const latest = campaign.analytics?.[0];
        if (latest) {
          campaign.open_rate = latest.open_rate;
          campaign.click_rate = latest.click_rate;
          campaign.conversion_rate = latest.conversion_rate;
          campaign.roi_percentage = latest.roi_percentage;
          campaign.estimated_revenue = latest.revenue_generated;
        }
      }

      return campaign;
    },
    enabled: !!campaignId,
  });
}

/**
 * Create new marketing campaign
 */
export function useCreateMarketingCampaign(): UseMutationResult<MarketingCampaign, Error, CreateCampaignInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignData: CreateCampaignInput) => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          ...campaignData,
          created_by: (await supabase.auth.getUser()).data.user?.id || '',
          last_modified_by: (await supabase.auth.getUser()).data.user?.id || '',
        } as MarketingCampaignInsert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.dashboard() });
    },
  });
}

/**
 * Update marketing campaign
 */
export function useUpdateMarketingCampaign(): UseMutationResult<MarketingCampaign, Error, { id: string; updates: MarketingCampaignUpdate }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .update({
          ...updates,
          last_modified_by: (await supabase.auth.getUser()).data.user?.id || '',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaign(data.id) });
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaignWithRelations(data.id) });
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() });
    },
  });
}

/**
 * Delete marketing campaign
 */
export function useDeleteMarketingCampaign(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaigns() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.dashboard() });
    },
  });
}

/**
 * Send campaign
 */
export function useSendCampaign(): UseMutationResult<CampaignSendResult, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string): Promise<CampaignSendResult> => {
      // In production, this would trigger a Supabase Edge Function
      // For now, return a mock result
      return {
        success: true,
        campaign_id: campaignId,
        send_summary: {
          total_recipients: 0,
          emails_queued: 0,
          emails_sent: 0,
          send_errors: 0,
          estimated_delivery_time: '5-10 minutes',
        },
        send_job_id: `job_${campaignId}_${Date.now()}`,
      };
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaign(campaignId) });
      queryClient.invalidateQueries({ queryKey: marketingKeys.campaignRecipients(campaignId) });
    },
  });
}

/**
 * Preview campaign
 */
export function useCampaignPreview(): UseMutationResult<CampaignPreviewResult, Error, string> {
  return useMutation({
    mutationFn: async (campaignId: string): Promise<CampaignPreviewResult> => {
      // Mock preview data
      return {
        success: true,
        preview_data: {
          subject_line: 'Your Subject Line',
          html_content: '<html>Your email content</html>',
          text_content: 'Your email content',
          estimated_send_time: '2025-11-10 16:00:00',
        },
        validation_results: {
          is_valid: true,
          warnings: [],
          errors: [],
        },
        audience_preview: {
          total_recipients: 0,
          sample_recipients: [],
        },
        deliverability_score: {
          score: 85,
          spam_risk: 'low',
          recommendations: [],
        },
      };
    },
  });
}

// ============================================
// EMAIL TEMPLATES HOOKS
// ============================================

/**
 * Fetch email templates
 */
export function useEmailTemplates(templateType?: string): UseQueryResult<EmailTemplate[], Error> {
  return useQuery({
    queryKey: marketingKeys.templates(templateType),
    queryFn: async () => {
      let query = supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (templateType) {
        query = query.eq('template_type', templateType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch single email template
 */
export function useEmailTemplate(templateId: string): UseQueryResult<EmailTemplate, Error> {
  return useQuery({
    queryKey: marketingKeys.template(templateId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!templateId,
  });
}

/**
 * Fetch template with usage metrics
 */
export function useEmailTemplateWithMetrics(templateId: string): UseQueryResult<EmailTemplateWithMetrics, Error> {
  return useQuery({
    queryKey: marketingKeys.templateWithMetrics(templateId),
    queryFn: async () => {
      // This would aggregate campaign metrics for this template
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      // Add mock metrics
      const templateWithMetrics: EmailTemplateWithMetrics = {
        ...data,
        usage_campaigns: 0,
        avg_open_rate: 0,
        avg_click_rate: 0,
        total_sends: 0,
        performance_score: 0,
      };

      return templateWithMetrics;
    },
    enabled: !!templateId,
  });
}

/**
 * Create email template
 */
export function useCreateEmailTemplate(): UseMutationResult<EmailTemplate, Error, CreateEmailTemplateInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: CreateEmailTemplateInput) => {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          ...templateData,
          created_by: (await supabase.auth.getUser()).data.user?.id || '',
          last_modified_by: (await supabase.auth.getUser()).data.user?.id || '',
        } as EmailTemplateInsert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.templates() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.templates(data.template_type) });
    },
  });
}

/**
 * Update email template
 */
export function useUpdateEmailTemplate(): UseMutationResult<EmailTemplate, Error, { id: string; updates: EmailTemplateUpdate }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('email_templates')
        .update({
          ...updates,
          last_modified_by: (await supabase.auth.getUser()).data.user?.id || '',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.template(data.id) });
      queryClient.invalidateQueries({ queryKey: marketingKeys.templates() });
    },
  });
}

/**
 * Delete email template
 */
export function useDeleteEmailTemplate(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.templates() });
    },
  });
}

// ============================================
// CUSTOMER SEGMENTS HOOKS
// ============================================

/**
 * Fetch customer segments with filters
 */
export function useCustomerSegments(filters?: SegmentFilters): UseQueryResult<CustomerSegment[], Error> {
  return useQuery({
    queryKey: marketingKeys.segments(filters),
    queryFn: async () => {
      let query = supabase
        .from('customer_segments')
        .select('*')
        .eq('is_active', filters?.is_active ?? true)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.criteria_type?.length) {
        query = query.in('criteria_type', filters.criteria_type);
      }
      if (filters?.is_dynamic !== undefined) {
        query = query.eq('is_dynamic', filters.is_dynamic);
      }
      if (filters?.search_query) {
        query = query.or(`segment_name.ilike.%${filters.search_query}%,segment_description.ilike.%${filters.search_query}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch single customer segment
 */
export function useCustomerSegment(segmentId: string): UseQueryResult<CustomerSegment, Error> {
  return useQuery({
    queryKey: marketingKeys.segment(segmentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('id', segmentId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!segmentId,
  });
}

/**
 * Fetch segment with analytics
 */
export function useCustomerSegmentWithAnalytics(segmentId: string): UseQueryResult<CustomerSegmentWithAnalytics, Error> {
  return useQuery({
    queryKey: marketingKeys.segmentWithAnalytics(segmentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('id', segmentId)
        .single();

      if (error) throw error;

      // Add mock analytics
      const segmentWithAnalytics: CustomerSegmentWithAnalytics = {
        ...data,
        customer_list: [],
        segment_analytics: {
          campaign_performance: {
            campaigns_sent: 0,
            avg_open_rate: 0,
            avg_click_rate: 0,
            total_conversions: 0,
            total_revenue: 0,
          },
          growth_metrics: {
            size_change_30d: 0,
            size_change_90d: 0,
            churn_rate: 0,
            engagement_trend: 'stable',
          },
        },
      };

      return segmentWithAnalytics;
    },
    enabled: !!segmentId,
  });
}

/**
 * Create customer segment
 */
export function useCreateCustomerSegment(): UseMutationResult<CustomerSegment, Error, CreateCustomerSegmentInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (segmentData: CreateCustomerSegmentInput) => {
      const { data, error } = await supabase
        .from('customer_segments')
        .insert({
          ...segmentData,
          created_by: (await supabase.auth.getUser()).data.user?.id || '',
          last_modified_by: (await supabase.auth.getUser()).data.user?.id || '',
        } as CustomerSegmentInsert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.segments() });
    },
  });
}

/**
 * Update customer segment
 */
export function useUpdateCustomerSegment(): UseMutationResult<CustomerSegment, Error, { id: string; updates: CustomerSegmentUpdate }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('customer_segments')
        .update({
          ...updates,
          last_modified_by: (await supabase.auth.getUser()).data.user?.id || '',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.segment(data.id) });
      queryClient.invalidateQueries({ queryKey: marketingKeys.segments() });
    },
  });
}

/**
 * Calculate segment
 */
export function useCalculateSegment(): UseMutationResult<SegmentCalculationResult, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (segmentId: string): Promise<SegmentCalculationResult> => {
      // Mock calculation result
      return {
        success: true,
        segment_id: segmentId,
        calculation_summary: {
          total_customers_matched: 0,
          calculation_time_ms: 150,
          criteria_breakdown: {},
        },
        sample_customers: [],
      };
    },
    onSuccess: (_, segmentId) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.segment(segmentId) });
    },
  });
}

/**
 * Delete customer segment
 */
export function useDeleteCustomerSegment(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (segmentId: string) => {
      const { error } = await supabase
        .from('customer_segments')
        .delete()
        .eq('id', segmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.segments() });
    },
  });
}

// ============================================
// AUTOMATION WORKFLOWS HOOKS
// ============================================

/**
 * Fetch automation workflows
 */
export function useAutomationWorkflows(isActive?: boolean): UseQueryResult<EmailAutomationWorkflow[], Error> {
  return useQuery({
    queryKey: marketingKeys.workflows(isActive),
    queryFn: async () => {
      let query = supabase
        .from('email_automation_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch workflow with steps
 */
export function useWorkflowWithSteps(workflowId: string): UseQueryResult<WorkflowWithSteps, Error> {
  return useQuery({
    queryKey: marketingKeys.workflowWithSteps(workflowId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_automation_workflows')
        .select(`
          *,
          workflow_steps(*)
        `)
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      // Add mock performance metrics
      const workflowWithSteps: WorkflowWithSteps = {
        ...data,
        workflow_steps: data.workflow_steps || [],
        performance_metrics: {
          total_subscribers: 0,
          active_subscribers: 0,
          completion_rate: 0,
          avg_revenue_per_subscriber: 0,
          conversion_rate_by_step: {},
        },
      };

      return workflowWithSteps;
    },
    enabled: !!workflowId,
  });
}

/**
 * Create automation workflow
 */
export function useCreateAutomationWorkflow(): UseMutationResult<EmailAutomationWorkflow, Error, CreateAutomationWorkflowInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workflowData: CreateAutomationWorkflowInput) => {
      const { data, error } = await supabase
        .from('email_automation_workflows')
        .insert({
          ...workflowData,
          created_by: (await supabase.auth.getUser()).data.user?.id || '',
          last_modified_by: (await supabase.auth.getUser()).data.user?.id || '',
        } as EmailAutomationWorkflowInsert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.workflows() });
    },
  });
}

/**
 * Update automation workflow
 */
export function useUpdateAutomationWorkflow(): UseMutationResult<EmailAutomationWorkflow, Error, { id: string; updates: EmailAutomationWorkflowUpdate }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('email_automation_workflows')
        .update({
          ...updates,
          last_modified_by: (await supabase.auth.getUser()).data.user?.id || '',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.workflow(data.id) });
      queryClient.invalidateQueries({ queryKey: marketingKeys.workflows() });
    },
  });
}

/**
 * Execute workflow
 */
export function useExecuteWorkflow(): UseMutationResult<WorkflowExecutionResult, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workflowId: string): Promise<WorkflowExecutionResult> => {
      // Mock execution result
      return {
        success: true,
        workflow_id: workflowId,
        execution_id: `exec_${workflowId}_${Date.now()}`,
        execution_summary: {
          subscribers_entered: 0,
          current_active_subscribers: 0,
          steps_completed: 0,
          total_steps: 0,
          emails_sent: 0,
        },
        step_results: [],
      };
    },
    onSuccess: (_, workflowId) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.workflow(workflowId) });
    },
  });
}

// ============================================
// A/B TESTING HOOKS
// ============================================

/**
 * Fetch A/B tests for a campaign
 */
export function useCampaignAbTests(campaignId?: string): UseQueryResult<CampaignAbTest[], Error> {
  return useQuery({
    queryKey: marketingKeys.abTests(campaignId),
    queryFn: async () => {
      let query = supabase
        .from('campaign_ab_tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch A/B test with results
 */
export function useAbTestWithResults(testId: string): UseQueryResult<AbTestWithResults, Error> {
  return useQuery({
    queryKey: marketingKeys.abTestResults(testId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_ab_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (error) throw error;

      // Add mock results analysis
      const abTestWithResults: AbTestWithResults = {
        ...data,
        results_analysis: {
          winner_declared: false,
          confidence_interval: 0,
          improvement_percentage: 0,
          recommendation: 'Continue test',
          variant_a_metrics: {
            open_rate: 0,
            click_rate: 0,
            conversion_rate: 0,
            revenue_per_recipient: 0,
          },
          variant_b_metrics: {
            open_rate: 0,
            click_rate: 0,
            conversion_rate: 0,
            revenue_per_recipient: 0,
          },
        },
      };

      return abTestWithResults;
    },
    enabled: !!testId,
  });
}

/**
 * Create A/B test
 */
export function useCreateAbTest(): UseMutationResult<CampaignAbTest, Error, CreateAbTestInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testData: CreateAbTestInput) => {
      const { data, error } = await supabase
        .from('campaign_ab_tests')
        .insert({
          ...testData,
          created_by: (await supabase.auth.getUser()).data.user?.id || '',
        } as CampaignAbTestInsert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.abTests(data.campaign_id) });
    },
  });
}

// ============================================
// MARKETING BUDGETS HOOKS
// ============================================

/**
 * Fetch marketing budgets
 */
export function useMarketingBudgets(period?: string): UseQueryResult<MarketingBudget[], Error> {
  return useQuery({
    queryKey: marketingKeys.budgets(period),
    queryFn: async () => {
      let query = supabase
        .from('marketing_budgets')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      if (period) {
        query = query.eq('budget_period', period);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch budget with spending breakdown
 */
export function useMarketingBudgetWithSpending(budgetId: string): UseQueryResult<MarketingBudgetWithSpending, Error> {
  return useQuery({
    queryKey: marketingKeys.budgetWithSpending(budgetId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_budgets')
        .select('*')
        .eq('id', budgetId)
        .single();

      if (error) throw error;

      // Add mock spending breakdown
      const budgetWithSpending: MarketingBudgetWithSpending = {
        ...data,
        spending_breakdown: {
          categories: [],
          monthly_trends: [],
        },
        alerts: [],
      };

      return budgetWithSpending;
    },
    enabled: !!budgetId,
  });
}

/**
 * Create marketing budget
 */
export function useCreateMarketingBudget(): UseMutationResult<MarketingBudget, Error, CreateMarketingBudgetInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budgetData: CreateMarketingBudgetInput) => {
      const { data, error } = await supabase
        .from('marketing_budgets')
        .insert({
          ...budgetData,
          created_by: (await supabase.auth.getUser()).data.user?.id || '',
          last_modified_by: (await supabase.auth.getUser()).data.user?.id || '',
        } as MarketingBudgetInsert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.budgets() });
    },
  });
}

// ============================================
// ANALYTICS & DASHBOARD HOOKS
// ============================================

/**
 * Fetch marketing dashboard metrics
 */
export function useMarketingDashboard(dateRange?: { from: string; to: string }): UseQueryResult<MarketingDashboardMetrics, Error> {
  return useQuery({
    queryKey: marketingKeys.dashboard(dateRange),
    queryFn: async (): Promise<MarketingDashboardMetrics> => {
      // Mock dashboard data
      return {
        overview: {
          total_campaigns: 0,
          active_campaigns: 0,
          total_subscribers: 0,
          total_revenue_generated: 0,
          this_month: {
            campaigns_sent: 0,
            emails_delivered: 0,
            avg_open_rate: 0,
            avg_click_rate: 0,
            conversion_rate: 0,
            revenue_generated: 0,
            roi_percentage: 0,
          },
          previous_month: {
            campaigns_sent: 0,
            emails_delivered: 0,
            avg_open_rate: 0,
            avg_click_rate: 0,
            conversion_rate: 0,
            revenue_generated: 0,
            roi_percentage: 0,
          },
          percentage_changes: {
            campaigns_change: 0,
            open_rate_change: 0,
            click_rate_change: 0,
            conversion_change: 0,
            revenue_change: 0,
            roi_change: 0,
          },
        },
        top_performing_campaigns: [],
        segmentation_insights: {
          most_engaged_segments: [],
          fastest_growing_segments: [],
          high_value_segments: [],
        },
        automation_performance: {
          total_workflows: 0,
          active_workflows: 0,
          avg_completion_rate: 0,
          total_automation_revenue: 0,
          top_workflows: [],
        },
        budget_overview: {
          total_budget: 0,
          total_spent: 0,
          remaining_budget: 0,
          budget_utilization: 0,
          projected_overspend: 0,
          cost_per_acquisition: 0,
          return_on_ad_spend: 0,
        },
      };
    },
  });
}

/**
 * Fetch campaign performance report
 */
export function useCampaignPerformanceReport(campaignId: string): UseQueryResult<CampaignPerformanceReport, Error> {
  return useQuery({
    queryKey: marketingKeys.performanceReport(campaignId),
    queryFn: async (): Promise<CampaignPerformanceReport> => {
      // This would aggregate detailed performance data
      // Mock data for now
      const campaign = {} as MarketingCampaignWithRelations;
      
      return {
        campaign,
        delivery_metrics: {
          emails_sent: 0,
          delivery_rate: 0,
          bounce_rate: 0,
          unsubscribe_rate: 0,
          spam_complaints: 0,
        },
        engagement_metrics: {
          open_rate: 0,
          unique_open_rate: 0,
          click_rate: 0,
          click_to_open_rate: 0,
          time_to_open: 0,
          time_to_click: 0,
        },
        conversion_metrics: {
          conversion_rate: 0,
          revenue_generated: 0,
          revenue_per_recipient: 0,
          cost_per_conversion: 0,
          roi_percentage: 0,
        },
        device_analytics: {
          desktop_opens: 0,
          mobile_opens: 0,
          tablet_opens: 0,
          desktop_clicks: 0,
          mobile_clicks: 0,
          tablet_clicks: 0,
        },
        geographic_data: {
          top_countries: [],
          top_cities: [],
        },
        timeline_data: {
          hourly_opens: [],
          daily_performance: [],
        },
      };
    },
    enabled: !!campaignId,
  });
}

/**
 * Fetch segmentation analytics
 */
export function useSegmentationAnalytics(segmentId: string): UseQueryResult<SegmentationAnalytics, Error> {
  return useQuery({
    queryKey: marketingKeys.segmentationAnalytics(segmentId),
    queryFn: async (): Promise<SegmentationAnalytics> => {
      // Mock segmentation analytics
      const segment = {} as CustomerSegmentWithAnalytics;
      
      return {
        segment,
        demographic_breakdown: {
          age_groups: {},
          gender_distribution: {},
          location_distribution: {},
        },
        behavioral_insights: {
          purchase_frequency: {
            frequent_buyers: 0,
            regular_buyers: 0,
            new_buyers: 0,
            inactive: 0,
          },
          engagement_levels: {
            highly_engaged: 0,
            moderately_engaged: 0,
            low_engaged: 0,
            unengaged: 0,
          },
          spending_tiers: {
            high_value: 0,
            medium_value: 0,
            low_value: 0,
          },
        },
        campaign_performance: {
          best_performing_campaigns: [],
          preferred_content_types: [],
          optimal_send_times: [],
        },
        lifecycle_stage_distribution: {
          awareness: 0,
          consideration: 0,
          purchase: 0,
          retention: 0,
          advocacy: 0,
        },
      };
    },
    enabled: !!segmentId,
  });
}

/**
 * Check email deliverability
 */
export function useEmailDeliverabilityCheck(): UseMutationResult<EmailDeliverabilityAnalysis, Error, string> {
  return useMutation({
    mutationFn: async (templateId: string): Promise<EmailDeliverabilityAnalysis> => {
      // Mock deliverability analysis
      return {
        overall_score: 85,
        content_analysis: {
          spam_words_count: 0,
          spam_words_found: [],
          html_to_text_ratio: 70,
          image_to_text_ratio: 30,
          link_count: 5,
          suspicious_links: [],
        },
        technical_analysis: {
          spf_record_valid: true,
          dkim_configured: true,
          dmarc_policy: 'quarantine',
          reputation_score: 90,
        },
        recommendations: [],
      };
    },
  });
}