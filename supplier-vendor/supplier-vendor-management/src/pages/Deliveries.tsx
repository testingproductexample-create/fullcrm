import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Truck, Package } from 'lucide-react';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_deliveries')
        .select(`
          *,
          suppliers (supplier_name)
        `)
        .order('shipment_date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Deliveries</h1>
        <p className="text-white/70 mt-1">Track supplier deliveries and shipments</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading deliveries...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {deliveries.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
              <p className="text-white/70 text-lg">No deliveries found</p>
            </div>
          ) : (
            deliveries.map((delivery: any) => (
              <div key={delivery.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Truck className="text-purple-400" size={20} />
                      <h3 className="text-lg font-bold text-white">{delivery.delivery_number}</h3>
                    </div>
                    <p className="text-white/60 text-sm mt-1">
                      {delivery.suppliers?.supplier_name || 'Unknown Supplier'}
                    </p>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-white/70 text-sm">Shipment Date</span>
                        <p className="text-white font-medium">{new Date(delivery.shipment_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Expected</span>
                        <p className="text-white font-medium">{new Date(delivery.expected_delivery_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Carrier</span>
                        <p className="text-white font-medium">{delivery.carrier || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Tracking</span>
                        <p className="text-white font-medium">{delivery.tracking_number || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    delivery.delivery_status === 'delivered' ? 'bg-green-500/20 text-green-300' :
                    delivery.delivery_status === 'in_transit' ? 'bg-blue-500/20 text-blue-300' :
                    delivery.delivery_status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {delivery.delivery_status}
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
