import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Workflow, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Target,
  BarChart3,
  Zap
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';

const WorkflowAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const mockWorkflowData = [
    { name: 'Order Processing', completion_rate: 94, avg_time: 2.5, efficiency: 88, status: 'healthy' },
    { name: 'Quality Control', completion_rate: 87, avg_time: 1.8, efficiency: 85, status: 'warning' },
    { name: 'Delivery', completion_rate: 92, avg_time: 3.2, efficiency: 90, status: 'healthy' },
    { name: 'Customer Service', completion_rate: 89, avg_time: 1.5, efficiency: 87, status: 'healthy' }
  ];

  const mockBottlenecks = [
    { step: 'Material Procurement', impact: 8.5, frequency: 15, department: 'Procurement' },
    { step: 'Quality Inspection', impact: 7.2, frequency: 8, department: 'QC' },
    { step: 'Final Approval', impact: 6.8, frequency: 12, department: 'Management' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Efficiency</CardTitle>
            <CardDescription>Process completion rates and efficiency metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockWorkflowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completion_rate" fill="#3b82f6" name="Completion Rate %" />
                <Bar dataKey="efficiency" fill="#10b981" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Process Bottlenecks</CardTitle>
            <CardDescription>Identified process bottlenecks with impact analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockBottlenecks.map((bottleneck, index) => (
                <div key={index} className="p-4 border rounded-lg border-l-4 border-l-orange-500">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{bottleneck.step}</h4>
                    <Badge variant="secondary">Impact: {bottleneck.impact}/10</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Department: {bottleneck.department} • Frequency: {bottleneck.frequency} times/month
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Optimization Recommendations</CardTitle>
          <CardDescription>AI-powered suggestions for process improvement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Zap className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-medium text-blue-900">Automation Opportunity</h4>
              <p className="text-sm text-blue-700">Automate material requisition process to reduce delays</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
              <h4 className="font-medium text-green-900">Quality Check</h4>
              <p className="text-sm text-green-700">Implement pre-delivery quality verification</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <Target className="h-8 w-8 text-purple-600 mb-2" />
              <h4 className="font-medium text-purple-900">Resource Allocation</h4>
              <p className="text-sm text-purple-700">Add quality control resources during peak hours</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowAnalytics;
