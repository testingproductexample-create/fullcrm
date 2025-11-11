'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, Cpu, Package, Building, Zap, TrendingUp, TrendingDown, Activity, 
  Clock, DollarSign, AlertTriangle, Calendar, Filter, Download, RefreshCw,
  Wrench, Target, BarChart3, Minus
} from 'lucide-react';
import { 
  useResourceUtilization, 
  useResourceUtilizationSummary 
} from '@/hooks/useEfficiency';
import { cn } from '@/lib/utils';
import type { ResourceType, AnalyticsFilters } from '@/types/efficiency';

export default function ResourceAnalysisPage() {
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7d' | '30d'>('today');
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [activeTab, setActiveTab] = useState("overview");

  const { data: resourceData, isLoading: resourceLoading } = useResourceUtilization({
    resourceTypes: selectedResourceType !== 'all' ? [selectedResourceType] : undefined,
    ...filters
  });
  const { data: utilizationSummary, isLoading: summaryLoading } = useResourceUtilizationSummary();

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'human':
        return <Users className="h-4 w-4" />;
      case 'equipment':
        return <Cpu className="h-4 w-4" />;
      case 'material':
        return <Package className="h-4 w-4" />;
      case 'facility':
        return <Building className="h-4 w-4" />;
      case 'technology':
        return <Zap className="h-4 w-4" />;
      case 'financial':
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 95) return 'text-red-600';
    if (percentage >= 85) return 'text-orange-600';
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 50) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getUtilizationStatus = (percentage: number) => {
    if (percentage >= 95) return 'Over-utilized';
    if (percentage >= 85) return 'High utilization';
    if (percentage >= 70) return 'Optimal';
    if (percentage >= 50) return 'Moderate';
    return 'Under-utilized';
  };

  const filteredResources = resourceData?.filter(resource => 
    selectedResourceType === 'all' || resource.resource_type === selectedResourceType
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Resource Analysis</h2>
          <p className="text-muted-foreground">
            Monitor resource utilization, efficiency, and performance across all resource types
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={(value: 'today' | '7d' | '30d') => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Resource Type Summary */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {utilizationSummary?.map((summary) => (
          <Card key={summary.resourceType} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedResourceType(summary.resourceType)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">{summary.resourceType}</CardTitle>
              {getResourceIcon(summary.resourceType)}
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", getUtilizationColor(summary.avgUtilization))}>
                {summary.avgUtilization.toFixed(1)}%
              </div>
              <div className="flex items-center mt-1">
                {getTrendIcon(summary.trend)}
                <span className="text-xs text-muted-foreground ml-1">
                  {summary.totalResources} resources
                </span>
              </div>
              <Progress value={summary.avgUtilization} className="mt-2 h-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resource Type Filter */}
      <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Resource Type:</span>
          <Select value={selectedResourceType} onValueChange={(value) => setSelectedResourceType(value as ResourceType | 'all')}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              <SelectItem value="human">Human Resources</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="material">Materials</SelectItem>
              <SelectItem value="facility">Facilities</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="utilization">Utilization Details</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency Metrics</TabsTrigger>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Utilization Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Utilization Distribution</CardTitle>
                <CardDescription>Distribution of resources by utilization level</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredResources && (
                  <div className="space-y-3">
                    {[
                      { label: 'Over-utilized (≥95%)', count: filteredResources.filter(r => r.utilization_percentage >= 95).length, color: 'bg-red-500' },
                      { label: 'High utilization (85-95%)', count: filteredResources.filter(r => r.utilization_percentage >= 85 && r.utilization_percentage < 95).length, color: 'bg-orange-500' },
                      { label: 'Optimal (70-85%)', count: filteredResources.filter(r => r.utilization_percentage >= 70 && r.utilization_percentage < 85).length, color: 'bg-green-500' },
                      { label: 'Moderate (50-70%)', count: filteredResources.filter(r => r.utilization_percentage >= 50 && r.utilization_percentage < 70).length, color: 'bg-blue-500' },
                      { label: 'Under-utilized (<50%)', count: filteredResources.filter(r => r.utilization_percentage < 50).length, color: 'bg-gray-500' }
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={cn("w-3 h-3 rounded", item.color)}></div>
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <span className="text-sm font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Resource Issues */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Alerts</CardTitle>
                <CardDescription>Resources requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredResources
                    ?.filter(resource => 
                      resource.utilization_percentage >= 95 || 
                      resource.error_rate_percentage > 3 || 
                      resource.maintenance_required
                    )
                    ?.slice(0, 5)
                    ?.map((resource) => (
                      <div key={resource.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{resource.resource_name}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>Utilization: {resource.utilization_percentage.toFixed(1)}%</span>
                            {resource.error_rate_percentage > 0 && (
                              <span>Error: {resource.error_rate_percentage.toFixed(1)}%</span>
                            )}
                            {resource.maintenance_required && (
                              <Badge variant="destructive" className="text-xs">Maintenance Due</Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    ))
                  }
                  {(!filteredResources || filteredResources.filter(r => 
                    r.utilization_percentage >= 95 || r.error_rate_percentage > 3 || r.maintenance_required
                  ).length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No resource alerts</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resource Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Performance Summary</CardTitle>
              <CardDescription>Key performance indicators across resource categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredResources ? filteredResources.length : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Resources</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredResources && filteredResources.length > 0
                      ? (filteredResources.reduce((sum, r) => sum + r.utilization_percentage, 0) / filteredResources.length).toFixed(1)
                      : '0.0'
                    }%
                  </div>
                  <p className="text-xs text-muted-foreground">Avg Utilization</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {filteredResources && filteredResources.length > 0
                      ? (filteredResources.reduce((sum, r) => sum + (r.efficiency_rating || 0), 0) / filteredResources.length).toFixed(1)
                      : '0.0'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Avg Efficiency Rating</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredResources && filteredResources.length > 0
                      ? (filteredResources.reduce((sum, r) => sum + r.error_rate_percentage, 0) / filteredResources.length).toFixed(1)
                      : '0.0'
                    }%
                  </div>
                  <p className="text-xs text-muted-foreground">Avg Error Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilization Details Tab */}
        <TabsContent value="utilization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization Details</CardTitle>
              <CardDescription>Detailed utilization metrics for all resources</CardDescription>
            </CardHeader>
            <CardContent>
              {resourceLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading resource data...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Resource</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Idle Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources?.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            {getResourceIcon(resource.resource_type)}
                            <span>{resource.resource_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">
                            {resource.resource_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{resource.department || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className={cn("font-medium", getUtilizationColor(resource.utilization_percentage))}>
                              {resource.utilization_percentage.toFixed(1)}%
                            </div>
                            <Progress value={resource.utilization_percentage} className="h-1" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {resource.utilized_capacity.toFixed(1)} / {resource.total_capacity.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{resource.idle_time_minutes} min</span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className={cn("text-xs", getUtilizationColor(resource.utilization_percentage))}>
                              {getUtilizationStatus(resource.utilization_percentage)}
                            </span>
                            {resource.maintenance_required && (
                              <Badge variant="destructive" className="text-xs">Maintenance</Badge>
                            )}
                            {resource.rework_required && (
                              <Badge variant="secondary" className="text-xs">Rework</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Activity className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Efficiency Metrics Tab */}
        <TabsContent value="efficiency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Efficiency Metrics</CardTitle>
              <CardDescription>Resource efficiency ratings and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredResources?.map((resource) => (
                  <Card key={resource.id} className="border border-muted">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getResourceIcon(resource.resource_type)}
                          <div>
                            <h3 className="font-medium">{resource.resource_name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {resource.resource_type}
                              </Badge>
                              {resource.department && (
                                <Badge variant="secondary" className="text-xs">
                                  {resource.department}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {resource.efficiency_rating ? resource.efficiency_rating.toFixed(1) : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">efficiency rating</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Utilization</span>
                          <p className={cn("font-medium", getUtilizationColor(resource.utilization_percentage))}>
                            {resource.utilization_percentage.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Productive Time</span>
                          <p className="font-medium">
                            {resource.productive_time_percentage ? `${resource.productive_time_percentage.toFixed(1)}%` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Output/Hour</span>
                          <p className="font-medium">
                            {resource.output_per_hour ? resource.output_per_hour.toFixed(1) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cost/Unit</span>
                          <p className="font-medium">
                            {resource.cost_per_unit ? `AED ${resource.cost_per_unit.toFixed(2)}` : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {(resource.error_rate_percentage > 0 || resource.maintenance_required || resource.rework_required) && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center space-x-4 text-xs">
                            {resource.error_rate_percentage > 0 && (
                              <span className="text-red-600">
                                Error Rate: {resource.error_rate_percentage.toFixed(1)}%
                              </span>
                            )}
                            {resource.maintenance_required && (
                              <Badge variant="destructive" className="text-xs">Maintenance Required</Badge>
                            )}
                            {resource.rework_required && (
                              <Badge variant="secondary" className="text-xs">Rework Required</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {(!filteredResources || filteredResources.length === 0) && (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No resource data available for the selected filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analysis Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
              <CardDescription>Comparative performance analysis and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Performance charts and trend analysis would be implemented here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Data available for {filteredResources?.length || 0} resources
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}