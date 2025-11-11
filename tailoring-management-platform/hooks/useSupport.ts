/**
 * Customer Service & Support Management System - React Query Hooks
 * 
 * Comprehensive hooks for support ticket management, agent operations,
 * SLA tracking, knowledge base, and analytics.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type {
  SupportTicket,
  SupportTicketInsert,
  SupportTicketUpdate,
  SupportAgent,
  SupportAgentInsert,
  SupportAgentUpdate,
  TicketCategory,
  TicketCategoryInsert,
  TicketResponse,
  TicketResponseInsert,
  SLAPolicy,
  SLAPolicyInsert,
  TicketAssignment,
  TicketAssignmentInsert,
  EscalationRule,
  EscalationRuleInsert,
  TicketEscalation,
  KnowledgeBaseArticle,
  KnowledgeBaseArticleInsert,
  CustomerSatisfactionSurvey,
  SupportAnalytics,
  TicketTag,
  SupportTeam
} from '@/types/support';

// ============================================
// SUPPORT TICKETS
// ============================================

/**
 * Get all support tickets with filtering and search
 */
export function useSupportTickets(filters?: {
  status?: string;
  priority?: string;
  assigned_agent_id?: string;
  customer_id?: string;
  category_id?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['support-tickets', filters],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          category:ticket_categories(id, category_name, category_color),
          assigned_agent:support_agents(id, agent_name, agent_email),
          responses:ticket_responses(count)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.assigned_agent_id) {
        query = query.eq('assigned_agent_id', filters.assigned_agent_id);
      }
      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters?.search) {
        query = query.or(`ticket_title.ilike.%${filters.search}%,ticket_description.ilike.%${filters.search}%,ticket_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Get a single support ticket with full details
 */
export function useSupportTicket(ticketId: string) {
  return useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          category:ticket_categories(*),
          assigned_agent:support_agents(*),
          responses:ticket_responses(*),
          assignments:ticket_assignments(*),
          escalations:ticket_escalations(*),
          sla_tracking:sla_tracking(*),
          surveys:customer_satisfaction_surveys(*)
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!ticketId,
  });
}

/**
 * Create a new support ticket
 */
export function useCreateSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticket: SupportTicketInsert) => {
      // Generate ticket number
      const ticketNumber = `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const ticketData = {
        ...ticket,
        ticket_number: ticketNumber,
        organization_id: 'default-org', // Replace with actual organization ID
      };

      const { data, error } = await supabase
        .from('support_tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}

/**
 * Update a support ticket
 */
export function useUpdateSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: SupportTicketUpdate }) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', data.id] });
    },
  });
}

/**
 * Assign ticket to agent
 */
export function useAssignTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, agentId, reason }: { ticketId: string; agentId: string; reason?: string }) => {
      // Update ticket assignment
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .update({
          assigned_agent_id: agentId,
          assigned_at: new Date().toISOString(),
          assignment_method: 'manual',
          status: 'open'
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create assignment record
      const { error: assignmentError } = await supabase
        .from('ticket_assignments')
        .insert({
          ticket_id: ticketId,
          agent_id: agentId,
          assignment_type: 'initial',
          assignment_reason: reason,
          organization_id: 'default-org',
        });

      if (assignmentError) throw assignmentError;

      return ticket;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', data.id] });
    },
  });
}

// ============================================
// TICKET RESPONSES
// ============================================

/**
 * Get responses for a ticket
 */
export function useTicketResponses(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-responses', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!ticketId,
  });
}

/**
 * Add response to ticket
 */
export function useAddTicketResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (response: TicketResponseInsert) => {
      const { data, error } = await supabase
        .from('ticket_responses')
        .insert({
          ...response,
          organization_id: 'default-org',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-responses', data.ticket_id] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', data.ticket_id] });
    },
  });
}

// ============================================
// SUPPORT AGENTS
// ============================================

/**
 * Get all support agents
 */
