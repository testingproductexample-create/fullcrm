/**
 * Cache Management Dashboard - Main React Component
 * Real-time monitoring and management interface for the caching system
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { io } from 'socket.io-client';
import {
    Activity,
    Database,
    Server,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    Clock,
    HardDrive,
    Zap,
    Globe,
    Settings,
    Play,
    Pause,
    RefreshCw,
    Download,
    Upload,
    Trash2,
    Eye,
    BarChart3,
    PieChart as PieChartIcon
} from 'lucide-react';
import styled from 'styled-components';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { useMetrics } from '../hooks/useMetrics.js';
import { CacheControls } from './CacheControls.js';
import { PerformanceMetrics } from './PerformanceMetrics.js';
import { RealTimeGraphs } from './RealTimeGraphs.js';
import { CacheConfiguration } from './CacheConfiguration.js';
import { AlertPanel } from './AlertPanel.js';

const DashboardContainer = styled.div`
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Header = styled.header`
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 20px 30px;
    margin-bottom: 30px;
    display: flex;
    justify-content: between;
    align-items: center;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
    border: 1px solid rgba(255, 255, 255, 0.18);
`;

const Title = styled.h1`
    color: #2d3748;
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 15px;

    svg {
        color: #667eea;
    }
`;

const StatusIndicator = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    border-radius: 25px;
    background: ${props => props.status === 'healthy' ? '#48bb78' : props.status === 'degraded' ? '#ed8936' : '#e53e3e'};
    color: white;
    font-weight: 600;
    font-size: 0.875rem;

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }

    &.pulsing {
        animation: pulse 2s infinite;
    }
`;

const MainContent = styled.main`
    display: grid;
    grid-template-columns: 1fr;
    gap: 30px;
    max-width: 1400px;
    margin: 0 auto;
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
`;

const StatCard = styled.div`
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 25px;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
    border: 1px solid rgba(255, 255, 255, 0.18);
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 40px rgba(31, 38, 135, 0.4);
    }
`;

const StatHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
`;

const StatTitle = styled.h3`
    color: #4a5568;
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
`;

const StatValue = styled.div`
    font-size: 2.5rem;
    font-weight: 700;
    color: ${props => {
        if (props.trend === 'up') return '#48bb78';
        if (props.trend === 'down') return '#e53e3e';
        return '#2d3748';
    }};
    margin-bottom: 10px;
`;

const StatChange = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.875rem;
    color: #718096;
    font-weight: 500;

    svg {
        width: 16px;
        height: 16px;
    }
`;

const ChartGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
`;

const ChartCard = styled.div`
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 25px;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
    border: 1px solid rgba(255, 255, 255, 0.18);
`;

const ChartTitle = styled.h3`
    color: #2d3748;
    margin: 0 0 20px 0;
    font-size: 1.125rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
`;

const ControlPanel = styled.div`
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 25px;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
    border: 1px solid rgba(255, 255, 255, 0.18);
`;

const ControlTabs = styled.div`
    display: flex;
    border-bottom: 2px solid #e2e8f0;
    margin-bottom: 25px;
`;

const ControlTab = styled.button`
    background: none;
    border: none;
    padding: 12px 20px;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${props => props.active ? '#667eea' : '#718096'};
    border-bottom: 2px solid ${props => props.active ? '#667eea' : 'transparent'};
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        color: #667eea;
    }
`;

const TabContent = styled.div`
    display: ${props => props.active ? 'block' : 'none'};
`;

const LoadingSpinner = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    font-size: 1.125rem;
    color: #718096;
`;

const AlertToast = styled.div`
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${props => {
        if (props.type === 'error') return '#e53e3e';
        if (props.type === 'warning') return '#ed8936';
        return '#48bb78';
    }};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    max-width: 400px;
    animation: slideIn 0.3s ease;

    @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
`;

// Custom hooks
const useSystemMetrics = () => {
    const [metrics, setMetrics] = useState({});
    const [isConnected, setIsConnected] = useState(false);

    const { data, isLoading, error } = useWebSocket('/metrics', {
        onMessage: (data) => {
            setMetrics(data);
            setIsConnected(true);
        },
        onDisconnect: () => setIsConnected(false),
        reconnectInterval: 5000
    });

    return { metrics, isConnected, isLoading, error };
};

const CacheManagementDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [refreshing, setRefreshing] = useState(false);
    const [alert, setAlert] = useState(null);
    const [systemMetrics, setSystemMetrics] = useState({
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        memoryUsage: 0,
        diskUsage: 0,
        networkUsage: 0
    });
    const [realtimeData, setRealtimeData] = useState([]);

    // Custom hooks for real-time data
    const { isConnected } = useSystemMetrics();
    const metrics = useMetrics();

    // Real-time data updates
    useEffect(() => {
        if (isConnected) {
            const interval = setInterval(() => {
                // Simulate real-time metrics updates
                const newData = {
                    timestamp: new Date().toISOString(),
                    requests: Math.floor(Math.random() * 1000) + 500,
                    hits: Math.floor(Math.random() * 800) + 400,
                    misses: Math.floor(Math.random() * 200) + 100,
                    memory: Math.floor(Math.random() * 40) + 30,
                    cpu: Math.floor(Math.random() * 20) + 10
                };

                setRealtimeData(prev => [...prev.slice(-99), newData]);
                setSystemMetrics(prev => ({
                    ...prev,
                    totalRequests: prev.totalRequests + newData.requests,
                    cacheHits: prev.cacheHits + newData.hits,
                    cacheMisses: prev.cacheMisses + newData.misses,
                    memoryUsage: newData.memory,
                    networkUsage: newData.requests
                }));
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [isConnected]);

    // Cache hit rate calculation
    const cacheHitRate = useMemo(() => {
        const total = systemMetrics.cacheHits + systemMetrics.cacheMisses;
        return total > 0 ? ((systemMetrics.cacheHits / total) * 100).toFixed(1) : 0;
    }, [systemMetrics]);

    // Performance score calculation
    const performanceScore = useMemo(() => {
        const hitRate = parseFloat(cacheHitRate);
        const memoryScore = Math.max(0, 100 - systemMetrics.memoryUsage);
        const networkScore = Math.min(100, systemMetrics.networkUsage / 10);
        return Math.round((hitRate + memoryScore + networkScore) / 3);
    }, [cacheHitRate, systemMetrics]);

    // Status determination
    const systemStatus = useMemo(() => {
        if (performanceScore >= 80) return 'healthy';
        if (performanceScore >= 60) return 'degraded';
        return 'critical';
    }, [performanceScore]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            // Trigger metrics refresh
            await fetch('/api/metrics/refresh', { method: 'POST' });
            setAlert({ type: 'success', message: 'Metrics refreshed successfully' });
        } catch (error) {
            setAlert({ type: 'error', message: 'Failed to refresh metrics' });
        } finally {
            setTimeout(() => setRefreshing(false), 1000);
        }
    };

    const handleControlAction = async (action, params = {}) => {
        try {
            const response = await fetch('/api/cache/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...params })
            });

            if (response.ok) {
                setAlert({ type: 'success', message: `Action ${action} completed` });
            } else {
                throw new Error('Action failed');
            }
        } catch (error) {
            setAlert({ type: 'error', message: `Action ${action} failed` });
        }
    };

    // Chart data for performance metrics
    const chartData = realtimeData.map(data => ({
        time: new Date(data.timestamp).toLocaleTimeString(),
        requests: data.requests,
        hits: data.hits,
        misses: data.misses,
        memory: data.memory,
        cpu: data.cpu
    }));

    // Pie chart data for cache distribution
    const distributionData = [
        { name: 'Cache Hits', value: systemMetrics.cacheHits, color: '#48bb78' },
        { name: 'Cache Misses', value: systemMetrics.cacheMisses, color: '#e53e3e' }
    ];

    if (isLoading) {
        return (
            <DashboardContainer>
                <LoadingSpinner>
                    <RefreshCw style={{ width: 24, height: 24, marginRight: 10, animation: 'spin 1s linear infinite' }} />
                    Loading cache dashboard...
                </LoadingSpinner>
            </DashboardContainer>
        );
    }

    return (
        <DashboardContainer>
            {alert && (
                <AlertToast type={alert.type} onClick={() => setAlert(null)}>
                    {alert.message}
                </AlertToast>
            )}

            <Header>
                <Title>
                    <Activity size={32} />
                    Cache Management Dashboard
                </Title>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <StatusIndicator status={systemStatus} className={!isConnected ? 'pulsing' : ''}>
                        {systemStatus === 'healthy' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {isConnected ? 'Connected' : 'Disconnected'} • {systemStatus.toUpperCase()}
                    </StatusIndicator>
                    
                    <button 
                        onClick={handleRefresh} 
                        disabled={refreshing}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 8,
                            borderRadius: 8,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <RefreshCw 
                            size={20} 
                            style={{ 
                                color: '#4a5568',
                                animation: refreshing ? 'spin 1s linear infinite' : 'none'
                            }} 
                        />
                    </button>
                </div>
            </Header>

            <MainContent>
                {/* Key Metrics Overview */}
                <StatsGrid>
                    <StatCard>
                        <StatHeader>
                            <StatTitle>Total Requests</StatTitle>
                            <Database size={20} color="#667eea" />
                        </StatHeader>
                        <StatValue>{systemMetrics.totalRequests.toLocaleString()}</StatValue>
                        <StatChange>
                            <TrendingUp size={16} color="#48bb78" />
                            +12.5% from last hour
                        </StatChange>
                    </StatCard>

                    <StatCard>
                        <StatHeader>
                            <StatTitle>Cache Hit Rate</StatTitle>
                            <Zap size={20} color="#48bb78" />
                        </StatHeader>
                        <StatValue>{cacheHitRate}%</StatValue>
                        <StatChange>
                            <TrendingUp size={16} color="#48bb78" />
                            +2.3% from last hour
                        </StatChange>
                    </StatCard>

                    <StatCard>
                        <StatHeader>
                            <StatTitle>Performance Score</StatTitle>
                            <BarChart3 size={20} color="#667eea" />
                        </StatHeader>
                        <StatValue>{performanceScore}/100</StatValue>
                        <StatChange>
                            <TrendingUp size={16} color="#48bb78" />
                            Excellent performance
                        </StatChange>
                    </StatCard>

                    <StatCard>
                        <StatHeader>
                            <StatTitle>Memory Usage</StatTitle>
                            <HardDrive size={20} color="#ed8936" />
                        </StatHeader>
                        <StatValue>{systemMetrics.memoryUsage}%</StatValue>
                        <StatChange>
                            <TrendingDown size={16} color="#48bb78" />
                            -1.2% from last hour
                        </StatChange>
                    </StatCard>
                </StatsGrid>

                {/* Real-time Charts */}
                <ChartGrid>
                    <ChartCard>
                        <ChartTitle>
                            <Activity size={20} />
                            Request Volume (Real-time)
                        </ChartTitle>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="requests" stroke="#667eea" strokeWidth={2} />
                                <Line type="monotone" dataKey="hits" stroke="#48bb78" strokeWidth={2} />
                                <Line type="monotone" dataKey="misses" stroke="#e53e3e" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard>
                        <ChartTitle>
                            <PieChartIcon size={20} />
                            Cache Distribution
                        </ChartTitle>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={distributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    dataKey="value"
                                >
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard>
                        <ChartTitle>
                            <BarChart3 size={20} />
                            Memory & CPU Usage
                        </ChartTitle>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="memory" stackId="1" stroke="#ed8936" fill="#ed893680" />
                                <Area type="monotone" dataKey="cpu" stackId="1" stroke="#805ad5" fill="#805ad580" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </ChartGrid>

                {/* Control Panel */}
                <ControlPanel>
                    <ControlTabs>
                        <ControlTab 
                            active={activeTab === 'overview'} 
                            onClick={() => setActiveTab('overview')}
                        >
                            <Eye size={16} style={{ marginRight: 8 }} />
                            Overview
                        </ControlTab>
                        <ControlTab 
                            active={activeTab === 'controls'} 
                            onClick={() => setActiveTab('controls')}
                        >
                            <Settings size={16} style={{ marginRight: 8 }} />
                            Cache Controls
                        </ControlTab>
                        <ControlTab 
                            active={activeTab === 'performance'} 
                            onClick={() => setActiveTab('performance')}
                        >
                            <BarChart3 size={16} style={{ marginRight: 8 }} />
                            Performance
                        </ControlTab>
                        <ControlTab 
                            active={activeTab === 'configuration'} 
                            onClick={() => setActiveTab('configuration')}
                        >
                            <Settings size={16} style={{ marginRight: 8 }} />
                            Configuration
                        </ControlTab>
                    </ControlTabs>

                    <TabContent active={activeTab === 'overview'}>
                        <RealTimeGraphs data={realtimeData} />
                    </TabContent>

                    <TabContent active={activeTab === 'controls'}>
                        <CacheControls onAction={handleControlAction} />
                    </TabContent>

                    <TabContent active={activeTab === 'performance'}>
                        <PerformanceMetrics data={systemMetrics} />
                    </TabContent>

                    <TabContent active={activeTab === 'configuration'}>
                        <CacheConfiguration onSave={handleControlAction} />
                    </TabContent>
                </ControlPanel>

                {/* Alert Panel */}
                <AlertPanel systemStatus={systemStatus} />
            </MainContent>
        </DashboardContainer>
    );
};

export default CacheManagementDashboard;