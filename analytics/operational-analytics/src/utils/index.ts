import { format, parseISO, isValid, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  PerformanceData, 
  ChartData, 
  TimeSeriesData, 
  KPI,
  DashboardMetrics,
  Employee,
  Order,
  SystemAlert
} from '../types';

// Date utilities
export const formatDate = (date: string | Date, formatString: string = 'MMM dd, yyyy'): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return isValid(parsedDate) ? format(parsedDate, formatString) : 'Invalid Date';
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

export const formatTime = (date: string | Date): string => {
  return formatDate(date, 'HH:mm');
};

export const getDateRange = (days: number): { start: Date; end: Date } => {
  const end = endOfDay(new Date());
  const start = startOfDay(subDays(end, days));
  return { start, end };
};

export const isDateInRange = (date: string | Date, start: Date, end: Date): boolean => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return isValid(parsedDate) && parsedDate >= start && parsedDate <= end;
};

// Number formatting utilities
export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${formatNumber(value, decimals)}%`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${formatNumber(minutes, 0)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
};

// Performance metrics utilities
export const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const calculateEfficiency = (actualTime: number, estimatedTime: number): number => {
  if (estimatedTime === 0) return 0;
  return (estimatedTime / actualTime) * 100;
};

export const calculateUtilization = (utilizedHours: number, totalHours: number): number => {
  if (totalHours === 0) return 0;
  return (utilizedHours / totalHours) * 100;
};

export const calculateQualityScore = (passedItems: number, totalItems: number): number => {
  if (totalItems === 0) return 0;
  return (passedItems / totalItems) * 100;
};

export const calculateProfitMargin = (revenue: number, cost: number): number => {
  if (revenue === 0) return 0;
  return ((revenue - cost) / revenue) * 100;
};

export const calculateInventoryTurnover = (costOfGoodsSold: number, averageInventory: number): number => {
  if (averageInventory === 0) return 0;
  return costOfGoodsSold / averageInventory;
};

export const calculateAverageResponseTime = (responseTimes: number[]): number => {
  if (responseTimes.length === 0) return 0;
  const sum = responseTimes.reduce((acc, time) => acc + time, 0);
  return sum / responseTimes.length;
};

// Chart data utilities
export const generateTimeSeriesData = (
  data: Array<{ date: string; value: number; category?: string }>,
  categories?: string[]
): ChartData => {
  const dates = [...new Set(data.map(d => d.date))].sort();
  const datasets: any[] = [];

  if (categories && categories.length > 0) {
    categories.forEach(category => {
      const categoryData = data
        .filter(d => d.category === category)
        .sort((a, b) => a.date.localeCompare(b.date));
      
      const values = dates.map(date => {
        const item = categoryData.find(d => d.date === date);
        return item ? item.value : 0;
      });

      datasets.push({
        label: category,
        data: values,
        backgroundColor: getCategoryColor(category),
        borderColor: getCategoryColor(category),
        borderWidth: 2,
        fill: true,
      });
    });
  } else {
    const values = data.sort((a, b) => a.date.localeCompare(b.date)).map(d => d.value);
    
    datasets.push({
      label: 'Value',
      data: values,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      fill: true,
    });
  }

  return {
    labels: dates.map(date => formatDate(date, 'MMM dd')),
    datasets,
  };
};

export const generateBarChartData = (
  data: Array<{ label: string; value: number; target?: number }>
): ChartData => {
  return {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: 'Actual',
        data: data.map(d => d.value),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Target',
        data: data.map(d => d.target || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  };
};

export const generatePieChartData = (
  data: Array<{ label: string; value: number }>,
  colors?: string[]
): ChartData => {
  const backgroundColors = colors || [
    'rgba(59, 130, 246, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(249, 115, 22, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(168, 85, 247, 0.8)',
    'rgba(20, 184, 166, 0.8)',
  ];

  return {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: 'Distribution',
        data: data.map(d => d.value),
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
        borderWidth: 2,
      },
    ],
  };
};

// Color utilities
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Sales': 'rgba(34, 197, 94, 0.8)',
    'Marketing': 'rgba(59, 130, 246, 0.8)',
    'Support': 'rgba(249, 115, 22, 0.8)',
    'Development': 'rgba(168, 85, 247, 0.8)',
    'Operations': 'rgba(20, 184, 166, 0.8)',
    'HR': 'rgba(236, 72, 153, 0.8)',
  };
  return colors[category] || 'rgba(107, 114, 128, 0.8)';
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'completed': 'text-green-400',
    'in_progress': 'text-blue-400',
    'pending': 'text-yellow-400',
    'cancelled': 'text-red-400',
    'closed': 'text-gray-400',
    'resolved': 'text-green-400',
    'open': 'text-red-400',
    'active': 'text-green-400',
    'inactive': 'text-gray-400',
  };
  return colors[status.toLowerCase()] || 'text-gray-400';
};

export const getPriorityColor = (priority: string | number): string => {
  const colors: Record<string, string> = {
    'critical': 'text-red-500',
    'high': 'text-orange-500',
    'medium': 'text-yellow-500',
    'low': 'text-green-500',
    '1': 'text-red-500',
    '2': 'text-orange-500',
    '3': 'text-yellow-500',
    '4': 'text-green-500',
    '5': 'text-blue-500',
  };
  return colors[priority.toString()] || 'text-gray-500';
};

// Data validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const isValidCurrency = (amount: any): boolean => {
  return !isNaN(parseFloat(amount)) && parseFloat(amount) >= 0;
};

export const isValidPercentage = (percentage: any): boolean => {
  return !isNaN(parseFloat(percentage)) && parseFloat(percentage) >= 0 && parseFloat(percentage) <= 100;
};

// Analytics utilities
export const generateKPIs = (
  metrics: DashboardMetrics,
  previousMetrics?: DashboardMetrics
): KPI[] => {
  const kpis: KPI[] = [
    {
      name: 'Total Orders',
      value: metrics.totalOrders,
      change: previousMetrics ? calculateChange(metrics.totalOrders, previousMetrics.totalOrders) : undefined,
      changeType: previousMetrics ? (metrics.totalOrders > previousMetrics.totalOrders ? 'increase' : 
                                      metrics.totalOrders < previousMetrics.totalOrders ? 'decrease' : 'neutral') : 'neutral',
      trend: 'stable',
    },
    {
      name: 'Order Completion Rate',
      value: metrics.totalOrders > 0 ? (metrics.completedOrders / metrics.totalOrders) * 100 : 0,
      unit: '%',
      change: previousMetrics ? calculateChange(
        (metrics.completedOrders / metrics.totalOrders) * 100,
        (previousMetrics.completedOrders / previousMetrics.totalOrders) * 100
      ) : undefined,
      changeType: previousMetrics ? 'increase' : 'neutral',
      trend: 'up',
    },
    {
      name: 'Average Completion Time',
      value: metrics.averageCompletionTime,
      unit: 'min',
      change: previousMetrics ? calculateChange(metrics.averageCompletionTime, previousMetrics.averageCompletionTime) : undefined,
      changeType: previousMetrics ? (metrics.averageCompletionTime < previousMetrics.averageCompletionTime ? 'decrease' : 'increase') : 'neutral',
      trend: 'down',
    },
    {
      name: 'Total Revenue',
      value: metrics.totalRevenue,
      unit: '$',
      change: previousMetrics ? calculateChange(metrics.totalRevenue, previousMetrics.totalRevenue) : undefined,
      changeType: previousMetrics ? 'increase' : 'neutral',
      trend: 'up',
    },
    {
      name: 'Employee Utilization',
      value: metrics.averageUtilization,
      unit: '%',
      target: 80,
      change: previousMetrics ? calculateChange(metrics.averageUtilization, previousMetrics.averageUtilization) : undefined,
      changeType: previousMetrics ? 'increase' : 'neutral',
      trend: 'up',
    },
    {
      name: 'Open Tickets',
      value: metrics.openTickets,
      change: previousMetrics ? calculateChange(metrics.openTickets, previousMetrics.openTickets) : undefined,
      changeType: previousMetrics ? (metrics.openTickets < previousMetrics.openTickets ? 'decrease' : 'increase') : 'neutral',
      trend: 'down',
    },
    {
      name: 'Quality Pass Rate',
      value: metrics.qualityPassRate,
      unit: '%',
      target: 95,
      change: previousMetrics ? calculateChange(metrics.qualityPassRate, previousMetrics.qualityPassRate) : undefined,
      changeType: previousMetrics ? 'increase' : 'neutral',
      trend: 'up',
    },
    {
      name: 'Critical Alerts',
      value: metrics.criticalAlerts,
      change: previousMetrics ? calculateChange(metrics.criticalAlerts, previousMetrics.criticalAlerts) : undefined,
      changeType: previousMetrics ? (metrics.criticalAlerts < previousMetrics.criticalAlerts ? 'decrease' : 'increase') : 'neutral',
      trend: 'down',
    },
  ];

  return kpis;
};

export const calculateTrends = (data: number[]): 'up' | 'down' | 'stable' => {
  if (data.length < 2) return 'stable';
  
  const recent = data.slice(-3);
  const older = data.slice(0, 3);
  
  const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
  const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
  
  const change = (recentAvg - olderAvg) / olderAvg;
  
  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'stable';
};

// Data transformation utilities
export const groupBy = <T, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(
  array: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

export const filterBy = <T>(
  array: T[],
  filters: Record<string, any>
): T[] => {
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === null || value === undefined || value === '') return true;
      if (Array.isArray(value)) return value.includes(item[key as keyof T]);
      return item[key as keyof T] === value;
    });
  });
};

export const aggregateBy = <T, K extends keyof T, V extends keyof T>(
  array: T[],
  groupKey: K,
  valueKey: V,
  aggregator: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum'
): Record<string, number> => {
  const groups = groupBy(array, groupKey);
  const result: Record<string, number> = {};
  
  Object.entries(groups).forEach(([group, items]) => {
    const values = items.map(item => Number(item[valueKey]) || 0);
    
    switch (aggregator) {
      case 'sum':
        result[group] = values.reduce((sum, val) => sum + val, 0);
        break;
      case 'avg':
        result[group] = values.length > 0 
          ? values.reduce((sum, val) => sum + val, 0) / values.length 
          : 0;
        break;
      case 'count':
        result[group] = items.length;
        break;
      case 'min':
        result[group] = values.length > 0 ? Math.min(...values) : 0;
        break;
      case 'max':
        result[group] = values.length > 0 ? Math.max(...values) : 0;
        break;
    }
  });
  
  return result;
};

// Export utility functions
export const getTimeRangeOptions = () => [
  { label: 'Last 24 Hours', value: '1d' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'Last Year', value: '1y' },
];

export const getStatusOptions = () => [
  { label: 'All Status', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export const getPriorityOptions = () => [
  { label: 'All Priorities', value: '' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

export const getDepartmentOptions = (employees: Employee[]): Array<{ label: string; value: string }> => {
  const departments = [...new Set(employees.map(emp => emp.department))];
  return [
    { label: 'All Departments', value: '' },
    ...departments.map(dept => ({ label: dept, value: dept }))
  ];
};

export const getAlertSeverityOptions = () => [
  { label: 'All Severities', value: '' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

// Mock data generation for development
export const generateMockPerformanceData = (days: number = 30): PerformanceData[] => {
  const data: PerformanceData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const baseValue = 50 + Math.random() * 50;
    const trend = Math.sin(i / 7) * 10;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(0, baseValue + trend),
      target: 80,
    });
  }
  
  return data;
};

export const generateMockTimeSeriesData = (days: number = 30): TimeSeriesData[] => {
  const data: TimeSeriesData[] = [];
  const today = new Date();
  const categories = ['Sales', 'Support', 'Development'];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    
    categories.forEach(category => {
      const baseValue = category === 'Sales' ? 100 : category === 'Support' ? 75 : 60;
      const variation = Math.random() * 20 - 10;
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(0, baseValue + variation),
        category,
      });
    });
  }
  
  return data;
};