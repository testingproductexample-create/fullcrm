import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch recent inspections
      const { data: inspections } = await supabase
        .from('quality_inspections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch defects
      const { data: defects } = await supabase
        .from('defects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch audits
      const { data: audits } = await supabase
        .from('audits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch quality metrics
      const { data: qualityMetrics } = await supabase
        .from('quality_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(30);

      // Calculate summary metrics
      const totalInspections = inspections?.length || 0;
      const passedInspections = inspections?.filter(i => i.passed).length || 0;
      const totalDefects = defects?.length || 0;
      const criticalDefects = defects?.filter(d => d.severity === 'critical').length || 0;
      const firstPassRate = totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0;

      setMetrics({
        totalInspections,
        passedInspections,
        firstPassRate,
        totalDefects,
        criticalDefects,
        audits: audits?.length || 0,
        inspections: inspections || [],
        defects: defects || [],
        qualityMetrics: qualityMetrics || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Quality Control Dashboard</h1>
        <p className="text-white/60 mt-2">Real-time quality metrics and performance tracking</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Inspections</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{metrics?.totalInspections || 0}</div>
            <p className="text-xs text-white/60 mt-1">Last 10 inspections</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">First Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{metrics?.firstPassRate.toFixed(1)}%</div>
            <p className="text-xs text-white/60 mt-1">Target: 95%</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Defects</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{metrics?.totalDefects || 0}</div>
            <p className="text-xs text-red-400 mt-1">Critical: {metrics?.criticalDefects || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Audits Completed</CardTitle>
            <Shield className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{metrics?.audits || 0}</div>
            <p className="text-xs text-white/60 mt-1">Last 5 audits</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Inspection Results</CardTitle>
            <CardDescription className="text-white/60">Passed vs Failed Inspections</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Passed', value: metrics?.passedInspections || 0 },
                    { name: 'Failed', value: (metrics?.totalInspections || 0) - (metrics?.passedInspections || 0) }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Defect Severity Distribution</CardTitle>
            <CardDescription className="text-white/60">Breakdown by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: 'Critical',
                    count: metrics?.defects.filter((d: any) => d.severity === 'critical').length || 0
                  },
                  {
                    name: 'Major',
                    count: metrics?.defects.filter((d: any) => d.severity === 'major').length || 0
                  },
                  {
                    name: 'Minor',
                    count: metrics?.defects.filter((d: any) => d.severity === 'minor').length || 0
                  }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="name" stroke="#ffffff60" />
                <YAxis stroke="#ffffff60" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Inspections */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Recent Inspections</CardTitle>
          <CardDescription className="text-white/60">Latest quality inspection results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics?.inspections.slice(0, 5).map((inspection: any) => (
              <div key={inspection.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-4">
                  {inspection.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                  <div>
                    <p className="text-white font-medium">{inspection.inspection_number}</p>
                    <p className="text-white/60 text-sm">{inspection.garment_type} - {inspection.inspection_stage}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{inspection.total_score}%</p>
                  <p className="text-white/60 text-sm">{inspection.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
