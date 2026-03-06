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

2. Install FFmpeg (required for video processing):

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH

3. Copy `.env.example` to `.env.local` and fill in your credentials

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

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
- Media processing pipeline with image optimization and video streaming
- Subscription tiers (Free, Premium, Black)
- Boost system for profile promotion
- Public catalog with search and filters
- Analytics dashboard for providers
- Admin backoffice for moderation
- Privacy-preserving location display

## Media Processing

The platform includes a complete media processing pipeline:

- **Image Processing**: Automatic generation of multiple optimized variants (WebP format)
  - Avatar (64x64) - for small thumbnails
  - Thumb (240px width) - for catalog grids
  - Lightbox (600px width) - for modal views
  - Large (1200px width) - for high-resolution displays

- **Video Processing**: HLS streaming with adaptive bitrates
  - 360p, 720p, and 1080p (conditional) resolutions
  - Automatic thumbnail extraction
  - 6-second segment chunks for smooth playback

- **Watermarking**: Automatic watermark application on public content
  - Applied to lightbox and large image variants
  - Applied to all video streams
  - Diagonal positioning with low opacity (10-15%)

- **Asynchronous Processing**: Non-blocking uploads with background processing
  - Upload returns immediately (< 2 seconds)
  - Status polling for completion tracking
  - Automatic retry on failures

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- `.kiro/specs/premium-service-marketplace/` - Detailed requirements, design, and implementation tasks
