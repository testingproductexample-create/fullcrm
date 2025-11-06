'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Order, OrderWorkflowStatus, WorkflowAnalytics, Customer } from '@/types/database';
import { 
  LayoutGrid,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowRight,
  List,
  BarChart3,
  Filter,
  GripVertical
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core';

interface WorkflowStage {
  status: string;
  label: string;
  orders: Array<Order & { workflow_status?: OrderWorkflowStatus; customer?: Customer }>;
  analytics?: WorkflowAnalytics;
}

interface OrderCard {
  id: string;
  order_number: string;
  customer_name: string;
  final_amount: number;
  delivery_date?: string;
  priority_level: string;
  workflow_status?: OrderWorkflowStatus;
}

export default function WorkflowDashboardPage() {
  const { profile } = useAuth();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [activeOrder, setActiveOrder] = useState<OrderCard | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const stages = [
    { status: 'consultation', label: 'Consultation', color: 'bg-blue-500' },
    { status: 'measurement', label: 'Measurement', color: 'bg-purple-500' },
    { status: 'design_approval', label: 'Design Approval', color: 'bg-indigo-500' },
    { status: 'cutting', label: 'Cutting', color: 'bg-yellow-500' },
    { status: 'first_fitting', label: 'First Fitting', color: 'bg-orange-500' },
    { status: 'sewing', label: 'Sewing', color: 'bg-pink-500' },
    { status: 'quality_check', label: 'Quality Check', color: 'bg-red-500' },
    { status: 'final_fitting', label: 'Final Fitting', color: 'bg-teal-500' },
    { status: 'completion', label: 'Completion', color: 'bg-green-500' },
    { status: 'delivery', label: 'Delivery', color: 'bg-gray-500' }
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchWorkflowData();
    
    // Set up real-time subscription for workflow status changes
    if (profile?.organization_id) {
      const subscription = supabase
        .channel('workflow-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'order_workflow_statuses',
            filter: `organization_id=eq.${profile.organization_id}`
          },
          (payload) => {
            console.log('Workflow status change detected:', payload);
            toast.info('Workflow status updated');
            fetchWorkflowData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `organization_id=eq.${profile.organization_id}`
          },
          (payload) => {
            console.log('Order change detected:', payload);
            fetchWorkflowData();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [profile, filterType, filterPriority]);

  async function fetchWorkflowData() {
    if (!profile?.organization_id) return;

    setLoading(true);
    try {
      // Fetch workflow statuses with order data
      const { data: workflowStatusData } = await supabase
        .from('order_workflow_statuses')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .is('completed_at', null);

      // Fetch orders
      let ordersQuery = supabase
        .from('orders')
        .select('*')
        .eq('organization_id', profile.organization_id);

      if (filterType !== 'all') {
        ordersQuery = ordersQuery.eq('order_type', filterType);
      }
      if (filterPriority !== 'all') {
        ordersQuery = ordersQuery.eq('priority_level', filterPriority);
      }

      const { data: ordersData } = await ordersQuery;

      // Fetch customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, full_name, customer_code')
        .eq('organization_id', profile.organization_id);

      // Fetch analytics
      const { data: analyticsData } = await supabase
        .from('workflow_analytics')
        .select('*')
        .eq('organization_id', profile.organization_id);

      // Create customer lookup
      const customerMap = new Map(customersData?.map(c => [c.id, c]) || []);

      // Create workflow status lookup
      const statusMap = new Map(workflowStatusData?.map(s => [s.order_id, s]) || []);

      // Create analytics lookup
      const analyticsMap = new Map(analyticsData?.map(a => [a.status, a]) || []);

      // Group orders by workflow stage
      const stageGroups = stages.map(stage => {
        const stageOrders = ordersData?.filter(order => {
          const workflowStatus = statusMap.get(order.id);
          return workflowStatus?.current_status === stage.status;
        }).map(order => ({
          ...order,
          workflow_status: statusMap.get(order.id),
          customer: customerMap.get(order.customer_id)
        })) || [];

        return {
          status: stage.status,
          label: stage.label,
          orders: stageOrders,
          analytics: analyticsMap.get(stage.status)
        };
      });

      setWorkflowStages(stageGroups);
      if (!isDragging) {
        toast.success('Workflow data refreshed successfully');
      }
    } catch (error) {
      console.error('Error fetching workflow data:', error);
      toast.error('Failed to load workflow data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDragStart(event: DragStartEvent) {
    setIsDragging(true);
    const { active } = event;
    const orderId = active.id as string;
    
    // Find the order being dragged
    for (const stage of workflowStages) {
      const order = stage.orders.find(o => o.id === orderId);
      if (order) {
        setActiveOrder({
          id: order.id,
          order_number: order.order_number,
          customer_name: order.customer?.full_name || 'Unknown',
          final_amount: parseFloat(order.final_amount.toString()),
          delivery_date: order.delivery_date,
          priority_level: order.priority_level,
          workflow_status: order.workflow_status
        });
        break;
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setIsDragging(false);
    setActiveOrder(null);
    
    const { active, over } = event;

    if (!over || !profile?.organization_id) return;

    const orderId = active.id as string;
    const newStatus = over.id as string;

    // Find current stage
    let currentStatus = '';
    for (const stage of workflowStages) {
      if (stage.orders.some(o => o.id === orderId)) {
        currentStatus = stage.status;
        break;
      }
    }

    if (currentStatus === newStatus) return; // No change

    try {
      // Calculate progress percentage
      const stageIndex = stages.findIndex(s => s.status === newStatus);
      const progressPercentage = Math.round(((stageIndex + 1) / stages.length) * 100);

      // Update workflow status
      const { error: statusError } = await supabase
        .from('order_workflow_statuses')
        .update({
          current_status: newStatus,
          progress_percentage: progressPercentage,
          entered_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (statusError) throw statusError;

      // Update order
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          progress_percentage: progressPercentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Add status history
      await supabase
        .from('order_status_history')
        .insert({
          organization_id: profile.organization_id,
          order_id: orderId,
          status: newStatus,
          previous_status: currentStatus,
          changed_by: profile.full_name || 'System',
          changed_at: new Date().toISOString(),
          notes: `Moved from ${stages.find(s => s.status === currentStatus)?.label} to ${stages.find(s => s.status === newStatus)?.label}`,
          percentage_completion: progressPercentage
        });

      toast.success(`Order moved to ${stages.find(s => s.status === newStatus)?.label}`);
      fetchWorkflowData();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status. Please try again.');
    }
  }

  const totalActiveOrders = workflowStages.reduce((sum, stage) => sum + stage.orders.length, 0);
  const bottleneckStages = workflowStages.filter(stage => 
    stage.analytics && stage.analytics.bottleneck_score && parseFloat(stage.analytics.bottleneck_score.toString()) > 50
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-h2 font-bold text-neutral-900">Workflow Dashboard</h1>
            <p className="text-body text-neutral-700">Track orders across all workflow stages - Drag & drop to move orders</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/workflow/analytics" className="btn-secondary flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analytics
            </Link>
            <Link href="/dashboard/workflow/manage" className="btn-secondary flex items-center gap-2">
              <List className="w-5 h-5" />
              Manage
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <LayoutGrid className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-large font-bold text-neutral-900">{totalActiveOrders}</p>
                <p className="text-small text-neutral-700">Active Orders</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-large font-bold text-neutral-900">
                  {workflowStages.find(s => s.status === 'completion')?.orders.length || 0}
                </p>
                <p className="text-small text-neutral-700">Near Completion</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-large font-bold text-neutral-900">{bottleneckStages.length}</p>
                <p className="text-small text-neutral-700">Bottlenecks</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-large font-bold text-neutral-900">
                  {workflowStages.reduce((sum, s) => sum + (s.orders.filter(o => o.priority_level === 'rush').length), 0)}
                </p>
                <p className="text-small text-neutral-700">Rush Orders</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-neutral-700" />
            <div className="flex gap-4 flex-1">
              <div>
                <label className="text-small text-neutral-700 mr-2">Order Type:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input-field py-2"
                >
                  <option value="all">All Types</option>
                  <option value="bespoke">Bespoke Suit</option>
                  <option value="casual">Casual Wear</option>
                  <option value="alteration">Alteration</option>
                  <option value="repair">Repair</option>
                  <option value="special_occasion">Special Occasion</option>
                </select>
              </div>
              <div>
                <label className="text-small text-neutral-700 mr-2">Priority:</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="input-field py-2"
                >
                  <option value="all">All Priorities</option>
                  <option value="rush">Rush</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board with Drag & Drop */}
        {loading ? (
          <div className="glass-card p-12 text-center">
            <p className="text-body text-neutral-700">Loading workflow data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {stages.map((stage) => {
                const stageData = workflowStages.find(s => s.status === stage.status);
                const orderCount = stageData?.orders.length || 0;
                const analytics = stageData?.analytics;
                const isBottleneck = analytics && analytics.bottleneck_score && 
                  parseFloat(analytics.bottleneck_score.toString()) > 50 || false;

                return (
                  <DroppableColumn
                    key={stage.status}
                    id={stage.status}
                    stage={stage}
                    stageData={stageData}
                    orderCount={orderCount}
                    analytics={analytics}
                    isBottleneck={isBottleneck}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeOrder ? (
            <div className="w-80 p-3 bg-white rounded-lg border-2 border-primary-500 shadow-xl opacity-90">
              <div className="flex justify-between items-start mb-2">
                <span className="text-small font-medium text-neutral-900">
                  {activeOrder.order_number}
                </span>
                {activeOrder.priority_level === 'rush' && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-900 rounded text-tiny font-medium">
                    RUSH
                  </span>
                )}
              </div>
              <p className="text-tiny text-neutral-700 mb-2">
                {activeOrder.customer_name}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-tiny text-primary-600 font-medium">
                  AED {activeOrder.final_amount.toLocaleString('en-AE')}
                </span>
                {activeOrder.delivery_date && (
                  <span className="text-tiny text-neutral-600">
                    {format(new Date(activeOrder.delivery_date), 'MMM dd')}
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

// Droppable Column Component
function DroppableColumn({ 
  id, 
  stage, 
  stageData, 
  orderCount, 
  analytics, 
  isBottleneck 
}: { 
  id: string;
  stage: { status: string; label: string; color: string };
  stageData?: WorkflowStage;
  orderCount: number;
  analytics?: WorkflowAnalytics;
  isBottleneck: boolean;
}) {
  const { useDroppable } = require('@dnd-kit/core');
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="w-80 flex-shrink-0">
      <div className={`glass-card ${isBottleneck ? 'border-2 border-red-400' : ''} min-h-[200px]`}>
        {/* Stage Header */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
              <h3 className="font-semibold text-neutral-900">{stage.label}</h3>
            </div>
            <span className="px-2 py-1 bg-neutral-100 rounded-full text-tiny font-medium">
              {orderCount}
            </span>
          </div>

          {/* Analytics Badge */}
          {analytics && (
            <div className="flex gap-2 text-tiny">
              {analytics.average_completion_time && (
                <span className="text-neutral-700">
                  Avg: {analytics.average_completion_time}h
                </span>
              )}
              {isBottleneck && (
                <span className="text-red-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Bottleneck
                </span>
              )}
            </div>
          )}
        </div>

        {/* Orders List */}
        <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
          {orderCount === 0 ? (
            <p className="text-center text-small text-neutral-500 py-8">Drop orders here</p>
          ) : (
            stageData?.orders.map((order) => (
              <DraggableOrderCard
                key={order.id}
                order={order}
                stageColor={stage.color}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Draggable Order Card Component
function DraggableOrderCard({ 
  order, 
  stageColor 
}: { 
  order: Order & { workflow_status?: OrderWorkflowStatus; customer?: Customer };
  stageColor: string;
}) {
  const { useDraggable } = require('@dnd-kit/core');
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 bg-white rounded-lg border border-neutral-200 hover:border-primary-500 hover:shadow-md transition-all cursor-move ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <Link
              href={`/dashboard/orders/${order.id}`}
              className="text-small font-medium text-neutral-900 hover:text-primary-600"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {order.order_number}
            </Link>
            {order.priority_level === 'rush' && (
              <span className="px-2 py-0.5 bg-red-100 text-red-900 rounded text-tiny font-medium">
                RUSH
              </span>
            )}
          </div>

          <p className="text-tiny text-neutral-700 mb-2">
            {order.customer?.full_name || 'Unknown Customer'}
          </p>

          {order.workflow_status?.sub_status && (
            <p className="text-tiny text-neutral-600 mb-2">
              {order.workflow_status.sub_status.replace('_', ' ')}
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-tiny text-primary-600 font-medium">
              AED {parseFloat(order.final_amount.toString()).toLocaleString('en-AE')}
            </span>
            {order.delivery_date && (
              <span className="text-tiny text-neutral-600">
                {format(new Date(order.delivery_date), 'MMM dd')}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          {order.workflow_status && (
            <div className="mt-2">
              <div className="w-full bg-neutral-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${stageColor}`}
                  style={{ width: `${order.workflow_status.progress_percentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
