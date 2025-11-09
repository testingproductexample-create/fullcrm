import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar
} from 'recharts'
import { formatCurrency, formatPercentage } from '../lib/utils'

const Forecasting: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState('linear_regression')
  const [forecastHorizon, setForecastHorizon] = useState(12)
  const [isGenerating, setIsGenerating] = useState(false)

  // Mock historical data
  const historicalData = [
    { date: '2023-01', value: 800000, actual: 800000 },
    { date: '2023-02', value: 850000, actual: 850000 },
    { date: '2023-03', value: 900000, actual: 900000 },
    { date: '2023-04', value: 875000, actual: 875000 },
    { date: '2023-05', value: 950000, actual: 950000 },
    { date: '2023-06', value: 1000000, actual: 1000000 },
    { date: '2023-07', value: 1050000, actual: 1050000 },
    { date: '2023-08', value: 1100000, actual: 1100000 },
    { date: '2023-09', value: 1080000, actual: 1080000 },
    { date: '2023-10', value: 1150000, actual: 1150000 },
    { date: '2023-11', value: 1200000, actual: 1200000 },
    { date: '2023-12', value: 1250000, actual: 1250000 },
    { date: '2024-01', value: 1180000, actual: 1180000 },
    { date: '2024-02', value: 1220000, actual: 1220000 },
    { date: '2024-03', value: 1280000, actual: 1280000 },
    { date: '2024-04', value: 1300000, actual: 1300000 },
    { date: '2024-05', value: 1350000, actual: 1350000 },
    { date: '2024-06', value: 1400000, actual: 1400000 }
  ]

  // Mock forecast data based on method
  const getForecastData = (method: string) => {
    switch (method) {
      case 'linear_regression':
        return [
          { date: '2024-07', value: 1425000, confidence: 95, lower: 1380000, upper: 1470000 },
          { date: '2024-08', value: 1450000, confidence: 92, lower: 1400000, upper: 1500000 },
          { date: '2024-09', value: 1475000, confidence: 89, lower: 1420000, upper: 1530000 },
          { date: '2024-10', value: 1500000, confidence: 85, lower: 1440000, upper: 1560000 },
          { date: '2024-11', value: 1525000, confidence: 82, lower: 1460000, upper: 1590000 },
          { date: '2024-12', value: 1550000, confidence: 78, lower: 1480000, upper: 1620000 },
          { date: '2025-01', value: 1575000, confidence: 75, lower: 1500000, upper: 1650000 },
          { date: '2025-02', value: 1600000, confidence: 72, lower: 1520000, upper: 1680000 },
          { date: '2025-03', value: 1625000, confidence: 68, lower: 1540000, upper: 1710000 },
          { date: '2025-04', value: 1650000, confidence: 65, lower: 1560000, upper: 1740000 },
          { date: '2025-05', value: 1675000, confidence: 62, lower: 1580000, upper: 1770000 },
          { date: '2025-06', value: 1700000, confidence: 58, lower: 1600000, upper: 1800000 }
        ]
      case 'exponential_smoothing':
        return [
          { date: '2024-07', value: 1410000, confidence: 93 },
          { date: '2024-08', value: 1428000, confidence: 90 },
          { date: '2024-09', value: 1445000, confidence: 87 },
          { date: '2024-10', value: 1462000, confidence: 84 },
          { date: '2024-11', value: 1478000, confidence: 81 },
          { date: '2024-12', value: 1494000, confidence: 78 },
          { date: '2025-01', value: 1510000, confidence: 75 },
          { date: '2025-02', value: 1525000, confidence: 72 },
          { date: '2025-03', value: 1540000, confidence: 69 },
          { date: '2025-04', value: 1555000, confidence: 66 },
          { date: '2025-05', value: 1570000, confidence: 63 },
          { date: '2025-06', value: 1585000, confidence: 60 }
        ]
      case 'monte_carlo':
        return [
          { date: '2024-07', value: 1430000, confidence: 95, lower: 1350000, upper: 1520000 },
          { date: '2024-08', value: 1460000, confidence: 92, lower: 1370000, upper: 1560000 },
          { date: '2024-09', value: 1490000, confidence: 89, lower: 1390000, upper: 1600000 },
          { date: '2024-10', value: 1520000, confidence: 85, lower: 1410000, upper: 1640000 },
          { date: '2024-11', value: 1550000, confidence: 82, lower: 1430000, upper: 1680000 },
          { date: '2024-12', value: 1580000, confidence: 78, lower: 1450000, upper: 1720000 },
          { date: '2025-01', value: 1610000, confidence: 75, lower: 1470000, upper: 1760000 },
          { date: '2025-02', value: 1640000, confidence: 72, lower: 1490000, upper: 1800000 },
          { date: '2025-03', value: 1670000, confidence: 68, lower: 1510000, upper: 1840000 },
          { date: '2025-04', value: 1700000, confidence: 65, lower: 1530000, upper: 1880000 },
          { date: '2025-05', value: 1730000, confidence: 62, lower: 1550000, upper: 1920000 },
          { date: '2025-06', value: 1760000, confidence: 58, lower: 1570000, upper: 1960000 }
        ]
      default:
        return []
    }
  }

  const forecastData = getForecastData(selectedMethod).slice(0, forecastHorizon)

  const generateForecast = useMutation({
    mutationFn: async (params: { method: string; horizon: number }) => {
      setIsGenerating(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      return { success: true }
    },
    onSuccess: () => {
      setIsGenerating(false)
    }
  })

  const combinedData = [...historicalData, ...forecastData.map(f => ({ 
    ...f, 
    forecast: true 
  }))]

  const getMethodDescription = (method: string) => {
    switch (method) {
      case 'linear_regression':
        return 'Best for steady, consistent growth patterns. Uses linear trend analysis.'
      case 'exponential_smoothing':
        return 'Ideal for data with trends and seasonal patterns. Weighted average of historical data.'
      case 'monte_carlo':
        return 'Provides probability distributions and confidence intervals. Best for risk analysis.'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Financial Forecasting
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Generate predictive models for revenue, costs, and cash flow
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => generateForecast.mutate({ method: selectedMethod, horizon: forecastHorizon })}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Forecast'
            )}
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Forecast Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Forecasting Method
            </label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="linear_regression">Linear Regression</option>
              <option value="exponential_smoothing">Exponential Smoothing</option>
              <option value="monte_carlo">Monte Carlo Simulation</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {getMethodDescription(selectedMethod)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Forecast Horizon
            </label>
            <select
              value={forecastHorizon}
              onChange={(e) => setForecastHorizon(Number(e.target.value))}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
              <option value={18}>18 Months</option>
              <option value={24}>24 Months</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confidence Level
            </label>
            <div className="flex items-center">
              <input
                type="range"
                min="80"
                max="99"
                defaultValue="95"
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">95%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">R² Score</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">0.89</p>
              <p className="text-sm text-green-600 dark:text-green-400">Excellent fit</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">MAPE</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">2.3%</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Mean absolute error</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Trend</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">Positive</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">+8.5% monthly</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Predicted Revenue</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">AED {forecastData[0]?.value.toLocaleString()}</p>
              <p className="text-sm text-orange-600 dark:text-orange-400">Next month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Forecast Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Revenue Forecast - {selectedMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" className="text-gray-600 dark:text-gray-400" />
              <YAxis className="text-gray-600 dark:text-gray-400" tickFormatter={(value) => `AED ${(value / 1000).toFixed(0)}K`} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'actual' ? formatCurrency(value) : 
                  name === 'value' ? formatCurrency(value) : 
                  formatCurrency(value),
                  name === 'actual' ? 'Historical' : 
                  name === 'value' ? 'Forecast' : name
                ]}
                labelClassName="text-gray-900 dark:text-white"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                name="actual"
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8B5CF6"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                name="value"
              />
              {forecastData[0]?.lower && (
                <>
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="none"
                    fill="#8B5CF6"
                    fillOpacity={0.1}
                    name="upper"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stroke="none"
                    fill="#8B5CF6"
                    fillOpacity={0.1}
                    name="lower"
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast Details and Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast Details */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Forecast Details
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Predicted Growth Rate</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">+8.5% monthly</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Average Monthly Growth</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">AED 28,500</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Projected Q4 Revenue</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">AED 1,550,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Confidence Level</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">95% (3 months), 58% (12 months)</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Key Assumptions</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Historical growth patterns continue</li>
              <li>• No major market disruptions</li>
              <li>• Current marketing spend maintained</li>
              <li>• Seasonal patterns remain consistent</li>
            </ul>
          </div>
        </div>

        {/* Scenario Analysis */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Scenario Analysis
          </h3>
          <div className="space-y-4">
            <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-200">Optimistic Scenario</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">+15% market expansion, strong Q4 performance</p>
                  <p className="text-sm font-bold text-green-800 dark:text-green-200">AED 1,750,000 by June 2025</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Base Scenario</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Current growth trends continue, normal market conditions</p>
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-200">AED 1,600,000 by June 2025</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Conservative Scenario</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">Market slowdown, increased competition</p>
                  <p className="text-sm font-bold text-red-800 dark:text-red-200">AED 1,450,000 by June 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Risk Analysis & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Identified Risks</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2 mr-2"></span>
                Market volatility could impact 15% of projected revenue
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-2"></span>
                Seasonal patterns may shift due to economic factors
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-2"></span>
                Competition may intensify in key revenue segments
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recommendations</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 mr-2"></span>
                Diversify revenue streams to reduce market risk
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 mr-2"></span>
                Build cash reserves for potential downturns
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 mr-2"></span>
                Monitor actual performance vs forecast monthly
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Forecasting