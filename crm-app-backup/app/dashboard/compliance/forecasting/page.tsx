'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  AlertTriangle,
  Shield,
  Target,
  DollarSign,
  Calendar,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import type { FinancialForecasting, FinancialRiskAssessment } from '@/types/database';

interface ForecastingStats {
  totalForecasts: number;
  averageConfidence: number;
  projectedRevenue: number;
  projectedExpenses: number;
  activeRisks: number;
}

export default function ForecastingRiskPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [forecasts, setForecasts] = useState<FinancialForecasting[]>([]);
  const [risks, setRisks] = useState<FinancialRiskAssessment[]>([]);
  const [stats, setStats] = useState<ForecastingStats>({
    totalForecasts: 0,
    averageConfidence: 0,
    projectedRevenue: 0,
    projectedExpenses: 0,
    activeRisks: 0
  });
  const [activeTab, setActiveTab] = useState<'forecasting' | 'risks'>('forecasting');
  const [filterType, setFilterType] = useState<string>('');
  const [filterPeriod, setFilterPeriod] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalType, setModalType] = useState<'forecast' | 'risk'>('forecast');
  const [newForecast, setNewForecast] = useState({
    forecast_type: '',
    forecast_period: '',
    revenue_projection_aed: '',
    expense_projection_aed: '',
    confidence_level: '',
    assumptions: ''
  });
  const [newRisk, setNewRisk] = useState({
    risk_type: '',
    risk_level: '',
    description: '',
    mitigation_plan: '',
    assessment_date: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      loadForecastingData();
    }
  }, [profile]);

  const loadForecastingData = async () => {
    try {
      setLoading(true);

      if (!profile?.organization_id) return;

      // Load forecasts
      const { data: forecasts, error: forecastError } = await supabase
        .from('financial_forecasting')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (forecastError) throw forecastError;

      // Load risks
      const { data: risks, error: riskError } = await supabase
        .from('financial_risk_assessment')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('assessment_date', { ascending: false });

      if (riskError) throw riskError;

      setForecasts(forecasts || []);
      setRisks(risks || []);

      // Calculate statistics
      const averageConfidence = forecasts?.length > 0 
        ? forecasts.reduce((sum, f) => sum + f.confidence_level, 0) / forecasts.length 
        : 0;
      
      const currentYearForecasts = forecasts?.filter(f => 
        f.forecast_period.includes('2025') && f.forecast_type === 'revenue') || [];
      const projectedRevenue = currentYearForecasts.reduce((sum, f) => sum + f.revenue_projection_aed, 0);
      
      const currentYearExpenses = forecasts?.filter(f => 
        f.forecast_period.includes('2025') && f.forecast_type === 'expense') || [];
      const projectedExpenses = currentYearExpenses.reduce((sum, f) => sum + f.expense_projection_aed, 0);
      
      const activeRisks = risks?.filter(r => r.status === 'active').length || 0;

      setStats({
        totalForecasts: forecasts?.length || 0,
        averageConfidence,
        projectedRevenue,
        projectedExpenses,
        activeRisks
      });

    } catch (error) {
      console.error('Error loading forecasting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createForecast = async () => {
    try {
      if (!profile?.organization_id || !newForecast.forecast_type) return;

      const { error } = await supabase
        .from('financial_forecasting')
        .insert({
          organization_id: profile.organization_id,
          forecast_type: newForecast.forecast_type,
          forecast_period: newForecast.forecast_period,
          revenue_projection_aed: parseFloat(newForecast.revenue_projection_aed) || 0,
          expense_projection_aed: parseFloat(newForecast.expense_projection_aed) || 0,
          confidence_level: parseFloat(newForecast.confidence_level) || 80,
          assumptions: newForecast.assumptions
        });

      if (error) throw error;

      setShowCreateModal(false);
      setNewForecast({
        forecast_type: '',
        forecast_period: '',
        revenue_projection_aed: '',
        expense_projection_aed: '',
        confidence_level: '',
        assumptions: ''
      });
      
      await loadForecastingData();
    } catch (error) {
      console.error('Error creating forecast:', error);
    }
  };

  const createRisk = async () => {
    try {
      if (!profile?.organization_id || !newRisk.risk_type) return;

      const { error } = await supabase
        .from('financial_risk_assessment')
        .insert({
          organization_id: profile.organization_id,
          risk_type: newRisk.risk_type,
          risk_level: newRisk.risk_level,
          description: newRisk.description,
          mitigation_plan: newRisk.mitigation_plan,
          assessment_date: newRisk.assessment_date,
          status: 'active'
        });

      if (error) throw error;

      setShowCreateModal(false);
      setNewRisk({
        risk_type: '',
        risk_level: '',
        description: '',
        mitigation_plan: '',
        assessment_date: ''
      });
      
      await loadForecastingData();
    } catch (error) {
      console.error('Error creating risk assessment:', error);
    }
  };

  const updateRiskStatus = async (riskId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('financial_risk_assessment')
        .update({ status })
        .eq('id', riskId);

      if (error) throw error;
      await loadForecastingData();
    } catch (error) {
      console.error('Error updating risk status:', error);
    }
  };

  const exportData = () => {
    if (activeTab === 'forecasting') {
      const csv = [
        ['Type', 'Period', 'Revenue Projection (AED)', 'Expense Projection (AED)', 'Confidence Level (%)', 'Assumptions'].join(','),
        ...filteredForecasts.map(forecast => [
          forecast.forecast_type,
          forecast.forecast_period,
          forecast.revenue_projection_aed,
          forecast.expense_projection_aed,
          forecast.confidence_level,
          forecast.assumptions || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-forecasts-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      const csv = [
        ['Type', 'Level', 'Description', 'Mitigation Plan', 'Assessment Date', 'Status'].join(','),
        ...filteredRisks.map(risk => [
          risk.risk_type,
          risk.risk_level,
          risk.description,
          risk.mitigation_plan || '',
          risk.assessment_date,
          risk.status
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `risk-assessments-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getRiskLevelBadge = (level: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      critical: { color: 'bg-red-500 text-white', icon: AlertTriangle },
      high: { color: 'bg-orange-500 text-white', icon: AlertTriangle },
      medium: { color: 'bg-yellow-500 text-white', icon: Shield },
      low: { color: 'bg-green-500 text-white', icon: Shield }
    };
    const badge = badges[level] || badges.medium;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  const getConfidenceBadge = (confidence: number) => {
    const color = confidence >= 80 ? 'bg-green-100 text-green-800' :
                 confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                 'bg-red-100 text-red-800';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {confidence}%
      </span>
    );
  };

  const openCreateModal = (type: 'forecast' | 'risk') => {
    setModalType(type);
    setShowCreateModal(true);
  };

  const filteredForecasts = forecasts.filter(forecast => {
    const matchesType = !filterType || forecast.forecast_type === filterType;
    const matchesPeriod = !filterPeriod || forecast.forecast_period.includes(filterPeriod);
    const matchesSearch = !searchQuery || 
      forecast.forecast_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      forecast.forecast_period.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesPeriod && matchesSearch;
  });

  const filteredRisks = risks.filter(risk => {
    const matchesType = !filterType || risk.risk_type === filterType;
    const matchesSearch = !searchQuery || 
      risk.risk_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      risk.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-neutral-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Financial Forecasting & Risk Analysis</h1>
            <p className="text-neutral-600">Predictive financial modeling and comprehensive risk assessment for strategic planning</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportData}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
            <button
              onClick={() => openCreateModal(activeTab === 'forecasting' ? 'forecast' : 'risk')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'forecasting' ? 'New Forecast' : 'New Risk Assessment'}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-neutral-500">Forecasts</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.totalForecasts}</h3>
            <p className="text-xs text-neutral-600">Financial projections</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs text-neutral-500">Confidence</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.averageConfidence.toFixed(1)}%</h3>
            <p className="text-xs text-neutral-600">Average confidence level</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs text-neutral-500">Revenue</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-neutral-900">{formatCurrency(stats.projectedRevenue)}</h3>
            <p className="text-xs text-neutral-600">2025 projection</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs text-neutral-500">Expenses</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-neutral-900">{formatCurrency(stats.projectedExpenses)}</h3>
            <p className="text-xs text-neutral-600">2025 projection</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs text-neutral-500">Active Risks</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.activeRisks}</h3>
            <p className="text-xs text-neutral-600">Requiring attention</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card p-1">
        <div className="flex bg-white/20 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('forecasting')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              activeTab === 'forecasting'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Financial Forecasting
          </button>
          <button
            onClick={() => setActiveTab('risks')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              activeTab === 'risks'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Risk Assessment
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-card p-6">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Filters:</span>
          </div>
          
          {activeTab === 'forecasting' ? (
            <>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-glass text-sm"
              >
                <option value="">All Types</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
                <option value="cash_flow">Cash Flow</option>
                <option value="budget">Budget</option>
              </select>

              <input
                type="text"
                placeholder="Filter by period (e.g., 2025-Q1)"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="input-glass text-sm w-48"
              />
            </>
          ) : (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-glass text-sm"
            >
              <option value="">All Risk Types</option>
              <option value="credit">Credit Risk</option>
              <option value="market">Market Risk</option>
              <option value="operational">Operational Risk</option>
              <option value="liquidity">Liquidity Risk</option>
              <option value="regulatory">Regulatory Risk</option>
            </select>
          )}

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder={activeTab === 'forecasting' ? 'Search forecasts...' : 'Search risks...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glass text-sm pl-9 w-full"
            />
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'forecasting' ? (
        /* Financial Forecasting Table */
        <div className="glass-card p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Type</th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-700">Period</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-700">Revenue Projection</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-700">Expense Projection</th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-700">Confidence</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Assumptions</th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredForecasts.length > 0 ? (
                  filteredForecasts.map((forecast) => (
                    <tr key={forecast.id} className="border-b border-white/10 hover:bg-white/10">
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {forecast.forecast_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm">{forecast.forecast_period}</td>
                      <td className="py-3 px-4 text-right font-medium text-green-600">
                        {formatCurrency(forecast.revenue_projection_aed)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-orange-600">
                        {formatCurrency(forecast.expense_projection_aed)}
                      </td>
                      <td className="py-3 px-4 text-center">{getConfidenceBadge(forecast.confidence_level)}</td>
                      <td className="py-3 px-4 text-sm max-w-xs truncate">
                        {forecast.assumptions || 'No assumptions provided'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1">
                          <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-green-600 hover:bg-green-100 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:bg-red-100 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No financial forecasts found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Risk Assessment Table */
        <div className="glass-card p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Risk Type</th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-700">Level</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Mitigation Plan</th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-700">Assessment Date</th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-700">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRisks.length > 0 ? (
                  filteredRisks.map((risk) => (
                    <tr key={risk.id} className="border-b border-white/10 hover:bg-white/10">
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          {risk.risk_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">{getRiskLevelBadge(risk.risk_level)}</td>
                      <td className="py-3 px-4 text-sm max-w-xs">
                        {risk.description}
                      </td>
                      <td className="py-3 px-4 text-sm max-w-xs">
                        {risk.mitigation_plan || 'No mitigation plan'}
                      </td>
                      <td className="py-3 px-4 text-center text-sm">{formatDate(risk.assessment_date)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          risk.status === 'active' ? 'bg-red-100 text-red-800' :
                          risk.status === 'mitigated' ? 'bg-green-100 text-green-800' :
                          risk.status === 'monitoring' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1">
                          <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          {risk.status === 'active' && (
                            <button 
                              onClick={() => updateRiskStatus(risk.id, 'mitigated')}
                              className="p-1 text-green-600 hover:bg-green-100 rounded" 
                              title="Mark as Mitigated"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          )}
                          <button className="p-1 text-orange-600 hover:bg-orange-100 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No risk assessments found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-card p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">
              {modalType === 'forecast' ? 'Create Financial Forecast' : 'Create Risk Assessment'}
            </h2>
            
            {modalType === 'forecast' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Forecast Type</label>
                  <select
                    value={newForecast.forecast_type}
                    onChange={(e) => setNewForecast({...newForecast, forecast_type: e.target.value})}
                    className="input-glass"
                  >
                    <option value="">Select type</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                    <option value="cash_flow">Cash Flow</option>
                    <option value="budget">Budget</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Forecast Period</label>
                  <input
                    type="text"
                    placeholder="e.g., 2025-Q1, 2025"
                    value={newForecast.forecast_period}
                    onChange={(e) => setNewForecast({...newForecast, forecast_period: e.target.value})}
                    className="input-glass"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Revenue Projection (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newForecast.revenue_projection_aed}
                    onChange={(e) => setNewForecast({...newForecast, revenue_projection_aed: e.target.value})}
                    className="input-glass"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Expense Projection (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newForecast.expense_projection_aed}
                    onChange={(e) => setNewForecast({...newForecast, expense_projection_aed: e.target.value})}
                    className="input-glass"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Confidence Level (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="80"
                    value={newForecast.confidence_level}
                    onChange={(e) => setNewForecast({...newForecast, confidence_level: e.target.value})}
                    className="input-glass"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Assumptions</label>
                  <textarea
                    rows={3}
                    placeholder="Key assumptions and factors considered in this forecast..."
                    value={newForecast.assumptions}
                    onChange={(e) => setNewForecast({...newForecast, assumptions: e.target.value})}
                    className="input-glass resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Risk Type</label>
                  <select
                    value={newRisk.risk_type}
                    onChange={(e) => setNewRisk({...newRisk, risk_type: e.target.value})}
                    className="input-glass"
                  >
                    <option value="">Select type</option>
                    <option value="credit">Credit Risk</option>
                    <option value="market">Market Risk</option>
                    <option value="operational">Operational Risk</option>
                    <option value="liquidity">Liquidity Risk</option>
                    <option value="regulatory">Regulatory Risk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Risk Level</label>
                  <select
                    value={newRisk.risk_level}
                    onChange={(e) => setNewRisk({...newRisk, risk_level: e.target.value})}
                    className="input-glass"
                  >
                    <option value="">Select level</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Assessment Date</label>
                  <input
                    type="date"
                    value={newRisk.assessment_date}
                    onChange={(e) => setNewRisk({...newRisk, assessment_date: e.target.value})}
                    className="input-glass"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe the risk and its potential impact..."
                    value={newRisk.description}
                    onChange={(e) => setNewRisk({...newRisk, description: e.target.value})}
                    className="input-glass resize-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Mitigation Plan</label>
                  <textarea
                    rows={3}
                    placeholder="Steps to mitigate or manage this risk..."
                    value={newRisk.mitigation_plan}
                    onChange={(e) => setNewRisk({...newRisk, mitigation_plan: e.target.value})}
                    className="input-glass resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={modalType === 'forecast' ? createForecast : createRisk}
                className="btn-primary flex-1"
                disabled={modalType === 'forecast' 
                  ? !newForecast.forecast_type || !newForecast.forecast_period
                  : !newRisk.risk_type || !newRisk.description
                }
              >
                {modalType === 'forecast' ? 'Create Forecast' : 'Create Risk Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}