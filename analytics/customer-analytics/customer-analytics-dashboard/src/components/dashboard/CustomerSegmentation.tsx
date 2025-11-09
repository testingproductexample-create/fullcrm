import React, { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomerSegment, RFMScores } from '@/types/customer';
import { Users, Target, TrendingUp, Star } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

export const CustomerSegmentation: React.FC = () => {
  const [segmentationData, setSegmentationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSegmentation, setSelectedSegmentation] = useState('rfm');

  useEffect(() => {
    // Simulate data fetch
    setTimeout(() => {
      setSegmentationData({
        rfmAnalysis: [
          { rScore: 5, fScore: 5, mScore: 5, segment: 'Champions', count: 1245, color: '#10B981' },
          { rScore: 4, fScore: 4, mScore: 4, segment: 'Loyal Customers', count: 2134, color: '#3B82F6' },
          { rScore: 3, fScore: 3, mScore: 3, segment: 'Potential Loyalists', count: 1856, color: '#8B5CF6' },
          { rScore: 2, fScore: 2, mScore: 2, segment: 'New Customers', count: 3456, color: '#F59E0B' },
          { rScore: 1, fScore: 1, mScore: 1, segment: 'At Risk', count: 1678, color: '#EF4444' },
          { rScore: 5, fScore: 1, mScore: 1, segment: 'Hibernating', count: 2345, color: '#6B7280' }
        ],
        rfmScatter: Array.from({ length: 100 }, () => ({
          recency: Math.floor(Math.random() * 5) + 1,
          frequency: Math.floor(Math.random() * 5) + 1,
          monetary: Math.floor(Math.random() * 5) + 1
        })),
        demographicSegments: [
          { segment: 'Young Professionals', count: 4234, percentage: 26.7, avgAge: 28, avgIncome: 65000 },
          { segment: 'Families', count: 3156, percentage: 19.9, avgAge: 38, avgIncome: 75000 },
          { segment: 'Students', count: 2345, percentage: 14.8, avgAge: 22, avgIncome: 25000 },
          { segment: 'Retirees', count: 1876, percentage: 11.8, avgAge: 65, avgIncome: 45000 },
          { segment: 'Entrepreneurs', count: 1456, percentage: 9.2, avgAge: 42, avgIncome: 95000 }
        ],
        behavioralSegments: [
          { segment: 'Frequent Buyers', count: 2845, avgOrdersPerMonth: 4.2, avgOrderValue: 185 },
          { segment: 'Bargain Hunters', count: 3456, avgOrdersPerMonth: 2.1, avgOrderValue: 45 },
          { segment: 'Brand Loyal', count: 2134, avgOrdersPerMonth: 3.8, avgOrderValue: 220 },
          { segment: 'Window Shoppers', count: 4567, avgOrdersPerMonth: 0.8, avgOrderValue: 95 },
          { segment: 'Seasonal Buyers', count: 2845, avgOrdersPerMonth: 1.5, avgOrderValue: 165 }
        ],
        purchasePattern: [
          { pattern: 'Weekly Shoppers', count: 2134, revenue: 456780 },
          { pattern: 'Monthly Bulk Buyers', count: 1456, revenue: 678900 },
          { pattern: 'Random Occasional', count: 4567, revenue: 234560 },
          { pattern: 'Event-based Purchasers', count: 1234, revenue: 345670 },
          { pattern: 'Subscription Customers', count: 2345, revenue: 789000 }
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
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Segmentation</h2>
          <p className="text-gray-600">Analyze customer groups based on behavior and characteristics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedSegmentation} onValueChange={setSelectedSegmentation}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select segmentation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rfm">RFM Analysis</SelectItem>
              <SelectItem value="demographic">Demographic</SelectItem>
              <SelectItem value="behavioral">Behavioral</SelectItem>
              <SelectItem value="purchase">Purchase Patterns</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={selectedSegmentation} onValueChange={setSelectedSegmentation} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rfm">RFM Analysis</TabsTrigger>
          <TabsTrigger value="demographic">Demographic</TabsTrigger>
          <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
          <TabsTrigger value="purchase">Purchase Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="rfm" className="space-y-6">
          {/* RFM Overview */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  RFM Segments
                </CardTitle>
                <CardDescription>Customer segmentation based on Recency, Frequency, and Monetary value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {segmentationData.rfmAnalysis.map((segment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: segment.color }}
                        />
                        <div>
                          <p className="font-medium">{segment.segment}</p>
                          <p className="text-sm text-gray-600">
                            R: {segment.rScore} | F: {segment.fScore} | M: {segment.mScore}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{segment.count.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">customers</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>RFM Distribution</CardTitle>
                <CardDescription>Visual representation of RFM segments</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={segmentationData.rfmAnalysis}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ segment, count }) => `${segment}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {segmentationData.rfmAnalysis.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* RFM Scatter Plot */}
          <Card>
            <CardHeader>
              <CardTitle>RFM Customer Distribution</CardTitle>
              <CardDescription>Scatter plot showing customer distribution across RFM dimensions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="recency" name="Recency" domain={[1, 5]} />
                  <YAxis type="number" dataKey="frequency" name="Frequency" domain={[1, 5]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter 
                    name="Customers" 
                    data={segmentationData.rfmScatter} 
                    fill="#3B82F6"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographic" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Demographic Segments
                </CardTitle>
                <CardDescription>Customer segments based on age, income, and lifestyle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {segmentationData.demographicSegments.map((segment: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{segment.segment}</h4>
                        <Badge variant="outline">{segment.percentage}%</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Count</p>
                          <p className="font-medium">{segment.count.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avg Age</p>
                          <p className="font-medium">{segment.avgAge} years</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-600">Avg Income</p>
                          <p className="font-medium">${segment.avgIncome.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demographic Distribution</CardTitle>
                <CardDescription>Visual breakdown of demographic segments</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={segmentationData.demographicSegments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavioral" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Behavioral Segments
                </CardTitle>
                <CardDescription>Customer segments based on purchase behavior and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {segmentationData.behavioralSegments.map((segment: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{segment.segment}</h4>
                        <Badge variant="outline">{segment.count.toLocaleString()} customers</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Orders/Month</p>
                          <p className="font-medium">{segment.avgOrdersPerMonth}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avg Order Value</p>
                          <p className="font-medium">${segment.avgOrderValue}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Behavioral Analysis</CardTitle>
                <CardDescription>Purchase frequency vs order value analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={segmentationData.behavioralSegments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="avgOrdersPerMonth" fill="#3B82F6" name="Orders/Month" />
                    <Bar yAxisId="right" dataKey="avgOrderValue" fill="#10B981" name="Avg Order Value ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="purchase" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Purchase Pattern Segments
                </CardTitle>
                <CardDescription>Customer segments based on purchase timing and frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {segmentationData.purchasePattern.map((pattern: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{pattern.pattern}</h4>
                        <Badge variant="outline">{pattern.count.toLocaleString()} customers</Badge>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-600">Revenue Contribution</p>
                        <p className="font-medium text-green-600">
                          ${pattern.revenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Purchase Pattern</CardTitle>
                <CardDescription>Total revenue contribution by customer purchase patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={segmentationData.purchasePattern}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="pattern" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Segmentation Insights</CardTitle>
          <CardDescription>Key findings and recommendations from customer segmentation analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">Champions (1,245 customers)</h4>
              <p className="text-sm text-green-700 mt-1">
                Your most valuable customers with high RFM scores. Focus on retention and upselling.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800">At Risk (1,678 customers)</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Customers with declining engagement. Implement win-back campaigns immediately.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800">Potential Loyalists (1,856 customers)</h4>
              <p className="text-sm text-blue-700 mt-1">
                High-value prospects. Target with loyalty programs and exclusive offers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
