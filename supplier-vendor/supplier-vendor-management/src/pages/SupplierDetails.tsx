import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Mail, Phone, Globe, MapPin, Star, TrendingUp, FileText, Package } from 'lucide-react';

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
  website_url: string;
  address_line1: string;
  payment_terms: string;
  lead_time_days: number;
  delivery_rating: number;
  quality_rating: number;
  service_rating: number;
}

export default function SupplierDetails() {
  const { id } = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchSupplierDetails();
      fetchPerformance();
      fetchContracts();
    }
  }, [id]);

  const fetchSupplierDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      setSupplier(data);
    } catch (error) {
      console.error('Error fetching supplier details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_performance')
        .select('*')
        .eq('supplier_id', id)
        .order('evaluation_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      setPerformance(data || []);
    } catch (error) {
      console.error('Error fetching performance:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_contracts')
        .select('*')
        .eq('supplier_id', id)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Loading supplier details...</div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center text-white py-12">
        <p>Supplier not found</p>
        <Link to="/suppliers" className="text-purple-400 hover:text-purple-300 mt-4 inline-block">
          Back to Suppliers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/suppliers"
          className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200"
        >
          <ArrowLeft className="text-white" size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{supplier.supplier_name}</h1>
          <p className="text-white/70 mt-1">{supplier.supplier_code}</p>
        </div>
        <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
          supplier.is_active 
            ? 'bg-green-500/20 text-green-300' 
            : 'bg-red-500/20 text-red-300'
        }`}>
          {supplier.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-2 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white/70 text-sm">Primary Contact</label>
              <p className="text-white font-medium mt-1">{supplier.primary_contact_name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-white/70 text-sm">Partnership Level</label>
              <p className="text-white font-medium mt-1 capitalize">{supplier.partnership_level || 'Standard'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="text-purple-400" size={18} />
              <div>
                <label className="text-white/70 text-sm">Email</label>
                <p className="text-white font-medium">{supplier.primary_contact_email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="text-purple-400" size={18} />
              <div>
                <label className="text-white/70 text-sm">Phone</label>
                <p className="text-white font-medium">{supplier.primary_contact_phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="text-purple-400" size={18} />
              <div>
                <label className="text-white/70 text-sm">Location</label>
                <p className="text-white font-medium">{supplier.city}, {supplier.country}</p>
              </div>
            </div>
            {supplier.website_url && (
              <div className="flex items-center gap-2">
                <Globe className="text-purple-400" size={18} />
                <div>
                  <label className="text-white/70 text-sm">Website</label>
                  <a href={supplier.website_url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 font-medium">
                    Visit Website
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ratings */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Ratings</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-sm">Overall</span>
                <span className="text-white font-bold">{(supplier.overall_rating || 0).toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < Math.floor(supplier.overall_rating || 0) 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-white/20'}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-sm">Quality</span>
                <span className="text-white font-bold">{(supplier.quality_rating || 0).toFixed(1)}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" 
                  style={{ width: `${(supplier.quality_rating / 10) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-sm">Delivery</span>
                <span className="text-white font-bold">{(supplier.delivery_rating || 0).toFixed(1)}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" 
                  style={{ width: `${(supplier.delivery_rating / 10) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-sm">Service</span>
                <span className="text-white font-bold">{(supplier.service_rating || 0).toFixed(1)}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-2 rounded-full" 
                  style={{ width: `${(supplier.service_rating / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Terms */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">Business Terms</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-white/70 text-sm">Payment Terms</label>
            <p className="text-white font-medium mt-1">{supplier.payment_terms || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-white/70 text-sm">Lead Time</label>
            <p className="text-white font-medium mt-1">{supplier.lead_time_days || 0} days</p>
          </div>
          <div>
            <label className="text-white/70 text-sm">Supplier Type</label>
            <p className="text-white font-medium mt-1 capitalize">{supplier.supplier_type || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Recent Performance */}
      {performance.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Recent Performance Evaluations</h2>
          <div className="space-y-3">
            {performance.map((perf: any) => (
              <div key={perf.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">
                      {new Date(perf.evaluation_date).toLocaleDateString()}
                    </p>
                    <p className="text-white/60 text-sm mt-1">
                      On-Time: {perf.on_time_delivery_rate}% | Quality: {perf.quality_rating.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-400">
                      {perf.overall_score.toFixed(1)}
                    </p>
                    <p className="text-white/60 text-sm">Overall Score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Contracts */}
      {contracts.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Contracts</h2>
          <div className="space-y-3">
            {contracts.map((contract: any) => (
              <div key={contract.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{contract.contract_number}</p>
                    <p className="text-white/60 text-sm mt-1">
                      {new Date(contract.start_date).toLocaleDateString()} - {new Date(contract.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    contract.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {contract.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
