import { createClient } from '@supabase/supabase-js';
import { 
  Employee, 
  PerformanceMetric, 
  TimeTracking, 
  Resource, 
  ResourceUtilization,
  Order,
  OrderProcessingStep,
  Workflow,
  WorkflowExecution,
  Appointment,
  CustomerServiceInteraction,
  QualityControl,
  InventoryItem,
  InventoryTransaction,
  CostAnalysis,
  PerformanceBenchmark,
  ReportSchedule,
  OperationalAlert,
  SystemConfiguration,
  DashboardSummary,
  KPIMetric,
  PerformanceSummary,
  ResourceUtilizationSummary,
  WorkflowAnalysis,
  AnalyticsResult,
  FilterOptions,
  DateRange,
  ApiResponse,
  PaginatedResponse
} from '../types/analytics';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Comprehensive Analytics Service
export class OperationalAnalyticsService {
  // Dashboard and Overview
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const [employees, performance, orders, resources, alerts] = await Promise.all([
        this.getEmployeeCount(),
        this.getAveragePerformanceScore(),
        this.getOrderMetrics(),
        this.getResourceUtilization(),
        this.getAlertMetrics()
      ]);

      return {
        total_employees: employees.total,
        active_employees: employees.active,
        avg_performance_score: performance.average,
        total_orders_today: orders.today.total,
        orders_completed_today: orders.today.completed,
        resource_utilization_rate: resources.utilization_rate,
        quality_score_average: performance.quality_score,
        cost_efficiency_index: resources.cost_efficiency,
        active_alerts: alerts.active,
        critical_alerts: alerts.critical
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }

  async getKpiMetrics(filters?: FilterOptions): Promise<KPIMetric[]> {
    try {
      const { data, error } = await supabase
        .from('performance_benchmarks')
        .select('*')
        .order('category');

      if (error) throw error;

      return data?.map(benchmark => ({
        id: benchmark.id,
        name: benchmark.metric_name,
        value: benchmark.current_value,
        target: benchmark.target_value,
        unit: benchmark.unit,
        trend: this.calculateTrend(benchmark.current_value, benchmark.previous_value),
        trend_percentage: this.calculateTrendPercentage(benchmark.current_value, benchmark.previous_value),
        color: this.getPerformanceColor(benchmark.achievement_rate),
        description: `Target: ${benchmark.target_value} ${benchmark.unit}, Current: ${benchmark.current_value} ${benchmark.unit}`
      })) || [];
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
      throw error;
    }
  }

  // Employee Performance Analytics
  async getEmployeePerformance(filters?: FilterOptions): Promise<PaginatedResponse<PerformanceSummary>> {
    try {
      let query = supabase
        .from('performance_metrics')
        .select(`
          *,
          employees (
            id,
            first_name,
            last_name,
            department,
            position
          )
        `);

      if (filters?.departments?.length) {
        query = query.in('employees.department', filters.departments);
      }

      if (filters?.timeRange) {
        query = query
          .gte('metric_date', filters.timeRange.start)
          .lte('metric_date', filters.timeRange.end);
      }

      const { data, error, count } = await query
        .order('metric_date', { ascending: false })
        .range(0, 49);

      if (error) throw error;

      // Group by employee and calculate summaries
      const performanceByEmployee = new Map<string, PerformanceSummary>();
      
      data?.forEach(metric => {
        const employeeId = metric.employee_id;
        const employee = metric.employees;
        
        if (!performanceByEmployee.has(employeeId)) {
          performanceByEmployee.set(employeeId, {
            department: employee?.department || 'Unknown',
            employee_count: 1,
            avg_performance: metric.overall_performance_score || 0,
            productivity_index: metric.productivity_score || 0,
            efficiency_score: metric.time_efficiency_score || 0,
            quality_rating: metric.quality_rating || 0,
            goal_achievement: (metric.goals_achieved / Math.max(metric.goals_set, 1)) * 100,
            improvement_trend: metric.performance_trend
          });
        } else {
          const summary = performanceByEmployee.get(employeeId)!;
          summary.employee_count += 1;
          summary.avg_performance = (summary.avg_performance + (metric.overall_performance_score || 0)) / 2;
          summary.productivity_index = (summary.productivity_index + (metric.productivity_score || 0)) / 2;
        }
      });

      return {
        items: Array.from(performanceByEmployee.values()),
        page: 1,
        limit: 50,
        total: performanceByEmployee.size,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false
      };
    } catch (error) {
      console.error('Error fetching employee performance:', error);
      throw error;
    }
  }

