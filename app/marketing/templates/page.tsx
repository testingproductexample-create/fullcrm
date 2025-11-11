'use client';

/**
 * Email Templates Management
 * Create, design, and manage email templates for campaigns
 */

import { useState } from 'react';
import { 
  useEmailTemplates, 
  useCreateEmailTemplate, 
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  useEmailTemplateWithMetrics 
} from '@/hooks/useMarketing';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Mail, Edit, Trash2, Copy, Eye, Code, Palette, 
  BarChart3, Users, TrendingUp, Search, Filter
} from 'lucide-react';
import { TemplateType } from '@/types/marketing';

export default function EmailTemplatesPage() {
  const [selectedTemplateType, setSelectedTemplateType] = useState<TemplateType | ''>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: templates, isLoading, refetch } = useEmailTemplates(selectedTemplateType || undefined);
  const createMutation = useCreateEmailTemplate();
  const updateMutation = useUpdateEmailTemplate();
  const deleteMutation = useDeleteEmailTemplate();

  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    template_code: '',
    template_type: 'campaign' as TemplateType,
    subject_line: '',
    html_content: '',
    text_content: '',
    preview_text: '',
    primary_color: '#3B82F6',
    secondary_color: '#EF4444',
  });

  // Filter templates
  const filteredTemplates = templates?.filter(template => 
    template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject_line.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Template type badge
  const TypeBadge = ({ type }: { type: TemplateType }) => {
    const typeConfig = {
      campaign: { label: 'Campaign', className: 'bg-blue-100 text-blue-800' },
      transactional: { label: 'Transactional', className: 'bg-green-100 text-green-800' },
      automated: { label: 'Automated', className: 'bg-purple-100 text-purple-800' },
      newsletter: { label: 'Newsletter', className: 'bg-orange-100 text-orange-800' }
    };
    
    const config = typeConfig[type];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleCreateTemplate = async () => {
    try {
      await createMutation.mutateAsync(newTemplate);
      setIsCreateModalOpen(false);
      setNewTemplate({
        template_name: '',
        template_code: '',
        template_type: 'campaign',
        subject_line: '',
        html_content: '',
        text_content: '',
        preview_text: '',
        primary_color: '#3B82F6',
        secondary_color: '#EF4444',
      });
      refetch();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteMutation.mutateAsync(templateId);
        refetch();
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Email Templates</h1>
          <p className="text-slate-600 mt-1">Design and manage email templates for campaigns</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search Templates</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="search"
                placeholder="Search by name or subject..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="type">Template Type</Label>
            <Select 
              value={selectedTemplateType} 
              onValueChange={(value) => setSelectedTemplateType(value as TemplateType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="campaign">Campaign</SelectItem>
                <SelectItem value="transactional">Transactional</SelectItem>
                <SelectItem value="automated">Automated</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Template Preview */}
            <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-20"
                style={{ backgroundColor: template.primary_color }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Mail className="h-16 w-16 text-slate-400" />
              </div>
              <div className="absolute top-3 right-3">
                <TypeBadge type={template.template_type} />
              </div>
            </div>

            {/* Template Info */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-900 truncate">
                  {template.template_name}
                </h3>
                <div className="flex items-center space-x-1">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                {template.subject_line || 'No subject line'}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                <span>Code: {template.template_code}</span>
                <span>Used {template.use_count || 0} times</span>
              </div>

              {/* Template Stats */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <BarChart3 className="h-3 w-3 text-blue-600 mr-1" />
                  </div>
                  <p className="text-xs text-slate-600">Open Rate</p>
                  <p className="text-sm font-semibold">0%</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  </div>
                  <p className="text-xs text-slate-600">Click Rate</p>
                  <p className="text-sm font-semibold">0%</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-3 w-3 text-purple-600 mr-1" />
                  </div>
                  <p className="text-xs text-slate-600">Sent</p>
                  <p className="text-sm font-semibold">0</p>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              <Mail className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No templates found</h3>
              <p className="text-slate-600 mb-6">Create your first email template to get started.</p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Create New Template</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template_name">Template Name</Label>
                    <Input
                      id="template_name"
                      value={newTemplate.template_name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, template_name: e.target.value })}
                      placeholder="Welcome Email Template"
                    />
                  </div>

                  <div>
                    <Label htmlFor="template_code">Template Code</Label>
                    <Input
                      id="template_code"
                      value={newTemplate.template_code}
                      onChange={(e) => setNewTemplate({ ...newTemplate, template_code: e.target.value })}
                      placeholder="WELCOME_001"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="template_type">Template Type</Label>
                  <Select 
                    value={newTemplate.template_type} 
                    onValueChange={(value) => setNewTemplate({ ...newTemplate, template_type: value as TemplateType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campaign">Campaign</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="automated">Automated</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject_line">Subject Line</Label>
                  <Input
                    id="subject_line"
                    value={newTemplate.subject_line}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject_line: e.target.value })}
                    placeholder="Welcome to our platform!"
                  />
                </div>

                <div>
                  <Label htmlFor="preview_text">Preview Text</Label>
                  <Input
                    id="preview_text"
                    value={newTemplate.preview_text}
                    onChange={(e) => setNewTemplate({ ...newTemplate, preview_text: e.target.value })}
                    placeholder="Thank you for joining us..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="primary_color"
                        type="color"
                        value={newTemplate.primary_color}
                        onChange={(e) => setNewTemplate({ ...newTemplate, primary_color: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={newTemplate.primary_color}
                        onChange={(e) => setNewTemplate({ ...newTemplate, primary_color: e.target.value })}
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="secondary_color"
                        type="color"
                        value={newTemplate.secondary_color}
                        onChange={(e) => setNewTemplate({ ...newTemplate, secondary_color: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={newTemplate.secondary_color}
                        onChange={(e) => setNewTemplate({ ...newTemplate, secondary_color: e.target.value })}
                        placeholder="#EF4444"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="html_content">HTML Content</Label>
                  <Textarea
                    id="html_content"
                    value={newTemplate.html_content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, html_content: e.target.value })}
                    placeholder="<html>...</html>"
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="text_content">Text Content</Label>
                  <Textarea
                    id="text_content"
                    value={newTemplate.text_content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, text_content: e.target.value })}
                    placeholder="Plain text version of your email..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTemplate}
                  disabled={createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}