# Deduction Management - Quick Integration Guide

## 🚀 Quick Start

### 1. Basic Integration
```typescript
// Import the main component
import { DeductionManagement } from '@/app/dashboard/payroll/deduction-management';

export default function PayrollDeductionPage() {
  return (
    <div className="p-6">
      <DeductionManagement />
    </div>
  );
}
```

### 2. Individual Component Usage

#### Tax Deductions
```typescript
import { TaxDeductions } from '@/app/dashboard/payroll/deduction-management/components/TaxDeductions';

<TaxDeductions 
  employeeId="emp_123"
  month={11}
  year={2025}
/>
```

#### Loan Deductions
```typescript
import { LoanDeductions } from '@/app/dashboard/payroll/deduction-management/components/LoanDeductions';

<LoanDeductions 
  employeeId="emp_123"
  month={11}
  year={2025}
/>
```

#### Insurance Deductions
```typescript
import { InsuranceDeductions } from '@/app/dashboard/payroll/deduction-management/components/InsuranceDeductions';

<InsuranceDeductions 
  employeeId="emp_123"
  month={11}
  year={2025}
/>
```

## 🔧 Configuration

### Database Setup
Ensure your Supabase database has the required tables:
- `employees`
- `deductions` 
- `tax_deductions`
- `loan_deductions`
- `insurance_deductions`
- `employee_deduction_preferences`
- `deduction_reports`

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 💡 Common Use Cases

### 1. Calculate Monthly Deductions
```typescript
import { deductionCalculator } from '@/app/dashboard/payroll/deduction-management/lib/deduction-calculator';

const calculateEmployeeDeductions = async (employeeId: string) => {
  const summary = await deductionCalculator.generateDeductionSummary(
    employeeId,
    11, // November
    2025 // 2025
  );
  
  console.log('Total Deductions:', summary.deductions.total);
  console.log('Net Salary:', summary.netSalary);
  console.log('UAE Compliant:', summary.compliance.isCompliant);
  
  return summary;
};
```

### 2. Generate Reports
```typescript
import { DeductionHistoryReports } from '@/app/dashboard/payroll/deduction-management/components/DeductionHistoryReports';

<DeductionHistoryReports 
  employeeId="emp_123"
  month={11}
  year={2025}
/>
```

### 3. Configure Employee Preferences
```typescript
import { EmployeePreferences } from '@/app/dashboard/payroll/deduction-management/components/EmployeePreferences';

<EmployeePreferences 
  employeeId="emp_123"
/>
```

## 🎨 Customization

### 1. Custom Color Schemes
```css
/* Update gradients in your global CSS */
.border-gradient-purple-pink {
  border: 1px solid;
  border-image: linear-gradient(45deg, #8b5cf6, #ec4899) 1;
}

.border-gradient-red-pink {
  border: 1px solid;
  border-image: linear-gradient(45deg, #ef4444, #ec4899) 1;
}
```

### 2. Custom AED Formatting
```typescript
// Override default currency formatting
const customFormatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};
```

### 3. Custom Deduction Categories
```typescript
// Add custom deduction categories
export const CUSTOM_DEDUCTION_CATEGORIES = {
  ...DEDUCTION_CATEGORIES,
  CHARITY: 'charity',
  PENSION: 'pension',
  SAVINGS: 'savings'
} as const;
```

## 🔌 Integration Examples

### 1. With Existing Payroll System
```typescript
// Import your existing payroll context
import { usePayroll } from '@/contexts/PayrollContext';

export default function IntegratedDeductionPage() {
  const { currentEmployee, calculationPeriod } = usePayroll();
  
  return (
    <DeductionManagement 
      employeeId={currentEmployee?.id}
      month={calculationPeriod.month}
      year={calculationPeriod.year}
    />
  );
}
```

### 2. With Employee Management
```typescript
// Import employee context
import { useEmployee } from '@/contexts/EmployeeContext';

export default function EmployeeDeductionPage() {
  const { selectedEmployee } = useEmployee();
  
  if (!selectedEmployee) {
    return <div>Please select an employee</div>;
  }
  
  return (
    <div className="space-y-6">
      <TaxDeductions employeeId={selectedEmployee.id} />
      <LoanDeductions employeeId={selectedEmployee.id} />
      <InsuranceDeductions employeeId={selectedEmployee.id} />
      <EmployeePreferences employeeId={selectedEmployee.id} />
    </div>
  );
}
```

## 📊 Data Flow

### 1. Deduction Creation Flow
```
User Input → Form Validation → Database Insert → Real-time Update → UI Refresh
```

### 2. Calculation Flow
```
Employee Selection → Fetch Base Salary → Apply Deduction Rules → Calculate Total → Validate Compliance → Update UI
```

### 3. Report Generation Flow
```
Report Parameters → Query Database → Process Data → Generate Summary → Create Export → Download/Display
```

## 🧪 Testing

### 1. Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { TaxDeductions } from '@/app/dashboard/payroll/deduction-management/components/TaxDeductions';

describe('TaxDeductions', () => {
  test('renders tax deductions for employee', async () => {
    render(
      <TaxDeductions 
        employeeId="emp_123"
        month={11}
        year={2025}
      />
    );
    
    expect(screen.getByText('Tax Deductions')).toBeInTheDocument();
  });
});
```

### 2. Calculator Testing
```typescript
import { deductionCalculator } from '@/app/dashboard/payroll/deduction-management/lib/deduction-calculator';

describe('DeductionCalculator', () => {
  test('calculates UAE tax correctly', async () => {
    const taxAmount = await deductionCalculator.calculateTaxDeduction(
      10000, // base salary
      'emp_123',
      '2025-11-01'
    );
    
    expect(taxAmount).toBe(0); // UAE 0% tax
  });
});
```

## 🚀 Deployment

### 1. Build Process
```bash
# Build the application
npm run build

# The deduction management system will be included in the build
```

### 2. Environment Setup
```env
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Migration
```sql
-- Run the deduction tables migration
-- (Refer to the main README.md for complete schema)
```

## 📱 Mobile Responsiveness

The system is fully responsive and includes:
- Mobile-friendly navigation
- Touch-optimized controls
- Responsive data tables
- Mobile report views

## 🔍 Troubleshooting

### Common Issues

1. **Currency Display Issues**
   ```typescript
   // Ensure proper locale
   const formatCurrency = (amount: number) => {
     return new Intl.NumberFormat('en-AE', {
       style: 'currency',
       currency: 'AED'
     }).format(amount);
   };
   ```

2. **Database Connection**
   ```typescript
   // Check Supabase client configuration
   import { supabase } from '@/lib/supabase';
   
   // Test connection
   const testConnection = async () => {
     const { data, error } = await supabase
       .from('employees')
       .select('count')
       .limit(1);
     
     if (error) console.error('Connection failed:', error);
   };
   ```

3. **Component Loading Issues**
   ```typescript
   // Add loading states
   const [loading, setLoading] = useState(true);
   
   // Proper error handling
   const [error, setError] = useState<string | null>(null);
   ```

## 📚 Additional Resources

- [Full Documentation](./README.md)
- [UAE Labor Law Guide](./docs/UAE_COMPLIANCE.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Component Storybook](./docs/STORYBOOK.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For technical support:
- Check the troubleshooting section
- Review the main documentation
- Contact the development team
- Open an issue on GitHub