'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, TrendingDown, Activity, Target, Zap, Users, Settings, RefreshCcw, Bell, Calendar, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { 
  useEfficiencyDashboardMetrics, 
  useBottleneckSummary, 
  useActiveAlertsCount,
  useProductivityTrendData,
  useResourceUtilizationSummary,
  useOptimizationRecommendations
} from '@/hooks/useEfficiency';
import { cn } from '@/lib/utils';

export default function EfficiencyDashboardPage() {
  const { data: dashboardMetrics, isLoading: metricsLoading } = useEfficiencyDashboardMetrics();
  const { data: bottleneckSummary, isLoading: bottlenecksLoading } = useBottleneckSummary();
  const { data: activeAlertsCount, isLoading: alertsLoading } = useActiveAlertsCount();
  const { data: productivityTrend, isLoading: trendLoading } = useProductivityTrendData('30d');
  const { data: resourceSummary, isLoading: resourceLoading } = useResourceUtilizationSummary();
  const { data: recommendations, isLoading: recommendationsLoading } = useOptimizationRecommendations('pending');

  const getTrendIcon = (direction: string) => {
    switch (direction) {
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCcw className="h-6 w-6 animate-spin" />
          <span>Loading efficiency metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Efficiency & Performance Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive operational efficiency monitoring and optimization insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
          <Button size="sm">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Metrics</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics?.totalMetrics || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active performance indicators
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dashboardMetrics?.activeAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Bottlenecks</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dashboardMetrics?.criticalBottlenecks || 0}</div>
            <p className="text-xs text-muted-foreground">
              High impact issues
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics?.avgEfficiency || 0}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(dashboardMetrics?.productivityTrend || 'stable')}
              <span className="ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="recommendations">Optimization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Resource Utilization Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>Current utilization across resource types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardMetrics?.utilizationSummary && Object.entries(dashboardMetrics.utilizationSummary).map(([type, value]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{type} Resources</span>
                      <span className="text-sm text-muted-foreground">{value.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={value} 
                      className={cn(
                        "h-2",
                        value >= 90 ? "text-red-500" : value >= 80 ? "text-yellow-500" : "text-green-500"
                      )} 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Performance Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Latest performance alerts requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardMetrics?.recentAlerts?.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg border bg-card">
                      <AlertCircle className={cn(
                        "h-5 w-5 mt-0.5",
                        alert.severity === 'critical' ? 'text-red-500' : 
                        alert.severity === 'high' ? 'text-orange-500' : 
                        alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{alert.alert_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                        <div className="flex items-center mt-1 space-x-2">
                          <Badge variant={getSeverityColor(alert.severity) as any} className="text-xs">
                            {alert.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.triggered_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!dashboardMetrics?.recentAlerts || dashboardMetrics.recentAlerts.length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No active alerts</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Optimization Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Priority Optimization Opportunities</CardTitle>
              <CardDescription>Top recommendations for improving operational efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardMetrics?.topRecommendations?.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{rec.title}</h4>
                        <Badge variant={rec.priority_level === 'critical' ? 'destructive' : 
                                      rec.priority_level === 'high' ? 'default' : 'secondary'}>
                          {rec.priority_level}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {rec.description}
                      </p>
                      <div className="flex items-center mt-2 space-x-4 text-xs text-muted-foreground">
                        <span>Expected: +{rec.expected_improvement_percentage}% efficiency</span>
                        <span>Savings: AED {rec.estimated_cost_savings?.toLocaleString()}</span>
                        <span>ROI: {rec.roi_percentage}%</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                      <Button size="sm">
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
                {(!dashboardMetrics?.topRecommendations || dashboardMetrics.topRecommendations.length === 0) && (
                  <div className="text-center py-8">
                    <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No pending recommendations</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>30-day productivity and efficiency trends</CardDescription>
            </CardHeader>
            <CardContent>
              {trendLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCcw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Chart component would be implemented here with productivity trend data
                  <br />
                  Data points: {productivityTrend?.length || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bottlenecks Tab */}
        <TabsContent value="bottlenecks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Bottlenecks</CardTitle>
              <CardDescription>Current operational bottlenecks requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bottleneckSummary?.map((bottleneck) => (
                  <div key={bottleneck.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{bottleneck.name}</h4>
                        <Badge variant={getSeverityColor(bottleneck.severity) as any}>
                          {bottleneck.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center mt-2 space-x-4 text-sm text-muted-foreground">
                        <span>Impact: AED {bottleneck.impact?.toLocaleString()}/day</span>
                        <span>Open: {bottleneck.daysOpen} days</span>
                        <span>Status: {bottleneck.status}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Resolve
                    </Button>
                  </div>
                ))}
                {(!bottleneckSummary || bottleneckSummary.length === 0) && (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No active bottlenecks detected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Analysis</CardTitle>
              <CardDescription>Resource utilization and efficiency metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {resourceLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCcw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {resourceSummary?.map((resource) => (
                    <Card key={resource.resourceType}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base capitalize">{resource.resourceType}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Total Resources</span>
                            <span className="text-sm font-medium">{resource.totalResources}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Avg Utilization</span>
                            <span className="text-sm font-medium">{resource.avgUtilization.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Efficiency</span>
                            <span className="text-sm font-medium">{resource.efficiency.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Trend</span>
                            <div className="flex items-center space-x-1">
                              {getTrendIcon(resource.trend)}
                              <span className="text-sm">{resource.trend}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>AI-powered suggestions for operational improvements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations?.slice(0, 10).map((rec) => (
                  <div key={rec.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{rec.title}</h4>
                          <Badge variant={rec.priority_level === 'critical' ? 'destructive' : 
                                        rec.priority_level === 'high' ? 'default' : 'secondary'}>
                            {rec.priority_level}
                          </Badge>
                          <Badge variant="outline">{rec.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {rec.description}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">Expected Improvement</span>
                            <p className="font-medium">+{rec.expected_improvement_percentage}%</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cost Savings</span>
                            <p className="font-medium">AED {rec.estimated_cost_savings?.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">ROI</span>
                            <p className="font-medium">{rec.roi_percentage}%</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Payback</span>
                            <p className="font-medium">{rec.payback_period_months} months</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                        <Button size="sm">
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {(!recommendations || recommendations.length === 0) && (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No pending recommendations</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}