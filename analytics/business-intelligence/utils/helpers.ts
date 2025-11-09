import { format, formatDistanceToNow, isAfter, isBefore, subDays, startOfDay, endOfDay } from 'date-fns';
import { KPI, ChartData, DateRange, DataQuery } from '../types';
import { COLOR_SCHEMES, CHART_COLORS } from '../data/constants';

// Number Formatting Utilities
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
};

export const formatCompactNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
};

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
};

// Date Formatting Utilities
export const formatDate = (date: Date, formatString: string = 'MMM dd, yyyy'): string => {
  return format(date, formatString);
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'MMM dd, yyyy HH:mm');
};

export const formatRelativeTime = (date: Date): string => {
  return formatDistanceToNow(date, { addSuffix: true });
};

export const getDateRange = (preset: string, offset: number = 0): DateRange => {
  const now = new Date();
  const days = getDaysFromPreset(preset);
  
  if (offset > 0) {
    return {
      start: subDays(startOfDay(now), days + offset),
      end: subDays(endOfDay(now), offset)
    };
  }
  
  return {
    start: subDays(startOfDay(now), days),
    end: endOfDay(now)
  };
};

const getDaysFromPreset = (preset: string): number => {
  const presets: Record<string, number> = {
    'today': 1,
    'yesterday': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    'month': 30,
    'quarter': 90,
    'year': 365
  };
  return presets[preset] || 30;
};

// Color Utilities
export const getColorByCategory = (category: string): string => {
  const colorMap: Record<string, string> = {
    revenue: COLOR_SCHEMES.success[500],
    orders: COLOR_SCHEMES.primary[500],
    customers: COLOR_SCHEMES.warning[500],
    productivity: COLOR_SCHEMES.purple[500],
    financial: COLOR_SCHEMES.error[500],
    operational: COLOR_SCHEMES.blue[500]
  };
  return colorMap[category] || COLOR_SCHEMES.gray[500];
};

export const getChartColors = (count: number, palette: keyof typeof CHART_COLORS = 'rainbow'): string[] => {
  const colors = CHART_COLORS[palette];
  if (count <= colors.length) {
    return colors.slice(0, count);
  }
  
  // Repeat colors if more needed
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};

export const generateGradient = (color: string, steps: number): string[] => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const colors: string[] = [];
  for (let i = 0; i < steps; i++) {
    const factor = i / (steps - 1);
    const newR = Math.round(r * (1 - factor * 0.3));
    const newG = Math.round(g * (1 - factor * 0.3));
    const newB = Math.round(b * (1 - factor * 0.3));
    colors.push(`rgb(${newR}, ${newG}, ${newB})`);
  }
  return colors;
};

// KPI Calculation Utilities
export const calculateTrend = (current: number, previous: number): {
  trend: 'up' | 'down' | 'stable';
  percentage: number;
} => {
  if (previous === 0) {
    return { trend: 'stable', percentage: 0 };
  }
  
  const change = ((current - previous) / Math.abs(previous)) * 100;
  let trend: 'up' | 'down' | 'stable' = 'stable';
  
  if (change > 0.5) trend = 'up';
  else if (change < -0.5) trend = 'down';
  
  return {
    trend,
    percentage: Math.abs(change)
  };
};

export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const calculatePercentageOfTarget = (current: number, target: number): number => {
  if (target === 0) return 0;
  return (current / target) * 100;
};

export const isPerformanceGood = (kpi: KPI): boolean => {
  if (kpi.target) {
    const percentageOfTarget = calculatePercentageOfTarget(kpi.value, kpi.target);
    return percentageOfTarget >= 80; // 80% of target is considered good
  }
  return kpi.trend === 'up';
};

// Data Transformation Utilities
export const transformToChartData = (data: any[], xField: string, yField: string): ChartData => {
  const labels = data.map(item => item[xField]);
  const datasets = [{
    label: yField,
    data: data.map(item => item[yField])
  }];
  
  return { labels, datasets, meta: { fields: [xField, yField] } };
};