  async getTopPerformers(limit: number = 10, department?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('performance_metrics')
        .select(`
          *,
          employees (
            id,
            first_name,
            last_name,
            department,
            position
          )
        `)
        .order('overall_performance_score', { ascending: false })
        .limit(limit);

      if (department) {
        query = query.eq('employees.department', department);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching top performers:', error);
      throw error;
    }
  }

  // Time Tracking Analytics
  async getTimeTrackingAnalytics(filters?: FilterOptions): Promise<any[]> {
    try {
      let query = supabase
        .from('time_tracking')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            department
          )
        `)
        .order('clock_in_time', { ascending: false });

      if (filters?.timeRange) {
        query = query
          .gte('clock_in_time', filters.timeRange.start)
          .lte('clock_in_time', filters.timeRange.end);
      }

      if (filters?.departments?.length) {
        query = query.in('employees.department', filters.departments);
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching time tracking analytics:', error);
      throw error;
    }
  }

  // Resource Utilization Analytics
  async getResourceUtilizationAnalytics(filters?: FilterOptions): Promise<ResourceUtilizationSummary[]> {
    try {
      let query = supabase
        .from('resource_utilization')
        .select(`
          *,
          resources (
            resource_type,
            category,
            department
          )
        `);

      if (filters?.timeRange) {
        query = query
          .gte('utilization_date', filters.timeRange.start)
          .lte('utilization_date', filters.timeRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by resource type and calculate summaries
      const utilizationByType = new Map<string, ResourceUtilizationSummary>();
      
      data?.forEach(utilization => {
        const resourceType = utilization.resources?.resource_type || 'Unknown';
        
        if (!utilizationByType.has(resourceType)) {
          utilizationByType.set(resourceType, {
            resource_type: resourceType,
            total_resources: 1,
            utilization_rate: utilization.utilization_rate,
            efficiency_score: utilization.efficiency_score || 0,
            cost_per_hour: utilization.cost_per_hour || 0,
            roi_percentage: 0, // Calculate based on efficiency and cost
            maintenance_required: utilization.maintenance_required ? 1 : 0,
            downtime_hours: utilization.downtime_hours
          });
        } else {
          const summary = utilizationByType.get(resourceType)!;
          summary.total_resources += 1;
          summary.utilization_rate = (summary.utilization_rate + utilization.utilization_rate) / 2;
          summary.efficiency_score = (summary.efficiency_score + (utilization.efficiency_score || 0)) / 2;
          summary.maintenance_required += utilization.maintenance_required ? 1 : 0;
        }
      });

      return Array.from(utilizationByType.values());
    } catch (error) {
      console.error('Error fetching resource utilization analytics:', error);
      throw error;
    }
  }

  // Order Completion Analytics
  async getOrderCompletionAnalytics(filters?: FilterOptions): Promise<any[]> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_processing_steps (*)
        `)
        .order('order_date', { ascending: false });

