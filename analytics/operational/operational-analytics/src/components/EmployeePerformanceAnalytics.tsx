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
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Award,
  Target,
  BarChart3,
  Filter,
  Download,
  Eye,
  Edit
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter
} from 'recharts';
import { analyticsService } from '../services/analytics';
import { 
  PerformanceMetric, 
  Employee, 
  PerformanceSummary, 
  FilterOptions, 
  DateRange 
} from '../types/analytics';

const EmployeePerformanceAnalytics: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceSummary[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30days');
  const [selectedMetric, setSelectedMetric] = useState('overall_performance_score');
  const [departments, setDepartments] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const mockEmployeeData = [
    {
      employee_id: 'EMP001',
      first_name: 'John',
      last_name: 'Smith',
      department: 'Production',
      position: 'Senior Technician',
      overall_performance_score: 92,
      productivity_score: 89,
      quality_rating: 4.8,
      time_efficiency_score: 94,
      goal_achievement_rate: 95,
      performance_trend: 'improving',
      overtime_hours: 8,
      goals_set: 20,
      goals_achieved: 19
    },
    {
      employee_id: 'EMP002',
      first_name: 'Sarah',
      last_name: 'Johnson',
      department: 'Quality Control',
      position: 'Quality Inspector',
      overall_performance_score: 88,
      productivity_score: 92,
      quality_rating: 4.9,
      time_efficiency_score: 86,
      goal_achievement_rate: 90,
      performance_trend: 'stable',
      overtime_hours: 4,
      goals_set: 18,
      goals_achieved: 16
    },
    {
      employee_id: 'EMP003',
      first_name: 'Michael',
      last_name: 'Brown',
      department: 'Customer Service',
      position: 'Customer Service Rep',
      overall_performance_score: 85,
      productivity_score: 87,
      quality_rating: 4.5,
      time_efficiency_score: 88,
      goal_achievement_rate: 82,
      performance_trend: 'improving',
      overtime_hours: 12,
      goals_set: 15,
      goals_achieved: 12
    },
    {
      employee_id: 'EMP004',
      first_name: 'Emily',
      last_name: 'Davis',
      department: 'Production',
      position: 'Machine Operator',
      overall_performance_score: 78,
      productivity_score: 75,
      quality_rating: 4.1,
      time_efficiency_score: 80,
      goal_achievement_rate: 78,
      performance_trend: 'declining',
      overtime_hours: 16,
      goals_set: 22,
      goals_achieved: 17
    }
  ];

  const mockPerformanceTrends = [
    { month: 'Jan', average: 82, productivity: 80, quality: 4.2, efficiency: 85 },
    { month: 'Feb', average: 84, productivity: 82, quality: 4.3, efficiency: 87 },
    { month: 'Mar', average: 86, productivity: 85, quality: 4.4, efficiency: 88 },
    { month: 'Apr', average: 88, productivity: 87, quality: 4.5, efficiency: 90 },
    { month: 'May', average: 85, productivity: 84, quality: 4.3, efficiency: 87 },
    { month: 'Jun', average: 89, productivity: 88, quality: 4.6, efficiency: 91 }
  ];

  const mockDepartmentComparison = [
    { department: 'Production', avg_performance: 85, employee_count: 45, top_scorer: 92 },
    { department: 'Quality Control', avg_performance: 89, employee_count: 12, top_scorer: 94 },
    { department: 'Customer Service', avg_performance: 83, employee_count: 28, top_scorer: 88 },
    { department: 'Administration', avg_performance: 87, employee_count: 15, top_scorer: 90 },
    { department: 'Maintenance', avg_performance: 86, employee_count: 8, top_scorer: 89 }
  ];

  const mockRadarData = [
    { metric: 'Productivity', John: 89, Sarah: 92, Michael: 87, Emily: 75 },
    { metric: 'Quality', John: 96, Sarah: 98, Michael: 90, Emily: 82 },
    { metric: 'Efficiency', John: 94, Sarah: 86, Michael: 88, Emily: 80 },
    { metric: 'Collaboration', John: 88, Sarah: 91, Michael: 85, Emily: 78 },
    { metric: 'Innovation', John: 85, Sarah: 89, Michael: 82, Emily: 75 },
    { metric: 'Leadership', John: 90, Sarah: 87, Michael: 80, Emily: 72 }
  ];

  useEffect(() => {
    loadPerformanceData();
  }, [selectedDepartment, selectedTimeRange]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // In production, this would use the actual analytics service
      // const performanceData = await analyticsService.getEmployeePerformance(getFilters());
      // const topPerformers = await analyticsService.getTopPerformers(10, selectedDepartment === 'all' ? undefined : selectedDepartment);
      
      // For now, use mock data
      setPerformanceData(mockDepartmentComparison);
      setTopPerformers(mockEmployeeData);
      setDepartments([
        'All Departments',
        'Production',
        'Quality Control', 
        'Customer Service',
        'Administration',
        'Maintenance'
      ]);
      
    } catch (err) {
      setError('Failed to load performance data');
      console.error('Performance data loading error:', err);
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

  const getPerformanceTrend = (trend: string) => {
    switch (trend) {
      case 'improving':
        return { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' };
      case 'declining':
        return { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' };
      default:
        return { icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' };
    }
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'bg-green-500', textColor: 'text-green-700' };
    if (score >= 80) return { level: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (score >= 70) return { level: 'Average', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { level: 'Needs Improvement', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const filteredEmployees = topPerformers.filter(employee => {
    const matchesSearch = searchTerm === '' || 
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || 
      employee.department.toLowerCase() === selectedDepartment.toLowerCase();
    
    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Error Loading Performance Data</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadPerformanceData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Performance Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analysis of employee productivity, efficiency, and goal achievement
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
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
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
            <Button onClick={loadPerformanceData} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{topPerformers.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="secondary">{topPerformers.filter(e => e.department === selectedDepartment || selectedDepartment === 'all').length} in filter</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Performance</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(topPerformers.reduce((sum, e) => sum + e.overall_performance_score, 0) / topPerformers.length).toFixed(1)}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="secondary">Out of 100</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Top Performers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {topPerformers.filter(e => e.overall_performance_score >= 90).length}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="secondary">Score ≥ 90</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Goal Achievement</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round((topPerformers.reduce((sum, e) => sum + e.goal_achievement_rate, 0) / topPerformers.length))}%
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-4">
                  <Badge variant="secondary">Average rate</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Department Performance Summary</CardTitle>
              <CardDescription>Performance metrics by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockDepartmentComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg_performance" fill="#3b82f6" name="Avg Performance" />
                  <Bar dataKey="top_scorer" fill="#10b981" name="Top Scorer" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Monthly performance trends across all employees</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockPerformanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="average" stroke="#3b82f6" strokeWidth={2} name="Average Performance" />
                    <Line type="monotone" dataKey="productivity" stroke="#10b981" strokeWidth={2} name="Productivity" />
                    <Line type="monotone" dataKey="efficiency" stroke="#f59e0b" strokeWidth={2} name="Efficiency" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Multi-Dimensional Analysis</CardTitle>
                <CardDescription>Employee performance across different metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={mockRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={60} domain={[0, 100]} />
                    <Radar name="John" dataKey="John" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                    <Radar name="Sarah" dataKey="Sarah" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                    <Radar name="Michael" dataKey="Michael" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                    <Radar name="Emily" dataKey="Emily" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Performance Details</CardTitle>
              <CardDescription>Detailed performance metrics for all employees</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Performance Score</TableHead>
                    <TableHead>Productivity</TableHead>
                    <TableHead>Quality Rating</TableHead>
                    <TableHead>Goal Achievement</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => {
                    const trend = getPerformanceTrend(employee.performance_trend);
                    const level = getPerformanceLevel(employee.overall_performance_score);
                    const TrendIcon = trend.icon;
                    
                    return (
                      <TableRow key={employee.employee_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                            <p className="text-sm text-gray-500">{employee.employee_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{employee.overall_performance_score}</span>
                            <Badge className={`${level.color} text-white`}>
                              {level.level}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{employee.productivity_score}</TableCell>
                        <TableCell>{employee.quality_rating}/5</TableCell>
                        <TableCell>{employee.goal_achievement_rate}%</TableCell>
                        <TableCell>
                          <div className={`flex items-center space-x-1 ${trend.color}`}>
                            <TrendIcon className="h-4 w-4" />
                            <span className="text-sm capitalize">{employee.performance_trend}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Rating Trends</CardTitle>
                <CardDescription>Employee quality ratings over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockPerformanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[4, 5]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="quality" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Quality Rating"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance vs. Overtime</CardTitle>
                <CardDescription>Correlation between performance and overtime hours</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={topPerformers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="overtime_hours" name="Overtime Hours" />
                    <YAxis dataKey="overall_performance_score" name="Performance Score" />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded shadow">
                              <p>{`${data.first_name} ${data.last_name}`}</p>
                              <p>{`Performance: ${data.overall_performance_score}`}</p>
                              <p>{`Overtime: ${data.overtime_hours} hours`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter dataKey="overall_performance_score" fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Goal Achievement Overview</CardTitle>
                <CardDescription>Goals set vs. goals achieved by employee</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformers.map((employee) => (
                    <div key={employee.employee_id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{employee.first_name} {employee.last_name}</h4>
                        <Badge variant="secondary">
                          {employee.goals_achieved}/{employee.goals_set} goals
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(employee.goals_achievement_rate)}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {employee.goal_achievement_rate}% achievement rate
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goals by Department</CardTitle>
                <CardDescription>Goal achievement rates by department</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockDepartmentComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avg_performance" fill="#8b5cf6" name="Performance Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeePerformanceAnalytics;
