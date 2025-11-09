import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface InspectionItem {
  id: string;
  passed: boolean;
  notes: string | null;
  quality_checklist_items: {
    item_name: string;
    description: string;
    importance: string;
  };
}

interface Inspection {
  id: string;
  inspection_number: string;
  garment_type: string;
  order_id: string | null;
  inspection_stage: string;
  total_score: number | null;
  passed: boolean;
  status: string;
  notes: string | null;
  created_at: string;
  quality_inspection_items: InspectionItem[];
}

const InspectionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchInspection();
  }, [id]);

  const fetchInspection = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quality_inspections')
        .select(`
          *,
          quality_inspection_items(
            *,
            quality_checklist_items(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setInspection(data);
    } catch (error: any) {
      toast.error('Failed to load inspection: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading inspection...</div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">Inspection not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/inspections')}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{inspection.inspection_number}</h1>
          <p className="text-white/60 mt-1">Inspection Details</p>
        </div>
        <div className={`px-6 py-3 rounded-lg ${
          inspection.passed
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          <p className="text-lg font-bold">{inspection.passed ? 'PASSED' : 'FAILED'}</p>
        </div>
      </div>

      {/* Inspection Info */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Inspection Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-white/60 text-sm">Garment Type</p>
              <p className="text-white font-medium mt-1">{inspection.garment_type}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Inspection Stage</p>
              <p className="text-white font-medium mt-1 capitalize">
                {inspection.inspection_stage.replace('-', ' ')}
              </p>
            </div>
            {inspection.order_id && (
              <div>
                <p className="text-white/60 text-sm">Order ID</p>
                <p className="text-white font-medium mt-1">{inspection.order_id}</p>
              </div>
            )}
            <div>
              <p className="text-white/60 text-sm">Total Score</p>
              <p className="text-white font-medium mt-1">
                {inspection.total_score?.toFixed(1) || 'N/A'}%
              </p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Status</p>
              <p className="text-white font-medium mt-1 capitalize">{inspection.status}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Created</p>
              <p className="text-white font-medium mt-1">
                {new Date(inspection.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          {inspection.notes && (
            <div className="mt-6">
              <p className="text-white/60 text-sm mb-2">Notes</p>
              <p className="text-white">{inspection.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Inspection Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {inspection.quality_inspection_items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
              >
                {item.passed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-white font-medium">
                    {item.quality_checklist_items.item_name}
                  </p>
                  <p className="text-white/60 text-sm mt-1">
                    {item.quality_checklist_items.description}
                  </p>
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                    item.quality_checklist_items.importance === 'critical'
                      ? 'bg-red-500/20 text-red-400'
                      : item.quality_checklist_items.importance === 'major'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {item.quality_checklist_items.importance.toUpperCase()}
                  </span>
                  {item.notes && (
                    <p className="text-white/70 text-sm mt-2 italic">
                      Notes: {item.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectionDetails;
