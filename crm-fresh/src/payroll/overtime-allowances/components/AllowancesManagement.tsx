import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { OvertimeAllowancesService } from '../service';
import { formatCurrency } from '../uaeCompliantCalculator';
import { AllowanceRecord } from '../types';
import { 
  DollarSign, 
  Plus, 
  Home, 
  Car, 
  Coffee, 
  Phone, 
  Heart,
  MoreHorizontal,
  Edit,
  Trash2,
  Search,
  Filter,
  TrendingUp
} from 'lucide-react';

interface AllowancesManagementProps {
  onDataChange: () => void;
}

export const AllowancesManagement: React.FC<AllowancesManagementProps> = ({ onDataChange }) => {
  const [allowanceRecords, setAllowanceRecords] = useState<AllowanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: 'all',
    department: 'all',
    status: 'all',
    search: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AllowanceRecord | null>(null);

  useEffect(() => {
    loadAllowanceRecords();
  }, [filter]);

  const loadAllowanceRecords = async () => {
    try {
      setLoading(true);
      const records = await OvertimeAllowancesService.getAllowanceRecords();
      
      let filteredRecords = records;
      
      if (filter.type !== 'all') {
        filteredRecords = filteredRecords.filter(r => r.allowanceType === filter.type);
      }
      
      if (filter.department !== 'all') {
        filteredRecords = filteredRecords.filter(r => r.department === filter.department);
      }
      
      if (filter.status !== 'all') {
        filteredRecords = filteredRecords.filter(r => r.status === filter.status);
      }
      
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredRecords = filteredRecords.filter(r => 
          r.employeeName.toLowerCase().includes(searchLower) ||
          r.department.toLowerCase().includes(searchLower) ||
          r.allowanceType.toLowerCase().includes(searchLower)
        );
      }
      
      setAllowanceRecords(filteredRecords);
    } catch (error) {
      console.error('Error loading allowance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAllowanceIcon = (type: AllowanceRecord['allowanceType']) => {
    const iconMap = {
      housing: <Home className="w-5 h-5" />,
      transport: <Car className="w-5 h-5" />,
      meal: <Coffee className="w-5 h-5" />,
      medical: <Heart className="w-5 h-5" />,
      phone: <Phone className="w-5 h-5" />,
      other: <MoreHorizontal className="w-5 h-5" />
    };
    return iconMap[type] || <MoreHorizontal className="w-5 h-5" />;
  };

  const getAllowanceColor = (type: AllowanceRecord['allowanceType']) => {
    const colorMap = {
      housing: 'text-blue-600 bg-blue-100',
      transport: 'text-emerald-600 bg-emerald-100',
      meal: 'text-amber-600 bg-amber-100',
      medical: 'text-red-600 bg-red-100',
      phone: 'text-purple-600 bg-purple-100',
      other: 'text-gray-600 bg-gray-100'
    };
    return colorMap[type] || 'text-gray-600 bg-gray-100';
  };

  const getStatusBadge = (status: AllowanceRecord['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Calculate totals by type
  const typeTotals = allowanceRecords.reduce((acc, record) => {
    if (record.status === 'active') {
      acc[record.allowanceType] = (acc[record.allowanceType] || 0) + record.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const departments = Array.from(new Set(allowanceRecords.map(r => r.department)));
  const totalAmount = allowanceRecords
    .filter(r => r.status === 'active')
    .reduce((sum, r) => sum + r.amount, 0);
  const activeEmployees = new Set(allowanceRecords.filter(r => r.status === 'active').map(r => r.employeeId)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-600">Total Allowances</p>
                <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Active Employees</p>
                <p className="text-xl font-bold">{activeEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Home className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Housing</p>
                <p className="text-xl font-bold">
                  {formatCurrency(typeTotals.housing || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Car className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-600">Transport</p>
                <p className="text-xl font-bold">
                  {formatCurrency(typeTotals.transport || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type Distribution */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-gray-900">Allowance Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(typeTotals).map(([type, amount]) => (
              <div key={type} className="p-4 rounded-lg bg-white/50 border border-gray-200 text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${getAllowanceColor(type as AllowanceRecord['allowanceType'])}`}>
                  {getAllowanceIcon(type as AllowanceRecord['allowanceType'])}
                </div>
                <p className="text-sm font-medium text-gray-900 capitalize">{type}</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(amount)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              />
            </div>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            >
              <option value="all">All Types</option>
              <option value="housing">Housing</option>
              <option value="transport">Transport</option>
              <option value="meal">Meal</option>
              <option value="medical">Medical</option>
              <option value="phone">Phone</option>
              <option value="other">Other</option>
            </select>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              value={filter.department}
              onChange={(e) => setFilter({ ...filter, department: e.target.value })}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Allowance Records Table */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900">Employee Allowances</CardTitle>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Allowance
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Payment</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Effective Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allowanceRecords.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-white/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{record.employeeName}</p>
                        <p className="text-sm text-gray-600">{record.department}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getAllowanceColor(record.allowanceType)}`}>
                          {getAllowanceIcon(record.allowanceType)}
                        </div>
                        <span className="font-medium capitalize text-gray-900">{record.allowanceType}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{formatCurrency(record.amount)}</p>
                      <p className="text-sm text-gray-600">{record.currency}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant="outline"
                        className={record.paymentType === 'fixed' ? 'border-green-200 text-green-800' : 'border-blue-200 text-blue-800'}
                      >
                        {record.paymentType === 'fixed' ? 'Fixed' : 'Variable'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-900">{record.effectiveDate}</p>
                      {record.endDate && (
                        <p className="text-sm text-gray-600">to {record.endDate}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {allowanceRecords.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No allowance records found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};