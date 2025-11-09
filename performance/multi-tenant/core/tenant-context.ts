/**
 * Multi-Tenant Context and Resolution System
 * UAE Tailoring Business Platform
 */

import { Tenant, TenantContext, TenantUser, MultiTenantResponse, TenantValidationResult } from '../types';
import { TenantStorageService } from './storage/tenant-storage';
import { TenantSecurityService } from './security/tenant-security';
import { TenantValidationService } from './validation/tenant-validation';
import { TenantRoutingService } from './routing/tenant-routing';

export class MultiTenantContext {
  private static instance: MultiTenantContext;
  private tenantStorage: TenantStorageService;
  private security: TenantSecurityService;
  private validator: TenantValidationService;
  private router: TenantRoutingService;
  private currentContext: Map<string, TenantContext> = new Map();

  private constructor() {
    this.tenantStorage = new TenantStorageService();
    this.security = new TenantSecurityService();
    this.validator = new TenantValidationService();
    this.router = new TenantRoutingService();
  }

  public static getInstance(): MultiTenantContext {
    if (!MultiTenantContext.instance) {
      MultiTenantContext.instance = new MultiTenantContext();
    }
    return MultiTenantContext.instance;
  }

  /**
   * Resolve tenant from request context
   */
  public async resolveTenant(request: any): Promise<MultiTenantResponse<TenantContext>> {
    try {
      const tenantId = await this.router.extractTenantId(request);
      
      if (!tenantId) {
        return {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant ID could not be determined from request',
            timestamp: new Date()
          }
        };
      }

      const tenant = await this.tenantStorage.getTenant(tenantId);
      
      if (!tenant) {
        return {
          success: false,
          error: {
            code: 'TENANT_NOT_EXISTS',
            message: 'Requested tenant does not exist',
            timestamp: new Date()
          }
        };
      }

      if (tenant.status !== 'active') {
        return {
          success: false,
          error: {
            code: 'TENANT_INACTIVE',
            message: 'Tenant is not active',
            tenantId: tenant.id,
            timestamp: new Date()
          }
        };
      }

      // Validate tenant configuration
      const validation = await this.validator.validateTenant(tenant);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'TENANT_VALIDATION_FAILED',
            message: 'Tenant validation failed',
            details: validation.errors,
            timestamp: new Date()
          }
        };
      }

      const context: TenantContext = {
        tenant,
        session: {
          id: this.generateSessionId(),
          tenantId: tenant.id,
          userId: '',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          data: {},
          ip: request.ip,
          userAgent: request.userAgent || ''
        },
        permissions: [],
        metadata: {
          resolvedAt: new Date(),
          method: request.method,
          path: request.path
        }
      };

      this.currentContext.set(request.id, context);

      return {
        success: true,
        data: context,
        meta: {
          tenant: tenant.slug,
          timestamp: new Date(),
          requestId: request.id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TENANT_RESOLUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Set user context for tenant
   */
  public async setUserContext(requestId: string, user: TenantUser): Promise<MultiTenantResponse<void>> {
    try {
      const context = this.currentContext.get(requestId);
      if (!context) {
        return {
          success: false,
          error: {
            code: 'CONTEXT_NOT_FOUND',
            message: 'Request context not found',
            timestamp: new Date()
          }
        };
      }

      // Validate user belongs to tenant
      if (user.tenantId !== context.tenant.id) {
        return {
          success: false,
          error: {
            code: 'USER_TENANT_MISMATCH',
            message: 'User does not belong to the specified tenant',
            timestamp: new Date()
          }
        };
      }

      // Check user status
      if (user.status !== 'active') {
        return {
          success: false,
          error: {
            code: 'USER_INACTIVE',
            message: 'User account is not active',
            timestamp: new Date()
          }
        };
      }

      context.user = user;
      context.session.userId = user.id;
      
      // Extract permissions
      context.permissions = await this.extractUserPermissions(user);
      
      // Update context metadata
      context.metadata.userId = user.id;
      context.metadata.loginTime = new Date();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'USER_CONTEXT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Get current context for request
   */
  public getContext(requestId: string): TenantContext | null {
    return this.currentContext.get(requestId) || null;
  }

  /**
   * Clear context after request
   */
  public clearContext(requestId: string): void {
    this.currentContext.delete(requestId);
  }

  /**
   * Create new tenant
   */
  public async createTenant(tenantData: Partial<Tenant>): Promise<MultiTenantResponse<Tenant>> {
    try {
      // Validate tenant data
      const validation = this.validator.validateTenantData(tenantData);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_TENANT_DATA',
            message: 'Invalid tenant data provided',
            details: validation.errors,
            timestamp: new Date()
          }
        };
      }

      // Check for conflicts
      const conflicts = await this.tenantStorage.checkConflicts(tenantData);
      if (conflicts.length > 0) {
        return {
          success: false,
          error: {
            code: 'TENANT_CONFLICTS',
            message: 'Tenant configuration conflicts detected',
            details: conflicts,
            timestamp: new Date()
          }
        };
      }

      // Create tenant
      const tenant: Tenant = {
        id: this.generateTenantId(),
        name: tenantData.name || '',
        slug: tenantData.slug || '',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        configuration: {
          timezone: 'Asia/Dubai',
          currency: 'AED',
          language: 'en',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          workingDays: [1, 2, 3, 4, 5, 6], // Sunday to Saturday
          workingHours: { start: '09:00', end: '18:00' },
          features: {},
          customFields: {}
        },
        branding: {
          logo: '',
          favicon: '',
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          accentColor: '#f59e0b',
          theme: 'light',
          emailTemplates: [],
          pdfTemplates: []
        },
        subscription: {
          plan: 'basic',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          monthlyPrice: 99,
          features: ['basic_orders', 'customers', 'measurements'],
          usage: { users: 0, storage: 0, apiCalls: 0, tenants: 0 }
        },
        limits: {
          maxUsers: 10,
          maxStorage: 5, // GB
          maxApiCalls: 10000,
          maxOrders: 1000,
          maxCustomers: 500,
          features: {}
        },
        security: {
          encryption: true,
          twoFactorRequired: false,
          sessionTimeout: 480, // 8 hours
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false,
            preventReuse: 5
          },
          allowedIPs: [],
          auditLog: true,
          dataRetention: 365 // 1 year
        },
        ...tenantData
      };

      const created = await this.tenantStorage.createTenant(tenant);
      if (!created) {
        return {
          success: false,
          error: {
            code: 'TENANT_CREATION_FAILED',
            message: 'Failed to create tenant',
            timestamp: new Date()
          }
        };
      }

      return {
        success: true,
        data: created,
        meta: {
          tenant: created.slug,
          timestamp: new Date(),
          requestId: this.generateRequestId()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TENANT_CREATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Update tenant configuration
   */
  public async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<MultiTenantResponse<Tenant>> {
    try {
      const tenant = await this.tenantStorage.getTenant(tenantId);
      if (!tenant) {
        return {
          success: false,
          error: {
            code: 'TENANT_NOT_EXISTS',
            message: 'Tenant not found',
            timestamp: new Date()
          }
        };
      }

      const validation = this.validator.validateTenantUpdate(tenant, updates);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_TENANT_UPDATE',
            message: 'Invalid tenant update data',
            details: validation.errors,
            timestamp: new Date()
          }
        };
      }

      const updated = await this.tenantStorage.updateTenant(tenantId, {
        ...updates,
        updatedAt: new Date()
      });

      return {
        success: true,
        data: updated,
        meta: {
          tenant: updated.slug,
          timestamp: new Date(),
          requestId: this.generateRequestId()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TENANT_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Deactivate tenant
   */
  public async deactivateTenant(tenantId: string, reason?: string): Promise<MultiTenantResponse<void>> {
    try {
      const tenant = await this.tenantStorage.getTenant(tenantId);
      if (!tenant) {
        return {
          success: false,
          error: {
            code: 'TENANT_NOT_EXISTS',
            message: 'Tenant not found',
            timestamp: new Date()
          }
        };
      }

      // Archive tenant data
      await this.tenantStorage.archiveTenantData(tenantId);
      
      // Update status
      await this.tenantStorage.updateTenant(tenantId, { 
        status: 'inactive',
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TENANT_DEACTIVATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Extract user permissions
   */
  private async extractUserPermissions(user: TenantUser): Promise<string[]> {
    const permissions = new Set<string>();
    
    // Add role permissions
    for (const role of user.roles) {
      for (const permission of role.permissions) {
        permissions.add(`${permission.resource}:${permission.action}`);
      }
    }
    
    // Add direct permissions
    for (const permission of user.permissions) {
      permissions.add(`${permission.resource}:${permission.action}`);
    }
    
    return Array.from(permissions);
  }

  /**
   * Generate unique tenant ID
   */
  private generateTenantId(): string {
    return `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const multiTenantContext = MultiTenantContext.getInstance();
