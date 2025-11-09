/**
 * Auto-Scaling Policy Manager
 * 
 * Handles horizontal scaling strategies, auto-scaling policies,
 * scaling decisions, and instance management.
 */

const EventEmitter = require('events');

class ScalingManager extends EventEmitter {
    constructor(config) {
        super();
        this.config = {
            minInstances: config.minInstances || 2,
            maxInstances: config.maxInstances || 100,
            scaleUpCooldown: config.scaleUpCooldown || 300000, // 5 minutes
            scaleDownCooldown: config.scaleDownCooldown || 600000, // 10 minutes
            defaultMetrics: {
                cpu: { threshold: 70, period: 300000 },
                memory: { threshold: 80, period: 300000 },
                requests: { threshold: 1000, period: 300000 },
                latency: { threshold: 1000, period: 300000 }
            },
            policies: new Map(),
            instances: new Map(),
            scalingHistory: [],
            cooldownPeriods: new Map(),
            ...config
        };

        this.scalingEngine = null;
        this.resourceManager = null;
        this.orchestrator = null;
    }

    async initialize() {
        try {
            // Initialize scaling engine
            await this.initializeScalingEngine();
            
            // Initialize resource manager
            await this.initializeResourceManager();
            
            // Load existing scaling policies
            await this.loadScalingPolicies();
            
            // Start scaling monitoring
            this.startScalingMonitoring();
            
            console.log('✅ Scaling Manager initialized');
        } catch (error) {
            console.error('❌ Scaling Manager initialization failed:', error);
            throw error;
        }
    }

    async initializeScalingEngine() {
        this.scalingEngine = new AutoScalingEngine(this.config);
        await this.scalingEngine.initialize();
    }

    async initializeResourceManager() {
        this.resourceManager = new ResourceManager();
        await this.resourceManager.initialize();
    }

    // Scaling Policy Management
    async createScalingPolicy(serviceId, policy) {
        try {
            const scalingPolicy = {
                id: `policy_${serviceId}_${Date.now()}`,
                serviceId,
                enabled: true,
                targetUtilization: {
                    cpu: policy.cpuUtilization || 70,
                    memory: policy.memoryUtilization || 80,
                    requests: policy.requestsPerInstance || 1000,
                    latency: policy.maxLatency || 1000
                },
                scalingRules: {
                    scaleUp: {
                        conditions: policy.scaleUpConditions || [
                            { metric: 'cpu', threshold: 70, duration: 300000 },
                            { metric: 'memory', threshold: 80, duration: 300000 }
                        ],
                        actions: {
                            increaseBy: policy.increaseBy || 2,
                            maxInstances: policy.maxInstances || this.config.maxInstances
                        }
                    },
                    scaleDown: {
                        conditions: policy.scaleDownConditions || [
                            { metric: 'cpu', threshold: 30, duration: 600000 },
                            { metric: 'memory', threshold: 40, duration: 600000 }
                        ],
                        actions: {
                            decreaseBy: policy.decreaseBy || 1,
                            minInstances: policy.minInstances || this.config.minInstances
                        }
                    }
                },
                preScalingChecks: policy.preScalingChecks || [],
                postScalingActions: policy.postScalingActions || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...policy
            };

            this.config.policies.set(serviceId, scalingPolicy);
            await this.saveScalingPolicy(scalingPolicy);
            
            this.emit('policyCreated', scalingPolicy);
            console.log(`📋 Scaling policy created for service: ${serviceId}`);

            return scalingPolicy;
        } catch (error) {
            console.error(`❌ Failed to create scaling policy for ${serviceId}:`, error);
            throw error;
        }
    }

