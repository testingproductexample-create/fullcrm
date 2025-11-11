'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CertificateIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  useEmployeeCertifications,
  useCertificationMutation,
  useTrainingPrograms
} from '@/hooks/useTraining';

interface CertificationFormData {
  employee_id: string;
  certification_name: string;
  certification_authority: string;
  issue_date: string;
  expiry_date: string;
  certification_number: string;
  description?: string;
  status: 'active' | 'expired' | 'pending_renewal';
}

export default function CertificationsPage() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [authorityFilter, setAuthorityFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCertification, setEditingCertification] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState<CertificationFormData>({
    employee_id: '',
    certification_name: '',
    certification_authority: '',
    issue_date: '',
    expiry_date: '',
    certification_number: '',
    description: '',
    status: 'active'
  });

  const { data: certifications = [], isLoading, refetch } = useEmployeeCertifications(selectedEmployee === 'all' ? undefined : selectedEmployee);
  const { data: trainingPrograms = [] } = useTrainingPrograms();
  const certificationMutation = useCertificationMutation();

  // Calculate certification metrics
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
  const ninetyDaysFromNow = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));

  const activeCertifications = certifications.filter(cert => cert.status === 'active');
  const expiredCertifications = certifications.filter(cert => cert.status === 'expired' || (cert.expiry_date && new Date(cert.expiry_date) <= now));
  const expiringIn30Days = certifications.filter(cert => {
    if (!cert.expiry_date) return false;
    const expiryDate = new Date(cert.expiry_date);
    return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
  });
  const expiringIn90Days = certifications.filter(cert => {
    if (!cert.expiry_date) return false;
    const expiryDate = new Date(cert.expiry_date);
    return expiryDate <= ninetyDaysFromNow && expiryDate >= now;
  });

  // Filter certifications
  const filteredCertifications = certifications.filter(cert => {
    const matchesSearch = cert.certification_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cert.certification_authority?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cert.certification_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
    const matchesAuthority = authorityFilter === 'all' || cert.certification_authority === authorityFilter;
    const matchesTab = selectedTab === 'all' || 
                      (selectedTab === 'active' && cert.status === 'active') ||
                      (selectedTab === 'expired' && (cert.status === 'expired' || (cert.expiry_date && new Date(cert.expiry_date) <= now))) ||
                      (selectedTab === 'expiring' && cert.expiry_date && new Date(cert.expiry_date) <= ninetyDaysFromNow && new Date(cert.expiry_date) >= now);
    
    return matchesSearch && matchesStatus && matchesAuthority && matchesTab;
  });

  // Get unique authorities for filter
  const authorities = [...new Set(certifications.map(c => c.certification_authority).filter(Boolean))];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await certificationMutation.mutateAsync({
        organization_id: 'current_org_id', // This would come from auth context
        ...formData,
        created_at: new Date().toISOString()
      });
      setIsDialogOpen(false);
      setFormData({
        employee_id: '',
        certification_name: '',
        certification_authority: '',
        issue_date: '',
        expiry_date: '',
        certification_number: '',
        description: '',
        status: 'active'
      });
      refetch();
    } catch (error) {
      console.error('Failed to create certification:', error);
    }
  };

  const getCertificationStatusColor = (certification: any) => {
    if (!certification.expiry_date) return 'bg-green-100 text-green-800';
    
    const expiryDate = new Date(certification.expiry_date);
    if (expiryDate <= now) return 'bg-red-100 text-red-800';
    if (expiryDate <= thirtyDaysFromNow) return 'bg-yellow-100 text-yellow-800';
    if (expiryDate <= ninetyDaysFromNow) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getCertificationStatusText = (certification: any) => {
    if (!certification.expiry_date) return 'No Expiry';
    
    const expiryDate = new Date(certification.expiry_date);
    if (expiryDate <= now) return 'Expired';
    if (expiryDate <= thirtyDaysFromNow) return 'Expires in 30 days';
    if (expiryDate <= ninetyDaysFromNow) return 'Expires in 90 days';
    return 'Active';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certification Management</h1>
          <p className="text-gray-600 mt-2">Track and manage employee certifications and renewals</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Certification</DialogTitle>
              <DialogDescription>
                Register a new certification for an employee
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certification_name">Certification Name</Label>
                <Input
                  id="certification_name"
                  value={formData.certification_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, certification_name: e.target.value }))}
                  placeholder="e.g., Advanced Tailoring Certificate"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certification_authority">Issuing Authority</Label>
                <Input
                  id="certification_authority"
                  value={formData.certification_authority}
                  onChange={(e) => setFormData(prev => ({ ...prev, certification_authority: e.target.value }))}
                  placeholder="e.g., UAE Ministry of Education"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certification_number">Certificate Number</Label>
                <Input
                  id="certification_number"
                  value={formData.certification_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, certification_number: e.target.value }))}
                  placeholder="e.g., ATC-2025-001234"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional certification details..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={certificationMutation.isPending}>
                  {certificationMutation.isPending ? 'Adding...' : 'Add Certification'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Certifications</CardTitle>
            <CertificateIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{certifications.length}</div>
            <p className="text-xs text-blue-600 mt-1">All employee certifications</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Active Certifications</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{activeCertifications.length}</div>
            <p className="text-xs text-green-600 mt-1">Currently valid</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Expiring Soon</CardTitle>
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{expiringIn30Days.length}</div>
            <p className="text-xs text-yellow-600 mt-1">Within 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Expired</CardTitle>
            <ClockIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{expiredCertifications.length}</div>
            <p className="text-xs text-red-600 mt-1">Need renewal</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white/10 backdrop-blur-md border border-white/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search certifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white/50 backdrop-blur-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending_renewal">Pending Renewal</SelectItem>
                </SelectContent>
              </Select>
              <Select value={authorityFilter} onValueChange={setAuthorityFilter}>
                <SelectTrigger className="w-48 bg-white/50 backdrop-blur-sm">
                  <SelectValue placeholder="Authority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Authorities</SelectItem>
                  {authorities.map(authority => (
                    <SelectItem key={authority} value={authority}>{authority}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({certifications.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeCertifications.length})</TabsTrigger>
          <TabsTrigger value="expiring">Expiring ({expiringIn90Days.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredCertifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-6">
          {/* Certifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertifications.map((cert) => (
              <Card key={cert.id} className="bg-white/10 backdrop-blur-md border border-white/20 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900 mb-2">
                        {cert.certification_name}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {cert.certification_authority}
                      </CardDescription>
                    </div>
                    <Badge className={getCertificationStatusColor(cert)}>
                      {getCertificationStatusText(cert)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Certificate #</span>
                      <span className="font-medium">{cert.certification_number || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Issue Date</span>
                      <span className="font-medium">
                        {cert.issue_date ? formatDate(cert.issue_date) : 'Not provided'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Expiry Date</span>
                      <span className="font-medium">
                        {cert.expiry_date ? formatDate(cert.expiry_date) : 'No expiry'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Employee</span>
                      <span className="font-medium">EMP-{cert.employee_id?.slice(-6) || 'Unknown'}</span>
                    </div>
                  </div>

                  {cert.description && (
                    <div className="text-sm">
                      <span className="text-gray-500 block mb-1">Description</span>
                      <p className="text-gray-700 line-clamp-2">{cert.description}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <Button variant="outline" size="sm">
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      {cert.expiry_date && new Date(cert.expiry_date) <= ninetyDaysFromNow && (
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                          <ArrowPathIcon className="h-4 w-4 mr-2" />
                          Renew
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCertifications.length === 0 && (
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CertificateIcon className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No certifications found</h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchQuery || statusFilter !== 'all' || authorityFilter !== 'all' 
                    ? 'Try adjusting your filters or search query.'
                    : 'Start by adding employee certifications to track their credentials.'}
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add First Certification
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}