export function useSupportAgents() {
  return useQuery({
    queryKey: ['support-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_agents')
        .select(`
          *,
          skills:agent_skills(*),
          current_tickets:support_tickets!assigned_agent_id(count)
        `)
        .eq('is_active', true)
        .order('agent_name');

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Get agent performance metrics
 */
export function useAgentPerformance(agentId: string, dateRange?: { from: string; to: string }) {
  return useQuery({
    queryKey: ['agent-performance', agentId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .eq('assigned_agent_id', agentId);

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.from)
          .lte('created_at', dateRange.to);
      }

      const { data: tickets, error } = await query;
      if (error) throw error;

      // Calculate metrics
      const totalTickets = tickets.length;
      const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
      const avgResolutionTime = tickets
        .filter(t => t.resolution_time_minutes)
        .reduce((acc, t) => acc + t.resolution_time_minutes!, 0) / resolvedTickets || 0;

      return {
        totalTickets,
        resolvedTickets,
        resolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0,
        avgResolutionTime: Math.round(avgResolutionTime),
      };
    },
    enabled: !!agentId,
  });
}

/**
 * Create support agent
 */
export function useCreateSupportAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agent: SupportAgentInsert) => {
      const { data, error } = await supabase
        .from('support_agents')
        .insert({
          ...agent,
          organization_id: 'default-org',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-agents'] });
    },
  });
}

/**
 * Update agent status
 */
export function useUpdateAgentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentId, status }: { agentId: string; status: string }) => {
      const { data, error } = await supabase
        .from('support_agents')
        .update({ 
          agent_status: status,
          last_active_at: new Date().toISOString()
        })
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-agents'] });
    },
  });
}

// ============================================
// TICKET CATEGORIES
// ============================================

/**
 * Get all ticket categories
 */
export function useTicketCategories() {
  return useQuery({
    queryKey: ['ticket-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Create ticket category
 */
export function useCreateTicketCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: TicketCategoryInsert) => {
      const { data, error } = await supabase
        .from('ticket_categories')
        .insert({
          ...category,
          organization_id: 'default-org',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] });
    },
  });
}

// ============================================
// SLA POLICIES
// ============================================

/**
 * Get all SLA policies
 */
