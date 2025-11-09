/**
 * Disaster Recovery API Routes
 */

const express = require('express');
const router = express.Router();

// Get disaster recovery status
router.get('/status', async (req, res) => {
    try {
        const status = req.app.locals.system.disasterRecovery.getState();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get disaster recovery metrics
router.get('/metrics', async (req, res) => {
    try {
        const metrics = req.app.locals.system.disasterRecovery.getMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all recovery plans
router.get('/plans', async (req, res) => {
    try {
        const state = req.app.locals.system.disasterRecovery.getState();
        res.json(state.recoveryPlans || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create recovery plan
router.post('/plans', async (req, res) => {
    try {
        const plan = await req.app.locals.system.disasterRecovery.createRecoveryPlan(req.body);
        res.json(plan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific recovery plan
router.get('/plans/:planId', async (req, res) => {
    try {
        const state = req.app.locals.system.disasterRecovery.getState();
        const plan = state.recoveryPlans.find(p => p.id === req.params.planId);
        
        if (!plan) {
            return res.status(404).json({ error: 'Recovery plan not found' });
        }
        
        res.json(plan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update recovery plan
router.put('/plans/:planId', async (req, res) => {
    try {
        const plan = await req.app.locals.system.disasterRecovery.updateRecoveryPlan(req.params.planId, req.body);
        res.json(plan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete recovery plan
router.delete('/plans/:planId', async (req, res) => {
    try {
        const result = await req.app.locals.system.disasterRecovery.deleteRecoveryPlan(req.params.planId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test recovery plan
router.post('/plans/:planId/test', async (req, res) => {
    try {
        const result = await req.app.locals.system.disasterRecovery.testRecoveryPlan(req.params.planId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Initiate failover
router.post('/failover/:planId', async (req, res) => {
    try {
        const { reason } = req.body;
        const result = await req.app.locals.system.disasterRecovery.initiateFailover(req.params.planId, reason);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get failover history
router.get('/failover-history', async (req, res) => {
    try {
        const state = req.app.locals.system.disasterRecovery.getState();
        res.json(state.failoverEvents || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get recovery history
router.get('/recovery-history', async (req, res) => {
    try {
        const state = req.app.locals.system.disasterRecovery.getState();
        res.json(state.recoveryHistory || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Execute recovery
router.post('/recovery', async (req, res) => {
    try {
        const { planId, backupId, targetEnvironment } = req.body;
        const result = await req.app.locals.system.disasterRecovery.executeRecovery(planId, backupId, targetEnvironment);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create backup
router.post('/backups', async (req, res) => {
    try {
        const backup = await req.app.locals.system.disasterRecovery.createBackup(req.body);
        res.json(backup);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get backup jobs
router.get('/backup-jobs', async (req, res) => {
    try {
        const state = req.app.locals.system.disasterRecovery.getState();
        res.json(state.backupJobs || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Schedule backup
router.post('/backup-jobs', async (req, res) => {
    try {
        const job = await req.app.locals.system.disasterRecovery.scheduleBackup(req.body);
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get system state
router.get('/system-state', async (req, res) => {
    try {
        const state = req.app.locals.system.disasterRecovery.getState();
        res.json(state.systemState);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save system state
router.post('/system-state', async (req, res) => {
    try {
        await req.app.locals.system.disasterRecovery.saveSystemState(req.body);
        res.json({ success: true, message: 'System state saved' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Load system state
router.get('/system-state/load', async (req, res) => {
    try {
        const state = await req.app.locals.system.disasterRecovery.loadSystemState();
        res.json(state);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get backup locations
router.get('/backup-locations', (req, res) => {
    res.json({
        location: req.app.locals.system.disasterRecovery.config.backupLocation,
        retentionDays: req.app.locals.system.disasterRecovery.config.backupRetentionDays
    });
});

// Validate recovery plan
router.post('/plans/:planId/validate', async (req, res) => {
    try {
        const state = req.app.locals.system.disasterRecovery.getState();
        const plan = state.recoveryPlans.find(p => p.id === req.params.planId);
        
        if (!plan) {
            return res.status(404).json({ error: 'Recovery plan not found' });
        }
        
        await req.app.locals.system.disasterRecovery.validateRecoveryPlan(plan);
        res.json({ success: true, message: 'Recovery plan is valid' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;