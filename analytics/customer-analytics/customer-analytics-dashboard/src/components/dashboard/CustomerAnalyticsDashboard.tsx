import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Heart, 
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardSummary, Customer, PurchaseBehavior } from '@/types/customer';
import { CustomerOverview } from './CustomerOverview';
import { CustomerSegmentation } from './CustomerSegmentation';
import { CLVAnalysis } from './CLVAnalysis';
import { SatisfactionAnalytics } from './SatisfactionAnalytics';
import { RetentionAnalysis } from './RetentionAnalysis';
import { PurchaseAnalytics } from './PurchaseAnalytics';
import { JourneyMapping } from './JourneyMapping';
import { LoyaltyProgram } from './LoyaltyProgram';
import { FeedbackAnalysis } from './FeedbackAnalysis';
import { ReferralAnalytics } from './ReferralAnalytics';
import { CACAnalysis } from './CACAnalysis';
import { PredictiveAnalytics } from './PredictiveAnalytics';
import { CommunicationMetrics } from './CommunicationMetrics';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  description 
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getChangeIcon = () => {
    if (change === undefined) return null;
    return changeType === 'positive' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="ml-1">{Math.abs(change)}%</span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export const CustomerAnalyticsDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulate API call - replace with actual API
        setTimeout(() => {
          setDashboardData({
            totalCustomers: 15847,
            activeCustomers: 12450,
            inactiveCustomers: 2156,
            churnedCustomers: 1241,
            totalRevenue: 2847592.50,
            avgCustomerValue: 179.65,
            avgClv: 847.23,
            avgCac: 42.15,
            organicCustomers: 8234,
            paidCustomers: 4521,
            referralCustomers: 3092,
            avgSatisfactionScore: 8.2,
            avgNpsScore: 7.1,
            avgLoyaltyPoints: 342,
            platinumCustomers: 847,
            goldCustomers: 2134,
            newCustomersThisMonth: 1247,
            newCustomersLastMonth: 1156
          });
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading customer analytics...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive customer behavior and satisfaction analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Eye className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Clock className="h-3 w-3 mr-1" />
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Customers"
          value={formatNumber(dashboardData?.totalCustomers || 0)}
          change={7.8}
          changeType="positive"
          icon={<Users className="h-4 w-4 text-blue-600" />}
          description="Total registered customers"
        />
        <MetricCard
          title="Active Customers"
          value={formatNumber(dashboardData?.activeCustomers || 0)}
          change={5.2}
          changeType="positive"
          icon={<TrendingUp className="h-4 w-4 text-green-600" />}
          description="Customers with recent activity"
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(dashboardData?.totalRevenue || 0)}
          change={12.4}
          changeType="positive"
          icon={<DollarSign className="h-4 w-4 text-yellow-600" />}
          description="Lifetime customer revenue"
        />
        <MetricCard
          title="Avg. CLV"
          value={formatCurrency(dashboardData?.avgClv || 0)}
          change={3.7}
          changeType="positive"
          icon={<Target className="h-4 w-4 text-purple-600" />}
          description="Customer Lifetime Value"
        />
        <MetricCard
          title="Avg. Satisfaction"
          value={`${dashboardData?.avgSatisfactionScore || 0}/10`}
          change={2.1}
          changeType="positive"
          icon={<Heart className="h-4 w-4 text-red-600" />}
          description="Customer satisfaction score"
        />
        <MetricCard
          title="Net Promoter Score"
          value={`${dashboardData?.avgNpsScore || 0}/10`}
          change={-0.5}
          changeType="negative"
          icon={<Star className="h-4 w-4 text-orange-600" />}
          description="Loyalty and recommendation score"
        />
        <MetricCard
          title="Avg. CAC"
          value={formatCurrency(dashboardData?.avgCac || 0)}
          change={-8.2}
          changeType="positive"
          icon={<TrendingUp className="h-4 w-4 text-indigo-600" />}
          description="Customer Acquisition Cost"
        />
        <MetricCard
          title="New Customers (This Month)"
          value={formatNumber(dashboardData?.newCustomersThisMonth || 0)}
          change={7.9}
          changeType="positive"
          icon={<Users className="h-4 w-4 text-cyan-600" />}
          description="New customers acquired this month"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-12">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="segmentation">Segmentation</TabsTrigger>
          <TabsTrigger value="clv">CLV Analysis</TabsTrigger>
          <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="purchase">Purchase Behavior</TabsTrigger>
          <TabsTrigger value="journey">Journey Mapping</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty Program</TabsTrigger>
          <TabsTrigger value="feedback">Feedback Analysis</TabsTrigger>
          <TabsTrigger value="referral">Referral Analytics</TabsTrigger>
          <TabsTrigger value="cac">CAC Analysis</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <CustomerOverview />
        </TabsContent>

        <TabsContent value="segmentation" className="space-y-4">
          <CustomerSegmentation />
        </TabsContent>

        <TabsContent value="clv" className="space-y-4">
          <CLVAnalysis />
        </TabsContent>

        <TabsContent value="satisfaction" className="space-y-4">
          <SatisfactionAnalytics />
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <RetentionAnalysis />
        </TabsContent>

        <TabsContent value="purchase" className="space-y-4">
          <PurchaseAnalytics />
        </TabsContent>

        <TabsContent value="journey" className="space-y-4">
          <JourneyMapping />
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-4">
          <LoyaltyProgram />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <FeedbackAnalysis />
        </TabsContent>

        <TabsContent value="referral" className="space-y-4">
          <ReferralAnalytics />
        </TabsContent>

        <TabsContent value="cac" className="space-y-4">
          <CACAnalysis />
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          <PredictiveAnalytics />
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <CommunicationMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
};
