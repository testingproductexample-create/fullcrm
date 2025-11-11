// Analytics & Business Intelligence System Types
// Comprehensive analytics and reporting capabilities

// ================================
// CORE ANALYTICS TYPES
// ================================

export interface BusinessIntelligence {
  id: string;
  organization_id: string;
  
  // Metric Information
  metric_category: 'financial' | 'operational' | 'customer' | 'employee' | 'inventory';
  metric_name: string;
  metric_key: string; // Unique identifier for programmatic access
  
  // Data
  metric_value: number;
  metric_target?: number;
  previous_value?: number;
  
  // Time Period
  date_period: string;
  period_type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  
  // Metadata
  unit?: string; // percentage, currency, count, ratio
  calculation_method?: string; // How this metric was calculated
  data_sources?: string[]; // Source systems/tables
  
  // Status
  is_target_met?: boolean;
  variance_percentage?: number;
  trend_direction?: 'up' | 'down' | 'stable';
  
  created_at: string;
}

export interface KPIMetric {
  id: string;
  organization_id: string;
  
  // KPI Configuration
  kpi_name: string;
  kpi_code: string; // Unique identifier
  category: string;
  subcategory?: string;
  
  // Display Settings
  display_order: number;
  chart_type: 'number' | 'gauge' | 'chart' | 'trend';
  color_scheme: string;
  
  // Calculation
  calculation_query?: string; // SQL query to calculate the metric
  target_value?: number;
  target_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  
  // Alerts
  alert_threshold_low?: number;
  alert_threshold_high?: number;
  alert_enabled: boolean;
  
  // Permissions
  visible_to_roles: string[];
  dashboard_sections: string[]; // Which dashboards to show on
  
  // Status
  is_active: boolean;
  refresh_frequency_minutes: number;
  
  // Metadata
  description?: string;
  data_sources?: string[];
  
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Current value (calculated)
  current_value?: number;
  last_updated?: string;
}

export interface CustomReport {
  id: string;
  organization_id: string;
  
  // Report Details
  report_name: string;
  report_code: string;
  category: string;
  
  // Configuration
  report_query: string; // SQL query for the report
  parameters?: Record<string, any>; // Configurable parameters
  filters?: Record<string, any>; // Default filters
  
  // Visualization
  chart_config?: Record<string, any>; // Chart.js configuration
  table_columns?: any[]; // Table column definitions
  
  // Scheduling
  schedule_enabled: boolean;
  schedule_frequency?: string; // daily, weekly, monthly
  schedule_time?: string;
  schedule_day_of_week?: number; // 0=Sunday, 1=Monday, etc.
  schedule_day_of_month?: number; // 1-31
  
  // Recipients
  email_recipients?: string[];
  notification_channels?: string[];
  
  // Permissions
  visibility: 'private' | 'team' | 'organization';
  accessible_roles: string[];
  
  // Status
  is_active: boolean;
  last_generated_at?: string;
  next_scheduled_at?: string;
  
  // Metadata
  description?: string;
  tags?: string[];
  
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Runtime data
  data?: any[];
  generated_at?: string;
}

export interface DashboardConfig {
  id: string;
  organization_id: string;
  
  // Dashboard Details
  dashboard_name: string;
  dashboard_code: string;
  dashboard_type: 'executive' | 'operational' | 'financial' | 'customer';
  
  // Layout Configuration
  layout: Record<string, any>; // Dashboard layout configuration
  widgets: DashboardWidget[]; // Widget configurations
  
  // Settings
  refresh_interval_seconds: number;
  auto_refresh_enabled: boolean;
  
  // Permissions
  visible_to_roles: string[];
  is_default: boolean;
  
  // Personalization
  user_customizations?: Record<string, any>; // User-specific customizations
  
  // Status
  is_active: boolean;
  
  // Metadata
  description?: string;
  
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface DashboardWidget {
  id: string;
  widget_type: 'metric' | 'chart' | 'table' | 'gauge' | 'trend' | 'list';
  title: string;
  
  // Position and Size
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Data Configuration
  data_source: string; // KPI code, query, or endpoint
  refresh_interval?: number; // Override dashboard default
  
  // Visualization Settings
  chart_type?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  color_scheme?: string;
  display_options?: Record<string, any>;
  
  // Filters and Parameters
  filters?: Record<string, any>;
  parameters?: Record<string, any>;
  
  // Interactivity
  clickable?: boolean;
  drill_down_config?: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}

// ================================
// BUSINESS METRICS & ANALYTICS
// ================================

export interface ExecutiveSummary {
  // Financial Metrics
  total_revenue_month: number;
  total_revenue_growth_percent: number;
  profit_margin_percent: number;
  
