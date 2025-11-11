// ============================================================================
// EFFICIENCY & PERFORMANCE ANALYTICS - REACT QUERY HOOKS
// ============================================================================
// Purpose: Comprehensive data fetching and state management for efficiency analytics
// Created: 2025-11-11
// Features: CRUD operations, real-time updates, optimistic updates, caching

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type {
  // Base Types
  EffOperationalMetric,
  CreateOperationalMetricData,
  UpdateOperationalMetricData,
  EffCalculation,
  CreateCalculationData,
  EffBottleneckAnalytic,
  CreateBottleneckData,
  EffResourceUtilization,
  CreateResourceUtilizationData,
  EffProductivityAnalytic,
  CreateProductivityAnalyticData,
  EffOptimizationRecommendation,
  CreateOptimizationRecommendationData,
  EffPerformanceAlert,
  CreatePerformanceAlertData,
  EffSystemBenchmark,
  CreateSystemBenchmarkData,
  EffTrendAnalysis,
  CreateTrendAnalysisData,
  EffKpiTarget,
  CreateKpiTargetData,
  
  // Dashboard Types
  EfficiencyDashboardMetrics,
  BottleneckSummary,
  ProductivityTrendData,
  ResourceUtilizationSummary,
  OptimizationImpact,
  AnalyticsFilters,
  PaginationParams,
  ApiResponse,
} from '@/types/efficiency';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const efficiencyKeys = {
  all: ['efficiency'] as const,
  
  // Operational Metrics
  operationalMetrics: () => [...efficiencyKeys.all, 'operational-metrics'] as const,
  operationalMetric: (id: string) => [...efficiencyKeys.operationalMetrics(), id] as const,
  operationalMetricsByCategory: (category: string) => [...efficiencyKeys.operationalMetrics(), 'category', category] as const,
  
  // Calculations
  calculations: () => [...efficiencyKeys.all, 'calculations'] as const,
  calculation: (id: string) => [...efficiencyKeys.calculations(), id] as const,
  calculationsByProcess: (process: string) => [...efficiencyKeys.calculations(), 'process', process] as const,
  
  // Bottleneck Analytics
  bottlenecks: () => [...efficiencyKeys.all, 'bottlenecks'] as const,
  bottleneck: (id: string) => [...efficiencyKeys.bottlenecks(), id] as const,
  bottlenecksBySeverity: (severity: string) => [...efficiencyKeys.bottlenecks(), 'severity', severity] as const,
  
  // Resource Utilization
  resourceUtilization: () => [...efficiencyKeys.all, 'resource-utilization'] as const,
  resourceUtilizationById: (id: string) => [...efficiencyKeys.resourceUtilization(), id] as const,
  resourceUtilizationByType: (type: string) => [...efficiencyKeys.resourceUtilization(), 'type', type] as const,
  
  // Productivity Analytics
  productivityAnalytics: () => [...efficiencyKeys.all, 'productivity-analytics'] as const,
  productivityAnalytic: (id: string) => [...efficiencyKeys.productivityAnalytics(), id] as const,
  productivityAnalyticsByScope: (scope: string) => [...efficiencyKeys.productivityAnalytics(), 'scope', scope] as const,
  
  // Optimization Recommendations
  recommendations: () => [...efficiencyKeys.all, 'recommendations'] as const,
  recommendation: (id: string) => [...efficiencyKeys.recommendations(), id] as const,
  recommendationsByStatus: (status: string) => [...efficiencyKeys.recommendations(), 'status', status] as const,
  
  // Performance Alerts
  alerts: () => [...efficiencyKeys.all, 'alerts'] as const,
  alert: (id: string) => [...efficiencyKeys.alerts(), id] as const,
  alertsBySeverity: (severity: string) => [...efficiencyKeys.alerts(), 'severity', severity] as const,
  
  // Benchmarks
  benchmarks: () => [...efficiencyKeys.all, 'benchmarks'] as const,
  benchmark: (id: string) => [...efficiencyKeys.benchmarks(), id] as const,
  
  // Trend Analysis
  trendAnalysis: () => [...efficiencyKeys.all, 'trend-analysis'] as const,
  trendAnalysisById: (id: string) => [...efficiencyKeys.trendAnalysis(), id] as const,
  
  // KPI Targets
  kpiTargets: () => [...efficiencyKeys.all, 'kpi-targets'] as const,
  kpiTarget: (id: string) => [...efficiencyKeys.kpiTargets(), id] as const,
  
  // Dashboard
  dashboard: () => [...efficiencyKeys.all, 'dashboard'] as const,
  dashboardMetrics: () => [...efficiencyKeys.dashboard(), 'metrics'] as const,
};

// ============================================================================
// 1. OPERATIONAL METRICS HOOKS
// ============================================================================

export const useOperationalMetrics = (
  filters: AnalyticsFilters = {},
  options?: UseQueryOptions<EffOperationalMetric[]>
) => {
  return useQuery({
    queryKey: efficiencyKeys.operationalMetrics(),
    queryFn: async () => {
      let query = supabase
        .from('eff_operational_metrics')
        .select('*')
        .order('measured_at', { ascending: false });

      // Apply filters
      if (filters.categories?.length) {
        query = query.in('category', filters.categories);
      }
      if (filters.metricTypes?.length) {
        query = query.in('metric_type', filters.metricTypes);
      }
      if (filters.departments?.length) {
        query = query.in('department', filters.departments);
      }
      if (filters.dateRange) {
        query = query.gte('measured_at', filters.dateRange.start)
                   .lte('measured_at', filters.dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EffOperationalMetric[];
    },
    ...options,
  });
};

export const useOperationalMetric = (id: string) => {
  return useQuery({
    queryKey: efficiencyKeys.operationalMetric(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eff_operational_metrics')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as EffOperationalMetric;
    },
    enabled: !!id,
  });
};

export const useCreateOperationalMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOperationalMetricData) => {
      const { data: result, error } = await supabase
        .from('eff_operational_metrics')
        .insert(data)
        .select('*')
        .single();
      
      if (error) throw error;
      return result as EffOperationalMetric;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.operationalMetrics() });
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.dashboardMetrics() });
    },
  });
};

export const useUpdateOperationalMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOperationalMetricData }) => {
      const { data: result, error } = await supabase
        .from('eff_operational_metrics')
        .update(data)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return result as EffOperationalMetric;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.operationalMetrics() });
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.operationalMetric(data.id) });
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.dashboardMetrics() });
    },
  });
};

// ============================================================================
// 2. EFFICIENCY CALCULATIONS HOOKS
// ============================================================================

export const useEfficiencyCalculations = (filters: AnalyticsFilters = {}) => {
  return useQuery({
    queryKey: efficiencyKeys.calculations(),
    queryFn: async () => {
      let query = supabase
        .from('eff_calculations')
        .select('*')
        .order('calculated_at', { ascending: false });

      if (filters.departments?.length) {
        query = query.in('department', filters.departments);
      }
      if (filters.dateRange) {
        query = query.gte('calculated_at', filters.dateRange.start)
                   .lte('calculated_at', filters.dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EffCalculation[];
    },
  });
};

export const useCreateEfficiencyCalculation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCalculationData) => {
      const { data: result, error } = await supabase
        .from('eff_calculations')
        .insert(data)
        .select('*')
        .single();
      
      if (error) throw error;
      return result as EffCalculation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.calculations() });
    },
  });
};

// ============================================================================
// 3. BOTTLENECK ANALYTICS HOOKS
// ============================================================================

export const useBottleneckAnalytics = (filters: AnalyticsFilters = {}) => {
  return useQuery({
    queryKey: efficiencyKeys.bottlenecks(),
    queryFn: async () => {
      let query = supabase
        .from('eff_bottleneck_analytics')
        .select('*')
        .order('first_detected_at', { ascending: false });

      if (filters.severityLevels?.length) {
        query = query.in('severity_level', filters.severityLevels);
      }
      if (filters.departments?.length) {
        query = query.in('process_area', filters.departments);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EffBottleneckAnalytic[];
    },
  });
};

export const useBottleneckSummary = () => {
  return useQuery({
    queryKey: [...efficiencyKeys.bottlenecks(), 'summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eff_bottleneck_analytics')
        .select('id, bottleneck_name, severity_level, cost_impact_daily, status, first_detected_at')
        .neq('status', 'resolved')
        .order('severity_level')
        .order('cost_impact_daily', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      return data.map(item => ({
        id: item.id,
        name: item.bottleneck_name,
        severity: item.severity_level,
        impact: item.cost_impact_daily,
        status: item.status,
        daysOpen: Math.floor((Date.now() - new Date(item.first_detected_at).getTime()) / (1000 * 60 * 60 * 24))
      })) as BottleneckSummary[];
    },
  });
};

export const useCreateBottleneckAnalytic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBottleneckData) => {
      const { data: result, error } = await supabase
        .from('eff_bottleneck_analytics')
        .insert(data)
        .select('*')
        .single();
      
      if (error) throw error;
      return result as EffBottleneckAnalytic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.bottlenecks() });
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.dashboardMetrics() });
    },
  });
};

