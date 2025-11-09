import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { AlertTriangle, Plus, Search, Filter, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Defect {
  id: string;
  defect_code: string;
  garment_type: string;
  defect_category: string;
  defect_type: string;
  severity: string;
  status: string;
  created_at: string;
}

const Defects = () => {
  const navigate = useNavigate();
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchDefects();
  }, []);

  const fetchDefects = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('defects')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterSeverity !== 'all') {
        query = query.eq('severity', filterSeverity);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDefects(data || []);
    } catch (error: any) {
      toast.error('Failed to load defects: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefects();
  }, [filterSeverity, filterStatus]);

  const filteredDefects = defects.filter((defect) =>
    defect.defect_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    defect.defect_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    defect.garment_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Defect Tracking</h1>
          <p className="text-white/60 mt-2">Monitor and manage quality defects</p>
        </div>
        <button
          onClick={() => navigate('/defects/new')}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          Report Defect
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total Defects</p>
                <p className="text-2xl font-bold text-white">{defects.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Critical</p>
                <p className="text-2xl font-bold text-red-400">
                  {defects.filter(d => d.severity === 'critical').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Open</p>
                <p className="text-2xl font-bold text-blue-400">
                  {defects.filter(d => d.status === 'open').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Resolved</p>
                <p className="text-2xl font-bold text-green-400">
                  {defects.filter(d => d.status === 'resolved').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Search defects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Defects List */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Defects List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-white/60">Loading defects...</div>
          ) : filteredDefects.length === 0 ? (
            <div className="text-center py-12 text-white/60">No defects found</div>
          ) : (
            <div className="space-y-3">
              {filteredDefects.map((defect) => (
                <div
                  key={defect.id}
                  onClick={() => navigate(`/defects/${defect.id}`)}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <AlertTriangle className={`w-6 h-6 ${
                      defect.severity === 'critical' ? 'text-red-400' :
                      defect.severity === 'major' ? 'text-orange-400' :
                      'text-yellow-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-white font-medium">{defect.defect_code}</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(defect.severity)}`}>
                          {defect.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(defect.status)}`}>
                          {defect.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm mt-1">
                        {defect.defect_type} • {defect.garment_type} • {defect.defect_category}
                      </p>
                      <p className="text-white/50 text-xs mt-1">
                        {new Date(defect.created_at).toLocaleDateString()}
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

export default Defects;
