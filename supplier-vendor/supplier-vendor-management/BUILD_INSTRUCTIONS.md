# Build Instructions - Local Deployment Guide

## 🔧 Local Build Instructions for Supplier & Vendor Management System

### 📋 Prerequisites

**Required Software:**
```bash
Node.js 18+ or 20+ (LTS recommended)
pnpm 8+ (preferred) or npm 9+
Git (for version control)
```

**Verify Installation:**
```bash
node --version    # Should show v18+ or v20+
pnpm --version    # Should show v8+
git --version     # Any recent version
```

---

## 🚀 Quick Start Instructions

### Step 1: Download and Navigate
```bash
# Download the project files to your local machine
# Navigate to the project directory
cd supplier-vendor-management
```

### Step 2: Install Dependencies
```bash
# Install all required packages
pnpm install

# Alternative if using npm
npm install
```

### Step 3: Start Development Server
```bash
# Start local development server
pnpm dev

# Alternative if using npm
npm run dev
```

**Access your application at:** `http://localhost:5173`

### Step 4: Build for Production
```bash
# Create production build
pnpm build

# Alternative if using npm
npm run build
```

**Production files will be created in the `dist/` folder**

---

## 📁 Project Structure Overview

```
supplier-vendor-management/
├── 📁 src/
│   ├── 📁 components/      # Reusable UI components
│   │   ├── ErrorBoundary.tsx
│   │   └── 📁 layout/
│   │       └── MainLayout.tsx
│   ├── 📁 hooks/           # Custom React hooks
│   │   └── use-mobile.tsx
│   ├── 📁 lib/             # Utilities and configurations
│   │   ├── supabaseClient.ts
│   │   └── utils.ts
│   ├── 📁 pages/           # 15 Main page components
│   │   ├── Dashboard.tsx
│   │   ├── Suppliers.tsx
│   │   ├── AddSupplier.tsx
│   │   ├── SupplierDetails.tsx
│   │   ├── Contracts.tsx
│   │   ├── Performance.tsx
│   │   ├── Quality.tsx
│   │   ├── Compliance.tsx
│   │   ├── Deliveries.tsx
│   │   ├── PriceComparison.tsx
│   │   ├── RFQManagement.tsx
│   │   ├── ProcurementOrders.tsx
│   │   ├── Evaluations.tsx
│   │   ├── Alerts.tsx
│   │   └── Settings.tsx
│   ├── App.tsx             # Main application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── 📁 public/             # Static assets
├── 📄 package.json        # Dependencies and scripts
├── 📄 vite.config.ts      # Build configuration
├── 📄 tailwind.config.js  # Styling configuration
└── 📄 tsconfig.json       # TypeScript configuration
```

---

## ⚙️ Available Scripts

### Development Scripts
```bash
# Start development server with hot reload
pnpm dev
# Runs on http://localhost:5173

# Install dependencies (if needed)
pnpm install-deps

# Lint code for issues
pnpm lint
```

### Production Scripts
```bash
# Build for production
pnpm build
# Creates optimized files in dist/ folder

# Preview production build locally
pnpm preview
# Serves the built files on http://localhost:4173

# Build with production optimizations
pnpm build:prod
```

### Maintenance Scripts
```bash
# Clean node_modules and reinstall
pnpm clean

# Check for outdated packages
pnpm outdated

# Update dependencies
pnpm update
```

---

## 🌐 Local Development Details

### Development Server Features
- **Hot Module Replacement (HMR)**: Instant updates without page refresh
- **TypeScript Support**: Real-time type checking
- **Fast Refresh**: React state preservation during updates
- **Error Overlay**: Development-friendly error display

### Environment Configuration
The project is pre-configured with production Supabase credentials:
- **Database**: Connected to live PostgreSQL instance
- **Authentication**: Ready for user management
- **Real-time Features**: WebSocket connections enabled
- **Edge Functions**: 5 deployed functions ready for use

### Browser Compatibility
**Supported Browsers:**
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

---

## 🔨 Build Process Details

### Build Steps Explained
1. **Dependency Installation**: Downloads all required packages
2. **TypeScript Compilation**: Converts TypeScript to JavaScript
3. **Asset Optimization**: Minifies CSS, JS, and optimizes images
4. **Code Splitting**: Creates efficient bundles for faster loading
5. **Source Map Generation**: For debugging in production

### Build Output Structure
```
dist/
├── 📁 assets/
│   ├── index-[hash].js      # Main JavaScript bundle
│   ├── index-[hash].css     # Main CSS bundle
│   └── [component]-[hash].js # Code-split chunks
├── 📄 index.html            # Main HTML file
└── 📄 vite.svg              # Favicon
```

### Bundle Size Information
- **Main Bundle**: ~500KB (gzipped)
- **Vendor Bundle**: ~800KB (gzipped)
- **Total Size**: ~1.3MB (gzipped)
- **Lazy-loaded Chunks**: Additional ~200KB per route

