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
  CalendarDays, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  DollarSign, 
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Zap
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
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

// Type-safe Recharts component aliases to fix JSX component issues
const SafeLineChart = LineChart as React.ComponentType<any>;
const SafeLine = Line as React.ComponentType<any>;
const SafeAreaChart = AreaChart as React.ComponentType<any>;
const SafeArea = Area as React.ComponentType<any>;
const SafeBarChart = BarChart as React.ComponentType<any>;
const SafeBar = Bar as React.ComponentType<any>;
const SafeXAxis = XAxis as React.ComponentType<any>;
const SafeYAxis = YAxis as React.ComponentType<any>;
const SafeCartesianGrid = CartesianGrid as React.ComponentType<any>;
const SafeTooltip = Tooltip as React.ComponentType<any>;
const SafeLegend = Legend as React.ComponentType<any>;
const SafeResponsiveContainer = ResponsiveContainer as React.ComponentType<any>;
const SafePieChart = RechartsPieChart as React.ComponentType<any>;
const SafePie = Pie as React.ComponentType<any>;
const SafeCell = Cell as React.ComponentType<any>;
import { analyticsService } from '../services/analytics';
import { DashboardSummary, KPIMetric, FilterOptions, DateRange } from '../types/analytics';

// Color palette for charts
const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  warning: '#f97316',
  info: '#06b6d4',
  success: '#22c55e',
  purple: '#8b5cf6',
  pink: '#ec4899'
};

const CHART_COLORS = [
  COLORS.primary, 
  COLORS.secondary, 
  COLORS.accent, 
  COLORS.danger, 
  COLORS.warning, 
  COLORS.info,
  COLORS.success,
  COLORS.purple
];

const OperationalDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30days');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);

  // Mock data for demonstration - in production this would come from analytics service
  const mockKpiData = [
    { name: 'Employee Productivity', value: 87, target: 90, unit: '%', trend: 'up', trend_percentage: 5.2, color: 'green' },
    { name: 'Order Completion Rate', value: 94, target: 95, unit: '%', trend: 'up', trend_percentage: 2.1, color: 'green' },
    { name: 'Resource Utilization', value: 78, target: 85, unit: '%', trend: 'down', trend_percentage: -3.4, color: 'yellow' },
    { name: 'Quality Score', value: 4.2, target: 4.5, unit: '/5', trend: 'stable', trend_percentage: 0.8, color: 'green' },
    { name: 'Cost Efficiency', value: 82, target: 90, unit: '%', trend: 'up', trend_percentage: 4.1, color: 'yellow' },
    { name: 'SLA Compliance', value: 96, target: 98, unit: '%', trend: 'up', trend_percentage: 1.2, color: 'green' }
  ];

  const mockPerformanceData = [
    { month: 'Jan', performance: 85, productivity: 82, quality: 4.1 },
    { month: 'Feb', performance: 87, productivity: 84, quality: 4.2 },
    { month: 'Mar', performance: 89, productivity: 86, quality: 4.3 },
    { month: 'Apr', performance: 91, productivity: 88, quality: 4.4 },
    { month: 'May', performance: 87, productivity: 85, quality: 4.2 },
    { month: 'Jun', performance: 92, productivity: 90, quality: 4.5 }
  ];

  const mockResourceUtilization = [
    { name: 'Equipment', utilization: 85, efficiency: 88, cost: 45 },
    { name: 'Staff', utilization: 78, efficiency: 82, cost: 32 },
    { name: 'Facilities', utilization: 65, efficiency: 75, cost: 28 },
    { name: 'Technology', utilization: 92, efficiency: 90, cost: 55 }
  ];

  const mockDepartmentData = [
    { name: 'Production', employees: 45, performance: 88, efficiency: 85 },
    { name: 'Quality Control', employees: 12, performance: 92, efficiency: 90 },
    { name: 'Customer Service', employees: 28, performance: 85, efficiency: 88 },
    { name: 'Administration', employees: 15, performance: 82, efficiency: 80 },
    { name: 'Maintenance', employees: 8, performance: 90, efficiency: 87 }
  ];

  const mockOrderMetrics = [
    { status: 'Completed', count: 156, color: COLORS.success },
    { status: 'In Progress', count: 43, color: COLORS.primary },
    { status: 'Pending', count: 28, color: COLORS.warning },
    { status: 'Delayed', count: 12, color: COLORS.danger }
  ];

  const mockAlertsData = [
    { type: 'Critical', count: 3, color: COLORS.danger },
    { type: 'High', count: 7, color: COLORS.warning },
    { type: 'Medium', count: 12, color: COLORS.accent },
    { type: 'Low', count: 18, color: COLORS.info }
  ];

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange, selectedDepartment]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // In production, this would use the actual analytics service
      // const dashboardData = await analyticsService.getDashboardSummary();
      // const kpiMetrics = await analyticsService.getKpiMetrics(getFilters());
      
      // For now, use mock data
      setDashboardData({
        total_employees: 108,
        active_employees: 103,
        avg_performance_score: 87.5,
        total_orders_today: 45,
        orders_completed_today: 38,
        resource_utilization_rate: 78.5,
        quality_score_average: 4.2,
        cost_efficiency_index: 82.3,
        active_alerts: 40,
        critical_alerts: 3
      });
      
      setKpiMetrics(mockKpiData);
      
      // Set departments
      setDepartments([
        'All Departments',
        'Production',
        'Quality Control', 
        'Customer Service',
        'Administration',
        'Maintenance'
      ]);
      
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data loading error:', err);
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
      departments: selectedDepartment !== 'all' ? [selectedDepartment] : []
    };
  };

  const getKpiIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'employee productivity':
        return <Users className="h-4 w-4" />;
      case 'order completion rate':
        return <CheckCircle className="h-4 w-4" />;
      case 'resource utilization':
        return <BarChart3 className="h-4 w-4" />;
      case 'quality score':
        return <Target className="h-4 w-4" />;
      case 'cost efficiency':
        return <DollarSign className="h-4 w-4" />;
      case 'sla compliance':
        return <Zap className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getPerformanceColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600 bg-green-50 border-green-200';
      case 'yellow': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'red': return 'text-red-600 bg-red-50 border-red-200';
      case 'blue': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading operational analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-2">Error Loading Dashboard</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operational Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time insights into business performance and efficiency metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
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
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept.toLowerCase().replace(' ', '_')}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={loadDashboardData} variant="outline">
            <CalendarDays className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiMetrics.map((kpi, index) => (
          <Card key={index} className="relative">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  {getKpiIcon(kpi.name)}
                </div>
                <div className="flex items-center text-sm">
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : kpi.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  ) : (
                    <Activity className="h-3 w-3 text-gray-500 mr-1" />
                  )}
                  <span className={kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'}>
                    {Math.abs(kpi.trend_percentage).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {kpi.value}{kpi.unit}
                </p>
                <p className="text-sm text-gray-600">{kpi.name}</p>
                <p className="text-xs text-gray-500">
                  Target: {kpi.target}{kpi.unit}
                </p>
              </div>
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium border ${getPerformanceColor(kpi.color)}`}>
                {kpi.achievement_rate.toFixed(0)}%
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Monthly performance metrics overview</CardDescription>
              </CardHeader>
              <CardContent>
                <SafeResponsiveContainer width="100%" height={300}>
                  <SafeLineChart data={mockPerformanceData}>
                    <SafeCartesianGrid strokeDasharray="3 3" />
                    <SafeXAxis dataKey="month" />
                    <SafeYAxis />
                    <SafeTooltip />
                    <SafeLegend />
                    <SafeLine 
                      type="monotone" 
                      dataKey="performance" 
                      stroke={COLORS.primary} 
                      strokeWidth={2}
                      name="Overall Performance"
                    />
                    <SafeLine 
                      type="monotone" 
                      dataKey="productivity" 
                      stroke={COLORS.secondary} 
                      strokeWidth={2}
                      name="Productivity"
                    />
                    <SafeLine 
                      type="monotone" 
                      dataKey="quality" 
                      stroke={COLORS.accent} 
                      strokeWidth={2}
                      name="Quality Score"
                    />
                  </SafeLineChart>
                </SafeResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Performance by department</CardDescription>
              </CardHeader>
              <CardContent>
                <SafeResponsiveContainer width="100%" height={300}>
                  <SafeBarChart data={mockDepartmentData}>
                    <SafeCartesianGrid strokeDasharray="3 3" />
                    <SafeXAxis dataKey="name" />
                    <SafeYAxis />
                    <SafeTooltip />
                    <SafeBar dataKey="performance" fill={COLORS.primary} name="Performance Score" />
                  </SafeBarChart>
                </SafeResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData?.total_employees}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="secondary">{dashboardData?.active_employees} active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Orders Today</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData?.total_orders_today}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="secondary">{dashboardData?.orders_completed_today} completed</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Resource Utilization</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData?.resource_utilization_rate}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="secondary">85% target</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData?.active_alerts}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="destructive">{dashboardData?.critical_alerts} critical</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Utilization</CardTitle>
                <CardDescription>Time tracking and productivity analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <SafeResponsiveContainer width="100%" height={300}>
                  <SafeAreaChart data={mockPerformanceData}>
                    <SafeCartesianGrid strokeDasharray="3 3" />
                    <SafeXAxis dataKey="month" />
                    <SafeYAxis />
                    <SafeTooltip />
                    <SafeArea 
                      type="monotone" 
                      dataKey="productivity" 
                      stroke={COLORS.primary} 
                      fill={COLORS.primary}
                      fillOpacity={0.3}
                    />
                  </SafeAreaChart>
                </SafeResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Efficiency</CardTitle>
                <CardDescription>Efficiency comparison across departments</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockDepartmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="efficiency" fill={COLORS.secondary} name="Efficiency Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>Utilization rates by resource type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockResourceUtilization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="utilization" fill={COLORS.accent} name="Utilization %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Efficiency</CardTitle>
                <CardDescription>Cost per hour by resource type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockResourceUtilization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke={COLORS.danger} 
                      strokeWidth={3}
                      name="Cost per Hour ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Current order status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={mockOrderMetrics}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {mockOrderMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflow Efficiency</CardTitle>
                <CardDescription>Process completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Order Processing</span>
                    <span className="text-sm text-gray-600">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Quality Control</span>
                    <span className="text-sm text-gray-600">87%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Delivery</span>
                    <span className="text-sm text-gray-600">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>Quality score trends and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[3.5, 5]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="quality" 
                      stroke={COLORS.success} 
                      strokeWidth={3}
                      name="Quality Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Defect Analysis</CardTitle>
                <CardDescription>Defect tracking and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-red-900">Critical Defects</p>
                      <p className="text-sm text-red-700">Requires immediate attention</p>
                    </div>
                    <Badge variant="destructive">5</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-orange-900">Major Defects</p>
                      <p className="text-sm text-orange-700">Action required within 24h</p>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">18</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-yellow-900">Minor Defects</p>
                      <p className="text-sm text-yellow-700">Monitor and track</p>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">34</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>Current alert distribution by severity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={mockAlertsData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      dataKey="count"
                      label={({ name, count }) => `${name}: ${count}`}
                    >
                      {mockAlertsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Latest operational alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border-l-4 border-red-500 bg-red-50">
                    <div>
                      <p className="font-medium text-red-900">High Resource Utilization</p>
                      <p className="text-sm text-red-700">Equipment utilization above 90%</p>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border-l-4 border-orange-500 bg-orange-50">
                    <div>
                      <p className="font-medium text-orange-900">SLA Warning</p>
                      <p className="text-sm text-orange-700">Order #12345 approaching SLA limit</p>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">High</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border-l-4 border-yellow-500 bg-yellow-50">
                    <div>
                      <p className="font-medium text-yellow-900">Quality Threshold</p>
                      <p className="text-sm text-yellow-700">Quality score below target</p>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OperationalDashboard;
