# UAE Payroll System - Monthly Salary Calculations

A comprehensive React-based payroll system designed for UAE businesses, ensuring full compliance with UAE labor laws and providing automated salary calculation capabilities.

## 🏗️ Features

### Core Functionality
- **Automated Salary Calculations**: Process monthly salary calculations with UAE-compliant formulas
- **Base Salary Processing**: Handle different salary structures and employee categories
- **UAE-Compliant Overtime**: Automatic overtime calculations at 125% rate with daily/annual limits
- **Tax & Deductions Management**: Handle UAE-specific tax requirements and deductions
- **Allowances Management**: Transportation, meal, accommodation, and skills allowances
- **Preview & Approval Workflows**: Review calculations before finalizing
- **Bulk Processing**: Process multiple employees simultaneously
- **Real-time Compliance Checking**: Ensure adherence to UAE labor laws

### Technical Features
- **Modern React Architecture**: Built with React 18, TypeScript, and Vite
- **Glassmorphism Design**: Beautiful, modern UI with glassmorphism effects
- **Mobile Responsive**: Optimized for all device sizes
- **Supabase Integration**: Real-time database with row-level security
- **Performance Optimized**: Code splitting and lazy loading
- **Type-Safe**: Full TypeScript implementation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase project (configured in `src/lib/supabase.ts`)

### Installation

1. **Install dependencies:**
   ```bash
   cd payroll/monthly-calculations
   pnpm install
   ```

2. **Start development server:**
   ```bash
   pnpm dev
   ```

3. **Build for production:**
   ```bash
   pnpm build
   ```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── layout/         # Layout components (Sidebar, Header)
│   ├── Overview.tsx    # Dashboard overview
│   ├── IndividualCalculation.tsx  # Single employee calculations
│   └── BulkProcessing.tsx         # Bulk operations
├── hooks/              # Custom React hooks
│   └── usePayroll.ts   # Payroll-specific hooks
├── lib/               # Utilities and configurations
│   └── supabase.ts    # Supabase client and helpers
├── types/             # TypeScript type definitions
│   └── payroll.ts     # Payroll-related types
├── utils/             # Utility functions
│   └── calculations.ts # UAE-compliant calculation functions
├── App.tsx            # Main application component
├── main.tsx           # Application entry point
└── index.css          # Global styles and Tailwind CSS
```

## 🇦🇪 UAE Labor Law Compliance

### Key Compliance Features
- **Minimum Wage**: Ensures all salaries meet UAE minimum wage requirements (1,000 AED)
- **Overtime Rate**: Automatic 125% overtime rate calculation
- **Daily Overtime Limits**: Maximum 2 hours per day compliance checking
- **Annual Overtime Limits**: Maximum 500 hours per year tracking
- **No Income Tax**: UAE has no personal income tax (implemented in calculations)
- **Working Days**: Standard 22 working days per month

### Compliance Validation
- Real-time compliance checking during calculations
- Automatic warnings for non-compliant entries
- Detailed compliance reports
- Audit trail for all calculations

## 🧮 Calculation Logic

### Base Salary Calculation
```typescript
grossSalary = baseSalary + overtimeAmount + commission + bonus + allowances
netSalary = grossSalary - deductions
```

### UAE Overtime Calculation
```typescript
overtimeRate = hourlyRate * 1.25  // 125% UAE compliance rate
overtimeAmount = overtimeHours * overtimeRate
```

### Deductions (UAE Specific)
- Income Tax: 0% (UAE has no personal income tax)
- Health Insurance: 1% of gross salary (max 300 AED)
- Advance Salary: Employee advances
- Leave Deductions: Unpaid leave calculations

## 🔧 Configuration

### Supabase Setup
Update the Supabase configuration in `src/lib/supabase.ts`:
```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

### Database Schema
The system uses the following main tables:
- `salary_structures` - Employee salary configurations
- `salary_calculations` - Monthly calculation records
- `overtime_calculations` - Overtime tracking
- `allowances` - Employee allowances
- `deductions` - Tax and other deductions
- `employees` - Employee master data

## 📱 Component Overview

### Layout Components
- **Sidebar**: Navigation menu with all features
- **Header**: Period navigation, search, and user profile

### Main Components
- **Overview**: Dashboard with summary statistics and quick actions
- **IndividualCalculation**: Single employee salary calculation interface
- **BulkProcessing**: Multi-employee bulk processing capabilities
- **Compliance Dashboard**: UAE labor law compliance monitoring

## 🎨 Design System

### Glassmorphism UI
- Modern glassmorphism design with backdrop blur effects
- Dark theme optimized for professional environments
- Smooth animations and transitions
- Responsive design for all screen sizes

### Color Scheme
- Primary: Blue gradient (#3b82f6 to #1d4ed8)
- Secondary: Purple accent (#8b5cf6)
- Success: Green (#10b981)
- Warning: Orange (#f59e0b)
- Error: Red (#ef4444)

## 🔄 State Management

### Custom Hooks
- `useEmployees` - Employee data management
- `useSalaryStructures` - Salary structure handling
- `useSalaryCalculations` - Calculation CRUD operations
- `usePayrollSummary` - Dashboard statistics
- `useBulkCalculations` - Bulk processing logic
- `useCalculationPreview` - Real-time calculation preview

## 📊 Performance Features

### Optimization
- React.memo for component memoization
- Code splitting by vendor libraries
- Lazy loading of heavy components
- Optimized bundle sizes
- Efficient re-rendering patterns

### Bundle Analysis
```bash
# Analyze bundle size
npx vite-bundle-analyzer dist
```

## 🧪 Testing

### Development
```bash
# Run in development mode
pnpm dev

# Build and preview
pnpm build
pnpm preview
```

### Production Deployment
```bash
# Production build
pnpm build:prod
```

## 🛠️ Development Tools

### Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm build:prod` - Production build with optimizations
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm clean` - Clean node_modules and lockfile

### IDE Configuration
The project includes:
- TypeScript configuration for better IntelliSense
- ESLint configuration for code quality
- Prettier configuration for consistent formatting
- Tailwind CSS IntelliSense support

## 📈 Monitoring & Analytics

### Features
- Real-time calculation status tracking
- Performance monitoring
- Compliance score tracking
- Error reporting and logging
- User activity analytics

## 🔒 Security

### Implemented Security Features
- Supabase Row Level Security (RLS)
- Input validation and sanitization
- XSS protection
- CSRF protection
- Secure API endpoints

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📝 API Integration

### Supabase Operations
- Real-time subscriptions for live updates
- Optimistic updates for better UX
- Error handling and retry logic
- Pagination for large datasets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software designed for UAE payroll compliance.

## 🆘 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Core payroll calculation features
- UAE labor law compliance
- Glassmorphism UI design
- Supabase integration
- Mobile responsive design

---

**Note**: This system is specifically designed for UAE labor law compliance. For use in other jurisdictions, additional compliance rules may need to be implemented.