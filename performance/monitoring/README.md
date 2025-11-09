# Performance Monitoring & Analytics System

A comprehensive real-time performance monitoring and analytics system built with Node.js, providing end-to-end visibility into system health, API performance, database operations, error tracking, and user experience metrics.

## 🚀 Features

### Core Monitoring Capabilities
- **Real-time System Health Monitoring** - CPU, memory, disk, and network metrics
- **Application Performance Monitoring (APM)** - Transaction tracking, distributed tracing
- **API Performance Monitoring** - Request/response tracking, latency analysis, SLA monitoring
- **Database Performance Monitoring** - Query analysis, slow query detection, connection pooling
- **Error Tracking & Management** - Error categorization, stack trace analysis, alert management
- **Frontend Performance Metrics** - Core Web Vitals, page load times, user experience tracking
- **Automated Alerting System** - Multi-channel notifications with escalation policies
- **Performance Analytics** - Bottleneck detection, trend analysis, optimization recommendations

### Dashboard & Visualization
- **Real-time Web Dashboard** - Interactive charts and metrics visualization
- **Real-time Data Updates** - WebSocket-based live metric updates
- **Multiple Chart Types** - Line charts, bar charts, pie charts, gauges, time series
- **Performance Insights** - Automated recommendations and issue detection
- **Historical Data Analysis** - Trend analysis and comparative metrics

### Architecture & Components
- **Modular Design** - Independent services for each monitoring aspect
- **Middleware Integration** - Seamless integration with existing applications
- **Event-Driven Architecture** - Real-time event processing and correlation
- **Data Persistence** - PostgreSQL for metrics storage, Redis for caching
- **Extensible Framework** - Easy to add custom metrics and monitoring points

## 📋 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Middleware    │    │   Collectors    │
│                 │    │                 │    │                 │
│ • Express App   │◄──►│ • Request Track │◄──►│ • System        │
│ • Custom Routes │    │ • Performance   │    │ • API           │
│ • Business Logic│    │ • Error Track   │    │ • Database      │
└─────────────────┘    └─────────────────┘    │ • Errors        │
                                               │ • Frontend      │
┌─────────────────┐    ┌─────────────────┐    └─────────────────┘
│    Services     │    │  Dashboard UI   │              │
│                 │    │                 │              │
│ • System Monitor│    │ • Real-time     │              │
│ • APM Service   │    │ • Charts        │              ▼
│ • Error Tracker │    │ • Alerts        │    ┌─────────────────┐
│ • DB Monitor    │    │ • Insights      │    │  Data Storage   │
│ • API Monitor   │    │                 │    │                 │
│ • Alert Service │    └─────────────────┘    │ • PostgreSQL    │
│ • Performance   │                            │ • Redis Cache   │
│   Analyzer      │                            └─────────────────┘
└─────────────────┘
```

## 🛠️ Installation

### Prerequisites
- Node.js 16.0.0 or higher
- npm 8.0.0 or higher
- PostgreSQL 12+ (for metrics storage)
- Redis 6+ (for caching and real-time data)

### Quick Start

1. **Clone and install dependencies:**
   ```bash
   cd performance/monitoring
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database and Redis configuration
   ```

3. **Initialize database:**
   ```bash
   npm run db:migrate
   ```

4. **Start the monitoring system:**
   ```bash
   # Start with all components
   npm start
   
   # Or start in development mode
   npm run dev
   
   # Start dashboard only
   npm run dashboard:dev
   ```

5. **Access the dashboard:**
   - Main Application: http://localhost:3000
   - Dashboard: http://localhost:3001

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=performance_monitoring
DB_USER=postgres
DB_PASSWORD=your_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Alert Configuration
ALERT_EMAIL_FROM=noreply@yourcompany.com
ALERT_EMAIL_SMTP_HOST=smtp.yourcompany.com
ALERT_EMAIL_SMTP_PORT=587
ALERT_EMAIL_SMTP_USER=your_smtp_user
ALERT_EMAIL_SMTP_PASS=your_smtp_password

# Slack Integration (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Dashboard Configuration
DASHBOARD_PORT=3001
DASHBOARD_API_TOKEN=your_dashboard_token

# Monitoring Configuration
COLLECTION_INTERVAL=30000
ENABLE_CAPTURE_STACK_TRACE=true
MAX_RETAINED_METRICS=1000
```

