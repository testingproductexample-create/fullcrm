# Operational Analytics System

A comprehensive operational analytics system for business efficiency and performance tracking. Built with React, TypeScript, and featuring a modern glassmorphism design.

## 🚀 Features

### Core Analytics
- **Employee Productivity Analytics** - Performance metrics and team performance tracking
- **Order Completion Time Analysis** - Bottleneck identification and workflow optimization
- **Resource Utilization Tracking** - Equipment, staff, and materials efficiency reports
- **Workflow Efficiency Analysis** - Process optimization and automation recommendations
- **Appointment and Scheduling Analytics** - No-show tracking and scheduling efficiency
- **Customer Service Performance Metrics** - Response time analysis and satisfaction tracking
- **Quality Control Analytics** - Defect tracking and improvement suggestions
- **Inventory Turnover Analysis** - Stock optimization and reorder alerts
- **Cost per Order Analysis** - Profitability insights and cost breakdown
- **Employee Utilization and Overtime Analytics** - Capacity planning and time tracking
- **Performance Benchmarking** - Target tracking and scorecards
- **Automated Efficiency Reports** - Scheduled reports and notifications
- **Interactive Operational Dashboards** - Real-time metrics and KPIs

### Technical Features
- **Modern Glassmorphism UI** - Beautiful, modern interface with glass-like effects
- **Real-time Data Updates** - Live data streaming and automatic refresh
- **Responsive Design** - Mobile-first, fully responsive interface
- **Advanced Charts and Visualizations** - Interactive charts with Recharts
- **Data Export** - PDF, Excel, and CSV export capabilities
- **Advanced Filtering** - Multi-dimensional data filtering and search
- **Performance Optimization** - Optimized for large datasets
- **TypeScript Support** - Full type safety and IntelliSense
- **State Management** - Zustand for efficient state management
- **Modern Stack** - React 18, Vite, Tailwind CSS

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with glassmorphism design
- **Charts**: Recharts for data visualization
- **State Management**: Zustand
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Query Management**: React Query

## 📊 Database Schema

The system includes a comprehensive database schema with the following main tables:

