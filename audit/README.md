# Comprehensive Audit Logging & Monitoring System

A complete, enterprise-grade audit logging and monitoring solution for tracking user actions, data access, and system changes with real-time monitoring, security event alerting, user behavior analytics, anomaly detection, and compliance reporting.

## 🚀 Features

### Core Audit Logging
- **Comprehensive Event Tracking**: All user actions, data access, and system changes
- **Risk-based Logging**: Automatic risk level assessment for all events
- **Real-time Processing**: Immediate logging with batch processing for performance
- **Structured Data**: JSON-based event details for flexible querying and analysis

### Security Monitoring
- **Real-time Security Events**: Immediate detection and logging of security incidents
- **Failed Login Tracking**: Comprehensive failed login attempt monitoring with IP blocking
- **Brute Force Detection**: Automatic detection of brute force attack patterns
- **Security Event Alerting**: Real-time alerts for critical security events

### User Behavior Analytics
- **Pattern Analysis**: Track user access patterns, times, and behaviors
- **Risk Scoring**: Dynamic risk assessment based on user behavior
- **Anomaly Detection**: Identify unusual user behavior and access patterns
- **Geographic Analysis**: Track access patterns across different locations

### Monitoring Dashboard
- **Real-time Dashboard**: Live monitoring interface with multiple views
- **Security Events Monitor**: Track and manage security incidents
- **Failed Login Monitor**: Monitor and analyze failed login attempts
- **User Analytics View**: Detailed user behavior analytics
- **Anomaly Detection**: View and manage detected anomalies

### Alerting System
- **Flexible Alert Rules**: Configure custom alert conditions and thresholds
- **Multiple Notification Channels**: Email, Slack, Webhook, SMS support
- **Cooldown Periods**: Prevent alert spam with configurable cooldowns
- **Real-time Processing**: Immediate alert processing and notification

### Compliance Reporting
- **Multiple Standards Support**: GDPR, SOX, HIPAA, PCI DSS, ISO 27001, Custom
- **Automated Report Generation**: Scheduled and on-demand compliance reports
- **Detailed Findings**: Comprehensive compliance findings with recommendations
- **Evidence Collection**: Automatic evidence collection for compliance audits

### Automated Processing
- **Scheduled Tasks**: Automated audit log processing and analysis
- **Analytics Updates**: Regular user behavior analytics updates
- **Risk Score Updates**: Dynamic risk score recalculation
- **System Health Monitoring**: Continuous system health monitoring

## 📁 Directory Structure

```
audit/
├── database/
│   ├── audit_schema.sql          # Database schema and functions
│   └── auditProcessingSystem.ts  # Automated processing system
├── middleware/
│   ├── auditMiddleware.ts        # Core audit logging middleware
│   ├── auditApi.ts              # Individual event logging API
│   └── auditBulkApi.ts          # Bulk event logging API
├── dashboard/
│   ├── MonitoringDashboard.tsx  # Main monitoring interface
│   ├── auditLogsApi.ts          # Audit logs API endpoint
│   ├── securityEventsApi.ts     # Security events API
│   ├── failedLoginsApi.ts       # Failed logins API
│   ├── userAnalyticsApi.ts      # User analytics API
│   └── anomaliesApi.ts          # Anomaly detection API
├── analytics/
│   └── userBehaviorAnalytics.ts # User behavior and anomaly detection
├── alerts/
│   └── securityAlertingSystem.ts # Security alerting engine
├── reports/
│   └── complianceReportingSystem.ts # Compliance reporting system
└── README.md                    # This file
```

## 🏗️ Architecture

### Database Schema
- **audit_logs**: Main audit event table
- **security_events**: Security incident tracking
- **failed_login_attempts**: Failed login monitoring
- **user_behavior_analytics**: User behavior metrics
- **anomaly_detection**: Anomaly detection results
- **compliance_reports**: Generated compliance reports
- **alert_configurations**: Alert rule configurations

### API Endpoints
- `POST /api/audit/log` - Individual event logging
- `POST /api/audit/bulk` - Bulk event logging
- `GET /api/audit/logs` - Retrieve audit logs
- `GET /api/audit/security-events` - Security events
- `GET /api/audit/failed-logins` - Failed login attempts
- `GET /api/audit/user-analytics` - User behavior analytics
- `GET /api/audit/anomalies` - Anomaly detection results

