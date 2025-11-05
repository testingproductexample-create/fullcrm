'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Search,
  Filter,
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Check,
  X,
  Clock,
  AlertCircle,
  ExternalLink,
  Heart,
  Shirt,
  Palette
} from 'lucide-react';

interface CustomerSelection {
  id: string;
  total_price_aed: number;
  status: string;
  customization_notes: string;
  created_at: string;
  submitted_at: string;
  approved_at: string;
  selected_variants: any;
  reference_images: any[];
  customers: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  designs: {
    id: string;
    design_name: string;
    garment_category: string;
    design_code: string;
    base_price_aed: number;
  };
  fabric_library: {
    id: string;
    fabric_name: string;
    fabric_type: string;
    selling_price_per_meter_aed: number;
  } | null;
  fabric_patterns: {
    id: string;
    pattern_name: string;
    color_name: string;
    color_hex: string;
  } | null;
  measurement_id: string;
}

export default function CustomerSelectionsPage() {
  const { profile } = useAuth();
  const [selections, setSelections] = useState<CustomerSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    garment_category: '',
    date_range: ''
  });
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchSelections();
    }
  }, [profile?.organization_id, filters, sortBy]);

  const fetchSelections = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('customer_design_selections')
        .select(`
          id,
          total_price_aed,
          status,
          customization_notes,
          created_at,
          submitted_at,
          approved_at,
          selected_variants,
          reference_images,
          measurement_id,
          customers(
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          designs(
            id,
            design_name,
            garment_category,
            design_code,
            base_price_aed
          ),
          fabric_library(
            id,
            fabric_name,
            fabric_type,
            selling_price_per_meter_aed
          ),
          fabric_patterns(
            id,
            pattern_name,
            color_name,
            color_hex
          )
        `)
        .eq('organization_id', profile?.organization_id);

      // Apply filters
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.garment_category) {
        // Need to filter by design category - this requires a join or separate query
        // For now, we'll fetch all and filter client-side
      }

      // Apply date range filter
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
        
        if (filters.date_range !== '') {
          query = query.gte('created_at', startDate.toISOString());
        }
      }

      // Apply search
      if (searchQuery) {
        // Search in customer name or design name
        // This requires client-side filtering since we're searching across relations
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price_high':
          query = query.order('total_price_aed', { ascending: false });
          break;
        case 'price_low':
          query = query.order('total_price_aed', { ascending: true });
          break;
        case 'customer':
          // Will sort client-side by customer name
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Client-side filtering for garment category and search
      if (filters.garment_category) {
        filteredData = filteredData.filter(selection => 
          selection.designs?.garment_category === filters.garment_category
        );
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(selection => 
          `${selection.customers?.first_name} ${selection.customers?.last_name}`.toLowerCase().includes(query) ||
          selection.designs?.design_name.toLowerCase().includes(query) ||
          selection.designs?.design_code.toLowerCase().includes(query)
        );
      }

      // Client-side sorting for customer name
      if (sortBy === 'customer') {
        filteredData.sort((a, b) => {
          const nameA = `${a.customers?.first_name} ${a.customers?.last_name}`.toLowerCase();
          const nameB = `${b.customers?.first_name} ${b.customers?.last_name}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
      }

      setSelections(filteredData);

    } catch (error) {
      console.error('Error fetching customer selections:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSelectionStatus = async (selectionId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'approved') {
        updates.approved_at = new Date().toISOString();
        updates.approved_by = profile?.id;
      }

      const { error } = await supabase
        .from('customer_design_selections')
        .update(updates)
        .eq('id', selectionId);

      if (error) throw error;

      // Refresh selections
      fetchSelections();

    } catch (error) {
      console.error('Error updating selection status:', error);
    }
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      garment_category: '',
      date_range: ''
    });
    setSearchQuery('');
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft':
        return { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Edit };
      case 'submitted':
        return { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Clock };
      case 'approved':
        return { label: 'Approved', color: 'bg-green-100 text-green-700', icon: Check };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: X };
      case 'ordered':
        return { label: 'Ordered', color: 'bg-purple-100 text-purple-700', icon: ExternalLink };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700', icon: AlertCircle };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'ordered', label: 'Ordered' }
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'suit', label: 'Suits' },
    { value: 'shirt', label: 'Shirts' },
    { value: 'trouser', label: 'Trousers' },
    { value: 'dress', label: 'Dresses' },
    { value: 'thobe', label: 'Thobes/Kanduras' },
    { value: 'casual', label: 'Casual Wear' }
  ];

  const dateRangeOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'quarter', label: 'Last 3 Months' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-glass-light rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 bg-glass-light rounded"></div>
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
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/designs" className="p-2 hover:bg-glass-light rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-h2 font-bold text-neutral-900">Customer Design Selections</h1>
            <p className="text-body text-neutral-700">
              Manage customer design choices and customizations ({selections.length} selections)
            </p>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by customer name, design name, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="customer">Customer A-Z</option>
            <option value="price_high">Price High to Low</option>
            <option value="price_low">Price Low to High</option>
          </select>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="px-3 py-2 text-small border border-glass-border rounded focus:ring-2 focus:ring-primary-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={filters.garment_category}
            onChange={(e) => updateFilter('garment_category', e.target.value)}
            className="px-3 py-2 text-small border border-glass-border rounded focus:ring-2 focus:ring-primary-500"
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={filters.date_range}
            onChange={(e) => updateFilter('date_range', e.target.value)}
            className="px-3 py-2 text-small border border-glass-border rounded focus:ring-2 focus:ring-primary-500"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button
            onClick={clearFilters}
            className="px-3 py-2 text-small bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="glass-card p-6">
        {selections.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-h4 font-semibold text-neutral-900 mb-2">No selections found</h3>
            <p className="text-body text-neutral-600 mb-4">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={clearFilters}
              className="glass-button glass-button-primary"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {selections.map((selection) => {
              const statusInfo = getStatusInfo(selection.status);
              const StatusIcon = statusInfo.icon;

              return (
                <div key={selection.id} className="bg-white border border-glass-border rounded-lg p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      {/* Customer Info */}
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-semibold">
                        {selection.customers?.first_name?.[0]}{selection.customers?.last_name?.[0]}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-1">
                          {selection.customers?.first_name} {selection.customers?.last_name}
                        </h3>
                        <p className="text-small text-neutral-600 mb-1">
                          {selection.customers?.email}
                        </p>
                        <p className="text-small text-neutral-600">
                          {selection.customers?.phone}
                        </p>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-small ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                      
                      {selection.status === 'submitted' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateSelectionStatus(selection.id, 'approved')}
                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateSelectionStatus(selection.id, 'rejected')}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Design & Selection Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Design Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Shirt className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{selection.designs?.design_name}</p>
                          <p className="text-small text-neutral-600">
                            {selection.designs?.design_code} • {selection.designs?.garment_category}
                          </p>
                        </div>
                      </div>

                      {selection.fabric_library && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Palette className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{selection.fabric_library.fabric_name}</p>
                            <p className="text-small text-neutral-600">
                              {selection.fabric_library.fabric_type}
                              {selection.fabric_patterns && ` • ${selection.fabric_patterns.color_name}`}
                            </p>
                          </div>
                          {selection.fabric_patterns?.color_hex && (
                            <div
                              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: selection.fabric_patterns.color_hex }}
                              title={selection.fabric_patterns.color_name}
                            />
                          )}
                        </div>
                      )}

                      {selection.measurement_id && (
                        <div className="flex items-center gap-2 text-small text-neutral-600">
                          <Eye className="w-4 h-4" />
                          <span>Measurements linked</span>
                        </div>
                      )}
                    </div>

                    {/* Pricing & Details */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Total Price:</span>
                        <span className="text-h4 font-bold text-neutral-900">
                          AED {selection.total_price_aed?.toLocaleString() || '0'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-small">
                        <span className="text-neutral-600">Base Design:</span>
                        <span className="font-medium">
                          AED {selection.designs?.base_price_aed?.toLocaleString() || '0'}
                        </span>
                      </div>

                      {selection.fabric_library && (
                        <div className="flex items-center justify-between text-small">
                          <span className="text-neutral-600">Fabric Cost:</span>
                          <span className="font-medium">
                            AED {selection.fabric_library.selling_price_per_meter_aed}/m
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-small text-neutral-600">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {formatDate(selection.created_at)}</span>
                      </div>

                      {selection.submitted_at && (
                        <div className="flex items-center gap-2 text-small text-neutral-600">
                          <Clock className="w-4 h-4" />
                          <span>Submitted: {formatDate(selection.submitted_at)}</span>
                        </div>
                      )}

                      {selection.approved_at && (
                        <div className="flex items-center gap-2 text-small text-green-600">
                          <Check className="w-4 h-4" />
                          <span>Approved: {formatDate(selection.approved_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customization Details */}
                  {(selection.selected_variants || selection.customization_notes) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {selection.selected_variants && Object.keys(selection.selected_variants).length > 0 && (
                        <div className="mb-3">
                          <p className="text-small font-medium text-neutral-900 mb-2">Customizations:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(selection.selected_variants).map(([key, variant]: [string, any]) => (
                              <span key={key} className="text-tiny px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                {variant.label}
                                {variant.price_adjustment_aed !== 0 && (
                                  <span className="ml-1">
                                    ({variant.price_adjustment_aed > 0 ? '+' : ''}AED {variant.price_adjustment_aed})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selection.customization_notes && (
                        <div>
                          <p className="text-small font-medium text-neutral-900 mb-1">Notes:</p>
                          <p className="text-small text-neutral-700 bg-gray-50 p-3 rounded-lg">
                            {selection.customization_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}