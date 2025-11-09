import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Shield, Plus, Search, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Audit {
  id: string;
  audit_number: string;
  audit_type: string;
  audit_scope: string;
  auditor: string | null;
  audit_date: string;
  status: string;
  overall_score: number | null;
  created_at: string;
}

const Audits = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchAudits();
  }, [filterType, filterStatus]);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('audits')
        .select('*')
        .order('audit_date', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('audit_type', filterType);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAudits(data || []);
    } catch (error: any) {
      toast.error('Failed to load audits: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAudits = audits.filter((audit) =>
    audit.audit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    audit.audit_scope.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Quality Audits</h1>
          <p className="text-white/60 mt-2">Internal and external audit management</p>
        </div>
        <button
          onClick={() => navigate('/audits/create')}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          Schedule Audit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <p className="text-sm text-white/60">Total Audits</p>
            <p className="text-2xl font-bold text-white">{audits.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <p className="text-sm text-white/60">Completed</p>
            <p className="text-2xl font-bold text-green-400">
              {audits.filter(a => a.status === 'completed').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <p className="text-sm text-white/60">In Progress</p>
            <p className="text-2xl font-bold text-purple-400">
              {audits.filter(a => a.status === 'in_progress').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <p className="text-sm text-white/60">Scheduled</p>
            <p className="text-2xl font-bold text-blue-400">
              {audits.filter(a => a.status === 'scheduled').length}
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
                  placeholder="Search audits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Types</option>
              <option value="internal">Internal</option>
              <option value="external">External</option>
              <option value="supplier">Supplier</option>
              <option value="customer">Customer</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Audits List */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Audits List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-white/60">Loading audits...</div>
          ) : filteredAudits.length === 0 ? (
            <div className="text-center py-12 text-white/60">No audits found</div>
          ) : (
            <div className="space-y-3">
              {filteredAudits.map((audit) => (
                <div
                  key={audit.id}
                  onClick={() => navigate(`/audits/${audit.id}`)}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Shield className="w-6 h-6 text-blue-400" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-white font-medium">{audit.audit_number}</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(audit.status)}`}>
                          {audit.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm mt-1">
                        {audit.audit_type} • {audit.audit_scope}
                        {audit.overall_score && ` • Score: ${audit.overall_score}%`}
                      </p>
                      <p className="text-white/50 text-xs mt-1">
                        {new Date(audit.audit_date).toLocaleDateString()}
                        {audit.auditor && ` • Auditor: ${audit.auditor}`}
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

export default Audits;
