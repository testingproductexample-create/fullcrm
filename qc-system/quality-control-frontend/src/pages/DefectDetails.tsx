import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Defect {
  id: string;
  defect_code: string;
  garment_type: string;
  defect_category: string;
  defect_type: string;
  severity: string;
  description: string;
  location: string | null;
  quantity: number;
  status: string;
  root_cause: string | null;
  corrective_action: string | null;
  created_at: string;
  resolved_at: string | null;
}

const DefectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [defect, setDefect] = useState<Defect | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchDefect();
  }, [id]);

  const fetchDefect = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('defects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setDefect(data);
    } catch (error: any) {
      toast.error('Failed to load defect: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'major':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'minor':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading defect...</div>
      </div>
    );
  }

  if (!defect) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">Defect not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/defects')}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{defect.defect_code}</h1>
          <p className="text-white/60 mt-1">Defect Details</p>
        </div>
        <div className="flex gap-3">
          <div className={`px-4 py-2 rounded-lg border ${getSeverityColor(defect.severity)}`}>
            <p className="text-sm font-bold">{defect.severity.toUpperCase()}</p>
          </div>
          <div className={`px-4 py-2 rounded-lg border ${getStatusColor(defect.status)}`}>
            <p className="text-sm font-bold">{defect.status.replace('_', ' ').toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Defect Information */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Defect Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-white/60 text-sm">Garment Type</p>
              <p className="text-white font-medium mt-1">{defect.garment_type}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Category</p>
              <p className="text-white font-medium mt-1">{defect.defect_category}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Defect Type</p>
              <p className="text-white font-medium mt-1">{defect.defect_type}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Quantity</p>
              <p className="text-white font-medium mt-1">{defect.quantity}</p>
            </div>
            {defect.location && (
              <div className="md:col-span-2">
                <p className="text-white/60 text-sm">Location</p>
                <p className="text-white font-medium mt-1">{defect.location}</p>
              </div>
            )}
            <div className="md:col-span-2">
              <p className="text-white/60 text-sm">Description</p>
              <p className="text-white mt-1">{defect.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium">Defect Reported</p>
                <p className="text-white/60 text-sm mt-1">
                  {new Date(defect.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            {defect.resolved_at && (
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Defect Resolved</p>
                  <p className="text-white/60 text-sm mt-1">
                    {new Date(defect.resolved_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Root Cause & Corrective Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Root Cause Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white">
              {defect.root_cause || 'Not yet analyzed'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Corrective Action</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white">
              {defect.corrective_action || 'No corrective action recorded'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DefectDetails;
