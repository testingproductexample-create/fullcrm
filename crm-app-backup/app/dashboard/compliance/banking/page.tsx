'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Banknote,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import type { BankReconciliation } from '@/types/database';

interface ReconciliationStats {
  totalAccounts: number;
  reconciledAmount: number;
  totalDifferences: number;
  pendingReconciliations: number;
  disputedReconciliations: number;
}

export default function BankReconciliationPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reconciliations, setReconciliations] = useState<BankReconciliation[]>([]);
  const [stats, setStats] = useState<ReconciliationStats>({
    totalAccounts: 0,
    reconciledAmount: 0,
    totalDifferences: 0,
    pendingReconciliations: 0,
    disputedReconciliations: 0
  });
  const [filterAccount, setFilterAccount] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReconciliation, setNewReconciliation] = useState({
    bank_account: '',
    statement_date: '',
    opening_balance_aed: '',
    closing_balance_aed: '',
    transactions_count: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      loadReconciliations();
    }
  }, [profile]);

  const loadReconciliations = async () => {
    try {
      setLoading(true);

      if (!profile?.organization_id) return;

      const { data: reconciliations, error } = await supabase
        .from('bank_reconciliation')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('statement_date', { ascending: false });

      if (error) throw error;

      setReconciliations(reconciliations || []);

      // Calculate statistics
      const uniqueAccounts = new Set(reconciliations?.map(rec => rec.bank_account)).size;
      const totalReconciled = reconciliations?.reduce((sum, rec) => sum + rec.reconciled_amount_aed, 0) || 0;
      const totalDifferences = reconciliations?.reduce((sum, rec) => sum + Math.abs(rec.differences_aed), 0) || 0;
      const pendingCount = reconciliations?.filter(rec => rec.status === 'pending').length || 0;
      const disputedCount = reconciliations?.filter(rec => rec.status === 'disputed').length || 0;

      setStats({
        totalAccounts: uniqueAccounts,
        reconciledAmount: totalReconciled,
        totalDifferences,
        pendingReconciliations: pendingCount,
        disputedReconciliations: disputedCount
      });

    } catch (error) {
      console.error('Error loading bank reconciliations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReconciliation = async () => {
    try {
      if (!profile?.organization_id || !newReconciliation.bank_account) return;

      const openingBalance = parseFloat(newReconciliation.opening_balance_aed) || 0;
      const closingBalance = parseFloat(newReconciliation.closing_balance_aed) || 0;
      const transactionCount = parseInt(newReconciliation.transactions_count) || 0;
      
      // For now, assume all transactions are reconciled (in real implementation, would calculate based on transaction matching)
      const reconciledAmount = closingBalance - openingBalance;
      const differences = 0; // Would be calculated based on actual vs. expected transactions

      const { error } = await supabase
        .from('bank_reconciliation')
        .insert({
          organization_id: profile.organization_id,
          bank_account: newReconciliation.bank_account,
          statement_date: newReconciliation.statement_date,
          opening_balance_aed: openingBalance,
          closing_balance_aed: closingBalance,
          transactions_count: transactionCount,
          reconciled_amount_aed: reconciledAmount,
          differences_aed: differences,
          status: differences === 0 ? 'reconciled' : 'disputed'
        });

      if (error) throw error;

      setShowCreateModal(false);
      setNewReconciliation({
        bank_account: '',
        statement_date: '',
        opening_balance_aed: '',
        closing_balance_aed: '',
        transactions_count: ''
      });
      
      await loadReconciliations();
    } catch (error) {
      console.error('Error creating bank reconciliation:', error);
    }
  };

  const updateReconciliationStatus = async (reconciliationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bank_reconciliation')
        .update({ status })
        .eq('id', reconciliationId);

      if (error) throw error;
      await loadReconciliations();
    } catch (error) {
      console.error('Error updating reconciliation status:', error);
    }
  };

  const exportReconciliations = () => {
    const csv = [
      ['Bank Account', 'Statement Date', 'Opening Balance (AED)', 'Closing Balance (AED)', 'Transactions', 'Reconciled Amount (AED)', 'Differences (AED)', 'Status'].join(','),
      ...filteredReconciliations.map(rec => [
        rec.bank_account,
        rec.statement_date,
        rec.opening_balance_aed,
        rec.closing_balance_aed,
        rec.transactions_count,
        rec.reconciled_amount_aed,
        rec.differences_aed,
        rec.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank-reconciliation-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      reconciled: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      disputed: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getBankAccountDisplayName = (account: string) => {
    const parts = account.split('-');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`;
    }
    return account;
  };

  const filteredReconciliations = reconciliations.filter(rec => {
    const matchesAccount = !filterAccount || rec.bank_account === filterAccount;
    const matchesStatus = !filterStatus || rec.status === filterStatus;
    const matchesMonth = !filterMonth || rec.statement_date.substring(0, 7) === filterMonth;
    const matchesSearch = !searchQuery || 
      rec.bank_account.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAccount && matchesStatus && matchesMonth && matchesSearch;
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
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Bank Reconciliation Management</h1>
            <p className="text-neutral-600">Reconcile bank statements and track account balances across all UAE bank accounts</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportReconciliations}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import Statement
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Reconciliation
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Banknote className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-neutral-500">Accounts</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.totalAccounts}</h3>
            <p className="text-xs text-neutral-600">Bank accounts monitored</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs text-neutral-500">Reconciled</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-neutral-900">{formatCurrency(stats.reconciledAmount)}</h3>
            <p className="text-xs text-neutral-600">Total reconciled amount</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs text-neutral-500">Differences</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-neutral-900">{formatCurrency(stats.totalDifferences)}</h3>
            <p className="text-xs text-neutral-600">Unreconciled differences</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-xs text-neutral-500">Pending</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.pendingReconciliations}</h3>
            <p className="text-xs text-neutral-600">Pending reconciliations</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs text-neutral-500">Disputed</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.disputedReconciliations}</h3>
            <p className="text-xs text-neutral-600">Disputed reconciliations</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-card p-6">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Filters:</span>
          </div>
          
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="input-glass text-sm"
          >
            <option value="">All Accounts</option>
            {Array.from(new Set(reconciliations.map(rec => rec.bank_account))).map(account => (
              <option key={account} value={account}>{getBankAccountDisplayName(account)}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-glass text-sm"
          >
            <option value="">All Status</option>
            <option value="reconciled">Reconciled</option>
            <option value="pending">Pending</option>
            <option value="disputed">Disputed</option>
          </select>

          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="input-glass text-sm"
          />

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search bank accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glass text-sm pl-9 w-full"
            />
          </div>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Bank Account</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-700">Statement Date</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700">Opening Balance</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700">Closing Balance</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-700">Transactions</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700">Reconciled</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700">Differences</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-700">Status</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReconciliations.length > 0 ? (
                filteredReconciliations.map((reconciliation) => (
                  <tr key={reconciliation.id} className="border-b border-white/10 hover:bg-white/10">
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-900">{getBankAccountDisplayName(reconciliation.bank_account)}</div>
                      <div className="text-xs text-neutral-500">{reconciliation.bank_account}</div>
                    </td>
                    <td className="py-3 px-4 text-center text-sm">{formatDate(reconciliation.statement_date)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(reconciliation.opening_balance_aed)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(reconciliation.closing_balance_aed)}</td>
                    <td className="py-3 px-4 text-center">{reconciliation.transactions_count}</td>
                    <td className="py-3 px-4 text-right text-green-600 font-medium">
                      {formatCurrency(reconciliation.reconciled_amount_aed)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={reconciliation.differences_aed !== 0 ? 'text-red-600 font-medium' : 'text-neutral-500'}>
                        {formatCurrency(reconciliation.differences_aed)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(reconciliation.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-1">
                        <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {reconciliation.status === 'pending' && (
                          <button 
                            onClick={() => updateReconciliationStatus(reconciliation.id, 'reconciled')}
                            className="p-1 text-green-600 hover:bg-green-100 rounded" 
                            title="Mark as Reconciled"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {reconciliation.differences_aed !== 0 && (
                          <button 
                            onClick={() => updateReconciliationStatus(reconciliation.id, 'disputed')}
                            className="p-1 text-orange-600 hover:bg-orange-100 rounded" 
                            title="Mark as Disputed"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-1 text-neutral-600 hover:bg-neutral-100 rounded" title="More Actions">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-500">
                    <Banknote className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No bank reconciliations found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Reconciliation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-card p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Create Bank Reconciliation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Bank Account</label>
                <input
                  type="text"
                  placeholder="e.g., ADCB-BUSINESS-001"
                  value={newReconciliation.bank_account}
                  onChange={(e) => setNewReconciliation({...newReconciliation, bank_account: e.target.value})}
                  className="input-glass"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Statement Date</label>
                <input
                  type="date"
                  value={newReconciliation.statement_date}
                  onChange={(e) => setNewReconciliation({...newReconciliation, statement_date: e.target.value})}
                  className="input-glass"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Opening Balance (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newReconciliation.opening_balance_aed}
                  onChange={(e) => setNewReconciliation({...newReconciliation, opening_balance_aed: e.target.value})}
                  className="input-glass"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Closing Balance (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newReconciliation.closing_balance_aed}
                  onChange={(e) => setNewReconciliation({...newReconciliation, closing_balance_aed: e.target.value})}
                  className="input-glass"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Number of Transactions</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newReconciliation.transactions_count}
                  onChange={(e) => setNewReconciliation({...newReconciliation, transactions_count: e.target.value})}
                  className="input-glass"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={createReconciliation}
                className="btn-primary flex-1"
                disabled={!newReconciliation.bank_account || !newReconciliation.statement_date}
              >
                Create Reconciliation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}