### Real-time Monitoring
- **Supabase Real-time**: PostgreSQL change listening
- **WebSocket Connections**: Real-time dashboard updates
- **Event Processing**: Immediate event processing and analysis

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- Supabase project
- PostgreSQL database

### Installation

1. **Database Setup**
   ```sql
   -- Run the audit schema
   \i audit/database/audit_schema.sql
   ```

2. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SECURITY_WEBHOOK_URL=your_security_webhook
   SECURITY_EMAIL=security@yourcompany.com
   SLACK_WEBHOOK=your_slack_webhook
   ```

3. **Install Dependencies**
   ```bash
   npm install @supabase/supabase-js uuid
   ```

### Basic Usage

#### 1. Log User Actions
```typescript
import { auditDataAccess, auditAuth, auditSecurity } from '@/audit/middleware/auditMiddleware';

// Log data access
await auditDataAccess(
  userId,
  'user_profiles',
  userId,
  'UPDATE',
  oldProfile,
  newProfile,
  'MEDIUM' // risk level
);

// Log authentication
await auditAuth(
  'login',
  userId,
  'user@example.com',
  true,
  { ip: request.ip, userAgent: request.headers.get('user-agent') }
);

// Log security event
await auditSecurity(
  'suspicious_activity',
  userId,
  'HIGH',
  { details: 'Multiple failed logins detected' }
);
```

#### 2. Monitor Real-time Events
```typescript
import MonitoringDashboard from '@/audit/dashboard/MonitoringDashboard';

export default function SecurityDashboard() {
  return <MonitoringDashboard />;
}
```

#### 3. Configure Alerts
```typescript
import SecurityAlertingSystem from '@/audit/alerts/securityAlertingSystem';

const alerting = new SecurityAlertingSystem();

// Create custom alert
await alerting.createDefaultAlerts();
```

#### 4. Generate Reports
```typescript
import ComplianceReportingSystem from '@/audit/reports/complianceReportingSystem';

const reporting = new ComplianceReportingSystem();

// Generate GDPR compliance report
const reportId = await reporting.generateReport(
  'GDPR',
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  'user_id'
);
```

#### 5. Analyze User Behavior
```typescript
import UserBehaviorAnalytics from '@/audit/analytics/userBehaviorAnalytics';

const analytics = new UserBehaviorAnalytics();

// Analyze user behavior
const metrics = await analytics.analyzeUserBehavior(userId, 30);

