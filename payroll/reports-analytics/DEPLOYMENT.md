# Deployment Guide - Salary Reports & Analytics

## 🚀 Quick Deployment

This guide covers multiple deployment options for the Salary Reports & Analytics dashboard.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git repository (GitHub, GitLab, or Bitbucket)
- Deployment platform account (Vercel, Netlify, or similar)

## 📦 Build Process

### 1. Install Dependencies

```bash
cd payroll/reports-analytics
npm install
```

### 2. Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### 3. Test Build Locally

```bash
npm run preview
```

Visit `http://localhost:4173` to test the production build.

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides the best experience for React applications with automatic deployments.

#### Steps:

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Project**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

#### Environment Variables

Add these in your Vercel project settings:

```
VITE_APP_TITLE=Salary Reports & Analytics
VITE_API_URL=https://your-api-domain.com
VITE_ENABLE_ANALYTICS=true
```

#### Vercel Configuration (`vercel.json`)

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Option 2: Netlify

Netlify offers excellent static site hosting with continuous deployment.

#### Steps:

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18

#### Netlify Configuration (`netlify.toml`)

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Option 3: GitHub Pages

Deploy to GitHub Pages for free hosting.

#### Steps:

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deployment script to package.json**
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Deploy**
   ```bash
   npm run build
   npm run deploy
   ```

#### GitHub Actions Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### Option 4: AWS S3 + CloudFront

For enterprise deployments with AWS infrastructure.

#### Steps:

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://your-salary-analytics-bucket
   ```

2. **Configure bucket for static hosting**
   ```bash
   aws s3 website s3://your-salary-analytics-bucket \
     --index-document index.html \
     --error-document index.html
   ```

3. **Upload build**
   ```bash
   npm run build
   aws s3 sync dist/ s3://your-salary-analytics-bucket --delete
   ```

#### CloudFront Distribution Setup

Create a CloudFront distribution pointing to your S3 bucket with these behaviors:

- **Default**: Origin: S3 bucket, Viewer protocol policy: Redirect to HTTPS
- **Error pages**: 404 → /index.html (for SPA routing)

### Option 5: Docker Deployment

For containerized deployments.

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  salary-analytics:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    restart: unless-stopped
```

#### Build and Run

```bash
# Build image
docker build -t salary-analytics .

# Run container
docker run -p 80:80 salary-analytics

# Or with Docker Compose
docker-compose up -d
```

## 🔧 Environment Configuration

### Development Environment

Create `.env.local`:

```env
VITE_API_URL=http://localhost:3001
VITE_APP_TITLE=Salary Analytics (Dev)
VITE_ENABLE_ANALYTICS=false
VITE_LOG_LEVEL=debug
```

### Production Environment

Create `.env.production`:

```env
VITE_API_URL=https://api.yourcompany.com
VITE_APP_TITLE=Salary Reports & Analytics
VITE_ENABLE_ANALYTICS=true
VITE_LOG_LEVEL=error
VITE_SENTRY_DSN=https://your-sentry-dsn
```

## 📊 Performance Optimization

### Build Optimization

1. **Bundle Analysis**
   ```bash
   npm run build -- --analyze
   ```

2. **Code Splitting**
   The app automatically splits code by route and component.

3. **Asset Optimization**
   - Images are automatically optimized
   - CSS and JS are minified
   - Tree shaking removes unused code

### CDN Configuration

For better performance, configure a CDN:

```nginx
# Nginx configuration for static assets
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    gzip_static on;
}
```

### Compression

Enable gzip/brotli compression:

```nginx
# Nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

# Brotli
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml;
```

## 🔒 Security Configuration

### Content Security Policy

Add to your HTML or server configuration:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https:;">
```

### HTTPS Redirect

```nginx
# Force HTTPS
if ($scheme != "https") {
    return 301 https://$host$request_uri;
}
```

### Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data:;" always;
```

## 📈 Monitoring & Analytics

### Error Tracking

Add Sentry for error monitoring:

```bash
npm install @sentry/react @sentry/tracing
```

```typescript
// src/sentry.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

### Performance Monitoring

```typescript
// Add to main.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Google Analytics

```typescript
// Add to index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run lint
    - run: npm run test
    - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run build
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID}}
        vercel-project-id: ${{ secrets.PROJECT_ID}}
        vercel-args: '--prod'
```

## 🛠 Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Routing Issues**
   - Ensure your deployment platform supports SPA routing
   - Configure redirects to index.html

3. **Performance Issues**
   - Check bundle size with `npm run build -- --analyze`
   - Enable code splitting
   - Optimize images

4. **CORS Issues**
   - Configure CORS headers on your API
   - Use environment variables for API URLs

### Support

- Check the [README.md](./README.md) for detailed documentation
- Review the GitHub Issues
- Contact the development team

---

**Deployment completed successfully! 🎉**

Your Salary Reports & Analytics dashboard is now live and ready for use.