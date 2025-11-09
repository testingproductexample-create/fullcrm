import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TrendingUp, Award, AlertTriangle } from 'lucide-react';

export default function Performance() {
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_performance')
        .select(`
          *,
          suppliers (supplier_name, supplier_code)
        `)
        .order('evaluation_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setPerformance(data || []);
    } catch (error) {
      console.error('Error fetching performance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Supplier Performance</h1>
        <p className="text-white/70 mt-1">Track and analyze supplier performance metrics</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading performance data...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {performance.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
              <p className="text-white/70 text-lg">No performance data available</p>
            </div>
          ) : (
            performance.map((perf: any) => (
              <div key={perf.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {perf.suppliers?.supplier_name || 'Unknown Supplier'}
                    </h3>
                    <p className="text-white/60 text-sm mt-1">
                      Evaluated on {new Date(perf.evaluation_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-400">{perf.overall_score.toFixed(1)}</div>
                    <div className="text-white/60 text-sm">Overall Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-white/70 text-sm mb-1">On-Time Delivery</div>
                    <div className="text-white font-bold text-lg">{perf.on_time_delivery_rate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-white/70 text-sm mb-1">Quality Rating</div>
                    <div className="text-white font-bold text-lg">{perf.quality_rating.toFixed(2)}/5</div>
                  </div>
                  <div>
                    <div className="text-white/70 text-sm mb-1">Order Accuracy</div>
                    <div className="text-white font-bold text-lg">{perf.order_accuracy_rate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-white/70 text-sm mb-1">Communication</div>
                    <div className="text-white font-bold text-lg">{perf.communication_rating.toFixed(1)}/5</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
