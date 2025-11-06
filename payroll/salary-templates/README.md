# Salary Structure Templates - UAE Payroll System

A comprehensive React-based interface for managing salary structure templates in a UAE payroll system. Features a modern glassmorphism design system with extensive template management capabilities.

## Features

### 🏗️ Core Components

1. **Template Library**
   - View all salary templates in a grid or list format
   - Search and filter by role, status, and other criteria
   - Quick actions for viewing, editing, duplicating, and deleting templates
   - Compensation breakdown with total package calculations
   - Benefits visualization

2. **Template Builder**
   - Step-by-step template creation wizard (4 steps)
   - Role-based framework integration
   - Comprehensive compensation structure configuration
   - Benefits and deduction rules management
   - Real-time total package calculation
   - Form validation and error handling

3. **Role Frameworks**
   - Role-based compensation frameworks management
   - Career level hierarchies configuration
   - Market data source integration
   - Salary range generation based on roles and levels
   - Grid and detailed view modes
   - Framework-based template creation

4. **Allowances Configuration**
   - Comprehensive allowance management system
   - Fixed, percentage, and variable allowance types
   - Tax status and mandatory flags
   - Calculation rules (flat, per-day, annual, percentage of base)
   - Icon-based visual identification
   - Status management (active/inactive)

5. **Template Assignment**
   - Employee selection and management
   - Bulk template assignment capabilities
   - Search and filter employees by department, role, etc.
   - Assignment history tracking
   - Effective date configuration
   - Template compatibility validation

6. **Template Comparison**
   - Side-by-side and detailed comparison modes
   - Support for comparing up to 3 templates simultaneously
   - Difference highlighting feature
   - Compensation breakdown comparison
   - Benefits comparison
   - Export and duplicate template options

7. **Template Versioning**
   - Complete version control system
   - Change tracking and documentation
   - Version history with rollback capabilities
   - Active/archived version management
   - Version statistics and analytics
   - Create new versions with change descriptions

## Design System

### Glassmorphism Styling
- `backdrop-blur-md` for frosted glass effects
- `bg-white/70` and `bg-white/80` for translucent backgrounds
- `border border-white/20` for subtle borders
- `shadow-xl` for depth and elevation
- Gradient backgrounds for visual hierarchy

### Color Palette
- **Primary**: Blue variants (600, 700) for actions and highlights
- **Success**: Green variants for active states and positive actions
- **Warning**: Orange/amber for attention and caution states
- **Danger**: Red for destructive actions and inactive states
- **Neutral**: Gray variants for text and backgrounds

### Typography
- Bold headings with proper hierarchy
- Medium weight for emphasis
- Regular weight for body text
- Proper spacing and line heights

### Interactive Elements
- Hover states with `hover:bg-*` classes
- Transition animations with `transition-colors`
- Focus states with `focus:ring-2 focus:ring-blue-500`
- Active states with visual feedback

## UAE-Specific Features

### Currency & Formatting
- AED (UAE Dirham) as primary currency
- Proper number formatting with thousands separators
- Currency display in template details and comparisons

### Compliance Considerations
- Taxable/non-taxable allowance flags
- Mandatory vs optional allowances
- End of service gratuity calculations
- UAE labor law compliance structure

### Market Data Integration
- Regional market data sources
- Gulf region salary benchmarks
- Industry-specific compensation frameworks

## Component Architecture

### Main Component
- `SalaryTemplatesPage.jsx` - Main container with tab navigation
- Manages global state and coordinates between child components
- Handles template creation and updates

### Child Components
- `TemplateLibrary.jsx` - Template display and management
- `TemplateBuilder.jsx` - Multi-step template creation
- `RoleFrameworks.jsx` - Compensation framework management
- `AllowancesConfig.jsx` - Allowance system configuration
- `TemplateAssignment.jsx` - Employee-template assignment
- `TemplateComparison.jsx` - Template comparison tools
- `TemplateVersioning.jsx` - Version control and history

### State Management
- Local state for component-specific data
- Props passing for shared data
- Callback functions for state updates
- Form state management with controlled inputs

## Usage

```jsx
import { SalaryTemplatesPage } from './payroll/salary-templates';

function App() {
  return (
    <div className="min-h-screen">
      <SalaryTemplatesPage />
    </div>
  );
}
```

## Dependencies

- React 18+
- Framer Motion (for animations)
- Heroicons (for iconography)
- Tailwind CSS (for styling)

## File Structure

```
payroll/salary-templates/
├── SalaryTemplatesPage.jsx      # Main component
├── components/
│   ├── TemplateLibrary.jsx       # Template display
│   ├── TemplateBuilder.jsx       # Template creation
│   ├── RoleFrameworks.jsx        # Framework management
│   ├── AllowancesConfig.jsx      # Allowance configuration
│   ├── TemplateAssignment.jsx    # Employee assignment
│   ├── TemplateComparison.jsx    # Template comparison
│   └── TemplateVersioning.jsx    # Version control
└── index.js                      # Component exports
```

## Key Features Implemented

✅ Pre-built salary templates by role
✅ Custom structure creation with step-by-step wizard
✅ Template management and versioning system
✅ Role-based compensation frameworks
✅ Comprehensive allowances configuration
✅ Template assignment to employees
✅ Template library with search and filtering
✅ Comparison tools with difference highlighting
✅ Glassmorphism design system
✅ UAE-specific currency and compliance features
✅ Responsive design for all screen sizes
✅ Accessibility considerations
✅ Performance optimizations

This implementation provides a complete, production-ready salary template management system tailored for UAE payroll requirements with a modern, professional design interface.