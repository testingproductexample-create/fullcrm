# Quick Installation Guide

Follow these steps to get the Business Intelligence Dashboard up and running quickly.

## Prerequisites

- **Node.js** 16+ installed
- **pnpm** (recommended) or **npm**
- **Supabase account** (free tier available)

## 5-Minute Setup

### 1. Install Dependencies
```bash
cd analytics/business-intelligence
pnpm install
```

### 2. Setup Environment
```bash
# Copy the environment template
cp .env.example .env
```

### 3. Configure Supabase (Required)
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings → API
4. Copy your project URL and anon key
5. Update your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### 4. Start Development Server
```bash
pnpm dev
```

### 5. Open in Browser
Navigate to `http://localhost:5173`

## Database Setup (Optional)

If you want to use real data instead of mock data:

### 1. Create Database Tables
```sql
-- Run these SQL commands in your Supabase SQL editor

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- KPIs table
CREATE TABLE kpis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  value DECIMAL NOT NULL,
  change_percent DECIMAL,
  trend TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
```

### 2. Insert Sample Data
```sql
-- Insert sample KPIs
INSERT INTO kpis (name, value, change_percent, trend, category) VALUES
('Total Revenue', 125000, 12.5, 'up', 'financial'),
('Active Customers', 1250, 8.3, 'up', 'customer'),
('Orders Today', 45, -2.1, 'down', 'operational'),
('Customer Satisfaction', 4.2, 5.0, 'up', 'customer');
```

## Customization

### Add Your Own Widgets
1. Create a new component in `components/widgets/`
2. Add widget type to `types/index.ts`
3. Update `data/constants.ts` with widget configuration

### Change Theme
1. Edit `tailwind.config.js` for color schemes
2. Modify `styles/index.css` for custom styling
3. Update glassmorphism effects in component styles

### Configure Alerts
1. Edit alert thresholds in `data/constants.ts`
2. Customize alert types in `types/index.ts`
3. Update alert handling in `components/widgets/AlertWidget.tsx`

## Build for Production

```bash
# Create production build
pnpm build

# Preview production build
pnpm preview
```

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
# Or use a different port
pnpm dev --port 3000
```

**Supabase connection failed:**
- Check your URL and key in `.env`
- Ensure Supabase project is active
- Verify network connectivity

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**TypeScript errors:**
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

## Next Steps

1. **Customize your dashboard** layout and widgets
2. **Configure user roles** and permissions
3. **Set up real-time data** connections
4. **Add your own metrics** and KPIs
5. **Deploy to production** hosting

## Need Help?

- Check the main [README.md](./README.md) for detailed documentation
- Review the [API documentation](./docs/api.md)
- Examine the [example components](./components/)
- Contact the development team

---

**Happy analyzing! 📊**