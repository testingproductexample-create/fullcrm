'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Customer } from '@/types/database';
import { 
  Search, 
  Plus, 
  Filter, 
  Download,
  Mail,
  Phone,
  MessageSquare,
  MoreVertical,
  Eye,
  Edit,
  Trash,
  Award,
  Calendar,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function CustomersPage() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClassification, setFilterClassification] = useState<string>('all');

  useEffect(() => {
    fetchCustomers();
  }, [profile]);

  async function fetchCustomers() {
    if (!profile?.organization_id) return;

    try {
      let query = supabase
        .from('customers')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    const matchesClassification = filterClassification === 'all' || customer.classification === filterClassification;

    return matchesSearch && matchesStatus && matchesClassification;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-semantic-success/20 text-green-900';
      case 'Inactive':
        return 'bg-neutral-200 text-neutral-700';
      case 'Blocked':
        return 'bg-semantic-error/20 text-red-900';
      default:
        return 'bg-neutral-200 text-neutral-700';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return 'bg-purple-100 text-purple-900';
      case 'Gold':
        return 'bg-yellow-100 text-yellow-900';
      case 'Silver':
        return 'bg-gray-200 text-gray-900';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-glass-light rounded-lg animate-pulse"></div>
        <div className="h-96 bg-glass-light rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Customers</h1>
          <p className="text-body text-neutral-700 mt-1">
            Manage your customer database and relationships
          </p>
        </div>
        <Link href="/dashboard/customers/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Customer
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700">Total</p>
              <p className="text-h3 font-bold text-neutral-900">{customers.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-500" />
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700">Active</p>
              <p className="text-h3 font-bold text-semantic-success">
                {customers.filter(c => c.status === 'Active').length}
              </p>
            </div>
            <Award className="w-8 h-8 text-semantic-success" />
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700">VIP</p>
              <p className="text-h3 font-bold text-semantic-warning">
                {customers.filter(c => c.classification === 'VIP').length}
              </p>
            </div>
            <Award className="w-8 h-8 text-semantic-warning" />
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small text-neutral-700">Total Revenue</p>
              <p className="text-large font-bold text-primary-600">
                AED {customers.reduce((sum, c) => sum + parseFloat(c.total_spent.toString() || '0'), 0).toLocaleString('en-AE', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search customers by name, email, phone, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-glass pl-10 w-full"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-glass"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Blocked">Blocked</option>
          </select>

          <select
            value={filterClassification}
            onChange={(e) => setFilterClassification(e.target.value)}
            className="input-glass"
          >
            <option value="all">All Types</option>
            <option value="VIP">VIP</option>
            <option value="Regular">Regular</option>
            <option value="New">New</option>
          </select>

          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Customer Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-6 py-4 text-left text-small font-semibold text-neutral-900">Customer</th>
                <th className="px-6 py-4 text-left text-small font-semibold text-neutral-900">Contact</th>
                <th className="px-6 py-4 text-left text-small font-semibold text-neutral-900">Status</th>
                <th className="px-6 py-4 text-left text-small font-semibold text-neutral-900">Loyalty</th>
                <th className="px-6 py-4 text-left text-small font-semibold text-neutral-900">Orders</th>
                <th className="px-6 py-4 text-left text-small font-semibold text-neutral-900">Spent</th>
                <th className="px-6 py-4 text-left text-small font-semibold text-neutral-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-body text-neutral-700">No customers found</p>
                    <Link href="/dashboard/customers/new" className="text-primary-500 hover:text-primary-600 font-medium mt-2 inline-block">
                      Add your first customer
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-neutral-900">{customer.full_name}</p>
                        <p className="text-small text-neutral-700">{customer.customer_code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-small text-neutral-700">
                            <Mail className="w-4 h-4" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-small text-neutral-700">
                            <Phone className="w-4 h-4" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-tiny font-medium ${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-3 py-1 rounded-full text-tiny font-medium w-fit ${getTierColor(customer.loyalty_tier)}`}>
                          {customer.loyalty_tier}
                        </span>
                        <span className="text-tiny text-neutral-700">{customer.loyalty_points} pts</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-neutral-900">{customer.total_orders}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-primary-600">
                        AED {parseFloat(customer.total_spent.toString()).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          className="p-2 hover:bg-glass-light rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-neutral-700" />
                        </Link>
                        <button
                          className="p-2 hover:bg-glass-light rounded-md transition-colors"
                          title="Send Message"
                        >
                          <MessageSquare className="w-4 h-4 text-neutral-700" />
                        </button>
                        <button
                          className="p-2 hover:bg-glass-light rounded-md transition-colors"
                          title="More Options"
                        >
                          <MoreVertical className="w-4 h-4 text-neutral-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
