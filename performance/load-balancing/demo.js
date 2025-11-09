/**
 * Load Balancing & Auto-Scaling System Demo
 * 
 * This script demonstrates the key features and capabilities
 * of the load balancing and auto-scaling system.
 */

const LoadBalancingSystem = require('./index');

class SystemDemo {
    constructor() {
        this.system = null;
        this.demoServices = [];
    }

    async initialize() {
        console.log('🚀 Initializing Load Balancing & Auto-Scaling System Demo...\n');
        
        // Create system instance
        this.system = new LoadBalancingSystem({
            port: 3001,
            loadBalancer: {
                algorithm: 'round-robin',
                healthCheckInterval: 30000
            },
            scaling: {
                minInstances: 2,
                maxInstances: 50,
                scaleUpCooldown: 300000,
                scaleDownCooldown: 600000
            },
            monitoring: {
                metricsInterval: 60000,
                alertThresholds: {
                    cpu: 80,
                    memory: 85,
                    responseTime: 5000,
                    errorRate: 5
                }
            }
        });

        // Start the system
        await this.system.start();
        console.log('✅ System started successfully\n');
    }

    async runDemo() {
        try {
            console.log('🎬 Starting Load Balancing & Auto-Scaling System Demo\n');
            console.log('=' .repeat(60));

            // Demo 1: Load Balancer Setup
            await this.demoLoadBalancer();
            
            // Demo 2: Auto-Scaling Policies
            await this.demoAutoScaling();
            
            // Demo 3: Health Monitoring
            await this.demoHealthMonitoring();
            
            // Demo 4: Deployment Management
            await this.demoDeployment();
            
            // Demo 5: Disaster Recovery
            await this.demoDisasterRecovery();
            
            // Demo 6: Monitoring Dashboard
            await this.demoMonitoring();

            console.log('\n' + '='.repeat(60));
            console.log('🎉 Demo completed successfully!');
            console.log('\n📊 Access the management dashboard at:');
            console.log('   http://localhost:3001/dashboard');
            console.log('\n🔍 API documentation available at:');
            console.log('   http://localhost:3001/api/');
            
        } catch (error) {
            console.error('❌ Demo failed:', error);
        }
    }

    async demoLoadBalancer() {
        console.log('\n📋 Demo 1: Load Balancer Setup');
        console.log('-'.repeat(40));

        // Add backend services
        const backends = [
            { id: 'api-1', name: 'API Server 1', host: '192.168.1.10', port: 8080, weight: 1 },
            { id: 'api-2', name: 'API Server 2', host: '192.168.1.11', port: 8080, weight: 1 },
            { id: 'api-3', name: 'API Server 3', host: '192.168.1.12', port: 8080, weight: 2 }
        ];

        for (const backend of backends) {
            await this.system.addBackend(backend);
            this.demoServices.push(backend.id);
            console.log(`✅ Added backend: ${backend.name} (${backend.host}:${backend.port})`);
        }

        // Display load balancer status
        const lbStatus = this.system.loadBalancer.getState();
        console.log(`\n📊 Load Balancer Status:`);
        console.log(`   - Total backends: ${lbStatus.backends.length}`);
        console.log(`   - Healthy backends: ${lbStatus.healthyBackends.length}`);
        console.log(`   - Algorithm: ${lbStatus.config.algorithm}`);

        await this.wait(2000);
    }

    async demoAutoScaling() {
        console.log('\n📈 Demo 2: Auto-Scaling Policies');
        console.log('-'.repeat(40));

        // Create scaling policies for each service
        for (const serviceId of this.demoServices) {
            const policy = {
                serviceId: serviceId,
                cpuUtilization: 70,
                memoryUtilization: 80,
                requestsPerInstance: 1000,
                minInstances: 2,
                maxInstances: 20,
                increaseBy: 2,
                decreaseBy: 1,
                scaleUpConditions: [
                    { metric: 'cpu', threshold: 70, duration: 300000 },
                    { metric: 'memory', threshold: 80, duration: 300000 }
                ],
                scaleDownConditions: [
                    { metric: 'cpu', threshold: 30, duration: 600000 },
                    { metric: 'memory', threshold: 40, duration: 600000 }
                ]
            };

            await this.system.scalingManager.createScalingPolicy(serviceId, policy);
            console.log(`✅ Created scaling policy for ${serviceId}`);
        }

        // Display scaling policies
        const scalingState = this.system.scalingManager.getState();
        console.log(`\n📊 Scaling Configuration:`);
        console.log(`   - Total policies: ${scalingState.policies.length}`);
        console.log(`   - Min instances: ${this.system.scalingManager.config.minInstances}`);
        console.log(`   - Max instances: ${this.system.scalingManager.config.maxInstances}`);

        // Simulate scaling event
        console.log(`\n🔄 Simulating scale-up event...`);
        const scaleResult = await this.system.scaleService('api-1', 5);
        console.log(`   Scale result: ${scaleResult.success ? 'Success' : 'Failed'}`);

        await this.wait(2000);
    }

