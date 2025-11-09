import React from 'react'
import { motion } from 'framer-motion'
import { BanknotesIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

const FinancialRisk: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Financial Risk & Fraud Detection
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered financial risk assessment and fraud prevention
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fraud Detection</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">98.7%</p>
              <p className="text-sm text-green-600">Accuracy rate</p>
            </div>
            <ShieldCheckIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Exposure</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">$12K</p>
              <p className="text-sm text-blue-600">Total flagged</p>
            </div>
            <BanknotesIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Financial Risk Dashboard</h3>
        <p className="card-description">Coming soon - Financial risk and fraud detection</p>
      </div>
    </motion.div>
  )
}

export default FinancialRisk