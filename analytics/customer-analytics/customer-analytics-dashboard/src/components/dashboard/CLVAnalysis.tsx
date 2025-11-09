import React, { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Customer, PredictiveMetrics } from '@/types/customer';
import { DollarSign, TrendingUp, Target, Users, Calculator } from 'lucide-react';

export const CLVAnalysis: React.FC = () => {
  const [clvData, setClvData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    // Simulate data fetch
    setTimeout(() => {
      setClvData({
        clvOverview: {
          avgClv: 847.23,
          medianClv: 425.50,
          topClvPercentile: 2340.80,
          clvGrowthRate: 12.4,
          totalCustomerValue: 2847592.50,
          predictedTotalClv: 3214567.80
        },
        clvDistribution: [
          { range: '$0-100', count: 3456, percentage: 21.8 },
          { range: '$100-300', count: 4234, percentage: 26.7 },
          { range: '$300-500', count: 2845, percentage: 17.9 },
          { range: '$500-1000', count: 2134, percentage: 13.5 },
          { range: '$1000-2000', count: 1456, percentage: 9.2 },
          { range: '$2000+', count: 1722, percentage: 10.9 }
        ],
        clvBySegment: [
          { segment: 'Champions', avgClv: 2340.50, count: 1245, totalValue: 2913922.50 },
          { segment: 'Loyal Customers', avgClv: 1256.80, count: 2134, totalValue: 2681611.20 },
          { segment: 'Potential Loyalists', avgClv: 756.30, count: 1856, totalValue: 1403692.80 },
          { segment: 'New Customers', avgClv: 234.50, count: 3456, totalValue: 810432.00 },
          { segment: 'At Risk', avgClv: 567.20, count: 1678, totalValue: 951721.60 },
          { segment: 'Hibernating', avgClv: 123.40, count: 2345, totalValue: 289373.00 }
        ],
        clvTrends: [
          { month: 'Jan', actualClv: 756.50, predictedClv: 780.20 },
          { month: 'Feb', actualClv: 782.30, predictedClv: 801.40 },
          { month: 'Mar', actualClv: 798.20, predictedClv: 823.60 },
          { month: 'Apr', actualClv: 815.60, predictedClv: 846.80 },
          { month: 'May', actualClv: 828.40, predictedClv: 871.20 },
          { month: 'Jun', actualClv: 842.30, predictedClv: 896.50 },
          { month: 'Jul', actualClv: 855.80, predictedClv: 923.10 },
          { month: 'Aug', actualClv: 870.20, predictedClv: 950.80 },
          { month: 'Sep', actualClv: 884.60, predictedClv: 979.40 },
          { month: 'Oct', actualClv: 898.40, predictedClv: 1009.20 },
          { month: 'Nov', actualClv: 912.80, predictedClv: 1040.10 },
          { month: 'Dec', actualClv: 925.30, predictedClv: 1072.50 }
        ],
        clvFactors: [
          { factor: 'Purchase Frequency', correlation: 0.85, impact: 'High' },
          { factor: 'Average Order Value', correlation: 0.78, impact: 'High' },
          { factor: 'Customer Tenure', correlation: 0.72, impact: 'Medium' },
          { factor: 'Product Diversity', correlation: 0.65, impact: 'Medium' },
          { factor: 'Engagement Level', correlation: 0.58, impact: 'Medium' },
          { factor: 'Support Interactions', correlation: 0.42, impact: 'Low' }
        ],
        topClvCustomers: [
          { name: 'John Smith', email: 'john.smith@email.com', clv: 12450, predictedClv: 15670, tenure: 24, orders: 89, status: 'Champion' },
          { name: 'Sarah Johnson', email: 'sarah.johnson@email.com', clv: 9820, predictedClv: 12340, tenure: 18, orders: 67, status: 'Loyal' },
          { name: 'Michael Brown', email: 'michael.brown@email.com', clv: 8750, predictedClv: 10890, tenure: 22, orders: 54, status: 'Loyal' },
          { name: 'Emily Davis', email: 'emily.davis@email.com', clv: 7890, predictedClv: 9560, tenure: 15, orders: 45, status: 'Potential' },
          { name: 'David Wilson', email: 'david.wilson@email.com', clv: 7230, predictedClv: 8920, tenure: 20, orders: 41, status: 'Loyal' }
        ],
        clvModelMetrics: {
          accuracy: 87.4,
          precision: 84.2,
          recall: 89.1,
          f1Score: 86.6,
          lastUpdated: '2024-12-10T10:30:00Z'
        }
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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Lifetime Value Analysis</h2>
          <p className="text-gray-600">Calculate and analyze customer lifetime value across segments and time periods</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="segments">By Segments</SelectItem>
              <SelectItem value="trends">Trends</SelectItem>
              <SelectItem value="factors">CLV Factors</SelectItem>
              <SelectItem value="predictions">Predictions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key CLV Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average CLV</p>
                <p className="text-2xl font-bold">{formatCurrency(clvData.clvOverview.avgClv)}</p>
                <p className="text-xs text-gray-500">+{clvData.clvOverview.clvGrowthRate}% vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Median CLV</p>
                <p className="text-2xl font-bold">{formatCurrency(clvData.clvOverview.medianClv)}</p>
                <p className="text-xs text-gray-500">50th percentile</p>
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
                <p className="text-sm font-medium text-gray-600">Top 10% CLV</p>
                <p className="text-2xl font-bold">{formatCurrency(clvData.clvOverview.topClvPercentile)}</p>
                <p className="text-xs text-gray-500">High-value customers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calculator className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Predicted CLV</p>
                <p className="text-2xl font-bold">{formatCurrency(clvData.clvOverview.predictedTotalClv)}</p>
                <p className="text-xs text-gray-500">Next 12 months</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="factors">Factors</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>CLV Distribution</CardTitle>
                <CardDescription>Distribution of customers across CLV ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={clvData.clvDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CLV Growth Trend</CardTitle>
                <CardDescription>Actual vs predicted CLV over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={clvData.clvTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="actualClv" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Actual CLV"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predictedClv" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Predicted CLV"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CLV by Customer Segment</CardTitle>
              <CardDescription>Average CLV and total value by customer segment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Segment</th>
                      <th className="text-right p-3">Customers</th>
                      <th className="text-right p-3">Avg CLV</th>
                      <th className="text-right p-3">Total Value</th>
                      <th className="text-right p-3">% of Total</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clvData.clvBySegment.map((segment: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{segment.segment}</td>
                        <td className="p-3 text-right">{formatNumber(segment.count)}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(segment.avgClv)}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(segment.totalValue)}</td>
                        <td className="p-3 text-right">
                          {((segment.totalValue / clvData.clvOverview.totalCustomerValue) * 100).toFixed(1)}%
                        </td>
                        <td className="p-3">
                          <Badge className={
                            segment.segment === 'Champions' ? 'bg-green-100 text-green-800' :
                            segment.segment === 'At Risk' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {segment.segment}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CLV Trends Analysis</CardTitle>
              <CardDescription>Historical and predicted CLV trends with confidence intervals</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={clvData.clvTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="actualClv" 
                    stackId="1"
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                    name="Actual CLV"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predictedClv" 
                    stackId="2"
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.3}
                    name="Predicted CLV"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CLV Contributing Factors</CardTitle>
              <CardDescription>Factors that influence customer lifetime value and their correlation strength</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clvData.clvFactors.map((factor: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{factor.factor}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{factor.impact} Impact</Badge>
                          <span className="text-sm text-gray-600">
                            Correlation: {(factor.correlation * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${factor.correlation * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top CLV Customers</CardTitle>
                <CardDescription>Highest value customers with predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Customer</th>
                        <th className="text-right p-2">Current CLV</th>
                        <th className="text-right p-2">Predicted CLV</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clvData.topClvCustomers.map((customer: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-xs text-gray-600">{customer.email}</p>
                            </div>
                          </td>
                          <td className="p-2 text-right font-medium">{formatCurrency(customer.clv)}</td>
                          <td className="p-2 text-right">{formatCurrency(customer.predictedClv)}</td>
                          <td className="p-2">
                            <Badge className={
                              customer.status === 'Champion' ? 'bg-green-100 text-green-800' :
                              customer.status === 'Loyal' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {customer.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
                <CardDescription>Accuracy metrics for CLV prediction model</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Accuracy</span>
                  <span className="text-sm text-gray-600">{clvData.clvModelMetrics.accuracy}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Precision</span>
                  <span className="text-sm text-gray-600">{clvData.clvModelMetrics.precision}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Recall</span>
                  <span className="text-sm text-gray-600">{clvData.clvModelMetrics.recall}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">F1 Score</span>
                  <span className="text-sm text-gray-600">{clvData.clvModelMetrics.f1Score}%</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500">
                    Last updated: {new Date(clvData.clvModelMetrics.lastUpdated).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* CLV Insights */}
      <Card>
        <CardHeader>
          <CardTitle>CLV Insights & Recommendations</CardTitle>
          <CardDescription>Key findings and actionable recommendations from CLV analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">High CLV Segments</h4>
              <p className="text-sm text-green-700 mt-1">
                Champions and Loyal customers represent 67% of total customer value. Focus retention efforts here.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800">Growth Opportunity</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Potential Loyalists show 23% CLV increase potential with targeted engagement campaigns.
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800">At-Risk Customers</h4>
              <p className="text-sm text-red-700 mt-1">
                At Risk segment has declining CLV. Implement immediate win-back strategies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
