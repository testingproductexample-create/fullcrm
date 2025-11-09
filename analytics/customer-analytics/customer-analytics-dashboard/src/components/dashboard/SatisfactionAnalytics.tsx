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
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SatisfactionScore, CustomerFeedback } from '@/types/customer';
import { Heart, Star, TrendingUp, ThumbsUp, ThumbsDown, MessageCircle, Smile } from 'lucide-react';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

export const SatisfactionAnalytics: React.FC = () => {
  const [satisfactionData, setSatisfactionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    // Simulate data fetch
    setTimeout(() => {
      setSatisfactionData({
        overviewMetrics: {
          avgSatisfactionScore: 8.2,
          avgNpsScore: 7.1,
          avgCsatScore: 4.2,
          responseRate: 68.4,
          promoters: 5847,
          passives: 7234,
          detractors: 2766,
          satisfactionTrend: 2.3
        },
        satisfactionTrends: [
          { month: 'Jan', satisfaction: 7.8, nps: 6.8, csat: 4.0, responses: 1245 },
          { month: 'Feb', satisfaction: 7.9, nps: 6.9, csat: 4.1, responses: 1156 },
          { month: 'Mar', satisfaction: 8.0, nps: 7.0, csat: 4.1, responses: 1378 },
          { month: 'Apr', satisfaction: 8.1, nps: 7.0, csat: 4.2, responses: 1423 },
          { month: 'May', satisfaction: 8.2, nps: 7.1, csat: 4.2, responses: 1534 },
          { month: 'Jun', satisfaction: 8.3, nps: 7.2, csat: 4.3, responses: 1678 },
          { month: 'Jul', satisfaction: 8.1, nps: 7.0, csat: 4.2, responses: 1456 },
          { month: 'Aug', satisfaction: 8.2, nps: 7.1, csat: 4.2, responses: 1567 },
          { month: 'Sep', satisfaction: 8.3, nps: 7.2, csat: 4.3, responses: 1623 },
          { month: 'Oct', satisfaction: 8.2, nps: 7.1, csat: 4.2, responses: 1712 },
          { month: 'Nov', satisfaction: 8.2, nps: 7.1, csat: 4.2, responses: 1689 },
          { month: 'Dec', satisfaction: 8.2, nps: 7.1, csat: 4.2, responses: 1834 }
        ],
        npsBreakdown: [
          { category: 'Promoters (9-10)', count: 5847, percentage: 36.9, color: '#10B981' },
          { category: 'Passives (7-8)', count: 7234, percentage: 45.6, color: '#F59E0B' },
          { category: 'Detractors (0-6)', count: 2766, percentage: 17.5, color: '#EF4444' }
        ],
        satisfactionBySegment: [
          { segment: 'Champions', satisfaction: 9.2, nps: 8.9, csat: 4.7, count: 1245 },
          { segment: 'Loyal Customers', satisfaction: 8.8, nps: 8.2, csat: 4.5, count: 2134 },
          { segment: 'Potential Loyalists', satisfaction: 8.1, nps: 7.4, csat: 4.2, count: 1856 },
          { segment: 'New Customers', satisfaction: 7.6, nps: 6.8, csat: 3.9, count: 3456 },
          { segment: 'At Risk', satisfaction: 6.2, nps: 4.1, csat: 3.1, count: 1678 },
          { segment: 'Hibernating', satisfaction: 5.8, nps: 3.2, csat: 2.8, count: 2345 }
        ],
        feedbackTopics: [
          { topic: 'Product Quality', positive: 4567, negative: 1234, total: 5801 },
          { topic: 'Customer Service', positive: 3456, negative: 987, total: 4443 },
          { topic: 'Delivery Speed', positive: 3234, negative: 1567, total: 4801 },
          { topic: 'Price Value', positive: 2345, negative: 1789, total: 4134 },
          { topic: 'Website Experience', positive: 2987, negative: 1456, total: 4443 },
          { topic: 'Return Process', positive: 1234, negative: 987, total: 2221 }
        ],
        recentFeedback: [
          {
            id: '1',
            customer: 'John Smith',
            rating: 5,
            content: 'Excellent product quality and fast delivery. Very satisfied with my purchase.',
            sentiment: 'positive',
            date: '2024-12-08',
            topic: 'Product Quality'
          },
          {
            id: '2',
            customer: 'Sarah Johnson',
            rating: 4,
            content: 'Good service overall, but delivery was slightly delayed.',
            sentiment: 'positive',
            date: '2024-12-08',
            topic: 'Delivery Speed'
          },
          {
            id: '3',
            customer: 'Mike Brown',
            rating: 2,
            content: 'Customer service response was slow and not very helpful.',
            sentiment: 'negative',
            date: '2024-12-07',
            topic: 'Customer Service'
          },
          {
            id: '4',
            customer: 'Emily Davis',
            rating: 5,
            content: 'Great value for money. Will definitely purchase again.',
            sentiment: 'positive',
            date: '2024-12-07',
            topic: 'Price Value'
          },
          {
            id: '5',
            customer: 'David Wilson',
            rating: 3,
            content: 'Website is user-friendly but checkout process could be improved.',
            sentiment: 'neutral',
            date: '2024-12-06',
            topic: 'Website Experience'
          }
        ],
        surveyResponses: {
          totalSent: 23150,
          totalReceived: 15847,
          responseRate: 68.4,
          averageTimeToComplete: 3.2,
          completionRate: 89.7
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

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'negative': return <ThumbsDown className="h-4 w-4 text-red-600" />;
      default: return <MessageCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Satisfaction Analytics</h2>
          <p className="text-gray-600">Track satisfaction scores, NPS, and customer feedback trends</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="nps">NPS Analysis</SelectItem>
              <SelectItem value="feedback">Feedback Analysis</SelectItem>
              <SelectItem value="surveys">Survey Results</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
                <p className="text-2xl font-bold">{satisfactionData.overviewMetrics.avgSatisfactionScore}/10</p>
                <p className="text-xs text-gray-500">+{satisfactionData.overviewMetrics.satisfactionTrend}% vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Promoter Score</p>
                <p className="text-2xl font-bold">{satisfactionData.overviewMetrics.avgNpsScore}/10</p>
                <p className="text-xs text-gray-500">Promoters: {satisfactionData.overviewMetrics.promoters}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Smile className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">CSAT Score</p>
                <p className="text-2xl font-bold">{satisfactionData.overviewMetrics.avgCsatScore}/5</p>
                <p className="text-xs text-gray-500">Customer satisfaction</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold">{satisfactionData.overviewMetrics.responseRate}%</p>
                <p className="text-xs text-gray-500">Survey participation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nps">NPS Analysis</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="surveys">Surveys</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Satisfaction Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Satisfaction Trends</CardTitle>
              <CardDescription>Monthly satisfaction, NPS, and CSAT score trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={satisfactionData.satisfactionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="satisfaction" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="Satisfaction (1-10)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="nps" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="NPS (0-10)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="csat" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="CSAT (1-5)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Satisfaction by Segment */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Satisfaction by Customer Segment</CardTitle>
                <CardDescription>Average satisfaction scores across customer segments</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={satisfactionData.satisfactionBySegment}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="satisfaction" fill="#EF4444" name="Satisfaction" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback Topics Analysis</CardTitle>
                <CardDescription>Positive vs negative feedback by topic</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {satisfactionData.feedbackTopics.map((topic: any, index: number) => {
                    const positivePercentage = (topic.positive / topic.total) * 100;
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{topic.topic}</span>
                          <span className="text-gray-600">{topic.total} feedback</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${positivePercentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{positivePercentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nps" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>NPS Distribution</CardTitle>
                <CardDescription>Breakdown of Promoters, Passives, and Detractors</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={satisfactionData.npsBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {satisfactionData.npsBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>NPS Metrics</CardTitle>
                <CardDescription>Key NPS performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">
                    +{((satisfactionData.overviewMetrics.promoters - satisfactionData.overviewMetrics.detractors) / 
                       (satisfactionData.overviewMetrics.promoters + satisfactionData.overviewMetrics.passives + satisfactionData.overviewMetrics.detractors) * 100).toFixed(1)}
                  </div>
                  <p className="text-sm text-gray-600">Net Promoter Score</p>
                </div>
                
                <div className="space-y-3">
                  {satisfactionData.npsBreakdown.map((category: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm font-medium">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{category.count.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">{category.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Customer Feedback</CardTitle>
              <CardDescription>Latest customer feedback with sentiment analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {satisfactionData.recentFeedback.map((feedback: any) => (
                  <div key={feedback.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{feedback.customer}</span>
                        <div className="flex">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <Badge className={getSentimentColor(feedback.sentiment)}>
                          {feedback.sentiment}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {getSentimentIcon(feedback.sentiment)}
                        <span>{new Date(feedback.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{feedback.content}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{feedback.topic}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surveys" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Survey Performance</CardTitle>
                <CardDescription>Key survey metrics and performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Surveys Sent</span>
                  <span className="text-sm text-gray-600">{satisfactionData.surveyResponses.totalSent.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Responses</span>
                  <span className="text-sm text-gray-600">{satisfactionData.surveyResponses.totalReceived.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Response Rate</span>
                  <span className="text-sm text-gray-600">{satisfactionData.surveyResponses.responseRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg. Completion Time</span>
                  <span className="text-sm text-gray-600">{satisfactionData.surveyResponses.averageTimeToComplete} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="text-sm text-gray-600">{satisfactionData.surveyResponses.completionRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Survey Types Performance</CardTitle>
                <CardDescription>Response rates by survey type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">Post-Purchase Survey</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">72.3%</div>
                      <div className="text-xs text-gray-600">1,234 responses</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">Annual Satisfaction</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">65.8%</div>
                      <div className="text-xs text-gray-600">856 responses</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">Quarterly Check-in</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">58.4%</div>
                      <div className="text-xs text-gray-600">623 responses</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">Product Feedback</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">69.7%</div>
                      <div className="text-xs text-gray-600">445 responses</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Satisfaction Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Satisfaction Insights & Actions</CardTitle>
          <CardDescription>Key findings and recommended actions based on satisfaction data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">High Satisfaction Segments</h4>
              <p className="text-sm text-green-700 mt-1">
                Champions show 9.2/10 satisfaction. Leverage testimonials and referrals from this group.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800">Improvement Areas</h4>
              <p className="text-sm text-yellow-700 mt-1">
                At Risk customers show declining satisfaction. Address specific pain points quickly.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800">Response Rate Opportunity</h4>
              <p className="text-sm text-blue-700 mt-1">
                68.4% response rate is good, but targeting 75% could provide more actionable insights.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
