'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, Activity, BarChart3, Users, Building2, Zap, Calendar, 
  Filter, Search, Download, RefreshCw, ArrowUpDown, Minus, Target 
} from 'lucide-react';
import { 
  useProductivityAnalytics, 
  useProductivityTrendData,
  useOperationalMetrics,
  useEfficiencyCalculations
} from '@/hooks/useEfficiency';
import { cn } from '@/lib/utils';
import type { AnalyticsFilters, ScopeType, MetricCategory } from '@/types/efficiency';

export default function PerformanceAnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: productivityData, isLoading: productivityLoading } = useProductivityAnalytics(filters);
  const { data: trendData, isLoading: trendLoading } = useProductivityTrendData(selectedPeriod);
  const { data: operationalMetrics, isLoading: metricsLoading } = useOperationalMetrics(filters);
  const { data: calculations, isLoading: calculationsLoading } = useEfficiencyCalculations(filters);

  const getTrendIcon = (change: number | undefined) => {
    if (!change) return <Minus className="h-4 w-4 text-gray-500" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getScopeIcon = (scopeType: ScopeType) => {
    switch (scopeType) {
      case 'individual':
        return <Users className="h-4 w-4" />;
      case 'team':
        return <Users className="h-4 w-4" />;
      case 'department':
        return <Building2 className="h-4 w-4" />;
      case 'process':
        return <Activity className="h-4 w-4" />;
      case 'organization':
        return <Building2 className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredProductivityData = productivityData?.filter(item =>
    searchTerm === '' || 
    item.analysis_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.scope_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMetrics = operationalMetrics?.filter(metric =>
    searchTerm === '' ||
    metric.metric_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    metric.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Performance Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive productivity analysis and performance insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={(value: '7d' | '30d' | '90d') => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
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

      {/* Key Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Productivity Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productivityData && productivityData.length > 0 
                ? (productivityData.reduce((sum, item) => sum + item.productivity_rate, 0) / productivityData.length).toFixed(2)
                : '0.00'
              }
            </div>
            <p className="text-xs text-muted-foreground">units per hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productivityData && productivityData.length > 0 
                ? (productivityData.reduce((sum, item) => sum + (item.quality_score || 0), 0) / productivityData.length).toFixed(1)
                : '0.0'
              }
            </div>
            <p className="text-xs text-muted-foreground">out of 10.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Efficiency</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productivityData && productivityData.length > 0 
                ? (productivityData.reduce((sum, item) => sum + (item.cost_efficiency_ratio || 1), 0) / productivityData.length).toFixed(2)
                : '1.00'
              }
            </div>
            <p className="text-xs text-muted-foreground">efficiency ratio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">First Time Quality</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productivityData && productivityData.length > 0 
                ? (productivityData.reduce((sum, item) => sum + item.first_time_quality, 0) / productivityData.length).toFixed(1)
                : '0.0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">average rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search analytics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="manufacturing">Manufacturing</SelectItem>
            <SelectItem value="quality">Quality Control</SelectItem>
            <SelectItem value="customer-service">Customer Service</SelectItem>
            <SelectItem value="design">Design</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="productivity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="productivity">Productivity Analysis</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="metrics">Operational Metrics</TabsTrigger>
          <TabsTrigger value="calculations">Efficiency Calculations</TabsTrigger>
        </TabsList>

        {/* Productivity Analysis Tab */}
        <TabsContent value="productivity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Productivity Analysis Results</CardTitle>
              <CardDescription>
                Detailed productivity metrics across different organizational levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productivityLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading productivity data...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProductivityData?.map((analysis) => (
                    <Card key={analysis.id} className="border border-muted">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getScopeIcon(analysis.scope_type)}
                            <div>
                              <h3 className="font-medium">{analysis.analysis_name}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {analysis.scope_type}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {analysis.time_period}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {analysis.productivity_index.toFixed(1)}
                            </div>
                            <div className="text-xs text-muted-foreground">productivity index</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Output</span>
                            <p className="font-medium">{analysis.output_quantity.toFixed(0)} units</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Input Hours</span>
                            <p className="font-medium">{analysis.input_hours.toFixed(1)} hrs</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rate</span>
                            <p className="font-medium">{analysis.productivity_rate.toFixed(2)} /hr</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Change</span>
                            <div className="flex items-center space-x-1">
                              {getTrendIcon(analysis.percentage_change)}
                              <span className={cn(
                                "font-medium",
                                analysis.percentage_change && analysis.percentage_change > 0 ? "text-green-600" : 
                                analysis.percentage_change && analysis.percentage_change < 0 ? "text-red-600" : "text-gray-600"
                              )}>
                                {analysis.percentage_change ? `${analysis.percentage_change.toFixed(1)}%` : 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Quality</span>
                            <p className={cn("font-medium", getPerformanceColor((analysis.quality_score || 0) * 10))}>
                              {analysis.quality_score ? `${analysis.quality_score.toFixed(1)}/10` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cost/Unit</span>
                            <p className="font-medium">
                              AED {analysis.total_cost_per_unit ? analysis.total_cost_per_unit.toFixed(2) : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {analysis.improvement_opportunities && analysis.improvement_opportunities.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <h4 className="text-sm font-medium mb-2">Improvement Opportunities</h4>
                            <div className="space-y-1">
                              {analysis.improvement_opportunities.slice(0, 2).map((opportunity, index) => (
                                <p key={index} className="text-xs text-muted-foreground">• {opportunity}</p>
                              ))}
                            </div>
                            {analysis.potential_gain_percentage && (
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                  Potential: +{analysis.potential_gain_percentage}%
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {(!filteredProductivityData || filteredProductivityData.length === 0) && (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No productivity analysis data available</p>
                      {searchTerm && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Try adjusting your search terms
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Historical performance data over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trendLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading trend data...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Trend visualization would be implemented here
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Data points available: {trendData?.length || 0}
                      </p>
                    </div>
                  </div>

                  {trendData && trendData.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Avg Productivity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {(trendData.reduce((sum, item) => sum + item.productivity, 0) / trendData.length).toFixed(2)}
                          </div>
                          <Progress 
                            value={(trendData.reduce((sum, item) => sum + item.productivity, 0) / trendData.length) * 50} 
                            className="mt-2" 
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Avg Efficiency</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {(trendData.reduce((sum, item) => sum + item.efficiency, 0) / trendData.length).toFixed(1)}%
                          </div>
                          <Progress 
                            value={trendData.reduce((sum, item) => sum + item.efficiency, 0) / trendData.length} 
                            className="mt-2" 
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Avg Quality</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {(trendData.reduce((sum, item) => sum + item.quality, 0) / trendData.length).toFixed(1)}
                          </div>
                          <Progress 
                            value={(trendData.reduce((sum, item) => sum + item.quality, 0) / trendData.length) * 10} 
                            className="mt-2" 
                          />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operational Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Operational Metrics</CardTitle>
              <CardDescription>Current operational performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading metrics...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Metric</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMetrics?.map((metric) => (
                      <TableRow key={metric.id}>
                        <TableCell className="font-medium">{metric.metric_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {metric.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {metric.current_value.toFixed(2)} {metric.unit_of_measure}
                        </TableCell>
                        <TableCell>
                          {metric.target_value ? `${metric.target_value.toFixed(2)} ${metric.unit_of_measure}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className={cn("font-medium", getPerformanceColor(metric.performance_score || 0))}>
                            {metric.performance_score ? `${metric.performance_score.toFixed(1)}%` : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {getTrendIcon(metric.variance_percentage)}
                            <span className="text-sm">{metric.trend_direction || 'stable'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{metric.department || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <ArrowUpDown className="h-4 w-4" />
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

        {/* Efficiency Calculations Tab */}
        <TabsContent value="calculations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Efficiency Calculations</CardTitle>
              <CardDescription>Calculated efficiency ratios and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              {calculationsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading calculations...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {calculations?.map((calc) => (
                    <Card key={calc.id} className="border border-muted">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{calc.calculation_name}</h3>
                            <p className="text-sm text-muted-foreground">{calc.process_name}</p>
                          </div>
                          <div className="text-right">
                            <div className={cn("text-lg font-bold", getPerformanceColor(calc.efficiency_percentage))}>
                              {calc.efficiency_percentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">efficiency</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type</span>
                            <p className="font-medium capitalize">{calc.calculation_type}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ratio</span>
                            <p className="font-medium">{calc.efficiency_ratio.toFixed(3)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">vs Benchmark</span>
                            <p className={cn(
                              "font-medium",
                              calc.performance_gap && calc.performance_gap > 0 ? "text-green-600" : 
                              calc.performance_gap && calc.performance_gap < 0 ? "text-red-600" : "text-gray-600"
                            )}>
                              {calc.performance_gap ? `${(calc.performance_gap * 100).toFixed(1)}%` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Confidence</span>
                            <p className="font-medium">{calc.confidence_level}%</p>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground">
                            <strong>Formula:</strong> {calc.formula_used}
                          </p>
                          {calc.improvement_potential && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                Improvement Potential: +{calc.improvement_potential}%
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {(!calculations || calculations.length === 0) && (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No efficiency calculations available</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}