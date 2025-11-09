/**
 * Tenant Validation Service
 * UAE Tailoring Business Platform
 */

import { Tenant, TenantValidationResult, OnboardingStep, OnboardingCondition } from '../../types';
import { databaseService } from '../database/tenant-database';

export class TenantValidationService {
  /**
   * Validate tenant configuration
   */
  async validateTenant(tenant: Tenant): Promise<TenantValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Basic validation
      if (!tenant.name || tenant.name.trim().length === 0) {
        errors.push('Tenant name is required');
      }

      if (!tenant.slug || tenant.slug.trim().length === 0) {
        errors.push('Tenant slug is required');
      }

      // Validate slug format
      if (tenant.slug && !/^[a-z0-9-]+$/.test(tenant.slug)) {
        errors.push('Tenant slug must contain only lowercase letters, numbers, and hyphens');
      }

      // Validate configuration
      const configValidation = this.validateConfiguration(tenant.configuration);
      errors.push(...configValidation.errors);
      warnings.push(...configValidation.warnings);

      // Validate branding
      const brandingValidation = this.validateBranding(tenant.branding);
      errors.push(...brandingValidation.errors);
      warnings.push(...brandingValidation.warnings);

      // Validate limits
      const limitsValidation = this.validateLimits(tenant.limits);
      errors.push(...limitsValidation.errors);
      warnings.push(...limitsValidation.warnings);

      // Validate security settings
      const securityValidation = this.validateSecurity(tenant.security);
      errors.push(...securityValidation.errors);
      warnings.push(...securityValidation.warnings);

      // Check database connectivity
      const dbValidation = await this.validateDatabaseConnection();
      if (!dbValidation.valid) {
        errors.push('Database connection failed');
      }

      // Check for existing conflicts
      const conflictValidation = await this.checkExistingConflicts(tenant);
      if (conflictValidation.hasConflicts) {
        errors.push(...conflictValidation.conflicts);
      }

      // Generate suggestions
      if (tenant.branding.logo === '') {
        suggestions.push('Consider adding a custom logo for better branding');
      }

      if (!tenant.security.twoFactorRequired) {
        suggestions.push('Enable two-factor authentication for enhanced security');
      }

