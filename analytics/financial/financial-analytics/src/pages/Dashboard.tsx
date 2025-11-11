import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowsRightLeftIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useFinancial } from '../contexts/FinancialContext'
import { formatCurrency, formatPercentage, generateColors } from '../lib/utils'
// Type-safe Recharts component aliases to fix JSX component issues
// This fixes "cannot be used as JSX component" errors in Recharts v2
const SafeLineChart = LineChart as React.ComponentType<any>;
const SafeAreaChart = AreaChart as React.ComponentType<any>;
const SafeBarChart = BarChart as React.ComponentType<any>;
const SafePieChart = PieChart as React.ComponentType<any>;
const SafeRadarChart = RadarChart as React.ComponentType<any>;
const SafeComposedChart = ComposedChart as React.ComponentType<any>;
const SafeScatterChart = ScatterChart as React.ComponentType<any>;
const SafeResponsiveContainer = ResponsiveContainer as React.ComponentType<any>;
const SafeLine = Line as React.ComponentType<any>;
const SafeArea = Area as React.ComponentType<any>;
const SafeBar = Bar as React.ComponentType<any>;
const SafePie = Pie as React.ComponentType<any>;
const SafeCell = Cell as React.ComponentType<any>;
const SafeXAxis = XAxis as React.ComponentType<any>;
const SafeYAxis = YAxis as React.ComponentType<any>;
const SafeCartesianGrid = CartesianGrid as React.ComponentType<any>;
const SafeTooltip = Tooltip as React.ComponentType<any>;
const SafeLegend = Legend as React.ComponentType<any>;
const SafeRadar = Radar as React.ComponentType<any>;
const SafePolarGrid = PolarGrid as React.ComponentType<any>;
const SafePolarAngleAxis = PolarAngleAxis as React.ComponentType<any>;
const SafePolarRadiusAxis = PolarRadiusAxis as React.ComponentType<any>;
const SafeBrush = Brush as React.ComponentType<any>;
const SafeReferenceLine = ReferenceLine as React.ComponentType<any>;
const SafeReferenceDot = ReferenceDot as React.ComponentType<any>;
const SafeFunnelChart = FunnelChart as React.ComponentType<any>;
const SafeFunnel = Funnel as React.ComponentType<any>;
const SafeTreemap = Treemap as React.ComponentType<any>;
const SafeSankey = Sankey as React.ComponentType<any>;

