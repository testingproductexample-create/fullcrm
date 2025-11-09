# Business Intelligence Dashboard

A comprehensive real-time business intelligence platform built with React, TypeScript, and modern web technologies. This dashboard provides executive-level insights, operational metrics, and customizable widgets for data-driven decision making.

## 🚀 Features

### Real-Time Analytics
- **15+ Key Performance Indicators** including revenue, orders, customers, and productivity metrics
- **Live data updates** with WebSocket connections for real-time monitoring
- **Interactive charts** with drill-down capabilities from summary to detailed data
- **Executive summary dashboard** with high-level business insights

### Customizable Interface
- **Drag-and-drop widget system** for personalized dashboard layouts
- **Role-based access control** for different user permissions
- **Mobile-responsive glassmorphism design** for optimal viewing on all devices
- **Customizable widget templates** for different business roles

### Alert & Notification System
- **Smart alert system** for important business changes
- **Configurable thresholds** and notification preferences
- **Priority-based alert management** with acknowledgment tracking
- **Real-time alerts** for critical business metrics

### Data Integration & Export
- **Multi-system integration** with CRM, orders, payroll, finance, and inventory systems
- **Export capabilities** to PDF, Excel, and CSV formats
- **Advanced filtering** with date range and category selections
- **Report generation** with customizable templates

### Advanced Analytics
- **Trend analysis** with percentage change calculations
- **Comparative metrics** for period-over-period analysis
- **Gauge charts** for performance indicators
- **Progress tracking** for goals and targets

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **State Management**: Zustand for lightweight state management
- **Charts & Visualization**: Recharts for interactive data visualization
- **Styling**: Tailwind CSS with custom glassmorphism theme
- **Build Tool**: Vite for fast development and building
- **Drag & Drop**: React Grid Layout for widget management
- **Icons**: Lucide React for consistent iconography
- **Export**: jsPDF and xlsx for data export functionality
- **Date Handling**: date-fns for date manipulation
- **Backend**: Supabase for database integration

## 📦 Installation

### Prerequisites
- Node.js (version 16 or higher)
- pnpm (recommended) or npm
- Supabase account (for backend integration)

### Setup Instructions

1. **Clone and navigate to the project**
   ```bash
   cd analytics/business-intelligence
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_BASE_URL=your_api_base_url
   VITE_WS_URL=your_websocket_url
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Build for production**
   ```bash
   pnpm build
   # or
   npm run build
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_API_BASE_URL` | Backend API base URL | No |
| `VITE_WS_URL` | WebSocket server URL | No |

### Supabase Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)
2. **Enable Row Level Security** for your tables
3. **Configure authentication** policies
4. **Set up real-time subscriptions** for live data updates

## 🎯 Usage

### Dashboard Management

1. **Add Widgets**: Click the "+" button to open the widget selector
2. **Customize Layout**: Drag and drop widgets to rearrange the dashboard
3. **Configure Filters**: Use the filter panel to set date ranges and categories
4. **Export Data**: Click the export button to save data in your preferred format
5. **Set Alerts**: Configure alert thresholds for important metrics

### Widget Types

- **KPI Widgets**: Display key performance indicators with trend analysis
- **Chart Widgets**: Various chart types (line, bar, pie, area) for data visualization
- **Table Widgets**: Sortable and filterable data tables
- **Gauge Widgets**: Circular gauges for performance metrics
- **Progress Widgets**: Linear progress indicators for goals
- **Alert Widgets**: Display and manage system alerts

### User Roles

- **Admin**: Full access to all features and settings
- **Manager**: Access to operational metrics and reports
- **Executive**: High-level business insights and KPIs
- **Analyst**: Detailed data analysis and export capabilities

## 🔌 Integration Guide

### CRM Integration
```typescript
// Example CRM data integration
import { apiService } from '../services/apiService';

// Fetch customer data
const customerData = await apiService.getCustomerMetrics({
  dateRange: { start: '2024-01-01', end: '2024-12-31' },
  filters: { status: 'active' }
});
```

### Finance Integration
```typescript
// Financial metrics integration
const financialData = await apiService.getFinancialMetrics({
  period: 'monthly',
  metrics: ['revenue', 'expenses', 'profit']
});
```

### Inventory Integration
```typescript
// Inventory tracking
const inventoryData = await apiService.getInventoryMetrics({
  warehouse: 'all',
  includeLowStock: true
});
```

## 📊 Available APIs

### KPI Metrics
- `getKPIData(options)`: Retrieve key performance indicators
- `getKPITrends(metricId, period)`: Get trend data for specific metrics
- `getKPIComparisons(metricIds)`: Compare multiple KPIs

### Data Export
- `exportToPDF(data, options)`: Export dashboard data to PDF
- `exportToExcel(data, options)`: Export to Excel format
- `exportToCSV(data, options)`: Export to CSV format

### Real-time Data
- `subscribeToUpdates(callback)`: Subscribe to real-time data updates
- `getRealTimeAlerts()`: Get current alerts
- `handleAlert(alertId, action)`: Manage alert acknowledgment

## 🏗️ Architecture

### Project Structure
```
business-intelligence/
├── components/           # React components
│   ├── widgets/         # Widget components
│   ├── App.tsx          # Main application
│   └── ...
├── hooks/               # Custom React hooks
├── services/            # API services
├── stores/              # Zustand state management
├── types/               # TypeScript definitions
├── utils/               # Utility functions
├── data/                # Configuration and constants
└── styles/              # CSS and styling
```

### State Management
- **Dashboard Store**: Manages widget layouts, filters, and user preferences
- **Data Stores**: Handle real-time data updates and caching
- **UI Stores**: Manage modal states, themes, and user interface

### Component Architecture
- **Widget Components**: Reusable, configurable widgets
- **Layout Components**: Responsive grid system and containers
- **Utility Components**: Buttons, modals, forms, and common UI elements

## 🔒 Security Features

- **Role-based access control** for sensitive financial data
- **Supabase Row Level Security** for database protection
- **Environment variable protection** for API keys
- **Input validation** and sanitization
- **Secure data transmission** with HTTPS and WebSocket security

## 📱 Mobile Support

- **Responsive design** that adapts to all screen sizes
- **Touch-friendly interface** with optimized controls
- **Mobile-optimized charts** for better readability
- **Swipe gestures** for navigation and widget management

## 🚀 Performance Optimizations

- **Lazy loading** for components and charts
- **Data caching** to reduce API calls
- **Virtual scrolling** for large data tables
- **Code splitting** for faster initial load times
- **Efficient re-renders** with React optimization techniques

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [documentation](./docs)
- Review the [API reference](./docs/api.md)
- Contact the development team

## 🔄 Changelog

### Version 1.0.0
- Initial release with comprehensive business intelligence features
- Real-time dashboard with 15+ KPIs
- Customizable widget system
- Multi-system integration capabilities
- Advanced export functionality
- Mobile-responsive design

---

Built with ❤️ using modern web technologies for data-driven decision making.