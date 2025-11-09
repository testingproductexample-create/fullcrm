import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Save } from 'lucide-react';

export default function AddSupplier() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplier_name: '',
    business_name: '',
    supplier_code: '',
    supplier_type: 'fabric_supplier',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    address_line1: '',
    city: '',
    country: 'UAE',
    postal_code: '',
    payment_terms: '',
    lead_time_days: 0,
    website_url: '',
    partnership_level: 'standard',
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('suppliers')
        .insert([{
          ...formData,
          organization_id: '00000000-0000-0000-0000-000000000000',
          created_by: '00000000-0000-0000-0000-000000000000'
        }]);

      if (error) throw error;

      navigate('/suppliers');
    } catch (error) {
      console.error('Error creating supplier:', error);
      alert('Error creating supplier. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/suppliers"
          className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200"
        >
          <ArrowLeft className="text-white" size={20} />
        </Link>
        <h1 className="text-3xl font-bold text-white">Add New Supplier</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Supplier Name *</label>
              <input
                type="text"
                required
                value={formData.supplier_name}
                onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Supplier Code *</label>
              <input
                type="text"
                required
                value={formData.supplier_code}
                onChange={(e) => setFormData({...formData, supplier_code: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Business Name</label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Supplier Type</label>
              <select
                value={formData.supplier_type}
                onChange={(e) => setFormData({...formData, supplier_type: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="fabric_supplier">Fabric Supplier</option>
                <option value="trimming_supplier">Trimming Supplier</option>
                <option value="button_supplier">Button Supplier</option>
                <option value="zipper_supplier">Zipper Supplier</option>
                <option value="thread_supplier">Thread Supplier</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Primary Contact Name</label>
              <input
                type="text"
                value={formData.primary_contact_name}
                onChange={(e) => setFormData({...formData, primary_contact_name: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Email</label>
              <input
                type="email"
                value={formData.primary_contact_email}
                onChange={(e) => setFormData({...formData, primary_contact_email: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Phone</label>
              <input
                type="tel"
                value={formData.primary_contact_phone}
                onChange={(e) => setFormData({...formData, primary_contact_phone: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Website</label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-white/70 text-sm mb-2">Address</label>
              <input
                type="text"
                value={formData.address_line1}
                onChange={(e) => setFormData({...formData, address_line1: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Business Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Payment Terms</label>
              <input
                type="text"
                value={formData.payment_terms}
                onChange={(e) => setFormData({...formData, payment_terms: e.target.value})}
                placeholder="e.g., Net 30"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Lead Time (days)</label>
              <input
                type="number"
                value={formData.lead_time_days}
                onChange={(e) => setFormData({...formData, lead_time_days: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Partnership Level</label>
              <select
                value={formData.partnership_level}
                onChange={(e) => setFormData({...formData, partnership_level: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="standard">Standard</option>
                <option value="preferred">Preferred</option>
                <option value="strategic">Strategic</option>
              </select>
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Status</label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({...formData, is_active: e.target.value === 'active'})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Creating...' : 'Create Supplier'}
          </button>
          <Link
            to="/suppliers"
            className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
