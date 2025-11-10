'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DndContext, 
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { 
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/lib/supabase';
import { formatDate, formatCurrency } from '@/lib/utils';
import { 
  WORKFLOW_STAGES, 
  WORKFLOW_STAGE_LABELS,
  WorkflowStage,
  getPriorityColor,
} from '@/types/order';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Force this page to be dynamic
export const dynamic = 'force-dynamic';

interface WorkflowOrder {
  id: string;
  order_number: string;
  customer_id: string;
  status: string;
  priority_level: string;
  total_amount: number;
  delivery_date: string;
  created_at: string;
  workflow_status: string;
  progress_percentage: number;
  assigned_employee_id?: string;
  status_notes?: string;
  entered_at?: string;
  customers?: {
    full_name: string;
    customer_code: string;
  };
  employees?: {
    full_name: string;
  };
}

interface KanbanColumn {
  id: string;
  title: string;
  status: WorkflowStage;
  orders: WorkflowOrder[];
  color: string;
}

interface DraggedOrder {
  id: string;
  order_number: string;
  customer_name: string;
  priority_level: string;
  total_amount: number;
}

export default function WorkflowPage() {
  const [activeOrder, setActiveOrder] = useState<DraggedOrder | null>(null);
  const queryClient = useQueryClient();

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch orders with workflow statuses
  const { data: workflowOrders, isLoading, error } = useQuery({
    queryKey: ['workflow-orders'],
    queryFn: async (): Promise<WorkflowOrder[]> => {
      const { data, error } = await supabase
        .from('order_workflow_statuses')
        .select(`
          order_id,
          current_status,
          progress_percentage,
          assigned_employee_id,
          status_notes,
          entered_at,
          orders!inner (
            id,
            order_number,
            customer_id,
            status,
            priority_level,
            total_amount,
            delivery_date,
            created_at,
            customers!inner (
              full_name,
              customer_code
            )
          ),
          employees (
            full_name
          )
        `);

      if (error) throw error;

      return data?.map((item) => ({
        id: item.orders.id,
        order_number: item.orders.order_number,
        customer_id: item.orders.customer_id,
        status: item.orders.status,
        priority_level: item.orders.priority_level,
        total_amount: item.orders.total_amount,
        delivery_date: item.orders.delivery_date,
        created_at: item.orders.created_at,
        workflow_status: item.current_status,
        progress_percentage: item.progress_percentage || 0,
        assigned_employee_id: item.assigned_employee_id,
        status_notes: item.status_notes,
        entered_at: item.entered_at,
        customers: item.orders.customers,
        employees: item.employees,
      })) || [];
    },
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  // Mutation to update workflow status
  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: WorkflowStage }) => {
      const { error } = await supabase
        .from('order_workflow_statuses')
        .update({
          current_status: newStatus,
          entered_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-orders'] });
      toast.success('Order status updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating workflow status:', error);
      toast.error('Failed to update order status');
    },
  });

  // Organize orders into columns by workflow status
  const columns: KanbanColumn[] = Object.values(WORKFLOW_STAGES).map((stage) => {
    const stageOrders = workflowOrders?.filter(order => order.workflow_status === stage) || [];
    
    return {
      id: stage,
      title: WORKFLOW_STAGE_LABELS[stage],
      status: stage,
      orders: stageOrders,
      color: getStageColor(stage),
    };
  });

  // Get stage-specific colors
  function getStageColor(stage: WorkflowStage): string {
    switch (stage) {
      case WORKFLOW_STAGES.CONSULTATION: return 'border-blue-200 bg-blue-50';
      case WORKFLOW_STAGES.MEASUREMENTS: return 'border-purple-200 bg-purple-50';
      case WORKFLOW_STAGES.DESIGN_APPROVAL: return 'border-indigo-200 bg-indigo-50';
      case WORKFLOW_STAGES.FABRIC_SELECTION: return 'border-green-200 bg-green-50';
      case WORKFLOW_STAGES.CUTTING: return 'border-yellow-200 bg-yellow-50';
      case WORKFLOW_STAGES.SEWING: return 'border-orange-200 bg-orange-50';
      case WORKFLOW_STAGES.FITTING: return 'border-pink-200 bg-pink-50';
      case WORKFLOW_STAGES.ALTERATIONS: return 'border-red-200 bg-red-50';
      case WORKFLOW_STAGES.QUALITY_CONTROL: return 'border-teal-200 bg-teal-50';
      case WORKFLOW_STAGES.DELIVERY: return 'border-emerald-200 bg-emerald-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  }

  // Handle drag start
  function handleDragStart(event: DragStartEvent) {
    const orderId = event.active.id as string;
    const order = workflowOrders?.find(o => o.id === orderId);
    
    if (order) {
      setActiveOrder({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customers?.full_name || 'Unknown Customer',
        priority_level: order.priority_level,
        total_amount: order.total_amount,
      });
    }
  }

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      setActiveOrder(null);
      return;
    }

    const orderId = active.id as string;
    const overContainer = over.id as string;

    // Find the current order
    const order = workflowOrders?.find(o => o.id === orderId);
    if (!order) {
      setActiveOrder(null);
      return;
    }

    // Determine if we're dropping on a column or another order
    let newStatus: WorkflowStage;
    
    // Check if we're dropping on a column
    if (Object.values(WORKFLOW_STAGES).includes(overContainer as WorkflowStage)) {
      newStatus = overContainer as WorkflowStage;
    } else {
      // We're dropping on another order, find its column
      const targetOrder = workflowOrders?.find(o => o.id === overContainer);
      if (!targetOrder) {
        setActiveOrder(null);
        return;
      }
      newStatus = targetOrder.workflow_status as WorkflowStage;
    }

    // Only update if status actually changed
    if (order.workflow_status !== newStatus) {
      updateWorkflowMutation.mutate({ orderId, newStatus });
    }

    setActiveOrder(null);
  }

  // Get workflow statistics
  const stats = workflowOrders ? {
    totalOrders: workflowOrders.length,
    inProgress: workflowOrders.filter(o => o.workflow_status !== WORKFLOW_STAGES.DELIVERY).length,
    completed: workflowOrders.filter(o => o.workflow_status === WORKFLOW_STAGES.DELIVERY).length,
    overdue: workflowOrders.filter(o => 
      new Date(o.delivery_date) < new Date() && 
      o.workflow_status !== WORKFLOW_STAGES.DELIVERY
    ).length,
  } : { totalOrders: 0, inProgress: 0, completed: 0, overdue: 0 };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading workflow</h3>
        <p className="mt-1 text-sm text-gray-500">
          There was a problem loading the workflow board.
        </p>
        <div className="mt-6">
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Management</h1>
          <p className="text-gray-600">Track and manage order progress through workflow stages</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/orders">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowRightIcon className="h-4 w-4 rotate-180" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
              <ChartBarIcon className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
              <ClockIcon className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4 overflow-x-auto min-h-[600px]">
          {columns.map((column) => (
            <WorkflowColumn 
              key={column.id} 
              column={column}
            />
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeOrder ? (
            <div className="bg-white rounded-lg border shadow-lg p-4 space-y-3 rotate-2 opacity-90">
              <div className="font-medium text-blue-600">{activeOrder.order_number}</div>
              <div className="text-sm text-gray-600">{activeOrder.customer_name}</div>
              <div className="text-sm font-medium text-gray-900">
                {formatCurrency(activeOrder.total_amount)}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// Sortable Order Card Component
interface SortableOrderCardProps {
  order: WorkflowOrder;
}

function SortableOrderCard({ order }: SortableOrderCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: order.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = new Date(order.delivery_date) < new Date() && order.workflow_status !== WORKFLOW_STAGES.DELIVERY;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white rounded-lg border shadow-sm p-4 space-y-3 cursor-move
        hover:shadow-md transition-shadow
        ${isDragging ? 'opacity-50' : ''}
        ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'}
      `}
    >
      {/* Order Header */}
      <div className="flex items-center justify-between">
        <Link href={`/orders/${order.id}`} className="font-medium text-blue-600 hover:text-blue-800">
          {order.order_number}
        </Link>
        <Badge className={getPriorityColor(order.priority_level)}>
          {order.priority_level?.toUpperCase()}
        </Badge>
      </div>

      {/* Customer Info */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <UserIcon className="h-4 w-4" />
        <span>{order.customers?.full_name}</span>
      </div>

      {/* Delivery Date */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <CalendarIcon className="h-4 w-4" />
        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
          {formatDate(order.delivery_date)}
          {isOverdue && ' (Overdue)'}
        </span>
      </div>

      {/* Amount */}
      <div className="text-sm font-medium text-gray-900">
        {formatCurrency(order.total_amount)}
      </div>

      {/* Progress Bar */}
      <div className="w-full">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{order.progress_percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${order.progress_percentage}%` }}
          />
        </div>
      </div>

      {/* Assigned Employee */}
      {order.employees && (
        <div className="text-xs text-gray-500">
          Assigned: {order.employees.full_name}
        </div>
      )}

      {/* Status Notes */}
      {order.status_notes && (
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          {order.status_notes}
        </div>
      )}
    </div>
  );
}

// Workflow Column Component
interface WorkflowColumnProps {
  column: KanbanColumn;
}

function WorkflowColumn({ column }: WorkflowColumnProps) {
  const {
    setNodeRef,
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`bg-white rounded-lg border-2 ${column.color} p-4 min-h-[500px]`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{column.title}</h3>
        <Badge variant="secondary" className="text-xs">
          {column.orders.length}
        </Badge>
      </div>

      {/* Order Cards */}
      <SortableContext items={column.orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {column.orders.map((order) => (
            <SortableOrderCard 
              key={order.id} 
              order={order}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drop Zone Indicator */}
      <div className="mt-4 border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
        Drop orders here
      </div>
    </div>
  );
}