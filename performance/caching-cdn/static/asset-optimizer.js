const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * Advanced static asset optimizer with minification, bundling, and optimization
 */
class AssetOptimizer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      inputDir: options.inputDir || './public',
      outputDir: options.outputDir || './dist',
      enableMinification: options.enableMinification !== false,
      enableBundling: options.enableBundling !== false,
      enableTreeShaking: options.enableTreeShaking !== false,
      enableSourceMaps: options.enableSourceMaps !== false,
      enableImageOptimization: options.enableImageOptimization !== false,
      supportedFormats: options.supportedFormats || ['js', 'css', 'html', 'json', 'png', 'jpg', 'svg'],
      minification: {
        js: {
          enable: true,
          options: {
            compress: true,
            mangle: true,
            keep_fnames: false
          }
        },
        css: {
          enable: true,
          options: {
            safe: true,
            keep_fargs: false
          }
        },
        html: {
          enable: true,
          options: {
            removeComments: true,
            removeRedundantAttributes: true,
            removeEmptyAttributes: true
          }
        }
      },
      ...options
    };
    
    this.assetCache = new Map();
    this.bundles = new Map();
    this.dependencies = new Map();
    this.manifest = new Map();
    
    this.metrics = {
      totalAssets: 0,
      optimizedAssets: 0,
      totalSizeOriginal: 0,
      totalSizeOptimized: 0,
      averageCompressionRatio: 0,
      bundleCount: 0,
      cacheHits: 0
    };
    
    this._initializeMinifiers();
  }

  /**
   * Initialize minification engines
   */
  async _initializeMinifiers() {
    try {
      // In a real implementation, you would initialize actual minifiers
      // like Terser for JS, CleanCSS for CSS, etc.
      this.minifiers = {
        js: new JSMinifier(this.options.minification.js),
        css: new CSSMinifier(this.options.minification.css),
        html: new HTMLMinifier(this.options.minification.html),
        json: new JSONMinifier()
      };
    } catch (error) {
      console.warn('Some minifiers failed to initialize:', error);
      this.minifiers = {};
    }
  }

  /**
   * Optimize single asset
   */
  async optimizeAsset(filePath, options = {}) {
    const startTime = Date.now();
    
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf8');
      const fileExt = path.extname(filePath).toLowerCase().slice(1);
      
      // Check if file type is supported
      if (!this.options.supportedFormats.includes(fileExt)) {
        return { skipped: true, reason: 'Unsupported format' };
      }
      
      this.metrics.totalAssets++;
      this.metrics.totalSizeOriginal += stats.size;
      
      // Check cache first
      const contentHash = crypto.createHash('md5').update(content).digest('hex');
      const cacheKey = `${filePath}:${contentHash}`;
      
      if (this.assetCache.has(cacheKey) && !options.force) {
        const cached = this.assetCache.get(cacheKey);
        this.metrics.cacheHits++;
        return cached;
      }
      
      // Apply optimizations
      let optimizedContent = content;
      const optimizations = [];
      
      // Minification
      if (this.options.enableMinification && this.minifiers[fileExt]) {
        const minificationResult = await this.minifiers[fileExt].minify(content, options);
        if (minificationResult.optimized) {
          optimizedContent = minificationResult.content;
          optimizations.push({
            type: 'minification',
            originalSize: minificationResult.originalSize,
            optimizedSize: minificationResult.optimizedSize,
            savings: minificationResult.savings
          });
        }
      }
      
      // Tree shaking (for JavaScript)
      if (this.options.enableTreeShaking && fileExt === 'js') {
        const treeShakingResult = await this._applyTreeShaking(optimizedContent, options);
        if (treeShakingResult.optimized) {
          optimizedContent = treeShakingResult.content;
          optimizations.push({
            type: 'tree_shaking',
            removedExports: treeShakingResult.removedExports
          });
        }
      }
      
      // Asset bundling
      if (this.options.enableBundling) {
        const bundleResult = await this._processBundle(filePath, optimizedContent, options);
        if (bundleResult.bundled) {
          optimizedContent = bundleResult.content;
          optimizations.push({
            type: 'bundling',
            bundleName: bundleResult.bundleName
          });
        }
      }
      
      const optimizationTime = Date.now() - startTime;
      const optimizedSize = Buffer.byteLength(optimizedContent, 'utf8');
      const compressionRatio = stats.size > 0 
        ? ((stats.size - optimizedSize) / stats.size * 100).toFixed(2)
        : 0;
      
      // Update metrics
      this.metrics.optimizedAssets++;
      this.metrics.totalSizeOptimized += optimizedSize;
      this.metrics.averageCompressionRatio = 
        (this.metrics.averageCompressionRatio * 0.9) + (parseFloat(compressionRatio) * 0.1);
      
      const result = {
        filePath,
        originalContent: content,
        optimizedContent,
        optimizations,
        metadata: {
          originalSize: stats.size,
          optimizedSize,
          compressionRatio: compressionRatio + '%',
          optimizationTime,
          fileType: fileExt
        }
      };
      
      // Cache result
      this.assetCache.set(cacheKey, result);
      
      this.emit('asset_optimized', {
        filePath,
        optimizations,
        originalSize: stats.size,
        optimizedSize,
        compressionRatio
      });
      
      return result;
      
    } catch (error) {
      this.emit('optimization_error', {
        filePath,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Optimize multiple assets
   */
  async optimizeAssets(pattern, options = {}) {
    const filePattern = path.join(this.options.inputDir, pattern);
    const files = await this._findFiles(filePattern);
    
    const results = [];
    const errors = [];
    
    for (const file of files) {
      try {
        const result = await this.optimizeAsset(file, options);
        results.push(result);
      } catch (error) {
        errors.push({ file, error: error.message });
      }
    }
    
    this.emit('assets_optimized', {
      pattern,
      totalFiles: files.length,
      successful: results.length,
      failed: errors.length
    });
    
    return { results, errors };
  }

  /**
   * Bundle multiple assets
   */
  async bundleAssets(assetList, bundleName, options = {}) {
    const startTime = Date.now();
    
    try {
      const bundles = new Map();
      
      // Group assets by type
      for (const asset of assetList) {
        const fileExt = path.extname(asset.filePath).toLowerCase().slice(1);
        if (!bundles.has(fileExt)) {
          bundles.set(fileExt, []);
        }
        bundles.get(fileExt).push(asset);
      }
      
      const createdBundles = [];
      
      for (const [fileType, assets] of bundles) {
        const bundleResult = await this._createBundle(assets, `${bundleName}.${fileType}`, options);
        if (bundleResult.success) {
          createdBundles.push(bundleResult);
          this.bundles.set(bundleResult.name, bundleResult);
        }
      }
      
      const bundleTime = Date.now() - startTime;
      this.metrics.bundleCount += createdBundles.length;
      
      this.emit('assets_bundled', {
        bundleName,
        bundleCount: createdBundles.length,
        bundleTime
      });
      
      return {
        bundleName,
        bundles: createdBundles,
        totalTime: bundleTime
      };
      
    } catch (error) {
      this.emit('bundling_error', { bundleName, error: error.message });
      throw error;
    }
  }

  /**
   * Generate asset manifest
   */
  async generateManifest(options = {}) {
    const manifest = new Map();
    const { includeHashes = true, includePaths = true, includeSizes = true } = options;
    
    for (const [cacheKey, result] of this.assetCache) {
      const entry = {
        fileName: path.basename(result.filePath),
        fileType: result.metadata.fileType,
        optimizations: result.optimizations.map(opt => opt.type)
      };
      
      if (includeHashes) {
        const contentHash = crypto.createHash('md5')
          .update(result.optimizedContent)
          .digest('hex')
          .substring(0, 8);
        entry.hash = contentHash;
      }
      
      if (includePaths) {
        entry.path = path.relative(this.options.inputDir, result.filePath);
        entry.outputPath = path.relative(this.options.outputDir, 
          result.filePath.replace(this.options.inputDir, this.options.outputDir)
        );
      }
      
      if (includeSizes) {
        entry.originalSize = result.metadata.originalSize;
        entry.optimizedSize = result.metadata.optimizedSize;
        entry.compressionRatio = result.metadata.compressionRatio;
      }
      
      manifest.set(entry.fileName, entry);
    }
    
    this.manifest = manifest;
    
    // Write manifest file
    const manifestPath = path.join(this.options.outputDir, 'asset-manifest.json');
    const manifestContent = JSON.stringify(Object.fromEntries(manifest), null, 2);
    await fs.writeFile(manifestPath, manifestContent);
    
    this.emit('manifest_generated', {
      manifestPath,
      entryCount: manifest.size
    });
    
    return {
      manifest: Object.fromEntries(manifest),
      manifestPath
    };
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    const totalSavings = this.metrics.totalSizeOriginal - this.metrics.totalSizeOptimized;
    const overallCompressionRatio = this.metrics.totalSizeOriginal > 0
      ? (totalSavings / this.metrics.totalSizeOriginal * 100).toFixed(2) + '%'
      : '0%';
    
    return {
      ...this.metrics,
      totalSavings,
      overallCompressionRatio,
      averageCompressionRatio: this.metrics.averageCompressionRatio.toFixed(2) + '%',
      bundleList: Array.from(this.bundles.keys()),
      cachedAssets: this.assetCache.size,
      manifestEntries: this.manifest.size
    };
  }

  /**
   * Apply tree shaking to JavaScript
   */
  async _applyTreeShaking(content, options) {
    // Simplified tree shaking implementation
    // In production, use Rollup, Webpack, or similar
    const importPattern = /import\s+.*?from\s+['"](.+?)['"]/g;
    const exportPattern = /export\s+(?:default\s+)?(?:const|function|class|var|let)\s+(\w+)/g;
    
    const usedExports = new Set();
    const unusedExports = new Set();
    
    // Find all exports
    const exports = [];
    let exportMatch;
    while ((exportMatch = exportPattern.exec(content)) !== null) {
      exports.push(exportMatch[1]);
    }
    
    // Find all imports and track usage
    const imports = [];
    let importMatch;
    while ((importMatch = importPattern.exec(content)) !== null) {
      imports.push(importMatch[1]);
    }
    
    // Simplified unused export detection
    for (const exportName of exports) {
      const usagePattern = new RegExp(`\\b${exportName}\\b`, 'g');
      const usageCount = (content.match(usagePattern) || []).length;
      
      // If export is only declared but not used significantly, mark as unused
      if (usageCount <= 1) { // Only in the export declaration
        unusedExports.add(exportName);
      } else {
        usedExports.add(exportName);
      }
    }
    
    let optimizedContent = content;
    let removedExports = 0;
    
    // Remove unused exports (simplified)
    for (const unusedExport of unusedExports) {
      const exportPattern = new RegExp(`export\\s+(?:default\\s+)?(?:const|function|class|var|let)\\s+${unusedExport}[^;]*;?`, 'g');
      optimizedContent = optimizedContent.replace(exportPattern, '');
      removedExports++;
    }
    
    return {
      optimized: removedExports > 0,
      content: optimizedContent,
      removedExports,
      usedExports: Array.from(usedExports),
      unusedExports: Array.from(unusedExports)
    };
  }

  /**
   * Process asset for bundling
   */
  async _processBundle(filePath, content, options) {
    // This is a simplified implementation
    // In production, you'd implement proper module bundling
    
    if (path.extname(filePath).toLowerCase() === '.js') {
      // Add module wrapper for bundling
      const moduleWrapper = this._createModuleWrapper(content, filePath);
      return {
        bundled: true,
        content: moduleWrapper,
        bundleName: path.basename(filePath)
      };
    }
    
    return { bundled: false };
  }

  /**
   * Create module wrapper
   */
  _createModuleWrapper(content, filePath) {
    const moduleName = path.basename(filePath, '.js');
    return `
      // Module: ${moduleName}
      (function() {
        'use strict';
        ${content}
      })();
    `;
  }

  /**
   * Create asset bundle
   */
  async _createBundle(assets, bundleName, options) {
    const startTime = Date.now();
    let bundleContent = '';
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    
    for (const asset of assets) {
      totalOriginalSize += asset.metadata.originalSize;
      totalOptimizedSize += asset.metadata.optimizedSize;
      
      // Add banner with file info
      bundleContent += `\n/* === ${path.basename(asset.filePath)} === */\n`;
      bundleContent += asset.optimizedContent;
    }
    
    const bundleSize = Buffer.byteLength(bundleContent, 'utf8');
    const compressionRatio = totalOriginalSize > 0
      ? ((totalOriginalSize - bundleSize) / totalOriginalSize * 100).toFixed(2)
      : 0;
    
    return {
      name: bundleName,
      content: bundleContent,
      success: true,
      originalSize: totalOriginalSize,
      bundleSize,
      compressionRatio: compressionRatio + '%',
      assetsCount: assets.length,
      creationTime: Date.now() - startTime
    };
  }

  /**
   * Find files matching pattern
   */
  async _findFiles(pattern) {
    const files = [];
    const searchPattern = pattern.split('*')[0];
    const dir = path.dirname(searchPattern);
    const filesList = await fs.readdir(dir);
    
    for (const file of filesList) {
      if (path.join(dir, file).match(new RegExp(pattern.replace(/\*/g, '.*')))) {
        files.push(path.join(dir, file));
      }
    }
    
    return files;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.assetCache.clear();
    this.bundles.clear();
    this.dependencies.clear();
    this.metrics.cacheHits = 0;
    
    this.emit('cache_cleared');
  }

  /**
   * Get manifest
   */
  getManifest() {
    return Object.fromEntries(this.manifest);
  }
}

/**
 * JavaScript minifier
 */
class JSMinifier {
  constructor(options) {
    this.options = options || {};
  }

  async minify(content, options) {
    if (!this.options.enable) {
      return { optimized: false };
    }
    
    // Simplified minification - in production use Terser
    const originalSize = Buffer.byteLength(content, 'utf8');
    
    // Remove comments (simplified)
    let minified = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Block comments
      .replace(/\/\/.*$/gm, '') // Line comments
      .replace(/\s+/g, ' ') // Multiple spaces
      .trim();
    
    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    
    if (minifiedSize < originalSize) {
      return {
        optimized: true,
        content: minified,
        originalSize,
        optimizedSize: minifiedSize,
        savings: ((originalSize - minifiedSize) / originalSize * 100).toFixed(2) + '%'
      };
    }
    
    return { optimized: false };
  }
}

/**
 * CSS minifier
 */
class CSSMinifier {
  constructor(options) {
    this.options = options || {};
  }

  async minify(content, options) {
    if (!this.options.enable) {
      return { optimized: false };
    }
    
    const originalSize = Buffer.byteLength(content, 'utf8');
    
    // Simplified CSS minification
    let minified = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Multiple spaces
      .replace(/;\s*}/g, '}') // Remove last semicolon in rules
      .replace(/{\s*/g, '{') // Space after opening brace
      .replace(/\s*{\s*/g, '{') // Space around opening brace
      .replace(/;?\s*}/g, '}') // Space before closing brace
      .trim();
    
    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    
    if (minifiedSize < originalSize) {
      return {
        optimized: true,
        content: minified,
        originalSize,
        optimizedSize: minifiedSize,
        savings: ((originalSize - minifiedSize) / originalSize * 100).toFixed(2) + '%'
      };
    }
    
    return { optimized: false };
  }
}

/**
 * HTML minifier
 */
class HTMLMinifier {
  constructor(options) {
    this.options = options || {};
  }

  async minify(content, options) {
    const originalSize = Buffer.byteLength(content, 'utf8');
    
    // Simplified HTML minification
    let minified = content
      .replace(/>\s+</g, '><') // Remove spaces between tags
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .trim();
    
    if (this.options.removeComments) {
      minified = minified.replace(/<!--[\s\S]*?-->/g, '');
    }
    
    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    
    if (minifiedSize < originalSize) {
      return {
        optimized: true,
        content: minified,
        originalSize,
        optimizedSize: minifiedSize,
        savings: ((originalSize - minifiedSize) / originalSize * 100).toFixed(2) + '%'
      };
    }
    
    return { optimized: false };
  }
}

/**
 * JSON minifier
 */
class JSONMinifier {
  async minify(content, options) {
    try {
      const parsed = JSON.parse(content);
      const originalSize = Buffer.byteLength(content, 'utf8');
      const minified = JSON.stringify(parsed);
      const minifiedSize = Buffer.byteLength(minified, 'utf8');
      
      if (minifiedSize < originalSize) {
        return {
          optimized: true,
          content: minified,
          originalSize,
          optimizedSize: minifiedSize,
          savings: ((originalSize - minifiedSize) / originalSize * 100).toFixed(2) + '%'
        };
      }
    } catch (error) {
      // Invalid JSON, don't optimize
    }
    
    return { optimized: false };
  }
}

module.exports = { AssetOptimizer };