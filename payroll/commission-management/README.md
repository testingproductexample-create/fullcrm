# UAE Commission Management System

A comprehensive, feature-rich commission management system designed specifically for UAE payroll operations with Arabic/English support, AED currency formatting, and glassmorphism design.

## 🚀 Features

### Core Functionality
- **Sales Commission Tracking** - Real-time tracking of sales commissions with detailed breakdowns
- **Performance-Based Compensation** - Configure performance thresholds and bonus structures
- **Commission Calculation Engine** - Support for percentage, tiered, and fixed-rate commission types
- **Advanced Reports & Analytics** - Comprehensive reporting with visual charts and export options
- **Commission Structure Templates** - Reusable templates with versioning and preset libraries
- **Payment Processing Interface** - Bulk processing, automated scheduling, and receipt generation

### Advanced Features (Enhanced)

#### Templates Component Enhancements
- **Template Versioning** - Track template changes and maintain version history
- **Preset Templates Library** - Pre-built templates for different industries (Sales, Real Estate, Insurance, Retail)
- **Template Cloning** - Duplicate existing templates for quick setup
- **Custom Tier Configuration with Visual Editor** - Interactive tier configuration with visual charts
- **Template Testing/Preview Functionality** - Test commission calculations with sample amounts
- **Import/Export Capabilities** - Full template library import/export functionality

#### Payments Component Enhancements
- **Bulk Payment Processing** - Process multiple payments simultaneously with status tracking
- **Payment Gateway Integration** - Support for Emirates NBD, ADCB, Dubai Islamic Bank, Stripe, PayPal
- **Automated Payment Scheduling** - Set up recurring payment runs (weekly, monthly, quarterly, custom)
- **Payment History Tracking** - Complete audit trail with advanced filtering and search
- **Receipt Generation** - Automated HTML receipt generation and download

### Technical Features
- **Glassmorphism Design** - Modern, beautiful UI with glass-like effects
- **Arabic/English Support** - Full RTL and LTR language support
- **AED Currency Formatting** - Proper UAE Dirham formatting throughout
- **Supabase Integration** - Real-time database with RLS security
- **Real-time Updates** - Live data synchronization
- **Responsive Design** - Works perfectly on all device sizes
- **TypeScript** - Full type safety and better development experience

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for styling with custom glassmorphism effects
- **React i18next** for internationalization
- **Context API** for state management
- **Real-time subscriptions** via Supabase

### Backend (Supabase)
- **PostgreSQL** database with RLS (Row Level Security)
- **Real-time subscriptions** for live updates
- **Edge functions** for complex calculations
- **File storage** for receipts and documents
- **Authentication** with role-based access

## 📁 Project Structure

```
payroll/commission-management/
├── src/
│   ├── components/           # React components
│   │   ├── Dashboard.tsx     # Main dashboard with metrics
│   │   ├── CommissionTracking.tsx  # Sales commission tracking
│   │   ├── Settings.tsx      # Commission structure settings
│   │   ├── Reports.tsx       # Analytics and reports
│   │   ├── Templates.tsx     # Template management (enhanced)
│   │   └── Payments.tsx      # Payment processing (enhanced)
│   ├── context/
│   │   └── CommissionContext.tsx  # Global state management
│   ├── i18n/
│   │   └── index.ts          # Translation configurations
│   ├── lib/
│   │   ├── utils.ts          # Utility functions
│   │   └── supabase.ts       # Supabase integration
│   └── types/
│       └── index.ts          # TypeScript type definitions
├── supabase/
│   ├── migrations/           # Database migrations
│   │   └── 001_initial_schema.sql  # Complete database schema
│   └── functions/            # Edge functions
├── public/                   # Static assets
└── docs/                     # Documentation
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd payroll/commission-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Set up Supabase database**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link to your project
   supabase link --project-ref your_project_ref

   # Run migrations
   supabase db push
   ```

5. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Build for production**
   ```bash
   npm run build
   # or
   yarn build
   ```

## 📊 Database Schema

The system uses a comprehensive PostgreSQL database schema with the following main tables:

### Core Tables
- **employees** - Employee information and details
- **commission_structures** - Commission template definitions
- **commission_structure_versions** - Template version history
- **sales** - Sales transactions and orders
- **commission_calculations** - Calculated commission amounts
- **commission_payments** - Payment records and status
- **payment_details** - Payment breakdown information

