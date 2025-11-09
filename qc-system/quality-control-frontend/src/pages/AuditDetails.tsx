import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface AuditFinding {
  id: string;
  finding_type: string;
  severity: string;
  description: string;
  corrective_action: string | null;
  status: string;
}

interface Audit {
  id: string;
  audit_number: string;
  audit_type: string;
  audit_scope: string;
  auditor: string | null;
  audit_date: string;
  status: string;
  overall_score: number | null;
  summary: string | null;
  recommendations: string | null;
  created_at: string;
  audit_findings: AuditFinding[];
}

const AuditDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchAudit();
  }, [id]);

  const fetchAudit = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audits')
        .select(`
          *,
          audit_findings(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setAudit(data);
    } catch (error: any) {
      toast.error('Failed to load audit: ' + error.message);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading audit...</div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">Audit not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/audits')}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{audit.audit_number}</h1>
          <p className="text-white/60 mt-1">Audit Details</p>
        </div>
        {audit.overall_score && (
          <div className="px-6 py-3 rounded-lg bg-white/10 border border-white/20">
            <p className="text-lg font-bold text-white">{audit.overall_score}%</p>
          </div>
        )}
      </div>

      {/* Audit Info */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Audit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-white/60 text-sm">Audit Type</p>
              <p className="text-white font-medium mt-1 capitalize">{audit.audit_type}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Audit Scope</p>
              <p className="text-white font-medium mt-1">{audit.audit_scope}</p>
            </div>
            {audit.auditor && (
              <div>
                <p className="text-white/60 text-sm">Auditor</p>
                <p className="text-white font-medium mt-1">{audit.auditor}</p>
              </div>
            )}
            <div>
              <p className="text-white/60 text-sm">Audit Date</p>
              <p className="text-white font-medium mt-1">
                {new Date(audit.audit_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Status</p>
              <p className="text-white font-medium mt-1 capitalize">{audit.status.replace('_', ' ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {audit.summary && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Audit Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white">{audit.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Findings */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Audit Findings</CardTitle>
        </CardHeader>
        <CardContent>
          {audit.audit_findings.length === 0 ? (
            <p className="text-white/60 text-center py-8">No findings recorded</p>
          ) : (
            <div className="space-y-4">
              {audit.audit_findings.map((finding) => (
                <div
                  key={finding.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-start gap-4">
                    <AlertCircle className={`w-6 h-6 flex-shrink-0 ${
                      finding.severity === 'critical' ? 'text-red-400' :
                      finding.severity === 'major' ? 'text-orange-400' :
                      'text-yellow-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(finding.severity)}`}>
                          {finding.severity.toUpperCase()}
                        </span>
                        <span className="text-white/60 text-sm capitalize">{finding.finding_type.replace('_', ' ')}</span>
                      </div>
                      <p className="text-white mb-2">{finding.description}</p>
                      {finding.corrective_action && (
                        <div className="mt-3 p-3 bg-white/5 rounded">
                          <p className="text-white/70 text-sm font-medium mb-1">Corrective Action:</p>
                          <p className="text-white/80 text-sm">{finding.corrective_action}</p>
                        </div>
                      )}
                      <span className={`inline-block mt-3 px-2 py-1 rounded text-xs ${
                        finding.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
                        finding.status === 'in_progress' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {finding.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {audit.recommendations && (
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white whitespace-pre-line">{audit.recommendations}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuditDetails;
