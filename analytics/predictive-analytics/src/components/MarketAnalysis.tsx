import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUpIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

const MarketAnalysis: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Market Trend Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-driven market insights and competitor benchmarking
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Market Opportunity</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">High</p>
              <p className="text-sm text-green-600">Growing demand</p>
            </div>
            <TrendingUpIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Competitive Position</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">#2</p>
              <p className="text-sm text-blue-600">In local market</p>
            </div>
            <GlobeAltIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Market Analysis Dashboard</h3>
        <p className="card-description">Coming soon - Comprehensive market intelligence</p>
      </div>
    </motion.div>
  )
}

export default MarketAnalysis