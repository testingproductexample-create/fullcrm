import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommission, Employee, CommissionStructure } from '../context/CommissionContext';
import { Settings as SettingsIcon, User, Target, TrendingUp, Calculator, Save, Plus, Edit, Trash2, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';

interface EmployeeCommissionSettings {
  id: string;
  employeeId: string;
  commissionRate: number;
  targetAmount: number;
  bonusThreshold: number;
  bonusRate: number;
  tierRates: { min: number; max: number; rate: number }[];
  minQualifyingAmount: number;
  paymentFrequency: 'monthly' | 'quarterly' | 'yearly';
  isActive: boolean;
}

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useCommission();
  const [activeTab, setActiveTab] = useState('employees');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCalculationEngine, setShowCalculationEngine] = useState(false);
  const [calculationResults, setCalculationResults] = useState<any>(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    department: 'Sales',
    position: 'Sales Representative',
    baseSalary: 10000,
    hireDate: new Date().toISOString().split('T')[0]
  });

  // Enhanced employee commission settings
  const [employeeSettings, setEmployeeSettings] = useState<{ [key: string]: EmployeeCommissionSettings }>({
    '1': {
      id: '1',
      employeeId: '1',
      commissionRate: 5,
      targetAmount: 100000,
      bonusThreshold: 150000,
      bonusRate: 2,
      tierRates: [
        { min: 0, max: 50000, rate: 3 },
        { min: 50000, max: 100000, rate: 5 },
        { min: 100000, max: 200000, rate: 7 },
        { min: 200000, max: Infinity, rate: 10 }
      ],
      minQualifyingAmount: 1000,
      paymentFrequency: 'monthly',
      isActive: true
    },
    '2': {
      id: '2',
      employeeId: '2',
      commissionRate: 4,
      targetAmount: 80000,
      bonusThreshold: 120000,
      bonusRate: 1.5,
      tierRates: [
        { min: 0, max: 40000, rate: 2.5 },
        { min: 40000, max: 80000, rate: 4 },
        { min: 80000, max: 150000, rate: 6 },
        { min: 150000, max: Infinity, rate: 8 }
      ],
      minQualifyingAmount: 800,
      paymentFrequency: 'monthly',
      isActive: true
    }
  });

  // Commission calculation engine
  const calculateCommission = (saleAmount: number, settings: EmployeeCommissionSettings, totalSales: number = 0) => {
    let baseCommission = 0;
    let bonusCommission = 0;
    let tierCommission = 0;

    // Base commission calculation
    baseCommission = (saleAmount * settings.commissionRate) / 100;

    // Bonus calculation (based on total monthly sales)
    if (totalSales >= settings.bonusThreshold) {
      bonusCommission = (saleAmount * settings.bonusRate) / 100;
    }

    // Tiered commission calculation
    if (settings.tierRates && settings.tierRates.length > 0) {
      const applicableTier = settings.tierRates.find(tier => 
        saleAmount >= tier.min && saleAmount <= tier.max
      );
      if (applicableTier) {
        tierCommission = (saleAmount * applicableTier.rate) / 100;
      } else {
        // Use the highest tier for amounts above max
        const highestTier = settings.tierRates[settings.tierRates.length - 1];
        if (saleAmount > highestTier.max) {
          tierCommission = (saleAmount * highestTier.rate) / 100;
        }
      }
    }

    const totalCommission = Math.max(baseCommission, tierCommission) + bonusCommission;
    
    return {
      baseCommission,
      bonusCommission,
      tierCommission,
      totalCommission,
      totalCommissionRate: (totalCommission / saleAmount) * 100
    };
  };

  // Calculate employee performance metrics
  const getEmployeeMetrics = (employee: Employee) => {
    const employeeSales = state.salesData.filter(sale => sale.employeeId === employee.id);
    const settings = employeeSettings[employee.id];
    
    if (!settings) return null;

    const currentMonthSales = employeeSales.filter(sale => {
      const saleDate = new Date(sale.date);
      const now = new Date();
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    });

    const totalCurrentMonthSales = currentMonthSales.reduce((sum, sale) => sum + sale.saleAmount, 0);
    const totalCurrentCommissions = currentMonthSales.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0);

    const achievement = (totalCurrentMonthSales / settings.targetAmount) * 100;
    const qualificationStatus = totalCurrentMonthSales >= settings.minQualifyingAmount ? 'qualified' : 'not_qualified';

    return {
      currentMonthSales: totalCurrentMonthSales,
      currentMonthCommissions: totalCurrentCommissions,
      achievement: achievement,
      qualificationStatus,
      totalSales: employeeSales.reduce((sum, sale) => sum + sale.saleAmount, 0),
      totalCommissions: employeeSales.reduce((sum, sale) => sum + (sale.commissionAmount || 0), 0),
      salesCount: employeeSales.length
    };
  };

  // Run calculation engine
  const runCalculationEngine = () => {
    const results = state.employees.map(employee => {
      const settings = employeeSettings[employee.id];
      if (!settings) return null;

      const metrics = getEmployeeMetrics(employee);
      if (!metrics) return null;

      // Calculate projected monthly commission
      const projectedCommission = metrics.currentMonthCommissions;
      
      // Calculate bonus eligibility
      const bonusEligible = metrics.achievement >= 100;
      
      // Calculate next tier advancement
      const currentTier = settings.tierRates.findIndex(tier => 
        metrics.currentMonthSales >= tier.min && metrics.currentMonthSales < tier.max
      );
      const nextTier = currentTier < settings.tierRates.length - 1 ? settings.tierRates[currentTier + 1] : null;
      const progressToNextTier = nextTier ? 
        ((metrics.currentMonthSales - (nextTier.min - 1)) / (nextTier.max - (nextTier.min - 1))) * 100 : 100;

      return {
        employee,
        settings,
        metrics,
        projectedCommission,
        bonusEligible,
        currentTier,
        nextTier,
        progressToNextTier
      };
    }).filter(Boolean);

    setCalculationResults(results);
  };

  const handleAddEmployee = () => {
    const employee: Employee = {
      id: Date.now().toString(),
      name: newEmployee.name,
      email: newEmployee.email,
      department: newEmployee.department,
      position: newEmployee.position,
      baseSalary: newEmployee.baseSalary,
      hireDate: newEmployee.hireDate
    };

    dispatch({ type: 'ADD_EMPLOYEE', payload: employee });
    
    // Initialize default commission settings for new employee
    setEmployeeSettings(prev => ({
      ...prev,
      [employee.id]: {
        id: employee.id,
        employeeId: employee.id,
        commissionRate: 5,
        targetAmount: 100000,
        bonusThreshold: 150000,
        bonusRate: 2,
        tierRates: [
          { min: 0, max: 50000, rate: 3 },
          { min: 50000, max: 100000, rate: 5 },
          { min: 100000, max: 200000, rate: 7 },
          { min: 200000, max: Infinity, rate: 10 }
        ],
        minQualifyingAmount: 1000,
        paymentFrequency: 'monthly',
        isActive: true
      }
    }));

    setShowAddForm(false);
    setNewEmployee({
      name: '',
      email: '',
      department: 'Sales',
      position: 'Sales Representative',
      baseSalary: 10000,
      hireDate: new Date().toISOString().split('T')[0]
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getAchievementColor = (achievement: number) => {
    if (achievement >= 100) return 'text-green-600';
    if (achievement >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAchievementBg = (achievement: number) => {
    if (achievement >= 100) return 'bg-green-500';
    if (achievement >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('settings.title')}</h2>
            <p className="text-gray-600">Configure performance-based compensation and commission calculation rules</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCalculationEngine(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Calculator className="w-4 h-4" />
              <span>Calculation Engine</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>{t('settings.addEmployee')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 shadow-lg">
        <div className="flex border-b border-white/20">
          {[
            { id: 'employees', label: 'Employee Settings', icon: User },
            { id: 'structures', label: 'Commission Structures', icon: Target },
            { id: 'calculations', label: 'Calculation Rules', icon: Calculator }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white/30 text-gray-800 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Employee Settings Tab */}
          {activeTab === 'employees' && (
            <div className="space-y-6">
              {state.employees.map((employee) => {
                const metrics = getEmployeeMetrics(employee);
                const settings = employeeSettings[employee.id];
                
                if (!metrics || !settings) return null;

                return (
                  <div key={employee.id} className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{employee.name}</h3>
                          <p className="text-sm text-gray-600">{employee.position} - {employee.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          settings.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {settings.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => setSelectedEmployee(employee)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white/30 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="w-4 h-4 text-blue-600" />
                          <p className="text-sm text-gray-600">Achievement</p>
                        </div>
                        <p className={`text-2xl font-bold ${getAchievementColor(metrics.achievement)}`}>
                          {metrics.achievement.toFixed(1)}%
                        </p>
                        <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                          <div
                            className={`h-2 rounded-full ${getAchievementBg(metrics.achievement)}`}
                            style={{ width: `${Math.min(metrics.achievement, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="bg-white/30 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <p className="text-sm text-gray-600">This Month</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(metrics.currentMonthCommissions)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(metrics.currentMonthSales)} sales
                        </p>
                      </div>

                      <div className="bg-white/30 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                          <p className="text-sm text-gray-600">Target</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">
                          {formatCurrency(settings.targetAmount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(settings.targetAmount - metrics.currentMonthSales)} remaining
                        </p>
                      </div>

                      <div className="bg-white/30 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          {metrics.qualificationStatus === 'qualified' ? 
                            <CheckCircle className="w-4 h-4 text-green-600" /> : 
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                          }
                          <p className="text-sm text-gray-600">Status</p>
                        </div>
                        <p className={`text-lg font-semibold ${
                          metrics.qualificationStatus === 'qualified' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {metrics.qualificationStatus === 'qualified' ? 'Qualified' : 'Not Qualified'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Min: {formatCurrency(settings.minQualifyingAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Commission Structure Details */}
                    <div className="bg-white/20 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Commission Structure</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Base Rate</p>
                          <p className="text-lg font-semibold text-gray-800">{settings.commissionRate}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Bonus Threshold</p>
                          <p className="text-lg font-semibold text-gray-800">{formatCurrency(settings.bonusThreshold)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Bonus Rate</p>
                          <p className="text-lg font-semibold text-gray-800">{settings.bonusRate}%</p>
                        </div>
                      </div>
                      
                      {settings.tierRates && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">Tier Structure</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {settings.tierRates.map((tier, index) => (
                              <div key={index} className="bg-white/30 rounded-lg p-2">
                                <p className="text-xs text-gray-600">
                                  {formatCurrency(tier.min)} - {tier.max === Infinity ? '∞' : formatCurrency(tier.max)}
                                </p>
                                <p className="text-sm font-semibold text-gray-800">{tier.rate}%</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Commission Structures Tab */}
          {activeTab === 'structures' && (
            <div className="space-y-4">
              {state.commissionStructures.map((structure) => (
                <div key={structure.id} className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{structure.name}</h3>
                      <p className="text-sm text-gray-600">Type: {structure.type} • Base Rate: {structure.baseRate}%</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      structure.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {structure.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {structure.tierRates && (
                    <div className="bg-white/20 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Tier Structure</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {structure.tierRates.map((tier, index) => (
                          <div key={index} className="bg-white/30 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-1">
                              {formatCurrency(tier.min)} - {tier.max === Infinity ? '∞' : formatCurrency(tier.max)}
                            </p>
                            <p className="text-lg font-bold text-blue-600">{tier.rate}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Calculation Rules Tab */}
          {activeTab === 'calculations' && (
            <div className="space-y-6">
              <div className="text-center">
                <button
                  onClick={runCalculationEngine}
                  className="flex items-center space-x-2 mx-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Run Calculation Engine</span>
                </button>
              </div>

              {calculationResults && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Calculation Results</h3>
                  {calculationResults.map((result: any) => (
                    <div key={result.employee.id} className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-800">{result.employee.name}</h4>
                        <div className="flex items-center space-x-2">
                          {result.bonusEligible && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Bonus Eligible</span>
                          )}
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Tier {result.currentTier + 1}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/30 rounded-xl p-4">
                          <p className="text-sm text-gray-600">Projected Commission</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(result.projectedCommission)}
                          </p>
                        </div>
                        <div className="bg-white/30 rounded-xl p-4">
                          <p className="text-sm text-gray-600">Achievement</p>
                          <p className="text-xl font-bold text-blue-600">
                            {result.metrics.achievement.toFixed(1)}%
                          </p>
                        </div>
                        <div className="bg-white/30 rounded-xl p-4">
                          <p className="text-sm text-gray-600">Next Tier Progress</p>
                          <p className="text-xl font-bold text-purple-600">
                            {result.progressToNextTier.toFixed(1)}%
                          </p>
                          <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                            <div
                              className="h-2 bg-purple-500 rounded-full"
                              style={{ width: `${Math.min(result.progressToNextTier, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddForm && (
        <AddEmployeeModal
          newEmployee={newEmployee}
          setNewEmployee={setNewEmployee}
          onAdd={handleAddEmployee}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Edit Employee Modal */}
      {selectedEmployee && (
        <EmployeeEditModal
          employee={selectedEmployee}
          settings={employeeSettings[selectedEmployee.id]}
          onClose={() => setSelectedEmployee(null)}
          onSave={(settings) => {
            setEmployeeSettings(prev => ({
              ...prev,
              [selectedEmployee.id]: { ...prev[selectedEmployee.id], ...settings }
            }));
            setSelectedEmployee(null);
          }}
        />
      )}

      {/* Calculation Engine Modal */}
      {showCalculationEngine && (
        <CalculationEngineModal
          onClose={() => setShowCalculationEngine(false)}
          onRun={runCalculationEngine}
          results={calculationResults}
        />
      )}
    </div>
  );
};

// Add Employee Modal Component
interface AddEmployeeModalProps {
  newEmployee: any;
  setNewEmployee: (employee: any) => void;
  onAdd: () => void;
  onClose: () => void;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ newEmployee, setNewEmployee, onAdd, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-xl bg-white/90 rounded-2xl border border-white/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Add New Employee</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={newEmployee.department}
                  onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Business Development">Business Development</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary (AED)</label>
                <input
                  type="number"
                  value={newEmployee.baseSalary}
                  onChange={(e) => setNewEmployee({ ...newEmployee, baseSalary: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                <input
                  type="date"
                  value={newEmployee.hireDate}
                  onChange={(e) => setNewEmployee({ ...newEmployee, hireDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={onAdd}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Employee Edit Modal Component
interface EmployeeEditModalProps {
  employee: Employee;
  settings: EmployeeCommissionSettings;
  onClose: () => void;
  onSave: (settings: Partial<EmployeeCommissionSettings>) => void;
}

const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({ employee, settings, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    commissionRate: settings?.commissionRate || 5,
    targetAmount: settings?.targetAmount || 100000,
    bonusThreshold: settings?.bonusThreshold || 150000,
    bonusRate: settings?.bonusRate || 2,
    isActive: settings?.isActive || true
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-xl bg-white/90 rounded-2xl border border-white/30 shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Edit Employee Settings</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.commissionRate')}</label>
              <input
                type="number"
                step="0.1"
                value={formData.commissionRate}
                onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.targetAmount')}</label>
              <input
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Threshold</label>
              <input
                type="number"
                value={formData.bonusThreshold}
                onChange={(e) => setFormData({ ...formData, bonusThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.bonusRate}
                onChange={(e) => setFormData({ ...formData, bonusRate: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-white/50 border border-white/30 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-white/30"
              />
              <label htmlFor="editActive" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Calculation Engine Modal Component
interface CalculationEngineModalProps {
  onClose: () => void;
  onRun: () => void;
  results: any;
}

const CalculationEngineModal: React.FC<CalculationEngineModalProps> = ({ onClose, onRun, results }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-xl bg-white/90 rounded-2xl border border-white/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Commission Calculation Engine</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              Run advanced commission calculations with real-time analytics and performance projections
            </p>
            <button
              onClick={onRun}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Run Calculation Engine
            </button>
          </div>

          {results && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">Calculation Results</h4>
              {results.map((result: any) => (
                <div key={result.employee.id} className="bg-white/20 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-semibold text-gray-800">{result.employee.name}</h5>
                    <div className="flex space-x-2">
                      {result.bonusEligible && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Bonus Eligible</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Projected Commission</p>
                      <p className="font-semibold">{new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(result.projectedCommission)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Achievement</p>
                      <p className="font-semibold">{result.metrics.achievement.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Next Tier Progress</p>
                      <p className="font-semibold">{result.progressToNextTier.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;