    async demoHealthMonitoring() {
        console.log('\n🔍 Demo 3: Health Monitoring');
        console.log('-'.repeat(40));

        // Register services for health monitoring
        const healthServices = [
            {
                id: 'api-1',
                name: 'API Server 1 Health',
                type: 'http',
                url: 'http://192.168.1.10:8080/health',
                method: 'GET',
                interval: 30000,
                timeout: 10000,
                critical: true
            },
            {
                id: 'api-2',
                name: 'API Server 2 Health',
                type: 'http',
                url: 'http://192.168.1.11:8080/health',
                method: 'GET',
                interval: 30000,
                timeout: 10000,
                critical: true
            },
            {
                id: 'database',
                name: 'Database Health',
                type: 'tcp',
                host: '192.168.1.20',
                port: 5432,
                interval: 60000,
                critical: true
            }
        ];

        for (const service of healthServices) {
            await this.system.healthMonitor.registerService(service);
            console.log(`✅ Registered health check: ${service.name}`);
        }

        // Perform health check
        console.log('\n🔄 Performing health checks...');
        const healthStatus = await this.system.getHealthStatus();
        console.log(`📊 Health Status:`);
        console.log(`   - Total services: ${Object.keys(healthStatus).length}`);
        console.log(`   - Healthy services: ${Object.values(healthStatus).filter(h => h.healthy).length}`);

        await this.wait(2000);
    }

    async demoDeployment() {
        console.log('\n🚀 Demo 4: Deployment Management');
        console.log('-'.repeat(40));

        // Demo blue-green deployment
        const blueGreenDeployment = {
            serviceName: 'web-app',
            version: '2.0.0',
            strategy: 'blue-green',
            environment: 'production',
            config: {
                image: 'myapp:2.0.0',
                tag: '2.0.0',
                replicas: 3,
                resources: {
                    cpu: '500m',
                    memory: '512Mi'
                },
                environmentVars: {
                    'ENV': 'production',
                    'VERSION': '2.0.0'
                },
                healthCheck: {
                    path: '/health',
                    port: 8080,
                    initialDelaySeconds: 30
                }
            },
            metadata: {
                author: 'demo-system',
                branch: 'main',
                commit: 'abc123'
            }
        };

        console.log('🔄 Starting blue-green deployment...');
        const deployResult = await this.system.deployService(blueGreenDeployment);
        console.log(`   Deployment status: ${deployResult.success ? 'Started' : 'Failed'}`);

        // Demo canary deployment
        const canaryDeployment = {
            serviceName: 'api-service',
            version: '1.5.0',
            strategy: 'canary',
            environment: 'production',
            config: {
                image: 'api:1.5.0',
                replicas: 10,
                canaryPercentage: 10
            }
        };

        console.log('🔄 Starting canary deployment...');
        const canaryResult = await this.system.deployService(canaryDeployment);
        console.log(`   Canary deployment: ${canaryResult.success ? 'Started' : 'Failed'}`);

        // Display deployment status
        const deploymentState = this.system.deploymentManager.getState();
        console.log(`\n📊 Deployment Status:`);
        console.log(`   - Active deployments: ${deploymentState.activeDeployments.length}`);
        console.log(`   - Total deployments: ${deploymentState.deployments.length}`);

        await this.wait(2000);
    }

