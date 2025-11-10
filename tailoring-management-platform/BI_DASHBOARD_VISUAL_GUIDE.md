# BI Dashboard - Section-by-Section Walkthrough

## Dashboard Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  BUSINESS INTELLIGENCE DASHBOARD                 │
│                                                                  │
│  [Week] [Month] [Quarter] [Year]  ← Date Range Selector        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SECTION 1: EXECUTIVE OVERVIEW                                    │
│                                                                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │  REVENUE  │  │  ORDERS   │  │ COMPLETE  │  │ CUSTOMER  │   │
│  │  Card     │  │  Card     │  │ RATE Card │  │ SAT Card  │   │
│  │  ↑ +15%  │  │  ↑ +23%  │  │  ↑ +5%   │  │  ↑ +12%  │   │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘   │
│                                                                  │
│  Each card shows:                                                │
│  - Main metric value (large text)                               │
│  - Growth percentage vs previous period                         │
│  - Trend indicator (↑ up / ↓ down)                            │
│  - Color-coded: Green (positive) / Red (negative)              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SECTION 2: FINANCIAL PERFORMANCE                                 │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │ Revenue Trends       │  │ Profit Margins       │           │
│  │ (Line Chart)         │  │ (Bar Chart)          │           │
│  │                      │  │                      │           │
│  │     📈 6 months     │  │   📊 Monthly %      │           │
│  │   Actual vs Target   │  │  Actual vs Target    │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │ Payment Status       │  │ Top Services         │           │
│  │ (Pie Chart)          │  │ (Bar Chart)          │           │
│  │                      │  │                      │           │
│  │  🥧 Paid/Pending/   │  │  📊 Revenue by      │           │
│  │     Overdue          │  │     Service Type     │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                  │
│  Data Sources:                                                   │
│  - invoices.total_amount_aed (Revenue)                          │
│  - payments.amount_aed (Payment status)                         │
│  - orders.service_type (Top services)                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SECTION 3: OPERATIONS & ORDERS                                   │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │ Order Pipeline       │  │ Order Volume         │           │
│  │ (Horizontal Bar)     │  │ (Line Chart)         │           │
│  │                      │  │                      │           │
│  │ Pending     ▓▓▓▓▓   │  │   📈 Trends over    │           │
│  │ In Progress ▓▓▓▓▓▓▓ │  │      time period     │           │
│  │ Quality Chk ▓▓▓     │  │                      │           │
│  │ Ready       ▓▓      │  │                      │           │
│  │ Completed   ▓▓▓▓▓▓▓▓│  │                      │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │ Completion Times     │  │ Quality Metrics      │           │
│  │ (Bar Chart)          │  │ (KPI Cards)          │           │
│  │                      │  │                      │           │
│  │  📊 Avg time by     │  │  Defect Rate: 2.3%  │           │
│  │     service          │  │  First Time Right:  │           │
│  │                      │  │       97.7%          │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                  │
│  Data Sources:                                                   │
│  - orders.status (Pipeline stages)                              │
│  - quality_inspections.inspection_result (Quality metrics)      │
│  - orders.created_at, completed_at (Completion times)           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SECTION 4: PEOPLE & RESOURCES                                    │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │ Employee Metrics     │  │ Utilization          │           │
│  │ (KPI Cards)          │  │ (Doughnut Chart)     │           │
│  │                      │  │                      │           │
│  │ Total: 45 employees  │  │   🍩 Workload       │           │
│  │ Active: 42           │  │      Distribution    │           │
│  │ Avg Productivity: 8.5│  │                      │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                  │
│  ┌──────────────────────────────────────────┐                  │
│  │ Top Performers (Leaderboard)              │                  │
│  │                                            │                  │
│  │  1. Ahmed M. - 127 orders - AED 45,230   │                  │
│  │  2. Fatima K. - 115 orders - AED 42,100  │                  │
│  │  3. Khalid S. - 98 orders - AED 38,900   │                  │
│  │  4. Sara A. - 87 orders - AED 35,600     │                  │
│  │  5. Omar H. - 82 orders - AED 33,450     │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                  │
│  Data Sources:                                                   │
│  - employees table (Count, status)                              │
│  - orders grouped by employee_id (Performance)                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SECTION 5: CUSTOMER ANALYTICS                                    │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │ Segmentation         │  │ Acquisition Trends   │           │
│  │ (Pie Chart)          │  │ (Line Chart)         │           │
│  │                      │  │                      │           │
│  │  🥧 VIP: 15%        │  │   📈 New customers  │           │
│  │     Regular: 60%     │  │      per month       │           │
│  │     New: 20%         │  │                      │           │
│  │     At-Risk: 5%      │  │                      │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │ Lifetime Value       │  │ Retention Metrics    │           │
│  │ (Line Chart)         │  │ (KPI Cards)          │           │
│  │                      │  │                      │           │
│  │  📈 CLV over time   │  │  Retention: 87.3%   │           │
│  │     by segment       │  │  Repeat Rate: 65%   │           │
│  │                      │  │  Churn: 12.7%       │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                  │
│  Data Sources:                                                   │
│  - customers.customer_tier (Segmentation)                       │
│  - customers.created_at (Acquisition)                           │
│  - invoices grouped by customer_id (Lifetime value)             │
│  - orders.customer_id (Retention, repeat purchases)             │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────┐
│   USER ACCESSES     │
│   /analytics/       │
│   dashboard         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  useDashboardData() │  ← Hook fetches data
│      Hook           │
└──────────┬──────────┘
           │
           │  Extracts organization_id from user
           │  Calculates date ranges (current & previous)
           │
           ▼
