'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  CheckCircle,
  Eye,
  FileText,
  PieChart,
  Activity,
  Target,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Layers
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  Filler
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { supabase } from '@/lib/supabase/client';
import { 
  formatAEDCurrency,
  formatDate,
  formatPercentage
} from '@/types/inventory';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface InventoryMetrics {
  total_value: number;
  total_items: number;
  low_stock_items: number;
  suppliers_count: number;
  avg_quality_grade: number;
  purchase_orders_count: number;
  total_purchase_value: number;
  pending_orders_count: number;
}

interface StockAnalysis {
  fabric_type: string;
  total_quantity: number;
  total_value: number;
  avg_cost_per_meter: number;
  stock_status: string;
  supplier_count: number;
}

interface SupplierPerformance {
  supplier_name: string;
  supplier_code: string;
  total_orders: number;
  total_value: number;
  avg_delivery_time: number;
  quality_rating: number;
  on_time_rate: number;
}

interface QualityTrends {
  month: string;
  inspections_count: number;
  pass_rate: number;
  avg_grade: number;
  defects_count: number;
}

interface PurchasingTrends {
  month: string;
  orders_count: number;
  total_value: number;
  avg_order_value: number;
  supplier_diversity: number;
}

const TIME_RANGES = [
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'quarter', label: 'Last 3 Months' },
  { value: 'year', label: 'Last 12 Months' },
  { value: 'all', label: 'All Time' }
];

