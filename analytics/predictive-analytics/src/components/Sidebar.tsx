import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CubeIcon,
  UserIcon,
  CalendarIcon,
  ShieldExclamationIcon,
  ArrowTrendingUpIcon,
  WrenchScrewdriverIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  BellIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: false },
  { name: 'Demand Forecasting', href: '/demand-forecasting', icon: ChartBarIcon, current: false },
  { name: 'Customer Churn', href: '/customer-churn', icon: UserGroupIcon, current: false },
  { name: 'Revenue Forecasting', href: '/revenue-forecasting', icon: CurrencyDollarIcon, current: false },
  { name: 'Inventory Optimization', href: '/inventory', icon: CubeIcon, current: false },
  { name: 'Employee Performance', href: '/employee-performance', icon: UserIcon, current: false },
  { name: 'Seasonal Trends', href: '/seasonal-trends', icon: CalendarIcon, current: false },
  { name: 'Risk Assessment', href: '/risk-assessment', icon: ShieldExclamationIcon, current: false },
  { name: 'Market Analysis', href: '/market-analysis', icon: ArrowTrendingUpIcon, current: false },
  { name: 'Predictive Maintenance', href: '/maintenance', icon: WrenchScrewdriverIcon, current: false },
  { name: 'Financial Risk', href: '/financial-risk', icon: BanknotesIcon, current: false },
  { name: 'Anomaly Detection', href: '/anomaly-detection', icon: ExclamationTriangleIcon, current: false },
  { name: 'Machine Learning', href: '/machine-learning', icon: CpuChipIcon, current: false },
  { name: 'Real-time Alerts', href: '/real-time-alerts', icon: BellIcon, current: false },
]

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          x: open ? 0 : -300,
          opacity: open ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 flex-shrink-0 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
            {!collapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <CpuChipIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    Analytics
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    AI-Powered Insights
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hidden lg:block"
              >
                {collapsed ? (
                  <ChevronRightIcon className="w-5 h-5" />
                ) : (
                  <ChevronLeftIcon className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                      isActive
                        ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    )
                  }
                >
                  <item.icon
                    className={cn(
                      'flex-shrink-0 w-5 h-5',
                      collapsed ? 'mx-auto' : 'mr-3'
                    )}
                    aria-hidden="true"
                  />
                  {!collapsed && item.name}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <CpuChipIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    AI Engine
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Real-time predictions and insights powered by advanced machine learning
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    System Online
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default Sidebar