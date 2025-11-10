// Complaints & Feedback System React Query Hooks
// Unified Tailoring Management Platform
// Created: 2025-11-11 00:50:09
// Purpose: Data management hooks for feedback, complaints, surveys, and analytics

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import type {
  CustomerFeedback,
  ComplaintResolution,
  SatisfactionSurvey,
  SurveyResponse,
  FeedbackResponse,
  FeedbackCategory,
  EscalationRule,
  FeedbackAttachment,
  FeedbackAnalytics,
  ResolutionTemplate,
  FeedbackNotification,
  CreateFeedbackRequest,
  UpdateFeedbackRequest,
  CreateResolutionRequest,
  UpdateResolutionRequest,
  CreateSurveyRequest,
  CreateSurveyResponseRequest,
  CreateFeedbackResponseRequest,
  CreateTemplateRequest,
  FeedbackFilters,
  SurveyFilters,
  AnalyticsFilters,
  FeedbackMetrics,
  FeedbackDashboardData,
  ComplaintWorkflowData,
  PaginatedFeedbackResponse,
} from '@/types/feedback';

// =============================================
// QUERY KEYS
// =============================================

export const feedbackKeys = {
  all: ['feedback'] as const,
  lists: () => [...feedbackKeys.all, 'list'] as const,
  list: (filters: FeedbackFilters) => [...feedbackKeys.lists(), filters] as const,
  details: () => [...feedbackKeys.all, 'detail'] as const,
  detail: (id: string) => [...feedbackKeys.details(), id] as const,
  categories: () => [...feedbackKeys.all, 'categories'] as const,
  analytics: () => [...feedbackKeys.all, 'analytics'] as const,
  metrics: (filters: AnalyticsFilters) => [...feedbackKeys.analytics(), 'metrics', filters] as const,
  dashboard: (organizationId: string) => [...feedbackKeys.all, 'dashboard', organizationId] as const,
  resolutions: (feedbackId: string) => [...feedbackKeys.all, 'resolutions', feedbackId] as const,
  responses: (feedbackId: string) => [...feedbackKeys.all, 'responses', feedbackId] as const,
  attachments: (feedbackId: string) => [...feedbackKeys.all, 'attachments', feedbackId] as const,
  templates: () => [...feedbackKeys.all, 'templates'] as const,
  escalationRules: () => [...feedbackKeys.all, 'escalation-rules'] as const,
  surveys: () => [...feedbackKeys.all, 'surveys'] as const,
  surveyResponses: (surveyId: string) => [...feedbackKeys.surveys(), surveyId, 'responses'] as const,
  notifications: (feedbackId: string) => [...feedbackKeys.all, 'notifications', feedbackId] as const,
};

// =============================================
// FEEDBACK MANAGEMENT HOOKS
// =============================================

// Get feedback list with filters
export function useFeedback(filters: FeedbackFilters = {}, enabled = true) {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  return useQuery({
    queryKey: feedbackKeys.list(filters),
    queryFn: async (): Promise<PaginatedFeedbackResponse<CustomerFeedback>> => {
      let query = supabase
        .from('customer_feedback')
        .select(`
          *,
          category:feedback_categories(*),
          customer:customers(*),
          order:orders(*),
          branch:branches(*),
          resolutions:complaint_resolution(count),
          responses:feedback_responses(count),
          attachments:feedback_attachments(count)
        `)
        .eq('organization_id', organizationId);

      // Apply filters
      if (filters.feedback_type?.length) {
        query = query.in('feedback_type', filters.feedback_type);
      }
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters.severity?.length) {
        query = query.in('severity', filters.severity);
      }
      if (filters.source?.length) {
        query = query.in('source', filters.source);
      }
      if (filters.category_id?.length) {
        query = query.in('category_id', filters.category_id);
      }
      if (filters.branch_id?.length) {
        query = query.in('branch_id', filters.branch_id);
      }
      if (filters.customer_id?.length) {
        query = query.in('customer_id', filters.customer_id);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters.satisfaction_rating?.length) {
        query = query.in('satisfaction_rating', filters.satisfaction_rating);
      }
      if (filters.tags?.length) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters.is_escalated !== undefined) {
        query = filters.is_escalated 
          ? query.not('escalated_at', 'is', null)
          : query.is('escalated_at', null);
      }
      if (filters.search) {
        query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(0, 49); // Limit to 50 items per page

      if (error) throw error;

      return {
        items: data || [],
        total: count || 0,
        page: 1,
        limit: 50,
        has_more: (count || 0) > 50,
      };
    },
    enabled: enabled && !!organizationId,
  });
}

