const express = require('express');
const path = require('path');
const { getSecurityMetrics, getRealTimeMetrics } = require('../utils/securityMetrics');
const { getActiveAlerts, getAlertHistory, getAlertStatistics } = require('../utils/alertSystem');
const { listUserApiKeys, getApiKeyStatistics } = require('../utils/apiKeyManager');
const { updateMetrics } = require('../utils/securityMetrics');

/**
 * API Security Dashboard
 * Web-based monitoring and management interface
 */

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3002;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Security headers for dashboard
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

/**
 * Dashboard Routes
 */

// Main dashboard page
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Security Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
            .metric-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                transition: transform 0.3s ease;
            }
            .metric-card:hover {
                transform: translateY(-5px);
            }
            .alert-critical { border-left: 5px solid #ef4444; }
            .alert-high { border-left: 5px solid #f59e0b; }
            .alert-medium { border-left: 5px solid #eab308; }
            .alert-low { border-left: 5px solid #22c55e; }
            .status-online { color: #22c55e; }
            .status-offline { color: #ef4444; }
            .chart-container { position: relative; height: 300px; }
        </style>
    </head>
    <body class="bg-gray-100 font-sans">
        <div class="min-h-screen">
            <!-- Header -->
            <header class="bg-white shadow-lg">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center py-6">
                        <div class="flex items-center">
                            <i class="fas fa-shield-alt text-3xl text-blue-600 mr-3"></i>
                            <h1 class="text-2xl font-bold text-gray-900">API Security Dashboard</h1>
                        </div>
                        <div class="flex items-center space-x-4">
                            <span id="system-status" class="text-sm text-gray-600">
                                <i class="fas fa-circle text-green-500 mr-1"></i>System Online
                            </span>
                            <span id="last-update" class="text-sm text-gray-500"></span>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Main Content -->
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <!-- Real-time Metrics -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="metric-card rounded-lg shadow-lg p-6 text-white">
                        <div class="flex items-center">
                            <i class="fas fa-server text-3xl mr-4"></i>
                            <div>
                                <h3 class="text-lg font-semibold">Requests/Min</h3>
                                <p id="requests-per-minute" class="text-3xl font-bold">0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="metric-card rounded-lg shadow-lg p-6 text-white">
                        <div class="flex items-center">
                            <i class="fas fa-shield-alt text-3xl mr-4"></i>
                            <div>
                                <h3 class="text-lg font-semibold">Active Alerts</h3>
                                <p id="active-alerts" class="text-3xl font-bold">0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="metric-card rounded-lg shadow-lg p-6 text-white">
                        <div class="flex items-center">
                            <i class="fas fa-key text-3xl mr-4"></i>
                            <div>
                                <h3 class="text-lg font-semibold">API Keys</h3>
                                <p id="api-keys-count" class="text-3xl font-bold">0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="metric-card rounded-lg shadow-lg p-6 text-white">
                        <div class="flex items-center">
                            <i class="fas fa-clock text-3xl mr-4"></i>
                            <div>
                                <h3 class="text-lg font-semibold">Uptime</h3>
                                <p id="uptime" class="text-3xl font-bold">0h</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <!-- Request Volume Chart -->
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h3 class="text-lg font-semibold mb-4">Request Volume (Last 24 Hours)</h3>
                        <div class="chart-container">
                            <canvas id="requestChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Security Alerts Chart -->
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h3 class="text-lg font-semibold mb-4">Security Alerts (Last 7 Days)</h3>
                        <div class="chart-container">
                            <canvas id="alertsChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Data Tables Section -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Active Alerts -->
                    <div class="bg-white rounded-lg shadow-lg">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <h3 class="text-lg font-semibold">Active Security Alerts</h3>
                        </div>
                        <div class="overflow-hidden">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                    </tr>
                                </thead>
                                <tbody id="alerts-table" class="bg-white divide-y divide-gray-200">
                                    <!-- Alerts will be populated here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Top Endpoints -->
                    <div class="bg-white rounded-lg shadow-lg">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <h3 class="text-lg font-semibold">Top Endpoints</h3>
                        </div>
                        <div class="overflow-hidden">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Response</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                                    </tr>
                                </thead>
                                <tbody id="endpoints-table" class="bg-white divide-y divide-gray-200">
                                    <!-- Endpoints will be populated here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- System Status Section -->
                <div class="mt-8 bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-lg font-semibold mb-4">System Status</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-600" id="system-uptime">0 hours</div>
                            <div class="text-sm text-gray-600">Total Uptime</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-blue-600" id="total-requests">0</div>
                            <div class="text-sm text-gray-600">Total Requests</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-purple-600" id="rate-limit-blocks">0</div>
                            <div class="text-sm text-gray-600">Rate Limit Blocks</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>

        <script>
            // WebSocket connection for real-time updates
            const socket = io();
            
            // Charts initialization
            let requestChart, alertsChart;
            
            function initCharts() {
                // Request Volume Chart
                const requestCtx = document.getElementById('requestChart').getContext('2d');
                requestChart = new Chart(requestCtx, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Requests',
                            data: [],
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
                
                // Security Alerts Chart
                const alertsCtx = document.getElementById('alertsChart').getContext('2d');
                alertsChart = new Chart(alertsCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Critical', 'High', 'Medium', 'Low'],
                        datasets: [{
                            data: [0, 0, 0, 0],
                            backgroundColor: ['#ef4444', '#f59e0b', '#eab308', '#22c55e']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            }
            
            // Update dashboard data
            async function updateDashboard() {
                try {
                    const [realtime, metrics, alerts] = await Promise.all([
                        fetch('/api/dashboard/real-time').then(r => r.json()),
                        fetch('/api/dashboard/metrics').then(r => r.json()),
                        fetch('/api/dashboard/alerts').then(r => r.json())
                    ]);
                    
                    // Update metrics cards
                    document.getElementById('requests-per-minute').textContent = realtime.requestsPerMinute;
                    document.getElementById('active-alerts').textContent = alerts.active;
                    document.getElementById('api-keys-count').textContent = metrics.apiKeys.totalKeys;
                    document.getElementById('uptime').textContent = \`\${realtime.uptime.hours}h\`;
                    
                    // Update system status
                    document.getElementById('system-uptime').textContent = \`\${realtime.uptime.hours} hours\`;
                    document.getElementById('total-requests').textContent = metrics.requests.total.toLocaleString();
                    document.getElementById('rate-limit-blocks').textContent = metrics.rateLimiting.totalBlocks;
                    
                    // Update alerts table
                    updateAlertsTable(alerts.activeAlerts);
                    
                    // Update endpoints table
                    updateEndpointsTable(metrics.requests.topEndpoints);
                    
                    // Update last update time
                    document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
                    
                    // Update charts
                    updateCharts(realtime, metrics);
                    
                } catch (error) {
                    console.error('Failed to update dashboard:', error);
                }
            }
            
            function updateAlertsTable(alerts) {
                const tbody = document.getElementById('alerts-table');
                tbody.innerHTML = alerts.map(alert => \`
                    <tr class="alert-\${alert.severity}">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                \${alert.severity.toUpperCase()}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${alert.type}</td>
                        <td class="px-6 py-4 text-sm text-gray-900">\${alert.message}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${new Date(alert.timestamp).toLocaleTimeString()}</td>
                    </tr>
                \`).join('');
            }
            
            function updateEndpointsTable(endpoints) {
                const tbody = document.getElementById('endpoints-table');
                tbody.innerHTML = endpoints.map(endpoint => \`
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${endpoint.endpoint}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${endpoint.count}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${endpoint.avgResponseTime}ms</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${endpoint.successRate || 100}%</td>
                    </tr>
                \`).join('');
            }
            
            function updateCharts(realtime, metrics) {
                // Update request chart (simplified for demo)
                const now = new Date();
                const label = now.toLocaleTimeString();
                
                requestChart.data.labels.push(label);
                requestChart.data.datasets[0].data.push(realtime.requestsPerMinute);
                
                // Keep only last 20 data points
                if (requestChart.data.labels.length > 20) {
                    requestChart.data.labels.shift();
                    requestChart.data.datasets[0].data.shift();
                }
                
                requestChart.update();
                
                // Update alerts chart
                const bySeverity = metrics.security.bySeverity || {};
                alertsChart.data.datasets[0].data = [
                    bySeverity.critical || 0,
                    bySeverity.high || 0,
                    bySeverity.medium || 0,
                    bySeverity.low || 0
                ];
                alertsChart.update();
            }
            
            // Initialize dashboard
            document.addEventListener('DOMContentLoaded', function() {
                initCharts();
                updateDashboard();
                
                // Update every 30 seconds
                setInterval(updateDashboard, 30000);
            });
            
            // WebSocket event listeners
            socket.on('metricsUpdate', function(data) {
                console.log('Real-time metrics update:', data);
                updateDashboard();
            });
            
            socket.on('newAlert', function(alert) {
                console.log('New security alert:', alert);
                updateDashboard();
            });
        </script>
    </body>
    </html>
  `);
});

/**
 * API Routes for Dashboard
 */

// Real-time metrics endpoint
app.get('/api/dashboard/real-time', async (req, res) => {
  try {
    const metrics = await getRealTimeMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Full metrics endpoint
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const metrics = await getSecurityMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alerts endpoint
app.get('/api/dashboard/alerts', (req, res) => {
  try {
    const activeAlerts = getActiveAlerts();
    const statistics = getAlertStatistics();
    res.json({
      active: activeAlerts.length,
      activeAlerts,
      statistics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Keys summary endpoint
app.get('/api/dashboard/api-keys', (req, res) => {
  try {
    const statistics = getApiKeyStatistics();
    res.json(statistics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System health endpoint
app.get('/api/dashboard/health', (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api_security: 'running',
        rate_limiting: 'running',
        webhook_validation: 'running',
        alert_system: 'running',
        logging: 'running'
      },
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rate limiting statistics endpoint
app.get('/api/dashboard/rate-limits', (req, res) => {
  try {
    const stats = {
      totalBlocks: metrics.rateLimiting.totalBlocks,
      byStrategy: Object.fromEntries(metrics.rateLimiting.byStrategy),
      topOffenders: Array.from(metrics.rateLimiting.byIP.entries())
        .sort((a, b) => b[1].blocks - a[1].blocks)
        .slice(0, 10)
        .map(([ip, data]) => ({ ip, blocks: data.blocks, lastBlock: data.lastBlock }))
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Security logs endpoint (last 100 entries)
app.get('/api/dashboard/logs', (req, res) => {
  try {
    // This would typically read from log files
    // For demo purposes, return mock data
    const logs = Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      level: ['info', 'warn', 'error'][Math.floor(Math.random() * 3)],
      message: `Security event ${i + 1}`,
      category: ['auth', 'rate_limit', 'webhook'][Math.floor(Math.random() * 3)]
    }));
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test alert creation endpoint
app.post('/api/dashboard/test-alert', (req, res) => {
  try {
    const { type = 'test_alert', severity = 'medium', message = 'Test alert' } = req.body;
    const { createSecurityAlert } = require('../utils/alertSystem');
    
    const result = createSecurityAlert({
      type,
      severity,
      message,
      metadata: { test: true, dashboard: true }
    });
    
    res.json({ success: true, alertId: result.alertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset metrics endpoint
app.post('/api/dashboard/reset-metrics', (req, res) => {
  try {
    const { resetMetrics } = require('../utils/securityMetrics');
    resetMetrics();
    res.json({ success: true, message: 'Metrics reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Error handling
app.use((error, req, res, next) => {
  console.error('Dashboard error:', error);
  res.status(500).json({ 
    error: 'Dashboard error',
    message: error.message 
  });
});

module.exports = app;