/**
 * Customer Service & Support Management - Ticket Management
 * Comprehensive ticket management interface with filtering, search, and bulk actions
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  useSupportTickets, 
  useSupportAgents,
  useTicketCategories,
  useUpdateSupportTicket,
  useAssignTicket,
  useEscalateTicket,
  useCreateSupportTicket
} from '@/hooks/useSupport';
import { 
  SearchIcon,
  FilterIcon,
  PlusIcon,
  MoreHorizontalIcon,
  UserIcon,
  AlertTriangleIcon,
  ClockIcon,
  MessageSquareIcon,
  CheckIcon,
  XIcon,
  ArrowUpIcon,
  EditIcon,
  EyeIcon
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// Status and priority mappings
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
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function TicketManagement() {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigned_agent_id: '',
    category_id: '',
    search: '',
  });
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTicketForAction, setSelectedTicketForAction] = useState<string>('');

  // Data fetching
  const { data: tickets = [], isLoading: ticketsLoading, refetch } = useSupportTickets(filters);
  const { data: agents = [] } = useSupportAgents();
  const { data: categories = [] } = useTicketCategories();

  // Mutations
  const updateTicket = useUpdateSupportTicket();
  const assignTicket = useAssignTicket();
  const escalateTicket = useEscalateTicket();
  const createTicket = useCreateSupportTicket();

  // Filter handlers
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      assigned_agent_id: '',
      category_id: '',
      search: '',
    });
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(tickets.map(t => t.id));
    } else {
      setSelectedTickets([]);
    }
  };

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    if (checked) {
      setSelectedTickets(prev => [...prev, ticketId]);
    } else {
      setSelectedTickets(prev => prev.filter(id => id !== ticketId));
    }
  };

  // Action handlers
  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    try {
      await updateTicket.mutateAsync({
        id: ticketId,
        updates: { status: newStatus as any }
      });
      toast.success('Ticket status updated successfully');
    } catch (error) {
      toast.error('Failed to update ticket status');
    }
  };

  const handleAssignTicket = async (agentId: string) => {
    try {
      await assignTicket.mutateAsync({
        ticketId: selectedTicketForAction,
        agentId,
        reason: 'Manual assignment'
      });
      toast.success('Ticket assigned successfully');
      setIsAssignDialogOpen(false);
      setSelectedTicketForAction('');
    } catch (error) {
      toast.error('Failed to assign ticket');
    }
  };

  const handleEscalateTicket = async (ticketId: string) => {
    try {
      await escalateTicket.mutateAsync({
        ticketId,
        escalationLevel: 1,
        reason: 'Manual escalation from ticket list'
      });
      toast.success('Ticket escalated successfully');
    } catch (error) {
      toast.error('Failed to escalate ticket');
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      await Promise.all(
        selectedTickets.map(ticketId =>
          updateTicket.mutateAsync({
            id: ticketId,
            updates: { status: newStatus as any }
          })
        )
      );
      toast.success(`Updated ${selectedTickets.length} tickets`);
      setSelectedTickets([]);
    } catch (error) {
      toast.error('Failed to update tickets');
    }
  };

  return (
    <div className=\"p-6 space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent\">
            Support Tickets
          </h1>
          <p className=\"text-muted-foreground mt-2\">
            Manage and track customer support tickets
          </p>
        </div>
        <div className=\"flex items-center gap-3\">
          {selectedTickets.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant=\"outline\">
                  Bulk Actions ({selectedTickets.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                {statusOptions.map(status => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => handleBulkStatusUpdate(status.value)}
                  >
                    {status.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className=\"bg-blue-600 hover:bg-blue-700\">
                <PlusIcon className=\"w-4 h-4 mr-2\" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className=\"max-w-md\">
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
                <DialogDescription>
                  Create a new support ticket for customer assistance
                </DialogDescription>
              </DialogHeader>
              <CreateTicketForm 
                categories={categories}
                onSubmit={async (data) => {
                  try {
                    await createTicket.mutateAsync(data);
                    toast.success('Ticket created successfully');
                    setIsCreateDialogOpen(false);
                  } catch (error) {
                    toast.error('Failed to create ticket');
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
        <CardContent className=\"p-6\">
          <div className=\"flex items-center gap-4 flex-wrap\">
            <div className=\"relative min-w-64\">
              <SearchIcon className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground\" />
              <Input
                placeholder=\"Search tickets, customers, descriptions...\"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className=\"pl-10\"
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className=\"w-40\">
                <SelectValue placeholder=\"Status\" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=\"\">All Status</SelectItem>
                {statusOptions.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger className=\"w-40\">
                <SelectValue placeholder=\"Priority\" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=\"\">All Priority</SelectItem>
                <SelectItem value=\"critical\">Critical</SelectItem>
                <SelectItem value=\"high\">High</SelectItem>
                <SelectItem value=\"medium\">Medium</SelectItem>
                <SelectItem value=\"low\">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.assigned_agent_id} onValueChange={(value) => handleFilterChange('assigned_agent_id', value)}>
              <SelectTrigger className=\"w-48\">
                <SelectValue placeholder=\"Assigned Agent\" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=\"\">All Agents</SelectItem>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.agent_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.category_id} onValueChange={(value) => handleFilterChange('category_id', value)}>
              <SelectTrigger className=\"w-48\">
                <SelectValue placeholder=\"Category\" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=\"\">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {Object.values(filters).some(value => value !== '') && (
              <Button variant=\"outline\" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
        <CardHeader>
          <div className=\"flex items-center justify-between\">
            <div>
              <CardTitle>Support Tickets ({tickets.length})</CardTitle>
              <CardDescription>
                Manage customer support requests and track resolution progress
              </CardDescription>
            </div>
            <div className=\"flex items-center gap-2\">
              <Checkbox
                checked={selectedTickets.length === tickets.length && tickets.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label=\"Select all tickets\"
              />
              <span className=\"text-sm text-muted-foreground\">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className=\"p-0\">
          {ticketsLoading ? (
            <div className=\"text-center py-12\">
              <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto\"></div>
              <p className=\"mt-4 text-muted-foreground\">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className=\"text-center py-12\">
              <TicketIcon className=\"mx-auto h-12 w-12 text-muted-foreground\" />
              <p className=\"mt-4 text-muted-foreground\">No tickets found</p>
              <p className=\"text-sm text-muted-foreground\">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className=\"divide-y divide-border\">
              {tickets.map((ticket, index) => (
                <div key={ticket.id} className={`p-6 hover:bg-white/30 transition-colors ${index % 2 === 0 ? 'bg-white/10' : ''}`}>
                  <div className=\"flex items-center justify-between\">
                    <div className=\"flex items-center space-x-4\">
                      <Checkbox
                        checked={selectedTickets.includes(ticket.id)}
                        onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                      />
                      
                      <div className=\"flex-1 min-w-0\">
                        <div className=\"flex items-center gap-3 mb-2\">
                          <Link 
                            href={`/support/tickets/${ticket.id}`}
                            className=\"font-semibold text-blue-600 hover:text-blue-700 transition-colors\"
                          >
                            {ticket.ticket_number}
                          </Link>
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
                              Escalated
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className=\"font-medium text-foreground mb-1 line-clamp-1\">
                          {ticket.ticket_title}
                        </h3>
                        
                        <div className=\"flex items-center gap-4 text-sm text-muted-foreground\">
                          <span>{ticket.customer_name}</span>
                          <span>•</span>
                          <span>{ticket.category?.category_name || 'Uncategorized'}</span>
                          <span>•</span>
                          <span className=\"flex items-center gap-1\">
                            <ClockIcon className=\"w-3 h-3\" />
                            {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString()}
                          </span>
                          {ticket.response_count > 0 && (
                            <>
                              <span>•</span>
                              <span className=\"flex items-center gap-1\">
                                <MessageSquareIcon className=\"w-3 h-3\" />
                                {ticket.response_count} responses
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className=\"flex items-center space-x-3\">
                      {ticket.assigned_agent ? (
                        <div className=\"flex items-center gap-2\">
                          <Avatar className=\"h-8 w-8\">
                            <AvatarFallback className=\"text-xs\">
                              {ticket.assigned_agent.agent_name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className=\"text-right\">
                            <p className=\"text-sm font-medium\">{ticket.assigned_agent.agent_name}</p>
                            <p className=\"text-xs text-muted-foreground\">{ticket.assigned_agent.skill_level}</p>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant=\"outline\"
                          size=\"sm\"
                          onClick={() => {
                            setSelectedTicketForAction(ticket.id);
                            setIsAssignDialogOpen(true);
                          }}
                        >
                          <UserIcon className=\"w-4 h-4 mr-1\" />
                          Assign
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant=\"ghost\" size=\"sm\">
                            <MoreHorizontalIcon className=\"w-4 h-4\" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align=\"end\">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/support/tickets/${ticket.id}`}>
                              <EyeIcon className=\"w-4 h-4 mr-2\" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTicketForAction(ticket.id);
                              setIsAssignDialogOpen(true);
                            }}
                          >
                            <UserIcon className=\"w-4 h-4 mr-2\" />
                            Reassign
                          </DropdownMenuItem>
                          {!ticket.is_escalated && (
                            <DropdownMenuItem
                              onClick={() => handleEscalateTicket(ticket.id)}
                            >
                              <AlertTriangleIcon className=\"w-4 h-4 mr-2\" />
                              Escalate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          {statusOptions
                            .filter(status => status.value !== ticket.status)
                            .map(status => (
                              <DropdownMenuItem
                                key={status.value}
                                onClick={() => handleStatusUpdate(ticket.id, status.value)}
                              >
                                {status.label}
                              </DropdownMenuItem>
                            ))
                          }
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Agent Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Ticket to Agent</DialogTitle>
            <DialogDescription>
              Select an agent to assign this ticket to
            </DialogDescription>
          </DialogHeader>
          <div className=\"space-y-4\">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className=\"flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50\"
                onClick={() => handleAssignTicket(agent.id)}
              >
                <div className=\"flex items-center gap-3\">
                  <Avatar>
                    <AvatarFallback>
                      {agent.agent_name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className=\"font-medium\">{agent.agent_name}</p>
                    <p className=\"text-sm text-muted-foreground\">{agent.skill_level}</p>
                  </div>
                </div>
                <div className=\"text-right text-sm\">
                  <p className=\"font-medium\">{agent.current_ticket_count}/{agent.max_concurrent_tickets}</p>
                  <p className=\"text-muted-foreground\">Active tickets</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Ticket Form Component
interface CreateTicketFormProps {
  categories: any[];
  onSubmit: (data: any) => void;
}

function CreateTicketForm({ categories, onSubmit }: CreateTicketFormProps) {
  const [formData, setFormData] = useState({
    ticket_title: '',
    ticket_description: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    priority: 'medium',
    category_id: '',
    source_channel: 'web',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      customer_id: 'temp-customer-id', // In real app, this would come from customer lookup
    });
  };

  return (
    <form onSubmit={handleSubmit} className=\"space-y-4\">
      <div className=\"space-y-2\">
        <Label htmlFor=\"customer_name\">Customer Name</Label>
        <Input
          id=\"customer_name\"
          value={formData.customer_name}
          onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
          required
        />
      </div>

      <div className=\"space-y-2\">
        <Label htmlFor=\"customer_email\">Customer Email</Label>
        <Input
          id=\"customer_email\"
          type=\"email\"
          value={formData.customer_email}
          onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
          required
        />
      </div>

      <div className=\"space-y-2\">
        <Label htmlFor=\"ticket_title\">Ticket Title</Label>
        <Input
          id=\"ticket_title\"
          value={formData.ticket_title}
          onChange={(e) => setFormData(prev => ({ ...prev, ticket_title: e.target.value }))}
          required
        />
      </div>

      <div className=\"space-y-2\">
        <Label htmlFor=\"ticket_description\">Description</Label>
        <Textarea
          id=\"ticket_description\"
          value={formData.ticket_description}
          onChange={(e) => setFormData(prev => ({ ...prev, ticket_description: e.target.value }))}
          required
          rows={3}
        />
      </div>

      <div className=\"grid grid-cols-2 gap-4\">
        <div className=\"space-y-2\">
          <Label htmlFor=\"priority\">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=\"low\">Low</SelectItem>
              <SelectItem value=\"medium\">Medium</SelectItem>
              <SelectItem value=\"high\">High</SelectItem>
              <SelectItem value=\"critical\">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className=\"space-y-2\">
          <Label htmlFor=\"category_id\">Category</Label>
          <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
            <SelectTrigger>
              <SelectValue placeholder=\"Select category\" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.category_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type=\"submit\">Create Ticket</Button>
      </DialogFooter>
    </form>
  );
}