import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

// Types
export interface FinancialData {
  id: string
  companyId: string
  type: 'revenue' | 'cost' | 'profit' | 'cashflow'
  amount: number
  currency: string
  date: string
  category?: string
  description?: string
}

export interface Alert {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  message: string
  isRead: boolean
  isResolved: boolean
  createdAt: string
  resolvedAt?: string
}

export interface FinancialState {
  data: FinancialData[]
  alerts: Alert[]
  loading: boolean
  error: string | null
  selectedPeriod: string
  selectedCurrency: string
  filters: {
    dateRange: { start: string; end: string }
    categories: string[]
    minAmount?: number
    maxAmount?: number
  }
}

type FinancialAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DATA'; payload: FinancialData[] }
  | { type: 'SET_ALERTS'; payload: Alert[] }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'MARK_ALERT_READ'; payload: string }
  | { type: 'RESOLVE_ALERT'; payload: string }
  | { type: 'SET_PERIOD'; payload: string }
  | { type: 'SET_CURRENCY'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<FinancialState['filters']> }

const initialState: FinancialState = {
  data: [],
  alerts: [],
  loading: false,
  error: null,
  selectedPeriod: 'current',
  selectedCurrency: 'AED',
  filters: {
    dateRange: {
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    categories: []
  }
}

const financialReducer = (state: FinancialState, action: FinancialAction): FinancialState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'SET_DATA':
      return { ...state, data: action.payload, loading: false, error: null }
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload }
    case 'ADD_ALERT':
      return { ...state, alerts: [action.payload, ...state.alerts] }
    case 'MARK_ALERT_READ':
      return {
        ...state,
        alerts: state.alerts.map(alert =>
          alert.id === action.payload ? { ...alert, isRead: true } : alert
        )
      }
    case 'RESOLVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(alert =>
          alert.id === action.payload 
            ? { ...alert, isResolved: true, resolvedAt: new Date().toISOString() }
            : alert
        )
      }
    case 'SET_PERIOD':
      return { ...state, selectedPeriod: action.payload }
    case 'SET_CURRENCY':
      return { ...state, selectedCurrency: action.payload }
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      }
    default:
      return state
  }
}

interface FinancialContextType {
  state: FinancialState
  dispatch: React.Dispatch<FinancialAction>
  // Helper functions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setData: (data: FinancialData[]) => void
  setAlerts: (alerts: Alert[]) => void
  addAlert: (alert: Alert) => void
  markAlertRead: (alertId: string) => void
  resolveAlert: (alertId: string) => void
  setPeriod: (period: string) => void
  setCurrency: (currency: string) => void
  setFilters: (filters: Partial<FinancialState['filters']>) => void
  // Data fetching functions
  fetchDashboardData: () => Promise<void>
  fetchAlerts: () => Promise<void>
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined)

export const useFinancial = () => {
  const context = useContext(FinancialContext)
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider')
  }
  return context
}

interface FinancialProviderProps {
  children: React.ReactNode
  companyId?: string
}

export const FinancialProvider: React.FC<FinancialProviderProps> = ({ 
  children, 
  companyId = 'demo-company' 
}) => {
  const [state, dispatch] = useReducer(financialReducer, initialState)

  // API base URL
  const API_BASE = '/api'

  // Helper functions
  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }

  const setData = (data: FinancialData[]) => {
    dispatch({ type: 'SET_DATA', payload: data })
  }

  const setAlerts = (alerts: Alert[]) => {
    dispatch({ type: 'SET_ALERTS', payload: alerts })
  }

  const addAlert = (alert: Alert) => {
    dispatch({ type: 'ADD_ALERT', payload: alert })
  }

  const markAlertRead = (alertId: string) => {
    dispatch({ type: 'MARK_ALERT_READ', payload: alertId })
  }

  const resolveAlert = (alertId: string) => {
    dispatch({ type: 'RESOLVE_ALERT', payload: alertId })
  }

  const setPeriod = (period: string) => {
    dispatch({ type: 'SET_PERIOD', payload: period })
  }

  const setCurrency = (currency: string) => {
    dispatch({ type: 'SET_CURRENCY', payload: currency })
  }

  const setFilters = (filters: Partial<FinancialState['filters']>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }

  // Data fetching functions
  const fetchDashboardData = async () => {
    if (!companyId) return

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/financial/dashboard/${companyId}`)
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      
      const result = await response.json()
      if (result.success) {
        // Transform the data to our FinancialData format
        const financialData: FinancialData[] = [
          {
            id: 'rev-1',
            companyId,
            type: 'revenue',
            amount: result.data.revenue.current,
            currency: 'AED',
            date: new Date().toISOString(),
            category: 'Total Revenue'
          },
          {
            id: 'cost-1',
            companyId,
            type: 'cost',
            amount: result.data.costs.current,
            currency: 'AED',
            date: new Date().toISOString(),
            category: 'Total Costs'
          },
          {
            id: 'profit-1',
            companyId,
            type: 'profit',
            amount: result.data.profit.current,
            currency: 'AED',
            date: new Date().toISOString(),
            category: 'Net Profit'
          }
        ]
        setData(financialData)
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const fetchAlerts = async () => {
    if (!companyId) return

    try {
      const response = await fetch(`${API_BASE}/alerts/${companyId}?limit=20`)
      if (!response.ok) throw new Error('Failed to fetch alerts')
      
      const result = await response.json()
      if (result.success) {
        setAlerts(result.data.alerts)
      }
    } catch (error) {
      console.error('Alerts fetch error:', error)
    }
  }

  // Initial data load
  useEffect(() => {
    if (companyId) {
      fetchDashboardData()
      fetchAlerts()
    }
  }, [companyId])

  const value: FinancialContextType = {
    state,
    dispatch,
    setLoading,
    setError,
    setData,
    setAlerts,
    addAlert,
    markAlertRead,
    resolveAlert,
    setPeriod,
    setCurrency,
    setFilters,
    fetchDashboardData,
    fetchAlerts
  }

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  )
}