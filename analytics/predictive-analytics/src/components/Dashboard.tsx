import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  TrendingUpIcon,
  WrenchScrewdriverIcon,
  BanknotesIcon,
  CpuChipIcon,
  BellIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useAnalytics } from '../contexts/AnalyticsContext'
import { cn, formatCurrency, formatNumber, formatPercentage, getStatusColor } from '../lib/utils'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  icon: React.ComponentType<any>
  color: string
  subtitle?: string
  loading?: boolean
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  color, 
  subtitle, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="metric-card">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mt-1 animate-pulse"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="metric-card"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="metric-label">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="metric-value">{value}</p>
            {change !== undefined && (
              <div className={cn(
                "flex items-center text-sm font-medium",
                trend === 'up' ? "text-green-600" : 
                trend === 'down' ? "text-red-600" : "text-gray-500"
              )}>
                {trend === 'up' && <ArrowUpIcon className="w-3 h-3 mr-1" />}
                {trend === 'down' && <ArrowDownIcon className="w-3 h-3 mr-1" />}
                {formatPercentage(Math.abs(change), 1)}
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  )
}

// Alert Banner Component
const AlertBanner: React.FC = () => {
  const { alerts, loading } = useAnalytics()
  
  const criticalAlerts = alerts.filter(alert => 
    !alert.isRead && (alert.priority === 'critical' || alert.priority === 'high')
  )

  if (loading || criticalAlerts.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
    >
      <div className="flex items-center space-x-3">
        <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''} Require Attention
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {criticalAlerts[0].title}
            {criticalAlerts.length > 1 && ` and ${criticalAlerts.length - 1} more`}
          </p>
        </div>
        <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-sm font-medium">
          View All
        </button>
      </div>
    </motion.div>
  )
}

// Mini Chart Component
interface MiniChartProps {
  data: any[]
  type: 'line' | 'area' | 'bar'
  color: string
  height?: number
}