    async demoDisasterRecovery() {
        console.log('\n🆘 Demo 5: Disaster Recovery');
        console.log('-'.repeat(40));

        // Create recovery plan
        const recoveryPlan = {
            name: 'Primary Region DR Plan',
            description: 'Disaster recovery plan for primary region failure',
            type: 'disaster-recovery',
            priority: 'critical',
            services: ['api-1', 'api-2', 'api-3', 'web-app'],
            primaryRegion: 'us-east-1',
            backupRegion: 'us-west-2',
            procedures: {
                detection: [
                    { name: 'Detect outage', type: 'notification', critical: true, estimatedDuration: 60000 }
                ],
                failover: [
                    { name: 'Switch DNS', type: 'service-failover', critical: true, estimatedDuration: 120000 },
                    { name: 'Update load balancer', type: 'infrastructure-failover', critical: true, estimatedDuration: 60000 }
                ],
                recovery: [
                    { name: 'Scale up services', type: 'service-failover', critical: true, estimatedDuration: 300000 },
                    { name: 'Validate services', type: 'validation', critical: true, estimatedDuration: 180000 }
                ],
                rollback: [
                    { name: 'Rollback to primary', type: 'service-failover', critical: false, estimatedDuration: 240000 }
                ]
            },
            estimatedDowntime: 600000
        };

        const plan = await this.system.disasterRecovery.createRecoveryPlan(recoveryPlan);
        console.log(`✅ Created recovery plan: ${plan.name}`);

        // Create backup job
        const backupJob = {
            name: 'Daily Full Backup',
            type: 'full',
            scope: 'all',
            frequency: 'daily',
            time: '02:00',
            retention: 30
        };

        const job = await this.system.disasterRecovery.scheduleBackup(backupJob);
        console.log(`✅ Scheduled backup job: ${job.name}`);

        // Display recovery metrics
        const recoveryMetrics = this.system.disasterRecovery.getMetrics();
        console.log(`\n📊 Disaster Recovery Status:`);
        console.log(`   - Recovery plans: ${recoveryMetrics.totalRecoveryPlans}`);
        console.log(`   - Backup jobs: ${recoveryMetrics.activeBackupJobs}`);
        console.log(`   - Recovery points: ${recoveryMetrics.recoveryPointsAvailable}`);

        await this.wait(2000);
    }

    async demoMonitoring() {
        console.log('\n📊 Demo 6: Monitoring & Dashboard');
        console.log('-'.repeat(40));

        // Get current metrics
        const metrics = await this.system.getMetrics();
        console.log('📈 Current System Metrics:');
        console.log(`   - CPU Usage: ${metrics.system?.cpu?.usage?.toFixed(1) || 'N/A'}%`);
        console.log(`   - Memory Usage: ${metrics.system?.memory?.usage?.toFixed(1) || 'N/A'}%`);
        console.log(`   - Load Average: ${metrics.system?.cpu?.loadAverage?.['1min']?.toFixed(2) || 'N/A'}`);

        // Get health metrics
        const health = await this.system.getHealthStatus();
        console.log(`\n🔍 Health Metrics:`);
        console.log(`   - Total services: ${Object.keys(health).length}`);
        console.log(`   - Healthy services: ${Object.values(health).filter(h => h.healthy).length}`);

        // Create custom dashboard
        const dashboard = await this.system.monitoringService.createDashboard({
            name: 'Demo Dashboard',
            description: 'System overview dashboard',
            widgets: [
                { type: 'metric', title: 'System Health' },
                { type: 'chart', title: 'Request Rate' },
                { type: 'alert', title: 'Active Alerts' }
            ]
        });
        console.log(`✅ Created dashboard: ${dashboard.name}`);

        // Display monitoring configuration
        const monitoringMetrics = this.system.monitoringService.getMetrics();
        console.log(`\n📊 Monitoring Status:`);
        console.log(`   - Active monitoring: ${monitoringMetrics.activeMonitoring}`);
        console.log(`   - Data points: ${monitoringMetrics.dataPointsCount}`);
        console.log(`   - Active alerts: ${monitoringMetrics.alertsCount}`);
        console.log(`   - Dashboards: ${monitoringMetrics.dashboardsCount}`);

        await this.wait(2000);
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async cleanup() {
        if (this.system) {
            console.log('\n🛑 Cleaning up demo environment...');
            await this.system.shutdown();
        }
    }
}

// Main execution
async function main() {
    const demo = new SystemDemo();
    
    process.on('SIGINT', async () => {
        console.log('\n⚠️ Demo interrupted');
        await demo.cleanup();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n⚠️ Demo terminated');
        await demo.cleanup();
        process.exit(0);
    });

    try {
        await demo.initialize();
        await demo.runDemo();
        
        console.log('\n✅ Demo completed successfully!');
        console.log('\nPress Ctrl+C to stop the system...\n');
        
        // Keep the system running for demonstration
        setInterval(() => {
            console.log(`💓 System heartbeat: ${new Date().toISOString()}`);
        }, 30000);
        
    } catch (error) {
        console.error('❌ Demo failed:', error);
        await demo.cleanup();
        process.exit(1);
    }
}

// Run demo if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = SystemDemo;