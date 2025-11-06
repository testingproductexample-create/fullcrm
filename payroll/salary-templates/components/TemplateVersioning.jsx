import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const TemplateVersioning = ({ templates, onVersionChange }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versionFilter, setVersionFilter] = useState('all'); // 'all', 'active', 'archived'

  // Mock version history data
  const [versionHistory, setVersionHistory] = useState({
    '1': [
      {
        id: 'v1.2',
        version: '1.2',
        changes: 'Updated medical allowance and added new benefits',
        createdAt: '2024-10-15',
        createdBy: 'HR Manager',
        status: 'active',
        baseSalary: 25000,
        allowances: { housing: 6000, transport: 1500, meal: 600, medical: 1200 },
        isActiveVersion: true
      },
      {
        id: 'v1.1',
        version: '1.1',
        changes: 'Minor adjustment to housing allowance',
        createdAt: '2024-08-20',
        createdBy: 'HR Manager',
        status: 'archived',
        baseSalary: 25000,
        allowances: { housing: 5800, transport: 1500, meal: 600, medical: 1200 },
        isActiveVersion: false
      },
      {
        id: 'v1.0',
        version: '1.0',
        changes: 'Initial template creation',
        createdAt: '2024-01-20',
        createdBy: 'HR Manager',
        status: 'archived',
        baseSalary: 24000,
        allowances: { housing: 5500, transport: 1500, meal: 600, medical: 1000 },
        isActiveVersion: false
      }
    ],
    '2': [
      {
        id: 'v1.3',
        version: '1.3',
        changes: 'Added performance bonus and updated transport allowance',
        createdAt: '2024-11-01',
        createdBy: 'HR Manager',
        status: 'active',
        baseSalary: 20000,
        allowances: { housing: 5000, transport: 1300, meal: 600, medical: 1000 },
        isActiveVersion: true
      },
      {
        id: 'v1.2',
        version: '1.2',
        changes: 'Updated medical allowance coverage',
        createdAt: '2024-09-10',
        createdBy: 'HR Manager',
        status: 'archived',
        baseSalary: 20000,
        allowances: { housing: 5000, transport: 1200, meal: 600, medical: 900 },
        isActiveVersion: false
      },
      {
        id: 'v1.1',
        version: '1.1',
        changes: 'Added education allowance',
        createdAt: '2024-06-15',
        createdBy: 'HR Manager',
        status: 'archived',
        baseSalary: 19500,
        allowances: { housing: 5000, transport: 1200, meal: 600, medical: 800 },
        isActiveVersion: false
      }
    ]
  });

  const [newVersion, setNewVersion] = useState({
    version: '',
    changes: '',
    baseSalary: 0,
    allowances: {
      housing: 0,
      transport: 0,
      meal: 0,
      medical: 0
    }
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTotalCompensation = (version) => {
    const allowancesTotal = Object.values(version.allowances).reduce((sum, amount) => sum + amount, 0);
    return version.baseSalary + allowancesTotal;
  };

  const handleCreateVersion = () => {
    if (!newVersion.version || !newVersion.changes) {
      alert('Please provide version number and description of changes');
      return;
    }

    const versionData = {
      id: `v${newVersion.version}`,
      version: newVersion.version,
      changes: newVersion.changes,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'Current User',
      status: 'active',
      baseSalary: newVersion.baseSalary,
      allowances: { ...newVersion.allowances },
      isActiveVersion: true
    };

    // Archive current active version
    const history = versionHistory[selectedTemplate.id] || [];
    const updatedHistory = history.map(v => ({ ...v, isActiveVersion: false, status: 'archived' }));
    updatedHistory.unshift(versionData);

    setVersionHistory(prev => ({
      ...prev,
      [selectedTemplate.id]: updatedHistory
    }));

    // Reset form and close modal
    setNewVersion({
      version: '',
      changes: '',
      baseSalary: 0,
      allowances: { housing: 0, transport: 0, meal: 0, medical: 0 }
    });
    setShowVersionModal(false);

    // Update template with new version
    onVersionChange(selectedTemplate.id, newVersion.version);
  };

  const handleRevertVersion = (templateId, versionId) => {
    if (confirm('Are you sure you want to revert to this version? This will archive the current active version.')) {
      const history = versionHistory[templateId] || [];
      const updatedHistory = history.map(v => ({
        ...v,
        isActiveVersion: v.id === versionId,
        status: v.id === versionId ? 'active' : 'archived'
      }));

      setVersionHistory(prev => ({
        ...prev,
        [templateId]: updatedHistory
      }));

      const revertedVersion = history.find(v => v.id === versionId);
      if (revertedVersion) {
        onVersionChange(templateId, revertedVersion.version);
      }
    }
  };

  const handleDeleteVersion = (templateId, versionId) => {
    const history = versionHistory[templateId] || [];
    const versionToDelete = history.find(v => v.id === versionId);
    
    if (versionToDelete?.isActiveVersion) {
      alert('Cannot delete the active version. Please activate another version first.');
      return;
    }

    if (confirm('Are you sure you want to delete this version?')) {
      const updatedHistory = history.filter(v => v.id !== versionId);
      setVersionHistory(prev => ({
        ...prev,
        [templateId]: updatedHistory
      }));
    }
  };

  const getVersionStats = () => {
    const totalVersions = Object.values(versionHistory).flat().length;
    const activeVersions = Object.values(versionHistory).flat().filter(v => v.isActiveVersion).length;
    const archivedVersions = totalVersions - activeVersions;
    
    return { totalVersions, activeVersions, archivedVersions };
  };

  const stats = getVersionStats();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Version Control</h2>
          <p className="text-gray-600">Manage and track template versions and changes</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
          >
            <option value="all">All Versions</option>
            <option value="active">Active Only</option>
            <option value="archived">Archived Only</option>
          </select>
          
          {selectedTemplate && (
            <button
              onClick={() => setShowVersionModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <DocumentDuplicateIcon className="w-5 h-5" />
              <span>Create New Version</span>
            </button>
          )}
        </div>
      </div>

      {/* Version Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalVersions}</div>
              <div className="text-sm text-gray-600">Total Versions</div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.activeVersions}</div>
              <div className="text-sm text-gray-600">Active Versions</div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.archivedVersions}</div>
              <div className="text-sm text-gray-600">Archived Versions</div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DocumentDuplicateIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
              <div className="text-sm text-gray-600">Templates</div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Template to View Version History</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedTemplate(template)}
              className={`bg-white/80 backdrop-blur-sm rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${
                selectedTemplate?.id === template.id 
                  ? 'border-blue-500 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-600">{template.role} • {template.level}</p>
                </div>
                {selectedTemplate?.id === template.id && (
                  <CheckCircleIcon className="w-6 h-6 text-blue-500" />
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Version:</span>
                  <span className="font-medium">{template.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Versions:</span>
                  <span className="font-medium">
                    {versionHistory[template.id]?.length || 0}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTemplate(template);
                  setShowHistoryModal(true);
                }}
                className="mt-3 w-full px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2"
              >
                <EyeIcon className="w-4 h-4" />
                <span>View History</span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Version History Display */}
      {selectedTemplate && versionHistory[selectedTemplate.id] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Version History: {selectedTemplate.name}
                </h3>
                <p className="text-gray-600">
                  {versionHistory[selectedTemplate.id].length} version(s) available
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowVersionModal(true)}
                  className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-2"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  <span>New Version</span>
                </button>
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="px-4 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Full History
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Changes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compensation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {versionHistory[selectedTemplate.id]
                  .filter(version => {
                    if (versionFilter === 'active') return version.isActiveVersion;
                    if (versionFilter === 'archived') return !version.isActiveVersion;
                    return true;
                  })
                  .map((version) => (
                  <tr key={version.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          version.isActiveVersion ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <span className={`text-sm font-medium ${
                            version.isActiveVersion ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            v{version.version}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{version.changes}</div>
                      <div className="text-sm text-gray-500">by {version.createdBy}</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(getTotalCompensation(version))}
                      </div>
                      <div className="text-sm text-gray-500">
                        Base: {formatCurrency(version.baseSalary)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {new Date(version.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        version.isActiveVersion 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {version.isActiveVersion ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {/* View version details */}}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {!version.isActiveVersion && (
                        <button
                          onClick={() => handleRevertVersion(selectedTemplate.id, version.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Revert
                        </button>
                      )}
                      {!version.isActiveVersion && (
                        <button
                          onClick={() => handleDeleteVersion(selectedTemplate.id, version.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Create Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Create New Version for {selectedTemplate?.name}
                </h3>
                <button
                  onClick={() => setShowVersionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Version Number *
                    </label>
                    <input
                      type="text"
                      value={newVersion.version}
                      onChange={(e) => setNewVersion({...newVersion, version: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 1.3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Salary (AED) *
                    </label>
                    <input
                      type="number"
                      value={newVersion.baseSalary}
                      onChange={(e) => setNewVersion({...newVersion, baseSalary: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description of Changes *
                  </label>
                  <textarea
                    value={newVersion.changes}
                    onChange={(e) => setNewVersion({...newVersion, changes: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the changes in this version..."
                  />
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Allowances (AED)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(newVersion.allowances).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                          {key}
                        </label>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => setNewVersion({
                            ...newVersion,
                            allowances: {
                              ...newVersion.allowances,
                              [key]: Number(e.target.value)
                            }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {newVersion.baseSalary > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">New Total Package</h4>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(
                        newVersion.baseSalary + 
                        Object.values(newVersion.allowances).reduce((sum, amount) => sum + amount, 0)
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowVersionModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVersion}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Version
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateVersioning;