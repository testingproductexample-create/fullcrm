import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BarChart3, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

interface Metric {
  id: string;
  metric_date: string;
  total_inspections: number;
  passed_inspections: number;
  first_pass_rate: number;
  defect_count: number;
  critical_defects: number;
  customer_satisfaction_score: number | null;
}

const Metrics = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const { data, error } = await supabase
        .from('quality_metrics')
        .select('*')
        .gte('metric_date', startDate.toISOString())
        .order('metric_date', { ascending: true });

      if (error) throw error;
      setMetrics(data || []);
    } catch (error: any) {
      toast.error('Failed to load metrics: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const avgFirstPassRate = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.first_pass_rate, 0) / metrics.length
    : 0;

  const avgDefectRate = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + (m.defect_count / Math.max(m.total_inspections, 1)), 0) / metrics.length
    : 0;

  const avgCsat = metrics.filter(m => m.customer_satisfaction_score !== null).length > 0
    ? metrics.filter(m => m.customer_satisfaction_score !== null).reduce((sum, m) => sum + (m.customer_satisfaction_score || 0), 0) / metrics.filter(m => m.customer_satisfaction_score !== null).length
    : 0;

  const totalDefects = metrics.reduce((sum, m) => sum + m.defect_count, 0);
  const totalCritical = metrics.reduce((sum, m) => sum + m.critical_defects, 0);

  const COLORS = ['#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

  const chartData = metrics.map(m => ({
    date: new Date(m.metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    passRate: m.first_pass_rate,
    defects: m.defect_count,
    inspections: m.total_inspections
  }));

  const defectDistribution = [
    { name: 'Critical', value: totalCritical },
    { name: 'Non-Critical', value: totalDefects - totalCritical }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Quality Metrics & Analytics</h1>
          <p className="text-white/60 mt-2">Performance tracking and trend analysis</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Avg First Pass Rate</p>
                <p className="text-2xl font-bold text-green-400">{avgFirstPassRate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Target: 95%</span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Avg Defect Rate</p>
                <p className="text-2xl font-bold text-orange-400">{(avgDefectRate * 100).toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-orange-400">
                  <TrendingDown className="w-4 h-4" />
                  <span>Per inspection</span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Customer Satisfaction</p>
                <p className="text-2xl font-bold text-yellow-400">{avgCsat.toFixed(1)}/5.0</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-yellow-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Average score</span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total Defects</p>
                <p className="text-2xl font-bold text-red-400">{totalDefects}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                  <span>Critical: {totalCritical}</span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">First Pass Rate Trend</CardTitle>
            <CardDescription className="text-white/60">Daily first pass rate percentage</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-white/60">
                Loading data...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-white/60">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="date" stroke="#ffffff60" />
                  <YAxis stroke="#ffffff60" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="passRate" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Defect Distribution</CardTitle>
            <CardDescription className="text-white/60">Critical vs non-critical defects</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-white/60">
                Loading data...
              </div>
            ) : totalDefects === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-white/60">
                No defects recorded
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={defectDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {defectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#fbbf24'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Inspection Volume</CardTitle>
            <CardDescription className="text-white/60">Daily inspection count</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-white/60">
                Loading data...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-white/60">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="date" stroke="#ffffff60" />
                  <YAxis stroke="#ffffff60" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="inspections" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Defect Trend</CardTitle>
            <CardDescription className="text-white/60">Daily defect count</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-white/60">
                Loading data...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-white/60">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="date" stroke="#ffffff60" />
                  <YAxis stroke="#ffffff60" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="defects" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Metrics;
