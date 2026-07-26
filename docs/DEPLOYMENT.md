# CMMS Deployment Guide

This document outlines the steps required to deploy the Campus Maintenance Management System to a production environment.

## 1. Database Setup (Supabase)

1. Create a new Supabase project.
2. Navigate to the SQL Editor in the Supabase Dashboard.
3. Execute the migration files sequentially located in `supabase/migrations/`:
   - `20260725000001_core_data_modules.sql`
   - `20260725000002_attendance_module.sql`
   - `20260725000003_work_module.sql`
   - `20260725000004_inventory_module.sql`
   - `20260725000005_schedule_module.sql`
   - `20260725000006_reports_module.sql`
   - `20260725000007_settings_and_notifications.sql`
4. This will create all tables, configure Row Level Security (RLS), establish foreign key constraints, and create the Activity Logging triggers.

## 2. Environment Variables

In your hosting provider (e.g. Vercel, Netlify), define the following Environment Variables for your Production deployment:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Vercel Deployment (Recommended)

1. Connect your GitHub repository to Vercel.
2. Select the repository and confirm the Framework Preset is detected as **Next.js**.
3. Add the two environment variables listed above.
4. Click **Deploy**.

Vercel will automatically run `npm run build`, optimizing assets, executing the TypeScript compiler, and generating the serverless Edge Functions for the Next.js API Routes.

## 4. Security

The application has been hardened with secure HTTP headers in `next.config.ts`, including:
- Strict-Transport-Security (HSTS)
- X-Frame-Options (Clickjacking protection)
- X-Content-Type-Options (MIME-sniffing protection)
- Content-Security-Policy (CSP) locked to self and Supabase API endpoints.

Ensure that Supabase RLS is never disabled in production. By default, the migrations enable RLS on all tables and grant access solely to `authenticated` users.
