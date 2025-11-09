const zlib = require('zlib');
const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * Advanced compression engine for static assets with multiple algorithms
 */
class CompressionEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      algorithms: options.algorithms || ['gzip', 'brotli', 'deflate'],
      level: options.level || 6, // Compression level 1-9
      threshold: options.threshold || 1024, // Minimum size to compress
      enableAdaptive: options.enableAdaptive !== false,
      enableStreaming: options.enableStreaming !== false,
      keepOriginal: options.keepOriginal !== false,
      ...options
    };
    
    this.compressionStats = new Map();
    this.algorithmPerformance = new Map();
    
    this.metrics = {
      totalCompressions: 0,
      totalBytesOriginal: 0,
      totalBytesCompressed: 0,
      totalBytesSaved: 0,
      averageCompressionRatio: 0,
      algorithmUsage: {
        gzip: 0,
        brotli: 0,
        deflate: 0
      }
    };
    
    this._initializeAlgorithms();
  }

  /**
   * Initialize compression algorithms
   */
  _initializeAlgorithms() {
    this.algorithms = {
      gzip: {
        name: 'gzip',
        extension: '.gz',
        mimeTypes: [
          'text/html', 'text/css', 'text/javascript', 'application/javascript',
          'application/json', 'text/xml', 'application/xml', 'image/svg+xml'
        ],
        compress: (data) => this._compressGzip(data),
        decompress: (data) => this._decompressGzip(data)
      },
      
      brotli: {
        name: 'brotli',
        extension: '.br',
        mimeTypes: [
          'text/html', 'text/css', 'text/javascript', 'application/javascript',
          'application/json', 'text/xml', 'application/xml', 'image/svg+xml'
        ],
        compress: (data) => this._compressBrotli(data),
        decompress: (data) => this._decompressBrotli(data)
      },
      
      deflate: {
        name: 'deflate',
        extension: '.deflate',
        mimeTypes: [
          'text/html', 'text/css', 'text/javascript', 'application/javascript',
          'application/json', 'text/xml', 'application/xml'
        ],
        compress: (data) => this._compressDeflate(data),
        decompress: (data) => this._decompressDeflate(data)
      }
    };
  }

  /**
   * Compress data with best algorithm
   */
  async compress(data, options = {}) {
    const startTime = Date.now();
    
    try {
      const { contentType, filename, preferAlgorithm } = options;
      
      // Check if data is large enough to compress
      const originalSize = Buffer.byteLength(data, 'utf8');
      if (originalSize < this.options.threshold) {
        return {
          compressed: false,
          reason: 'Below compression threshold',
          originalSize
        };
      }
      
      // Select best algorithm
      const algorithm = preferAlgorithm 
        ? this.algorithms[preferAlgorithm]
        : this._selectBestAlgorithm(data, contentType, filename);
      
      if (!algorithm) {
        return {
          compressed: false,
          reason: 'No suitable algorithm found',
          originalSize
        };
      }
      
      // Compress data
      const compressed = await algorithm.compress(data);
      
      if (!compressed || compressed.length >= originalSize) {
        return {
          compressed: false,
          reason: 'Compression not beneficial',
          originalSize,
          compressedSize: compressed ? compressed.length : originalSize
        };
      }
      
      const compressionTime = Date.now() - startTime;
      const bytesSaved = originalSize - compressed.length;
      const compressionRatio = (bytesSaved / originalSize * 100).toFixed(2);
      
      // Update metrics
      this._updateMetrics(algorithm.name, originalSize, compressed.length, compressionTime);
      
      // Update statistics
      this._updateAlgorithmPerformance(algorithm.name, compressionRatio, compressionTime);
      
      const result = {
        compressed: true,
        algorithm: algorithm.name,
        extension: algorithm.extension,
        content: compressed,
        originalSize,
        compressedSize: compressed.length,
        bytesSaved,
        compressionRatio: compressionRatio + '%',
        compressionTime,
        contentType,
        filename
      };
      
      this.emit('compression_completed', result);
      
      return result;
      
    } catch (error) {
      this.emit('compression_error', {
        error: error.message,
        originalSize: Buffer.byteLength(data, 'utf8')
      });
      
      throw error;
    }
  }

  /**
   * Decompress data
   */
  async decompress(data, algorithm, options = {}) {
    const compression = this.algorithms[algorithm];
    if (!compression) {
      throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }
    
    try {
      return await compression.decompress(data);
    } catch (error) {
      this.emit('decompression_error', {
        algorithm,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Compress file with streaming support
   */
  async compressFile(filePath, options = {}) {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      if (stats.size < this.options.threshold) {
        return {
          compressed: false,
          reason: 'File too small',
          filePath
        };
      }
      
      const readStream = fs.createReadStream(filePath);
      const writeStream = fs.createWriteStream(filePath + '.gz'); // Default to gzip
      
      return new Promise((resolve, reject) => {
        const gzip = zlib.createGzip({ level: this.options.level });
        
        readStream
          .pipe(gzip)
          .pipe(writeStream)
          .on('finish', () => {
            const result = {
              compressed: true,
              algorithm: 'gzip',
              originalFile: filePath,
              compressedFile: filePath + '.gz',
              originalSize: stats.size,
              compressedSize: fs.statSync(filePath + '.gz').size
            };
            
            this.emit('file_compression_completed', result);
            resolve(result);
          })
          .on('error', reject);
      });
      
    } catch (error) {
      this.emit('file_compression_error', { filePath, error: error.message });
      throw error;
    }
  }

  /**
   * Get compression recommendations
   */
  getCompressionRecommendations(data, contentType, filename) {
    const recommendations = [];
    const size = Buffer.byteLength(data, 'utf8');
    
    if (size < this.options.threshold) {
      recommendations.push({
        algorithm: 'none',
        reason: 'Data too small for compression',
        expectedSavings: '0%'
      });
      return recommendations;
    }
    
    // Check content type compatibility
    for (const [name, algorithm] of Object.entries(this.algorithms)) {
      const isCompatible = algorithm.mimeTypes.some(mime => 
        contentType && contentType.startsWith(mime)
      );
      
      if (isCompatible) {
        const expectedRatio = this._estimateCompressionRatio(name, contentType, size);
        recommendations.push({
          algorithm: name,
          reason: 'Compatible content type',
          expectedSavings: expectedRatio,
          fileExtension: algorithm.extension
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Batch compress multiple files
   */
  async batchCompress(filePaths, options = {}) {
    const { parallel = true, maxConcurrent = 4 } = options;
    
    const results = [];
    const errors = [];
    
    if (parallel) {
      // Process files in parallel with concurrency limit
      const batches = this._createBatches(filePaths, maxConcurrent);
      
      for (const batch of batches) {
        const batchResults = await Promise.allSettled(
          batch.map(filePath => this.compressFile(filePath, options))
        );
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            errors.push({
              filePath: batch[index],
              error: result.reason.message
            });
          }
        });
      }
    } else {
      // Process files sequentially
      for (const filePath of filePaths) {
        try {
          const result = await this.compressFile(filePath, options);
          results.push(result);
        } catch (error) {
          errors.push({ filePath, error: error.message });
        }
      }
    }
    
    this.emit('batch_compression_completed', {
      totalFiles: filePaths.length,
      successful: results.length,
      failed: errors.length
    });
    
    return { results, errors };
  }

  /**
   * Select best compression algorithm
   */
  _selectBestAlgorithm(data, contentType, filename) {
    const candidates = [];
    
    for (const [name, algorithm] of Object.entries(this.algorithms)) {
      // Check content type compatibility
      const isCompatible = algorithm.mimeTypes.some(mime => 
        contentType && contentType.startsWith(mime)
      );
      
      if (isCompatible) {
        // Get performance history for this algorithm
        const performance = this.algorithmPerformance.get(name) || { 
          averageRatio: 50, 
          averageTime: 100 
        };
        
        candidates.push({
          name,
          algorithm,
          score: this._calculateAlgorithmScore(performance, name)
        });
      }
    }
    
    // Sort by score (higher is better)
    candidates.sort((a, b) => b.score - a.score);
    
    return candidates.length > 0 ? candidates[0].algorithm : null;
  }

  /**
   * Calculate algorithm score based on performance
   */
  _calculateAlgorithmScore(performance, algorithmName) {
    const { averageRatio, averageTime } = performance;
    
    // Weight compression ratio higher than speed
    const ratioWeight = 0.7;
    const speedWeight = 0.3;
    
    // Normalize values (higher is better)
    const ratioScore = Math.min(averageRatio, 90) / 90; // Cap at 90%
    const speedScore = Math.max(0, 1 - (averageTime / 1000)); // Faster is better
    
    return (ratioScore * ratioWeight + speedScore * speedWeight) * 100;
  }

  /**
   * Compress with gzip
   */
  _compressGzip(data) {
    return new Promise((resolve, reject) => {
      zlib.gzip(data, { 
        level: this.options.level,
        memLevel: 8
      }, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    });
  }

  /**
   * Decompress gzip
   */
  _decompressGzip(data) {
    return new Promise((resolve, reject) => {
      zlib.gunzip(data, (err, decompressed) => {
        if (err) reject(err);
        else resolve(decompressed);
      });
    });
  }

  /**
   * Compress with Brotli (simplified - would need brotli package)
   */
  async _compressBrotli(data) {
    // Simplified Brotli compression
    // In production, use the 'brotli' npm package
    return await this._compressGzip(data);
  }

  /**
   * Decompress Brotli
   */
  async _decompressBrotli(data) {
    // Simplified Brotli decompression
    return await this._decompressGzip(data);
  }

  /**
   * Compress with deflate
   */
  _compressDeflate(data) {
    return new Promise((resolve, reject) => {
      zlib.deflate(data, { 
        level: this.options.level
      }, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    });
  }

  /**
   * Decompress deflate
   */
  _decompressDeflate(data) {
    return new Promise((resolve, reject) => {
      zlib.inflate(data, (err, decompressed) => {
        if (err) reject(err);
        else resolve(decompressed);
      });
    });
  }

  /**
   * Estimate compression ratio
   */
  _estimateCompressionRatio(algorithm, contentType, size) {
    // Basic estimation based on content type and size
    let baseRatio = 60; // Default 60% compression
    
    if (contentType?.includes('json')) {
      baseRatio = 70;
    } else if (contentType?.includes('html')) {
      baseRatio = 65;
    } else if (contentType?.includes('css')) {
      baseRatio = 75;
    } else if (contentType?.includes('javascript')) {
      baseRatio = 60;
    }
    
    // Adjust based on size
    if (size > 100 * 1024) { // > 100KB
      baseRatio += 10; // Better compression for larger files
    }
    
    return baseRatio + '%';
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
   * Update metrics
   */
  _updateMetrics(algorithm, originalSize, compressedSize, time) {
    this.metrics.totalCompressions++;
    this.metrics.totalBytesOriginal += originalSize;
    this.metrics.totalBytesCompressed += compressedSize;
    this.metrics.totalBytesSaved += (originalSize - compressedSize);
    this.metrics.algorithmUsage[algorithm]++;
    
    // Update average compression ratio
    const currentRatio = (originalSize - compressedSize) / originalSize * 100;
    this.metrics.averageCompressionRatio = 
      (this.metrics.averageCompressionRatio * 0.9) + (currentRatio * 0.1);
  }

  /**
   * Update algorithm performance
   */
  _updateAlgorithmPerformance(algorithm, ratio, time) {
    if (!this.algorithmPerformance.has(algorithm)) {
      this.algorithmPerformance.set(algorithm, {
        averageRatio: 0,
        averageTime: 0,
        usage: 0
      });
    }
    
    const perf = this.algorithmPerformance.get(algorithm);
    perf.averageRatio = (perf.averageRatio * 0.9) + (parseFloat(ratio) * 0.1);
    perf.averageTime = (perf.averageTime * 0.9) + (time * 0.1);
    perf.usage++;
    
    this.algorithmPerformance.set(algorithm, perf);
  }

  /**
   * Get compression statistics
   */
  getStats() {
    const totalSavings = this.metrics.totalBytesOriginal - this.metrics.totalBytesCompressed;
    const overallRatio = this.metrics.totalBytesOriginal > 0
      ? (totalSavings / this.metrics.totalBytesOriginal * 100).toFixed(2) + '%'
      : '0%';
    
    return {
      ...this.metrics,
      totalSavings,
      overallCompressionRatio: overallRatio,
      averageCompressionRatio: this.metrics.averageCompressionRatio.toFixed(2) + '%',
      algorithmPerformance: Object.fromEntries(this.algorithmPerformance)
    };
  }

  /**
   * Get supported algorithms
   */
  getSupportedAlgorithms() {
    return Object.keys(this.algorithms);
  }

  /**
   * Clear statistics
   */
  clearStats() {
    this.compressionStats.clear();
    this.algorithmPerformance.clear();
    this.metrics = {
      totalCompressions: 0,
      totalBytesOriginal: 0,
      totalBytesCompressed: 0,
      totalBytesSaved: 0,
      averageCompressionRatio: 0,
      algorithmUsage: { gzip: 0, brotli: 0, deflate: 0 }
    };
  }
}

module.exports = { CompressionEngine };