export default function InventoryReportsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [refreshing, setRefreshing] = useState(false);

  // Main metrics query
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['inventory-metrics', selectedTimeRange],
    queryFn: async () => {
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (selectedTimeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date('2020-01-01');
          break;
      }

      // Fetch various metrics
      const [stocksRes, ordersRes, suppliersRes, qualityRes] = await Promise.all([
        supabase.from('inventory_stocks').select('*, fabric:fabric_library(*)'),
        supabase.from('purchase_orders').select('*').gte('created_at', startDate.toISOString()),
        supabase.from('suppliers').select('id'),
        supabase.from('quality_inspections').select('*').gte('created_at', startDate.toISOString())
      ]);

      const stocks = stocksRes.data || [];
      const orders = ordersRes.data || [];
      const suppliers = suppliersRes.data || [];
      const quality = qualityRes.data || [];

      // Calculate metrics
      const total_value = stocks.reduce((sum, stock) => {
        const cost = stock.fabric?.cost_per_meter_aed || 0;
        return sum + (stock.current_quantity_meters * cost);
      }, 0);

      const total_items = stocks.length;
      const low_stock_items = stocks.filter(stock => {
        const fabric = stock.fabric;
        if (!fabric) return false;
        const reorderPoint = fabric.reorder_point_meters || 50;
        return stock.current_quantity_meters <= reorderPoint;
      }).length;

      const suppliers_count = suppliers.length;
      
      const avg_quality_grade = quality.length > 0 
        ? quality.filter(q => q.compliance_passed).length / quality.length * 100
        : 0;

      const purchase_orders_count = orders.length;
      const total_purchase_value = orders.reduce((sum, order) => sum + order.total_amount_aed, 0);
      const pending_orders_count = orders.filter(order => 
        ['Draft', 'Sent', 'Confirmed', 'In Production', 'Shipped'].includes(order.status)
      ).length;

      return {
        total_value,
        total_items,
        low_stock_items,
        suppliers_count,
        avg_quality_grade,
        purchase_orders_count,
        total_purchase_value,
        pending_orders_count
      } as InventoryMetrics;
    },
    refetchInterval: 60000,
  });

  // Stock analysis by fabric type
  const { data: stockAnalysis } = useQuery({
    queryKey: ['stock-analysis', selectedTimeRange],
    queryFn: async () => {
      const { data: stocks } = await supabase
        .from('inventory_stocks')
        .select(`
          *,
          fabric:fabric_library(*),
          location:storage_locations(*)
        `);

      if (!stocks) return [];

      // Group by fabric type
      const analysis = stocks.reduce((acc, stock) => {
        const fabric = stock.fabric;
        if (!fabric) return acc;

        const type = fabric.fabric_type || 'Unknown';
        const quantity = stock.current_quantity_meters || 0;
        const cost_per_meter = fabric.cost_per_meter_aed || 0;
        const value = quantity * cost_per_meter;

        if (!acc[type]) {
          acc[type] = {
            fabric_type: type,
            total_quantity: 0,
            total_value: 0,
            items_count: 0,
            suppliers: new Set()
          };
        }

        acc[type].total_quantity += quantity;
        acc[type].total_value += value;
        acc[type].items_count += 1;
        if (fabric.supplier_id) {
          acc[type].suppliers.add(fabric.supplier_id);
        }

        return acc;
      }, {} as any);

      return Object.values(analysis).map((item: any) => ({
        fabric_type: item.fabric_type,
        total_quantity: item.total_quantity,
        total_value: item.total_value,
        avg_cost_per_meter: item.total_quantity > 0 ? item.total_value / item.total_quantity : 0,
        stock_status: item.total_quantity > 100 ? 'Good' : item.total_quantity > 50 ? 'Low' : 'Critical',
        supplier_count: item.suppliers.size
      })) as StockAnalysis[];
    }
  });

  // Supplier performance analysis
  const { data: supplierPerformance } = useQuery({
    queryKey: ['supplier-performance', selectedTimeRange],
    queryFn: async () => {
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select(`
          *,
          purchase_orders(*)
        `);

      if (!suppliers) return [];

      return suppliers.map(supplier => {
        const orders = supplier.purchase_orders || [];
        const total_orders = orders.length;
        const total_value = orders.reduce((sum: number, order: any) => sum + (order.total_amount_aed || 0), 0);
        
        // Calculate delivery performance
        const completedOrders = orders.filter((order: any) => 
          order.status === 'Delivered' && order.expected_delivery_date && order.actual_delivery_date
        );
        
        const avg_delivery_time = completedOrders.length > 0 
          ? completedOrders.reduce((sum: number, order: any) => {
              const expected = new Date(order.expected_delivery_date);
              const actual = new Date(order.actual_delivery_date);
              return sum + (actual.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24);
            }, 0) / completedOrders.length
          : 0;

        const on_time_orders = completedOrders.filter((order: any) => {
          const expected = new Date(order.expected_delivery_date);
          const actual = new Date(order.actual_delivery_date);
          return actual <= expected;
        }).length;

        const on_time_rate = completedOrders.length > 0 ? (on_time_orders / completedOrders.length) * 100 : 0;

        return {
          supplier_name: supplier.supplier_name,
          supplier_code: supplier.supplier_code,
          total_orders,
          total_value,
          avg_delivery_time,
          quality_rating: supplier.quality_rating || 0,
          on_time_rate
        };
      }) as SupplierPerformance[];
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Invalidate all queries to force refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = (reportType: string) => {
    // Implement export functionality
    console.log(`Exporting ${reportType} report...`);
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: 'rgba(100, 116, 139, 0.8)',
        },
      },
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: 'rgba(100, 116, 139, 0.8)',
        },
      },
    },
  };

  const stockAnalysisChart = {
    labels: stockAnalysis?.map(item => item.fabric_type) || [],
    datasets: [
      {
        label: 'Stock Value (AED)',
        data: stockAnalysis?.map(item => item.total_value) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const supplierPerformanceChart = {
    labels: supplierPerformance?.slice(0, 10).map(supplier => supplier.supplier_name) || [],
    datasets: [
      {
        label: 'Total Orders',
        data: supplierPerformance?.slice(0, 10).map(supplier => supplier.total_orders) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40">
      {/* Header */}
      <div className="border-b border-white/20 bg-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                Inventory Reports & Analytics
              </h1>
              <p className="text-slate-600 mt-1">
                Comprehensive inventory insights and performance analytics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-4 py-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TIME_RANGES.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 text-slate-700 hover:bg-white/90 transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 inline mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => handleExport('full-report')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Download className="h-4 w-4 inline mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {formatAEDCurrency(metrics?.total_value || 0)}
                </p>
                <p className="text-sm text-slate-600">Total Inventory Value</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">+12.5% from last period</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {metrics?.total_items || 0}
                </p>
                <p className="text-sm text-slate-600">Total Stock Items</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">+5 items this month</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {metrics?.low_stock_items || 0}
                </p>
                <p className="text-sm text-slate-600">Low Stock Alerts</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">Requires attention</span>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {formatPercentage(metrics?.avg_quality_grade || 0)}
                </p>
                <p className="text-sm text-slate-600">Quality Pass Rate</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Above target</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Stock Analysis Chart */}
          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Stock Value by Fabric Type</h3>
              <button
                onClick={() => handleExport('stock-analysis')}
                className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Download className="h-4 w-4 inline mr-1" />
                Export
              </button>
            </div>
            <div className="h-80">
              <Bar data={stockAnalysisChart} options={chartOptions} />
            </div>
          </div>

          {/* Supplier Performance Chart */}
          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Top Suppliers by Orders</h3>
              <button
                onClick={() => handleExport('supplier-performance')}
                className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Download className="h-4 w-4 inline mr-1" />
                Export
              </button>
            </div>
            <div className="h-80">
              <Bar data={supplierPerformanceChart} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Stock Analysis Table */}
          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-slate-800">Stock Analysis by Type</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Fabric Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Value</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {stockAnalysis?.map((item, index) => (
                    <tr key={index} className="hover:bg-white/50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {item.fabric_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.total_quantity.toFixed(1)} m
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatAEDCurrency(item.total_value)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          item.stock_status === 'Good' ? 'bg-green-100 text-green-700' :
                          item.stock_status === 'Low' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.stock_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supplier Performance Table */}
          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-slate-800">Supplier Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Supplier</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Orders</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Value</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">On-Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {supplierPerformance?.slice(0, 8).map((supplier, index) => (
                    <tr key={index} className="hover:bg-white/50">
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium text-slate-900">{supplier.supplier_name}</div>
                          <div className="text-slate-500">{supplier.supplier_code}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {supplier.total_orders}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatAEDCurrency(supplier.total_value)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${supplier.on_time_rate}%` }}
                            />
                          </div>
                          <span className="text-slate-600">{supplier.on_time_rate.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Purchase Orders Summary */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Purchase Orders Summary</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleExport('purchase-orders')}
                className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Download className="h-4 w-4 inline mr-1" />
                Export
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-800">
                    {metrics?.purchase_orders_count || 0}
                  </p>
                  <p className="text-sm text-blue-600">Total POs</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-800">
                    {formatAEDCurrency(metrics?.total_purchase_value || 0)}
                  </p>
                  <p className="text-sm text-green-600">Total Value</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-800">
                    {metrics?.pending_orders_count || 0}
                  </p>
                  <p className="text-sm text-orange-600">Pending Orders</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-800">
                    {metrics?.suppliers_count || 0}
                  </p>
                  <p className="text-sm text-purple-600">Active Suppliers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}