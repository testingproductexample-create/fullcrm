/**
 * Advanced cache validation and integrity checking
 */
class CacheValidator {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
    this.validationRules = new Map();
    this.integrityChecks = new Map();
    this.corruptionCount = 0;
    this.validationMetrics = {
      totalChecks: 0,
      passed: 0,
      failed: 0,
      lastValidation: null,
      corruptionRate: 0
    };
    
    this._initializeValidationRules();
  }

  /**
   * Initialize built-in validation rules
   */
  _initializeValidationRules() {
    // JSON validation
    this.addValidationRule('json', (key, value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
          return { valid: true };
        } catch (error) {
          return { valid: false, error: 'Invalid JSON format' };
        }
      }
      return { valid: true };
    });

    // Data type validation
    this.addValidationRule('type', (key, value, expectedType) => {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      return {
        valid: actualType === expectedType,
        expected: expectedType,
        actual: actualType
      };
    });

    // Schema validation
    this.addValidationRule('schema', (key, value, schema) => {
      return this._validateSchema(value, schema);
    });

    // Size validation
    this.addValidationRule('size', (key, value, maxSize) => {
      const size = JSON.stringify(value).length;
      return {
        valid: size <= maxSize,
        size,
        maxSize
      };
    });

    // Expiration validation
    this.addValidationRule('expiration', async (key, value) => {
      const ttl = await this.cacheManager.ttl(key);
      return {
        valid: ttl > 0,
        ttl
      };
    });

    // Checksum validation
    this.addValidationRule('checksum', (key, value, expectedChecksum) => {
      const actualChecksum = this._calculateChecksum(value);
      return {
        valid: actualChecksum === expectedChecksum,
        expected: expectedChecksum,
        actual: actualChecksum
      };
    });

    // Custom business logic validation
    this.addValidationRule('business', (key, value, validator) => {
      try {
        const result = validator(value, key);
        return { valid: result, ...(typeof result === 'object' ? result : {}) };
      } catch (error) {
        return { valid: false, error: error.message };
      }
    });
  }

  /**
   * Add custom validation rule
   */
  addValidationRule(name, validator) {
    this.validationRules.set(name, validator);
  }

  /**
   * Validate a cache entry
   */
  async validate(key, rules = []) {
    this.validationMetrics.totalChecks++;
    
    const value = await this.cacheManager.get(key);
    const results = {
      key,
      valid: true,
      checks: [],
      errors: []
    };

    // Check if key exists
    if (value === null) {
      results.valid = false;
      results.errors.push('Key not found in cache');
      this.validationMetrics.failed++;
      return results;
    }

    // Apply each validation rule
    for (const rule of rules) {
      const ruleResult = await this._applyRule(rule, key, value);
      results.checks.push(ruleResult);
      
      if (!ruleResult.valid) {
        results.valid = false;
        results.errors.push(`${rule.name}: ${ruleResult.error || 'Validation failed'}`);
      }
    }

    if (results.valid) {
      this.validationMetrics.passed++;
    } else {
      this.validationMetrics.failed++;
    }

    return results;
  }

  /**
   * Validate multiple keys
   */
  async validateBulk(keys, rules = []) {
    const results = await Promise.all(
      keys.map(key => this.validate(key, rules))
    );

    return {
      total: keys.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      results
    };
  }

  /**
   * Validate cache integrity across all levels
   */
  async validateIntegrity(options = {}) {
    const {
      sampleSize = 100,
      checkLevels = ['L1', 'L2', 'L3'],
      verbose = false
    } = options;

    const integrityResults = {
      overall: 'unknown',
      levels: {},
      issues: [],
      timestamp: new Date().toISOString()
    };

    for (const level of checkLevels) {
      if (verbose) console.log(`Validating ${level} cache integrity...`);
      
      const levelResult = await this._validateLevelIntegrity(level, sampleSize);
      integrityResults.levels[level] = levelResult;
      
      if (levelResult.health !== 'healthy') {
        integrityResults.issues.push(...levelResult.issues);
      }
    }

    // Calculate overall health
    const healthyLevels = Object.values(integrityResults.levels)
      .filter(level => level.health === 'healthy').length;
    
    if (healthyLevels === checkLevels.length) {
      integrityResults.overall = 'healthy';
    } else if (healthyLevels > 0) {
      integrityResults.overall = 'degraded';
    } else {
      integrityResults.overall = 'unhealthy';
    }

    return integrityResults;
  }

  /**
   * Repair corrupted cache entries
   */
  async repairCache(options = {}) {
    const {
      autoRepair = true,
      backupCorrupted = true,
      rules = ['json', 'type']
    } = options;

    const repairResults = {
      scanned: 0,
      repaired: 0,
      removed: 0,
      errors: []
    };

    // Get all cache keys (this would need to be implemented based on your cache manager)
    const allKeys = await this._getAllCacheKeys();
    
    for (const key of allKeys) {
      repairResults.scanned++;
      
      const validation = await this.validate(key, rules);
      
      if (!validation.valid) {
        try {
          if (backupCorrupted) {
            await this._backupCorruptedEntry(key);
          }
          
          if (autoRepair) {
            const repaired = await this._repairEntry(key, validation);
            if (repaired) {
              repairResults.repaired++;
            } else {
              // Remove if repair failed
              await this.cacheManager.delete(key);
              repairResults.removed++;
            }
          }
        } catch (error) {
          repairResults.errors.push(`Failed to repair ${key}: ${error.message}`);
        }
      }
    }

    return repairResults;
  }

  /**
   * Schedule periodic validation
   */
  scheduleValidation(interval = 3600000, rules = []) {
    setInterval(async () => {
      try {
        const results = await this.validateIntegrity({
          sampleSize: 50,
          checkLevels: ['L1', 'L2'],
          verbose: false
        });
        
        this.cacheManager.emit('validation_report', results);
        
        if (results.overall !== 'healthy') {
          this.cacheManager.emit('cache_health_alert', results);
        }
      } catch (error) {
        console.error('Scheduled validation failed:', error);
      }
    }, interval);
  }

  /**
   * Get validation statistics
   */
  getValidationStats() {
    const total = this.validationMetrics.totalChecks;
    const passed = this.validationMetrics.passed;
    const failed = this.validationMetrics.failed;
    
    this.validationMetrics.corruptionRate = total > 0 
      ? ((failed / total) * 100).toFixed(2) + '%'
      : '0%';

    return {
      ...this.validationMetrics,
      integrityChecks: this.integrityChecks.size,
      validationRules: this.validationRules.size
    };
  }

  /**
   * Apply validation rule
   */
  async _applyRule(rule, key, value) {
    try {
      const ruleFunc = this.validationRules.get(rule.name);
      if (!ruleFunc) {
        return { valid: false, error: `Unknown rule: ${rule.name}` };
      }

      const result = await ruleFunc(key, value, ...(rule.params || []));
      return {
        rule: rule.name,
        valid: result.valid !== false,
        ...result
      };
    } catch (error) {
      return {
        rule: rule.name,
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Validate level integrity
   */
  async _validateLevelIntegrity(level, sampleSize) {
    const result = {
      health: 'healthy',
      issues: [],
      statistics: {}
    };

    try {
      // Get sample of keys from this level
      const keys = await this._getSampleKeys(level, sampleSize);
      let validCount = 0;

      for (const key of keys) {
        const validation = await this.validate(key);
        if (validation.valid) {
          validCount++;
        } else {
          result.issues.push(`Invalid entry in ${level}: ${key}`);
        }
      }

      const healthScore = (validCount / keys.length) * 100;
      result.statistics = {
        totalChecked: keys.length,
        validEntries: validCount,
        healthScore: healthScore.toFixed(2) + '%'
      };

      if (healthScore < 95) {
        result.health = 'degraded';
      } else if (healthScore < 80) {
        result.health = 'unhealthy';
      }

    } catch (error) {
      result.health = 'unhealthy';
      result.issues.push(`Failed to validate ${level}: ${error.message}`);
    }

    return result;
  }

  /**
   * Get sample keys from cache level
   */
  async _getSampleKeys(level, sampleSize) {
    // This is a simplified implementation
    // In production, you would implement level-specific key retrieval
    return Array.from({ length: sampleSize }, (_, i) => `sample_key_${i}`);
  }

  /**
   * Get all cache keys
   */
  async _getAllCacheKeys() {
    // This would need to be implemented based on your cache manager
    // For Redis, you might use KEYS * or SCAN commands
    return [];
  }

  /**
   * Backup corrupted entry
   */
  async _backupCorruptedEntry(key) {
    const value = await this.cacheManager.get(key);
    const backupKey = `backup:${key}:${Date.now()}`;
    
    // Store backup with longer TTL
    await this.cacheManager.set(backupKey, value, { 
      ttl: 86400 * 7, // 7 days
      namespace: 'backups'
    });
  }

  /**
   * Repair corrupted entry
   */
  async _repairEntry(key, validation) {
    // This is a simplified repair implementation
    // In production, you would implement intelligent repair logic
    
    // Try to reload from data source if available
    try {
      if (this.cacheManager.dataLoader) {
        const freshValue = await this.cacheManager.dataLoader(key);
        if (freshValue) {
          await this.cacheManager.set(key, freshValue);
          return true;
        }
      }
    } catch (error) {
      console.error(`Failed to reload data for ${key}:`, error);
    }
    
    return false;
  }

  /**
   * Validate schema
   */
  _validateSchema(value, schema) {
    try {
      if (typeof value === 'object' && schema && typeof schema === 'object') {
        for (const [field, rules] of Object.entries(schema)) {
          if (!(field in value)) {
            return { valid: false, error: `Missing required field: ${field}` };
          }
          
          const fieldValue = value[field];
          const fieldType = Array.isArray(fieldValue) ? 'array' : typeof fieldValue;
          
          if (rules.type && fieldType !== rules.type) {
            return { 
              valid: false, 
              error: `Field ${field} has wrong type: expected ${rules.type}, got ${fieldType}` 
            };
          }
        }
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Schema validation error: ${error.message}` };
    }
  }

  /**
   * Calculate checksum for value
   */
  _calculateChecksum(value) {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Add integrity check
   */
  addIntegrityCheck(name, check) {
    this.integrityChecks.set(name, check);
  }

  /**
   * Run integrity check
   */
  async runIntegrityCheck(name) {
    const check = this.integrityChecks.get(name);
    if (!check) {
      throw new Error(`Integrity check ${name} not found`);
    }
    
    return await check();
  }
}

module.exports = { CacheValidator };