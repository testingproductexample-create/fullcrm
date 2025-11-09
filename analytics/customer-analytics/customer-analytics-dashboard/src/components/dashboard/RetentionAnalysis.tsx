import React, { useState, useEffect } from 'react';
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
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Customer, PurchaseBehavior } from '@/types/customer';
import { Users, TrendingUp, Clock, Target, AlertTriangle, CheckCircle } from 'lucide-react';

export const RetentionAnalysis: React.FC = () => {
  const [retentionData, setRetentionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    // Simulate data fetch
    setTimeout(() => {
      setRetentionData({
        overviewMetrics: {
          overallRetentionRate: 84.2,
          monthlyRetentionRate: 78.5,
          quarterlyRetentionRate: 65.3,
          churnRate: 15.8,
          averageCustomerLifespan: 18.5, // months
          reactivationRate: 23.4
        },
        retentionTrends: [
          { month: 'Jan', retention: 82.1, churn: 17.9, newCustomers: 1245, returningCustomers: 5678 },
          { month: 'Feb', retention: 83.4, churn: 16.6, newCustomers: 1156, returningCustomers: 5890 },
          { month: 'Mar', retention: 84.2, churn: 15.8, newCustomers: 1378, returningCustomers: 6123 },
          { month: 'Apr', retention: 85.1, churn: 14.9, newCustomers: 1423, returningCustomers: 6345 },
          { month: 'May', retention: 84.7, churn: 15.3, newCustomers: 1534, returningCustomers: 6234 },
          { month: 'Jun', retention: 85.3, churn: 14.7, newCustomers: 1678, returningCustomers: 6512 },
          { month: 'Jul', retention: 83.9, churn: 16.1, newCustomers: 1456, returningCustomers: 5987 },
          { month: 'Aug', retention: 84.6, churn: 15.4, newCustomers: 1567, returningCustomers: 6234 },
          { month: 'Sep', retention: 85.0, churn: 15.0, newCustomers: 1623, returningCustomers: 6456 },
          { month: 'Oct', retention: 84.8, churn: 15.2, newCustomers: 1712, returningCustomers: 6378 },
          { month: 'Nov', retention: 84.2, churn: 15.8, newCustomers: 1689, returningCustomers: 6234 },
          { month: 'Dec', retention: 84.2, churn: 15.8, newCustomers: 1834, returningCustomers: 6312 }
        ],
        cohortAnalysis: [
          { cohort: 'Jan 2024', month0: 100, month1: 85, month2: 78, month3: 72, month4: 68, month5: 65, month6: 63 },
          { cohort: 'Feb 2024', month0: 100, month1: 87, month2: 80, month3: 75, month4: 71, month5: 68, month6: 66 },
          { cohort: 'Mar 2024', month0: 100, month1: 86, month2: 79, month3: 74, month4: 70, month5: 67, month6: 0 },
          { cohort: 'Apr 2024', month0: 100, month1: 88, month2: 82, month3: 77, month4: 73, month5: 0, month6: 0 },
          { cohort: 'May 2024', month0: 100, month1: 89, month2: 83, month3: 78, month4: 0, month5: 0, month6: 0 },
          { cohort: 'Jun 2024', month0: 100, month1: 90, month2: 85, month3: 0, month4: 0, month5: 0, month6: 0 }
        ],
        retentionBySegment: [
          { segment: 'Champions', retention: 94.5, churn: 5.5, customers: 1245, avgLifespan: 28.3 },
          { segment: 'Loyal Customers', retention: 89.2, churn: 10.8, customers: 2134, avgLifespan: 24.1 },
          { segment: 'Potential Loyalists', retention: 82.3, churn: 17.7, customers: 1856, avgLifespan: 18.7 },
          { segment: 'New Customers', retention: 68.4, churn: 31.6, customers: 3456, avgLifespan: 8.2 },
          { segment: 'At Risk', retention: 45.2, churn: 54.8, customers: 1678, avgLifespan: 12.4 },
          { segment: 'Hibernating', retention: 23.1, churn: 76.9, customers: 2345, avgLifespan: 15.6 }
        ],
        churnAnalysis: [
          { reason: 'Price Concerns', count: 1234, percentage: 28.5, recoverable: true },
          { reason: 'Poor Service', count: 876, percentage: 20.2, recoverable: false },
          { reason: 'Competitor Switch', count: 723, percentage: 16.7, recoverable: false },
          { reason: 'No Longer Needed', count: 567, percentage: 13.1, recoverable: false },
          { reason: 'Product Quality', count: 445, percentage: 10.3, recoverable: true },
          { reason: 'Shipping Issues', count: 334, percentage: 7.7, recoverable: true },
          { reason: 'Other', count: 189, percentage: 4.4, recoverable: null }
        ],
        retentionByAcquisition: [
          { source: 'Organic Search', retention: 87.3, customers: 8234, avgLifespan: 22.1 },
          { source: 'Paid Ads', retention: 78.9, customers: 4521, avgLifespan: 16.8 },
          { source: 'Referral', retention: 92.1, customers: 3092, avgLifespan: 26.4 },
          { source: 'Social Media', retention: 74.6, customers: 2234, avgLifespan: 14.2 },
          { source: 'Direct', retention: 85.7, customers: 1766, avgLifespan: 20.9 }
        ],
        predictiveRetention: [
          { timeframe: 'Next 30 days', highRisk: 234, mediumRisk: 567, lowRisk: 1234, prediction: 78.4 },
          { timeframe: 'Next 90 days', highRisk: 456, mediumRisk: 789, lowRisk: 890, prediction: 72.1 },
          { timeframe: 'Next 6 months', highRisk: 678, mediumRisk: 890, lowRisk: 567, prediction: 65.8 }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Retention Analysis</h2>
          <p className="text-gray-600">Track retention rates, identify churn patterns, and predict customer behavior</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="cohort">Cohort Analysis</SelectItem>
              <SelectItem value="churn">Churn Analysis</SelectItem>
              <SelectItem value="predictive">Predictive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overall Retention</p>
                <p className="text-2xl font-bold">{retentionData.overviewMetrics.overallRetentionRate}%</p>
                <p className="text-xs text-gray-500">+2.1% vs last quarter</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Churn Rate</p>
                <p className="text-2xl font-bold">{retentionData.overviewMetrics.churnRate}%</p>
                <p className="text-xs text-gray-500">-1.2% vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Customer Lifespan</p>
                <p className="text-2xl font-bold">{retentionData.overviewMetrics.averageCustomerLifespan} mo</p>
                <p className="text-xs text-gray-500">+0.8 months vs last year</p>
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
                <p className="text-sm font-medium text-gray-600">Reactivation Rate</p>
                <p className="text-2xl font-bold">{retentionData.overviewMetrics.reactivationRate}%</p>
                <p className="text-xs text-gray-500">Win-back success rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="churn">Churn Analysis</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Retention Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Retention & Churn Trends</CardTitle>
              <CardDescription>Monthly retention and churn rate trends with customer acquisition</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={retentionData.retentionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="newCustomers" fill="#3B82F6" name="New Customers" />
                  <Bar yAxisId="left" dataKey="returningCustomers" fill="#10B981" name="Returning Customers" />
                  <Line yAxisId="right" type="monotone" dataKey="retention" stroke="#F59E0B" strokeWidth={2} name="Retention %" />
                  <Line yAxisId="right" type="monotone" dataKey="churn" stroke="#EF4444" strokeWidth={2} name="Churn %" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Retention by Segment */}
          <Card>
            <CardHeader>
              <CardTitle>Retention by Customer Segment</CardTitle>
              <CardDescription>Retention rates and average customer lifespan by segment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Segment</th>
                      <th className="text-right p-3">Customers</th>
                      <th className="text-right p-3">Retention Rate</th>
                      <th className="text-right p-3">Churn Rate</th>
                      <th className="text-right p-3">Avg Lifespan</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retentionData.retentionBySegment.map((segment: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{segment.segment}</td>
                        <td className="p-3 text-right">{segment.customers.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium">{segment.retention}%</td>
                        <td className="p-3 text-right">{segment.churn}%</td>
                        <td className="p-3 text-right">{segment.avgLifespan} months</td>
                        <td className="p-3">
                          <Badge className={
                            segment.retention >= 90 ? 'bg-green-100 text-green-800' :
                            segment.retention >= 80 ? 'bg-blue-100 text-blue-800' :
                            segment.retention >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {segment.retention >= 90 ? 'Excellent' :
                             segment.retention >= 80 ? 'Good' :
                             segment.retention >= 60 ? 'Fair' : 'Poor'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Retention by Acquisition Source */}
          <Card>
            <CardHeader>
              <CardTitle>Retention by Acquisition Source</CardTitle>
              <CardDescription>Retention performance across different customer acquisition channels</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={retentionData.retentionByAcquisition}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="retention" fill="#3B82F6" name="Retention %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohort" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Retention Analysis</CardTitle>
              <CardDescription>Customer retention rates by signup cohort over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Cohort</th>
                      <th className="text-center p-3">Month 0</th>
                      <th className="text-center p-3">Month 1</th>
                      <th className="text-center p-3">Month 2</th>
                      <th className="text-center p-3">Month 3</th>
                      <th className="text-center p-3">Month 4</th>
                      <th className="text-center p-3">Month 5</th>
                      <th className="text-center p-3">Month 6</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retentionData.cohortAnalysis.map((cohort: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{cohort.cohort}</td>
                        <td className="p-3 text-center">
                          <div className="w-full bg-green-500 h-4 rounded" style={{ width: `${cohort.month0}%` }}>
                            <span className="text-xs text-white font-medium">{cohort.month0}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="w-full bg-green-400 h-4 rounded" style={{ width: `${cohort.month1}%` }}>
                            <span className="text-xs text-white font-medium">{cohort.month1}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="w-full bg-green-300 h-4 rounded" style={{ width: `${cohort.month2}%` }}>
                            <span className="text-xs text-gray-800 font-medium">{cohort.month2}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="w-full bg-yellow-300 h-4 rounded" style={{ width: `${cohort.month3}%` }}>
                            <span className="text-xs text-gray-800 font-medium">{cohort.month3}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="w-full bg-yellow-200 h-4 rounded" style={{ width: `${cohort.month4}%` }}>
                            <span className="text-xs text-gray-800 font-medium">{cohort.month4}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="w-full bg-orange-200 h-4 rounded" style={{ width: `${cohort.month5}%` }}>
                            <span className="text-xs text-gray-800 font-medium">{cohort.month5}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {cohort.month6 > 0 ? (
                            <div className="w-full bg-red-200 h-4 rounded" style={{ width: `${cohort.month6}%` }}>
                              <span className="text-xs text-gray-800 font-medium">{cohort.month6}%</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="churn" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Churn Reason Analysis</CardTitle>
              <CardDescription>Top reasons for customer churn and recoverability assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {retentionData.churnAnalysis.map((reason: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium">{reason.reason}</h4>
                        <Badge variant={reason.recoverable === true ? "default" : reason.recoverable === false ? "destructive" : "secondary"}>
                          {reason.recoverable === true ? "Recoverable" : 
                           reason.recoverable === false ? "Non-recoverable" : "Unknown"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{reason.count.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{reason.percentage}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          reason.recoverable === true ? 'bg-green-500' : 
                          reason.recoverable === false ? 'bg-red-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${reason.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Retention Analysis</CardTitle>
              <CardDescription>AI-powered predictions for customer retention risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {retentionData.predictiveRetention.map((prediction: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">{prediction.timeframe}</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-red-600">High Risk</span>
                        <span className="font-medium">{prediction.highRisk} customers</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-yellow-600">Medium Risk</span>
                        <span className="font-medium">{prediction.mediumRisk} customers</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-600">Low Risk</span>
                        <span className="font-medium">{prediction.lowRisk} customers</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{prediction.prediction}%</div>
                          <div className="text-sm text-gray-600">Predicted Retention</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Retention Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Retention Insights & Recommendations</CardTitle>
          <CardDescription>Key findings and actionable recommendations from retention analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">Champion Retention</h4>
              <p className="text-sm text-green-700 mt-1">
                94.5% retention rate for Champions. Consider premium loyalty programs to maintain this segment.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800">Price Sensitivity</h4>
              <p className="text-sm text-yellow-700 mt-1">
                28.5% of churn due to price concerns. Consider flexible pricing and value communication.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800">Referral Quality</h4>
              <p className="text-sm text-blue-700 mt-1">
                Referral customers show 92.1% retention. Expand referral program to improve customer quality.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
