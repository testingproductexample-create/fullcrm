# CRM - Customer Management System for UAE Tailoring Businesses

A comprehensive Customer Relationship Management system built specifically for tailoring, boutique, and bespoke businesses in the UAE.

## Features

### Core CRM Capabilities
- **Customer Profile Management**: Complete customer profiles with UAE-specific fields (Emirates ID, visa status, address)
- **Customer Classification**: VIP, Regular, and New customer segmentation
- **Customer Status Tracking**: Active, Inactive, and Blocked status management
- **Profile Photos & Documents**: Upload and manage customer profile photos and identity documents

### Measurement & Fitting Management
- **Digital Measurement Forms**: Customizable forms for all garment types (Suits, Shirts, Dresses, etc.)
- **Measurement History**: Track measurement changes and fitting progress over time
- **Latest Measurement Tracking**: Automatic marking of most recent measurements
- **Custom Templates**: Create measurement templates for different garment types

### Customer Communication History
- **Multi-Channel Tracking**: SMS, Email, WhatsApp, Phone, and In-Person communications
- **Communication Logs**: Complete history of all customer interactions
- **Message Status**: Track sent, delivered, failed, and read statuses
- **Automated Communication**: System-generated communications for reminders and notifications

### Customer Relationship Management
- **Customer Notes**: Add important notes, complaints, feedback, and general observations
- **Pinned Notes**: Mark critical notes for easy access
- **Customer Preferences**: Track style, fabric, color, and fit preferences
- **Special Requirements**: Document customer-specific needs and instructions

### Events & Reminders
- **Birthday Tracking**: Automatic birthday reminders for customers
- **Anniversary Tracking**: Anniversary dates with yearly recurrence
- **Special Occasions**: Custom event tracking
- **Automated Reminders**: Daily cron job checks for upcoming events (runs at 9 AM daily)
- **Configurable Reminder Days**: Set reminders for 7, 3, and 1 day(s) before events

### Loyalty Programs
- **Points System**: Earn points based on spending (configurable per AED)
- **Loyalty Tiers**: Bronze, Silver, Gold, and Platinum tiers
- **Automatic Tier Assignment**: Based on total spending thresholds
- **Points Transactions**: Track earned, redeemed, expired, and adjusted points
- **Tier Benefits**: Configure benefits per tier

### Customer Segmentation & Analytics
- **Dynamic Segmentation**: Auto-updating customer segments based on criteria
- **Segment Definitions**: Classification, spending, loyalty tier-based segments
- **Customer Lifetime Value**: Automatic calculation and tracking
- **Order Analytics**: Total orders, total spent, average order value

### UAE Compliance & Localization
- **AED Currency**: Proper AED formatting with 2 decimal places
- **Arabic/English Support**: RTL layout support ready
- **Emirates-Based Fields**: Emirates ID, visa status, emirate selection
- **UAE VAT Ready**: 5% VAT calculation support (ready for integration)

### Mobile & PWA Features
- **Responsive Design**: Mobile-first, works on all devices
- **Touch-Friendly Interface**: Large touch targets (48px minimum)
- **Offline-Ready Architecture**: Service worker ready for offline functionality
- **Fast Loading**: Optimized with glassmorphism effects

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (React 19) with TypeScript
- **Styling**: TailwindCSS with custom design tokens
- **Design System**: Hybrid Modern Minimalism Premium + Glassmorphism
- **Icons**: Lucide React
- **Date Utilities**: date-fns

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (customer-profiles bucket)
- **Edge Functions**: 2 deployed functions
  - `check-customer-events`: Cron job (daily at 9 AM)
  - `update-customer-analytics`: Manual trigger for analytics updates

### Database Schema
- **13 Tables**: Organizations, Profiles, Customers, Customer Measurements, Measurement Templates, Customer Communications, Customer Preferences, Customer Notes, Customer Events, Customer Loyalty Programs, Customer Loyalty Transactions, Customer Segmentation, Customer Segment Members
- **Row Level Security**: Enabled on all tables with organization-based access control
- **Indexes**: Performance-optimized with 15+ indexes
- **Multi-Tenant**: Supports thousands of organizations

## Setup Instructions

### Prerequisites
- Node.js >= 20.9.0
- pnpm (recommended) or npm
- Supabase account

### Installation

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Environment Variables**
   
   The Supabase credentials are already configured in `lib/supabase.ts`:
   - Supabase URL: https://qmttczrdpzzsbxwutfwz.supabase.co
   - Supabase Anon Key: (already included)

3. **Database Setup**
   
   The database is already set up with:
   - All 13 tables created
   - RLS policies configured
   - Indexes optimized
   - Sample data populated

4. **Run Development Server**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

5. **Build for Production**
   ```bash
   pnpm build
   pnpm start
   ```

## Sample Data

The system includes sample data for testing:

### Organization
- **Name**: Elite Tailoring UAE
- **ID**: 00000000-0000-0000-0000-000000000001

### Sample Customers (5 customers)
1. Ahmed Al Mansoori (VIP, Platinum) - AED 45,000 spent
2. Fatima Hassan (Regular, Silver) - AED 12,000 spent
3. Mohammed Ali (New, Bronze) - AED 3,500 spent
4. Sarah Ahmed (Regular, Silver) - AED 8,000 spent
5. Omar Khalid (VIP, Platinum) - AED 65,000 spent

## Authentication

To test the system, create a user account through Supabase Auth and add a profile record.

## Design System

### Color Palette
- **Primary**: #0066FF (Professional Blue)
- **Glass Effects**: rgba(255,255,255,0.4) with backdrop-filter: blur(20px)

### Typography
- **Font**: Inter
- **Scale**: Hero (72px) to Tiny (12px)

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

## Built With

**MiniMax Agent** | **Version 1.0.0** | **Date: 2025-11-06**