┌─────────────────────┐
│   React Query       │
│   Executes 6        │  ← Parallel execution
│   Supabase Queries  │
└──────────┬──────────┘
           │
           ├─────────────────────────────────┐
           │                                 │
           ▼                                 ▼
    ┌──────────────┐              ┌──────────────────┐
    │   CURRENT    │              │    PREVIOUS      │
    │   PERIOD     │              │    PERIOD        │
    └──────┬───────┘              └────────┬─────────┘
           │                               │
           ├──► orders (current)           ├──► orders (previous)
           ├──► invoices (current)         ├──► invoices (previous)
           ├──► customers (all)            │
           ├──► employees (all)            │
           ├──► inspections (current)      │
           └──► payments (current)         │
                                           │
           ┌────────────────────────────────┘
           │
           ▼
    ┌──────────────────┐
    │   CALCULATIONS   │
    │   (No Mock Data) │
    └──────┬───────────┘
           │
           │  • Revenue = SUM(invoices.total_amount_aed)
           │  • Orders = COUNT(orders) WHERE status != 'completed'
           │  • Growth = ((current - previous) / previous) * 100
           │  • Completion Rate = (completed / total) * 100
           │  • CLV = AVG(revenue_per_customer)
           │  • Retention = (returning / total) * 100
           │  • Quality = (passed / total) * 100
           │
           ▼
    ┌──────────────────┐
    │  RETURN DATA TO  │
    │   DASHBOARD PAGE │
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │   RENDER 5       │
    │   SECTIONS WITH  │  ← Charts display data
    │   20+ CHARTS     │
    └──────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ AUTO-REFRESH     │
    │ Every 30 seconds │  ← React Query refetches
    └──────────────────┘
```

## Real Calculation Examples

### Executive Overview Calculations

**1. Total Revenue with Growth**
```typescript
// Current period revenue
const currentRevenue = currentInvoices.reduce(
  (sum, inv) => sum + (inv.total_amount_aed || 0), 
  0
);

// Previous period revenue
const previousRevenue = previousInvoices.reduce(
  (sum, inv) => sum + (inv.total_amount_aed || 0), 
  0
);

// Calculate growth percentage
const revenueGrowth = previousRevenue > 0 
  ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
  : 0;

// Result example:
// currentRevenue = AED 125,000
// previousRevenue = AED 100,000
// revenueGrowth = +25%
```

**2. Active Orders with Growth**
```typescript
// Current active orders
const activeOrders = currentOrders.filter(
  o => o.status !== 'completed' && o.status !== 'cancelled'
).length;

// Previous active orders
const previousActiveOrders = previousOrders.filter(
  o => o.status !== 'completed' && o.status !== 'cancelled'
).length;

