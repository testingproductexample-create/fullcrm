/**
 * Customer Service & Support Management - Analytics Dashboard
 * Comprehensive analytics and reporting for support operations
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  useSupportAnalytics,
  useSLACompliance,
  useTicketVolumeIndex,
  useSupportAgents
} from '@/hooks/useSupport';
import { 
  TrendingUpIcon,
  TrendingDownIcon,
  BarChart3Icon,
  PieChartIcon,
  ClockIcon,
  UsersIcon,
  TicketIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  DownloadIcon,
  RefreshCwIcon
} from 'lucide-react';
import { 
  SafeLineChart, 
  SafeLine, 
  SafeAreaChart, 
  SafeArea, 
  SafeBarChart, 
  SafeBar, 
  SafePieChart, 
  SafePie, 
  SafeCell, 
  SafeXAxis, 
  SafeYAxis, 
  SafeCartesianGrid, 
  SafeTooltip, 
  SafeLegend, 
  SafeResponsiveContainer 
} from '@/lib/recharts-safe';
import { format, subDays, subMonths } from 'date-fns';

// Colors for charts
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];

// Date range options
const dateRangeOptions = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
];

export default function SupportAnalytics() {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('tickets');
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate date range
  const getDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case '7d':
        return { from: subDays(now, 7).toISOString(), to: now.toISOString() };
      case '30d':
        return { from: subDays(now, 30).toISOString(), to: now.toISOString() };
      case '90d':
        return { from: subDays(now, 90).toISOString(), to: now.toISOString() };
      case '1y':
        return { from: subDays(now, 365).toISOString(), to: now.toISOString() };
      default:
        return { from: subDays(now, 30).toISOString(), to: now.toISOString() };
    }
  };

  const currentDateRange = getDateRange(dateRange);
  const previousDateRange = getDateRange(dateRange === '7d' ? '14d' : dateRange === '30d' ? '60d' : '180d');

  // Data fetching
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useSupportAnalytics(currentDateRange);
  const { data: previousAnalytics } = useSupportAnalytics(previousDateRange);
  const { data: slaCompliance } = useSLACompliance(currentDateRange);
  const { data: ticketVolume = [] } = useTicketVolumeIndex();
  const { data: agents = [] } = useSupportAgents();

  // Calculate changes from previous period
  const calculateChange = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const changes = previousAnalytics ? {
    totalTickets: calculateChange(analytics?.totalTickets || 0, previousAnalytics.totalTickets || 0),
    resolutionRate: calculateChange(analytics?.resolutionRate || 0, previousAnalytics.resolutionRate || 0),
    avgResolutionTime: calculateChange(analytics?.avgResolutionTime || 0, previousAnalytics.avgResolutionTime || 0),
    avgSatisfaction: calculateChange(analytics?.avgSatisfaction || 0, previousAnalytics.avgSatisfaction || 0),
  } : null;

  // Prepare chart data
  const statusChartData = analytics?.ticketsByStatus ? Object.entries(analytics.ticketsByStatus).map(([status, count]) => ({
    name: status.replace('_', ' ').toUpperCase(),
    value: count,
    color: COLORS[Object.keys(analytics.ticketsByStatus).indexOf(status) % COLORS.length]
  })) : [];

  const priorityChartData = analytics?.ticketsByPriority ? Object.entries(analytics.ticketsByPriority).map(([priority, count]) => ({
    name: priority.toUpperCase(),
    value: count,
    color: COLORS[Object.keys(analytics.ticketsByPriority).indexOf(priority) % COLORS.length]
  })) : [];

  const agentPerformanceData = agents.map(agent => ({
    name: agent.agent_name,
    tickets: agent.current_ticket_count,
    resolved: agent.total_tickets_resolved,
    satisfaction: agent.customer_satisfaction_score || 0,
  }));

  const handleRefresh = () => {
    refetchAnalytics();
  };

  const handleExport = () => {
    // In a real implementation, this would generate and download a report
    console.log('Exporting analytics report...');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Support Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into support operations and performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">{analytics?.totalTickets || 0}</p>
                {changes && (
                  <div className="flex items-center mt-1">
                    {changes.totalTickets > 0 ? (
                      <ArrowUpIcon className="h-3 w-3 text-red-500 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 text-green-500 mr-1" />
                    )}
                    <span className={`text-xs ${changes.totalTickets > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.abs(changes.totalTickets).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TicketIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
                <p className="text-2xl font-bold">{analytics?.resolutionRate?.toFixed(1) || 0}%</p>
                {changes && (
                  <div className="flex items-center mt-1">
                    {changes.resolutionRate > 0 ? (
                      <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs ${changes.resolutionRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(changes.resolutionRate).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
                <p className="text-2xl font-bold">{analytics?.avgResolutionTime || 0}m</p>
                {changes && (
                  <div className="flex items-center mt-1">
                    {changes.avgResolutionTime > 0 ? (
                      <ArrowUpIcon className="h-3 w-3 text-red-500 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 text-green-500 mr-1" />
                    )}
                    <span className={`text-xs ${changes.avgResolutionTime > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.abs(changes.avgResolutionTime).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer Satisfaction</p>
                <p className="text-2xl font-bold">{analytics?.avgSatisfaction?.toFixed(1) || 0}/5</p>
                {changes && (
                  <div className="flex items-center mt-1">
                    {changes.avgSatisfaction > 0 ? (
                      <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs ${changes.avgSatisfaction > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(changes.avgSatisfaction).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUpIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Compliance Overview */}
      {slaCompliance && (
        <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircleIcon className="h-5 w-5" />
              SLA Compliance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white/30 rounded-lg border border-white/20">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {slaCompliance.overallCompliance.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground mb-4">Overall Compliance</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${slaCompliance.overallCompliance}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-center p-6 bg-white/30 rounded-lg border border-white/20">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {slaCompliance.firstResponseCompliance.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground mb-4">First Response</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${slaCompliance.firstResponseCompliance}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-center p-6 bg-white/30 rounded-lg border border-white/20">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {slaCompliance.resolutionCompliance.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground mb-4">Resolution</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${slaCompliance.resolutionCompliance}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts and Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
              <CardHeader>
                <CardTitle>Ticket Volume Trend</CardTitle>
                <CardDescription>Daily ticket creation over time</CardDescription>
              </CardHeader>
              <CardContent>
                <SafeResponsiveContainer width="100%" height={300}>
                  <SafeAreaChart data={ticketVolume}>
                    <SafeCartesianGrid strokeDasharray="3 3" />
                    <SafeXAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    />
                    <SafeYAxis />
                    <SafeTooltip 
                      labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                      formatter={(value) => [value, 'Tickets']}
                    />
                    <SafeArea 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.3}
                    />
                  </SafeAreaChart>
                </SafeResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
                <CardDescription>How quickly tickets are being resolved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">&lt; 1 hour</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full w-3/4"></div>
                      </div>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">1-4 hours</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full w-1/2"></div>
                      </div>
                      <span className="text-sm font-medium">15%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">4-24 hours</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full w-1/4"></div>
                      </div>
                      <span className="text-sm font-medium">8%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">&gt; 24 hours</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full w-1/12"></div>
                      </div>
                      <span className="text-sm font-medium">2%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Key metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <SafeResponsiveContainer width="100%" height={400}>
                <SafeLineChart data={ticketVolume}>
                  <SafeCartesianGrid strokeDasharray="3 3" />
                  <SafeXAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <SafeYAxis />
                  <SafeTooltip 
                    labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  />
                  <SafeLegend />
                  <SafeLine 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Tickets Created"
                  />
                </SafeLineChart>
              </SafeResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>Individual agent metrics and workload</CardDescription>
            </CardHeader>
            <CardContent>
              <SafeResponsiveContainer width="100%" height={400}>
                <SafeBarChart data={agentPerformanceData}>
                  <SafeCartesianGrid strokeDasharray="3 3" />
                  <SafeXAxis dataKey="name" />
                  <SafeYAxis />
                  <SafeTooltip />
                  <SafeLegend />
                  <SafeBar dataKey="tickets" fill="#3B82F6" name="Active Tickets" />
                  <SafeBar dataKey="resolved" fill="#10B981" name="Resolved Tickets" />
                </SafeBarChart>
              </SafeResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
              <CardHeader>
                <CardTitle>Tickets by Status</CardTitle>
                <CardDescription>Current ticket status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <SafeResponsiveContainer width="100%" height={300}>
                  <SafePieChart>
                    <SafePie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <SafeCell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </SafePie>
                    <SafeTooltip />
                  </SafePieChart>
                </SafeResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
              <CardHeader>
                <CardTitle>Tickets by Priority</CardTitle>
                <CardDescription>Priority level distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <SafeResponsiveContainer width="100%" height={300}>
                  <SafePieChart>
                    <SafePie
                      data={priorityChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {priorityChartData.map((entry, index) => (
                        <SafeCell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </SafePie>
                    <SafeTooltip />
                  </SafePieChart>
                </SafeResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
          <CardHeader>
            <CardTitle>Escalation Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Escalation Rate</span>
              <span className="font-semibold">{analytics?.escalationRate?.toFixed(1) || 0}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Escalated Tickets</span>
              <span className="font-semibold">{analytics?.escalatedTickets || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Escalation Time</span>
              <span className="font-semibold">{analytics?.avgResolutionTime || 0}m</span>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
          <CardHeader>
            <CardTitle>Resolution Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">First Contact Resolution</span>
              <span className="font-semibold">85%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Reopened Tickets</span>
              <span className="font-semibold">3.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Transfer Rate</span>
              <span className="font-semibold">8.5%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
          <CardHeader>
            <CardTitle>Channel Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Email</span>
              <Badge variant="outline">45%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Web Form</span>
              <Badge variant="outline">30%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Phone</span>
              <Badge variant="outline">20%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Chat</span>
              <Badge variant="outline">5%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
