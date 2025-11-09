import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { generatePredictiveInsights } from '../lib/aiEngine'

// Types
export interface PredictionData {
  id: string
  type: string
  value: number
  confidence: number
  timestamp: string
  metadata?: any
}

export interface AnomalyData {
  id: string
  metric: string
  value: number
  expectedValue: number
  deviationScore: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  status: 'active' | 'investigating' | 'resolved'
}

export interface AlertData {
  id: string
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  actionRequired: boolean
}

export interface CustomerData {
  id: string
  name: string
  email: string
  churnRisk: number
  lifetimeValue: number
  lastPurchase: string
  segments: string[]
}

export interface InventoryData {
  id: string
  name: string
  currentStock: number
  predictedDemand: number
  stockoutRisk: number
  reorderPoint: number
}

export interface RevenueData {
  date: string
  actual: number
  predicted: number
  growth: number
  confidence: number
}

export interface EmployeeData {
  id: string
  name: string
  performance: number
  productivity: number
  retentionRisk: number
  trainingNeeds: string[]
}

export interface RiskData {
  category: string
  level: 'low' | 'medium' | 'high' | 'critical'
  probability: number
  impact: number
  mitigation: string[]
  indicators: string[]
}

export interface MarketData {
  trend: string
  direction: 'rising' | 'declining' | 'stable'
  strength: number
  opportunity: number
  threat: number
}

export interface AnalyticsState {
  // Data
  predictions: PredictionData[]
  anomalies: AnomalyData[]
  alerts: AlertData[]
  customers: CustomerData[]
  inventory: InventoryData[]
  revenue: RevenueData[]
  employees: EmployeeData[]
  risks: RiskData[]
  marketTrends: MarketData[]
  
  // UI State
  loading: boolean
  error: string | null
  theme: 'light' | 'dark'
  selectedTimeRange: string
  
  // Real-time
  isRealTimeEnabled: boolean
  lastUpdate: string
}

type AnalyticsAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_TIME_RANGE'; payload: string }
  | { type: 'SET_PREDICTIONS'; payload: PredictionData[] }
  | { type: 'SET_ANOMALIES'; payload: AnomalyData[] }
  | { type: 'SET_ALERTS'; payload: AlertData[] }
  | { type: 'SET_CUSTOMERS'; payload: CustomerData[] }
  | { type: 'SET_INVENTORY'; payload: InventoryData[] }
  | { type: 'SET_REVENUE'; payload: RevenueData[] }
  | { type: 'SET_EMPLOYEES'; payload: EmployeeData[] }
  | { type: 'SET_RISKS'; payload: RiskData[] }
  | { type: 'SET_MARKET_TRENDS'; payload: MarketData[] }
  | { type: 'TOGGLE_REAL_TIME' }
  | { type: 'UPDATE_TIMESTAMP' }
  | { type: 'ADD_ALERT'; payload: AlertData }
  | { type: 'UPDATE_PREDICTION'; payload: { id: string; data: Partial<PredictionData> } }
  | { type: 'MARK_ALERT_READ'; payload: string }
  | { type: 'RESOLVE_ANOMALY'; payload: string }

const initialState: AnalyticsState = {
  // Data
  predictions: [],
  anomalies: [],
  alerts: [],
  customers: [],
  inventory: [],
  revenue: [],
  employees: [],
  risks: [],
  marketTrends: [],
  
  // UI State
  loading: false,
  error: null,
  theme: 'light',
  selectedTimeRange: '30d',
  
  // Real-time
  isRealTimeEnabled: true,
  lastUpdate: new Date().toISOString(),
}

function analyticsReducer(state: AnalyticsState, action: AnalyticsAction): AnalyticsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    
    case 'SET_TIME_RANGE':
      return { ...state, selectedTimeRange: action.payload }
    
    case 'SET_PREDICTIONS':
      return { ...state, predictions: action.payload }
    
    case 'SET_ANOMALIES':
      return { ...state, anomalies: action.payload }
    
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload }
    
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload }
    
    case 'SET_INVENTORY':
      return { ...state, inventory: action.payload }
    
    case 'SET_REVENUE':
      return { ...state, revenue: action.payload }
    
    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload }
    
    case 'SET_RISKS':
      return { ...state, risks: action.payload }
    
    case 'SET_MARKET_TRENDS':
      return { ...state, marketTrends: action.payload }
    
    case 'TOGGLE_REAL_TIME':
      return { ...state, isRealTimeEnabled: !state.isRealTimeEnabled }
    
    case 'UPDATE_TIMESTAMP':
      return { ...state, lastUpdate: new Date().toISOString() }
    
    case 'ADD_ALERT':
      return { ...state, alerts: [action.payload, ...state.alerts] }
    
    case 'UPDATE_PREDICTION':
      return {
        ...state,
        predictions: state.predictions.map(p => 
          p.id === action.payload.id ? { ...p, ...action.payload.data } : p
        )
      }
    
    case 'MARK_ALERT_READ':
      return {
        ...state,
        alerts: state.alerts.map(a => 
          a.id === action.payload ? { ...a, isRead: true } : a
        )
      }
    
    case 'RESOLVE_ANOMALY':
      return {
        ...state,
        anomalies: state.anomalies.map(a => 
          a.id === action.payload ? { ...a, status: 'resolved' as const } : a
        )
      }
    
    default:
      return state
  }
}

interface AnalyticsContextType extends AnalyticsState {
  dispatch: React.Dispatch<AnalyticsAction>
  
  // Helper functions
  refreshData: () => Promise<void>
  generatePrediction: (type: string, data: any) => Promise<any>
  exportData: (format: 'csv' | 'json' | 'pdf') => Promise<Blob>
  getInsights: (query: string) => Promise<string>
  toggleTheme: () => void
  setTimeRange: (range: string) => void
  
  // Real-time subscription
  subscribeToUpdates: () => void
  unsubscribeFromUpdates: () => void
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

interface AnalyticsProviderProps {
  children: ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [state, dispatch] = useReducer(analyticsReducer, initialState)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Real-time updates
  useEffect(() => {
    if (state.isRealTimeEnabled) {
      subscribeToUpdates()
      return () => unsubscribeFromUpdates()
    }
  }, [state.isRealTimeEnabled])

  const loadInitialData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // Load data from Supabase
      const [predictions, anomalies, alerts] = await Promise.all([
        loadPredictions(),
        loadAnomalies(),
        loadAlerts()
      ])

      // Generate sample data if no real data available
      if (predictions.length === 0) {
        const sampleData = generateSampleData()
        dispatch({ type: 'SET_PREDICTIONS', payload: sampleData.predictions })
        dispatch({ type: 'SET_ANOMALIES', payload: sampleData.anomalies })
        dispatch({ type: 'SET_ALERTS', payload: sampleData.alerts })
      } else {
        dispatch({ type: 'SET_PREDICTIONS', payload: predictions })
        dispatch({ type: 'SET_ANOMALIES', payload: anomalies })
        dispatch({ type: 'SET_ALERTS', payload: alerts })
      }

      // Load other data
      await loadAllData()
      
    } catch (error) {
      console.error('Failed to load analytics data:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load analytics data' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const loadAllData = async () => {
    try {
      // Generate comprehensive sample data
      const sampleData = generateSampleData()
      
      dispatch({ type: 'SET_CUSTOMERS', payload: sampleData.customers })
      dispatch({ type: 'SET_INVENTORY', payload: sampleData.inventory })
      dispatch({ type: 'SET_REVENUE', payload: sampleData.revenue })
      dispatch({ type: 'SET_EMPLOYEES', payload: sampleData.employees })
      dispatch({ type: 'SET_RISKS', payload: sampleData.risks })
      dispatch({ type: 'SET_MARKET_TRENDS', payload: sampleData.marketTrends })
      
    } catch (error) {
      console.error('Failed to load additional data:', error)
    }
  }

  const loadPredictions = async (): Promise<PredictionData[]> => {
    // In a real implementation, this would query Supabase
    // For now, we'll return sample data
    return []
  }

  const loadAnomalies = async (): Promise<AnomalyData[]> => {
    // In a real implementation, this would query Supabase
    return []
  }

  const loadAlerts = async (): Promise<AlertData[]> => {
    // In a real implementation, this would query Supabase
    return []
  }

  const refreshData = async () => {
    await loadInitialData()
    dispatch({ type: 'UPDATE_TIMESTAMP' })
  }

  const generatePrediction = async (type: string, data: any) => {
    try {
      const prediction = await generatePredictiveInsights(type, data)
      return prediction
    } catch (error) {
      console.error('Failed to generate prediction:', error)
      throw error
    }
  }

  const exportData = async (format: 'csv' | 'json' | 'pdf'): Promise<Blob> => {
    // Implementation for data export
    const data = {
      predictions: state.predictions,
      anomalies: state.anomalies,
      alerts: state.alerts,
      customers: state.customers,
      inventory: state.inventory,
      revenue: state.revenue,
      employees: state.employees,
      risks: state.risks,
      marketTrends: state.marketTrends
    }

    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      case 'csv':
        // Convert to CSV format
        const csvData = convertToCSV(data)
        return new Blob([csvData], { type: 'text/csv' })
      case 'pdf':
        // PDF generation would be handled by a library like jsPDF
        return new Blob(['PDF content'], { type: 'application/pdf' })
      default:
        throw new Error('Unsupported format')
    }
  }

  const getInsights = async (query: string): Promise<string> => {
    // AI-powered insight generation
    const context = {
      predictions: state.predictions,
      anomalies: state.anomalies,
      alerts: state.alerts,
      revenue: state.revenue
    }
    
    return await generatePredictiveInsights('insights', { query, context })
  }

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' })
  }

