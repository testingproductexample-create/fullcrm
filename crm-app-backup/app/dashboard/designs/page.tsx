'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Search,
  Palette,
  Shirt,
  Scissors,
  Users,
  TrendingUp,
  Eye,
  Heart,
  Plus,
  Filter,
  Grid3X3,
  List,
  ArrowRight
} from 'lucide-react';

interface DesignStats {
  totalDesigns: number;
  totalFabrics: number;
  totalSelections: number;
  totalApprovals: number;
  popularDesigns: any[];
  recentSelections: any[];
}

export default function DesignCatalogPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DesignStats>({
    totalDesigns: 0,
    totalFabrics: 0,
    totalSelections: 0,
    totalApprovals: 0,
    popularDesigns: [],
    recentSelections: []
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchStats();
    }
  }, [profile?.organization_id]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch design stats
      const { data: designs, error: designsError } = await supabase
        .from('designs')
        .select('id, design_name, garment_category, view_count, selection_count, is_featured')
        .eq('organization_id', profile?.organization_id)
        .eq('is_active', true);

      if (designsError) throw designsError;

      // Fetch fabric stats
      const { data: fabrics, error: fabricsError } = await supabase
        .from('fabric_library')
        .select('id')
        .eq('organization_id', profile?.organization_id)
        .eq('is_available', true);

      if (fabricsError) throw fabricsError;

      // Fetch selection stats
      const { data: selections, error: selectionsError } = await supabase
        .from('customer_design_selections')
        .select(`
          id, 
          total_price_aed, 
          status, 
          created_at,
          designs(design_name, garment_category),
          customers(first_name, last_name)
        `)
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (selectionsError) throw selectionsError;

      // Fetch approval stats
      const { data: approvals, error: approvalsError } = await supabase
        .from('design_approval_requests')
        .select('id')
        .eq('organization_id', profile?.organization_id);

      if (approvalsError) throw approvalsError;

      // Sort designs by popularity
      const popularDesigns = [...(designs || [])]
        .sort((a, b) => (b.view_count + b.selection_count) - (a.view_count + a.selection_count))
        .slice(0, 6);

      setStats({
        totalDesigns: designs?.length || 0,
        totalFabrics: fabrics?.length || 0,
        totalSelections: selections?.length || 0,
        totalApprovals: approvals?.length || 0,
        popularDesigns,
        recentSelections: selections?.slice(0, 5) || []
      });

    } catch (error) {
      console.error('Error fetching design catalog stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActionCards = [
    {
      title: 'Browse Designs',
      description: 'Explore our complete design catalog',
      icon: Grid3X3,
      href: '/dashboard/designs/browse',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      title: 'Fabric Library',
      description: 'View fabrics and patterns',
      icon: Palette,
      href: '/dashboard/designs/fabrics',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600'
    },
    {
      title: 'Customer Selections',
      description: 'Manage design selections',
      icon: Heart,
      href: '/dashboard/designs/selections',
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    {
      title: 'Approval Workflow',
      description: 'Review pending approvals',
      icon: Scissors,
      href: '/dashboard/designs/approvals',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-glass-light rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-h2 font-bold text-neutral-900 mb-2">Design Catalog</h1>
            <p className="text-body text-neutral-700">
              Manage your design library, fabrics, and customer selections
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="glass-button glass-button-secondary">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <div className="flex items-center bg-glass-light rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-l-md transition-colors ${
                  viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-neutral-600'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-r-md transition-colors ${
                  viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-neutral-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-600">Total Designs</p>
              <p className="text-h3 font-bold text-neutral-900">{stats.totalDesigns}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shirt className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-600">Fabric Options</p>
              <p className="text-h3 font-bold text-neutral-900">{stats.totalFabrics}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Palette className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-600">Customer Selections</p>
              <p className="text-h3 font-bold text-neutral-900">{stats.totalSelections}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-600">Pending Approvals</p>
              <p className="text-h3 font-bold text-neutral-900">{stats.totalApprovals}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Scissors className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActionCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group glass-card p-6 hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-500 transition-colors" />
              </div>
              <h3 className="text-h4 font-semibold text-neutral-900 mb-2">{card.title}</h3>
              <p className="text-small text-neutral-600">{card.description}</p>
            </Link>
          );
        })}
      </div>

      {/* Popular Designs & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Designs */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h4 font-semibold text-neutral-900">Popular Designs</h3>
            <Link 
              href="/dashboard/designs/browse"
              className="text-small text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-3">
            {stats.popularDesigns.map((design) => (
              <div key={design.id} className="flex items-center justify-between p-3 bg-glass-light rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <Shirt className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{design.design_name}</p>
                    <p className="text-small text-neutral-600 capitalize">{design.garment_category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-small text-neutral-600">
                    <Eye className="w-3 h-3" />
                    <span>{design.view_count}</span>
                  </div>
                  <div className="flex items-center gap-1 text-small text-neutral-600">
                    <Heart className="w-3 h-3" />
                    <span>{design.selection_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Selections */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h4 font-semibold text-neutral-900">Recent Selections</h3>
            <Link 
              href="/dashboard/designs/selections"
              className="text-small text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-3">
            {stats.recentSelections.map((selection) => (
              <div key={selection.id} className="flex items-center justify-between p-3 bg-glass-light rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">
                      {selection.customers?.first_name} {selection.customers?.last_name}
                    </p>
                    <p className="text-small text-neutral-600">
                      {selection.designs?.design_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-neutral-900">
                    AED {selection.total_price_aed?.toLocaleString() || '0'}
                  </p>
                  <span className={`text-tiny px-2 py-1 rounded-full ${
                    selection.status === 'approved' ? 'bg-green-100 text-green-700' :
                    selection.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                    selection.status === 'ordered' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selection.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}