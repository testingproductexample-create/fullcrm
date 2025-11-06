'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types/database';
import { 
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Plus,
  List,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function OrdersPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
    totalRevenue: 0,
    avgOrderValue: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [profile]);

  async function fetchOrders() {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setOrders(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const active = data?.filter(o => ['new', 'confirmed', 'in_progress', 'quality_check'].includes(o.status)).length || 0;
      const completed = data?.filter(o => o.status === 'delivered').length || 0;
      const pending = data?.filter(o => o.status === 'new').length || 0;
      const totalRevenue = data?.reduce((sum, o) => sum + parseFloat(o.final_amount.toString() || '0'), 0) || 0;
      const avgOrderValue = total > 0 ? totalRevenue / total : 0;

      setStats({ total, active, completed, pending, totalRevenue, avgOrderValue });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-900';
      case 'confirmed':
        return 'bg-purple-100 text-purple-900';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-900';
      case 'quality_check':
        return 'bg-orange-100 text-orange-900';
      case 'ready':
        return 'bg-green-100 text-green-900';
      case 'delivered':
        return 'bg-semantic-success/20 text-green-900';
      case 'cancelled':
        return 'bg-semantic-error/20 text-red-900';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getOrderTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bespoke: 'Bespoke',
      casual: 'Casual Wear',
      alteration: 'Alteration',
      repair: 'Repair',
      special_occasion: 'Special Occasion'
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'rush':
        return 'text-semantic-error';
      case 'normal':
        return 'text-neutral-700';
      case 'low':
        return 'text-neutral-500';
      default:
        return 'text-neutral-700';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-glass-light rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-glass-light rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Orders Management</h1>
          <p className="text-body text-neutral-700 mt-1">
            Manage order lifecycle from creation to delivery
          </p>
        </div>
        <Link href="/dashboard/orders/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Order
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">Total Orders</p>
              <p className="text-h3 font-bold text-neutral-900">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary-50">
              <ShoppingBag className="w-6 h-6 text-primary-500" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">Active Orders</p>
              <p className="text-h3 font-bold text-yellow-600">{stats.active}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">Completed</p>
              <p className="text-h3 font-bold text-semantic-success">{stats.completed}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <CheckCircle className="w-6 h-6 text-semantic-success" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 glass-card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700 mb-1">Pending</p>
              <p className="text-h3 font-bold text-primary-600">{stats.pending}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <AlertCircle className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-large font-semibold text-neutral-900">Total Revenue</h3>
            <TrendingUp className="w-5 h-5 text-semantic-success" />
          </div>
          <p className="text-h2 font-bold text-primary-600">
            AED {stats.totalRevenue.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-small text-neutral-700 mt-2">
            From {stats.total} orders
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-large font-semibold text-neutral-900">Avg Order Value</h3>
            <BarChart3 className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-h2 font-bold text-primary-600">
            AED {stats.avgOrderValue.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-small text-neutral-700 mt-2">
            Per order average
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h3 className="text-large font-semibold text-neutral-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/dashboard/orders/new" className="btn-primary flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            New Order
          </Link>
          <Link href="/dashboard/orders/list" className="btn-secondary flex items-center justify-center gap-2">
            <List className="w-5 h-5" />
            View All Orders
          </Link>
          <Link href="/dashboard/orders/templates" className="btn-secondary flex items-center justify-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Templates
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-large font-semibold text-neutral-900">Recent Orders</h3>
          <Link href="/dashboard/orders/list" className="text-primary-500 hover:text-primary-600 text-small font-medium">
            View All
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <p className="text-body text-neutral-700">No orders yet</p>
            <Link href="/dashboard/orders/new" className="text-primary-500 hover:text-primary-600 font-medium mt-2 inline-block">
              Create your first order
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="block p-4 rounded-lg border border-neutral-200 hover:border-primary-500 hover:bg-primary-50/30 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-neutral-900">{order.order_number}</span>
                    <span className={`px-3 py-1 rounded-full text-tiny font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {order.priority_level === 'rush' && (
                      <span className="px-2 py-1 rounded text-tiny font-medium bg-red-100 text-red-900">
                        RUSH
                      </span>
                    )}
                  </div>
                  <span className="text-body font-semibold text-primary-600">
                    AED {parseFloat(order.final_amount.toString()).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-small text-neutral-700">
                  <span>{getOrderTypeLabel(order.order_type)}</span>
                  <div className="flex items-center gap-4">
                    {order.delivery_date && (
                      <span>Due: {format(new Date(order.delivery_date), 'MMM dd, yyyy')}</span>
                    )}
                    <span>{format(new Date(order.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                {order.progress_percentage > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all"
                        style={{ width: `${order.progress_percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-tiny text-neutral-700 mt-1">{order.progress_percentage}% complete</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
