import React from 'react'
import { motion } from 'framer-motion'
import { CurrencyDollarIcon, TrendingUpIcon, ChartBarIcon } from '@heroicons/react/24/outline'

const RevenueForecasting: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Revenue Forecasting
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered revenue predictions with seasonal adjustments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Predicted Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">$47,200</p>
              <p className="text-sm text-green-600">+15% vs last month</p>
            </div>
            <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Growth Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">12.5%</p>
              <p className="text-sm text-blue-600">Strong growth</p>
            </div>
            <TrendingUpIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Confidence</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">89%</p>
              <p className="text-sm text-purple-600">High accuracy</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Revenue Forecast Chart</h3>
        <p className="card-description">Coming soon - Advanced revenue forecasting with ML models</p>
      </div>
    </motion.div>
  )
}

export default RevenueForecasting