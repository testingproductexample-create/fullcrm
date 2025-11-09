/**
 * Deployment API Routes
 */

const express = require('express');
const router = express.Router();

// Get deployment status
router.get('/status', async (req, res) => {
    try {
        const status = req.app.locals.system.deploymentManager.getState();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get deployment metrics
router.get('/metrics', async (req, res) => {
    try {
        const metrics = req.app.locals.system.deploymentManager.getMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new deployment
router.post('/deploy', async (req, res) => {
    try {
        const result = await req.app.locals.system.deployService(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get deployment status
router.get('/deployments/:id', async (req, res) => {
    try {
        const deployments = req.app.locals.system.deploymentManager.getState().deployments;
        const deployment = deployments.find(d => d.id === req.params.id);
        
        if (!deployment) {
            return res.status(404).json({ error: 'Deployment not found' });
        }
        
        res.json(deployment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all deployments
router.get('/deployments', async (req, res) => {
    try {
        const deployments = req.app.locals.system.deploymentManager.getState().deployments;
        res.json(deployments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rollback deployment
router.post('/deployments/:id/rollback', async (req, res) => {
    try {
        const deployments = req.app.locals.system.deploymentManager.getState().deployments;
        const deployment = deployments.find(d => d.id === req.params.id);
        
        if (!deployment) {
            return res.status(404).json({ error: 'Deployment not found' });
        }
        
        await req.app.locals.system.deploymentManager.rollbackDeployment(deployment);
        res.json({ success: true, message: 'Rollback initiated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check deployment health
router.get('/deployments/:id/health', async (req, res) => {
    try {
        const healthStatus = await req.app.locals.system.deploymentManager.checkDeploymentHealth();
        res.json(healthStatus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get deployment strategies
router.get('/strategies', (req, res) => {
    res.json({
        strategies: [
            'blue-green',
            'canary',
            'rolling',
            'recreate'
        ],
        current: req.app.locals.system.deploymentManager.config.defaultStrategy
    });
});

// Get rollback history
router.get('/rollback-history', async (req, res) => {
    try {
        const history = req.app.locals.system.deploymentManager.getState().rollbackHistory;
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get active deployments
router.get('/active', async (req, res) => {
    try {
        const activeDeployments = req.app.locals.system.deploymentManager.getState().activeDeployments;
        res.json(activeDeployments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update deployment
router.put('/deployments/:id', async (req, res) => {
    try {
        const result = await req.app.locals.system.deploymentManager.updateDeployment(req.params.id, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete deployment
router.delete('/deployments/:id', async (req, res) => {
    try {
        const deployments = req.app.locals.system.deploymentManager.getState().deployments;
        const deployment = deployments.find(d => d.id === req.params.id);
        
        if (!deployment) {
            return res.status(404).json({ error: 'Deployment not found' });
        }
        
        await req.app.locals.system.deploymentManager.deleteDeployment(deployment.serviceName);
        res.json({ success: true, message: 'Deployment deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test deployment strategy
router.post('/test-strategy', async (req, res) => {
    try {
        const { strategy, config } = req.body;
        const testResult = await req.app.locals.system.deploymentManager.testDeploymentStrategy(strategy, config);
        res.json(testResult);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;