      if (tenant.subscription.plan === 'free') {
        suggestions.push('Upgrade to a paid plan to unlock advanced features');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        suggestions: []
      };
    }
  }

  /**
   * Validate tenant creation data
   */
  validateTenantData(tenantData: Partial<Tenant>): TenantValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required fields
    if (!tenantData.name) {
      errors.push('Tenant name is required');
    }

    if (!tenantData.slug) {
      errors.push('Tenant slug is required');
    }

    // Validate name
    if (tenantData.name) {
      if (tenantData.name.length < 2) {
        errors.push('Tenant name must be at least 2 characters long');
      }
      if (tenantData.name.length > 100) {
        errors.push('Tenant name must not exceed 100 characters');
      }
    }

    // Validate slug
    if (tenantData.slug) {
      if (tenantData.slug.length < 2) {
        errors.push('Tenant slug must be at least 2 characters long');
      }
      if (tenantData.slug.length > 50) {
        errors.push('Tenant slug must not exceed 50 characters');
      }
      if (!/^[a-z0-9-]+$/.test(tenantData.slug)) {
        errors.push('Tenant slug must contain only lowercase letters, numbers, and hyphens');
      }

      // Check reserved slugs
      const reservedSlugs = ['admin', 'api', 'www', 'mail', 'ftp', 'tenant', 'tenants'];
      if (reservedSlugs.includes(tenantData.slug)) {
        errors.push('This slug is reserved and cannot be used');
      }
    }

    // Validate domain
    if (tenantData.domain) {
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!domainRegex.test(tenantData.domain)) {
        errors.push('Invalid domain format');
      }
    }

    // Validate subdomain
    if (tenantData.subdomain) {
      if (tenantData.subdomain.length < 2) {
        errors.push('Subdomain must be at least 2 characters long');
      }
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(tenantData.subdomain)) {
        errors.push('Subdomain must contain only lowercase letters, numbers, and hyphens');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validate tenant update data
   */
  validateTenantUpdate(existingTenant: Tenant, updates: Partial<Tenant>): TenantValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if updating status to suspended
    if (updates.status === 'suspended' && existingTenant.status === 'active') {
      warnings.push('Suspending an active tenant will affect all users and data access');
    }

    // Check if updating limits to lower values
    if (updates.limits) {
      if (updates.limits.maxUsers < existingTenant.limits.maxUsers) {
        warnings.push('Reducing user limits may affect current users');
      }
      if (updates.limits.maxStorage < existingTenant.limits.maxStorage) {
        warnings.push('Reducing storage limits may affect data storage');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: []
    };
  }

  /**
   * Validate onboarding step
   */
  validateOnboardingStep(step: OnboardingStep): TenantValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!step.title || step.title.trim().length === 0) {
      errors.push('Step title is required');
    }

    if (!step.description || step.description.trim().length === 0) {
      errors.push('Step description is required');
    }

    if (!step.component || step.component.trim().length === 0) {
      errors.push('Step component is required');
    }

    if (step.order < 1) {
      errors.push('Step order must be greater than 0');
    }

    // Validate conditions
    if (step.conditions) {
      for (const condition of step.conditions) {
        if (!condition.field || !condition.operator) {
          errors.push('Invalid condition configuration');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: []
    };
  }

  /**
   * Validate configuration
   */
  private validateConfiguration(config: Tenant['configuration']): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate timezone
    const validTimezones = ['Asia/Dubai', 'Asia/Riyadh', 'UTC', 'Europe/London'];
    if (!validTimezones.includes(config.timezone)) {
      warnings.push('Timezone is not a commonly used one');
    }

    // Validate currency
    const validCurrencies = ['AED', 'USD', 'SAR', 'EUR'];
    if (!validCurrencies.includes(config.currency)) {
      warnings.push('Currency is not commonly used in the region');
    }

    // Validate date format
    const validDateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
    if (!validDateFormats.includes(config.dateFormat)) {
      errors.push('Invalid date format');
    }

    // Validate working hours
    if (config.workingHours.start >= config.workingHours.end) {
      errors.push('Working hours start time must be before end time');
    }

    return { errors, warnings };
  }

  /**
   * Validate branding
   */
  private validateBranding(branding: Tenant['branding']): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate colors
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(branding.primaryColor)) {
      errors.push('Primary color must be a valid hex color');
    }

    if (!colorRegex.test(branding.secondaryColor)) {
      errors.push('Secondary color must be a valid hex color');
    }

    // Check if colors are too similar
    if (branding.primaryColor === branding.secondaryColor) {
      warnings.push('Primary and secondary colors are the same');
    }

    // Validate URLs for logo and favicon (if provided)
    if (branding.logo && !this.isValidUrl(branding.logo)) {
      errors.push('Logo URL is invalid');
    }

    if (branding.favicon && !this.isValidUrl(branding.favicon)) {
      errors.push('Favicon URL is invalid');
    }

    return { errors, warnings };
  }

  /**
   * Validate limits
   */
  private validateLimits(limits: Tenant['limits']): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (limits.maxUsers < 1) {
      errors.push('Maximum users must be at least 1');
    }

    if (limits.maxUsers > 10000) {
      errors.push('Maximum users cannot exceed 10,000');
    }

    if (limits.maxStorage < 0) {
      errors.push('Maximum storage cannot be negative');
    }

    if (limits.maxStorage > 1000) {
      warnings.push('Large storage limit may impact performance');
    }

    if (limits.maxOrders < 0) {
      errors.push('Maximum orders cannot be negative');
    }

    if (limits.maxCustomers < 0) {
      errors.push('Maximum customers cannot be negative');
    }

    return { errors, warnings };
  }

  /**
   * Validate security settings
   */
  private validateSecurity(security: Tenant['security']): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate session timeout
    if (security.sessionTimeout < 15) {
      warnings.push('Session timeout is very short, may affect user experience');
    }

    if (security.sessionTimeout > 1440) {
      warnings.push('Session timeout is very long, may pose security risks');
    }

    // Validate data retention
    if (security.dataRetention < 30) {
      warnings.push('Data retention period is very short');
    }

    if (security.dataRetention > 2555) { // 7 years
      warnings.push('Data retention period exceeds recommended limits');
    }

    // Validate password policy
    if (security.passwordPolicy.minLength < 6) {
      errors.push('Minimum password length should be at least 6');
    }

    if (security.passwordPolicy.minLength > 128) {
      errors.push('Minimum password length cannot exceed 128');
    }

    return { errors, warnings };
  }

  /**
   * Validate database connection
   */
  private async validateDatabaseConnection(): Promise<{ valid: boolean; error?: string }> {
    try {
      const isHealthy = await databaseService.healthCheck();
      return { valid: isHealthy };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check for existing conflicts
   */
  private async checkExistingConflicts(tenant: Partial<Tenant>): Promise<{
    hasConflicts: boolean;
    conflicts: string[];
  }> {
    const conflicts: string[] = [];

    try {
      // Check slug conflicts
      if (tenant.slug) {
        const existingSlug = await databaseService.findOne('tenants', { slug: tenant.slug });
        if (existingSlug) {
          conflicts.push('Tenant slug already exists');
        }
      }

      // Check domain conflicts
      if (tenant.domain) {
        const existingDomain = await databaseService.findOne('tenants', { domain: tenant.domain });
        if (existingDomain) {
          conflicts.push('Domain already in use');
        }
      }

      // Check subdomain conflicts
      if (tenant.subdomain) {
        const existingSubdomain = await databaseService.findOne('tenants', { subdomain: tenant.subdomain });
        if (existingSubdomain) {
          conflicts.push('Subdomain already in use');
        }
      }

      return {
        hasConflicts: conflicts.length > 0,
        conflicts
      };
    } catch (error) {
      console.error('Failed to check conflicts:', error);
      return {
        hasConflicts: true,
        conflicts: ['Failed to validate configuration conflicts']
      };
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  isValidPhone(phone: string): boolean {
    // UAE phone number format
    const uaePhoneRegex = /^(\+971|0)[0-9]{9}$/;
    return uaePhoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Validate date format
   */
  isValidDate(date: string, format: string = 'DD/MM/YYYY'): boolean {
    try {
      let day, month, year;
      
      switch (format) {
        case 'DD/MM/YYYY':
          [day, month, year] = date.split('/').map(Number);
          break;
        case 'MM/DD/YYYY':
          [month, day, year] = date.split('/').map(Number);
          break;
        case 'YYYY-MM-DD':
          [year, month, day] = date.split('-').map(Number);
          break;
        default:
          return false;
      }

      const dateObj = new Date(year, month - 1, day);
      return dateObj.getDate() === day && 
             dateObj.getMonth() === month - 1 && 
             dateObj.getFullYear() === year;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize tenant name
   */
  sanitizeTenantName(name: string): string {
    return name
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .substring(0, 100);
  }

  /**
   * Generate valid slug from name
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }
}

// Export singleton instance
export const tenantValidationService = new TenantValidationService();
