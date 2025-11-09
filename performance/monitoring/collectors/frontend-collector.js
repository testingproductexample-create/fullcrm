const EventEmitter = require('events');
const DatabaseConnection = require('../utilities/database-connection');
const Logger = require('../utilities/logger');

class FrontendCollector extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            collectionInterval: config.collectionInterval || 15000, // 15 seconds
            maxRetainedMetrics: config.maxRetainedMetrics || 5000,
            enableCoreWebVitals: config.enableCoreWebVitals !== false,
            enableResourceTiming: config.enableResourceTiming !== false,
            enableUserTiming: config.enableUserTiming !== false,
            sampleRate: config.sampleRate || 1.0, // 100% sampling
            ...config
        };
        
        this.db = new DatabaseConnection();
        this.logger = new Logger('frontend-collector');
        this.metrics = new Map();
        this.pageMetrics = new Map();
        this.userSessions = new Map();
        this.performanceEntries = [];
        this.coreWebVitals = new Map();
        this.resourceTimings = new Map();
        this.userTimings = new Map();
        this.isCollecting = false;
        this.collectionTimer = null;
        
        this.initializeMetrics();
        this.setupPerformanceObserver();
    }

    initializeMetrics() {
        // Initialize frontend metrics
        this.metrics.set('page_views', 0);
        this.metrics.set('unique_users', 0);
        this.metrics.set('average_load_time', 0);
        this.metrics.set('bounce_rate', 0);
        this.metrics.set('core_web_vitals_score', 0);
        this.metrics.set('error_rate', 0);
        this.metrics.set('api_response_time', 0);
        this.metrics.set('resource_count', 0);
        this.metrics.set('javascript_errors', 0);
    }

    // Setup performance observer for modern browsers
    setupPerformanceObserver() {
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            try {
                // Observe navigation timing
                const navObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.handleNavigationEntry(entry);
                    }
                });
                navObserver.observe({ entryTypes: ['navigation'] });

                // Observe resource timing if enabled
                if (this.config.enableResourceTiming) {
                    const resourceObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            this.handleResourceEntry(entry);
                        }
                    });
                    resourceObserver.observe({ entryTypes: ['resource'] });
                }

                // Observe user timing if enabled
                if (this.config.enableUserTiming) {
                    const userTimingObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            this.handleUserTimingEntry(entry);
                        }
                    });
                    userTimingObserver.observe({ entryTypes: ['measure', 'mark'] });
                }

                // Observe paint timing
                const paintObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.handlePaintEntry(entry);
                    }
                });
                paintObserver.observe({ entryTypes: ['paint'] });

            } catch (error) {
                this.logger.warn('PerformanceObserver setup failed:', error);
            }
        }
    }

    // Handle navigation performance entries
    handleNavigationEntry(entry) {
        const pageData = {
            url: window.location.href,
            loadTime: entry.loadEventEnd - entry.loadEventStart,
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            firstByte: entry.responseStart - entry.requestStart,
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            connect: entry.connectEnd - entry.connectStart,
            ssl: entry.connectEnd - entry.secureConnectionStart,
            request: entry.responseStart - entry.requestStart,
            response: entry.responseEnd - entry.responseStart,
            processing: entry.domContentLoadedEventEnd - entry.responseEnd,
            timestamp: Date.now()
        };

        this.trackPageLoad(pageData);
    }

    // Handle resource performance entries
    handleResourceEntry(entry) {
        const resourceData = {
            name: entry.name,
            type: this.getResourceType(entry.name),
            size: entry.transferSize || 0,
            duration: entry.duration,
            timestamp: Date.now()
        };

        if (Math.random() <= this.config.sampleRate) {
            this.trackResource(resourceData);
        }
    }

    // Handle user timing entries
    handleUserTimingEntry(entry) {
        const timingData = {
            name: entry.name,
            duration: entry.duration || 0,
            startTime: entry.startTime,
            timestamp: Date.now()
        };

        this.trackUserTiming(timingData);
    }

    // Handle paint performance entries
    handlePaintEntry(entry) {
        const paintData = {
            name: entry.name,
            startTime: entry.startTime,
            timestamp: Date.now()
        };

        this.trackPaint(paintData);
    }

    // Track page load performance
    trackPageLoad(pageData) {
        const { url, loadTime, domContentLoaded, firstByte, timestamp } = pageData;
        
        // Update global metrics
        this.metrics.set('page_views', this.metrics.get('page_views') + 1);
        
        // Update average load time
        const currentAvg = this.metrics.get('average_load_time') || 0;
        const pageViews = this.metrics.get('page_views');
        this.metrics.set('average_load_time', 
            (currentAvg * (pageViews - 1) + loadTime) / pageViews);

        // Update page-specific metrics
        const pageKey = this.getPageKey(url);
        if (!this.pageMetrics.has(pageKey)) {
            this.pageMetrics.set(pageKey, {
                url,
                totalLoads: 0,
                averageLoadTime: 0,
                averageDomContentLoaded: 0,
                averageFirstByte: 0,
                firstPaint: 0,
                firstContentfulPaint: 0,
                coreWebVitals: {
                    lcp: 0, // Largest Contentful Paint
                    fid: 0, // First Input Delay
                    cls: 0  // Cumulative Layout Shift
                },
                bounceCount: 0
            });
        }

        const pageMetric = this.pageMetrics.get(pageKey);
        pageMetric.totalLoads++;
        pageMetric.averageLoadTime = 
            (pageMetric.averageLoadTime * (pageMetric.totalLoads - 1) + loadTime) / 
            pageMetric.totalLoads;
        pageMetric.averageDomContentLoaded = 
            (pageMetric.averageDomContentLoaded * (pageMetric.totalLoads - 1) + domContentLoaded) / 
            pageMetric.totalLoads;
        pageMetric.averageFirstByte = 
            (pageMetric.averageFirstByte * (pageMetric.totalLoads - 1) + firstByte) / 
            pageMetric.totalLoads;

        // Track user session
        this.trackUserSession(url, timestamp);
    }

    // Track resource performance
    trackResource(resourceData) {
        const { name, type, size, duration } = resourceData;
        
        if (!this.resourceTimings.has(type)) {
            this.resourceTimings.set(type, {
                count: 0,
                totalSize: 0,
                totalDuration: 0,
                averageSize: 0,
                averageDuration: 0
            });
        }

        const resourceType = this.resourceTimings.get(type);
        resourceType.count++;
        resourceType.totalSize += size;
        resourceType.totalDuration += duration;
        resourceType.averageSize = resourceType.totalSize / resourceType.count;
        resourceType.averageDuration = resourceType.totalDuration / resourceType.count;

        this.metrics.set('resource_count', this.metrics.get('resource_count') + 1);
    }

    // Track user timing
    trackUserTiming(timingData) {
        const { name, duration, startTime } = timingData;
        
        if (!this.userTimings.has(name)) {
            this.userTimings.set(name, {
                count: 0,
                totalDuration: 0,
                averageDuration: 0,
                minDuration: Infinity,
                maxDuration: 0
            });
        }

        const timing = this.userTimings.get(name);
        timing.count++;
        timing.totalDuration += duration;
        timing.averageDuration = timing.totalDuration / timing.count;
        timing.minDuration = Math.min(timing.minDuration, duration);
        timing.maxDuration = Math.max(timing.maxDuration, duration);
    }

    // Track paint metrics
    trackPaint(paintData) {
        const { name, startTime } = paintData;
        
        if (name === 'first-paint') {
            this.metrics.set('first_paint', startTime);
        } else if (name === 'first-contentful-paint') {
            this.metrics.set('first_contentful_paint', startTime);
        }
    }

    // Track user session
    trackUserSession(url, timestamp) {
        const sessionId = this.getOrCreateSessionId();
        const sessionDuration = timestamp - (this.userSessions.get(sessionId)?.startTime || timestamp);
        
        if (!this.userSessions.has(sessionId)) {
            this.userSessions.set(sessionId, {
                sessionId,
                startTime: timestamp,
                pageViews: 1,
                currentPage: url,
                firstSeen: timestamp
            });
        } else {
            const session = this.userSessions.get(sessionId);
            session.pageViews++;
            session.currentPage = url;
        }

        // Mark as bounce if session duration is very short
        if (sessionDuration < 10000) { // Less than 10 seconds
            const pageKey = this.getPageKey(url);
            const pageMetric = this.pageMetrics.get(pageKey);
            if (pageMetric) {
                pageMetric.bounceCount++;
            }
        }
    }

    // Get or create session ID
    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('monitoring_session_id');
        if (!sessionId) {
            sessionId = this.generateSessionId();
            sessionStorage.setItem('monitoring_session_id', sessionId);
        }
        return sessionId;
    }

    // Generate session ID
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Get page key for metrics storage
    getPageKey(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname;
        } catch {
            return url;
        }
    }

    // Get resource type from URL
    getResourceType(url) {
        const extension = url.split('.').pop().toLowerCase();
        const typeMap = {
            'js': 'javascript',
            'css': 'stylesheet',
            'png': 'image',
            'jpg': 'image',
            'jpeg': 'image',
            'gif': 'image',
            'svg': 'image',
            'woff': 'font',
            'woff2': 'font',
            'ttf': 'font',
            'json': 'fetch',
            'xml': 'fetch',
            'html': 'document'
        };
        return typeMap[extension] || 'other';
    }

    // Track Core Web Vitals
    trackCoreWebVitals(vitals) {
        const { lcp, fid, cls, ttfb, fcp } = vitals;
        
        if (lcp !== undefined) {
            this.coreWebVitals.set('lcp', {
                value: lcp,
                timestamp: Date.now(),
                rating: this.getLcpRating(lcp)
            });
        }
        
        if (fid !== undefined) {
            this.coreWebVitals.set('fid', {
                value: fid,
                timestamp: Date.now(),
                rating: this.getFidRating(fid)
            });
        }
        
        if (cls !== undefined) {
            this.coreWebVitals.set('cls', {
                value: cls,
                timestamp: Date.now(),
                rating: this.getClsRating(cls)
            });
        }
    }

    // Get LCP rating
    getLcpRating(lcp) {
        if (lcp <= 2500) return 'good';
        if (lcp <= 4000) return 'needs-improvement';
        return 'poor';
    }

    // Get FID rating
    getFidRating(fid) {
        if (fid <= 100) return 'good';
        if (fid <= 300) return 'needs-improvement';
        return 'poor';
    }

    // Get CLS rating
    getClsRating(cls) {
        if (cls <= 0.1) return 'good';
        if (cls <= 0.25) return 'needs-improvement';
        return 'poor';
    }

    // Track JavaScript errors
    trackJsError(errorData) {
        this.metrics.set('javascript_errors', this.metrics.get('javascript_errors') + 1);
        
        const error = {
            message: errorData.message || 'Unknown JS error',
            filename: errorData.filename || '',
            line: errorData.lineno || 0,
            column: errorData.colno || 0,
            stack: errorData.error?.stack || '',
            timestamp: Date.now()
        };

        this.performanceEntries.push({
            type: 'js_error',
            data: error
        });
    }

    // Start collecting metrics
    async start() {
        if (this.isCollecting) {
            this.logger.warn('Frontend collector is already running');
            return;
        }

        try {
            await this.db.connect();
            this.isCollecting = true;
            
            this.logger.info('Starting frontend metrics collection');
            
            // Start periodic collection
            this.collectionTimer = setInterval(() => {
                this.collectMetrics().catch(error => {
                    this.logger.error('Error collecting frontend metrics:', error);
                });
            }, this.config.collectionInterval);
            
            // Initial collection
            await this.collectMetrics();
            
        } catch (error) {
            this.logger.error('Failed to start frontend collector:', error);
            throw error;
        }
    }

    // Stop collecting metrics
    async stop() {
        if (!this.isCollecting) {
            return;
        }

        this.isCollecting = false;
        
        if (this.collectionTimer) {
            clearInterval(this.collectionTimer);
            this.collectionTimer = null;
        }
        
        // Save final metrics
        try {
            await this.collectMetrics();
        } catch (error) {
            this.logger.error('Error collecting final metrics:', error);
        }
        
        this.logger.info('Frontend metrics collection stopped');
    }

    // Collect and store metrics
    async collectMetrics() {
        const timestamp = new Date();
        const metrics = this.getCurrentMetrics();
        
        try {
            // Store global metrics
            for (const [metricName, metricValue] of metrics.global) {
                await this.db.query(`
                    INSERT INTO system_metrics (
                        metric_name, metric_value, metric_type, dimensions, timestamp
                    ) VALUES ($1, $2, 'gauge', $3, $4)
                `, [metricName, metricValue, JSON.stringify({ service: 'frontend' }), timestamp]);
            }

            // Store page metrics
            for (const [pageKey, pageMetric] of this.pageMetrics) {
                await this.db.query(`
                    INSERT INTO frontend_metrics (
                        page_path, total_loads, average_load_time, average_dom_content_loaded,
                        average_first_byte, bounce_count, core_web_vitals, timestamp
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    pageKey,
                    pageMetric.totalLoads,
                    pageMetric.averageLoadTime,
                    pageMetric.averageDomContentLoaded,
                    pageMetric.averageFirstByte,
                    pageMetric.bounceCount,
                    JSON.stringify(pageMetric.coreWebVitals),
                    timestamp
                ]);
            }

            // Store resource timing data
            for (const [resourceType, resourceData] of this.resourceTimings) {
                await this.db.query(`
                    INSERT INTO frontend_metrics (
                        page_path, metric_type, metric_value, additional_data, timestamp
                    ) VALUES ($1, $2, $3, $4, $5)
                `, [
                    resourceType,
                    'resource_timing',
                    resourceData.count,
                    JSON.stringify({
                        totalSize: resourceData.totalSize,
                        totalDuration: resourceData.totalDuration,
                        averageSize: resourceData.averageSize,
                        averageDuration: resourceData.averageDuration
                    }),
                    timestamp
                ]);
            }

            // Store performance entries
            for (const entry of this.performanceEntries.slice(0, 20)) { // Store up to 20 per collection
                if (entry.type === 'js_error') {
                    await this.db.query(`
                        INSERT INTO error_logs (
                            log_level, message, stack_trace, service, additional_data, timestamp
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        'error',
                        entry.data.message,
                        `File: ${entry.data.filename}:${entry.data.line}:${entry.data.column}`,
                        'frontend',
                        JSON.stringify(entry.data),
                        new Date(entry.data.timestamp)
                    ]);
                }
            }

            // Clean up old entries
            this.cleanupOldEntries();
            
        } catch (error) {
            this.logger.error('Failed to store frontend metrics:', error);
        }
    }

    // Clean up old performance entries
    cleanupOldEntries() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        this.performanceEntries = this.performanceEntries.filter(
            entry => entry.timestamp >= cutoff
        );
    }

    // Get current metrics
    getCurrentMetrics() {
        const global = {
            page_views: this.metrics.get('page_views'),
            average_load_time: this.metrics.get('average_load_time'),
            first_paint: this.metrics.get('first_paint'),
            first_contentful_paint: this.metrics.get('first_contentful_paint'),
            javascript_errors: this.metrics.get('javascript_errors'),
            resource_count: this.metrics.get('resource_count')
        };

        const pageMetrics = Array.from(this.pageMetrics.entries())
            .map(([key, metric]) => ({
                page: key,
                ...metric,
                bounceRate: metric.totalLoads > 0 ? 
                    (metric.bounceCount / metric.totalLoads) * 100 : 0
            }));

        const resourceTimings = Object.fromEntries(this.resourceTimings);
        const userTimings = Object.fromEntries(this.userTimings);
        const coreWebVitals = Object.fromEntries(this.coreWebVitals);

        return {
            global,
            pageMetrics,
            resourceTimings,
            userTimings,
            coreWebVitals,
            activeSessions: this.userSessions.size,
            timestamp: new Date()
        };
    }

    // Get performance insights
    getPerformanceInsights() {
        const insights = [];
        
        // Load time insights
        const avgLoadTime = this.metrics.get('average_load_time') || 0;
        if (avgLoadTime > 3000) {
            insights.push({
                type: 'performance',
                severity: 'warning',
                message: `Average page load time is high: ${avgLoadTime.toFixed(0)}ms`,
                recommendation: 'Optimize critical rendering path and minimize render-blocking resources'
            });
        }

        // Error rate insights
        const jsErrors = this.metrics.get('javascript_errors') || 0;
        const pageViews = this.metrics.get('page_views') || 1;
        const errorRate = (jsErrors / pageViews) * 100;
        
        if (errorRate > 1) {
            insights.push({
                type: 'error',
                severity: 'error',
                message: `High JavaScript error rate: ${errorRate.toFixed(1)}%`,
                recommendation: 'Review browser console for JavaScript errors and fix them'
            });
        }

        // Core Web Vitals insights
        const lcp = this.coreWebVitals.get('lcp');
        if (lcp && lcp.rating !== 'good') {
            insights.push({
                type: 'core_web_vitals',
                severity: lcp.rating === 'poor' ? 'error' : 'warning',
                message: `Largest Contentful Paint needs improvement: ${lcp.value.toFixed(0)}ms`,
                recommendation: 'Optimize server response time and reduce blocking resources'
            });
        }

        return insights;
    }

    // Reset metrics
    reset() {
        this.initializeMetrics();
        this.pageMetrics.clear();
        this.userSessions.clear();
        this.performanceEntries = [];
        this.coreWebVitals.clear();
        this.resourceTimings.clear();
        this.userTimings.clear();
        this.logger.info('Frontend metrics reset');
    }

    // Health check
    async healthCheck() {
        try {
            await this.db.query('SELECT 1');
            return {
                status: 'healthy',
                isCollecting: this.isCollecting,
                pageViews: this.metrics.get('page_views'),
                activeSessions: this.userSessions.size,
                coreWebVitals: Object.keys(this.coreWebVitals).length,
                lastCollection: new Date()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                isCollecting: this.isCollecting,
                error: error.message,
                lastCollection: null
            };
        }
    }
}

module.exports = FrontendCollector;