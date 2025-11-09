import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'AED'): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(date: Date | string, format = 'PPP'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-AE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(format === 'PPPP' && { weekday: 'long' }),
    ...(format === 'PPP' && {}),
    ...(format === 'PP' && {}),
  }).format(dateObj);
}

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUAEPhone(phone: string): boolean {
  // UAE phone number validation (works with +971, 0, or without country code)
  const phoneRegex = /^(\+971|0)?[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function generateUAEEmirates(): Array<{
  name: string;
  code: string;
  coordinates: { lat: number; lng: number };
  population: number;
}> {
  return [
    { name: 'Dubai', code: 'DXB', coordinates: { lat: 25.2048, lng: 55.2708 }, population: 3331400 },
    { name: 'Abu Dhabi', code: 'AUH', coordinates: { lat: 24.2992, lng: 54.6975 }, population: 1482816 },
    { name: 'Sharjah', code: 'SHJ', coordinates: { lat: 25.3377, lng: 55.4121 }, population: 1197000 },
    { name: 'Al Ain', code: 'AAN', coordinates: { lat: 24.2609, lng: 55.7575 }, population: 766812 },
    { name: 'Ajman', code: 'AJM', coordinates: { lat: 25.4052, lng: 55.5136 }, population: 504846 },
    { name: 'Umm Al Quwain', code: 'UAQ', coordinates: { lat: 25.5426, lng: 55.5767 }, population: 72231 },
    { name: 'Ras Al Khaimah', code: 'RAK', coordinates: { lat: 25.6730, lng: 55.7745 }, population: 353053 },
    { name: 'Fujairah', code: 'FUJ', coordinates: { lat: 25.1212, lng: 56.3187 }, population: 154374 },
  ];
}

export function getRandomColor(): string {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getColorOpacity(color: string, opacity: number): string {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function downloadFile(data: string, filename: string, type: string): void {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(() => false);
}

export function parseCSV(csv: string): string[][] {
  const lines = csv.split('\n');
  return lines.map(line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i - 1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  });
}

export function toCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function getBusinessDaysInMonth(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let businessDays = 0;
  
  for (let day = firstDay; day <= lastDay; day.setDate(day.getDate() + 1)) {
    const dayOfWeek = day.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      businessDays++;
    }
  }
  
  return businessDays;
}

export function isUAEHoliday(date: Date): boolean {
  // UAE Public Holidays
  const holidays = [
    // New Year's Day
    { month: 0, day: 1 },
    // UAE National Day (December 2)
    { month: 11, day: 2 },
    // UAE National Day (December 3)
    { month: 11, day: 3 },
    // Islamic holidays (approximate dates - should be calculated properly)
    // Eid Al Fitr (Ramadan end) - varies each year
    // Eid Al Adha (Hajj end) - varies each year
  ];
  
  const month = date.getMonth();
  const day = date.getDate();
  
  return holidays.some(holiday => holiday.month === month && holiday.day === day);
}

export function getUaeVatRate(): number {
  return 0.05; // 5% VAT in UAE
}

export function calculateVat(amount: number, rate = getUaeVatRate()): number {
  return amount * rate;
}

export function calculateVatInclusive(amount: number, rate = getUaeVatRate()): number {
  return amount / (1 + rate);
}

export function generateQRCode(text: string): string {
  // This would typically use a QR code library
  // For now, return a placeholder URL
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
}

export function validateUaeEmiratesCode(code: string): boolean {
  const validCodes = ['DXB', 'AUH', 'SHJ', 'AAN', 'AJM', 'UAQ', 'RAK', 'FUJ'];
  return validCodes.includes(code.toUpperCase());
}

export function formatUaePhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  if (digits.startsWith('971')) {
    return `+${digits}`;
  } else if (digits.startsWith('0')) {
    return `+971${digits.substring(1)}`;
  } else {
    return `+971${digits}`;
  }
}

export function getTimeZone(): string {
  return 'Asia/Dubai'; // UAE timezone
}

export function formatDateTimeForUAE(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-AE', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}