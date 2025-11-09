# Multi-Tenant Architecture & Data Isolation System

A comprehensive multi-tenant architecture and data isolation system for the UAE tailoring business platform, built with TypeScript and featuring advanced role-based access control, white-label capabilities, and scalable tenant onboarding.

## 🚀 Features

### Core Architecture
- **Multi-tenant context resolution** - Automatic tenant identification from headers, subdomains, paths, or domains
- **Data isolation strategies** - Row-level, schema-based, and database-level isolation
- **Tenant lifecycle management** - Create, update, suspend, and archive tenants
- **Scalable routing system** - Dynamic routing with tenant-specific configurations

### Security & Access Control
- **Advanced RBAC** - Granular permissions with role hierarchies
- **Data isolation guards** - Enforce tenant boundaries in all operations
- **Security middleware** - Rate limiting, input validation, audit logging
- **IP whitelisting** - Tenant-specific IP access controls
- **Session management** - JWT-based authentication with timeout controls

### White-Label Capabilities
- **Custom branding** - Logos, colors, themes per tenant
- **Custom domains** - SSL-enabled custom domain support
- **DNS automation** - Automatic DNS record generation
- **Asset management** - Tenant-specific asset delivery
- **Email/PDF templates** - Customizable communication templates

### Tenant Onboarding
- **Configurable flows** - Step-by-step onboarding processes
- **Progress tracking** - Real-time onboarding status
- **Analytics dashboard** - Onboarding metrics and insights
- **Conditional steps** - Dynamic flow based on tenant type

### Performance & Monitoring
- **Intelligent caching** - Redis and in-memory caching strategies
- **Health monitoring** - System health checks and diagnostics
- **Audit logging** - Comprehensive security event logging
- **Metrics collection** - Tenant usage and performance metrics

## 📦 Installation

```bash
npm install @uae-tailoring/multi-tenant
```

## 🏗️ Quick Start

### Basic Setup

```typescript
import { 
  multiTenantContext, 
  initializeMultiTenantSystem,
  MultiTenantConfig,
  tenantResolver,
  authenticate,
  requirePermissions
} from '@uae-tailoring/multi-tenant';

import express from 'express';

const app = express();

// Initialize the multi-tenant system
await initializeMultiTenantSystem(MultiTenantConfig);

// Apply middleware
app.use(tenantResolver);
app.use(authenticate);
app.use(requirePermissions({ resource: 'orders', action: 'read' }));

// Your routes
app.get('/api/orders', async (req, res) => {
  const tenantContext = req.tenantContext;
  const orders = await getTenantOrders(tenantContext.tenant.id);
  res.json(orders);
});
```

### Create a New Tenant

```typescript
import { multiTenantContext } from '@uae-tailoring/multi-tenant';

// Create tenant
const tenant = await multiTenantContext.createTenant({
  name: 'Al Karam Tailoring',
  slug: 'al-karam-tailoring',
  domain: 'alkaram.ae',
  configuration: {
    timezone: 'Asia/Dubai',
    currency: 'AED',
    language: 'en',
    features: {
      custom_measurements: true,
      advanced_reporting: true
    }
  }
});

console.log('Tenant created:', tenant.id);
```

## 🔧 Configuration

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tailoring_platform
DB_USER=postgres
DB_PASSWORD=your-password

# Cache
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TYPE=redis

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Assets
ASSET_CDN_URL=https://cdn.yourdomain.com
```

### Multi-Tenant Config

```typescript
import { MultiTenantConfig } from '@uae-tailoring/multi-tenant';

const config = {
  ...MultiTenantConfig,
  database: {
    type: 'postgresql',
    host: process.env.DB_HOST,
    port: 5432,
    name: 'tailoring_platform',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production'
  },
  whiteLabel: {
    enabled: true,
    customDomains: true,
    sslEnabled: true
  }
};
```

## 🏢 Tenant Management

### Tenant Creation

```typescript
import { multiTenantContext } from '@uae-tailoring/multi-tenant';

const tenantData = {
  name: 'Dubai Fashion House',
  slug: 'dubai-fashion-house',
  subdomain: 'dfh',
  configuration: {
    timezone: 'Asia/Dubai',
    currency: 'AED',
    workingDays: [1, 2, 3, 4, 5, 6],
    workingHours: { start: '09:00', end: '18:00' }
  },
  branding: {
    primaryColor: '#1e40af',
    secondaryColor: '#64748b',
    theme: 'light'
  },
  limits: {
    maxUsers: 50,
    maxStorage: 100,
    maxOrders: 10000
  }
};

const result = await multiTenantContext.createTenant(tenantData);
if (result.success) {
  console.log('Tenant created:', result.data);
}
```

### Update Tenant

```typescript
const result = await multiTenantContext.updateTenant(tenantId, {
  configuration: {
    ...existingConfig,
    features: {
      ...existingConfig.features,
      advanced_analytics: true
    }
  }
});
```

### Suspend Tenant

```typescript
await multiTenantContext.deactivateTenant(tenantId, 'Policy violation');
```

## 🔐 Security & Access Control

### Role-Based Permissions

```typescript
import { tenantGuards } from '@uae-tailoring/multi-tenant';

// Check if user can access resource
const canAccess = await tenantGuards.canAccessResource(
  user,
  'orders',
  'create',
  orderId
);

if (!canAccess) {
  throw new Error('Insufficient permissions');
}
```

### Permission Middleware

```typescript
import { requirePermissions } from '@uae-tailoring/multi-tenant';

