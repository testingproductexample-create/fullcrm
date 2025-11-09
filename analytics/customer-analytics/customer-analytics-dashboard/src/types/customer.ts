// Customer Analytics Types
export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  customerType: 'regular' | 'premium' | 'vip';
  acquisitionSource: string;
  acquisitionCampaign?: string;
  acquisitionCost: number;
  registrationDate: string;
  firstPurchaseDate?: string;
  lastPurchaseDate?: string;
  totalPurchases: number;
  totalRevenue: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  customerStatus: 'active' | 'inactive' | 'churned';
  churnDate?: string;
  churnReason?: string;
  loyaltyPoints: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  preferredContactMethod: 'email' | 'sms' | 'phone';
  timezone?: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSegment {
  id: string;
  customerId: string;
  segmentName: string;
  segmentType: 'demographic' | 'behavioral' | 'rfm' | 'purchase_pattern';
  segmentCriteria: Record<string, any>;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface SatisfactionScore {
  id: string;
  customerId: string;
  satisfactionScore: number; // 1-10
  npsScore: number; // 0-10
  csatScore: number; // 1-5
  surveyType: string;
  surveyDate: string;
  feedbackText?: string;
  sentimentScore: number; // -1.0 to 1.0
  source: string;
  createdAt: string;
}

export interface PurchaseBehavior {
  id: string;
  customerId: string;
  productId?: string;
  productCategory?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  discountAmount: number;
  paymentMethod: string;
  purchaseDate: string;
  orderId?: string;
  channel: 'online' | 'offline' | 'mobile_app';
  deviceType?: string;
  locationType?: string;
  purchaseFrequencyScore: number;
  recencyScore: number;
  monetaryScore: number;
  createdAt: string;
}

export interface JourneyEvent {
  id: string;
  customerId: string;
  sessionId?: string;
  eventType: string;
  eventName: string;
  pageUrl?: string;
  productId?: string;
  eventData?: Record<string, any>;
  timestamp: string;
  duration?: number;
  source?: string;
  medium?: string;
  campaign?: string;
  deviceInfo?: Record<string, any>;
  locationInfo?: Record<string, any>;
}

export interface LoyaltyProgram {
  id: string;
  customerId: string;
  programName: string;
  pointsEarned: number;
  pointsRedeemed: number;
  pointsBalance: number;
  tierLevel: string;
  tierProgress: number;
  programJoinDate: string;
  lastActivityDate?: string;
  programStatus: 'active' | 'inactive' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFeedback {
  id: string;
  customerId: string;
  feedbackType: 'review' | 'complaint' | 'suggestion' | 'compliment';
  rating?: number; // 1-5
  title?: string;
  content?: string;
  sentimentAnalysis?: Record<string, any>;
  topicTags?: string[];
  productId?: string;
  orderId?: string;
  feedbackSource: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  resolutionText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralProgram {
  id: string;
  referrerId: string;
  refereeId?: string;
  referralCode: string;
  referralStatus: 'pending' | 'completed' | 'rewarded';
  referralDate: string;
  conversionDate?: string;
  rewardType: 'discount' | 'cashback' | 'points' | 'gift';
  rewardValue?: number;
  rewardStatus: 'pending' | 'distributed' | 'cancelled';
  referredProductCategory?: string;
  conversionValue?: number;
  createdAt: string;
}

export interface CommunicationLog {
  id: string;
  customerId: string;
  communicationType: 'email' | 'sms' | 'push' | 'phone' | 'chat';
  subject?: string;
  content?: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced';
  campaignId?: string;
  templateId?: string;
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  interactionScore?: number;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  customerId: string;
  ticketNumber: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: 'billing' | 'technical' | 'product' | 'general';
  assignedTo?: string;
  resolutionTime?: number; // in hours
  customerSatisfaction?: number; // 1-5
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface PredictiveMetrics {
  id: string;
  customerId: string;
  churnProbability: number; // 0.0 to 1.0
  clvPrediction: number;
  nextPurchaseProbability: number;
  nextPurchaseDate?: string;
  recommendedProducts?: string[];
  engagementScore: number;
  riskScore: number;
  opportunityScore: number;
  predictionDate: string;
  modelVersion?: string;
  confidenceScore?: number;
  createdAt: string;
}

export interface CustomerCohort {
  id: string;
  cohortName: string;
  cohortType: string;
  cohortValue: string;
  startDate: string;
  endDate?: string;
  customerCount: number;
  retentionRates?: Record<string, number>;
  revenueCohorts?: Record<string, number>;
  createdAt: string;
}

export interface AcquisitionCost {
  id: string;
  channel: string;
  campaignName: string;
  costAmount: number;
  customersAcquired: number;
  cacAmount: number;
  timePeriod: 'daily' | 'weekly' | 'monthly';
  periodStart: string;
  periodEnd: string;
  roi?: number;
  conversionRate?: number;
  createdAt: string;
}

export interface RFMScores {
  customerId: string;
  rScore: number; // 1-5
  fScore: number; // 1-5
  mScore: number; // 1-5
  rfmSegment: string;
  recencyDays: number;
  frequency: number;
  monetaryValue: number;
}

export interface DashboardSummary {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  churnedCustomers: number;
  totalRevenue: number;
  avgCustomerValue: number;
  avgClv: number;
  avgCac: number;
  organicCustomers: number;
  paidCustomers: number;
  referralCustomers: number;
  avgSatisfactionScore: number;
  avgNpsScore: number;
  avgLoyaltyPoints: number;
  platinumCustomers: number;
  goldCustomers: number;
  newCustomersThisMonth: number;
  newCustomersLastMonth: number;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  [key: string]: any;
}

export interface FilterOptions {
  dateRange?: {
    start: string;
    end: string;
  };
  customerType?: string[];
  customerStatus?: string[];
  acquisitionSource?: string[];
  loyaltyTier?: string[];
  country?: string[];
  minRevenue?: number;
  maxRevenue?: number;
  minClv?: number;
  maxClv?: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}
