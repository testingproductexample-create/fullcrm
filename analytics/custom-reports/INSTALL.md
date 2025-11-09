# Installation & Setup Guide

## Quick Start

1. **Navigate to the project directory:**
   ```bash
   cd analytics/custom-reports
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

## Prerequisites

- Node.js 16.0 or higher
- npm 7.0 or higher (or yarn 1.22+)
- Modern web browser with ES2020+ support

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Production Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **The built files will be in the `dist/` directory. Deploy these to your web server.**

## Features Overview

✅ **Drag-and-Drop Report Builder** - Visual report creation with customizable templates
✅ **Advanced Data Visualization** - Interactive charts with real-time updates
✅ **Custom Dashboards** - Personalized dashboard creation
✅ **Scheduled Reports** - Automated generation and distribution
✅ **Multi-format Export** - PDF, Excel, CSV, JSON with customization
✅ **UAE Compliance Reports** - Specialized VAT, Corporate Tax, Labor Law compliance
✅ **Geographic Analytics** - Multi-location business analysis across UAE
✅ **Real-time Data** - Live updates and streaming
✅ **Template Library** - Pre-built business report templates
✅ **Advanced Filtering** - Powerful data drill-down capabilities

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Chart.js, React-ChartJS-2, Recharts
- **Drag & Drop**: React DnD
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/          # React components
│   ├── Layout.tsx      # Main layout
│   ├── ReportBuilder.tsx # Drag-and-drop builder
│   ├── Dashboard.tsx   # Custom dashboards
│   ├── DataVisualization.tsx # Chart system
│   ├── TemplateLibrary.tsx # Report templates
│   ├── ReportSchedule.tsx # Scheduled reports
│   ├── ComplianceReports.tsx # UAE compliance
│   ├── GeographicReports.tsx # Geographic analysis
│   └── ExportCenter.tsx # Multi-format export
├── store/             # State management
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
└── data/              # Sample data
```

## UAE Business Features

- **VAT Compliance** - Automated UAE VAT reporting
- **Corporate Tax** - Corporate tax calculations
- **Labor Law** - WPS and compliance tracking
- **Trade & Customs** - Import/export automation
- **Data Protection** - UAE privacy law compliance

## Customization

The system is highly customizable and extensible. All components are modular and can be easily modified or extended.

## Support

For detailed documentation, see the README.md file in the project root.