## 📊 Usage

### Basic Integration

```javascript
const { PerformanceMonitoringIntegration } = require('./integration/example-integration');

// Create monitoring instance
const monitoring = new PerformanceMonitoringIntegration({
    services: {
        system: { enabled: true },
        api: { enabled: true },
        database: { enabled: true }
    },
    middleware: {
        requestTracking: { enabled: true },
        performanceMonitoring: { enabled: true },
        errorTracking: { enabled: true }
    },
    dashboard: {
        enabled: true,
        port: 3001
    }
});

// Start monitoring
await monitoring.start(3000);
```

### Middleware-Only Integration

```javascript
const express = require('express');
const { RequestTrackingMiddleware } = require('./middleware/request-tracking');
const { PerformanceMonitoringMiddleware } = require('./middleware/performance-monitoring');

const app = express();

// Add monitoring middleware
app.use(new RequestTrackingMiddleware().middleware());
app.use(new PerformanceMonitoringMiddleware().middleware());

// Your application routes
app.get('/api/users', (req, res) => {
    res.json({ users: [] });
});

app.listen(3000);
```

### Custom Metrics Collection

```javascript
const SystemCollector = require('./collectors/system-collector');
const APICollector = require('./collectors/api-collector');

const systemCollector = new SystemCollector();
const apiCollector = new APICollector();

// Start collectors
await systemCollector.start();
await apiCollector.start();

// Track custom API request
apiCollector.trackRequest({
    method: 'GET',
    endpoint: '/api/custom',
    statusCode: 200,
    responseTime: 150,
    timestamp: Date.now()
});
```

## 📈 Dashboard Features

### System Overview
- Real-time system health indicators
- CPU, memory, and disk usage trends
- Active alerts and performance insights

### API Monitoring
- Request/response time charts
- Error rate tracking
- Top endpoints by traffic and performance
- Status code distribution

### Database Monitoring
- Query performance analysis
- Slow query identification
- Connection pool statistics
- Cache hit ratios

### Error Tracking
- Error categorization and trends
- Critical error alerts
- Stack trace analysis
- Error rate by service

### Performance Analytics
- Automated bottleneck detection
- Performance recommendations
- Trend analysis
- Optimization suggestions

## 🔧 Configuration

### Service Configuration

```javascript
{
    system: {
        enabled: true,
        collectionInterval: 5000,
        enableDetailedMetrics: true,
        alertThresholds: {
            cpu: 80,
            memory: 85,
            disk: 90
        }
    },
    api: {
        enabled: true,
        collectionInterval: 10000,
        trackRequestBody: false,
        trackResponseBody: false,
        slowRequestThreshold: 1000
    },
    database: {
        enabled: true,
        collectionInterval: 30000,
        enableSlowQueryCapture: true,
        slowQueryThreshold: 1000,
        maxSlowQueries: 100
    }
}
```

### Middleware Configuration

```javascript
{
    requestTracking: {
        includeRequestBody: false,
        includeResponseBody: false,
        maxBodySize: 1024 * 1024,
        excludePaths: ['/health', '/metrics'],
        enableCorrelationIds: true
    },
    performanceMonitoring: {
        enableCpuMonitoring: true,
        enableMemoryMonitoring: true,
        slowRequestThreshold: 1000,
        memoryWarningThreshold: 500 * 1024 * 1024,
        cpuWarningThreshold: 80
    },
    errorTracking: {
        includeStackTrace: true,
        captureUnhandledRejections: true,
        captureUncaughtExceptions: true,
        maxStackDepth: 10
    }
}
```