const MiniChart: React.FC<MiniChartProps> = ({ data, type, color, height = 60 }) => {
  const ChartComponent = type === 'line' ? LineChart : type === 'area' ? AreaChart : BarChart

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={data}>
        {type === 'line' && (
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        )}
        {type === 'area' && (
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            fill={color}
            fillOpacity={0.2}
          />
        )}
        {type === 'bar' && (
          <Bar 
            dataKey="value" 
            fill={color}
            radius={[2, 2, 0, 0]}
          />
        )}
        <XAxis hide />
        <YAxis hide />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            border: 'none', 
            borderRadius: '8px', 
            color: '#f9fafb' 
          }}
        />
      </ChartComponent>
    </ResponsiveContainer>
  )
}

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const { 
    loading, 
    alerts, 
    predictions, 
    anomalies, 
    revenue, 
    customers, 
    inventory, 
    employees,
    isRealTimeEnabled 
  } = useAnalytics()

  // Generate sample data for charts
  const [chartData, setChartData] = useState({
    revenue: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      actual: Math.floor(Math.random() * 50000) + 30000,
      predicted: Math.floor(Math.random() * 50000) + 30000
    })),
    demand: Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      demand: Math.floor(Math.random() * 100) + 20,
      forecast: Math.floor(Math.random() * 100) + 20
    })),
    customerSegments: [
      { name: 'Premium', value: 35, color: '#0ea5e9' },
      { name: 'Regular', value: 45, color: '#10b981' },
      { name: 'Occasional', value: 20, color: '#f59e0b' }
    ],
    riskDistribution: [
      { name: 'Low', value: 60, color: '#10b981' },
      { name: 'Medium', value: 25, color: '#f59e0b' },
      { name: 'High', value: 12, color: '#f97316' },
      { name: 'Critical', value: 3, color: '#ef4444' }
    ]
  })

  // Calculate key metrics
  const currentRevenue = revenue[revenue.length - 1] || { actual: 45000, predicted: 47000 }
  const highRiskCustomers = customers.filter(c => c.churnRisk > 0.6).length
  const criticalAlerts = alerts.filter(a => a.priority === 'critical' || a.priority === 'high').length
  const activeAnomalies = anomalies.filter(a => a.status === 'active').length
  const totalEmployees = employees.length
  const avgPerformance = employees.reduce((sum, e) => sum + e.performance, 0) / (totalEmployees || 1)
  
  // Update charts periodically for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => ({
        ...prev,
        revenue: prev.revenue.map(item => ({
          ...item,
          actual: item.actual + (Math.random() - 0.5) * 2000,
          predicted: item.predicted + (Math.random() - 0.5) * 2000
        }))
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="metric-card">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Predictive Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered business insights and real-time forecasting
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-3 h-3 rounded-full",
            isRealTimeEnabled ? "bg-green-400 animate-pulse" : "bg-gray-400"
          )} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isRealTimeEnabled ? 'Real-time' : 'Static'} Updates
          </span>
        </div>
      </div>

      {/* Alert Banner */}
      <AlertBanner />

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(currentRevenue.actual)}
          change={0.12}
          trend="up"
          icon={CurrencyDollarIcon}
          color="#10b981"
          subtitle="vs. last month"
        />
        
        <MetricCard
          title="Customer Churn Risk"
          value={`${highRiskCustomers} customers`}
          change={-0.05}
          trend="down"
          icon={UserGroupIcon}
          color="#f59e0b"
          subtitle="High-risk accounts"
        />
        
        <MetricCard
          title="Active Anomalies"
          value={activeAnomalies}
          change={0.15}
          trend="up"
          icon={ExclamationTriangleIcon}
          color="#ef4444"
          subtitle="Requiring attention"
        />
        
        <MetricCard
          title="Employee Performance"
          value={formatPercentage(avgPerformance, 0)}
          change={0.08}
          trend="up"
          icon={UserGroupIcon}
          color="#0ea5e9"
          subtitle="Team average"
        />
        
        <MetricCard
          title="Predicted Demand"
          value="1,247 orders"
          change={0.18}
          trend="up"
          icon={ChartBarIcon}
          color="#8b5cf6"
          subtitle="Next 30 days"
        />
        
        <MetricCard
          title="Revenue Forecast"
          value={formatCurrency(currentRevenue.predicted)}
          change={0.15}
          trend="up"
          icon={TrendingUpIcon}
          color="#10b981"
          subtitle="This month"
        />
        
        <MetricCard
          title="Critical Alerts"
          value={criticalAlerts}
          change={-0.20}
          trend="down"
          icon={BellIcon}
          color="#ef4444"
          subtitle="Unresolved issues"
        />
        
        <MetricCard
          title="System Health"
          value="98.5%"
          change={0.02}
          trend="up"
          icon={CpuChipIcon}
          color="#10b981"
          subtitle="Uptime score"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Predicted */}
        <motion.div
          variants={itemVariants}
          className="card"
        >
          <div className="card-header">
            <h3 className="card-title">Revenue Trend & Forecast</h3>
            <p className="card-description">Actual vs. AI-predicted revenue with confidence intervals</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.revenue}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(Number(value)), name]}
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
                  name="Actual Revenue"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#0ea5e9" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  name="Predicted Revenue"
                  dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Customer Segments */}
        <motion.div
          variants={itemVariants}
          className="card"
        >
          <div className="card-header">
            <h3 className="card-title">Customer Segmentation</h3>
            <p className="card-description">Distribution of customer types and churn risk</p>
          </div>
          <div className="h-80 flex items-center justify-center">
            <div className="w-full">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.customerSegments}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.customerSegments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, name]}
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px', 
                      color: '#f9fafb' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-6 mt-4">
                {chartData.customerSegments.map((segment, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {segment.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demand Forecast */}
        <motion.div
          variants={itemVariants}
          className="card"
        >
          <div className="card-header">
            <h3 className="card-title">Demand Forecast</h3>
            <p className="card-description">30-day order demand prediction</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.demand.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#f9fafb' 
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.3}
                  name="Forecasted Demand"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Risk Distribution */}
        <motion.div
          variants={itemVariants}
          className="card"
        >
          <div className="card-header">
            <h3 className="card-title">Risk Distribution</h3>
            <p className="card-description">Business risk levels across operations</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#f9fafb' 
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div
          variants={itemVariants}
          className="card"
        >
          <div className="card-header">
            <h3 className="card-title">Recent Alerts</h3>
            <p className="card-description">Latest system notifications</p>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {alerts.slice(0, 6).map((alert) => (
              <div 
                key={alert.id} 
                className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className={cn(
                  "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                  alert.priority === 'critical' ? 'bg-red-500' :
                  alert.priority === 'high' ? 'bg-orange-500' :
                  alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {alert.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(alert.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <motion.div
        variants={itemVariants}
        className="card"
      >
        <div className="card-header">
          <h3 className="card-title">Performance Metrics Overview</h3>
          <p className="card-description">Key performance indicators and trends</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">98.5%</div>
            <div className="text-sm text-green-700 dark:text-green-300">System Uptime</div>
            <MiniChart data={Array.from({ length: 7 }, (_, i) => ({ value: 95 + Math.random() * 5 }))} type="line" color="#10b981" />
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1,247</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Predicted Orders</div>
            <MiniChart data={Array.from({ length: 7 }, (_, i) => ({ value: 1000 + Math.random() * 500 }))} type="bar" color="#0ea5e9" />
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">$47K</div>
            <div className="text-sm text-purple-700 dark:text-purple-300">Forecasted Revenue</div>
            <MiniChart data={Array.from({ length: 7 }, (_, i) => ({ value: 40000 + Math.random() * 20000 }))} type="area" color="#8b5cf6" />
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">3</div>
            <div className="text-sm text-orange-700 dark:text-orange-300">Active Anomalies</div>
            <MiniChart data={Array.from({ length: 7 }, (_, i) => ({ value: Math.random() * 5 }))} type="line" color="#f59e0b" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Dashboard