// Detect anomalies
const anomalies = await analytics.detectAnomalies(userId, 30);
```

## 📊 Monitoring Dashboard

The monitoring dashboard provides comprehensive visibility into your security posture:

### Overview Tab
- Key security metrics and trends
- Recent security events
- Failed login attempts summary
- High-risk user alerts

### Audit Logs Tab
- Filterable audit log table
- Risk level indicators
- Time-based filtering
- Export capabilities

### Security Events Tab
- Active security incidents
- Severity-based categorization
- Resolution tracking
- Investigation tools

### Failed Logins Tab
- Failed login attempts
- IP-based blocking status
- Geographic distribution
- Brute force detection

### User Analytics Tab
- User behavior patterns
- Risk score tracking
- Session analytics
- Access pattern analysis

### Anomalies Tab
- Detected anomalies
- Confidence levels
- Investigation status
- False positive management

## 🔔 Alerting System

### Alert Types
- **Security Events**: Critical security incidents
- **Failed Logins**: Brute force attacks and suspicious patterns
- **User Behavior**: Anomalous user activities
- **System Events**: System-level security events

### Notification Channels
- **Email**: SMTP-based email notifications
- **Slack**: Slack webhook integration
- **Webhook**: HTTP webhook calls
- **SMS**: Twilio SMS integration

### Alert Conditions
```typescript
const alertConfig = {
  name: 'Brute Force Detection',
  alert_type: 'failed_login',
  conditions: [
    { field: 'event_type', operator: 'eq', value: 'brute_force_attack' }
  ],
  severity_threshold: 'HIGH',
  notification_channels: [
    { type: 'webhook', config: { url: process.env.SECURITY_WEBHOOK } },
    { type: 'email', config: { to: 'security@company.com' } }
  ],
  cooldown_period: 30 // minutes
};
```

## 📈 User Behavior Analytics

### Analytics Features
- **Session Analysis**: Session duration and frequency
- **Access Patterns**: Time-based access analysis
- **Resource Access**: Resource type and frequency tracking
- **Geographic Analysis**: Location-based access patterns
- **Device Detection**: Device type and user agent analysis

### Risk Scoring
```typescript
interface RiskFactors {
  failedLoginRatio: number;     // 0-1 scale
  unusualAccessScore: number;    // 0-1 scale
  sessionAnomalies: number;      // 0-1 scale
  resourceDiversity: number;     // 0-1 scale
}
```

### Anomaly Detection
- **Login Anomalies**: Unusual login patterns
- **Access Anomalies**: Unusual access times/locations
- **Session Anomalies**: Unusual session behavior
- **Resource Anomalies**: Unusual resource access patterns

## 📋 Compliance Reporting

### Supported Standards
- **GDPR**: General Data Protection Regulation
- **SOX**: Sarbanes-Oxley Act
- **HIPAA**: Health Insurance Portability and Accountability Act
- **PCI DSS**: Payment Card Industry Data Security Standard
- **ISO 27001**: Information Security Management
- **Custom**: Custom compliance frameworks

### Report Features
- **Automated Generation**: Scheduled and on-demand reports
- **Evidence Collection**: Automatic evidence gathering
- **Finding Tracking**: Compliance finding management
- **Recommendation Engine**: Automated recommendations
- **Export Options**: PDF and Excel report formats

### Sample Compliance Report Structure
```typescript
interface ComplianceReport {
  report_type: 'GDPR' | 'SOX' | 'HIPAA' | 'PCI_DSS' | 'ISO_27001' | 'CUSTOM';
  report_period_start: Date;
  report_period_end: Date;
  summary: ComplianceSummary;
  metrics: ComplianceMetrics;
  findings: ComplianceFinding[];
  compliance_score: number; // 0-1 scale
}
```

## ⚙️ Configuration

### Risk Level Configuration
```typescript
const riskLevels = {
  LOW: { threshold: 0.1, actions: ['log'] },
  MEDIUM: { threshold: 0.3, actions: ['log', 'alert'] },
  HIGH: { threshold: 0.6, actions: ['log', 'alert', 'notify'] },
  CRITICAL: { threshold: 0.8, actions: ['log', 'alert', 'notify', 'block'] }
};
```

### Alert Thresholds
```typescript
const alertThresholds = {
  bruteForceAttempts: 10,    // attempts per 15 minutes
  failedLoginRatio: 0.5,    // 50% failure rate
  unusualAccessTime: 0.3,   // 30% off-hours access
  highRiskScore: 0.7,       // 0.7 risk score threshold
  geoAnomalies: 3           // 3+ different locations
};
```

### Scheduled Tasks
```typescript
const scheduledTasks = [
  {
    name: 'Update User Analytics',
    schedule: '0 */2 * * *',  // Every 2 hours
    function: 'updateUserBehaviorAnalytics'
  },
  {
    name: 'Run Anomaly Detection',
    schedule: '0 */4 * * *',  // Every 4 hours
    function: 'runAnomalyDetection'
  },
  {
    name: 'Clean Old Logs',
    schedule: '0 2 * * 0',    // Every Sunday at 2 AM
    function: 'cleanOldAuditLogs'
  }
];
```

## 🔒 Security Considerations

### Data Protection
- **Encryption**: All sensitive data encrypted at rest and in transit
- **Access Control**: Role-based access to audit data
- **Data Retention**: Configurable retention policies
- **Anonymization**: User data anonymization options

### Performance
- **Indexing**: Optimized database indexes for query performance
- **Batch Processing**: Bulk operations for high-volume scenarios
- **Real-time vs Batch**: Balance between real-time processing and performance
- **Archival Strategy**: Automated archival of old data

### Compliance
- **Audit Trail Integrity**: Tamper-evident audit logging
- **Data Sovereignty**: Regional data storage compliance
- **Access Logging**: All admin access logged and monitored
- **Evidence Preservation**: Immutable audit evidence storage

## 🧪 Testing

### Unit Tests
```bash
# Test audit middleware
npm test audit/middleware/auditMiddleware.test.ts

# Test analytics engine
npm test analytics/userBehaviorAnalytics.test.ts

# Test alerting system
npm test alerts/securityAlertingSystem.test.ts
```

### Integration Tests
```bash
# End-to-end audit flow
npm test integration/audit-flow.test.ts

# Compliance reporting
npm test integration/compliance-reporting.test.ts
```

### Performance Tests
```bash
# Load testing for high-volume scenarios
npm run test:load

