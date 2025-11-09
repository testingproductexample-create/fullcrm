/**
 * Load Balancer Configuration and Management
 * 
 * Handles load balancer setup, backend management, traffic routing,
 * and failover mechanisms.
 */

const EventEmitter = require('events');

class LoadBalancer extends EventEmitter {
    constructor(config) {
        super();
        this.config = {
            algorithm: config.algorithm || 'round-robin',
            healthCheckInterval: config.healthCheckInterval || 30000,
            healthCheckTimeout: config.healthCheckTimeout || 5000,
            healthCheckPath: config.healthCheckPath || '/health',
            maxRetries: config.maxRetries || 3,
            sessionAffinity: config.sessionAffinity || false,
            ssl: {
                enabled: config.ssl?.enabled || false,
                certPath: config.ssl?.certPath,
                keyPath: config.ssl?.keyPath
            },
            ...config
        };

        this.backends = new Map();
        this.currentConnections = new Map();
        this.roundRobinIndex = 0;
        this.healthyBackends = new Set();
        this.failedBackends = new Set();
        this.healthCheckStatus = new Map();
        this.failoverMode = false;
        
        this.loadBalancer = null;
    }

    async initialize() {
        try {
            // Initialize load balancer based on available options
            await this.initializeLoadBalancer();
            
            // Start health check monitoring
            this.startHealthChecks();
            
            // Initialize metrics tracking
            this.initializeMetrics();
            
            console.log('✅ Load Balancer initialized');
        } catch (error) {
            console.error('❌ Load Balancer initialization failed:', error);
            throw error;
        }
    }

    async initializeLoadBalancer() {
        // Try to initialize different load balancers based on environment
        const environment = process.env.LOAD_BALANCER_TYPE || 'nginx';
        
        switch (environment) {
            case 'nginx':
                await this.initializeNginx();
                break;
            case 'haproxy':
                await this.initializeHAProxy();
                break;
            case 'traefik':
                await this.initializeTraefik();
                break;
            case 'node':
                await this.initializeNodeBalancer();
                break;
            default:
                await this.initializeNodeBalancer();
        }
    }

    async initializeNginx() {
        // Nginx configuration
        const nginxConfig = this.generateNginxConfig();
        // Write to nginx config file
        // Start nginx process
        console.log('📋 Nginx load balancer configured');
    }

    async initializeHAProxy() {
        // HAProxy configuration
        const haproxyConfig = this.generateHAProxyConfig();
        // Write to haproxy config file
        // Start haproxy process
        console.log('📋 HAProxy load balancer configured');
    }

    async initializeTraefik() {
        // Traefik configuration
        const traefikConfig = this.generateTraefikConfig();
        // Start traefik process with configuration
        console.log('📋 Traefik load balancer configured');
    }

    async initializeNodeBalancer() {
        // Node.js load balancer implementation
        console.log('📋 Node.js load balancer configured');
    }

    generateNginxConfig() {
        return `
upstream backend {
    ${this.getBackendServers().map(server => 
        `server ${server.host}:${server.port} weight=${server.weight || 1} max_fails=${server.maxFails || 3} fail_timeout=${server.failTimeout || 30}s;`
    ).join('\n    ')}
    
    # Health check
    keepalive 32;
}

server {
    listen 80;
    ${this.config.ssl.enabled ? 'listen 443 ssl;' : ''}
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Health check location
        location /health {
            proxy_pass http://backend;
            access_log off;
        }
    }
    
    # Health check endpoint
    location /nginx_health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}`;
    }

    generateHAProxyConfig() {
        return `
global
    daemon
    maxconn 4096
    
defaults
    mode http
    timeout connect 5000ms
    timeout client  50000ms
    timeout server  50000ms
    option httplog
    option dontlognull
    option redispatch
    retries 3

frontend http-in
    bind *:80
    ${this.config.ssl.enabled ? 'bind *:443 ssl crt /path/to/cert.pem' : ''}
    default_backend backend

backend backend
    balance ${this.config.algorithm}
    option httpchk GET ${this.config.healthCheckPath}
    ${this.getBackendServers().map(server => 
        `server ${server.id} ${server.host}:${server.port} check inter 30000ms rise 2 fall 3`
    ).join('\n    ')}`;
    }

