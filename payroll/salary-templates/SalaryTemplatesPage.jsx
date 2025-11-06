import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TemplateLibrary from './components/TemplateLibrary';
import TemplateBuilder from './components/TemplateBuilder';
import TemplateComparison from './components/TemplateComparison';
import RoleFrameworks from './components/RoleFrameworks';
import AllowancesConfig from './components/AllowancesConfig';
import TemplateAssignment from './components/TemplateAssignment';
import TemplateVersioning from './components/TemplateVersioning';
import { 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  ScaleIcon, 
  UserGroupIcon, 
  Cog6ToothIcon,
  ChartBarIcon,
  PlusIcon,
  ViewColumnsIcon
} from '@heroicons/react/24/outline';

const SalaryTemplatesPage = () => {
  const [activeTab, setActiveTab] = useState('library');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [roleFrameworks, setRoleFrameworks] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const tabs = [
    { id: 'library', name: 'Template Library', icon: DocumentTextIcon },
    { id: 'builder', name: 'Template Builder', icon: PlusIcon },
    { id: 'frameworks', name: 'Role Frameworks', icon: BuildingOfficeIcon },
    { id: 'allowances', name: 'Allowances Config', icon: Cog6ToothIcon },
    { id: 'assignment', name: 'Template Assignment', icon: UserGroupIcon },
    { id: 'comparison', name: 'Compare Templates', icon: ViewColumnsIcon },
    { id: 'versioning', name: 'Version Control', icon: ChartBarIcon },
  ];

  // Sample data for demonstration
  useEffect(() => {
    const sampleTemplates = [
      {
        id: '1',
        name: 'Software Engineer - Junior',
        role: 'Software Engineer',
        level: 'Junior',
        baseSalary: 15000,
        allowances: {
          housing: 4000,
          transport: 1000,
          meal: 500,
          medical: 800
        },
        benefits: ['Health Insurance', 'Annual Leave', 'Professional Development'],
        createdAt: '2024-01-15',
        isActive: true,
        version: '1.2'
      },
      {
        id: '2',
        name: 'Software Engineer - Senior',
        role: 'Software Engineer',
        level: 'Senior',
        baseSalary: 25000,
        allowances: {
          housing: 6000,
          transport: 1500,
          meal: 600,
          medical: 1200
        },
        benefits: ['Health Insurance', 'Annual Leave', 'Stock Options', 'Training Budget'],
        createdAt: '2024-01-20',
        isActive: true,
        version: '1.3'
      },
      {
        id: '3',
        name: 'Marketing Manager',
        role: 'Marketing',
        level: 'Manager',
        baseSalary: 20000,
        allowances: {
          housing: 5000,
          transport: 1200,
          meal: 600,
          medical: 1000
        },
        benefits: ['Health Insurance', 'Annual Leave', 'Performance Bonus'],
        createdAt: '2024-02-01',
        isActive: true,
        version: '1.1'
      }
    ];

    const sampleFrameworks = [
      {
        id: '1',
        name: 'Engineering Framework',
        roles: ['Software Engineer', 'DevOps Engineer', 'QA Engineer'],
        hierarchy: ['Junior', 'Mid', 'Senior', 'Lead', 'Principal'],
        marketData: 'UAE Tech Market 2024',
        lastUpdated: '2024-10-01'
      },
      {
        id: '2',
        name: 'Marketing Framework',
        roles: ['Marketing Specialist', 'Marketing Manager', 'Marketing Director'],
        hierarchy: ['Associate', 'Manager', 'Senior Manager', 'Director'],
        marketData: 'UAE Marketing Market 2024',
        lastUpdated: '2024-09-15'
      }
    ];

    setTemplates(sampleTemplates);
    setRoleFrameworks(sampleFrameworks);
  }, []);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleCreateTemplate = (templateData) => {
    const newTemplate = {
      id: Date.now().toString(),
      ...templateData,
      createdAt: new Date().toISOString().split('T')[0],
      version: '1.0',
      isActive: true
    };
    setTemplates([...templates, newTemplate]);
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Salary Structure Templates
                </h1>
                <p className="text-gray-600">
                  Manage and configure salary templates for UAE payroll system
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-medium">
                  {templates.filter(t => t.isActive).length} Active Templates
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
                >
                  Create New Template
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-2">
            <nav className="flex space-x-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white shadow-md text-blue-600 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'library' && (
              <TemplateLibrary
                key="library"
                templates={templates}
                onSelectTemplate={handleTemplateSelect}
                selectedTemplate={selectedTemplate}
              />
            )}
            
            {activeTab === 'builder' && (
              <TemplateBuilder
                key="builder"
                roleFrameworks={roleFrameworks}
                onSave={handleCreateTemplate}
                onCancel={() => setIsCreating(false)}
                isOpen={isCreating}
              />
            )}
            
            {activeTab === 'frameworks' && (
              <RoleFrameworks
                key="frameworks"
                frameworks={roleFrameworks}
                onUpdate={setRoleFrameworks}
              />
            )}
            
            {activeTab === 'allowances' && (
              <AllowancesConfig
                key="allowances"
                onUpdate={(config) => console.log('Updated allowances config:', config)}
              />
            )}
            
            {activeTab === 'assignment' && (
              <TemplateAssignment
                key="assignment"
                templates={templates}
                onAssign={(templateId, employeeId) => 
                  console.log('Assigned template', templateId, 'to employee', employeeId)
                }
              />
            )}
            
            {activeTab === 'comparison' && (
              <TemplateComparison
                key="comparison"
                templates={templates}
                onCompare={(selected) => 
                  console.log('Comparing templates:', selected)
                }
              />
            )}
            
            {activeTab === 'versioning' && (
              <TemplateVersioning
                key="versioning"
                templates={templates}
                onVersionChange={(templateId, version) => 
                  console.log('Changed version for template', templateId, 'to', version)
                }
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default SalaryTemplatesPage;