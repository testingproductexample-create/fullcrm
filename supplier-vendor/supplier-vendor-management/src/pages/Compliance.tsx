import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Shield } from 'lucide-react';

export default function Compliance() {
  const [compliance, setCompliance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompliance();
  }, []);

  const fetchCompliance = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_compliance')
        .select(`
          *,
          suppliers (supplier_name)
        `)
        .order('last_audit_date', { ascending: false });
      
      if (error) throw error;
      
      setCompliance(data || []);
    } catch (error) {
      console.error('Error fetching compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Compliance Management</h1>
        <p className="text-white/70 mt-1">Monitor supplier regulatory compliance</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading compliance data...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {compliance.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
              <p className="text-white/70 text-lg">No compliance records found</p>
            </div>
          ) : (
            compliance.map((comp: any) => (
              <div key={comp.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{comp.regulation_name}</h3>
                    <p className="text-white/60 text-sm mt-1">
                      {comp.suppliers?.supplier_name || 'Unknown Supplier'}
                    </p>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-white/70 text-sm">Type</span>
                        <p className="text-white font-medium capitalize">{comp.compliance_type || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Last Audit</span>
                        <p className="text-white font-medium">
                          {comp.last_audit_date ? new Date(comp.last_audit_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Next Audit</span>
                        <p className="text-white font-medium">
                          {comp.next_audit_date ? new Date(comp.next_audit_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    comp.compliance_status === 'compliant' ? 'bg-green-500/20 text-green-300' :
                    comp.compliance_status === 'non_compliant' ? 'bg-red-500/20 text-red-300' :
                    'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {comp.compliance_status}
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
