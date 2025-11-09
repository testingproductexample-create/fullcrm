const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs').promises;

/**
 * Advanced responsive images generator with modern formats and AI-powered optimization
 */
class ResponsiveImages extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      inputDir: options.inputDir || './public/images',
      outputDir: options.outputDir || './dist/images',
      breakpoints: options.breakpoints || [320, 480, 640, 768, 1024, 1280, 1536, 1920, 2560, 3840],
      formats: options.formats || ['webp', 'avif', 'jpeg'],
      densities: options.densities || [1, 2], // 1x, 2x for retina
      enableArtDirection: options.enableArtDirection !== false,
      enableLazyLoading: options.enableLazyLoading !== false,
      enableBlurPlaceholder: options.enableBlurPlaceholder !== false,
      enableSrcSet: options.enableSrcSet !== false,
      compression: {
        webp: options.webpQuality || 80,
        avif: options.avifQuality || 70,
        jpeg: options.jpegQuality || 85
      },
      sizes: options.sizes || '100vw', // CSS sizes attribute
      ...options
    };
    
    this.responsiveSets = new Map();
    this.artDirectionRules = new Map();
    this.deviceProfiles = new Map();
    this.placeholderCache = new Map();
    
    this.metrics = {
      totalImages: 0,
      generatedVariants: 0,
      totalSizeOriginal: 0,
      totalSizeOptimized: 0,
      averageCompressionRatio: 0,
      srcSetsGenerated: 0,
      blurPlaceholdersGenerated: 0,
      averageGenerationTime: 0
    };
    
    this._initializeDeviceProfiles();
    this._initializeArtDirectionRules();
  }

  /**
   * Initialize device profiles for targeted optimization
   */
  _initializeDeviceProfiles() {
    // Mobile devices
    this.deviceProfiles.set('mobile', {
      breakpoints: [320, 375, 414, 428],
      densities: [1, 2, 3],
      formats: ['webp', 'jpeg'],
      compression: { webp: 75, jpeg: 80 }
    });
    
    // Tablet devices
    this.deviceProfiles.set('tablet', {
      breakpoints: [768, 1024, 1112],
      densities: [1, 2],
      formats: ['webp', 'avif', 'jpeg'],
      compression: { webp: 80, avif: 70, jpeg: 85 }
    });
    
    // Desktop devices
    this.deviceProfiles.set('desktop', {
      breakpoints: [1280, 1440, 1920, 2560],
      densities: [1, 2],
      formats: ['webp', 'avif', 'jpeg'],
      compression: { webp: 85, avif: 75, jpeg: 90 }
    });
    
    // High-DPI devices
    this.deviceProfiles.set('retina', {
      breakpoints: [640, 768, 1024, 1280, 1536, 1920],
      densities: [2, 3],
      formats: ['webp', 'avif', 'jpeg'],
      compression: { webp: 90, avif: 80, jpeg: 95 }
    });
  }

  /**
   * Initialize art direction rules
   */
  _initializeArtDirectionRules() {
    // Hero images - different crops for different breakpoints
    this.addArtDirectionRule('hero-*', {
      breakpoints: {
        320: { crop: 'center-top', width: 320, focalPoint: { x: 0.5, y: 0.3 } },
        768: { crop: 'center-center', width: 768, focalPoint: { x: 0.5, y: 0.5 } },
        1280: { crop: 'center-bottom', width: 1280, focalPoint: { x: 0.5, y: 0.7 } }
      }
    });
    
    // Portrait images - different aspect ratios
    this.addArtDirectionRule('portrait-*', {
      breakpoints: {
        320: { aspectRatio: '1:1', width: 320 },
        768: { aspectRatio: '4:5', width: 640 },
        1280: { aspectRatio: '3:4', width: 960 }
      }
    });
    
    // Product images - focus on product area
    this.addArtDirectionRule('product-*', {
      breakpoints: {
        320: { crop: 'center', width: 320, padding: 0.1 },
        768: { crop: 'product-focus', width: 512, padding: 0.15 },
        1280: { crop: 'product-focus', width: 768, padding: 0.2 }
      }
    });
  }

  /**
   * Generate responsive image set
   */
  async generateResponsiveSet(inputPath, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        breakpoints = this.options.breakpoints,
        formats = this.options.formats,
        densities = this.options.densities,
        enableArtDirection = this.options.enableArtDirection,
        deviceProfile = 'universal',
        generateBlurPlaceholder = this.options.enableBlurPlaceholder,
        generateSrcSet = this.options.enableSrcSet,
        customSizes = null
      } = options;
      
      // Get image metadata
      const imageInfo = await this._getImageInfo(inputPath);
      this.metrics.totalImages++;
      this.metrics.totalSizeOriginal += imageInfo.size;
      
      // Determine breakpoints to generate
      const relevantBreakpoints = this._filterRelevantBreakpoints(
        breakpoints, 
        imageInfo.width
      );
      
      // Get device-specific settings
      const deviceSettings = this.deviceProfiles.get(deviceProfile) || this._getDefaultDeviceSettings();
      
      // Apply art direction if enabled
      let artDirectionConfig = {};
      if (enableArtDirection) {
        artDirectionConfig = this._getArtDirectionConfig(inputPath, relevantBreakpoints);
      }
      
      const variants = [];
      const metadata = {
        inputPath,
        originalSize: imageInfo.size,
        originalDimensions: { width: imageInfo.width, height: imageInfo.height },
        deviceProfile,
        generatedAt: new Date().toISOString()
      };
      
      // Generate variants for each breakpoint
      for (const breakpoint of relevantBreakpoints) {
        const breakpointVariants = await this._generateBreakpointVariants(
          inputPath,
          breakpoint,
          formats,
          densities,
          deviceSettings,
          artDirectionConfig[breakpoint]
        );
        
        variants.push(...breakpointVariants);
      }
      
      // Generate blur placeholder if requested
      let blurPlaceholder = null;
      if (generateBlurPlaceholder) {
        blurPlaceholder = await this._generateBlurPlaceholder(inputPath, imageInfo);
        this.metrics.blurPlaceholdersGenerated++;
      }
      
      // Generate srcset strings
      let srcSets = {};
      if (generateSrcSet) {
        srcSets = this._generateSrcSets(variants, customSizes || this.options.sizes);
        this.metrics.srcSetsGenerated++;
      }
      
      // Generate sizes attribute
      const sizesAttribute = this._generateSizesAttribute(
        customSizes || this.options.sizes,
        deviceProfile
      );
      
      const generationTime = Date.now() - startTime;
      this._updateGenerationMetrics(variants, generationTime);
      
      const result = {
        original: imageInfo,
        variants,
        srcSets,
        sizesAttribute,
        blurPlaceholder,
        metadata: {
          ...metadata,
          generationTime,
          totalVariants: variants.length,
          formats: formats,
          breakpoints: relevantBreakpoints
        }
      };
      
      // Store in cache
      this.responsiveSets.set(inputPath, result);
      
      this.emit('responsive_set_generated', {
        inputPath,
        breakpointCount: relevantBreakpoints.length,
        variantCount: variants.length,
        totalSize: variants.reduce((sum, v) => sum + v.size, 0),
        generationTime
      });
      
      return result;
      
    } catch (error) {
      this.emit('responsive_generation_error', {
        inputPath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate variants for specific breakpoint
   */
  async _generateBreakpointVariants(inputPath, breakpoint, formats, densities, deviceSettings, artDirection) {
    const variants = [];
    const imageInfo = await this._getImageInfo(inputPath);
    
    // Skip if breakpoint is larger than original image
    if (breakpoint > imageInfo.width) {
      return variants;
    }
    
    // Apply art direction if available
    let processedImage = sharp(inputPath);
    if (artDirection) {
      processedImage = this._applyArtDirection(processedImage, artDirection, breakpoint);
    }
    
    // Generate variants for each format and density
    for (const format of formats) {
      // Skip unsupported formats for this device profile
      if (!deviceSettings.formats.includes(format)) continue;
      
      for (const density of densities) {
        const targetWidth = Math.floor(breakpoint * density);
        
        // Skip if target width is larger than original
        if (targetWidth > imageInfo.width) continue;
        
        try {
          const variant = await this._generateVariant(
            processedImage,
            inputPath,
            format,
            targetWidth,
            this._getCompressionForFormat(format, deviceSettings.compression)
          );
          
          if (variant) {
            variants.push({
              ...variant,
              breakpoint,
              density,
              format,
              src: this._generateVariantPath(inputPath, format, targetWidth)
            });
          }
        } catch (error) {
          console.warn(`Failed to generate ${format} variant for ${breakpoint}w:`, error.message);
        }
      }
    }
    
    return variants;
  }

  /**
   * Generate single variant
   */
  async _generateVariant(processedImage, inputPath, format, width, quality) {
    let pipeline = processedImage.clone();
    
    // Resize to target width
    pipeline = pipeline.resize(width, null, {
      fit: 'inside',
      withoutEnlargement: true
    });
    
    // Apply format-specific settings
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality, effort: 4 });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality, effort: 4 });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ 
          quality, 
          progressive: true, 
          mozjpeg: true 
        });
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    const outputPath = this._generateVariantPath(inputPath, format, width);
    
    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Generate the image
    await pipeline.toFile(outputPath);
    
    // Get file info
    const stats = await fs.stat(outputPath);
    
    return {
      path: outputPath,
      format,
      width,
      height: await this._getImageHeight(outputPath),
      size: stats.size,
      quality
    };
  }

  /**
   * Apply art direction to image
   */
  _applyArtDirection(image, artDirection, breakpoint) {
    let processedImage = image;
    
    // Apply crop
    if (artDirection.crop) {
      processedImage = this._applySmartCrop(processedImage, artDirection);
    }
    
    // Apply aspect ratio
    if (artDirection.aspectRatio) {
      processedImage = this._applyAspectRatio(processedImage, artDirection.aspectRatio);
    }
    
    // Apply padding
    if (artDirection.padding) {
      processedImage = this._applyPadding(processedImage, artDirection.padding);
    }
    
    return processedImage;
  }

  /**
   * Apply smart cropping based on art direction
   */
  _applySmartCrop(image, artDirection) {
    const { crop, focalPoint, width } = artDirection;
    
    // Calculate crop area based on focal point
    if (focalPoint && width) {
      const cropWidth = Math.min(width * 0.8, width); // 80% of display width
      const cropHeight = cropWidth * 0.6; // Assume 3:5 aspect ratio
      
      const x = Math.max(0, focalPoint.x * 1920 - cropWidth / 2); // Assume base width of 1920
      const y = Math.max(0, focalPoint.y * 1080 - cropHeight / 2); // Assume base height of 1080
      
      return image.extract({
        left: Math.floor(x),
        top: Math.floor(y),
        width: Math.floor(cropWidth),
        height: Math.floor(cropHeight)
      });
    }
    
    return image;
  }

  /**
   * Apply aspect ratio
   */
  _applyAspectRatio(image, aspectRatio) {
    const [width, height] = aspectRatio.split(':').map(Number);
    const targetHeight = Math.floor((height / width) * 1000); // Calculate based on 1000px width
    
    return image.resize(1000, targetHeight, {
      fit: 'cover'
    });
  }

  /**
   * Apply padding
   */
  _applyPadding(image, paddingPercent) {
    // In a full implementation, this would add padding around the image
    // For now, just return the image as is
    return image;
  }

  /**
   * Generate blur placeholder
   */
  async _generateBlurPlaceholder(inputPath, imageInfo) {
    try {
      const sharp = require('sharp');
      const placeholder = await sharp(inputPath)
        .resize(20, null, { fit: 'cover' })
        .jpeg({ quality: 20 })
        .toBuffer();
      
      const base64 = placeholder.toString('base64');
      
      return {
        dataUrl: `data:image/jpeg;base64,${base64}`,
        width: 20,
        height: Math.floor(20 * imageInfo.height / imageInfo.width),
        size: placeholder.length
      };
    } catch (error) {
      console.warn('Failed to generate blur placeholder:', error.message);
      return null;
    }
  }

  /**
   * Generate srcset strings
   */
  _generateSrcSets(variants, sizes) {
    const srcSets = {};
    
    // Group variants by format
    const variantsByFormat = variants.reduce((acc, variant) => {
      if (!acc[variant.format]) acc[variant.format] = [];
      acc[variant.format].push(variant);
      return acc;
    }, {});
    
    // Generate srcset for each format
    for (const [format, formatVariants] of Object.entries(variantsByFormat)) {
      // Sort by width
      formatVariants.sort((a, b) => a.width - b.width);
      
      const srcsetString = formatVariants
        .map(variant => `${variant.src} ${variant.width}w`)
        .join(', ');
      
      srcSets[format] = srcsetString;
    }
    
    return srcSets;
  }

  /**
   * Generate sizes attribute
   */
  _generateSizesAttribute(sizes, deviceProfile) {
    if (typeof sizes === 'string') {
      return sizes;
    }
    
    // Responsive sizes based on device profile
    const profileSizes = {
      mobile: '(max-width: 640px) 100vw, (max-width: 768px) 90vw, 80vw',
      tablet: '(max-width: 768px) 90vw, (max-width: 1024px) 80vw, 70vw',
      desktop: '(max-width: 1024px) 80vw, (max-width: 1280px) 70vw, 60vw',
      universal: '100vw'
    };
    
    return profileSizes[deviceProfile] || profileSizes.universal;
  }

  /**
   * Generate HTML img tag with responsive attributes
   */
  generateImgTag(responsiveSet, options = {}) {
    const {
      alt = '',
      className = '',
      loading = 'lazy',
      priority = 'auto'
    } = options;
    
    const { variants, srcSets, sizesAttribute, blurPlaceholder } = responsiveSet;
    
    // Get smallest variant as default src
    const smallestVariant = variants.reduce((min, variant) => 
      variant.width < min.width ? variant : min
    );
    
    let imgTag = `<img`;
    
    // Basic attributes
    if (alt) imgTag += ` alt="${alt}"`;
    if (className) imgTag += ` class="${className}"`;
    imgTag += ` src="${smallestVariant.src}"`;
    
    // Responsive attributes
    if (Object.keys(srcSets).length > 0) {
      // Use WebP as primary format if available, otherwise first format
      const primaryFormat = srcSets.webp ? 'webp' : Object.keys(srcSets)[0];
      imgTag += ` srcset="${srcSets[primaryFormat]}"`;
    }
    
    if (sizesAttribute) {
      imgTag += ` sizes="${sizesAttribute}"`;
    }
    
    // Performance attributes
    if (loading === 'lazy') {
      imgTag += ` loading="lazy"`;
    }
    
    if (priority === 'high' || priority === 'eager') {
      imgTag += ` fetchpriority="${priority}"`;
    }
    
    // Blur placeholder
    if (blurPlaceholder) {
      imgTag += ` style="background-image: url('${blurPlaceholder.dataUrl}'); background-size: cover; background-position: center;"`;
    }
    
    imgTag += `>`;
    
    return imgTag;
  }

  /**
   * Generate picture element with art direction
   */
  generatePictureElement(responsiveSet, artDirectionBreakpoints = null, options = {}) {
    const {
      alt = '',
      className = '',
      loading = 'lazy'
    } = options;
    
    const { variants, srcSets, sizesAttribute, blurPlaceholder } = responsiveSet;
    
    let pictureElement = `<picture`;
    if (className) pictureElement += ` class="${className}"`;
    pictureElement += `>`;
    
    // Add source elements for each format
    for (const [format, srcset] of Object.entries(srcSets)) {
      if (format === 'webp' || format === 'avif') {
        pictureElement += `\n  <source type="image/${format}" srcset="${srcset}"`;
        if (sizesAttribute) {
          pictureElement += ` sizes="${sizesAttribute}"`;
        }
        pictureElement += `>`;
      }
    }
    
    // Add img element as fallback
    const fallbackVariant = variants.find(v => v.format === 'jpeg') || variants[0];
    pictureElement += `\n  <img`;
    if (alt) pictureElement += ` alt="${alt}"`;
    if (loading === 'lazy') pictureElement += ` loading="lazy"`;
    if (blurPlaceholder) {
      pictureElement += ` style="background-image: url('${blurPlaceholder.dataUrl}'); background-size: cover; background-position: center;"`;
    }
    pictureElement += ` src="${fallbackVariant.src}"`;
    if (sizesAttribute) {
      pictureElement += ` sizes="${sizesAttribute}"`;
    }
    pictureElement += `>`;
    
    pictureElement += `\n</picture>`;
    
    return pictureElement;
  }

  /**
   * Add art direction rule
   */
  addArtDirectionRule(pattern, rule) {
    this.artDirectionRules.set(pattern, {
      ...rule,
      createdAt: new Date().toISOString()
    });
    
    this.emit('art_direction_rule_added', { pattern, rule });
  }

  /**
   * Get art direction config for image
   */
  _getArtDirectionConfig(inputPath, breakpoints) {
    const fileName = path.basename(inputPath);
    const config = {};
    
    // Find matching rules
    for (const [pattern, rule] of this.artDirectionRules) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(fileName)) {
        // Apply rule for matching breakpoints
        for (const breakpoint of breakpoints) {
          if (rule.breakpoints[breakpoint]) {
            config[breakpoint] = rule.breakpoints[breakpoint];
          }
        }
      }
    }
    
    return config;
  }

  /**
   * Filter relevant breakpoints
   */
  _filterRelevantBreakpoints(breakpoints, imageWidth) {
    return breakpoints.filter(bp => bp <= imageWidth);
  }

  /**
   * Get default device settings
   */
  _getDefaultDeviceSettings() {
    return {
      breakpoints: this.options.breakpoints,
      densities: this.options.densities,
      formats: this.options.formats,
      compression: this.options.compression
    };
  }

  /**
   * Get compression settings for format
   */
  _getCompressionForFormat(format, deviceCompression) {
    return deviceCompression[format] || this.options.compression[format] || 80;
  }

  /**
   * Generate variant path
   */
  _generateVariantPath(inputPath, format, width) {
    const dir = path.dirname(inputPath).replace(this.options.inputDir, this.options.outputDir);
    const basename = path.basename(inputPath, path.extname(inputPath));
    const extension = path.extname(inputPath);
    
    return path.join(dir, `${basename}_${width}w.${format}`);
  }

  /**
   * Get image height
   */
  async _getImageHeight(imagePath) {
    const sharp = require('sharp');
    const metadata = await sharp(imagePath).metadata();
    return metadata.height;
  }

  /**
   * Get image information
   */
  async _getImageInfo(inputPath) {
    const sharp = require('sharp');
    const stats = await fs.stat(inputPath);
    const metadata = await sharp(inputPath).metadata();
    
    return {
      path: inputPath,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      channels: metadata.channels
    };
  }

  /**
   * Update generation metrics
   */
  _updateGenerationMetrics(variants, generationTime) {
    this.metrics.generatedVariants += variants.length;
    this.metrics.totalSizeOptimized += variants.reduce((sum, v) => sum + v.size, 0);
    this.metrics.averageGenerationTime = 
      (this.metrics.averageGenerationTime * 0.9) + (generationTime * 0.1);
    
    // Update average compression ratio
    const totalOriginalSize = this.metrics.totalSizeOriginal;
    const totalOptimizedSize = this.metrics.totalSizeOptimized;
    if (totalOriginalSize > 0) {
      const ratio = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100);
      this.metrics.averageCompressionRatio = 
        (this.metrics.averageCompressionRatio * 0.9) + (ratio * 0.1);
    }
  }

  /**
   * Get responsive images statistics
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
      averageGenerationTime: this.metrics.averageGenerationTime.toFixed(2) + 'ms',
      responsiveSets: this.responsiveSets.size,
      artDirectionRules: this.artDirectionRules.size,
      deviceProfiles: this.deviceProfiles.size,
      placeholderCache: this.placeholderCache.size
    };
  }

  /**
   * Get responsive set for image
   */
  getResponsiveSet(inputPath) {
    return this.responsiveSets.get(inputPath) || null;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.responsiveSets.clear();
    this.placeholderCache.clear();
    this.emit('cache_cleared');
  }
}

module.exports = { ResponsiveImages };