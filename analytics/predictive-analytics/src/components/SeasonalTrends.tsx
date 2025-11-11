import React from 'react'
import { motion } from 'framer-motion'
import { CalendarIcon, ArrowTrendingUpIcon, SunIcon } from '@heroicons/react/24/outline'

const SeasonalTrends: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Seasonal Trend Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered seasonal pattern recognition and planning
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Seasonal Impact</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">+35%</p>
              <p className="text-sm text-green-600">Wedding season</p>
            </div>
            <SunIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Peak Period</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">Q3</p>
              <p className="text-sm text-blue-600">85% capacity</p>
            </div>
            <ArrowTrendingUpIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Planning Window</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">6-8wks</p>
              <p className="text-sm text-purple-600">Ahead needed</p>
            </div>
            <CalendarIcon className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Seasonal Analysis Dashboard</h3>
        <p className="card-description">Coming soon - Comprehensive seasonal trend analysis</p>
      </div>
    </motion.div>
  )
}

export default SeasonalTrends