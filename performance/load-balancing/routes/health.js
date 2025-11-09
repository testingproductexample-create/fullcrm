/**
 * Health API Routes
 */

const express = require('express');
const router = express.Router();

// Get overall health status
router.get('/', async (req, res) => {
    try {
        const health = await req.app.locals.system.getHealthStatus();
        res.json(health);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get service health status
router.get('/services', async (req, res) => {
    try {
        const services = req.app.locals.system.healthMonitor.getState().services;
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register new service for health monitoring
router.post('/services', async (req, res) => {
    try {
        const service = await req.app.locals.system.healthMonitor.registerService(req.body);
        res.json(service);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update service health configuration
router.put('/services/:id', async (req, res) => {
    try {
        const service = await req.app.locals.system.healthMonitor.updateService(req.params.id, req.body);
        res.json(service);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Unregister service
router.delete('/services/:id', async (req, res) => {
    try {
        const result = await req.app.locals.system.healthMonitor.unregisterService(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific service health
router.get('/services/:id', async (req, res) => {
    try {
        const services = req.app.locals.system.healthMonitor.getState().services;
        const service = services.find(s => s.id === req.params.id);
        
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        res.json(service);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Perform health check
router.post('/check/:serviceId', async (req, res) => {
    try {
        const services = req.app.locals.system.healthMonitor.getState().services;
        const service = services.find(s => s.id === req.params.serviceId);
        
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        const result = await req.app.locals.system.healthMonitor.performSingleCheck(req.params.serviceId, service);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get health check history
router.get('/services/:id/history', async (req, res) => {
    try {
        const history = req.app.locals.system.healthMonitor.config.history.get(req.params.id) || [];
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all alerts
router.get('/alerts', async (req, res) => {
    try {
        const alerts = req.app.locals.system.healthMonitor.getState().alerts;
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get active alerts
router.get('/alerts/active', async (req, res) => {
    try {
        const alerts = req.app.locals.system.healthMonitor.getState().alerts;
        const activeAlerts = alerts.filter(alert => !alert.resolved);
        res.json(activeAlerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Acknowledge alert
router.post('/alerts/:alertId/acknowledge', async (req, res) => {
    try {
        const { user } = req.body;
        await req.app.locals.system.healthMonitor.acknowledgeAlert(req.params.alertId, user);
        res.json({ success: true, message: 'Alert acknowledged' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get health metrics
router.get('/metrics', async (req, res) => {
    try {
        const metrics = req.app.locals.system.healthMonitor.getMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check failover conditions
router.get('/failover-check', async (req, res) => {
    try {
        const failoverNeeded = await req.app.locals.system.healthMonitor.checkFailoverConditions();
        res.json({ failoverNeeded });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stop health monitoring
router.post('/stop', async (req, res) => {
    try {
        req.app.locals.system.healthMonitor.stopMonitoring();
        res.json({ success: true, message: 'Health monitoring stopped' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start health monitoring
router.post('/start', async (req, res) => {
    try {
        req.app.locals.system.healthMonitor.startMonitoring();
        res.json({ success: true, message: 'Health monitoring started' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;