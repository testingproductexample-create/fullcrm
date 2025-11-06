import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { OvertimeAllowancesService } from '../service';
import { EmployeeAllowanceConfig, UAELaborLawCompliance } from '../types';
import { formatCurrency, UAE_LABOR_LAW, UAEOvertimeCalculator } from '../uaeCompliantCalculator';
import { 
  Settings, 
  Save, 
  User, 
  Building, 
  DollarSign, 
  Clock,
  Home, 
  Car, 
  Coffee, 
  Heart, 
  Phone,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

interface ConfigurationPanelProps {
  onDataChange: () => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ onDataChange }) => {
  const [configs, setConfigs] = useState<EmployeeAllowanceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'configs' | 'rates' | 'compliance'>('configs');
  const [selectedConfig, setSelectedConfig] = useState<EmployeeAllowanceConfig | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedConfig, setEditedConfig] = useState<EmployeeAllowanceConfig | null>(null);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const configData = await OvertimeAllowancesService.getEmployeeConfigs();
      setConfigs(configData);
    } catch (error) {
      console.error('Error loading configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!editedConfig) return;

    try {
      await OvertimeAllowancesService.updateEmployeeConfig(editedConfig.id, editedConfig);
      await loadConfigurations();
      setShowEditModal(false);
      setSelectedConfig(null);
      setEditedConfig(null);
      onDataChange();
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  const getAllowanceIcon = (type: string) => {
    const iconMap = {
      housing: <Home className="w-4 h-4" />,
      transport: <Car className="w-4 h-4" />,
      meal: <Coffee className="w-4 h-4" />,
      medical: <Heart className="w-4 h-4" />,
      phone: <Phone className="w-4 h-4" />
    };
    return iconMap[type as keyof typeof iconMap] || <DollarSign className="w-4 h-4" />;
  };

  const getEmployeeTypeBadge = (type: EmployeeAllowanceConfig['employeeType']) => {
    const colors = {
      full_time: 'bg-blue-100 text-blue-800',
      part_time: 'bg-green-100 text-green-800',
      contractor: 'bg-purple-100 text-purple-800',
      intern: 'bg-amber-100 text-amber-800'
    };
    return (
      <Badge className={colors[type]}>
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getOvertimeRateColor = (multiplier: number) => {
    if (multiplier >= 2.0) return 'text-red-600';
    if (multiplier >= 1.5) return 'text-orange-600';
    if (multiplier >= 1.25) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Configuration Panel
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure employee allowances and overtime rates according to UAE labor law
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/50 p-1 rounded-lg">
        {[
          { key: 'configs', label: 'Employee Configs', icon: <User className="w-4 h-4" /> },
          { key: 'rates', label: 'Overtime Rates', icon: <Clock className="w-4 h-4" /> },
          { key: 'compliance', label: 'UAE Compliance', icon: <CheckCircle className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.key 
                ? 'bg-white shadow-sm text-gray-900' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Employee Configurations Tab */}
      {activeTab === 'configs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {configs.map((config) => (
              <Card key={config.id} className="glass-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{config.position}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Building className="w-3 h-3 mr-1" />
                        {config.department} • {formatCurrency(config.baseSalary)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getEmployeeTypeBadge(config.employeeType)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedConfig(config);
                          setEditedConfig({ ...config });
                          setShowEditModal(true);
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  {/* Allowances */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Allowances</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {Object.entries(config.allowances).map(([type, amount]) => (
                        <div key={type} className="p-3 rounded-lg bg-white/50 border border-gray-200">
                          <div className="flex items-center space-x-2 mb-1">
                            {getAllowanceIcon(type)}
                            <span className="text-xs font-medium text-gray-600 capitalize">{type}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Overtime Rates */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Overtime Rates (UAE Compliant)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(config.overtimeRates).map(([type, rate]) => (
                        <div key={type} className="p-3 rounded-lg bg-white/50 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600 capitalize">{type}</span>
                            <span className={`text-sm font-semibold ${getOvertimeRateColor(rate)}`}>
                              {rate}x
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Overtime Rates Tab */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          {/* UAE Standard Rates */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-gray-900">UAE Labor Law Overtime Rates</CardTitle>
              <p className="text-sm text-gray-600">
                Mandatory overtime rates as per UAE Federal Law No. 33 of 2021
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800">Weekday Overtime</h4>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600 mb-1">1.25x</p>
                  <p className="text-sm text-yellow-700">25% premium on base rate</p>
                </div>
                
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <h4 className="font-medium text-orange-800">Weekend Overtime</h4>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 mb-1">1.5x</p>
                  <p className="text-sm text-orange-700">50% premium on base rate</p>
                </div>
                
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <Clock className="w-5 h-5 text-red-600" />
                    <h4 className="font-medium text-red-800">Holiday Overtime</h4>
                  </div>
                  <p className="text-2xl font-bold text-red-600 mb-1">2.0x</p>
                  <p className="text-sm text-red-700">100% premium on base rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rate Configuration */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-gray-900">Current Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Employee Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Weekday</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Weekend</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Holiday</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Night</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configs.map((config) => (
                      <tr key={config.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          {getEmployeeTypeBadge(config.employeeType)}
                        </td>
                        <td className="py-3 px-4 text-gray-900">{config.department}</td>
                        <td className={`py-3 px-4 font-medium ${getOvertimeRateColor(config.overtimeRates.weekday)}`}>
                          {config.overtimeRates.weekday}x
                        </td>
                        <td className={`py-3 px-4 font-medium ${getOvertimeRateColor(config.overtimeRates.weekend)}`}>
                          {config.overtimeRates.weekend}x
                        </td>
                        <td className={`py-3 px-4 font-medium ${getOvertimeRateColor(config.overtimeRates.holiday)}`}>
                          {config.overtimeRates.holiday}x
                        </td>
                        <td className={`py-3 px-4 font-medium ${getOvertimeRateColor(config.overtimeRates.night)}`}>
                          {config.overtimeRates.night}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {/* UAE Labor Law Compliance */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                UAE Labor Law Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Working Hours Limits</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                      <span className="text-sm text-gray-700">Max Daily Working Hours</span>
                      <span className="font-medium text-green-700">{UAE_LABOR_LAW.maxWorkingHours} hours</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                      <span className="text-sm text-gray-700">Max Daily Overtime</span>
                      <span className="font-medium text-green-700">{UAE_LABOR_LAW.maxOvertimeHours} hours</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                      <span className="text-sm text-gray-700">Working Days (per week)</span>
                      <span className="font-medium text-green-700">5 days (Sun-Thu)</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Employee Benefits</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <span className="text-sm text-gray-700">Annual Leave</span>
                      <span className="font-medium text-blue-700">{UAE_LABOR_LAW.annualLeave} days</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <span className="text-sm text-gray-700">Sick Leave (with certificate)</span>
                      <span className="font-medium text-blue-700">{UAE_LABOR_LAW.sickLeave} days</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <span className="text-sm text-gray-700">End of Service (min 1 year)</span>
                      <span className="font-medium text-blue-700">{UAE_LABOR_LAW.gratuityCalculation} days salary</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Warnings */}
          <Card className="glass-card border-0 border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-amber-800 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Important Compliance Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Maximum Overtime Hours</p>
                    <p className="text-sm text-amber-700">
                      Employees cannot work more than 2 hours of overtime per day, as per UAE Labor Law Article 67.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Overtime Authorization</p>
                    <p className="text-sm text-amber-700">
                      All overtime must be pre-approved by the employee's direct supervisor or manager.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Holiday Pay</p>
                    <p className="text-sm text-amber-700">
                      Public holidays in UAE must be paid at 200% of the regular rate if worked.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Configuration Modal */}
      {showEditModal && editedConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Configuration - {selectedConfig?.position}
            </h3>
            
            <div className="space-y-4">
              {/* Base Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Salary (AED)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editedConfig.baseSalary}
                  onChange={(e) => setEditedConfig({
                    ...editedConfig,
                    baseSalary: Number(e.target.value)
                  })}
                />
              </div>

              {/* Allowances */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Allowances (AED)</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(editedConfig.allowances).map(([type, amount]) => (
                    <div key={type}>
                      <label className="block text-xs font-medium text-gray-600 capitalize mb-1">
                        {type}
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={amount}
                        onChange={(e) => setEditedConfig({
                          ...editedConfig,
                          allowances: {
                            ...editedConfig.allowances,
                            [type]: Number(e.target.value)
                          }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Overtime Rates */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Overtime Rates</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(editedConfig.overtimeRates).map(([type, rate]) => (
                    <div key={type}>
                      <label className="block text-xs font-medium text-gray-600 capitalize mb-1">
                        {type} Rate
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={rate}
                        onChange={(e) => setEditedConfig({
                          ...editedConfig,
                          overtimeRates: {
                            ...editedConfig.overtimeRates,
                            [type]: Number(e.target.value)
                          }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button
                onClick={handleSaveConfig}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedConfig(null);
                  setEditedConfig(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};