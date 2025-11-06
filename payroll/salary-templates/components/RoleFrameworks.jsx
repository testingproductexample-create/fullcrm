import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const RoleFrameworks = ({ frameworks, onUpdate }) => {
  const [selectedFramework, setSelectedFramework] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'detailed'

  const [newFramework, setNewFramework] = useState({
    name: '',
    description: '',
    roles: [],
    hierarchy: [],
    marketData: '',
    salaryRanges: {}
  });

  const commonRoles = [
    'Software Engineer', 'DevOps Engineer', 'QA Engineer', 'Data Scientist',
    'Product Manager', 'Project Manager', 'Marketing Manager', 'Marketing Specialist',
    'Sales Manager', 'Sales Representative', 'HR Manager', 'HR Specialist',
    'Finance Manager', 'Accountant', 'Operations Manager', 'Customer Success Manager',
    'UI/UX Designer', 'Graphic Designer', 'Content Writer', 'Business Analyst'
  ];

  const commonLevels = [
    'Intern', 'Junior', 'Associate', 'Mid', 'Senior', 'Lead', 'Principal', 'Director', 'VP'
  ];

  const marketDataOptions = [
    'UAE Tech Market 2024',
    'UAE Marketing Market 2024',
    'UAE Finance Market 2024',
    'UAE Healthcare Market 2024',
    'UAE Oil & Gas Market 2024',
    'Gulf Region Average 2024'
  ];

  const handleCreateFramework = () => {
    if (!newFramework.name || newFramework.roles.length === 0) {
      alert('Please provide a name and select at least one role');
      return;
    }

    const framework = {
      id: Date.now().toString(),
      ...newFramework,
      createdAt: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    onUpdate([...frameworks, framework]);
    setNewFramework({
      name: '',
      description: '',
      roles: [],
      hierarchy: [],
      marketData: '',
      salaryRanges: {}
    });
    setShowCreateModal(false);
  };

  const updateFramework = (frameworkId, updates) => {
    const updatedFrameworks = frameworks.map(fw => 
      fw.id === frameworkId ? { ...fw, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : fw
    );
    onUpdate(updatedFrameworks);
    setIsEditing(false);
  };

  const deleteFramework = (frameworkId) => {
    if (confirm('Are you sure you want to delete this framework?')) {
      onUpdate(frameworks.filter(fw => fw.id !== frameworkId));
      if (selectedFramework?.id === frameworkId) {
        setSelectedFramework(null);
      }
    }
  };

  const generateSalaryRanges = (framework) => {
    // Simulated salary ranges based on role and level
    const ranges = {};
    framework.roles.forEach(role => {
      ranges[role] = {};
      framework.hierarchy.forEach(level => {
        ranges[role][level] = {
          min: Math.floor(Math.random() * 10000) + 15000,
          max: Math.floor(Math.random() * 15000) + 25000,
          median: Math.floor(Math.random() * 12000) + 20000
        };
      });
    });
    return ranges;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Role-Based Compensation Frameworks</h2>
          <p className="text-gray-600">Configure compensation structures based on roles and career levels</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'detailed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Detailed View
            </button>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Framework</span>
          </button>
        </div>
      </div>

      {/* Frameworks Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frameworks.map((framework) => (
            <motion.div
              key={framework.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{framework.name}</h3>
                    <p className="text-sm text-gray-600">{framework.roles.length} roles • {framework.hierarchy.length} levels</p>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      setSelectedFramework(framework);
                      setViewMode('detailed');
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFramework(framework);
                      setIsEditing(true);
                    }}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteFramework(framework.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {framework.description && (
                <p className="text-sm text-gray-600 mb-4">{framework.description}</p>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Market Data:</span>
                  <span className="font-medium">{framework.marketData || 'Not set'}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">{framework.lastUpdated}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{framework.roles.length}</div>
                    <div className="text-xs text-gray-600">Roles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{framework.hierarchy.length}</div>
                    <div className="text-xs text-gray-600">Levels</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Detailed View */
        <div className="space-y-6">
          {selectedFramework ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedFramework.name}</h3>
                  <p className="text-gray-600">{selectedFramework.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Edit Framework
                  </button>
                  <button
                    onClick={() => setSelectedFramework(null)}
                    className="px-4 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Framework Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Roles */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Roles ({selectedFramework.roles.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedFramework.roles.map((role, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{role}</span>
                        <UsersIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hierarchy */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Career Levels ({selectedFramework.hierarchy.length})</h4>
                  <div className="space-y-2">
                    {selectedFramework.hierarchy.map((level, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium text-blue-900">{level}</span>
                        <div className="flex items-center space-x-2">
                          <ChartBarIcon className="w-5 h-5 text-blue-400" />
                          <span className="text-sm text-blue-600">Level {index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Salary Ranges Table */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Salary Ranges</h4>
                  <button
                    onClick={() => {
                      const ranges = generateSalaryRanges(selectedFramework);
                      updateFramework(selectedFramework.id, { salaryRanges: ranges });
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Generate Ranges
                  </button>
                </div>

                {Object.keys(selectedFramework.salaryRanges || {}).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Role</th>
                          {selectedFramework.hierarchy.map(level => (
                            <th key={level} className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                              {level}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {Object.entries(selectedFramework.salaryRanges).map(([role, ranges]) => (
                          <tr key={role}>
                            <td className="px-4 py-3 font-medium text-gray-900">{role}</td>
                            {selectedFramework.hierarchy.map(level => {
                              const range = ranges[level];
                              return (
                                <td key={level} className="px-4 py-3 text-sm text-gray-600">
                                  {range ? (
                                    <div>
                                      <div className="font-medium">{range.min.toLocaleString()} - {range.max.toLocaleString()} AED</div>
                                      <div className="text-xs text-gray-500">Median: {range.median.toLocaleString()} AED</div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">Not set</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CurrencyDollarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No salary ranges generated yet.</p>
                    <p className="text-sm">Click "Generate Ranges" to create market-based salary ranges.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Framework</h3>
              <p className="text-gray-600">Choose a framework from the grid view to see detailed information.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Framework Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create New Framework</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Framework Name *</label>
                  <input
                    type="text"
                    value={newFramework.name}
                    onChange={(e) => setNewFramework({...newFramework, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Engineering Framework"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newFramework.description}
                    onChange={(e) => setNewFramework({...newFramework, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the purpose and scope of this framework"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Market Data Source</label>
                  <select
                    value={newFramework.marketData}
                    onChange={(e) => setNewFramework({...newFramework, marketData: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select market data</option>
                    {marketDataOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {commonRoles.map(role => (
                      <label key={role} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newFramework.roles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewFramework({
                                ...newFramework,
                                roles: [...newFramework.roles, role]
                              });
                            } else {
                              setNewFramework({
                                ...newFramework,
                                roles: newFramework.roles.filter(r => r !== role)
                              });
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span>{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Career Levels</label>
                  <div className="grid grid-cols-3 gap-2 border border-gray-300 rounded-lg p-3">
                    {commonLevels.map(level => (
                      <label key={level} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newFramework.hierarchy.includes(level)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewFramework({
                                ...newFramework,
                                hierarchy: [...newFramework.hierarchy, level]
                              });
                            } else {
                              setNewFramework({
                                ...newFramework,
                                hierarchy: newFramework.hierarchy.filter(l => l !== level)
                              });
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span>{level}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFramework}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Framework
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleFrameworks;