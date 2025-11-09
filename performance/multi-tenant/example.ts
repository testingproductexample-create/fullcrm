/**
 * Multi-Tenant System - Usage Example
 * UAE Tailoring Business Platform
 */

import express from 'express';
import { 
  multiTenantContext,
  initializeMultiTenantSystem,
  MultiTenantConfig,
  tenantResolver,
  authenticate,
  requireRoles,
  requirePermissions,
  rateLimit,
  tenantGuards,
  whiteLabelService,
  tenantOnboardingService,
  MultiTenantUtils
} from './index';

const app = express();
app.use(express.json());

// Example 1: Initialize the system
async function initializeSystem() {
  try {
    await initializeMultiTenantSystem(MultiTenantConfig);
    console.log('Multi-tenant system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize system:', error);
    process.exit(1);
  }
}

// Example 2: Create a new tailoring business tenant
async function createTailoringTenant() {
  const tenantData = {
    name: 'Emirates Fashion House',
    slug: 'emirates-fashion',
    domain: 'emiratesfashion.ae',
    subdomain: 'emirates',
    configuration: {
      timezone: 'Asia/Dubai',
      currency: 'AED',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      workingDays: [1, 2, 3, 4, 5, 6], // Sunday to Saturday
      workingHours: { start: '09:00', end: '18:00' },
      features: {
        custom_measurements: true,
        pattern_design: true,
        appointment_booking: true,
        inventory_management: true,
        staff_management: true,
        customer_portal: true
      },
      customFields: {
        fabricTypes: ['Cotton', 'Silk', 'Wool', 'Linen', 'Synthetic'],
        garmentTypes: ['Suits', 'Dresses', 'Shirts', 'Trousers', 'Traditional Wear'],
        tailoringStyles: ['Modern', 'Classic', 'Traditional', 'Fusion']
      }
    },
    branding: {
      logo: '/assets/tenants/emirates-fashion/logo.png',
      favicon: '/assets/tenants/emirates-fashion/favicon.ico',
      primaryColor: '#1e40af',
      secondaryColor: '#64748b',
      accentColor: '#f59e0b',
      theme: 'light',
      customCSS: `
        .tenant-header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); }
        .btn-primary { background-color: #1e40af; }
        .order-card { border-left: 4px solid #f59e0b; }
      `
    },
    limits: {
      maxUsers: 25,
      maxStorage: 50, // GB
      maxApiCalls: 50000,
      maxOrders: 5000,
      maxCustomers: 2500,
      features: {
        custom_measurements: 10000,
        pattern_designs: 500
      }
    },
    security: {
      encryption: true,
      twoFactorRequired: false,
      sessionTimeout: 480, // 8 hours
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 5
      },
      allowedIPs: [],
      auditLog: true,
      dataRetention: 730 // 2 years
    }
  };

  const result = await multiTenantContext.createTenant(tenantData);
  if (result.success && result.data) {
    console.log('Tenant created successfully:', result.data.id);
    return result.data;
  } else {
    console.error('Failed to create tenant:', result.error);
    return null;
  }
}

// Example 3: Set up white-label for tenant
async function setupWhiteLabel(tenantId: string) {
  const whiteLabelConfig = {
    enabled: true,
    customDomain: {
      domain: 'emiratesfashion.ae',
      sslEnabled: true
    },
    sslEnabled: true,
    customHeaders: {
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block'
    },
    favicon: '/assets/tenants/emirates-fashion/favicon.ico'
  };

  const result = await whiteLabelService.enableWhiteLabel(tenantId, whiteLabelConfig);
  if (result.success) {
    console.log('White-label configured successfully');
    
    // Generate DNS records
    const dnsRecords = await whiteLabelService.generateDNSRecords(tenantId, 'emiratesfashion.ae');
    if (dnsRecords.success) {
      console.log('DNS Records:', dnsRecords.data);
    }
  }
}

// Example 4: Start onboarding process
async function startTenantOnboarding(tenantId: string) {
  const result = await tenantOnboardingService.startOnboarding(tenantId);
  if (result.success && result.data) {
    console.log('Onboarding started for tenant:', tenantId);
    console.log('Current step:', result.data.currentStep);
    return result.data;
  }
  return null;
}

// Example 5: Express middleware setup
function setupMiddleware() {
  // Apply multi-tenant middleware
  app.use(tenantResolver);
  app.use(authenticate);
  app.use(rateLimit({ max: 1000, windowMs: 15 * 60 * 1000 }));
}

