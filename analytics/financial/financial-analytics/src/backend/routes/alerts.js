import express from 'express';
import { requireCompany } from '../middleware/auth.js';
import { AlertService } from '../services/alertService.js';

export const alertRoutes = express.Router();

// All routes require company context
alertRoutes.use(requireCompany);

// Get all alerts for a company
alertRoutes.get('/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { 
      severity, 
      type, 
      isRead, 
      isResolved, 
      limit = 50, 
      offset = 0 
    } = req.query;
    
    // Mock alerts data
    let alerts = [
      {
        id: 'alert_001',
        type: 'BUDGET_OVERRUN',
        severity: 'HIGH',
        title: 'Budget Overrun in Marketing Expenses',
        message: 'Marketing expenses have exceeded budget by 15% in Q2 2024',
        threshold: 35000,
        actual: 40250,
        category: 'Marketing',
        isRead: false,
        isResolved: false,
        createdAt: '2024-06-15T10:30:00Z',
        companyId
      },
      {
        id: 'alert_002',
        type: 'REVENUE_DROP',
        severity: 'MEDIUM',
        title: 'Revenue Decline Detected',
        message: 'Revenue decreased by 8% from previous month',
        threshold: -5,
        actual: -8,
        previousValue: 1300000,
        currentValue: 1196000,
        period: 'May 2024',
        isRead: true,
        isResolved: false,
        createdAt: '2024-06-01T09:15:00Z',
        companyId
      },
      {
        id: 'alert_003',
        type: 'CASH_FLOW_ISSUE',
        severity: 'CRITICAL',
        title: 'Low Cash Flow Warning',
        message: 'Operating cash flow has dropped below minimum threshold',
        threshold: 200000,
        actual: 150000,
        period: 'May 2024',
        isRead: false,
        isResolved: false,
        createdAt: '2024-05-31T16:45:00Z',
        companyId
      },
      {
        id: 'alert_004',
        type: 'VAT_COMPLIANCE',
        severity: 'HIGH',
        title: 'VAT Return Due Soon',
        message: 'VAT return for June 2024 is due in 3 days',
        dueDate: '2024-07-15',
        daysUntilDue: 3,
        isRead: false,
        isResolved: false,
        createdAt: '2024-07-12T08:00:00Z',
        companyId
      },
      {
        id: 'alert_005',
        type: 'PROFIT_MARGIN_DETERIORATION',
        severity: 'MEDIUM',
        title: 'Profit Margin Decline',
        message: 'Net profit margin decreased by 3% compared to previous quarter',
        threshold: -2,
        actual: -3,
        previousMargin: 35,
        currentMargin: 32,
        period: 'Q2 2024',
        isRead: true,
        isResolved: true,
        resolvedAt: '2024-06-30T14:20:00Z',
        companyId
      }
    ];
    
    // Apply filters
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity.toUpperCase());
    }
    
    if (type) {
      alerts = alerts.filter(alert => alert.type === type.toUpperCase());
    }
    
    if (isRead !== undefined) {
      alerts = alerts.filter(alert => alert.isRead === (isRead === 'true'));
    }
    
    if (isResolved !== undefined) {
      alerts = alerts.filter(alert => alert.isResolved === (isResolved === 'true'));
    }
    
    // Sort by creation date (newest first)
    alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedAlerts = alerts.slice(startIndex, endIndex);
    
    // Get alert summary
    const summary = {
      total: alerts.length,
      bySeverity: {
        CRITICAL: alerts.filter(a => a.severity === 'CRITICAL').length,
        HIGH: alerts.filter(a => a.severity === 'HIGH').length,
        MEDIUM: alerts.filter(a => a.severity === 'MEDIUM').length,
        LOW: alerts.filter(a => a.severity === 'LOW').length
      },
      byType: {
        BUDGET_OVERRUN: alerts.filter(a => a.type === 'BUDGET_OVERRUN').length,
        REVENUE_DROP: alerts.filter(a => a.type === 'REVENUE_DROP').length,
        CASH_FLOW_ISSUE: alerts.filter(a => a.type === 'CASH_FLOW_ISSUE').length,
        VAT_COMPLIANCE: alerts.filter(a => a.type === 'VAT_COMPLIANCE').length,
        PROFIT_MARGIN_DETERIORATION: alerts.filter(a => a.type === 'PROFIT_MARGIN_DETERIORATION').length
      },
      status: {
        unread: alerts.filter(a => !a.isRead).length,
        unresolved: alerts.filter(a => !a.isResolved).length
      }
    };
    
    res.json({
      success: true,
      data: {
        alerts: paginatedAlerts,
        summary,
        pagination: {
          total: alerts.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: endIndex < alerts.length
        }
      }
    });
    
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      error: 'Failed to fetch alerts',
      details: error.message
    });
  }
});