# Database performance
npm run test:db-performance
```

## 📈 Performance Monitoring

### Key Metrics
- **Event Throughput**: Events processed per second
- **Query Performance**: Database query response times
- **Alert Latency**: Time from event to alert notification
- **Report Generation Time**: Time to generate compliance reports

### Monitoring Dashboard
- **Real-time Metrics**: Live system performance metrics
- **Historical Trends**: Performance over time
- **Alert Statistics**: Alert system performance
- **Resource Utilization**: CPU, memory, and storage usage

## 🚨 Troubleshooting

### Common Issues

1. **High Database Load**
   - Enable batch processing for high-volume scenarios
   - Implement proper indexing strategy
   - Consider data archival for old records

2. **Alert Flood**
   - Adjust alert thresholds
   - Implement proper cooldown periods
   - Use intelligent filtering

3. **Performance Issues**
   - Optimize database queries
   - Implement caching strategies
   - Consider read replicas

4. **Storage Growth**
   - Implement data retention policies
   - Regular archival of old data
   - Compress historical data

### Log Analysis
```sql
-- Find high-risk events
SELECT * FROM audit_logs 
WHERE risk_level IN ('HIGH', 'CRITICAL')
ORDER BY timestamp DESC;

-- Analyze failed login patterns
SELECT ip_address, COUNT(*) as attempts
FROM failed_login_attempts
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 5;

-- Check for anomalies
SELECT * FROM anomaly_detection
WHERE status = 'OPEN'
AND confidence_level > 0.8;
```

## 🔧 Maintenance

### Regular Tasks
- **Database Maintenance**: Regular VACUUM and ANALYZE
- **Log Rotation**: Automated log archival
- **Performance Tuning**: Query optimization and indexing
- **Security Updates**: Regular security patches

### Backup Strategy
- **Audit Data**: Daily backup of audit tables
- **Configuration**: Configuration backup and versioning
- **Recovery Testing**: Regular recovery procedure testing

## 📚 API Reference

### Audit Logging API

#### Log Single Event
```typescript
POST /api/audit/log
{
  "type": "audit_event",
  "data": {
    "event_id": "unique-event-id",
    "user_id": "user-uuid",
    "event_type": "data_access",
    "event_category": "data",
    "action": "READ",
    "resource_type": "user_profiles",
    "resource_id": "profile-123",
    "risk_level": "LOW",
    "status": "SUCCESS"
  }
}
```

#### Log Bulk Events
```typescript
POST /api/audit/bulk
{
  "type": "audit_events",
  "data": [
    {
      "event_id": "event-1",
      "event_type": "login",
      "action": "LOGIN",
      // ... other fields
    }
    // ... more events
  ]
}
```

#### Retrieve Audit Logs
```typescript
GET /api/audit/logs?limit=100&offset=0&riskLevel=HIGH&timeRange=24h
```

#### Security Events
```typescript
GET /api/audit/security-events?severity=HIGH&status=open
PATCH /api/audit/security-events?id=event-id
{
  "resolved": true,
  "resolved_by": "admin-user-id"
}
```

#### User Analytics
```typescript
GET /api/audit/user-analytics?userId=user-uuid&riskThreshold=0.7
GET /api/audit/user-analytics/high-risk?threshold=0.7
GET /api/audit/user-analytics/summary?timeRange=7d
```

#### Anomalies
```typescript
GET /api/audit/anomalies?status=OPEN&severity=HIGH
POST /api/audit/anomalies
{
  "event_id": "anomaly-123",
  "user_id": "user-uuid",
  "anomaly_type": "unusual_login_time",
  "severity": "MEDIUM",
  "description": "Login during off hours",
  "confidence_level": 0.85
}
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests**
5. **Submit a pull request**

### Development Guidelines
- Follow TypeScript best practices
- Add comprehensive tests
- Update documentation
- Ensure security compliance
- Consider performance impact

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- **Documentation**: Check this README and inline documentation
- **Issues**: Create GitHub issues for bugs and feature requests
- **Security**: Report security issues privately via email

## 🚀 Future Enhancements

- **Machine Learning**: Advanced ML-based anomaly detection
- **Integration**: More third-party security tool integrations
- **Mobile App**: Mobile application for security monitoring
- **Advanced Analytics**: Predictive security analytics
- **Blockchain**: Immutable audit trail using blockchain technology

---

**Built with ❤️ for enterprise security and compliance**