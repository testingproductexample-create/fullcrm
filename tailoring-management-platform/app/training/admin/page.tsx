'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UsersIcon, 
  BookOpenIcon, 
  ChartBarIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { 
  useTrainingPrograms, 
  useEmployeeTrainings,
  useTrainingDashboardStats,
  useCertificationRenewalAlerts,
  useComplianceTracking,
  useTrainingCompletionTrends
} from '@/hooks/useTraining';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function TrainingAdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: trainingPrograms = [], isLoading: programsLoading } = useTrainingPrograms();
  const { data: allEmployeeTrainings = [], isLoading: trainingsLoading } = useEmployeeTrainings();
  const { data: dashboardStats } = useTrainingDashboardStats();
  const { data: renewalAlerts = [] } = useCertificationRenewalAlerts();
  const { data: complianceItems = [] } = useComplianceTracking();
  const { data: completionTrends = [] } = useTrainingCompletionTrends();

  // Filter data based on search and status
  const filteredPrograms = trainingPrograms.filter(program => 
    program.program_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (statusFilter === 'all' || 
     (statusFilter === 'active' && program.is_active) ||
     (statusFilter === 'inactive' && !program.is_active))
  );

  const filteredTrainings = allEmployeeTrainings.filter(training =>
    (training.training_programs?.program_name || '').toLowerCase().includes(searchQuery.toLowerCase()) &&
    (statusFilter === 'all' || training.training_status === statusFilter)
  );

  // Chart data
  const statusDistribution = [
    { name: 'Completed', value: allEmployeeTrainings.filter(t => t.training_status === 'completed').length, color: '#10B981' },
    { name: 'In Progress', value: allEmployeeTrainings.filter(t => t.training_status === 'in_progress').length, color: '#3B82F6' },
    { name: 'Enrolled', value: allEmployeeTrainings.filter(t => t.training_status === 'enrolled').length, color: '#F59E0B' },
    { name: 'Failed', value: allEmployeeTrainings.filter(t => t.training_status === 'failed').length, color: '#EF4444' }
  ];

  const programStats = trainingPrograms.map(program => ({
    name: program.program_name.substring(0, 20) + (program.program_name.length > 20 ? '...' : ''),
    enrollments: allEmployeeTrainings.filter(t => t.training_program_id === program.id).length,
    completions: allEmployeeTrainings.filter(t => t.training_program_id === program.id && t.training_status === 'completed').length
  }));

  if (programsLoading || trainingsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training Administration</h1>
          <p className="text-gray-600 mt-2">Manage training programs, track progress, and ensure compliance</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/training/courses/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Program
            </Button>
          </Link>
          <Link href="/training/analytics">
            <Button variant="outline">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Critical Alerts */}
      {(renewalAlerts.length > 0 || complianceItems.filter(c => c.status === 'warning' || c.status === 'overdue').length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Critical Items Requiring Attention</span>
          </div>
          <div className="mt-2 text-sm text-red-700 space-y-1">
            {renewalAlerts.filter(alert => alert.priority === 'high').length > 0 && (
              <p>{renewalAlerts.filter(alert => alert.priority === 'high').length} certification{renewalAlerts.filter(alert => alert.priority === 'high').length > 1 ? 's' : ''} expiring within 7 days</p>
            )}
            {complianceItems.filter(c => c.status === 'overdue').length > 0 && (
              <p>{complianceItems.filter(c => c.status === 'overdue').length} compliance requirement{complianceItems.filter(c => c.status === 'overdue').length > 1 ? 's are' : ' is'} overdue</p>
            )}
          </div>
          <Link href="/training/compliance" className="mt-2 inline-flex text-sm text-red-600 hover:text-red-800">
            Review All Issues →
          </Link>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Programs</p>
                <p className="text-3xl font-bold text-blue-600">{dashboardStats?.total_programs || trainingPrograms.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                {trainingPrograms.filter(p => p.is_active).length} active programs
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Enrollments</p>
                <p className="text-3xl font-bold text-green-600">{dashboardStats?.active_enrollments || allEmployeeTrainings.filter(t => t.training_status === 'in_progress' || t.training_status === 'enrolled').length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UsersIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                {allEmployeeTrainings.filter(t => t.training_status === 'completed').length} completions this month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                <p className="text-3xl font-bold text-purple-600">{dashboardStats?.compliance_rate || 92}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                {complianceItems.filter(c => c.status === 'pending').length} pending items
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Completion Time</p>
                <p className="text-3xl font-bold text-orange-600">{dashboardStats?.average_completion_time || 28}</p>
                <p className="text-sm text-gray-500">days</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Training Status Distribution */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Training Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {statusDistribution.map((item) => (
                    <div key={item.name} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Completion Trends */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Completion Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={completionTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="completion_rate" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Completion Rate (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Recent Training Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allEmployeeTrainings
                  .filter(t => t.training_status === 'completed')
                  .slice(0, 5)
                  .map((training) => (
                    <div key={training.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {training.employees?.first_name || 'Employee'} {training.employees?.last_name || ''} completed
                          </p>
                          <p className="text-sm text-gray-600">
                            {training.training_programs?.program_name || 'Training Program'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Score: {training.assessment_score || 'N/A'}%</p>
                        <p className="text-xs text-gray-500">{training.completion_date}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-6">
          {/* Search and Filters */}
          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search training programs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Programs List */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Training Programs</CardTitle>
              <CardDescription>
                Manage and monitor all training programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPrograms.map((program) => {
                  const enrollments = allEmployeeTrainings.filter(t => t.training_program_id === program.id);
                  const completions = enrollments.filter(t => t.training_status === 'completed');
                  const completionRate = enrollments.length > 0 ? (completions.length / enrollments.length) * 100 : 0;

                  return (
                    <div key={program.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{program.program_name}</h4>
                          <p className="text-sm text-gray-600">{program.program_category} • {program.duration_hours}h</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={program.is_active ? 'default' : 'secondary'}>
                            {program.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {program.is_mandatory && (
                            <Badge variant="destructive">Mandatory</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="font-medium">{enrollments.length}</p>
                          <p className="text-gray-500">Enrollments</p>
                        </div>
                        <div>
                          <p className="font-medium">{completions.length}</p>
                          <p className="text-gray-500">Completions</p>
                        </div>
                        <div>
                          <p className="font-medium">{Math.round(completionRate)}%</p>
                          <p className="text-gray-500">Success Rate</p>
                        </div>
                        <div>
                          <p className="font-medium">AED {program.cost_per_participant_aed}</p>
                          <p className="text-gray-500">Cost per Person</p>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Link href={`/training/courses/${program.id}`}>
                          <Button size="sm" variant="outline">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/training/courses/${program.id}/edit`}>
                          <Button size="sm" variant="outline">
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
                {filteredPrograms.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No training programs found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchQuery ? 'Try adjusting your search' : 'Create your first training program'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enrollments Tab */}
        <TabsContent value="enrollments" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Training Enrollments</CardTitle>
              <CardDescription>
                Monitor individual employee training progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTrainings.map((training) => (
                  <div key={training.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {training.employees?.first_name || 'Employee'} {training.employees?.last_name || ''}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {training.training_programs?.program_name || 'Training Program'}
                        </p>
                      </div>
                      <Badge variant={
                        training.training_status === 'completed' ? 'default' :
                        training.training_status === 'in_progress' ? 'secondary' :
                        training.training_status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {training.training_status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium">{training.enrollment_date}</p>
                        <p className="text-gray-500">Enrolled</p>
                      </div>
                      <div>
                        <p className="font-medium">{training.attendance_percentage || 0}%</p>
                        <p className="text-gray-500">Progress</p>
                      </div>
                      <div>
                        <p className="font-medium">{training.assessment_score || 'N/A'}</p>
                        <p className="text-gray-500">Score</p>
                      </div>
                      <div>
                        <p className="font-medium">{training.mandatory_completion_date || 'None'}</p>
                        <p className="text-gray-500">Due Date</p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredTrainings.length === 0 && (
                  <div className="text-center py-8">
                    <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No training enrollments found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Program Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={programStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="enrollments" fill="#3B82F6" name="Enrollments" />
                    <Bar dataKey="completions" fill="#10B981" name="Completions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}