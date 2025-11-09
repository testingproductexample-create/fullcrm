/**
 * Tenant Storage Service - Data Isolation and Management
 * UAE Tailoring Business Platform
 */

import { Tenant, TenantData, DataIsolationStrategy, TenantTable, TenantColumn } from '../../types';
import { DatabaseService } from '../database/tenant-database';
import { CacheService } from '../cache/tenant-cache';

export class TenantStorageService {
  private db: DatabaseService;
  private cache: CacheService;
  private isolationStrategy: DataIsolationStrategy;

  constructor() {
    this.db = new DatabaseService();
    this.cache = new CacheService();
    this.isolationStrategy = {
      type: 'row_level',
      configuration: {
        columnName: 'tenant_id',
        enableRLS: true,
        enableEncryption: true,
        encryptionType: 'AES-256'
      }
    };
  }

  /**
   * Create new tenant
   */
  async createTenant(tenant: Tenant): Promise<Tenant | null> {
    try {
      // Create tenant record
      await this.db.create('tenants', {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        subdomain: tenant.subdomain,
        status: tenant.status,
        configuration: JSON.stringify(tenant.configuration),
        branding: JSON.stringify(tenant.branding),
        subscription: JSON.stringify(tenant.subscription),
        limits: JSON.stringify(tenant.limits),
        security: JSON.stringify(tenant.security),
        created_at: tenant.createdAt,
        updated_at: tenant.updatedAt
      });

      // Set up tenant-specific data isolation
      await this.setupDataIsolation(tenant.id);

      // Create tenant schema/tables if needed
      await this.createTenantSchema(tenant.id);

      // Initialize tenant cache
      await this.cache.set(`tenant:${tenant.id}`, tenant, 3600);

      return tenant;
    } catch (error) {
      console.error('Failed to create tenant:', error);
      return null;
    }
  }

  /**
   * Get tenant by ID
   */
  async getTenant(tenantId: string): Promise<Tenant | null> {
    try {
      // Check cache first
      const cached = await this.cache.get<Tenant>(`tenant:${tenantId}`);
      if (cached) return cached;

      // Load from database
      const record = await this.db.findOne('tenants', { id: tenantId });
      if (!record) return null;

      const tenant: Tenant = {
        id: record.id,
        name: record.name,
        slug: record.slug,
        domain: record.domain,
        subdomain: record.subdomain,
        status: record.status,
        configuration: JSON.parse(record.configuration),
        branding: JSON.parse(record.branding),
        subscription: JSON.parse(record.subscription),
        limits: JSON.parse(record.limits),
        security: JSON.parse(record.security),
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at)
      };

      // Cache for future use
      await this.cache.set(`tenant:${tenantId}`, tenant, 3600);
      return tenant;
    } catch (error) {
      console.error('Failed to get tenant:', error);
      return null;
    }
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    try {
      const record = await this.db.findOne('tenants', { slug });
      if (!record) return null;

      return await this.getTenant(record.id);
    } catch (error) {
      console.error('Failed to get tenant by slug:', error);
      return null;
    }
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant | null> {
    try {
      const existing = await this.getTenant(tenantId);
      if (!existing) return null;

      // Prepare update data
      const updateData: any = {
        updated_at: new Date()
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.slug) updateData.slug = updates.slug;
      if (updates.domain) updateData.domain = updates.domain;
      if (updates.subdomain) updateData.subdomain = updates.subdomain;
      if (updates.status) updateData.status = updates.status;
      if (updates.configuration) updateData.configuration = JSON.stringify(updates.configuration);
      if (updates.branding) updateData.branding = JSON.stringify(updates.branding);
      if (updates.subscription) updateData.subscription = JSON.stringify(updates.subscription);
      if (updates.limits) updateData.limits = JSON.stringify(updates.limits);
      if (updates.security) updateData.security = JSON.stringify(updates.security);

      // Update in database
      await this.db.update('tenants', { id: tenantId }, updateData);

      // Clear cache
      await this.cache.delete(`tenant:${tenantId}`);

      return await this.getTenant(tenantId);
    } catch (error) {
      console.error('Failed to update tenant:', error);
      return null;
    }
  }

