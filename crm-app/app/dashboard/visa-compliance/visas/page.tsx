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
  Calendar,
  FileText,
  User,
  Globe,
  Shield,
  Download,
  RefreshCw
} from 'lucide-react';
import type { VisaTracking } from '@/types/visa-compliance';

interface VisaWithEmployee extends VisaTracking {
  employee?: {
    first_name: string;
    last_name: string;
    employee_id: string;
    position: string;
    department: string;
  };
}

export default function VisaTrackingPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [visas, setVisas] = useState<VisaWithEmployee[]>([]);
  const [filteredVisas, setFilteredVisas] = useState<VisaWithEmployee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchVisaData();
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    filterVisas();
  }, [visas, searchTerm, statusFilter, expiryFilter]);

  const fetchVisaData = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('visa_tracking')
        .select(`
          *,
          employee:employees!visa_tracking_employee_id_fkey (
            first_name,
            last_name,
            employee_id,
            position,
            department
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      setVisas(data || []);
    } catch (error) {
      console.error('Error fetching visa data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVisas = () => {
    let filtered = [...visas];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(visa => 
        visa.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visa.employee?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visa.employee?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visa.visa_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visa.passport_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(visa => visa.visa_status === statusFilter);
    }

    // Expiry filter
    if (expiryFilter !== 'all') {
      const today = new Date();
      filtered = filtered.filter(visa => {
        const expiryDate = new Date(visa.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (expiryFilter) {
          case 'expired':
            return daysUntilExpiry < 0;
          case 'expiring_soon':
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
          case 'expiring_3months':
            return daysUntilExpiry > 30 && daysUntilExpiry <= 90;
          case 'valid':
            return daysUntilExpiry > 90;
          default:
            return true;
        }
      });
    }

    setFilteredVisas(filtered);
  };

  const getVisaStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'valid':
        return 'text-green-600 bg-green-50';
      case 'expiring':
      case 'renewal_required':
        return 'text-yellow-600 bg-yellow-50';
      case 'expired':
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      case 'pending':
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getExpiryStatusIcon = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    } else if (daysUntilExpiry <= 30) {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    } else {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
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

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return `Expired ${Math.abs(daysUntilExpiry)} days ago`;
    } else if (daysUntilExpiry === 0) {
      return 'Expires today';
    } else if (daysUntilExpiry === 1) {
      return 'Expires tomorrow';
    } else {
      return `${daysUntilExpiry} days until expiry`;
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Visa Tracking</h1>
              <p className="text-gray-600 mt-1">Monitor employee visa status and renewals</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/70 text-gray-700 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2 border border-white/20">
              <Download className="w-4 h-4" />
              Export
            </button>
            <Link href="/dashboard/visa-compliance/visas/new">
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Visa
              </button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees, visa number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Expiry Status</option>
              <option value="expired">Expired</option>
              <option value="expiring_soon">Expiring Soon (30 days)</option>
              <option value="expiring_3months">Expiring (3 months)</option>
              <option value="valid">Valid (90+ days)</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setExpiryFilter('all');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Visas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{visas.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {visas.filter(visa => {
                    const daysUntilExpiry = Math.ceil((new Date(visa.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {visas.filter(visa => new Date(visa.expiry_date) < new Date()).length}
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
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {visas.filter(visa => {
                    const daysUntilExpiry = Math.ceil((new Date(visa.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return daysUntilExpiry > 30;
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Visa List */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Visa Records ({filteredVisas.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visa Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVisas.map((visa) => (
                  <tr key={visa.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {visa.employee?.first_name} {visa.employee?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {visa.employee?.employee_id} • {visa.employee?.position}
                          </div>
                          <div className="text-xs text-gray-400">{visa.employee?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{visa.visa_type}</div>
                      <div className="text-sm text-gray-500">
                        Visa: {visa.visa_number || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Passport: {visa.passport_number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVisaStatusColor(visa.visa_status)}`}>
                        {visa.visa_status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getExpiryStatusIcon(visa.expiry_date)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(visa.expiry_date)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getDaysUntilExpiry(visa.expiry_date)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {visa.visa_file_url && (
                          <div className="w-2 h-2 bg-green-400 rounded-full" title="Visa copy available" />
                        )}
                        {visa.emirates_id_copy_url && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full" title="Emirates ID copy available" />
                        )}
                        {visa.passport_copy_url && (
                          <div className="w-2 h-2 bg-purple-400 rounded-full" title="Passport copy available" />
                        )}
                        <span className="text-xs text-gray-500">
                          {[visa.visa_file_url, visa.emirates_id_copy_url, visa.passport_copy_url].filter(Boolean).length}/3 docs
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/visa-compliance/visas/${visa.id}`}>
                          <button className="p-1 text-gray-400 hover:text-purple-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <Link href={`/dashboard/visa-compliance/visas/${visa.id}/edit`}>
                          <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredVisas.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No visas found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || expiryFilter !== 'all' 
                  ? 'Try adjusting your search filters'
                  : 'Start by adding employee visa records'
                }
              </p>
              {(!searchTerm && statusFilter === 'all' && expiryFilter === 'all') && (
                <Link href="/dashboard/visa-compliance/visas/new">
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors">
                    Add First Visa
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