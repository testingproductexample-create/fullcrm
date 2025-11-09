import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FileCheck, Search, Filter, Ruler, Scissors, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface Standard {
  id: string;
  standard_type: string;
  category: string;
  subcategory: string;
  description: string;
  tolerance: string | null;
  measurement_unit: string | null;
  status: string;
}

const Standards = () => {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    fetchStandards();
  }, [filterType, filterCategory]);

  const fetchStandards = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('quality_standards')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('standard_type', filterType);
      }

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStandards(data || []);
    } catch (error: any) {
      toast.error('Failed to load standards: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStandards = standards.filter((standard) =>
    standard.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    standard.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    standard.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'measurement':
        return <Ruler className="w-5 h-5 text-blue-400" />;
      case 'workmanship':
        return <Scissors className="w-5 h-5 text-purple-400" />;
      case 'fabric':
        return <Palette className="w-5 h-5 text-green-400" />;
      default:
        return <FileCheck className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'measurement':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'workmanship':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'fabric':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const categories = [...new Set(standards.map(s => s.category))];
  const types = [...new Set(standards.map(s => s.standard_type))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Quality Standards Library</h1>
        <p className="text-white/60 mt-2">
          Comprehensive quality standards for measurement, fabric, and workmanship
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total Standards</p>
                <p className="text-2xl font-bold text-white">{standards.length}</p>
              </div>
              <FileCheck className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Measurement Standards</p>
                <p className="text-2xl font-bold text-blue-400">
                  {standards.filter(s => s.standard_type === 'measurement').length}
                </p>
              </div>
              <Ruler className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Workmanship Standards</p>
                <p className="text-2xl font-bold text-purple-400">
                  {standards.filter(s => s.standard_type === 'workmanship').length}
                </p>
              </div>
              <Scissors className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Search standards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Standards List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="py-12 text-center text-white/60">
              Loading standards...
            </CardContent>
          </Card>
        ) : filteredStandards.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="py-12 text-center text-white/60">
              No standards found
            </CardContent>
          </Card>
        ) : (
          filteredStandards.map((standard) => (
            <Card key={standard.id} className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/15 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-white/5">
                    {getTypeIcon(standard.standard_type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded text-xs font-medium border ${getTypeColor(standard.standard_type)}`}>
                            {standard.standard_type.toUpperCase()}
                          </span>
                          <span className="text-white/60 text-sm">
                            {standard.category} • {standard.subcategory}
                          </span>
                        </div>
                        
                        <p className="text-white font-medium mb-2">{standard.description}</p>
                        
                        {standard.tolerance && standard.measurement_unit && (
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-white/70">
                              <Ruler className="w-4 h-4" />
                              <span>Tolerance: ±{standard.tolerance} {standard.measurement_unit}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <span className={`ml-4 px-3 py-1 rounded text-xs font-medium ${
                        standard.status === 'active' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {standard.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Standards;
