import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FileSearch } from 'lucide-react';

export default function RFQManagement() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRFQs();
  }, []);

  const fetchRFQs = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_rfq')
        .select('*')
        .order('rfq_date', { ascending: false });
      
      if (error) throw error;
      
      setRfqs(data || []);
    } catch (error) {
      console.error('Error fetching RFQs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">RFQ Management</h1>
        <p className="text-white/70 mt-1">Manage Request for Quotations</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading RFQs...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rfqs.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
              <p className="text-white/70 text-lg">No RFQs found</p>
            </div>
          ) : (
            rfqs.map((rfq: any) => (
              <div key={rfq.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{rfq.rfq_title}</h3>
                    <p className="text-white/60 text-sm mt-1">RFQ #{rfq.rfq_number}</p>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-white/70 text-sm">RFQ Date</span>
                        <p className="text-white font-medium">{new Date(rfq.rfq_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Deadline</span>
                        <p className="text-white font-medium">{new Date(rfq.response_deadline).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Responses</span>
                        <p className="text-white font-medium">{rfq.responses_received || 0}</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Quantity</span>
                        <p className="text-white font-medium">{rfq.quantity_required || 0}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    rfq.status === 'open' ? 'bg-green-500/20 text-green-300' :
                    rfq.status === 'closed' ? 'bg-red-500/20 text-red-300' :
                    'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {rfq.status}
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