// Example 6: Protected API routes
function setupRoutes() {
  // Dashboard route
  app.get('/api/dashboard', 
    requirePermissions({ resource: 'dashboard', action: 'read' }),
    async (req, res) => {
      const tenantContext = req.tenantContext!;
      const tenantId = tenantContext.tenant.id;
      
      // Get tenant-specific dashboard data
      const dashboardData = {
        totalOrders: await getTotalOrders(tenantId),
        activeCustomers: await getActiveCustomers(tenantId),
        pendingMeasurements: await getPendingMeasurements(tenantId),
        todayAppointments: await getTodayAppointments(tenantId)
      };
      
      res.json({
        success: true,
        data: dashboardData,
        meta: {
          tenant: tenantContext.tenant.slug,
          timestamp: new Date()
        }
      });
    }
  );

  // Orders management
  app.post('/api/orders',
    requirePermissions({ resource: 'orders', action: 'create' }),
    requireRoles('tailor', 'admin', 'super_admin'),
    async (req, res) => {
      const tenantContext = req.tenantContext!;
      const orderData = req.body;
      
      // Validate tenant limits
      const limitCheck = await MultiTenantUtils.checkTenantLimits(
        tenantContext.tenant.id, 
        'orders', 
        1
      );
      
      if (!limitCheck.allowed) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'LIMIT_EXCEEDED',
            message: `Order limit exceeded. ${limitCheck.remaining} orders remaining.`,
            timestamp: new Date()
          }
        });
      }
      
      // Create order with tenant isolation
      const order = await createOrder(tenantContext.tenant.id, orderData);
      
      res.json({
        success: true,
        data: order,
        meta: {
          tenant: tenantContext.tenant.slug,
          timestamp: new Date()
        }
      });
    }
  );

  // Customer management
  app.get('/api/customers',
    requirePermissions({ resource: 'customers', action: 'read' }),
    async (req, res) => {
      const tenantContext = req.tenantContext!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Get customers with tenant isolation
      const customers = await getCustomers(tenantContext.tenant.id, page, limit);
      
      res.json({
        success: true,
        data: customers,
        meta: {
          tenant: tenantContext.tenant.slug,
          page,
          limit,
          timestamp: new Date()
        }
      });
    }
  );

  // Admin-only route
  app.get('/api/admin/tenant-info',
    requireRoles('admin', 'super_admin'),
    async (req, res) => {
      const tenantContext = req.tenantContext!;
      
      // Get detailed tenant information
      const tenantInfo = {
        id: tenantContext.tenant.id,
        name: tenantContext.tenant.name,
        plan: tenantContext.tenant.subscription.plan,
        limits: tenantContext.tenant.limits,
        usage: tenantContext.tenant.subscription.usage,
        security: {
          twoFactorEnabled: tenantContext.tenant.security.twoFactorRequired,
          sessionTimeout: tenantContext.tenant.security.sessionTimeout
        }
      };
      
      res.json({
        success: true,
        data: tenantInfo
      });
    }
  );

  // White-label branding endpoint
  app.get('/api/branding.css',
    async (req, res) => {
      const tenantContext = req.tenantContext!;
      
      try {
        const css = await whiteLabelService.generateWhiteLabelCSS(tenantContext.tenant.id);
        if (css.success) {
          res.set('Content-Type', 'text/css');
          res.send(css.data);
        } else {
          res.status(404).send('/* Branding not found */');
        }
      } catch (error) {
        res.status(500).send('/* Error generating branding */');
      }
    }
  );
}

// Example 7: Database operations with tenant isolation
async function getTotalOrders(tenantId: string): Promise<number> {
  // This would use the isolated query
  const { query, params } = await MultiTenantUtils.getIsolatedQuery(
    'SELECT COUNT(*) FROM orders',
    tenantId
  );
  // const result = await databaseService.query(query, params);
  return Math.floor(Math.random() * 1000) + 100; // Simulated
}

async function getActiveCustomers(tenantId: string): Promise<number> {
  return Math.floor(Math.random() * 500) + 50; // Simulated
}

async function getPendingMeasurements(tenantId: string): Promise<number> {
  return Math.floor(Math.random() * 50) + 5; // Simulated
}

async function getTodayAppointments(tenantId: string): Promise<number> {
  return Math.floor(Math.random() * 20) + 2; // Simulated
}

async function createOrder(tenantId: string, orderData: any): Promise<any> {
  // In real implementation, would use databaseService with tenant isolation
  return {
    id: `order_${Date.now()}`,
    tenantId,
    ...orderData,
    createdAt: new Date()
  };
}

async function getCustomers(tenantId: string, page: number, limit: number): Promise<any> {
  // In real implementation, would use databaseService with tenant isolation
  return {
    customers: [
      {
        id: `customer_${Date.now()}`,
        name: 'Ahmed Al-Mansouri',
        email: 'ahmed@example.com',
        phone: '+971501234567',
        tenantId
      }
    ],
    total: 150,
    page,
    limit,
    hasMore: page * limit < 150
  };
}

// Example 8: Error handling
function setupErrorHandling() {
  app.use((error: any, req: any, res: any, next: any) => {
    console.error('Error occurred:', error);
    
    res.status(error.status || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date()
      }
    });
  });
}

// Example 9: Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Import health check function
    const health = await import('./index').then(m => m.multiTenantHealthCheck());
    
    res.json({
      status: 'ok',
      service: 'multi-tenant-system',
      version: '1.0.0',
      timestamp: new Date(),
      health
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date()
    });
  }
});

// Example 10: Main application startup
async function main() {
  try {
    // Initialize the system
    await initializeSystem();
    
    // Setup middleware and routes
    setupMiddleware();
    setupRoutes();
    setupErrorHandling();
    
    // Create a sample tenant
    const tenant = await createTailoringTenant();
    if (tenant) {
      // Setup white-label
      await setupWhiteLabel(tenant.id);
      
      // Start onboarding
      await startTenantOnboarding(tenant.id);
    }
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Multi-tenant server running on port ${PORT}`);
      console.log('Available endpoints:');
      console.log('  GET  /health - System health check');
      console.log('  GET  /api/dashboard - Tenant dashboard (requires auth)');
      console.log('  POST /api/orders - Create order (requires permissions)');
      console.log('  GET  /api/customers - List customers (requires permissions)');
      console.log('  GET  /api/admin/tenant-info - Admin info (requires admin role)');
      console.log('  GET  /api/branding.css - Tenant-specific CSS');
    });
    
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Run the application
if (require.main === module) {
  main().catch(console.error);
}

export { app, main, createTailoringTenant };