// Get single feedback by ID
export function useFeedbackById(id: string) {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  return useQuery({
    queryKey: feedbackKeys.detail(id),
    queryFn: async (): Promise<CustomerFeedback> => {
      const { data, error } = await supabase
        .from('customer_feedback')
        .select(`
          *,
          category:feedback_categories(*),
          customer:customers(*),
          order:orders(*),
          branch:branches(*),
          resolutions:complaint_resolution(*),
          responses:feedback_responses(*),
          attachments:feedback_attachments(*)
        `)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!organizationId,
  });
}

// Get feedback categories
export function useFeedbackCategories() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  return useQuery({
    queryKey: feedbackKeys.categories(),
    queryFn: async (): Promise<FeedbackCategory[]> => {
      const { data, error } = await supabase
        .from('feedback_categories')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });
}

// Get feedback dashboard data
export function useFeedbackDashboard() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  return useQuery({
    queryKey: feedbackKeys.dashboard(organizationId),
    queryFn: async (): Promise<FeedbackDashboardData> => {
      // Fetch dashboard metrics and data
      const [metricsResponse, trendsResponse, recentResponse] = await Promise.all([
        supabase
          .from('feedback_analytics')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('customer_feedback')
          .select('created_at, feedback_type, status, satisfaction_rating')
          .eq('organization_id', organizationId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('customer_feedback')
          .select(`
            *,
            category:feedback_categories(*),
            customer:customers(name, email)
          `)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (metricsResponse.error) throw metricsResponse.error;
      if (trendsResponse.error) throw trendsResponse.error;
      if (recentResponse.error) throw recentResponse.error;

      // Calculate metrics from data
      const feedbackData = trendsResponse.data || [];
      const totalFeedback = feedbackData.length;
      const complaints = feedbackData.filter(f => f.feedback_type === 'complaint');
      const resolved = feedbackData.filter(f => f.status === 'resolved');
      
      const metrics: FeedbackMetrics = {
        total_feedback: totalFeedback,
        total_complaints: complaints.length,
        total_suggestions: feedbackData.filter(f => f.feedback_type === 'suggestion').length,
        total_compliments: feedbackData.filter(f => f.feedback_type === 'compliment').length,
        resolution_rate: totalFeedback > 0 ? (resolved.length / totalFeedback) * 100 : 0,
        average_resolution_time: 24, // Placeholder - would be calculated from actual resolution times
        customer_satisfaction_score: 4.2, // Placeholder - would be calculated from satisfaction ratings
        nps_score: 7.5, // Placeholder - would be calculated from NPS responses
        escalation_rate: 5.2, // Placeholder - would be calculated from escalation data
        repeat_complaint_rate: 2.1, // Placeholder - would be calculated from repeat complaints
      };

      return {
        metrics,
        trends: [], // Would be calculated from trend data
        category_analytics: [], // Would be calculated from category data
        branch_metrics: [], // Would be calculated from branch data
        recent_feedback: recentResponse.data || [],
        urgent_complaints: feedbackData.filter(f => 
          f.feedback_type === 'complaint' && 
          ['high', 'critical', 'urgent'].includes((f as any).severity)
        ) as CustomerFeedback[],
        overdue_resolutions: [], // Would be calculated based on resolution deadlines
        satisfaction_trend: [], // Would be calculated from historical satisfaction data
      };
    },
    enabled: !!organizationId,
  });
}

// Create feedback
export function useCreateFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = user?.user_metadata?.organization_id;

  return useMutation({
    mutationFn: async (feedbackData: CreateFeedbackRequest): Promise<CustomerFeedback> => {
      const { data, error } = await supabase
        .from('customer_feedback')
        .insert({
          ...feedbackData,
          organization_id: organizationId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.lists() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.dashboard(organizationId) });
      queryClient.setQueryData(feedbackKeys.detail(data.id), data);
    },
  });
}

// Update feedback
export function useUpdateFeedback(id: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = user?.user_metadata?.organization_id;

  return useMutation({
    mutationFn: async (updateData: UpdateFeedbackRequest): Promise<CustomerFeedback> => {
      const { data, error } = await supabase
        .from('customer_feedback')
        .update({
          ...updateData,
          updated_by: user?.id,
        })
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.lists() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.dashboard(organizationId) });
      queryClient.setQueryData(feedbackKeys.detail(id), data);
    },
  });
}

// Delete feedback
export function useDeleteFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = user?.user_metadata?.organization_id;

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('customer_feedback')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);

      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.lists() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.dashboard(organizationId) });
      queryClient.removeQueries({ queryKey: feedbackKeys.detail(id) });
    },
  });
}

// =============================================
// COMPLAINT RESOLUTION HOOKS
// =============================================

