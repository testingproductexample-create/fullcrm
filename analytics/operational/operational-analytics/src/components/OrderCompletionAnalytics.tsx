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
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search,
  Clock, 
  Package, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Timer,
  Target,
  Zap,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
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
  ComposedChart,
  Funnel,
  FunnelChart,
  LabelList
} from 'recharts';
import { analyticsService } from '../services/analytics';
import { 
  Order, 
  OrderProcessingStep, 
  FilterOptions, 
  DateRange 
} from '../types/analytics';

const OrderCompletionAnalytics: React.FC = () => {
  const [orderData, setOrderData] = useState<any[]>([]);
  const [bottlenecks, setBottlenecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30days');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const mockOrderData = [
    {
      order_number: 'ORD-2024-001',
      customer_name: 'Acme Corporation',
      order_type: 'standard',
      priority_level: 3,
      status: 'completed',
      order_date: '2024-06-01',
      requested_delivery_date: '2024-06-05',
      actual_delivery_date: '2024-06-04',
      total_amount: 15000,
      estimated_hours: 40,
      actual_hours: 38,
      complexity_score: 7,
      assigned_to: 'John Smith',
      department: 'Production',
      customer_satisfaction_rating: 4.5
    },
    {
      order_number: 'ORD-2024-002',
      customer_name: 'Tech Solutions Inc',
      order_type: 'urgent',
      priority_level: 5,
      status: 'in_production',
      order_date: '2024-06-10',
      requested_delivery_date: '2024-06-15',
      total_amount: 25000,
      estimated_hours: 60,
      actual_hours: 0,
      complexity_score: 9,
      assigned_to: 'Sarah Johnson',
      department: 'Production',
      customer_satisfaction_rating: null
    },
    {
      order_number: 'ORD-2024-003',
      customer_name: 'Global Manufacturing',
      order_type: 'custom',
      priority_level: 4,
      status: 'pending',
      order_date: '2024-06-15',
      requested_delivery_date: '2024-06-25',
      total_amount: 35000,
      estimated_hours: 80,
      actual_hours: 0,
      complexity_score: 8,
      assigned_to: 'Michael Brown',
      department: 'Production',
      customer_satisfaction_rating: null
    }
  ];

  const mockBottleneckData = [
    {
      step_name: 'Material Procurement',
      order_number: 'ORD-2024-002',
      department: 'Procurement',
      actual_duration_minutes: 240,
      estimated_duration_minutes: 120,
      delay_reason: 'Supplier delay',
      impact_score: 8.5,
      status: 'delayed'
    },
    {
      step_name: 'Quality Inspection',
      order_number: 'ORD-2024-003',
      department: 'Quality Control',
      actual_duration_minutes: 180,
      estimated_duration_minutes: 90,
      delay_reason: 'Equipment maintenance',
      impact_score: 7.2,
      status: 'blocked'
    }
  ];

  const mockCompletionTrends = [
    { month: 'Jan', completed: 45, avg_duration: 38, on_time_rate: 89, customer_satisfaction: 4.2 },
    { month: 'Feb', completed: 52, avg_duration: 35, on_time_rate: 92, customer_satisfaction: 4.3 },
    { month: 'Mar', completed: 48, avg_duration: 37, on_time_rate: 87, customer_satisfaction: 4.1 },
    { month: 'Apr', completed: 55, avg_duration: 33, on_time_rate: 94, customer_satisfaction: 4.4 },
    { month: 'May', completed: 51, avg_duration: 36, on_time_rate: 91, customer_satisfaction: 4.3 },
    { month: 'Jun', completed: 58, avg_duration: 32, on_time_rate: 95, customer_satisfaction: 4.5 }
  ];

  const mockOrderStatusDistribution = [
    { name: 'Completed', value: 156, color: '#10b981' },
    { name: 'In Production', value: 43, color: '#3b82f6' },
    { name: 'Pending', value: 28, color: '#f59e0b' },
    { name: 'Delayed', value: 12, color: '#ef4444' },
    { name: 'Cancelled', value: 8, color: '#6b7280' }
  ];

  const mockPriorityAnalysis = [
    { priority: 'Urgent (5)', orders: 25, completion_rate: 78, avg_duration: 24 },
    { priority: 'High (4)', orders: 45, completion_rate: 85, avg_duration: 32 },
    { priority: 'Normal (3)', orders: 89, completion_rate: 92, avg_duration: 38 },
    { priority: 'Low (2)', orders: 34, completion_rate: 94, avg_duration: 45 },
    { priority: 'Lowest (1)', orders: 12, completion_rate: 96, avg_duration: 52 }
  ];

  const mockDepartmentMetrics = [
    { department: 'Production', orders: 89, completion_rate: 87, avg_duration: 35, quality_score: 4.2 },
    { department: 'Quality Control', orders: 89, completion_rate: 92, avg_duration: 8, quality_score: 4.6 },
    { department: 'Packaging', orders: 67, completion_rate: 89, avg_duration: 12, quality_score: 4.1 },
    { department: 'Shipping', orders: 58, completion_rate: 94, avg_duration: 6, quality_score: 4.3 }
  ];

  const mockProcessSteps = [
    { step: 'Order Processing', avg_time: 45, efficiency: 92, bottleneck_risk: 'low' },
    { step: 'Material Procurement', avg_time: 120, efficiency: 78, bottleneck_risk: 'high' },
    { step: 'Production', avg_time: 480, efficiency: 85, bottleneck_risk: 'medium' },
    { step: 'Quality Control', avg_time: 90, efficiency: 88, bottleneck_risk: 'medium' },
    { step: 'Packaging', avg_time: 60, efficiency: 91, bottleneck_risk: 'low' },
    { step: 'Shipping', avg_time: 30, efficiency: 94, bottleneck_risk: 'low' }
  ];

  useEffect(() => {
    loadOrderData();
  }, [selectedStatus, selectedTimeRange, selectedPriority]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      
      // In production, this would use the actual analytics service
      // const orderData = await analyticsService.getOrderCompletionAnalytics(getFilters());
      // const bottlenecks = await analyticsService.identifyBottlenecks(getFilters());
      
      // For now, use mock data
      setOrderData(mockOrderData);
      setBottlenecks(mockBottleneckData);
      
    } catch (err) {
      setError('Failed to load order data');
      console.error('Order data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilters = (): FilterOptions => {
    const now = new Date();
    const days = parseInt(selectedTimeRange.replace('days', ''));
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return {
      timeRange: {
        start: startDate.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      },
      status: selectedStatus !== 'all' ? [selectedStatus] : [],
      priority: selectedPriority !== 'all' ? [parseInt(selectedPriority)] : []
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_production': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-100 text-red-800';
    if (priority === 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getBottleneckRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orderData.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || order.priority_level === parseInt(selectedPriority);
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const calculateMetrics = () => {
    const totalOrders = orderData.length;
    const completedOrders = orderData.filter(o => o.status === 'completed').length;
    const onTimeDeliveries = orderData.filter(o => 
      o.status === 'completed' && 
      o.actual_delivery_date && 
      o.requested_delivery_date &&
      new Date(o.actual_delivery_date) <= new Date(o.requested_delivery_date)
    ).length;
    
    const avgDuration = orderData
      .filter(o => o.actual_hours && o.estimated_hours)
      .reduce((sum, o) => sum + (o.actual_hours / o.estimated_hours), 0) / totalOrders;
    
    const avgSatisfaction = orderData
      .filter(o => o.customer_satisfaction_rating)
      .reduce((sum, o) => sum + o.customer_satisfaction_rating, 0) / 
      orderData.filter(o => o.customer_satisfaction_rating).length;

    return {
      totalOrders,
      completionRate: (completedOrders / totalOrders) * 100,
      onTimeRate: (onTimeDeliveries / completedOrders) * 100,
      avgDurationRatio: avgDuration * 100,
      avgSatisfaction: avgSatisfaction || 0
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order completion data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Error Loading Order Data</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadOrderData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Completion Analytics</h1>
          <p className="text-gray-600 mt-1">
            Track order completion times, identify bottlenecks, and optimize workflow efficiency
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_production">In Production</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="5">Urgent (5)</SelectItem>
                <SelectItem value="4">High (4)</SelectItem>
                <SelectItem value="3">Normal (3)</SelectItem>
                <SelectItem value="2">Low (2)</SelectItem>
                <SelectItem value="1">Lowest (1)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="365days">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadOrderData} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <Badge variant="secondary">{filteredOrders.length} in filter</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.completionRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4">
              <Progress value={metrics.completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On-Time Delivery</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.onTimeRate.toFixed(1)}%</p>
              </div>
              <Timer className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-4">
              <Progress value={metrics.onTimeRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.avgDurationRatio.toFixed(0)}%</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-4">
              <Badge variant="secondary">vs estimated</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.avgSatisfaction.toFixed(1)}/5</p>
              </div>
              <Target className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="mt-4">
              <Progress value={(metrics.avgSatisfaction / 5) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="completion">Completion Trends</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
          <TabsTrigger value="priority">Priority Analysis</TabsTrigger>
          <TabsTrigger value="departments">Department Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Current distribution of order statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockOrderStatusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {mockOrderStatusDistribution.map((entry, index) => (
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
                <CardTitle>Process Step Efficiency</CardTitle>
                <CardDescription>Efficiency metrics for each process step</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockProcessSteps}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="efficiency" fill="#10b981" name="Efficiency %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Satisfaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.order_number}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell className="capitalize">{order.order_type}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(order.priority_level)}>
                          {order.priority_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.assigned_to}</TableCell>
                      <TableCell>
                        {order.actual_hours ? `${order.actual_hours}h / ${order.estimated_hours}h` : 'In progress'}
                      </TableCell>
                      <TableCell>
                        {order.customer_satisfaction_rating ? 
                          `${order.customer_satisfaction_rating}/5` : 'N/A'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completion Trends Tab */}
        <TabsContent value="completion" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Completion Trends</CardTitle>
                <CardDescription>Monthly order completion rates and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={mockCompletionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="completed" fill="#3b82f6" name="Orders Completed" />
                    <Line yAxisId="right" type="monotone" dataKey="on_time_rate" stroke="#10b981" strokeWidth={2} name="On-Time Rate %" />
                    <Line yAxisId="right" type="monotone" dataKey="customer_satisfaction" stroke="#f59e0b" strokeWidth={2} name="Satisfaction" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Duration Trends</CardTitle>
                <CardDescription>Order processing duration over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockCompletionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="avg_duration" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                      name="Avg Duration (hours)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bottlenecks Tab */}
        <TabsContent value="bottlenecks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Bottlenecks</CardTitle>
                <CardDescription>Current process bottlenecks requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="p-4 border rounded-lg border-l-4 border-l-red-500 bg-red-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-red-900">{bottleneck.step_name}</h4>
                        <Badge variant="destructive">Impact: {bottleneck.impact_score}/10</Badge>
                      </div>
                      <p className="text-sm text-red-700 mb-1">
                        <strong>Order:</strong> {bottleneck.order_number}
                      </p>
                      <p className="text-sm text-red-700 mb-1">
                        <strong>Department:</strong> {bottleneck.department}
                      </p>
                      <p className="text-sm text-red-700 mb-2">
                        <strong>Delay:</strong> {bottleneck.actual_duration_minutes}min vs {bottleneck.estimated_duration_minutes}min estimated
                      </p>
                      <p className="text-sm text-red-600">
                        <strong>Reason:</strong> {bottleneck.delay_reason}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bottleneck Impact Analysis</CardTitle>
                <CardDescription>Process steps with highest bottleneck risk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockProcessSteps.map((step, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{step.step}</h4>
                        <p className="text-sm text-gray-600">{step.avg_time}min average</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getBottleneckRiskColor(step.bottleneck_risk)}>
                          {step.bottleneck_risk} risk
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">{step.efficiency}% efficient</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Priority Analysis Tab */}
        <TabsContent value="priority" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Priority Level Analysis</CardTitle>
              <CardDescription>Order metrics by priority level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={mockPriorityAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="priority" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" fill="#3b82f6" name="Total Orders" />
                  <Line yAxisId="right" type="monotone" dataKey="completion_rate" stroke="#10b981" strokeWidth={2} name="Completion Rate %" />
                  <Line yAxisId="right" type="monotone" dataKey="avg_duration" stroke="#f59e0b" strokeWidth={2} name="Avg Duration (hours)" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Department Performance Tab */}
        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance Metrics</CardTitle>
              <CardDescription>Performance comparison across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDepartmentMetrics.map((dept, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold">{dept.department}</h3>
                      <div className="flex space-x-4 text-sm">
                        <span className="text-gray-600">{dept.orders} orders</span>
                        <span className="text-green-600">{dept.completion_rate}% completion</span>
                        <span className="text-blue-600">{dept.quality_score}/5 quality</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Completion Rate</p>
                        <Progress value={dept.completion_rate} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">{dept.completion_rate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg Duration</p>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{dept.avg_duration}h</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Quality Score</p>
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{dept.quality_score}/5</span>
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
    </div>
  );
};

export default OrderCompletionAnalytics;
