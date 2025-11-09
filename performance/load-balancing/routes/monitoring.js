/**
 * Monitoring API Routes
 */

const express = require('express');
const router = express.Router();

// Get current metrics
router.get('/metrics', async (req, res) => {
    try {
        const { startTime, endTime, aggregation } = req.query;
        let metrics;
        
        if (startTime && endTime) {
            metrics = await req.app.locals.system.getMetrics(startTime, endTime, aggregation);
        } else {
            metrics = await req.app.locals.system.getMetrics();
        }
        
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get real-time metrics
router.get('/metrics/realtime', async (req, res) => {
    try {
        const metrics = await req.app.locals.system.getMetrics();
        const health = await req.app.locals.system.getHealthStatus();
        
        res.json({
            timestamp: new Date().toISOString(),
            metrics,
            health
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get aggregated metrics
router.get('/metrics/aggregated', async (req, res) => {
    try {
        const { timeRange, aggregation } = req.query;
        const metrics = await req.app.locals.system.monitoringService.getAggregatedMetrics(
            parseInt(timeRange), 
            aggregation
        );
        res.json(metrics);
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

// Resolve alert
router.post('/alerts/:alertId/resolve', async (req, res) => {
    try {
        const { user } = req.body;
        await req.app.locals.system.healthMonitor.resolveAlert(req.params.alertId, user);
        res.json({ success: true, message: 'Alert resolved' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get monitoring status
router.get('/status', async (req, res) => {
    try {
        const status = req.app.locals.system.monitoringService.getState();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get monitoring metrics
router.get('/metrics-dashboard', async (req, res) => {
    try {
        const metrics = req.app.locals.system.monitoringService.getMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create dashboard
router.post('/dashboards', async (req, res) => {
    try {
        const dashboard = await req.app.locals.system.monitoringService.createDashboard(req.body);
        res.json(dashboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get dashboards
router.get('/dashboards', async (req, res) => {
    try {
        const dashboards = await req.app.locals.system.monitoringService.listDashboards();
        res.json(dashboards);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific dashboard
router.get('/dashboards/:id', async (req, res) => {
    try {
        const dashboard = await req.app.locals.system.monitoringService.getDashboard(req.params.id);
        if (!dashboard) {
            return res.status(404).json({ error: 'Dashboard not found' });
        }
        res.json(dashboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export metrics
router.get('/export', async (req, res) => {
    try {
        const { format, startTime, endTime } = req.query;
        const metrics = await req.app.locals.system.getMetrics(startTime, endTime);
        
        if (format === 'csv') {
            // Convert to CSV format
            const csv = convertToCSV(metrics);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="metrics.csv"');
            res.send(csv);
        } else {
            res.json(metrics);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stop monitoring
router.post('/stop', async (req, res) => {
    try {
        req.app.locals.system.monitoringService.stopMonitoring();
        res.json({ success: true, message: 'Monitoring stopped' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start monitoring
router.post('/start', async (req, res) => {
    try {
        req.app.locals.system.monitoringService.startMonitoring();
        res.json({ success: true, message: 'Monitoring started' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Utility function to convert metrics to CSV
function convertToCSV(metrics) {
    const headers = ['timestamp', 'cpu_usage', 'memory_usage', 'response_time', 'request_rate'];
    const rows = metrics.map(metric => [
        metric.timestamp,
        metric.system?.cpu?.usage || 0,
        metric.system?.memory?.usage || 0,
        metric.application?.averageResponseTime || 0,
        metric.business?.requestsPerSecond || 0
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\\n');
}

module.exports = router;