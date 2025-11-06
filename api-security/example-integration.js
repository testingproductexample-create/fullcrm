/**
 * Example Integration of API Security System
 * 
 * This file demonstrates how to integrate the API security system
 * into a real application with custom endpoints and business logic.
 */

const express = require('express');
const app = express();

// Import API security components
const { authenticateAPIKey, requirePermission, validateIPWhitelist } = require('./middleware/security');
const { dynamicRateLimit } = require('./strategies/rateLimiting');
const { checkVersionCompatibility } = require('./middleware/apiVersioning');
const { generateApiKey } = require('./utils/apiKeyManager');
const securityLogger = require('./utils/securityLogger');

// Example business logic - User Management Service
class UserManagementService {
  constructor() {
    this.users = new Map();
    this.userIdCounter = 1;
  }

  // Create a new user
  createUser(userData) {
    const userId = this.userIdCounter++;
    const user = {
      id: userId,
      ...userData,
      createdAt: new Date(),
      isActive: true,
      apiKeys: []
    };
    
    this.users.set(userId, user);
    securityLogger.info('User created', { userId, email: userData.email });
    
    return user;
  }

  // Get user by ID
  getUser(userId) {
    return this.users.get(userId);
  }

  // Update user
  updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    Object.assign(user, updates, { updatedAt: new Date() });
    securityLogger.info('User updated', { userId });
    
    return user;
  }

  // Delete user
  deleteUser(userId) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    user.isActive = false;
    user.deletedAt = new Date();
    securityLogger.info('User deleted', { userId });
    
    return user;
  }

  // List users with pagination
  listUsers(page = 1, limit = 10) {
    const users = Array.from(this.users.values())
      .filter(user => user.isActive)
      .sort((a, b) => b.createdAt - a.createdAt);
    
    const offset = (page - 1) * limit;
    const paginatedUsers = users.slice(offset, offset + limit);
    
    return {
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: users.length,
        pages: Math.ceil(users.length / limit)
      }
    };
  }
}

// Example business logic - Order Management Service
class OrderManagementService {
  constructor() {
    this.orders = new Map();
    this.orderIdCounter = 1;
  }

  // Create a new order
  createOrder(orderData) {
    const orderId = this.orderIdCounter++;
    const order = {
      id: orderId,
      ...orderData,
      status: 'pending',
      createdAt: new Date()
    };
    
    this.orders.set(orderId, order);
    securityLogger.info('Order created', { orderId, userId: orderData.userId });
    
    return order;
  }

  // Get order by ID
  getOrder(orderId) {
    return this.orders.get(orderId);
  }

  // Update order status
  updateOrderStatus(orderId, status) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    order.status = status;
    order.updatedAt = new Date();
    securityLogger.info('Order status updated', { orderId, status });
    
