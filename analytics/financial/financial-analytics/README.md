# Financial Analytics & Forecasting System

A comprehensive financial analytics platform designed for tailoring and fashion businesses, featuring advanced revenue analysis, predictive forecasting, and UAE VAT compliance.

## 🚀 Features

### Core Analytics
- **Revenue Analytics**: Trend analysis, comparative reporting, and growth tracking
- **Profit & Loss Analysis**: Margin tracking and performance analysis
- **Cost Analysis**: Expense optimization insights and cost center analysis
- **Cash Flow Analysis**: Real-time cash flow monitoring and projections
- **ROI Analysis**: Business area performance tracking and return on investment

### Advanced Capabilities
- **Financial Forecasting**: Multiple algorithms including linear regression, moving average, exponential smoothing, and seasonal ARIMA
- **Budget Management**: Budget vs actual performance tracking with variance analysis
- **UAE VAT Compliance**: Automated 5% VAT calculation and reporting system
- **Financial Benchmarking**: Industry standard comparisons
- **Multi-Currency Support**: AED primary currency with exchange rate management
- **Financial Alerts**: Budget overruns, anomalies, and threshold monitoring

### Interactive Dashboard
- **Real-time Visualizations**: Interactive charts powered by Recharts
- **Key Performance Indicators**: Customizable KPI tracking
- **Responsive Design**: Dark/light theme support
- **Automated Reporting**: PDF report generation and export

## 🏗️ Architecture

### Backend
- **Express.js**: RESTful API server
- **Supabase**: PostgreSQL database with built-in authentication
- **JWT Authentication**: Secure API access
- **Row Level Security**: Database-level access control

### Frontend
- **React 18**: Modern component-based UI
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first styling framework
- **Recharts**: Data visualization library

### Database Schema
- `financial_transactions`: Core transaction data
- `budgets`: Budget planning and tracking
- `forecasts`: Predictive analytics storage
- `financial_alerts`: Alert management
- `vat_records`: UAE VAT compliance tracking
- `currencies`: Multi-currency support
- `exchange_rates`: Real-time rate management
- `financial_benchmarks`: Industry comparisons
- `audit_logs`: System audit trail

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project
- Git for version control

## ⚡ Quick Start

### 1. Clone and Install
```bash
cd analytics/financial/financial-analytics
pnpm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
# See Environment Variables section below
```

### 3. Database Setup
```bash
# Run the database schema in your Supabase SQL editor
# Copy and execute the contents of database-schema.sql
```

### 4. Development Server
```bash
# Start backend API server
pnpm run server

# In a new terminal, start frontend
pnpm run dev
```

### 5. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 🔧 Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# API Configuration
API_RATE_LIMIT=100
CORS_ORIGIN=http://localhost:5173

# Database Configuration
DB_POOL_SIZE=20
DB_TIMEOUT=30000

# Currency Configuration
BASE_CURRENCY=AED
CURRENCY_UPDATE_INTERVAL=3600

# Alert Configuration
ALERT_CHECK_INTERVAL=300
MAX_ALERTS_PER_USER=50
```

## 📊 API Documentation

### Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
POST /api/auth/logout
```

### Financial Data
```
GET    /api/financial/transactions
POST   /api/financial/transactions
GET    /api/financial/transactions/:id
PUT    /api/financial/transactions/:id
DELETE /api/financial/transactions/:id

GET    /api/financial/analytics
GET    /api/financial/cash-flow
GET    /api/financial/roi-analysis
GET    /api/financial/budgets
```

### Forecasting
```
GET  /api/forecasting/revenue
GET  /api/forecasting/expenses
GET  /api/forecasting/cash-flow
POST /api/forecasting/custom
GET  /api/forecasting/accuracy
```

### Reports
```
GET  /api/reports/profit-loss
GET  /api/reports/balance-sheet
GET  /api/reports/cash-flow-statement
GET  /api/reports/vat-summary
POST /api/reports/custom
```

### Alerts
```
GET  /api/alerts
POST /api/alerts/rules
GET  /api/alerts/history
PUT  /api/alerts/:id/read
DELETE /api/alerts/:id
```

### Configuration
```
GET  /api/config/currencies
POST /api/config/currencies
GET  /api/config/benchmarks
PUT  /api/config/preferences
```

## 📈 Usage Examples

### Adding a Transaction
```javascript
const transaction = {
  category: "Revenue",
  subcategory: "Sales",
  amount: 2500.00,
  currency: "AED",
  description: "Custom suit order #1234",
  date: "2024-01-15"
};

await fetch('/api/financial/transactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(transaction)
});
```

### Getting Revenue Forecast
```javascript
const forecast = await fetch('/api/forecasting/revenue?period=6months&algorithm=linear_regression');
const data = await forecast.json();
```

### Generating VAT Report
```javascript
const vatReport = await fetch('/api/reports/vat-summary?period=quarter&year=2024');
const data = await vatReport.json();
```

## 🧪 Testing

```bash
# Run frontend tests
pnpm run test

# Run backend tests
pnpm run test:server

# Run end-to-end tests
pnpm run test:e2e
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
# Build for production
pnpm run build

# Deploy dist folder to your hosting platform
```

### Backend (Railway/Render/Heroku)
```bash
# Install production dependencies
pnpm install --prod

# Set environment variables in your hosting platform
# Deploy using your platform's deployment method
```

### Database (Supabase)
1. Create a new Supabase project
2. Run the `database-schema.sql` in the SQL editor
3. Configure Row Level Security policies
4. Set up authentication providers

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **JWT Authentication**: Secure API access
- **Rate Limiting**: API abuse prevention
- **CORS Protection**: Cross-origin request security
- **Input Validation**: SQL injection prevention
- **Audit Logging**: Complete action tracking

## 🏢 Business-Specific Features

### Tailoring Industry
- **Order Revenue Tracking**: Custom order profitability
- **Material Cost Management**: Fabric and supply cost analysis
- **Seasonal Forecasting**: Fashion season trend analysis
- **Customer Lifetime Value**: Repeat customer analytics

### UAE Compliance
- **5% VAT Calculation**: Automated UAE VAT processing
- **VAT Filing Reports**: Compliance-ready documentation
- **Transaction Categorization**: VAT-eligible vs non-VAT items
- **Audit Trail**: Complete financial transaction history

## 📊 Performance Metrics

- **Real-time Updates**: Live financial data synchronization
- **Fast Loading**: Optimized database queries
- **Scalable Architecture**: Handles 10,000+ transactions
- **Mobile Responsive**: Works on all device sizes
- **Offline Support**: Progressive Web App capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the [Wiki](../../wiki) for detailed documentation
- Review the [API Documentation](#-api-documentation) section

## 🗺️ Roadmap

- [ ] Machine Learning Price Optimization
- [ ] Advanced Cash Flow Predictions
- [ ] Multi-location Financial Management
- [ ] Inventory Integration
- [ ] Mobile App (React Native)
- [ ] Third-party Accounting Software Integration

## 📸 Screenshots

### Dashboard Overview
![Dashboard](docs/dashboard-preview.png)

### Forecasting Interface
![Forecasting](docs/forecasting-preview.png)

### VAT Compliance
![VAT Compliance](docs/vat-preview.png)

---

**Built with ❤️ for the tailoring and fashion industry**