// Calculate growth
const ordersGrowth = previousActiveOrders > 0
  ? ((activeOrders - previousActiveOrders) / previousActiveOrders) * 100
  : 0;

// Result example:
// activeOrders = 45
// previousActiveOrders = 38
// ordersGrowth = +18.4%
```

**3. Completion Rate**
```typescript
// Current completion rate
const completedOrders = currentOrders.filter(
  o => o.status === 'completed'
).length;
const completionRate = currentOrders.length > 0 
  ? (completedOrders / currentOrders.length) * 100 
  : 0;

// Previous completion rate
const prevCompletedOrders = previousOrders.filter(
  o => o.status === 'completed'
).length;
const prevCompletionRate = previousOrders.length > 0
  ? (prevCompletedOrders / previousOrders.length) * 100
  : 0;

// Calculate change
const completionRateChange = completionRate - prevCompletionRate;

// Result example:
// completionRate = 87.5%
// prevCompletionRate = 82.0%
// completionRateChange = +5.5%
```

### Financial Performance Calculations

**Payment Status Breakdown**
```typescript
// Paid amount
const paidAmount = payments
  .filter(p => p.status === 'completed')
  .reduce((sum, p) => sum + (p.amount_aed || 0), 0);

// Pending amount
const pendingInvoices = currentInvoices
  .filter(i => i.status === 'sent' || i.status === 'viewed');
const pendingAmount = pendingInvoices
  .reduce((sum, i) => sum + (i.balance_due_aed || 0), 0);

// Overdue amount
const overdueInvoices = currentInvoices
  .filter(i => i.status === 'overdue');
const overdueAmount = overdueInvoices
  .reduce((sum, i) => sum + (i.balance_due_aed || 0), 0);

// Result example:
// Paid: AED 95,000 (65%)
// Pending: AED 40,000 (27%)
// Overdue: AED 12,000 (8%)
```

**Top Services by Revenue**
```typescript
const serviceRevenue: { [key: string]: number } = {};

currentOrders.forEach(order => {
  const service = order.service_type || 'General Services';
  const revenue = currentInvoices
    .filter(inv => inv.order_id === order.id)
    .reduce((sum, inv) => sum + (inv.total_amount_aed || 0), 0);
  serviceRevenue[service] = (serviceRevenue[service] || 0) + revenue;
});

const topServices = Object.entries(serviceRevenue)
  .map(([name, revenue]) => ({ name, revenue }))
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 4);

// Result example:
// 1. Suit Tailoring: AED 45,000
// 2. Alterations: AED 32,000
// 3. Custom Shirts: AED 28,000
// 4. Embroidery: AED 15,000
```

### Operations Calculations

**Order Pipeline**
```typescript
const orderPipeline = [
  { 
    stage: 'Pending', 
    count: currentOrders.filter(o => o.status === 'pending').length 
  },
  { 
    stage: 'In Progress', 
    count: currentOrders.filter(o => o.status === 'in_progress').length 
  },
  { 
    stage: 'Quality Check', 
    count: currentOrders.filter(o => o.status === 'quality_check').length 
  },
  { 
    stage: 'Ready', 
    count: currentOrders.filter(o => o.status === 'ready').length 
  },
  { 
    stage: 'Completed', 
    count: currentOrders.filter(o => o.status === 'completed').length 
  }
];

// Result example:
// Pending: 12 orders
// In Progress: 28 orders
// Quality Check: 8 orders
// Ready: 15 orders
// Completed: 87 orders
```

**Quality Metrics**
```typescript
// Defect rate
const defectRate = currentInspections.length > 0
  ? (currentInspections.filter(i => i.inspection_result === 'failed').length 
     / currentInspections.length) * 100
  : 0;

// First time right rate
const firstTimeRightRate = currentInspections.length > 0
  ? (currentInspections.filter(i => 
       i.inspection_result === 'passed' && !i.is_rework
     ).length / currentInspections.length) * 100
  : 100;

// Result example:
// Defect Rate: 2.3%
// First Time Right: 97.7%
```

### Customer Analytics Calculations

**Customer Segmentation**
```typescript
// VIP customers
const vipCustomers = allCustomers
  .filter(c => c.customer_tier === 'vip').length;