interface DashboardCard {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const Dashboard: React.FC = () => {
  const { state } = useFinancial()
  const [timeRange, setTimeRange] = useState('6months')

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', 'demo-company', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/financial/dashboard/demo-company?period=${timeRange}`)
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      return response.json()
    }
  })

  // Mock data for charts
  const revenueData = [
    { month: 'Jan', revenue: 950000, costs: 680000, profit: 270000 },
    { month: 'Feb', revenue: 1020000, costs: 720000, profit: 300000 },
    { month: 'Mar', revenue: 1150000, costs: 800000, profit: 350000 },
    { month: 'Apr', revenue: 1180000, costs: 820000, profit: 360000 },
    { month: 'May', revenue: 1200000, costs: 840000, profit: 360000 },
    { month: 'Jun', revenue: 1250000, costs: 850000, profit: 400000 }
  ]

  const cashFlowData = [
    { month: 'Jan', operating: 300000, investing: -50000, financing: -25000, net: 225000 },
    { month: 'Feb', operating: 320000, investing: -40000, financing: -20000, net: 260000 },
    { month: 'Mar', operating: 350000, investing: -60000, financing: -30000, net: 260000 },
    { month: 'Apr', operating: 340000, investing: -45000, financing: -25000, net: 270000 },
    { month: 'May', operating: 380000, investing: -55000, financing: -25000, net: 300000 },
    { month: 'Jun', operating: 375000, investing: -50000, financing: -25000, net: 300000 }
  ]

  const profitMarginData = [
    { name: 'Gross Margin', value: 43.75, color: '#10B981' },
    { name: 'Operating Margin', value: 30.0, color: '#3B82F6' },
    { name: 'Net Margin', value: 32.0, color: '#8B5CF6' }
  ]

  // Calculate dashboard cards data
  const cards: DashboardCard[] = [
    {
      title: 'Total Revenue',
      value: 'AED 1,250,000',
      change: '+13.64%',
      changeType: 'positive',
      icon: ArrowTrendingUpIcon,
      color: 'text-green-600'
    },
    {
      title: 'Net Profit',
      value: 'AED 400,000',
      change: '+33.33%',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
      color: 'text-blue-600'
    },
    {
      title: 'Profit Margin',
      value: '32.0%',
      change: '+5.0%',
      changeType: 'positive',
      icon: ChartBarIcon,
      color: 'text-purple-600'
    },
    {
      title: 'Cash Flow',
      value: 'AED 300,000',
      change: '+8.5%',
      changeType: 'positive',
      icon: ArrowsRightLeftIcon,
      color: 'text-orange-600'
    },
    {
      title: 'ROI',
      value: '50.0%',
      change: '+15.2%',
      changeType: 'positive',
      icon: CalculatorIcon,
      color: 'text-indigo-600'
    },
    {
      title: 'Cost Ratio',
      value: '68.0%',
      change: '-2.1%',
      changeType: 'positive',
      icon: ArrowTrendingDownIcon,
      color: 'text-red-600'
    }
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-300 rounded-lg"></div>
            <div className="h-80 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Financial Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Overview of your financial performance and key metrics
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
            <option value="ytd">Year to Date</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={card.title}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {card.title}
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-white">
                        {card.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center text-sm">
                  {card.changeType === 'positive' ? (
                    <ArrowTrendingUpIcon className="flex-shrink-0 h-4 w-4 text-green-500" />
                  ) : card.changeType === 'negative' ? (
                    <ArrowTrendingDownIcon className="flex-shrink-0 h-4 w-4 text-red-500" />
                  ) : null}
                  <span
                    className={`ml-1 ${
                      card.changeType === 'positive'
                        ? 'text-green-600 dark:text-green-400'
                        : card.changeType === 'negative'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {card.change} from last period
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Costs Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Revenue vs Costs
          </h3>
          <div className="h-80">
            <SafeResponsiveContainer width="100%" height="100%">
              <SafeLineChart data={revenueData}>
                <SafeCartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <SafeXAxis 
                  dataKey="month" 
                  className="text-gray-600 dark:text-gray-400"
                />
                <SafeYAxis 
                  className="text-gray-600 dark:text-gray-400"
                  tickFormatter={(value) => `AED ${(value / 1000).toFixed(0)}K`}
                />
                <SafeTooltip
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelClassName="text-gray-900 dark:text-white"
                />
                <SafeLine
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
                <SafeLine
                  type="monotone"
                  dataKey="costs"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                />
              </SafeLineChart>
            </SafeResponsiveContainer>
          </div>
        </div>

        {/* Cash Flow Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Cash Flow Analysis
          </h3>
          <div className="h-80">
            <SafeResponsiveContainer width="100%" height="100%">
              <SafeBarChart data={cashFlowData}>
                <SafeCartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <SafeXAxis 
                  dataKey="month" 
                  className="text-gray-600 dark:text-gray-400"
                />
                <SafeYAxis 
                  className="text-gray-600 dark:text-gray-400"
                  tickFormatter={(value) => `AED ${(value / 1000).toFixed(0)}K`}
                />
                <SafeTooltip
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelClassName="text-gray-900 dark:text-white"
                />
                <SafeBar dataKey="operating" fill="#3B82F6" name="Operating" />
                <SafeBar dataKey="net" fill="#10B981" name="Net" />
              </SafeBarChart>
            </SafeResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profit Margin Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Profit Margin Breakdown
          </h3>
          <div className="h-64">
            <SafeResponsiveContainer width="100%" height="100%">
              <SafePieChart>
                <SafePie
                  data={profitMarginData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {profitMarginData.map((entry, index) => (
                    <SafeCell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </SafePie>
                <SafeTooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Margin']}
                  labelClassName="text-gray-900 dark:text-white"
                />
              </SafePieChart>
            </SafeResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {profitMarginData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.name}: {item.value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recent Alerts
          </h3>
          <div className="space-y-3">
            {state.alerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-md border ${
                  alert.severity === 'CRITICAL'
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    : alert.severity === 'HIGH'
                    ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20'
                    : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {alert.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {alert.message}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                        : alert.severity === 'HIGH'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <a
                href="/alerts"
                className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                View all alerts →
              </a>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Generate Report
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Create comprehensive financial report
              </p>
            </button>
            <button className="w-full text-left p-3 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center">
                <CalculatorIcon className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Run Forecast
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Generate financial projections
              </p>
            </button>
            <button className="w-full text-left p-3 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center">
                <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Budget Analysis
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Compare budget vs actual performance
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard