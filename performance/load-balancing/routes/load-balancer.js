/**
 * Load Balancer API Routes
 */

const express = require('express');
const router = express.Router();

// Get load balancer status
router.get('/status', async (req, res) => {
    try {
        const status = req.app.locals.system.loadBalancer.getState();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get load balancer metrics
router.get('/metrics', async (req, res) => {
    try {
        const metrics = req.app.locals.system.loadBalancer.getMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add backend service
router.post('/backends', async (req, res) => {
    try {
        const result = await req.app.locals.system.addBackend(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update backend service
router.put('/backends/:id', async (req, res) => {
    try {
        const result = await req.app.locals.system.loadBalancer.updateBackend(req.params.id, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove backend service
router.delete('/backends/:id', async (req, res) => {
    try {
        const result = await req.app.locals.system.removeBackend(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get backend status
router.get('/backends/:id', async (req, res) => {
    try {
        const backends = req.app.locals.system.loadBalancer.getState().backends;
        const backend = backends.find(b => b.id === req.params.id);
        
        if (!backend) {
            return res.status(404).json({ error: 'Backend not found' });
        }
        
        res.json(backend);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get healthy backends
router.get('/backends/healthy', async (req, res) => {
    try {
        const backends = req.app.locals.system.loadBalancer.getHealthyBackends();
        res.json(backends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update load balancer configuration
router.put('/config', async (req, res) => {
    try {
        const config = req.body;
        req.app.locals.system.loadBalancer.config = { ...req.app.locals.system.loadBalancer.config, ...config };
        await req.app.locals.system.loadBalancer.updateLoadBalancerConfig();
        res.json({ success: true, config: req.app.locals.system.loadBalancer.config });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Initiate failover
router.post('/failover', async (req, res) => {
    try {
        await req.app.locals.system.executeFailover();
        res.json({ success: true, message: 'Failover initiated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Drain connections
router.post('/drain', async (req, res) => {
    try {
        await req.app.locals.system.loadBalancer.drainConnections();
        res.json({ success: true, message: 'Connection draining initiated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get load balancer algorithms
router.get('/algorithms', (req, res) => {
    res.json({
        algorithms: [
            'round-robin',
            'least-connections',
            'ip-hash',
            'weighted-round-robin'
        ],
        current: req.app.locals.system.loadBalancer.config.algorithm
    });
});

module.exports = router;