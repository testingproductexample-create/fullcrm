import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const QualityControlAnalytics: React.FC = () => {
  const mockQualityData = [
    { month: 'Jan', quality_score: 4.1, defects: 12, inspections: 250 },
    { month: 'Feb', quality_score: 4.3, defects: 8, inspections: 280 },
    { month: 'Mar', quality_score: 4.2, defects: 10, inspections: 275 },
    { month: 'Apr', quality_score: 4.4, defects: 6, inspections: 290 },
    { month: 'May', quality_score: 4.5, defects: 5, inspections: 310 },
    { month: 'Jun', quality_score: 4.6, defects: 4, inspections: 320 }
  ];

  const mockDefectTypes = [
    { type: 'Critical', count: 5, color: '#ef4444' },
    { type: 'Major', count: 18, color: '#f97316' },
    { type: 'Minor', count: 34, color: '#eab308' },
    { type: 'Cosmetic', count: 22, color: '#3b82f6' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quality Score Trends</CardTitle>
            <CardDescription>Quality performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockQualityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[3.5, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="quality_score" stroke="#10b981" strokeWidth={3} name="Quality Score" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Defect Analysis</CardTitle>
            <CardDescription>Defect distribution by severity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={mockDefectTypes} cx="50%" cy="50%" outerRadius={100} dataKey="count" label>
                  {mockDefectTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quality Control Performance</CardTitle>
          <CardDescription>Key quality metrics and performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">Pass Rate</h4>
              <p className="text-2xl font-bold text-green-600">94.2%</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Inspections</h4>
              <p className="text-2xl font-bold text-blue-600">1,725</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900">Defect Rate</h4>
              <p className="text-2xl font-bold text-orange-600">3.8%</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900">Customer Complaints</h4>
              <p className="text-2xl font-bold text-purple-600">12</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityControlAnalytics;
