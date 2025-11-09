import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  UserGroupIcon,
  ExclamationTriangleIcon,
  TrendingDownIcon,
  HeartIcon,
  ShieldCheckIcon,
  BellIcon,
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import { useAnalytics } from '../contexts/AnalyticsContext'
import { formatPercentage, formatCurrency, formatRelativeTime } from '../lib/utils'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

const CustomerChurn: React.FC = () => {
  const { customers, alerts, loading } = useAnalytics()
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [sortBy, setSortBy] = useState('churnRisk')

  // Sample churn data
  const churnRiskData = [
    { risk: 'Low', count: 45, percentage: 65, color: '#10b981' },
    { risk: 'Medium', count: 18, percentage: 25, color: '#f59e0b' },
    { risk: 'High', count: 7, percentage: 10, color: '#f97316' }
  ]

  const churnTrend = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
    churnRate: Math.random() * 0.15 + 0.05,
    retentionRate: Math.random() * 0.1 + 0.85
  }))

  // High-risk customers
  const highRiskCustomers = customers.filter(c => c.churnRisk > 0.6)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Customer Churn Prediction
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered early warning system for customer retention
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Segments</option>
            <option value="premium">Premium</option>
            <option value="regular">Regular</option>
            <option value="occasional">Occasional</option>
          </select>
          <button className="btn btn-primary">
            <BellIcon className="w-4 h-4 mr-2" />
            Setup Alerts
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Churn Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">8.2%</p>
              <p className="text-sm text-red-600 dark:text-red-400">↑ 0.5% vs last month</p>
            </div>
            <TrendingDownIcon className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Risk Customers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{highRiskCustomers.length}</p>
              <p className="text-sm text-orange-600 dark:text-orange-400">Require attention</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-orange-500" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Retention Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">91.8%</p>
              <p className="text-sm text-green-600 dark:text-green-400">Above industry average</p>
            </div>
            <ShieldCheckIcon className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue at Risk</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">$28.5K</p>
              <p className="text-sm text-red-600 dark:text-red-400">If patterns continue</p>
            </div>
            <HeartIcon className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Churn Risk Distribution */}
        <motion.div variants={itemVariants} className="card">
          <div className="card-header">
            <h3 className="card-title">Customer Risk Distribution</h3>
            <p className="card-description">Churn risk levels across customer base</p>
          </div>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={churnRiskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {churnRiskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} customers`, name]}
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#f9fafb' 
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Churn Trend */}
        <motion.div variants={itemVariants} className="card">
          <div className="card-header">
            <h3 className="card-title">Churn Rate Trend</h3>
            <p className="card-description">Monthly churn and retention rates</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={churnTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatPercentage(value, 0)} />
                <Tooltip 
                  formatter={(value, name) => [formatPercentage(Number(value), 1), name]}
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#f9fafb' 
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="churnRate" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  name="Churn Rate"
                />
                <Line 
                  type="monotone" 
                  dataKey="retentionRate" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Retention Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* High-Risk Customers Table */}
      <motion.div variants={itemVariants} className="card">
        <div className="card-header">
          <h3 className="card-title">High-Risk Customers Requiring Attention</h3>
          <p className="card-description">Customers with >60% churn probability</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Churn Risk</th>
                <th>Lifetime Value</th>
                <th>Last Purchase</th>
                <th>Segments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {highRiskCustomers.length > 0 ? highRiskCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="flex items-center space-x-3">
                      <UserCircleIcon className="w-8 h-8 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {customer.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-600 dark:text-gray-400">{customer.email}</td>
                  <td>
                    <span className={`badge ${customer.churnRisk > 0.8 ? 'badge-danger' : 'badge-warning'}`}>
                      {formatPercentage(customer.churnRisk)}
                    </span>
                  </td>
                  <td className="font-medium">{formatCurrency(customer.lifetimeValue)}</td>
                  <td className="text-gray-600 dark:text-gray-400">
                    {formatRelativeTime(customer.lastPurchase)}
                  </td>
                  <td>
                    <div className="flex space-x-1">
                      {customer.segments.map((segment, i) => (
                        <span key={i} className="badge badge-secondary text-xs">
                          {segment}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button className="p-1 text-blue-600 hover:text-blue-800">
                        <PhoneIcon className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-green-600 hover:text-green-800">
                        <EnvelopeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No high-risk customers identified
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Retention Strategies */}
      <motion.div variants={itemVariants} className="card">
        <div className="card-header">
          <h3 className="card-title">AI-Recommended Retention Strategies</h3>
          <p className="card-description">Personalized action plans for each risk level</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">High Risk (>80%)</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Immediate personal outreach by account manager
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Offer 20% loyalty discount for next 3 months
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Schedule satisfaction survey and consultation
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Medium Risk (60-80%)</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Send personalized email with relevant offers
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add to VIP communication list
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor engagement over 30 days
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Low Risk (<60%)</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Continue current engagement strategy
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Identify upselling opportunities
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Request referral program participation
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default CustomerChurn