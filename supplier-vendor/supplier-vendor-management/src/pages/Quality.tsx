import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ClipboardCheck, CheckCircle, XCircle } from 'lucide-react';

export default function Quality() {
  const [quality, setQuality] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect() => {
    fetchQuality();
  }, []);

  const fetchQuality = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_quality')
        .select(`
          *,
          suppliers (supplier_name)
        `)
        .order('inspection_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setQuality(data || []);
    } catch (error) {
      console.error('Error fetching quality data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Quality Assessments</h1>
        <p className="text-white/70 mt-1">Track supplier quality inspections and ratings</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading quality assessments...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {quality.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
              <p className="text-white/70 text-lg">No quality assessments found</p>
            </div>
          ) : (
            quality.map((qa: any) => (
              <div key={qa.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {qa.passed ? (
                        <CheckCircle className="text-green-400" size={20} />
                      ) : (
                        <XCircle className="text-red-400" size={20} />
                      )}
                      <h3 className="text-lg font-bold text-white">
                        {qa.suppliers?.supplier_name || 'Unknown Supplier'}
                      </h3>
                    </div>
                    <p className="text-white/60 text-sm mt-1">
                      Inspected on {new Date(qa.inspection_date).toLocaleDateString()}
                    </p>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-white/70 text-sm">Material Type</span>
                        <p className="text-white font-medium">{qa.material_type || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Quality Score</span>
                        <p className="text-white font-medium">{qa.quality_score?.toFixed(2) || '0'}/5</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Defect Rate</span>
                        <p className="text-white font-medium">{qa.defect_rate?.toFixed(2) || '0'}%</p>
                      </div>
                      <div>
                        <span className="text-white/70 text-sm">Sample Size</span>
                        <p className="text-white font-medium">{qa.sample_size || 0}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    qa.passed ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {qa.passed ? 'Passed' : 'Failed'}
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
