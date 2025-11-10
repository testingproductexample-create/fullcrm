'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// Fetch business intelligence data
export function useBusinessIntelligence(organizationId: string, filters?: any) {
  return useQuery({
    queryKey: ['business-intelligence', organizationId, filters],
    queryFn: async () => {
      let query = supabase
        .from('business_intelligence')
        .select('*')
        .eq('organization_id', organizationId);

      if (filters?.category) {
        query = query.eq('metric_category', filters.category);
      }
      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from.toISOString())
          .lte('created_at', filters.dateRange.to.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// Fetch KPI metrics
export function useKPIMetrics(organizationId: string) {
  return useQuery({
    queryKey: ['kpi-metrics', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpi_metrics')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// Fetch custom reports
export function useCustomReports(organizationId: string) {
  return useQuery({
    queryKey: ['custom-reports', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_reports')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// Fetch dashboard configurations
export function useDashboardConfigs(userId: string) {
  return useQuery({
    queryKey: ['dashboard-configs', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_configs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// Fetch performance metrics
export function usePerformanceMetrics(organizationId: string, metricType?: string) {
  return useQuery({
    queryKey: ['performance-metrics', organizationId, metricType],
    queryFn: async () => {
      let query = supabase
        .from('performance_metrics')
        .select('*')
        .eq('organization_id', organizationId);

      if (metricType) {
        query = query.eq('metric_type', metricType);
      }

      const { data, error } = await query.order('timestamp', { ascending: false }).limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// Fetch trend analysis
export function useTrendAnalysis(organizationId: string, metricName?: string) {
  return useQuery({
    queryKey: ['trend-analysis', organizationId, metricName],
    queryFn: async () => {
      let query = supabase
        .from('trend_analysis')
        .select('*')
        .eq('organization_id', organizationId);

      if (metricName) {
        query = query.eq('metric_name', metricName);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// Fetch report schedules
export function useReportSchedules(organizationId: string) {
  return useQuery({
    queryKey: ['report-schedules', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_schedules')
        .select('*, custom_reports(report_name, report_type)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// Create custom report
export function useCreateCustomReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: any) => {
      const { data, error } = await supabase
        .from('custom_reports')
        .insert(report)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
      toast.success('Report created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create report');
    },
  });
}

// Update KPI metric
export function useUpdateKPIMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('kpi_metrics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-metrics'] });
      toast.success('KPI updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update KPI');
    },
  });
}

// Save dashboard configuration
export function useSaveDashboardConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: any) => {
      const { data, error } = await supabase
        .from('dashboard_configs')
        .upsert(config)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-configs'] });
      toast.success('Dashboard configuration saved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save configuration');
    },
  });
}

// Create report schedule
export function useCreateReportSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedule: any) => {
      const { data, error } = await supabase
        .from('report_schedules')
        .insert(schedule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      toast.success('Report schedule created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create schedule');
    },
  });
}
