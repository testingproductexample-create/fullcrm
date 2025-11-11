import React, { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

// Type-safe Recharts component aliases to fix JSX component issues
const SafePieChart = PieChart as React.ComponentType<any>;
const SafePie = Pie as React.ComponentType<any>;
const SafeCell = Cell as React.ComponentType<any>;
const SafeResponsiveContainer = ResponsiveContainer as React.ComponentType<any>;
const SafeBarChart = BarChart as React.ComponentType<any>;
const SafeBar = Bar as React.ComponentType<any>;
const SafeXAxis = XAxis as React.ComponentType<any>;
const SafeYAxis = YAxis as React.ComponentType<any>;
const SafeCartesianGrid = CartesianGrid as React.ComponentType<any>;
const SafeTooltip = Tooltip as React.ComponentType<any>;
const SafeLegend = Legend as React.ComponentType<any>;
const SafeLineChart = LineChart as React.ComponentType<any>;
const SafeLine = Line as React.ComponentType<any>;
const SafeArea = Area as React.ComponentType<any>;
const SafeAreaChart = AreaChart as React.ComponentType<any>;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, DollarSign, TrendingUp, Heart } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

export const CustomerOverview: React.FC = () => {
  const [customerData, setCustomerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetch
    setTimeout(() => {
      setCustomerData({
        customerStatus: [
          { name: 'Active', value: 12450, color: '#10B981' },
          { name: 'Inactive', value: 2156, color: '#F59E0B' },
          { name: 'Churned', value: 1241, color: '#EF4444' }
        ],
        customerType: [
          { name: 'Regular', value: 12347, color: '#6B7280' },
          { name: 'Premium', value: 2845, color: '#3B82F6' },
          { name: 'VIP', value: 655, color: '#F59E0B' }
        ],
        acquisitionSource: [
          { name: 'Organic Search', value: 8234 },
          { name: 'Paid Ads', value: 4521 },
          { name: 'Referral', value: 3092 },
          { name: 'Social Media', value: 2234 },
          { name: 'Direct', value: 1766 }
        ],
        revenueByMonth: [
          { month: 'Jan', revenue: 185000, customers: 1245 },
          { month: 'Feb', revenue: 195000, customers: 1312 },
          { month: 'Mar', revenue: 210000, customers: 1456 },
          { month: 'Apr', revenue: 225000, customers: 1534 },
          { month: 'May', revenue: 240000, customers: 1678 },
          { month: 'Jun', revenue: 265000, customers: 1823 },
          { month: 'Jul', revenue: 280000, customers: 1945 },
          { month: 'Aug', revenue: 295000, customers: 2087 },
          { month: 'Sep', revenue: 310000, customers: 2234 },
          { month: 'Oct', revenue: 325000, customers: 2378 },
          { month: 'Nov', revenue: 340000, customers: 2512 },
          { month: 'Dec', revenue: 355000, customers: 2654 }
        ],
        loyaltyDistribution: [
          { tier: 'Bronze', count: 8934, percentage: 56.3 },
          { tier: 'Silver', count: 4234, percentage: 26.7 },
          { tier: 'Gold', count: 2134, percentage: 13.5 },
          { tier: 'Platinum', count: 545, percentage: 3.4 }
        ],
        topCustomers: [
          { name: 'John Smith', email: 'john.smith@email.com', revenue: 45670, orders: 89, clv: 52340 },
          { name: 'Sarah Johnson', email: 'sarah.johnson@email.com', revenue: 38950, orders: 76, clv: 44230 },
          { name: 'Michael Brown', email: 'michael.brown@email.com', revenue: 32100, orders: 65, clv: 37890 },
          { name: 'Emily Davis', email: 'emily.davis@email.com', revenue: 29800, orders: 58, clv: 34560 },
          { name: 'David Wilson', email: 'david.wilson@email.com', revenue: 27500, orders: 52, clv: 31200 }
        ]
      });
      setIsLoading(false);
    }, 800);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Customer Status and Type Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Status Distribution</CardTitle>
            <CardDescription>Current status breakdown of all customers</CardDescription>
          </CardHeader>
          <CardContent>
            <SafeResponsiveContainer width="100%" height={300}>
              <SafePieChart>
                <SafePie
                  data={customerData.customerStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {customerData.customerStatus.map((entry: any, index: number) => (
                    <SafeCell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </SafePie>
                <SafeTooltip />
              </SafePieChart>
            </SafeResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Type Distribution</CardTitle>
            <CardDescription>Breakdown by customer tier</CardDescription>
          </CardHeader>
          <CardContent>
            <SafeResponsiveContainer width="100%" height={300}>
              <SafePieChart>
                <SafePie
                  data={customerData.customerType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {customerData.customerType.map((entry: any, index: number) => (
                    <SafeCell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </SafePie>
                <SafeTooltip />
              </SafePieChart>
            </SafeResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and Customer Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Customer Growth Trend</CardTitle>
          <CardDescription>Monthly revenue and customer acquisition trends</CardDescription>
        </CardHeader>
        <CardContent>
          <SafeResponsiveContainer width="100%" height={400}>
            <SafeAreaChart data={customerData.revenueByMonth}>
              <SafeCartesianGrid strokeDasharray="3 3" />
              <SafeXAxis dataKey="month" />
              <SafeYAxis yAxisId="left" />
              <SafeYAxis yAxisId="right" orientation="right" />
              <SafeTooltip content={<CustomTooltip />} />
              <SafeLegend />
              <SafeArea 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3}
                name="Revenue ($)"
              />
              <SafeLine 
                yAxisId="right"
                type="monotone" 
                dataKey="customers" 
                stroke="#10B981" 
                strokeWidth={2}
                name="New Customers"
              />
            </SafeAreaChart>
          </SafeResponsiveContainer>
        </CardContent>
      </Card>

      {/* Acquisition Sources and Loyalty Tiers */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Acquisition Sources</CardTitle>
            <CardDescription>Where customers are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <SafeResponsiveContainer width="100%" height={300}>
              <SafeBarChart data={customerData.acquisitionSource}>
                <SafeCartesianGrid strokeDasharray="3 3" />
                <SafeXAxis dataKey="name" />
                <SafeYAxis />
                <SafeTooltip />
                <SafeBar dataKey="value" fill="#3B82F6" />
              </SafeBarChart>
            </SafeResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loyalty Program Distribution</CardTitle>
            <CardDescription>Customer distribution across loyalty tiers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {customerData.loyaltyDistribution.map((tier: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{tier.tier}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{formatNumber(tier.count)}</span>
                    <Badge variant="outline">{tier.percentage}%</Badge>
                  </div>
                </div>
                <Progress value={tier.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers by Revenue</CardTitle>
          <CardDescription>Highest value customers and their metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-right p-2">Total Revenue</th>
                  <th className="text-right p-2">Orders</th>
                  <th className="text-right p-2">CLV</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {customerData.topCustomers.map((customer: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{customer.name}</td>
                    <td className="p-2 text-gray-600">{customer.email}</td>
                    <td className="p-2 text-right font-medium">{formatCurrency(customer.revenue)}</td>
                    <td className="p-2 text-right">{customer.orders}</td>
                    <td className="p-2 text-right">{formatCurrency(customer.clv)}</td>
                    <td className="p-2">
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Customer Growth Rate</p>
                <p className="text-2xl font-bold text-green-600">+7.8%</p>
                <p className="text-xs text-gray-500">vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold">$127.50</p>
                <p className="text-xs text-gray-500">+3.2% vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Repeat Purchase Rate</p>
                <p className="text-2xl font-bold">68.4%</p>
                <p className="text-xs text-gray-500">+2.1% vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Customer Retention</p>
                <p className="text-2xl font-bold">84.2%</p>
                <p className="text-xs text-gray-500">+1.5% vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};
