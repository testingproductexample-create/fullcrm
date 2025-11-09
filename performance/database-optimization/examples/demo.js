/**
 * Database Optimization System - Example Usage
 * Demonstrates how to use the database optimization system
 */

const DatabaseOptimizer = require('../core/database-optimizer');
const path = require('path');

/**
 * Example 1: Basic Optimization Setup
 */
async function basicOptimizationExample() {
    console.log('🔧 Example 1: Basic Database Optimization');
    
    const config = {
        database: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'postgres',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'password'
        },
        monitoring: {
            enableAlerts: true,
            alertThresholds: {
                cpu: 80,
                memory: 85,
                slowQueries: 5
            }
        }
    };
    
    try {
        // Initialize the optimizer
        const optimizer = new DatabaseOptimizer(config);
        await optimizer.initialize();
        console.log('✅ Optimizer initialized');
        
        // Get current performance metrics
        const metrics = await optimizer.getPerformanceMetrics();
        console.log('📊 Current metrics:', metrics);
        
        // Perform optimization
        const result = await optimizer.optimizeDatabase();
        console.log('🚀 Optimization result:', result);
        
        // Shutdown
        await optimizer.shutdown();
        console.log('✅ Basic optimization example completed');
        
    } catch (error) {
        console.error('❌ Basic optimization failed:', error);
    }
}

/**
 * Example 2: Sharded Database Setup
 */
async function shardedDatabaseExample() {
    console.log('🔧 Example 2: Sharded Database Setup');
    
    const config = {
        database: {
            host: 'localhost',
            port: 5432,
            database: 'main_db',
            user: 'postgres',
            password: 'password'
        },
        sharding: {
            strategy: 'hash',
            shardKey: 'user_id',
            shardCount: 4,
            shards: {
                '0': {
                    host: 'localhost',
                    port: 5432,
                    database: 'shard_0',
                    user: 'postgres',
                    password: 'password'
                },
                '1': {
                    host: 'localhost',
                    port: 5432,
                    database: 'shard_1',
                    user: 'postgres',
                    password: 'password'
                },
                '2': {
                    host: 'localhost',
                    port: 5432,
                    database: 'shard_2',
                    user: 'postgres',
                    password: 'password'
                },
                '3': {
                    host: 'localhost',
                    port: 5432,
                    database: 'shard_3',
                    user: 'postgres',
                    password: 'password'
                }
            }
        }
    };
    
    try {
        const optimizer = new DatabaseOptimizer(config);
        await optimizer.initialize();
        
        // Execute query on specific shard
        const userId = 12345;
        const result = await optimizer.sharding.query(
            'SELECT * FROM users WHERE user_id = $1',
            [userId],
            { shardKey: userId }
        );
        
        console.log('📊 Query result from shard:', result);
        
        // Get shard statistics
        const shardStats = optimizer.sharding.getShardStats();
        console.log('📈 Shard statistics:', shardStats);
        
        await optimizer.shutdown();
        console.log('✅ Sharded database example completed');
        
    } catch (error) {
        console.error('❌ Sharded database example failed:', error);
    }
}

/**
 * Example 3: Query Analysis and Optimization
 */
async function queryAnalysisExample() {
    console.log('🔧 Example 3: Query Analysis and Optimization');
    
    const config = {
        queryAnalysis: {
            slowQueryThreshold: 1000, // 1 second
            analyzeThreshold: 100
        },
        indexing: {
            autoCreateIndexes: true,
            analyzeThreshold: 100
        }
    };
    
    try {
        const optimizer = new DatabaseOptimizer(config);
        await optimizer.initialize();
        
        // Analyze recent queries
        const analysis = await optimizer.queryAnalyzer.analyzeRecentQueries();
        console.log('🔍 Query analysis:', analysis);
        
        // Get slow queries
        const slowQueries = optimizer.slowQueryDetector.getTopSlowQueries(10);
        console.log('🐌 Slow queries:', slowQueries);
        
        // Optimize indexes
        const indexResult = await optimizer.indexing.optimizeIndexes();
        console.log('📊 Index optimization:', indexResult);
        
        await optimizer.shutdown();
        console.log('✅ Query analysis example completed');
        
    } catch (error) {
        console.error('❌ Query analysis example failed:', error);
    }
}

/**
 * Example 4: Health Monitoring
 */
async function healthMonitoringExample() {
    console.log('🔧 Example 4: Health Monitoring');
    
    const config = {
        healthMonitoring: {
            checkInterval: 30000, // 30 seconds
            enableAutoRemediation: false,
            healthThresholds: {
                cpu: 80,
                memory: 85,
                disk: 90,
                connections: 90
            }
        }
    };
    
    try {
        const optimizer = new DatabaseOptimizer(config);
        await optimizer.initialize();
        
        // Perform health check
        const health = await optimizer.performHealthCheck();
        console.log('🩺 Health check result:', health);
        
        // Get health trends
        const trends = optimizer.healthMonitor.getHealthTrends();
        console.log('📈 Health trends:', trends);
        
        await optimizer.shutdown();
        console.log('✅ Health monitoring example completed');
        
    } catch (error) {
        console.error('❌ Health monitoring example failed:', error);
    }
}

/**
 * Example 5: Performance Benchmarking
 */
async function benchmarkingExample() {
    console.log('🔧 Example 5: Performance Benchmarking');
    
    const config = {
        benchmarking: {
            defaultDuration: 30000, // 30 seconds
            concurrencyLevels: [1, 5, 10],
            warmupDuration: 5000 // 5 seconds
        }
    };
    
    try {
        const optimizer = new DatabaseOptimizer(config);
        await optimizer.initialize();
        
        // Run comprehensive benchmark
        const benchmark = await optimizer.benchmarking.runBenchmarks({
            duration: 30000,
            concurrencyLevels: [1, 5, 10]
        });
        console.log('🏃 Benchmark results:', benchmark);
        
        // Run custom benchmark
        const customBenchmark = await optimizer.benchmarking.runCustomBenchmark({
            name: 'User Lookup Test',
            query: 'SELECT * FROM users WHERE email = $1',
            params: ['user@example.com'],
            duration: 10000,
            concurrency: 5
        });
        console.log('🎯 Custom benchmark:', customBenchmark);
        
        // Get benchmark summary
        const summary = optimizer.benchmarking.getBenchmarkSummary();
        console.log('📊 Benchmark summary:', summary);
        
        await optimizer.shutdown();
        console.log('✅ Benchmarking example completed');
        
    } catch (error) {
        console.error('❌ Benchmarking example failed:', error);
    }
}

/**
 * Example 6: Automated Recommendations
 */
async function recommendationsExample() {
    console.log('🔧 Example 6: Automated Optimization Recommendations');
    
    const config = {
        optimization: {
            maxRecommendations: 20,
            minImpactScore: 25,
            autoApply: false
        }
    };
    
    try {
        const optimizer = new DatabaseOptimizer(config);
        await optimizer.initialize();
        
        // Run optimization to generate recommendations
        const optimizationResult = await optimizer.optimizeDatabase();
        
        // Get current recommendations
        const recommendations = optimizer.optimizer.getCurrentRecommendations();
        console.log('💡 Current recommendations:', recommendations);
        
        // Apply high-priority recommendations
        const highPriorityRecs = recommendations.filter(r => r.priority === 'high');
        if (highPriorityRecs.length > 0) {
            const applyResult = await optimizer.optimizer.applyRecommendations(
                highPriorityRecs, 
                { dryRun: true } // Use dryRun for safety
            );
            console.log('🎯 Apply result:', applyResult);
        }
        
        await optimizer.shutdown();
        console.log('✅ Recommendations example completed');
        
    } catch (error) {
        console.error('❌ Recommendations example failed:', error);
    }
}

/**
 * Example 7: Admin Interface Integration
 */
async function adminInterfaceExample() {
    console.log('🔧 Example 7: Admin Interface Integration');
    
    const config = {
        adminInterface: {
            port: 3001,
            host: 'localhost',
            apiKey: 'demo-api-key'
        }
    };
    
    try {
        const optimizer = new DatabaseOptimizer(config);
        await optimizer.initialize();
        
        const adminInterface = require('../admin-interface/admin-server');
        const adminServer = new adminInterface(optimizer, config.adminInterface);
        
        await adminServer.initialize();
        console.log('🌐 Admin interface started at http://localhost:3001');
        console.log('🔑 API Key:', config.adminInterface.apiKey);
        
        // The admin interface will run until manually stopped
        console.log('💡 Open your browser to http://localhost:3001 to access the dashboard');
        
        // Wait for a while (in real usage, this would be your application logic)
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        await adminServer.shutdown();
        await optimizer.shutdown();
        console.log('✅ Admin interface example completed');
        
    } catch (error) {
        console.error('❌ Admin interface example failed:', error);
    }
}

/**
 * Main function to run examples
 */
async function main() {
    console.log('🚀 Database Optimization System - Examples');
    console.log('=' .repeat(50));
    
    const examples = [
        { name: 'Basic Optimization', fn: basicOptimizationExample },
        { name: 'Sharded Database', fn: shardedDatabaseExample },
        { name: 'Query Analysis', fn: queryAnalysisExample },
        { name: 'Health Monitoring', fn: healthMonitoringExample },
        { name: 'Performance Benchmarking', fn: benchmarkingExample },
        { name: 'Automated Recommendations', fn: recommendationsExample },
        { name: 'Admin Interface', fn: adminInterfaceExample }
    ];
    
    // Run all examples
    for (const example of examples) {
        try {
            console.log(`\n🔄 Running ${example.name}...`);
            await example.fn();
            console.log(`✅ ${example.name} completed successfully`);
        } catch (error) {
            console.error(`❌ ${example.name} failed:`, error.message);
        }
        
        console.log('-' .repeat(50));
    }
    
    console.log('🎉 All examples completed!');
    console.log('💡 Check the README.md for more detailed information');
}

// Run examples if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    basicOptimizationExample,
    shardedDatabaseExample,
    queryAnalysisExample,
    healthMonitoringExample,
    benchmarkingExample,
    recommendationsExample,
    adminInterfaceExample
};