- `employees` - Employee information and profiles
- `performance_metrics` - Individual performance tracking
- `orders` - Order processing and completion data
- `workflow_steps` - Process step definitions
- `order_workflow` - Order workflow tracking
- `resources` - Equipment, staff, and materials
- `resource_utilization` - Utilization tracking
- `appointments` - Scheduling and appointment data
- `customer_service_tickets` - Support ticket management
- `quality_control` - Quality inspection records
- `inventory` - Product and material inventory
- `inventory_transactions` - Stock movement tracking
- `time_tracking` - Employee time and work tracking
- `performance_targets` - Goal setting and tracking
- `system_alerts` - Automated notifications
- `dashboard_configs` - Dashboard customization

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- PostgreSQL database (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd operational-analytics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   - Run the SQL schema from `database-schema.sql` on your PostgreSQL database
   - Update connection settings in your application configuration

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📱 Application Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main application layout
│   ├── Header.tsx      # Application header
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── MetricCard.tsx  # KPI display cards
│   ├── Chart.tsx       # Chart components
│   └── DataTable.tsx   # Data table component
├── pages/              # Application pages
│   ├── Dashboard.tsx   # Main dashboard
│   ├── EmployeeAnalytics.tsx
│   ├── OrderAnalytics.tsx
│   ├── ResourceAnalytics.tsx
│   ├── WorkflowAnalytics.tsx
│   ├── AppointmentAnalytics.tsx
│   ├── CustomerServiceAnalytics.tsx
│   ├── QualityControlAnalytics.tsx
│   ├── InventoryAnalytics.tsx
│   ├── CostAnalytics.tsx
│   ├── TimeTrackingAnalytics.tsx
│   ├── PerformanceTargets.tsx
│   ├── Alerts.tsx
│   ├── Reports.tsx
│   └── Settings.tsx
├── store/              # State management
│   └── index.ts        # Zustand store configuration
├── types/              # TypeScript type definitions
│   └── index.ts        # Application types
├── utils/              # Utility functions
│   └── index.ts        # Helper functions and constants
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles and glassmorphism
```

## 🎨 Design System

### Glassmorphism Effects

The application features a modern glassmorphism design with:
- **Glass Cards**: Semi-transparent cards with blur effects
- **Glass Buttons**: Interactive buttons with glass-like appearance
- **Glass Inputs**: Input fields with glass styling
- **Dark Theme**: Optimized for dark mode with blue-purple gradients
- **Smooth Animations**: Fade-in, slide-up, and hover effects
- **Responsive Layout**: Mobile-first responsive design

### Color Palette

- **Primary**: Blue shades (500-700)
- **Secondary**: Gray shades (400-800)
- **Success**: Green shades (400-600)
- **Warning**: Yellow shades (400-600)
- **Danger**: Red shades (400-600)

## 📈 Key Metrics and KPIs

### Dashboard Overview
- Total Orders and Completion Rate
- Average Completion Time
- Revenue and Profitability
- Employee Utilization
- System Alerts and Critical Issues

### Employee Analytics
- Performance Scores and Efficiency Ratings
- Task Completion Rates
- Quality Scores
- Goal Achievement Percentages
- Time Tracking and Overtime

### Operational Efficiency
- Resource Utilization Rates
- Workflow Bottleneck Identification
- Process Automation Opportunities
- Quality Control Metrics
- Inventory Turnover Rates

### Financial Insights
- Cost per Order Analysis
- Profit Margins by Department
- Resource Cost Efficiency
- Revenue Trends and Projections

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_DATABASE_URL=postgresql://user:password@localhost:5432/operational_analytics
VITE_REFRESH_INTERVAL=30000
```

### Customization

- **Dashboard Layout**: Modify `src/store/dashboard.ts` for widget configuration
- **Color Scheme**: Update `tailwind.config.js` for custom colors
- **Data Sources**: Configure API endpoints in utility files
- **Refresh Intervals**: Adjust in store configuration
- **User Permissions**: Configure in settings page

## 📊 Data Management

### Mock Data
The application includes comprehensive mock data generation for development:
- 25+ employees with realistic data
- 150+ orders with completion tracking
- Resource utilization data
- Performance metrics and time series data
- Quality control records
- Inventory data with stock levels
- Customer service tickets
- System alerts and notifications

### Real Data Integration
For production use:
1. Connect to your PostgreSQL database
2. Update API endpoints in utility functions
3. Implement authentication and authorization
4. Configure real-time data streaming
5. Set up automated data processing

## 🔍 Analytics Features

### Automated Insights
- **Bottleneck Detection**: Identifies workflow inefficiencies
- **Trend Analysis**: Analyzes performance trends over time
- **Anomaly Detection**: Flags unusual patterns in data
- **Performance Alerts**: Automated notifications for KPI thresholds
- **Predictive Analytics**: Forecasts future performance

### Reporting
- **Automated Reports**: Daily, weekly, and monthly summaries
- **Custom Reports**: User-defined report templates
- **Export Formats**: PDF, Excel, and CSV export options
- **Scheduled Delivery**: Email and dashboard delivery
- **Real-time Dashboards**: Live updating metrics and KPIs

## 🛡️ Security Features

- **Role-based Access Control**: User permission management
- **Data Encryption**: Secure data transmission and storage
- **Audit Logging**: Track user actions and data changes
- **Secure API**: Authenticated API endpoints
- **Data Validation**: Input validation and sanitization

## 🚀 Performance Optimization

- **Code Splitting**: Lazy loading for optimal performance
- **Memoization**: React.memo and useMemo for expensive operations
- **Virtual Scrolling**: Handle large datasets efficiently
- **Caching**: React Query for API response caching
- **Bundle Optimization**: Vite for optimal bundle size
- **Image Optimization**: Optimized image loading and formats

## 📱 Mobile Support

- **Responsive Design**: Mobile-first approach
- **Touch Optimized**: Touch-friendly interface
- **Progressive Web App**: PWA capabilities
- **Offline Support**: Basic offline functionality
- **Mobile Navigation**: Collapsible sidebar for mobile

## 🔄 Real-time Features

- **Live Data Updates**: Real-time dashboard updates
- **WebSocket Integration**: Live data streaming
- **Push Notifications**: Browser and mobile notifications
- **Auto-refresh**: Configurable refresh intervals
- **Real-time Alerts**: Instant system alerts and notifications

## 📋 API Documentation

### Core Endpoints

```
GET /api/dashboard/metrics - Dashboard overview metrics
GET /api/employees - Employee data and performance
GET /api/orders - Order processing and completion data
GET /api/resources - Resource utilization data
GET /api/inventory - Inventory and stock data
GET /api/alerts - System alerts and notifications
POST /api/export - Export data in various formats
GET /api/reports - Generate and download reports
```

### Response Format

All API responses follow a standard format:

```json
{
  "data": {},
  "success": true,
  "message": "Operation successful",
  "totalCount": 100,
  "page": 1,
  "limit": 20
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki
- Join our community Slack channel

## 🔄 Version History

- **v1.0.0** - Initial release with core analytics features
- **v1.1.0** - Added workflow optimization and automation recommendations
- **v1.2.0** - Enhanced reporting and export capabilities
- **v1.3.0** - Mobile optimization and PWA features
- **v1.4.0** - Real-time data streaming and enhanced performance

---

Built with ❤️ for operational excellence