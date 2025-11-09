import React from 'react'
import { motion } from 'framer-motion'
import { WrenchScrewdriverIcon, CogIcon } from '@heroicons/react/24/outline'

const PredictiveMaintenance: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Predictive Maintenance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered equipment maintenance predictions and scheduling
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Maintenance Due</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">3</p>
              <p className="text-sm text-orange-600">This week</p>
            </div>
            <WrenchScrewdriverIcon className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Equipment Uptime</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">98.5%</p>
              <p className="text-sm text-green-600">Excellent</p>
            </div>
            <CogIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Maintenance Dashboard</h3>
        <p className="card-description">Coming soon - Predictive maintenance scheduling</p>
      </div>
    </motion.div>
  )
}

export default PredictiveMaintenance