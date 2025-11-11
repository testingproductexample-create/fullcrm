/**
 * Customer Service & Support Management - Ticket Details
 * Comprehensive ticket detail view with timeline, responses, and actions
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  useSupportTicket, 
  useTicketResponses, 
  useAddTicketResponse,
  useUpdateSupportTicket,
  useAssignTicket,
  useEscalateTicket,
  useSupportAgents 
} from '@/hooks/useSupport';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  AlertTriangleIcon,
  MessageSquareIcon,
  SendIcon,
  EditIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpIcon,
  PhoneIcon,
  MailIcon,
  TagIcon,
  ClipboardIcon
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

// Status and priority configurations
const statusColors = {
  new: 'bg-blue-500',
  open: 'bg-yellow-500',
  in_progress: 'bg-orange-500',
  pending: 'bg-purple-500',
  resolved: 'bg-green-500',
  closed: 'bg-gray-500',
  cancelled: 'bg-red-500',
};

const priorityColors = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-green-500 text-white',
};

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending', label: 'Pending Customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export default function TicketDetails() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [newResponse, setNewResponse] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  // Data fetching
  const { data: ticket, isLoading: ticketLoading } = useSupportTicket(ticketId);
  const { data: responses = [], refetch: refetchResponses } = useTicketResponses(ticketId);
  const { data: agents = [] } = useSupportAgents();

  // Mutations
  const addResponse = useAddTicketResponse();
  const updateTicket = useUpdateSupportTicket();
  const assignTicket = useAssignTicket();
  const escalateTicket = useEscalateTicket();

  // Handlers
  const handleAddResponse = async () => {
    if (!newResponse.trim()) return;

    try {
      await addResponse.mutateAsync({
        ticket_id: ticketId,
        response_type: isInternal ? 'internal_note' : 'agent_reply',
        response_content: newResponse,
        author_type: 'agent',
        author_id: 'current-user-id', // Replace with actual current user ID
        author_name: 'Current Agent', // Replace with actual current user name
        is_internal_note: isInternal,
        is_public: !isInternal,
      });
      
      setNewResponse('');
      setIsInternal(false);
      refetchResponses();
      toast.success('Response added successfully');
    } catch (error) {
      toast.error('Failed to add response');
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        updates.resolution_time_minutes = Math.floor(
          (new Date().getTime() - new Date(ticket!.created_at).getTime()) / (1000 * 60)
        );
      }
      
      await updateTicket.mutateAsync({
        id: ticketId,
        updates
      });
      
      toast.success('Ticket status updated successfully');
    } catch (error) {
      toast.error('Failed to update ticket status');
    }
  };

  const handlePriorityUpdate = async (newPriority: string) => {
    try {
      await updateTicket.mutateAsync({
        id: ticketId,
        updates: { priority: newPriority as any }
      });
      toast.success('Priority updated successfully');
    } catch (error) {
      toast.error('Failed to update priority');
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    try {
      await assignTicket.mutateAsync({
        ticketId,
        agentId,
        reason: 'Manual assignment from ticket detail'
      });
      toast.success('Ticket assigned successfully');
    } catch (error) {
      toast.error('Failed to assign ticket');
    }
  };

  const handleEscalate = async () => {
    try {
      await escalateTicket.mutateAsync({
        ticketId,
        escalationLevel: (ticket?.escalation_level || 0) + 1,
        reason: 'Manual escalation from ticket detail'
      });
      toast.success('Ticket escalated successfully');
    } catch (error) {
      toast.error('Failed to escalate ticket');
    }
  };

  if (ticketLoading) {
    return (
      <div className=\"p-6 flex items-center justify-center min-h-screen\">
        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600\"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className=\"p-6 text-center\">
        <h1 className=\"text-2xl font-bold text-gray-900\">Ticket Not Found</h1>
        <p className=\"text-gray-600 mt-2\">The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link href=\"/support/tickets\">
          <Button className=\"mt-4\">
            <ArrowLeftIcon className=\"w-4 h-4 mr-2\" />
            Back to Tickets
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate SLA status
  const now = new Date();
  const createdAt = new Date(ticket.created_at);
  const timeSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60)); // minutes
  const isOverdue = ticket.first_response_due && now > new Date(ticket.first_response_due);

  return (
    <div className=\"p-6 max-w-7xl mx-auto space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-4\">
          <Link href=\"/support/tickets\">
            <Button variant=\"ghost\" size=\"sm\">
              <ArrowLeftIcon className=\"w-4 h-4 mr-2\" />
              Back to Tickets
            </Button>
          </Link>
          <div>
            <div className=\"flex items-center gap-3\">
              <h1 className=\"text-2xl font-bold\">{ticket.ticket_number}</h1>
              <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                {ticket.priority}
              </Badge>
              <Badge variant=\"outline\" className=\"flex items-center gap-1\">
                <div className={`w-2 h-2 rounded-full ${statusColors[ticket.status as keyof typeof statusColors]}`} />
                {ticket.status.replace('_', ' ')}
              </Badge>
              {ticket.is_escalated && (
                <Badge variant=\"destructive\" className=\"flex items-center gap-1\">
                  <ArrowUpIcon className=\"w-3 h-3\" />
                  Escalated (Level {ticket.escalation_level})
                </Badge>
              )}
            </div>
            <h2 className=\"text-xl text-muted-foreground mt-1\">{ticket.ticket_title}</h2>
          </div>
        </div>
        
        <div className=\"flex items-center gap-2\">
          {!ticket.is_escalated && (
            <Button variant=\"outline\" onClick={handleEscalate}>
              <AlertTriangleIcon className=\"w-4 h-4 mr-2\" />
              Escalate
            </Button>
          )}
          <Select value={ticket.status} onValueChange={handleStatusUpdate}>
            <SelectTrigger className=\"w-40\">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">
        {/* Main Content */}
        <div className=\"lg:col-span-2 space-y-6\">
          {/* Ticket Details */}
          <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
            <CardHeader>
              <CardTitle className=\"flex items-center gap-2\">
                <ClipboardIcon className=\"h-5 w-5\" />
                Ticket Details
              </CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <div>
                <h3 className=\"font-medium text-sm text-muted-foreground mb-2\">Description</h3>
                <p className=\"text-sm leading-relaxed bg-muted/30 p-4 rounded-lg\">
                  {ticket.ticket_description}
                </p>
              </div>
              
              {ticket.internal_notes && (
                <div>
                  <h3 className=\"font-medium text-sm text-muted-foreground mb-2\">Internal Notes</h3>
                  <p className=\"text-sm leading-relaxed bg-yellow-50 p-4 rounded-lg border border-yellow-200\">
                    {ticket.internal_notes}
                  </p>
                </div>
              )}

              <div className=\"grid grid-cols-2 gap-4 text-sm\">
                <div>
                  <span className=\"text-muted-foreground\">Source Channel:</span>
                  <p className=\"font-medium capitalize\">{ticket.source_channel}</p>
                </div>
                <div>
                  <span className=\"text-muted-foreground\">Category:</span>
                  <p className=\"font-medium\">{ticket.category?.category_name || 'Uncategorized'}</p>
                </div>
                <div>
                  <span className=\"text-muted-foreground\">Created:</span>
                  <p className=\"font-medium\">
                    {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <span className=\"text-muted-foreground\">Last Updated:</span>
                  <p className=\"font-medium\">
                    {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {isOverdue && (
                <div className=\"bg-red-50 border border-red-200 rounded-lg p-4\">
                  <div className=\"flex items-center gap-2 text-red-700\">
                    <AlertTriangleIcon className=\"h-4 w-4\" />
                    <span className=\"font-medium\">SLA Breach Warning</span>
                  </div>
                  <p className=\"text-red-600 text-sm mt-1\">
                    This ticket is overdue for first response. Immediate attention required.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Communication Timeline */}
          <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
            <CardHeader>
              <CardTitle className=\"flex items-center gap-2\">
                <MessageSquareIcon className=\"h-5 w-5\" />
                Communication Timeline ({responses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-6\">
                {/* Initial Ticket */}
                <div className=\"flex gap-4\">
                  <Avatar className=\"h-10 w-10\">
                    <AvatarFallback className=\"bg-blue-100 text-blue-600\">
                      {ticket.customer_name?.split(' ').map(n => n[0]).join('') || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className=\"flex-1\">
                    <div className=\"flex items-center gap-2 mb-2\">
                      <span className=\"font-medium\">{ticket.customer_name}</span>
                      <Badge variant=\"outline\">Customer</Badge>
                      <span className=\"text-sm text-muted-foreground\">
                        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className=\"bg-blue-50 border border-blue-200 rounded-lg p-4\">
                      <h4 className=\"font-medium text-blue-900 mb-2\">{ticket.ticket_title}</h4>
                      <p className=\"text-blue-800 text-sm\">{ticket.ticket_description}</p>
                    </div>
                  </div>
                </div>

                {/* Responses */}
                {responses.map((response, index) => (
                  <div key={response.id} className=\"flex gap-4\">
                    <Avatar className=\"h-10 w-10\">
                      <AvatarFallback className={
                        response.author_type === 'agent' 
                          ? 'bg-green-100 text-green-600' 
                          : response.author_type === 'customer'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }>
                        {response.author_name?.split(' ').map((n: string) => n[0]).join('') || 
                         (response.author_type === 'agent' ? 'A' : response.author_type === 'customer' ? 'C' : 'S')}
                      </AvatarFallback>
                    </Avatar>
                    <div className=\"flex-1\">
                      <div className=\"flex items-center gap-2 mb-2\">
                        <span className=\"font-medium\">{response.author_name || response.author_type}</span>
                        <Badge variant={
                          response.author_type === 'agent' ? 'default' :
                          response.author_type === 'customer' ? 'secondary' : 'outline'
                        }>
                          {response.author_type === 'agent' ? 'Support Agent' : 
                           response.author_type === 'customer' ? 'Customer' : 'System'}
                        </Badge>
                        {response.is_internal_note && (
                          <Badge variant=\"outline\" className=\"text-orange-600 border-orange-300\">
                            Internal Note
                          </Badge>
                        )}
                        <span className=\"text-sm text-muted-foreground\">
                          {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className={`rounded-lg p-4 ${
                        response.is_internal_note 
                          ? 'bg-orange-50 border border-orange-200'
                          : response.author_type === 'agent'
                          ? 'bg-green-50 border border-green-200'
                          : response.author_type === 'customer'
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <p className=\"text-sm leading-relaxed whitespace-pre-wrap\">
                          {response.response_content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Response */}
              <Separator className=\"my-6\" />
              <div className=\"space-y-4\">
                <div className=\"flex items-center gap-4\">
                  <Label className=\"text-sm font-medium\">Add Response:</Label>
                  <div className=\"flex items-center gap-2\">
                    <input
                      type=\"checkbox\"
                      id=\"internal\"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className=\"rounded border-gray-300\"
                    />
                    <Label htmlFor=\"internal\" className=\"text-sm\">Internal Note</Label>
                  </div>
                </div>
                <Textarea
                  placeholder={isInternal ? \"Add internal note (not visible to customer)...\" : \"Write your response to the customer...\"}
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  rows={4}
                  className=\"min-h-24\"
                />
                <div className=\"flex justify-end\">
                  <Button 
                    onClick={handleAddResponse} 
                    disabled={!newResponse.trim() || addResponse.isPending}
                    className={isInternal ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
                  >
                    <SendIcon className=\"w-4 h-4 mr-2\" />
                    {isInternal ? 'Add Internal Note' : 'Send Response'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className=\"space-y-6\">
          {/* Customer Information */}
          <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
            <CardHeader>
              <CardTitle className=\"flex items-center gap-2\">
                <UserIcon className=\"h-5 w-5\" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <div className=\"text-center\">
                <Avatar className=\"h-16 w-16 mx-auto mb-3\">
                  <AvatarFallback className=\"text-lg\">
                    {ticket.customer_name?.split(' ').map(n => n[0]).join('') || 'C'}
                  </AvatarFallback>
                </Avatar>
                <h3 className=\"font-medium text-lg\">{ticket.customer_name}</h3>
                <p className=\"text-sm text-muted-foreground\">Customer ID: {ticket.customer_id}</p>
              </div>
              
              <Separator />
              
              <div className=\"space-y-3\">
                {ticket.customer_email && (
                  <div className=\"flex items-center gap-3\">
                    <MailIcon className=\"h-4 w-4 text-muted-foreground\" />
                    <div className=\"flex-1 min-w-0\">
                      <p className=\"text-sm font-medium truncate\">{ticket.customer_email}</p>
                      <p className=\"text-xs text-muted-foreground\">Email</p>
                    </div>
                  </div>
                )}
                
                {ticket.customer_phone && (
                  <div className=\"flex items-center gap-3\">
                    <PhoneIcon className=\"h-4 w-4 text-muted-foreground\" />
                    <div className=\"flex-1 min-w-0\">
                      <p className=\"text-sm font-medium\">{ticket.customer_phone}</p>
                      <p className=\"text-xs text-muted-foreground\">Phone</p>
                    </div>
                  </div>
                )}

                {ticket.order_id && (
                  <div className=\"flex items-center gap-3\">
                    <ClipboardIcon className=\"h-4 w-4 text-muted-foreground\" />
                    <div className=\"flex-1 min-w-0\">
                      <Link href={`/orders/${ticket.order_id}`} className=\"text-sm font-medium text-blue-600 hover:text-blue-700\">
                        View Related Order
                      </Link>
                      <p className=\"text-xs text-muted-foreground\">Order Reference</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              {ticket.assigned_agent ? (
                <div className=\"flex items-center gap-3\">
                  <Avatar>
                    <AvatarFallback>
                      {ticket.assigned_agent.agent_name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className=\"flex-1\">
                    <p className=\"font-medium\">{ticket.assigned_agent.agent_name}</p>
                    <p className=\"text-sm text-muted-foreground\">{ticket.assigned_agent.skill_level}</p>
                  </div>
                </div>
              ) : (
                <p className=\"text-sm text-muted-foreground\">No agent assigned</p>
              )}
              
              <Select 
                value={ticket.assigned_agent?.id || ''} 
                onValueChange={handleAssignAgent}
              >
                <SelectTrigger>
                  <SelectValue placeholder=\"Assign to agent\" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"\">Unassigned</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.agent_name} ({agent.current_ticket_count}/{agent.max_concurrent_tickets})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Ticket Properties */}
          <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
            <CardHeader>
              <CardTitle>Properties</CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <div>
                <Label className=\"text-sm font-medium mb-2 block\">Priority</Label>
                <Select value={ticket.priority} onValueChange={handlePriorityUpdate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className=\"space-y-2 text-sm\">
                <div className=\"flex justify-between\">
                  <span className=\"text-muted-foreground\">Responses:</span>
                  <span className=\"font-medium\">{ticket.response_count}</span>
                </div>
                <div className=\"flex justify-between\">
                  <span className=\"text-muted-foreground\">Reopened:</span>
                  <span className=\"font-medium\">{ticket.reopen_count}</span>
                </div>
                <div className=\"flex justify-between\">
                  <span className=\"text-muted-foreground\">Transferred:</span>
                  <span className=\"font-medium\">{ticket.transfer_count}</span>
                </div>
                {ticket.resolution_time_minutes && (
                  <div className=\"flex justify-between\">
                    <span className=\"text-muted-foreground\">Resolution Time:</span>
                    <span className=\"font-medium\">{Math.round(ticket.resolution_time_minutes / 60)}h {ticket.resolution_time_minutes % 60}m</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Satisfaction */}
          {ticket.satisfaction_rating && (
            <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
              <CardHeader>
                <CardTitle>Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"text-center\">
                  <div className=\"text-2xl font-bold text-green-600 mb-1\">
                    {ticket.satisfaction_rating}/5
                  </div>
                  <div className=\"flex justify-center gap-1 mb-3\">
                    {[1, 2, 3, 4, 5].map(star => (
                      <div
                        key={star}
                        className={`w-4 h-4 rounded-full ${
                          star <= ticket.satisfaction_rating! ? 'bg-yellow-400' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  {ticket.satisfaction_comment && (
                    <p className=\"text-sm text-muted-foreground italic\">
                      \"{ticket.satisfaction_comment}\"
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}