  // Operational Metrics
  total_orders_month: number;
  order_completion_rate: number;
  avg_order_value: number;
  
  // Customer Metrics
  total_customers: number;
  new_customers_month: number;
  customer_retention_rate: number;
  customer_satisfaction_avg: number;
  
  // Employee Metrics
  total_employees: number;
  employee_productivity_score: number;
  employee_satisfaction_avg: number;
  
  // Inventory Metrics
  inventory_value_aed: number;
  inventory_turnover_ratio: number;
  low_stock_items: number;
  
  // Quality Metrics
  quality_pass_rate: number;
  defect_rate: number;
  
  // Communication Metrics
  messages_sent_month: number;
  customer_response_rate: number;
}

export interface FinancialAnalytics {
  // Revenue Analysis
  monthly_revenue: number[];
  revenue_by_service: Record<string, number>;
  revenue_trend: 'up' | 'down' | 'stable';
  
  // Profitability
  gross_margin_percent: number;
  operating_margin_percent: number;
  net_margin_percent: number;
  
  // Cash Flow
  cash_inflow: number;
  cash_outflow: number;
  cash_balance: number;
  
  // Accounts
  accounts_receivable: number;
  accounts_payable: number;
  overdue_invoices: number;
  
  // Cost Analysis
  cost_breakdown: Record<string, number>;
  cost_per_order: number;
  
  // Forecasting
  projected_revenue_next_month: number;
  seasonal_patterns: Record<string, number>;
}

export interface OperationalAnalytics {
  // Order Management
  orders_in_progress: number;
  avg_order_completion_time_days: number;
  on_time_delivery_rate: number;
  order_volume_trend: number[];
  
  // Workflow Efficiency
  workflow_stages_avg_time: Record<string, number>;
  bottleneck_stages: string[];
  efficiency_score: number;
  
  // Resource Utilization
  employee_utilization_percent: number;
  equipment_utilization_percent: number;
  workspace_utilization_percent: number;
  
  // Quality Metrics
  first_time_right_rate: number;
  rework_rate: number;
  customer_complaint_rate: number;
  
  // Appointment Management
  appointment_booking_rate: number;
  no_show_rate: number;
  appointment_satisfaction: number;
}

export interface CustomerAnalytics {
  // Demographics
  customer_segments: Record<string, number>;
  age_distribution: Record<string, number>;
  location_distribution: Record<string, number>;
  
  // Behavior
  avg_orders_per_customer: number;
  customer_lifetime_value: number;
  repeat_customer_rate: number;
  
  // Satisfaction
  nps_score: number;
  satisfaction_ratings: Record<string, number>;
  complaint_resolution_time: number;
  
  // Engagement
  communication_response_rate: number;
  appointment_attendance_rate: number;
  referral_rate: number;
  
  // Churn Analysis
  churn_rate_percent: number;
  at_risk_customers: number;
  retention_strategies_effectiveness: Record<string, number>;
}

export interface PerformanceMetric {
  id: string;
  organization_id: string;
  
  // System Information
  metric_source: 'system' | 'application' | 'database' | 'external_api';
  metric_type: string; // response_time, throughput, error_rate, etc.
  
  // Data
  metric_value: number;
  metric_unit: string; // ms, requests/sec, percentage, etc.
  
  // Context
  service_name?: string;
  endpoint_path?: string;
  user_id?: string;
  session_id?: string;
  
  // Timing
  timestamp_utc: string;
  date_day?: string;
  date_hour?: number;
  
  created_at: string;
}

// ================================
// CHART & VISUALIZATION TYPES
// ================================

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      position: 'top' | 'bottom' | 'left' | 'right';
      display: boolean;
    };
    title?: {
      display: boolean;
      text: string;
    };
  };
  scales?: {
    y?: {
      beginAtZero: boolean;
      grid?: {
        color: string;
      };
      ticks?: {
        color: string;
      };
    };
    x?: {
      grid?: {
        color: string;
      };
      ticks?: {
        color: string;
      };
    };
  };
}

// ================================
// REPORTING & SCHEDULING
// ================================

export interface ReportSchedule {
  id: string;
  organization_id: string;
  
  // Schedule Details
  schedule_name: string;
  report_id?: string;
  dashboard_id?: string;
  
  // Timing
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  schedule_time: string;
  schedule_day_of_week?: number; // For weekly (0=Sunday)
  schedule_day_of_month?: number; // For monthly (1-31)
  timezone: string;
  
  // Recipients
  email_recipients: string[];
  notification_recipients?: string[]; // Employee IDs
  
