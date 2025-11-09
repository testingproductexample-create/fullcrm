import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Building, 
  BarChart3, 
  PieChart, 
  LineChart,
  Eye,
  Edit3,
  Copy,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Share2,
  Maximize2,
  Settings,
  Activity,
  Target,
  Zap,
  Layers,
  Navigation,
  Compass,
  MapIcon
} from 'lucide-react';
import { useReportStore } from '../store/reportStore';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

// UAE Cities and Emirates data
const uaeLocations = [
  { name: 'Dubai', code: 'DXB', coordinates: { lat: 25.2048, lng: 55.2708 }, population: 3331400, type: 'city' },
  { name: 'Abu Dhabi', code: 'AUH', coordinates: { lat: 24.2992, lng: 54.6975 }, population: 1482816, type: 'city' },
  { name: 'Sharjah', code: 'SHJ', coordinates: { lat: 25.3377, lng: 55.4121 }, population: 1197000, type: 'city' },
  { name: 'Al Ain', code: 'AAN', coordinates: { lat: 24.2609, lng: 55.7575 }, population: 766812, type: 'city' },
  { name: 'Ajman', code: 'AJM', coordinates: { lat: 25.4052, lng: 55.5136 }, population: 504846, type: 'emirate' },
  { name: 'Umm Al Quwain', code: 'UAQ', coordinates: { lat: 25.5426, lng: 55.5767 }, population: 72231, type: 'emirate' },
  { name: 'Ras Al Khaimah', code: 'RAK', coordinates: { lat: 25.6730, lng: 55.7745 }, population: 353053, type: 'emirate' },
  { name: 'Fujairah', code: 'FUJ', coordinates: { lat: 25.1212, lng: 56.3187 }, population: 154374, type: 'emirate' },
];

// Sample geographic data
const generateGeographicData = () => {
  return uaeLocations.map(location => {
    const baseValue = Math.random() * 1000000 + 100000;
    return {
      ...location,
      sales: Math.round(baseValue),
      customers: Math.floor(baseValue / 1000),
      growth: (Math.random() - 0.5) * 20, // -10% to +10%
      marketShare: Math.random() * 25 + 5,
      performance: Math.random() * 100,
      trends: Array.from({ length: 12 }, (_, i) => ({
        month: format(subDays(new Date(), (11 - i) * 30), 'MMM'),
        value: Math.round(baseValue * (0.8 + Math.random() * 0.4)),
        customers: Math.floor((baseValue / 1000) * (0.8 + Math.random() * 0.4)),
      })),
    };
  });
};

