import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  User, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Save,
  RefreshCw
} from 'lucide-react';
import { Employee, SalaryStructure, CalculationPreview } from '../../types/payroll';
import { formatAED } from '../../utils/calculations';

interface IndividualCalculationProps {
  employees: Employee[];
  salaryStructures: SalaryStructure[];
  onCalculate: (preview: CalculationPreview) => void;
  loading: boolean;
}

const IndividualCalculation: React.FC<IndividualCalculationProps> = ({
  employees,
  salaryStructures,
  onCalculate,
  loading
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedStructure, setSelectedStructure] = useState<string>('');
  const [regularHours, setRegularHours] = useState<number>(176);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [commissionAmount, setCommissionAmount] = useState<number>(0);
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [leaveDeduction, setLeaveDeduction] = useState<number>(0);
  const [preview, setPreview] = useState<CalculationPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);
  const selectedStructureData = salaryStructures.find(struct => struct.id === selectedStructure);

  useEffect(() => {
    if (selectedEmployee && salaryStructures.length > 0) {
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (employee && employee.salary_structure_id) {
        setSelectedStructure(employee.salary_structure_id);
      }
    }
  }, [selectedEmployee, employees, salaryStructures]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedEmployee) {
      newErrors.employee = 'Please select an employee';
    }

    if (!selectedStructure) {
      newErrors.structure = 'Please select a salary structure';
    }

    if (regularHours < 0 || regularHours > 240) {
      newErrors.regularHours = 'Regular hours must be between 0 and 240';
    }

    if (overtimeHours < 0 || overtimeHours > 100) {
      newErrors.overtimeHours = 'Overtime hours must be between 0 and 100';
    }

    if (commissionAmount < 0) {
      newErrors.commissionAmount = 'Commission amount cannot be negative';
    }

    if (bonusAmount < 0) {
      newErrors.bonusAmount = 'Bonus amount cannot be negative';
    }

    if (advanceAmount < 0) {
      newErrors.advanceAmount = 'Advance amount cannot be negative';
    }

    if (leaveDeduction < 0) {
      newErrors.leaveDeduction = 'Leave deduction cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = () => {
    if (!validateForm() || !selectedEmployeeData || !selectedStructureData) {
      return;
    }

    // This would typically call the actual calculation function
    const mockPreview: CalculationPreview = {
      employee_id: selectedEmployee,
      employee_name: `${selectedEmployeeData.first_name} ${selectedEmployeeData.last_name}`,
      base_salary: selectedStructureData.base_salary_aed,
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      overtime_amount: overtimeHours * selectedStructureData.hourly_rate_aed * selectedStructureData.overtime_rate_multiplier,
      commission_amount: commissionAmount,
      bonus_amount: bonusAmount,
      allowances_amount: selectedStructureData.transportation_allowance_aed + 
                         selectedStructureData.meal_allowance_aed + 
                         selectedStructureData.accommodation_allowance_aed +
                         selectedStructureData.skills_allowance_aed,
      gross_salary: selectedStructureData.base_salary_aed + 
                   (overtimeHours * selectedStructureData.hourly_rate_aed * selectedStructureData.overtime_rate_multiplier) +
                   commissionAmount + bonusAmount,
      deductions: [],
      net_salary: 0, // Would be calculated
      uae_compliance_issues: [],
      warnings: []
    };

    const totalAllowances = mockPreview.allowances_amount;
    const totalDeductions = advanceAmount + leaveDeduction;
    mockPreview.net_salary = mockPreview.gross_salary - totalDeductions;

    // Add compliance checks
    if (overtimeHours > 2 * 22) { // Max 2 hours per day * working days
      mockPreview.uae_compliance_issues.push('Daily overtime limit exceeded');
    }

    if (mockPreview.net_salary < 1000) {
      mockPreview.uae_compliance_issues.push('Net salary below UAE minimum wage');
      mockPreview.warnings.push('Net salary will be adjusted to meet minimum wage requirement');
    }

    setPreview(mockPreview);
    setShowPreview(true);
  };

  const handleSave = () => {
    if (preview) {
      onCalculate(preview);
      setShowPreview(false);
      setPreview(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Individual Salary Calculation</h2>
        <p className="text-gray-400">Calculate monthly salary for a single employee</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employee Selection */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Employee Selection
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Employee *
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full p-3 glass-input rounded-lg"
                >
                  <option value="">Select an employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} - {employee.job_title}
                    </option>
                  ))}
                </select>
                {errors.employee && (
                  <p className="text-red-400 text-sm mt-1">{errors.employee}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Salary Structure *
                </label>
                <select
                  value={selectedStructure}
                  onChange={(e) => setSelectedStructure(e.target.value)}
                  className="w-full p-3 glass-input rounded-lg"
                  disabled={!selectedEmployee}
                >
                  <option value="">Select a structure</option>
                  {salaryStructures.map((structure) => (
                    <option key={structure.id} value={structure.id}>
                      {structure.structure_name} - {formatAED(structure.base_salary_aed)}
                    </option>
                  ))}
                </select>
                {errors.structure && (
                  <p className="text-red-400 text-sm mt-1">{errors.structure}</p>
                )}
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Working Hours
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Regular Hours *
                </label>
                <input
                  type="number"
                  value={regularHours}
                  onChange={(e) => setRegularHours(Number(e.target.value))}
                  min="0"
                  max="240"
                  className="w-full p-3 glass-input rounded-lg"
                  placeholder="176"
                />
                <p className="text-xs text-gray-400 mt-1">Standard: 176 hours/month</p>
                {errors.regularHours && (
                  <p className="text-red-400 text-sm mt-1">{errors.regularHours}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Overtime Hours
                </label>
                <input
                  type="number"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(Number(e.target.value))}
                  min="0"
                  max="100"
                  className="w-full p-3 glass-input rounded-lg"
                  placeholder="0"
                />
                <p className="text-xs text-gray-400 mt-1">Max: 2 hours/day (UAE compliance)</p>
                {errors.overtimeHours && (
                  <p className="text-red-400 text-sm mt-1">{errors.overtimeHours}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Compensation */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Additional Compensation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Commission Amount
                </label>
                <input
                  type="number"
                  value={commissionAmount}
                  onChange={(e) => setCommissionAmount(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full p-3 glass-input rounded-lg"
                  placeholder="0.00"
                />
                {errors.commissionAmount && (
                  <p className="text-red-400 text-sm mt-1">{errors.commissionAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bonus Amount
                </label>
                <input
                  type="number"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full p-3 glass-input rounded-lg"
                  placeholder="0.00"
                />
                {errors.bonusAmount && (
                  <p className="text-red-400 text-sm mt-1">{errors.bonusAmount}</p>
                )}
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Deductions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Advance Salary Deduction
                </label>
                <input
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full p-3 glass-input rounded-lg"
                  placeholder="0.00"
                />
                {errors.advanceAmount && (
                  <p className="text-red-400 text-sm mt-1">{errors.advanceAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Leave Deduction
                </label>
                <input
                  type="number"
                  value={leaveDeduction}
                  onChange={(e) => setLeaveDeduction(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full p-3 glass-input rounded-lg"
                  placeholder="0.00"
                />
                {errors.leaveDeduction && (
                  <p className="text-red-400 text-sm mt-1">{errors.leaveDeduction}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePreview}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
              disabled={!selectedEmployee || !selectedStructure || loading}
            >
              <Eye className="w-4 h-4" />
              Preview Calculation
            </button>
            <button
              onClick={() => {
                setSelectedEmployee('');
                setSelectedStructure('');
                setRegularHours(176);
                setOvertimeHours(0);
                setCommissionAmount(0);
                setBonusAmount(0);
                setAdvanceAmount(0);
                setLeaveDeduction(0);
                setPreview(null);
                setShowPreview(false);
                setErrors({});
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          {/* Employee Info */}
          {selectedEmployeeData && selectedStructureData && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Employee Summary</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="text-white font-medium">
                    {selectedEmployeeData.first_name} {selectedEmployeeData.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Job Title</p>
                  <p className="text-white">{selectedEmployeeData.job_title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Base Salary</p>
                  <p className="text-white font-semibold">
                    {formatAED(selectedStructureData.base_salary_aed)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Hourly Rate</p>
                  <p className="text-white">
                    {formatAED(selectedStructureData.hourly_rate_aed)}/hour
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Calculation Preview */}
          {showPreview && preview && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Calculation Preview</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Salary</span>
                  <span className="text-white">{formatAED(preview.base_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Overtime ({preview.overtime_hours}h)</span>
                  <span className="text-blue-400">{formatAED(preview.overtime_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Commission</span>
                  <span className="text-green-400">{formatAED(preview.commission_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bonus</span>
                  <span className="text-purple-400">{formatAED(preview.bonus_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Allowances</span>
                  <span className="text-orange-400">{formatAED(preview.allowances_amount)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-white font-medium">Gross Salary</span>
                    <span className="text-white font-bold">{formatAED(preview.gross_salary)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Net Salary</span>
                  <span className="text-green-400 font-bold text-lg">{formatAED(preview.net_salary)}</span>
                </div>
              </div>

              {/* Compliance Issues */}
              {preview.uae_compliance_issues.length > 0 && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-medium">UAE Compliance Issues</span>
                  </div>
                  <ul className="text-sm text-red-300 space-y-1">
                    {preview.uae_compliance_issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {preview.warnings.length > 0 && (
                <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span className="text-orange-400 font-medium">Warnings</span>
                  </div>
                  <ul className="text-sm text-orange-300 space-y-1">
                    {preview.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                className="w-full btn-success mt-4 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Calculation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndividualCalculation;