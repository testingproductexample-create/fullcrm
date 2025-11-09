import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Users, Package, TrendingUp, Bell, Truck, FileText } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardMetrics {
  totals: {
    suppliers: number;
    activeSuppliers: number;
    pendingOrders: number;
    activeDeliveries: number;
    activeAlerts: number;
  };
  performance: {
    avgOnTimeDelivery: number;
    avgQualityRating: number;
    recentEvaluations: any[];
  };
  recentDeliveries: any[];
}

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4'];

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-supplier-dashboard');
      
      if (error) throw error;
      
      setMetrics(data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    { name: 'Total Suppliers', value: metrics?.totals.suppliers || 0, icon: Users, color: 'from-purple-500 to-purple-600' },
    { name: 'Active Suppliers', value: metrics?.totals.activeSuppliers || 0, icon: Package, color: 'from-blue-500 to-blue-600' },
    { name: 'Pending Orders', value: metrics?.totals.pendingOrders || 0, icon: FileText, color: 'from-indigo-500 to-indigo-600' },
    { name: 'Active Deliveries', value: metrics?.totals.activeDeliveries || 0, icon: Truck, color: 'from-cyan-500 to-cyan-600' },
    { name: 'Active Alerts', value: metrics?.totals.activeAlerts || 0, icon: Bell, color: 'from-pink-500 to-pink-600' },
    { name: 'Avg On-Time Delivery', value: `${metrics?.performance.avgOnTimeDelivery || 0}%`, icon: TrendingUp, color: 'from-green-500 to-green-600' },
  ];

  const performanceData = metrics?.performance.recentEvaluations.slice(0, 6).reverse().map(eval => ({
    date: eval.evaluation_date,
    delivery: eval.on_time_delivery_rate,
    quality: eval.quality_rating * 20,
    overall: eval.overall_score * 10
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Supplier & Vendor Dashboard</h1>
          <p className="text-white/70 mt-1">Comprehensive overview of supplier management metrics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">{stat.name}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="text-white" size={28} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Performance Trends</h2>
          {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="delivery" stroke="#8b5cf6" strokeWidth={2} name="On-Time Delivery %" />
                <Line type="monotone" dataKey="quality" stroke="#3b82f6" strokeWidth={2} name="Quality Rating %" />
                <Line type="monotone" dataKey="overall" stroke="#06b6d4" strokeWidth={2} name="Overall Score %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-white/50">
              No performance data available
            </div>
          )}
        </div>

        {/* Recent Deliveries */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Recent Deliveries</h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {metrics?.recentDeliveries.length ? (
              metrics.recentDeliveries.map((delivery: any) => (
                <div key={delivery.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{delivery.delivery_number}</p>
                      <p className="text-white/60 text-sm mt-1">
                        Expected: {new Date(delivery.expected_delivery_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      delivery.delivery_status === 'delivered' ? 'bg-green-500/20 text-green-300' :
                      delivery.delivery_status === 'in_transit' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {delivery.delivery_status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-[260px] flex items-center justify-center text-white/50">
                No recent deliveries
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">Quality & Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400">
              {metrics?.performance.avgOnTimeDelivery.toFixed(1)}%
            </div>
            <div className="text-white/70 mt-2">Average On-Time Delivery</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400">
              {metrics?.performance.avgQualityRating.toFixed(2)}/5
            </div>
            <div className="text-white/70 mt-2">Average Quality Rating</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-400">
              {metrics?.totals.activeSuppliers}
            </div>
            <div className="text-white/70 mt-2">Active Suppliers</div>
          </div>
        </div>
      </div>
    </div>
  );
}
