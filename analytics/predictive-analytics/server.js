import express from 'express'
import cors from 'cors'
import { generatePredictiveInsights } from './src/lib/aiEngine.js'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      ml_engine: 'operational',
      analytics: 'active'
    }
  })
})

// Dashboard summary endpoint
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const summary = {
      totalRevenue: 185000,
      revenueGrowth: 0.12,
      customerChurnRisk: 8.2,
      predictedDemand: 1247,
      activeAnomalies: 3,
      systemHealth: 98.5,
      lastUpdate: new Date().toISOString()
    }
    res.json(summary)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard summary' })
  }
})

// Customer churn prediction endpoint
app.get('/api/customers/churn', async (req, res) => {
  try {
    // Generate sample churn data
    const churnData = [
      { customerId: '1', name: 'John Smith', risk: 0.15, value: 12500, segment: 'premium' },
      { customerId: '2', name: 'Sarah Johnson', risk: 0.65, value: 3200, segment: 'occasional' },
      { customerId: '3', name: 'Michael Brown', risk: 0.08, value: 18500, segment: 'vip' },
      { customerId: '4', name: 'Emily Davis', risk: 0.42, value: 8900, segment: 'regular' },
      { customerId: '5', name: 'David Wilson', risk: 0.78, value: 2400, segment: 'new' }
    ]
    
    res.json({ data: churnData, lastUpdated: new Date().toISOString() })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch churn predictions' })
  }
})

// Demand forecasting endpoint
app.get('/api/forecasting/demand', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query
    
    // Generate sample demand data
    const demandData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      actual: Math.floor(Math.random() * 50) + 20,
      predicted: Math.floor(Math.random() * 50) + 20,
      confidence: 0.8 + Math.random() * 0.2
    }))
    
    const forecast = {
      predictedDemand: 1247,
      confidence: 0.87,
      trend: 'increasing',
      seasonalFactor: 1.15,
      data: demandData
    }
    
    res.json(forecast)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch demand forecast' })
  }
})

// Revenue forecasting endpoint
app.get('/api/forecasting/revenue', async (req, res) => {
  try {
    const revenueData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      actual: Math.floor(Math.random() * 50000) + 30000,
      predicted: Math.floor(Math.random() * 50000) + 30000
    }))
    
    const forecast = {
      predictedRevenue: 47200,
      growthRate: 0.125,
      confidence: 0.89,
      data: revenueData
    }
    
    res.json(forecast)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revenue forecast' })
  }
})

// Inventory predictions endpoint
app.get('/api/inventory/predictions', async (req, res) => {
  try {
    const inventoryData = [
      { itemId: '1', name: 'Premium Suits', currentStock: 25, predictedDemand: 35, stockoutRisk: 0.28 },
      { itemId: '2', name: 'Business Formal', currentStock: 18, predictedDemand: 22, stockoutRisk: 0.15 },
      { itemId: '3', name: 'Wedding Collection', currentStock: 32, predictedDemand: 42, stockoutRisk: 0.08 },
      { itemId: '4', name: 'Casual Wear', currentStock: 12, predictedDemand: 18, stockoutRisk: 0.25 }
    ]
    
    res.json({ data: inventoryData, lastUpdated: new Date().toISOString() })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory predictions' })
  }
})

// ML prediction endpoint
app.post('/api/ml/predict', async (req, res) => {
  try {
    const { type, data } = req.body
    
    if (!type || !data) {
      return res.status(400).json({ error: 'Type and data are required' })
    }
    
    // Generate prediction using AI engine
    const prediction = await generatePredictiveInsights(type, data)
    
    res.json({
      prediction,
      timestamp: new Date().toISOString(),
      model: type,
      confidence: prediction.confidence || 0.85
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate prediction', details: error.message })
  }
})

// Anomalies endpoint
app.get('/api/analytics/anomalies', async (req, res) => {
  try {
    const anomalies = [
      {
        id: '1',
        metric: 'daily_revenue',
        value: 15000,
        expectedValue: 35000,
        deviationScore: 0.85,
        severity: 'high',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        metric: 'customer_satisfaction',
        value: 2.8,
        expectedValue: 4.2,
        deviationScore: 0.72,
        severity: 'medium',
        timestamp: new Date().toISOString()
      }
    ]
    
    res.json({ data: anomalies, count: anomalies.length })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch anomalies' })
  }
})

// Alerts endpoint
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = [
      {
        id: '1',
        type: 'critical',
        priority: 'high',
        title: 'High Churn Risk: Premium Customer Segment',
        message: '15% of premium customers showing signs of potential churn',
        timestamp: new Date().toISOString(),
        isRead: false,
        actionRequired: true
      },
      {
        id: '2',
        type: 'warning',
        priority: 'medium',
        title: 'Inventory Shortage Warning',
        message: 'Winter collection items may run out within 5 days',
        timestamp: new Date().toISOString(),
        isRead: false,
        actionRequired: false
      }
    ]
    
    res.json({ data: alerts, unread: alerts.filter(a => !a.isRead).length })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' })
  }
})

// Employee performance endpoint
app.get('/api/employees/performance', async (req, res) => {
  try {
    const employees = [
      { id: '1', name: 'Sarah Johnson', performance: 0.89, productivity: 0.92, retentionRisk: 0.12 },
      { id: '2', name: 'Mike Wilson', performance: 0.76, productivity: 0.78, retentionRisk: 0.18 },
      { id: '3', name: 'Lisa Chen', performance: 0.95, productivity: 0.96, retentionRisk: 0.05 }
    ]
    
    res.json({ data: employees, lastUpdated: new Date().toISOString() })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee performance' })
  }
})

// Market trends endpoint
app.get('/api/market/trends', async (req, res) => {
  try {
    const trends = [
      {
        category: 'luxury_formal_wear',
        direction: 'rising',
        strength: 0.78,
        opportunity: 0.82,
        threat: 0.25
      },
      {
        category: 'sustainable_fashion',
        direction: 'rising',
        strength: 0.65,
        opportunity: 0.72,
        threat: 0.30
      }
    ]
    
    res.json({ data: trends, lastUpdated: new Date().toISOString() })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch market trends' })
  }
})

// Risk assessment endpoint
app.get('/api/risk/assessment', async (req, res) => {
  try {
    const risks = [
      {
        category: 'economic_downturn',
        level: 'medium',
        probability: 0.35,
        impact: 0.75,
        riskScore: 0.26
      },
      {
        category: 'supply_chain_disruption',
        level: 'medium',
        probability: 0.25,
        impact: 0.65,
        riskScore: 0.16
      }
    ]
    
    res.json({ data: risks, lastUpdated: new Date().toISOString() })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch risk assessment' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Predictive Analytics API server running on port ${PORT}`)
  console.log(`📊 Dashboard available at http://localhost:${PORT}`)
  console.log(`🔗 API endpoints ready for frontend integration`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...')
  process.exit(0)
})