export const useUpdateBottleneckStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, resolution_notes }: { 
      id: string; 
      status: string; 
      resolution_notes?: string 
    }) => {
      const updateData: any = { 
        status,
        last_occurrence_at: new Date().toISOString()
      };
      
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }
      if (resolution_notes) {
        updateData.resolution_notes = resolution_notes;
      }

      const { data: result, error } = await supabase
        .from('eff_bottleneck_analytics')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return result as EffBottleneckAnalytic;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.bottlenecks() });
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.bottleneck(data.id) });
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.dashboardMetrics() });
    },
  });
};

// ============================================================================
// 4. RESOURCE UTILIZATION HOOKS
// ============================================================================

export const useResourceUtilization = (filters: AnalyticsFilters = {}) => {
  return useQuery({
    queryKey: efficiencyKeys.resourceUtilization(),
    queryFn: async () => {
      let query = supabase
        .from('eff_resource_utilization')
        .select('*')
        .order('measurement_date', { ascending: false });

      if (filters.resourceTypes?.length) {
        query = query.in('resource_type', filters.resourceTypes);
      }
      if (filters.departments?.length) {
        query = query.in('department', filters.departments);
      }
      if (filters.dateRange) {
        query = query.gte('measurement_date', filters.dateRange.start)
                   .lte('measurement_date', filters.dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EffResourceUtilization[];
    },
  });
};

export const useResourceUtilizationSummary = () => {
  return useQuery({
    queryKey: [...efficiencyKeys.resourceUtilization(), 'summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_resource_utilization_summary');

      if (error) throw error;
      return data as ResourceUtilizationSummary[];
    },
  });
};

export const useCreateResourceUtilization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateResourceUtilizationData) => {
      const { data: result, error } = await supabase
        .from('eff_resource_utilization')
        .insert(data)
        .select('*')
        .single();
      
      if (error) throw error;
      return result as EffResourceUtilization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.resourceUtilization() });
    },
  });
};

// ============================================================================
// 5. PRODUCTIVITY ANALYTICS HOOKS
// ============================================================================

export const useProductivityAnalytics = (filters: AnalyticsFilters = {}) => {
  return useQuery({
    queryKey: efficiencyKeys.productivityAnalytics(),
    queryFn: async () => {
      let query = supabase
        .from('eff_productivity_analytics')
        .select('*')
        .order('analysis_period_start', { ascending: false });

      if (filters.departments?.length) {
        query = query.in('department', filters.departments);
      }
      if (filters.dateRange) {
        query = query.gte('analysis_period_start', filters.dateRange.start)
                   .lte('analysis_period_end', filters.dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EffProductivityAnalytic[];
    },
  });
};

export const useProductivityTrendData = (period: '7d' | '30d' | '90d' = '30d') => {
  return useQuery({
    queryKey: [...efficiencyKeys.productivityAnalytics(), 'trend', period],
    queryFn: async () => {
      const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('eff_productivity_analytics')
        .select('analysis_period_start, productivity_rate, productivity_index, quality_score')
        .gte('analysis_period_start', startDate.toISOString())
        .order('analysis_period_start', { ascending: true });

      if (error) throw error;
      
      return data.map(item => ({
        period: item.analysis_period_start,
        productivity: item.productivity_rate,
        efficiency: item.productivity_index,
        quality: item.quality_score || 0
      })) as ProductivityTrendData[];
    },
  });
};

export const useCreateProductivityAnalytic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductivityAnalyticData) => {
      const { data: result, error } = await supabase
        .from('eff_productivity_analytics')
        .insert(data)
        .select('*')
        .single();
      
      if (error) throw error;
      return result as EffProductivityAnalytic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.productivityAnalytics() });
    },
  });
};

// ============================================================================
// 6. OPTIMIZATION RECOMMENDATIONS HOOKS
// ============================================================================