    async updateScalingPolicy(serviceId, updates) {
        try {
            const policy = this.config.policies.get(serviceId);
            if (!policy) {
                throw new Error(`Scaling policy for service ${serviceId} not found`);
            }

            Object.assign(policy, updates, {
                updatedAt: new Date().toISOString()
            });

            this.config.policies.set(serviceId, policy);
            await this.saveScalingPolicy(policy);
            
            this.emit('policyUpdated', policy);
            console.log(`🔄 Scaling policy updated for service: ${serviceId}`);

            return policy;
        } catch (error) {
            console.error(`❌ Failed to update scaling policy for ${serviceId}:`, error);
            throw error;
        }
    }

    async deleteScalingPolicy(serviceId) {
        try {
            const policy = this.config.policies.get(serviceId);
            if (!policy) {
                throw new Error(`Scaling policy for service ${serviceId} not found`);
            }

            this.config.policies.delete(serviceId);
            await this.deleteScalingPolicyFile(serviceId);
            
            this.emit('policyDeleted', { serviceId, policy });
            console.log(`🗑️ Scaling policy deleted for service: ${serviceId}`);

            return true;
        } catch (error) {
            console.error(`❌ Failed to delete scaling policy for ${serviceId}:`, error);
            throw error;
        }
    }

    // Scaling Execution
    async evaluateScalingConditions(metrics) {
        const scalingDecisions = [];

        for (const [serviceId, policy] of this.config.policies) {
            try {
                const decision = await this.evaluateServiceScaling(serviceId, policy, metrics[serviceId]);
                if (decision) {
                    scalingDecisions.push(decision);
                }
            } catch (error) {
                console.error(`❌ Error evaluating scaling for ${serviceId}:`, error);
            }
        }

        return scalingDecisions;
    }

    async evaluateServiceScaling(serviceId, policy, metrics) {
        if (!policy.enabled || !metrics) {
            return null;
        }

        const currentInstances = await this.getCurrentInstanceCount(serviceId);
        const decision = {
            serviceId,
            policy: policy.id,
            shouldScale: false,
            direction: null,
            targetInstances: currentInstances,
            reason: [],
            confidence: 0
        };

        // Check scale up conditions
        const scaleUpDecision = await this.checkScaleUpConditions(serviceId, policy, metrics, currentInstances);
        if (scaleUpDecision.shouldScale) {
            decision.shouldScale = true;
            decision.direction = 'up';
            decision.targetInstances = scaleUpDecision.targetInstances;
            decision.reason = scaleUpDecision.reason;
            decision.confidence = scaleUpDecision.confidence;
            return decision;
        }

        // Check scale down conditions
        const scaleDownDecision = await this.checkScaleDownConditions(serviceId, policy, metrics, currentInstances);
        if (scaleDownDecision.shouldScale) {
            decision.shouldScale = true;
            decision.direction = 'down';
            decision.targetInstances = scaleDownDecision.targetInstances;
            decision.reason = scaleDownDecision.reason;
            decision.confidence = scaleDownDecision.confidence;
            return decision;
        }

        return decision;
    }

    async checkScaleUpConditions(serviceId, policy, metrics, currentInstances) {
        const decision = {
            shouldScale: false,
            targetInstances: currentInstances,
            reason: [],
            confidence: 0
        };

        // Check cooldown period
        if (this.isInCooldown(serviceId, 'up')) {
            return decision;
        }

        // Check if we can scale up (respect max instances)
        if (currentInstances >= policy.scalingRules.scaleUp.actions.maxInstances) {
            return decision;
        }

        let score = 0;
        let conditionsMet = 0;

        // Check each scale up condition
        for (const condition of policy.scalingRules.scaleUp.conditions) {
            const metric = metrics[condition.metric];
            
            if (metric && this.isConditionMet(metric, condition)) {
                conditionsMet++;
                score += this.calculateConditionScore(metric, condition, 'up');
                
                decision.reason.push(`${condition.metric} at ${metric.value}${metric.unit} (threshold: ${condition.threshold}${condition.unit || ''})`);
            }
        }

        // Scale up if majority of conditions are met
        if (conditionsMet >= policy.scalingRules.scaleUp.conditions.length * 0.5) {
            decision.shouldScale = true;
            decision.targetInstances = Math.min(
                currentInstances + policy.scalingRules.scaleUp.actions.increaseBy,
                policy.scalingRules.scaleUp.actions.maxInstances
            );
            decision.confidence = score / conditionsMet;
        }

        return decision;
    }