---

## 🚀 Production Deployment Options

### Option 1: Static File Hosting

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Follow prompts for domain setup
```

#### Netlify
```bash
# Build the project
pnpm build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

#### Traditional Web Server
```bash
# Build the project
pnpm build

# Upload contents of dist/ folder to your web server
# Configure server to serve index.html for all routes (SPA support)
```

### Option 2: Docker Deployment
```dockerfile
# Dockerfile (create this file if needed)
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

---

## 🔧 Configuration & Customization

### Environment Variables
```bash
# .env.local (create if customization needed)
VITE_APP_TITLE="Your Company Supplier Management"
VITE_APP_VERSION="1.0.0"
```

### Customizing the Build
```typescript
// vite.config.ts - Modify build settings
export default defineConfig({
  build: {
    outDir: 'build',      // Change output directory
    sourcemap: false,     // Disable sourcemaps
    minify: true,         # Enable minification
  }
})
```

### Styling Customization
```javascript
// tailwind.config.js - Customize colors/spacing
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#your-color',
        secondary: '#your-secondary-color'
      }
    }
  }
}
```

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Port Already in Use
```bash
# If port 5173 is busy, specify different port
pnpm dev --port 3000
```

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules .pnpm-store
pnpm install

# Clear Vite cache
rm -rf node_modules/.vite
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update TypeScript
pnpm add -D typescript@latest
```

#### Memory Issues During Build
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

#### Slow Installation
```bash
# Use pnpm for faster installs
npm install -g pnpm
pnpm install
```

### Performance Troubleshooting
```bash
# Analyze bundle size
pnpm add -D @bundle-analyzer/vite
# Add to vite config for bundle analysis

# Check for circular dependencies
pnpm add -D madge
npx madge --circular src/
```

---

## 📊 Performance Optimization

### Development Performance
```bash
# Enable fast refresh and HMR
# These are enabled by default in the current config

# Use SWC instead of Babel (if needed)
pnpm add -D @vitejs/plugin-react-swc
```

### Production Optimization
```bash
# Build with maximum optimization
BUILD_MODE=prod pnpm build

# Analyze bundle size
pnpm add -D vite-bundle-analyzer
# Check package.json for analysis script
```

### Caching Strategies
```bash
# Vite automatically handles:
# - File-based caching with content hashes
# - Browser caching headers
# - Service worker ready
```

---

## 🔒 Security Considerations

### Local Development Security
- **HTTPS**: Use `pnpm dev --https` for HTTPS locally
- **Environment Variables**: Never commit sensitive data
- **Dependency Scanning**: Run `pnpm audit` regularly

### Production Security
```bash
# Security audit
pnpm audit

# Fix vulnerabilities
pnpm audit --fix

# Update dependencies
pnpm update
```

---

## 📈 Monitoring & Analytics

### Development Monitoring
```bash
# Watch bundle size
pnpm dev
# Check terminal for bundle size information

# Monitor performance
# Use React DevTools Profiler
```

### Production Monitoring
```bash
# Lighthouse performance check
npx lighthouse http://localhost:4173

# Bundle analysis
pnpm build
npx vite-bundle-analyzer dist/
```

---

## 🆘 Getting Help

### Development Issues
1. Check browser console for errors
2. Verify all dependencies are installed
3. Ensure Node.js version is 18+
4. Clear cache: `rm -rf node_modules/.vite`

### Build Issues
1. Run `pnpm clean` to reset environment
2. Check available disk space
3. Verify TypeScript configuration
4. Update dependencies if needed

### Deployment Issues
1. Verify build completes successfully
2. Check server configuration for SPA routing
3. Ensure HTTPS is enabled for production
4. Verify environment variables are set

### Support Resources
- **React Documentation**: https://react.dev
- **Vite Documentation**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

## ✅ Pre-Deployment Checklist

### Before Building
- [ ] Node.js 18+ installed
- [ ] pnpm installed globally
- [ ] All dependencies installed (`pnpm install`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No linting errors (`pnpm lint`)

### Before Deployment
- [ ] Production build successful (`pnpm build`)
- [ ] Build preview works (`pnpm preview`)
- [ ] All pages load correctly
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility tested

### Production Deployment
- [ ] HTTPS enabled
- [ ] SPA routing configured
- [ ] Performance optimized
- [ ] Security headers configured
- [ ] CDN configured (optional)

---

## 🎉 Success! Your System is Ready

After following these instructions, you'll have:

✅ **Fully functional development environment**
✅ **Production-ready build process**
✅ **Optimized application bundle**
✅ **Deployment-ready static files**

**Next Steps:**
1. Run `pnpm dev` to start development
2. Run `pnpm build` to create production build
3. Upload `dist/` folder to your hosting provider
4. Configure your web server for SPA routing

**Your Supplier & Vendor Management System is ready to go live! 🚀**