### Advanced Features Tables
- **payment_gateways** - Payment provider configurations
- **payment_schedules** - Automated payment scheduling
- **preset_templates** - Pre-built template library
- **payment_receipts** - Generated receipt records
- **audit_logs** - Complete audit trail

### Key Features
- **Row Level Security (RLS)** for data protection
- **Audit logging** for compliance tracking
- **Real-time subscriptions** for live updates
- **JSON columns** for flexible data storage
- **Comprehensive indexing** for performance

## 🎨 Design System

### Glassmorphism Effects
- **Backdrop blur** with transparency
- **Gradient borders** and backgrounds
- **Subtle shadows** and hover effects
- **Smooth transitions** and animations

### Color Palette
- **Primary**: Blue to Purple gradients
- **Success**: Green tones for completed items
- **Warning**: Yellow/Orange for pending items
- **Error**: Red for failed items
- **Neutral**: Gray scales for text and backgrounds

### Typography
- **Font Family**: System fonts with fallbacks
- **Arabic Support**: Proper RTL text rendering
- **Responsive Sizing**: Scales appropriately across devices

## 🌍 Internationalization

### Supported Languages
- **English** (default)
- **Arabic** (full RTL support)

### Translation Structure
```typescript
// Example translation keys
{
  "common": {
    "save": { "en": "Save", "ar": "حفظ" },
    "cancel": { "en": "Cancel", "ar": "إلغاء" }
  },
  "dashboard": {
    "title": { "en": "Dashboard", "ar": "لوحة التحكم" },
    "totalCommissions": { "en": "Total Commissions", "ar": "إجمالي العمولات" }
  }
}
```

## 💰 Currency Support

### UAE Dirham (AED)
- **Symbol**: د.إ or AED
- **Format**: 1,234.56 د.إ
- **Decimal places**: 2
- **Rounding**: Standard banking rounding

### Formatted Examples
- `formatCurrency(1234.56)` → "1,234.56 د.إ"
- `formatCurrency(50000)` → "50,000.00 د.إ"
- `formatCurrency(0)` → "0.00 د.إ"

## 🔧 Configuration

### Commission Types

#### 1. Percentage-Based
```typescript
{
  type: 'percentage',
  baseRate: 5, // 5% commission
  bonusThreshold: 100000, // AED 100,000
  bonusRate: 2 // 2% bonus above threshold
}
```

#### 2. Tiered Structure
```typescript
{
  type: 'tiered',
  tierRates: [
    { min: 0, max: 50000, rate: 3 },      // 3% for first 50K
    { min: 50000, max: 100000, rate: 5 }, // 5% for next 50K
    { min: 100000, max: Infinity, rate: 7 } // 7% above 100K
  ],
  bonusThreshold: 150000,
  bonusRate: 2
}
```

#### 3. Fixed Amount
```typescript
{
  type: 'fixed',
  baseRate: 500, // AED 500 per sale
  bonusThreshold: 1000,
  bonusRate: 750 // AED 750 bonus above 1000 sales
}
```

### Payment Gateways
- **Bank Transfer** (Emirates NBD, ADCB, Dubai Islamic Bank, etc.)
- **Stripe** for online payments
- **PayPal** for international payments
- **Local Banks** for domestic transfers

### Scheduled Payments
- **Weekly** payments
- **Monthly** payments
- **Quarterly** payments
- **Custom** scheduling

## 📱 API Reference

### Commission Calculations
```typescript
// Calculate commission for a sale
const commission = calculateCommission(saleAmount, commissionStructure, bonusThresholds);

// Calculate tiered commission
const tieredCommission = calculateTieredCommission(saleAmount, tierRates);

// Check bonus eligibility
const bonusEligible = calculateBonusEligibility(saleAmount, bonusThreshold);
```

### Template Management
```typescript
// Create new template
const template = createTemplate(templateData);

// Clone existing template
const clonedTemplate = cloneTemplate(templateId);

// Export templates
const exportData = exportTemplates(templates);

// Import templates
await importTemplates(fileData);
```

### Payment Processing
```typescript
// Process payment
const payment = await processPayment(paymentId, gatewayId);

// Bulk process payments
const results = await bulkProcessPayments(paymentIds, gatewayId);

// Generate receipt
const receipt = generateReceipt(paymentData);

// Schedule payment
const schedule = createPaymentSchedule(scheduleData);
```

