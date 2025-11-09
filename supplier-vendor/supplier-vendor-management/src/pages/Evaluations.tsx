import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Star } from 'lucide-react';

export default function Evaluations() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_evaluations')
        .select(`
          *,
          suppliers (supplier_name)
        `)
        .order('evaluation_date', { ascending: false });
      
      if (error) throw error;
      
      setEvaluations(data || []);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Vendor Evaluations</h1>
        <p className="text-white/70 mt-1">Track vendor performance evaluations and scoring</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading evaluations...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {evaluations.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
              <p className="text-white/70 text-lg">No evaluations found</p>
            </div>
          ) : (
            evaluations.map((eval: any) => (
              <div key={eval.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{eval.evaluation_name}</h3>
                    <p className="text-white/60 text-sm mt-1">
                      {eval.suppliers?.supplier_name || 'Unknown Supplier'}
                    </p>
                    <p className="text-white/50 text-xs mt-1">
                      Evaluated on {new Date(eval.evaluation_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-400">{eval.weighted_score?.toFixed(2) || 'N/A'}</div>
                    <div className="text-white/60 text-sm">Weighted Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div>
                    <span className="text-white/70 text-sm">Quality</span>
                    <p className="text-white font-medium">{eval.criteria_quality?.toFixed(2) || 'N/A'}/5</p>
                  </div>
                  <div>
                    <span className="text-white/70 text-sm">Delivery</span>
                    <p className="text-white font-medium">{eval.criteria_delivery?.toFixed(2) || 'N/A'}/5</p>
                  </div>
                  <div>
                    <span className="text-white/70 text-sm">Cost</span>
                    <p className="text-white font-medium">{eval.criteria_cost?.toFixed(2) || 'N/A'}/5</p>
                  </div>
                  <div>
                    <span className="text-white/70 text-sm">Service</span>
                    <p className="text-white font-medium">{eval.criteria_service?.toFixed(2) || 'N/A'}/5</p>
                  </div>
                  <div>
                    <span className="text-white/70 text-sm">Innovation</span>
                    <p className="text-white font-medium">{eval.criteria_innovation?.toFixed(2) || 'N/A'}/5</p>
                  </div>
                  <div>
                    <span className="text-white/70 text-sm">Sustainability</span>
                    <p className="text-white font-medium">{eval.criteria_sustainability?.toFixed(2) || 'N/A'}/5</p>
                  </div>
                </div>

                {eval.approved && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">
                      Approved
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
