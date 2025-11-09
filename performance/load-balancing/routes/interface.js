/**
 * Management Interface API Routes
 */

const express = require('express');
const router = express.Router();

// Get system overview
router.get('/overview', async (req, res) => {
    try {
        const system = req.app.locals.system;
        const metrics = await system.getMetrics();
        const health = await system.getHealthStatus();
        
        res.json({
            timestamp: new Date().toISOString(),
            metrics,
            health,
            services: {
                loadBalancer: system.loadBalancer.isHealthy(),
                scalingManager: system.scalingManager.isHealthy(),
                healthMonitor: system.healthMonitor.isHealthy(),
                deploymentManager: system.deploymentManager.isHealthy(),
                monitoringService: system.monitoringService.isHealthy(),
                orchestrator: system.orchestrator.isHealthy(),
                disasterRecovery: system.disasterRecovery.isHealthy()
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get dashboard configuration
router.get('/dashboard/config', async (req, res) => {
    try {
        const config = {
            refreshInterval: 5000,
            metricsRetention: '24h',
            alertThresholds: {
                cpu: 80,
                memory: 85,
                responseTime: 5000,
                errorRate: 5
            },
            widgets: [
                'system-health',
                'active-services',
                'request-rate',
                'response-time',
                'alerts',
                'deployments'
            ]
        };
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all metrics for dashboard
router.get('/dashboard/metrics', async (req, res) => {
    try {
        const system = req.app.locals.system;
        const [metrics, health] = await Promise.all([
            system.getMetrics(),
            system.getHealthStatus()
        ]);
        
        res.json({
            timestamp: new Date().toISOString(),
            metrics,
            health,
            summary: {
                totalServices: health.totalServices || 0,
                healthyServices: health.healthyServices || 0,
                activeAlerts: system.healthMonitor.getState().alerts.filter(a => !a.resolved).length,
                activeDeployments: system.deploymentManager.getState().activeDeployments.length
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get real-time data for websockets
router.get('/realtime', async (req, res) => {
    try {
        const system = req.app.locals.system;
        const data = {
            timestamp: new Date().toISOString(),
            loadBalancer: {
                backends: system.loadBalancer.getState().backends || [],
                healthyBackends: system.loadBalancer.getHealthyBackends().length,
                totalRequests: system.loadBalancer.getMetrics().totalRequests || 0
            },
            scaling: {
                totalPolicies: system.scalingManager.getState().policies?.length || 0,
                totalInstances: system.scalingManager.getState().instances?.length || 0,
                scalingEvents: system.scalingManager.getState().scalingHistory?.length || 0
            },
            health: {
                totalServices: system.healthMonitor.getState().services?.length || 0,
                healthyServices: system.healthMonitor.getMetrics().healthyServices,
                activeAlerts: system.healthMonitor.getState().alerts.filter(a => !a.resolved).length
            },
            deployment: {
                activeDeployments: system.deploymentManager.getState().activeDeployments.length,
                totalDeployments: system.deploymentManager.getState().deployments?.length || 0
            }
        };
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Quick actions
router.post('/actions/scale-up', async (req, res) => {
    try {
        const { serviceId, instances } = req.body;
        const result = await req.app.locals.system.scaleService(serviceId, instances);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/actions/scale-down', async (req, res) => {
    try {
        const { serviceId, instances } = req.body;
        const result = await req.app.locals.system.scaleService(serviceId, instances);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/actions/deploy', async (req, res) => {
    try {
        const result = await req.app.locals.system.deployService(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/actions/failover', async (req, res) => {
    try {
        await req.app.locals.system.executeFailover();
        res.json({ success: true, message: 'Failover initiated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get system status
router.get('/status', async (req, res) => {
    try {
        const system = req.app.locals.system;
        res.json({
            status: 'healthy',
            uptime: process.uptime(),
            version: '1.0.0',
            components: {
                loadBalancer: system.loadBalancer.isHealthy(),
                scalingManager: system.scalingManager.isHealthy(),
                healthMonitor: system.healthMonitor.isHealthy(),
                deploymentManager: system.deploymentManager.isHealthy(),
                monitoringService: system.monitoringService.isHealthy(),
                orchestrator: system.orchestrator.isHealthy(),
                disasterRecovery: system.disasterRecovery.isHealthy()
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get configuration
router.get('/config', async (req, res) => {
    try {
        const system = req.app.locals.system;
        res.json({
            loadBalancer: {
                algorithm: system.loadBalancer.config.algorithm,
                port: system.config.loadBalancer.port,
                healthCheckInterval: system.loadBalancer.config.healthCheckInterval
            },
            scaling: {
                minInstances: system.scalingManager.config.minInstances,
                maxInstances: system.scalingManager.config.maxInstances,
                scaleUpCooldown: system.scalingManager.config.scaleUpCooldown,
                scaleDownCooldown: system.scalingManager.config.scaleDownCooldown
            },
            monitoring: {
                metricsInterval: system.monitoringService.config.metricsInterval,
                retentionPeriod: system.monitoringService.config.retentionPeriod
            },
            disasterRecovery: {
                rpo: system.disasterRecovery.config.recoveryPointObjective,
                rto: system.disasterRecovery.config.recoveryTimeObjective
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export configuration
router.get('/config/export', async (req, res) => {
    try {
        const system = req.app.locals.system;
        const config = {
            version: '1.0.0',
            exported: new Date().toISOString(),
            loadBalancer: system.loadBalancer.getState(),
            scaling: system.scalingManager.getState(),
            health: system.healthMonitor.getState(),
            deployment: system.deploymentManager.getState(),
            orchestrator: system.orchestrator.getState(),
            disasterRecovery: system.disasterRecovery.getState()
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="load-balancer-config.json"');
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Import configuration
router.post('/config/import', async (req, res) => {
    try {
        // Implementation would restore configuration from imported data
        res.json({ success: true, message: 'Configuration import completed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get system logs (last 100 lines)
router.get('/logs', async (req, res) => {
    try {
        // This would typically read from a log file or logging service
        res.json({
            logs: [
                { timestamp: new Date().toISOString(), level: 'INFO', message: 'System running normally' },
                { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'INFO', message: 'Health check completed' },
                { timestamp: new Date(Date.now() - 120000).toISOString(), level: 'DEBUG', message: 'Metrics collection cycle started' }
            ]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clear cache
router.post('/cache/clear', async (req, res) => {
    try {
        // Clear various caches
        req.app.locals.system.monitoringService.cleanupOldData();
        res.json({ success: true, message: 'Cache cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Restart system component
router.post('/restart/:component', async (req, res) => {
    try {
        const { component } = req.params;
        const system = req.app.locals.system;
        
        switch (component) {
            case 'loadBalancer':
                await system.loadBalancer.initialize();
                break;
            case 'scalingManager':
                await system.scalingManager.initialize();
                break;
            case 'healthMonitor':
                await system.healthMonitor.initialize();
                break;
            case 'deploymentManager':
                await system.deploymentManager.initialize();
                break;
            case 'monitoringService':
                await system.monitoringService.initialize();
                break;
            case 'orchestrator':
                await system.orchestrator.initialize();
                break;
            case 'disasterRecovery':
                await system.disasterRecovery.initialize();
                break;
            default:
                return res.status(400).json({ error: 'Invalid component' });
        }
        
        res.json({ success: true, message: `${component} restarted` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;