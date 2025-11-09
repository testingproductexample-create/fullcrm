import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface OperationalAnalytics {
  id: number;
  metric_name: string;
  metric_category: string;
  metric_value: number;
  metric_unit?: string;
  time_period: string;
  department?: string;
  employee_id?: string;
  project_id?: string;
  workflow_id?: string;
  quality_score?: number;
  completion_time_minutes?: number;
  sla_compliance: boolean;
  bottleneck_score?: number;
  resource_efficiency?: number;
  customer_satisfaction?: number;
  created_at: string;
  updated_at: string;
  data_date: string;
  tags?: string[];
  metadata?: any;
}

export interface EmployeePerformance {
  id: number;
  employee_id: string;
  employee_name: string;
  department: string;
  position?: string;
  performance_score: number;
  productivity_index?: number;
  task_completion_rate?: number;
  quality_rating?: number;
  time_efficiency?: number;
  collaboration_score?: number;
  innovation_rating?: number;
  leadership_score?: number;
  customer_satisfaction?: number;
  goal_achievement_rate?: number;
  training_hours_completed?: number;
  certifications_earned: number;
  improvement_areas?: string[];
  strengths?: string[];
  goals_set: number;
  goals_achieved: number;
  performance_trend: 'improving' | 'declining' | 'stable';
  peer_rating?: number;
  manager_rating?: number;
  performance_period: string;
  evaluation_date: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

export interface ResourceUtilization {
  id: number;
  resource_type: string;
  resource_id: string;
  resource_name: string;
  department?: string;
  utilization_rate: number;
  capacity_total: number;
  capacity_used: number;
  capacity_available: number;
  efficiency_score?: number;
  downtime_hours: number;
  maintenance_hours: number;
  idle_time_hours: number;
  peak_utilization?: number;
  average_utilization?: number;
  cost_per_hour?: number;
  total_cost?: number;
  roi_percentage?: number;
  performance_rating?: number;
  quality_issues: number;
  maintenance_required: boolean;
  resource_status: 'active' | 'maintenance' | 'offline' | 'retired';
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  utilization_date: string;
  time_period: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  metadata?: any;
}

export interface WorkflowMetrics {
  id: number;
  workflow_id: string;
  workflow_name: string;
  workflow_category: string;
  process_step: string;
  step_order: number;
  total_steps: number;
  completion_rate: number;
  average_completion_time_minutes?: number;
  target_completion_time_minutes?: number;
  time_variance_percentage?: number;
  quality_score?: number;
  error_rate?: number;
  rework_rate?: number;
  automation_level?: number;
  manual_intervention_count: number;
  throughput_per_hour?: number;
  bottleneck_score?: number;
  efficiency_rating?: number;
  cost_per_transaction?: number;
  customer_satisfaction?: number;
  sla_compliance_rate?: number;
  escalation_count: number;
  approval_queue_time_minutes?: number;
  review_cycles: number;
  approval_rate?: number;
  rejection_reasons?: string[];
  improvement_suggestions?: string[];
  automation_opportunities?: string[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  compliance_score?: number;
  audit_score?: number;
  measurement_date: string;
  time_period: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  metadata?: any;
}

// Analytics service functions
export const analyticsService = {
  // Operational Analytics
  async getOperationalMetrics(filters?: {
    department?: string;
    time_period?: string;
    metric_category?: string;
  }) {
    let query = supabase
      .from('operational_analytics')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.department) {
      query = query.eq('department', filters.department);
    }
    if (filters?.time_period) {
      query = query.eq('time_period', filters.time_period);
    }
    if (filters?.metric_category) {
      query = query.eq('metric_category', filters.metric_category);
    }

    return query;
  },

  async getPerformanceTrends(timeRange: string = '6months') {
    return supabase
      .from('operational_analytics')
      .select('data_date, metric_name, metric_value, metric_category')
      .gte('data_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('data_date');
  },

  // Employee Performance
  async getEmployeePerformance(filters?: {
    department?: string;
    period?: string;
  }) {
    let query = supabase
      .from('employee_performance')
      .select('*')
      .order('performance_score', { ascending: false });

    if (filters?.department) {
      query = query.eq('department', filters.department);
    }
    if (filters?.period) {
      query = query.eq('performance_period', filters.period);
    }

    return query;
  },

  async getTopPerformers(limit: number = 10) {
    return supabase
      .from('employee_performance')
      .select('*')
      .order('performance_score', { ascending: false })
      .limit(limit);
  },

  // Resource Utilization
  async getResourceUtilization(filters?: {
    resource_type?: string;
    department?: string;
    status?: string;
  }) {
    let query = supabase
      .from('resource_utilization')
      .select('*')
      .order('utilization_rate', { ascending: false });

    if (filters?.resource_type) {
      query = query.eq('resource_type', filters.resource_type);
    }
    if (filters?.department) {
      query = query.eq('department', filters.department);
    }
    if (filters?.status) {
      query = query.eq('resource_status', filters.status);
    }

    return query;
  },

  async getResourceEfficiency() {
    return supabase
      .from('resource_utilization')
      .select('resource_type, utilization_rate, efficiency_score, roi_percentage')
      .order('efficiency_score', { ascending: false });
  },

  // Workflow Metrics
  async getWorkflowMetrics(filters?: {
    category?: string;
    risk_level?: string;
  }) {
    let query = supabase
      .from('workflow_metrics')
      .select('*')
      .order('bottleneck_score', { ascending: false });

    if (filters?.category) {
      query = query.eq('workflow_category', filters.category);
    }
    if (filters?.risk_level) {
      query = query.eq('risk_level', filters.risk_level);
    }

    return query;
  },

  async getBottleneckAnalysis() {
    return supabase
      .from('workflow_metrics')
      .select('workflow_name, process_step, bottleneck_score, completion_rate, sla_compliance_rate')
      .gte('bottleneck_score', 50)
      .order('bottleneck_score', { ascending: false });
  },

  async getSLATracking() {
    return supabase
      .from('workflow_metrics')
      .select('workflow_name, sla_compliance_rate, measurement_date')
      .order('measurement_date', { ascending: false });
  },

  // Utility functions
  async getDepartments() {
    return supabase
      .from('operational_analytics')
      .select('department')
      .not('department', 'is', null)
      .order('department');
  },

  async getTimePeriods() {
    return supabase
      .from('operational_analytics')
      .select('time_period')
      .order('time_period');
  },

  // Aggregation functions
  async getPerformanceSummary() {
    const [analytics, employees, resources, workflows] = await Promise.all([
      supabase.from('operational_analytics').select('metric_value, metric_category'),
      supabase.from('employee_performance').select('performance_score'),
      supabase.from('resource_utilization').select('utilization_rate'),
      supabase.from('workflow_metrics').select('sla_compliance_rate')
    ]);

    return {
      analytics: analytics.data || [],
      employees: employees.data || [],
      resources: resources.data || [],
      workflows: workflows.data || []
    };
  }
};

export default supabase;