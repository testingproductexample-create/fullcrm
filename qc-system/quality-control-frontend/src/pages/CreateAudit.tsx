import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface Finding {
  finding_type: string;
  severity: string;
  description: string;
  corrective_action: string;
}

const CreateAudit = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    audit_number: `AUD-${Date.now()}`,
    audit_type: 'internal',
    audit_scope: '',
    auditor: '',
    audit_date: new Date().toISOString().split('T')[0],
    summary: '',
    recommendations: ''
  });
  const [findings, setFindings] = useState<Finding[]>([]);

  const addFinding = () => {
    setFindings([
      ...findings,
      {
        finding_type: 'non_conformance',
        severity: 'minor',
        description: '',
        corrective_action: ''
      }
    ]);
  };

  const removeFinding = (index: number) => {
    setFindings(findings.filter((_, i) => i !== index));
  };

  const updateFinding = (index: number, field: keyof Finding, value: string) => {
    const updated = [...findings];
    updated[index][field] = value;
    setFindings(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate overall score based on findings
      let score = 100;
      findings.forEach(finding => {
        if (finding.severity === 'critical') score -= 10;
        else if (finding.severity === 'major') score -= 5;
        else if (finding.severity === 'minor') score -= 2;
      });
      score = Math.max(0, score);

      // Create audit
      const { data: audit, error: auditError } = await supabase
        .from('audits')
        .insert({
          ...formData,
          overall_score: score,
          status: 'completed'
        })
        .select()
        .single();

      if (auditError) throw auditError;

      // Create findings
      if (findings.length > 0) {
        const findingsToInsert = findings.map(finding => ({
          audit_id: audit.id,
          ...finding,
          status: 'open'
        }));

        const { error: findingsError } = await supabase
          .from('audit_findings')
          .insert(findingsToInsert);

        if (findingsError) throw findingsError;
      }

      toast.success('Audit created successfully!');
      navigate('/audits');
    } catch (error: any) {
      toast.error('Failed to create audit: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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
        <div>
          <h1 className="text-3xl font-bold text-white">Create Quality Audit</h1>
          <p className="text-white/60 mt-1">Schedule and document new audit</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Audit Details</CardTitle>
            <CardDescription className="text-white/60">Basic audit information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Audit Number
                </label>
                <input
                  type="text"
                  value={formData.audit_number}
                  onChange={(e) => setFormData({ ...formData, audit_number: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Audit Type
                </label>
                <select
                  value={formData.audit_type}
                  onChange={(e) => setFormData({ ...formData, audit_type: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  required
                >
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                  <option value="supplier">Supplier</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Audit Date
                </label>
                <input
                  type="date"
                  value={formData.audit_date}
                  onChange={(e) => setFormData({ ...formData, audit_date: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Auditor (Optional)
                </label>
                <input
                  type="text"
                  value={formData.auditor}
                  onChange={(e) => setFormData({ ...formData, auditor: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                  placeholder="Auditor name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Audit Scope
                </label>
                <input
                  type="text"
                  value={formData.audit_scope}
                  onChange={(e) => setFormData({ ...formData, audit_scope: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                  placeholder="e.g., Production Quality Management System"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Summary (Optional)
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                  placeholder="Audit summary..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Recommendations (Optional)
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                  placeholder="Recommendations..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Findings */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Audit Findings</CardTitle>
                <CardDescription className="text-white/60">
                  Document non-conformances and observations
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={addFinding}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Finding
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {findings.length === 0 ? (
              <p className="text-white/60 text-center py-8">No findings added yet</p>
            ) : (
              <div className="space-y-4">
                {findings.map((finding, index) => (
                  <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium">Finding #{index + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeFinding(index)}
                        className="p-2 rounded-lg hover:bg-white/10 text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select
                        value={finding.finding_type}
                        onChange={(e) => updateFinding(index, 'finding_type', e.target.value)}
                        className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                      >
                        <option value="non_conformance">Non-Conformance</option>
                        <option value="observation">Observation</option>
                        <option value="opportunity">Opportunity for Improvement</option>
                      </select>

                      <select
                        value={finding.severity}
                        onChange={(e) => updateFinding(index, 'severity', e.target.value)}
                        className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                      >
                        <option value="critical">Critical</option>
                        <option value="major">Major</option>
                        <option value="minor">Minor</option>
                      </select>
                    </div>

                    <textarea
                      value={finding.description}
                      onChange={(e) => updateFinding(index, 'description', e.target.value)}
                      rows={2}
                      placeholder="Finding description..."
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    />

                    <textarea
                      value={finding.corrective_action}
                      onChange={(e) => updateFinding(index, 'corrective_action', e.target.value)}
                      rows={2}
                      placeholder="Corrective action..."
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/audits')}
            className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Creating...' : 'Create Audit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAudit;