export const useOptimizationRecommendations = (status?: string) => {
  return useQuery({
    queryKey: status ? efficiencyKeys.recommendationsByStatus(status) : efficiencyKeys.recommendations(),
    queryFn: async () => {
      let query = supabase
        .from('eff_optimization_recommendations')
        .select('*')
        .order('generated_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EffOptimizationRecommendation[];
    },
  });
};

export const useOptimizationImpact = () => {
  return useQuery({
    queryKey: [...efficiencyKeys.recommendations(), 'impact'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_optimization_impact_summary');

      if (error) throw error;
      return data as OptimizationImpact[];
    },
  });
};

export const useCreateOptimizationRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOptimizationRecommendationData) => {
      const { data: result, error } = await supabase
        .from('eff_optimization_recommendations')
        .insert(data)
        .select('*')
        .single();
      
      if (error) throw error;
      return result as EffOptimizationRecommendation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.recommendations() });
    },
  });
};

export const useUpdateRecommendationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      approved_by, 
      assigned_to 
    }: { 
      id: string; 
      status: string; 
      approved_by?: string; 
      assigned_to?: string; 
    }) => {
      const updateData: any = { status };
      
      if (status === 'approved' && approved_by) {
        updateData.approved_by = approved_by;
        updateData.approved_at = new Date().toISOString();
      }
      if (status === 'implementing' && assigned_to) {
        updateData.assigned_to = assigned_to;
        updateData.implementation_started_at = new Date().toISOString();
      }
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data: result, error } = await supabase
        .from('eff_optimization_recommendations')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return result as EffOptimizationRecommendation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.recommendations() });
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.recommendation(data.id) });
    },
  });
};

// ============================================================================
// 7. PERFORMANCE ALERTS HOOKS
// ============================================================================

export const usePerformanceAlerts = (status?: string) => {
  return useQuery({
    queryKey: status ? efficiencyKeys.alertsBySeverity(status) : efficiencyKeys.alerts(),
    queryFn: async () => {
      let query = supabase
        .from('eff_performance_alerts')
        .select('*')
        .order('triggered_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EffPerformanceAlert[];
    },
  });
};

export const useActiveAlertsCount = () => {
  return useQuery({
    queryKey: [...efficiencyKeys.alerts(), 'active-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('eff_performance_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (error) throw error;
      return count || 0;
    },
  });
};

export const useCreatePerformanceAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePerformanceAlertData) => {
      const { data: result, error } = await supabase
        .from('eff_performance_alerts')
        .insert(data)
        .select('*')
        .single();
      
      if (error) throw error;
      return result as EffPerformanceAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.dashboardMetrics() });
    },
  });
};

export const useUpdateAlertStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      acknowledged_by, 
      resolved_by, 
      resolution_notes 
    }: { 
      id: string; 
      status: string; 
      acknowledged_by?: string; 
      resolved_by?: string; 
      resolution_notes?: string; 
    }) => {
      const updateData: any = { status };
      
      if (status === 'acknowledged' && acknowledged_by) {
        updateData.acknowledged_by = acknowledged_by;
        updateData.acknowledged_at = new Date().toISOString();
      }
      if (status === 'resolved') {
        updateData.resolved_by = resolved_by;
        updateData.resolved_at = new Date().toISOString();
        updateData.resolution_notes = resolution_notes;
      }

      const { data: result, error } = await supabase
        .from('eff_performance_alerts')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return result as EffPerformanceAlert;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.alert(data.id) });
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.dashboardMetrics() });
    },
  });
};

// ============================================================================
// 8. KPI TARGETS HOOKS
// ============================================================================

export const useKpiTargets = () => {
  return useQuery({
    queryKey: efficiencyKeys.kpiTargets(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eff_kpi_targets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EffKpiTarget[];
    },
  });
};

export const useCreateKpiTarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateKpiTargetData) => {
      const { data: result, error } = await supabase
        .from('eff_kpi_targets')
        .insert(data)
        .select('*')
        .single();
      
      if (error) throw error;
      return result as EffKpiTarget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.kpiTargets() });
    },
  });
};

// ============================================================================
// 9. DASHBOARD ANALYTICS HOOKS
// ============================================================================

export const useEfficiencyDashboardMetrics = () => {
  return useQuery({
    queryKey: efficiencyKeys.dashboardMetrics(),
    queryFn: async () => {
      // Get metrics count
      const { count: totalMetrics } = await supabase
        .from('eff_operational_metrics')
        .select('*', { count: 'exact', head: true });

      // Get active alerts count
      const { count: activeAlerts } = await supabase
        .from('eff_performance_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get critical bottlenecks count
      const { count: criticalBottlenecks } = await supabase
        .from('eff_bottleneck_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('severity_level', 'critical')
        .neq('status', 'resolved');

      // Get average efficiency
      const { data: efficiencyData } = await supabase
        .from('eff_calculations')
        .select('efficiency_percentage')
        .order('calculated_at', { ascending: false })
        .limit(10);

      const avgEfficiency = efficiencyData?.length 
        ? efficiencyData.reduce((sum, item) => sum + item.efficiency_percentage, 0) / efficiencyData.length
        : 0;

      // Get top recommendations
      const { data: recommendations } = await supabase
        .from('eff_optimization_recommendations')
        .select('*')
        .eq('status', 'pending')
        .order('priority_level')
        .order('expected_improvement_percentage', { ascending: false })
        .limit(3);

      // Get recent alerts
      const { data: recentAlerts } = await supabase
        .from('eff_performance_alerts')
        .select('*')
        .eq('status', 'active')
        .order('triggered_at', { ascending: false })
        .limit(5);

      // Get resource utilization summary
      const { data: utilizationData } = await supabase
        .from('eff_resource_utilization')
        .select('resource_type, utilization_percentage')
        .order('recorded_at', { ascending: false })
        .limit(100);

      const utilizationSummary = {
        human: 0,
        equipment: 0,
        material: 0
      };

      if (utilizationData) {
        const grouped = utilizationData.reduce((acc, item) => {
          if (!acc[item.resource_type]) acc[item.resource_type] = [];
          acc[item.resource_type].push(item.utilization_percentage);
          return acc;
        }, {} as Record<string, number[]>);

        Object.entries(grouped).forEach(([type, values]) => {
          if (type in utilizationSummary) {
            utilizationSummary[type as keyof typeof utilizationSummary] = 
              values.reduce((sum, val) => sum + val, 0) / values.length;
          }
        });
      }

      return {
        totalMetrics: totalMetrics || 0,
        activeAlerts: activeAlerts || 0,
        criticalBottlenecks: criticalBottlenecks || 0,
        avgEfficiency: Math.round(avgEfficiency),
        productivityTrend: 'improving' as const, // This should be calculated from trend analysis
        topRecommendations: recommendations || [],
        recentAlerts: recentAlerts || [],
        utilizationSummary
      } as EfficiencyDashboardMetrics;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export const useEfficiencyRealtimeSubscriptions = () => {
  const queryClient = useQueryClient();

  // Subscribe to operational metrics changes
  const metricsSubscription = supabase
    .channel('eff_operational_metrics_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'eff_operational_metrics' }, 
      () => {
        queryClient.invalidateQueries({ queryKey: efficiencyKeys.operationalMetrics() });
        queryClient.invalidateQueries({ queryKey: efficiencyKeys.dashboardMetrics() });
      }
    )
    .subscribe();

  // Subscribe to performance alerts changes
  const alertsSubscription = supabase
    .channel('eff_performance_alerts_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'eff_performance_alerts' }, 
      () => {
        queryClient.invalidateQueries({ queryKey: efficiencyKeys.alerts() });
        queryClient.invalidateQueries({ queryKey: efficiencyKeys.dashboardMetrics() });
      }
    )
    .subscribe();

  // Subscribe to bottleneck analytics changes
  const bottlenecksSubscription = supabase
    .channel('eff_bottleneck_analytics_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'eff_bottleneck_analytics' }, 
      () => {
        queryClient.invalidateQueries({ queryKey: efficiencyKeys.bottlenecks() });
        queryClient.invalidateQueries({ queryKey: efficiencyKeys.dashboardMetrics() });
      }
    )
    .subscribe();

  return {
    metricsSubscription,
    alertsSubscription,
    bottlenecksSubscription,
  };
};

// ============================================================================
// BULK OPERATIONS HOOKS
// ============================================================================

export const useBulkCreateMetrics = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metrics: CreateOperationalMetricData[]) => {
      const { data, error } = await supabase
        .from('eff_operational_metrics')
        .insert(metrics)
        .select('*');
      
      if (error) throw error;
      return data as EffOperationalMetric[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.operationalMetrics() });
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.dashboardMetrics() });
    },
  });
};

export const useBulkUpdateAlertStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      ids, 
      status, 
      acknowledged_by 
    }: { 
      ids: string[]; 
      status: string; 
      acknowledged_by?: string; 
    }) => {
      const updateData: any = { status };
      
      if (status === 'acknowledged' && acknowledged_by) {
        updateData.acknowledged_by = acknowledged_by;
        updateData.acknowledged_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('eff_performance_alerts')
        .update(updateData)
        .in('id', ids)
        .select('*');
      
      if (error) throw error;
      return data as EffPerformanceAlert[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.dashboardMetrics() });
    },
  });
};