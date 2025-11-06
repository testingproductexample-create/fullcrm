'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { OrderWorkflow } from '@/types/database';
import { 
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface WorkflowStage {
  status: string;
  label: string;
  order: number;
  progress: number;
  sub_statuses: string[];
}

export default function WorkflowTemplatesPage() {
  const { profile } = useAuth();
  
  const [workflows, setWorkflows] = useState<OrderWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<OrderWorkflow | null>(null);
  
  // Form state
  const [workflowName, setWorkflowName] = useState('');
  const [workflowType, setWorkflowType] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [autoNotify, setAutoNotify] = useState(true);
  const [autoProgress, setAutoProgress] = useState(true);
  const [delayThreshold, setDelayThreshold] = useState(48);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, [profile]);

  async function fetchWorkflows() {
    if (!profile?.organization_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_workflows')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingWorkflow(null);
    resetForm();
    setShowModal(true);
  }

  function openEditModal(workflow: OrderWorkflow) {
    setEditingWorkflow(workflow);
    setWorkflowName(workflow.workflow_name);
    setWorkflowType(workflow.workflow_type);
    setDescription(workflow.description || '');
    
    // Parse status definitions
    if (Array.isArray(workflow.status_definitions)) {
      setStages(workflow.status_definitions);
    } else {
      setStages([]);
    }

    // Parse automation rules
    const rules = workflow.automation_rules || {};
    setAutoNotify(rules.auto_notify !== false);
    setAutoProgress(rules.auto_progress !== false);
    setDelayThreshold(rules.delay_alerts?.threshold_hours || 48);

    setShowModal(true);
  }

  function resetForm() {
    setWorkflowName('');
    setWorkflowType('');
    setDescription('');
    setStages([
      { status: 'new', label: 'New', order: 1, progress: 0, sub_statuses: [] },
      { status: 'in_progress', label: 'In Progress', order: 2, progress: 50, sub_statuses: [] },
      { status: 'completed', label: 'Completed', order: 3, progress: 100, sub_statuses: [] }
    ]);
    setAutoNotify(true);
    setAutoProgress(true);
    setDelayThreshold(48);
  }

  function addStage() {
    const newOrder = stages.length + 1;
    const newProgress = Math.round((newOrder / (stages.length + 1)) * 100);
    
    setStages([...stages, {
      status: `stage_${newOrder}`,
      label: `Stage ${newOrder}`,
      order: newOrder,
      progress: newProgress,
      sub_statuses: []
    }]);
  }

  function removeStage(index: number) {
    if (stages.length <= 2) {
      alert('Workflow must have at least 2 stages');
      return;
    }
    setStages(stages.filter((_, i) => i !== index).map((stage, i) => ({
      ...stage,
      order: i + 1
    })));
  }

  function moveStage(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;

    const newStages = [...stages];
    [newStages[index], newStages[newIndex]] = [newStages[newIndex], newStages[index]];
    
    // Update order numbers
    setStages(newStages.map((stage, i) => ({ ...stage, order: i + 1 })));
  }

  function updateStage(index: number, field: keyof WorkflowStage, value: any) {
    const updated = [...stages];
    updated[index] = { ...updated[index], [field]: value };
    setStages(updated);
  }

  function addSubStatus(stageIndex: number) {
    const updated = [...stages];
    updated[stageIndex].sub_statuses.push('');
    setStages(updated);
  }

  function updateSubStatus(stageIndex: number, subIndex: number, value: string) {
    const updated = [...stages];
    updated[stageIndex].sub_statuses[subIndex] = value;
    setStages(updated);
  }

  function removeSubStatus(stageIndex: number, subIndex: number) {
    const updated = [...stages];
    updated[stageIndex].sub_statuses.splice(subIndex, 1);
    setStages(updated);
  }

  async function handleSave() {
    if (!profile?.organization_id || !workflowName) {
      alert('Please provide a workflow name');
      return;
    }

    if (stages.length < 2) {
      alert('Workflow must have at least 2 stages');
      return;
    }

    setSaving(true);
    try {
      const workflowData = {
        organization_id: profile.organization_id,
        workflow_name: workflowName,
        workflow_type: workflowType,
        description: description,
        status_definitions: stages,
        automation_rules: {
          auto_notify: autoNotify,
          auto_progress: autoProgress,
          delay_alerts: {
            enabled: true,
            threshold_hours: delayThreshold
          }
        },
        is_active: true
      };

      if (editingWorkflow) {
        const { error } = await supabase
          .from('order_workflows')
          .update({
            ...workflowData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingWorkflow.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('order_workflows')
          .insert(workflowData);

        if (error) throw error;
      }

      setShowModal(false);
      resetForm();
      fetchWorkflows();
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this workflow template? This will not affect existing orders using this workflow.')) return;

    try {
      const { error } = await supabase
        .from('order_workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow. It may be in use by existing orders.');
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('order_workflows')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchWorkflows();
    } catch (error) {
      console.error('Error toggling workflow:', error);
      alert('Failed to update workflow status');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Workflow Templates</h1>
          <p className="text-body text-neutral-700">Create and manage workflow templates for different order types</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/workflow/manage" className="btn-secondary">
            Back to Management
          </Link>
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Template
          </button>
        </div>
      </div>

      {/* Workflows List */}
      <div className="glass-card">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-body text-neutral-700">Loading workflows...</p>
          </div>
        ) : workflows.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <p className="text-body text-neutral-700 mb-2">No workflow templates found</p>
            <button onClick={openCreateModal} className="btn-primary mt-4">
              Create Your First Workflow Template
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="p-6 hover:bg-neutral-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-large font-semibold text-neutral-900">{workflow.workflow_name}</h3>
                      <span className={`px-2 py-1 rounded text-tiny font-medium ${
                        workflow.is_active
                          ? 'bg-green-100 text-green-900'
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        {workflow.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-tiny font-medium">
                        {workflow.workflow_type}
                      </span>
                    </div>
                    {workflow.description && (
                      <p className="text-small text-neutral-700 mb-3">{workflow.description}</p>
                    )}
                    <p className="text-small text-neutral-600">
                      {Array.isArray(workflow.status_definitions) ? workflow.status_definitions.length : 0} stages
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(workflow.id, workflow.is_active)}
                      className={`px-3 py-2 rounded text-small font-medium transition-colors ${
                        workflow.is_active
                          ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-900'
                          : 'bg-green-100 hover:bg-green-200 text-green-900'
                      }`}
                    >
                      {workflow.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => openEditModal(workflow)}
                      className="p-2 hover:bg-blue-100 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(workflow.id)}
                      className="p-2 hover:bg-red-100 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex justify-between items-center">
              <h3 className="text-h3 font-semibold text-neutral-900">
                {editingWorkflow ? 'Edit Workflow Template' : 'Create Workflow Template'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-neutral-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-small font-medium text-neutral-900 mb-1">
                    Workflow Name *
                  </label>
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="input-field"
                    placeholder="e.g., Standard Bespoke Suit Workflow"
                    required
                  />
                </div>

                <div>
                  <label className="block text-small font-medium text-neutral-900 mb-1">
                    Workflow Type
                  </label>
                  <input
                    type="text"
                    value={workflowType}
                    onChange={(e) => setWorkflowType(e.target.value)}
                    className="input-field"
                    placeholder="e.g., bespoke, alteration"
                  />
                </div>
              </div>

              <div>
                <label className="block text-small font-medium text-neutral-900 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  rows={2}
                  placeholder="Describe this workflow..."
                />
              </div>

              {/* Workflow Stages */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-neutral-900">Workflow Stages</h4>
                  <button onClick={addStage} className="btn-secondary btn-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Stage
                  </button>
                </div>

                <div className="space-y-3">
                  {stages.map((stage, index) => (
                    <div key={index} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-medium text-neutral-900">Stage {index + 1}</h5>
                        <div className="flex gap-2">
                          <button
                            onClick={() => moveStage(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-neutral-100 rounded disabled:opacity-30"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveStage(index, 'down')}
                            disabled={index === stages.length - 1}
                            className="p-1 hover:bg-neutral-100 rounded disabled:opacity-30"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeStage(index)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-tiny text-neutral-700 mb-1">Status Code *</label>
                          <input
                            type="text"
                            value={stage.status}
                            onChange={(e) => updateStage(index, 'status', e.target.value)}
                            className="input-field py-1 text-small"
                            placeholder="e.g., cutting"
                          />
                        </div>

                        <div>
                          <label className="block text-tiny text-neutral-700 mb-1">Label *</label>
                          <input
                            type="text"
                            value={stage.label}
                            onChange={(e) => updateStage(index, 'label', e.target.value)}
                            className="input-field py-1 text-small"
                            placeholder="e.g., Cutting"
                          />
                        </div>

                        <div>
                          <label className="block text-tiny text-neutral-700 mb-1">Progress %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={stage.progress}
                            onChange={(e) => updateStage(index, 'progress', parseInt(e.target.value) || 0)}
                            className="input-field py-1 text-small"
                          />
                        </div>

                        <div>
                          <label className="block text-tiny text-neutral-700 mb-1">Sub-statuses</label>
                          <button
                            onClick={() => addSubStatus(index)}
                            className="text-tiny text-primary-600 hover:underline"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      {stage.sub_statuses.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {stage.sub_statuses.map((sub, subIndex) => (
                            <div key={subIndex} className="flex gap-2">
                              <input
                                type="text"
                                value={sub}
                                onChange={(e) => updateSubStatus(index, subIndex, e.target.value)}
                                className="input-field py-1 text-small flex-1"
                                placeholder="e.g., pattern_creation"
                              />
                              <button
                                onClick={() => removeSubStatus(index, subIndex)}
                                className="p-1 hover:bg-red-100 rounded text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Automation Settings */}
              <div className="border border-neutral-200 rounded-lg p-4">
                <h4 className="font-semibold text-neutral-900 mb-4">Automation Settings</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoNotify"
                      checked={autoNotify}
                      onChange={(e) => setAutoNotify(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="autoNotify" className="text-small text-neutral-900">
                      Auto-notify customers on status changes
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoProgress"
                      checked={autoProgress}
                      onChange={(e) => setAutoProgress(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="autoProgress" className="text-small text-neutral-900">
                      Auto-progress through stages when criteria met
                    </label>
                  </div>

                  <div className="flex items-center gap-4">
                    <label htmlFor="delayThreshold" className="text-small text-neutral-900">
                      Delay alert threshold (hours):
                    </label>
                    <input
                      type="number"
                      id="delayThreshold"
                      min="1"
                      value={delayThreshold}
                      onChange={(e) => setDelayThreshold(parseInt(e.target.value) || 48)}
                      className="input-field py-1 w-24"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex items-center gap-2"
                disabled={saving || !workflowName || stages.length < 2}
              >
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {editingWorkflow ? 'Update Template' : 'Create Template'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
