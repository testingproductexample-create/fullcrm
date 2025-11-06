# Vercel Deployment Instructions for CRM System

## Quick Deploy (Recommended - 5 minutes)

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Prepare the project**:
   - Download/clone the `crm-app` directory to your local machine
   
2. **Go to Vercel**:
   - Visit [https://vercel.com](https://vercel.com)
   - Sign in or create an account
   
3. **Create New Project**:
   - Click "Add New..." → "Project"
   - Choose "Import" or drag-and-drop the `crm-app` folder
   
4. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: ./ (default)
   - **Build Command**: `pnpm run build` (or leave default)
   - **Output Directory**: .next (default)
   - **Node Version**: 20.x (automatic)

5. **Add Environment Variables**:
   Click "Environment Variables" and add:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://qmttczrdpzzsbxwutfwz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtdHRjenJkcHp6c2J4d3V0Znd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTI4MDYsImV4cCI6MjA3NzkyODgwNn0.nbzNwtMUGYI1F5RbOES__D1jpac06hwkBdoy34ahiuM
   ```

6. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes for build completion
   - You'll get a live URL like `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to project
cd crm-app

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts and add environment variables when asked
```

## Post-Deployment Verification

### 1. Test Authentication
- Visit your deployed URL
- Click "Sign In"
- Use existing test credentials or create new account
- Verify redirect to dashboard

### 2. Test Core Features
- **Dashboard**: Check if dashboard loads with widgets
- **Customers**: View customer list, click on a customer
- **Orders**: View orders, create new order, view order details
- **Workflow**: Check Kanban board shows orders by stage
- **Analytics**: Verify workflow analytics display correctly

### 3. Verify Backend Integration
- **Database**: Check if customer/order data loads
- **Edge Functions**: Verify automation is running (check Supabase logs)
- **Real-time**: Test if data updates reflect immediately

## Environment Variables Reference

| Variable | Value | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://qmttczrdpzzsbxwutfwz.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Public API key for client-side auth |

## Troubleshooting

### Build Fails
**Error**: "Type error" or "Build failed"
- Check Next.js version in package.json (should be compatible with Node 20)
- Verify all TypeScript types are correct
- Check build logs for specific errors

### Authentication Not Working
- Verify environment variables are set correctly in Vercel dashboard
- Check Supabase Auth settings allow your Vercel domain
- Add your Vercel URL to Supabase Auth → URL Configuration → Redirect URLs

### Data Not Loading
- Open browser DevTools → Network tab
- Check for failed API requests
- Verify Supabase RLS policies allow access for authenticated users
- Check console for JavaScript errors

### 404 on Dynamic Routes
- Verify Next.js is configured correctly (not as static export)
- Check Vercel deployment settings use default Next.js configuration

## Production Checklist

Before going live:
- [ ] Environment variables configured in Vercel
- [ ] Supabase RLS policies tested and verified
- [ ] Edge functions running (check cron jobs)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic on Vercel)
- [ ] Authentication flow tested end-to-end
- [ ] All CRUD operations tested (Create, Read, Update, Delete)
- [ ] Workflow automation verified (check orders move through stages)
- [ ] Error handling tested (network failures, invalid inputs)
- [ ] Mobile responsive design verified
- [ ] Performance tested (Lighthouse score > 80)

## Next Steps After Deployment

1. **Create Admin Account**:
   - Sign up through the deployed app
   - Use Supabase dashboard to set role to 'owner'

2. **Populate Initial Data**:
   - Sample data is already in database
   - Add your actual customers and orders

3. **Configure Workflow**:
   - Customize workflow stages if needed
   - Set up automation rules
   - Configure notifications

4. **Team Onboarding**:
   - Create user accounts for team members
   - Assign appropriate roles
   - Train on workflow processes

## Support Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **This Project's README**: See README.md in project root

---

**Deployment Guide Version**: 1.0  
**Last Updated**: 2025-11-06  
**Project**: Tailoring CRM System  
**Tech Stack**: Next.js 15 + Supabase + TypeScript
