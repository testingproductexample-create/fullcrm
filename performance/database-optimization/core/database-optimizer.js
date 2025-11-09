/**
 * Core Database Optimization Engine
 * Main orchestrator for all database performance optimization activities
 */

const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const { performance } = require('perf_hooks');
const EventEmitter = require('events');

class DatabaseOptimizer extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.sharding = new (require('../sharding/sharding-manager'))(config.sharding);
        this.partitioning = new (require('../partitioning/partition-manager'))(config.partitioning);
        this.indexing = new (require('../indexing/index-optimizer'))(config.indexing);
        this.queryAnalyzer = new (require('../query-analysis/query-analyzer'))(config.queryAnalysis);
        this.connectionPool = new (require('../connection-pooling/pool-manager'))(config.connectionPool);
        this.monitoring = new (require('../monitoring/monitor'))(config.monitoring);
        this.migration = new (require('../migration/migration-manager'))(config.migration);
        this.benchmarking = new (require('../benchmarking/benchmark-engine'))(config.benchmarking);
        this.slowQueryDetector = new (require('../slow-query-detection/detector'))(config.slowQueryDetection);
        this.healthMonitor = new (require('../health-monitoring/health-checker'))(config.healthMonitoring);
        this.optimizer = new (require('../optimization-recommendations/recommendation-engine'))(config.optimization);
        
        this.isRunning = false;
        this.optimizationHistory = [];
    }

    async initialize() {
        console.log('🚀 Initializing Database Optimization System...');
        
        try {
            await this.connectionPool.initialize();
            await this.monitoring.start();
            await this.healthMonitor.start();
            await this.slowQueryDetector.start();
            
            this.isRunning = true;
            this.emit('initialized');
            console.log('✅ Database Optimization System initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Database Optimization System:', error);
            throw error;
        }
    }

    async optimizeDatabase() {
        const startTime = performance.now();
        const results = {
            timestamp: new Date(),
            optimizations: []
        };

        try {
            console.log('🔧 Starting database optimization...');

            // 1. Health Check
            const healthStatus = await this.healthMonitor.checkAll();
            results.optimizations.push({
                type: 'health_check',
                status: healthStatus.overall === 'healthy' ? 'passed' : 'warning',
                details: healthStatus
            });

            // 2. Query Performance Analysis
            const queryAnalysis = await this.queryAnalyzer.analyzeRecentQueries();
            results.optimizations.push({
                type: 'query_analysis',
                status: 'completed',
                details: queryAnalysis
            });

            // 3. Index Optimization
            const indexOptimization = await this.indexing.optimizeIndexes();
            results.optimizations.push({
                type: 'index_optimization',
                status: 'completed',
                details: indexOptimization
            });

            // 4. Slow Query Detection and Remediation
            const slowQueries = await this.slowQueryDetector.detectAndRemediate();
            results.optimizations.push({
                type: 'slow_query_remediation',
                status: 'completed',
                details: slowQueries
            });

            // 5. Connection Pool Optimization
            const poolOptimization = await this.connectionPool.optimize();
            results.optimizations.push({
                type: 'connection_pool_optimization',
                status: 'completed',
                details: poolOptimization
            });

            // 6. Generate Recommendations
            const recommendations = await this.optimizer.generateRecommendations(results.optimizations);
            results.optimizations.push({
                type: 'optimization_recommendations',
                status: 'generated',
                details: recommendations
            });

            // 7. Apply Safe Optimizations
            const appliedOptimizations = await this.optimizer.applyRecommendations(recommendations, { dryRun: false });
            results.optimizations.push({
                type: 'applied_optimizations',
                status: 'completed',
                details: appliedOptimizations
            });

            results.executionTime = performance.now() - startTime;
            results.success = true;

            this.optimizationHistory.push(results);
            this.emit('optimizationCompleted', results);

            console.log(`✅ Database optimization completed in ${results.executionTime.toFixed(2)}ms`);
            return results;

        } catch (error) {
            console.error('❌ Database optimization failed:', error);
            results.error = error.message;
            results.success = false;
            results.executionTime = performance.now() - startTime;
            throw error;
        }
    }

    async performHealthCheck() {
        return await this.healthMonitor.checkAll();
    }

    async getPerformanceMetrics() {
        return {
            current: await this.monitoring.getCurrentMetrics(),
            historical: await this.monitoring.getHistoricalMetrics(),
            recommendations: await this.optimizer.getCurrentRecommendations()
        };
    }

    async getOptimizationHistory(limit = 10) {
        return this.optimizationHistory
            .slice(-limit)
            .reverse();
    }

    async shutdown() {
        console.log('🛑 Shutting down Database Optimization System...');
        
        try {
            await this.monitoring.stop();
            await this.healthMonitor.stop();
            await this.slowQueryDetector.stop();
            await this.connectionPool.cleanup();
            
            this.isRunning = false;
            this.emit('shutdown');
            console.log('✅ Database Optimization System shutdown complete');
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            throw error;
        }
    }
}

module.exports = DatabaseOptimizer;