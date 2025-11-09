import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Plus, Search, Filter, Star } from 'lucide-react';

interface Supplier {
  id: string;
  supplier_name: string;
  supplier_code: string;
  supplier_type: string;
  city: string;
  country: string;
  overall_rating: number;
  is_active: boolean;
  partnership_level: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, [filterActive]);

  const fetchSuppliers = async () => {
    try {
      let query = supabase.from('suppliers').select('*');
      
      if (filterActive !== null) {
        query = query.eq('is_active', filterActive);
      }
      
      const { data, error } = await query.order('supplier_name');
      
      if (error) throw error;
      
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplier_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Suppliers</h1>
          <p className="text-white/70 mt-1">Manage your supplier database and relationships</p>
        </div>
        <Link
          to="/suppliers/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
        >
          <Plus size={20} />
          Add Supplier
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
            <input
              type="text"
              placeholder="Search suppliers by name, code, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterActive(null)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                filterActive === null
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterActive(true)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                filterActive === true
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterActive(false)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                filterActive === false
                  ? 'bg-red-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Suppliers Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading suppliers...</div>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
          <p className="text-white/70 text-lg">No suppliers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Link
              key={supplier.id}
              to={`/suppliers/${supplier.id}`}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                    {supplier.supplier_name}
                  </h3>
                  <p className="text-white/60 text-sm mt-1">{supplier.supplier_code}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  supplier.is_active 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {supplier.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="font-medium">Type:</span>
                  <span>{supplier.supplier_type || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="font-medium">Location:</span>
                  <span>{supplier.city || 'N/A'}, {supplier.country || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="font-medium">Partnership:</span>
                  <span className="capitalize">{supplier.partnership_level || 'Standard'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(supplier.overall_rating || 0) 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-white/20'}
                    />
                  ))}
                  <span className="text-white/70 text-sm ml-2">
                    {(supplier.overall_rating || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
