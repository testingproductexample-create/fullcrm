'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PencilSquareIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useSignatureTracking, useContracts } from '@/hooks/useLegal';

export default function DigitalSignatures() {
  const [selectedTab, setSelectedTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Data hooks
  const { data: signatures = [], isLoading: signaturesLoading } = useSignatureTracking();
  const { data: contracts = [], isLoading: contractsLoading } = useContracts();

  // Filter signatures by tab and search
  const filteredSignatures = signatures.filter(signature => {
    const matchesSearch = !searchTerm || 
      signature.contract_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signature.signer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signature.signer_email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (selectedTab) {
      case 'pending':
        return signature.signature_status === 'pending';
      case 'signed':
        return signature.signature_status === 'signed';
      case 'rejected':
        return signature.signature_status === 'rejected';
      case 'expired':
        return signature.is_expired;
      default:
        return true;
    }
  });

  const getSignatureStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSignatureMethodIcon = (method: string) => {
    switch (method) {
      case 'digital': return <ShieldCheckIcon className="h-4 w-4" />;
      case 'electronic': return <PencilSquareIcon className="h-4 w-4" />;
      case 'biometric': return <UserIcon className="h-4 w-4" />;
      default: return <PencilSquareIcon className="h-4 w-4" />;
    }
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return expiry <= threeDaysFromNow;
  };

  if (signaturesLoading || contractsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingSignatures = signatures.filter(s => s.signature_status === 'pending');
  const signedToday = signatures.filter(s => 
    s.signature_status === 'signed' && 
    new Date(s.signed_at || '').toDateString() === new Date().toDateString()
  );
  const expiringSoon = signatures.filter(s => 
    s.signature_status === 'pending' && 
    s.expires_at && 
    isExpiringSoon(s.expires_at)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Digital Signatures</h1>
          <p className="text-gray-600 mt-2">Manage digital signature workflows and track signing progress</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <PencilSquareIcon className="h-4 w-4 mr-2" />
            Request Signature
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Bulk Send
          </Button>
        </div>
      </div>

      {/* Alerts for Expiring Signatures */}
      {expiringSoon.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-orange-800">Signatures Expiring Soon</span>
          </div>
          <div className="mt-2 text-sm text-orange-700">
            <p>{expiringSoon.length} signature request{expiringSoon.length > 1 ? 's' : ''} expiring within 3 days</p>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" className="text-orange-700 border-orange-300">
              <BellIcon className="h-4 w-4 mr-1" />
              Send Reminders
            </Button>
            <Button size="sm" variant="outline" className="text-orange-700 border-orange-300">
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Extend Deadline
            </Button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Signatures</p>
                <p className="text-3xl font-bold text-orange-600">{pendingSignatures.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Signed Today</p>
                <p className="text-3xl font-bold text-green-600">{signedToday.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-3xl font-bold text-red-600">{expiringSoon.length}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-purple-600">
                  {signatures.length > 0 ? 
                    Math.round((signatures.filter(s => s.signature_status === 'signed').length / signatures.length) * 100) : 0
                  }%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by contract ID, signer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Signature Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="all">All ({signatures.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingSignatures.length})</TabsTrigger>
          <TabsTrigger value="signed">Signed ({signatures.filter(s => s.signature_status === 'signed').length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({signatures.filter(s => s.signature_status === 'rejected').length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({signatures.filter(s => s.is_expired).length})</TabsTrigger>
        </TabsList>

        {/* Signature Cards */}
        <TabsContent value={selectedTab} className="space-y-4">
          {filteredSignatures.length === 0 ? (
            <Card className="glass">
              <CardContent className="p-12 text-center">
                <PencilSquareIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No signatures found</h3>
                <p className="text-gray-600 mb-6">No signature requests match your current filters</p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <PencilSquareIcon className="h-4 w-4 mr-2" />
                  Request Signature
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSignatures.map((signature) => (
                <Card key={signature.id} className="glass hover-lift">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getSignatureMethodIcon(signature.signature_method || 'digital')}
                          <span className="truncate">Contract Signature Request</span>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {signature.contract_id} • {signature.signature_method}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getSignatureStatusColor(signature.signature_status)}>
                          {signature.signature_status}
                        </Badge>
                        {signature.is_expired && (
                          <Badge className="text-red-600 bg-red-100">
                            Expired
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Signer Information */}
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Signer</span>
                        </div>
                        <div>
                          <p className="font-medium">{signature.signer_name || 'N/A'}</p>
                          <p className="text-gray-600 text-xs">{signature.signer_email}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Timeline</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <p><span className="text-gray-500">Sent:</span> {new Date(signature.sent_at || '').toLocaleDateString()}</p>
                          {signature.signed_at && (
                            <p><span className="text-gray-500">Signed:</span> {new Date(signature.signed_at).toLocaleDateString()}</p>
                          )}
                          {signature.expires_at && (
                            <p className={`${isExpiringSoon(signature.expires_at) ? 'text-red-600' : 'text-gray-500'}`}>
                              <span className="text-gray-500">Expires:</span> {new Date(signature.expires_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Signature Method Info */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getSignatureMethodIcon(signature.signature_method || 'digital')}
                        <span className="text-sm text-gray-600">Method:</span>
                        <span className="text-sm font-medium">{signature.signature_method}</span>
                      </div>
                      {signature.is_legally_valid && (
                        <Badge className="text-green-600 bg-green-100 text-xs">
                          <ShieldCheckIcon className="h-3 w-3 mr-1" />
                          Valid
                        </Badge>
                      )}
                    </div>

                    {/* Warning for expiring */}
                    {signature.signature_status === 'pending' && signature.expires_at && isExpiringSoon(signature.expires_at) && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-orange-700">Expires in less than 3 days</span>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {signature.signature_status === 'rejected' && signature.rejection_reason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">
                          <span className="font-medium">Rejection Reason:</span> {signature.rejection_reason}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      {signature.signature_status === 'pending' && (
                        <>
                          <Button variant="outline" size="sm" className="flex-1">
                            <BellIcon className="h-4 w-4 mr-2" />
                            Remind
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <ArrowPathIcon className="h-4 w-4 mr-2" />
                            Resend
                          </Button>
                        </>
                      )}
                      
                      {signature.signature_status === 'signed' && (
                        <Button variant="outline" size="sm" className="flex-1">
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Certificate
                        </Button>
                      )}

                      <Link href={`/legal/contracts/${signature.contract_id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <DocumentTextIcon className="h-4 w-4 mr-2" />
                          View Contract
                        </Button>
                      </Link>

                      {signature.signature_status === 'pending' && (
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <XMarkIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Signature Workflow Info */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Digital Signature Workflow</CardTitle>
          <CardDescription>How our digital signature process works</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm mb-2">1</div>
              <h3 className="font-medium text-gray-900">Send Request</h3>
              <p className="text-xs text-gray-600 mt-1">Contract sent to signers via secure email</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-orange-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm mb-2">2</div>
              <h3 className="font-medium text-gray-900">Review & Sign</h3>
              <p className="text-xs text-gray-600 mt-1">Signers review and digitally sign the document</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm mb-2">3</div>
              <h3 className="font-medium text-gray-900">Validation</h3>
              <p className="text-xs text-gray-600 mt-1">Signature validity verified and certified</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm mb-2">4</div>
              <h3 className="font-medium text-gray-900">Complete</h3>
              <p className="text-xs text-gray-600 mt-1">Signed contract stored securely with audit trail</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}