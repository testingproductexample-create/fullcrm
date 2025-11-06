import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { Switch } from '../../../components/ui/switch';
import { 
  Users, 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Eye, 
  Edit,
  Globe,
  Shield,
  FileText,
  Download
} from 'lucide-react';
import { createClient } from '../../../../lib/supabase';
import { formatDate, formatDateTime, maskSensitiveData } from '../../utils/uuid';

interface ConsentRecord {
  id: string;
  userId: string;
  consentType: string;
  consentGiven: boolean;
  consentDate: string;
  consentExpiry?: string;
  consentVersion: string;
  consentMethod: string;
  legalBasis: string;
  processingPurposes: string[];
  dataCategories: string[];
  thirdParties?: string[];
  internationalTransfers: boolean;
  transferMechanisms?: string[];
  withdrawalDate?: string;
  withdrawalMethod?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConsentForm {
  userId: string;
  consentType: string;
  consentVersion: string;
  legalBasis: string;
  processingPurposes: string[];
  dataCategories: string[];
  thirdParties?: string[];
  internationalTransfers: boolean;
  transferMechanisms?: string[];
  consentExpiry?: string;
  purposeDescription: string;
}

export const ConsentManager: React.FC<{ userId?: string; userRole?: string }> = ({ 
  userId, 
  userRole = 'user' 
}) => {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<ConsentRecord | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [consentingUserId, setConsentingUserId] = useState(userId || '');
  
  const [consentForm, setConsentForm] = useState<ConsentForm>({
    userId: userId || '',
    consentType: 'marketing',
    consentVersion: '1.0',
    legalBasis: 'consent',
    processingPurposes: [],
    dataCategories: [],
    thirdParties: [],
    internationalTransfers: false,
    transferMechanisms: [],
    purposeDescription: ''
  });

  const supabase = createClient();

  const consentTypes = [
    { value: 'marketing', label: 'Marketing Communications', description: 'Receive promotional emails and messages' },
    { value: 'analytics', label: 'Analytics & Performance', description: 'Help us improve our services through usage analytics' },
    { value: 'processing', label: 'Data Processing', label: 'General data processing for service delivery' },
    { value: 'transfer', label: 'International Data Transfer', description: 'Transfer data outside the UAE' },
    { value: 'third_party', label: 'Third Party Sharing', description: 'Share data with trusted partners' },
    { value: 'cookies', label: 'Cookies & Tracking', description: 'Use cookies and similar tracking technologies' },
    { value: 'profiling', label: 'Profiling & Automated Processing', description: 'Create profiles and automated decisions' }
  ];

  const legalBases = [
    { value: 'consent', label: 'Consent', description: 'The data subject has given consent' },
    { value: 'contract', label: 'Contract', description: 'Processing is necessary for a contract' },
    { value: 'legal_obligation', label: 'Legal Obligation', description: 'Processing is required by law' },
    { value: 'vital_interests', label: 'Vital Interests', description: 'Processing is necessary to protect life' },
    { value: 'public_task', label: 'Public Task', description: 'Processing is necessary for a public function' },
    { value: 'legitimate_interests', label: 'Legitimate Interests', description: 'Processing is necessary for legitimate interests' }
  ];

  const processingPurposes = [
    'Service Delivery',
    'Customer Support',
    'Marketing & Communications',
    'Analytics & Performance',
    'Fraud Prevention',
    'Legal Compliance',
    'Security & Safety',
    'Research & Development',
    'Personalization',
    'Business Operations'
  ];

  const dataCategories = [
    'Personal Identification Data',
    'Contact Information',
    'Financial Information',
    'Usage Data',
    'Device Information',
    'Location Data',
    'Communication Records',
    'Preferences & Settings',
    'Activity History',
    'Performance Metrics'
  ];

  const thirdParties = [
    'Payment Processors',
    'Email Service Providers',
    'Analytics Providers',
    'Cloud Service Providers',
    'Customer Support Tools',
    'Marketing Platforms',
    'Security Service Providers',
    'Legal & Compliance Services'
  ];

  const transferMechanisms = [
    'Adequacy Decision',
    'Standard Contractual Clauses',
    'Binding Corporate Rules',
    'Certification',
    'Codes of Conduct',
    'Other Appropriate Safeguards'
  ];

  useEffect(() => {
    fetchConsents();
  }, [userId, userRole]);

  const fetchConsents = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('consent_records')
        .select('*')
        .order('created_at', { ascending: false });

      // Regular users can only see their own consents
      if (userRole === 'user' && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConsents(data || []);
    } catch (error) {
      console.error('Error fetching consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordConsent = async () => {
    try {
      const consentData = {
        ...consentForm,
        consent_given: true,
        consent_date: new Date().toISOString(),
        ip_address: null, // Would be set from request context
        user_agent: null, // Would be set from request context
        consent_method: 'web_form',
        is_active: true
      };

      const { data, error } = await supabase
        .from('consent_records')
        .insert([consentData])
        .select()
        .single();

      if (error) throw error;

      setConsents([data, ...consents]);
      setShowConsentDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error recording consent:', error);
    }
  };

  const withdrawConsent = async (consentId: string) => {
    try {
      const { error } = await supabase
        .from('consent_records')
        .update({
          is_active: false,
          withdrawal_date: new Date().toISOString(),
          withdrawal_method: 'self_service'
        })
        .eq('id', consentId);

      if (error) throw error;

      setConsents(consents.map(c => 
        c.id === consentId 
          ? { ...c, isActive: false, withdrawalDate: new Date().toISOString() }
          : c
      ));
    } catch (error) {
      console.error('Error withdrawing consent:', error);
    }
  };

  const resetForm = () => {
    setConsentForm({
      userId: userId || '',
      consentType: 'marketing',
      consentVersion: '1.0',
      legalBasis: 'consent',
      processingPurposes: [],
      dataCategories: [],
      thirdParties: [],
      internationalTransfers: false,
      transferMechanisms: [],
      purposeDescription: ''
    });
  };

  const getConsentStatusBadge = (consent: ConsentRecord) => {
    const isExpired = consent.consentExpiry && new Date(consent.consentExpiry) < new Date();
    
    if (!consent.isActive) {
      return <Badge variant="destructive">Withdrawn</Badge>;
    }
    
    if (isExpired) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-500">Active</Badge>;
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isExpiringSoon = (consent: ConsentRecord) => {
    return consent.consentExpiry && 
           getDaysUntilExpiry(consent.consentExpiry) <= 30 && 
           consent.isActive;
  };

  const canManageConsents = ['admin', 'compliance_officer', 'dpo'].includes(userRole);

  if (loading) {
    return <div className="flex justify-center py-8">Loading consents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span>Consent Management</span>
          </h2>
          <p className="text-gray-600">Manage user consents and permissions</p>
        </div>
        <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowConsentDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Consent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record New Consent</DialogTitle>
              <DialogDescription>
                Record a new consent given by a data subject
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userId">User ID *</Label>
                  <Input
                    id="userId"
                    value={consentForm.userId}
                    onChange={(e) => setConsentForm({ ...consentForm, userId: e.target.value })}
                    placeholder="Enter user ID"
                  />
                </div>
                <div>
                  <Label htmlFor="consentType">Consent Type *</Label>
                  <select
                    id="consentType"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={consentForm.consentType}
                    onChange={(e) => setConsentForm({ ...consentForm, consentType: e.target.value })}
                  >
                    {consentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="legalBasis">Legal Basis *</Label>
                  <select
                    id="legalBasis"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={consentForm.legalBasis}
                    onChange={(e) => setConsentForm({ ...consentForm, legalBasis: e.target.value })}
                  >
                    {legalBases.map((basis) => (
                      <option key={basis.value} value={basis.value}>
                        {basis.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="consentVersion">Consent Version *</Label>
                  <Input
                    id="consentVersion"
                    value={consentForm.consentVersion}
                    onChange={(e) => setConsentForm({ ...consentForm, consentVersion: e.target.value })}
                    placeholder="1.0"
                  />
                </div>
              </div>

              <div>
                <Label>Processing Purposes *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                  {processingPurposes.map((purpose) => (
                    <label key={purpose} className="flex items-center space-x-2">
                      <Checkbox
                        checked={consentForm.processingPurposes.includes(purpose)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setConsentForm({
                              ...consentForm,
                              processingPurposes: [...consentForm.processingPurposes, purpose]
                            });
                          } else {
                            setConsentForm({
                              ...consentForm,
                              processingPurposes: consentForm.processingPurposes.filter(p => p !== purpose)
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{purpose}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Data Categories *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                  {dataCategories.map((category) => (
                    <label key={category} className="flex items-center space-x-2">
                      <Checkbox
                        checked={consentForm.dataCategories.includes(category)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setConsentForm({
                              ...consentForm,
                              dataCategories: [...consentForm.dataCategories, category]
                            });
                          } else {
                            setConsentForm({
                              ...consentForm,
                              dataCategories: consentForm.dataCategories.filter(c => c !== category)
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Third Parties</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {thirdParties.map((party) => (
                    <label key={party} className="flex items-center space-x-2">
                      <Checkbox
                        checked={consentForm.thirdParties?.includes(party) || false}
                        onCheckedChange={(checked) => {
                          const currentParties = consentForm.thirdParties || [];
                          if (checked) {
                            setConsentForm({
                              ...consentForm,
                              thirdParties: [...currentParties, party]
                            });
                          } else {
                            setConsentForm({
                              ...consentForm,
                              thirdParties: currentParties.filter(p => p !== party)
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{party}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={consentForm.internationalTransfers}
                  onCheckedChange={(checked) => 
                    setConsentForm({ ...consentForm, internationalTransfers: checked })
                  }
                />
                <Label>International Data Transfers</Label>
              </div>

              {consentForm.internationalTransfers && (
                <div>
                  <Label>Transfer Mechanisms</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {transferMechanisms.map((mechanism) => (
                      <label key={mechanism} className="flex items-center space-x-2">
                        <Checkbox
                          checked={consentForm.transferMechanisms?.includes(mechanism) || false}
                          onCheckedChange={(checked) => {
                            const currentMechanisms = consentForm.transferMechanisms || [];
                            if (checked) {
                              setConsentForm({
                                ...consentForm,
                                transferMechanisms: [...currentMechanisms, mechanism]
                              });
                            } else {
                              setConsentForm({
                                ...consentForm,
                                transferMechanisms: currentMechanisms.filter(m => m !== mechanism)
                              });
                            }
                          }}
                        />
                        <span className="text-sm">{mechanism}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="consentExpiry">Consent Expiry (Optional)</Label>
                <Input
                  id="consentExpiry"
                  type="date"
                  value={consentForm.consentExpiry || ''}
                  onChange={(e) => setConsentForm({ ...consentForm, consentExpiry: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="purposeDescription">Additional Details</Label>
                <Textarea
                  id="purposeDescription"
                  value={consentForm.purposeDescription}
                  onChange={(e) => setConsentForm({ ...consentForm, purposeDescription: e.target.value })}
                  placeholder="Provide additional details about the consent..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowConsentDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={recordConsent} 
                  disabled={!consentForm.userId || consentForm.processingPurposes.length === 0 || consentForm.dataCategories.length === 0}
                >
                  Record Consent
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{consents.length}</div>
                <div className="text-sm text-gray-600">Total Consents</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {consents.filter(c => c.isActive).length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">
                  {consents.filter(c => isExpiringSoon(c)).length}
                </div>
                <div className="text-sm text-gray-600">Expiring Soon</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">
                  {consents.filter(c => !c.isActive).length}
                </div>
                <div className="text-sm text-gray-600">Withdrawn</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consents List */}
      <Card>
        <CardHeader>
          <CardTitle>Consent Records</CardTitle>
          <CardDescription>
            View and manage all consent records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {consents.map((consent) => (
              <div 
                key={consent.id} 
                className={`border rounded-lg p-4 space-y-3 ${isExpiringSoon(consent) ? 'border-yellow-500 bg-yellow-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold flex items-center space-x-2">
                      <span>{consentTypes.find(t => t.value === consent.consentType)?.label}</span>
                      {isExpiringSoon(consent) && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Consent ID: {consent.id.slice(0, 8)}...</span>
                      <span>User: {maskSensitiveData(consent.userId, 8)}</span>
                      <span>Given: {formatDateTime(consent.consentDate)}</span>
                      {consent.consentExpiry && (
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {getDaysUntilExpiry(consent.consentExpiry) > 0 
                            ? `${getDaysUntilExpiry(consent.consentExpiry)} days remaining`
                            : 'Expired'
                          }
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getConsentStatusBadge(consent)}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedConsent(consent);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {consent.isActive && canManageConsents && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => withdrawConsent(consent.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm space-y-1">
                    <div><strong>Legal Basis:</strong> {legalBases.find(b => b.value === consent.legalBasis)?.label}</div>
                    <div><strong>Processing Purposes:</strong> {consent.processingPurposes.join(', ')}</div>
                    <div><strong>Data Categories:</strong> {consent.dataCategories.join(', ')}</div>
                    {consent.internationalTransfers && (
                      <div><strong>International Transfers:</strong> Yes</div>
                    )}
                  </div>
                </div>

                {consent.withdrawalDate && (
                  <div className="bg-red-50 p-3 rounded-md">
                    <div className="text-sm text-red-700">
                      <strong>Withdrawn:</strong> {formatDateTime(consent.withdrawalDate)} via {consent.withdrawalMethod}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {consents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No consent records found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Consent Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Consent Details</DialogTitle>
            <DialogDescription>
              Detailed information about this consent record
            </DialogDescription>
          </DialogHeader>
          {selectedConsent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Consent Type</Label>
                  <p className="font-medium">
                    {consentTypes.find(t => t.value === selectedConsent.consentType)?.label}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getConsentStatusBadge(selectedConsent)}</div>
                </div>
                <div>
                  <Label>Legal Basis</Label>
                  <p>{legalBases.find(b => b.value === selectedConsent.legalBasis)?.label}</p>
                </div>
                <div>
                  <Label>Consent Version</Label>
                  <p>{selectedConsent.consentVersion}</p>
                </div>
                <div>
                  <Label>Given Date</Label>
                  <p>{formatDateTime(selectedConsent.consentDate)}</p>
                </div>
                <div>
                  <Label>Consent Method</Label>
                  <p>{selectedConsent.consentMethod}</p>
                </div>
              </div>
              
              <div>
                <Label>Processing Purposes</Label>
                <ul className="mt-1 list-disc list-inside text-sm">
                  {selectedConsent.processingPurposes.map((purpose, index) => (
                    <li key={index}>{purpose}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <Label>Data Categories</Label>
                <ul className="mt-1 list-disc list-inside text-sm">
                  {selectedConsent.dataCategories.map((category, index) => (
                    <li key={index}>{category}</li>
                  ))}
                </ul>
              </div>

              {selectedConsent.thirdParties && selectedConsent.thirdParties.length > 0 && (
                <div>
                  <Label>Third Parties</Label>
                  <ul className="mt-1 list-disc list-inside text-sm">
                    {selectedConsent.thirdParties.map((party, index) => (
                      <li key={index}>{party}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedConsent.internationalTransfers && (
                <div>
                  <Label>International Transfers</Label>
                  <p className="text-sm">Yes</p>
                  {selectedConsent.transferMechanisms && selectedConsent.transferMechanisms.length > 0 && (
                    <ul className="mt-1 list-disc list-inside text-sm">
                      {selectedConsent.transferMechanisms.map((mechanism, index) => (
                        <li key={index}>{mechanism}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {selectedConsent.consentExpiry && (
                <div>
                  <Label>Consent Expiry</Label>
                  <p className={getDaysUntilExpiry(selectedConsent.consentExpiry) < 0 ? 'text-red-600' : ''}>
                    {formatDate(selectedConsent.consentExpiry)}
                    {getDaysUntilExpiry(selectedConsent.consentExpiry) < 0 && ' (Expired)'}
                  </p>
                </div>
              )}

              {selectedConsent.withdrawalDate && (
                <div className="bg-red-50 p-3 rounded-md">
                  <Label>Withdrawal Information</Label>
                  <p className="text-sm">Withdrawn on: {formatDateTime(selectedConsent.withdrawalDate)}</p>
                  <p className="text-sm">Method: {selectedConsent.withdrawalMethod}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                {selectedConsent.isActive && userRole !== 'user' && (
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      withdrawConsent(selectedConsent.id);
                      setShowDetailsDialog(false);
                    }}
                  >
                    Withdraw Consent
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsentManager;