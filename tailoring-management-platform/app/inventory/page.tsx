'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Package, 
  Truck, 
  AlertTriangle, 
  TrendingUp,
  DollarSign,
  Layers,
  ShoppingCart,
  BarChart3,
  Eye,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Package2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { 
  InventoryStats, 
  QualityStats, 
  StockAlert,
  FabricLibrary,
  Supplier,
  PurchaseOrder,
  InventoryStock
} from '@/types/inventory';
import { formatAEDCurrency, getStockStatus } from '@/types/inventory';

interface DashboardCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  href?: string;
}

export default function InventoryDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch inventory statistics
  const { data: inventoryStats, isLoading: statsLoading } = useQuery({
    queryKey: ['inventory-stats', selectedPeriod],
    queryFn: async (): Promise<InventoryStats> => {
      const [fabricsRes, suppliersRes, stocksRes, ordersRes] = await Promise.all([
        supabase.from('fabric_library').select('id, cost_per_meter_aed').eq('is_available', true),
        supabase.from('suppliers').select('id, supplier_name, overall_rating, total_orders, successful_deliveries').eq('is_active', true),
        supabase.from('inventory_stocks').select('*, fabric_library(fabric_name)'),
        supabase.from('purchase_orders').select('id, status, total_amount_aed').in('status', ['Sent', 'Confirmed', 'In Production'])
      ]);

      const fabrics = fabricsRes.data || [];
      const suppliers = suppliersRes.data || [];
      const stocks = stocksRes.data || [];
      const orders = ordersRes.data || [];

      // Calculate stock metrics
      const lowStockItems = stocks.filter(stock => 
        stock.minimum_stock_level && stock.current_stock_meters <= stock.minimum_stock_level
      ).length;

      const outOfStockItems = stocks.filter(stock => 
        stock.current_stock_meters <= 0
      ).length;

      const totalStockValue = stocks.reduce((sum, stock) => 
        sum + (stock.total_value_aed || 0), 0
      );

      // Calculate monthly usage (mock data - would need actual usage tracking)
      const monthlyUsageValue = totalStockValue * 0.15; // Assuming 15% monthly turnover

      // Top fabrics by usage (mock calculation)
      const topFabrics = stocks
        .filter(stock => stock.fabric_library)
        .sort((a, b) => (b.total_value_aed || 0) - (a.total_value_aed || 0))
        .slice(0, 5)
        .map(stock => ({
          fabric_name: stock.fabric_library?.fabric_name || '',
          usage_meters: stock.current_stock_meters * 0.1, // Mock usage
          value_aed: (stock.total_value_aed || 0) * 0.1
        }));

      // Supplier performance
      const supplierPerformance = suppliers.slice(0, 5).map(supplier => ({
        supplier_name: supplier.supplier_name,
        rating: supplier.overall_rating || 0,
        orders_count: supplier.total_orders || 0,
        on_time_delivery: supplier.successful_deliveries || 0
      }));

      return {
        total_fabrics: fabrics.length,
        total_suppliers: suppliers.length,
        total_stock_value_aed: totalStockValue,
        low_stock_items: lowStockItems,
        out_of_stock_items: outOfStockItems,
        pending_orders: orders.length,
        monthly_usage_value: monthlyUsageValue,
        top_fabrics_by_usage: topFabrics,
        supplier_performance: supplierPerformance
      };
    },
  });

  // Fetch stock alerts
  const { data: stockAlerts } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: async (): Promise<StockAlert[]> => {
      const { data, error } = await supabase
        .from('inventory_stocks')
        .select(`
          id,
          current_stock_meters,
          minimum_stock_level,
          fabric_library(fabric_name)
        `)
        .lte('current_stock_meters', supabase.rpc('COALESCE', { minimum_stock_level: 10 }));

      if (error) throw error;

      return (data || []).map(stock => {
        const currentStock = stock.current_stock_meters;
        const minStock = stock.minimum_stock_level || 10;
        
        let alertType: 'Low Stock' | 'Out of Stock' | 'Overstock' | 'Expiring';
        let urgency: 'Low' | 'Medium' | 'High' | 'Critical';
        let recommendedAction: string;

        if (currentStock <= 0) {
          alertType = 'Out of Stock';
          urgency = 'Critical';
          recommendedAction = 'Place urgent purchase order';
        } else if (currentStock <= minStock) {
          alertType = 'Low Stock';
          urgency = 'High';
          recommendedAction = 'Reorder to maintain stock levels';
        } else {
          alertType = 'Low Stock';
          urgency = 'Medium';
          recommendedAction = 'Monitor stock levels';
        }

        return {
          id: stock.id,
          fabric_id: stock.id,
          fabric_name: stock.fabric_library?.fabric_name || 'Unknown Fabric',
          current_stock: currentStock,
          minimum_stock: minStock,
          alert_type: alertType,
          urgency,
          recommended_action: recommendedAction,
          created_at: new Date().toISOString()
        };
      });
    },
  });

  // Fetch recent activity (purchase orders)
  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          po_number,
          status,
          total_amount_aed,
          order_date,
          expected_delivery_date,
          suppliers(supplier_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger refresh of all queries
    await Promise.all([
      inventoryStats,
      stockAlerts,
      recentActivity
    ]);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const dashboardCards: DashboardCard[] = [
    {
      title: 'Total Fabrics',
      value: inventoryStats?.total_fabrics || 0,
      subtitle: 'Active in catalog',
      icon: <Package className="h-6 w-6" />,
      color: 'text-blue-600 bg-blue-100',
      href: '/inventory/materials'
    },
    {
      title: 'Active Suppliers',
      value: inventoryStats?.total_suppliers || 0,
      subtitle: 'Verified suppliers',
      icon: <Truck className="h-6 w-6" />,
      color: 'text-green-600 bg-green-100',
      href: '/inventory/suppliers'
    },
    {
      title: 'Stock Value',
      value: formatAEDCurrency(inventoryStats?.total_stock_value_aed || 0),
      subtitle: 'Total inventory value',
      icon: <DollarSign className="h-6 w-6" />,
      color: 'text-purple-600 bg-purple-100',
      trend: '+12%'
    },
    {
      title: 'Low Stock Items',
      value: inventoryStats?.low_stock_items || 0,
      subtitle: `${inventoryStats?.out_of_stock_items || 0} out of stock`,
      icon: <AlertTriangle className="h-6 w-6" />,
      color: 'text-red-600 bg-red-100',
      href: '/inventory/materials?filter=low-stock'
    },
    {
      title: 'Pending Orders',
      value: inventoryStats?.pending_orders || 0,
      subtitle: 'Awaiting delivery',
      icon: <ShoppingCart className="h-6 w-6" />,
      color: 'text-orange-600 bg-orange-100',
      href: '/inventory/orders'
    },
    {
      title: 'Monthly Usage',
      value: formatAEDCurrency(inventoryStats?.monthly_usage_value || 0),
      subtitle: 'Material consumption',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'text-indigo-600 bg-indigo-100',
      trend: '+8%'
    }
  ];

  if (statsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive material resource management</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${refreshing ? 'cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href={`/inventory/orders/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Link>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
        {['today', 'week', 'month', 'quarter'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card, index) => (
          <div
            key={index}
            className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            {card.href ? (
              <Link href={card.href} className="block">
                <CardContent card={card} />
              </Link>
            ) : (
              <CardContent card={card} />
            )}
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Alerts */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Stock Alerts</h2>
              <Link href={`/inventory/materials?filter=alerts`} className="text-sm text-blue-600 hover:text-blue-700">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {stockAlerts && stockAlerts.length > 0 ? (
                stockAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${
                    alert.urgency === 'Critical' 
                      ? 'bg-red-50 border-red-500'
                      : alert.urgency === 'High'
                      ? 'bg-orange-50 border-orange-500'
                      : 'bg-yellow-50 border-yellow-500'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{alert.fabric_name}</p>
                        <p className="text-xs text-gray-600">
                          {alert.current_stock}m remaining (min: {alert.minimum_stock}m)
                        </p>
                      </div>
                      <div className="flex items-center">
                        {alert.urgency === 'Critical' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{alert.recommended_action}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No stock alerts at this time</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Fabrics by Usage */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top Fabrics</h2>
              <Link href={`/inventory/analytics`} className="text-sm text-blue-600 hover:text-blue-700">
                View analytics
              </Link>
            </div>
            <div className="space-y-3">
              {inventoryStats?.top_fabrics_by_usage.map((fabric, index) => (
                <div key={fabric.fabric_name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{fabric.fabric_name}</p>
                      <p className="text-xs text-gray-500">{fabric.usage_meters.toFixed(1)}m used</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatAEDCurrency(fabric.value_aed)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Supplier Performance */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Supplier Performance</h2>
              <Link href={`/inventory/suppliers`} className="text-sm text-blue-600 hover:text-blue-700">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {inventoryStats?.supplier_performance.map((supplier) => (
                <div key={supplier.supplier_name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{supplier.supplier_name}</p>
                    <p className="text-xs text-gray-500">
                      {supplier.orders_count} orders • {((supplier.on_time_delivery / supplier.orders_count) * 100).toFixed(0)}% on time
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < Math.floor(supplier.rating) ? 'bg-yellow-400' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">{supplier.rating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Purchase Orders</h2>
            <Link href={`/inventory/orders`} className="text-sm text-blue-600 hover:text-blue-700">
              View all orders
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Delivery</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentActivity?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.po_number}</div>
                      <div className="text-sm text-gray-500">{new Date(order.order_date).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.suppliers?.supplier_name || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'Delivered' 
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'Shipped'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'Confirmed'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatAEDCurrency(order.total_amount_aed)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'TBD'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/inventory/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={`/inventory/materials/new`}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Package2 className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Add Fabric</p>
              <p className="text-xs text-gray-500">Add new material to catalog</p>
            </div>
          </Link>
          
          <Link
            href={`/inventory/suppliers/new`}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Truck className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Add Supplier</p>
              <p className="text-xs text-gray-500">Register new supplier</p>
            </div>
          </Link>
          
          <Link
            href={`/inventory/orders/new`}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Create Order</p>
              <p className="text-xs text-gray-500">Place new purchase order</p>
            </div>
          </Link>
          
          <Link
            href={`/inventory/analytics`}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="h-6 w-6 text-orange-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">View Analytics</p>
              <p className="text-xs text-gray-500">Inventory insights & reports</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function CardContent({ card }: { card: DashboardCard }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${card.color}`}>
          {card.icon}
        </div>
        {card.trend && (
          <span className="text-sm font-medium text-green-600">{card.trend}</span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
        <p className="text-sm text-gray-600">{card.title}</p>
        {card.subtitle && (
          <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
        )}
      </div>
    </>
  );
}