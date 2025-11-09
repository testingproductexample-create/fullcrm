const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

/**
 * Advanced image format converter with support for modern formats and AI-powered optimization
 */
class ImageFormatConverter extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      inputDir: options.inputDir || './public/images',
      outputDir: options.outputDir || './dist/images',
      supportedFormats: options.supportedFormats || [
        'jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff', 'gif', 'bmp', 'svg'
      ],
      qualityPresets: {
        'high': { webp: 90, avif: 85, jpeg: 90, png: 95 },
        'medium': { webp: 80, avif: 70, jpeg: 85, png: 90 },
        'low': { webp: 70, avif: 60, jpeg: 75, png: 85 },
        'ultra': { webp: 95, avif: 90, jpeg: 95, png: 100 }
      },
      enableProgressive: options.enableProgressive !== false,
      enableAdaptiveQuality: options.enableAdaptiveQuality !== false,
      enableContentAnalysis: options.enableContentAnalysis !== false,
      ...options
    };
    
    this.conversionCache = new Map();
    this.formatMetrics = new Map();
    this.contentAnalyzer = new ContentAnalyzer();
    
    this.metrics = {
      totalConversions: 0,
      successfulConversions: 0,
      failedConversions: 0,
      totalSizeOriginal: 0,
      totalSizeConverted: 0,
      formatUsage: {
        webp: 0,
        avif: 0,
        jpeg: 0,
        png: 0
      },
      averageConversionTime: 0,
      averageCompressionRatio: 0
    };
  }

  /**
   * Convert image to target format
   */
  async convertImage(inputPath, targetFormat, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        quality = 'medium',
        outputPath,
        preserveMetadata = true,
        adaptiveQuality = this.options.enableAdaptiveQuality,
        customQuality,
        resizeOptions = {},
        enhanceImage = false
      } = options;
      
      // Check if format is supported
      if (!this.options.supportedFormats.includes(targetFormat.toLowerCase())) {
        throw new Error(`Unsupported target format: ${targetFormat}`);
      }
      
      // Get input image info
      const inputInfo = await this._getImageInfo(inputPath);
      this.metrics.totalConversions++;
      this.metrics.totalSizeOriginal += inputInfo.size;
      
      // Check cache first
      const cacheKey = this._generateCacheKey(inputPath, targetFormat, options);
      if (this.conversionCache.has(cacheKey)) {
        const cached = this.conversionCache.get(cacheKey);
        this.emit('conversion_cached', { inputPath, targetFormat });
        return cached;
      }
      
      // Analyze content for adaptive quality
      let adaptiveConfig = {};
      if (adaptiveQuality && this.options.enableContentAnalysis) {
        adaptiveConfig = await this.contentAnalyzer.analyzeForConversion(inputPath, targetFormat);
      }
      
      // Determine quality settings
      const qualitySettings = customQuality || 
        this._getQualitySettings(quality, targetFormat, adaptiveConfig);
      
      // Build conversion pipeline
      let pipeline = sharp(inputPath);
      
      // Apply enhancements if requested
      if (enhanceImage) {
        pipeline = this._applyImageEnhancements(pipeline, inputInfo);
      }
      
      // Apply resizing
      if (resizeOptions.width || resizeOptions.height) {
        pipeline = pipeline.resize(
          resizeOptions.width,
          resizeOptions.height,
          {
            fit: resizeOptions.fit || 'inside',
            withoutEnlargement: resizeOptions.withoutEnlargement !== false
          }
        );
      }
      
      // Apply format-specific conversion
      const outputBuffer = await this._convertToFormat(pipeline, targetFormat, {
        quality: qualitySettings,
        ...inputInfo
      });
      
      // Generate output path
      const finalOutputPath = outputPath || this._generateOutputPath(inputPath, targetFormat);
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
      
      // Write converted image
      await fs.writeFile(finalOutputPath, outputBuffer);
      
      // Get output info
      const outputInfo = await this._getImageInfo(finalOutputPath);
      this.metrics.totalSizeConverted += outputInfo.size;
      this.metrics.successfulConversions++;
      this.metrics.formatUsage[targetFormat]++;
      
      const conversionTime = Date.now() - startTime;
      this._updateConversionMetrics(conversionTime, inputInfo.size, outputInfo.size);
      
      const result = {
        inputPath,
        outputPath: finalOutputPath,
        inputFormat: inputInfo.format,
        targetFormat,
        inputSize: inputInfo.size,
        outputSize: outputInfo.size,
        compressionRatio: this._calculateCompressionRatio(inputInfo.size, outputInfo.size),
        conversionTime,
        quality: qualitySettings,
        dimensions: {
          width: outputInfo.width,
          height: outputInfo.height
        },
        metadata: outputInfo.metadata,
        cacheKey
      };
      
      // Cache result
      this.conversionCache.set(cacheKey, result);
      
      this.emit('image_converted', {
        inputPath,
        targetFormat,
        inputSize: inputInfo.size,
        outputSize: outputInfo.size,
        compressionRatio: result.compressionRatio,
        conversionTime
      });
      
      return result;
      
    } catch (error) {
      this.metrics.failedConversions++;
      this.emit('conversion_error', {
        inputPath,
        targetFormat,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Batch convert multiple images
   */
  async batchConvert(imagePaths, targetFormat, options = {}) {
    const { 
      parallel = true, 
      maxConcurrent = 5,
      preservePaths = true
    } = options;
    
    const results = [];
    const errors = [];
    
    if (parallel) {
      const batches = this._createBatches(imagePaths, maxConcurrent);
      
      for (const batch of batches) {
        const batchResults = await Promise.allSettled(
          batch.map(imagePath => this.convertImage(imagePath, targetFormat, options))
        );
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            errors.push({
              imagePath: batch[index],
              error: result.reason.message
            });
          }
        });
      }
    } else {
      for (const imagePath of imagePaths) {
        try {
          const result = await this.convertImage(imagePath, targetFormat, options);
          results.push(result);
        } catch (error) {
          errors.push({ imagePath, error: error.message });
        }
      }
    }
    
    this.emit('batch_conversion_completed', {
      totalImages: imagePaths.length,
      successful: results.length,
      failed: errors.length,
      targetFormat
    });
    
    return { results, errors };
  }

  /**
   * Convert with format fallback (WebP -> JPEG if unsupported)
   */
  async convertWithFallback(inputPath, preferredFormats, options = {}) {
    const { fallbackToOriginal = false } = options;
    
    for (const format of preferredFormats) {
      try {
        const result = await this.convertImage(inputPath, format, options);
        return { ...result, actualFormat: format };
      } catch (error) {
        console.warn(`Failed to convert to ${format}, trying next format...`);
        continue;
      }
    }
    
    if (fallbackToOriginal) {
      // Just copy original file with new name
      const inputInfo = await this._getImageInfo(inputPath);
      const outputPath = this._generateOutputPath(inputPath, 'original');
      await fs.copyFile(inputPath, outputPath);
      
      return {
        inputPath,
        outputPath,
        inputFormat: inputInfo.format,
        targetFormat: inputInfo.format,
        inputSize: inputInfo.size,
        outputSize: inputInfo.size,
        conversionTime: 0,
        fallback: true
      };
    }
    
    throw new Error(`Failed to convert ${inputPath} to any of the preferred formats: ${preferredFormats.join(', ')}`);
  }

  /**
   * Convert to multiple formats simultaneously
   */
  async convertToMultipleFormats(inputPath, targetFormats, options = {}) {
    const results = [];
    
    for (const format of targetFormats) {
      try {
        const result = await this.convertImage(inputPath, format, options);
        results.push(result);
      } catch (error) {
        console.warn(`Failed to convert ${inputPath} to ${format}:`, error.message);
      }
    }
    
    return {
      inputPath,
      conversions: results,
      successful: results.length,
      failed: targetFormats.length - results.length
    };
  }

  /**
   * Generate format comparison
   */
  async generateFormatComparison(inputPath, formats = null, options = {}) {
    const testFormats = formats || ['webp', 'avif', 'jpeg', 'png'];
    const { quality = 'medium', resizeOptions = {} } = options;
    
    const results = [];
    
    for (const format of testFormats) {
      try {
        const result = await this.convertImage(inputPath, format, {
          quality,
          resizeOptions,
          outputPath: this._generateComparisonPath(inputPath, format)
        });
        
        results.push({
          format,
          size: result.outputSize,
          compressionRatio: result.compressionRatio,
          conversionTime: result.conversionTime,
          quality: result.quality,
          path: result.outputPath
        });
      } catch (error) {
        results.push({
          format,
          error: error.message,
          success: false
        });
      }
    }
    
    // Sort by size (smallest first)
    results.sort((a, b) => (a.size || Infinity) - (b.size || Infinity));
    
    return {
      inputPath,
      comparison: results,
      recommended: results[0]?.format || 'unknown',
      savings: this._calculateFormatSavings(results)
    };
  }

  /**
   * Convert SVG to optimized format
   */
  async convertSVG(inputPath, targetFormat, options = {}) {
    const { quality = 'medium' } = options;
    
    try {
      // Read SVG content
      const svgContent = await fs.readFile(inputPath, 'utf8');
      
      // Optimize SVG content
      const optimizedSVG = await this._optimizeSVG(svgContent, quality);
      
      // Convert to target format
      let outputBuffer;
      if (targetFormat.toLowerCase() === 'png' || targetFormat.toLowerCase() === 'jpg') {
        // Rasterize SVG to target format
        outputBuffer = await sharp(Buffer.from(optimizedSVG))
          .resize(options.width, options.height)
          .toFormat(targetFormat.toLowerCase(), {
            quality: this._getQualitySettings(quality, targetFormat)
          })
          .toBuffer();
      } else {
        // Keep as optimized SVG
        outputBuffer = Buffer.from(optimizedSVG);
      }
      
      const outputPath = this._generateOutputPath(inputPath, targetFormat);
      await fs.writeFile(outputPath, outputBuffer);
      
      const inputInfo = await this._getImageInfo(inputPath);
      const outputInfo = await this._getImageInfo(outputPath);
      
      return {
        inputPath,
        outputPath,
        inputFormat: 'svg',
        targetFormat,
        inputSize: inputInfo.size,
        outputSize: outputInfo.size,
        compressionRatio: this._calculateCompressionRatio(inputInfo.size, outputInfo.size)
      };
      
    } catch (error) {
      throw new Error(`SVG conversion failed: ${error.message}`);
    }
  }

  /**
   * Get format recommendations based on image characteristics
   */
  getFormatRecommendations(imageInfo) {
    const { format, width, height, hasAlpha, fileSize } = imageInfo;
    const recommendations = [];
    
    // Current format analysis
    const currentFormat = format.toLowerCase();
    
    // Format-specific recommendations
    if (currentFormat === 'jpeg' || currentFormat === 'jpg') {
      // Photographic content
      recommendations.push({
        format: 'webp',
        reason: 'Better compression for photos with similar quality',
        estimatedSavings: '25-35%',
        priority: 'high'
      });
      
      recommendations.push({
        format: 'avif',
        reason: 'Best compression for modern browsers',
        estimatedSavings: '40-50%',
        priority: 'medium'
      });
    } else if (currentFormat === 'png') {
      if (hasAlpha) {
        recommendations.push({
          format: 'webp',
          reason: 'Supports transparency with better compression',
          estimatedSavings: '30-40%',
          priority: 'high'
        });
      } else {
        recommendations.push({
          format: 'webp',
          reason: 'Significant size reduction for graphics',
          estimatedSavings: '40-60%',
          priority: 'high'
        });
      }
    } else if (currentFormat === 'gif') {
      recommendations.push({
        format: 'webp',
        reason: 'Better compression and quality for animations',
        estimatedSavings: '50-70%',
        priority: 'high'
      });
    }
    
    // Size-based recommendations
    if (fileSize > 1024 * 1024) { // > 1MB
      recommendations.unshift({
        format: 'avif',
        reason: 'Large files benefit most from AVIF compression',
        estimatedSavings: '50-70%',
        priority: 'very-high'
      });
    }
    
    return recommendations;
  }

  /**
   * Apply format-specific conversion
   */
  async _convertToFormat(pipeline, targetFormat, options) {
    const { quality, width, height } = options;
    
    switch (targetFormat.toLowerCase()) {
      case 'webp':
        return pipeline.webp({
          quality: quality.webp || 80,
          effort: 4
        }).toBuffer();
        
      case 'avif':
        return pipeline.avif({
          quality: quality.avif || 70,
          effort: 4
        }).toBuffer();
        
      case 'jpeg':
      case 'jpg':
        return pipeline.jpeg({
          quality: quality.jpeg || 85,
          progressive: this.options.enableProgressive,
          mozjpeg: true
        }).toBuffer();
        
      case 'png':
        return pipeline.png({
          quality: quality.png || 90,
          compressionLevel: 9,
          progressive: this.options.enableProgressive
        }).toBuffer();
        
      case 'tiff':
        return pipeline.tiff({
          quality: quality.tiff || 85,
          compression: 'lzw'
        }).toBuffer();
        
      case 'gif':
        return pipeline.gif({
          effort: 7
        }).toBuffer();
        
      default:
        throw new Error(`Unsupported target format: ${targetFormat}`);
    }
  }

  /**
   * Apply image enhancements
   */
  _applyImageEnhancements(pipeline, imageInfo) {
    return pipeline
      .sharpen()
      .normalise()
      .gamma(1.1);
  }

  /**
   * Get quality settings
   */
  _getQualitySettings(preset, format, adaptiveConfig = {}) {
    const baseQuality = this.options.qualityPresets[preset] || this.options.qualityPresets.medium;
    
    // Apply adaptive quality adjustments
    if (adaptiveConfig.qualityMultiplier) {
      for (const key in baseQuality) {
        baseQuality[key] = Math.round(baseQuality[key] * adaptiveConfig.qualityMultiplier);
      }
    }
    
    return baseQuality;
  }

  /**
   * Get image information
   */
  async _getImageInfo(inputPath) {
    const stats = await fs.stat(inputPath);
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    return {
      path: inputPath,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      channels: metadata.channels,
      density: metadata.density,
      hasProfile: metadata.hasProfile,
      hasAlpha: metadata.hasAlpha,
      metadata
    };
  }

  /**
   * Generate cache key
   */
  _generateCacheKey(inputPath, targetFormat, options) {
    const crypto = require('crypto');
    const keyData = {
      input: inputPath,
      format: targetFormat,
      quality: options.quality,
      width: options.resizeOptions?.width,
      height: options.resizeOptions?.height,
      enhance: options.enhanceImage
    };
    
    return crypto.createHash('md5')
      .update(JSON.stringify(keyData))
      .digest('hex')
      .substring(0, 12);
  }

  /**
   * Generate output path
   */
  _generateOutputPath(inputPath, targetFormat) {
    const dir = path.dirname(inputPath).replace(this.options.inputDir, this.options.outputDir);
    const basename = path.basename(inputPath, path.extname(inputPath));
    
    return path.join(dir, `${basename}.${targetFormat}`);
  }

  /**
   * Generate comparison path
   */
  _generateComparisonPath(inputPath, format) {
    const dir = path.dirname(inputPath);
    const basename = path.basename(inputPath, path.extname(inputPath));
    
    return path.join(dir, `${basename}_${format}_comparison.${format}`);
  }

  /**
   * Calculate compression ratio
   */
  _calculateCompressionRatio(originalSize, newSize) {
    if (originalSize === 0) return '0%';
    const ratio = ((originalSize - newSize) / originalSize * 100);
    return ratio.toFixed(1) + '%';
  }

  /**
   * Update conversion metrics
   */
  _updateConversionMetrics(conversionTime, inputSize, outputSize) {
    this.metrics.averageConversionTime = 
      (this.metrics.averageConversionTime * 0.9) + (conversionTime * 0.1);
    
    // Update average compression ratio
    const ratio = this._calculateCompressionRatio(inputSize, outputSize);
    const ratioValue = parseFloat(ratio);
    this.metrics.averageCompressionRatio = 
      (this.metrics.averageCompressionRatio * 0.9) + (ratioValue * 0.1);
  }

  /**
   * Calculate format savings
   */
  _calculateFormatSavings(results) {
    const original = results.find(r => r.error);
    if (!original) return {};
    
    const savings = {};
    for (const result of results) {
      if (result.success && result.size) {
        const saving = ((original.size - result.size) / original.size * 100).toFixed(1);
        savings[result.format] = saving + '%';
      }
    }
    
    return savings;
  }

  /**
   * Optimize SVG content
   */
  async _optimizeSVG(svgContent, quality) {
    // Basic SVG optimization
    return svgContent
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces
      .trim();
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
   * Get format conversion statistics
   */
  getStats() {
    const totalProcessed = this.metrics.successfulConversions + this.metrics.failedConversions;
    const successRate = totalProcessed > 0 
      ? (this.metrics.successfulConversions / totalProcessed * 100).toFixed(2) + '%'
      : '0%';
    
    return {
      ...this.metrics,
      successRate,
      totalSavings: this.metrics.totalSizeOriginal - this.metrics.totalSizeConverted,
      averageCompressionRatio: this.metrics.averageCompressionRatio.toFixed(1) + '%',
      cacheSize: this.conversionCache.size,
      formatDistribution: this._getFormatDistribution()
    };
  }

  /**
   * Get format distribution
   */
  _getFormatDistribution() {
    const total = Object.values(this.metrics.formatUsage).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) return {};
    
    const distribution = {};
    for (const [format, count] of Object.entries(this.metrics.formatUsage)) {
      distribution[format] = {
        count,
        percentage: (count / total * 100).toFixed(1) + '%'
      };
    }
    
    return distribution;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.conversionCache.clear();
    this.formatMetrics.clear();
    this.emit('cache_cleared');
  }
}