// Get resolutions for feedback
export function useFeedbackResolutions(feedbackId: string) {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  return useQuery({
    queryKey: feedbackKeys.resolutions(feedbackId),
    queryFn: async (): Promise<ComplaintResolution[]> => {
      const { data, error } = await supabase
        .from('complaint_resolution')
        .select(`
          *,
          complaint:customer_feedback(*),
          assigned_employee:employees(*)
        `)
        .eq('complaint_id', feedbackId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!feedbackId && !!organizationId,
  });
}

// Create resolution
export function useCreateResolution() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = user?.user_metadata?.organization_id;

  return useMutation({
    mutationFn: async (resolutionData: CreateResolutionRequest): Promise<ComplaintResolution> => {
      const { data, error } = await supabase
        .from('complaint_resolution')
        .insert({
          ...resolutionData,
          organization_id: organizationId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.resolutions(data.complaint_id) });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.detail(data.complaint_id) });
    },
  });
}

// Update resolution
export function useUpdateResolution(id: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = user?.user_metadata?.organization_id;

  return useMutation({
    mutationFn: async (updateData: UpdateResolutionRequest): Promise<ComplaintResolution> => {
      const { data, error } = await supabase
        .from('complaint_resolution')
        .update({
          ...updateData,
          updated_by: user?.id,
        })
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.resolutions(data.complaint_id) });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.detail(data.complaint_id) });
    },
  });
}

// =============================================
// SURVEY HOOKS
// =============================================

// Get surveys
export function useSurveys(filters: SurveyFilters = {}) {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  return useQuery({
    queryKey: feedbackKeys.surveys(),
    queryFn: async (): Promise<SatisfactionSurvey[]> => {
      let query = supabase
        .from('satisfaction_surveys')
        .select('*')
        .eq('organization_id', organizationId);

      // Apply filters
      if (filters.survey_type?.length) {
        query = query.in('survey_type', filters.survey_type);
      }
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });
}

// Create survey
export function useCreateSurvey() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = user?.user_metadata?.organization_id;

  return useMutation({
    mutationFn: async (surveyData: CreateSurveyRequest): Promise<SatisfactionSurvey> => {
      const { data, error } = await supabase
        .from('satisfaction_surveys')
        .insert({
          ...surveyData,
          organization_id: organizationId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.surveys() });
    },
  });
}

// Get survey responses
export function useSurveyResponses(surveyId: string) {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  return useQuery({
    queryKey: feedbackKeys.surveyResponses(surveyId),
    queryFn: async (): Promise<SurveyResponse[]> => {
      const { data, error } = await supabase
        .from('survey_responses')
        .select(`
          *,
          survey:satisfaction_surveys(*),
          customer:customers(*),
          order:orders(*),
          branch:branches(*)
        `)
        .eq('survey_id', surveyId)
        .eq('organization_id', organizationId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!surveyId && !!organizationId,
  });
}

// Submit survey response
export function useSubmitSurveyResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (responseData: CreateSurveyResponseRequest): Promise<SurveyResponse> => {
      const { data, error } = await supabase
        .from('survey_responses')
        .insert(responseData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.surveyResponses(data.survey_id) });
    },
  });
}

// =============================================
// FEEDBACK RESPONSE HOOKS
// =============================================

// Get responses for feedback
export function useFeedbackResponses(feedbackId: string) {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  return useQuery({
    queryKey: feedbackKeys.responses(feedbackId),
    queryFn: async (): Promise<FeedbackResponse[]> => {
      const { data, error } = await supabase
        .from('feedback_responses')
        .select(`
          *,
          feedback:customer_feedback(*),
          author:employees(*)
        `)
        .eq('feedback_id', feedbackId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!feedbackId && !!organizationId,
  });
}

// Create feedback response
export function useCreateFeedbackResponse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = user?.user_metadata?.organization_id;

  return useMutation({
    mutationFn: async (responseData: CreateFeedbackResponseRequest): Promise<FeedbackResponse> => {
      const { data, error } = await supabase
        .from('feedback_responses')
        .insert({
          ...responseData,
          organization_id: organizationId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.responses(data.feedback_id) });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.detail(data.feedback_id) });
    },
  });
}

// =============================================
// TEMPLATE HOOKS
// =============================================