    async checkScaleDownConditions(serviceId, policy, metrics, currentInstances) {
        const decision = {
            shouldScale: false,
            targetInstances: currentInstances,
            reason: [],
            confidence: 0
        };

        // Check cooldown period
        if (this.isInCooldown(serviceId, 'down')) {
            return decision;
        }

        // Check if we can scale down (respect min instances)
        if (currentInstances <= policy.scalingRules.scaleDown.actions.minInstances) {
            return decision;
        }

        let score = 0;
        let conditionsMet = 0;

        // Check each scale down condition
        for (const condition of policy.scalingRules.scaleDown.conditions) {
            const metric = metrics[condition.metric];
            
            if (metric && this.isConditionMet(metric, condition)) {
                conditionsMet++;
                score += this.calculateConditionScore(metric, condition, 'down');
                
                decision.reason.push(`${condition.metric} at ${metric.value}${metric.unit} (below threshold: ${condition.threshold}${condition.unit || ''})`);
            }
        }

        // Scale down if majority of conditions are met and load is consistently low
        if (conditionsMet >= policy.scalingRules.scaleDown.conditions.length * 0.7) {
            decision.shouldScale = true;
            decision.targetInstances = Math.max(
                currentInstances - policy.scalingRules.scaleDown.actions.decreaseBy,
                policy.scalingRules.scaleDown.actions.minInstances
            );
            decision.confidence = score / conditionsMet;
        }

        return decision;
    }

    isConditionMet(metric, condition) {
        const value = metric.value;
        const threshold = condition.threshold;
        
        if (condition.duration && metric.duration) {
            return metric.duration >= condition.duration && 
                   (value >= threshold || (condition.direction === 'below' && value <= threshold));
        }
        
        return value >= threshold || (condition.direction === 'below' && value <= threshold);
    }

    calculateConditionScore(metric, condition, direction) {
        const value = metric.value;
        const threshold = condition.threshold;
        
        if (direction === 'up') {
            return Math.min(100, ((value - threshold) / threshold) * 100);
        } else {
            return Math.min(100, ((threshold - value) / threshold) * 100);
        }
    }

    isInCooldown(serviceId, direction) {
        const cooldownKey = `${serviceId}_${direction}`;
        const lastScaling = this.config.cooldownPeriods.get(cooldownKey);
        
        if (!lastScaling) {
            return false;
        }

        const cooldownTime = direction === 'up' ? this.config.scaleUpCooldown : this.config.scaleDownCooldown;
        const timeSinceLastScaling = Date.now() - lastScaling;
        
        return timeSinceLastScaling < cooldownTime;
    }

