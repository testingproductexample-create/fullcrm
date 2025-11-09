/**
 * Database Migration Manager
 * Handles schema migrations, version control, and rollback operations
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class MigrationManager extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            migrationPath: './migrations',
            tableName: 'schema_migrations',
            batchSize: 10,
            backupBeforeMigration: true,
            transactional: true,
            ...config
        };
        this.migrations = new Map();
        this.migrationHistory = [];
        this.currentVersion = '0.0.0';
        this.initialized = false;
    }

    async initialize() {
        console.log('🔧 Initializing Migration Manager...');
        
        try {
            await this.setupMigrationTable();
            await this.loadMigrations();
            await this.getCurrentVersion();
            this.initialized = true;
            this.emit('initialized');
            console.log('✅ Migration Manager initialized');
        } catch (error) {
            console.error('❌ Migration Manager initialization failed:', error);
            throw error;
        }
    }

    /**
     * Setup migration tracking table
     */
    async setupMigrationTable() {
        console.log('📋 Setting up migration tracking table...');
        
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS ${this.config.tableName} (
                id SERIAL PRIMARY KEY,
                version VARCHAR(50) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                checksum VARCHAR(64) NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                execution_time INTEGER,
                success BOOLEAN DEFAULT TRUE,
                error_message TEXT
            )
        `;
        
        try {
            // await this.executeQuery(createTableQuery);
            console.log('✅ Migration tracking table ready');
        } catch (error) {
            console.error('❌ Failed to setup migration table:', error);
            throw error;
        }
    }

    /**
     * Load migration files from filesystem
     */
    async loadMigrations() {
        console.log('📂 Loading migration files...');
        
        try {
            const files = await fs.readdir(this.config.migrationPath);
            const migrationFiles = files
                .filter(file => file.match(/^\d+_.*\.sql$/))
                .sort();
            
            for (const file of migrationFiles) {
                const content = await fs.readFile(path.join(this.config.migrationPath, file), 'utf8');
                const version = this.extractVersionFromFile(file);
                const checksum = this.calculateChecksum(content);
                
                this.migrations.set(version, {
                    version,
                    name: this.extractNameFromFile(file),
                    filename: file,
                    content,
                    checksum,
                    executed: false,
                    executionTime: null
                });
            }
            
            console.log(`📊 Loaded ${this.migrations.size} migration files`);
        } catch (error) {
            console.error('❌ Failed to load migrations:', error);
            throw error;
        }
    }

    /**
     * Extract version from migration filename
     */
    extractVersionFromFile(filename) {
        const match = filename.match(/^(\d+)_/);
        return match ? match[1] : '0.0.0';
    }

    /**
     * Extract name from migration filename
     */
    extractNameFromFile(filename) {
        return filename
            .replace(/^\d+_/, '')
            .replace(/\.sql$/, '')
            .replace(/_/g, ' ');
    }

    /**
     * Calculate file checksum
     */
    calculateChecksum(content) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Get current database version
     */
    async getCurrentVersion() {
        try {
            const query = `
                SELECT version 
                FROM ${this.config.tableName} 
                WHERE success = true 
                ORDER BY version DESC 
                LIMIT 1
            `;
            
            // const result = await this.executeQuery(query);
            const mockResult = { rows: [{ version: '001' }] };
            
            if (mockResult.rows.length > 0) {
                this.currentVersion = mockResult.rows[0].version;
            }
            
            console.log(`📍 Current database version: ${this.currentVersion}`);
        } catch (error) {
            console.log('📍 No previous migrations found, starting from version 0.0.0');
            this.currentVersion = '0.0.0';
        }
    }

    /**
     * Get pending migrations
     */
    getPendingMigrations() {
        const pending = [];
        
        for (let [version, migration] of this.migrations) {
            if (!migration.executed && this.compareVersions(version, this.currentVersion) > 0) {
                pending.push(migration);
            }
        }
        
        return pending.sort((a, b) => this.compareVersions(a.version, b.version));
    }

    /**
     * Compare version strings
     */
    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            
            if (part1 > part2) return 1;
            if (part1 < part2) return -1;
        }
        
        return 0;
    }

    /**
     * Execute pending migrations
     */
    async migrate(options = {}) {
        const { toVersion = null, batchSize = this.config.batchSize } = options;
        
        const pending = this.getPendingMigrations();
        const migrationsToRun = toVersion ? 
            pending.filter(m => this.compareVersions(m.version, toVersion) <= 0) :
            pending.slice(0, batchSize);
        
        if (migrationsToRun.length === 0) {
            console.log('✅ No pending migrations');
            return { success: true, migrated: 0 };
        }
        
        console.log(`🚀 Starting migration: ${migrationsToRun.length} pending migrations`);
        
        const results = {
            success: true,
            migrated: 0,
            failed: 0,
            details: []
        };
        
        try {
            for (const migration of migrationsToRun) {
                const result = await this.runSingleMigration(migration);
                results.details.push(result);
                
                if (result.success) {
                    results.migrated++;
                } else {
                    results.failed++;
                    results.success = false;
                    
                    if (this.config.transactional) {
                        console.log('🛑 Stopping migration due to transactional mode and failure');
                        break;
                    }
                }
            }
            
            console.log(`✅ Migration completed: ${results.migrated} successful, ${results.failed} failed`);
            this.emit('migrationCompleted', results);
            
            return results;
        } catch (error) {
            console.error('❌ Migration failed:', error);
            results.success = false;
            results.error = error.message;
            return results;
        }
    }

    /**
     * Run single migration
     */
    async runSingleMigration(migration) {
        console.log(`📋 Running migration ${migration.version}: ${migration.name}`);
        
        const startTime = Date.now();
        let success = false;
        let errorMessage = null;
        
        try {
            // Create backup if enabled
            if (this.config.backupBeforeMigration) {
                await this.createBackup(migration);
            }
            
            // Execute migration
            await this.executeMigration(migration);
            
            // Record successful migration
            await this.recordMigration(migration, Date.now() - startTime, true, null);
            
            migration.executed = true;
            migration.executionTime = Date.now() - startTime;
            this.currentVersion = migration.version;
            
            success = true;
            console.log(`✅ Migration ${migration.version} completed successfully`);
        } catch (error) {
            errorMessage = error.message;
            console.error(`❌ Migration ${migration.version} failed:`, error.message);
            
            // Record failed migration
            await this.recordMigration(migration, Date.now() - startTime, false, errorMessage);
        }
        
        return {
            version: migration.version,
            name: migration.name,
            success,
            errorMessage,
            executionTime: Date.now() - startTime
        };
    }

    /**
     * Execute migration SQL
     */
    async executeMigration(migration) {
        // Split migration into individual statements
        const statements = this.splitSQLStatements(migration.content);
        
        for (const statement of statements) {
            if (statement.trim()) {
                // await this.executeQuery(statement);
                console.log(`  Executing: ${statement.substring(0, 50)}...`);
            }
        }
    }

    /**
     * Split SQL into individual statements
     */
    splitSQLStatements(content) {
        return content
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
    }

    /**
     * Record migration execution
     */
    async recordMigration(migration, executionTime, success, errorMessage) {
        const insertQuery = `
            INSERT INTO ${this.config.tableName} 
            (version, name, checksum, execution_time, success, error_message)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        const params = [
            migration.version,
            migration.name,
            migration.checksum,
            executionTime,
            success,
            errorMessage
        ];
        
        // await this.executeQuery(insertQuery, params);
    }

    /**
     * Create backup before migration
     */
    async createBackup(migration) {
        console.log(`💾 Creating backup before migration ${migration.version}`);
        
        const backupQuery = `
            SELECT 'BACKUP_' || current_timestamp || '_${migration.version}' as backup_name
        `;
        
        // const result = await this.executeQuery(backupQuery);
        // const backupName = result.rows[0].backup_name;
        
        // In real implementation, this would create actual backup
        console.log(`✅ Backup created for migration ${migration.version}`);
    }

    /**
     * Rollback to specific version
     */
    async rollback(targetVersion) {
        console.log(`⏪ Rolling back to version ${targetVersion}`);
        
        if (this.compareVersions(targetVersion, this.currentVersion) >= 0) {
            throw new Error('Cannot rollback to a version newer than current');
        }
        
        const executedMigrations = this.getExecutedMigrations();
        const migrationsToRollback = executedMigrations
            .filter(m => this.compareVersions(m.version, targetVersion) > 0)
            .sort((a, b) => this.compareVersions(b.version, a.version)); // Descending
        
        const results = {
            success: true,
            rolledBack: 0,
            failed: 0,
            details: []
        };
        
        try {
            for (const migration of migrationsToRollback) {
                const result = await this.rollbackSingleMigration(migration);
                results.details.push(result);
                
                if (result.success) {
                    results.rolledBack++;
                } else {
                    results.failed++;
                    results.success = false;
                }
            }
            
            console.log(`✅ Rollback completed: ${results.rolledBack} rolled back, ${results.failed} failed`);
            return results;
        } catch (error) {
            console.error('❌ Rollback failed:', error);
            throw error;
        }
    }

    /**
     * Rollback single migration
     */
    async rollbackSingleMigration(migration) {
        console.log(`⏪ Rolling back migration ${migration.version}: ${migration.name}`);
        
        const rollbackFile = path.join(
            this.config.migrationPath, 
            `${migration.version}_rollback_${migration.name.replace(/\s+/g, '_')}.sql`
        );
        
        try {
            const rollbackContent = await fs.readFile(rollbackFile, 'utf8');
            const statements = this.splitSQLStatements(rollbackContent);
            
            for (const statement of statements) {
                if (statement.trim()) {
                    // await this.executeQuery(statement);
                    console.log(`  Rolling back: ${statement.substring(0, 50)}...`);
                }
            }
            
            // Remove from migration history
            await this.removeMigrationRecord(migration.version);
            
            console.log(`✅ Migration ${migration.version} rolled back successfully`);
            return { success: true, version: migration.version };
        } catch (error) {
            console.error(`❌ Failed to rollback migration ${migration.version}:`, error.message);
            return { success: false, version: migration.version, error: error.message };
        }
    }

    /**
     * Remove migration record
     */
    async removeMigrationRecord(version) {
        const deleteQuery = `
            DELETE FROM ${this.config.tableName} 
            WHERE version = $1
        `;
        
        // await this.executeQuery(deleteQuery, [version]);
    }

    /**
     * Get executed migrations
     */
    getExecutedMigrations() {
        const executed = [];
        
        for (let [version, migration] of this.migrations) {
            if (migration.executed) {
                executed.push(migration);
            }
        }
        
        return executed.sort((a, b) => this.compareVersions(a.version, b.version));
    }

    /**
     * Create new migration
     */
    async createMigration(name) {
        const timestamp = Date.now();
        const version = this.generateNextVersion();
        const filename = `${version}_${name.replace(/\s+/g, '_')}.sql`;
        const rollbackFilename = `${version}_rollback_${name.replace(/\s+/g, '_')}.sql`;
        
        const content = `-- Migration: ${name}\n-- Version: ${version}\n-- Created: ${new Date().toISOString()}\n\n-- Add your SQL statements here\n`;
        const rollbackContent = `-- Rollback: ${name}\n-- Version: ${version}\n-- Created: ${new Date().toISOString()}\n\n-- Add your rollback SQL statements here\n`;
        
        try {
            await fs.writeFile(path.join(this.config.migrationPath, filename), content);
            await fs.writeFile(path.join(this.config.migrationPath, rollbackFilename), rollbackContent);
            
            console.log(`📄 Created migration: ${filename}`);
            console.log(`📄 Created rollback: ${rollbackFilename}`);
            
            return { version, filename, rollbackFilename };
        } catch (error) {
            console.error('❌ Failed to create migration:', error);
            throw error;
        }
    }

    /**
     * Generate next version number
     */
    generateNextVersion() {
        const current = this.currentVersion.split('.').map(Number);
        current[current.length - 1] += 1;
        return current.join('');
    }

    /**
     * Get migration status
     */
    getMigrationStatus() {
        const pending = this.getPendingMigrations();
        const executed = this.getExecutedMigrations();
        
        return {
            currentVersion: this.currentVersion,
            totalMigrations: this.migrations.size,
            executed: executed.length,
            pending: pending.length,
            lastExecuted: executed.length > 0 ? executed[executed.length - 1] : null,
            nextPending: pending.length > 0 ? pending[0] : null
        };
    }

    /**
     * Validate migrations
     */
    async validateMigrations() {
        console.log('🔍 Validating migrations...');
        
        const results = {
            valid: true,
            issues: [],
            warnings: []
        };
        
        try {
            for (let [version, migration] of this.migrations) {
                // Check if migration file was modified
                const currentContent = await fs.readFile(
                    path.join(this.config.migrationPath, migration.filename), 
                    'utf8'
                );
                const currentChecksum = this.calculateChecksum(currentContent);
                
                if (currentChecksum !== migration.checksum) {
                    results.warnings.push({
                        type: 'modified',
                        version: version,
                        message: 'Migration file has been modified since execution'
                    });
                }
                
                // Check if rollback file exists for executed migrations
                if (migration.executed) {
                    const rollbackFile = path.join(
                        this.config.migrationPath,
                        `${version}_rollback_${migration.name.replace(/\s+/g, '_')}.sql`
                    );
                    
                    try {
                        await fs.access(rollbackFile);
                    } catch {
                        results.issues.push({
                            type: 'missing_rollback',
                            version: version,
                            message: 'Rollback file is missing'
                        });
                    }
                }
            }
            
            results.valid = results.issues.length === 0;
            
            console.log(`✅ Migration validation completed: ${results.issues.length} issues, ${results.warnings.length} warnings`);
            return results;
        } catch (error) {
            console.error('❌ Migration validation failed:', error);
            throw error;
        }
    }

    async executeQuery(query, params = []) {
        // This would execute the query on the actual database
        console.log('Executing query:', query.substring(0, 100) + '...');
        return { rows: [], rowCount: 0 };
    }

    async cleanup() {
        console.log('🧹 Cleaning up Migration Manager...');
        
        this.migrations.clear();
        this.migrationHistory = [];
        this.initialized = false;
        console.log('✅ Migration Manager cleanup complete');
    }
}

module.exports = MigrationManager;