app.post('/api/orders', 
  requirePermissions({ resource: 'orders', action: 'create' }),
  createOrder
);
```

### Role Middleware

```typescript
app.get('/api/admin/users',
  requireRoles('admin', 'super_admin'),
  getUsers
);
```

## 🎨 White-Label Features

### Enable White-Label

```typescript
import { whiteLabelService } from '@uae-tailoring/multi-tenant';

const whiteLabelConfig = {
  enabled: true,
  customDomain: {
    domain: 'mystore.ae',
    sslEnabled: true
  },
  customHeaders: {
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff'
  }
};

const result = await whiteLabelService.enableWhiteLabel(tenantId, whiteLabelConfig);
```

### Generate CSS

```typescript
const css = await whiteLabelService.generateWhiteLabelCSS(tenantId);
// Returns tenant-specific CSS with custom branding
```

### DNS Records

```typescript
const dnsRecords = await whiteLabelService.generateDNSRecords(tenantId, 'mystore.ae');
// Returns DNS records for domain configuration
```

## 📋 Onboarding

### Start Onboarding

```typescript
import { tenantOnboardingService } from '@uae-tailoring/multi-tenant';

const result = await tenantOnboardingService.startOnboarding(tenantId);
if (result.success) {
  console.log('Onboarding started:', result.data);
}
```

### Complete Step

```typescript
const stepData = {
  companyName: 'My Tailoring Shop',
  industry: 'fashion',
  establishedYear: 2020
};

const result = await tenantOnboardingService.completeStep(
  tenantId,
  'company-setup',
  stepData
);
```

### Skip Step

```typescript
await tenantOnboardingService.skipStep(
  tenantId,
  'integration',
  'Will configure later'
);
```

## 🔄 Data Isolation

### Row-Level Security

The system automatically applies tenant isolation to all database queries:

```typescript
// Automatically includes WHERE tenant_id = 'tenant-id'
const orders = await databaseService.findMany('orders', { status: 'active' });
```

### Custom Queries

```typescript
import { MultiTenantUtils } from '@uae-tailoring/multi-tenant';

const { query, params } = await MultiTenantUtils.getIsolatedQuery(
  'SELECT * FROM orders ORDER BY created_at DESC',
  tenantId
);
const results = await databaseService.query(query, params);
```

## 📊 Monitoring & Analytics

### Health Check

```typescript
import { multiTenantHealthCheck } from '@uae-tailoring/multi-tenant';

const health = await multiTenantHealthCheck();
console.log('System health:', health.status);
```

### Tenant Analytics

```typescript
const analytics = await tenantOnboardingService.getOnboardingAnalytics();
console.log('Completion rate:', analytics.completionRate);
```

## 🛠️ Advanced Usage

### Custom Middleware

```typescript
import { TenantMiddleware } from '@uae-tailoring/multi-tenant';

app.use(TenantMiddleware.rateLimit({
  max: 1000,
  windowMs: 15 * 60 * 1000
}));

app.use(TenantMiddleware.auditLog);
app.use(TenantMiddleware.securityHeaders);
```

### Tenant Guards

```typescript
import { tenantGuards } from '@uae-tailoring/multi-tenant';

// Validate data access
const canAccess = await tenantGuards.canPerformActionOnData(
  user,
  'create',
  'order',
  orderData
);

// Check API access
const canUseAPI = await tenantGuards.canAccessAPI(
  user,
  '/api/orders',
  'POST'
);
```

### Cache Management

```typescript
import { cacheService } from '@uae-tailoring/multi-tenant';

// Cache tenant data
await cacheService.set(`tenant:${tenantId}:config`, config, 3600);

// Get cached data
const cached = await cacheService.get(`tenant:${tenantId}:config`);

// Clear tenant cache
await cacheService.clearTenant(tenantId);
```

## 📚 API Reference

### Core Services

- **MultiTenantContext** - Central tenant management
- **TenantStorageService** - Data persistence
- **TenantSecurityService** - Security operations
- **TenantRoutingService** - Request routing
- **TenantMiddleware** - Express middleware
- **TenantGuards** - Access control
- **WhiteLabelService** - Branding management
- **TenantOnboardingService** - User onboarding

### Middleware Functions

- `tenantResolver` - Extract tenant from request
- `authenticate` - Verify user authentication
- `requireRoles` - Check user roles
- `requirePermissions` - Check permissions
- `rateLimit` - Apply rate limiting
- `auditLog` - Log security events

## 🔧 Database Schema

The system creates the following key tables:

```sql
-- Tenants
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    domain VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    configuration JSONB,
    branding JSONB,
    subscription JSONB,
    limits JSONB,
    security JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Roles
CREATE TABLE tenant_roles (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    permissions JSONB,
    restrictions JSONB
);

-- Onboarding Progress
CREATE TABLE onboarding_progress (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    flow_id VARCHAR(100),
    current_step INTEGER,
    completed_steps JSONB,
    data JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📖 Documentation

```bash
# Generate documentation
npm run docs

# Watch for changes
npm run docs:watch
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email dev@uae-tailoring.com or create an issue in the GitHub repository.

## 🎯 Roadmap

- [ ] GraphQL support
- [ ] Kubernetes deployment manifests
- [ ] Advanced analytics dashboard
- [ ] Machine learning-powered insights
- [ ] Mobile SDK
- [ ] Third-party integrations
- [ ] Advanced monitoring and alerting

---

Built with ❤️ for the UAE tailoring business community.