// Generate alerts based on financial data
alertRoutes.post('/generate/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { 
      revenueData, 
      costData, 
      cashFlowData, 
      budgetData,
      actualData,
      thresholds = {}
    } = req.body;
    
    // Mock data if not provided
    const mockFinancialData = {
      revenue: revenueData || [
        { period: '2024-05', amount: 1300000 },
        { period: '2024-06', amount: 1250000 }
      ],
      costs: costData || [
        { period: '2024-05', amount: 820000, category: 'Marketing' },
        { period: '2024-06', amount: 850000, category: 'Marketing' }
      ],
      cashFlow: cashFlowData || [
        { period: '2024-05', netCashFlow: 280000, operatingCashFlow: 350000 },
        { period: '2024-06', netCashFlow: 150000, operatingCashFlow: 275000 }
      ],
      budgets: budgetData || [
        { category: 'Marketing', amount: 35000 }
      ],
      actual: actualData || [
        { category: 'Marketing', amount: 40250 }
      ],
      profit: [
        { period: '2024-05', margin: 35 },
        { period: '2024-06', margin: 32 }
      ],
      transactions: [
        { amount: 50000, date: '2024-06-15' },
        { amount: 45000, date: '2024-06-16' },
        { amount: 120000, date: '2024-06-17' }
      ],
      vat: {
        chargeableAmount: 1250000,
        registrationNumber: '100123456700003'
      },
      vatRegistration: {
        isRegistered: true,
        nextDueDate: new Date('2024-07-15')
      }
    };
    
    // Generate alerts using AlertService
    const alertSummary = AlertService.generateAlertSummary(companyId, mockFinancialData);
    
    // Convert to alert objects
    const generatedAlerts = alertSummary.alerts.map((alertData, index) => ({
      id: `generated_alert_${Date.now()}_${index}`,
      companyId,
      ...alertData,
      isRead: false,
      isResolved: false,
      createdAt: new Date().toISOString()
    }));
    
    res.json({
      success: true,
      data: {
        alerts: generatedAlerts,
        summary: {
          totalGenerated: generatedAlerts.length,
          bySeverity: alertSummary.alertsBySeverity,
          mostUrgent: alertSummary.summary.mostUrgentAlert?.type || null
        }
      },
      message: `Generated ${generatedAlerts.length} new alerts`
    });
    
  } catch (error) {
    console.error('Generate alerts error:', error);
    res.status(500).json({
      error: 'Failed to generate alerts',
      details: error.message
    });
  }
});

// Mark alert as read
alertRoutes.patch('/:companyId/:alertId/read', async (req, res) => {
  try {
    const { companyId, alertId } = req.params;
    
    // Mock update - in real implementation, update database
    const updatedAlert = {
      id: alertId,
      companyId,
      isRead: true,
      readAt: new Date().toISOString(),
      readBy: req.user?.id
    };
    
    res.json({
      success: true,
      data: updatedAlert,
      message: 'Alert marked as read'
    });
    
  } catch (error) {
    console.error('Mark alert read error:', error);
    res.status(500).json({
      error: 'Failed to mark alert as read',
      details: error.message
    });
  }
});

// Resolve alert
alertRoutes.patch('/:companyId/:alertId/resolve', async (req, res) => {
  try {
    const { companyId, alertId } = req.params;
    const { resolutionNote } = req.body;
    
    // Mock resolution - in real implementation, update database
    const resolvedAlert = {
      id: alertId,
      companyId,
      isResolved: true,
      resolvedAt: new Date().toISOString(),
      resolvedBy: req.user?.id,
      resolutionNote: resolutionNote || 'Alert resolved through system action'
    };
    
    res.json({
      success: true,
      data: resolvedAlert,
      message: 'Alert resolved successfully'
    });
    
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({
      error: 'Failed to resolve alert',
      details: error.message
    });
  }
});