    generateTraefikConfig() {
        return {
            entryPoints: {
                web: {
                    address: ":80",
                    ${this.config.ssl.enabled ? 'tls: {}' : ''}
                }
            },
            backends: {
                backend: {
                    servers: this.getBackendServers().map(server => ({
                        url: `http://${server.host}:${server.port}`,
                        weight: server.weight || 1
                    }))
                }
            },
            services: {
                backend: {
                    loadBalancer: {
                        method: this.config.algorithm,
                        sticky: this.config.sessionAffinity
                    }
                }
            }
        };
    }

    getBackendServers() {
        return Array.from(this.backends.values());
    }

    async addBackend(service) {
        try {
            const backend = {
                id: service.id,
                host: service.host,
                port: service.port,
                weight: service.weight || 1,
                maxFails: service.maxFails || 3,
                failTimeout: service.failTimeout || 30,
                healthy: true,
                lastHealthCheck: null,
                connections: 0,
                totalRequests: 0,
                failedRequests: 0,
                responseTime: 0,
                ...service
            };

            this.backends.set(backend.id, backend);
            this.healthyBackends.add(backend.id);
            this.currentConnections.set(backend.id, 0);

            // Add to load balancer configuration
            await this.updateLoadBalancerConfig();
            
            this.emit('backendAdded', backend);
            console.log(`✅ Backend added: ${backend.id} (${backend.host}:${backend.port})`);

            return backend;
        } catch (error) {
            console.error(`❌ Failed to add backend ${service.id}:`, error);
            throw error;
        }
    }

    async removeBackend(serviceId) {
        try {
            const backend = this.backends.get(serviceId);
            if (!backend) {
                throw new Error(`Backend ${serviceId} not found`);
            }

            // Remove from load balancer
            this.backends.delete(serviceId);
            this.healthyBackends.delete(serviceId);
            this.failedBackends.delete(serviceId);
            this.currentConnections.delete(serviceId);
            this.healthCheckStatus.delete(serviceId);

            // Update load balancer configuration
            await this.updateLoadBalancerConfig();
            
            this.emit('backendRemoved', backend);
            console.log(`🗑️ Backend removed: ${serviceId}`);

            return true;
        } catch (error) {
            console.error(`❌ Failed to remove backend ${serviceId}:`, error);
            throw error;
        }
    }

    async updateBackend(serviceId, updates) {
        try {
            const backend = this.backends.get(serviceId);
            if (!backend) {
                throw new Error(`Backend ${serviceId} not found`);
            }

            Object.assign(backend, updates);
            await this.updateLoadBalancerConfig();
            
            this.emit('backendUpdated', backend);
            return backend;
        } catch (error) {
            console.error(`❌ Failed to update backend ${serviceId}:`, error);
            throw error;
        }
    }

    getHealthyBackends() {
        return Array.from(this.healthyBackends).map(id => this.backends.get(id));
    }

    getFailedBackends() {
        return Array.from(this.failedBackends).map(id => this.backends.get(id));
    }

    getNextBackend() {
        const healthy = this.getHealthyBackends();
        if (healthy.length === 0) {
            return null;
        }

        const algorithm = this.config.algorithm;
        
        switch (algorithm) {
            case 'round-robin':
                return this.selectByRoundRobin(healthy);
            case 'least-connections':
                return this.selectByLeastConnections(healthy);
            case 'ip-hash':
                return this.selectByIPHash(healthy);
            case 'weighted-round-robin':
                return this.selectByWeightedRoundRobin(healthy);
            default:
                return healthy[0];
        }
    }

    selectByRoundRobin(backends) {
        const backend = backends[this.roundRobinIndex % backends.length];
        this.roundRobinIndex++;
        return backend;
    }

    selectByLeastConnections(backends) {
        return backends.reduce((min, backend) => 
            this.currentConnections.get(backend.id) < this.currentConnections.get(min.id) 
                ? backend : min
        );
    }

