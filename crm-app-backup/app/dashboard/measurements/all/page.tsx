'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Search, Filter, Ruler, Eye, Calendar } from 'lucide-react';

interface Measurement {
  id: string;
  customer_id: string;
  garment_type: string;
  measurement_date: string;
  measurements: Record<string, number>;
  body_type: string;
  fit_preference: string;
  version_number: number;
  is_latest: boolean;
  customers: {
    full_name: string;
    customer_code: string;
  };
}

export default function AllMeasurementsPage() {
  const { profile } = useAuth();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [filteredMeasurements, setFilteredMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [garmentFilter, setGarmentFilter] = useState('all');
  const [showLatestOnly, setShowLatestOnly] = useState(true);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchMeasurements();
    }
  }, [profile?.organization_id, showLatestOnly]);

  useEffect(() => {
    filterMeasurements();
  }, [measurements, searchTerm, garmentFilter]);

  const fetchMeasurements = async () => {
    try {
      let query = supabase
        .from('customer_measurements')
        .select('*, customers(full_name, customer_code)')
        .eq('organization_id', profile?.organization_id)
        .order('measurement_date', { ascending: false });

      if (showLatestOnly) {
        query = query.eq('is_latest', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMeasurements(data || []);
      setFilteredMeasurements(data || []);
    } catch (error) {
      console.error('Error fetching measurements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMeasurements = () => {
    let filtered = measurements;

    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.customers.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.customers.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (garmentFilter !== 'all') {
      filtered = filtered.filter(m => m.garment_type === garmentFilter);
    }

    setFilteredMeasurements(filtered);
  };

  const garmentTypes = [
    { value: 'all', label: 'All Garments' },
    { value: 'suit', label: 'Suits' },
    { value: 'shirt', label: 'Shirts' },
    { value: 'trouser', label: 'Trousers' },
    { value: 'dress', label: 'Dresses' },
    { value: 'thobe', label: 'Thobes' },
    { value: 'casual', label: 'Casual' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-neutral-900 mb-2">All Measurements</h1>
        <p className="text-neutral-600">View and manage all customer measurements</p>
      </div>

      {/* Filters */}
      <div className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by customer name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Garment Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <select
              value={garmentFilter}
              onChange={(e) => setGarmentFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {garmentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Latest Only Toggle */}
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showLatestOnly}
                onChange={(e) => setShowLatestOnly(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-neutral-300 rounded focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-neutral-700">Show Latest Only</span>
            </label>
          </div>
        </div>

        <div className="text-sm text-neutral-600">
          Showing {filteredMeasurements.length} of {measurements.length} measurements
        </div>
      </div>

      {/* Measurements List */}
      <div className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Garment Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Body Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Fit</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Version</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredMeasurements.length > 0 ? (
                filteredMeasurements.map((measurement) => (
                  <tr key={measurement.id} className="hover:bg-white/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-neutral-900">{measurement.customers.full_name}</p>
                        <p className="text-sm text-neutral-600">{measurement.customers.customer_code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                        <Ruler className="w-4 h-4 mr-1" />
                        {measurement.garment_type.charAt(0).toUpperCase() + measurement.garment_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-neutral-700">
                        <Calendar className="w-4 h-4 mr-2 text-neutral-500" />
                        {new Date(measurement.measurement_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-700 capitalize">{measurement.body_type || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-700 capitalize">{measurement.fit_preference || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-neutral-700">v{measurement.version_number}</span>
                        {measurement.is_latest && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Latest</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/measurements/${measurement.id}`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    No measurements found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
