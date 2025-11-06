import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { 
  FileText, 
  Plus, 
  Edit, 
  Eye, 
  Calendar, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { createClient } from '../../../../lib/supabase';
import { formatDate, sanitizeHtml } from '../../utils/uuid';

interface PrivacyPolicy {
  id: string;
  policyName: string;
  policyVersion: string;
  effectiveDate: string;
  expiryDate?: string;
  policyContent: string;
  language: string;
  isActive: boolean;
  changeSummary?: string;
  approvedBy?: string;
  approvalDate?: string;
  nextReviewDate?: string;
  dataProtectionImpactAssessment: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PrivacyPolicyManager: React.FC = () => {
  const [policies, setPolicies] = useState<PrivacyPolicy[]>([]);
  const [activePolicy, setActivePolicy] = useState<PrivacyPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PrivacyPolicy | null>(null);
  
  const [formData, setFormData] = useState({
    policyName: '',
    policyVersion: '1.0',
    effectiveDate: '',
    expiryDate: '',
    policyContent: '',
    language: 'en',
    changeSummary: '',
    dataProtectionImpactAssessment: false
  });

  const supabase = createClient();

  useEffect(() => {
    fetchPolicies();
    fetchActivePolicy();
  }, []);

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('privacy_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPolicies(data || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
    }
  };

  const fetchActivePolicy = async () => {
    try {
      const { data, error } = await supabase
        .from('privacy_policies')
        .select('*')
        .eq('is_active', true)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setActivePolicy(data);
    } catch (error) {
      console.error('Error fetching active policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async () => {
    try {
      const policyData = {
        ...formData,
        is_active: !activePolicy, // Make active if no active policy exists
        approved_by: null, // Would be set by compliance officer
        approval_date: null
      };

      const { data, error } = await supabase
        .from('privacy_policies')
        .insert([policyData])
        .select()
        .single();

      if (error) throw error;

      // Deactivate other policies if this is being set as active
      if (policyData.is_active && activePolicy) {
        await supabase
          .from('privacy_policies')
          .update({ is_active: false })
          .neq('id', data.id);
      }

      setPolicies([data, ...policies]);
      setShowCreateDialog(false);
      resetForm();
      
      if (data.is_active) {
        setActivePolicy(data);
      }
    } catch (error) {
      console.error('Error creating policy:', error);
    }
  };

  const updatePolicy = async (policy: PrivacyPolicy) => {
    try {
      const { data, error } = await supabase
        .from('privacy_policies')
        .update(policy)
        .eq('id', policy.id)
        .select()
        .single();

      if (error) throw error;

      setPolicies(policies.map(p => p.id === policy.id ? data : p));
      setEditingPolicy(null);
      
      if (data.is_active) {
        setActivePolicy(data);
      }
    } catch (error) {
      console.error('Error updating policy:', error);
    }
  };

  const activatePolicy = async (policyId: string) => {
    try {
      // Deactivate all policies
      await supabase
        .from('privacy_policies')
        .update({ is_active: false })
        .eq('is_active', true);

      // Activate the selected policy
      const { data, error } = await supabase
        .from('privacy_policies')
        .update({ 
          is_active: true,
          approval_date: new Date().toISOString()
        })
        .eq('id', policyId)
        .select()
        .single();

      if (error) throw error;

      setPolicies(policies.map(p => ({ 
        ...p, 
        is_active: p.id === policyId 
      })));
      
      setActivePolicy(data);
    } catch (error) {
      console.error('Error activating policy:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      policyName: '',
      policyVersion: '1.0',
      effectiveDate: '',
      expiryDate: '',
      policyContent: '',
      language: 'en',
      changeSummary: '',
      dataProtectionImpactAssessment: false
    });
  };

  const getStatusBadge = (policy: PrivacyPolicy) => {
    const isExpired = policy.expiryDate && new Date(policy.expiryDate) < new Date();
    const needsReview = policy.nextReviewDate && new Date(policy.nextReviewDate) < new Date();
    
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (policy.isActive) {
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    }
    
    if (needsReview) {
      return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Review Needed</Badge>;
    }
    
    return <Badge variant="outline">Inactive</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading policies...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span>Privacy Policy Management</span>
          </h2>
          <p className="text-gray-600">Manage privacy policies and disclosures</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Privacy Policy</DialogTitle>
              <DialogDescription>
                Create a new privacy policy version for your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="policyName">Policy Name *</Label>
                  <Input
                    id="policyName"
                    value={formData.policyName}
                    onChange={(e) => setFormData({ ...formData, policyName: e.target.value })}
                    placeholder="e.g., Main Privacy Policy"
                  />
                </div>
                <div>
                  <Label htmlFor="policyVersion">Version *</Label>
                  <Input
                    id="policyVersion"
                    value={formData.policyVersion}
                    onChange={(e) => setFormData({ ...formData, policyVersion: e.target.value })}
                    placeholder="1.0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="effectiveDate">Effective Date *</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="dpea"
                    checked={formData.dataProtectionImpactAssessment}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      dataProtectionImpactAssessment: e.target.checked 
                    })}
                  />
                  <Label htmlFor="dpea">DPEA Required</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="changeSummary">Change Summary</Label>
                <Textarea
                  id="changeSummary"
                  value={formData.changeSummary}
                  onChange={(e) => setFormData({ ...formData, changeSummary: e.target.value })}
                  placeholder="Describe changes from previous version..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="policyContent">Policy Content *</Label>
                <Textarea
                  id="policyContent"
                  value={formData.policyContent}
                  onChange={(e) => setFormData({ ...formData, policyContent: e.target.value })}
                  placeholder="Enter the complete privacy policy content (HTML or Markdown)..."
                  rows={12}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createPolicy} disabled={!formData.policyName || !formData.policyContent}>
                  Create Policy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Policy Card */}
      {activePolicy && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Active Policy</span>
              {getStatusBadge(activePolicy)}
            </CardTitle>
            <CardDescription>
              {activePolicy.policyName} v{activePolicy.policyVersion} - 
              Effective from {formatDate(activePolicy.effectiveDate)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Globe className="h-4 w-4 mr-1" />
                  {activePolicy.language.toUpperCase()}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Last updated: {formatDate(activePolicy.updatedAt)}
                </span>
              </div>
              {activePolicy.changeSummary && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm"><strong>Recent Changes:</strong> {activePolicy.changeSummary}</p>
                </div>
              )}
            </div>
            <div className="flex space-x-2 mt-4">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Policy
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Policies */}
      <Card>
        <CardHeader>
          <CardTitle>All Privacy Policies</CardTitle>
          <CardDescription>
            Manage and view all privacy policy versions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {policies.map((policy) => (
              <div key={policy.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{policy.policyName}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Version {policy.policyVersion}</span>
                      <span>Effective: {formatDate(policy.effectiveDate)}</span>
                      {policy.expiryDate && (
                        <span>Expires: {formatDate(policy.expiryDate)}</span>
                      )}
                      <span className="flex items-center">
                        <Globe className="h-3 w-3 mr-1" />
                        {policy.language.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(policy)}
                    {!policy.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => activatePolicy(policy.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {policy.changeSummary && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm">{policy.changeSummary}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created: {formatDate(policy.createdAt)}</span>
                  <span>Updated: {formatDate(policy.updatedAt)}</span>
                  {policy.nextReviewDate && (
                    <span>Next review: {formatDate(policy.nextReviewDate)}</span>
                  )}
                </div>
              </div>
            ))}
            
            {policies.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No privacy policies found. Create your first policy to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicyManager;