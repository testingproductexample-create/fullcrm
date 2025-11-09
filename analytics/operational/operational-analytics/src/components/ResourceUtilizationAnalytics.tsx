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
  Monitor, 
  Wrench, 
  Settings, 
  Truck, 
  Building,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Clock,
  Zap,
  BarChart3,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { analyticsService } from '../services/analytics';
import { 
  Resource, 
  ResourceUtilization, 
  ResourceUtilizationSummary, 
  FilterOptions, 
  DateRange 
} from '../types/analytics';

const ResourceUtilizationAnalytics: React.FC = () => {
  const [resourceData, setResourceData] = useState<ResourceUtilizationSummary[]>([]);
  const [resourceList, setResourceList] = useState<Resource[]>([]);
  const [utilizationTrends, setUtilizationTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResourceType, setSelectedResourceType] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30days');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const mockResourceData = [
    {
      resource_type: 'Equipment',
      total_resources: 24,
      utilization_rate: 78.5,
      efficiency_score: 82.3,
      cost_per_hour: 45.50,
      roi_percentage: 156.7,
      maintenance_required: 3,
      downtime_hours: 12.5
    },
    {
      resource_type: 'Staff',
      total_resources: 108,
      utilization_rate: 85.2,
      efficiency_score: 88.1,
      cost_per_hour: 32.75,
      roi_percentage: 145.3,
      maintenance_required: 0,
      downtime_hours: 0
    },
    {
      resource_type: 'Facilities',
      total_resources: 8,
      utilization_rate: 65.4,
      efficiency_score: 75.8,
      cost_per_hour: 28.90,
      roi_percentage: 134.2,
      maintenance_required: 1,
      downtime_hours: 4.2
    },
    {
      resource_type: 'Technology',
      total_resources: 45,
      utilization_rate: 92.1,
      efficiency_score: 90.5,
      cost_per_hour: 55.20,
      roi_percentage: 178.9,
      maintenance_required: 2,
      downtime_hours: 3.1
    }
  ];

  const mockResourceList = [
    {
      resource_id: 'EQ001',
      resource_name: 'CNC Machine A1',
      resource_type: 'Equipment',
      category: 'Manufacturing',
      status: 'available',
      utilization_rate: 85.2,
      efficiency_score: 88.5,
      location: 'Production Floor A',
      purchase_date: '2022-03-15',
      current_value: 125000,
      last_maintenance: '2024-05-15',
      next_maintenance: '2024-08-15'
    },
    {
      resource_id: 'EQ002',
      resource_name: 'Quality Scanner Q1',
      resource_type: 'Equipment',
      category: 'Quality Control',
      status: 'maintenance',
      utilization_rate: 0,
      efficiency_score: 0,
      location: 'QC Department',
      purchase_date: '2023-01-20',
      current_value: 45000,
      last_maintenance: '2024-06-01',
      next_maintenance: '2024-07-01'
    },
    {
      resource_id: 'SW001',
      resource_name: 'ERP System License',
      resource_type: 'Technology',
      category: 'Software',
      status: 'available',
      utilization_rate: 95.8,
      efficiency_score: 92.3,
      location: 'Server Room',
      purchase_date: '2023-06-10',
      current_value: 85000,
      last_maintenance: '2024-06-01',
      next_maintenance: '2024-07-01'
    }
  ];

  const mockUtilizationTrends = [
    { week: 'Week 1', equipment: 76, staff: 82, facilities: 68, technology: 89 },
    { week: 'Week 2', equipment: 78, staff: 85, facilities: 71, technology: 91 },
    { week: 'Week 3', equipment: 74, staff: 83, facilities: 69, technology: 88 },
    { week: 'Week 4', equipment: 80, staff: 87, facilities: 73, technology: 93 },
    { week: 'Week 5', equipment: 82, staff: 88, facilities: 75, technology: 95 },
    { week: 'Week 6', equipment: 79, staff: 86, facilities: 72, technology: 92 }
  ];

  const mockCostAnalysis = [
    { resource_type: 'Equipment', total_cost: 15600, cost_per_hour: 45.50, efficiency: 82.3, utilization: 78.5 },
    { resource_type: 'Staff', total_cost: 42800, cost_per_hour: 32.75, efficiency: 88.1, utilization: 85.2 },
    { resource_type: 'Facilities', total_cost: 8900, cost_per_hour: 28.90, efficiency: 75.8, utilization: 65.4 },
    { resource_type: 'Technology', total_cost: 12300, cost_per_hour: 55.20, efficiency: 90.5, utilization: 92.1 }
  ];

  const mockMaintenanceSchedule = [
    { resource: 'CNC Machine A1', scheduled_date: '2024-08-15', type: 'Preventive', duration: 4, cost: 1200 },
    { resource: 'Quality Scanner Q1', scheduled_date: '2024-07-01', type: 'Repair', duration: 8, cost: 3500 },
    { resource: 'Forklift FL1', scheduled_date: '2024-07-20', type: 'Preventive', duration: 2, cost: 800 },
    { resource: 'Server Rack S1', scheduled_date: '2024-08-01', type: 'Upgrade', duration: 6, cost: 4500 }
  ];

  const mockRadarData = [
    { metric: 'Utilization', Equipment: 78, Staff: 85, Facilities: 65, Technology: 92 },
    { metric: 'Efficiency', Equipment: 82, Staff: 88, Facilities: 76, Technology: 90 },
    { metric: 'Cost Effectiveness', Equipment: 75, Staff: 85, Facilities: 80, Technology: 88 },
    { metric: 'Reliability', Equipment: 88, Staff: 92, Facilities: 85, Technology: 94 },
    { metric: 'Maintenance', Equipment: 80, Staff: 95, Facilities: 78, Technology: 85 },
    { metric: 'Innovation', Equipment: 75, Staff: 82, Facilities: 70, Technology: 95 }
  ];

  const mockDowntimeAnalysis = [
    { reason: 'Planned Maintenance', hours: 15.2, percentage: 42.5, color: '#3b82f6' },
    { reason: 'Unplanned Repairs', hours: 8.7, percentage: 24.3, color: '#ef4444' },
    { reason: 'Operator Availability', hours: 6.3, percentage: 17.6, color: '#f59e0b' },
    { reason: 'Material Shortage', hours: 4.1, percentage: 11.5, color: '#8b5cf6' },
    { reason: 'Other', hours: 1.5, percentage: 4.1, color: '#6b7280' }
  ];

  useEffect(() => {
    loadResourceData();
  }, [selectedResourceType, selectedTimeRange, selectedDepartment]);

  const loadResourceData = async () => {
    try {
      setLoading(true);
      
      // In production, this would use the actual analytics service
      // const resourceData = await analyticsService.getResourceUtilizationAnalytics(getFilters());
      
      // For now, use mock data
      setResourceData(mockResourceData);
      setResourceList(mockResourceList);
      setUtilizationTrends(mockUtilizationTrends);
      
    } catch (err) {
      setError('Failed to load resource data');
      console.error('Resource data loading error:', err);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'in_use': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'retired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'equipment': return <Settings className="h-5 w-5" />;
      case 'technology': return <Monitor className="h-5 w-5" />;
      case 'facilities': return <Building className="h-5 w-5" />;
      case 'staff': return <Wrench className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 85) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    if (rate >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredResources = resourceList.filter(resource => {
    const matchesSearch = searchTerm === '' || 
      resource.resource_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.resource_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedResourceType === 'all' || resource.resource_type === selectedResourceType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resource utilization data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Error Loading Resource Data</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadResourceData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resource Utilization Analytics</h1>
          <p className="text-gray-600 mt-1">
            Monitor equipment, staff, facilities, and technology utilization for optimal efficiency
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
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Facilities">Facilities</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Production">Production</SelectItem>
                <SelectItem value="Quality Control">Quality Control</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Administration">Administration</SelectItem>
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
            <Button onClick={loadResourceData} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Resources</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resourceData.reduce((sum, r) => sum + r.total_resources, 0)}
                </p>
              </div>
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <Badge variant="secondary">{filteredResources.length} in filter</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(resourceData.reduce((sum, r) => sum + r.utilization_rate, 0) / resourceData.length).toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4">
              <Progress 
                value={resourceData.reduce((sum, r) => sum + r.utilization_rate, 0) / resourceData.length} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Efficiency Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(resourceData.reduce((sum, r) => sum + r.efficiency_score, 0) / resourceData.length).toFixed(1)}%
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-4">
              <Progress 
                value={resourceData.reduce((sum, r) => sum + r.efficiency_score, 0) / resourceData.length} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Downtime</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resourceData.reduce((sum, r) => sum + r.downtime_hours, 0).toFixed(1)}h
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-4">
              <Badge variant="destructive">
                {resourceData.reduce((sum, r) => sum + r.maintenance_required, 0)} need maintenance
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="utilization">Utilization Trends</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency Analysis</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resource Type Distribution</CardTitle>
                <CardDescription>Total resources by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={resourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="resource_type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_resources" fill="#3b82f6" name="Total Resources" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilization by Type</CardTitle>
                <CardDescription>Current utilization rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resourceData.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getResourceTypeIcon(resource.resource_type)}
                        <span className="font-medium">{resource.resource_type}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold ${getUtilizationColor(resource.utilization_rate)}`}>
                          {resource.utilization_rate}%
                        </span>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              resource.utilization_rate >= 85 ? 'bg-green-500' :
                              resource.utilization_rate >= 70 ? 'bg-yellow-500' :
                              resource.utilization_rate >= 50 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(resource.utilization_rate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resource List Table */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Inventory</CardTitle>
              <CardDescription>Current status of all resources</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Next Maintenance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.map((resource) => (
                    <TableRow key={resource.resource_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{resource.resource_name}</p>
                          <p className="text-sm text-gray-500">{resource.resource_id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{resource.resource_type}</TableCell>
                      <TableCell>{resource.category}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(resource.status)}>
                          {resource.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${getUtilizationColor(resource.utilization_rate)}`}>
                          {resource.utilization_rate}%
                        </span>
                      </TableCell>
                      <TableCell>{resource.efficiency_score}%</TableCell>
                      <TableCell>{resource.location}</TableCell>
                      <TableCell>{resource.next_maintenance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilization Trends Tab */}
        <TabsContent value="utilization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Utilization Trends</CardTitle>
                <CardDescription>Weekly utilization rates by resource type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={utilizationTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="equipment" stroke="#3b82f6" strokeWidth={2} name="Equipment" />
                    <Line type="monotone" dataKey="staff" stroke="#10b981" strokeWidth={2} name="Staff" />
                    <Line type="monotone" dataKey="facilities" stroke="#f59e0b" strokeWidth={2} name="Facilities" />
                    <Line type="monotone" dataKey="technology" stroke="#8b5cf6" strokeWidth={2} name="Technology" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Multi-Dimensional Analysis</CardTitle>
                <CardDescription>Resource performance across different dimensions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={mockRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={60} domain={[0, 100]} />
                    <Radar name="Equipment" dataKey="Equipment" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                    <Radar name="Staff" dataKey="Staff" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                    <Radar name="Facilities" dataKey="Facilities" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                    <Radar name="Technology" dataKey="Technology" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Efficiency Analysis Tab */}
        <TabsContent value="efficiency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Efficiency vs Utilization Analysis</CardTitle>
              <CardDescription>Correlation between utilization and efficiency scores</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={resourceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="resource_type" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="utilization_rate" fill="#3b82f6" name="Utilization %" />
                  <Line yAxisId="right" type="monotone" dataKey="efficiency_score" stroke="#10b981" strokeWidth={2} name="Efficiency Score" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Maintenance</CardTitle>
                <CardDescription>Scheduled maintenance activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMaintenanceSchedule.map((maintenance, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{maintenance.resource}</h4>
                        <Badge variant={maintenance.type === 'Repair' ? 'destructive' : 'secondary'}>
                          {maintenance.type}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{maintenance.scheduled_date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{maintenance.duration}h duration</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span>${maintenance.cost.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Downtime Analysis</CardTitle>
                <CardDescription>Breakdown of downtime causes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockDowntimeAnalysis}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="hours"
                      label={({ reason, percentage }) => `${reason}: ${percentage}%`}
                    >
                      {mockDowntimeAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
                <CardDescription>Cost per hour by resource type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockCostAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="resource_type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cost_per_hour" fill="#ef4444" name="Cost per Hour ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis</CardTitle>
                <CardDescription>Return on investment by resource type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resourceData.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getResourceTypeIcon(resource.resource_type)}
                        <span className="font-medium">{resource.resource_type}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          {resource.roi_percentage}%
                        </div>
                        <div className="text-sm text-gray-600">ROI</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourceUtilizationAnalytics;
