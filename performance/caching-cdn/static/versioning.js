const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');

/**
 * Advanced asset versioning system for cache busting and dependency management
 */
class AssetVersioning extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      strategy: options.strategy || 'content-hash', // 'content-hash', 'timestamp', 'semantic', 'incremental'
      baseDir: options.baseDir || './public',
      manifestPath: options.manifestPath || './dist/asset-manifest.json',
      enableCacheBusting: options.enableCacheBusting !== false,
      enableDependencies: options.enableDependencies !== false,
      enableRollback: options.enableRollback !== false,
      maxVersions: options.maxVersions || 10,
      hashLength: options.hashLength || 8,
      ...options
    };
    
    this.versionStore = new Map();
    this.dependencyGraph = new Map();
    this.versionHistory = [];
    this.assetManifest = new Map();
    
    this.metrics = {
      totalVersions: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rollbacks: 0,
      versionConflicts: 0,
      averageVersioningTime: 0
    };
    
    this._initializeVersioning();
  }

  /**
   * Initialize versioning system
   */
  async _initializeVersioning() {
    try {
      // Load existing manifest
      await this._loadManifest();
      
      // Load version history
      await this._loadVersionHistory();
      
      this.emit('versioning_initialized');
    } catch (error) {
      console.warn('Failed to initialize versioning system:', error.message);
    }
  }

  /**
   * Create version for asset
   */
  async createVersion(assetPath, content, options = {}) {
    const startTime = Date.now();
    
    try {
      const { 
        strategy = this.options.strategy,
        customVersion,
        dependencies = [],
        metadata = {}
      } = options;
      
      // Read current content if not provided
      if (!content) {
        const fullPath = path.join(this.options.baseDir, assetPath);
        content = await fs.readFile(fullPath, 'utf8');
      }
      
      // Generate version identifier
      const version = await this._generateVersion(
        content, 
        strategy, 
        customVersion
      );
      
      // Create version record
      const versionRecord = {
        assetPath,
        version,
        contentHash: this._generateContentHash(content),
        originalContent: content,
        createdAt: new Date().toISOString(),
        strategy,
        size: Buffer.byteLength(content, 'utf8'),
        dependencies: dependencies || [],
        metadata: {
          ...metadata,
          originalPath: assetPath
        }
      };
      
      // Store version
      this.versionStore.set(`${assetPath}:${version}`, versionRecord);
      
      // Update asset manifest
      this._updateAssetManifest(assetPath, version, versionRecord);
      
      // Build dependency relationships
      if (this.options.enableDependencies && dependencies.length > 0) {
        this._buildDependencyRelationships(assetPath, version, dependencies);
      }
      
      // Update metrics
      const versioningTime = Date.now() - startTime;
      this._updateVersioningMetrics(versioningTime);
      
      // Clean up old versions
      await this._cleanupOldVersions(assetPath);
      
      const result = {
        assetPath,
        version,
        contentHash: versionRecord.contentHash,
        versionedPath: this._getVersionedPath(assetPath, version),
        createdAt: versionRecord.createdAt,
        size: versionRecord.size,
        versioningTime
      };
      
      this.emit('version_created', {
        assetPath,
        version,
        strategy,
        contentHash: versionRecord.contentHash
      });
      
      return result;
      
    } catch (error) {
      this.emit('versioning_error', {
        assetPath,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get versioned asset path
   */
  async getVersionedPath(assetPath, version = 'latest', options = {}) {
    const { fallback = true } = options;
    
    try {
      // Try to get specific version
      if (version !== 'latest') {
        const versionKey = `${assetPath}:${version}`;
        if (this.versionStore.has(versionKey)) {
          this.metrics.cacheHits++;
          return this._getVersionedPath(assetPath, version);
        }
      }
      
      // Get latest version
      const latestVersion = this._getLatestVersion(assetPath);
      if (latestVersion) {
        this.metrics.cacheHits++;
        return this._getVersionedPath(assetPath, latestVersion.version);
      }
      
      // Fallback to original path
      if (fallback) {
        this.metrics.cacheMisses++;
        this.emit('version_not_found', { assetPath, version, fallback: 'original' });
        return assetPath;
      }
      
      throw new Error(`Version not found: ${version} for asset: ${assetPath}`);
      
    } catch (error) {
      this.metrics.cacheMisses++;
      throw error;
    }
  }

  /**
   * Get specific version
   */
  getVersion(assetPath, version) {
    const versionKey = `${assetPath}:${version}`;
    return this.versionStore.get(versionKey) || null;
  }

  /**
   * Get latest version of asset
   */
  getLatestVersion(assetPath) {
    return this._getLatestVersion(assetPath);
  }

  /**
   * List all versions of asset
   */
  listVersions(assetPath, limit = null) {
    const versions = [];
    
    for (const [key, record] of this.versionStore) {
      if (key.startsWith(`${assetPath}:`)) {
        versions.push({
          version: record.version,
          contentHash: record.contentHash,
          createdAt: record.createdAt,
          size: record.size,
          strategy: record.strategy
        });
      }
    }
    
    // Sort by creation date (newest first)
    versions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return limit ? versions.slice(0, limit) : versions;
  }

  /**
   * Rollback to previous version
   */
  async rollback(assetPath, targetVersion, options = {}) {
    const startTime = Date.now();
    
    try {
      const { createNewVersion = false, reason = 'manual_rollback' } = options;
      
      // Find target version
      const targetVersionRecord = this.getVersion(assetPath, targetVersion);
      if (!targetVersionRecord) {
        throw new Error(`Target version ${targetVersion} not found for asset ${assetPath}`);
      }
      
      if (createNewVersion) {
        // Create new version with content from target
        const result = await this.createVersion(
          assetPath,
          targetVersionRecord.originalContent,
          {
            strategy: 'rollback',
            customVersion: this._generateRollbackVersion(targetVersion),
            metadata: { 
              ...targetVersionRecord.metadata,
              rollbackFrom: targetVersion,
              rollbackReason: reason
            }
          }
        );
        
        this.metrics.rollbacks++;
        this.emit('version_rollback', {
          assetPath,
          fromVersion: this.getLatestVersion(assetPath)?.version,
          toVersion: targetVersion,
          newVersion: result.version
        });
        
        return result;
      } else {
        // Direct rollback (not recommended for production)
        this.emit('version_rollback_warning', {
          assetPath,
          targetVersion,
          warning: 'Direct rollback without new version creation'
        });
        
        return {
          assetPath,
          version: targetVersion,
          contentHash: targetVersionRecord.contentHash,
          versionedPath: this._getVersionedPath(assetPath, targetVersion)
        };
      }
      
    } catch (error) {
      this.emit('rollback_error', {
        assetPath,
        targetVersion,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Invalidate versions based on dependencies
   */
  async invalidateByDependency(dependencyPath) {
    const affectedAssets = [];
    
    if (!this.dependencyGraph.has(dependencyPath)) {
      return { affectedAssets: [], invalidations: 0 };
    }
    
    const dependentAssets = this.dependencyGraph.get(dependencyPath);
    
    for (const [assetPath, version] of dependentAssets) {
      // Create new version to invalidate cached versions
      const latestVersion = this.getLatestVersion(assetPath);
      if (latestVersion) {
        await this.createVersion(
          assetPath,
          latestVersion.originalContent,
          {
            strategy: 'dependency_invalidation',
            metadata: { 
              invalidatesDependency: dependencyPath,
              invalidationReason: 'dependency_changed'
            }
          }
        );
        
        affectedAssets.push({
          assetPath,
          previousVersion: version,
          newVersion: this.getLatestVersion(assetPath)?.version
        });
      }
    }
    
    this.emit('dependency_invalidation', {
      dependency: dependencyPath,
      affectedAssets: affectedAssets.length
    });
    
    return {
      dependency: dependencyPath,
      affectedAssets,
      invalidations: affectedAssets.length
    };
  }

  /**
   * Generate deployment manifest
   */
  async generateDeploymentManifest(baseUrl = '', options = {}) {
    const { includeHashes = true, includeDependencies = true, groupByType = false } = options;
    
    const manifest = {
      version: this._generateManifestVersion(),
      generatedAt: new Date().toISOString(),
      baseUrl,
      assets: {}
    };
    
    for (const [key, record] of this.versionStore) {
      if (key.includes(':')) {
        const [assetPath, version] = key.split(':');
        
        // Skip if not the latest version
        const latestVersion = this.getLatestVersion(assetPath);
        if (!latestVersion || latestVersion.version !== version) {
          continue;
        }
        
        const manifestEntry = {
          version,
          originalPath: assetPath,
          versionedPath: this._getVersionedPath(assetPath, version),
          size: record.size,
          contentHash: includeHashes ? record.contentHash : undefined,
          createdAt: record.createdAt,
          strategy: record.strategy
        };
        
        if (includeDependencies && record.dependencies.length > 0) {
          manifestEntry.dependencies = record.dependencies;
        }
        
        if (groupByType) {
          const fileExt = path.extname(assetPath).slice(1);
          if (!manifest.assets[fileExt]) {
            manifest.assets[fileExt] = {};
          }
          manifest.assets[fileExt][assetPath] = manifestEntry;
        } else {
          manifest.assets[assetPath] = manifestEntry;
        }
      }
    }
    
    // Save manifest to file
    const manifestContent = JSON.stringify(manifest, null, 2);
    await fs.writeFile(this.options.manifestPath, manifestContent);
    
    this.emit('deployment_manifest_generated', {
      manifestPath: this.options.manifestPath,
      assetCount: Object.keys(manifest.assets).length
    });
    
    return manifest;
  }

  /**
   * Bulk create versions for multiple assets
   */
  async bulkVersioning(assetPaths, options = {}) {
    const { 
      parallel = true, 
      maxConcurrent = 5, 
      strategy = this.options.strategy 
    } = options;
    
    const results = [];
    const errors = [];
    
    if (parallel) {
      // Process in parallel with concurrency limit
      const batches = this._createBatches(assetPaths, maxConcurrent);
      
      for (const batch of batches) {
        const batchResults = await Promise.allSettled(
          batch.map(assetPath => this.createVersion(assetPath, null, { ...options, strategy }))
        );
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            errors.push({
              assetPath: batch[index],
              error: result.reason.message
            });
          }
        });
      }
    } else {
      // Process sequentially
      for (const assetPath of assetPaths) {
        try {
          const result = await this.createVersion(assetPath, null, { ...options, strategy });
          results.push(result);
        } catch (error) {
          errors.push({ assetPath, error: error.message });
        }
      }
    }
    
    this.emit('bulk_versioning_completed', {
      totalAssets: assetPaths.length,
      successful: results.length,
      failed: errors.length
    });
    
    return { results, errors };
  }

  /**
   * Generate version based on strategy
   */
  async _generateVersion(content, strategy, customVersion) {
    if (customVersion) {
      return customVersion;
    }
    
    switch (strategy) {
      case 'content-hash':
        return this._generateContentHash(content, this.options.hashLength);
        
      case 'timestamp':
        return Date.now().toString();
        
      case 'semantic':
        return this._generateSemanticVersion();
        
      case 'incremental':
        return this._generateIncrementalVersion();
        
      default:
        return this._generateContentHash(content, this.options.hashLength);
    }
  }

  /**
   * Generate content hash
   */
  _generateContentHash(content, length = 8) {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, length);
  }

  /**
   * Generate semantic version
   */
  _generateSemanticVersion() {
    // Simplified semantic versioning
    const now = new Date();
    return `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
  }

  /**
   * Generate incremental version
   */
  _generateIncrementalVersion() {
    this.metrics.totalVersions++;
    return this.metrics.totalVersions.toString();
  }

  /**
   * Generate rollback version
   */
  _generateRollbackVersion(targetVersion) {
    const timestamp = Date.now();
    return `rollback_${targetVersion}_${timestamp}`;
  }

  /**
   * Generate manifest version
   */
  _generateManifestVersion() {
    const timestamp = Date.now();
    return `manifest_${timestamp}`;
  }

  /**
   * Get versioned path
   */
  _getVersionedPath(assetPath, version) {
    const ext = path.extname(assetPath);
    const basename = path.basename(assetPath, ext);
    const dirname = path.dirname(assetPath);
    
    return path.join(dirname, `${basename}.${version}${ext}`);
  }

  /**
   * Get latest version of asset
   */
  _getLatestVersion(assetPath) {
    const versions = this.listVersions(assetPath);
    return versions.length > 0 ? versions[0] : null;
  }

  /**
   * Update asset manifest
   */
  _updateAssetManifest(assetPath, version, record) {
    if (!this.assetManifest.has(assetPath)) {
      this.assetManifest.set(assetPath, new Map());
    }
    
    this.assetManifest.get(assetPath).set(version, record);
  }

  /**
   * Build dependency relationships
   */
  _buildDependencyRelationships(assetPath, version, dependencies) {
    for (const dep of dependencies) {
      if (!this.dependencyGraph.has(dep)) {
        this.dependencyGraph.set(dep, new Map());
      }
      
      this.dependencyGraph.get(dep).set(assetPath, version);
    }
  }

  /**
   * Cleanup old versions
   */
  async _cleanupOldVersions(assetPath) {
    const maxVersions = this.options.maxVersions;
    const versions = this.listVersions(assetPath);
    
    if (versions.length > maxVersions) {
      const versionsToDelete = versions.slice(maxVersions);
      
      for (const versionInfo of versionsToDelete) {
        const versionKey = `${assetPath}:${versionInfo.version}`;
        this.versionStore.delete(versionKey);
        
        // Remove from manifest
        if (this.assetManifest.has(assetPath)) {
          this.assetManifest.get(assetPath).delete(versionInfo.version);
        }
      }
    }
  }

  /**
   * Create batches for parallel processing
   */
  _createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Update versioning metrics
   */
  _updateVersioningMetrics(time) {
    this.metrics.totalVersions++;
    this.metrics.averageVersioningTime = 
      (this.metrics.averageVersioningTime * 0.9) + (time * 0.1);
  }

  /**
   * Load manifest from file
   */
  async _loadManifest() {
    try {
      const content = await fs.readFile(this.options.manifestPath, 'utf8');
      const manifest = JSON.parse(content);
      
      for (const [assetPath, entry] of Object.entries(manifest.assets || {})) {
        this.assetManifest.set(assetPath, new Map(Object.entries(entry)));
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Load version history
   */
  async _loadVersionHistory() {
    // In a real implementation, load from persistent storage
    // For now, just initialize empty history
    this.versionHistory = [];
  }

  /**
   * Get versioning statistics
   */
  getStats() {
    const totalAssets = this.assetManifest.size;
    const totalVersions = this.versionStore.size;
    const cacheHitRate = (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
      ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100).toFixed(2) + '%'
      : '0%';
    
    return {
      ...this.metrics,
      totalAssets,
      totalVersions,
      cacheHitRate,
      averageVersioningTime: this.metrics.averageVersioningTime.toFixed(2) + 'ms',
      dependencyRelationships: this.dependencyGraph.size,
      versionHistorySize: this.versionHistory.length
    };
  }

  /**
   * Clear all versions
   */
  async clearVersions() {
    this.versionStore.clear();
    this.assetManifest.clear();
    this.dependencyGraph.clear();
    this.versionHistory = [];
    
    this.emit('versions_cleared');
  }

  /**
   * Export version data
   */
  async exportVersionData(format = 'json') {
    const data = {
      versions: Object.fromEntries(this.versionStore),
      manifest: Object.fromEntries(this.assetManifest),
      dependencies: Object.fromEntries(this.dependencyGraph),
      history: this.versionHistory
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    return data;
  }

  /**
   * Import version data
   */
  async importVersionData(data, format = 'json') {
    let parsedData;
    
    if (format === 'json') {
      parsedData = JSON.parse(data);
    } else {
      parsedData = data;
    }
    
    this.versionStore.clear();
    this.assetManifest.clear();
    this.dependencyGraph.clear();
    
    // Restore data
    for (const [key, value] of Object.entries(parsedData.versions || {})) {
      this.versionStore.set(key, value);
    }
    
    for (const [assetPath, versions] of Object.entries(parsedData.manifest || {})) {
      this.assetManifest.set(assetPath, new Map(Object.entries(versions)));
    }
    
    for (const [dep, assets] of Object.entries(parsedData.dependencies || {})) {
      this.dependencyGraph.set(dep, new Map(Object.entries(assets)));
    }
    
    this.versionHistory = parsedData.history || [];
    
    this.emit('version_data_imported', {
      versions: Object.keys(parsedData.versions || {}).length,
      assets: Object.keys(parsedData.manifest || {}).length,
      dependencies: Object.keys(parsedData.dependencies || {}).length
    });
  }
}

module.exports = { AssetVersioning };