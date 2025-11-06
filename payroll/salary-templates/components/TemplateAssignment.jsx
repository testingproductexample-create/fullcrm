import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const TemplateAssignment = ({ templates, onAssign }) => {
  const [employees] = useState([
    {
      id: '1',
      name: 'Ahmed Al-Rashid',
      email: 'ahmed.alrashid@company.ae',
      role: 'Software Engineer',
      department: 'Engineering',
      joinDate: '2022-03-15',
      currentTemplate: 'Software Engineer - Senior',
      status: 'active'
    },
    {
      id: '2',
      name: 'Fatima Al-Zahra',
      email: 'fatima.alzahra@company.ae',
      role: 'Marketing Manager',
      department: 'Marketing',
      joinDate: '2021-07-20',
      currentTemplate: 'Marketing Manager',
      status: 'active'
    },
    {
      id: '3',
      name: 'Omar Al-Mansouri',
      email: 'omar.almansouri@company.ae',
      role: 'Software Engineer',
      department: 'Engineering',
      joinDate: '2023-01-10',
      currentTemplate: null,
      status: 'active'
    },
    {
      id: '4',
      name: 'Aisha Al-Ketbi',
      email: 'aisha.alketbi@company.ae',
      role: 'Data Scientist',
      department: 'Data & Analytics',
      joinDate: '2022-11-05',
      currentTemplate: 'Software Engineer - Senior',
      status: 'active'
    },
    {
      id: '5',
      name: 'Mohammed Al-Suwaidi',
      email: 'mohammed.alsuwaidi@company.ae',
      role: 'HR Specialist',
      department: 'Human Resources',
      joinDate: '2020-09-12',
      currentTemplate: null,
      status: 'active'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().split('T')[0]);

  // Get unique departments
  const departments = [...new Set(employees.map(emp => emp.department))];

  // Filter employees
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    }
  };

  const handleTemplateAssignment = () => {
    if (!selectedTemplate || selectedEmployees.length === 0) {
      alert('Please select a template and at least one employee');
      return;
    }

    selectedEmployees.forEach(employeeId => {
      onAssign(selectedTemplate, employeeId);
    });

    // Reset state
    setSelectedEmployees([]);
    setSelectedTemplate(null);
    setShowAssignmentModal(false);
    
    alert(`Successfully assigned template to ${selectedEmployees.length} employee(s)`);
  };

  const getUnassignedCount = () => {
    return employees.filter(emp => !emp.currentTemplate).length;
  };

  const getAssignedCount = () => {
    return employees.filter(emp => emp.currentTemplate).length;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Assignment</h2>
          <p className="text-gray-600">Assign salary templates to employees</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-medium">
            {getAssignedCount()} Assigned
          </div>
          <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-medium">
            {getUnassignedCount()} Unassigned
          </div>
          {selectedEmployees.length > 0 && (
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Assign Template ({selectedEmployees.length})
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
              <div className="text-sm text-gray-600">Total Employees</div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{getAssignedCount()}</div>
              <div className="text-sm text-gray-600">Assigned</div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{getUnassignedCount()}</div>
              <div className="text-sm text-gray-600">Unassigned</div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
              <div className="text-sm text-gray-600">Available Templates</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr 
                  key={employee.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedEmployees.includes(employee.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => handleEmployeeSelect(employee.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.role}</div>
                    <div className="text-sm text-gray-500">{employee.department}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
                      {new Date(employee.joinDate).toLocaleDateString()}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.currentTemplate ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {employee.currentTemplate}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        No Template
                      </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      employee.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-600">
              {searchTerm || filterDepartment !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No employees in the system yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Assign Salary Template</h3>
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Selected Employees Summary */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Selected Employees ({selectedEmployees.length})
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
                    {selectedEmployees.map(employeeId => {
                      const employee = employees.find(emp => emp.id === employeeId);
                      return (
                        <div key={employeeId} className="flex items-center justify-between py-1">
                          <span className="text-sm text-gray-900">{employee.name}</span>
                          <span className="text-sm text-gray-500">{employee.role}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Template *
                  </label>
                  <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                    {templates.map(template => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedTemplate === template.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">{template.name}</h5>
                            <p className="text-sm text-gray-600">{template.role} • {template.level}</p>
                            <p className="text-sm font-medium text-blue-600">
                              {new Intl.NumberFormat('en-AE', {
                                style: 'currency',
                                currency: 'AED',
                                minimumFractionDigits: 0
                              }).format(
                                template.baseSalary + 
                                Object.values(template.allowances).reduce((sum, amount) => sum + amount, 0)
                              )}
                            </p>
                          </div>
                          {selectedTemplate === template.id && (
                            <CheckIcon className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assignment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    value={assignmentDate}
                    onChange={(e) => setAssignmentDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Assignment Summary */}
                {selectedTemplate && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Assignment Summary</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>• {selectedEmployees.length} employee(s) will be assigned</div>
                      <div>• Template: {templates.find(t => t.id === selectedTemplate)?.name}</div>
                      <div>• Effective Date: {new Date(assignmentDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTemplateAssignment}
                  disabled={!selectedTemplate || selectedEmployees.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateAssignment;