import { clsx, ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency formatting utilities
export const formatCurrency = (amount: number, locale: string = 'en-AE', currency: string = 'AED'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (num: number, locale: string = 'en-AE'): string => {
  return new Intl.NumberFormat(locale).format(num);
};

export const formatPercentage = (value: number, decimalPlaces: number = 1): string => {
  return `${value.toFixed(decimalPlaces)}%`;
};

// Date utilities
export const formatDate = (date: string | Date, locale: string = 'en-AE'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale);
};

export const formatDateTime = (date: string | Date, locale: string = 'en-AE'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString(locale);
};

export const getCurrentPeriod = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getPeriodLabel = (period: string): string => {
  const [year, month] = period.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// Commission calculation utilities
export const calculateCommission = (
  saleAmount: number,
  commissionRate: number,
  bonusThreshold?: number,
  bonusRate?: number,
  totalSales: number = 0
): {
  baseCommission: number;
  bonusCommission: number;
  totalCommission: number;
  commissionRate: number;
} => {
  const baseCommission = (saleAmount * commissionRate) / 100;
  let bonusCommission = 0;
  
  if (bonusThreshold && bonusRate && totalSales >= bonusThreshold) {
    bonusCommission = (saleAmount * bonusRate) / 100;
  }
  
  const totalCommission = baseCommission + bonusCommission;
  const effectiveRate = saleAmount > 0 ? (totalCommission / saleAmount) * 100 : 0;
  
  return {
    baseCommission,
    bonusCommission,
    totalCommission,
    commissionRate: effectiveRate
  };
};

export const calculateTieredCommission = (
  saleAmount: number,
  tiers: { min: number; max: number; rate: number }[]
): {
  tierCommission: number;
  applicableRate: number;
  tier: { min: number; max: number; rate: number } | null;
} => {
  const applicableTier = tiers.find(tier => saleAmount >= tier.min && (tier.max === Infinity || saleAmount <= tier.max));
  
  if (!applicableTier) {
    // Use highest tier for amounts above all max values
    const highestTier = tiers[tiers.length - 1];
    const tierCommission = (saleAmount * highestTier.rate) / 100;
    return {
      tierCommission,
      applicableRate: highestTier.rate,
      tier: highestTier
    };
  }
  
  const tierCommission = (saleAmount * applicableTier.rate) / 100;
  return {
    tierCommission,
    applicableRate: applicableTier.rate,
    tier: applicableTier
  };
};

// Performance analytics utilities
export const calculatePerformanceMetrics = (
  sales: { saleAmount: number; commissionAmount?: number; date: string }[],
  target: number,
  period: string = 'month'
) => {
  const totalSales = sales.reduce((sum, sale) => sum + sale.saleAmount, 0);
  const totalCommissions = sales.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0);
  const transactionCount = sales.length;
  const avgSale = transactionCount > 0 ? totalSales / transactionCount : 0;
  const avgCommission = transactionCount > 0 ? totalCommissions / transactionCount : 0;
  const achievement = (totalSales / target) * 100;
  const commissionRate = totalSales > 0 ? (totalCommissions / totalSales) * 100 : 0;
  
  return {
    totalSales,
    totalCommissions,
    transactionCount,
    avgSale,
    avgCommission,
    achievement,
    commissionRate,
    target,
    period
  };
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateAEDAmount = (amount: number): boolean => {
  return amount >= 0 && amount <= 999999999; // Reasonable upper limit
};

export const validateCommissionRate = (rate: number): boolean => {
  return rate >= 0 && rate <= 100; // 0-100% range
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

// Local storage utilities
export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// File utilities
export const downloadAsCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
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

export const downloadAsJSON = (data: any, filename: string): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Error handling utilities
export const handleApiError = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Theme utilities
export const getThemeColor = (status: 'pending' | 'approved' | 'paid' | 'processing'): {
  bg: string;
  text: string;
  border: string;
} => {
  const colors = {
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200'
    },
    approved: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200'
    },
    paid: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200'
    },
    processing: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200'
    }
  };
  
  return colors[status] || colors.pending;
};

// Arabic/RTL utilities
export const isRTL = (language: string): boolean => {
  return language === 'ar' || language === 'he' || language === 'fa';
};

export const getTextDirection = (language: string): 'ltr' | 'rtl' => {
  return isRTL(language) ? 'rtl' : 'ltr';
};

// Color utilities for charts
export const getChartColors = (): string[] => {
  return [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
    '#6b7280'  // gray
  ];
};

export const getStatusColors = (): Record<string, string> => {
  return {
    pending: '#fbbf24',
    approved: '#10b981',
    paid: '#3b82f6',
    processing: '#8b5cf6',
    cancelled: '#ef4444'
  };
};