// Regular customers
const regularCustomers = allCustomers
  .filter(c => c.customer_tier === 'regular').length;

// New customers (created in current period)
const newCustomers = allCustomers.filter(c => {
  const createdAt = new Date(c.created_at);
  return createdAt >= new Date(currentStart) 
      && createdAt <= new Date(currentEnd);
}).length;

// At-risk customers (no orders in 90+ days)
const atRiskCustomers = allCustomers.filter(c => {
  const lastOrder = currentOrders
    .filter(o => o.customer_id === c.id)
    .sort((a, b) => 
      new Date(b.created_at).getTime() - 
      new Date(a.created_at).getTime()
    )[0];
  
  if (!lastOrder) return true;
  
  const daysSinceLastOrder = 
    (Date.now() - new Date(lastOrder.created_at).getTime()) 
    / (1000 * 60 * 60 * 24);
  
  return daysSinceLastOrder > 90;
}).length;

// Result example:
// VIP: 23 customers (15%)
// Regular: 95 customers (60%)
// New: 32 customers (20%)
// At-Risk: 8 customers (5%)
```

**Customer Lifetime Value**
```typescript
// Calculate average CLV
const avgLifetimeValue = allCustomers.length > 0
  ? currentInvoices.reduce(
      (sum, inv) => sum + (inv.total_amount_aed || 0), 
      0
    ) / allCustomers.length
  : 0;

// Result example:
// Total Revenue: AED 125,000
// Total Customers: 158
// Avg CLV: AED 791.14 per customer
```

## Interactive Features

### Date Range Selector
- Click dropdown to choose: Week | Month | Quarter | Year
- All queries automatically recalculate with new date range
- Previous period adjusts accordingly for growth comparisons

### Chart Interactions
- **Hover**: Shows tooltip with exact values
- **Click Legend**: Toggle dataset visibility
- **Responsive**: Charts resize for mobile/tablet/desktop

### Auto-Refresh
- Every 30 seconds: All data automatically refreshes
- Subtle loading indicator appears during refresh
- No interruption to user experience

## Visual Design Elements

### Glassmorphism Cards
```css
/* KPI Card Styling */
backdrop-filter: blur(12px);
background-color: rgba(255, 255, 255, 0.8);
border-radius: 16px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
border: 1px solid rgba(255, 255, 255, 0.3);
```

### Color Scheme
- **Primary**: Blue (#3B82F6) - Charts, accents
- **Success**: Green (#10B981) - Positive growth
- **Warning**: Amber (#F59E0B) - Neutral/pending
- **Danger**: Red (#EF4444) - Negative growth, overdue
- **Background**: Gradient (slate-50 → blue-50 → indigo-50)

### Typography
- **Headings**: Bold, clear hierarchy
- **Metrics**: Large, readable numbers
- **Labels**: Medium weight, subtle colors
- **Growth**: Bold with trend indicator

## UAE Compliance Examples

### Currency Formatting
```typescript
// Example: AED 125,430.50
new Intl.NumberFormat('en-AE', {
  style: 'currency',
  currency: 'AED',
  minimumFractionDigits: 2
}).format(125430.50);

// Display: د.إ125,430.50 or AED 125,430.50
```

### Date Formatting
```typescript
// Example: 11/11/2025
new Date('2025-11-11').toLocaleDateString('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

// Display: 11/11/2025 (DD/MM/YYYY)
```

### Percentage Formatting
```typescript
// Example: +15.3%
const growth = 15.3;
const formatted = `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;

// Display: +15.3%
```

## Summary

This dashboard provides a complete business intelligence solution with:

✅ **5 Comprehensive Sections** covering all business aspects
✅ **20+ Interactive Charts** with Chart.js visualizations
✅ **Real Database Calculations** (zero mock data)
✅ **30-Second Auto-Refresh** for real-time insights
✅ **Period Comparisons** for growth analysis
✅ **Professional Design** with glassmorphism aesthetics
✅ **Full Responsiveness** across all devices
✅ **UAE Compliance** in all formatting

**The dashboard transforms raw business data into actionable insights for executive decision-making.**
