import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ClipboardCheck, Plus, Search, Filter, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Inspection {
  id: string;
  inspection_number: string;
  garment_type: string;
  inspection_stage: string;
  total_score: number | null;
  passed: boolean;
  status: string;
  created_at: string;
}

const Inspections = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchInspections();
  }, [filterStage, filterStatus]);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('quality_inspections')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStage !== 'all') {
        query = query.eq('inspection_stage', filterStage);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInspections(data || []);
    } catch (error: any) {
      toast.error('Failed to load inspections: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredInspections = inspections.filter((inspection) =>
    inspection.inspection_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inspection.garment_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (passed: boolean) => {
    return passed
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Quality Inspections</h1>
          <p className="text-white/60 mt-2">Track and manage quality inspection records</p>
        </div>
        <button
          onClick={() => navigate('/inspections/create')}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Inspection
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <p className="text-sm text-white/60">Total Inspections</p>
            <p className="text-2xl font-bold text-white">{inspections.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <p className="text-sm text-white/60">Passed</p>
            <p className="text-2xl font-bold text-green-400">
              {inspections.filter(i => i.passed).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <p className="text-sm text-white/60">Failed</p>
            <p className="text-2xl font-bold text-red-400">
              {inspections.filter(i => !i.passed).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <p className="text-sm text-white/60">Pass Rate</p>
            <p className="text-2xl font-bold text-white">
              {inspections.length > 0
                ? ((inspections.filter(i => i.passed).length / inspections.length) * 100).toFixed(1)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Search inspections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Stages</option>
              <option value="incoming">Incoming</option>
              <option value="in-process">In-Process</option>
              <option value="final">Final</option>
              <option value="pre-shipment">Pre-Shipment</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Inspections List */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Inspections List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-white/60">Loading inspections...</div>
          ) : filteredInspections.length === 0 ? (
            <div className="text-center py-12 text-white/60">No inspections found</div>
          ) : (
            <div className="space-y-3">
              {filteredInspections.map((inspection) => (
                <div
                  key={inspection.id}
                  onClick={() => navigate(`/inspections/${inspection.id}`)}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <ClipboardCheck className={`w-6 h-6 ${inspection.passed ? 'text-green-400' : 'text-red-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-white font-medium">{inspection.inspection_number}</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(inspection.passed)}`}>
                          {inspection.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm mt-1">
                        {inspection.garment_type} • {inspection.inspection_stage} • Score: {inspection.total_score?.toFixed(1) || 'N/A'}%
                      </p>
                      <p className="text-white/50 text-xs mt-1">
                        {new Date(inspection.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Inspections;
