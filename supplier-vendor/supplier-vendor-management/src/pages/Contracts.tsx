import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FileText, Plus } from 'lucide-react';

export default function Contracts() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_contracts')
        .select(`
          *,
          suppliers (supplier_name, supplier_code)
        `)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Contracts</h1>
          <p className="text-white/70 mt-1">Manage supplier contracts and renewals</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading contracts...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {contracts.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
              <p className="text-white/70 text-lg">No contracts found</p>
            </div>
          ) : (
            contracts.map((contract: any) => (
              <div key={contract.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{contract.contract_number}</h3>
                    <p className="text-white/60 text-sm mt-1">
                      {contract.suppliers?.supplier_name || 'Unknown Supplier'}
                    </p>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-white/70 text-sm">Type</span>
                        <p className="text-white font-medium capitalize">{contract.contract_type || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Value</span>
                        <p className="text-white font-medium">{contract.currency} {contract.contract_value?.toLocaleString() || '0'}</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Start Date</span>
                        <p className="text-white font-medium">{new Date(contract.start_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">End Date</span>
                        <p className="text-white font-medium">{new Date(contract.end_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    contract.status === 'active' ? 'bg-green-500/20 text-green-300' :
                    contract.status === 'expired' ? 'bg-red-500/20 text-red-300' :
                    'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {contract.status}
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
