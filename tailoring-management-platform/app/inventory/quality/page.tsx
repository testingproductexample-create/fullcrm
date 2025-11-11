'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Download,
  RefreshCw,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Image,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  User,
  ClipboardCheck,
  Microscope,
  Shield,
  Target,
  Award,
  ThumbsUp,
  ThumbsDown,
  Camera,
  Upload,
  ArrowUpDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { 
  QualityInspection,
  FabricLibrary,
  Supplier,
  QualityStandard,
  QualityDefect,
  InspectionResult
} from '@/types/inventory';
import { 
  formatDate,
  formatAEDCurrency,
  getQualityGradeColor,
  getInspectionStatusColor
} from '@/types/inventory';

interface QualityInspectionWithDetails extends QualityInspection {
  fabric?: FabricLibrary;
  supplier?: Supplier;
  inspector_name?: string;
  defects_count?: number;
  test_results_count?: number;
}

interface FilterOptions {
  status: string;
  inspection_type: string;
  quality_grade: string;
  supplier: string;
  date_range: string;
  inspector: string;
  search: string;
}

interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Pending Review', label: 'Pending Review' }
];

const INSPECTION_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'Incoming Inspection', label: 'Incoming Inspection' },
  { value: 'Random Sampling', label: 'Random Sampling' },
  { value: 'Quality Audit', label: 'Quality Audit' },
  { value: 'Compliance Check', label: 'Compliance Check' },
  { value: 'Pre-shipment', label: 'Pre-shipment' }
];

const QUALITY_GRADE_OPTIONS = [
  { value: '', label: 'All Grades' },
  { value: 'A+', label: 'Grade A+' },
  { value: 'A', label: 'Grade A' },
  { value: 'B+', label: 'Grade B+' },
  { value: 'B', label: 'Grade B' },
  { value: 'C', label: 'Grade C' },
  { value: 'Failed', label: 'Failed' }
];

const DATE_RANGES = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' }
];