### Alerting Configuration

```javascript
{
    system: {
        cpu: { threshold: 80, severity: 'warning' },
        memory: { threshold: 85, severity: 'warning' },
        disk: { threshold: 90, severity: 'critical' }
    },
    api: {
        responseTime: { threshold: 2000, severity: 'warning' },
        errorRate: { threshold: 5, severity: 'error' },
        availability: { threshold: 99, severity: 'critical' }
    },
    database: {
        slowQueries: { threshold: 10, severity: 'warning' },
        connectionPool: { threshold: 90, severity: 'warning' },
        queryTime: { threshold: 5000, severity: 'error' }
    }
}
```

## 🔌 API Reference

### REST API Endpoints

#### System Metrics
- `GET /api/metrics/system?range=1h` - Get system metrics
- `GET /api/health` - System health check

#### API Metrics
- `GET /api/metrics/api?range=1h` - Get API performance metrics
- `GET /api/metrics/api/top-endpoints` - Get top performing endpoints
- `GET /api/metrics/api/slow-requests` - Get slow request details

#### Database Metrics
- `GET /api/metrics/database?range=1h` - Get database performance metrics
- `GET /api/metrics/database/slow-queries` - Get slow query details
- `GET /api/metrics/database/connection-stats` - Get connection statistics

#### Error Metrics
- `GET /api/metrics/errors?range=1h` - Get error metrics
- `GET /api/metrics/errors/trends` - Get error trend analysis
- `GET /api/metrics/errors/critical` - Get critical errors

#### Alerts
- `GET /api/alerts` - Get active alerts
- `GET /api/alerts/history` - Get alert history
- `POST /api/alerts/acknowledge` - Acknowledge an alert

#### Dashboard
- `GET /api/dashboard` - Get complete dashboard data
- `GET /api/insights/performance` - Get performance insights

### WebSocket Events

#### Dashboard Updates
```javascript
socket.on('dashboard-data', (data) => {
    // Receive real-time dashboard updates
    console.log('Dashboard data:', data);
});
```

#### Alert Events
```javascript
socket.on('alert', (alert) => {
    // Receive real-time alerts
    console.log('New alert:', alert);
});
```

#### Performance Events
```javascript
socket.on('performance', (event) => {
    // Receive performance events
    console.log('Performance event:', event);
});
```

## 🗄️ Database Schema

### Core Tables

#### system_metrics
```sql
CREATE TABLE system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL,
    metric_type VARCHAR(50),
    dimensions JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

#### api_metrics
```sql
CREATE TABLE api_metrics (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10),
    total_requests INTEGER,
    total_errors INTEGER,
    total_success INTEGER,
    average_response_time DECIMAL,
    status_codes JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

