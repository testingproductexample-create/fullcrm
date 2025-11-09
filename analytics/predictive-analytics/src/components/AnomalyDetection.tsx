import React from 'react'
import { motion } from 'framer-motion'
import { ExclamationTriangleIcon, ChartBarIcon } from '@heroicons/react/24/outline'

const AnomalyDetection: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Anomaly Detection
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automated anomaly detection across all business metrics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Anomalies</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">7</p>
              <p className="text-sm text-red-600">3 critical</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Detection Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">96%</p>
              <p className="text-sm text-green-600">High accuracy</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Anomaly Detection Dashboard</h3>
        <p className="card-description">Coming soon - Real-time anomaly monitoring</p>
      </div>
    </motion.div>
  )
}

export default AnomalyDetection