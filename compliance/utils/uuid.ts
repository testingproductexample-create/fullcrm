/**
 * Utility Functions for PDPL Compliance System
 */

import { randomUUID } from 'crypto';

/**
 * Generate a UUID
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (UAE format)
 */
export function isValidUAEPhone(phone: string): boolean {
  const phoneRegex = /^(\+971|0)[0-9]{8,9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

/**
 * Mask sensitive data for display
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return data;
  }
  
  const masked = '*'.repeat(data.length - visibleChars);
  return data.slice(0, visibleChars) + masked;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-UAE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-UAE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate days between two dates
 */
export function daysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is within a given number of days from now
 */
export function isWithinDays(date: string | Date, days: number): boolean {
  const target = new Date(date);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days && diffDays >= 0;
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(array[i] % characters.length);
  }
  
  return result;
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
}

/**
 * Validate PDPL request type
 */
export function isValidDataSubjectRequestType(type: string): boolean {
  const validTypes = [
    'access',      // Right of access
    'rectification', // Right of rectification
    'erasure',     // Right of erasure
    'portability', // Right of data portability
    'restriction', // Right of restriction
    'objection',   // Right to object
    'automated_decision_making' // Right regarding automated decision-making
  ];
  
  return validTypes.includes(type);
}

/**
 * Validate legal basis for processing
 */
export function isValidLegalBasis(basis: string): boolean {
  const validBases = [
    'consent',
    'contract',
    'legal_obligation',
    'vital_interests',
    'public_task',
    'legitimate_interests'
  ];
  
  return validBases.includes(basis);
}

/**
 * Calculate compliance score
 */
export function calculateComplianceScore(metrics: {
  overdueRequests: number;
  consentExpiryAlerts: number;
  highRiskActivities: number;
  openIncidents: number;
  totalRequests: number;
  totalConsents: number;
  totalActivities: number;
}): number {
  let score = 100;
  
  // Penalties for overdue requests (critical)
  score -= Math.min(metrics.overdueRequests * 15, 50);
  
  // Penalties for consent expiry alerts
  score -= Math.min(metrics.consentExpiryAlerts * 5, 25);
  
  // Penalties for high-risk activities
  score -= Math.min(metrics.highRiskActivities * 10, 30);
  
  // Penalties for open incidents
  score -= Math.min(metrics.openIncidents * 20, 60);
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Generate compliance summary
 */
export function generateComplianceSummary(metrics: any): string {
  const issues = [];
  
  if (metrics.overdueRequests > 0) {
    issues.push(`${metrics.overdueRequests} overdue data subject requests`);
  }
  
  if (metrics.consentExpiryAlerts > 0) {
    issues.push(`${metrics.consentExpiryAlerts} expiring consents`);
  }
  
  if (metrics.highRiskActivities > 0) {
    issues.push(`${metrics.highRiskActivities} high-risk processing activities`);
  }
  
  if (metrics.openIncidents > 0) {
    issues.push(`${metrics.openIncidents} open compliance incidents`);
  }
  
  if (issues.length === 0) {
    return 'All compliance metrics are within acceptable ranges.';
  }
  
  return `Compliance issues detected: ${issues.join(', ')}.`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  
  return obj;
}

/**
 * Check if a string is valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}