    async executeScaling(decision) {
        try {
            // Pre-scaling checks
            const preScalingResult = await this.runPreScalingChecks(decision);
            if (!preScalingResult.allowed) {
                console.warn(`⚠️ Pre-scaling checks failed for ${decision.serviceId}: ${preScalingResult.reason}`);
                return false;
            }

            // Execute scaling
            const scalingResult = await this.performScaling(decision);
            
            if (scalingResult.success) {
                // Update cooldown
                this.setCooldown(decision.serviceId, decision.direction);
                
                // Record scaling event
                this.recordScalingEvent(decision, scalingResult);
                
                // Post-scaling actions
                await this.runPostScalingActions(decision, scalingResult);
                
                this.emit('scalingExecuted', { decision, result: scalingResult });
                console.log(`🔄 Scaling executed for ${decision.serviceId}: ${decision.direction} to ${decision.targetInstances} instances`);
                
                return true;
            } else {
                console.error(`❌ Scaling failed for ${decision.serviceId}: ${scalingResult.error}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error executing scaling for ${decision.serviceId}:`, error);
            return false;
        }
    }

    async performScaling(decision) {
        try {
            const currentInstances = await this.getCurrentInstanceCount(decision.serviceId);
            const targetInstances = decision.targetInstances;
            
            if (targetInstances > currentInstances) {
                return await this.scaleUp(decision.serviceId, targetInstances);
            } else if (targetInstances < currentInstances) {
                return await this.scaleDown(decision.serviceId, targetInstances);
            } else {
                return {
                    success: true,
                    message: 'No scaling needed',
                    instances: currentInstances
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async scaleUp(serviceId, targetInstances) {
        try {
            const currentInstances = await this.getCurrentInstanceCount(serviceId);
            const instancesToAdd = targetInstances - currentInstances;
            
            const results = [];
            
            for (let i = 0; i < instancesToAdd; i++) {
                try {
                    const instance = await this.resourceManager.createInstance(serviceId);
                    results.push(instance);
                    this.config.instances.set(instance.id, instance);
                } catch (error) {
                    console.error(`❌ Failed to create instance ${i + 1}/${instancesToAdd}:`, error);
                }
            }
            
            return {
                success: results.length === instancesToAdd,
                instancesCreated: results.length,
                targetInstances,
                instances: results,
                error: results.length < instancesToAdd ? 'Some instances failed to create' : null
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async scaleDown(serviceId, targetInstances) {
        try {
            const currentInstances = await this.getCurrentInstanceCount(serviceId);
            const instancesToRemove = currentInstances - targetInstances;
            
            // Get instances ordered by least recent usage for graceful shutdown
            const instances = await this.getInstancesForService(serviceId);
            const instancesToTerminate = instances
                .sort((a, b) => (a.lastUsed || 0) - (b.lastUsed || 0))
                .slice(0, instancesToRemove);
            
            const results = [];
            
            for (const instance of instancesToTerminate) {
                try {
                    // Gracefully shutdown instance
                    await this.gracefulInstanceShutdown(instance);
                    await this.resourceManager.terminateInstance(instance.id);
                    this.config.instances.delete(instance.id);
                    results.push(instance.id);
                } catch (error) {
                    console.error(`❌ Failed to terminate instance ${instance.id}:`, error);
                }
            }
            
            return {
                success: results.length === instancesToRemove,
                instancesTerminated: results.length,
                targetInstances,
                terminatedInstances: results,
                error: results.length < instancesToRemove ? 'Some instances failed to terminate' : null
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async gracefulInstanceShutdown(instance) {
        // Send SIGTERM for graceful shutdown
        // Wait for application to shut down gracefully
        // After timeout, send SIGKILL if still running
        console.log(`🛑 Gracefully shutting down instance ${instance.id}...`);
    }

    // Helper methods
    async getCurrentInstanceCount(serviceId) {
        const instances = await this.getInstancesForService(serviceId);
        return instances.length;
    }

    async getInstancesForService(serviceId) {
        return Array.from(this.config.instances.values())
            .filter(instance => instance.serviceId === serviceId);
    }

    // Pre and Post scaling hooks
    async runPreScalingChecks(decision) {
        const policy = this.config.policies.get(decision.serviceId);
        
        for (const check of policy.preScalingChecks) {
            try {
                const result = await this.executePreScalingCheck(decision, check);
                if (!result.passed) {
                    return {
                        allowed: false,
                        reason: result.reason,
                        check: check.name
                    };
                }
            } catch (error) {
                console.error(`❌ Pre-scaling check ${check.name} failed:`, error);
                return {
                    allowed: false,
                    reason: error.message,
                    check: check.name
                };
            }
        }
        
        return { allowed: true };
    }

    async runPostScalingActions(decision, result) {
        const policy = this.config.policies.get(decision.serviceId);
        
        for (const action of policy.postScalingActions) {
            try {
                await this.executePostScalingAction(decision, result, action);
            } catch (error) {
                console.error(`❌ Post-scaling action ${action.name} failed:`, error);
            }
        }
    }

    async executePreScalingCheck(decision, check) {
        // Implementation of pre-scaling checks
        // Examples: resource availability, quota checks, dependency checks
        switch (check.type) {
            case 'resource-availability':
                return await this.checkResourceAvailability(decision, check);
            case 'quota-check':
                return await this.checkQuota(decision, check);
            case 'dependency-check':
                return await this.checkDependencies(decision, check);
            default:
                return { passed: true, reason: 'Unknown check type' };
        }
    }

    async executePostScalingAction(decision, result, action) {
        // Implementation of post-scaling actions
        // Examples: notification, logging, metrics update
        switch (action.type) {
            case 'notification':
                await this.sendNotification(decision, result, action);
                break;
            case 'logging':
                await this.logScalingEvent(decision, result, action);
                break;
            case 'metrics-update':
                await this.updateMetrics(decision, result, action);
                break;
        }
    }

    // Monitoring and history
    startScalingMonitoring() {
        setInterval(async () => {
            await this.cleanupScalingHistory();
            await this.updateScalingMetrics();
        }, 300000); // Every 5 minutes
    }

    recordScalingEvent(decision, result) {
        const event = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            serviceId: decision.serviceId,
            policy: decision.policy,
            direction: decision.direction,
            fromInstances: result.fromInstances,
            toInstances: result.targetInstances,
            reason: decision.reason,
            confidence: decision.confidence,
            timestamp: new Date().toISOString(),
            success: result.success,
            error: result.error
        };

        this.config.scalingHistory.unshift(event);
        
        // Keep only last 1000 events
        if (this.config.scalingHistory.length > 1000) {
            this.config.scalingHistory = this.config.scalingHistory.slice(0, 1000);
        }
    }

    setCooldown(serviceId, direction) {
        const cooldownKey = `${serviceId}_${direction}`;
        this.config.cooldownPeriods.set(cooldownKey, Date.now());
    }

    // Persistence
    async saveScalingPolicy(policy) {
        // Save to file or database
        console.log(`💾 Saving scaling policy: ${policy.id}`);
    }

    async loadScalingPolicies() {
        // Load from file or database
        console.log('📋 Loading scaling policies...');
    }

    // Status and metrics
    isHealthy() {
        return this.scalingEngine && this.resourceManager;
    }

    getState() {
        return {
            config: this.config,
            policies: Array.from(this.config.policies.values()),
            instances: Array.from(this.config.instances.values()),
            scalingHistory: this.config.scalingHistory.slice(0, 100), // Last 100 events
            cooldownPeriods: Array.from(this.config.cooldownPeriods.entries())
        };
    }

    getMetrics() {
        return {
            totalServices: this.config.policies.size,
            totalInstances: this.config.instances.size,
            scalingEvents: this.config.scalingHistory.length,
            averageScalingFrequency: this.calculateAverageScalingFrequency(),
            cooldownActive: this.config.cooldownPeriods.size
        };
    }

    calculateAverageScalingFrequency() {
        const recentEvents = this.config.scalingHistory.filter(event => 
            Date.now() - new Date(event.timestamp).getTime() < 3600000 // Last hour
        );
        
        return recentEvents.length;
    }
}

// Helper classes
class AutoScalingEngine {
    constructor(config) {
        this.config = config;
    }

    async initialize() {
        console.log('🚀 Auto Scaling Engine initialized');
    }
}

class ResourceManager {
    constructor() {
        this.providers = new Map();
    }

    async initialize() {
        // Initialize cloud providers
        console.log('☁️ Resource Manager initialized');
    }

    async createInstance(serviceId) {
        // Create instance using cloud provider
        return {
            id: `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            serviceId,
            status: 'starting',
            createdAt: new Date().toISOString()
        };
    }

    async terminateInstance(instanceId) {
        // Terminate instance
        console.log(`🗑️ Terminating instance: ${instanceId}`);
    }
}

module.exports = ScalingManager;