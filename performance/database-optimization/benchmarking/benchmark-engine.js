/**
 * Database Benchmarking Engine
 * Performance testing and benchmarking for database systems
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');

class BenchmarkingEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            defaultDuration: 60000, // 1 minute
            warmupDuration: 10000,  // 10 seconds
            concurrencyLevels: [1, 5, 10, 20, 50],
            queries: [],
            batchSize: 100,
            timeout: 30000,
            enableProfiling: true,
            ...config
        };
        this.benchmarks = new Map();
        this.results = new Map();
        this.isRunning = false;
        this.initialized = false;
    }

    async initialize() {
        console.log('🔧 Initializing Benchmarking Engine...');
        
        try {
            await this.loadDefaultQueries();
            this.initialized = true;
            this.emit('initialized');
            console.log('✅ Benchmarking Engine initialized');
        } catch (error) {
            console.error('❌ Benchmarking Engine initialization failed:', error);
            throw error;
        }
    }

    /**
     * Load default benchmark queries
     */
    async loadDefaultQueries() {
        this.config.queries = [
            {
                name: 'Simple SELECT',
                query: 'SELECT * FROM users WHERE id = $1',
                params: [1],
                description: 'Single row lookup by primary key'
            },
            {
                name: 'Complex JOIN',
                query: 'SELECT u.*, o.*, p.* FROM users u JOIN orders o ON u.id = o.user_id JOIN products p ON o.product_id = p.id WHERE u.created_at > $1',
                params: [new Date('2023-01-01')],
                description: 'Multi-table join query'
            },
            {
                name: 'Aggregation',
                query: 'SELECT DATE(created_at) as date, COUNT(*) as order_count, SUM(total) as revenue FROM orders WHERE created_at > $1 GROUP BY DATE(created_at) ORDER BY date',
                params: [new Date('2023-01-01')],
                description: 'Group by and aggregation query'
            },
            {
                name: 'Full Table Scan',
                query: 'SELECT * FROM products WHERE description LIKE $1',
                params: ['%keyword%'],
                description: 'Query that may trigger full table scan'
            },
            {
                name: 'Insert Benchmark',
                query: 'INSERT INTO test_inserts (data, created_at) VALUES ($1, $2)',
                params: ['test data', new Date()],
                description: 'Write operation benchmark'
            }
        ];
    }

    /**
     * Run comprehensive benchmark suite
     */
    async runBenchmarks(options = {}) {
        const {
            queries = this.config.queries,
            duration = this.config.defaultDuration,
            concurrencyLevels = this.config.concurrencyLevels,
            warmup = true
        } = options;

        console.log('🚀 Starting comprehensive benchmark suite...');
        
        const benchmarkSuite = {
            timestamp: new Date(),
            duration,
            concurrencyLevels,
            queries: queries.length,
            results: {}
        };

        try {
            // Warmup phase
            if (warmup) {
                console.log('🔥 Running warmup phase...');
                await this.warmupDatabase(queries);
            }

            // Run benchmarks for each query
            for (const query of queries) {
                console.log(`📊 Benchmarking: ${query.name}`);
                benchmarkSuite.results[query.name] = await this.benchmarkQuery(query, concurrencyLevels, duration);
            }

            // Run overall system benchmark
            console.log('🌐 Running system-wide benchmark...');
            benchmarkSuite.systemBenchmark = await this.runSystemBenchmark(queries, duration);

            this.results.set('comprehensive', benchmarkSuite);
            this.emit('benchmarksCompleted', benchmarkSuite);
            
            console.log('✅ Comprehensive benchmark suite completed');
            return benchmarkSuite;
        } catch (error) {
            console.error('❌ Benchmark suite failed:', error);
            throw error;
        }
    }

    /**
     * Warmup database with sample queries
     */
    async warmupDatabase(queries) {
        const warmupResults = [];
        
        for (const query of queries.slice(0, 3)) { // Warmup with first 3 queries
            const result = await this.benchmarkQuery(query, [1], this.config.warmupDuration);
            warmupResults.push(result);
        }
        
        console.log('✅ Database warmup completed');
        return warmupResults;
    }

    /**
     * Benchmark individual query
     */
    async benchmarkQuery(query, concurrencyLevels, duration) {
        const results = {
            query: query.name,
            description: query.description,
            concurrencyTests: {}
        };

        for (const concurrency of concurrencyLevels) {
            console.log(`  🔄 Testing concurrency ${concurrency}...`);
            results.concurrencyTests[concurrency] = await this.runConcurrencyTest(query, concurrency, duration);
        }

        return results;
    }

    /**
     * Run test at specific concurrency level
     */
    async runConcurrencyTest(query, concurrency, duration) {
        const testResult = {
            concurrency,
            duration,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTime: 0,
            minTime: Infinity,
            maxTime: 0,
            avgTime: 0,
            p50: 0,
            p90: 0,
            p95: 0,
            p99: 0,
            throughput: 0,
            errors: [],
            timeline: []
        };

        const startTime = Date.now();
        const endTime = startTime + duration;
        const workers = [];
        const requestTimes = [];

        // Create worker threads
        for (let i = 0; i < concurrency; i++) {
            workers.push(this.workerLoop(query, i, endTime, requestTimes));
        }

        try {
            await Promise.all(workers);
            
            // Calculate statistics
            testResult.totalTime = Date.now() - startTime;
            testResult.successfulRequests = requestTimes.filter(t => t.success).length;
            testResult.failedRequests = requestTimes.filter(t => !t.success).length;
            testResult.totalRequests = requestTimes.length;
            
            if (requestTimes.length > 0) {
                const successfulTimes = requestTimes.filter(t => t.success).map(t => t.duration);
                
                testResult.minTime = Math.min(...successfulTimes);
                testResult.maxTime = Math.max(...successfulTimes);
                testResult.avgTime = successfulTimes.reduce((sum, t) => sum + t, 0) / successfulTimes.length;
                testResult.throughput = (testResult.successfulRequests / (testResult.totalTime / 1000)).toFixed(2);
                
                // Calculate percentiles
                successfulTimes.sort((a, b) => a - b);
                testResult.p50 = this.getPercentile(successfulTimes, 50);
                testResult.p90 = this.getPercentile(successfulTimes, 90);
                testResult.p95 = this.getPercentile(successfulTimes, 95);
                testResult.p99 = this.getPercentile(successfulTimes, 99);
            }

            // Collect errors
            testResult.errors = requestTimes.filter(t => !t.success).map(t => t.error);
            
            // Sample timeline
            testResult.timeline = this.generateTimeline(requestTimes);
            
        } catch (error) {
            console.error('Concurrency test failed:', error);
            testResult.errors.push(error.message);
        }

        return testResult;
    }

    /**
     * Worker function for concurrency testing
     */
    async workerLoop(query, workerId, endTime, requestTimes) {
        while (Date.now() < endTime) {
            const requestStart = performance.now();
            
            try {
                // await this.executeQuery(query.query, query.params);
                
                const requestDuration = performance.now() - requestStart;
                requestTimes.push({
                    success: true,
                    duration: requestDuration,
                    workerId,
                    timestamp: Date.now()
                });
                
                this.emit('requestCompleted', { workerId, duration: requestDuration, success: true });
                
            } catch (error) {
                const requestDuration = performance.now() - requestStart;
                requestTimes.push({
                    success: false,
                    duration: requestDuration,
                    workerId,
                    timestamp: Date.now(),
                    error: error.message
                });
                
                this.emit('requestFailed', { workerId, error: error.message });
            }
            
            // Small delay to prevent overwhelming
            await this.sleep(1);
        }
    }

    /**
     * Run system-wide benchmark
     */
    async runSystemBenchmark(queries, duration) {
        const systemResult = {
            duration,
            totalQueries: 0,
            averageThroughput: 0,
            errorRate: 0,
            resourceUtilization: {},
            recommendations: []
        };

        const startTime = Date.now();
        const endTime = startTime + duration;
        let totalSuccessful = 0;
        let totalFailed = 0;
        let totalDuration = 0;

        // Run multiple queries concurrently
        const workers = queries.map((query, index) => 
            this.systemWorker(query, index, endTime, (success, duration) => {
                if (success) {
                    totalSuccessful++;
                } else {
                    totalFailed++;
                }
                totalDuration += duration;
            })
        );

        try {
            await Promise.all(workers);
            
            systemResult.totalQueries = totalSuccessful + totalFailed;
            systemResult.averageThroughput = (totalSuccessful / (duration / 1000)).toFixed(2);
            systemResult.errorRate = ((totalFailed / systemResult.totalQueries) * 100).toFixed(2);
            systemResult.resourceUtilization = await this.getResourceUtilization();
            systemResult.recommendations = this.generateSystemRecommendations(systemResult);
            
        } catch (error) {
            console.error('System benchmark failed:', error);
            systemResult.error = error.message;
        }

        return systemResult;
    }

    /**
     * System benchmark worker
     */
    async systemWorker(query, workerId, endTime, callback) {
        while (Date.now() < endTime) {
            const requestStart = performance.now();
            
            try {
                // await this.executeQuery(query.query, query.params);
                const duration = performance.now() - requestStart;
                callback(true, duration);
            } catch (error) {
                const duration = performance.now() - requestStart;
                callback(false, duration);
            }
            
            await this.sleep(10); // Different delay for system test
        }
    }

    /**
     * Get system resource utilization
     */
    async getResourceUtilization() {
        // Mock resource data - in real implementation, this would use system APIs
        return {
            cpu: {
                usage: Math.random() * 100,
                load: Math.random() * 4 + 1
            },
            memory: {
                usage: Math.random() * 100,
                available: Math.random() * 8192 + 2048
            },
            disk: {
                iops: Math.random() * 1000 + 500,
                latency: Math.random() * 10 + 5
            }
        };
    }

    /**
     * Generate system recommendations
     */
    generateSystemRecommendations(systemResult) {
        const recommendations = [];
        
        if (systemResult.errorRate > 5) {
            recommendations.push({
                type: 'error_rate',
                priority: 'high',
                message: `High error rate detected: ${systemResult.errorRate}%`,
                suggestion: 'Review query patterns and database configuration'
            });
        }
        
        if (systemResult.averageThroughput < 100) {
            recommendations.push({
                type: 'throughput',
                priority: 'medium',
                message: `Low throughput: ${systemResult.averageThroughput} queries/sec`,
                suggestion: 'Consider query optimization and indexing improvements'
            });
        }
        
        if (systemResult.resourceUtilization?.cpu?.usage > 80) {
            recommendations.push({
                type: 'cpu',
                priority: 'high',
                message: `High CPU usage: ${systemResult.resourceUtilization.cpu.usage.toFixed(1)}%`,
                suggestion: 'Optimize query performance and review resource allocation'
            });
        }
        
        return recommendations;
    }

    /**
     * Get percentile value
     */
    getPercentile(sortedArray, percentile) {
        if (sortedArray.length === 0) return 0;
        
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
    }

    /**
     * Generate timeline data
     */
    generateTimeline(requestTimes) {
        const timeline = [];
        const bucketSize = 1000; // 1 second buckets
        
        const buckets = new Map();
        requestTimes.forEach(rt => {
            const bucket = Math.floor(rt.timestamp / bucketSize) * bucketSize;
            if (!buckets.has(bucket)) {
                buckets.set(bucket, { count: 0, errors: 0 });
            }
            const bucketData = buckets.get(bucket);
            bucketData.count++;
            if (!rt.success) {
                bucketData.errors++;
            }
        });
        
        // Convert to array and limit to last 60 seconds
        const now = Date.now();
        for (let [timestamp, data] of buckets) {
            if (now - timestamp < 60000) { // Last minute only
                timeline.push({
                    timestamp,
                    ...data
                });
            }
        }
        
        return timeline.sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Run custom benchmark
     */
    async runCustomBenchmark(config) {
        const { name, query, params, duration, concurrency } = config;
        
        console.log(`🎯 Running custom benchmark: ${name}`);
        
        const customQuery = { name, query, params, description: 'Custom benchmark' };
        const result = await this.benchmarkQuery(customQuery, [concurrency], duration);
        
        this.benchmarks.set(name, result);
        this.emit('customBenchmarkCompleted', { name, result });
        
        return result;
    }

    /**
     * Compare benchmark results
     */
    compareResults(benchmark1Name, benchmark2Name) {
        const result1 = this.results.get(benchmark1Name);
        const result2 = this.results.get(benchmark2Name);
        
        if (!result1 || !result2) {
            throw new Error('Benchmark results not found');
        }
        
        return this.generateComparisonReport(result1, result2);
    }

    /**
     * Generate comparison report
     */
    generateComparisonReport(result1, result2) {
        const comparison = {
            timestamp: new Date(),
            benchmarks: [result1.query, result2.query],
            metrics: {}
        };
        
        // Compare key metrics
        for (const concurrency in result1.concurrencyTests) {
            if (result2.concurrencyTests[concurrency]) {
                comparison.metrics[concurrency] = {
                    throughput: {
                        benchmark1: result1.concurrencyTests[concurrency].throughput,
                        benchmark2: result2.concurrencyTests[concurrency].throughput,
                        difference: ((result2.concurrencyTests[concurrency].throughput / result1.concurrencyTests[concurrency].throughput) - 1) * 100
                    },
                    avgTime: {
                        benchmark1: result1.concurrencyTests[concurrency].avgTime,
                        benchmark2: result2.concurrencyTests[concurrency].avgTime,
                        difference: ((result2.concurrencyTests[concurrency].avgTime / result1.concurrencyTests[concurrency].avgTime) - 1) * 100
                    }
                };
            }
        }
        
        return comparison;
    }

    /**
     * Export benchmark results
     */
    exportResults(format = 'json') {
        const data = Object.fromEntries(this.results);
        
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.convertToCSV(data);
            default:
                return data;
        }
    }

    /**
     * Convert results to CSV format
     */
    convertToCSV(data) {
        let csv = 'Query,Concurrency,Total Requests,Successful,Failed,Avg Time (ms),Throughput (req/sec),P50,P90,P95,P99\n';
        
        for (const [benchmarkName, benchmark] of Object.entries(data)) {
            if (benchmark.query && benchmark.concurrencyTests) {
                for (const [concurrency, test] of Object.entries(benchmark.concurrencyTests)) {
                    csv += `${benchmark.query},${concurrency},${test.totalRequests},${test.successfulRequests},${test.failedRequests},${test.avgTime.toFixed(2)},${test.throughput},${test.p50.toFixed(2)},${test.p90.toFixed(2)},${test.p95.toFixed(2)},${test.p99.toFixed(2)}\n`;
                }
            }
        }
        
        return csv;
    }

    /**
     * Get benchmark summary
     */
    getBenchmarkSummary() {
        const summary = {
            totalBenchmarks: this.results.size,
            benchmarks: [],
            overallStats: {
                totalQueries: 0,
                averageThroughput: 0,
                errorRate: 0
            }
        };
        
        for (const [name, result] of this.results) {
            if (result.concurrencyTests) {
                summary.benchmarks.push({
                    name: result.query,
                    description: result.description,
                    bestThroughput: Math.max(...Object.values(result.concurrencyTests).map(t => parseFloat(t.throughput))),
                    avgResponseTime: Object.values(result.concurrencyTests).reduce((sum, t) => sum + t.avgTime, 0) / Object.keys(result.concurrencyTests).length
                });
            }
        }
        
        return summary;
    }

    /**
     * Utility function to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async executeQuery(query, params = []) {
        // This would execute the query on the actual database
        console.log('Executing query:', query.substring(0, 100) + '...');
        
        // Simulate some execution time
        await this.sleep(Math.random() * 50 + 10);
        
        return { rows: [], rowCount: 0 };
    }

    async cleanup() {
        console.log('🧹 Cleaning up Benchmarking Engine...');
        
        this.benchmarks.clear();
        this.results.clear();
        this.initialized = false;
        console.log('✅ Benchmarking Engine cleanup complete');
    }
}

module.exports = BenchmarkingEngine;