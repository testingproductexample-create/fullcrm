// Sample data for the custom reports system
import { format, subDays, subMonths } from 'date-fns';

// Sample Sales Data
export const sampleSalesData = Array.from({ length: 30 }, (_, i) => {
  const date = subDays(new Date(), 29 - i);
  const baseRevenue = 50000 + Math.random() * 100000;
  const trend = 1 + (i / 30) * 0.3; // 30% growth trend
  
  return {
    date: format(date, 'yyyy-MM-dd'),
    revenue: Math.round(baseRevenue * trend),
    orders: Math.floor((baseRevenue * trend) / 150),
    customers: Math.floor((baseRevenue * trend) / 200),
    products: Math.floor(Math.random() * 50) + 20,
    averageOrderValue: Math.round((baseRevenue * trend) / ((baseRevenue * trend) / 150)),
    conversionRate: Math.random() * 5 + 2,
    returningCustomerRate: Math.random() * 30 + 20,
    region: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'RAK', 'Fujairah', 'UAQ'][Math.floor(Math.random() * 7)],
    category: ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Beauty'][Math.floor(Math.random() * 6)]
  };
});

// Sample Customer Data
export const sampleCustomerData = Array.from({ length: 100 }, (_, i) => {
  const registrationDate = subMonths(new Date(), Math.floor(Math.random() * 12));
  
  return {
    id: `CUST-${String(i + 1).padStart(4, '0')}`,
    name: `Customer ${i + 1}`,
    email: `customer${i + 1}@example.com`,
    phone: `+971${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
    registrationDate: format(registrationDate, 'yyyy-MM-dd'),
    totalSpent: Math.round(Math.random() * 50000) + 1000,
    orderCount: Math.floor(Math.random() * 20) + 1,
    lastOrderDate: format(subDays(new Date(), Math.floor(Math.random() * 90)), 'yyyy-MM-dd'),
    segment: ['Premium', 'Regular', 'New', 'VIP'][Math.floor(Math.random() * 4)],
    region: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'RAK', 'Fujairah', 'UAQ'][Math.floor(Math.random() * 7)],
    preferredCategory: ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Beauty'][Math.floor(Math.random() * 6)],
    isActive: Math.random() > 0.1, // 90% active customers
    customerLifetimeValue: Math.round(Math.random() * 75000) + 5000,
    acquisitionChannel: ['Organic', 'Social Media', 'Email', 'Referral', 'Paid Ads'][Math.floor(Math.random() * 5)]
  };
});

// Sample Product Data
export const sampleProductData = Array.from({ length: 50 }, (_, i) => {
  const launchDate = subMonths(new Date(), Math.floor(Math.random() * 24));
  const basePrice = Math.random() * 1000 + 50;
  
  return {
    id: `PROD-${String(i + 1).padStart(4, '0')}`,
    name: `Product ${i + 1}`,
    sku: `SKU-${String(i + 1).padStart(6, '0')}`,
    category: ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Beauty'][Math.floor(Math.random() * 6)],
    subcategory: ['Mobile', 'Laptop', 'Shirt', 'Shoes', 'Furniture', 'Equipment'][Math.floor(Math.random() * 6)],
    price: Math.round(basePrice * 100) / 100,
    cost: Math.round(basePrice * 0.6 * 100) / 100,
    stock: Math.floor(Math.random() * 500) + 10,
    soldQuantity: Math.floor(Math.random() * 1000) + 1,
    revenue: Math.round(basePrice * Math.random() * 1000),
    margin: Math.round(((basePrice - (basePrice * 0.6)) / basePrice) * 100),
    launchDate: format(launchDate, 'yyyy-MM-dd'),
    rating: Math.round(Math.random() * 2 + 3), // 3-5 star rating
    reviewCount: Math.floor(Math.random() * 500) + 1,
    isActive: Math.random() > 0.05, // 95% active products
    supplier: `Supplier ${Math.floor(Math.random() * 10) + 1}`,
    weight: Math.round(Math.random() * 10 * 100) / 100, // kg
    dimensions: {
      length: Math.round(Math.random() * 50 * 100) / 100,
      width: Math.round(Math.random() * 30 * 100) / 100,
      height: Math.round(Math.random() * 20 * 100) / 100,
    }
  };
});

// Sample VAT Data (UAE Compliance)
export const sampleVatData = Array.from({ length: 12 }, (_, i) => {
  const date = subMonths(new Date(), 11 - i);
  const period = format(date, 'yyyy-MM');
  const sales = Math.random() * 500000 + 100000;
  const vatCollected = sales * 0.05; // 5% VAT
  const purchases = Math.random() * 300000 + 50000;
  const vatPaid = purchases * 0.05; // 5% VAT
  const netVat = vatCollected - vatPaid;
  
  return {
    period,
    sales: Math.round(sales),
    vatCollected: Math.round(vatCollected),
    purchases: Math.round(purchases),
    vatPaid: Math.round(vatPaid),
    netVat: Math.round(netVat),
    dueDate: format(new Date(date.getFullYear(), date.getMonth() + 1, 28), 'yyyy-MM-dd'),
    status: Math.random() > 0.2 ? 'Filed' : 'Pending', // 80% filed
    filedDate: Math.random() > 0.2 ? format(subDays(new Date(date.getFullYear(), date.getMonth() + 1, 28), Math.floor(Math.random() * 15)), 'yyyy-MM-dd') : null,
  };
});

// Sample Financial Data
export const sampleFinancialData = Array.from({ length: 12 }, (_, i) => {
  const date = subMonths(new Date(), 11 - i);
  const period = format(date, 'yyyy-MM');
  const revenue = Math.random() * 800000 + 200000;
  const costs = revenue * (0.6 + Math.random() * 0.2); // 60-80% of revenue
  const expenses = Math.random() * 100000 + 50000;
  const profit = revenue - costs - expenses;
  const margin = (profit / revenue) * 100;
  
  return {
    period,
    revenue: Math.round(revenue),
    costsOfGoodsSold: Math.round(costs),
    operatingExpenses: Math.round(expenses),
    grossProfit: Math.round(revenue - costs),
    netProfit: Math.round(profit),
    grossMargin: Math.round(margin * 100) / 100,
    netMargin: Math.round((profit / revenue) * 100 * 100) / 100,
    cashFlow: Math.round(Math.random() * 200000 - 50000), // Can be negative
    accountsReceivable: Math.round(revenue * 0.3),
    accountsPayable: Math.round(costs * 0.2),
  };
});

// Sample Employee Data
export const sampleEmployeeData = Array.from({ length: 50 }, (_, i) => {
  const hireDate = subMonths(new Date(), Math.floor(Math.random() * 60));
  const salary = Math.random() * 15000 + 5000; // AED 5,000 - 20,000
  
  return {
    id: `EMP-${String(i + 1).padStart(4, '0')}`,
    name: `Employee ${i + 1}`,
    email: `employee${i + 1}@company.com`,
    department: ['Sales', 'Marketing', 'HR', 'Finance', 'IT', 'Operations'][Math.floor(Math.random() * 6)],
    position: ['Manager', 'Senior', 'Junior', 'Specialist', 'Coordinator'][Math.floor(Math.random() * 5)],
    salary: Math.round(salary),
    hireDate: format(hireDate, 'yyyy-MM-dd'),
    performance: Math.floor(Math.random() * 2) + 4, // 4-5 rating
    attendance: Math.round((0.85 + Math.random() * 0.15) * 100) / 100, // 85-100%
    overtime: Math.floor(Math.random() * 40), // Hours per month
    leaveBalance: Math.floor(Math.random() * 30) + 5, // Days
    status: Math.random() > 0.05 ? 'Active' : 'Inactive',
    location: ['Dubai', 'Abu Dhabi', 'Sharjah', 'RAK'][Math.floor(Math.random() * 4)],
  };
});

// Sample Trade Data
export const sampleTradeData = Array.from({ length: 100 }, (_, i) => {
  const date = subDays(new Date(), Math.floor(Math.random() * 365));
  const value = Math.random() * 100000 + 1000;
  const isImport = Math.random() > 0.5;
  const customsDuty = value * (0.01 + Math.random() * 0.04); // 1-5% duty
  
  return {
    id: `TRADE-${String(i + 1).padStart(6, '0')}`,
    date: format(date, 'yyyy-MM-dd'),
    type: isImport ? 'Import' : 'Export',
    value: Math.round(value),
    customsDuty: Math.round(customsDuty),
    hsCode: `${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}.${String(Math.floor(Math.random() * 99)).padStart(2, '0')}`,
    description: `Trade item ${i + 1}`,
    country: ['China', 'USA', 'UK', 'Germany', 'Japan', 'India', 'Saudi Arabia'][Math.floor(Math.random() * 7)],
    port: isImport ? 'Jebel Ali Port' : 'Port of Dubai',
    status: ['Cleared', 'Pending', 'Under Review'][Math.floor(Math.random() * 3)],
    invoiceNumber: `INV-${String(i + 1).padStart(6, '0')}`,
    weight: Math.round(Math.random() * 1000 * 100) / 100, // kg
  };
};

// Sample Geographic Data
export const sampleGeographicData = [
  { region: 'Dubai', sales: 2500000, customers: 12500, growth: 12.5, performance: 92 },
  { region: 'Abu Dhabi', sales: 1800000, customers: 8500, growth: 8.3, performance: 87 },
  { region: 'Sharjah', sales: 1200000, customers: 6800, growth: 15.2, performance: 89 },
  { region: 'Ajman', sales: 450000, customers: 2100, growth: 22.1, performance: 78 },
  { region: 'RAK', sales: 380000, customers: 1800, growth: 18.7, performance: 81 },
  { region: 'Fujairah', sales: 280000, customers: 1200, growth: 9.4, performance: 75 },
  { region: 'UAQ', sales: 150000, customers: 600, growth: 6.8, performance: 73 },
];

// Sample Compliance Data
export const sampleComplianceData = [
  {
    type: 'UAE_VAT',
    name: 'Q1 2024 VAT Return',
    dueDate: '2024-04-30',
    status: 'Filed',
    amount: 125000,
    period: '2024-Q1',
  },
  {
    type: 'UAE_CORP',
    name: 'Corporate Tax Return 2023',
    dueDate: '2024-09-30',
    status: 'Pending',
    amount: 450000,
    period: '2023',
  },
  {
    type: 'UAE_LABOR',
    name: 'WPS Compliance Report',
    dueDate: '2024-12-31',
    status: 'Compliant',
    amount: 0,
    period: '2024-12',
  },
];

// Sample Template Data
export const sampleTemplates = [
  {
    id: 'template-1',
    name: 'Sales Performance Report',
    category: 'business',
    components: 6,
    description: 'Comprehensive sales analysis with trends and KPIs',
    lastUsed: '2024-01-15',
  },
  {
    id: 'template-2',
    name: 'UAE VAT Compliance',
    category: 'compliance',
    components: 5,
    description: 'Automated VAT reporting for UAE businesses',
    lastUsed: '2024-01-10',
  },
  {
    id: 'template-3',
    name: 'Customer Analytics',
    category: 'business',
    components: 8,
    description: 'Customer behavior and lifetime value analysis',
    lastUsed: '2024-01-20',
  },
];

// Sample Dashboard Configurations
export const sampleDashboards = [
  {
    id: 'dashboard-1',
    name: 'Executive Dashboard',
    description: 'High-level KPIs for executive review',
    widgets: 4,
    lastUpdated: '2024-01-22',
  },
  {
    id: 'dashboard-2',
    name: 'Sales Dashboard',
    description: 'Detailed sales performance and forecasting',
    widgets: 8,
    lastUpdated: '2024-01-21',
  },
  {
    id: 'dashboard-3',
    name: 'Compliance Dashboard',
    description: 'UAE compliance status and upcoming deadlines',
    widgets: 6,
    lastUpdated: '2024-01-19',
  },
];

// Sample Chart Configurations
export const sampleChartConfigs = [
  {
    id: 'chart-1',
    name: 'Revenue Trend',
    type: 'line',
    dataSource: 'sales',
    xAxis: 'date',
    yAxis: 'revenue',
  },
  {
    id: 'chart-2',
    name: 'Sales by Region',
    type: 'bar',
    dataSource: 'geographic',
    xAxis: 'region',
    yAxis: 'sales',
  },
  {
    id: 'chart-3',
    name: 'Product Categories',
    type: 'pie',
    dataSource: 'products',
    xAxis: 'category',
    yAxis: 'revenue',
  },
];

// Sample Schedule Configurations
export const sampleSchedules = [
  {
    id: 'schedule-1',
    reportId: 'template-1',
    frequency: 'weekly',
    nextRun: '2024-01-29',
    status: 'Active',
    recipients: ['manager@company.com', 'director@company.com'],
  },
  {
    id: 'schedule-2',
    reportId: 'template-2',
    frequency: 'monthly',
    nextRun: '2024-02-01',
    status: 'Active',
    recipients: ['compliance@company.com'],
  },
];

// Utility functions to get random data
export function getRandomSalesData(days = 30) {
  return sampleSalesData.slice(0, days);
}

export function getRandomCustomersData(count = 100) {
  return sampleCustomerData.slice(0, count);
}

export function getRandomProductsData(count = 50) {
  return sampleProductData.slice(0, count);
}

export function getRandomVatData(months = 12) {
  return sampleVatData.slice(0, months);
}

export function getRandomFinancialData(months = 12) {
  return sampleFinancialData.slice(0, months);
}

export function getRandomEmployeeData(count = 50) {
  return sampleEmployeeData.slice(0, count);
}

export function getRandomTradeData(count = 100) {
  return sampleTradeData.slice(0, count);
}

export function getRandomGeographicData() {
  return sampleGeographicData;
}

export function getRandomComplianceData() {
  return sampleComplianceData;
}

export function getRandomTemplatesData() {
  return sampleTemplates;
}

export function getRandomDashboardsData() {
  return sampleDashboards;
}

export function getRandomChartConfigsData() {
  return sampleChartConfigs;
}

export function getRandomSchedulesData() {
  return sampleSchedules;
}