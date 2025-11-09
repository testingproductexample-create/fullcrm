/**
 * Orchestration API Routes
 */

const express = require('express');
const router = express.Router();

// Get orchestration status
router.get('/status', async (req, res) => {
    try {
        const status = req.app.locals.system.orchestrator.getState();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get orchestration metrics
router.get('/metrics', async (req, res) => {
    try {
        const metrics = req.app.locals.system.orchestrator.getMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create deployment
router.post('/deployments', async (req, res) => {
    try {
        const result = await req.app.locals.system.orchestrator.createDeployment(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all deployments
router.get('/deployments', async (req, res) => {
    try {
        const deployments = req.app.locals.system.orchestrator.getState().deployments;
        res.json(deployments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific deployment
router.get('/deployments/:name', async (req, res) => {
    try {
        const deployments = req.app.locals.system.orchestrator.getState().deployments;
        const deployment = deployments.find(d => d.name === req.params.name);
        
        if (!deployment) {
            return res.status(404).json({ error: 'Deployment not found' });
        }
        
        res.json(deployment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update deployment
router.put('/deployments/:name', async (req, res) => {
    try {
        const result = await req.app.locals.system.orchestrator.updateDeployment(req.params.name, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete deployment
router.delete('/deployments/:name', async (req, res) => {
    try {
        const result = await req.app.locals.system.orchestrator.deleteDeployment(req.params.name);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Scale deployment
router.post('/deployments/:name/scale', async (req, res) => {
    try {
        const { replicas } = req.body;
        const result = await req.app.locals.system.orchestrator.scaleDeployment(req.params.name, replicas);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get deployment status
router.get('/deployments/:name/status', async (req, res) => {
    try {
        const result = await req.app.locals.system.orchestrator.getDeploymentStatus(req.params.name);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create service
router.post('/services', async (req, res) => {
    try {
        const result = await req.app.locals.system.orchestrator.createService(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all services
router.get('/services', async (req, res) => {
    try {
        const services = req.app.locals.system.orchestrator.getState().services;
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific service
router.get('/services/:name', async (req, res) => {
    try {
        const services = req.app.locals.system.orchestrator.getState().services;
        const service = services.find(s => s.name === req.params.name);
        
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        res.json(service);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create ConfigMap
router.post('/configmaps', async (req, res) => {
    try {
        const result = await req.app.locals.system.orchestrator.createConfigMap(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all ConfigMaps
router.get('/configmaps', async (req, res) => {
    try {
        const configMaps = req.app.locals.system.orchestrator.getState().configMaps;
        res.json(configMaps);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Secret
router.post('/secrets', async (req, res) => {
    try {
        const result = await req.app.locals.system.orchestrator.createSecret(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all Secrets
router.get('/secrets', async (req, res) => {
    try {
        const secrets = req.app.locals.system.orchestrator.getState().secrets;
        res.json(secrets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create PersistentVolumeClaim
router.post('/pvcs', async (req, res) => {
    try {
        const result = await req.app.locals.system.orchestrator.createPersistentVolumeClaim(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all PersistentVolumeClaims
router.get('/pvcs', async (req, res) => {
    try {
        const pvcs = req.app.locals.system.orchestrator.getState().persistentVolumes;
        res.json(pvcs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get available platforms
router.get('/platforms', (req, res) => {
    res.json({
        platforms: ['kubernetes', 'docker-swarm', 'docker-compose'],
        current: req.app.locals.system.orchestrator.config.platform
    });
});

module.exports = router;