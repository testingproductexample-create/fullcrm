import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle2, Shield, AlertCircle, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface ComplianceStandard {
  id: string;
  standard_name: string;
  jurisdiction: string;
  description: string;
  compliance_type: string;
  status: string;
  effective_date: string;
  review_frequency: string;
}

const Compliance = () => {
  const [standards, setStandards] = useState<ComplianceStandard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterJurisdiction, setFilterJurisdiction] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchCompliance();
  }, [filterJurisdiction, filterType]);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('quality_compliance')
        .select('*')
        .order('effective_date', { ascending: false });

      if (filterJurisdiction !== 'all') {
        query = query.eq('jurisdiction', filterJurisdiction);
      }

      if (filterType !== 'all') {
        query = query.eq('compliance_type', filterType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStandards(data || []);
    } catch (error: any) {
      toast.error('Failed to load compliance data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_review':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'non_compliant':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'regulatory':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'voluntary':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'industry':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'internal':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const jurisdictions = [...new Set(standards.map(s => s.jurisdiction))];
  const types = [...new Set(standards.map(s => s.compliance_type))];

  const compliantCount = standards.filter(s => s.status === 'compliant').length;
  const inReviewCount = standards.filter(s => s.status === 'in_review').length;
  const nonCompliantCount = standards.filter(s => s.status === 'non_compliant').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Compliance Monitoring</h1>
        <p className="text-white/60 mt-2">
          UAE and international regulatory compliance tracking
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total Standards</p>
                <p className="text-2xl font-bold text-white">{standards.length}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Compliant</p>
                <p className="text-2xl font-bold text-green-400">{compliantCount}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">In Review</p>
                <p className="text-2xl font-bold text-blue-400">{inReviewCount}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Non-Compliant</p>
                <p className="text-2xl font-bold text-red-400">{nonCompliantCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <select
              value={filterJurisdiction}
              onChange={(e) => setFilterJurisdiction(e.target.value)}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Jurisdictions</option>
              {jurisdictions.map(jurisdiction => (
                <option key={jurisdiction} value={jurisdiction}>{jurisdiction}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Standards List */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Compliance Standards</CardTitle>
          <CardDescription className="text-white/60">
            Regulatory and voluntary standards tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-white/60">Loading compliance data...</div>
          ) : standards.length === 0 ? (
            <div className="text-center py-12 text-white/60">No compliance standards found</div>
          ) : (
            <div className="space-y-4">
              {standards.map((standard) => (
                <div
                  key={standard.id}
                  className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {standard.standard_name}
                      </h3>
                      <p className="text-white/70 text-sm mb-3">{standard.description}</p>
                      
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1 rounded text-xs font-medium border ${getStatusColor(standard.status)}`}>
                          {standard.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded text-xs font-medium border ${getTypeColor(standard.compliance_type)}`}>
                          {standard.compliance_type.toUpperCase()}
                        </span>
                        <span className="text-white/60 text-sm">
                          {standard.jurisdiction}
                        </span>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2 text-white/70">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {new Date(standard.effective_date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-white/60 text-xs">
                        Review: {standard.review_frequency}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* UAE Compliance Notice */}
      <Card className="bg-purple-500/10 backdrop-blur-xl border-purple-500/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-semibold mb-2">UAE Compliance Requirements</h3>
              <p className="text-white/70 text-sm">
                This system tracks compliance with UAE Personal Data Protection Law (PDPL), 
                Emirates Authority for Standardization and Metrology (ESMA) textile standards, 
                and international quality standards including ISO 9001:2015 and ISO/IEC 17025 
                for textile testing laboratories.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Compliance;