const GeographicReports: React.FC = () => {
  const { geographicReports, addGeographicReport, updateGeographicReport, deleteGeographicReport } = useReportStore();
  
  const [locations, setLocations] = useState(generateGeographicData());
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [mapView, setMapView] = useState<'heatmap' | 'markers' | 'clusters' | 'choropleth'>('heatmap');
  const [metricType, setMetricType] = useState<'sales' | 'customers' | 'growth' | 'performance'>('sales');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);

  useEffect(() => {
    // Simulate real-time location updates
    const interval = setInterval(() => {
      setLocations(prev => prev.map(location => ({
        ...location,
        sales: location.sales * (0.95 + Math.random() * 0.1),
        growth: location.growth * (0.9 + Math.random() * 0.2),
        performance: Math.max(0, Math.min(100, location.performance * (0.95 + Math.random() * 0.1))),
      })));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const filteredLocations = locations.filter(location => {
    if (searchQuery) {
      return location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             location.code.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const handleLocationSelect = (locationName: string) => {
    setSelectedLocation(locationName);
    toast.success(`Selected ${locationName} for detailed analysis`);
  };

  const handleAnalyzeLocation = async (location: any) => {
    setIsAnalyzing(true);
    
    // Simulate analysis processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analysis = {
      location: location.name,
      timestamp: new Date(),
      insights: [
        `${location.name} shows ${location.growth > 0 ? 'positive' : 'negative'} growth trends`,
        `Market share: ${location.marketShare.toFixed(1)}% of total UAE market`,
        `Performance score: ${location.performance.toFixed(0)}/100`,
        `Customer density: ${(location.customers / location.population * 1000).toFixed(2)} per 1000 residents`,
      ],
      recommendations: [
        location.growth > 10 ? 'Consider expansion opportunities' : 'Focus on growth strategies',
        location.performance < 70 ? 'Improve operational efficiency' : 'Maintain current performance',
        location.marketShare < 15 ? 'Increase marketing efforts' : 'Leverage market leadership',
      ],
      comparableLocations: locations
        .filter(l => l.name !== location.name && l.type === location.type)
        .slice(0, 3)
        .map(l => ({
          name: l.name,
          performance: l.performance,
          growth: l.growth,
        })),
    };
    
    setAnalysisResults(prev => [analysis, ...prev.slice(0, 4)]);
    setIsAnalyzing(false);
    toast.success(`Analysis completed for ${location.name}`);
  };

  const getMetricColor = (value: number, metric: string) => {
    switch (metric) {
      case 'sales':
        return value > 750000 ? 'text-green-600' : value > 500000 ? 'text-yellow-600' : 'text-red-600';
      case 'growth':
        return value > 5 ? 'text-green-600' : value > 0 ? 'text-yellow-600' : 'text-red-600';
      case 'performance':
        return value > 80 ? 'text-green-600' : value > 60 ? 'text-yellow-600' : 'text-red-600';
      case 'customers':
        return value > 800 ? 'text-green-600' : value > 500 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'sales': return DollarSign;
      case 'customers': return Users;
      case 'growth': return TrendingUp;
      case 'performance': return Target;
      default: return BarChart3;
    }
  };

  const totalMetrics = locations.reduce((acc, loc) => ({
    sales: acc.sales + loc.sales,
    customers: acc.customers + loc.customers,
    growth: acc.growth + loc.growth,
    performance: acc.performance + loc.performance,
  }), { sales: 0, customers: 0, growth: 0, performance: 0 });

  const avgMetrics = {
    sales: totalMetrics.sales / locations.length,
    customers: totalMetrics.customers / locations.length,
    growth: totalMetrics.growth / locations.length,
    performance: totalMetrics.performance / locations.length,
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Geographic Reports</h1>
            <p className="text-gray-600 mt-1">
              Multi-location business analysis and geographic data visualization across UAE
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              {['7d', '30d', '90d', '1y'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[
          { key: 'sales', label: 'Total Sales', value: avgMetrics.sales, format: 'currency', icon: DollarSign },
          { key: 'customers', label: 'Total Customers', value: avgMetrics.customers, format: 'number', icon: Users },
          { key: 'growth', label: 'Avg Growth Rate', value: avgMetrics.growth, format: 'percentage', icon: TrendingUp },
          { key: 'performance', label: 'Avg Performance', value: avgMetrics.performance, format: 'number', icon: Target },
        ].map(({ key, label, value, format, icon: Icon }) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {format === 'currency' 
                    ? `AED ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : format === 'percentage' 
                      ? `${value.toFixed(1)}%`
                      : value.toLocaleString()
                  }
                </p>
              </div>
              <Icon className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex-1 flex gap-6">
        {/* Map Visualization */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Map Controls */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="font-semibold text-gray-900">UAE Geographic Analysis</h3>
                <select
                  value={mapView}
                  onChange={(e) => setMapView(e.target.value as any)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="heatmap">Heat Map</option>
                  <option value="markers">Location Markers</option>
                  <option value="clusters">Performance Clusters</option>
                  <option value="choropleth">Sales Choropleth</option>
                </select>
                <select
                  value={metricType}
                  onChange={(e) => setMetricType(e.target.value as any)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="sales">Sales</option>
                  <option value="customers">Customers</option>
                  <option value="growth">Growth</option>
                  <option value="performance">Performance</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                  <Settings className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                  <Maximize2 className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Map Display */}
          <div className="p-6 h-96 relative">
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-dashed border-blue-200 flex items-center justify-center">
              <div className="text-center">
                <Globe className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Interactive Map View</h4>
                <p className="text-gray-600 mb-4">
                  {mapView.charAt(0).toUpperCase() + mapView.slice(1)} showing {metricType} data across UAE locations
                </p>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  {filteredLocations.slice(0, 8).map((location) => (
                    <button
                      key={location.name}
                      onClick={() => handleLocationSelect(location.name)}
                      className={`p-3 rounded-lg border transition-colors ${
                        selectedLocation === location.name
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{location.name}</div>
                      <div className={`text-xs ${getMetricColor(location[metricType], metricType)}`}>
                        {metricType === 'sales' 
                          ? `AED ${location[metricType].toLocaleString()}`
                          : location[metricType].toLocaleString()
                        }
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Legend</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>High Performance</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span>Medium Performance</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span>Low Performance</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Details Sidebar */}
        <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location List */}
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {filteredLocations.map((location) => {
              const MetricIcon = getMetricIcon(metricType);
              return (
                <motion.div
                  key={location.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedLocation === location.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleLocationSelect(location.name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="font-medium text-gray-900">{location.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{location.code}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-gray-500">Sales</div>
                      <div className={`font-medium ${getMetricColor(location.sales, 'sales')}`}>
                        AED {location.sales.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Customers</div>
                      <div className={`font-medium ${getMetricColor(location.customers, 'customers')}`}>
                        {location.customers.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Growth</div>
                      <div className={`font-medium ${getMetricColor(location.growth, 'growth')}`}>
                        {location.growth > 0 ? '+' : ''}{location.growth.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Performance</div>
                      <div className={`font-medium ${getMetricColor(location.performance, 'performance')}`}>
                        {location.performance.toFixed(0)}/100
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnalyzeLocation(location);
                      }}
                      disabled={isAnalyzing}
                      className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                      <Eye className="w-3 h-3" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Analysis Results */}
          {analysisResults.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Recent Analysis</h4>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {analysisResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="font-medium text-sm text-gray-900 mb-1">
                      {result.location}
                    </div>
                    <div className="text-xs text-gray-600">
                      {result.insights.slice(0, 2).map((insight: string, i: number) => (
                        <div key={i}>• {insight}</div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Comparison Table */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Performance Comparison</h3>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
              <Download className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customers</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Growth</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Market Share</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLocations
                .sort((a, b) => b[metricType] - a[metricType])
                .map((location) => (
                  <tr key={location.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="font-medium text-gray-900">{location.name}</div>
                          <div className="text-sm text-gray-500">{location.population.toLocaleString()} population</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`font-medium ${getMetricColor(location.sales, 'sales')}`}>
                        AED {location.sales.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`font-medium ${getMetricColor(location.customers, 'customers')}`}>
                        {location.customers.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {location.growth > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className={`font-medium ${getMetricColor(location.growth, 'growth')}`}>
                          {location.growth > 0 ? '+' : ''}{location.growth.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              location.performance > 80 ? 'bg-green-500' : 
                              location.performance > 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${location.performance}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getMetricColor(location.performance, 'performance')}`}>
                          {location.performance.toFixed(0)}/100
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{location.marketShare.toFixed(1)}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        <button className="p-1 text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-green-600 hover:text-green-800">
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-purple-600 hover:text-purple-800">
                          <Activity className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GeographicReports;