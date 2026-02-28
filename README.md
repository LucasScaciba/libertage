# Premium Service Marketplace

A responsive web marketplace for premium service-provider profiles with subscriptions, provider portal, and admin backoffice.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router) with TypeScript
- **UI**: shadcn/ui with Tailwind CSS
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (Google OAuth)
- **Storage**: Supabase Storage
- **Payments**: Stripe (Checkout, Customer Portal, Webhooks)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your credentials

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utility functions and services
│   ├── services/         # Business logic services
│   ├── supabase/         # Supabase client and utilities
│   └── stripe/           # Stripe utilities
├── types/                 # TypeScript type definitions
└── supabase/             # Database migrations and seeds
    └── migrations/       # SQL migration files
```

## Features

- Google OAuth authentication with mandatory onboarding
- Profile management with media uploads
- Subscription tiers (Free, Premium, Black)
- Boost system for profile promotion
- Public catalog with search and filters
- Analytics dashboard for providers
- Admin backoffice for moderation
- Privacy-preserving location display

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- `.kiro/specs/premium-service-marketplace/` - Detailed requirements, design, and implementation tasks