// Mark all alerts as read
alertRoutes.patch('/:companyId/mark-all-read', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { type, severity } = req.body; // Optional filters
    
    // Mock bulk update
    const updateCount = Math.floor(Math.random() * 10) + 1; // Random count for demo
    
    res.json({
      success: true,
      data: {
        companyId,
        updatedCount: updateCount,
        filters: { type, severity },
        updatedAt: new Date().toISOString()
      },
      message: `Marked ${updateCount} alerts as read`
    });
    
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      error: 'Failed to mark alerts as read',
      details: error.message
    });
  }
});

// Get alert configuration
alertRoutes.get('/config/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const config = {
      companyId,
      alertThresholds: {
        budgetOverrun: {
          warning: 10, // percentage
          critical: 20
        },
        revenueDrop: {
          warning: -5, // percentage
          critical: -15
        },
        costIncrease: {
          warning: 15,
          critical: 30
        },
        cashFlow: {
          minimum: 100000 // AED
        },
        profitMargin: {
          minimum: 20 // percentage
        }
      },
      alertSettings: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        frequency: 'real-time'
      },
      escalationRules: [
        {
          condition: 'CRITICAL alert unresolved for 24 hours',
          action: 'Email to finance manager',
          recipients: ['finance.manager@company.com']
        },
        {
          condition: 'HIGH alert unresolved for 48 hours',
          action: 'SMS to CFO',
          recipients: ['+971501234567']
        }
      ],
      lastUpdated: new Date().toISOString(),
      updatedBy: req.user?.id
    };
    
    res.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    console.error('Get alert config error:', error);
    res.status(500).json({
      error: 'Failed to fetch alert configuration',
      details: error.message
    });
  }
});

// Update alert configuration
alertRoutes.put('/config/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { alertThresholds, alertSettings, escalationRules } = req.body;
    
    const updatedConfig = {
      companyId,
      alertThresholds: alertThresholds || {},
      alertSettings: alertSettings || {},
      escalationRules: escalationRules || [],
      lastUpdated: new Date().toISOString(),
      updatedBy: req.user?.id
    };
    
    res.json({
      success: true,
      data: updatedConfig,
      message: 'Alert configuration updated successfully'
    });
    
  } catch (error) {
    console.error('Update alert config error:', error);
    res.status(500).json({
      error: 'Failed to update alert configuration',
      details: error.message
    });
  }
});

// Get alert statistics
alertRoutes.get('/stats/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { period = '30d' } = req.query;
    
    // Mock statistics
    const stats = {
      period,
      totalAlerts: 23,
      alertsByDay: [
        { date: '2024-07-01', count: 2, critical: 0, high: 1, medium: 1, low: 0 },
        { date: '2024-07-02', count: 1, critical: 0, high: 0, medium: 1, low: 0 },
        { date: '2024-07-03', count: 3, critical: 1, high: 1, medium: 1, low: 0 },
        { date: '2024-07-04', count: 0, critical: 0, high: 0, medium: 0, low: 0 },
        { date: '2024-07-05', count: 1, critical: 0, high: 0, medium: 0, low: 1 }
      ],
      alertTypes: {
        BUDGET_OVERRUN: 8,
        REVENUE_DROP: 5,
        CASH_FLOW_ISSUE: 3,
        VAT_COMPLIANCE: 4,
        PROFIT_MARGIN_DETERIORATION: 3
      },
      resolutionMetrics: {
        averageResolutionTime: 4.2, // hours
        resolutionRate: 78.3, // percentage
        firstResponseTime: 0.5 // hours
      },
      trending: {
        increasing: ['BUDGET_OVERRUN', 'VAT_COMPLIANCE'],
        decreasing: ['CASH_FLOW_ISSUE'],
        stable: ['REVENUE_DROP', 'PROFIT_MARGIN_DETERIORATION']
      },
      forecast: {
        nextWeekExpected: 5,
        confidenceLevel: 85
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get alert stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch alert statistics',
      details: error.message
    });
  }
});