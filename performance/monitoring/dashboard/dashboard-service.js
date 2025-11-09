const express = require('express');
const path = require('path');
const fs = require('fs').promises;

class DashboardService {
    constructor(config = {}) {
        this.config = {
            port: config.port || 3001,
            host: config.host || 'localhost',
            enableAuthentication: config.enableAuthentication || false,
            staticPath: config.staticPath || path.join(__dirname, 'public'),
            updateInterval: config.updateInterval || 5000, // 5 seconds
            ...config
        };
        
        this.app = express();
        this.server = null;
        this.isRunning = false;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocket();
    }

    setupMiddleware() {
        // Basic middleware
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            res.header('Access-Control-Max-Age', '86400');
            
            if (req.method === 'OPTIONS') {
                return res.status(200).end();
            }
            next();
        });

        // Authentication middleware
        if (this.config.enableAuthentication) {
            this.app.use(this.authMiddleware());
        }
    }

    authMiddleware() {
        return (req, res, next) => {
            const auth = req.headers.authorization;
            
            if (!auth || !auth.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            const token = auth.substring(7);
            // In a real implementation, validate the JWT token
            // For now, just check if it matches a configured token
            if (token !== this.config.apiToken) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            
            next();
        };
    }

    setupRoutes() {
        // Serve static files
        this.app.use(express.static(this.config.staticPath));

        // API routes
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date(),
                uptime: process.uptime()
            });
        });

        // System metrics API
        this.app.get('/api/metrics/system', async (req, res) => {
            try {
                const timeRange = req.query.range || '1h';
                const metrics = await this.getSystemMetrics(timeRange);
                res.json(metrics);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // API metrics API
        this.app.get('/api/metrics/api', async (req, res) => {
            try {
                const timeRange = req.query.range || '1h';
                const metrics = await this.getApiMetrics(timeRange);
                res.json(metrics);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Database metrics API
        this.app.get('/api/metrics/database', async (req, res) => {
            try {
                const timeRange = req.query.range || '1h';
                const metrics = await this.getDatabaseMetrics(timeRange);
                res.json(metrics);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Error metrics API
        this.app.get('/api/metrics/errors', async (req, res) => {
            try {
                const timeRange = req.query.range || '1h';
                const metrics = await this.getErrorMetrics(timeRange);
                res.json(metrics);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Frontend metrics API
        this.app.get('/api/metrics/frontend', async (req, res) => {
            try {
                const timeRange = req.query.range || '1h';
                const metrics = await this.getFrontendMetrics(timeRange);
                res.json(metrics);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Performance insights API
        this.app.get('/api/insights/performance', async (req, res) => {
            try {
                const insights = await this.getPerformanceInsights();
                res.json(insights);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Alerts API
        this.app.get('/api/alerts', async (req, res) => {
            try {
                const alerts = await this.getActiveAlerts();
                res.json(alerts);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Dashboard data API
        this.app.get('/api/dashboard', async (req, res) => {
            try {
                const dashboardData = await this.getDashboardData();
                res.json(dashboardData);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Get static files
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(this.config.staticPath, 'index.html'));
        });
    }

    setupSocket() {
        const { createServer } = require('http');
        const { Server } = require('socket.io');
        
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        // Socket connections
        this.io.on('connection', (socket) => {
            console.log('Dashboard client connected:', socket.id);
            
            // Send initial dashboard data
            this.getDashboardData()
                .then(data => {
                    socket.emit('dashboard-data', data);
                })
                .catch(error => {
                    console.error('Error sending initial dashboard data:', error);
                });

            // Set up periodic updates
            const updateInterval = setInterval(() => {
                if (socket.connected) {
                    this.getDashboardData()
                        .then(data => {
                            socket.emit('dashboard-data', data);
                        })
                        .catch(error => {
                            console.error('Error updating dashboard data:', error);
                        });
                } else {
                    clearInterval(updateInterval);
                }
            }, this.config.updateInterval);

            socket.on('disconnect', () => {
                console.log('Dashboard client disconnected:', socket.id);
                clearInterval(updateInterval);
            });
        });
    }

    async getDashboardData() {
        try {
            const [systemMetrics, apiMetrics, databaseMetrics, errorMetrics, frontendMetrics, alerts, insights] = await Promise.all([
                this.getSystemMetrics('1h'),
                this.getApiMetrics('1h'),
                this.getDatabaseMetrics('1h'),
                this.getErrorMetrics('1h'),
                this.getFrontendMetrics('1h'),
                this.getActiveAlerts(),
                this.getPerformanceInsights()
            ]);

            return {
                timestamp: new Date(),
                system: systemMetrics,
                api: apiMetrics,
                database: databaseMetrics,
                errors: errorMetrics,
                frontend: frontendMetrics,
                alerts,
                insights,
                summary: {
                    totalRequests: apiMetrics.total_requests || 0,
                    totalErrors: errorMetrics.total_errors || 0,
                    averageResponseTime: apiMetrics.average_response_time || 0,
                    systemHealth: this.calculateSystemHealth(systemMetrics),
                    databaseHealth: this.calculateDatabaseHealth(databaseMetrics),
                    errorRate: this.calculateErrorRate(apiMetrics, errorMetrics)
                }
            };
        } catch (error) {
            console.error('Error getting dashboard data:', error);
            throw error;
        }
    }

    async getSystemMetrics(timeRange) {
        // Mock implementation - in real system, fetch from database
        return {
            cpu_usage: Math.random() * 100,
            memory_usage: Math.random() * 100,
            disk_usage: Math.random() * 100,
            network_io: {
                bytes_in: Math.random() * 1000000,
                bytes_out: Math.random() * 1000000
            },
            load_average: [Math.random() * 2, Math.random() * 2, Math.random() * 2],
            timestamp: new Date()
        };
    }

    async getApiMetrics(timeRange) {
        return {
            total_requests: Math.floor(Math.random() * 10000),
            total_errors: Math.floor(Math.random() * 100),
            total_success: Math.floor(Math.random() * 9900),
            average_response_time: Math.random() * 1000,
            requests_per_minute: Math.floor(Math.random() * 100),
            top_endpoints: [
                { endpoint: '/api/users', requests: 1500, avg_time: 120 },
                { endpoint: '/api/products', requests: 1200, avg_time: 85 },
                { endpoint: '/api/orders', requests: 800, avg_time: 150 }
            ],
            status_codes: {
                '200': 8500,
                '404': 100,
                '500': 10,
                '401': 50
            }
        };
    }

    async getDatabaseMetrics(timeRange) {
        return {
            total_queries: Math.floor(Math.random() * 5000),
            average_query_time: Math.random() * 100,
            slow_queries: Math.floor(Math.random() * 20),
            active_connections: Math.floor(Math.random() * 50),
            cache_hit_ratio: Math.random() * 100,
            top_slow_queries: [
                { query: 'SELECT * FROM users WHERE...', avg_time: 500, count: 15 },
                { query: 'SELECT * FROM orders WHERE...', avg_time: 300, count: 25 }
            ]
        };
    }

    async getErrorMetrics(timeRange) {
        return {
            total_errors: Math.floor(Math.random() * 100),
            critical_errors: Math.floor(Math.random() * 5),
            error_rate: Math.random() * 5,
            errors_by_service: {
                'api': 45,
                'database': 20,
                'frontend': 15,
                'other': 10
            },
            top_errors: [
                { message: 'Connection timeout', count: 25, service: 'api' },
                { message: 'Memory limit exceeded', count: 10, service: 'database' }
            ]
        };
    }

    async getFrontendMetrics(timeRange) {
        return {
            page_views: Math.floor(Math.random() * 1000),
            average_load_time: Math.random() * 3000,
            bounce_rate: Math.random() * 50,
            core_web_vitals: {
                lcp: Math.random() * 4000,
                fid: Math.random() * 300,
                cls: Math.random() * 0.5
            },
            top_pages: [
                { page: '/dashboard', views: 500, avg_time: 2000 },
                { page: '/users', views: 300, avg_time: 1500 }
            ]
        };
    }

    async getActiveAlerts() {
        return [
            {
                id: 'alert-1',
                title: 'High CPU Usage',
                message: 'CPU usage is above 80%',
                severity: 'warning',
                service: 'system',
                timestamp: new Date(Date.now() - 300000),
                status: 'active'
            },
            {
                id: 'alert-2',
                title: 'Database Connection Pool High',
                message: 'Database connection pool is at 90%',
                severity: 'info',
                service: 'database',
                timestamp: new Date(Date.now() - 600000),
                status: 'active'
            }
        ];
    }

    async getPerformanceInsights() {
        return [
            {
                type: 'performance',
                severity: 'warning',
                title: 'Slow Database Queries',
                description: 'Found 3 queries taking longer than 500ms on average',
                recommendation: 'Consider adding indexes to frequently queried columns',
                impact: 'medium',
                effort: 'low'
            },
            {
                type: 'error',
                severity: 'info',
                title: 'API Error Rate',
                description: 'Error rate is 2.1%, which is within acceptable limits',
                recommendation: 'Continue monitoring for trends',
                impact: 'low',
                effort: 'none'
            }
        ];
    }

    calculateSystemHealth(metrics) {
        const cpuScore = Math.max(0, 100 - metrics.cpu_usage);
        const memoryScore = Math.max(0, 100 - metrics.memory_usage);
        const diskScore = Math.max(0, 100 - metrics.disk_usage);
        
        return Math.round((cpuScore + memoryScore + diskScore) / 3);
    }

    calculateDatabaseHealth(metrics) {
        const queryScore = Math.max(0, 100 - (metrics.average_query_time * 2));
        const connectionScore = Math.max(0, 100 - (metrics.active_connections * 2));
        const cacheScore = metrics.cache_hit_ratio;
        
        return Math.round((queryScore + connectionScore + cacheScore) / 3);
    }

    calculateErrorRate(apiMetrics, errorMetrics) {
        if (apiMetrics.total_requests === 0) return 0;
        return (errorMetrics.total_errors / apiMetrics.total_requests) * 100;
    }

    async start() {
        if (this.isRunning) {
            console.log('Dashboard is already running');
            return;
        }

        try {
            // Ensure static files directory exists
            await this.ensureStaticFiles();
            
            this.server.listen(this.config.port, this.config.host, () => {
                console.log(`Dashboard running on http://${this.config.host}:${this.config.port}`);
                this.isRunning = true;
            });
        } catch (error) {
            console.error('Failed to start dashboard:', error);
            throw error;
        }
    }

    async stop() {
        if (!this.isRunning) {
            return;
        }

        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('Dashboard server stopped');
                    this.isRunning = false;
                    resolve();
                });
            } else {
                this.isRunning = false;
                resolve();
            }
        });
    }

    async ensureStaticFiles() {
        try {
            await fs.access(this.config.staticPath);
        } catch {
            console.log('Creating static files directory...');
            await this.createStaticFiles();
        }
    }

    async createStaticFiles() {
        // Create public directory
        await fs.mkdir(this.config.staticPath, { recursive: true });
        
        // Create CSS file
        await fs.writeFile(
            path.join(this.config.staticPath, 'style.css'),
            this.getStylesheet()
        );
        
        // Create JavaScript file
        await fs.writeFile(
            path.join(this.config.staticPath, 'app.js'),
            this.getJavaScript()
        );
        
        // Create HTML file
        await fs.writeFile(
            path.join(this.config.staticPath, 'index.html'),
            this.getHtml()
        );
    }

    getStylesheet() {
        return `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #f5f5f5;
                color: #333;
                line-height: 1.6;
            }

            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }

            .header {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-bottom: 20px;
            }

            .header h1 {
                color: #2c3e50;
                font-size: 28px;
                margin-bottom: 10px;
            }

            .header .timestamp {
                color: #7f8c8d;
                font-size: 14px;
            }

            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }

            .metric-card {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .metric-card h3 {
                color: #34495e;
                margin-bottom: 15px;
                font-size: 18px;
            }

            .metric-value {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 10px;
            }

            .metric-value.good { color: #27ae60; }
            .metric-value.warning { color: #f39c12; }
            .metric-value.error { color: #e74c3c; }

            .metric-trend {
                font-size: 14px;
                color: #7f8c8d;
            }

            .trend-up { color: #27ae60; }
            .trend-down { color: #e74c3c; }

            .alerts-section {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-bottom: 20px;
            }

            .alert {
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 10px;
                border-left: 4px solid;
            }

            .alert.critical {
                background-color: #ffeaea;
                border-color: #e74c3c;
                color: #c0392b;
            }

            .alert.warning {
                background-color: #fff3cd;
                border-color: #f39c12;
                color: #d68910;
            }

            .alert.info {
                background-color: #d1ecf1;
                border-color: #3498db;
                color: #2980b9;
            }

            .insights-section {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .insight {
                padding: 15px;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                margin-bottom: 15px;
            }

            .insight h4 {
                color: #2c3e50;
                margin-bottom: 8px;
            }

            .insight .severity {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }

            .severity.performance { background: #3498db; color: white; }
            .severity.error { background: #e74c3c; color: white; }
            .severity.info { background: #95a5a6; color: white; }

            .status-indicator {
                display: inline-block;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-right: 8px;
            }

            .status-indicator.healthy { background: #27ae60; }
            .status-indicator.warning { background: #f39c12; }
            .status-indicator.error { background: #e74c3c; }

            .loading {
                text-align: center;
                padding: 40px;
                color: #7f8c8d;
            }

            .error {
                text-align: center;
                padding: 40px;
                color: #e74c3c;
            }
        `;
    }

    getJavaScript() {
        return `
            // Dashboard JavaScript
            class Dashboard {
                constructor() {
                    this.socket = null;
                    this.updateInterval = null;
                    this.data = null;
                    this.init();
                }

                init() {
                    this.connectSocket();
                    this.setupEventListeners();
                }

                connectSocket() {
                    this.socket = io();
                    
                    this.socket.on('connect', () => {
                        console.log('Connected to dashboard server');
                        this.hideError();
                    });

                    this.socket.on('disconnect', () => {
                        console.log('Disconnected from dashboard server');
                    });

                    this.socket.on('dashboard-data', (data) => {
                        this.data = data;
                        this.updateDashboard(data);
                    });

                    this.socket.on('error', (error) => {
                        console.error('Socket error:', error);
                        this.showError('Connection error');
                    });
                }

                setupEventListeners() {
                    // Time range selector
                    const timeRangeSelector = document.getElementById('time-range');
                    if (timeRangeSelector) {
                        timeRangeSelector.addEventListener('change', (e) => {
                            this.loadData(e.target.value);
                        });
                    }

                    // Refresh button
                    const refreshBtn = document.getElementById('refresh-btn');
                    if (refreshBtn) {
                        refreshBtn.addEventListener('click', () => {
                            this.loadData('1h');
                        });
                    }
                }

                updateDashboard(data) {
                    this.updateTimestamp(data.timestamp);
                    this.updateSystemMetrics(data.system);
                    this.updateApiMetrics(data.api);
                    this.updateDatabaseMetrics(data.database);
                    this.updateErrorMetrics(data.errors);
                    this.updateFrontendMetrics(data.frontend);
                    this.updateAlerts(data.alerts);
                    this.updateInsights(data.insights);
                    this.updateSummary(data.summary);
                }

                updateTimestamp(timestamp) {
                    const timestampEl = document.getElementById('timestamp');
                    if (timestampEl) {
                        timestampEl.textContent = new Date(timestamp).toLocaleString();
                    }
                }

                updateSystemMetrics(metrics) {
                    this.updateMetricValue('cpu-usage', metrics.cpu_usage, '%');
                    this.updateMetricValue('memory-usage', metrics.memory_usage, '%');
                    this.updateMetricValue('disk-usage', metrics.disk_usage, '%');
                }

                updateApiMetrics(metrics) {
                    this.updateMetricValue('total-requests', metrics.total_requests);
                    this.updateMetricValue('avg-response-time', metrics.average_response_time, 'ms');
                    this.updateMetricValue('requests-per-minute', metrics.requests_per_minute);
                }

                updateDatabaseMetrics(metrics) {
                    this.updateMetricValue('total-queries', metrics.total_queries);
                    this.updateMetricValue('avg-query-time', metrics.average_query_time, 'ms');
                    this.updateMetricValue('slow-queries', metrics.slow_queries);
                    this.updateMetricValue('cache-hit-ratio', metrics.cache_hit_ratio, '%');
                }

                updateErrorMetrics(metrics) {
                    this.updateMetricValue('total-errors', metrics.total_errors);
                    this.updateMetricValue('error-rate', metrics.error_rate, '%');
                    this.updateMetricValue('critical-errors', metrics.critical_errors);
                }

                updateFrontendMetrics(metrics) {
                    this.updateMetricValue('page-views', metrics.page_views);
                    this.updateMetricValue('avg-load-time', metrics.average_load_time, 'ms');
                    this.updateMetricValue('bounce-rate', metrics.bounce_rate, '%');
                }

                updateMetricValue(elementId, value, unit = '') {
                    const element = document.getElementById(elementId);
                    if (element) {
                        const formattedValue = typeof value === 'number' ? 
                            (value < 1000 ? value.toFixed(1) : value.toLocaleString()) : 
                            value;
                        element.textContent = unit ? \`\${formattedValue} \${unit}\` : formattedValue;
                        
                        // Add color coding
                        element.className = 'metric-value';
                        if (typeof value === 'number') {
                            if (value < 30 || (elementId.includes('hit') && value > 90)) {
                                element.classList.add('good');
                            } else if (value < 70 || (elementId.includes('hit') && value > 70)) {
                                element.classList.add('warning');
                            } else {
                                element.classList.add('error');
                            }
                        }
                    }
                }

                updateAlerts(alerts) {
                    const alertsContainer = document.getElementById('alerts-list');
                    if (!alertsContainer) return;

                    if (alerts.length === 0) {
                        alertsContainer.innerHTML = '<p>No active alerts</p>';
                        return;
                    }

                    alertsContainer.innerHTML = alerts.map(alert => \`
                        <div class="alert \${alert.severity}">
                            <strong>\${alert.title}</strong>
                            <p>\${alert.message}</p>
                            <small>\${alert.service} • \${this.timeAgo(alert.timestamp)}</small>
                        </div>
                    \`).join('');
                }

                updateInsights(insights) {
                    const insightsContainer = document.getElementById('insights-list');
                    if (!insightsContainer) return;

                    insightsContainer.innerHTML = insights.map(insight => \`
                        <div class="insight">
                            <h4>\${insight.title}</h4>
                            <p>\${insight.description}</p>
                            <p><strong>Recommendation:</strong> \${insight.recommendation}</p>
                            <span class="severity \${insight.type}">\${insight.type}</span>
                        </div>
                    \`).join('');
                }

                updateSummary(summary) {
                    document.getElementById('total-requests').textContent = summary.totalRequests.toLocaleString();
                    document.getElementById('total-errors').textContent = summary.totalErrors.toLocaleString();
                    
                    const healthElement = document.getElementById('system-health');
                    if (healthElement) {
                        healthElement.textContent = \`\${summary.systemHealth}%\`;
                        healthElement.className = 'metric-value ' + 
                            (summary.systemHealth > 80 ? 'good' : 
                             summary.systemHealth > 60 ? 'warning' : 'error');
                    }
                }

                timeAgo(timestamp) {
                    const now = new Date();
                    const then = new Date(timestamp);
                    const diff = now - then;
                    
                    const minutes = Math.floor(diff / 60000);
                    const hours = Math.floor(diff / 3600000);
                    const days = Math.floor(diff / 86400000);
                    
                    if (days > 0) return \`\${days} days ago\`;
                    if (hours > 0) return \`\${hours} hours ago\`;
                    if (minutes > 0) return \`\${minutes} minutes ago\`;
                    return 'Just now';
                }

                loadData(timeRange) {
                    fetch(\`/api/dashboard?range=\${timeRange}\`)
                        .then(response => response.json())
                        .then(data => {
                            this.updateDashboard(data);
                        })
                        .catch(error => {
                            console.error('Error loading data:', error);
                            this.showError('Failed to load dashboard data');
                        });
                }

                showError(message) {
                    const errorEl = document.getElementById('error-message');
                    if (errorEl) {
                        errorEl.textContent = message;
                        errorEl.style.display = 'block';
                    }
                }

                hideError() {
                    const errorEl = document.getElementById('error-message');
                    if (errorEl) {
                        errorEl.style.display = 'none';
                    }
                }
            }

            // Initialize dashboard when DOM is loaded
            document.addEventListener('DOMContentLoaded', () => {
                new Dashboard();
            });
        `;
    }

    getHtml() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Performance Monitoring Dashboard</title>
                <link rel="stylesheet" href="/style.css">
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Performance Monitoring Dashboard</h1>
                        <p class="timestamp">
                            Last updated: <span id="timestamp">Loading...</span>
                            <select id="time-range" style="margin-left: 20px;">
                                <option value="1h">Last Hour</option>
                                <option value="6h">Last 6 Hours</option>
                                <option value="24h">Last 24 Hours</option>
                                <option value="7d">Last 7 Days</option>
                            </select>
                            <button id="refresh-btn" style="margin-left: 10px;">Refresh</button>
                        </p>
                    </div>

                    <div id="error-message" class="error" style="display: none;"></div>

                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h3>System Health</h3>
                            <div class="metric-value" id="system-health">--%</div>
                            <div class="metric-trend">
                                CPU: <span id="cpu-usage">--</span> • 
                                Memory: <span id="memory-usage">--</span> • 
                                Disk: <span id="disk-usage">--</span>
                            </div>
                        </div>

                        <div class="metric-card">
                            <h3>API Performance</h3>
                            <div class="metric-value" id="total-requests">--</div>
                            <div class="metric-trend">
                                Avg Response: <span id="avg-response-time">--</span> • 
                                RPM: <span id="requests-per-minute">--</span>
                            </div>
                        </div>

                        <div class="metric-card">
                            <h3>Database</h3>
                            <div class="metric-value" id="total-queries">--</div>
                            <div class="metric-trend">
                                Avg Query: <span id="avg-query-time">--</span> • 
                                Cache Hit: <span id="cache-hit-ratio">--</span>
                            </div>
                        </div>

                        <div class="metric-card">
                            <h3>Error Rate</h3>
                            <div class="metric-value" id="error-rate">--</div>
                            <div class="metric-trend">
                                Total: <span id="total-errors">--</span> • 
                                Critical: <span id="critical-errors">--</span>
                            </div>
                        </div>
                    </div>

                    <div class="alerts-section">
                        <h3>Active Alerts</h3>
                        <div id="alerts-list">
                            <div class="loading">Loading alerts...</div>
                        </div>
                    </div>

                    <div class="insights-section">
                        <h3>Performance Insights</h3>
                        <div id="insights-list">
                            <div class="loading">Loading insights...</div>
                        </div>
                    </div>
                </div>

                <script src="/socket.io/socket.io.js"></script>
                <script src="/app.js"></script>
            </body>
            </html>
        `;
    }
}

module.exports = DashboardService;