  // Delivery Options
  delivery_format: 'pdf' | 'excel' | 'csv' | 'email_inline';
  include_charts: boolean;
  include_data: boolean;
  
  // Status
  is_active: boolean;
  last_executed_at?: string;
  next_execution_at?: string;
  execution_status: 'pending' | 'running' | 'completed' | 'failed';
  
  // Error Handling
  retry_count: number;
  max_retries: number;
  failure_notification_sent: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ReportExecution {
  id: string;
  schedule_id: string;
  report_id?: string;
  dashboard_id?: string;
  
  // Execution Details
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  
  // Results
  generated_file_url?: string;
  file_size_bytes?: number;
  record_count?: number;
  
  // Error Information
  error_message?: string;
  error_details?: Record<string, any>;
  
  // Performance
  execution_time_seconds: number;
  memory_used_mb?: number;
}

// ================================
// UTILITY FUNCTIONS
// ================================

export const formatMetricValue = (
  value: number,
  unit: string = 'number',
  decimals: number = 2
): string => {
  switch (unit) {
    case 'currency':
    case 'aed':
      return new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value);
    
    case 'percentage':
      return `${value.toFixed(decimals)}%`;
    
    case 'count':
    case 'number':
      return new Intl.NumberFormat('en-AE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
      }).format(value);
    
    case 'ratio':
      return `${value.toFixed(decimals)}:1`;
    
    case 'duration':
    case 'seconds':
      return formatDuration(value);
    
    default:
      return value.toFixed(decimals);
  }
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export const calculatePercentageChange = (
  current: number,
  previous: number
): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const getTrendDirection = (
  current: number,
  previous: number,
  threshold: number = 1
): 'up' | 'down' | 'stable' => {
  const change = calculatePercentageChange(current, previous);
  
  if (Math.abs(change) <= threshold) return 'stable';
  return change > 0 ? 'up' : 'down';
};

export const getTrendColor = (
  direction: 'up' | 'down' | 'stable',
  isPositiveGood: boolean = true
): { bgColor: string; textColor: string; icon: string } => {
  if (direction === 'stable') {
    return {
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
      icon: 'Minus'
    };
  }
  
  const isGoodTrend = isPositiveGood ? direction === 'up' : direction === 'down';
  
  return {
    bgColor: isGoodTrend ? 'bg-green-100' : 'bg-red-100',
    textColor: isGoodTrend ? 'text-green-600' : 'text-red-600',
    icon: direction === 'up' ? 'TrendingUp' : 'TrendingDown'
  };
};

export const getKPIStatusColor = (
  current: number,
  target?: number,
  alertLow?: number,
  alertHigh?: number
): { bgColor: string; textColor: string; status: string } => {
  // Check alert thresholds first
  if (alertLow && current <= alertLow) {
    return {
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      status: 'critical'
    };
  }
  
  if (alertHigh && current >= alertHigh) {
    return {
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      status: 'critical'
    };
  }
  
  // Check target achievement
  if (target) {
    const achievementRate = (current / target) * 100;
    
    if (achievementRate >= 100) {
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        status: 'achieved'
      };
    } else if (achievementRate >= 80) {
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        status: 'on_track'
      };
    } else {
      return {
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        status: 'at_risk'
      };
    }
  }
  
  // Default
  return {
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    status: 'normal'
  };
};

export const generateChartColors = (count: number): string[] => {
  const baseColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6B7280'  // Gray
  ];
  
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  
  return colors;
};

export const formatDateForChart = (dateString: string, granularity: string): string => {
  const date = new Date(dateString);
  
  switch (granularity) {
    case 'hourly':
      return date.toLocaleString('en-AE', {
        hour: '2-digit',
        minute: '2-digit'
      });
    
    case 'daily':
      return date.toLocaleDateString('en-AE', {
        month: 'short',
        day: 'numeric'
      });
    
    case 'weekly':
      return `W${Math.ceil(date.getDate() / 7)} ${date.toLocaleDateString('en-AE', { month: 'short' })}`;
    
    case 'monthly':
      return date.toLocaleDateString('en-AE', {
        month: 'short',
        year: 'numeric'
      });
    
    case 'quarterly':
      const quarter = Math.ceil((date.getMonth() + 1) / 3);
      return `Q${quarter} ${date.getFullYear()}`;
    
    case 'yearly':
      return date.getFullYear().toString();
    
    default:
      return date.toLocaleDateString('en-AE');
  }
};

export const exportToCSV = (data: any[], filename: string): void => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => 
        JSON.stringify(row[header] || '')
      ).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const getDateRange = (
  period: 'today' | 'week' | 'month' | 'quarter' | 'year'
): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date();
  
  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      break;
    
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  return { start, end: now };
};