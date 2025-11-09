/**
 * Scaling API Routes
 */

const express = require('express');
const router = express.Router();

// Get scaling status
router.get('/status', async (req, res) => {
    try {
        const status = req.app.locals.system.scalingManager.getState();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get scaling metrics
router.get('/metrics', async (req, res) => {
    try {
        const metrics = req.app.locals.system.scalingManager.getMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all scaling policies
router.get('/policies', async (req, res) => {
    try {
        const policies = req.app.locals.system.scalingManager.getState().policies;
        res.json(policies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create scaling policy
router.post('/policies', async (req, res) => {
    try {
        const { serviceId, ...policyConfig } = req.body;
        const policy = await req.app.locals.system.scalingManager.createScalingPolicy(serviceId, policyConfig);
        res.json(policy);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update scaling policy
router.put('/policies/:serviceId', async (req, res) => {
    try {
        const policy = await req.app.locals.system.scalingManager.updateScalingPolicy(req.params.serviceId, req.body);
        res.json(policy);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete scaling policy
router.delete('/policies/:serviceId', async (req, res) => {
    try {
        const result = await req.app.locals.system.scalingManager.deleteScalingPolicy(req.params.serviceId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manual scaling
router.post('/services/:serviceId/scale', async (req, res) => {
    try {
        const { targetInstances } = req.body;
        const result = await req.app.locals.system.scaleService(req.params.serviceId, targetInstances);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get scaling history
router.get('/history', async (req, res) => {
    try {
        const history = req.app.locals.system.scalingManager.getState().scalingHistory;
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get instances for a service
router.get('/services/:serviceId/instances', async (req, res) => {
    try {
        const instances = await req.app.locals.system.scalingManager.getInstancesForService(req.params.serviceId);
        res.json(instances);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current instance count
router.get('/services/:serviceId/count', async (req, res) => {
    try {
        const count = await req.app.locals.system.scalingManager.getCurrentInstanceCount(req.params.serviceId);
        res.json({ serviceId: req.params.serviceId, instanceCount: count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Evaluate scaling conditions
router.post('/evaluate/:serviceId', async (req, res) => {
    try {
        const policy = req.app.locals.system.scalingManager.config.policies.get(req.params.serviceId);
        const metrics = req.body.metrics;
        const decision = await req.app.locals.system.scalingManager.evaluateServiceScaling(req.params.serviceId, policy, metrics);
        res.json(decision);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get scaling policies by service
router.get('/policies/service/:serviceId', async (req, res) => {
    try {
        const policies = req.app.locals.system.scalingManager.config.policies;
        const policy = policies.get(req.params.serviceId);
        
        if (!policy) {
            return res.status(404).json({ error: 'Policy not found' });
        }
        
        res.json(policy);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;