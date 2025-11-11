/**
 * Customer Service & Support Management - Main Dashboard
 * Comprehensive overview of support operations, tickets, agents, and performance metrics
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  useSupportTickets, 
  useSupportAgents, 
  useSupportAnalytics,
  useSLACompliance 
} from '@/hooks/useSupport';
import { 
  TicketIcon, 
  UserCheckIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon,
  SearchIcon,
  PlusIcon,
  FilterIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  MessageSquareIcon
} from 'lucide-react';
import Link from 'next/link';

// Status color mapping
const statusColors = {
  new: 'bg-blue-500',
  open: 'bg-yellow-500',
  in_progress: 'bg-orange-500',
  pending: 'bg-purple-500',
  resolved: 'bg-green-500',
  closed: 'bg-gray-500',
  cancelled: 'bg-red-500',
};

// Priority color mapping
const priorityColors = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-green-500 text-white',
};

export default function SupportDashboard() {
  const [ticketFilters, setTicketFilters] = useState({
    status: '',
    priority: '',
    search: '',
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useSupportTickets(ticketFilters);
  const { data: agents = [], isLoading: agentsLoading } = useSupportAgents();
  const { data: analytics } = useSupportAnalytics();
  const { data: slaCompliance } = useSLACompliance();
  const [activeTab, setActiveTab] = useState("tickets");

  const handleFilterChange = (key: string, value: string) => {
    setTicketFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Customer Service & Support
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage tickets, track SLAs, and provide excellent customer service
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/support/tickets/new`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </Link>
          <Link href={`/support/knowledge`}>
            <Button variant="outline">
              Knowledge Base
            </Button>
          </Link>
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
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics?.openTickets || 0} open
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics?.resolvedTickets || 0} resolved
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">Avg Resolution</p>
                <p className="text-2xl font-bold">{analytics?.avgResolutionTime || 0}m</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Response time
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">Satisfaction</p>
                <p className="text-2xl font-bold">{analytics?.avgSatisfaction?.toFixed(1) || 0}/5</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Customer rating
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Compliance */}
      {slaCompliance && (
        <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircleIcon className="h-5 w-5" />
              SLA Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {slaCompliance.overallCompliance.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Overall</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {slaCompliance.firstResponseCompliance.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">First Response</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {slaCompliance.resolutionCompliance.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Resolution</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tickets">Recent Tickets</TabsTrigger>
          <TabsTrigger value="agents">Agent Status</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Recent Tickets Tab */}
        <TabsContent value="tickets">
          <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Support Tickets</CardTitle>
                  <CardDescription>
                    Latest customer support tickets and their status
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tickets..."
                      value={ticketFilters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(value) => handleFilterChange('priority', value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Link href={`/support/tickets`}>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="text-center py-8">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tickets found
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.slice(0, 10).map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-white/20">
                      <div className="flex items-center space-x-4">
                        <div>
                          <Link 
                            href={`/support/tickets/${ticket.id}`}
                            className="font-medium text-blue-600 hover:text-blue-700"
                          >
                            {ticket.ticket_number}
                          </Link>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {ticket.ticket_title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.customer_name} • {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${statusColors[ticket.status as keyof typeof statusColors]}`} />
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        {ticket.assigned_agent && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {ticket.assigned_agent.agent_name?.split(' ')?.map((n: string) => n?.[0])?.join('') || 'NA'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {ticket.assigned_agent.agent_name || 'Unassigned'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agent Status Tab */}
        <TabsContent value="agents">
          <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Support Agent Status</CardTitle>
                  <CardDescription>
                    Current availability and workload of support agents
                  </CardDescription>
                </div>
                <Link href={`/support/agents`}>
                  <Button variant="outline" size="sm">
                    Manage Agents
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {agentsLoading ? (
                <div className="text-center py-8">Loading agents...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents.map((agent) => (
                    <div key={agent.id} className="p-4 bg-white/50 rounded-lg border border-white/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {agent.agent_name?.split(' ')?.map((n) => n?.[0])?.join('') || 'NA'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{agent.agent_name || 'Unknown Agent'}</p>
                            <p className="text-sm text-muted-foreground">{agent.skill_level}</p>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={
                            agent.agent_status === 'available' ? 'border-green-200 text-green-700' :
                            agent.agent_status === 'busy' ? 'border-orange-200 text-orange-700' :
                            agent.agent_status === 'break' ? 'border-blue-200 text-blue-700' :
                            'border-gray-200 text-gray-700'
                          }
                        >
                          {agent.agent_status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Active Tickets:</span>
                          <span className="font-medium">{agent.current_ticket_count}/{agent.max_concurrent_tickets}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Resolved:</span>
                          <span className="font-medium">{agent.total_tickets_resolved}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Rating:</span>
                          <span className="font-medium">{agent.customer_satisfaction_score?.toFixed(1) || 'N/A'}/5</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
              <CardHeader>
                <CardTitle>Ticket Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.ticketsByStatus && (
                  <div className="space-y-4">
                    {Object.entries(analytics.ticketsByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors]}`} />
                          <span className="capitalize">{status.replace('_', ' ')}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.ticketsByPriority && (
                  <div className="space-y-4">
                    {Object.entries(analytics.ticketsByPriority).map(([priority, count]) => (
                      <div key={priority} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={priorityColors[priority as keyof typeof priorityColors]}
                            variant="secondary"
                          >
                            {priority}
                          </Badge>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="backdrop-blur-sm bg-white/60 border border-white/20">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common support management tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href={`/support/tickets`}>
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                    <TicketIcon className="h-6 w-6" />
                    Manage Tickets
                  </Button>
                </Link>
                <Link href={`/support/knowledge`}>
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                    <MessageSquareIcon className="h-6 w-6" />
                    Knowledge Base
                  </Button>
                </Link>
                <Link href={`/support/analytics`}>
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                    <ArrowTrendingUpIcon className="h-6 w-6" />
                    View Analytics
                  </Button>
                </Link>
                <Link href={`/support/settings`}>
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                    <UserCheckIcon className="h-6 w-6" />
                    Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}