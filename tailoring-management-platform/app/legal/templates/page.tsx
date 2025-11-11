'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  CalendarIcon,
  CodeBracketIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  BanknotesIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useContractTemplates } from '@/hooks/useLegal';

export default function ContractTemplates() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Data hooks
  const { data: templates = [], isLoading, error } = useContractTemplates();

  // Filter templates by tab
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.template_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (selectedTab) {
      case 'client':
        return template.template_type === 'client_service';
      case 'employee':
        return template.template_type === 'employee';
      case 'supplier':
        return template.template_type === 'supplier';
      case 'active':
        return template.is_active;
      default:
        return true;
    }
  });

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case 'client_service': return 'text-blue-600 bg-blue-100';
      case 'employee': return 'text-green-600 bg-green-100';
      case 'supplier': return 'text-purple-600 bg-purple-100';
      case 'vendor': return 'text-orange-600 bg-orange-100';
      case 'lease': return 'text-cyan-600 bg-cyan-100';
      case 'insurance': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'client_service': return <UserGroupIcon className="h-5 w-5" />;
      case 'employee': return <UserGroupIcon className="h-5 w-5" />;
      case 'supplier': return <BanknotesIcon className="h-5 w-5" />;
      default: return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contract Templates</h1>
          <p className="text-gray-600 mt-2">Manage reusable contract templates for different business needs</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <PlusIcon className="h-4 w-4 mr-2" />
            New Template
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
            Import Template
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search templates by name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Template Categories */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="all">All ({templates.length})</TabsTrigger>
          <TabsTrigger value="client">Client Service ({templates.filter(t => t.template_type === 'client_service').length})</TabsTrigger>
          <TabsTrigger value="employee">Employee ({templates.filter(t => t.template_type === 'employee').length})</TabsTrigger>
          <TabsTrigger value="supplier">Supplier ({templates.filter(t => t.template_type === 'supplier').length})</TabsTrigger>
          <TabsTrigger value="active">Active ({templates.filter(t => t.is_active).length})</TabsTrigger>
        </TabsList>

        {/* Template Grid */}
        <TabsContent value={selectedTab} className="space-y-4">
          {filteredTemplates.length === 0 ? (
            <Card className="glass">
              <CardContent className="p-12 text-center">
                <ClipboardDocumentListIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-600 mb-6">Create your first template or adjust your search</p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="glass hover-lift">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getTemplateTypeColor(template.template_type)}`}>
                          {getTemplateIcon(template.template_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{template.template_name}</CardTitle>
                          <CardDescription className="text-sm">
                            {template.template_code}
                          </CardDescription>
                        </div>
                      </div>
                      {template.is_active ? (
                        <Badge className="text-green-600 bg-green-100">Active</Badge>
                      ) : (
                        <Badge className="text-gray-600 bg-gray-100">Inactive</Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Template Details */}
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Type:</span>
                        <Badge className={getTemplateTypeColor(template.template_type)}>
                          {template.template_type.replace('_', ' ')}
                        </Badge>
                      </div>

                      {template.template_category && (
                        <div className="flex items-center gap-2">
                          <CodeBracketIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Category:</span>
                          <span className="font-medium">{template.template_category}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Language:</span>
                        <span className="font-medium">
                          {template.language === 'both' ? 'English & Arabic' : 
                           template.language === 'ar' ? 'Arabic' : 'English'}
                        </span>
                      </div>

                      {template.created_at && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Created:</span>
                          <span className="font-medium">
                            {new Date(template.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {template.description && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 line-clamp-3">{template.description}</p>
                      </div>
                    )}

                    {/* Default Values */}
                    {template.default_contract_value && (
                      <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <span className="text-sm text-blue-700">Default Value:</span>
                        <span className="text-sm font-medium text-blue-800">
                          {new Intl.NumberFormat('en-AE', {
                            style: 'currency',
                            currency: template.default_currency || 'AED'
                          }).format(template.default_contract_value)}
                        </span>
                      </div>
                    )}

                    {/* Template Variables */}
                    {template.template_variables && Object.keys(template.template_variables).length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-gray-600">Template Variables:</span>
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(template.template_variables).slice(0, 3).map((variable) => (
                            <Badge key={variable} variant="secondary" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                          {Object.keys(template.template_variables).length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{Object.keys(template.template_variables).length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button variant="outline" size="sm" className="flex-1">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Link href={`/legal/contracts/new?template=${template.id}`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                          Use
                        </Button>
                      </Link>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="flex-1 text-xs">
                        <DocumentDuplicateIcon className="h-3 w-3 mr-1" />
                        Duplicate
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 text-xs">
                        Export
                      </Button>
                      {!template.is_active && (
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <TrashIcon className="h-3 w-3" />
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

      {/* Quick Template Actions */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Popular Template Actions</CardTitle>
          <CardDescription>Quickly access commonly used template operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={`/legal/contracts/new?template=client`}>
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
                <UserGroupIcon className="h-5 w-5 mb-1" />
                <span className="text-sm">Create Client Contract</span>
              </Button>
            </Link>
            <Link href={`/legal/contracts/new?template=employee`}>
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
                <UserGroupIcon className="h-5 w-5 mb-1" />
                <span className="text-sm">Create Employee Contract</span>
              </Button>
            </Link>
            <Link href={`/legal/contracts/new?template=supplier`}>
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
                <BanknotesIcon className="h-5 w-5 mb-1" />
                <span className="text-sm">Create Supplier Agreement</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Template Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Templates</p>
                <p className="text-3xl font-bold text-blue-600">{templates.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Templates</p>
                <p className="text-3xl font-bold text-green-600">
                  {templates.filter(t => t.is_active).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DocumentTextIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Client Templates</p>
                <p className="text-3xl font-bold text-purple-600">
                  {templates.filter(t => t.template_type === 'client_service').length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usage This Month</p>
                <p className="text-3xl font-bold text-orange-600">24</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <DocumentDuplicateIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}