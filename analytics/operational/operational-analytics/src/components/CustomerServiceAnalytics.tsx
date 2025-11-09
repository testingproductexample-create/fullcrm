import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomerServiceAnalytics: React.FC = () => {
  const mockServiceData = [
    { month: 'Jan', response_time: 45, satisfaction: 4.1, resolution_rate: 87 },
    { month: 'Feb', response_time: 42, satisfaction: 4.2, resolution_rate: 89 },
    { month: 'Mar', response_time: 38, satisfaction: 4.3, resolution_rate: 91 },
    { month: 'Apr', response_time: 35, satisfaction: 4.4, resolution_rate: 92 },
    { month: 'May', response_time: 32, satisfaction: 4.5, resolution_rate: 94 },
    { month: 'Jun', response_time: 28, satisfaction: 4.6, resolution_rate: 95 }
  ];

  const mockChannelPerformance = [
    { channel: 'Phone', interactions: 450, satisfaction: 4.5, avg_time: 25 },
    { channel: 'Email', interactions: 380, satisfaction: 4.2, avg_time: 45 },
    { channel: 'Chat', interactions: 320, satisfaction: 4.7, avg_time: 15 },
    { channel: 'In-Person', interactions: 150, satisfaction: 4.8, avg_time: 35 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Performance Trends</CardTitle>
            <CardDescription>Response time and satisfaction metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockServiceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="response_time" stroke="#ef4444" name="Response Time (min)" />
                <Line yAxisId="right" type="monotone" dataKey="satisfaction" stroke="#10b981" name="Satisfaction" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channel Performance</CardTitle>
            <CardDescription>Performance by communication channel</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockChannelPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="interactions" fill="#3b82f6" name="Interactions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Service KPIs</CardTitle>
          <CardDescription>Key performance indicators for customer service</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Total Interactions</h4>
              <p className="text-2xl font-bold text-blue-600">1,300</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">Avg Response Time</h4>
              <p className="text-2xl font-bold text-green-600">28 min</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900">Resolution Rate</h4>
              <p className="text-2xl font-bold text-purple-600">95%</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900">Satisfaction</h4>
              <p className="text-2xl font-bold text-orange-600">4.6/5</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-900">Escalations</h4>
              <p className="text-2xl font-bold text-red-600">23</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerServiceAnalytics;