    return order;
  }

  // Get orders by user
  getOrdersByUser(userId) {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

// Initialize services
const userService = new UserManagementService();
const orderService = new OrderManagementService();

/**
 * Protected API Routes with Business Logic
 * These routes require authentication and proper permissions
 */

// Get user profile (read permission required)
app.get('/api/v2/users/profile', 
  authenticateAPIKey,
  requirePermission('read'),
  (req, res) => {
    try {
      const user = userService.getUser(req.userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'The requested user profile does not exist'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

// Create new user (admin permission required)
app.post('/api/v2/users',
  authenticateAPIKey,
  requirePermission('admin'),
  checkVersionCompatibility(['user_management']),
  (req, res) => {
    try {
      const { email, name, role = 'user' } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Email and name are required'
        });
      }

      // Check if user already exists
      const existingUser = Array.from(userService.users.values())
        .find(user => user.email === email && user.isActive);
      
      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'A user with this email already exists'
        });
      }

      const user = userService.createUser({ email, name, role });
      
      // Generate API key for the new user
      const apiKey = await generateApiKey(user.id, ['read'], '30d');
      
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          apiKey: {
            key: apiKey.key,
            permissions: apiKey.permissions,
            expiresAt: apiKey.expiresAt
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

// Update user (admin permission required)
app.put('/api/v2/users/:userId',
  authenticateAPIKey,
  requirePermission('admin'),
  (req, res) => {
    try {
      const { userId } = req.params;
      const { email, name, role } = req.body;
      
      const user = userService.updateUser(parseInt(userId), { email, name, role });
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'User not found',
          message: 'The specified user does not exist'
        });
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

// List users with pagination (admin permission required)
app.get('/api/v2/users',
  authenticateAPIKey,
  requirePermission('admin'),
  dynamicRateLimit,
  (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      
      const result = userService.listUsers(page, limit);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

// Create order (write permission required)
app.post('/api/v2/orders',
  authenticateAPIKey,
  requirePermission('write'),
  (req, res) => {
    try {
      const { userId, items, total } = req.body;
      
      if (!userId || !items || !total) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'userId, items, and total are required'
        });
      }
      
      // Verify user exists
      const user = userService.getUser(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'The specified user does not exist'
        });
      }
      
      const order = orderService.createOrder({
        userId,
        items,
        total,
        createdBy: req.userId
      });
      
      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

// Get order (read permission required)
app.get('/api/v2/orders/:orderId',
  authenticateAPIKey,
  requirePermission('read'),
  (req, res) => {
    try {
      const { orderId } = req.params;
      const order = orderService.getOrder(parseInt(orderId));
      
      if (!order) {
        return res.status(404).json({
          error: 'Order not found',
          message: 'The specified order does not exist'
        });
      }
      
      // Check if user has permission to view this order
      if (req.apiKey.permissions.includes('admin') || order.userId === req.userId) {
        res.json({
          success: true,
          data: order
        });
      } else {
        res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to view this order'
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

// Get user's orders (read permission required)
app.get('/api/v2/orders',
  authenticateAPIKey,
  requirePermission('read'),
  (req, res) => {
    try {
      const userId = req.query.userId || req.userId;
      
      // Non-admin users can only view their own orders
      if (userId !== req.userId && !req.apiKey.permissions.includes('admin')) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own orders'
        });
      }
      
      const orders = orderService.getOrdersByUser(parseInt(userId));
      
      res.json({
        success: true,
        data: {
          orders,
          count: orders.length
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * IP Whitelist Example
 * Endpoints that are restricted to specific IP addresses
 */
app.get('/api/v2/admin/status',
  authenticateAPIKey,
  requirePermission('admin'),
  validateIPWhitelist(['127.0.0.1', '::1']), // Only localhost
  (req, res) => {
    try {
      const stats = {
        totalUsers: userService.users.size,
        totalOrders: orderService.orders.size,
        systemHealth: 'healthy',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      };
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
);

/**
 * Webhook Endpoint Example
 * Handle business logic webhooks with security validation
 */
app.post('/api/v2/webhooks/payment',
  authenticateAPIKey,
  requirePermission('webhook'),
  (req, res) => {
    try {
      const { event, data } = req.body;
      
      securityLogger.info('Payment webhook received', {
        event,
        userId: req.userId,
        apiKeyId: req.apiKey.keyId
      });
      
      // Process webhook based on event type
      switch (event) {
        case 'payment.succeeded':
          // Update order status
          if (data.orderId) {
            orderService.updateOrderStatus(data.orderId, 'paid');
          }
          break;
          
        case 'payment.failed':
          // Handle failed payment
          if (data.orderId) {
            orderService.updateOrderStatus(data.orderId, 'payment_failed');
          }
          break;
          
        default:
          securityLogger.warn('Unknown payment event', { event, data });
      }
      
      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Webhook processing failed',
        message: error.message
      });
    }
  }
);

/**
 * Error Handling for Business Logic
 */
app.use((error, req, res, next) => {
  securityLogger.error('Business logic error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.userId,
    apiKeyId: req.apiKey?.keyId
  });
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

/**
 * Health Check for Business Services
 */
app.get('/api/v2/health', (req, res) => {
  const health = {
    status: 'healthy',
    services: {
      userManagement: 'running',
      orderManagement: 'running',
      security: 'running'
    },
    timestamp: new Date().toISOString()
  };
  
  res.json(health);
});

module.exports = {
  app,
  userService,
  orderManagementService: orderService
};

// Example usage
if (require.main === module) {
  const port = process.env.BUSINESS_LOGIC_PORT || 3003;
  app.listen(port, () => {
    console.log(`🚀 Business Logic Service running on port ${port}`);
    console.log('📊 Protected endpoints:');
    console.log('   • GET  /api/v2/users/profile - User profile (read)');
    console.log('   • POST /api/v2/users - Create user (admin)');
    console.log('   • PUT  /api/v2/users/:id - Update user (admin)');
    console.log('   • GET  /api/v2/users - List users (admin)');
    console.log('   • POST /api/v2/orders - Create order (write)');
    console.log('   • GET  /api/v2/orders/:id - Get order (read)');
    console.log('   • GET  /api/v2/orders - Get user orders (read)');
    console.log('   • GET  /api/v2/admin/status - Admin status (admin + IP whitelist)');
    console.log('   • POST /api/v2/webhooks/payment - Payment webhooks (webhook)');
  });
}