'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  ReceiptRefundIcon,
  CalendarIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';
import { 
  FinancialTransaction, 
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  UAE_EXPENSE_CATEGORIES,
  UAE_EXPENSE_CATEGORY_LABELS,
} from '@/types/financial';
import toast from 'react-hot-toast';

// Force this page to be dynamic
export const dynamic = 'force-dynamic';

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('30');
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch transactions
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['financial-transactions', searchQuery, typeFilter, categoryFilter, dateFilter],
    queryFn: async (): Promise<FinancialTransaction[]> => {
      let query = supabase
        .from('financial_transactions')
        .select('*');

      // Apply filters
      if (searchQuery) {
        query = query.or(`description.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`);
      }

      if (typeFilter && typeFilter !== 'all') {
        query = query.eq('transaction_type', typeFilter);
      }

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('transaction_category', categoryFilter);
      }

      if (dateFilter && dateFilter !== 'all') {
        const days = parseInt(dateFilter);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('transaction_date', startDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('transaction_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Get transaction statistics
  const { data: stats } = useQuery({
    queryKey: ['transaction-stats', dateFilter],
    queryFn: async () => {
      let query = supabase.from('financial_transactions').select('transaction_type, amount_aed');

      if (dateFilter && dateFilter !== 'all') {
        const days = parseInt(dateFilter);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('transaction_date', startDate.toISOString().split('T')[0]);
      }

      const { data } = await query;

      if (!data) return { totalRevenue: 0, totalExpenses: 0, transactionCount: 0 };

      const revenue = data.filter(t => t.transaction_type === 'revenue').reduce((sum, t) => sum + (t.amount_aed || 0), 0);
      const expenses = data.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + (t.amount_aed || 0), 0);

      return {
        totalRevenue: revenue,
        totalExpenses: expenses,
        transactionCount: data.length,
      };
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading transactions</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Transactions</h1>
          <p className="text-gray-600">Track all revenue and expense transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <DocumentArrowDownIcon className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.totalRevenue || 0)}</div>
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(stats?.totalExpenses || 0)}</div>
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${((stats?.totalRevenue || 0) - (stats?.totalExpenses || 0)) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency((stats?.totalRevenue || 0) - (stats?.totalExpenses || 0))}
              </div>
              <BanknotesIcon className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions by description or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(UAE_EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BanknotesIcon className="h-5 w-5" />
            Transaction History
            {stats && (
              <Badge variant="secondary" className="text-xs">
                {stats.transactionCount} records
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${transaction.transaction_type === 'revenue' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {transaction.transaction_type === 'revenue' ? (
                          <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                          <Badge className={`text-xs ${transaction.transaction_type === 'revenue' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {TRANSACTION_TYPE_LABELS[transaction.transaction_type as keyof typeof TRANSACTION_TYPE_LABELS]}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(transaction.transaction_date)}</span>
                          </div>
                          {transaction.transaction_category && (
                            <div>
                              <span className="font-medium">Category:</span> {UAE_EXPENSE_CATEGORY_LABELS[transaction.transaction_category as keyof typeof UAE_EXPENSE_CATEGORY_LABELS] || transaction.transaction_category}
                            </div>
                          )}
                          {transaction.account_type && (
                            <div>
                              <span className="font-medium">Account:</span> {transaction.account_type}
                            </div>
                          )}
                        </div>

                        {transaction.notes && (
                          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {transaction.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-lg font-semibold ${transaction.transaction_type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.transaction_type === 'revenue' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount_aed))}
                      </div>
                      {transaction.reference_type && transaction.reference_id && (
                        <div className="text-xs text-gray-500 mt-1">
                          Ref: {transaction.reference_type}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by recording your first financial transaction.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowAddForm(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Form Modal Placeholder */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Transaction</h2>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
            <div className="text-center py-8">
              <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Transaction Form</h3>
              <p className="mt-1 text-sm text-gray-500">
                Complete transaction form will be implemented here
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}