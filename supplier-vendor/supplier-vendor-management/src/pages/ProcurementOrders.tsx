import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ShoppingCart } from 'lucide-react';

export default function ProcurementOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('procurement_orders')
        .select(`
          *,
          suppliers (supplier_name)
        `)
        .order('order_date', { ascending: false });
      
      if (error) throw error;
      
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Procurement Orders</h1>
        <p className="text-white/70 mt-1">Manage purchase orders and procurement</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading orders...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
              <p className="text-white/70 text-lg">No procurement orders found</p>
            </div>
          ) : (
            orders.map((order: any) => (
              <div key={order.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{order.order_number}</h3>
                    <p className="text-white/60 text-sm mt-1">
                      {order.suppliers?.supplier_name || 'Unknown Supplier'}
                    </p>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-white/70 text-sm">Order Date</span>
                        <p className="text-white font-medium">{new Date(order.order_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Total Amount</span>
                        <p className="text-white font-medium">{order.currency} {order.total_amount?.toLocaleString() || '0'}</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Order Type</span>
                        <p className="text-white font-medium capitalize">{order.order_type || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Payment</span>
                        <p className="text-white font-medium capitalize">{order.payment_status || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.order_status === 'completed' ? 'bg-green-500/20 text-green-300' :
                    order.order_status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                    order.order_status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {order.order_status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
