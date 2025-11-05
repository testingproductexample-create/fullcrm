'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Order, Customer } from '@/types/database';
import { 
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MoreVertical,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function OrdersListPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<(Order & { customers?: Customer })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [profile]);

  async function fetchOrders() {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers(id, full_name, email, phone, customer_code)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customers?.customer_code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesType = filterType === 'all' || order.order_type === filterType;
    const matchesPriority = filterPriority === 'all' || order.priority_level === filterPriority;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

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
      casual: 'Casual',
      alteration: 'Alteration',
      repair: 'Repair',
      special_occasion: 'Special'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-glass-light rounded-lg animate-pulse"></div>
        <div className="h-96 bg-glass-light rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/orders"
          className="p-2 hover:bg-glass-light rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-h2 font-bold text-neutral-900">All Orders</h1>
          <p className="text-body text-neutral-700">Comprehensive order management and tracking</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by order number, customer name, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-glass pl-10 w-full"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-glass"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="quality_check">Quality Check</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-glass"
          >
            <option value="all">All Types</option>
            <option value="bespoke">Bespoke</option>
            <option value="casual">Casual Wear</option>
            <option value="alteration">Alteration</option>
            <option value="repair">Repair</option>
            <option value="special_occasion">Special Occasion</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="input-glass"
          >
            <option value="all">All Priority</option>
            <option value="rush">Rush</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-6 py-4 text-left text-small font-semibold text-neutral-900">Order</th>
                <th className="px-6 py-4 text-left text-small font-semibold text-neutral-900">Customer</th>
                <th className="px-6 py-4 text-left text-small font-semibold text-neutral-900">Type</th>
                <th className="px-6 py-4 text-left text-small font-semibold text-neutral-900">Status</th>
                <th className="px-6 py-4 text-left text-small font-semibold text-neutral-900">Progress</th>
                <th className="px-6 py-4 text-left text-small font-semibold text-neutral-900">Delivery Date</th>
                <th className="px-6 py-4 text-left text-small font-semibold text-neutral-900">Amount</th>
                <th className="px-6 py-4 text-left text-small font-semibold text-neutral-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-body text-neutral-700">No orders found</p>
                    <Link href="/dashboard/orders/create" className="text-primary-500 hover:text-primary-600 font-medium mt-2 inline-block">
                      Create your first order
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-neutral-900">{order.order_number}</p>
                        <p className="text-small text-neutral-700">
                          {format(new Date(order.created_at), 'MMM dd, yyyy')}
                        </p>
                        {order.priority_level === 'rush' && (
                          <span className="inline-block px-2 py-0.5 rounded text-tiny font-medium bg-red-100 text-red-900 mt-1">
                            RUSH
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-neutral-900">{order.customers?.full_name || 'N/A'}</p>
                        <p className="text-small text-neutral-700">{order.customers?.customer_code || ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-body text-neutral-900">{getOrderTypeLabel(order.order_type)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-tiny font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {order.sub_status && (
                        <p className="text-tiny text-neutral-700 mt-1">{order.sub_status}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full">
                        <div className="w-full bg-neutral-200 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full transition-all"
                            style={{ width: `${order.progress_percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-tiny text-neutral-700 mt-1">{order.progress_percentage}%</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.delivery_date ? (
                        <div>
                          <p className="text-body text-neutral-900">
                            {format(new Date(order.delivery_date), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-tiny text-neutral-700">
                            {new Date(order.delivery_date) < new Date() ? 'Overdue' : 'Upcoming'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-small text-neutral-500">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-primary-600">
                          AED {parseFloat(order.final_amount.toString()).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-tiny text-neutral-700">
                          Paid: AED {parseFloat(order.advance_payment.toString()).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="p-2 hover:bg-glass-light rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-neutral-700" />
                        </Link>
                        <button
                          className="p-2 hover:bg-glass-light rounded-md transition-colors"
                          title="Edit Order"
                        >
                          <Edit className="w-4 h-4 text-neutral-700" />
                        </button>
                        <button
                          className="p-2 hover:bg-glass-light rounded-md transition-colors"
                          title="More Options"
                        >
                          <MoreVertical className="w-4 h-4 text-neutral-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="glass-card p-4">
        <p className="text-small text-neutral-700">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
      </div>
    </div>
  );
}
