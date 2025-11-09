/**
 * Load Balancing & Auto-Scaling Management Interface
 * 
 * Web-based dashboard for managing load balancing, auto-scaling,
 * deployments, and monitoring.
 */

const express = require('express');
const path = require('path');

class ManagementInterface {
    constructor(loadBalancingSystem) {
        this.system = loadBalancingSystem;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.static(path.join(__dirname, '../public')));
        
        // API key authentication for sensitive operations
        this.app.use('/api', this.authenticate);
    }

    authenticate(req, res, next) {
        const apiKey = req.headers['x-api-key'];
        const validKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : ['default-key'];
        
        if (validKeys.includes(apiKey)) {
            next();
        } else {
            res.status(401).json({ error: 'Unauthorized' });
        }
    }

    setupRoutes() {
        // Dashboard main page
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });

        // API routes
        this.setupAPIRoutes();
    }

    setupAPIRoutes() {
        const router = express.Router();

        // Health and Status Routes
        router.get('/health', async (req, res) => {
            try {
                const health = await this.system.getHealthStatus();
                res.json(health);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Load Balancer Routes
        router.get('/load-balancer/status', async (req, res) => {
            try {
                const status = this.system.loadBalancer.getState();
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        router.post('/load-balancer/backends', async (req, res) => {
            try {
                const result = await this.system.addBackend(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        router.delete('/load-balancer/backends/:id', async (req, res) => {
            try {
                const result = await this.system.removeBackend(req.params.id);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Scaling Routes
        router.get('/scaling/policies', async (req, res) => {
            try {
                const state = this.system.scalingManager.getState();
                res.json(state);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        router.post('/scaling/policies', async (req, res) => {
            try {
                const policy = await this.system.scalingManager.createScalingPolicy(req.body.serviceId, req.body);
                res.json(policy);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        router.put('/scaling/policies/:serviceId', async (req, res) => {
            try {
                const policy = await this.system.scalingManager.updateScalingPolicy(req.params.serviceId, req.body);
                res.json(policy);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        router.post('/scaling/services/:serviceId/scale', async (req, res) => {
            try {
                const result = await this.system.scaleService(req.params.serviceId, req.body.targetInstances);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Deployment Routes
        router.get('/deployment/status', async (req, res) => {
            try {
                const state = this.system.deploymentManager.getState();
                res.json(state);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        router.post('/deployment/deploy', async (req, res) => {
            try {
                const result = await this.system.deployService(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        router.post('/deployment/:deploymentId/rollback', async (req, res) => {
            try {
                const result = await this.system.deploymentManager.rollbackDeployment(req.params.deploymentId);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Monitoring Routes
        router.get('/monitoring/metrics', async (req, res) => {
            try {
                const { startTime, endTime, aggregation } = req.query;
                let metrics;
                
                if (startTime && endTime) {
                    metrics = await this.system.getMetrics(startTime, endTime, aggregation);
                } else {
                    metrics = await this.system.getMetrics();
                }
                
                res.json(metrics);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        router.get('/monitoring/alerts', async (req, res) => {
            try {
                const alerts = this.system.healthMonitor.getState().alerts;
                res.json(alerts);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        router.post('/monitoring/alerts/:alertId/acknowledge', async (req, res) => {
            try {
                await this.system.healthMonitor.acknowledgeAlert(req.params.alertId, req.body.user);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Orchestration Routes
        router.get('/orchestration/deployments', async (req, res) => {
            try {
                const state = this.system.orchestrator.getState();
                res.json(state);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        router.post('/orchestration/deployments', async (req, res) => {
            try {
                const result = await this.system.orchestrator.createDeployment(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        router.post('/orchestration/deployments/:name/scale', async (req, res) => {
            try {
                const result = await this.system.orchestrator.scaleDeployment(req.params.name, req.body.replicas);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Disaster Recovery Routes
        router.get('/recovery/plans', async (req, res) => {
            try {
                const state = this.system.disasterRecovery.getState();
                res.json(state.recoveryPlans || []);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        router.post('/recovery/plans', async (req, res) => {
            try {
                const plan = await this.system.disasterRecovery.createRecoveryPlan(req.body);
                res.json(plan);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        router.post('/recovery/failover/:planId', async (req, res) => {
            try {
                const result = await this.system.disasterRecovery.initiateFailover(req.params.planId, req.body.reason);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Real-time metrics endpoint
        router.get('/metrics/realtime', async (req, res) => {
            try {
                const metrics = await this.system.getMetrics();
                const health = await this.system.getHealthStatus();
                
                res.json({
                    timestamp: new Date().toISOString(),
                    metrics,
                    health
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.use('/api', router);
    }

    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Load Balancing & Auto-Scaling Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa;
            color: #333;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .header .subtitle {
            opacity: 0.9;
            font-size: 0.9rem;
        }
        
        .container {
            display: flex;
            min-height: calc(100vh - 80px);
        }
        
        .sidebar {
            width: 250px;
            background: white;
            box-shadow: 2px 0 4px rgba(0,0,0,0.1);
            padding: 1rem 0;
        }
        
        .nav-item {
            padding: 0.75rem 1.5rem;
            cursor: pointer;
            border-left: 3px solid transparent;
            transition: all 0.2s;
        }
        
        .nav-item:hover, .nav-item.active {
            background: #f8fafc;
            border-left-color: #667eea;
        }
        
        .main-content {
            flex: 1;
            padding: 2rem;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .card {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .card h3 {
            font-size: 1.1rem;
            margin-bottom: 1rem;
            color: #4a5568;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #2d3748;
        }
        
        .metric-label {
            color: #718096;
            font-size: 0.9rem;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-healthy { background: #48bb78; }
        .status-warning { background: #ed8936; }
        .status-critical { background: #f56565; }
        
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background 0.2s;
        }
        
        .btn:hover {
            background: #5a67d8;
        }
        
        .btn-danger {
            background: #f56565;
        }
        
        .btn-danger:hover {
            background: #e53e3e;
        }
        
        .form-group {
            margin-bottom: 1rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }
        
        .form-group input, .form-group select, .form-group textarea {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            font-size: 0.9rem;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
        }
        
        .modal-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
        }
        
        .alert {
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1rem;
        }
        
        .alert-info {
            background: #bee3f8;
            color: #2c5282;
        }
        
        .alert-warning {
            background: #feebc8;
            color: #c05621;
        }
        
        .alert-critical {
            background: #fed7d7;
            color: #c53030;
        }
        
        .chart-container {
            position: relative;
            height: 300px;
            margin-top: 1rem;
        }
        
        .tab-container {
            margin-bottom: 1rem;
        }
        
        .tab {
            display: inline-block;
            padding: 0.5rem 1rem;
            background: #e2e8f0;
            border-radius: 4px 4px 0 0;
            cursor: pointer;
            margin-right: 4px;
        }
        
        .tab.active {
            background: #667eea;
            color: white;
        }
        
        .tab-content {
            display: none;
            padding: 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 0 4px 4px 4px;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: #667eea;
            transition: width 0.3s;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        
        .data-table th, .data-table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .data-table th {
            background: #f7fafc;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Load Balancing & Auto-Scaling Dashboard</h1>
        <div class="subtitle">Real-time monitoring and management</div>
    </div>
    
    <div class="container">
        <div class="sidebar">
            <div class="nav-item active" onclick="showSection('overview')">📊 Overview</div>
            <div class="nav-item" onclick="showSection('load-balancer')">⚖️ Load Balancer</div>
            <div class="nav-item" onclick="showSection('scaling')">📈 Auto-Scaling</div>
            <div class="nav-item" onclick="showSection('deployment')">🚀 Deployment</div>
            <div class="nav-item" onclick="showSection('monitoring')">📡 Monitoring</div>
            <div class="nav-item" onclick="showSection('orchestration')">🧩 Orchestration</div>
            <div class="nav-item" onclick="showSection('recovery')">🆘 Disaster Recovery</div>
        </div>
        
        <div class="main-content">
            <!-- Overview Section -->
            <div id="overview" class="section active">
                <div class="dashboard-grid">
                    <div class="card">
                        <h3>System Health</h3>
                        <div class="metric-value" id="systemHealth">-</div>
                        <div class="metric-label">Overall Health Score</div>
                    </div>
                    <div class="card">
                        <h3>Active Services</h3>
                        <div class="metric-value" id="activeServices">-</div>
                        <div class="metric-label">Currently Running</div>
                    </div>
                    <div class="card">
                        <h3>Request Rate</h3>
                        <div class="metric-value" id="requestRate">-</div>
                        <div class="metric-label">Requests per Second</div>
                    </div>
                    <div class="card">
                        <h3>Average Response Time</h3>
                        <div class="metric-value" id="responseTime">-</div>
                        <div class="metric-label">Millisecond</div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>Real-time Metrics</h3>
                    <div class="chart-container">
                        <canvas id="metricsChart"></canvas>
                    </div>
                </div>
                
                <div class="dashboard-grid">
                    <div class="card">
                        <h3>Active Alerts</h3>
                        <div id="activeAlerts">-</div>
                    </div>
                    <div class="card">
                        <h3>Deployments</h3>
                        <div id="activeDeployments">-</div>
                    </div>
                </div>
            </div>
            
            <!-- Load Balancer Section -->
            <div id="load-balancer" class="section">
                <div class="dashboard-grid">
                    <div class="card">
                        <h3>Backend Services</h3>
                        <button class="btn" onclick="showModal('addBackendModal')">Add Backend</button>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Service</th>
                                    <th>Status</th>
                                    <th>Response Time</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="backendTable">
                                <tr>
                                    <td colspan="4" style="text-align: center; color: #718096;">Loading...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Auto-Scaling Section -->
            <div id="scaling" class="section">
                <div class="card">
                    <h3>Scaling Policies</h3>
                    <button class="btn" onclick="showModal('addPolicyModal')">Create Policy</button>
                    <div id="scalingPolicies">
                        <div style="text-align: center; color: #718096; padding: 2rem;">Loading policies...</div>
                    </div>
                </div>
            </div>
            
            <!-- Deployment Section -->
            <div id="deployment" class="section">
                <div class="card">
                    <h3>Deployments</h3>
                    <button class="btn" onclick="showModal('deployModal')">New Deployment</button>
                    <div id="deployments">
                        <div style="text-align: center; color: #718096; padding: 2rem;">Loading deployments...</div>
                    </div>
                </div>
            </div>
            
            <!-- Monitoring Section -->
            <div id="monitoring" class="section">
                <div class="dashboard-grid">
                    <div class="card">
                        <h3>System Metrics</h3>
                        <div class="chart-container">
                            <canvas id="systemChart"></canvas>
                        </div>
                    </div>
                    <div class="card">
                        <h3>Alerts</h3>
                        <div id="alertsList">
                            <div style="text-align: center; color: #718096;">Loading alerts...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modals -->
    <div id="addBackendModal" class="modal">
        <div class="modal-content">
            <h3>Add Backend Service</h3>
            <form id="addBackendForm">
                <div class="form-group">
                    <label>Service Name</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Host</label>
                    <input type="text" name="host" required>
                </div>
                <div class="form-group">
                    <label>Port</label>
                    <input type="number" name="port" required>
                </div>
                <div class="form-group">
                    <label>Weight</label>
                    <input type="number" name="weight" value="1" min="1">
                </div>
                <button type="submit" class="btn">Add Backend</button>
                <button type="button" class="btn" onclick="hideModal('addBackendModal')">Cancel</button>
            </form>
        </div>
    </div>
    
    <div id="addPolicyModal" class="modal">
        <div class="modal-content">
            <h3>Create Scaling Policy</h3>
            <form id="addPolicyForm">
                <div class="form-group">
                    <label>Service ID</label>
                    <input type="text" name="serviceId" required>
                </div>
                <div class="form-group">
                    <label>CPU Threshold (%)</label>
                    <input type="number" name="cpuUtilization" value="70" min="1" max="100">
                </div>
                <div class="form-group">
                    <label>Memory Threshold (%)</label>
                    <input type="number" name="memoryUtilization" value="80" min="1" max="100">
                </div>
                <div class="form-group">
                    <label>Min Instances</label>
                    <input type="number" name="minInstances" value="2" min="1">
                </div>
                <div class="form-group">
                    <label>Max Instances</label>
                    <input type="number" name="maxInstances" value="10" min="1">
                </div>
                <button type="submit" class="btn">Create Policy</button>
                <button type="button" class="btn" onclick="hideModal('addPolicyModal')">Cancel</button>
            </form>
        </div>
    </div>
    
    <script>
        // Global variables
        let currentSection = 'overview';
        let metricsChart = null;
        let systemChart = null;
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            initializeCharts();
            loadOverviewData();
            startRealTimeUpdates();
        });
        
        // Navigation
        function showSection(section) {
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            
            document.getElementById(section).classList.add('active');
            event.target.classList.add('active');
            currentSection = section;
            
            loadSectionData(section);
        }
        
        // Charts initialization
        function initializeCharts() {
            const ctx1 = document.getElementById('metricsChart').getContext('2d');
            metricsChart = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Request Rate',
                        data: [],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Response Time (ms)',
                        data: [],
                        borderColor: '#ed8936',
                        backgroundColor: 'rgba(237, 137, 54, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            position: 'left'
                        },
                        y1: {
                            beginAtZero: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    }
                }
            });
            
            const ctx2 = document.getElementById('systemChart').getContext('2d');
            systemChart = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['CPU', 'Memory', 'Available'],
                    datasets: [{
                        data: [30, 40, 30],
                        backgroundColor: ['#667eea', '#ed8936', '#e2e8f0']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        // Data loading functions
        async function loadOverviewData() {
            try {
                const response = await axios.get('/api/metrics/realtime');
                const data = response.data;
                
                document.getElementById('systemHealth').textContent = Math.round(data.health.healthScore || 0);
                document.getElementById('activeServices').textContent = data.health.healthyServices || 0;
                document.getElementById('requestRate').textContent = Math.round(data.metrics.application?.requestsPerSecond || 0);
                document.getElementById('responseTime').textContent = Math.round(data.metrics.application?.averageResponseTime || 0);
                
                updateCharts(data);
            } catch (error) {
                console.error('Failed to load overview data:', error);
            }
        }
        
        async function loadLoadBalancerData() {
            try {
                const response = await axios.get('/api/load-balancer/status');
                const data = response.data;
                
                const tableBody = document.getElementById('backendTable');
                tableBody.innerHTML = '';
                
                data.backends?.forEach(backend => {
                    const row = document.createElement('tr');
                    row.innerHTML = \`
                        <td>\${backend.name || backend.id}</td>
                        <td><span class="status-indicator \${backend.healthy ? 'status-healthy' : 'status-critical'}"></span>\${backend.healthy ? 'Healthy' : 'Unhealthy'}</td>
                        <td>\${Math.round(backend.responseTime || 0)}ms</td>
                        <td>
                            <button class="btn" onclick="editBackend('\${backend.id}')">Edit</button>
                            <button class="btn btn-danger" onclick="removeBackend('\${backend.id}')">Remove</button>
                        </td>
                    \`;
                    tableBody.appendChild(row);
                });
            } catch (error) {
                console.error('Failed to load load balancer data:', error);
            }
        }
        
        async function loadScalingData() {
            try {
                const response = await axios.get('/api/scaling/policies');
                const data = response.data;
                
                const container = document.getElementById('scalingPolicies');
                container.innerHTML = '';
                
                data.policies?.forEach(policy => {
                    const policyDiv = document.createElement('div');
                    policyDiv.className = 'card';
                    policyDiv.innerHTML = \`
                        <h4>\${policy.serviceId}</h4>
                        <p>CPU Threshold: \${policy.targetUtilization.cpu}%</p>
                        <p>Memory Threshold: \${policy.targetUtilization.memory}%</p>
                        <p>Min Instances: \${policy.scalingRules.scaleDown.actions.minInstances}</p>
                        <p>Max Instances: \${policy.scalingRules.scaleUp.actions.maxInstances}</p>
                        <button class="btn" onclick="editPolicy('\${policy.serviceId}')">Edit</button>
                        <button class="btn btn-danger" onclick="deletePolicy('\${policy.serviceId}')">Delete</button>
                    \`;
                    container.appendChild(policyDiv);
                });
            } catch (error) {
                console.error('Failed to load scaling data:', error);
            }
        }
        
        async function loadDeploymentData() {
            try {
                const response = await axios.get('/api/deployment/status');
                const data = response.data;
                
                const container = document.getElementById('deployments');
                container.innerHTML = '';
                
                data.deployments?.forEach(deployment => {
                    const deploymentDiv = document.createElement('div');
                    deploymentDiv.className = 'card';
                    deploymentDiv.innerHTML = \`
                        <h4>\${deployment.serviceName} v\${deployment.version}</h4>
                        <p>Status: <span class="status-indicator status-\${deployment.status === 'completed' ? 'healthy' : 'warning'}"></span>\${deployment.status}</p>
                        <p>Strategy: \${deployment.strategy}</p>
                        <p>Started: \${new Date(deployment.metrics.startTime).toLocaleString()}</p>
                        <button class="btn" onclick="viewDeployment('\${deployment.id}')">View Details</button>
                    \`;
                    container.appendChild(deploymentDiv);
                });
            } catch (error) {
                console.error('Failed to load deployment data:', error);
            }
        }
        
        async function loadMonitoringData() {
            try {
                const response = await axios.get('/api/monitoring/alerts');
                const data = response.data;
                
                const container = document.getElementById('alertsList');
                container.innerHTML = '';
                
                data.forEach(alert => {
                    const alertDiv = document.createElement('div');
                    alertDiv.className = \`alert alert-\${alert.severity}\`;
                    alertDiv.innerHTML = \`
                        <strong>\${alert.type}</strong><br>
                        \${alert.message}<br>
                        <small>\${new Date(alert.timestamp).toLocaleString()}</small>
                        \${!alert.acknowledged ? '<button class="btn" onclick="acknowledgeAlert(\\'' + alert.id + '\\')">Acknowledge</button>' : ''}
                    \`;
                    container.appendChild(alertDiv);
                });
            } catch (error) {
                console.error('Failed to load monitoring data:', error);
            }
        }
        
        // Real-time updates
        function startRealTimeUpdates() {
            setInterval(() => {
                if (currentSection === 'overview') {
                    loadOverviewData();
                }
            }, 5000);
        }
        
        // Utility functions
        function updateCharts(data) {
            const now = new Date().toLocaleTimeString();
            
            metricsChart.data.labels.push(now);
            metricsChart.data.datasets[0].data.push(data.metrics.application?.requestsPerSecond || 0);
            metricsChart.data.datasets[1].data.push(data.metrics.application?.averageResponseTime || 0);
            
            // Keep only last 20 data points
            if (metricsChart.data.labels.length > 20) {
                metricsChart.data.labels.shift();
                metricsChart.data.datasets.forEach(dataset => dataset.data.shift());
            }
            
            metricsChart.update('none');
        }
        
        function showModal(modalId) {
            document.getElementById(modalId).style.display = 'block';
        }
        
        function hideModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }
        
        function loadSectionData(section) {
            switch (section) {
                case 'load-balancer':
                    loadLoadBalancerData();
                    break;
                case 'scaling':
                    loadScalingData();
                    break;
                case 'deployment':
                    loadDeploymentData();
                    break;
                case 'monitoring':
                    loadMonitoringData();
                    break;
            }
        }
        
        // Form handlers
        document.getElementById('addBackendForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            try {
                await axios.post('/api/load-balancer/backends', data);
                hideModal('addBackendModal');
                loadLoadBalancerData();
            } catch (error) {
                alert('Failed to add backend: ' + error.response.data.error);
            }
        });
        
        document.getElementById('addPolicyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            try {
                await axios.post('/api/scaling/policies', data);
                hideModal('addPolicyModal');
                loadScalingData();
            } catch (error) {
                alert('Failed to create policy: ' + error.response.data.error);
            }
        });
    </script>
</body>
</html>`;
    }

    getExpressApp() {
        return this.app;
    }
}

module.exports = ManagementInterface;