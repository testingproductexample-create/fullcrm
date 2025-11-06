# Overtime & Allowances Management System

A comprehensive React-based system for managing employee overtime and allowances with UAE labor law compliance.

## Features

### 🏢 **UAE Labor Law Compliant**
- Built-in UAE labor law rules and regulations
- Automatic overtime calculation compliance
- Working hours limits (8 hours/day, 2 hours overtime max)
- Weekend and holiday rate calculations
- Comprehensive compliance reporting

### ⏰ **Overtime Management**
- Real-time overtime tracking and calculation
- Multiple overtime types (weekday, weekend, holiday, night)
- Automatic compliance validation
- Overtime approval workflows
- Integration with attendance systems
- Historical overtime records and reporting

### 💰 **Allowances Management**
- Employee allowance configuration by type:
  - Housing allowances
  - Transport allowances
  - Meal allowances
  - Medical allowances
  - Phone allowances
- Allowance amount configuration
- Active/inactive allowance tracking
- Department and employee-type based configurations

### ✅ **Approval Workflows**
- Multi-level approval process
- Manager approval interface
- Compliance validation before approval
- Rejection reasons and comments
- Approval history tracking

### 📊 **Reports & Analytics**
- Comprehensive overtime reports
- Department-wise analysis
- Cost analysis and trending
- Top overtime employees tracking
- Compliance status monitoring
- Export functionality

### ⚙️ **Configuration Management**
- Employee type configuration
- Department-specific settings
- Overtime rate management
- Allowance amount configuration
- UAE law compliance settings
- Bulk configuration updates

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: TailwindCSS + Glassmorphism Design
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Build Tool**: Vite
- **UI Components**: Custom glassmorphism components

## File Structure

```
src/payroll/overtime-allowances/
├── types.ts                           # TypeScript type definitions
├── uaeCompliantCalculator.ts          # UAE labor law calculation utilities
├── service.ts                         # Mock data service
├── OvertimeAllowancesDashboard.tsx    # Main dashboard component
├── components/
│   ├── Card.tsx                       # Glassmorphism card component
│   ├── Button.tsx                     # Button component
│   ├── Badge.tsx                      # Badge component
│   ├── Tabs.tsx                       # Tabs component
│   ├── OvertimeManagement.tsx         # Overtime records management
│   ├── AllowancesManagement.tsx       # Allowances management
│   ├── ApprovalWorkflow.tsx           # Approval workflow interface
│   ├── ReportsAnalytics.tsx           # Reports and analytics
│   └── ConfigurationPanel.tsx         # System configuration
└── README.md                          # This file
```

## UAE Labor Law Compliance

### Working Hours
- **Maximum daily working hours**: 8 hours
- **Maximum daily overtime**: 2 hours
- **Working days**: Sunday to Thursday (5 days)
- **Weekend**: Friday and Saturday (2 days)

### Overtime Rates
- **Weekday overtime**: 1.25x (25% premium)
- **Weekend overtime**: 1.5x (50% premium)
- **Holiday overtime**: 2.0x (100% premium)
- **Night overtime**: 1.5x (50% premium + night premium)

### Employee Benefits
- **Annual leave**: 30 days per year
- **Sick leave**: Up to 90 days with medical certificate
- **End of service gratuity**: 21 days salary after 1 year minimum

## Key Components

### 1. OvertimeAllowancesDashboard
Main dashboard providing overview, navigation, and key metrics.

**Features**:
- Real-time statistics
- Department breakdown
- Compliance status
- Quick navigation to all modules

### 2. OvertimeManagement
Comprehensive overtime records management.

**Features**:
- Add/edit/delete overtime records
- Filter by date, department, status
- Bulk operations
- Compliance validation
- Export functionality

### 3. AllowancesManagement
Employee allowances management system.

**Features**:
- Allowance type configuration
- Amount management
- Active/inactive tracking
- Department-wise totals
- Employee-specific allowances

### 4. ApprovalWorkflow
Overtime approval interface for managers.

**Features**:
- Pending approvals queue
- One-click approve/reject
- Compliance checking
- Comments and reasons
- Approval history

### 5. ReportsAnalytics
Comprehensive reporting and analytics.

**Features**:
- Monthly/quarterly reports
- Department analysis
- Cost tracking
- Compliance monitoring
- Export capabilities

### 6. ConfigurationPanel
System configuration management.

**Features**:
- Employee type settings
- Overtime rate configuration
- Allowance amount setup
- UAE law compliance settings
- Bulk updates

## Glassmorphism Design

The system uses a modern glassmorphism design approach with:

- **Transparent backgrounds** with blur effects
- **Subtle borders** and shadows
- **Gradient backgrounds** for visual depth
- **Smooth animations** and transitions
- **Responsive design** for all devices
- **Accessible color schemes** with proper contrast

## Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   # or
   pnpm build
   ```

## Usage

### Adding Overtime Records
1. Navigate to "Overtime" tab
2. Click "Add Overtime" button
3. Fill in employee details, hours, and type
4. System automatically calculates compliance
5. Submit for approval workflow

### Managing Allowances
1. Go to "Allowances" tab
2. View active employee allowances
3. Add new allowances or modify existing ones
4. Configure by employee type and department
5. Track active/inactive status

### Approving Overtime
1. Access "Approvals" tab
2. Review pending overtime requests
3. Check compliance warnings
4. Approve or reject with comments
5. Track approval history

### Generating Reports
1. Select "Reports" tab
2. Choose reporting period
3. View analytics and compliance status
4. Export data for further analysis

## API Integration

The system is designed with a mock service layer (`service.ts`) that can be easily replaced with real API calls:

```typescript
// Current mock service
static async getOvertimeRecords(): Promise<OvertimeRecord[]> {
  // Mock data implementation
}

// Replace with real API
static async getOvertimeRecords(): Promise<OvertimeRecord[]> {
  const response = await fetch('/api/overtime-records');
  return response.json();
}
```

## Security Considerations

- Input validation on all forms
- Sanitized user inputs
- Role-based access control ready
- Audit trail for all changes
- Secure API endpoints (when integrated)

## Responsive Design

The system is fully responsive and works on:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile phones (< 768px)
- High-DPI displays

## Performance Optimizations

- Lazy loading of components
- Efficient state management
- Optimized re-renders
- Minimal bundle size
- Fast initial load times

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Modern mobile browsers

## Contributing

1. Follow the existing code structure
2. Maintain UAE labor law compliance
3. Add proper TypeScript types
4. Include glassmorphism styling
5. Test on multiple screen sizes
6. Update documentation

## License

This system is designed for UAE-based organizations and follows local labor law requirements.

---

**Note**: This system provides a comprehensive foundation for overtime and allowances management with UAE labor law compliance. All calculations and workflows are designed to meet UAE Federal Law No. 33 of 2021 requirements.