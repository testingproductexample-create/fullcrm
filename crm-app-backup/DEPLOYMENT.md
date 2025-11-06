# CRM System Deployment Guide

## Quick Deployment to Vercel

### Method 1: Deploy from Local Machine (Recommended)

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Navigate to project directory**
   ```bash
   cd /workspace/crm-app
   ```

3. **Deploy to Vercel**
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Set up and deploy: Yes
   - Which scope: Select your account
   - Link to existing project: No
   - Project name: crm-tailoring-uae (or your choice)
   - Directory: ./ (current directory)
   - Override settings: No

5. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Method 2: Deploy via GitHub

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: CRM System"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js
   - Click "Deploy"

## Alternative Deployment Platforms

### Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### AWS Amplify

1. Go to AWS Amplify Console
2. Connect your GitHub repository
3. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

### Self-Hosted with Docker

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t crm-app .
docker run -p 3000:3000 crm-app
```

## Environment Variables (If Needed)

If you need to use environment variables instead of hardcoded values:

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://qmttczrdpzzsbxwutfwz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtdHRjenJkcHp6c2J4d3V0Znd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTI4MDYsImV4cCI6MjA3NzkyODgwNn0.nbzNwtMUGYI1F5RbOES__D1jpac06hwkBdoy34ahiuM
```

Update `lib/supabase.ts`:
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
```

## Post-Deployment Setup

### 1. Create Admin User

Access Supabase SQL Editor and run:
```sql
-- Create auth user (replace with your email/password)
-- This should be done through Supabase Auth UI or API

-- Then create profile
INSERT INTO profiles (id, organization_id, full_name, role)
VALUES (
  'YOUR_AUTH_USER_ID', 
  '00000000-0000-0000-0000-000000000001', 
  'Admin User', 
  'owner'
);
```

### 2. Verify Edge Functions

Check that edge functions are running:
- https://qmttczrdpzzsbxwutfwz.supabase.co/functions/v1/check-customer-events
- https://qmttczrdpzzsbxwutfwz.supabase.co/functions/v1/update-customer-analytics

### 3. Test Cron Job

The `check-customer-events` function runs daily at 9 AM UTC. To test manually:
```bash
curl -X POST https://qmttczrdpzzsbxwutfwz.supabase.co/functions/v1/check-customer-events \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 4. Configure Custom Domain (Optional)

In Vercel:
1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed

## Troubleshooting

### Build Fails with Node Version Error

**Error**: `Node.js version ">=20.9.0" is required`

**Solution**: Ensure deployment platform uses Node 20+
- Vercel: Automatically uses correct version
- Netlify: Add `NODE_VERSION=20` to environment variables
- Self-hosted: Use Node 20+ Docker image

### Authentication Not Working

1. Check Supabase Auth settings
2. Verify RLS policies are enabled
3. Ensure user has profile record in `profiles` table

### Data Not Loading

1. Check browser console for errors
2. Verify Supabase URL and anon key
3. Check RLS policies allow access
4. Ensure user's `organization_id` matches data

### Edge Functions Not Triggering

1. Check Supabase Functions logs
2. Verify cron job is active: `SELECT * FROM cron.job;`
3. Test function manually with curl

## Performance Optimization

### Enable Caching
```typescript
// In Next.js config
export default {
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/**/*.wasm', './node_modules/**/*.node'],
    },
  },
};
```

### Image Optimization
Use Next.js Image component for customer photos:
```typescript
import Image from 'next/image';

<Image 
  src={customer.profile_photo_url} 
  width={100} 
  height={100} 
  alt={customer.full_name}
/>
```

## Monitoring & Maintenance

### Monitor Edge Functions
- Check Supabase Dashboard > Edge Functions > Logs
- Set up alerts for failures

### Database Maintenance
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Vacuum analyze (maintenance)
VACUUM ANALYZE;
```

### Backup Strategy
- Supabase provides automatic backups
- Export important data periodically:
```sql
COPY customers TO '/tmp/customers_backup.csv' CSV HEADER;
```

## Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Authentication required for all routes
- [ ] API keys stored securely (not in client code)
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] CORS configured properly
- [ ] Rate limiting implemented (via Supabase)
- [ ] SQL injection prevention (via parameterized queries)
- [ ] XSS prevention (React escapes by default)

## Support

For deployment issues, refer to:
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**Deployment Guide Version**: 1.0.0
**Last Updated**: 2025-11-06