#### database_metrics
```sql
CREATE TABLE database_metrics (
    id SERIAL PRIMARY KEY,
    query_hash VARCHAR(64),
    query_text TEXT,
    execution_count INTEGER,
    total_time DECIMAL,
    average_time DECIMAL,
    rows_affected INTEGER,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

#### error_logs
```sql
CREATE TABLE error_logs (
    id SERIAL PRIMARY KEY,
    log_level VARCHAR(20),
    message TEXT,
    stack_trace TEXT,
    service VARCHAR(100),
    user_id VARCHAR(255),
    request_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT NOW()
);
```

## 🚨 Alerting

### Alert Channels

#### Email Alerts
```javascript
{
    type: 'email',
    recipients: ['admin@company.com', 'dev-team@company.com'],
    subject: 'System Alert: High CPU Usage',
    template: 'system-alert'
}
```

#### Slack Alerts
```javascript
{
    type: 'slack',
    webhook: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
    channel: '#alerts',
    username: 'Monitoring Bot'
}
```

#### Webhook Alerts
```javascript
{
    type: 'webhook',
    url: 'https://your-app.com/webhook/alerts',
    method: 'POST',
    headers: {
        'Authorization': 'Bearer your-token'
    }
}
```

### Alert Rules

```javascript
const alertRules = {
    system: [
        {
            name: 'High CPU Usage',
            condition: 'cpu_usage > 80',
            duration: '5m',
            severity: 'warning',
            channels: ['email', 'slack']
        },
        {
            name: 'Critical CPU Usage',
            condition: 'cpu_usage > 95',
            duration: '1m',
            severity: 'critical',
            channels: ['email', 'slack', 'webhook']
        }
    ],
    api: [
        {
            name: 'High Error Rate',
            condition: 'error_rate > 5',
            duration: '10m',
            severity: 'warning',
            channels: ['email']
        }
    ]
};
```

## 📊 Performance Insights

The system provides automated performance insights and recommendations:

### System Performance
- Resource utilization analysis
- Bottleneck identification
- Capacity planning recommendations
- Performance trend analysis

### API Performance
- Endpoint performance analysis
- Slow query identification
- Cache optimization suggestions
- Scaling recommendations

### Error Analysis
- Error pattern detection
- Root cause analysis
- Error prevention strategies
- Impact assessment

## 🔒 Security

### Data Protection
- Sensitive data sanitization in logs
- Request/response body filtering
- User data anonymization
- Secure credential handling

### Access Control
- Dashboard authentication (optional)
- API token-based access
- Role-based permissions
- Audit logging

### Network Security
- CORS configuration
- Rate limiting
- Request validation
- Input sanitization

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## 📈 Monitoring Best Practices

### 1. Set Appropriate Thresholds
- Configure realistic alert thresholds
- Consider business context
- Avoid alert fatigue
- Regular threshold review

### 2. Monitor Business Metrics
- Track user-facing metrics
- Monitor conversion rates
- Performance impact on revenue
- User experience indicators

### 3. Establish Baselines
- Create performance baselines
- Track trends over time
- Compare against industry standards
- Regular performance reviews

### 4. Implement Gradual Rollouts
- Test monitoring in staging
- Gradual production deployment
- Monitor for false positives
- Refine configurations

## 🐛 Troubleshooting

### Common Issues

#### High Memory Usage
- Check for memory leaks in collectors
- Adjust maxRetainedMetrics configuration
- Review database query patterns
- Monitor garbage collection

#### Missing Metrics
- Verify database connectivity
- Check Redis connection
- Review collector configurations
- Check for permission issues

#### Dashboard Not Loading
- Verify port availability
- Check CORS configuration
- Review WebSocket connections
- Check static file permissions

#### Alert Delivery Issues
- Verify SMTP configuration
- Check webhook URLs
- Review rate limiting
- Test alert channels

### Debug Mode
```bash
DEBUG=performance:* npm start
```

### Health Checks
```bash
curl http://localhost:3000/health
curl http://localhost:3001/api/health
```

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000 3001

CMD ["npm", "start"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: performance-monitoring
spec:
  replicas: 3
  selector:
    matchLabels:
      app: performance-monitoring
  template:
    metadata:
      labels:
        app: performance-monitoring
    spec:
      containers:
      - name: monitoring
        image: performance-monitoring:latest
        ports:
        - containerPort: 3000
        - containerPort: 3001
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
```

### Production Configuration
```javascript
{
    production: {
        logLevel: 'warn',
        enableMetrics: true,
        enableProfiling: false,
        maxConnections: 100,
        timeout: 30000,
        retryAttempts: 3,
        alertCooldown: 300000
    }
}
```

## 📚 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Chart.js for visualization components
- Express.js for the web framework
- PostgreSQL and Redis for data storage
- Winston for logging
- Prometheus for metrics collection patterns

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide
- Contact the development team

---

**Performance Monitoring System v1.0.0** - Comprehensive real-time monitoring for modern applications.