      if (filters?.timeRange) {
        query = query
          .gte('order_date', filters.timeRange.start)
          .lte('order_date', filters.timeRange.end);
      }

      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching order completion analytics:', error);
      throw error;
    }
  }

  async identifyBottlenecks(filters?: FilterOptions): Promise<any[]> {
    try {
      let query = supabase
        .from('order_processing_steps')
        .select(`
          *,
          orders (
            order_number,
            status,
            priority_level
          )
        `)
        .in('status', ['delayed', 'blocked']);

      if (filters?.timeRange) {
        query = query
          .gte('created_at', filters.timeRange.start)
          .lte('created_at', filters.timeRange.end);
      }

      const { data, error } = await query
        .order('actual_duration_minutes', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error identifying bottlenecks:', error);
      throw error;
    }
  }

  // Workflow Efficiency Analytics
  async getWorkflowAnalysis(filters?: FilterOptions): Promise<WorkflowAnalysis[]> {
    try {
      let query = supabase
        .from('workflow_executions')
        .select(`
          *,
          workflows (
            workflow_name,
            workflow_category
          )
        `);

      if (filters?.timeRange) {
        query = query
          .gte('started_at', filters.timeRange.start)
          .lte('started_at', filters.timeRange.end);
      }

      const { data, error } = await query.order('started_at', { ascending: false });

      if (error) throw error;

      // Group by workflow and calculate metrics
      const workflowAnalysis = new Map<string, WorkflowAnalysis>();
      
      data?.forEach(execution => {
        const workflowId = execution.workflow_id;
        const workflow = execution.workflows;
        
        if (!workflowAnalysis.has(workflowId)) {
          workflowAnalysis.set(workflowId, {
            workflow_name: workflow?.workflow_name || 'Unknown',
            completion_rate: execution.status === 'completed' ? 100 : 0,
            avg_duration: execution.total_duration_minutes || 0,
            bottleneck_score: execution.bottleneck_score,
            automation_level: 0, // Get from workflow definition
            quality_score: execution.quality_score || 0,
            cost_per_execution: execution.total_cost,
            improvement_opportunities: execution.improvement_opportunities || []
          });
        } else {
          const analysis = workflowAnalysis.get(workflowId)!;
          const isCompleted = execution.status === 'completed';
          const newRate = isCompleted ? 100 : 0;
          analysis.completion_rate = (analysis.completion_rate + newRate) / 2;
          analysis.avg_duration = (analysis.avg_duration + (execution.total_duration_minutes || 0)) / 2;
          analysis.bottleneck_score = Math.max(analysis.bottleneck_score, execution.bottleneck_score);
        }
      });

      return Array.from(workflowAnalysis.values());
    } catch (error) {
      console.error('Error fetching workflow analysis:', error);
      throw error;
    }
  }

  // Appointment Analytics
  async getAppointmentAnalytics(filters?: FilterOptions): Promise<any[]> {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            department
          )
        `)
        .order('scheduled_date', { ascending: false });

      if (filters?.timeRange) {
        query = query
          .gte('scheduled_date', filters.timeRange.start)
          .lte('scheduled_date', filters.timeRange.end);
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching appointment analytics:', error);
      throw error;
    }
  }

  // Customer Service Performance
  async getCustomerServiceMetrics(filters?: FilterOptions): Promise<any[]> {
    try {
      let query = supabase
        .from('customer_service_interactions')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            department
          )
        `)
        .order('creation_date', { ascending: false });

      if (filters?.timeRange) {
        query = query
          .gte('creation_date', filters.timeRange.start)
          .lte('creation_date', filters.timeRange.end);
      }

      if (filters?.departments?.length) {
        query = query.in('employees.department', filters.departments);
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customer service metrics:', error);
      throw error;
    }
  }

  // Quality Control Analytics
  async getQualityControlAnalytics(filters?: FilterOptions): Promise<any[]> {
    try {
      let query = supabase
        .from('quality_control')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            department
          )
        `)
        .order('inspection_date', { ascending: false });

      if (filters?.timeRange) {
        query = query
          .gte('inspection_date', filters.timeRange.start)
          .lte('inspection_date', filters.timeRange.end);
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching quality control analytics:', error);
      throw error;
    }
  }

  // Inventory Analytics
  async getInventoryTurnoverAnalytics(filters?: FilterOptions): Promise<any[]> {
    try {
      let query = supabase
        .from('inventory_transactions')
        .select(`
          *,
          inventory_items (
            item_name,
            category,
            unit_cost
          )
        `)
        .order('transaction_date', { ascending: false });

      if (filters?.timeRange) {
        query = query
          .gte('transaction_date', filters.timeRange.start)
          .lte('transaction_date', filters.timeRange.end);
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching inventory analytics:', error);
      throw error;
    }
  }

  // Cost Analysis
  async getCostPerOrderAnalysis(filters?: FilterOptions): Promise<CostAnalysis[]> {
    try {
      let query = supabase
        .from('cost_analysis')
        .select('*')
        .order('period_start', { ascending: false });

      if (filters?.timeRange) {
        query = query
          .gte('period_start', filters.timeRange.start)
          .lte('period_end', filters.timeRange.end);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching cost analysis:', error);
      throw error;
    }
  }

  // Employee Utilization
  async getEmployeeUtilization(filters?: FilterOptions): Promise<any[]> {
    try {
      let query = supabase
        .from('time_tracking')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            department,
            position
          )
        `)
        .not('clock_out_time', 'is', null);

      if (filters?.timeRange) {
        query = query
          .gte('clock_in_time', filters.timeRange.start)
          .lte('clock_in_time', filters.timeRange.end);
      }

      if (filters?.departments?.length) {
        query = query.in('employees.department', filters.departments);
      }

      const { data, error } = await query.order('clock_in_time', { ascending: false });

      if (error) throw error;

      // Calculate utilization metrics per employee
      const utilizationByEmployee = new Map<string, any>();
      
      data?.forEach(timeEntry => {
        const employeeId = timeEntry.employee_id;
        const employee = timeEntry.employees;
        
        if (!utilizationByEmployee.has(employeeId)) {
          utilizationByEmployee.set(employeeId, {
            employee_id: employeeId,
            employee_name: `${employee?.first_name} ${employee?.last_name}`,
            department: employee?.department,
            position: employee?.position,
            total_hours: timeEntry.total_hours_worked,
            regular_hours: timeEntry.regular_hours,
            overtime_hours: timeEntry.overtime_hours,
            productivity_percentage: timeEntry.productivity_percentage,
            entry_count: 1
          });
        } else {
          const utilization = utilizationByEmployee.get(employeeId)!;
          utilization.total_hours += timeEntry.total_hours_worked;
          utilization.regular_hours += timeEntry.regular_hours;
          utilization.overtime_hours += timeEntry.overtime_hours;
          utilization.productivity_percentage = (utilization.productivity_percentage + timeEntry.productivity_percentage) / 2;
          utilization.entry_count += 1;
        }
      });

      return Array.from(utilizationByEmployee.values());
    } catch (error) {
      console.error('Error fetching employee utilization:', error);
      throw error;
    }
  }

  // Performance Benchmarking
  async getPerformanceBenchmarks(filters?: FilterOptions): Promise<PerformanceBenchmark[]> {
    try {
      let query = supabase
        .from('performance_benchmarks')
        .select('*')
        .order('category');

      if (filters?.categories?.length) {
        query = query.in('category', filters.categories);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching performance benchmarks:', error);
      throw error;
    }
  }

  // Automated Reports
  async getReportSchedules(): Promise<ReportSchedule[]> {
    try {
      const { data, error } = await supabase
        .from('report_schedules')
        .select('*')
        .eq('active', true)
        .order('report_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching report schedules:', error);
      throw error;
    }
  }

  // Alerts and Notifications
  async getActiveAlerts(filters?: FilterOptions): Promise<OperationalAlert[]> {
    try {
      let query = supabase
        .from('operational_alerts')
        .select('*')
        .eq('status', 'active')
        .order('triggered_at', { ascending: false });

      if (filters?.categories?.length) {
        query = query.in('category', filters.categories);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      throw error;
    }
  }

  // Utility Methods
  private calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    if (current > previous * 1.05) return 'up';
    if (current < previous * 0.95) return 'down';
    return 'stable';
  }

  private calculateTrendPercentage(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  private getPerformanceColor(achievementRate: number): 'green' | 'yellow' | 'red' | 'blue' {
    if (achievementRate >= 90) return 'green';
    if (achievementRate >= 70) return 'yellow';
    if (achievementRate >= 50) return 'red';
    return 'blue';
  }

  // Helper methods for dashboard metrics
  private async getEmployeeCount(): Promise<{ total: number; active: number }> {
    const { data, error } = await supabase
      .from('employees')
      .select('status');

    if (error) throw error;

    return {
      total: data?.length || 0,
      active: data?.filter(e => e.status === 'active').length || 0
    };
  }

  private async getAveragePerformanceScore(): Promise<{ average: number; quality_score: number }> {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('overall_performance_score, quality_rating')
      .order('metric_date', { ascending: false })
      .limit(100);

    if (error) throw error;

    const scores = data?.map(m => m.overall_performance_score).filter(s => s !== null) || [];
    const qualityScores = data?.map(m => m.quality_rating).filter(s => s !== null) || [];

    return {
      average: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      quality_score: qualityScores.length > 0 ? 
        (qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length) * 20 : 0 // Convert 5-point to 100-point scale
    };
  }

  private async getOrderMetrics(): Promise<{ today: { total: number; completed: number } }> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('orders')
      .select('status')
      .gte('order_date', today);

    if (error) throw error;

    return {
      today: {
        total: data?.length || 0,
        completed: data?.filter(o => o.status === 'completed').length || 0
      }
    };
  }

  private async getResourceUtilization(): Promise<{ utilization_rate: number; cost_efficiency: number }> {
    const { data, error } = await supabase
      .from('resource_utilization')
      .select('utilization_rate, efficiency_score')
      .order('utilization_date', { ascending: false })
      .limit(100);

    if (error) throw error;

    const rates = data?.map(r => r.utilization_rate).filter(r => r !== null) || [];
    const efficiency = data?.map(r => r.efficiency_score).filter(s => s !== null) || [];

    return {
      utilization_rate: rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0,
      cost_efficiency: efficiency.length > 0 ? efficiency.reduce((a, b) => a + b, 0) / efficiency.length : 0
    };
  }

  private async getAlertMetrics(): Promise<{ active: number; critical: number }> {
    const { data, error } = await supabase
      .from('operational_alerts')
      .select('severity')
      .eq('status', 'active');

    if (error) throw error;

    return {
      active: data?.length || 0,
      critical: data?.filter(a => a.severity === 'critical').length || 0
    };
  }
}

// Export service instance
export const analyticsService = new OperationalAnalyticsService();

// Export supabase client
export default supabase;
