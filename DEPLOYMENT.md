# Deployment Guide

This guide provides step-by-step instructions for deploying the Premium Service Marketplace application to production.

## Prerequisites

Before deploying, ensure you have:

- A [Supabase](https://supabase.com) account and project
- A [Stripe](https://stripe.com) account
- A [Vercel](https://vercel.com) account (or another Next.js hosting platform)
- A [Twilio](https://twilio.com) account (optional, for phone verification)
- Node.js 18+ installed locally

## Table of Contents

1. [Supabase Setup](#supabase-setup)
2. [Stripe Setup](#stripe-setup)
3. [Environment Variables](#environment-variables)
4. [Vercel Deployment](#vercel-deployment)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Supabase Setup

### 1. Create a New Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization and set:
   - **Project name**: premium-service-marketplace
   - **Database password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users
4. Wait for the project to be created (~2 minutes)

### 2. Configure Google OAuth

1. In your Supabase project, go to **Authentication > Providers**
2. Enable **Google** provider
3. Follow the instructions to create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com):
   - Create a new project or select existing
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth client ID**
   - If prompted, configure the OAuth consent screen first:
     - Choose **External** user type
     - Fill in app name, user support email, and developer contact
     - Add scopes: `email` and `profile` (or use default scopes)
     - Save and continue
   - Back to Create OAuth client ID:
     - Application type: **Web application**
     - Name: Your app name (e.g., "Premium Service Marketplace")
     - Authorized redirect URIs: Add `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
     - Click **Create**
4. Copy the **Client ID** and **Client Secret** to Supabase
5. Save the configuration in Supabase

**Note**: You don't need to enable any specific Google APIs for basic OAuth authentication. The OAuth consent screen is sufficient.

### 3. Run Database Migrations

The project includes SQL migration files that set up the complete database schema.

**Option A: Using Supabase Dashboard (Recommended for first deployment)**

1. Go to **SQL Editor** in your Supabase dashboard
2. Run each migration file **one at a time**, in order:

   **Migration 1: Initial Schema** (`supabase/migrations/001_initial_schema.sql`)
   - Open the file `supabase/migrations/001_initial_schema.sql` in your code editor
   - Copy the **entire file content** (all SQL statements)
   - Paste into the SQL Editor in Supabase
   - Click "Run"
   - Wait for completion and verify no errors
   - What it does: Creates all tables (users, profiles, media, availability, features, plans, subscriptions, boosts, reports, audit_logs, analytics_events), indexes, and foreign key relationships

   **Migration 2: RLS Policies** (`supabase/migrations/002_rls_policies.sql`)
   - Open the file `supabase/migrations/002_rls_policies.sql`
   - Copy the **entire file content**
   - Paste into the SQL Editor
   - Click "Run"
   - What it does: Enables Row Level Security and creates policies for provider ownership, admin access, and public catalog access

   **Migration 3: Seed Data** (`supabase/migrations/003_seed_data.sql`)
   - Open the file `supabase/migrations/003_seed_data.sql`
   - Copy the **entire file content**
   - Paste into the SQL Editor
   - Click "Run"
   - What it does: Inserts subscription plans (Free, Premium, Black), feature groups, and features

   **Migration 4: Rate Limits** (`supabase/migrations/004_rate_limits.sql`)
   - Open the file `supabase/migrations/004_rate_limits.sql`
   - Copy the **entire file content**
   - Paste into the SQL Editor
   - Click "Run"
   - What it does: Creates rate limiting tables and functions with indexes

   **Migration 5: Geohash Index** (`supabase/migrations/005_geohash_index.sql`)
   - Open the file `supabase/migrations/005_geohash_index.sql`
   - Copy the **entire file content**
   - Paste into the SQL Editor
   - Click "Run"
   - What it does: Adds geohash index for location-based queries

3. **Important**: Run migrations in numerical order (001, 002, 003, 004, 005)
4. Each migration file contains multiple SQL statements that work together - always copy the complete file
5. Verify no errors occurred after each migration before proceeding to the next

**Option B: Using Supabase CLI (For automated deployments)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref [YOUR-PROJECT-REF]

# Push migrations
supabase db push
```

### 4. Configure Storage Buckets

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket:
   - **Name**: `media`
   - **Public**: Yes (for serving images/videos)
3. Set up storage policies (4 policies total):

**Policy 1: Users can upload own media**
- Click **New Policy** on the `media` bucket
- Click **Create policy** (not "Use a template")
- Fill in the form:
  - **Policy name**: `Users can upload own media`
  - **Allowed operation**: Check **INSERT** only
  - **Target roles**: Select `authenticated`
  - **Policy definition** (paste ONLY the condition, not the full CREATE POLICY statement):
    ```sql
    bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text
    ```
- Click **Review** then **Save policy**

**Policy 2: Users can update own media**
- Click **New Policy** again
- Fill in the form:
  - **Policy name**: `Users can update own media`
  - **Allowed operation**: Check **UPDATE** only
  - **Target roles**: Select `authenticated`
  - **Policy definition** (paste ONLY the condition):
    ```sql
    bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text
    ```
- Click **Review** then **Save policy**

**Policy 3: Users can delete own media**
- Click **New Policy** again
- Fill in the form:
  - **Policy name**: `Users can delete own media`
  - **Allowed operation**: Check **DELETE** only
  - **Target roles**: Select `authenticated`
  - **Policy definition** (paste ONLY the condition):
    ```sql
    bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text
    ```
- Click **Review** then **Save policy**

**Policy 4: Public can read media**
- Click **New Policy** again
- Fill in the form:
  - **Policy name**: `Public can read media`
  - **Allowed operation**: Check **SELECT** only
  - **Target roles**: Select `anon` (this represents public/unauthenticated users)
  - **Policy definition** (paste ONLY the condition):
    ```sql
    bucket_id = 'media'
    ```
- Click **Review** then **Save policy**

**Alternative: Using SQL Editor (if you prefer)**

If you prefer to create all policies at once using SQL, go to **SQL Editor** and run:

```sql
-- Allow authenticated users to upload to their own profile folder
CREATE POLICY "Users can upload own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own media
CREATE POLICY "Users can update own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own media
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all media
CREATE POLICY "Public can read media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');
```

### 5. Get API Credentials

1. Go to **Project Settings > API**
2. Copy the following values (you'll need them for environment variables):
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

---

## Stripe Setup

### 1. Create Stripe Account

1. Sign up at [https://stripe.com](https://stripe.com)
2. Complete account verification
3. Switch to **Test Mode** for initial setup

### 2. Create Subscription Products

1. Go to **Products** in Stripe Dashboard
2. Create three products:

   **Premium Plan**
   - Name: Premium
   - Description: Premium subscription with enhanced features
   - Pricing: Recurring monthly (e.g., R$ 49.90/month or your pricing)
   - Copy the **Price ID** (starts with `price_`)

   **Black Plan**
   - Name: Black
   - Description: Black tier subscription with maximum features
   - Pricing: Recurring monthly (e.g., R$ 99.90/month or your pricing)
   - Copy the **Price ID** (starts with `price_`)

3. Update the seed data migration (`003_seed_data.sql`) with your Stripe Price IDs:

```sql
-- Update Premium plan
UPDATE plans SET stripe_price_id = 'price_YOUR_PREMIUM_PRICE_ID' WHERE code = 'premium';

-- Update Black plan
UPDATE plans SET stripe_price_id = 'price_YOUR_BLACK_PRICE_ID' WHERE code = 'black';
```

4. Run this update in Supabase SQL Editor

### 3. Create Boost Product (One-time Payment)

1. Go to **Products** in Stripe Dashboard
2. Create a new product:
   - Name: Profile Boost
   - Description: 2-hour profile promotion
   - Pricing: One-time payment (e.g., R$ 19.90 or your pricing)
3. Note: The boost price is configured in the application code (`lib/services/boost.service.ts`)

### 4. Configure Webhook Endpoint

⚠️ **Important**: You need to configure the webhook AFTER deploying your application, because you need the production URL first.

**For now, skip this step and come back after deploying to Vercel (Step 4 in Vercel Deployment section).**

When you're ready (after deployment):

1. Go to **Developers > Webhooks** in Stripe Dashboard
2. Click **Add endpoint** (or **Adicionar destino** in Portuguese)
3. Fill in the form:
   - **Endpoint URL** (URL do endpoint): `https://your-vercel-domain.vercel.app/api/webhooks/stripe`
     - Replace `your-vercel-domain` with your actual Vercel domain
     - Example: `https://premium-marketplace-abc123.vercel.app/api/webhooks/stripe`
   - **Description** (Descrição): Optional, e.g., "Production webhook"
   - **Events to send** (Eventos de): Select **Sua conta** (Your account)
   - **API version** (Versão da API): Use the latest (2025-02-24 or newer)
4. Click **Select events** (Selecionar eventos) and choose:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint** (Adicionar destino)
6. After creating, click on the webhook to view details
7. Copy the **Signing secret** (starts with `whsec_`)
8. Add this secret to your Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

**Where to get your Vercel URL:**
- After deploying to Vercel (see Vercel Deployment section below), you'll get a URL like:
  - `https://your-project-name.vercel.app` (automatic)
  - Or your custom domain if you configured one

**Testing webhooks locally (optional):**
- If you want to test webhooks during development, use [Stripe CLI](https://stripe.com/docs/stripe-cli):
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```
- This gives you a temporary webhook secret for local testing

### 5. Get API Keys

1. Go to **Developers > API keys**
2. Copy:
   - **Publishable key**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key**: `STRIPE_SECRET_KEY` (⚠️ Keep secret!)

---

## Environment Variables

### 1. Create Production Environment File

Create a `.env.production` file (or configure in your hosting platform):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SMS Provider (Optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Cron Security
CRON_SECRET=your_random_secret_string
```

### 2. Generate Cron Secret

Generate a secure random string for cron job authentication:

```bash
openssl rand -base64 32
```

Save this value as `CRON_SECRET`.

---

## Vercel Deployment

### 1. Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2. Deploy via Vercel Dashboard (Recommended)

1. Go to [https://vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
5. Add environment variables:
   - During the project setup, you'll see a section called **Environment Variables**
   - Click **Add** or the input field to start adding variables
   - For each variable below, you need to:
     1. Enter the **Key** (variable name, e.g., `NEXT_PUBLIC_SUPABASE_URL`)
     2. Enter the **Value** (the actual value from your Supabase/Stripe accounts)
     3. Check all three environments: **Production**, **Preview**, and **Development**
     4. Click **Add** to save that variable
     5. Repeat for all variables listed below
   
   **Required variables to add:**
   
   ```
   Key: NEXT_PUBLIC_SUPABASE_URL
   Value: https://[YOUR-PROJECT-REF].supabase.co
   Environments: ✓ Production ✓ Preview ✓ Development
   
   Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: [your anon key from Supabase Project Settings > API]
   Environments: ✓ Production ✓ Preview ✓ Development
   
   Key: SUPABASE_SERVICE_ROLE_KEY
   Value: [your service_role key from Supabase - keep this secret!]
   Environments: ✓ Production ✓ Preview ✓ Development
   
   Key: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   Value: pk_test_... (use test key for now, change to pk_live_... later)
   Environments: ✓ Production ✓ Preview ✓ Development
   
   Key: STRIPE_SECRET_KEY
   Value: sk_test_... (use test key for now, change to sk_live_... later)
   Environments: ✓ Production ✓ Preview ✓ Development
   
   Key: STRIPE_WEBHOOK_SECRET
   Value: whsec_... (leave empty for now, add after webhook setup)
   Environments: ✓ Production ✓ Preview ✓ Development
   
   Key: NEXT_PUBLIC_APP_URL
   Value: https://your-project-name.vercel.app (you'll get this after first deploy)
   Environments: ✓ Production ✓ Preview ✓ Development
   
   Key: CRON_SECRET
   Value: [generate with: openssl rand -base64 32]
   Environments: ✓ Production ✓ Preview ✓ Development
   ```
   
   **Optional variables (for SMS verification):**
   ```
   Key: TWILIO_ACCOUNT_SID
   Value: [your Twilio account SID]
   Environments: ✓ Production ✓ Preview ✓ Development
   
   Key: TWILIO_AUTH_TOKEN
   Value: [your Twilio auth token]
   Environments: ✓ Production ✓ Preview ✓ Development
   
   Key: TWILIO_PHONE_NUMBER
   Value: +15551234567
   Environments: ✓ Production ✓ Preview ✓ Development
   ```
   
   **Note**: You can also add/edit environment variables later by going to your project's **Settings > Environment Variables** in Vercel dashboard.
6. Click **Deploy**
7. Wait for deployment to complete (~2-3 minutes)

### 3. Deploy via CLI (Alternative)

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts to configure project
```

### 4. Configure Custom Domain (Optional)

1. In Vercel project settings, go to **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (~24-48 hours)

### 5. Configure Cron Jobs

The project includes a `vercel.json` file that configures cron jobs:

```json
{
  "crons": [
    {
      "path": "/api/cron/boost-transitions",
      "schedule": "* * * * *"
    }
  ]
}
```

This cron job runs every minute to:
- Activate scheduled boosts when their start time arrives
- Expire active boosts when their end time passes

**Secure the cron endpoint:**

1. In Vercel project settings, ensure `CRON_SECRET` environment variable is set
2. Vercel will automatically add the `Authorization: Bearer [CRON_SECRET]` header to cron requests
3. The endpoint validates this header before processing

---

## Post-Deployment Configuration

### 1. Update Stripe Webhook URL

1. Go to **Developers > Webhooks** in Stripe Dashboard
2. Edit your webhook endpoint
3. Update URL to: `https://your-domain.com/api/webhooks/stripe`
4. Save changes

### 2. Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to your OAuth credentials
3. Add authorized redirect URI: `https://your-domain.com/api/auth/callback`
4. Save changes

### 3. Update Supabase Site URL

1. Go to **Authentication > URL Configuration** in Supabase
2. Set **Site URL**: `https://your-domain.com`
3. Add **Redirect URLs**:
   - `https://your-domain.com/api/auth/callback`
   - `https://your-domain.com/portal`
4. Save changes

### 4. Test Critical Flows

Test the following user journeys in production:

1. **Authentication**
   - Sign in with Google
   - Verify redirect to onboarding
   - Complete onboarding flow

2. **Profile Management**
   - Create profile
   - Upload media
   - Publish profile
   - Verify profile appears in catalog

3. **Subscription**
   - Upgrade to Premium plan
   - Complete Stripe checkout
   - Verify subscription status updates
   - Test increased media limits

4. **Boost Purchase**
   - Purchase a boost
   - Complete payment
   - Verify boost appears in catalog at scheduled time

5. **Webhooks**
   - Trigger test webhook from Stripe Dashboard
   - Verify webhook is received and processed
   - Check logs for any errors

### 5. Create Admin User

1. Sign in to the application with your Google account
2. In Supabase SQL Editor, run:

```sql
-- Make yourself an admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

3. Verify you can access `/admin` routes

---

## Monitoring and Maintenance

### 1. Set Up Error Monitoring

Consider integrating error monitoring services:

- [Sentry](https://sentry.io) for error tracking
- [LogRocket](https://logrocket.com) for session replay
- [Vercel Analytics](https://vercel.com/analytics) for performance monitoring

### 2. Monitor Supabase Usage

1. Go to **Reports** in Supabase Dashboard
2. Monitor:
   - Database size
   - API requests
   - Storage usage
   - Active connections

### 3. Monitor Stripe Activity

1. Go to **Dashboard** in Stripe
2. Monitor:
   - Successful payments
   - Failed payments
   - Subscription churn
   - Webhook delivery status

### 4. Database Backups

Supabase automatically backs up your database daily. To create manual backups:

1. Go to **Database > Backups** in Supabase
2. Click **Create backup**
3. Download backup for local storage

### 5. Regular Maintenance Tasks

**Weekly:**
- Review error logs in Vercel
- Check webhook delivery failures in Stripe
- Monitor database performance in Supabase

**Monthly:**
- Review and optimize slow queries
- Clean up expired analytics events (optional)
- Review audit logs for suspicious activity

**Quarterly:**
- Update dependencies: `npm update`
- Review and update RLS policies if needed
- Perform security audit

---

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` matches the signing secret
3. Check Vercel function logs for errors
4. Test webhook delivery from Stripe Dashboard

### Authentication Redirect Loop

1. Verify `NEXT_PUBLIC_APP_URL` is set correctly
2. Check Google OAuth redirect URIs match
3. Verify Supabase Site URL is correct
4. Clear browser cookies and try again

### Media Upload Failing

1. Verify storage bucket exists and is public
2. Check storage policies are correctly configured
3. Verify file size limits in application code
4. Check Supabase storage quota

### Cron Jobs Not Running

1. Verify `vercel.json` is in project root
2. Check `CRON_SECRET` environment variable is set
3. Review Vercel function logs for cron execution
4. Ensure project is on a Vercel plan that supports cron jobs

### Database Connection Issues

1. Check Supabase project is not paused (free tier pauses after inactivity)
2. Verify connection string and credentials
3. Check database connection limits
4. Review Supabase status page for outages

---

## Security Checklist

Before going live, ensure:

- [ ] All environment variables are set correctly
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never exposed in client code
- [ ] `STRIPE_SECRET_KEY` is never exposed in client code
- [ ] Stripe webhook signature verification is enabled
- [ ] RLS policies are enabled on all tables
- [ ] Storage policies restrict uploads to authenticated users
- [ ] Cron endpoints are protected with `CRON_SECRET`
- [ ] Rate limiting is configured for public endpoints
- [ ] HTTPS is enforced (automatic with Vercel)
- [ ] Google OAuth credentials are for production domain
- [ ] Admin users are properly configured
- [ ] Test mode Stripe keys are replaced with live keys

---

## Support

For issues or questions:

- **Supabase**: [https://supabase.com/docs](https://supabase.com/docs)
- **Stripe**: [https://stripe.com/docs](https://stripe.com/docs)
- **Vercel**: [https://vercel.com/docs](https://vercel.com/docs)
- **Next.js**: [https://nextjs.org/docs](https://nextjs.org/docs)

---

## License

This deployment guide is part of the Premium Service Marketplace project.