export function useSLAPolicies() {
  return useQuery({
    queryKey: ['sla-policies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sla_policies')
        .select('*')
        .eq('is_active', true)
        .order('priority_level');

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Create SLA policy
 */
export function useCreateSLAPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (policy: SLAPolicyInsert) => {
      const { data, error } = await supabase
        .from('sla_policies')
        .insert({
          ...policy,
          organization_id: 'default-org',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
    },
  });
}

// ============================================
// KNOWLEDGE BASE
// ============================================

/**
 * Get knowledge base articles with search
 */
export function useKnowledgeBaseArticles(search?: string, categoryId?: string) {
  return useQuery({
    queryKey: ['knowledge-base-articles', search, categoryId],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_base_articles')
        .select(`
          *,
          category:ticket_categories(id, category_name)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`article_title.ilike.%${search}%,article_content.ilike.%${search}%`);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Get single knowledge base article
 */
export function useKnowledgeBaseArticle(articleId: string) {
  return useQuery({
    queryKey: ['knowledge-base-article', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_base_articles')
        .select(`
          *,
          category:ticket_categories(*)
        `)
        .eq('id', articleId)
        .single();

      if (error) throw error;
      
      // Update view count
      await supabase
        .from('knowledge_base_articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', articleId);

      return data;
    },
    enabled: !!articleId,
  });
}

/**
 * Create knowledge base article
 */
export function useCreateKnowledgeBaseArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (article: KnowledgeBaseArticleInsert) => {
      const { data, error } = await supabase
        .from('knowledge_base_articles')
        .insert({
          ...article,
          organization_id: 'default-org',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-articles'] });
    },
  });
}

/**
 * Rate knowledge base article
 */
export function useRateKnowledgeBaseArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ articleId, helpful }: { articleId: string; helpful: boolean }) => {
      const field = helpful ? 'helpful_count' : 'not_helpful_count';
      
      const { data, error } = await supabase
        .from('knowledge_base_articles')
        .select(field)
        .eq('id', articleId)
        .single();

      if (error) throw error;

      const newCount = (data[field] || 0) + 1;
      
      const { error: updateError } = await supabase
        .from('knowledge_base_articles')
        .update({ [field]: newCount })
        .eq('id', articleId);

      if (updateError) throw updateError;

      return { articleId, helpful, newCount };
    },
    onSuccess: ({ articleId }) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-article', articleId] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-articles'] });
    },
  });
}

// ============================================
// ESCALATIONS
// ============================================

/**
 * Get escalation rules
 */
export function useEscalationRules() {
  return useQuery({
    queryKey: ['escalation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('is_active', true)
        .order('execution_order');

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Escalate ticket
 */
export function useEscalateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      escalationLevel, 
      reason, 
      escalateToAgentId 
    }: { 
      ticketId: string; 
      escalationLevel: number; 
      reason: string;
      escalateToAgentId?: string;
    }) => {
      // Update ticket
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .update({
          is_escalated: true,
          escalation_level: escalationLevel,
          escalated_at: new Date().toISOString(),
          ...(escalateToAgentId && { assigned_agent_id: escalateToAgentId })
        })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;

      // Create escalation record
      const { data, error } = await supabase
        .from('ticket_escalations')
        .insert({
          ticket_id: ticketId,
          escalation_level: escalationLevel,
          escalation_reason: reason,
          escalation_type: 'manual',
          escalated_to_agent_id: escalateToAgentId,
          organization_id: 'default-org',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', data.ticket_id] });
    },
  });
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Get support analytics dashboard data
 */
export function useSupportAnalytics(dateRange?: { from: string; to: string }) {
  return useQuery({
    queryKey: ['support-analytics', dateRange],
    queryFn: async () => {
      let ticketQuery = supabase.from('support_tickets').select('*');
      
      if (dateRange) {
        ticketQuery = ticketQuery
          .gte('created_at', dateRange.from)
          .lte('created_at', dateRange.to);
      }

      const { data: tickets, error } = await ticketQuery;
      if (error) throw error;

      // Calculate analytics
      const totalTickets = tickets.length;
      const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
      const openTickets = tickets.filter(t => ['new', 'open', 'in_progress'].includes(t.status)).length;
      const escalatedTickets = tickets.filter(t => t.is_escalated).length;

      const avgResolutionTime = tickets
        .filter(t => t.resolution_time_minutes)
        .reduce((acc, t, _, arr) => acc + t.resolution_time_minutes! / arr.length, 0) || 0;

      // Get satisfaction data
      const { data: surveys } = await supabase
        .from('customer_satisfaction_surveys')
        .select('overall_rating')
        .not('overall_rating', 'is', null);

      const avgSatisfaction = surveys?.length 
        ? surveys.reduce((acc, s, _, arr) => acc + s.overall_rating! / arr.length, 0)
        : 0;

      return {
        totalTickets,
        resolvedTickets,
        openTickets,
        escalatedTickets,
        resolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0,
        escalationRate: totalTickets > 0 ? (escalatedTickets / totalTickets) * 100 : 0,
        avgResolutionTime: Math.round(avgResolutionTime),
        avgSatisfaction: Math.round(avgSatisfaction * 100) / 100,
        ticketsByStatus: {
          new: tickets.filter(t => t.status === 'new').length,
          open: tickets.filter(t => t.status === 'open').length,
          in_progress: tickets.filter(t => t.status === 'in_progress').length,
          resolved: tickets.filter(t => t.status === 'resolved').length,
          closed: tickets.filter(t => t.status === 'closed').length,
        },
        ticketsByPriority: {
          critical: tickets.filter(t => t.priority === 'critical').length,
          high: tickets.filter(t => t.priority === 'high').length,
          medium: tickets.filter(t => t.priority === 'medium').length,
          low: tickets.filter(t => t.priority === 'low').length,
        },
      };
    },
  });
}

/**
 * Get SLA compliance metrics
 */
export function useSLACompliance(dateRange?: { from: string; to: string }) {
  return useQuery({
    queryKey: ['sla-compliance', dateRange],
    queryFn: async () => {
      let query = supabase.from('sla_tracking').select('*');
      
      if (dateRange) {
        query = query
          .gte('created_at', dateRange.from)
          .lte('created_at', dateRange.to);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data.length) {
        return {
          overallCompliance: 0,
          firstResponseCompliance: 0,
          resolutionCompliance: 0,
          totalTracked: 0,
        };
      }

      const totalTracked = data.length;
      const overallMet = data.filter(s => s.overall_sla_met).length;
      const firstResponseMet = data.filter(s => s.first_response_met).length;
      const resolutionMet = data.filter(s => s.resolution_met).length;

      return {
        overallCompliance: (overallMet / totalTracked) * 100,
        firstResponseCompliance: (firstResponseMet / totalTracked) * 100,
        resolutionCompliance: (resolutionMet / totalTracked) * 100,
        totalTracked,
      };
    },
  });
}

/**
 * Get ticket volume trends
 */
export function useTicketVolumeInder() {
  return useQuery({
    queryKey: ['ticket-volume-trends'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      if (error) throw error;

      // Group by date
      const volumeByDate: Record<string, number> = {};
      data.forEach(ticket => {
        const date = new Date(ticket.created_at).toISOString().split('T')[0];
        volumeByDate[date] = (volumeByDate[date] || 0) + 1;
      });

      return Object.entries(volumeByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  });
}