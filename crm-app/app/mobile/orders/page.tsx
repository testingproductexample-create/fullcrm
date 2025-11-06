'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { usePWA } from '@/components/PWAProvider';
import { 
  PullToRefresh, 
  TouchButton, 
  SwipeableCard,
  FloatingActionButton,
  MobileTabs,
  TouchableListItem,
  MobileSearchBar,
  StatusBadge,
  ProgressRing
} from '@/components/MobileComponents';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Truck,
  Star,
  Calendar,
  DollarSign,
  Filter,
  Search,
  ArrowUp,
  ArrowDown,
  Eye,
  Phone,
  MessageCircle,
  Camera,
  MapPin,
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronRight,
  ShoppingBag,
  TrendingUp,
  Activity,
  Bell,
  User,
  FileText,
  Download,
  Upload,
  ExternalLink,
  Heart,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

// Order interface based on the existing structure
interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  organization_id: string;
  status: 'new' | 'confirmed' | 'in_progress' | 'quality_check' | 'ready' | 'delivered' | 'cancelled';
  order_type: 'bespoke' | 'casual' | 'alteration' | 'repair' | 'special_occasion';
  priority_level: 'rush' | 'normal' | 'low';
  final_amount: number;
  delivery_date: string | null;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  notes?: string;
  items?: OrderItem[];
  customer?: {
    id: string;
    full_name: string;
    phone: string;
    email: string;
  };
  workflow_logs?: WorkflowLog[];
  attachments?: OrderAttachment[];
}

interface OrderItem {
  id: string;
  item_type: string;
  item_name: string;
  quantity: number;
  item_amount: number;
  color: string;
  specifications: Record<string, any>;
}

interface WorkflowLog {
  id: string;
  stage_name: string;
  status: string;
  started_at: string;
  completed_at?: string;
  notes?: string;
  employee_name?: string;
}

interface OrderAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
  description?: string;
}

interface OrderStats {
  total: number;
  active: number;
  completed: number;
  pending: number;
  totalRevenue: number;
}

type TabType = 'all' | 'active' | 'completed' | 'pending';
type SortType = 'newest' | 'oldest' | 'amount_high' | 'amount_low' | 'delivery';

export default function MobileOrdersPage() {
  const { profile } = useAuth();
  const { isOnline, requestSync } = usePWA();
  
  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
    totalRevenue: 0
  });
  
  // Cache management
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [offlineOrders, setOfflineOrders] = useState<Order[]>([]);

  // Load data from cache first, then sync
  useEffect(() => {
    loadFromCache();
    if (isOnline) {
      fetchOrders();
    }
  }, [profile, isOnline]);

  // Filter and sort orders when data changes
  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchQuery, activeTab, sortBy]);

  const loadFromCache = useCallback(async () => {
    try {
      const cachedOrders = localStorage.getItem('mobile_orders_cache');
      const cachedStats = localStorage.getItem('mobile_orders_stats_cache');
      const lastSync = localStorage.getItem('mobile_orders_last_sync');
      
      if (cachedOrders) {
        const parsedOrders = JSON.parse(cachedOrders);
        setOrders(parsedOrders);
        setOfflineOrders(parsedOrders);
      }
      
      if (cachedStats) {
        setStats(JSON.parse(cachedStats));
      }
      
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      
      // Fetch orders with related data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(id, full_name, phone, email),
          order_items(*),
          order_workflow_logs:workflow_logs(
            id, stage_name, status, started_at, completed_at, notes,
            employee:profiles(full_name)
          ),
          order_attachments(*)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const processedOrders = ordersData?.map(order => ({
        ...order,
        workflow_logs: order.order_workflow_logs?.map((log: any) => ({
          ...log,
          employee_name: log.employee?.full_name
        })) || [],
        attachments: order.order_attachments || []
      })) || [];

      setOrders(processedOrders);
      
      // Calculate stats
      const newStats = calculateStats(processedOrders);
      setStats(newStats);
      
      // Cache the data
      localStorage.setItem('mobile_orders_cache', JSON.stringify(processedOrders));
      localStorage.setItem('mobile_orders_stats_cache', JSON.stringify(newStats));
      localStorage.setItem('mobile_orders_last_sync', new Date().toISOString());
      setLastSyncTime(new Date());
      
      // Request background sync for offline mode
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        await requestSync('orders-sync');
      }
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      // If online fetch fails, fall back to cached data
      if (offlineOrders.length > 0) {
        setOrders(offlineOrders);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.organization_id, offlineOrders, requestSync]);

  const calculateStats = (ordersData: Order[]): OrderStats => {
    const total = ordersData.length;
    const active = ordersData.filter(o => ['new', 'confirmed', 'in_progress', 'quality_check'].includes(o.status)).length;
    const completed = ordersData.filter(o => o.status === 'delivered').length;
    const pending = ordersData.filter(o => o.status === 'new').length;
    const totalRevenue = ordersData.reduce((sum, o) => sum + Number(o.final_amount || 0), 0);
    
    return { total, active, completed, pending, totalRevenue };
  };

  const filterAndSortOrders = useCallback(() => {
    let filtered = [...orders];
    
    // Apply tab filter
    if (activeTab !== 'all') {
      switch (activeTab) {
        case 'active':
          filtered = filtered.filter(o => ['new', 'confirmed', 'in_progress', 'quality_check'].includes(o.status));
          break;
        case 'completed':
          filtered = filtered.filter(o => o.status === 'delivered');
          break;
        case 'pending':
          filtered = filtered.filter(o => o.status === 'new');
          break;
      }
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.order_number.toLowerCase().includes(query) ||
        o.customer?.full_name.toLowerCase().includes(query) ||
        o.order_type.toLowerCase().includes(query) ||
        o.status.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'amount_high':
          return Number(b.final_amount) - Number(a.final_amount);
        case 'amount_low':
          return Number(a.final_amount) - Number(b.final_amount);
        case 'delivery':
          const aDate = a.delivery_date ? new Date(a.delivery_date).getTime() : Infinity;
          const bDate = b.delivery_date ? new Date(b.delivery_date).getTime() : Infinity;
          return aDate - bDate;
        default:
          return 0;
      }
    });
    
    setFilteredOrders(filtered);
  }, [orders, searchQuery, activeTab, sortBy]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
  }, [fetchOrders]);

  const getStatusColor = (status: string): string => {
    const colors = {
      new: 'bg-blue-100 text-blue-900 border-blue-200',
      confirmed: 'bg-purple-100 text-purple-900 border-purple-200',
      in_progress: 'bg-yellow-100 text-yellow-900 border-yellow-200',
      quality_check: 'bg-orange-100 text-orange-900 border-orange-200',
      ready: 'bg-green-100 text-green-900 border-green-200',
      delivered: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      cancelled: 'bg-red-100 text-red-900 border-red-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-900 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      new: <Package className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      in_progress: <Activity className="w-4 h-4" />,
      quality_check: <Eye className="w-4 h-4" />,
      ready: <Star className="w-4 h-4" />,
      delivered: <Truck className="w-4 h-4" />,
      cancelled: <AlertCircle className="w-4 h-4" />
    };
    return icons[status as keyof typeof icons] || <Package className="w-4 h-4" />;
  };

  const getOrderTypeLabel = (type: string): string => {
    const labels = {
      bespoke: 'Bespoke',
      casual: 'Casual Wear',
      alteration: 'Alteration',
      repair: 'Repair',
      special_occasion: 'Special Occasion'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPriorityColor = (priority: string): string => {
    const colors = {
      rush: 'text-red-600 bg-red-50 border-red-200',
      normal: 'text-gray-600 bg-gray-50 border-gray-200',
      low: 'text-gray-500 bg-gray-50 border-gray-200'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const formatRelativeDate = (dateString: string): string => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM dd, yyyy');
  };

  const tabs = [
    { id: 'all' as TabType, label: 'All', count: stats.total },
    { id: 'active' as TabType, label: 'Active', count: stats.active },
    { id: 'completed' as TabType, label: 'Completed', count: stats.completed },
    { id: 'pending' as TabType, label: 'Pending', count: stats.pending }
  ];

  const sortOptions = [
    { id: 'newest' as SortType, label: 'Newest First', icon: <ArrowDown className="w-4 h-4" /> },
    { id: 'oldest' as SortType, label: 'Oldest First', icon: <ArrowUp className="w-4 h-4" /> },
    { id: 'amount_high' as SortType, label: 'Amount (High)', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'amount_low' as SortType, label: 'Amount (Low)', icon: <TrendingUp className="w-4 h-4 rotate-180" /> },
    { id: 'delivery' as SortType, label: 'Delivery Date', icon: <Calendar className="w-4 h-4" /> }
  ];

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="p-6 pt-16">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/20 animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <PullToRefresh onRefresh={handleRefresh} isRefreshing={refreshing}>
        <div className="pb-24">
          {/* Mobile Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 pt-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">My Orders</h1>
                  <p className="text-purple-100 text-sm">Track your orders</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-300" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-300" />
                )}
                
                <TouchButton
                  onClick={() => setShowFilters(!showFilters)}
                  size="sm"
                  className="bg-white/20 text-white border-white/30"
                >
                  <Filter className="w-4 h-4" />
                </TouchButton>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-purple-100">Total Orders</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-purple-100">Active</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-purple-100">Completed</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">AED {Math.round(stats.totalRevenue).toLocaleString()}</p>
                <p className="text-xs text-purple-100">Total Value</p>
              </div>
            </div>

            {/* Search Bar */}
            <MobileSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search orders..."
              className="mb-4"
            />

            {/* Sync Status */}
            {lastSyncTime && (
              <div className="flex items-center justify-between text-sm text-purple-100">
                <span>Last sync: {lastSyncTime.toLocaleTimeString()}</span>
                {!isOnline && (
                  <span className="flex items-center gap-1">
                    <WifiOff className="w-4 h-4" />
                    Offline Mode
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white/90 backdrop-blur-xl border-b border-white/20 p-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Sort By</h3>
                <div className="grid grid-cols-2 gap-2">
                  {sortOptions.map((option) => (
                    <TouchButton
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      variant={sortBy === option.id ? 'primary' : 'secondary'}
                      size="sm"
                      className="justify-start"
                    >
                      {option.icon}
                      <span className="ml-2">{option.label}</span>
                    </TouchButton>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="px-6 py-4">
            <MobileTabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
              showCount={true}
            />
          </div>

          {/* Orders List */}
          <div className="px-6 space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-white/70 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No orders found' : 'No orders yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Your orders will appear here once created'
                  }
                </p>
                {!searchQuery && (
                  <Link href="/dashboard/orders/new">
                    <TouchButton className="mx-auto">
                      <Plus className="w-5 h-5 mr-2" />
                      Create First Order
                    </TouchButton>
                  </Link>
                )}
              </div>
            ) : (
              filteredOrders.map((order) => (
                <SwipeableCard
                  key={order.id}
                  onSwipeLeft={() => {
                    // Handle favorite action
                    console.log('Favorite order:', order.id);
                  }}
                  onSwipeRight={() => {
                    // Handle share action  
                    console.log('Share order:', order.id);
                  }}
                  leftAction={{
                    icon: <Heart className="w-5 h-5" />,
                    color: 'bg-red-500',
                    label: 'Favorite'
                  }}
                  rightAction={{
                    icon: <Share2 className="w-5 h-5" />,
                    color: 'bg-blue-500',
                    label: 'Share'
                  }}
                >
                  <Link href={`/dashboard/orders/${order.id}`}>
                    <TouchableListItem className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900">{order.order_number}</span>
                            {order.priority_level === 'rush' && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-900 border border-red-200">
                                RUSH
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{order.customer?.full_name || 'Unknown Customer'}</p>
                          <p className="text-xs text-gray-500">{getOrderTypeLabel(order.order_type)}</p>
                        </div>
                        
                        <div className="text-right">
                          <StatusBadge
                            status={order.status}
                            className={getStatusColor(order.status)}
                            icon={getStatusIcon(order.status)}
                          />
                          <p className="text-lg font-bold text-gray-900 mt-1">
                            AED {Number(order.final_amount).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {order.progress_percentage > 0 && (
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600">Progress</span>
                            <span className="text-xs font-medium text-gray-900">{order.progress_percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${order.progress_percentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Dates and Actions */}
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center gap-4">
                          <span>{formatRelativeDate(order.created_at)}</span>
                          {order.delivery_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {format(parseISO(order.delivery_date), 'MMM dd')}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {order.customer?.phone && (
                            <TouchButton
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(`tel:${order.customer?.phone}`);
                              }}
                              size="sm"
                              variant="ghost"
                              className="p-1"
                            >
                              <Phone className="w-3 h-3" />
                            </TouchButton>
                          )}
                          
                          <TouchButton
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Open chat or messaging
                            }}
                            size="sm" 
                            variant="ghost"
                            className="p-1"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </TouchButton>
                          
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>

                      {/* Quick Info Pills */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {order.items && order.items.length > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </span>
                        )}
                        
                        {order.attachments && order.attachments.length > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {order.attachments.length} file{order.attachments.length > 1 ? 's' : ''}
                          </span>
                        )}
                        
                        {order.workflow_logs && order.workflow_logs.length > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {order.workflow_logs.filter(log => log.completed_at).length} steps
                          </span>
                        )}
                      </div>
                    </TouchableListItem>
                  </Link>
                </SwipeableCard>
              ))
            )}
          </div>

          {/* Offline Notice */}
          {!isOnline && (
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <WifiOff className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900">Offline Mode</h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    You're viewing cached data. Connect to internet to sync latest updates.
                  </p>
                  <TouchButton
                    onClick={handleRefresh}
                    size="sm"
                    className="mt-2 bg-yellow-100 text-yellow-900 border-yellow-300"
                    disabled={!isOnline}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Connection
                  </TouchButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={<Plus className="w-6 h-6" />}
        onClick={() => window.location.href = '/dashboard/orders/new'}
        position="bottom-right"
        className="bg-gradient-to-r from-purple-600 to-pink-600"
      />
    </div>
  );
}