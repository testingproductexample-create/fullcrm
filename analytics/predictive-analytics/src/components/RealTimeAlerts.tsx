import React from 'react'
import { motion } from 'framer-motion'
import { BellIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

const RealTimeAlerts: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Real-time Alerts & Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered predictive alerts and system notifications
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Alerts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">3</p>
              <p className="text-sm text-red-600">Immediate action</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Alerts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">15</p>
              <p className="text-sm text-blue-600">Today</p>
            </div>
            <BellIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Response Time</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">2.3m</p>
              <p className="text-sm text-green-600">Average</p>
            </div>
            <InformationCircleIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Real-time Alert Center</h3>
        <p className="card-description">Coming soon - Live alert monitoring and management</p>
      </div>
    </motion.div>
  )
}

export default RealTimeAlerts