import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  FaDatabase, FaServer, FaExclamationTriangle, FaCheckCircle,
  FaCog, FaPlay, FaStop, FaSync, FaChartLine, FaShieldAlt
} from 'react-icons/fa';

const DatabaseOptimizationDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/dashboard/overview', {
        headers: {
          'x-api-key': 'admin-key'
        }
      });
      const data = await response.json();
      setDashboardData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startOptimization = async () => {
    try {
      const response = await fetch('/api/optimization/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'admin-key'
        }
      });
      const result = await response.json();
      if (result.success) {
        alert('Optimization started successfully!');
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to start optimization:', error);
      alert('Failed to start optimization');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Database Health</p>
              <p className={`text-2xl font-bold ${
                dashboardData?.health?.status === 'healthy' ? 'text-green-600' : 
                dashboardData?.health?.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {dashboardData?.health?.status || 'Unknown'}
              </p>
            </div>
            <FaDatabase className="text-3xl text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-red-600">
                {dashboardData?.alerts?.total || 0}
              </p>
            </div>
            <FaExclamationTriangle className="text-3xl text-red-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Performance Trend</p>
              <p className={`text-2xl font-bold ${
                dashboardData?.performance?.trend === 'improving' ? 'text-green-600' :
                dashboardData?.performance?.trend === 'degrading' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {dashboardData?.performance?.trend || 'Stable'}
              </p>
            </div>
            <FaChartLine className="text-3xl text-blue-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Optimization Score</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.floor(Math.random() * 20 + 80)}%
              </p>
            </div>
            <FaShieldAlt className="text-3xl text-green-400" />
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Query Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={generateMockPerformanceData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="responseTime" stroke="#8884d8" name="Response Time (ms)" />
              <Line type="monotone" dataKey="throughput" stroke="#82ca9d" name="Throughput (req/s)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Resource Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={generateMockResourceData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="cpu" stackId="1" stroke="#8884d8" fill="#8884d8" name="CPU %" />
              <Area type="monotone" dataKey="memory" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Memory %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Alerts & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {(dashboardData?.alerts?.recent || []).map((alert, index) => (
              <div key={index} className="flex items-center p-3 border-l-4 border-red-500 bg-red-50">
                <FaExclamationTriangle className="text-red-500 mr-3" />
                <div>
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-gray-500">{alert.severity}</p>
                </div>
              </div>
            ))}
            {(!dashboardData?.alerts?.recent || dashboardData.alerts.recent.length === 0) && (
              <p className="text-gray-500 text-center py-4">No recent alerts</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Optimization Recommendations</h3>
          <div className="space-y-3">
            {(dashboardData?.recommendations?.recent || []).map((rec, index) => (
              <div key={index} className="flex items-center p-3 border-l-4 border-blue-500 bg-blue-50">
                <FaCog className="text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium">{rec.title}</p>
                  <p className="text-xs text-gray-500">{rec.impact}% improvement expected</p>
                </div>
              </div>
            ))}
            {(!dashboardData?.recommendations?.recent || dashboardData.recommendations.recent.length === 0) && (
              <p className="text-gray-500 text-center py-4">No recommendations available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOptimization = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Database Optimization</h2>
        <button
          onClick={startOptimization}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <FaPlay className="mr-2" />
          Start Optimization
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Sharding Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Active Shards:</span>
              <span className="font-semibold">4</span>
            </div>
            <div className="flex justify-between">
              <span>Total Connections:</span>
              <span className="font-semibold">80/100</span>
            </div>
            <div className="flex justify-between">
              <span>Rebalanced:</span>
              <span className="text-green-600">Yes</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Index Optimization</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Indexes:</span>
              <span className="font-semibold">45</span>
            </div>
            <div className="flex justify-between">
              <span>Optimal Indexes:</span>
              <span className="font-semibold">38</span>
            </div>
            <div className="flex justify-between">
              <span>Redundant Indexes:</span>
              <span className="text-yellow-600">3</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Query Performance</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Avg Response Time:</span>
              <span className="font-semibold">125ms</span>
            </div>
            <div className="flex justify-between">
              <span>Slow Queries:</span>
              <span className="text-red-600">2</span>
            </div>
            <div className="flex justify-between">
              <span>Cache Hit Ratio:</span>
              <span className="text-green-600">94.5%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Optimization Runs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Timestamp</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Duration</th>
                <th className="text-left p-2">Improvements</th>
              </tr>
            </thead>
            <tbody>
              {generateMockOptimizationHistory().map((run, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{run.timestamp}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      run.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="p-2">{run.duration}</td>
                  <td className="p-2">{run.improvements}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMonitoring = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Database Monitoring</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Connection Pool</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Active', value: 45, fill: '#8884d8' },
                  { name: 'Idle', value: 35, fill: '#82ca9d' },
                  { name: 'Available', value: 20, fill: '#ffc658' }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Query Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: 'SELECT', value: 75 },
              { name: 'INSERT', value: 15 },
              { name: 'UPDATE', value: 8 },
              { name: 'DELETE', value: 2 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Real-time Metrics</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={generateRealtimeMetrics()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="queries" stroke="#8884d8" name="Queries/sec" />
            <Line type="monotone" dataKey="errors" stroke="#ff7300" name="Errors/sec" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSync className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <FaDatabase className="text-2xl text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Database Optimization Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {lastUpdate && (
                <span className="text-sm text-gray-500">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={loadDashboardData}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
              >
                <FaSync />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: FaChartLine },
              { id: 'optimization', name: 'Optimization', icon: FaCog },
              { id: 'monitoring', name: 'Monitoring', icon: FaServer }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="mr-2" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'optimization' && renderOptimization()}
        {activeTab === 'monitoring' && renderMonitoring()}
      </main>
    </div>
  );
};

// Mock data generators
const generateMockPerformanceData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: `${i * 5}min`,
    responseTime: Math.random() * 200 + 50,
    throughput: Math.random() * 100 + 200
  }));
};

const generateMockResourceData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: `${i * 5}min`,
    cpu: Math.random() * 40 + 30,
    memory: Math.random() * 30 + 40
  }));
};

const generateMockOptimizationHistory = () => {
  return [
    { timestamp: '2024-01-15 10:30:00', status: 'success', duration: '2.5s', improvements: 8 },
    { timestamp: '2024-01-15 08:15:00', status: 'success', duration: '1.8s', improvements: 5 },
    { timestamp: '2024-01-14 16:45:00', status: 'failed', duration: '0.5s', improvements: 0 }
  ];
};

const generateRealtimeMetrics = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    time: `${i * 2}s`,
    queries: Math.random() * 50 + 100,
    errors: Math.random() * 5
  }));
};

export default DatabaseOptimizationDashboard;