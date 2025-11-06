import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommission, CommissionStructure } from '../context/CommissionContext';
import { formatCurrency } from '../lib/utils';

interface TemplateVersion {
  id: string;
  version: number;
  name: string;
  createdAt: string;
  changes: string;
  isActive: boolean;
}

interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'real-estate' | 'insurance' | 'retail' | 'custom';
  icon: string;
  structure: Omit<CommissionStructure, 'id'>;
}

const Templates: React.FC = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useCommission();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPresetLibrary, setShowPresetLibrary] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CommissionStructure | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null);
  const [templateVersions, setTemplateVersions] = useState<TemplateVersion[]>([]);
  const [testAmount, setTestAmount] = useState(50000);
  const [testResult, setTestResult] = useState<number | null>(null);
  const [newVersionChanges, setNewVersionChanges] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset Templates Library
  const presetTemplates: PresetTemplate[] = [
    {
      id: 'preset-1',
      name: 'Standard Sales Commission',
      description: 'Standard 5% commission for sales team',
      category: 'sales',
      icon: '📊',
      structure: {
        name: 'Standard Sales',
        type: 'percentage',
        baseRate: 5,
        bonusThreshold: 100000,
        bonusRate: 2,
        isActive: true
      }
    },
    {
      id: 'preset-2',
      name: 'Real Estate Tiered',
      description: 'Progressive commission for real estate agents',
      category: 'real-estate',
      icon: '🏠',
      structure: {
        name: 'Real Estate Progressive',
        type: 'tiered',
        baseRate: 3,
        tierRates: [
          { min: 0, max: 500000, rate: 3 },
          { min: 500000, max: 1000000, rate: 4 },
          { min: 1000000, max: Infinity, rate: 5 }
        ],
        bonusThreshold: 1500000,
        bonusRate: 1.5,
        isActive: true
      }
    },
    {
      id: 'preset-3',
      name: 'Insurance Commission',
      description: 'Variable rate for insurance sales',
      category: 'insurance',
      icon: '🛡️',
      structure: {
        name: 'Insurance Sales',
        type: 'tiered',
        baseRate: 10,
        tierRates: [
          { min: 0, max: 25000, rate: 8 },
          { min: 25000, max: 50000, rate: 10 },
          { min: 50000, max: 100000, rate: 12 },
          { min: 100000, max: Infinity, rate: 15 }
        ],
        bonusThreshold: 75000,
        bonusRate: 3,
        isActive: true
      }
    },
    {
      id: 'preset-4',
      name: 'Retail Performance',
      description: 'Performance-based for retail sales',
      category: 'retail',
      icon: '🛍️',
      structure: {
        name: 'Retail Performance',
        type: 'percentage',
        baseRate: 3,
        bonusThreshold: 50000,
        bonusRate: 1.5,
        isActive: true
      }
    },
    {
      id: 'preset-5',
      name: 'Fixed Rate Structure',
      description: 'Fixed commission per unit sold',
      category: 'custom',
      icon: '💰',
      structure: {
        name: 'Fixed Rate',
        type: 'fixed',
        baseRate: 500,
        bonusThreshold: 1000,
        bonusRate: 750,
        isActive: true
      }
    }
  ];

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'percentage' as 'percentage' | 'tiered' | 'fixed',
    baseRate: 5,
    tierRates: [
      { min: 0, max: 50000, rate: 3 },
      { min: 50000, max: 100000, rate: 5 },
      { min: 100000, max: Infinity, rate: 7 }
    ],
    bonusThreshold: 100000,
    bonusRate: 2,
    isActive: true
  });

  const createTemplate = () => {
    const template: CommissionStructure = {
      id: Date.now().toString(),
      name: newTemplate.name,
      type: newTemplate.type,
      baseRate: newTemplate.baseRate,
      tierRates: newTemplate.type === 'tiered' ? newTemplate.tierRates : undefined,
      bonusThreshold: newTemplate.bonusThreshold,
      bonusRate: newTemplate.bonusRate,
      isActive: newTemplate.isActive
    };

    dispatch({ type: 'ADD_COMMISSION_STRUCTURE', payload: template });
    
    // Create initial version
    const version: TemplateVersion = {
      id: Date.now().toString(),
      version: 1,
      name: newTemplate.name,
      createdAt: new Date().toISOString(),
      changes: 'Initial version',
      isActive: true
    };
    setTemplateVersions(prev => [...prev, version]);
    
    setShowCreateForm(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTemplate({
      name: '',
      type: 'percentage',
      baseRate: 5,
      tierRates: [
        { min: 0, max: 50000, rate: 3 },
        { min: 50000, max: 100000, rate: 5 },
        { min: 100000, max: Infinity, rate: 7 }
      ],
      bonusThreshold: 100000,
      bonusRate: 2,
      isActive: true
    });
  };

  const cloneTemplate = (template: CommissionStructure) => {
    const clonedTemplate: CommissionStructure = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      isActive: false
    };

    dispatch({ type: 'ADD_COMMISSION_STRUCTURE', payload: clonedTemplate });
  };

  const createNewVersion = () => {
    if (!selectedTemplate || !newVersionChanges) return;

    const newVersion: TemplateVersion = {
      id: Date.now().toString(),
      version: templateVersions.length + 1,
      name: selectedTemplate.name,
      createdAt: new Date().toISOString(),
      changes: newVersionChanges,
      isActive: true
    };

    setTemplateVersions(prev => [...prev, newVersion]);
    setNewVersionChanges('');
  };

  const testTemplate = () => {
    if (!newTemplate.name) return;

    let commission = 0;
    
    if (newTemplate.type === 'percentage' || newTemplate.type === 'fixed') {
      commission = (testAmount * newTemplate.baseRate) / 100;
    } else if (newTemplate.type === 'tiered') {
      for (const tier of newTemplate.tierRates) {
        if (testAmount >= tier.min && testAmount < tier.max) {
          commission = (testAmount * tier.rate) / 100;
          break;
        }
      }
    }

    if (testAmount > newTemplate.bonusThreshold) {
      commission += (testAmount * newTemplate.bonusRate) / 100;
    }

    setTestResult(commission);
  };

  const exportTemplates = () => {
    const exportData = {
      templates: state.commissionStructures,
      versions: templateVersions,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `commission-templates-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importTemplates = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (importData.templates) {
          importData.templates.forEach((template: CommissionStructure) => {
            dispatch({ type: 'ADD_COMMISSION_STRUCTURE', payload: template });
          });
        }
        
        if (importData.versions) {
          setTemplateVersions(prev => [...prev, ...importData.versions]);
        }
        
        setShowImportExport(false);
        alert('Templates imported successfully!');
      } catch (error) {
        alert('Error importing templates. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const addTier = () => {
    setNewTemplate({
      ...newTemplate,
      tierRates: [
        ...newTemplate.tierRates,
        { min: newTemplate.tierRates[newTemplate.tierRates.length - 1].max, max: Infinity, rate: 5 }
      ]
    });
  };

  const updateTier = (index: number, field: string, value: number) => {
    const updatedTiers = [...newTemplate.tierRates];
    if (field === 'min' && index > 0) {
      updatedTiers[index - 1].max = value;
    }
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    setNewTemplate({ ...newTemplate, tierRates: updatedTiers });
  };

  const removeTier = (index: number) => {
    if (newTemplate.tierRates.length > 1) {
      setNewTemplate({
        ...newTemplate,
        tierRates: newTemplate.tierRates.filter((_, i) => i !== index)
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return '📊';
      case 'tiered': return '🏗️';
      case 'fixed': return '💰';
      default: return '⚙️';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales': return 'bg-blue-100 text-blue-800';
      case 'real-estate': return 'bg-green-100 text-green-800';
      case 'insurance': return 'bg-purple-100 text-purple-800';
      case 'retail': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{t('templates.title')}</h2>
            <p className="text-sm text-gray-600 mt-1">Manage commission structure templates with versioning</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowPresetLibrary(true)}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              📚 Preset Library
            </button>
            <button
              onClick={() => setShowImportExport(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              📤 Import/Export
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              + Create Template
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-4 shadow-lg">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setShowVersionHistory(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-white/30 hover:bg-white/40 rounded-lg transition-colors"
          >
            <span>📋</span>
            <span className="text-sm">Version History</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-2 bg-white/30 hover:bg-white/40 rounded-lg transition-colors">
            <span>🔄</span>
            <span className="text-sm">Bulk Operations</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-2 bg-white/30 hover:bg-white/40 rounded-lg transition-colors">
            <span>📊</span>
            <span className="text-sm">Analytics</span>
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.commissionStructures.map((template) => (
          <div key={template.id} className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getTypeIcon(template.type)}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{template.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{template.type} Structure</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="relative group">
                  <button className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm">
                    ⋮
                  </button>
                  <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg py-2 z-10 hidden group-hover:block min-w-[120px]">
                    <button
                      onClick={() => cloneTemplate(template)}
                      className="w-full px-3 py-1 text-left hover:bg-gray-100 text-sm"
                    >
                      📋 Clone
                    </button>
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="w-full px-3 py-1 text-left hover:bg-gray-100 text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setSelectedVersion(null)}
                      className="w-full px-3 py-1 text-left hover:bg-gray-100 text-sm"
                    >
                      📄 View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white/30 rounded-lg p-3">
                <p className="text-sm text-gray-600">Base Rate</p>
                <p className="text-lg font-semibold text-gray-800">{template.baseRate}%</p>
              </div>

              {template.tierRates && (
                <div className="bg-white/30 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-2">Tier Rates</p>
                  <div className="space-y-1">
                    {template.tierRates.map((tier, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {formatCurrency(tier.min)} - {tier.max === Infinity ? '∞' : formatCurrency(tier.max)}
                        </span>
                        <span className="font-medium text-gray-800">{tier.rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {template.bonusThreshold && (
                <div className="bg-white/30 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Bonus</p>
                  <p className="text-sm text-gray-800">
                    {template.bonusRate}% on sales above {formatCurrency(template.bonusThreshold)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setSelectedTemplate(template)}
                className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
              >
                {t('templates.edit')}
              </button>
              <button className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm">
                {t('templates.useTemplate')}
              </button>
            </div>
          </div>
        ))}

        {/* Create New Template Card */}
        <div 
          onClick={() => setShowCreateForm(true)}
          className="backdrop-blur-xl bg-white/10 border-2 border-dashed border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[300px]"
        >
          <div className="text-4xl mb-4">➕</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Create New Template</h3>
          <p className="text-sm text-gray-500 text-center">Design a custom commission structure</p>
        </div>
      </div>

      {/* Create Template Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/90 rounded-2xl border border-white/30 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Create New Template</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                      <input
                        type="text"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter template name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Structure Type</label>
                      <select
                        value={newTemplate.type}
                        onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="percentage">Percentage Based</option>
                        <option value="tiered">Tiered Structure</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                  </div>

                  {/* Base Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newTemplate.baseRate}
                      onChange={(e) => setNewTemplate({ ...newTemplate, baseRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Visual Tier Editor */}
                  {newTemplate.type === 'tiered' && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-gray-700">Tier Structure</label>
                        <button
                          onClick={addTier}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                        >
                          + Add Tier
                        </button>
                      </div>
                      
                      {/* Visual Tier Chart */}
                      <div className="bg-white/30 rounded-lg p-4 mb-4">
                        <div className="relative h-40 flex items-end space-x-2">
                          {newTemplate.tierRates.map((tier, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center">
                              <div
                                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                                style={{ height: `${(tier.rate / 10) * 100}%` }}
                              ></div>
                              <div className="text-xs text-gray-600 mt-2 text-center">
                                <div>{tier.rate}%</div>
                                <div className="text-gray-500">
                                  {formatCurrency(tier.min)}-{tier.max === Infinity ? '∞' : formatCurrency(tier.max)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tier Form */}
                      <div className="space-y-3">
                        {newTemplate.tierRates.map((tier, index) => (
                          <div key={index} className="grid grid-cols-4 gap-3 items-end bg-white/30 rounded-lg p-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Min Amount</label>
                              <input
                                type="number"
                                value={tier.min}
                                onChange={(e) => updateTier(index, 'min', Number(e.target.value))}
                                className="w-full px-2 py-1 rounded border border-white/30 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Max Amount</label>
                              <input
                                type="number"
                                value={tier.max === Infinity ? '' : tier.max}
                                onChange={(e) => updateTier(index, 'max', e.target.value ? Number(e.target.value) : Infinity)}
                                className="w-full px-2 py-1 rounded border border-white/30 text-sm"
                                placeholder="∞"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Rate (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={tier.rate}
                                onChange={(e) => updateTier(index, 'rate', Number(e.target.value))}
                                className="w-full px-2 py-1 rounded border border-white/30 text-sm"
                              />
                            </div>
                            <div>
                              {newTemplate.tierRates.length > 1 && (
                                <button
                                  onClick={() => removeTier(index)}
                                  className="w-full px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bonus Structure */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Threshold</label>
                      <input
                        type="number"
                        value={newTemplate.bonusThreshold}
                        onChange={(e) => setNewTemplate({ ...newTemplate, bonusThreshold: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newTemplate.bonusRate}
                        onChange={(e) => setNewTemplate({ ...newTemplate, bonusRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={newTemplate.isActive}
                      onChange={(e) => setNewTemplate({ ...newTemplate, isActive: e.target.checked })}
                      className="rounded border-white/30"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Active Template
                    </label>
                  </div>
                </div>

                {/* Preview and Test Section */}
                <div className="space-y-6">
                  {/* Template Preview */}
                  <div className="bg-white/30 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Template Preview</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-600">Type:</span> <span className="font-medium capitalize">{newTemplate.type}</span></p>
                      <p><span className="text-gray-600">Base Rate:</span> <span className="font-medium">{newTemplate.baseRate}%</span></p>
                      {newTemplate.type === 'tiered' && (
                        <p><span className="text-gray-600">Tiers:</span> <span className="font-medium">{newTemplate.tierRates.length} levels</span></p>
                      )}
                      <p><span className="text-gray-600">Bonus:</span> <span className="font-medium">{newTemplate.bonusRate}% above {formatCurrency(newTemplate.bonusThreshold)}</span></p>
                    </div>
                  </div>

                  {/* Template Testing */}
                  <div className="bg-white/30 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Template Testing</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Test Amount (AED)</label>
                        <input
                          type="number"
                          value={testAmount}
                          onChange={(e) => setTestAmount(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30"
                        />
                      </div>
                      <button
                        onClick={testTemplate}
                        className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        Test Calculation
                      </button>
                      {testResult !== null && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-600 mb-1">Calculated Commission</p>
                          <p className="text-lg font-semibold text-green-800">{formatCurrency(testResult)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Version Control */}
                  <div className="bg-white/30 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Version Control</h4>
                    <textarea
                      value={newVersionChanges}
                      onChange={(e) => setNewVersionChanges(e.target.value)}
                      placeholder="Describe changes for this version..."
                      className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 text-sm"
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Version {templateVersions.length + 1} will be created upon saving
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={createTemplate}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preset Library Modal */}
      {showPresetLibrary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/90 rounded-2xl border border-white/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Preset Templates Library</h3>
                <button
                  onClick={() => setShowPresetLibrary(false)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presetTemplates.map((preset) => (
                  <div key={preset.id} className="bg-white/30 rounded-lg p-4 hover:bg-white/40 transition-colors cursor-pointer"
                       onClick={() => {
                         dispatch({ 
                           type: 'ADD_COMMISSION_STRUCTURE', 
                           payload: { ...preset.structure, id: Date.now().toString() }
                         });
                         setShowPresetLibrary(false);
                       }}>
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{preset.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{preset.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{preset.description}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(preset.category)}`}>
                          {preset.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/90 rounded-2xl border border-white/30 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Version History</h3>
                <button
                  onClick={() => setShowVersionHistory(false)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {templateVersions.map((version) => (
                  <div key={version.id} className="bg-white/30 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">Version {version.version}</h4>
                        <p className="text-sm text-gray-600">{new Date(version.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        version.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {version.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{version.changes}</p>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors">
                        View Changes
                      </button>
                      <button className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors">
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
                
                {templateVersions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No version history available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import/Export Modal */}
      {showImportExport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/90 rounded-2xl border border-white/30 shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Import/Export Templates</h3>
                <button
                  onClick={() => setShowImportExport(false)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Export Templates</h4>
                  <button
                    onClick={exportTemplates}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    📤 Export All Templates
                  </button>
                </div>

                <div className="border-t border-white/30 pt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Import Templates</h4>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={importTemplates}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    📥 Import Templates
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Detail Modal */}
      {selectedTemplate && !showCreateForm && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
};

interface TemplateDetailModalProps {
  template: CommissionStructure;
  onClose: () => void;
}

const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({ template, onClose }) => {
  const { dispatch } = useCommission();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState(template);

  const handleSave = () => {
    dispatch({ type: 'UPDATE_COMMISSION_STRUCTURE', payload: editedTemplate });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      dispatch({ type: 'DELETE_COMMISSION_STRUCTURE', payload: template.id });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-xl bg-white/90 rounded-2xl border border-white/30 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Template Details</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    value={editedTemplate.name}
                    onChange={(e) => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editedTemplate.baseRate}
                    onChange={(e) => setEditedTemplate({ ...editedTemplate, baseRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white/50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Template Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-800">{template.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium text-gray-800 capitalize">{template.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Base Rate</p>
                      <p className="font-medium text-gray-800">{template.baseRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {template.tierRates && (
                  <div className="bg-white/50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Tier Structure</h4>
                    <div className="space-y-2">
                      {template.tierRates.map((tier, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-white/50 rounded">
                          <span className="text-sm text-gray-600">
                            {formatCurrency(tier.min)} - {tier.max === Infinity ? 'Unlimited' : formatCurrency(tier.max)}
                          </span>
                          <span className="text-sm font-medium text-gray-800">{tier.rate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {template.bonusThreshold && (
                  <div className="bg-white/50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Bonus Structure</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Threshold</p>
                        <p className="font-medium text-gray-800">{formatCurrency(template.bonusThreshold)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Bonus Rate</p>
                        <p className="font-medium text-gray-800">{template.bonusRate}%</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                    Use Template
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Templates;