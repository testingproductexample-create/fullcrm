import React from 'react'
import { motion } from 'framer-motion'
import { ShieldExclamationIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const RiskAssessment: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Risk Assessment
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered business risk analysis and mitigation planning
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Risk Items</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">5</p>
              <p className="text-sm text-red-600">Require attention</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Risk Score</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">6.2/10</p>
              <p className="text-sm text-orange-600">Moderate level</p>
            </div>
            <ShieldExclamationIcon className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Risk Assessment Dashboard</h3>
        <p className="card-description">Coming soon - Comprehensive risk management system</p>
      </div>
    </motion.div>
  )
}

export default RiskAssessment