'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  UsersIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Customer } from '@/types/customer';

// Force this page to be dynamic (disable static generation)
export const dynamic = 'force-dynamic';

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: async (): Promise<Customer[]> => {
      let query = supabase
        .from('customers')
        .select(`
          id,
          customer_code,
          full_name,
          email,
          phone,
          phone_secondary,
          address_line1,
          address_line2,
          city,
          emirate,
          status,
          classification,
          loyalty_tier,
          total_orders,
          total_spent,
          created_at,
          updated_at
        `);

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,customer_code.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: stats } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => {
      const [totalCustomers, newThisMonth, activeCustomers] = await Promise.all([
        supabase.from('customers').select('count', { count: 'exact' }),
        supabase.from('customers').select('count', { count: 'exact' }).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('customers').select('count', { count: 'exact' }).gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      return {
        total: totalCustomers.count || 0,
        newThisMonth: newThisMonth.count || 0,
        active: activeCustomers.count || 0,
      };
    },
    refetchInterval: 60000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'prospect': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blacklisted': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLoyaltyTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Manage your customer relationships and profiles</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/customers/analytics`}>
            <Button variant="outline" className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Link href={`/customers/new`}>
            <Button className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Add Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.newThisMonth || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.active || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers by name, email, phone, or customer code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Customer List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error loading customers</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : customers && customers.length > 0 ? (
            <div className="grid gap-4">
              {customers.map((customer) => (
                <Link key={customer.id} href={`/customers/${customer.id}`}>
                  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{customer.full_name}</h3>
                          <Badge className={getStatusColor(customer.status || 'active')}>
                            {customer.status || 'active'}
                          </Badge>
                          {customer.loyalty_tier && (
                            <Badge className={getLoyaltyTierColor(customer.loyalty_tier)}>
                              {customer.loyalty_tier}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Code:</span>
                            <span>{customer.customer_code}</span>
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-2">
                              <EnvelopeIcon className="h-4 w-4" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-2">
                              <PhoneIcon className="h-4 w-4" />
                              {customer.phone}
                            </div>
                          )}
                          {(customer.address_line1 || customer.city) && (
                            <div className="flex items-center gap-2">
                              <MapPinIcon className="h-4 w-4" />
                              {[customer.address_line1, customer.city, customer.emirate].filter(Boolean).join(', ')}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Classification:</span>
                            <span className="capitalize">{customer.classification || 'regular'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.total_orders || 0} orders
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(customer.total_spent || 0)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Joined {formatDate(customer.created_at || '')}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first customer.
              </p>
              <div className="mt-6">
                <Link href={`/customers/new`}>
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}