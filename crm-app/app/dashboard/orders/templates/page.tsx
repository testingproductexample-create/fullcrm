'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { OrderTemplate } from '@/types/database';
import { 
  Plus,
  Edit,
  Trash2,
  Copy,
  Search,
  FileText,
  TrendingUp
} from 'lucide-react';

export default function OrderTemplatesPage() {
  const { profile } = useAuth();
  
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OrderTemplate | null>(null);
  
  // Form state
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('');
  const [description, setDescription] = useState('');
  const [orderType, setOrderType] = useState<'bespoke' | 'casual' | 'alteration' | 'repair' | 'special_occasion'>('bespoke');
  const [priorityLevel, setPriorityLevel] = useState<'normal' | 'rush' | 'low'>('normal');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [profile]);

  async function fetchTemplates() {
    if (!profile?.organization_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_templates')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingTemplate(null);
    resetForm();
    setShowModal(true);
  }

  function openEditModal(template: OrderTemplate) {
    setEditingTemplate(template);
    setTemplateName(template.template_name);
    setTemplateType(template.template_type || '');
    setDescription(template.description || '');
    const specs = template.default_specifications || {};
    setOrderType(specs.order_type || 'bespoke');
    setPriorityLevel(specs.priority_level || 'normal');
    setIsActive(template.is_active);
    setShowModal(true);
  }

  function resetForm() {
    setTemplateName('');
    setTemplateType('');
    setDescription('');
    setOrderType('bespoke');
    setPriorityLevel('normal');
    setIsActive(true);
  }

  async function handleSave() {
    if (!profile?.organization_id || !templateName) {
      alert('Please provide a template name');
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        organization_id: profile.organization_id,
        template_name: templateName,
        template_type: templateType,
        description: description,
        default_specifications: {
          order_type: orderType,
          priority_level: priorityLevel
        },
        template_settings: {},
        is_active: isActive,
        created_by: profile.full_name || 'System'
      };

      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('order_templates')
          .update({
            ...templateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('order_templates')
          .insert({
            ...templateData,
            usage_count: 0
          });

        if (error) throw error;
      }

      setShowModal(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('order_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template. Please try again.');
    }
  }

  async function handleDuplicate(template: OrderTemplate) {
    if (!profile?.organization_id) return;

    try {
      const { error } = await supabase
        .from('order_templates')
        .insert({
          organization_id: profile.organization_id,
          template_name: `${template.template_name} (Copy)`,
          template_type: template.template_type,
          description: template.description,
          default_specifications: template.default_specifications,
          template_settings: template.template_settings,
          is_active: template.is_active,
          usage_count: 0,
          created_by: profile.full_name || 'System'
        });

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Failed to duplicate template. Please try again.');
    }
  }

  const filteredTemplates = templates.filter(t => 
    t.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Order Templates</h1>
          <p className="text-body text-neutral-700">Create and manage reusable order templates</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Template
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-50 rounded-lg">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-large font-bold text-neutral-900">{templates.length}</p>
              <p className="text-small text-neutral-700">Total Templates</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-large font-bold text-neutral-900">
                {templates.filter(t => t.is_active).length}
              </p>
              <p className="text-small text-neutral-700">Active Templates</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Copy className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-large font-bold text-neutral-900">
                {templates.reduce((sum, t) => sum + t.usage_count, 0)}
              </p>
              <p className="text-small text-neutral-700">Total Uses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Templates List */}
      <div className="glass-card">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-body text-neutral-700">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <p className="text-body text-neutral-700">No templates found</p>
            <button onClick={openCreateModal} className="btn-primary mt-4">
              Create Your First Template
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left text-small font-semibold text-neutral-900 p-4">Template Name</th>
                  <th className="text-left text-small font-semibold text-neutral-900 p-4">Type</th>
                  <th className="text-left text-small font-semibold text-neutral-900 p-4">Description</th>
                  <th className="text-center text-small font-semibold text-neutral-900 p-4">Usage Count</th>
                  <th className="text-center text-small font-semibold text-neutral-900 p-4">Status</th>
                  <th className="text-right text-small font-semibold text-neutral-900 p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((template) => (
                  <tr key={template.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-4">
                      <p className="font-medium text-neutral-900">{template.template_name}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded text-tiny font-medium bg-blue-100 text-blue-900">
                        {template.template_type || 'General'}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-small text-neutral-700">{template.description || '—'}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-body font-medium">{template.usage_count}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-tiny font-medium ${
                        template.is_active
                          ? 'bg-green-100 text-green-900'
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleDuplicate(template)}
                          className="p-2 hover:bg-neutral-200 rounded transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4 text-neutral-700" />
                        </button>
                        <button
                          onClick={() => openEditModal(template)}
                          className="p-2 hover:bg-blue-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-2 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-h3 font-semibold text-neutral-900 mb-6">
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-small font-medium text-neutral-900 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Standard Bespoke Suit"
                  required
                />
              </div>

              <div>
                <label className="block text-small font-medium text-neutral-900 mb-1">
                  Template Type
                </label>
                <input
                  type="text"
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Suit, Kandura, Dress"
                />
              </div>

              <div>
                <label className="block text-small font-medium text-neutral-900 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Describe this template..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-small font-medium text-neutral-900 mb-1">
                    Default Order Type
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as any)}
                    className="input-field"
                  >
                    <option value="bespoke">Bespoke Suit</option>
                    <option value="casual">Casual Wear</option>
                    <option value="alteration">Alteration</option>
                    <option value="repair">Repair</option>
                    <option value="special_occasion">Special Occasion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-small font-medium text-neutral-900 mb-1">
                    Default Priority
                  </label>
                  <select
                    value={priorityLevel}
                    onChange={(e) => setPriorityLevel(e.target.value as any)}
                    className="input-field"
                  >
                    <option value="normal">Normal</option>
                    <option value="rush">Rush</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-small text-neutral-900">
                  Template is active
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex-1"
                disabled={saving || !templateName}
              >
                {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
