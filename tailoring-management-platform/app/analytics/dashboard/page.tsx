'use client';

import { useState } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  RevenueChart,
  OrderPipelineChart,
  CustomerSegmentationChart,
  EmployeeUtilizationChart,
  ProfitMarginChart,
  ServiceCompletionChart,
  PaymentStatusChart,
  CustomerLifetimeValueChart
} from '@/components/analytics/charts';

export default function ComprehensiveDashboard() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id || '00000000-0000-0000-0000-000000000000';
  
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  
  // Fetch all dashboard data with 30-second refresh
  const {
    executiveMetrics,
    financialData,
    operationalData,
    peopleData,
    customerData,
    isLoading
  } = useDashboardData(organizationId, dateRange);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Business Intelligence Dashboard
            </h1>
            <p className="text-gray-600">
              Comprehensive analytics and insights across all business operations
            </p>
          </div>
          
          {/* Date Range Filter */}
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-2 border border-gray-200">
            {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dateRange === range
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================
            SECTION 1: EXECUTIVE OVERVIEW
        ======================================== */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Executive Overview</h2>
          </div>
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <MetricCard
              title="Total Revenue (YTD)"
              value={formatCurrency(executiveMetrics?.totalRevenue || 0)}
              change={executiveMetrics?.revenueGrowth || 0}
              icon={CurrencyDollarIcon}
              iconColor="text-green-600"
              iconBg="bg-green-100"
              isLoading={isLoading}
            />
            <MetricCard
              title="Active Orders"
              value={executiveMetrics?.activeOrders || 0}
              change={executiveMetrics?.ordersGrowth || 0}
              icon={ShoppingBagIcon}
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
              isLoading={isLoading}
            />
            <MetricCard
              title="Customer Satisfaction"
              value={`${(executiveMetrics?.satisfactionScore || 0).toFixed(1)}/5.0`}
              change={executiveMetrics?.satisfactionGrowth || 0}
              icon={UserGroupIcon}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
              isLoading={isLoading}
            />
            <MetricCard
              title="Order Completion Rate"
              value={`${(executiveMetrics?.completionRate || 0).toFixed(1)}%`}
              change={executiveMetrics?.completionRateChange || 0}
              icon={ChartBarIcon}
              iconColor="text-orange-600"
              iconBg="bg-orange-100"
              isLoading={isLoading}
            />
          </div>

          {/* Business Health Indicators */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Business Health Score</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#E5E7EB"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#10B981"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${((executiveMetrics?.healthScore || 0) / 100) * 351.86} 351.86`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">
                      {executiveMetrics?.healthScore || 0}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">Excellent Performance</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200 lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Key Performance Indicators</h3>
              <div className="space-y-3">
                <KPIBar label="Revenue Target" value={executiveMetrics?.revenueVsTarget || 0} />
                <KPIBar label="Customer Retention" value={executiveMetrics?.retentionRate || 0} />
                <KPIBar label="Employee Productivity" value={executiveMetrics?.productivityScore || 0} />
                <KPIBar label="Quality Standards" value={executiveMetrics?.qualityScore || 0} />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 2: FINANCIAL PERFORMANCE
        ======================================== */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Financial Performance</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Analytics */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Trends (Monthly)</h3>
              <RevenueChart data={financialData?.revenueData || []} isLoading={isLoading} />
            </div>

            {/* Profit Margin Analysis */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Profit Margin Analysis</h3>
              <ProfitMarginChart data={financialData?.profitMarginData || []} isLoading={isLoading} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Status Breakdown */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Status Breakdown</h3>
              <PaymentStatusChart data={financialData?.paymentStatusData || []} isLoading={isLoading} />
            </div>

            {/* Top Revenue by Service */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top Revenue by Service Type</h3>
              <div className="space-y-3">
                {financialData?.topServices?.map((service: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-10 rounded-full ${getServiceColor(index)}`} />
                      <span className="font-semibold text-gray-900">{service.name}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(service.revenue)}</span>
                  </div>
                )) || <LoadingSkeleton count={4} />}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 3: OPERATIONS & ORDERS
        ======================================== */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <ShoppingBagIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Operations & Orders</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Order Pipeline */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Pipeline (By Stage)</h3>
              <OrderPipelineChart data={operationalData?.orderPipeline || []} isLoading={isLoading} />
            </div>

            {/* Order Volume Trends */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Volume Trends</h3>
              <RevenueChart data={operationalData?.orderVolumeData || []} isLoading={isLoading} showTarget={false} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Completion Times */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Service Completion Times</h3>
              <ServiceCompletionChart data={operationalData?.completionTimes || []} isLoading={isLoading} />
            </div>

            {/* Quality Metrics */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quality Control Metrics</h3>
              <div className="space-y-4">
                <QualityMetric
                  label="Defect Rate"
                  value={operationalData?.defectRate || 0}
                  target={5}
                  unit="%"
                  inverse
                />
                <QualityMetric
                  label="First Time Right Rate"
                  value={operationalData?.firstTimeRightRate || 0}
                  target={95}
                  unit="%"
                />
                <QualityMetric
                  label="Customer Complaint Rate"
                  value={operationalData?.complaintRate || 0}
                  target={3}
                  unit="%"
                  inverse
                />
                <QualityMetric
                  label="On-Time Delivery"
                  value={operationalData?.onTimeDelivery || 0}
                  target={90}
                  unit="%"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 4: PEOPLE & RESOURCES
        ======================================== */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">People & Resources</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <MetricCard
              title="Total Employees"
              value={peopleData?.totalEmployees || 0}
              change={peopleData?.employeeGrowth || 0}
              icon={UsersIcon}
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
              isLoading={isLoading}
              small
            />
            <MetricCard
              title="Avg Productivity Score"
              value={`${(peopleData?.avgProductivity || 0).toFixed(1)}%`}
              change={peopleData?.productivityChange || 0}
              icon={ChartBarIcon}
              iconColor="text-green-600"
              iconBg="bg-green-100"
              isLoading={isLoading}
              small
            />
            <MetricCard
              title="Training Progress"
              value={`${(peopleData?.trainingProgress || 0).toFixed(1)}%`}
              change={peopleData?.trainingChange || 0}
              icon={CalendarIcon}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
              isLoading={isLoading}
              small
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employee Utilization */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Staff Utilization Rates</h3>
              <EmployeeUtilizationChart data={peopleData?.utilizationData || []} isLoading={isLoading} />
            </div>

            {/* Employee Performance Dashboard */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top Performers (This Month)</h3>
              <div className="space-y-3">
                {peopleData?.topPerformers?.map((employee: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${getRankColor(index)} flex items-center justify-center text-white font-bold text-sm`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{employee.name}</p>
                        <p className="text-xs text-gray-600">{employee.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{employee.score}</p>
                      <p className="text-xs text-gray-600">Performance Score</p>
                    </div>
                  </div>
                )) || <LoadingSkeleton count={5} />}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION 5: CUSTOMER ANALYTICS
        ======================================== */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Customer Analytics</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <MetricCard
              title="Total Customers"
              value={customerData?.totalCustomers || 0}
              change={customerData?.customerGrowth || 0}
              icon={UserGroupIcon}
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
              isLoading={isLoading}
              small
            />
            <MetricCard
              title="New Customers (MTD)"
              value={customerData?.newCustomers || 0}
              change={customerData?.newCustomersGrowth || 0}
              icon={ArrowTrendingUpIcon}
              iconColor="text-green-600"
              iconBg="bg-green-100"
              isLoading={isLoading}
              small
            />
            <MetricCard
              title="Retention Rate"
              value={`${(customerData?.retentionRate || 0).toFixed(1)}%`}
              change={customerData?.retentionChange || 0}
              icon={ChartBarIcon}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
              isLoading={isLoading}
              small
            />
            <MetricCard
              title="Avg. Lifetime Value"
              value={formatCurrency(customerData?.avgLifetimeValue || 0)}
              change={customerData?.lifetimeValueChange || 0}
              icon={CurrencyDollarIcon}
              iconColor="text-orange-600"
              iconBg="bg-orange-100"
              isLoading={isLoading}
              small
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Segmentation */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Segmentation</h3>
              <CustomerSegmentationChart data={customerData?.segmentationData || []} isLoading={isLoading} />
            </div>

            {/* Customer Lifetime Value */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Acquisition Trends</h3>
              <CustomerLifetimeValueChart data={customerData?.acquisitionData || []} isLoading={isLoading} />
            </div>
          </div>
        </section>

        {/* Last Updated Timestamp */}
        <div className="text-center text-sm text-gray-500 mt-8">
          Last updated: {new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })} GST
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  iconColor: string;
  iconBg: string;
  isLoading?: boolean;
  small?: boolean;
}

function MetricCard({ title, value, change, icon: Icon, iconColor, iconBg, isLoading, small }: MetricCardProps) {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className={`${small ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>{title}</h3>
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      ) : (
        <>
          <p className={`${small ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>
            {value}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {isPositive ? (
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{change.toFixed(1)}% vs last period
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function KPIBar({ label, value }: { label: string; value: number }) {
  const percentage = Math.min(value, 100);
  const color = percentage >= 90 ? 'bg-green-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500';
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{percentage.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function QualityMetric({ label, value, target, unit, inverse }: { label: string; value: number; target: number; unit: string; inverse?: boolean }) {
  const isGood = inverse ? value <= target : value >= target;
  const color = isGood ? 'text-green-600' : 'text-red-600';
  const bgColor = isGood ? 'bg-green-100' : 'bg-red-100';
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-lg font-bold ${color}`}>{value.toFixed(1)}{unit}</span>
        <div className={`px-2 py-1 rounded text-xs font-medium ${color} ${bgColor}`}>
          Target: {target}{unit}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg mb-3"></div>
        </div>
      ))}
    </>
  );
}

// Helper Functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function getServiceColor(index: number): string {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
  return colors[index % colors.length];
}

function getRankColor(index: number): string {
  const colors = ['bg-yellow-500', 'bg-gray-400', 'bg-orange-600', 'bg-blue-500', 'bg-purple-500'];
  return colors[index] || 'bg-gray-500';
}
