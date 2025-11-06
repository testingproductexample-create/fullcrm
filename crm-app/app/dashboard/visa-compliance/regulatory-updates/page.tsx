'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Building2,
  FileText,
  Calendar,
  ExternalLink,
  Download,
  RefreshCw,
  Bell,
  AlertCircle
} from 'lucide-react';
import type { RegulatoryUpdate } from '@/types/visa-compliance';

interface UpdateWithAssigned extends RegulatoryUpdate {
  assigned_to?: {
    first_name: string;
    last_name: string;
  };
  created_by?: {
    first_name: string;
    last_name: string;
  };
}

export default function RegulatoryUpdatesPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<UpdateWithAssigned[]>([]);
  const [filteredUpdates, setFilteredUpdates] = useState<UpdateWithAssigned[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [impactFilter, setImpactFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [authorityFilter, setAuthorityFilter] = useState('all');
  const [actionRequiredFilter, setActionRequiredFilter] = useState('all');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchUpdates();
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    filterUpdates();
  }, [updates, searchTerm, impactFilter, statusFilter, authorityFilter, actionRequiredFilter]);

  const fetchUpdates = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('regulatory_updates')
        .select(`
          *,
          assigned_to:users!regulatory_updates_assigned_to_user_id_fkey (
            first_name,
            last_name
          ),
          created_by:users!regulatory_updates_created_by_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('announcement_date', { ascending: false });

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error('Error fetching regulatory updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUpdates = () => {
    let filtered = [...updates];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(update => 
        update.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        update.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        update.authority?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Impact filter
    if (impactFilter !== 'all') {
      filtered = filtered.filter(update => update.impact_level === impactFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(update => update.compliance_status === statusFilter);
    }

    // Authority filter
    if (authorityFilter !== 'all') {
      filtered = filtered.filter(update => update.authority === authorityFilter);
    }

    // Action Required filter
    if (actionRequiredFilter !== 'all') {
      if (actionRequiredFilter === 'required') {
        filtered = filtered.filter(update => update.action_required === true);
      } else {
        filtered = filtered.filter(update => update.action_required === false);
      }
    }

    setFilteredUpdates(filtered);
  };

  const getImpactColor = (impact: string | null) => {
    switch (impact) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'non_compliant':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'non_compliant':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAuthorityIcon = (authority: string) => {
    switch (authority) {
      case 'MOHRE':
      case 'GDRFA':
      case 'ICA':
        return <Building2 className="w-4 h-4" />;
      case 'FTA':
      case 'Central Bank':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getDaysUntilDeadline = (deadlineDate: string | null) => {
    if (!deadlineDate) return null;
    const today = new Date();
    const deadline = new Date(deadlineDate);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isEffectiveToday = (effectiveDate: string) => {
    const today = new Date();
    const effective = new Date(effectiveDate);
    return (
      today.getFullYear() === effective.getFullYear() &&
      today.getMonth() === effective.getMonth() &&
      today.getDate() === effective.getDate()
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/visa-compliance">
              <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Regulatory Updates</h1>
              <p className="text-gray-600 mt-1">Stay current with UAE regulations and compliance requirements</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/70 text-gray-700 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2 border border-white/20">
              <Download className="w-4 h-4" />
              Export Updates
            </button>
            <Link href="/dashboard/visa-compliance/regulatory-updates/new">
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Update
              </button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search updates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={impactFilter}
              onChange={(e) => setImpactFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Impact Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="compliant">Compliant</option>
              <option value="non_compliant">Non-Compliant</option>
            </select>
            <select
              value={authorityFilter}
              onChange={(e) => setAuthorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Authorities</option>
              <option value="MOHRE">MOHRE</option>
              <option value="GDRFA">GDRFA</option>
              <option value="ICA">ICA</option>
              <option value="FTA">FTA</option>
              <option value="Central Bank">Central Bank</option>
            </select>
            <select
              value={actionRequiredFilter}
              onChange={(e) => setActionRequiredFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="required">Action Required</option>
              <option value="no_action">No Action Required</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setImpactFilter('all');
                setStatusFilter('all');
                setAuthorityFilter('all');
                setActionRequiredFilter('all');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Updates</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{updates.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Action Required</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {updates.filter(u => u.action_required).length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Impact</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {updates.filter(u => u.impact_level === 'critical').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliant</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {updates.filter(u => u.compliance_status === 'compliant').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Effective Today</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {updates.filter(u => isEffectiveToday(u.effective_date)).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Updates List */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Regulatory Updates ({filteredUpdates.length})</h2>
          </div>
          <div className="space-y-4 p-6">
            {filteredUpdates.map((update) => {
              const deadlineDays = getDaysUntilDeadline(update.action_deadline);
              const isDeadlineClose = deadlineDays !== null && deadlineDays <= 7;
              
              return (
                <div key={update.id} className="bg-white/50 rounded-xl p-6 border border-white/30 hover:bg-white/70 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 rounded-lg border ${getImpactColor(update.impact_level)}`}>
                          {getAuthorityIcon(update.authority)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{update.title}</h3>
                            {update.action_required && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                <Bell className="w-3 h-3 mr-1" />
                                Action Required
                              </span>
                            )}
                            {isEffectiveToday(update.effective_date) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Effective Today
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{update.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <span className="text-xs font-medium text-gray-500">Authority</span>
                              <div className="flex items-center gap-1 mt-1">
                                {getAuthorityIcon(update.authority)}
                                <span className="text-sm text-gray-900">{update.authority}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500">Impact Level</span>
                              <div className="mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getImpactColor(update.impact_level)}`}>
                                  {(update.impact_level || 'Unknown').toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500">Effective Date</span>
                              <div className="text-sm text-gray-900 mt-1">{formatDate(update.effective_date)}</div>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500">Status</span>
                              <div className="mt-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(update.compliance_status)}`}>
                                  {getStatusIcon(update.compliance_status)}
                                  {update.compliance_status.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {update.action_deadline && (
                            <div className="flex items-center gap-2 mb-3">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Action deadline: {formatDate(update.action_deadline)}
                              </span>
                              {deadlineDays !== null && (
                                <span className={`text-xs font-medium ${isDeadlineClose ? 'text-red-600' : 'text-gray-500'}`}>
                                  ({deadlineDays > 0 ? `${deadlineDays} days remaining` : `${Math.abs(deadlineDays)} days overdue`})
                                </span>
                              )}
                            </div>
                          )}

                          {update.affected_areas && update.affected_areas.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="text-xs font-medium text-gray-500">Affected Areas:</span>
                              {update.affected_areas.map((area, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded">
                                  {area}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Announced: {formatDate(update.announcement_date)}</span>
                              {update.assigned_to && (
                                <span>
                                  Assigned to: {update.assigned_to.first_name} {update.assigned_to.last_name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {update.source_url && (
                                <a href={update.source_url} target="_blank" rel="noopener noreferrer">
                                  <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                  </button>
                                </a>
                              )}
                              <Link href={`/dashboard/visa-compliance/regulatory-updates/${update.id}`}>
                                <button className="p-1 text-gray-400 hover:text-purple-600 transition-colors">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </Link>
                              <Link href={`/dashboard/visa-compliance/regulatory-updates/${update.id}/edit`}>
                                <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                                  <Edit className="w-4 h-4" />
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredUpdates.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No regulatory updates found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || impactFilter !== 'all' || statusFilter !== 'all' || authorityFilter !== 'all' || actionRequiredFilter !== 'all'
                  ? 'Try adjusting your search filters'
                  : 'Start by adding regulatory updates and announcements'
                }
              </p>
              {(!searchTerm && impactFilter === 'all' && statusFilter === 'all' && authorityFilter === 'all' && actionRequiredFilter === 'all') && (
                <Link href="/dashboard/visa-compliance/regulatory-updates/new">
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors">
                    Add First Update
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}