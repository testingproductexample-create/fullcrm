'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Search,
  Filter,
  Grid3X3,
  List,
  ArrowLeft,
  Palette,
  Info,
  Star,
  Eye,
  Package,
  Leaf,
  Globe,
  DollarSign
} from 'lucide-react';

interface Fabric {
  id: string;
  fabric_code: string;
  fabric_name: string;
  fabric_type: string;
  fabric_weight_gsm: number;
  fabric_composition: string;
  texture_finish: string;
  care_instructions: string;
  supplier_name: string;
  selling_price_per_meter_aed: number;
  stock_quantity_meters: number;
  minimum_order_meters: number;
  season_suitable: string[];
  garment_suitable: string[];
  country_of_origin: string;
  is_sustainable: boolean;
  is_available: boolean;
  fabric_patterns: any[];
}

export default function FabricLibraryPage() {
  const { profile } = useAuth();
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    fabric_type: '',
    garment_suitable: '',
    season_suitable: '',
    sustainable: false,
    available_only: true,
    price_range: ''
  });
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchFabrics();
    }
  }, [profile?.organization_id, filters, sortBy]);

  const fetchFabrics = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('fabric_library')
        .select(`
          id,
          fabric_code,
          fabric_name,
          fabric_type,
          fabric_weight_gsm,
          fabric_composition,
          texture_finish,
          care_instructions,
          supplier_name,
          selling_price_per_meter_aed,
          stock_quantity_meters,
          minimum_order_meters,
          season_suitable,
          garment_suitable,
          country_of_origin,
          is_sustainable,
          is_available,
          fabric_patterns(
            id,
            pattern_name,
            pattern_type,
            color_name,
            color_hex,
            pattern_image_url,
            swatch_image_url,
            is_primary_color
          )
        `)
        .eq('organization_id', profile?.organization_id);

      // Apply filters
      if (filters.fabric_type) query = query.eq('fabric_type', filters.fabric_type);
      if (filters.garment_suitable) query = query.contains('garment_suitable', [filters.garment_suitable]);
      if (filters.season_suitable) query = query.contains('season_suitable', [filters.season_suitable]);
      if (filters.sustainable) query = query.eq('is_sustainable', true);
      if (filters.available_only) query = query.eq('is_available', true);

      // Apply price range filter
      if (filters.price_range) {
        const [min, max] = filters.price_range.split('-').map(Number);
        if (max) {
          query = query.gte('selling_price_per_meter_aed', min).lte('selling_price_per_meter_aed', max);
        } else {
          query = query.gte('selling_price_per_meter_aed', min);
        }
      }

      // Apply search
      if (searchQuery) {
        query = query.or(`fabric_name.ilike.%${searchQuery}%,fabric_composition.ilike.%${searchQuery}%,supplier_name.ilike.%${searchQuery}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'name':
          query = query.order('fabric_name', { ascending: true });
          break;
        case 'price_low':
          query = query.order('selling_price_per_meter_aed', { ascending: true });
          break;
        case 'price_high':
          query = query.order('selling_price_per_meter_aed', { ascending: false });
          break;
        case 'stock':
          query = query.order('stock_quantity_meters', { ascending: false });
          break;
        case 'type':
          query = query.order('fabric_type', { ascending: true });
          break;
        default:
          query = query.order('fabric_name', { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;
      setFabrics(data || []);

    } catch (error) {
      console.error('Error fetching fabrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      fabric_type: '',
      garment_suitable: '',
      season_suitable: '',
      sustainable: false,
      available_only: true,
      price_range: ''
    });
    setSearchQuery('');
  };

  const getPrimaryPattern = (fabric: Fabric) => {
    const primaryPattern = fabric.fabric_patterns?.find(pattern => pattern.is_primary_color);
    return primaryPattern || fabric.fabric_patterns?.[0];
  };

  const fabricTypeOptions = [
    { value: 'wool', label: 'Wool' },
    { value: 'cotton', label: 'Cotton' },
    { value: 'silk', label: 'Silk' },
    { value: 'linen', label: 'Linen' },
    { value: 'polyester', label: 'Polyester' },
    { value: 'blend', label: 'Blend' }
  ];

  const garmentOptions = [
    { value: 'suit', label: 'Suits' },
    { value: 'shirt', label: 'Shirts' },
    { value: 'trouser', label: 'Trousers' },
    { value: 'dress', label: 'Dresses' },
    { value: 'thobe', label: 'Thobes' },
    { value: 'casual', label: 'Casual' }
  ];

  const seasonOptions = [
    { value: 'summer', label: 'Summer' },
    { value: 'winter', label: 'Winter' },
    { value: 'all-season', label: 'All Season' },
    { value: 'spring', label: 'Spring' }
  ];

  const priceRangeOptions = [
    { value: '', label: 'All Prices' },
    { value: '0-50', label: 'Under AED 50' },
    { value: '50-100', label: 'AED 50-100' },
    { value: '100-150', label: 'AED 100-150' },
    { value: '150-', label: 'Over AED 150' }
  ];

  const getStockStatus = (stock: number, minimum: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
    if (stock <= minimum * 2) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-700' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-glass-light rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-64 bg-glass-light rounded"></div>
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
            <h1 className="text-h2 font-bold text-neutral-900">Fabric Library</h1>
            <p className="text-body text-neutral-700">
              Browse our fabric collection with {fabrics.length} available fabrics
            </p>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search fabrics by name, composition, or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="name">Name A-Z</option>
              <option value="type">Fabric Type</option>
              <option value="price_low">Price Low to High</option>
              <option value="price_high">Price High to Low</option>
              <option value="stock">Stock Level</option>
            </select>
            
            <div className="flex items-center bg-glass-light rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-l-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-neutral-600'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-r-lg transition-colors ${
                  viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-neutral-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <select
            value={filters.fabric_type}
            onChange={(e) => updateFilter('fabric_type', e.target.value)}
            className="px-3 py-2 text-small border border-glass-border rounded focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            {fabricTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={filters.garment_suitable}
            onChange={(e) => updateFilter('garment_suitable', e.target.value)}
            className="px-3 py-2 text-small border border-glass-border rounded focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Garments</option>
            {garmentOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={filters.season_suitable}
            onChange={(e) => updateFilter('season_suitable', e.target.value)}
            className="px-3 py-2 text-small border border-glass-border rounded focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Seasons</option>
            {seasonOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={filters.price_range}
            onChange={(e) => updateFilter('price_range', e.target.value)}
            className="px-3 py-2 text-small border border-glass-border rounded focus:ring-2 focus:ring-primary-500"
          >
            {priceRangeOptions.map(option => (
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

        {/* Filter Toggles */}
        <div className="mt-3 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sustainable"
              checked={filters.sustainable}
              onChange={(e) => updateFilter('sustainable', e.target.checked)}
              className="rounded border-glass-border text-primary-500 focus:ring-primary-500"
            />
            <label htmlFor="sustainable" className="text-small text-neutral-700 flex items-center gap-1">
              <Leaf className="w-3 h-3 text-green-600" />
              Sustainable only
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="available"
              checked={filters.available_only}
              onChange={(e) => updateFilter('available_only', e.target.checked)}
              className="rounded border-glass-border text-primary-500 focus:ring-primary-500"
            />
            <label htmlFor="available" className="text-small text-neutral-700">
              Available only
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="glass-card p-6">
        {fabrics.length === 0 ? (
          <div className="text-center py-12">
            <Palette className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-h4 font-semibold text-neutral-900 mb-2">No fabrics found</h3>
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
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {fabrics.map((fabric) => {
              const primaryPattern = getPrimaryPattern(fabric);
              const stockStatus = getStockStatus(fabric.stock_quantity_meters, fabric.minimum_order_meters);
              
              return viewMode === 'grid' ? (
                <div key={fabric.id} className="group bg-white rounded-lg border border-glass-border overflow-hidden hover:shadow-lg transition-all duration-200">
                  {/* Image/Pattern */}
                  <div className="aspect-square bg-gray-50 overflow-hidden relative">
                    {primaryPattern?.swatch_image_url ? (
                      <img
                        src={primaryPattern.swatch_image_url}
                        alt={`${fabric.fabric_name} - ${primaryPattern.color_name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: primaryPattern?.color_hex || '#6B7280' }}
                      >
                        {fabric.fabric_name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {fabric.is_sustainable && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-tiny rounded-full">
                          <Leaf className="w-3 h-3" />
                          Eco
                        </span>
                      )}
                    </div>
                    
                    <div className="absolute top-2 right-2">
                      <span className={`text-tiny px-2 py-1 rounded-full ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {fabric.fabric_name}
                      </h3>
                      <p className="text-small text-neutral-600">
                        {fabric.fabric_code} • {fabric.fabric_type}
                      </p>
                    </div>
                    
                    <p className="text-small text-neutral-700 mb-3">
                      {fabric.fabric_composition}
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-h4 font-bold text-neutral-900">
                        AED {fabric.selling_price_per_meter_aed}/m
                      </span>
                      <span className="text-small text-neutral-600">
                        {fabric.fabric_weight_gsm} GSM
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-small">
                        <span className="text-neutral-600">Stock:</span>
                        <span className="font-medium">{fabric.stock_quantity_meters}m</span>
                      </div>
                      <div className="flex items-center justify-between text-small">
                        <span className="text-neutral-600">Min Order:</span>
                        <span className="font-medium">{fabric.minimum_order_meters}m</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-small text-neutral-600 mb-3">
                      <Globe className="w-3 h-3" />
                      <span>{fabric.country_of_origin}</span>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex flex-wrap gap-1">
                        {fabric.garment_suitable.slice(0, 2).map(garment => (
                          <span key={garment} className="text-tiny px-2 py-1 bg-glass-light rounded-full text-neutral-600">
                            {garment}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Color Variants */}
                    {fabric.fabric_patterns.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-tiny text-neutral-600 mb-2">Colors ({fabric.fabric_patterns.length})</p>
                        <div className="flex gap-1">
                          {fabric.fabric_patterns.slice(0, 5).map(pattern => (
                            <div
                              key={pattern.id}
                              className="w-4 h-4 rounded-full border border-gray-200"
                              style={{ backgroundColor: pattern.color_hex || '#6B7280' }}
                              title={pattern.color_name}
                            />
                          ))}
                          {fabric.fabric_patterns.length > 5 && (
                            <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-[8px] text-gray-600">+</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={fabric.id} className="flex items-center gap-6 p-4 bg-white rounded-lg border border-glass-border hover:shadow-md transition-all">
                  <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                    {primaryPattern?.swatch_image_url ? (
                      <img
                        src={primaryPattern.swatch_image_url}
                        alt={`${fabric.fabric_name} - ${primaryPattern.color_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white font-semibold text-small"
                        style={{ backgroundColor: primaryPattern?.color_hex || '#6B7280' }}
                      >
                        {fabric.fabric_name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-neutral-900 hover:text-primary-600 transition-colors">
                          {fabric.fabric_name}
                        </h3>
                        <p className="text-small text-neutral-600">
                          {fabric.fabric_code} • {fabric.fabric_type} • {fabric.fabric_weight_gsm} GSM
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {fabric.is_sustainable && (
                          <Leaf className="w-4 h-4 text-green-600" />
                        )}
                        <span className={`text-tiny px-2 py-1 rounded-full ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-small text-neutral-700 mb-2">
                      {fabric.fabric_composition}
                    </p>
                    
                    <div className="flex items-center gap-4 text-small text-neutral-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>Stock: {fabric.stock_quantity_meters}m</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>{fabric.country_of_origin}</span>
                      </div>
                      <span>Min: {fabric.minimum_order_meters}m</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {fabric.garment_suitable.slice(0, 4).map(garment => (
                        <span key={garment} className="text-tiny px-2 py-1 bg-glass-light rounded-full text-neutral-600">
                          {garment}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <p className="text-h4 font-bold text-neutral-900 mb-1">
                      AED {fabric.selling_price_per_meter_aed}
                    </p>
                    <p className="text-small text-neutral-600 mb-2">per meter</p>
                    
                    {/* Color Variants */}
                    {fabric.fabric_patterns.length > 0 && (
                      <div>
                        <p className="text-tiny text-neutral-600 mb-1">{fabric.fabric_patterns.length} colors</p>
                        <div className="flex gap-1 justify-end">
                          {fabric.fabric_patterns.slice(0, 4).map(pattern => (
                            <div
                              key={pattern.id}
                              className="w-3 h-3 rounded-full border border-gray-200"
                              style={{ backgroundColor: pattern.color_hex || '#6B7280' }}
                              title={pattern.color_name}
                            />
                          ))}
                          {fabric.fabric_patterns.length > 4 && (
                            <div className="w-3 h-3 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-[6px] text-gray-600">+</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}