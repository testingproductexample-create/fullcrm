import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Slider } from '../../../components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { 
  Shield, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Users, 
  Database,
  Globe,
  Clock,
  Eye,
  Edit,
  Download
} from 'lucide-react';
import { createClient } from '../../../../lib/supabase';
import { formatDate, formatDateTime } from '../../utils/uuid';

interface ProcessingActivity {
  id: string;
  activityName: string;
  activityDescription: string;
  controllerName: string;
  dpoContact?: string;
  legalBasis: string;
  processingPurposes: string[];
  dataCategories: string[];
  dataSubjects: string[];
  recipients?: string[];
  internationalTransfers: boolean;
  transferCountries?: string[];
  transferMechanisms?: string[];
  retentionPeriod?: string;
  securityMeasures?: string[];
  automatedDecisionMaking: boolean;
  profiling: boolean;
  specialCategoryData: boolean;
  consentRequired: boolean;
  riskLevel: string;
  lastAssessmentDate?: string;
  nextAssessmentDate?: string;
  isActive: boolean;
}

interface DPEAAssessment {
  id: string;
  assessmentName: string;
  assessmentDate: string;
  assessmentOfficer?: string;
  processingActivityId: string;
  riskAssessment: any;
  likelihoodScores: any;
  impactScores: any;
  riskLevel: string;
  mitigationMeasures: string[];
  residualRisks: string[];
  stakeholderConsultation: string;
  dpeoConsultation: boolean;
  supervisoryAuthorityConsulted: boolean;
  consultationOutcome?: string;
  approvalStatus: string;
  approvalDate?: string;
  approvedBy?: string;
  implementationDeadline?: string;
  reviewDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RiskItem {
  id: string;
  description: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  mitigationMeasure?: string;
  residualRisk?: string;
}

export const DPEAManager: React.FC<{ userId?: string; userRole?: string }> = ({ 
  userId, 
  userRole = 'user' 
}) => {
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [assessments, setAssessments] = useState<DPEAAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ProcessingActivity | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<DPEAAssessment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  const [assessmentForm, setAssessmentForm] = useState({
    assessmentName: '',
    processingActivityId: '',
    assessmentDate: new Date().toISOString().split('T')[0],
    risks: [] as RiskItem[],
    mitigationMeasures: [] as string[],
    residualRisks: [] as string[],
    stakeholderConsultation: '',
    dpeoConsultation: false,
    supervisoryAuthorityConsulted: false,
    consultationOutcome: '',
    implementationDeadline: '',
    reviewDate: ''
  });

  const supabase = createClient();

  const riskLevels = [
    { value: 'low', label: 'Low Risk', color: 'bg-green-500', description: 'Minimal privacy impact' },
    { value: 'medium', label: 'Medium Risk', color: 'bg-yellow-500', description: 'Moderate privacy impact' },
    { value: 'high', label: 'High Risk', color: 'bg-orange-500', description: 'Significant privacy impact' },
    { value: 'critical', label: 'Critical Risk', color: 'bg-red-500', description: 'Severe privacy impact' }
  ];

  const commonRisks = [
    { description: 'Unauthorized access to personal data' },
    { description: 'Data breach or loss' },
    { description: 'Unauthorized data sharing' },
    { description: 'Inadequate security measures' },
    { description: 'Excessive data collection' },
    { description: 'Profiling without consent' },
    { description: 'Automated decision-making bias' },
    { description: 'International data transfer risks' },
    { description: 'Data retention beyond necessity' },
    { description: 'Lack of transparency in processing' },
    { description: 'Inadequate consent mechanisms' },
    { description: 'Data subject rights violations' }
  ];

  useEffect(() => {
    fetchActivities();
    fetchAssessments();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('data_processing_activities')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('dpea_assessments')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAssessment = async () => {
    try {
      // Calculate overall risk level based on highest risk
      const highestRisk = Math.max(...assessmentForm.risks.map(r => r.riskScore));
      let riskLevel = 'low';
      if (highestRisk >= 20) riskLevel = 'critical';
      else if (highestRisk >= 15) riskLevel = 'high';
      else if (highestRisk >= 10) riskLevel = 'medium';

      const assessmentData = {
        assessment_name: assessmentForm.assessmentName,
        assessment_date: assessmentForm.assessmentDate,
        assessment_officer: userId,
        processing_activity_id: assessmentForm.processingActivityId,
        risk_assessment: {
          risks: assessmentForm.risks,
          totalRisks: assessmentForm.risks.length,
          highRisks: assessmentForm.risks.filter(r => r.riskScore >= 15).length
        },
        likelihood_scores: assessmentForm.risks.reduce((acc, risk) => {
          acc[risk.id] = risk.likelihood;
          return acc;
        }, {} as any),
        impact_scores: assessmentForm.risks.reduce((acc, risk) => {
          acc[risk.id] = risk.impact;
          return acc;
        }, {} as any),
        risk_level: riskLevel,
        mitigation_measures: assessmentForm.mitigationMeasures,
        residual_risks: assessmentForm.residualRisks,
        stakeholder_consultation: assessmentForm.stakeholderConsultation,
        dpeo_consultation: assessmentForm.dpeoConsultation,
        supervisory_authority_consulted: assessmentForm.supervisoryAuthorityConsulted,
        consultation_outcome: assessmentForm.consultationOutcome,
        approval_status: 'pending',
        implementation_deadline: assessmentForm.implementationDeadline,
        review_date: assessmentForm.reviewDate,
        is_active: true
      };

      const { data, error } = await supabase
        .from('dpea_assessments')
        .insert([assessmentData])
        .select()
        .single();

      if (error) throw error;

      setAssessments([data, ...assessments]);
      setShowAssessmentDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating assessment:', error);
    }
  };

  const updateAssessmentStatus = async (assessmentId: string, status: string, approvedBy?: string) => {
    try {
      const updateData: any = {
        approval_status: status,
        updated_at: new Date().toISOString()
      };

      if (status === 'approved') {
        updateData.approval_date = new Date().toISOString();
        updateData.approved_by = approvedBy || userId;
      }

      const { data, error } = await supabase
        .from('dpea_assessments')
        .update(updateData)
        .eq('id', assessmentId)
        .select()
        .single();

      if (error) throw error;

      setAssessments(assessments.map(a => a.id === assessmentId ? data : a));
    } catch (error) {
      console.error('Error updating assessment status:', error);
    }
  };

  const resetForm = () => {
    setAssessmentForm({
      assessmentName: '',
      processingActivityId: '',
      assessmentDate: new Date().toISOString().split('T')[0],
      risks: [],
      mitigationMeasures: [],
      residualRisks: [],
      stakeholderConsultation: '',
      dpeoConsultation: false,
      supervisoryAuthorityConsulted: false,
      consultationOutcome: '',
      implementationDeadline: '',
      reviewDate: ''
    });
  };

  const addRisk = (riskDescription: string) => {
    const newRisk: RiskItem = {
      id: `risk-${Date.now()}`,
      description: riskDescription,
      likelihood: 3,
      impact: 3,
      riskScore: 9
    };
    setAssessmentForm({
      ...assessmentForm,
      risks: [...assessmentForm.risks, newRisk]
    });
  };

  const updateRisk = (riskId: string, field: 'likelihood' | 'impact', value: number) => {
    setAssessmentForm({
      ...assessmentForm,
      risks: assessmentForm.risks.map(risk => {
        if (risk.id === riskId) {
          const updatedRisk = { ...risk, [field]: value };
          updatedRisk.riskScore = updatedRisk.likelihood * updatedRisk.impact;
          return updatedRisk;
        }
        return risk;
      })
    });
  };

  const removeRisk = (riskId: string) => {
    setAssessmentForm({
      ...assessmentForm,
      risks: assessmentForm.risks.filter(risk => risk.id !== riskId)
    });
  };

  const getRiskLevelBadge = (riskLevel: string) => {
    const level = riskLevels.find(l => l.value === riskLevel);
    if (!level) return <Badge variant="outline">{riskLevel}</Badge>;
    
    return (
      <Badge className={`${level.color} text-white`}>
        {level.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'requires_modification':
        return <Badge variant="secondary">Requires Modification</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const calculateOverallRisk = (risks: RiskItem[]) => {
    if (risks.length === 0) return 0;
    return Math.max(...risks.map(r => r.riskScore));
  };

  const canManageAssessments = ['admin', 'compliance_officer', 'dpo'].includes(userRole);

  if (loading) {
    return <div className="flex justify-center py-8">Loading DPEA data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span>Data Protection Impact Assessment (DPEA)</span>
          </h2>
          <p className="text-gray-600">Assess and manage privacy risks in data processing activities</p>
        </div>
        <Dialog open={showAssessmentDialog} onOpenChange={setShowAssessmentDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowAssessmentDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New DPEA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create DPEA Assessment</DialogTitle>
              <DialogDescription>
                Conduct a Data Protection Impact Assessment for a processing activity
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="risks">Risk Assessment</TabsTrigger>
                <TabsTrigger value="mitigation">Mitigation</TabsTrigger>
                <TabsTrigger value="consultation">Consultation</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assessmentName">Assessment Name *</Label>
                    <Input
                      id="assessmentName"
                      value={assessmentForm.assessmentName}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, assessmentName: e.target.value })}
                      placeholder="e.g., Customer Data Processing DPEA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="assessmentDate">Assessment Date *</Label>
                    <Input
                      id="assessmentDate"
                      type="date"
                      value={assessmentForm.assessmentDate}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, assessmentDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="processingActivity">Processing Activity *</Label>
                  <Select onValueChange={(value) => setAssessmentForm({ ...assessmentForm, processingActivityId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select processing activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {activities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          {activity.activityName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {assessmentForm.processingActivityId && (
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="font-medium mb-2">Activity Details</h4>
                    {(() => {
                      const activity = activities.find(a => a.id === assessmentForm.processingActivityId);
                      return activity ? (
                        <div className="space-y-1 text-sm">
                          <p><strong>Description:</strong> {activity.activityDescription}</p>
                          <p><strong>Data Categories:</strong> {activity.dataCategories.join(', ')}</p>
                          <p><strong>Data Subjects:</strong> {activity.dataSubjects.join(', ')}</p>
                          <p><strong>Legal Basis:</strong> {activity.legalBasis}</p>
                          <p><strong>Current Risk Level:</strong> {getRiskLevelBadge(activity.riskLevel)}</p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="risks" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Add Risks</h4>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {commonRisks.map((risk, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => addRisk(risk.description)}
                      >
                        + {risk.description}
                      </Button>
                    ))}
                  </div>
                </div>

                {assessmentForm.risks.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Risk Assessment</h4>
                    {assessmentForm.risks.map((risk) => (
                      <Card key={risk.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{risk.description}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRisk(risk.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Likelihood (1-5)</Label>
                              <div className="space-y-2">
                                <Slider
                                  value={[risk.likelihood]}
                                  onValueChange={([value]) => updateRisk(risk.id, 'likelihood', value)}
                                  max={5}
                                  min={1}
                                  step={1}
                                  className="w-full"
                                />
                                <div className="text-sm text-gray-600">
                                  Value: {risk.likelihood} 
                                  {risk.likelihood === 1 && ' (Very Unlikely)'}
                                  {risk.likelihood === 2 && ' (Unlikely)'}
                                  {risk.likelihood === 3 && ' (Possible)'}
                                  {risk.likelihood === 4 && ' (Likely)'}
                                  {risk.likelihood === 5 && ' (Very Likely)'}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <Label>Impact (1-5)</Label>
                              <div className="space-y-2">
                                <Slider
                                  value={[risk.impact]}
                                  onValueChange={([value]) => updateRisk(risk.id, 'impact', value)}
                                  max={5}
                                  min={1}
                                  step={1}
                                  className="w-full"
                                />
                                <div className="text-sm text-gray-600">
                                  Value: {risk.impact}
                                  {risk.impact === 1 && ' (Minimal)'}
                                  {risk.impact === 2 && ' (Minor)'}
                                  {risk.impact === 3 && ' (Moderate)'}
                                  {risk.impact === 4 && ' (Major)'}
                                  {risk.impact === 5 && ' (Severe)'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Risk Score:</span>
                              <Badge className={`text-lg ${
                                risk.riskScore >= 20 ? 'bg-red-500' :
                                risk.riskScore >= 15 ? 'bg-orange-500' :
                                risk.riskScore >= 10 ? 'bg-yellow-500' : 'bg-green-500'
                              } text-white`}>
                                {risk.riskScore}/25
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {assessmentForm.risks.length > 0 && (
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Overall Risk Level:</span>
                      {(() => {
                        const overallRisk = calculateOverallRisk(assessmentForm.risks);
                        let riskLevel = 'low';
                        if (overallRisk >= 20) riskLevel = 'critical';
                        else if (overallRisk >= 15) riskLevel = 'high';
                        else if (overallRisk >= 10) riskLevel = 'medium';
                        
                        return getRiskLevelBadge(riskLevel);
                      })()}
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="mitigation" className="space-y-4">
                <div>
                  <Label>Mitigation Measures</Label>
                  <div className="space-y-2 mt-2">
                    {assessmentForm.mitigationMeasures.map((measure, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={measure}
                          onChange={(e) => {
                            const updated = [...assessmentForm.mitigationMeasures];
                            updated[index] = e.target.value;
                            setAssessmentForm({ ...assessmentForm, mitigationMeasures: updated });
                          }}
                          placeholder="Describe mitigation measure"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAssessmentForm({
                              ...assessmentForm,
                              mitigationMeasures: assessmentForm.mitigationMeasures.filter((_, i) => i !== index)
                            });
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAssessmentForm({
                          ...assessmentForm,
                          mitigationMeasures: [...assessmentForm.mitigationMeasures, '']
                        });
                      }}
                    >
                      + Add Mitigation Measure
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Residual Risks</Label>
                  <div className="space-y-2 mt-2">
                    {assessmentForm.residualRisks.map((risk, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={risk}
                          onChange={(e) => {
                            const updated = [...assessmentForm.residualRisks];
                            updated[index] = e.target.value;
                            setAssessmentForm({ ...assessmentForm, residualRisks: updated });
                          }}
                          placeholder="Describe residual risk"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAssessmentForm({
                              ...assessmentForm,
                              residualRisks: assessmentForm.residualRisks.filter((_, i) => i !== index)
                            });
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAssessmentForm({
                          ...assessmentForm,
                          residualRisks: [...assessmentForm.residualRisks, '']
                        });
                      }}
                    >
                      + Add Residual Risk
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="implementationDeadline">Implementation Deadline</Label>
                    <Input
                      id="implementationDeadline"
                      type="date"
                      value={assessmentForm.implementationDeadline}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, implementationDeadline: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reviewDate">Review Date</Label>
                    <Input
                      id="reviewDate"
                      type="date"
                      value={assessmentForm.reviewDate}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, reviewDate: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="consultation" className="space-y-4">
                <div>
                  <Label htmlFor="stakeholderConsultation">Stakeholder Consultation</Label>
                  <Textarea
                    id="stakeholderConsultation"
                    value={assessmentForm.stakeholderConsultation}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, stakeholderConsultation: e.target.value })}
                    placeholder="Describe stakeholder consultation process and outcomes..."
                    rows={4}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="dpeoConsultation"
                      checked={assessmentForm.dpeoConsultation}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, dpeoConsultation: e.target.checked })}
                    />
                    <Label htmlFor="dpeoConsultation">Data Protection Officer (DPO) consultation conducted</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="supervisoryAuthorityConsulted"
                      checked={assessmentForm.supervisoryAuthorityConsulted}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, supervisoryAuthorityConsulted: e.target.checked })}
                    />
                    <Label htmlFor="supervisoryAuthorityConsulted">Supervisory authority consulted</Label>
                  </div>
                </div>

                {assessmentForm.supervisoryAuthorityConsulted && (
                  <div>
                    <Label htmlFor="consultationOutcome">Consultation Outcome</Label>
                    <Textarea
                      id="consultationOutcome"
                      value={assessmentForm.consultationOutcome}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, consultationOutcome: e.target.value })}
                      placeholder="Describe the outcome of supervisory authority consultation..."
                      rows={3}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowAssessmentDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createAssessment} 
                disabled={!assessmentForm.assessmentName || !assessmentForm.processingActivityId}
              >
                Create Assessment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{assessments.length}</div>
                <div className="text-sm text-gray-600">Total Assessments</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {assessments.filter(a => a.approvalStatus === 'approved').length}
                </div>
                <div className="text-sm text-gray-600">Approved</div>
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
                  {assessments.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical').length}
                </div>
                <div className="text-sm text-gray-600">High Risk</div>
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
                  {assessments.filter(a => a.approvalStatus === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending Review</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessments List */}
      <Card>
        <CardHeader>
          <CardTitle>DPEA Assessments</CardTitle>
          <CardDescription>
            View and manage data protection impact assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assessments.map((assessment) => {
              const activity = activities.find(a => a.id === assessment.processingActivityId);
              return (
                <div key={assessment.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold flex items-center space-x-2">
                        <span>{assessment.assessmentName}</span>
                        {getRiskLevelBadge(assessment.riskLevel)}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Activity: {activity?.activityName || 'Unknown'}</span>
                        <span>Assessment Date: {formatDate(assessment.assessmentDate)}</span>
                        {assessment.reviewDate && (
                          <span>Review Date: {formatDate(assessment.reviewDate)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(assessment.approvalStatus)}
                      {canManageAssessments && assessment.approvalStatus === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => updateAssessmentStatus(assessment.id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => updateAssessmentStatus(assessment.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedAssessment(assessment);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-sm space-y-1">
                      <div><strong>Risk Assessment:</strong> {assessment.riskAssessment.totalRisks} risks identified</div>
                      <div><strong>High Risk Items:</strong> {assessment.riskAssessment.highRisks}</div>
                      <div><strong>Mitigation Measures:</strong> {assessment.mitigationMeasures.length} measures planned</div>
                      {assessment.dpeoConsultation && <div><strong>DPO Consultation:</strong> Conducted</div>}
                      {assessment.supervisoryAuthorityConsulted && <div><strong>Authority Consultation:</strong> Yes</div>}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {assessments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No DPEA assessments found. Create your first assessment to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assessment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assessment Details</DialogTitle>
            <DialogDescription>
              Detailed information about this DPEA assessment
            </DialogDescription>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Assessment Name</Label>
                  <p className="font-medium">{selectedAssessment.assessmentName}</p>
                </div>
                <div>
                  <Label>Risk Level</Label>
                  <div className="mt-1">{getRiskLevelBadge(selectedAssessment.riskLevel)}</div>
                </div>
                <div>
                  <Label>Assessment Date</Label>
                  <p>{formatDate(selectedAssessment.assessmentDate)}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedAssessment.approvalStatus)}</div>
                </div>
              </div>

              {selectedAssessment.riskAssessment && (
                <div>
                  <Label>Risk Summary</Label>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm">
                      Total Risks: {selectedAssessment.riskAssessment.totalRisks} | 
                      High Risks: {selectedAssessment.riskAssessment.highRisks}
                    </p>
                  </div>
                </div>
              )}

              {selectedAssessment.mitigationMeasures.length > 0 && (
                <div>
                  <Label>Mitigation Measures</Label>
                  <ul className="mt-1 list-disc list-inside text-sm">
                    {selectedAssessment.mitigationMeasures.map((measure, index) => (
                      <li key={index}>{measure}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAssessment.residualRisks.length > 0 && (
                <div>
                  <Label>Residual Risks</Label>
                  <ul className="mt-1 list-disc list-inside text-sm">
                    {selectedAssessment.residualRisks.map((risk, index) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAssessment.stakeholderConsultation && (
                <div>
                  <Label>Stakeholder Consultation</Label>
                  <p className="text-sm mt-1">{selectedAssessment.stakeholderConsultation}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                {canManageAssessments && selectedAssessment.approvalStatus === 'pending' && (
                  <>
                    <Button 
                      onClick={() => {
                        updateAssessmentStatus(selectedAssessment.id, 'approved');
                        setShowDetailsDialog(false);
                      }}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        updateAssessmentStatus(selectedAssessment.id, 'rejected');
                        setShowDetailsDialog(false);
                      }}
                    >
                      Reject
                    </Button>
                  </>
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

export default DPEAManager;