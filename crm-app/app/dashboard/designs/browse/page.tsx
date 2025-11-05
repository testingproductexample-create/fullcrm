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
  Eye,
  Heart,
  Star,
  ChevronDown,
  Shirt,
  Plus,
  ArrowLeft
} from 'lucide-react';

interface Design {
  id: string;
  design_code: string;
  design_name: string;
  garment_category: string;
  cultural_variant: string;
  description: string;
  final_price_aed: number;
  complexity_level: string;
  estimated_hours: number;
  season_tags: string[];
  occasion_tags: string[];
  style_tags: string[];
  popularity_score: number;
  view_count: number;
  selection_count: number;
  is_featured: boolean;
  design_media: any[];
}

export default function DesignBrowsePage() {
  const { profile } = useAuth();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    category: '',
    cultural_variant: '',
    occasion: '',
    season: '',
    complexity: '',
    featured: false
  });
  const [sortBy, setSortBy] = useState('popularity');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchDesigns();
    }
  }, [profile?.organization_id, filters, sortBy]);

  const fetchDesigns = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('designs')
        .select(`
          id,
          design_code,
          design_name,
          garment_category,
          cultural_variant,
          description,
          final_price_aed,
          complexity_level,
          estimated_hours,
          season_tags,
          occasion_tags,
          style_tags,
          popularity_score,
          view_count,
          selection_count,
          is_featured,
          design_media(
            media_url,
            thumbnail_url,
            view_angle,
            is_primary
          )
        `)
        .eq('organization_id', profile?.organization_id)
        .eq('is_active', true);

      // Apply filters
      if (filters.category) query = query.eq('garment_category', filters.category);
      if (filters.cultural_variant) query = query.eq('cultural_variant', filters.cultural_variant);
      if (filters.complexity) query = query.eq('complexity_level', filters.complexity);
      if (filters.featured) query = query.eq('is_featured', true);
      if (filters.occasion) query = query.contains('occasion_tags', [filters.occasion]);
      if (filters.season) query = query.contains('season_tags', [filters.season]);

      // Apply search
      if (searchQuery) {
        query = query.or(`design_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'popularity':
          query = query.order('popularity_score', { ascending: false });
          break;
        case 'price_low':
          query = query.order('final_price_aed', { ascending: true });
          break;
        case 'price_high':
          query = query.order('final_price_aed', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'name':
          query = query.order('design_name', { ascending: true });
          break;
        default:
          query = query.order('popularity_score', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setDesigns(data || []);

    } catch (error) {
      console.error('Error fetching designs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      cultural_variant: '',
      occasion: '',
      season: '',
      complexity: '',
      featured: false
    });
    setSearchQuery('');
  };

  const getPrimaryImage = (design: Design) => {
    const primaryMedia = design.design_media?.find(media => media.is_primary);
    return primaryMedia?.thumbnail_url || primaryMedia?.media_url || '/placeholder-design.jpg';
  };

  const categoryOptions = [
    { value: 'suit', label: 'Suits' },
    { value: 'shirt', label: 'Shirts' },
    { value: 'trouser', label: 'Trousers' },
    { value: 'dress', label: 'Dresses' },
    { value: 'thobe', label: 'Thobes/Kanduras' },
    { value: 'casual', label: 'Casual Wear' }
  ];

  const culturalOptions = [
    { value: 'emirati', label: 'Emirati Traditional' },
    { value: 'gulf', label: 'Gulf Modern' },
    { value: 'western', label: 'Western Contemporary' },
    { value: 'fusion', label: 'Fusion Styles' }
  ];

  const occasionOptions = [
    { value: 'formal', label: 'Formal' },
    { value: 'business', label: 'Business' },
    { value: 'casual', label: 'Casual' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'traditional', label: 'Traditional' }
  ];

  const seasonOptions = [
    { value: 'summer', label: 'Summer' },
    { value: 'winter', label: 'Winter' },
    { value: 'all-season', label: 'All Season' },
    { value: 'spring', label: 'Spring' }
  ];

  const complexityOptions = [
    { value: 'simple', label: 'Simple' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'complex', label: 'Complex' },
    { value: 'expert', label: 'Expert' }
  ];

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
            <h1 className="text-h2 font-bold text-neutral-900">Browse Designs</h1>
            <p className="text-body text-neutral-700">
              Explore our complete design catalog with {designs.length} designs
            </p>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search designs by name or description..."
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
              <option value="popularity">Most Popular</option>
              <option value="newest">Newest First</option>
              <option value="name">Name A-Z</option>
              <option value="price_low">Price Low to High</option>
              <option value="price_high">Price High to Low</option>
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
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="px-3 py-2 text-small border border-glass-border rounded focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={filters.cultural_variant}
            onChange={(e) => updateFilter('cultural_variant', e.target.value)}
            className="px-3 py-2 text-small border border-glass-border rounded focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Styles</option>
            {culturalOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={filters.occasion}
            onChange={(e) => updateFilter('occasion', e.target.value)}
            className="px-3 py-2 text-small border border-glass-border rounded focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Occasions</option>
            {occasionOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={filters.season}
            onChange={(e) => updateFilter('season', e.target.value)}
            className="px-3 py-2 text-small border border-glass-border rounded focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Seasons</option>
            {seasonOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={filters.complexity}
            onChange={(e) => updateFilter('complexity', e.target.value)}
            className="px-3 py-2 text-small border border-glass-border rounded focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Complexity</option>
            {complexityOptions.map(option => (
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

        {/* Featured Toggle */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            id="featured"
            checked={filters.featured}
            onChange={(e) => updateFilter('featured', e.target.checked)}
            className="rounded border-glass-border text-primary-500 focus:ring-primary-500"
          />
          <label htmlFor="featured" className="text-small text-neutral-700">
            Show only featured designs
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="glass-card p-6">
        {designs.length === 0 ? (
          <div className="text-center py-12">
            <Shirt className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-h4 font-semibold text-neutral-900 mb-2">No designs found</h3>
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
            {designs.map((design) => (
              viewMode === 'grid' ? (
                <div key={design.id} className="group bg-white rounded-lg border border-glass-border overflow-hidden hover:shadow-lg transition-all duration-200">
                  {/* Image */}
                  <div className="aspect-[3/4] bg-gray-50 overflow-hidden">
                    <img
                      src={getPrimaryImage(design)}
                      alt={design.design_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
                          {design.design_name}
                        </h3>
                        <p className="text-small text-neutral-600 capitalize">
                          {design.garment_category}
                          {design.cultural_variant && ` • ${design.cultural_variant}`}
                        </p>
                      </div>
                      {design.is_featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    
                    <p className="text-small text-neutral-700 mb-3 line-clamp-2">
                      {design.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-h4 font-bold text-neutral-900">
                        AED {design.final_price_aed.toLocaleString()}
                      </span>
                      <span className={`text-tiny px-2 py-1 rounded-full ${
                        design.complexity_level === 'simple' ? 'bg-green-100 text-green-700' :
                        design.complexity_level === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                        design.complexity_level === 'complex' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {design.complexity_level}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-small text-neutral-600">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{design.view_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          <span>{design.selection_count}</span>
                        </div>
                      </div>
                      <span>{design.estimated_hours}h</span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex flex-wrap gap-1">
                        {design.occasion_tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-tiny px-2 py-1 bg-glass-light rounded-full text-neutral-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={design.id} className="flex items-center gap-6 p-4 bg-white rounded-lg border border-glass-border hover:shadow-md transition-all">
                  <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={getPrimaryImage(design)}
                      alt={design.design_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-neutral-900 hover:text-primary-600 transition-colors">
                          {design.design_name}
                        </h3>
                        <p className="text-small text-neutral-600">
                          {design.design_code} • {design.garment_category}
                          {design.cultural_variant && ` • ${design.cultural_variant}`}
                        </p>
                      </div>
                      {design.is_featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    
                    <p className="text-small text-neutral-700 mb-2 line-clamp-2">
                      {design.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {design.occasion_tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-tiny px-2 py-1 bg-glass-light rounded-full text-neutral-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <p className="text-h4 font-bold text-neutral-900 mb-1">
                      AED {design.final_price_aed.toLocaleString()}
                    </p>
                    <p className="text-small text-neutral-600 mb-2">
                      {design.estimated_hours}h • {design.complexity_level}
                    </p>
                    <div className="flex items-center gap-3 text-small text-neutral-600">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{design.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>{design.selection_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}