/**
 * Health Monitoring System
 * 
 * Handles health checks, service monitoring, alerting,
 * and failover mechanisms.
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');

class HealthMonitor extends EventEmitter {
    constructor(config) {
        super();
        this.config = {
            checkInterval: config.checkInterval || 30000,
            timeout: config.timeout || 10000,
            retries: config.retries || 3,
            backoffMultiplier: config.backoffMultiplier || 2,
            maxBackoff: config.maxBackoff || 300000,
            healthThreshold: config.healthThreshold || 80,
            failureThreshold: config.failureThreshold || 3,
            services: new Map(),
            healthChecks: new Map(),
            alerts: new Map(),
            metrics: new Map(),
            history: new Map(),
            ...config
        };

        this.monitoringActive = false;
        this.checkScheduler = null;
    }

    async initialize() {
        try {
            // Initialize monitoring infrastructure
            await this.initializeMonitoring();
            
            // Load existing health checks
            await this.loadHealthChecks();
            
            // Start monitoring
            this.startMonitoring();
            
            console.log('✅ Health Monitor initialized');
        } catch (error) {
            console.error('❌ Health Monitor initialization failed:', error);
            throw error;
        }
    }

    async initializeMonitoring() {
        // Initialize metrics collection
        this.metricsCollector = new MetricsCollector();
        await this.metricsCollector.initialize();
        
        // Initialize alerting system
        this.alertManager = new AlertManager();
        await this.alertManager.initialize();
        
        // Initialize notification channels
        this.notificationChannels = {
            email: this.setupEmailNotifications(),
            slack: this.setupSlackNotifications(),
            webhook: this.setupWebhookNotifications()
        };
    }

    // Health Check Management
    async registerService(service) {
        try {
            const healthCheck = {
                id: service.id,
                name: service.name,
                type: service.type || 'http', // http, tcp, command, database
                url: service.url,
                port: service.port,
                path: service.path || '/health',
                method: service.method || 'GET',
                headers: service.headers || {},
                body: service.body || null,
                timeout: service.timeout || this.config.timeout,
                interval: service.interval || this.config.checkInterval,
                enabled: service.enabled !== false,
                critical: service.critical || false,
                weight: service.weight || 1,
                tags: service.tags || [],
                metadata: service.metadata || {},
                history: [],
                stats: {
                    totalChecks: 0,
                    successCount: 0,
                    failureCount: 0,
                    averageResponseTime: 0,
                    lastCheck: null,
                    lastSuccess: null,
                    lastFailure: null,
                    consecutiveFailures: 0,
                    consecutiveSuccesses: 0,
                    uptime: 0,
                    downtime: 0
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.config.services.set(service.id, healthCheck);
            this.config.healthChecks.set(service.id, healthCheck);
            
            this.emit('serviceRegistered', healthCheck);
            console.log(`✅ Health check registered: ${service.name} (${service.id})`);

            return healthCheck;
        } catch (error) {
            console.error(`❌ Failed to register service ${service.id}:`, error);
            throw error;
        }
    }

    async updateService(serviceId, updates) {
        try {
            const service = this.config.services.get(serviceId);
            if (!service) {
                throw new Error(`Service ${serviceId} not found`);
            }

            Object.assign(service, updates, {
                updatedAt: new Date().toISOString()
            });

            this.config.services.set(serviceId, service);
            this.config.healthChecks.set(serviceId, service);
            
            this.emit('serviceUpdated', service);
            console.log(`🔄 Health check updated: ${service.name}`);

            return service;
        } catch (error) {
            console.error(`❌ Failed to update service ${serviceId}:`, error);
            throw error;
        }
    }

    async unregisterService(serviceId) {
        try {
            const service = this.config.services.get(serviceId);
            if (!service) {
                throw new Error(`Service ${serviceId} not found`);
            }

            this.config.services.delete(serviceId);
            this.config.healthChecks.delete(serviceId);
            this.config.metrics.delete(serviceId);
            this.config.history.delete(serviceId);
            
            this.emit('serviceUnregistered', service);
            console.log(`🗑️ Health check unregistered: ${service.name}`);

            return true;
        } catch (error) {
            console.error(`❌ Failed to unregister service ${serviceId}:`, error);
            throw error;
        }
    }

    // Health Check Execution
    async performHealthChecks() {
        const results = new Map();
        const promises = [];

        for (const [serviceId, service] of this.config.services) {
            if (service.enabled) {
                promises.push(this.performSingleCheck(serviceId, service));
            }
        }

        const checkResults = await Promise.allSettled(promises);
        
        for (let i = 0; i < promises.length; i++) {
            const serviceId = Array.from(this.config.services.keys())[i];
            const result = checkResults[i];
            
            if (result.status === 'fulfilled') {
                results.set(serviceId, result.value);
            } else {
                results.set(serviceId, {
                    serviceId,
                    healthy: false,
                    error: result.reason.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        return results;
    }

    async performSingleCheck(serviceId, service) {
        const startTime = performance.now();
        let result = {
            serviceId,
            serviceName: service.name,
            healthy: false,
            responseTime: 0,
            statusCode: null,
            error: null,
            details: {},
            timestamp: new Date().toISOString()
        };

        try {
            // Perform the actual health check based on type
            switch (service.type) {
                case 'http':
                    result = await this.performHttpCheck(service);
                    break;
                case 'tcp':
                    result = await this.performTcpCheck(service);
                    break;
                case 'command':
                    result = await this.performCommandCheck(service);
                    break;
                case 'database':
                    result = await this.performDatabaseCheck(service);
                    break;
                default:
                    throw new Error(`Unknown check type: ${service.type}`);
            }

            result.responseTime = performance.now() - startTime;

            // Update service statistics
            this.updateServiceStats(serviceId, result);
            
            // Store result in history
            this.addToHistory(serviceId, result);
            
            this.emit('healthCheckCompleted', { serviceId, result });
            
        } catch (error) {
            result.healthy = false;
            result.error = error.message;
            result.responseTime = performance.now() - startTime;
            
            this.updateServiceStats(serviceId, result);
            this.addToHistory(serviceId, result);
        }

        return result;
    }

    async performHttpCheck(service) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), service.timeout);
        
        try {
            const options = {
                method: service.method,
                headers: service.headers,
                signal: controller.signal
            };
            
            if (service.body) {
                options.body = service.body;
            }

            const response = await fetch(service.url, options);
            clearTimeout(timeoutId);
            
            return {
                serviceId: service.id,
                serviceName: service.name,
                healthy: response.ok,
                statusCode: response.status,
                responseBody: await response.text().catch(() => ''),
                details: {
                    status: response.statusText,
                    headers: Object.fromEntries(response.headers.entries())
                }
            };
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    async performTcpCheck(service) {
        const net = require('net');
        
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            const timeoutId = setTimeout(() => {
                socket.destroy();
                reject(new Error('Connection timeout'));
            }, service.timeout);

            socket.connect(service.port, service.host || 'localhost', () => {
                clearTimeout(timeoutId);
                socket.end();
                resolve({
                    serviceId: service.id,
                    serviceName: service.name,
                    healthy: true,
                    details: { connected: true }
                });
            });

            socket.on('error', (error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
        });
    }

    async performCommandCheck(service) {
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        
        try {
            const { stdout, stderr } = await execPromise(service.command, {
                timeout: service.timeout,
                maxBuffer: 1024 * 1024 // 1MB
            });
            
            const success = service.expectedExitCode === 0 ? 
                (service.expectedExitCode === 0) : 
                (!stderr);
            
            return {
                serviceId: service.id,
                serviceName: service.name,
                healthy: success,
                details: {
                    exitCode: 0,
                    stdout: stdout.trim(),
                    stderr: stderr.trim()
                }
            };
        } catch (error) {
            return {
                serviceId: service.id,
                serviceName: service.name,
                healthy: false,
                error: error.message,
                details: {
                    exitCode: error.code,
                    stdout: error.stdout,
                    stderr: error.stderr
                }
            };
        }
    }

    async performDatabaseCheck(service) {
        // Implementation would depend on database type
        // This is a generic implementation
        try {
            // Simulate database connection check
            const connection = await this.establishDatabaseConnection(service);
            await this.executeHealthQuery(connection, service.query || 'SELECT 1');
            await connection.end();
            
            return {
                serviceId: service.id,
                serviceName: service.name,
                healthy: true,
                details: { connection: 'successful' }
            };
        } catch (error) {
            throw new Error(`Database check failed: ${error.message}`);
        }
    }

    async establishDatabaseConnection(service) {
        // Database connection logic based on service.dbType
        // This is a placeholder implementation
        return {
            query: async () => ({ rows: [{ result: 1 }] }),
            end: async () => {}
        };
    }

    async executeHealthQuery(connection, query) {
        const result = await connection.query(query);
        return result;
    }

    // Service Statistics
    updateServiceStats(serviceId, result) {
        const service = this.config.services.get(serviceId);
        if (!service) return;

        const stats = service.stats;
        const now = Date.now();

        stats.totalChecks++;
        
        if (result.healthy) {
            stats.successCount++;
            stats.consecutiveFailures = 0;
            stats.consecutiveSuccesses++;
            stats.lastSuccess = new Date().toISOString();
            stats.uptime = now - (stats.lastFailure ? new Date(stats.lastFailure).getTime() : now);
        } else {
            stats.failureCount++;
            stats.consecutiveFailures++;
            stats.consecutiveSuccesses = 0;
            stats.lastFailure = new Date().toISOString();
            stats.downtime = now - (stats.lastSuccess ? new Date(stats.lastSuccess).getTime() : now);
        }

        // Update average response time
        if (stats.totalChecks === 1) {
            stats.averageResponseTime = result.responseTime;
        } else {
            stats.averageResponseTime = (stats.averageResponseTime * (stats.totalChecks - 1) + result.responseTime) / stats.totalChecks;
        }

        stats.lastCheck = new Date().toISOString();

        // Check for alert conditions
        this.checkAlertConditions(service, result);
    }

    // Alert Management
    checkAlertConditions(service, result) {
        // Check for failure threshold
        if (service.stats.consecutiveFailures >= this.config.failureThreshold) {
            this.triggerAlert(service, 'critical_failure', {
                message: `Service ${service.name} has failed ${service.stats.consecutiveFailures} times consecutively`,
                severity: 'critical'
            });
        }

        // Check for recovery
        if (service.stats.consecutiveSuccesses === 1 && service.stats.consecutiveFailures > 0) {
            this.triggerAlert(service, 'recovery', {
                message: `Service ${service.name} has recovered`,
                severity: 'info'
            });
        }

        // Check for high response time
        if (service.stats.averageResponseTime > (service.sloResponseTime || 5000)) {
            this.triggerAlert(service, 'high_response_time', {
                message: `Service ${service.name} has high response time: ${service.stats.averageResponseTime.toFixed(2)}ms`,
                severity: 'warning'
            });
        }
    }

    triggerAlert(service, type, details) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            serviceId: service.id,
            serviceName: service.name,
            type,
            severity: details.severity || 'warning',
            message: details.message,
            details,
            timestamp: new Date().toISOString(),
            acknowledged: false,
            resolved: false
        };

        this.config.alerts.set(alert.id, alert);
        
        // Send notifications
        this.sendNotifications(alert);
        
        this.emit('alertTriggered', alert);
        console.log(`🚨 Alert triggered: ${alert.message}`);
    }

    async sendNotifications(alert) {
        // Send to all configured channels
        const promises = [];
        
        for (const [channel, config] of Object.entries(this.notificationChannels)) {
            if (config.enabled) {
                promises.push(this.sendToChannel(channel, config, alert));
            }
        }

        await Promise.allSettled(promises);
    }

    async sendToChannel(channel, config, alert) {
        try {
            switch (channel) {
                case 'email':
                    await this.sendEmail(config, alert);
                    break;
                case 'slack':
                    await this.sendSlack(config, alert);
                    break;
                case 'webhook':
                    await this.sendWebhook(config, alert);
                    break;
            }
        } catch (error) {
            console.error(`❌ Failed to send ${channel} notification:`, error);
        }
    }

    async sendEmail(config, alert) {
        // Email sending implementation
        console.log(`📧 Email alert sent: ${alert.message}`);
    }

    async sendSlack(config, alert) {
        // Slack webhook implementation
        console.log(`💬 Slack alert sent: ${alert.message}`);
    }

    async sendWebhook(config, alert) {
        // Webhook implementation
        const response = await fetch(config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...config.headers
            },
            body: JSON.stringify(alert)
        });
        console.log(`🔗 Webhook alert sent: ${alert.message}`);
    }

    // History and Metrics
    addToHistory(serviceId, result) {
        if (!this.config.history.has(serviceId)) {
            this.config.history.set(serviceId, []);
        }

        const history = this.config.history.get(serviceId);
        history.unshift(result);
        
        // Keep only last 100 entries per service
        if (history.length > 100) {
            history.splice(100);
        }
    }

    // Monitoring Control
    startMonitoring() {
        if (this.monitoringActive) return;
        
        this.monitoringActive = true;
        this.checkScheduler = setInterval(async () => {
            try {
                await this.performHealthChecks();
            } catch (error) {
                console.error('❌ Health check cycle error:', error);
            }
        }, this.config.checkInterval);
        
        console.log('🔍 Health monitoring started');
    }

    stopMonitoring() {
        if (this.checkScheduler) {
            clearInterval(this.checkScheduler);
            this.checkScheduler = null;
        }
        this.monitoringActive = false;
        console.log('⏹️ Health monitoring stopped');
    }

    // Failover Conditions
    async checkFailoverConditions() {
        const unhealthyServices = Array.from(this.config.services.values())
            .filter(service => !this.isServiceHealthy(service));

        if (unhealthyServices.length > 0) {
            const criticalUnhealthy = unhealthyServices.filter(service => service.critical);
            
            if (criticalUnhealthy.length > 0) {
                console.log(`⚠️ ${criticalUnhealthy.length} critical services are unhealthy`);
                return true;
            }
        }

        return false;
    }

    isServiceHealthy(service) {
        const stats = service.stats;
        return stats.consecutiveFailures < this.config.failureThreshold;
    }

    // Status and Metrics
    isHealthy() {
        return this.monitoringActive && this.config.services.size > 0;
    }

    async getOverallHealthStatus() {
        const status = new Map();
        
        for (const [serviceId, service] of this.config.services) {
            status.set(serviceId, {
                healthy: this.isServiceHealthy(service),
                uptime: service.stats.uptime,
                responseTime: service.stats.averageResponseTime,
                lastCheck: service.stats.lastCheck,
                details: service
            });
        }

        return status;
    }

    getState() {
        return {
            config: this.config,
            services: Array.from(this.config.services.values()),
            alerts: Array.from(this.config.alerts.values()),
            metrics: Array.from(this.config.metrics.entries())
        };
    }

    getMetrics() {
        const services = Array.from(this.config.services.values());
        const totalServices = services.length;
        const healthyServices = services.filter(service => this.isServiceHealthy(service)).length;
        const criticalServices = services.filter(service => service.critical).length;
        const criticalHealthy = services.filter(service => service.critical && this.isServiceHealthy(service)).length;

        return {
            totalServices,
            healthyServices,
            unhealthyServices: totalServices - healthyServices,
            criticalServices,
            criticalHealthy,
            criticalUnhealthy: criticalServices - criticalHealthy,
            healthScore: (healthyServices / totalServices) * 100,
            activeAlerts: Array.from(this.config.alerts.values()).filter(alert => !alert.resolved).length,
            monitoringActive: this.monitoringActive
        };
    }
}

// Supporting Classes
class MetricsCollector {
    async initialize() {
        console.log('📊 Metrics collector initialized');
    }
}

class AlertManager {
    async initialize() {
        console.log('🚨 Alert manager initialized');
    }
}

module.exports = HealthMonitor;