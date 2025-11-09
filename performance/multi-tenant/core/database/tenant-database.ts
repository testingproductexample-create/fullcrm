/**
 * Tenant Database Service
 * UAE Tailoring Business Platform
 */

import { Pool, PoolClient, QueryResult } from 'pg';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'tailoring_platform',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * Execute a query
   */
  async query(text: string, params?: any[]): Promise<QueryResult> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a transaction
   */
  async transaction(callback: (client: PoolClient) => Promise<any>): Promise<any> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create record
   */
  async create(table: string, data: Record<string, any>): Promise<any> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Find one record
   */
  async findOne(table: string, conditions: Record<string, any>): Promise<any> {
    const whereClause = this.buildWhereClause(conditions);
    const query = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`;
    
    const result = await this.query(query, Object.values(conditions));
    return result.rows[0] || null;
  }

  /**
   * Find multiple records
   */
  async findMany(table: string, conditions: Record<string, any> = {}, options: {
    orderBy?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    let query = `SELECT * FROM ${table}`;
    
    if (Object.keys(conditions).length > 0) {
      const whereClause = this.buildWhereClause(conditions);
      query += ` WHERE ${whereClause}`;
    }

    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }

    if (options.offset) {
      query += ` OFFSET ${options.offset}`;
    }

    const result = await this.query(query, Object.values(conditions));
    return result.rows;
  }

  /**
   * Update records
   */
  async update(table: string, conditions: Record<string, any>, data: Record<string, any>): Promise<any> {
    const setClause = this.buildSetClause(data);
    const whereClause = this.buildWhereClause(conditions);
    
    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING *
    `;

    const params = [...Object.values(data), ...Object.values(conditions)];
    const result = await this.query(query, params);
    return result.rows[0] || null;
  }

  /**
   * Delete records
   */
  async delete(table: string, conditions: Record<string, any>): Promise<number> {
    const whereClause = this.buildWhereClause(conditions);
    const query = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    const result = await this.query(query, Object.values(conditions));
    return parseInt(result.rowCount?.toString() || '0');
  }

  /**
   * Count records
   */
  async count(table: string, conditions: Record<string, any> = {}): Promise<number> {
    let query = `SELECT COUNT(*) FROM ${table}`;
    let params: any[] = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = this.buildWhereClause(conditions);
      query += ` WHERE ${whereClause}`;
      params = Object.values(conditions);
    }

    const result = await this.query(query, params);
    return parseInt(result.rows[0]?.count || '0');
  }

  /**
   * Bulk insert
   */
  async bulkInsert(table: string, records: Record<string, any>[]): Promise<any[]> {
    if (records.length === 0) return [];

    const columns = Object.keys(records[0]);
    const values = records.map(record => Object.values(record));
    
    const placeholderGroups = values.map((_, index) => {
      const start = index * columns.length;
      return columns.map((_, colIndex) => `$${start + colIndex + 1}`).join(', ');
    });

    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${placeholderGroups.map(group => `(${group})`).join(', ')}
      RETURNING *
    `;

    const flatValues = values.flat();
    const result = await this.query(query, flatValues);
    return result.rows;
  }

  /**
   * Create table with tenant isolation
   */
  async createTenantTable(tableName: string, columns: any[]): Promise<void> {
    const columnDefinitions = columns.map(col => {
      const def = `${col.name} ${col.type}`;
      if (col.nullable === false) def += ' NOT NULL';
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      return def;
    });

    const query = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        ${columnDefinitions.join(', ')},
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.query(query);

    // Create index on tenant_id for better performance
    await this.query(`CREATE INDEX IF NOT EXISTS idx_${tableName}_tenant_id ON ${tableName}(tenant_id)`);
  }

  /**
   * Create tenant-specific view
   */
  async createTenantView(viewName: string, selectQuery: string, tenantColumn: string = 'tenant_id'): Promise<void> {
    const query = `
      CREATE OR REPLACE VIEW ${viewName} AS
      SELECT * FROM (${selectQuery}) sub
      WHERE ${tenantColumn} = current_setting('app.current_tenant_id', true)::uuid
    `;

    await this.query(query);
  }

  /**
   * Enable row-level security on table
   */
  async enableRowLevelSecurity(tableName: string, tenantColumn: string = 'tenant_id'): Promise<void> {
    // Enable RLS
    await this.query(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY`);

    // Create policy for tenant isolation
    const policyName = `${tableName}_tenant_isolation`;
    const query = `
      CREATE POLICY ${policyName} ON ${tableName}
      FOR ALL TO application_role
      USING (${tenantColumn} = current_setting('app.current_tenant_id', true)::uuid)
      WITH CHECK (${tenantColumn} = current_setting('app.current_tenant_id', true)::uuid)
    `;

    await this.query(query);
  }

  /**
   * Set current tenant context
   */
  async setTenantContext(tenantId: string): Promise<void> {
    await this.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
  }

  /**
   * Get current tenant context
   */
  getTenantContext(): Promise<string> {
    return this.query(`SELECT current_setting('app.current_tenant_id', true)`)
      .then(result => result.rows[0]?.current_setting || null);
  }

  /**
   * Create full-text search index for tenant
   */
  async createSearchIndex(tableName: string, columns: string[], tenantColumn: string = 'tenant_id'): Promise<void> {
    const indexName = `${tableName}_search_idx`;
    const columnList = [...columns, tenantColumn].join(', ');
    
    const query = `
      CREATE INDEX ${indexName} ON ${tableName}
      USING gin(to_tsvector('english', ${columns.join(' || ' || ' ') }))
      WHERE ${tenantColumn} = current_setting('app.current_tenant_id', true)::uuid
    `;

    await this.query(query);
  }

  /**
   * Create database backup for tenant
   */
  async backupTenant(tenantId: string): Promise<string> {
    const backupName = `backup_tenant_${tenantId}_${Date.now()}`;
    
    // Create backup by copying tenant data
    const query = `
      CREATE TABLE ${backupName} AS
      SELECT * FROM all_tenant_data
      WHERE tenant_id = $1
    `;

    await this.query(query, [tenantId]);
    return backupName;
  }

  /**
   * Restore tenant from backup
   */
  async restoreTenant(tenantId: string, backupName: string): Promise<void> {
    // Restore from backup (this is a simplified version)
    const query = `
      INSERT INTO all_tenant_data
      SELECT * FROM ${backupName}
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.query(query);
  }

  /**
   * Build WHERE clause from conditions
   */
  private buildWhereClause(conditions: Record<string, any>): string {
    return Object.keys(conditions)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ');
  }

  /**
   * Build SET clause from data
   */
  private buildSetClause(data: Record<string, any>): string {
    return Object.keys(data)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1');
      return result.rows.length > 0;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
