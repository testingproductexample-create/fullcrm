import React, { useState } from 'react';
import { 
  Users, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import { Employee, BulkCalculationRequest, BulkCalculationResult } from '../../types/payroll';

interface BulkProcessingProps {
  employees: Employee[];
  onBulkProcess: (request: BulkCalculationRequest) => Promise<BulkCalculationResult>;
  loading: boolean;
}

const BulkProcessing: React.FC<BulkProcessingProps> = ({
  employees,
  onBulkProcess,
  loading
}) => {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [result, setResult] = useState<BulkCalculationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Get unique departments for filter
  const departments = [...new Set(employees.map(emp => emp.department_id))].filter(Boolean);

  // Filter employees based on selected filters
  const filteredEmployees = employees.filter(employee => {
    if (departmentFilter && employee.department_id !== departmentFilter) return false;
    if (statusFilter && employee.status !== statusFilter) return false;
    return true;
  });

  // Handle employee selection
  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle bulk processing
  const handleBulkProcess = async () => {
    if (selectedEmployees.length === 0) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const request: BulkCalculationRequest = {
        employee_ids: selectedEmployees,
        calculation_period_month: new Date().getMonth() + 1,
        calculation_period_year: new Date().getFullYear()
      };

      const bulkResult = await onBulkProcess(request);
      setResult(bulkResult);
    } catch (error) {
      console.error('Bulk processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'terminated':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Bulk Processing</h2>
        <p className="text-gray-400">Process salary calculations for multiple employees at once</p>
      </div>

      {/* Controls */}
      <div className="glass-card p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Filters
            </button>
            
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Selected: {selectedEmployees.length} / {filteredEmployees.length} employees</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedEmployees([])}
              className="btn-secondary"
              disabled={selectedEmployees.length === 0}
            >
              Clear Selection
            </button>
            <button
              onClick={handleBulkProcess}
              disabled={selectedEmployees.length === 0 || isProcessing}
              className="btn-primary flex items-center gap-2"
            >
              {isProcessing ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isProcessing ? 'Processing...' : 'Process Selected'}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full p-2 glass-input rounded-lg"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 glass-input rounded-lg"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setDepartmentFilter('');
                    setStatusFilter('');
                  }}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Processing Result */}
      {result && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Processing Result</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-400">{result.success_count}</p>
              <p className="text-sm text-gray-400">Successfully Processed</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-400">{result.error_count}</p>
              <p className="text-sm text-gray-400">Failed</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-400">{(result.processing_time_ms / 1000).toFixed(1)}s</p>
              <p className="text-sm text-gray-400">Processing Time</p>
            </div>
          </div>

          {/* Error Details */}
          {result.errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-medium">Errors</span>
              </div>
              <div className="space-y-2">
                {result.errors.map((error, index) => (
                  <div key={index} className="text-sm">
                    <span className="text-gray-400">Employee ID: {error.employee_id}</span>
                    <br />
                    <span className="text-red-300">{error.error_message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Employee List */}
      <div className="glass-card">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Employee Selection</h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-400">Select All</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-gray-400 font-medium">Select</th>
                <th className="text-left p-4 text-gray-400 font-medium">Employee</th>
                <th className="text-left p-4 text-gray-400 font-medium">Job Title</th>
                <th className="text-left p-4 text-gray-400 font-medium">Department</th>
                <th className="text-left p-4 text-gray-400 font-medium">Base Salary</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Hire Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => toggleEmployee(employee.id)}
                      className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-white font-medium">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <p className="text-sm text-gray-400">{employee.email}</p>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">{employee.job_title}</td>
                  <td className="p-4 text-gray-300">{employee.department_id}</td>
                  <td className="p-4 text-gray-300">
                    {new Intl.NumberFormat('en-AE', {
                      style: 'currency',
                      currency: 'AED'
                    }).format(employee.base_salary_aed)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusBadge(employee.status)}`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">
                    {new Date(employee.hire_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No employees found matching the current filters.</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="glass-card p-4 hover:bg-white/5 transition-all text-left">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-white font-medium">Import Data</p>
              <p className="text-sm text-gray-400">Import employee data from CSV</p>
            </div>
          </div>
        </button>

        <button className="glass-card p-4 hover:bg-white/5 transition-all text-left">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-white font-medium">Export Results</p>
              <p className="text-sm text-gray-400">Download calculation results</p>
            </div>
          </div>
        </button>

        <button className="glass-card p-4 hover:bg-white/5 transition-all text-left">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-purple-400" />
            <div>
              <p className="text-white font-medium">Generate Report</p>
              <p className="text-sm text-gray-400">Create summary report</p>
            </div>
          </div>
        </button>

        <button className="glass-card p-4 hover:bg-white/5 transition-all text-left">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            <div>
              <p className="text-white font-medium">Compliance Check</p>
              <p className="text-sm text-gray-400">Verify UAE compliance</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default BulkProcessing;