/**
 * Content analyzer for adaptive quality
 */
class ContentAnalyzer {
  async analyzeForConversion(inputPath, targetFormat) {
    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      
      // Analyze complexity
      const stats = await image.stats();
      const complexity = this._calculateComplexity(stats);
      
      // Determine content type
      const contentType = this._classifyContentType(metadata, stats);
      
      // Calculate adaptive quality multiplier
      const qualityMultiplier = this._calculateQualityMultiplier(complexity, contentType, targetFormat);
      
      return {
        complexity,
        contentType,
        qualityMultiplier,
        recommendations: this._getFormatRecommendations(contentType, targetFormat)
      };
    } catch (error) {
      return {
        complexity: 0.5,
        contentType: 'unknown',
        qualityMultiplier: 1.0
      };
    }
  }
  
  _calculateComplexity(stats) {
    // Calculate standard deviation of channel values as complexity measure
    const channels = ['r', 'g', 'b'];
    let totalVariance = 0;
    
    for (const channel of channels) {
      if (stats.channels && stats.channels[channels.indexOf(channel)]) {
        const channelStats = stats.channels[channels.indexOf(channel)];
        const variance = Math.pow(channelStats.stdev || 0, 2);
        totalVariance += variance;
      }
    }
    
    return Math.min(1, totalVariance / 10000); // Normalize to 0-1
  }
  
  _classifyContentType(metadata, stats) {
    // Simple content classification
    if (metadata.format === 'png' && !metadata.hasAlpha) {
      return 'graphics';
    } else if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      return 'photographic';
    } else if (metadata.format === 'gif') {
      return 'animation';
    }
    
    return 'mixed';
  }
  
  _calculateQualityMultiplier(complexity, contentType, targetFormat) {
    let multiplier = 1.0;
    
    // Adjust for content complexity
    if (complexity > 0.7) {
      multiplier *= 1.1; // Higher quality for complex content
    } else if (complexity < 0.3) {
      multiplier *= 0.9; // Lower quality for simple content
    }
    
    // Format-specific adjustments
    if (targetFormat === 'avif' && complexity < 0.5) {
      multiplier *= 0.95; // AVIF can handle lower quality for simple content
    }
    
    return Math.max(0.7, Math.min(1.3, multiplier));
  }
  
  _getFormatRecommendations(contentType, targetFormat) {
    // Return format-specific recommendations
    return [];
  }
}

module.exports = { ImageFormatConverter };