  /**
   * Delete tenant
   */
  async deleteTenant(tenantId: string): Promise<boolean> {
    try {
      // Archive tenant data first
      await this.archiveTenantData(tenantId);

      // Remove from database
      await this.db.delete('tenants', { id: tenantId });

      // Clean up cache
      await this.cache.delete(`tenant:${tenantId}`);

      return true;
    } catch (error) {
      console.error('Failed to delete tenant:', error);
      return false;
    }
  }

  /**
   * Archive tenant data for compliance
   */
  async archiveTenantData(tenantId: string): Promise<void> {
    try {
      // Create backup of all tenant data
      const tables = [
        'orders', 'customers', 'measurements', 'employees',
        'inventory', 'appointments', 'invoices', 'payments'
      ];

      for (const table of tables) {
        // Copy data to archive table
        await this.db.query(`
          INSERT INTO ${table}_archive_${tenantId}
          SELECT * FROM ${table} WHERE tenant_id = $1
        `, [tenantId]);

        // Mark as archived
        await this.db.update(table, { tenant_id: tenantId }, { 
          archived: true,
          archived_at: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to archive tenant data:', error);
    }
  }

  /**
   * Check for tenant configuration conflicts
   */
  async checkConflicts(tenantData: Partial<Tenant>): Promise<string[]> {
    const conflicts: string[] = [];

    try {
      // Check slug conflicts
      if (tenantData.slug) {
        const existing = await this.db.findOne('tenants', { slug: tenantData.slug });
        if (existing) {
          conflicts.push('Tenant slug already exists');
        }
      }

      // Check domain conflicts
      if (tenantData.domain) {
        const existing = await this.db.findOne('tenants', { domain: tenantData.domain });
        if (existing) {
          conflicts.push('Domain already in use');
        }
      }

      // Check subdomain conflicts
      if (tenantData.subdomain) {
        const existing = await this.db.findOne('tenants', { subdomain: tenantData.subdomain });
        if (existing) {
          conflicts.push('Subdomain already in use');
        }
      }

      return conflicts;
    } catch (error) {
      console.error('Failed to check conflicts:', error);
      return ['Failed to validate configuration'];
    }
  }

  /**
   * Set up data isolation for tenant
   */
  private async setupDataIsolation(tenantId: string): Promise<void> {
    try {
      const strategy = this.isolationStrategy;
      
      switch (strategy.type) {
        case 'row_level':
          await this.setupRowLevelIsolation(tenantId, strategy);
          break;
        case 'schema':
          await this.setupSchemaIsolation(tenantId, strategy);
          break;
        case 'database':
          await this.setupDatabaseIsolation(tenantId, strategy);
          break;
        default:
          console.warn('Unsupported isolation strategy');
      }
    } catch (error) {
      console.error('Failed to setup data isolation:', error);
    }
  }

  /**
   * Setup row-level security
   */
  private async setupRowLevelIsolation(tenantId: string, strategy: DataIsolationStrategy): Promise<void> {
    try {
      const columnName = strategy.configuration.columnName || 'tenant_id';
      
      // Enable RLS on all tenant-specific tables
      const tables = [
        'orders', 'customers', 'measurements', 'employees',
        'inventory', 'appointments', 'invoices', 'payments'
      ];

      for (const table of tables) {
        // Enable RLS
        await this.db.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);

        // Create policy for tenant isolation
        await this.db.query(`
          CREATE POLICY tenant_isolation_policy ON ${table}
          FOR ALL TO application_role
          USING (${columnName} = $1)
          WITH CHECK (${columnName} = $1)
        `, [tenantId]);
      }
    } catch (error) {
      console.error('Failed to setup row-level isolation:', error);
    }
  }

  /**
   * Setup schema-based isolation
   */
  private async setupSchemaIsolation(tenantId: string, strategy: DataIsolationStrategy): Promise<void> {
    try {
      const schemaName = `tenant_${tenantId}`;
      
      // Create schema
      await this.db.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

      // Set search path
      await this.db.query(`SET search_path = ${schemaName}, public`);

      // Create tables in schema (would be done by migration system)
      await this.createTenantSchema(tenantId);
    } catch (error) {
      console.error('Failed to setup schema isolation:', error);
    }
  }

  /**
   * Setup database isolation
   */
  private async setupDatabaseIsolation(tenantId: string, strategy: DataIsolationStrategy): Promise<void> {
    try {
      const dbName = `tenant_${tenantId}`;
      
      // Note: This would typically be done by database admin
      console.log(`Database isolation would be created for: ${dbName}`);
    } catch (error) {
      console.error('Failed to setup database isolation:', error);
    }
  }

  /**
   * Create tenant-specific schema
   */
  private async createTenantSchema(tenantId: string): Promise<void> {
    try {
      const schemaName = `tenant_${tenantId}`;
      
      // Create custom tables for this tenant if needed
      const customTables = [
        'tenant_settings',
        'tenant_customers',
        'tenant_orders',
        'tenant_analytics'
      ];

      for (const tableName of customTables) {
        // Create table with tenant ID column
        await this.db.query(`
          CREATE TABLE IF NOT EXISTS ${schemaName}.${tableName} (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id),
            data JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }
    } catch (error) {
      console.error('Failed to create tenant schema:', error);
    }
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(tenantId: string): Promise<any> {
    try {
      const tables = [
        'orders', 'customers', 'measurements', 'employees',
        'appointments', 'invoices', 'payments'
      ];

      const stats: any = {};

      for (const table of tables) {
        const count = await this.db.query(`
          SELECT COUNT(*) as count FROM ${table} WHERE tenant_id = $1
        `, [tenantId]);
        stats[table] = parseInt(count.rows[0]?.count || '0');
      }

      return stats;
    } catch (error) {
      console.error('Failed to get tenant stats:', error);
      return {};
    }
  }

  /**
   * List all tenants
   */
  async listTenants(page: number = 1, limit: number = 50): Promise<{ tenants: Tenant[], total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      const records = await this.db.query(`
        SELECT * FROM tenants 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      const total = await this.db.query(`SELECT COUNT(*) FROM tenants`);
      
      const tenants: Tenant[] = records.rows.map((record: any) => ({
        id: record.id,
        name: record.name,
        slug: record.slug,
        domain: record.domain,
        subdomain: record.subdomain,
        status: record.status,
        configuration: JSON.parse(record.configuration),
        branding: JSON.parse(record.branding),
        subscription: JSON.parse(record.subscription),
        limits: JSON.stringify(record.limits),
        security: JSON.parse(record.security),
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at)
      }));

      return {
        tenants,
        total: parseInt(total.rows[0]?.count || '0')
      };
    } catch (error) {
      console.error('Failed to list tenants:', error);
      return { tenants: [], total: 0 };
    }
  }

  /**
   * Check tenant limits
   */
  async checkTenantLimits(tenantId: string): Promise<{ exceeded: boolean, limits: any[] }> {
    try {
      const tenant = await this.getTenant(tenantId);
      if (!tenant) return { exceeded: true, limits: [] };

      const stats = await this.getTenantStats(tenantId);
      const limits: any[] = [];

      // Check user limit
      if (stats.employees >= tenant.limits.maxUsers) {
        limits.push({
          type: 'users',
          current: stats.employees,
          limit: tenant.limits.maxUsers,
          exceeded: true
        });
      }

      // Check storage limit (would be calculated based on actual data)
      if (tenant.subscription.usage.storage >= tenant.limits.maxStorage) {
        limits.push({
          type: 'storage',
          current: tenant.subscription.usage.storage,
          limit: tenant.limits.maxStorage,
          exceeded: true
        });
      }

      // Check order limit
      if (stats.orders >= tenant.limits.maxOrders) {
        limits.push({
          type: 'orders',
          current: stats.orders,
          limit: tenant.limits.maxOrders,
          exceeded: true
        });
      }

      return {
        exceeded: limits.length > 0,
        limits
      };
    } catch (error) {
      console.error('Failed to check tenant limits:', error);
      return { exceeded: true, limits: [] };
    }
  }
}
