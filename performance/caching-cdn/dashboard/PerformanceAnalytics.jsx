/**
 * Performance Analytics Dashboard
 * Comprehensive analytics and reporting interface for caching performance
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    RadialBarChart,
    RadialBar
} from 'recharts';
import styled from 'styled-components';
import { 
    TrendingUp, 
    TrendingDown, 
    BarChart3, 
    Activity, 
    Clock, 
    Zap, 
    Server,
    Database,
    Globe,
    Download,
    Calendar,
    Filter,
    RefreshCw
} from 'lucide-react';

const AnalyticsContainer = styled.div`
    padding: 30px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
`;

const HeaderSection = styled.div`
    margin-bottom: 40px;
    text-align: center;
`;

const MainTitle = styled.h1`
    font-size: 2.5rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;

    svg {
        color: #667eea;
    }
`;

const SubTitle = styled.p`
    font-size: 1.125rem;
    color: #718096;
    margin: 0;
`;

const ControlsSection = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    flex-wrap: wrap;
    gap: 20px;
`;

const TimeRangeSelector = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;

    button {
        padding: 8px 16px;
        border: 1px solid #e2e8f0;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        color: #4a5568;
        transition: all 0.2s ease;

        &:hover {
            background: #f7fafc;
        }

        &.active {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }
    }
`;

const ExportControls = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;
`;

const ExportButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: #48bb78;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
        background: #38a169;
    }

    &:disabled {
        background: #a0aec0;
        cursor: not-allowed;
    }
`;

const CardsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
`;

const MetricCard = styled.div`
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: ${props => props.color || '#667eea'};
    }
`;

const MetricHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
`;

const MetricTitle = styled.h3`
    font-size: 0.875rem;
    font-weight: 600;
    color: #718096;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const MetricIcon = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: ${props => props.color || '#667eea'}20;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.color || '#667eea'};
`;

const MetricValue = styled.div`
    font-size: 2.5rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 8px;
`;

const MetricChange = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.875rem;
    color: ${props => props.positive ? '#48bb78' : '#e53e3e'};
    font-weight: 500;
`;

const ChartsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 30px;
    margin-bottom: 40px;
`;

const ChartCard = styled.div`
    background: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
`;

const ChartHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
`;

const ChartTitle = styled.h3`
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
`;

const ChartActions = styled.div`
    display: flex;
    gap: 10px;
`;

const ChartActionButton = styled.button`
    padding: 6px 12px;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
    color: #4a5568;
    transition: all 0.2s ease;

    &:hover {
        background: #edf2f7;
    }
`;

const PerformanceInsights = styled.div`
    background: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    margin-bottom: 40px;
`;

const InsightsHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 25px;
`;

const InsightsTitle = styled.h3`
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
    margin: 0;
`;

const InsightItem = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 10px;
    background: ${props => {
        if (props.severity === 'critical') return '#fed7d7';
        if (props.severity === 'warning') return '#feebc8';
        return '#c6f6d5';
    }};
    border-left: 4px solid ${props => {
        if (props.severity === 'critical') return '#e53e3e';
        if (props.severity === 'warning') return '#ed8936';
        return '#48bb78';
    }};
`;

const InsightIcon = styled.div`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${props => {
        if (props.severity === 'critical') return '#e53e3e';
        if (props.severity === 'warning') return '#ed8936';
        return '#48bb78';
    }};
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    margin-top: 2px;
`;

const InsightContent = styled.div`
    flex: 1;
`;

const InsightTitle = styled.h4`
    font-size: 0.875rem;
    font-weight: 600;
    color: #2d3748;
    margin: 0 0 5px 0;
`;

const InsightDescription = styled.p`
    font-size: 0.875rem;
    color: #4a5568;
    margin: 0;
    line-height: 1.5;
`;

const LoadingState = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300px;
    color: #718096;
    font-size: 1.125rem;
`;

const PerformanceAnalytics = () => {
    const [timeRange, setTimeRange] = useState('1h');
    const [loading, setLoading] = useState(false);
    const [analyticsData, setAnalyticsData] = useState({
        performance: {},
        trends: [],
        insights: []
    });

    // Generate mock analytics data
    useEffect(() => {
        const generateData = () => {
            const now = new Date();
            const timeRangeMs = {
                '1h': 60 * 60 * 1000,
                '24h': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000
            };

            const interval = timeRangeMs[timeRange] / 100; // 100 data points
            const trends = [];

            for (let i = 0; i < 100; i++) {
                const timestamp = new Date(now.getTime() - (100 - i) * interval);
                trends.push({
                    time: timestamp.toISOString(),
                    requests: Math.floor(Math.random() * 2000) + 500,
                    hits: Math.floor(Math.random() * 1500) + 400,
                    misses: Math.floor(Math.random() * 500) + 100,
                    responseTime: Math.floor(Math.random() * 200) + 50,
                    throughput: Math.floor(Math.random() * 100) + 20,
                    memory: Math.floor(Math.random() * 60) + 20,
                    cpu: Math.floor(Math.random() * 40) + 10,
                    disk: Math.floor(Math.random() * 30) + 10
                });
            }

            const performance = {
                avgResponseTime: 125,
                maxResponseTime: 450,
                minResponseTime: 45,
                p95ResponseTime: 280,
                p99ResponseTime: 380,
                throughput: 75,
                availability: 99.8,
                errorRate: 0.02,
                cacheHitRate: 84.5,
                memoryEfficiency: 78.2,
                cpuUtilization: 45.3,
                diskUtilization: 62.1
            };

            const insights = [
                {
                    severity: 'info',
                    title: 'Cache Performance Excellent',
                    description: 'Your cache hit rate of 84.5% is above the recommended threshold of 80%.'
                },
                {
                    severity: 'warning',
                    title: 'Memory Usage Increasing',
                    description: 'Memory usage has increased by 15% over the last hour. Consider clearing old cache entries.'
                },
                {
                    severity: 'critical',
                    title: 'High Error Rate Detected',
                    description: 'Error rate has spiked to 0.02% during peak hours. Immediate investigation required.'
                }
            ];

            setAnalyticsData({ performance, trends, insights });
        };

        setLoading(true);
        setTimeout(() => {
            generateData();
            setLoading(false);
        }, 1000);
    }, [timeRange]);

    const performanceMetrics = useMemo(() => [
        {
            title: 'Average Response Time',
            value: `${analyticsData.performance.avgResponseTime}ms`,
            change: { value: -12.5, type: 'improvement' },
            icon: Clock,
            color: '#667eea'
        },
        {
            title: 'Cache Hit Rate',
            value: `${analyticsData.performance.cacheHitRate}%`,
            change: { value: 5.2, type: 'improvement' },
            icon: Zap,
            color: '#48bb78'
        },
        {
            title: 'Throughput',
            value: `${analyticsData.performance.throughput} req/s`,
            change: { value: 8.3, type: 'improvement' },
            icon: Activity,
            color: '#805ad5'
        },
        {
            title: 'Availability',
            value: `${analyticsData.performance.availability}%`,
            change: { value: 0.1, type: 'decline' },
            icon: Server,
            color: '#38b2ac'
        }
    ], [analyticsData.performance]);

    const handleExport = async (format) => {
        setLoading(true);
        try {
            const response = await fetch('/api/analytics/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format, timeRange, data: analyticsData })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cache-analytics-${timeRange}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !analyticsData.trends.length) {
        return (
            <AnalyticsContainer>
                <LoadingState>
                    <RefreshCw style={{ marginRight: 10, animation: 'spin 1s linear infinite' }} />
                    Loading analytics data...
                </LoadingState>
            </AnalyticsContainer>
        );
    }

    return (
        <AnalyticsContainer>
            <HeaderSection>
                <MainTitle>
                    <BarChart3 size={32} />
                    Performance Analytics
                </MainTitle>
                <SubTitle>Comprehensive insights into your caching system performance</SubTitle>
            </HeaderSection>

            <ControlsSection>
                <TimeRangeSelector>
                    <span style={{ fontSize: '0.875rem', color: '#718096', fontWeight: 500 }}>Time Range:</span>
                    {['1h', '24h', '7d', '30d'].map((range) => (
                        <button
                            key={range}
                            className={timeRange === range ? 'active' : ''}
                            onClick={() => setTimeRange(range)}
                        >
                            {range.toUpperCase()}
                        </button>
                    ))}
                </TimeRangeSelector>

                <ExportControls>
                    <ExportButton onClick={() => handleExport('csv')}>
                        <Download size={16} />
                        Export CSV
                    </ExportButton>
                    <ExportButton onClick={() => handleExport('pdf')}>
                        <Download size={16} />
                        Export PDF
                    </ExportButton>
                </ExportControls>
            </ControlsSection>

            <CardsGrid>
                {performanceMetrics.map((metric, index) => (
                    <MetricCard key={index} color={metric.color}>
                        <MetricHeader>
                            <MetricTitle>{metric.title}</MetricTitle>
                            <MetricIcon color={metric.color}>
                                <metric.icon size={20} />
                            </MetricIcon>
                        </MetricHeader>
                        <MetricValue>{metric.value}</MetricValue>
                        <MetricChange positive={metric.change.type === 'improvement'}>
                            {metric.change.type === 'improvement' ? (
                                <TrendingUp size={16} />
                            ) : (
                                <TrendingDown size={16} />
                            )}
                            {Math.abs(metric.change.value)}% {metric.change.type === 'improvement' ? 'improvement' : 'decline'}
                        </MetricChange>
                    </MetricCard>
                ))}
            </CardsGrid>

            <ChartsGrid>
                <ChartCard>
                    <ChartHeader>
                        <ChartTitle>
                            <Activity size={20} />
                            Response Time Trends
                        </ChartTitle>
                        <ChartActions>
                            <ChartActionButton>Line</ChartActionButton>
                            <ChartActionButton>Area</ChartActionButton>
                        </ChartActions>
                    </ChartHeader>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsData.trends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="time" 
                                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                            />
                            <YAxis />
                            <Tooltip 
                                labelFormatter={(value) => new Date(value).toLocaleString()}
                            />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="responseTime" 
                                stroke="#667eea" 
                                strokeWidth={2}
                                name="Response Time (ms)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard>
                    <ChartHeader>
                        <ChartTitle>
                            <Zap size={20} />
                            Cache Hit Rate Over Time
                        </ChartTitle>
                    </ChartHeader>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analyticsData.trends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="time" 
                                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                            />
                            <YAxis />
                            <Tooltip 
                                labelFormatter={(value) => new Date(value).toLocaleString()}
                            />
                            <Legend />
                            <Area 
                                type="monotone" 
                                dataKey="hits" 
                                stackId="1" 
                                stroke="#48bb78" 
                                fill="#48bb7840"
                                name="Cache Hits"
                            />
                            <Area 
                                type="monotone" 
                                dataKey="misses" 
                                stackId="1" 
                                stroke="#e53e3e" 
                                fill="#e53e3e40"
                                name="Cache Misses"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard>
                    <ChartHeader>
                        <ChartTitle>
                            <Server size={20} />
                            Resource Utilization
                        </ChartTitle>
                    </ChartHeader>
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={analyticsData.trends.slice(-50)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="time" 
                                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                            />
                            <YAxis />
                            <Tooltip 
                                labelFormatter={(value) => new Date(value).toLocaleString()}
                            />
                            <Legend />
                            <Bar dataKey="memory" fill="#805ad5" name="Memory %" />
                            <Line 
                                type="monotone" 
                                dataKey="cpu" 
                                stroke="#ed8936" 
                                strokeWidth={2}
                                name="CPU %"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard>
                    <ChartHeader>
                        <ChartTitle>
                            <Database size={20} />
                            Performance Distribution
                        </ChartTitle>
                    </ChartHeader>
                    <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart data={analyticsData.trends.slice(-30)}>
                            <CartesianGrid />
                            <XAxis 
                                dataKey="requests" 
                                name="Requests"
                            />
                            <YAxis 
                                dataKey="responseTime" 
                                name="Response Time"
                            />
                            <Tooltip 
                                cursor={{ strokeDasharray: '3 3' }}
                                formatter={(value, name) => [
                                    name === 'requests' ? `${value} req/s` : `${value}ms`,
                                    name === 'requests' ? 'Requests' : 'Response Time'
                                ]}
                            />
                            <Scatter 
                                dataKey="responseTime" 
                                fill="#667eea"
                            />
                        </ScatterChart>
                    </ResponsiveContainer>
                </ChartCard>
            </ChartsGrid>

            <PerformanceInsights>
                <InsightsHeader>
                    <BarChart3 size={24} color="#667eea" />
                    <InsightsTitle>Performance Insights</InsightsTitle>
                </InsightsHeader>
                {analyticsData.insights.map((insight, index) => (
                    <InsightItem key={index} severity={insight.severity}>
                        <InsightIcon severity={insight.severity}>
                            {insight.severity === 'critical' ? '!' : 
                             insight.severity === 'warning' ? '⚠' : 'ℹ'}
                        </InsightIcon>
                        <InsightContent>
                            <InsightTitle>{insight.title}</InsightTitle>
                            <InsightDescription>{insight.description}</InsightDescription>
                        </InsightContent>
                    </InsightItem>
                ))}
            </PerformanceInsights>
        </AnalyticsContainer>
    );
};

export default PerformanceAnalytics;