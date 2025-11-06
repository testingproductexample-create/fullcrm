'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  FileText,
  Plus,
  Edit,
  Copy,
  Trash2,
  Search,
  Filter,
  Tag,
  Languages,
  MessageSquare,
  Mail,
  Smartphone,
  MessageCircle,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Download,
  Upload,
  Star,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';

interface Template {
  id: string;
  template_name: string;
  template_type: string;
  language: string;
  subject: string;
  content: string;
  variables: string[];
  is_active: boolean;
  category: string;
  usage_count: number;
  last_used: string;
  created_at: string;
}

interface TemplateStats {
  totalTemplates: number;
  activeTemplates: number;
  totalUsage: number;
  mostUsedTemplate: string;
  languagesSupported: number;
  categoriesCount: number;
}

interface TemplateCategory {
  name: string;
  count: number;
  color: string;
}

export default function MessageTemplatesLibrary() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [categories] = useState<TemplateCategory[]>([
    { name: 'orders', count: 0, color: 'bg-blue-500' },
    { name: 'appointments', count: 0, color: 'bg-emerald-500' },
    { name: 'payments', count: 0, color: 'bg-purple-500' },
    { name: 'measurements', count: 0, color: 'bg-orange-500' },
    { name: 'welcome', count: 0, color: 'bg-pink-500' },
    { name: 'reminders', count: 0, color: 'bg-amber-500' },
    { name: 'marketing', count: 0, color: 'bg-indigo-500' },
    { name: 'general', count: 0, color: 'bg-gray-500' }
  ]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    template_type: 'transactional',
    language: 'ar',
    subject: '',
    content: '',
    category: 'general',
    variables: [] as string[]
  });

  useEffect(() => {
    if (user?.organization_id) {
      fetchTemplates();
    }
  }, [user?.organization_id]);

  const fetchTemplates = async () => {
    try {
      const organizationId = user?.organization_id;
      if (!organizationId) return;

      // Fetch message templates
      const { data: templatesData } = await supabase
        .from('message_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      // Process templates data and add mock usage data
      const processedTemplates: Template[] = templatesData?.map((template, index) => ({
        id: template.id,
        template_name: template.template_name,
        template_type: template.template_type,
        language: template.language || 'ar',
        subject: template.subject || '',
        content: template.content,
        variables: template.variables || [],
        is_active: template.is_active ?? true,
        category: template.category || 'general',
        usage_count: Math.floor(Math.random() * 50) + 1, // Mock usage count
        last_used: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 30 days
        created_at: template.created_at
      })) || [];

      setTemplates(processedTemplates);

      // Calculate stats
      const totalTemplates = processedTemplates.length;
      const activeTemplates = processedTemplates.filter(t => t.is_active).length;
      const totalUsage = processedTemplates.reduce((sum, t) => sum + t.usage_count, 0);
      const mostUsedTemplate = processedTemplates.reduce((prev, current) => 
        prev.usage_count > current.usage_count ? prev : current
      )?.template_name || 'N/A';
      const languagesSupported = new Set(processedTemplates.map(t => t.language)).size;
      const categoriesCount = new Set(processedTemplates.map(t => t.category)).size;

      setStats({
        totalTemplates,
        activeTemplates,
        totalUsage,
        mostUsedTemplate,
        languagesSupported,
        categoriesCount
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .insert([
          {
            organization_id: user?.organization_id,
            template_name: newTemplate.template_name,
            template_type: newTemplate.template_type,
            language: newTemplate.language,
            subject: newTemplate.subject || null,
            content: newTemplate.content,
            variables: newTemplate.variables,
            is_active: true,
            category: newTemplate.category
          }
        ]);

      if (error) throw error;

      setShowCreateModal(false);
      setNewTemplate({
        template_name: '',
        template_type: 'transactional',
        language: 'ar',
        subject: '',
        content: '',
        category: 'general',
        variables: []
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const updateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const { error } = await supabase
        .from('message_templates')
        .update({
          template_name: newTemplate.template_name,
          template_type: newTemplate.template_type,
          language: newTemplate.language,
          subject: newTemplate.subject || null,
          content: newTemplate.content,
          category: newTemplate.category,
          variables: newTemplate.variables
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;

      setEditingTemplate(null);
      setNewTemplate({
        template_name: '',
        template_type: 'transactional',
        language: 'ar',
        subject: '',
        content: '',
        category: 'general',
        variables: []
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  const toggleTemplateStatus = async (templateId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .update({ is_active: !currentStatus })
        .eq('id', templateId);

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template status:', error);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const duplicateTemplate = async (template: Template) => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .insert([
          {
            organization_id: user?.organization_id,
            template_name: `${template.template_name} (Copy)`,
            template_type: template.template_type,
            language: template.language,
            subject: template.subject,
            content: template.content,
            variables: template.variables,
            is_active: true,
            category: template.category
          }
        ]);

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const extractVariables = (content: string) => {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  const handleContentChange = (content: string) => {
    setNewTemplate({
      ...newTemplate,
      content,
      variables: extractVariables(content)
    });
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'transactional': return Mail;
      case 'marketing': return MessageSquare;
      case 'reminder': return Clock;
      case 'notification': return MessageCircle;
      default: return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.name === category);
    return cat?.color || 'bg-gray-500';
  };

  const filteredTemplates = templates.filter(template => {
    const categoryMatch = selectedCategory === 'all' || template.category === selectedCategory;
    const languageMatch = selectedLanguage === 'all' || template.language === selectedLanguage;
    const typeMatch = selectedType === 'all' || template.template_type === selectedType;
    const searchMatch = searchTerm === '' || 
      template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && languageMatch && typeMatch && searchMatch;
  });

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInDays = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading message templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Message Templates Library</h1>
                <p className="text-gray-600">Create and manage reusable message templates</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchTemplates()}
                className="bg-white/60 backdrop-blur-sm border border-white/20 text-gray-700 px-4 py-2 rounded-xl hover:bg-white/80 transition-all duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-orange-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-orange-700 transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Template
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Templates</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalTemplates}</p>
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                  <FileText className="w-3 h-3" />
                  All templates
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Templates</p>
                <p className="text-2xl font-bold text-emerald-600">{stats?.activeTemplates}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  Ready to use
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Usage</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.totalUsage}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  Times used
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Languages</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.languagesSupported}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Languages className="w-3 h-3" />
                  Supported
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Languages className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Templates List */}
          <div className="lg:col-span-3">
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              {/* Filters */}
              <div className="mb-6 flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Languages</option>
                  <option value="ar">Arabic</option>
                  <option value="en">English</option>
                  <option value="bilingual">Bilingual</option>
                </select>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="transactional">Transactional</option>
                  <option value="marketing">Marketing</option>
                  <option value="reminder">Reminder</option>
                  <option value="notification">Notification</option>
                </select>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTemplates.map((template) => {
                  const ChannelIcon = getChannelIcon(template.template_type);
                  return (
                    <div key={template.id} className="bg-white/50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ChannelIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{template.template_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`w-3 h-3 rounded-full ${getCategoryColor(template.category)}`}></span>
                              <span className="text-sm text-gray-600 capitalize">{template.category}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingTemplate(template);
                              setNewTemplate({
                                template_name: template.template_name,
                                template_type: template.template_type,
                                language: template.language,
                                subject: template.subject,
                                content: template.content,
                                category: template.category,
                                variables: template.variables
                              });
                            }}
                            className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => duplicateTemplate(template)}
                            className="p-1 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleTemplateStatus(template.id, template.is_active)}
                            className={`p-1 rounded transition-colors ${
                              template.is_active 
                                ? 'text-emerald-600 hover:bg-emerald-50' 
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            {template.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteTemplate(template.id)}
                            className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {template.subject && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700">Subject:</p>
                          <p className="text-sm text-gray-600 truncate">{template.subject}</p>
                        </div>
                      )}

                      <div className="mb-4">
                        <p className="text-sm text-gray-900 line-clamp-3">{template.content}</p>
                      </div>

                      {template.variables.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-600 mb-2">Variables:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.slice(0, 3).map((variable, index) => (
                              <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {variable}
                              </span>
                            ))}
                            {template.variables.length > 3 && (
                              <span className="text-xs text-gray-500">+{template.variables.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {template.usage_count} uses
                          </span>
                          <span className="flex items-center gap-1">
                            <Languages className="w-3 h-3" />
                            {template.language.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Last used {formatTimeAgo(template.last_used)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No templates found</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Categories */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-3">
                {categories.map((category) => {
                  const categoryTemplates = templates.filter(t => t.category === category.name);
                  return (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                        <span className="text-sm text-gray-700 capitalize">{category.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{categoryTemplates.length}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Most Popular */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Popular</h3>
              <div className="space-y-3">
                {templates
                  .sort((a, b) => b.usage_count - a.usage_count)
                  .slice(0, 3)
                  .map((template, index) => (
                    <div key={template.id} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-600' :
                        index === 1 ? 'bg-gray-100 text-gray-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{template.template_name}</p>
                        <p className="text-xs text-gray-600">{template.usage_count} uses</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Import Templates</p>
                    <p className="text-xs text-gray-600">Upload from file</p>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3">
                  <Download className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-gray-900">Export Templates</p>
                    <p className="text-xs text-gray-600">Download as CSV</p>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3">
                  <Star className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Template Analytics</p>
                    <p className="text-xs text-gray-600">View performance</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Template Modal */}
      {(showCreateModal || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={newTemplate.template_name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, template_name: e.target.value })}
                    placeholder="Template name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={newTemplate.template_type}
                    onChange={(e) => setNewTemplate({ ...newTemplate, template_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="transactional">Transactional</option>
                    <option value="marketing">Marketing</option>
                    <option value="reminder">Reminder</option>
                    <option value="notification">Notification</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select
                    value={newTemplate.language}
                    onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="ar">Arabic</option>
                    <option value="en">English</option>
                    <option value="bilingual">Bilingual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {categories.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject (Optional for SMS/WhatsApp)</label>
                <input
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  placeholder="Email subject line..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Enter template content... Use {{variable_name}} for dynamic content"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use curly braces for variables: {{customer_name}}, {{order_number}}, etc.
                </p>
              </div>
              {newTemplate.variables.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Detected Variables</label>
                  <div className="flex flex-wrap gap-2">
                    {newTemplate.variables.map((variable, index) => (
                      <span key={index} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTemplate(null);
                  setNewTemplate({
                    template_name: '',
                    template_type: 'transactional',
                    language: 'ar',
                    subject: '',
                    content: '',
                    category: 'general',
                    variables: []
                  });
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingTemplate ? updateTemplate : createTemplate}
                disabled={!newTemplate.template_name || !newTemplate.content}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}