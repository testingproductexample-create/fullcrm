import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  CalendarIcon,
  TrendingUpIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { useAnalytics } from '../contexts/AnalyticsContext'
import { formatNumber, formatPercentage } from '../lib/utils'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

const DemandForecasting: React.FC = () => {
  const { predictions, loading } = useAnalytics()
  const [timeRange, setTimeRange] = useState('30d')
  const [forecastType, setForecastType] = useState('orders')

  // Sample demand data
  const demandData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    actual: Math.floor(Math.random() * 50) + 20,
    predicted: Math.floor(Math.random() * 50) + 20,
    confidence: 0.8 + Math.random() * 0.2,
    seasonal: 0.9 + Math.random() * 0.2
  }))

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
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
          <div className="h-96 bg-gray-200 rounded"></div>
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
            Demand Forecasting
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered predictions for orders, services, and resource planning
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
          <select
            value={forecastType}
            onChange={(e) => setForecastType(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="orders">Orders</option>
            <option value="services">Services</option>
            <option value="appointments">Appointments</option>
          </select>
          <button className="btn btn-primary">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Predicted Demand</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">1,247</p>
              <p className="text-sm text-green-600 dark:text-green-400">+18% vs last period</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Confidence Level</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">87%</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">High accuracy</p>
            </div>
            <TrendingUpIcon className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Seasonal Factor</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">1.15</p>
              <p className="text-sm text-orange-600 dark:text-orange-400">Wedding season</p>
            </div>
            <CalendarIcon className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>
      </div>

      {/* Main Forecast Chart */}
      <motion.div variants={itemVariants} className="card">
        <div className="card-header">
          <h3 className="card-title">Demand Forecast Trend</h3>
          <p className="card-description">
            Historical vs predicted demand with confidence intervals
          </p>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={demandData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
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
                dataKey="actual" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Actual Demand"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#0ea5e9" 
                strokeWidth={3}
                strokeDasharray="5 5"
                name="Predicted Demand"
                dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Categories */}
        <motion.div variants={itemVariants} className="card">
          <div className="card-header">
            <h3 className="card-title">Demand by Service Category</h3>
            <p className="card-description">Predicted demand distribution</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={[
                  { category: 'Wedding Suits', demand: 18, growth: 0.25 },
                  { category: 'Business Formal', demand: 15, growth: 0.12 },
                  { category: 'Casual Wear', demand: 12, growth: 0.08 },
                  { category: 'Alterations', demand: 10, growth: 0.15 },
                  { category: 'Accessories', demand: 8, growth: 0.05 }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#f9fafb' 
                  }}
                />
                <Bar dataKey="demand" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Confidence Levels */}
        <motion.div variants={itemVariants} className="card">
          <div className="card-header">
            <h3 className="card-title">Forecast Confidence</h3>
            <p className="card-description">Prediction accuracy over time</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demandData.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#f9fafb' 
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="confidence" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.3}
                  name="Confidence Level"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Insights Panel */}
      <motion.div variants={itemVariants} className="card">
        <div className="card-header">
          <h3 className="card-title">AI Insights & Recommendations</h3>
          <p className="card-description">Machine learning-generated insights</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <TrendingUpIcon className="w-5 h-5 text-green-500 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Demand Surge Expected</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Wedding season peak approaching. Consider increasing capacity by 25% for next 2 weeks.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <ChartBarIcon className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Business Formal Growing</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  12% increase in business formal demand indicates corporate recovery. Expand partnerships.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Resource Allocation</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Plan for increased staffing during peak hours (11am-2pm) and weekend appointments.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CalendarIcon className="w-5 h-5 text-purple-500 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Seasonal Patterns</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Winter collection demand expected to rise 35% starting next month. Prepare inventory.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default DemandForecasting