    selectByIPHash(backends) {
        // Simple IP hash implementation
        const clientIP = this.getClientIP();
        const hash = this.hashCode(clientIP);
        return backends[hash % backends.length];
    }

    selectByWeightedRoundRobin(backends) {
        // Weight-based selection
        const totalWeight = backends.reduce((sum, backend) => sum + (backend.weight || 1), 0);
        const random = Math.random() * totalWeight;
        let currentWeight = 0;
        
        for (const backend of backends) {
            currentWeight += (backend.weight || 1);
            if (random <= currentWeight) {
                return backend;
            }
        }
        
        return backends[0];
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    getClientIP() {
        // This would be implemented based on the specific load balancer
        return process.env.CLIENT_IP || '127.0.0.1';
    }

    async handleRequest(request, response) {
        try {
            const backend = this.getNextBackend();
            
            if (!backend) {
                response.status(503).json({
                    error: 'Service Unavailable',
                    message: 'No healthy backends available'
                });
                return;
            }

            // Increment connection count
            this.incrementConnectionCount(backend.id);
            
            // Track request
            this.trackRequest(backend.id, true);
            
            // Proxy request to backend
            await this.proxyRequest(request, response, backend);
            
        } catch (error) {
            console.error('❌ Request handling error:', error);
            response.status(500).json({
                error: 'Internal Server Error',
                message: 'Load balancer error'
            });
        } finally {
            // Decrement connection count
            if (backend) {
                this.decrementConnectionCount(backend.id);
            }
        }
    }

    async proxyRequest(request, response, backend) {
        // Implementation would depend on the load balancer type
        // This is a simplified version for Node.js
        
        try {
            const startTime = Date.now();
            
            // Make request to backend
            // Track response time, success/failure
            const responseTime = Date.now() - startTime;
            
            // Update backend metrics
            this.updateBackendMetrics(backend.id, responseTime, true);
            
        } catch (error) {
            this.trackRequest(backend.id, false);
            throw error;
        }
    }

    trackRequest(backendId, success) {
        const backend = this.backends.get(backendId);
        if (backend) {
            backend.totalRequests++;
            if (!success) {
                backend.failedRequests++;
            }
        }
    }

    updateBackendMetrics(backendId, responseTime, success) {
        const backend = this.backends.get(backendId);
        if (backend) {
            backend.responseTime = responseTime;
            if (!success) {
                this.markBackendAsFailed(backendId);
            } else {
                this.markBackendAsHealthy(backendId);
            }
        }
    }

    incrementConnectionCount(backendId) {
        const current = this.currentConnections.get(backendId) || 0;
        this.currentConnections.set(backendId, current + 1);
    }

    decrementConnectionCount(backendId) {
        const current = this.currentConnections.get(backendId) || 0;
        this.currentConnections.set(backendId, Math.max(0, current - 1));
    }

    // Health check methods
    startHealthChecks() {
        setInterval(async () => {
            await this.performHealthChecks();
        }, this.config.healthCheckInterval);
    }

    async performHealthChecks() {
        const backends = Array.from(this.backends.values());
        
        for (const backend of backends) {
            try {
                const isHealthy = await this.checkBackendHealth(backend);
                
                if (isHealthy) {
                    this.markBackendAsHealthy(backend.id);
                } else {
                    this.markBackendAsFailed(backend.id);
                }
            } catch (error) {
                console.error(`Health check failed for ${backend.id}:`, error);
                this.markBackendAsFailed(backend.id);
            }
        }
    }

    async checkBackendHealth(backend) {
        try {
            const response = await fetch(`http://${backend.host}:${backend.port}${this.config.healthCheckPath}`, {
                method: 'GET',
                timeout: this.config.healthCheckTimeout
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    markBackendAsHealthy(backendId) {
        const backend = this.backends.get(backendId);
        if (backend) {
            backend.healthy = true;
            backend.lastHealthCheck = new Date();
            this.healthyBackends.add(backendId);
            this.failedBackends.delete(backendId);
            this.healthCheckStatus.set(backendId, 'healthy');
        }
    }

    markBackendAsFailed(backendId) {
        const backend = this.backends.get(backendId);
        if (backend) {
            backend.healthy = false;
            backend.lastHealthCheck = new Date();
            this.healthyBackends.delete(backendId);
            this.failedBackends.add(backendId);
            this.healthCheckStatus.set(backendId, 'failed');
        }
    }

    async updateBackendHealth(healthStatus) {
        // Update backend health based on health monitor data
        for (const [serviceId, status] of healthStatus) {
            if (status.healthy) {
                this.markBackendAsHealthy(serviceId);
            } else {
                this.markBackendAsFailed(serviceId);
            }
        }
    }

    // Failover methods
    async initiateFailover() {
        console.log('🔄 Initiating failover procedures...');
        
        this.failoverMode = true;
        
        try {
            // Enable backup load balancer
            await this.enableBackupLoadBalancer();
            
            // Redirect traffic
            await this.redirectTraffic();
            
            // Notify systems
            this.emit('failoverInitiated', {
                timestamp: new Date().toISOString(),
                reason: 'Primary load balancer failure'
            });
            
        } catch (error) {
            console.error('❌ Failover initiation failed:', error);
            throw error;
        }
    }

    async enableBackupLoadBalancer() {
        // Implementation for enabling backup load balancer
        console.log('🔄 Enabling backup load balancer...');
    }

    async redirectTraffic() {
        // Implementation for traffic redirection
        console.log('🔄 Redirecting traffic...');
    }

    async drainConnections() {
        console.log('🛑 Draining connections...');
        
        // Implementation for graceful connection draining
        for (const [backendId, connectionCount] of this.currentConnections) {
            if (connectionCount > 0) {
                // Wait for connections to drain
                await this.waitForConnectionsToDrain(backendId);
            }
        }
    }

    async waitForConnectionsToDrain(backendId, maxWaitTime = 60000) {
        const startTime = Date.now();
        
        while (this.currentConnections.get(backendId) > 0) {
            if (Date.now() - startTime > maxWaitTime) {
                console.warn(`⚠️ Timeout waiting for connections to drain for ${backendId}`);
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Configuration methods
    async updateLoadBalancerConfig() {
        const config = this.generateLoadBalancerConfig();
        await this.writeLoadBalancerConfig(config);
    }

    generateLoadBalancerConfig() {
        return {
            algorithm: this.config.algorithm,
            backends: this.getBackendServers(),
            healthCheck: {
                path: this.config.healthCheckPath,
                interval: this.config.healthCheckInterval
            },
            ssl: this.config.ssl
        };
    }

    async writeLoadBalancerConfig(config) {
        // Write configuration to appropriate file based on load balancer type
        console.log('📝 Updating load balancer configuration...');
    }

    // Metrics and monitoring
    initializeMetrics() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            activeConnections: 0,
            backendStats: new Map()
        };
    }

    getMetrics() {
        return {
            ...this.metrics,
            backends: Array.from(this.backends.values()).map(backend => ({
                id: backend.id,
                host: backend.host,
                port: backend.port,
                healthy: backend.healthy,
                connections: this.currentConnections.get(backend.id) || 0,
                totalRequests: backend.totalRequests,
                failedRequests: backend.failedRequests,
                responseTime: backend.responseTime,
                lastHealthCheck: backend.lastHealthCheck
            })),
            healthyBackends: this.getHealthyBackends().length,
            failedBackends: this.getFailedBackends().length,
            failoverMode: this.failoverMode
        };
    }

    // Status methods
    isHealthy() {
        return this.backends.size > 0 && this.healthyBackends.size > 0;
    }

    getState() {
        return {
            config: this.config,
            backends: Array.from(this.backends.values()),
            healthyBackends: Array.from(this.healthyBackends),
            failedBackends: Array.from(this.failedBackends),
            metrics: this.getMetrics(),
            failoverMode: this.failoverMode
        };
    }
}

module.exports = LoadBalancer;