// Get resolution templates
export function useResolutionTemplates() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  return useQuery({
    queryKey: feedbackKeys.templates(),
    queryFn: async (): Promise<ResolutionTemplate[]> => {
      const { data, error } = await supabase
        .from('resolution_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });
}

// Create template
export function useCreateTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = user?.user_metadata?.organization_id;

  return useMutation({
    mutationFn: async (templateData: CreateTemplateRequest): Promise<ResolutionTemplate> => {
      const { data, error } = await supabase
        .from('resolution_templates')
        .insert({
          ...templateData,
          organization_id: organizationId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.templates() });
    },
  });
}

// =============================================
// ESCALATION RULES HOOKS
// =============================================

// Get escalation rules
export function useEscalationRules() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  return useQuery({
    queryKey: feedbackKeys.escalationRules(),
    queryFn: async (): Promise<EscalationRule[]> => {
      const { data, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });
}

// =============================================
// ANALYTICS HOOKS
// =============================================

// Get feedback analytics
export function useFeedbackAnalytics(filters: AnalyticsFilters) {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  return useQuery({
    queryKey: feedbackKeys.metrics(filters),
    queryFn: async (): Promise<FeedbackAnalytics[]> => {
      let query = supabase
        .from('feedback_analytics')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('metric_date', filters.date_from)
        .lte('metric_date', filters.date_to);

      if (filters.branch_id?.length) {
        query = query.in('branch_id', filters.branch_id);
      }
      if (filters.metric_category?.length) {
        query = query.in('metric_category', filters.metric_category);
      }

      const { data, error } = await query.order('metric_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && !!filters.date_from && !!filters.date_to,
  });
}

// Get complaint workflow data
export function useComplaintWorkflow() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  return useQuery({
    queryKey: [...feedbackKeys.all, 'workflow', organizationId],
    queryFn: async (): Promise<ComplaintWorkflowData> => {
      const { data, error } = await supabase
        .from('customer_feedback')
        .select(`
          *,
          category:feedback_categories(*),
          customer:customers(name, email),
          resolutions:complaint_resolution(*)
        `)
        .eq('organization_id', organizationId)
        .in('feedback_type', ['complaint'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const complaints = data || [];
      const pending = complaints.filter(c => c.status === 'submitted');
      const inProgress = complaints.filter(c => ['acknowledged', 'investigating'].includes(c.status));
      const escalated = complaints.filter(c => c.status === 'escalated');
      const requireFollowUp = complaints.filter(c => c.follow_up_required);
      
      const today = new Date().toISOString().split('T')[0];
      const resolvedToday = complaints.filter(c => 
        c.status === 'resolved' && 
        c.actual_resolution_date === today
      ).length;

      return {
        pending_assignments: pending as CustomerFeedback[],
        in_progress: inProgress as CustomerFeedback[],
        escalated: escalated as CustomerFeedback[],
        require_follow_up: requireFollowUp as CustomerFeedback[],
        resolved_today: resolvedToday,
        average_resolution_time: 24, // Placeholder calculation
        overdue_count: 0, // Placeholder calculation
      };
    },
    enabled: !!organizationId,
  });
}

// =============================================
// ATTACHMENT HOOKS
// =============================================

// Get attachments for feedback
export function useFeedbackAttachments(feedbackId: string) {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  return useQuery({
    queryKey: feedbackKeys.attachments(feedbackId),
    queryFn: async (): Promise<FeedbackAttachment[]> => {
      const { data, error } = await supabase
        .from('feedback_attachments')
        .select('*')
        .eq('feedback_id', feedbackId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!feedbackId && !!organizationId,
  });
}

// Upload attachment
export function useUploadAttachment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = user?.user_metadata?.organization_id;

  return useMutation({
    mutationFn: async ({ 
      feedbackId, 
      file, 
      description 
    }: { 
      feedbackId: string; 
      file: File; 
      description?: string; 
    }): Promise<FeedbackAttachment> => {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${feedbackId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('feedback-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create attachment record
      const { data, error } = await supabase
        .from('feedback_attachments')
        .insert({
          organization_id: organizationId,
          feedback_id: feedbackId,
          file_name: file.name,
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
          description,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.attachments(data.feedback_id) });
    },
  });
}

// =============================================
// UTILITY HOOKS
// =============================================

// Bulk update feedback status
export function useBulkUpdateStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = user?.user_metadata?.organization_id;

  return useMutation({
    mutationFn: async ({ 
      feedbackIds, 
      status, 
      notes 
    }: { 
      feedbackIds: string[]; 
      status: string; 
      notes?: string; 
    }) => {
      const { error } = await supabase
        .from('customer_feedback')
        .update({ 
          status,
          updated_by: user?.id,
          ...(notes && { metadata: { bulk_update_notes: notes } })
        })
        .in('id', feedbackIds)
        .eq('organization_id', organizationId);

      if (error) throw error;
      return feedbackIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.lists() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.dashboard(organizationId) });
    },
  });
}

// Export feedback data
export function useExportFeedback() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  return useMutation({
    mutationFn: async (filters: FeedbackFilters): Promise<CustomerFeedback[]> => {
      let query = supabase
        .from('customer_feedback')
        .select(`
          *,
          category:feedback_categories(*),
          customer:customers(*),
          order:orders(*),
          branch:branches(*)
        `)
        .eq('organization_id', organizationId);

      // Apply same filters as useFeedback
      if (filters.feedback_type?.length) {
        query = query.in('feedback_type', filters.feedback_type);
      }
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      // ... apply other filters

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1000); // Max export limit

      if (error) throw error;
      return data || [];
    },
  });
}