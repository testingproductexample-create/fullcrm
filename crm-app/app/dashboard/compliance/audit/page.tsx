'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Eye,
  Search,
  Filter,
  Download,
  Calendar,
  FileText,
  Edit,
  Trash2,
  Plus,
  Clock,
  User,
  Database,
  Activity
} from 'lucide-react';
import type { AuditTrail } from '@/types/database';

interface AuditStats {
  totalAuditEntries: number;
  todayActivities: number;
  uniqueTables: number;
  uniqueUsers: number;
}

export default function AuditTrailPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [auditTrails, setAuditTrails] = useState<AuditTrail[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    totalAuditEntries: 0,
    todayActivities: 0,
    uniqueTables: 0,
    uniqueUsers: 0
  });
  const [filterTable, setFilterTable] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AuditTrail | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (profile?.organization_id) {
      loadAuditTrails();
    }
  }, [profile]);

  const loadAuditTrails = async () => {
    try {
      setLoading(true);

      if (!profile?.organization_id) return;

      const { data: auditTrails, error } = await supabase
        .from('audit_trails')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) throw error;

      setAuditTrails(auditTrails || []);

      // Calculate statistics
      const today = new Date().toISOString().split('T')[0];
      const todayActivities = auditTrails?.filter(entry => 
        entry.timestamp.split('T')[0] === today).length || 0;
      
      const uniqueTables = new Set(auditTrails?.map(entry => entry.table_name)).size;
      const uniqueUsers = new Set(auditTrails?.filter(entry => entry.user_id).map(entry => entry.user_id)).size;

      setStats({
        totalAuditEntries: auditTrails?.length || 0,
        todayActivities,
        uniqueTables,
        uniqueUsers
      });

    } catch (error) {
      console.error('Error loading audit trails:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAuditTrails = () => {
    const csv = [
      ['Timestamp', 'Table', 'Record ID', 'Action', 'User ID', 'Description', 'Old Values', 'New Values'].join(','),
      ...filteredTrails.map(entry => [
        new Date(entry.timestamp).toLocaleString('en-AE'),
        entry.table_name,
        entry.record_id,
        entry.action_type,
        entry.user_id || '',
        entry.description || '',
        JSON.stringify(entry.old_values || {}),
        JSON.stringify(entry.new_values || {})
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadge = (action: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      insert: { color: 'bg-green-100 text-green-800', icon: Plus },
      update: { color: 'bg-blue-100 text-blue-800', icon: Edit },
      delete: { color: 'bg-red-100 text-red-800', icon: Trash2 }
    };
    const badge = badges[action] || badges.update;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </span>
    );
  };

  const getTableDisplayName = (tableName: string) => {
    const tableNames: Record<string, string> = {
      invoices: 'Invoices',
      payments: 'Payments',
      customers: 'Customers',
      vat_reports: 'VAT Reports',
      bank_reconciliation: 'Bank Reconciliation',
      compliance_calendar: 'Compliance Calendar',
      financial_risk_assessment: 'Risk Assessment',
      regulatory_reports: 'Regulatory Reports',
      financial_forecasting: 'Financial Forecasting',
      profiles: 'User Profiles',
      organizations: 'Organizations'
    };
    return tableNames[tableName] || tableName;
  };

  const viewDetails = (entry: AuditTrail) => {
    setSelectedEntry(entry);
    setShowDetailsModal(true);
  };

  const filteredTrails = auditTrails.filter(entry => {
    const matchesTable = !filterTable || entry.table_name === filterTable;
    const matchesAction = !filterAction || entry.action_type === filterAction;
    const matchesDate = !filterDate || entry.timestamp.split('T')[0] === filterDate;
    const matchesSearch = !searchQuery || 
      entry.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.record_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTable && matchesAction && matchesDate && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
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
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Audit Trail & Compliance Tracking</h1>
            <p className="text-neutral-600">Complete audit trail of all financial system activities and changes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportAuditTrails}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-neutral-500">Total Entries</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.totalAuditEntries.toLocaleString()}</h3>
            <p className="text-xs text-neutral-600">Audit trail entries</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs text-neutral-500">Today</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.todayActivities}</h3>
            <p className="text-xs text-neutral-600">Activities today</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs text-neutral-500">Tables</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.uniqueTables}</h3>
            <p className="text-xs text-neutral-600">Monitored tables</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <User className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs text-neutral-500">Users</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-neutral-900">{stats.uniqueUsers}</h3>
            <p className="text-xs text-neutral-600">Active users</p>
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
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value)}
            className="input-glass text-sm"
          >
            <option value="">All Tables</option>
            {Array.from(new Set(auditTrails.map(entry => entry.table_name))).map(table => (
              <option key={table} value={table}>{getTableDisplayName(table)}</option>
            ))}
          </select>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="input-glass text-sm"
          >
            <option value="">All Actions</option>
            <option value="insert">Insert</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="input-glass text-sm"
          />

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search records, descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glass text-sm pl-9 w-full"
            />
          </div>
        </div>
      </div>

      {/* Audit Trail Table */}
      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Timestamp</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Table</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Record ID</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-700">Action</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">User</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Description</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrails.length > 0 ? (
                filteredTrails.map((entry) => (
                  <tr key={entry.id} className="border-b border-white/10 hover:bg-white/10">
                    <td className="py-3 px-4 text-sm">
                      {formatDateTime(entry.timestamp)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {getTableDisplayName(entry.table_name)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono">{entry.record_id}</td>
                    <td className="py-3 px-4 text-center">{getActionBadge(entry.action_type)}</td>
                    <td className="py-3 px-4 text-sm">
                      {entry.user_id ? (
                        <span className="text-neutral-900">{entry.user_id.slice(0, 8)}...</span>
                      ) : (
                        <span className="text-neutral-500">System</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm max-w-xs truncate">
                      {entry.description || 'No description'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => viewDetails(entry)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No audit trail entries found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredTrails.length > 0 && (
          <div className="mt-4 text-sm text-neutral-500 text-center">
            Showing {filteredTrails.length} of {auditTrails.length} audit entries
          </div>
        )}
      </div>

      {/* Audit Details Modal */}
      {showDetailsModal && selectedEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-card p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Audit Trail Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Timestamp</label>
                  <div className="text-neutral-900">{formatDateTime(selectedEntry.timestamp)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Table</label>
                  <div className="text-neutral-900">{getTableDisplayName(selectedEntry.table_name)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Record ID</label>
                  <div className="text-neutral-900 font-mono">{selectedEntry.record_id}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Action Type</label>
                  <div>{getActionBadge(selectedEntry.action_type)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">User ID</label>
                  <div className="text-neutral-900">{selectedEntry.user_id || 'System'}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                  <div className="text-neutral-900">{selectedEntry.description || 'No description provided'}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                {selectedEntry.old_values && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Previous Values</label>
                    <pre className="text-xs bg-red-50 border border-red-200 rounded p-3 text-red-800 overflow-auto max-h-40">
                      {JSON.stringify(selectedEntry.old_values, null, 2)}
                    </pre>
                  </div>
                )}
                
                {selectedEntry.new_values && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">New Values</label>
                    <pre className="text-xs bg-green-50 border border-green-200 rounded p-3 text-green-800 overflow-auto max-h-40">
                      {JSON.stringify(selectedEntry.new_values, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 text-right">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}