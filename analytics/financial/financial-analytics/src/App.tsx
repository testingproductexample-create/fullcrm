import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Layout components
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import LoadingScreen from './components/ui/LoadingScreen'

// Page components
import Dashboard from './pages/Dashboard'
import Revenue from './pages/Revenue'
import ProfitLoss from './pages/ProfitLoss'
import Costs from './pages/Costs'
import CashFlow from './pages/CashFlow'
import ROI from './pages/ROI'
import BudgetAnalysis from './pages/BudgetAnalysis'
import VATCompliance from './pages/VATCompliance'
import Forecasting from './pages/Forecasting'
import Reports from './pages/Reports'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'

// Context providers
import { ThemeProvider } from './contexts/ThemeContext'
import { FinancialProvider } from './contexts/FinancialContext'

// Utils
import { cn } from './lib/utils'

const App: React.FC = () => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Initialize the application
    const initializeApp = async () => {
      try {
        // Simulate app initialization
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <ThemeProvider>
      <FinancialProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Header */}
              <Header onMenuClick={() => setSidebarOpen(true)} />
              
              {/* Page content */}
              <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                <div className="container-wide py-6 px-4 sm:px-6 lg:px-8">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/revenue" element={<Revenue />} />
                    <Route path="/profit-loss" element={<ProfitLoss />} />
                    <Route path="/costs" element={<Costs />} />
                    <Route path="/cash-flow" element={<CashFlow />} />
                    <Route path="/roi" element={<ROI />} />
                    <Route path="/budget-analysis" element={<BudgetAnalysis />} />
                    <Route path="/vat-compliance" element={<VATCompliance />} />
                    <Route path="/forecasting" element={<Forecasting />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/alerts" element={<Alerts />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </div>
              </main>
            </div>
          </div>
        </div>
      </FinancialProvider>
    </ThemeProvider>
  )
}

export default App