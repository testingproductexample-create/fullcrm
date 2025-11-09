import React from 'react'
import { motion } from 'framer-motion'
import { UserIcon, TrendingUpIcon, BookOpenIcon } from '@heroicons/react/24/outline'

const EmployeePerformance: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Employee Performance Prediction
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-driven employee performance analytics and development insights
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Performance</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">87%</p>
              <p className="text-sm text-green-600">+3% this month</p>
            </div>
            <UserIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Productivity Index</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">92%</p>
              <p className="text-sm text-blue-600">Top quartile</p>
            </div>
            <TrendingUpIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Training Needs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">12</p>
              <p className="text-sm text-orange-600">Employees identified</p>
            </div>
            <BookOpenIcon className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Employee Performance Analytics</h3>
        <p className="card-description">Coming soon - Comprehensive performance tracking and prediction</p>
      </div>
    </motion.div>
  )
}

export default EmployeePerformance