export const aggregateData = (data: any[], groupBy: string, aggregate: 'sum' | 'avg' | 'count' | 'min' | 'max', field?: string) => {
  const grouped = data.reduce((acc, item) => {
    const key = groupBy.split('.').reduce((obj, prop) => obj?.[prop], item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, any[]>);
  
  return Object.entries(grouped).map(([key, items]) => {
    let value: any;
    if (aggregate === 'count') {
      value = items.length;
    } else {
      const values = field ? items.map(item => field.split('.').reduce((obj, prop) => obj?.[prop], item)) : items;
      const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
      
      switch (aggregate) {
        case 'sum':
          value = numericValues.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          value = numericValues.length > 0 ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length : 0;
          break;
        case 'min':
          value = Math.min(...numericValues);
          break;
        case 'max':
          value = Math.max(...numericValues);
          break;
        default:
          value = 0;
      }
    }
    
    return { [groupBy]: key, value, count: items.length };
  });
};

export const filterData = (data: any[], filters: any[]): any[] => {
  return data.filter(item => {
    return filters.every(filter => {
      const fieldValue = filter.field.split('.').reduce((obj, prop) => obj?.[prop], item);
      return applyFilterOperator(fieldValue, filter.operator, filter.value);
    });
  });
};

const applyFilterOperator = (fieldValue: any, operator: string, filterValue: any): boolean => {
  switch (operator) {
    case 'eq': return fieldValue === filterValue;
    case 'ne': return fieldValue !== filterValue;
    case 'gt': return Number(fieldValue) > Number(filterValue);
    case 'gte': return Number(fieldValue) >= Number(filterValue);
    case 'lt': return Number(fieldValue) < Number(filterValue);
    case 'lte': return Number(fieldValue) <= Number(filterValue);
    case 'in': return Array.isArray(filterValue) && filterValue.includes(fieldValue);
    case 'not_in': return Array.isArray(filterValue) && !filterValue.includes(fieldValue);
    case 'like': return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
    case 'between': return Array.isArray(filterValue) && fieldValue >= filterValue[0] && fieldValue <= filterValue[1];
    default: return true;
  }
};

export const sortData = (data: any[], field: string, direction: 'asc' | 'desc' = 'asc'): any[] => {
  return [...data].sort((a, b) => {
    const aValue = field.split('.').reduce((obj, prop) => obj?.[prop], a);
    const bValue = field.split('.').reduce((obj, prop) => obj?.[prop], b);
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

export const paginateData = (data: any[], page: number, limit: number): any[] => {
  const start = (page - 1) * limit;
  const end = start + limit;
  return data.slice(start, end);
};

// Validation Utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateNumber = (value: any, min?: number, max?: number): boolean => {
  const num = Number(value);
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
};

export const validateDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

// Local Storage Utilities
export const saveToStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to storage:', error);
  }
};

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from storage:', error);
    return defaultValue;
  }
};

export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from storage:', error);
  }
};

// Debounce Utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Throttle Utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(null, args);
    }
  };
};

// Array Utilities
export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const groupBy = <T>(array: T[], key: keyof T | string): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(key.split('.').reduce((obj, prop) => obj?.[prop], item));
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Performance Utilities
export const measurePerformance = <T>(name: string, fn: () => T): T => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
};

export const measureAsyncPerformance = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
};

// Copy to Clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Download File
export const downloadFile = (data: string, filename: string, type: string = 'text/plain'): void => {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// String Utilities
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const camelCase = (text: string): string => {
  return text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
};

export const truncate = (text: string, length: number = 100, suffix: string = '...'): string => {
  if (text.length <= length) return text;
  return text.substring(0, length - suffix.length) + suffix;
};

// Object Utilities
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const deepMerge = (target: any, source: any): any => {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};

export const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};