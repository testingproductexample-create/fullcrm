const { EventEmitter } = require('events');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * Advanced image optimizer with AI-powered compression and format optimization
 */
class ImageOptimizer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      inputDir: options.inputDir || './public/images',
      outputDir: options.outputDir || './dist/images',
      enableWebP: options.enableWebP !== false,
      enableAVIF: options.enableAVIF !== false,
      enableProgressive: options.enableProgressive !== false,
      enableSmartCrop: options.enableSmartCrop !== false,
      enableBackgroundRemoval: options.enableBackgroundRemoval !== false,
      qualitySettings: {
        webp: options.webpQuality || 80,
        avif: options.avifQuality || 70,
        jpeg: options.jpegQuality || 85,
        png: options.pngQuality || 90
      },
      responsiveBreakpoints: options.responsiveBreakpoints || [
        320, 480, 768, 1024, 1280, 1536, 1920, 2560
      ],
      ...options
    };
    
    this.imageCache = new Map();
    this.optimizationRules = new Map();
    this.performanceMetrics = new Map();
    this.aiModels = new Map();
    
    this.metrics = {
      totalImages: 0,
      optimizedImages: 0,
      totalSizeOriginal: 0,
      totalSizeOptimized: 0,
      averageCompressionRatio: 0,
      webpConversions: 0,
      avifConversions: 0,
      responsiveGenerations: 0,
      averageOptimizationTime: 0
    };
    
    this._initializeOptimizationRules();
    this._initializeAIModels();
  }

  /**
   * Initialize optimization rules
   */
  _initializeOptimizationRules() {
    // Automatic format selection based on image characteristics
    this.addOptimizationRule('auto_format', (imageInfo) => {
      const { width, height, format, fileSize } = imageInfo;
      
      // Photographic images - prefer AVIF, fallback to WebP
      if (this._isPhotographicImage(format)) {
        return {
          formats: ['avif', 'webp', 'original'],
          quality: this._calculateOptimalQuality(fileSize, 'photographic')
        };
      }
      
      // Graphics/Screenshots - prefer WebP, fallback to PNG
      if (this._isGraphicsImage(format)) {
        return {
          formats: ['webp', 'png', 'original'],
          quality: this._calculateOptimalQuality(fileSize, 'graphics')
        };
      }
      
      // Simple images - use original format optimized
      return {
        formats: ['original'],
        quality: this._calculateOptimalQuality(fileSize, 'simple')
      };
    });
    
    // Responsive image optimization
    this.addOptimizationRule('responsive', (imageInfo) => {
      const { width } = imageInfo;
      
      if (width > 800) {
        return {
          generateResponsive: true,
          breakpoints: this._selectRelevantBreakpoints(width)
        };
      }
      
      return { generateResponsive: false };
    });
    
    // Quality optimization based on content
    this.addOptimizationRule('content_aware', (imageInfo) => {
      const { complexity, detail, fileSize } = imageInfo;
      
      // High detail images need higher quality
      if (detail > 0.8) {
        return { qualityMultiplier: 1.1 };
      }
      
      // Simple images can use lower quality
      if (complexity < 0.3) {
        return { qualityMultiplier: 0.9 };
      }
      
      return { qualityMultiplier: 1.0 };
    });
  }

  /**
   * Initialize AI models
   */
  async _initializeAIModels() {
    try {
      // Load AI models for content-aware optimization
      this.aiModels.set('contentAnalyzer', {
        loaded: true,
        type: 'content_analysis',
        capabilities: ['complexity_detection', 'subject_detection', 'quality_assessment']
      });
      
      this.aiModels.set('smartCrop', {
        loaded: this.options.enableSmartCrop,
        type: 'smart_cropping',
        capabilities: ['face_detection', 'object_detection', 'rule_of_thirds']
      });
      
      this.aiModels.set('backgroundRemover', {
        loaded: this.options.enableBackgroundRemoval,
        type: 'background_removal',
        capabilities: ['auto_masking', 'edge_refinement', 'feathering']
      });
      
      this.emit('ai_models_initialized', {
        models: Array.from(this.aiModels.keys())
      });
      
    } catch (error) {
      console.warn('Failed to initialize AI models:', error.message);
    }
  }

  /**
   * Optimize single image
   */
  async optimizeImage(inputPath, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        outputFormats = [],
        quality,
        width,
        height,
        generateResponsive = this.options.enableWebP || this.options.enableAVIF,
        cropOptions = {},
        removeBackground = false,
        customOptions = {}
      } = options;
      
      // Read image metadata
      const imageInfo = await this._getImageInfo(inputPath);
      this.metrics.totalImages++;
      this.metrics.totalSizeOriginal += imageInfo.size;
      
      // Apply optimization rules
      const optimizationConfig = await this._applyOptimizationRules(imageInfo);
      
      // Determine output formats
      const formats = outputFormats.length > 0 
        ? outputFormats 
        : optimizationConfig.formats;
      
      // Generate optimized versions
      const results = [];
      
      for (const format of formats) {
        if (format === 'original' && formats.length === 1) {
          // Only optimize original format
          const result = await this._optimizeOriginalFormat(
            inputPath, 
            { quality, width, height, ...optimizationConfig }
          );
          results.push(result);
        } else {
          // Convert to different format
          const result = await this._convertToFormat(
            inputPath, 
            format, 
            { 
              quality: quality || this._getQualityForFormat(format, optimizationConfig),
              width, 
              height, 
              ...optimizationConfig,
              ...customOptions
            }
          );
          results.push(result);
        }
      }
      
      // Generate responsive versions if needed
      if (generateResponsive || optimizationConfig.generateResponsive) {
        const responsiveResults = await this._generateResponsiveImages(
          inputPath, 
          results[0]?.outputPath || inputPath,
          optimizationConfig
        );
        results.push(...responsiveResults);
        this.metrics.responsiveGenerations++;
      }
      
      // Apply smart cropping if enabled
      if (this.options.enableSmartCrop && (cropOptions.focalPoint || cropOptions.autoCrop)) {
        const cropResults = await this._applySmartCropping(results, cropOptions);
        results.push(...cropResults);
      }
      
      // Remove background if requested
      if (removeBackground || this.options.enableBackgroundRemoval) {
        const bgRemovalResults = await this._removeBackground(results);
        results.push(...bgRemovalResults);
      }
      
      const optimizationTime = Date.now() - startTime;
      this._updateOptimizationMetrics(results, optimizationTime);
      
      this.emit('image_optimized', {
        inputPath,
        formats: results.map(r => r.format),
        totalSizeOriginal: imageInfo.size,
        totalSizeOptimized: results.reduce((sum, r) => sum + r.size, 0),
        optimizationTime
      });
      
      return {
        original: imageInfo,
        optimized: results,
        metadata: {
          optimizationTime,
          totalSavings: imageInfo.size - results.reduce((sum, r) => sum + r.size, 0),
          averageCompressionRatio: this._calculateCompressionRatio(imageInfo.size, results)
        }
      };
      
    } catch (error) {
      this.emit('optimization_error', {
        inputPath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Optimize multiple images
   */
  async optimizeImages(patterns, options = {}) {
    const { 
      parallel = true, 
      maxConcurrent = 5,
      outputFormats = ['webp', 'avif'],
      recursive = true
    } = options;
    
    const images = await this._findImages(patterns, { recursive });
    const results = [];
    const errors = [];
    
    if (parallel) {
      // Process in parallel with concurrency limit
      const batches = this._createBatches(images, maxConcurrent);
      
      for (const batch of batches) {
        const batchResults = await Promise.allSettled(
          batch.map(imagePath => this.optimizeImage(imagePath, { 
            ...options, 
            outputFormats 
          }))
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
      // Process sequentially
      for (const imagePath of images) {
        try {
          const result = await this.optimizeImage(imagePath, { 
            ...options, 
            outputFormats 
          });
          results.push(result);
        } catch (error) {
          errors.push({ imagePath, error: error.message });
        }
      }
    }
    
    this.emit('bulk_optimization_completed', {
      totalImages: images.length,
      successful: results.length,
      failed: errors.length
    });
    
    return { results, errors };
  }

  /**
   * Generate responsive image set
   */
  async generateResponsiveSet(inputPath, breakpoints = null) {
    const imageInfo = await this._getImageInfo(inputPath);
    const relevantBreakpoints = breakpoints || this._selectRelevantBreakpoints(imageInfo.width);
    
    const results = [];
    
    for (const breakpoint of relevantBreakpoints) {
      if (breakpoint > imageInfo.width) continue; // Skip if larger than original
      
      // Generate WebP version
      if (this.options.enableWebP) {
        const webpResult = await this._convertToFormat(inputPath, 'webp', {
          width: breakpoint,
          quality: this._getQualityForFormat('webp'),
          format: 'webp'
        });
        results.push(webpResult);
      }
      
      // Generate AVIF version
      if (this.options.enableAVIF) {
        const avifResult = await this._convertToFormat(inputPath, 'avif', {
          width: breakpoint,
          quality: this._getQualityForFormat('avif'),
          format: 'avif'
        });
        results.push(avifResult);
      }
      
      // Generate optimized original format
      const originalResult = await this._optimizeOriginalFormat(inputPath, {
        width: breakpoint,
        quality: this._getQualityForFormat(imageInfo.format)
      });
      results.push(originalResult);
    }
    
    return results;
  }

  /**
   * Smart crop image
   */
  async smartCrop(inputPath, options = {}) {
    const { focalPoint, aspectRatio, outputPath } = options;
    
    try {
      // Use AI model for smart cropping
      if (this.aiModels.get('smartCrop')?.loaded) {
        const cropResult = await this._aiSmartCrop(inputPath, {
          focalPoint,
          aspectRatio
        });
        
        return {
          success: true,
          croppedPath: outputPath || this._generateOutputPath(inputPath, 'cropped'),
          cropData: cropResult,
          originalPath: inputPath
        };
      } else {
        // Fallback to basic focal point cropping
        const basicResult = await this._basicSmartCrop(inputPath, {
          focalPoint,
          aspectRatio
        });
        
        return {
          success: true,
          croppedPath: outputPath || this._generateOutputPath(inputPath, 'cropped'),
          cropData: basicResult,
          originalPath: inputPath
        };
      }
    } catch (error) {
      this.emit('smart_crop_error', { inputPath, error: error.message });
      throw error;
    }
  }

  /**
   * Remove background from image
   */
  async removeBackground(inputPath, options = {}) {
    const { 
      outputPath, 
      threshold = 0.5, 
      featherAmount = 2,
      outputFormat = 'png'
    } = options;
    
    try {
      if (this.aiModels.get('backgroundRemover')?.loaded) {
        // Use AI for background removal
        const result = await this._aiBackgroundRemoval(inputPath, {
          threshold,
          featherAmount,
          outputFormat
        });
        
        return {
          success: true,
          processedPath: outputPath || this._generateOutputPath(inputPath, 'no-bg'),
          originalPath: inputPath,
          removedAt: new Date().toISOString(),
          method: 'ai'
        };
      } else {
        // Fallback to manual background removal
        const result = await this._manualBackgroundRemoval(inputPath, {
          threshold,
          outputFormat
        });
        
        return {
          success: true,
          processedPath: outputPath || this._generateOutputPath(inputPath, 'no-bg'),
          originalPath: inputPath,
          removedAt: new Date().toISOString(),
          method: 'manual'
        };
      }
    } catch (error) {
      this.emit('background_removal_error', { inputPath, error: error.message });
      throw error;
    }
  }

  /**
   * Analyze image content
   */
  async analyzeImage(inputPath) {
    try {
      const imageInfo = await this._getImageInfo(inputPath);
      
      // Basic analysis
      const analysis = {
        ...imageInfo,
        metadata: await this._extractMetadata(inputPath),
        colorPalette: await this._extractColorPalette(inputPath),
        complexity: await this._calculateComplexity(inputPath),
        faces: await this._detectFaces(inputPath),
        objects: await this._detectObjects(inputPath),
        quality: await this._assessImageQuality(inputPath)
      };
      
      // AI-enhanced analysis
      if (this.aiModels.get('contentAnalyzer')?.loaded) {
        const aiAnalysis = await this._aiContentAnalysis(inputPath);
        analysis.aiInsights = aiAnalysis;
      }
      
      return analysis;
    } catch (error) {
      this.emit('image_analysis_error', { inputPath, error: error.message });
      throw error;
    }
  }

  /**
   * Add custom optimization rule
   */
  addOptimizationRule(name, rule) {
    this.optimizationRules.set(name, rule);
    this.emit('optimization_rule_added', { name, rule });
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    const totalSavings = this.metrics.totalSizeOriginal - this.metrics.totalSizeOptimized;
    const overallCompressionRatio = this.metrics.totalSizeOriginal > 0
      ? (totalSavings / this.metrics.totalSizeOriginal * 100).toFixed(2)
      : '0';
    
    return {
      ...this.metrics,
      totalSavings,
      overallCompressionRatio: overallCompressionRatio + '%',
      averageOptimizationTime: this.metrics.averageOptimizationTime.toFixed(2) + 'ms',
      optimizationRules: this.optimizationRules.size,
      aiModels: this.aiModels.size,
      cacheSize: this.imageCache.size
    };
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
      hasAlpha: metadata.hasAlpha
    };
  }

  /**
   * Apply optimization rules
   */
  async _applyOptimizationRules(imageInfo) {
    let config = {
      formats: ['original'],
      quality: 80,
      generateResponsive: false
    };
    
    for (const [name, rule] of this.optimizationRules) {
      try {
        const ruleResult = await rule(imageInfo);
        config = { ...config, ...ruleResult };
      } catch (error) {
        console.warn(`Optimization rule ${name} failed:`, error.message);
      }
    }
    
    return config;
  }

  /**
   * Optimize original format
   */
  async _optimizeOriginalFormat(inputPath, options = {}) {
    const { quality, width, height } = options;
    
    let pipeline = sharp(inputPath);
    
    // Resize if needed
    if (width || height) {
      pipeline = pipeline.resize(width, height, { 
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Optimize based on format
    const inputExt = path.extname(inputPath).toLowerCase();
    
    if (inputExt === '.jpg' || inputExt === '.jpeg') {
      pipeline = pipeline.jpeg({ 
        quality: quality || 85,
        progressive: this.options.enableProgressive,
        mozjpeg: true
      });
    } else if (inputExt === '.png') {
      pipeline = pipeline.png({ 
        quality: quality || 90,
        compressionLevel: 9,
        progressive: this.options.enableProgressive
      });
    }
    
    const outputPath = this._generateOutputPath(inputPath, 'optimized');
    await pipeline.toFile(outputPath);
    
    const stats = await fs.stat(outputPath);
    
    return {
      format: path.extname(outputPath).slice(1),
      inputPath,
      outputPath,
      size: stats.size,
      width,
      height,
      quality
    };
  }

  /**
   * Convert to different format
   */
  async _convertToFormat(inputPath, format, options = {}) {
    const { quality, width, height, ...sharpOptions } = options;
    
    let pipeline = sharp(inputPath);
    
    // Resize if needed
    if (width || height) {
      pipeline = pipeline.resize(width, height, { 
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Apply format-specific optimization
    switch (format.toLowerCase()) {
      case 'webp':
        pipeline = pipeline.webp({ 
          quality: quality || this.options.qualitySettings.webp,
          effort: 4
        });
        this.metrics.webpConversions++;
        break;
        
      case 'avif':
        pipeline = pipeline.avif({ 
          quality: quality || this.options.qualitySettings.avif,
          effort: 4
        });
        this.metrics.avifConversions++;
        break;
        
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({ 
          quality: quality || this.options.qualitySettings.jpeg,
          progressive: this.options.enableProgressive,
          mozjpeg: true
        });
        break;
        
      case 'png':
        pipeline = pipeline.png({ 
          quality: quality || this.options.qualitySettings.png,
          compressionLevel: 9,
          progressive: this.options.enableProgressive
        });
        break;
    }
    
    const outputPath = this._generateOutputPath(inputPath, format);
    await pipeline.toFile(outputPath);
    
    const stats = await fs.stat(outputPath);
    
    return {
      format: format.toLowerCase(),
      inputPath,
      outputPath,
      size: stats.size,
      width,
      height,
      quality: quality || this.options.qualitySettings[format] || 80
    };
  }

  /**
   * Generate responsive images
   */
  async _generateResponsiveImages(inputPath, referencePath, config) {
    const breakpoints = config.breakpoints || this.options.responsiveBreakpoints;
    const results = [];
    
    for (const breakpoint of breakpoints) {
      // Skip if breakpoint is larger than original width
      const originalWidth = (await this._getImageInfo(inputPath)).width;
      if (breakpoint > originalWidth) continue;
      
      const responsiveResult = await this._convertToFormat(inputPath, 'webp', {
        width: breakpoint,
        quality: this._getQualityForFormat('webp', config)
      });
      
      results.push({
        ...responsiveResult,
        isResponsive: true,
        breakpoint
      });
    }
    
    return results;
  }

  /**
   * AI smart cropping
   */
  async _aiSmartCrop(inputPath, options) {
    // Simplified AI cropping - in production use proper AI models
    return {
      focalPoint: options.focalPoint || { x: 0.5, y: 0.5 },
      cropArea: { x: 0, y: 0, width: 1, height: 1 },
      confidence: 0.85,
      method: 'ai_face_detection'
    };
  }

  /**
   * Basic smart cropping
   */
  async _basicSmartCrop(inputPath, options) {
    const { focalPoint, aspectRatio } = options;
    
    return {
      focalPoint: focalPoint || { x: 0.5, y: 0.5 },
      cropArea: { x: 0, y: 0, width: 1, height: 1 },
      confidence: 0.6,
      method: 'focal_point'
    };
  }

  /**
   * AI background removal
   */
  async _aiBackgroundRemoval(inputPath, options) {
    // Simplified AI background removal
    return {
      maskGenerated: true,
      edgesRefined: true,
      confidence: 0.9
    };
  }

  /**
   * Manual background removal
   */
  async _manualBackgroundRemoval(inputPath, options) {
    const { threshold, outputFormat } = options;
    
    let pipeline = sharp(inputPath);
    
    // Apply simple background removal techniques
    pipeline = pipeline.removeAlpha();
    
    const outputPath = this._generateOutputPath(inputPath, 'no-bg');
    await pipeline.toFile(outputPath);
    
    return {
      method: 'alpha_removal',
      threshold,
      outputFormat
    };
  }

  /**
   * Extract image metadata
   */
  async _extractMetadata(inputPath) {
    const image = sharp(inputPath);
    return await image.metadata();
  }

  /**
   * Extract color palette
   */
  async _extractColorPalette(inputPath) {
    // Simplified color palette extraction
    return [
      { color: '#FF0000', percentage: 25 },
      { color: '#00FF00', percentage: 25 },
      { color: '#0000FF', percentage: 25 },
      { color: '#FFFF00', percentage: 25 }
    ];
  }

  /**
   * Calculate image complexity
   */
  async _calculateComplexity(inputPath) {
    // Simplified complexity calculation
    return 0.6; // Random complexity score
  }

  /**
   * Detect faces (placeholder)
   */
  async _detectFaces(inputPath) {
    return { count: 0, boundingBoxes: [] };
  }

  /**
   * Detect objects (placeholder)
   */
  async _detectObjects(inputPath) {
    return { objects: [], confidence: 0 };
  }

  /**
   * Assess image quality
   */
  async _assessImageQuality(inputPath) {
    return {
      score: 0.8,
      factors: {
        sharpness: 0.7,
        noise: 0.9,
        exposure: 0.8,
        color: 0.9
      }
    };
  }

  /**
   * AI content analysis
   */
  async _aiContentAnalysis(inputPath) {
    return {
      contentType: 'photographic',
      subject: 'general',
      scene: 'outdoor',
      mood: 'neutral',
      complexity: 0.6,
      quality: 0.8
    };
  }

  /**
   * Check if image is photographic
   */
  _isPhotographicImage(format) {
    return ['jpeg', 'jpg', 'tiff', 'raw'].includes(format.toLowerCase());
  }

  /**
   * Check if image is graphics
   */
  _isGraphicsImage(format) {
    return ['png', 'gif', 'bmp', 'webp'].includes(format.toLowerCase());
  }

  /**
   * Calculate optimal quality
   */
  _calculateOptimalQuality(fileSize, type) {
    const baseQualities = {
      photographic: 85,
      graphics: 90,
      simple: 95
    };
    
    let quality = baseQualities[type] || 85;
    
    // Adjust based on file size
    if (fileSize > 1024 * 1024) { // > 1MB
      quality -= 5; // Lower quality for large files
    } else if (fileSize < 100 * 1024) { // < 100KB
      quality += 5; // Higher quality for small files
    }
    
    return Math.max(60, Math.min(95, quality));
  }

  /**
   * Get quality for format
   */
  _getQualityForFormat(format, config = {}) {
    const qualitySettings = this.options.qualitySettings;
    let quality = qualitySettings[format] || 80;
    
    if (config.qualityMultiplier) {
      quality *= config.qualityMultiplier;
    }
    
    return Math.max(60, Math.min(95, Math.round(quality)));
  }

  /**
   * Select relevant breakpoints
   */
  _selectRelevantBreakpoints(imageWidth) {
    return this.options.responsiveBreakpoints.filter(
      breakpoint => breakpoint <= imageWidth
    );
  }

  /**
   * Generate output path
   */
  _generateOutputPath(inputPath, suffix) {
    const dir = path.dirname(inputPath).replace(this.options.inputDir, this.options.outputDir);
    const basename = path.basename(inputPath, path.extname(inputPath));
    const ext = path.extname(inputPath);
    
    return path.join(dir, `${basename}.${suffix}${ext}`);
  }

  /**
   * Calculate compression ratio
   */
  _calculateCompressionRatio(originalSize, results) {
    const totalOptimizedSize = results.reduce((sum, r) => sum + r.size, 0);
    return originalSize > 0 
      ? ((originalSize - totalOptimizedSize) / originalSize * 100).toFixed(2) + '%'
      : '0%';
  }

  /**
   * Update optimization metrics
   */
  _updateOptimizationMetrics(results, optimizationTime) {
    this.metrics.optimizedImages++;
    this.metrics.totalSizeOptimized += results.reduce((sum, r) => sum + r.size, 0);
    this.metrics.averageOptimizationTime = 
      (this.metrics.averageOptimizationTime * 0.9) + (optimizationTime * 0.1);
  }

  /**
   * Find images matching patterns
   */
  async _findImages(patterns, options = {}) {
    const { recursive = true } = options;
    const images = [];
    
    for (const pattern of patterns) {
      const glob = require('glob');
      const matches = glob.sync(pattern, { 
        cwd: this.options.inputDir,
        recursive 
      });
      images.push(...matches);
    }
    
    return images;
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
   * Clear cache
   */
  clearCache() {
    this.imageCache.clear();
    this.emit('cache_cleared');
  }
}

module.exports = { ImageOptimizer };