export default function QualityInspectionsPage() {
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    inspection_type: '',
    quality_grade: '',
    supplier: '',
    date_range: '',
    inspector: '',
    search: ''
  });
  
  const [sortBy, setSortBy] = useState<SortOption>({
    field: 'created_at',
    direction: 'desc'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch quality inspections with advanced filtering
  const { data: inspections, isLoading, error } = useQuery({
    queryKey: ['quality-inspections', filters, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('quality_inspections')
        .select(`
          *,
          fabric:fabric_library(*),
          supplier:suppliers(*)
        `);

      // Apply filters
      if (filters.status) {
        query = query.eq('inspection_status', filters.status);
      }

      if (filters.inspection_type) {
        query = query.eq('inspection_type', filters.inspection_type);
      }

      if (filters.quality_grade) {
        query = query.eq('overall_grade', filters.quality_grade);
      }

      if (filters.supplier) {
        query = query.eq('supplier_id', filters.supplier);
      }

      if (filters.search) {
        query = query.or(`inspection_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%,defects_found.ilike.%${filters.search}%`);
      }

      // Date range filtering
      if (filters.date_range) {
        const now = new Date();
        let startDate = new Date();
        
        switch (filters.date_range) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
        }
        
        query = query.gte('inspection_date', startDate.toISOString());
      }

      // Apply sorting
      query = query.order(sortBy.field, { ascending: sortBy.direction === 'asc' });

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calculate additional metrics for each inspection
      const inspectionsWithMetrics = (data || []).map((inspection) => {
        const defects_count = inspection.defects_found ? JSON.parse(inspection.defects_found).length : 0;
        const test_results_count = inspection.test_results ? Object.keys(JSON.parse(inspection.test_results)).length : 0;
        
        return {
          ...inspection,
          defects_count,
          test_results_count
        };
      });
      
      return inspectionsWithMetrics as QualityInspectionWithDetails[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch suppliers for filter dropdown
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, supplier_name, supplier_code')
        .order('supplier_name');
      
      if (error) throw error;
      return data as Supplier[];
    }
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ inspectionId, newStatus }: { inspectionId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('quality_inspections')
        .update({ 
          inspection_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', inspectionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-inspections'] });
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['quality-inspections'] });
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (field: string) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusBadge = (status: string) => {
    const { bgColor, textColor, borderColor } = getInspectionStatusColor(status);
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${bgColor} ${textColor} ${borderColor}`}>
        {status}
      </span>
    );
  };

  const getGradeBadge = (grade?: string) => {
    if (!grade) return null;
    const { bgColor, textColor } = getQualityGradeColor(grade);
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {grade}
      </span>
    );
  };

  const getComplianceIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Error loading quality inspections: {error.message}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40">
      {/* Header */}
      <div className="border-b border-white/20 bg-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                Quality Inspections
              </h1>
              <p className="text-slate-600 mt-1">
                Monitor material quality and compliance standards
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-xl border transition-all duration-200 ${
                  showFilters 
                    ? 'bg-blue-500 text-white border-blue-500 shadow-lg' 
                    : 'bg-white/70 backdrop-blur-sm border-white/30 text-slate-700 hover:bg-white/90'
                }`}
              >
                <Filter className="h-4 w-4 inline mr-2" />
                Filters
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 text-slate-700 hover:bg-white/90 transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 inline mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                href={`/inventory/quality/new`}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                New Inspection
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6 mb-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Inspection Type Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                <select
                  value={filters.inspection_type}
                  onChange={(e) => handleFilterChange('inspection_type', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {INSPECTION_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quality Grade Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Grade</label>
                <select
                  value={filters.quality_grade}
                  onChange={(e) => handleFilterChange('quality_grade', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {QUALITY_GRADE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Supplier</label>
                <select
                  value={filters.supplier}
                  onChange={(e) => handleFilterChange('supplier', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Suppliers</option>
                  {suppliers?.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.supplier_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                <select
                  value={filters.date_range}
                  onChange={(e) => handleFilterChange('date_range', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DATE_RANGES.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Inspector Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Inspector</label>
                <select
                  value={filters.inspector}
                  onChange={(e) => handleFilterChange('inspector', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Inspectors</option>
                  <option value="Ahmed Hassan">Ahmed Hassan</option>
                  <option value="Sarah Al-Mansouri">Sarah Al-Mansouri</option>
                  <option value="Omar Khalil">Omar Khalil</option>
                  <option value="Fatima Al-Zahra">Fatima Al-Zahra</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Inspection #, notes..."
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/30 bg-white/50 backdrop-blur-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <ClipboardCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {inspections?.length || 0}
                </p>
                <p className="text-sm text-slate-600">Total Inspections</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {inspections?.filter(i => i.compliance_passed).length || 0}
                </p>
                <p className="text-sm text-slate-600">Passed</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {inspections?.filter(i => !i.compliance_passed).length || 0}
                </p>
                <p className="text-sm text-slate-600">Failed</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {inspections?.filter(i => ['Scheduled', 'In Progress', 'Pending Review'].includes(i.inspection_status)).length || 0}
                </p>
                <p className="text-sm text-slate-600">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {inspections?.filter(i => i.overall_grade && ['A+', 'A'].includes(i.overall_grade)).length || 0}
                </p>
                <p className="text-sm text-slate-600">Grade A+/A</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inspections Table */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 mt-2">Loading quality inspections...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-white/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      <button onClick={() => handleSort('inspection_number')} className="flex items-center gap-1">
                        Inspection #
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      Material
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      Supplier
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      <button onClick={() => handleSort('inspection_status')} className="flex items-center gap-1">
                        Status
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      Grade
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      <button onClick={() => handleSort('inspection_date')} className="flex items-center gap-1">
                        Date
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      Inspector
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      Compliance
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      Defects
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {inspections?.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-white/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {inspection.inspection_number}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900">
                            {inspection.fabric?.fabric_name || 'Unknown Material'}
                          </div>
                          <div className="text-sm text-slate-500">
                            {inspection.fabric?.fabric_code}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {inspection.supplier?.supplier_name || 'Unknown Supplier'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-full">
                          {inspection.inspection_type}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        {getStatusBadge(inspection.inspection_status)}
                      </td>
                      
                      <td className="px-6 py-4">
                        {getGradeBadge(inspection.overall_grade)}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">
                          {formatDate(inspection.inspection_date)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">
                          {inspection.inspector_name || 'Unassigned'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getComplianceIcon(inspection.compliance_passed)}
                          <span className={`text-sm ${inspection.compliance_passed ? 'text-green-600' : 'text-red-600'}`}>
                            {inspection.compliance_passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {inspection.defects_count > 0 ? (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-sm text-amber-700 font-medium">
                              {inspection.defects_count}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-700">
                              None
                            </span>
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/inventory/quality/${inspection.id}`}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/inventory/quality/${inspection.id}/Edit`}
                            className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {inspections && inspections.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  <Microscope className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-lg font-medium">No quality inspections found</p>
                  <p className="text-sm">Schedule your first quality inspection to get started.</p>
                  <Link
                    href={`/inventory/quality/new`}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Inspection
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}