  const setTimeRange = (range: string) => {
    dispatch({ type: 'SET_TIME_RANGE', payload: range })
  }

  const subscribeToUpdates = () => {
    // Real-time subscription setup
    // This would typically use Supabase real-time subscriptions
    console.log('Subscribed to real-time updates')
  }

  const unsubscribeFromUpdates = () => {
    console.log('Unsubscribed from real-time updates')
  }

  const contextValue: AnalyticsContextType = {
    ...state,
    dispatch,
    refreshData,
    generatePrediction,
    exportData,
    getInsights,
    toggleTheme,
    setTimeRange,
    subscribeToUpdates,
    unsubscribeFromUpdates
  }

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}

// Helper function to generate sample data
function generateSampleData() {
  const now = new Date()
  
  return {
    predictions: [
      {
        id: '1',
        type: 'demand_forecast',
        value: 45,
        confidence: 0.87,
        timestamp: now.toISOString(),
        metadata: { category: 'orders', timeframe: '24h' }
      },
      {
        id: '2',
        type: 'churn_prediction',
        value: 0.15,
        confidence: 0.92,
        timestamp: now.toISOString(),
        metadata: { segment: 'premium', risk_level: 'low' }
      }
    ],
    anomalies: [
      {
        id: '1',
        metric: 'daily_revenue',
        value: 15000,
        expectedValue: 35000,
        deviationScore: 0.85,
        severity: 'high' as const,
        timestamp: now.toISOString(),
        status: 'active' as const
      }
    ],
    alerts: [
      {
        id: '1',
        type: 'critical',
        priority: 'high' as const,
        title: 'Revenue Drop Detected',
        message: 'Daily revenue is 25% below expected levels',
        timestamp: now.toISOString(),
        isRead: false,
        actionRequired: true
      }
    ],
    customers: [
      {
        id: '1',
        name: 'John Smith',
        email: 'john@example.com',
        churnRisk: 0.15,
        lifetimeValue: 12500,
        lastPurchase: '2024-11-01',
        segments: ['premium', 'loyal']
      }
    ],
    inventory: [
      {
        id: '1',
        name: 'Premium Suits',
        currentStock: 25,
        predictedDemand: 35,
        stockoutRisk: 0.28,
        reorderPoint: 15
      }
    ],
    revenue: [
      {
        date: '2024-11-15',
        actual: 45000,
        predicted: 47000,
        growth: 0.12,
        confidence: 0.87
      }
    ],
    employees: [
      {
        id: '1',
        name: 'Sarah Johnson',
        performance: 0.89,
        productivity: 0.92,
        retentionRisk: 0.12,
        trainingNeeds: ['leadership', 'advanced_techniques']
      }
    ],
    risks: [
      {
        category: 'economic_downturn',
        level: 'medium' as const,
        probability: 0.35,
        impact: 0.75,
        mitigation: ['diversify_markets', 'cost_optimization'],
        indicators: ['market_indicators', 'client_behavior']
      }
    ],
    marketTrends: [
      {
        trend: 'luxury_formal_wear',
        direction: 'rising' as const,
        strength: 0.78,
        opportunity: 0.82,
        threat: 0.25
      }
    ]
  }
}

// Helper function to convert data to CSV
function convertToCSV(data: any): string {
  // Simple CSV conversion - in practice, you'd use a more robust library
  const json2csv = require('json2csv')
  return json2csv.parse(data)
}