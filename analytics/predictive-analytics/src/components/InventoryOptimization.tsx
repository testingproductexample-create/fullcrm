import React from 'react'
import { motion } from 'framer-motion'
import { CubeIcon, ExclamationTriangleIcon, TrendingDownIcon } from '@heroicons/react/24/outline'

const InventoryOptimization: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Inventory Optimization
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered inventory demand prediction and optimization
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stockout Risk</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">2.8%</p>
              <p className="text-sm text-red-600">3 items at risk</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Optimal Stock Level</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">$124K</p>
              <p className="text-sm text-green-600">18% reduction</p>
            </div>
            <CubeIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Waste Reduction</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">22%</p>
              <p className="text-sm text-blue-600">This quarter</p>
            </div>
            <TrendingDownIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Inventory Optimization Dashboard</h3>
        <p className="card-description">Coming soon - Advanced inventory management with AI predictions</p>
      </div>
    </motion.div>
  )
}

export default InventoryOptimization