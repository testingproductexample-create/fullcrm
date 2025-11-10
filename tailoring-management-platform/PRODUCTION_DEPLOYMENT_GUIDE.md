# PRODUCTION DEPLOYMENT GUIDE
**Unified Tailoring Management Platform**

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Supabase Pro account with production database
- [ ] Custom domain registered and DNS configured
- [ ] SSL certificate provisioned (automatic with Vercel)
- [ ] Environment variables prepared for production

### 2. Database Migration
- [ ] Production Supabase project created
- [ ] All migration files applied in sequence
- [ ] RLS policies enabled on all tables
- [ ] Seed data populated for initial setup

### 3. Security Configuration
- [ ] JWT secret configured
- [ ] CORS settings updated for production domain
- [ ] API rate limiting configured
- [ ] Backup strategy implemented

## Deployment Method 1: Vercel (Recommended)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

### Step 2: Configure Project
```bash
cd /workspace/tailoring-management-platform
vercel
# Follow prompts to link project
```

### Step 3: Set Environment Variables
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### Step 4: Deploy
```bash
vercel --prod
```

## Deployment Method 2: Docker Container

### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm install -g pnpm
RUN pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: unless-stopped
```

## Deployment Method 3: VPS/Cloud Server

### Setup with PM2
```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# Clone and build
git clone <repository-url> /var/www/tailoring-platform
cd /var/www/tailoring-platform
npm install
npm run build

# Start with PM2
pm2 start npm --name "tailoring-platform" -- start
pm2 startup
pm2 save
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Post-Deployment Verification

### 1. Health Checks
```bash
# Test main application
curl https://your-domain.com/api/health

# Test authentication
curl -X POST https://your-domain.com/api/auth/signin

# Test database connectivity
curl https://your-domain.com/api/customers?limit=1
```

### 2. Performance Testing
- Use Lighthouse for Core Web Vitals
- Test with various network conditions
- Verify mobile responsiveness
- Check loading times across all major pages

### 3. Security Verification
- SSL/TLS certificate validation
- HTTPS redirect verification
- Security headers check
- Authentication flow testing

## Monitoring Setup

### Application Monitoring
```javascript
// Sentry setup for error tracking
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Database Monitoring
- Enable Supabase dashboard alerts
- Set up query performance monitoring
- Configure backup verification
- Monitor connection pool usage

### Uptime Monitoring
```bash
# Example with UptimeRobot API
curl -X POST \
  -d "api_key=YOUR_API_KEY" \
  -d "format=json" \
  -d "type=1" \
  -d "url=https://your-domain.com" \
  -d "friendly_name=Tailoring Platform" \
  https://api.uptimerobot.com/v2/newMonitor
```

## Backup & Disaster Recovery

### Database Backup Strategy
```sql
-- Enable point-in-time recovery in Supabase
-- Automated daily backups
-- Retention period: 30 days for Pro plan
```

### Application Backup
```bash
# Automated deployment backup
#!/bin/bash
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/tailoring-platform"

# Create backup directory
mkdir -p $BACKUP_DIR/$DATE

# Backup application code
tar -czf $BACKUP_DIR/$DATE/app_backup.tar.gz /var/www/tailoring-platform

# Backup environment variables
cp /var/www/tailoring-platform/.env $BACKUP_DIR/$DATE/

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/$DATE/ s3://your-backup-bucket/ --recursive
```

## Performance Optimization

### Next.js Configuration
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['supabase.co', 'your-domain.com'],
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
      ],
    },
  ],
};

module.exports = nextConfig;
```

### CDN Configuration
```javascript
// Static asset optimization
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.your-domain.com' 
    : '',
});
```

## Troubleshooting Guide

### Common Issues
1. **Build Failures**
   - Check TypeScript errors: `npx tsc --noEmit`
   - Verify all dependencies: `npm install`
   - Clear Next.js cache: `rm -rf .next`

2. **Database Connection Issues**
   - Verify environment variables
   - Check Supabase project settings
   - Validate RLS policies

3. **Authentication Problems**
   - Confirm JWT secret configuration
   - Check redirect URLs in Supabase
   - Verify CORS settings

### Debug Commands
```bash
# Check application logs
pm2 logs tailoring-platform

# Monitor system resources
htop

# Check database connections
sudo netstat -tulpn | grep :5432

# Verify SSL certificate
openssl s_client -connect your-domain.com:443
```

## Scaling Considerations

### Horizontal Scaling
```yaml
# Kubernetes deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tailoring-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tailoring-platform
  template:
    metadata:
      labels:
        app: tailoring-platform
    spec:
      containers:
      - name: app
        image: tailoring-platform:latest
        ports:
        - containerPort: 3000
        env:
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: supabase-url
```

### Database Scaling
- Use Supabase read replicas for analytics queries
- Implement connection pooling for high concurrency
- Consider database sharding for multi-tenant isolation

## Success Criteria

### Performance Benchmarks
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] First Input Delay < 100ms

### Availability Targets
- [ ] 99.9% uptime (8.77 hours downtime/year max)
- [ ] < 500ms API response time (95th percentile)
- [ ] < 2s page load time on 3G networks

### Security Compliance
- [ ] A+ SSL Labs rating
- [ ] No critical security vulnerabilities
- [ ] GDPR/PDPL compliance verified
- [ ] Audit logs properly configured

---

**Deployment Status**: Ready for Production  
**Last Updated**: 2025-11-10 23:59:06  
**Version**: v2.0.0