## 🔒 Security

### Authentication
- **Supabase Auth** for user management
- **JWT tokens** for API authentication
- **Role-based access** control

### Data Protection
- **Row Level Security (RLS)** on all tables
- **Audit logging** for all data changes
- **Input validation** and sanitization
- **SQL injection protection**

### Privacy
- **Data encryption** at rest and in transit
- **GDPR compliance** ready
- **Data retention** policies
- **User consent** management

## 🧪 Testing

### Unit Tests
```bash
npm run test
# or
yarn test
```

### E2E Tests
```bash
npm run test:e2e
# or
yarn test:e2e
```

### Test Coverage
- Component testing with React Testing Library
- API testing with Supabase test helpers
- Visual regression testing
- Accessibility testing

## 📈 Performance

### Optimization Features
- **Lazy loading** for large datasets
- **Virtual scrolling** for payment lists
- **Caching** with React Query
- **Code splitting** for better loading
- **Image optimization** and compression

### Monitoring
- **Real-time metrics** dashboard
- **Performance monitoring** with Web Vitals
- **Error tracking** and reporting
- **User analytics** and behavior tracking

## 🚀 Deployment

### Development
```bash
npm run dev
# Server runs on http://localhost:5173
```

### Production Build
```bash
npm run build
# Outputs to dist/ directory
```

### Supabase Deployment
```bash
# Deploy edge functions
supabase functions deploy

# Deploy database changes
supabase db push
```

### Environment-specific Configs
- **Development**: Local Supabase instance
- **Staging**: Supabase staging project
- **Production**: Supabase production project

## 📚 Usage Guide

### Enhanced Templates Management
- **Version Control**: Track template changes with detailed version history
- **Preset Library**: Quick start with pre-built templates for different industries
- **Template Cloning**: Duplicate successful templates for new use cases
- **Visual Editor**: Interactive tier configuration with real-time charts
- **Testing Suite**: Test calculations with sample amounts before deployment
- **Import/Export**: Backup and share template libraries

### Advanced Payment Processing
- **Bulk Operations**: Process multiple payments simultaneously
- **Gateway Integration**: Connect with UAE banks and international payment providers
- **Automated Scheduling**: Set up recurring payment runs
- **Status Tracking**: Real-time payment status with advanced filtering
- **Receipt Generation**: Automatic HTML receipt creation and download
- **Payment History**: Complete audit trail with search and export

### Dashboard & Analytics
- **Real-time Metrics**: Live commission tracking and KPIs
- **Performance Trends**: Interactive charts showing performance over time
- **Department Analysis**: Break down commissions by department and team
- **Top Performers**: Identify and track high-performing employees
- **Export Capabilities**: Export data in CSV, Excel, and PDF formats

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

### Code Standards
- **ESLint** for code quality
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Conventional Commits** for git messages

### Pull Request Process
1. Update README.md if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Request review from maintainers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [Component Documentation](docs/components.md)
- [Database Schema](docs/database.md)
- [Deployment Guide](docs/deployment.md)

### Getting Help
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact support team
- **Documentation**: Check comprehensive docs

### Common Issues

#### Database Connection Issues
```bash
# Check Supabase status
supabase status

# Reset database
supabase db reset
```

#### Build Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
npm run build -- --force
```

#### Translation Issues
```bash
# Extract translation keys
npm run i18n:extract

# Check for missing translations
npm run i18n:check
```

## 🔮 Roadmap

### Upcoming Features
- **Mobile App** (React Native)
- **Advanced Analytics** with ML insights
- **Integration APIs** for third-party systems
- **Multi-tenant** support
- **Advanced Workflow** automation
- **Compliance Reporting** for UAE regulations
- **WhatsApp Integration** for notifications
- **Voice Commands** in Arabic/English

### Long-term Goals
- **AI-powered** commission optimization
- **Blockchain** integration for transparency
- **Mobile-first** design approach
- **Enterprise** features and scaling
- **Industry-specific** templates

---

## 📞 Contact

For questions, support, or contributions, please reach out:

- **Email**: support@commission-management.ae
- **GitHub**: [Repository URL]
- **Documentation**: [Docs URL]
- **Demo**: [Live Demo URL]

---

**Built with ❤️ for UAE businesses**

*This system is specifically designed for UAE payroll operations and complies with local regulations and business practices.*