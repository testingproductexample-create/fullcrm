'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

// Fetch communication channels
export function useCommunicationChannels(organizationId: string) {
  return useQuery({
    queryKey: ['communication-channels', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communication_channels')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// Fetch customer communications
export function useCustomerCommunications(organizationId: string, filters?: any) {
  return useQuery({
    queryKey: ['customer-communications', organizationId, filters],
    queryFn: async () => {
      let query = supabase
        .from('customer_communications')
        .select('*, customers(name, email, phone)')
        .eq('organization_id', organizationId);

      if (filters?.channel) {
        query = query.eq('channel_type', filters.channel);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// Fetch message templates
export function useMessageTemplates(organizationId: string, channelType?: string) {
  return useQuery({
    queryKey: ['message-templates', organizationId, channelType],
    queryFn: async () => {
      let query = supabase
        .from('message_templates')
        .select('*')
        .eq('organization_id', organizationId);

      if (channelType) {
        query = query.eq('channel_type', channelType);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// Fetch bulk messaging campaigns
export function useBulkCampaigns(organizationId: string) {
  return useQuery({
    queryKey: ['bulk-campaigns', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bulk_messaging')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// Fetch communication analytics
export function useCommunicationAnalytics(organizationId: string, dateRange?: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['communication-analytics', organizationId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('communication_analytics')
        .select('*')
        .eq('organization_id', organizationId);

      if (dateRange) {
        query = query
          .gte('date', dateRange.from.toISOString())
          .lte('date', dateRange.to.toISOString());
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// Fetch automated notifications
export function useAutomatedNotifications(organizationId: string) {
  return useQuery({
    queryKey: ['automated-notifications', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automated_notifications')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// Fetch chat sessions
export function useChatSessions(organizationId: string, status?: string) {
  return useQuery({
    queryKey: ['chat-sessions', organizationId, status],
    queryFn: async () => {
      let query = supabase
        .from('chat_sessions')
        .select('*, customers(name, email)')
        .eq('organization_id', organizationId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// Fetch video consultations
export function useVideoConsultations(organizationId: string, status?: string) {
  return useQuery({
    queryKey: ['video-consultations', organizationId, status],
    queryFn: async () => {
      let query = supabase
        .from('video_consultations')
        .select('*, customers(name, email, phone)')
        .eq('organization_id', organizationId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('scheduled_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// Create message template
export function useCreateMessageTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: any) => {
      const { data, error } = await supabase
        .from('message_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success('Template created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create template');
    },
  });
}

// Send bulk message
export function useSendBulkMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign: any) => {
      const { data, error } = await supabase
        .from('bulk_messaging')
        .insert(campaign)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-campaigns'] });
      toast.success('Campaign created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create campaign');
    },
  });
}

// Update communication channel
export function useUpdateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('communication_channels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-channels'] });
      toast.success('Channel updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update channel');
    },
  });
}


// Send single SMS/email/whatsapp message
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: any) => {
      const { data, error } = await supabase
        .from('customer_communications')
        .insert(message)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-communications'] });
      toast.success('Message sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message');
    },
  });
}
