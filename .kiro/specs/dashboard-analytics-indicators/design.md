# Design Document: Dashboard Analytics Indicators

## Overview

O Dashboard Analytics é um sistema integrado de visualização de métricas que permite aos donos de perfis profissionais entenderem como seus perfis estão sendo descobertos, como visitantes interagem com o conteúdo e quais ações de contato estão acontecendo.

O sistema é composto por 7 indicadores principais que compartilham uma infraestrutura comum de tracking de eventos, agregação de dados e visualização. Todos os indicadores são implementados como uma única história integrada, reutilizando componentes, serviços e queries.

### Objetivos do Design

1. **Infraestrutura Unificada**: Todos os 7 indicadores compartilham a mesma tabela de eventos, serviços de tracking e APIs
2. **Performance**: Queries otimizadas com agregações no banco de dados e índices apropriados
3. **Reutilização**: Componentes Shadcn UI, ícones e serviços existentes são reutilizados
4. **Integração Não Intrusiva**: Tracking implementado nos componentes existentes sem impactar a experiência do usuário
5. **Escalabilidade**: Arquitetura preparada para crescimento da plataforma

### Stack Técnico

- **Frontend**: Next.js 14 App Router, React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI (Card, Table, Badge, Tooltip, Charts)
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (para thumbnails)
- **Charts**: Recharts (via Shadcn UI Charts)
- **Icons**: Tabler Icons (reutilizados dos componentes existentes)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface Layer                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Dashboard Page (/portal/dashboard)              │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │  │
│  │  │Indicator│ │Indicator│ │Indicator│ │Indicator│ │Indicator│ │  │
│  │  │   1     │ │   2     │ │   3     │ │   4     │ │   5     │ │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │  │
│  │  ┌────────┐ ┌────────┐                                    │  │
│  │  │Indicator│ │Indicator│                                   │  │
│  │  │   6     │ │   7     │                                   │  │
│  │  └────────┘ └────────┘                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes Layer                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/analytics/dashboard (GET - Dashboard Summary)       │  │
│  │  /api/analytics/media-views (GET - Media Views)           │  │
│  │  /api/analytics/social-clicks (GET - Social Clicks)       │  │
│  │  /api/analytics/story-views (GET - Story Views)           │  │
│  │  /api/analytics/visits-by-day (GET - Visits by Day)       │  │
│  │  /api/analytics/visits-by-state (GET - Visits by State)   │  │
│  │  /api/analytics/visibility-rank (GET - Visibility Rank)   │  │
│  │  /api/analytics/contact-channels (GET - Contact Channels) │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Tracking APIs (POST - Event Recording)                   │  │
│  │  - /api/analytics/track-media-view                        │  │
│  │  - /api/analytics/track-social-click                      │  │
│  │  - /api/analytics/track-story-view                        │  │
│  │  - /api/analytics/visit (existing)                        │  │
│  │  - /api/analytics/contact-click (existing)                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Services Layer                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AnalyticsService (lib/services/analytics.service.ts)     │  │
│  │  - trackMediaView()                                        │  │
│  │  - trackSocialClick()                                      │  │
│  │  - trackStoryView()                                        │  │
│  │  - getMediaViews()                                         │  │
│  │  - getSocialClicks()                                       │  │
│  │  - getStoryViews()                                         │  │
│  │  - getVisitsByDay()                                        │  │
│  │  - getVisitsByState()                                      │  │
│  │  - getVisibilityRank()                                     │  │
│  │  - getContactChannels()                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  GeolocationService (lib/services/geolocation.service.ts) │  │
│  │  - getStateFromIP()                                        │  │
│  │  - getCachedState()                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer (Supabase)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  analytics_events (Unified Events Table)                  │  │
│  │  - id, profile_id, event_type, visitor_fingerprint        │  │
│  │  - metadata (JSONB): media_id, story_id, social_network,  │  │
│  │    contact_channel, state, etc.                           │  │
│  │  - created_at                                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ip_geolocation_cache (IP to State Cache)                 │  │
│  │  - ip_address, state, country, created_at                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Existing Tables (Referenced)                             │  │
│  │  - profiles, media, stories, external_links               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Tracking Integration Points                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  app/page.tsx (Lightbox de mídia)                         │  │
│  │  app/components/external-links/ExternalLinksDisplay.tsx   │  │
│  │  app/components/stories/StoriesCarousel.tsx               │  │
│  │  Botões de contato WhatsApp/Telegram (existing)           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Event Tracking Flow**:
   ```
   User Action → Component → trackEvent() Helper → API Route → 
   AnalyticsService → analytics_events Table
   ```

2. **Dashboard Loading Flow**:
   ```
   Dashboard Page → API Routes → AnalyticsService → 
   Aggregated Queries → Dashboard Components
   ```

3. **Geolocation Flow**:
   ```
   profile_view Event → Extract IP → Check Cache → 
   External API (if not cached) → Store State in metadata
   ```

## Components and Interfaces

### Dashboard Page Component

**Location**: `app/portal/dashboard/page.tsx`

**Purpose**: Main dashboard page that displays all 7 indicators in a responsive grid layout.

**Structure**:
```typescript
interface DashboardData {
  mediaViews: MediaView[];
  socialClicks: SocialClick[];
  storyViews: StoryView[];
  visitsByDay: VisitByDay[];
  visitsByState: VisitByState[];
  visibilityRank: VisibilityRank;
  contactChannels: ContactChannel[];
}

interface MediaView {
  media_id: string;
  thumbnail_url: string;
  filename: string;
  media_type: 'photo' | 'video';
  view_count: number;
}

interface SocialClick {
  social_network: string;
  click_count: number;
}

interface StoryView {
  story_id: string;
  thumbnail_url: string;
  filename: string;
  view_count: number;
}

interface VisitByDay {
  day_of_week: number; // 0-6 (Sunday-Saturday)
  visit_count: number;
}

interface VisitByState {
  state: string;
  visit_count: number;
}

interface VisibilityRank {
  percentile: number; // 0-100
  category: 'top_10' | 'top_20' | 'top_30' | 'below_30';
  message: string;
}

interface ContactChannel {
  channel: 'whatsapp' | 'telegram';
  contact_count: number;
}
```

**Layout**: Responsive grid using Tailwind CSS
- Desktop: 2-3 columns
- Tablet: 2 columns
- Mobile: 1 column

### Indicator Components

#### 1. MediaViewsIndicator

**Purpose**: Display table of most viewed media (photos/videos) with thumbnails.

**Shadcn UI Components**:
- `Card` (container)
- `Table` (data display)
- `Badge` (media type indicator)

**Data Display**:
- Thumbnail (80x80px)
- Filename (truncated to 30 chars)
- Media type badge
- View count

#### 2. SocialClicksIndicator

**Purpose**: Display table of social networks with click counts.

**Shadcn UI Components**:
- `Card` (container)
- `Table` (data display)

**Icon Reuse**: Uses existing `getSocialIcon()` function from `ExternalLinksDisplay.tsx`

#### 3. StoryViewsIndicator

**Purpose**: Display table of most viewed stories with thumbnails.

**Shadcn UI Components**:
- `Card` (container)
- `Table` (data display)

**Data Display**:
- Thumbnail (80x80px)
- Filename (truncated to 30 chars)
- View count

#### 4. VisitsByDayIndicator

**Purpose**: Display bar chart of visits by day of week.

**Shadcn UI Components**:
- `Card` (container)
- `Chart` (Recharts BarChart)

**Chart Configuration**:
- X-axis: Days of week (Segunda, Terça, Quarta, Quinta, Sexta, Sábado, Domingo)
- Y-axis: Visit count
- Data: Last 90 days aggregated by day of week

#### 5. VisitsByStateIndicator

**Purpose**: Display interactive map of Brazil with states colored by visit density.

**Shadcn UI Components**:
- `Card` (container)
- `Tooltip` (state info on hover)

**Implementation**:
- SVG map of Brazil with state paths
- Color scale: lighter (fewer visits) to darker (more visits)
- Hover tooltip shows state name and visit count

#### 6. VisibilityRankIndicator

**Purpose**: Display profile's visibility ranking without showing exact position.

**Shadcn UI Components**:
- `Card` (container)
- `Badge` (rank category)

**Display**:
- Percentile category (Top 10%, Top 20%, Top 30%, Below 30%)
- Motivational message based on category
- No exact ranking number or comparison with other profiles

#### 7. ContactChannelsIndicator

**Purpose**: Display simple table of contact methods and click counts.

**Shadcn UI Components**:
- `Card` (container)
- `Table` (data display)

**Data Display**:
- Channel name (WhatsApp, Telegram)
- Contact count
- Only shows enabled channels

### Tracking Helper Functions

**Location**: `lib/utils/analytics-tracking.ts`

**Purpose**: Centralized helper functions for tracking events from components.

```typescript
export async function trackMediaView(mediaId: string): Promise<void> {
  try {
    await fetch('/api/analytics/track-media-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_id: mediaId })
    });
  } catch (error) {
    // Silent fail - don't break user experience
    console.error('Failed to track media view:', error);
  }
}

export async function trackSocialClick(socialNetwork: string): Promise<void> {
  try {
    await fetch('/api/analytics/track-social-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ social_network: socialNetwork })
    });
  } catch (error) {
    console.error('Failed to track social click:', error);
  }
}

export async function trackStoryView(storyId: string): Promise<void> {
  try {
    await fetch('/api/analytics/track-story-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story_id: storyId })
    });
  } catch (error) {
    console.error('Failed to track story view:', error);
  }
}
```

**Key Characteristics**:
- Async/non-blocking
- Silent failure (no user-facing errors)
- Minimal payload
- Fire-and-forget pattern

## Data Models

### analytics_events Table (Extended)

**Purpose**: Unified table for all analytics events across the platform.

**Schema**:
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'profile_view',
    'media_view',
    'social_link_click',
    'story_view',
    'contact_click'
  )),
  visitor_fingerprint TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Metadata Structure by Event Type**:

1. **profile_view**:
   ```json
   {
     "device_type": "mobile|tablet|desktop",
     "state": "SP|RJ|MG|...|Internacional|Não identificado"
   }
   ```

2. **media_view**:
   ```json
   {
     "media_id": "uuid",
     "media_type": "photo|video"
   }
   ```

3. **social_link_click**:
   ```json
   {
     "social_network": "Instagram|Tiktok|Youtube|..."
   }
   ```

4. **story_view**:
   ```json
   {
     "story_id": "uuid"
   }
   ```

5. **contact_click**:
   ```json
   {
     "contact_channel": "whatsapp|telegram"
   }
   ```

**Indexes**:
```sql
-- Existing indexes
CREATE INDEX idx_analytics_profile_id ON analytics_events(profile_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);

-- New composite indexes for dashboard queries
CREATE INDEX idx_analytics_profile_event_created 
  ON analytics_events(profile_id, event_type, created_at DESC);

CREATE INDEX idx_analytics_metadata_media_id 
  ON analytics_events USING GIN ((metadata->'media_id'));

CREATE INDEX idx_analytics_metadata_story_id 
  ON analytics_events USING GIN ((metadata->'story_id'));

CREATE INDEX idx_analytics_metadata_state 
  ON analytics_events USING GIN ((metadata->'state'));
```

### ip_geolocation_cache Table

**Purpose**: Cache IP to state mappings to reduce external API calls.

**Schema**:
```sql
CREATE TABLE ip_geolocation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ip_cache_ip ON ip_geolocation_cache(ip_address);
CREATE INDEX idx_ip_cache_created ON ip_geolocation_cache(created_at DESC);
```

**Retention Policy**: Keep entries for 30 days, then delete to allow for IP reassignments.

```sql
-- Cron job to clean old cache entries
DELETE FROM ip_geolocation_cache 
WHERE created_at < NOW() - INTERVAL '30 days';
```

### Aggregation Queries

#### Media Views Query

```sql
SELECT 
  m.id as media_id,
  m.public_url as thumbnail_url,
  m.filename,
  m.type as media_type,
  COUNT(ae.id) as view_count
FROM media m
LEFT JOIN analytics_events ae ON 
  ae.event_type = 'media_view' 
  AND ae.metadata->>'media_id' = m.id::text
  AND ae.profile_id = $1
WHERE m.profile_id = $1 
  AND m.deleted_at IS NULL
GROUP BY m.id, m.public_url, m.filename, m.type
ORDER BY view_count DESC
LIMIT 10;
```

#### Social Clicks Query

```sql
SELECT 
  ae.metadata->>'social_network' as social_network,
  COUNT(ae.id) as click_count
FROM analytics_events ae
WHERE ae.profile_id = $1
  AND ae.event_type = 'social_link_click'
GROUP BY ae.metadata->>'social_network'
ORDER BY click_count DESC;
```

#### Story Views Query

```sql
SELECT 
  s.id as story_id,
  s.thumbnail_url,
  s.video_url,
  COUNT(ae.id) as view_count
FROM stories s
LEFT JOIN analytics_events ae ON 
  ae.event_type = 'story_view' 
  AND ae.metadata->>'story_id' = s.id::text
  AND ae.profile_id = $1
WHERE s.user_id = (SELECT user_id FROM profiles WHERE id = $1)
GROUP BY s.id, s.thumbnail_url, s.video_url
ORDER BY view_count DESC
LIMIT 10;
```

#### Visits by Day of Week Query

```sql
SELECT 
  EXTRACT(DOW FROM created_at) as day_of_week,
  COUNT(*) as visit_count
FROM analytics_events
WHERE profile_id = $1
  AND event_type = 'profile_view'
  AND created_at >= NOW() - INTERVAL '90 days'
GROUP BY day_of_week
ORDER BY day_of_week;
```

#### Visits by State Query

```sql
SELECT 
  metadata->>'state' as state,
  COUNT(*) as visit_count
FROM analytics_events
WHERE profile_id = $1
  AND event_type = 'profile_view'
  AND created_at >= NOW() - INTERVAL '90 days'
  AND metadata->>'state' IS NOT NULL
GROUP BY metadata->>'state'
ORDER BY visit_count DESC;
```

#### Visibility Rank Query

```sql
-- Step 1: Get total visits for all profiles in last 30 days
WITH profile_visits AS (
  SELECT 
    profile_id,
    COUNT(*) as visit_count
  FROM analytics_events
  WHERE event_type = 'profile_view'
    AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY profile_id
),
-- Step 2: Calculate percentile rank
ranked_profiles AS (
  SELECT 
    profile_id,
    visit_count,
    PERCENT_RANK() OVER (ORDER BY visit_count DESC) * 100 as percentile
  FROM profile_visits
)
SELECT 
  percentile,
  CASE 
    WHEN percentile <= 10 THEN 'top_10'
    WHEN percentile <= 20 THEN 'top_20'
    WHEN percentile <= 30 THEN 'top_30'
    ELSE 'below_30'
  END as category
FROM ranked_profiles
WHERE profile_id = $1;
```

#### Contact Channels Query

```sql
SELECT 
  metadata->>'contact_channel' as channel,
  COUNT(*) as contact_count
FROM analytics_events
WHERE profile_id = $1
  AND event_type = 'contact_click'
GROUP BY metadata->>'contact_channel'
ORDER BY contact_count DESC;
```

## Geolocation Service

### Implementation

**Location**: `lib/services/geolocation.service.ts`

**External API**: IP-API.com (free tier: 45 requests/minute)

**Service Interface**:
```typescript
export interface GeolocationResult {
  state: string;
  country: string;
}

export class GeolocationService {
  private static readonly API_URL = 'http://ip-api.com/json/';
  private static readonly CACHE_DURATION_DAYS = 30;

  /**
   * Get state from IP address with caching
   */
  static async getStateFromIP(ipAddress: string): Promise<string> {
    // Check cache first
    const cached = await this.getCachedState(ipAddress);
    if (cached) {
      return cached;
    }

    // Call external API
    try {
      const response = await fetch(`${this.API_URL}${ipAddress}?fields=country,regionName`);
      const data = await response.json();

      if (data.status === 'success') {
        const state = data.country === 'Brazil' 
          ? this.mapRegionToState(data.regionName)
          : 'Internacional';

        // Cache result
        await this.cacheState(ipAddress, state, data.country);
        
        return state;
      }
    } catch (error) {
      console.error('Geolocation API error:', error);
    }

    return 'Não identificado';
  }

  /**
   * Map region name to Brazilian state abbreviation
   */
  private static mapRegionToState(regionName: string): string {
    const stateMap: Record<string, string> = {
      'Acre': 'AC',
      'Alagoas': 'AL',
      'Amapá': 'AP',
      'Amazonas': 'AM',
      'Bahia': 'BA',
      'Ceará': 'CE',
      'Distrito Federal': 'DF',
      'Espírito Santo': 'ES',
      'Goiás': 'GO',
      'Maranhão': 'MA',
      'Mato Grosso': 'MT',
      'Mato Grosso do Sul': 'MS',
      'Minas Gerais': 'MG',
      'Pará': 'PA',
      'Paraíba': 'PB',
      'Paraná': 'PR',
      'Pernambuco': 'PE',
      'Piauí': 'PI',
      'Rio de Janeiro': 'RJ',
      'Rio Grande do Norte': 'RN',
      'Rio Grande do Sul': 'RS',
      'Rondônia': 'RO',
      'Roraima': 'RR',
      'Santa Catarina': 'SC',
      'São Paulo': 'SP',
      'Sergipe': 'SE',
      'Tocantins': 'TO'
    };

    return stateMap[regionName] || 'Não identificado';
  }

  /**
   * Get cached state for IP
   */
  private static async getCachedState(ipAddress: string): Promise<string | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('ip_geolocation_cache')
      .select('state')
      .eq('ip_address', ipAddress)
      .gte('created_at', new Date(Date.now() - this.CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return data.state;
  }

  /**
   * Cache state for IP
   */
  private static async cacheState(
    ipAddress: string, 
    state: string, 
    country: string
  ): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('ip_geolocation_cache')
      .upsert({
        ip_address: ipAddress,
        state,
        country
      }, {
        onConflict: 'ip_address'
      });
  }
}
```

### Rate Limiting Strategy

- Cache all results for 30 days
- Most profile views will hit cache (same visitors returning)
- Free tier allows 45 requests/minute (2,700/hour)
- Expected usage: ~100-200 new IPs per hour (well within limits)

### Error Handling

- API failures return "Não identificado"
- Cache failures are logged but don't block tracking
- Geolocation errors don't prevent profile_view event from being recorded


## Brazil Map SVG Component

### Implementation

**Location**: `app/portal/dashboard/components/BrazilMap.tsx`

**Purpose**: Interactive SVG map of Brazil with state-level data visualization.

**Component Interface**:
```typescript
interface BrazilMapProps {
  visitsByState: Record<string, number>;
}

interface StateData {
  code: string;
  name: string;
  visits: number;
  color: string;
}
```

**Color Scale Algorithm**:
```typescript
function calculateStateColor(visits: number, maxVisits: number): string {
  if (visits === 0) return '#f3f4f6'; // gray-100
  
  const intensity = visits / maxVisits;
  const grayValue = Math.floor(255 - (intensity * 155)); // 255 to 100
  
  return `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
}
```

**SVG Structure**:
- Each state is a `<path>` element with unique ID
- Hover effects using CSS
- Tooltip component from Shadcn UI
- Responsive viewBox for different screen sizes

### Brazilian States Mapping

```typescript
const BRAZILIAN_STATES = {
  'AC': 'Acre',
  'AL': 'Alagoas',
  'AP': 'Amapá',
  'AM': 'Amazonas',
  'BA': 'Bahia',
  'CE': 'Ceará',
  'DF': 'Distrito Federal',
  'ES': 'Espírito Santo',
  'GO': 'Goiás',
  'MA': 'Maranhão',
  'MT': 'Mato Grosso',
  'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais',
  'PA': 'Pará',
  'PB': 'Paraíba',
  'PR': 'Paraná',
  'PE': 'Pernambuco',
  'PI': 'Piauí',
  'RJ': 'Rio de Janeiro',
  'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul',
  'RO': 'Rondônia',
  'RR': 'Roraima',
  'SC': 'Santa Catarina',
  'SP': 'São Paulo',
  'SE': 'Sergipe',
  'TO': 'Tocantins'
};
```


## Thumbnail Generation Strategy

### Implementation

**Purpose**: Generate optimized thumbnails for media and stories to improve dashboard performance.

**Approach**: Use Sharp library (already in dependencies via Next.js) for server-side image processing.

**Thumbnail Specifications**:
- Max dimensions: 80x80 pixels
- Format: WebP (better compression)
- Quality: 80%
- Aspect ratio: Preserved (fit within 80x80 box)

**Storage Strategy**:
- Original media: `profiles/{profile_id}/media/{filename}`
- Thumbnails: `profiles/{profile_id}/media/thumbnails/{filename}.webp`

**Generation Timing**:
- On upload: Generate thumbnail immediately after media upload
- Lazy generation: For existing media without thumbnails, generate on first dashboard load

**Service Interface**:
```typescript
export class ThumbnailService {
  static async generateThumbnail(
    originalUrl: string,
    profileId: string,
    filename: string
  ): Promise<string> {
    // Download original
    // Resize to 80x80 max
    // Convert to WebP
    // Upload to thumbnails folder
    // Return thumbnail URL
  }
}
```


## Integration with Existing Components

### 1. Lightbox Media Tracking (app/page.tsx)

**Current Implementation**: Gallery modal opens when clicking media thumbnails.

**Integration Point**: Add tracking when gallery opens.

**Code Changes**:
```typescript
// In openGallery function
const openGallery = (index: number) => {
  setCurrentImageIndex(index);
  setIsGalleryOpen(true);
  
  // NEW: Track media view
  const media = selectedProfile?.media?.[index];
  if (media?.id) {
    trackMediaView(media.id);
  }
};
```

**Characteristics**:
- Non-blocking: Fire-and-forget
- Silent failure: No user-facing errors
- Tracks on gallery open, not on thumbnail click

### 2. Social Links Tracking (ExternalLinksDisplay.tsx)

**Current Implementation**: Links open in new tab when clicked.

**Integration Point**: Add tracking in onClick handler.

**Code Changes**:
```typescript
// In link button onClick
onClick={() => {
  // NEW: Track social click
  trackSocialClick(link.title);
  
  // Existing: Open link
  window.open(link.url, "_blank");
}}
```

**Characteristics**:
- Tracks before opening link
- Uses existing social network title
- Reuses existing icon mapping

### 3. Stories Tracking (StoriesCarousel.tsx)

**Current Implementation**: Story modal opens when clicking avatar.

**Integration Point**: Add tracking when video starts playing.

**Code Changes**:
```typescript
// In useEffect that handles video playback
useEffect(() => {
  if (videoRef.current && currentStory) {
    videoRef.current.load();
    videoRef.current.play().catch(err => console.error('Error playing video:', err));
    
    // NEW: Track story view
    trackStoryView(currentStory.id);
  }
}, [currentStory]);
```

**Characteristics**:
- Tracks when story starts playing
- One event per story view
- Handles story carousel navigation

### 4. Contact Buttons Tracking (Existing)

**Current Implementation**: Already implemented in app/page.tsx.

**No Changes Needed**: Uses existing `trackContactClick()` function.

**Verification**: Ensure metadata includes correct channel name.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, the following redundancies were identified and consolidated:

**Redundant Properties Eliminated**:
1. Properties 1.6 and 3.4 (thumbnail dimensions) → Consolidated into Property 1
2. Properties 1.7 and 3.5 (text truncation) → Consolidated into Property 2
3. Properties 1.3, 2.3, and 3.3 (descending order) → Consolidated into Property 3
4. Properties 2.5, 3.6, and 7.5 (historical data persistence) → Consolidated into Property 4
5. Properties 5.5 and 5.6 (color scale) → Consolidated into Property 5 (5.6 is inverse of 5.5)
6. Properties 4.4 and 5.7 (90-day filtering) → Consolidated into Property 6
7. Properties 5.2 and 11.7 (state storage) → Consolidated into Property 7
8. Properties 9.3 and 9.4 (event data completeness) → Consolidated into Property 8

**Result**: 45 testable properties consolidated into 35 unique properties.

### Property 1: Thumbnail Dimensions

*For any* media item or story with a thumbnail, the thumbnail dimensions SHALL NOT exceed 80x80 pixels in either width or height.

**Validates: Requirements 1.6, 3.4**

### Property 2: Filename Truncation

*For any* filename longer than 30 characters, the displayed text SHALL be truncated to 30 characters with ellipsis appended.

**Validates: Requirements 1.7, 3.5**

### Property 3: Descending Order by Count

*For any* list of items with view counts or click counts (media, social links, stories), the list SHALL be ordered in descending order by count (highest to lowest).

**Validates: Requirements 1.3, 2.3, 3.3**

### Property 4: Historical Data Persistence

*For any* deleted or disabled resource (social link, story, contact channel), the historical analytics events SHALL remain in the database and be included in aggregate counts.

**Validates: Requirements 2.5, 3.6, 7.5**

### Property 5: State Color Intensity

*For any* two Brazilian states with different visit counts, the state with more visits SHALL have a darker grayscale color than the state with fewer visits.

**Validates: Requirements 5.5, 5.6**

### Property 6: 90-Day Time Window

*For any* dashboard query for visits by day or visits by state, only events with created_at within the last 90 days SHALL be included in the results.

**Validates: Requirements 4.4, 5.7**

### Property 7: State Storage in Metadata

*For any* profile_view event, the metadata field SHALL contain a 'state' key with a valid Brazilian state code, 'Internacional', or 'Não identificado'.

**Validates: Requirements 5.2, 11.7**

### Property 8: Event Data Completeness

*For any* analytics event, the event SHALL include profile_id, event_type, visitor_fingerprint, and created_at (timestamp).

**Validates: Requirements 9.3, 9.4**

### Property 9: Media View Tracking

*For any* media item opened in the lightbox, a media_view event SHALL be recorded with the correct media_id in metadata.

**Validates: Requirements 1.1**

### Property 10: Media Dashboard Display

*For any* media view data rendered in the dashboard, the output SHALL contain thumbnail URL, filename, media type, and view count.

**Validates: Requirements 1.2**

### Property 11: Active Media Filtering

*For any* media returned by the dashboard query, the media SHALL have deleted_at = NULL (active media only).

**Validates: Requirements 1.5**

### Property 12: Media Deletion Cascade

*For any* media item deleted by the profile owner, all associated analytics events SHALL be removed via CASCADE delete.

**Validates: Requirements 1.4**

### Property 13: Social Click Tracking

*For any* social link clicked by a visitor, a social_link_click event SHALL be recorded with the correct social_network in metadata.

**Validates: Requirements 2.1**

### Property 14: Social Dashboard Display

*For any* social click data rendered in the dashboard, the output SHALL contain social network icon, network name, and click count.

**Validates: Requirements 2.2**

### Property 15: Story View Tracking

*For any* story opened in the modal viewer, a story_view event SHALL be recorded with the correct story_id in metadata.

**Validates: Requirements 3.1**

### Property 16: Story Dashboard Display

*For any* story view data rendered in the dashboard, the output SHALL contain thumbnail URL, filename, and view count.

**Validates: Requirements 3.2**

### Property 17: Day of Week Aggregation

*For any* set of profile_view events, the aggregation by day of week SHALL correctly group events by EXTRACT(DOW FROM created_at).

**Validates: Requirements 4.1**

### Property 18: Day of Week Display Order

*For any* visits by day chart, the days SHALL be displayed in the order: Segunda (1), Terça (2), Quarta (3), Quinta (4), Sexta (5), Sábado (6), Domingo (0).

**Validates: Requirements 4.3**

### Property 19: Day of Week Visit Counts

*For any* visits by day chart, each bar SHALL display the total visit count for that day of week.

**Validates: Requirements 4.5**

### Property 20: IP to State Mapping

*For any* visitor IP address, the geolocation service SHALL return a valid Brazilian state code, 'Internacional', or 'Não identificado'.

**Validates: Requirements 5.1**

### Property 21: Map Tooltip Display

*For any* state on the Brazil map when hovered, a tooltip SHALL appear containing the state name and visit count.

**Validates: Requirements 5.4**

### Property 22: Geolocation Error Handling

*For any* IP address that cannot be geolocated, the system SHALL record the profile_view event with state = 'Não identificado' without failing.

**Validates: Requirements 5.8**

### Property 23: Percentile Calculation

*For any* profile, the visibility rank percentile SHALL be calculated as PERCENT_RANK() OVER (ORDER BY visit_count DESC) * 100 based on last 30 days.

**Validates: Requirements 6.1**

### Property 24: Rank Categorization

*For any* profile with a calculated percentile, the category SHALL be: 'top_10' if ≤10, 'top_20' if ≤20, 'top_30' if ≤30, else 'below_30'.

**Validates: Requirements 6.2**

### Property 25: Privacy - No Other Profile Data

*For any* visibility rank display, the output SHALL NOT contain data from other profiles (names, IDs, visit counts).

**Validates: Requirements 6.4**

### Property 26: Privacy - No Exact Rank

*For any* visibility rank display, the output SHALL NOT contain the exact numerical rank position, only the category.

**Validates: Requirements 6.5**

### Property 27: Contact Channel Grouping

*For any* set of contact_click events, the aggregation SHALL correctly group by metadata->>'contact_channel'.

**Validates: Requirements 7.2**

### Property 28: Enabled Channels Only

*For any* contact channels displayed in the dashboard, only channels that are currently enabled in the profile SHALL appear.

**Validates: Requirements 7.4**

### Property 29: All Historical Contacts

*For any* contact channel query, all contact_click events SHALL be included regardless of age (no time filtering).

**Validates: Requirements 7.6**

### Property 30: Empty State Display

*For any* dashboard indicator with no data, an appropriate empty state message SHALL be displayed instead of empty tables or charts.

**Validates: Requirements 8.8**

### Property 31: Silent Tracking Failures

*For any* analytics tracking call that fails, the system SHALL continue normal operation without displaying errors to the visitor.

**Validates: Requirements 9.1**

### Property 32: Async Tracking

*For any* analytics tracking call, the call SHALL be asynchronous and SHALL NOT block the UI thread.

**Validates: Requirements 9.2**

### Property 33: Required Field Validation

*For any* analytics event, if required fields (profile_id, event_type) are missing, the event SHALL be rejected with a validation error.

**Validates: Requirements 9.5**

### Property 34: Missing Data Error Logging

*For any* analytics event with missing required data, an error SHALL be logged but the user-facing operation SHALL continue.

**Validates: Requirements 9.6**

### Property 35: Loading States

*For any* dashboard indicator during data fetch, a loading state SHALL be displayed until data is loaded or an error occurs.

**Validates: Requirements 10.5**

### Property 36: Independent Indicator Loading

*For any* dashboard with multiple indicators, each indicator SHALL load independently without blocking other indicators.

**Validates: Requirements 10.6**

### Property 37: Slow Query Logging

*For any* analytics query that exceeds 3 seconds, a warning SHALL be logged to the system log.

**Validates: Requirements 10.7**

### Property 38: Brazilian State Domain

*For any* Brazilian IP address, the geolocation service SHALL return one of the 27 valid state codes (AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO).

**Validates: Requirements 11.2**

### Property 39: International IP Handling

*For any* IP address from outside Brazil, the geolocation service SHALL return 'Internacional'.

**Validates: Requirements 11.3**

### Property 40: Geolocation Service Failure

*For any* geolocation API failure, the system SHALL record the profile_view event without state data and continue operation.

**Validates: Requirements 11.4**

### Property 41: IP Geolocation Caching

*For any* IP address that has been geolocated within the last 30 days, the cached result SHALL be returned without calling the external API.

**Validates: Requirements 11.5**

### Property 42: Event Metadata Structure

*For any* analytics event, the metadata field SHALL contain the appropriate fields for its event_type (media_id for media_view, social_network for social_link_click, etc.).

**Validates: Requirements 12.2**

### Property 43: Data Retention Policy

*For any* analytics event older than 12 months, the event SHALL be deleted by the retention policy.

**Validates: Requirements 12.5**

### Property 44: Referential Integrity

*For any* profile deletion, all associated analytics_events SHALL be deleted via CASCADE constraint.

**Validates: Requirements 12.7**

### Property 45: Event Parsing

*For any* valid JSON analytics event, the parser SHALL successfully convert it to a typed event object.

**Validates: Requirements 13.1**

### Property 46: Invalid Event Error

*For any* invalid JSON analytics event, the parser SHALL return a descriptive error message.

**Validates: Requirements 13.2**

### Property 47: Event Serialization

*For any* typed event object, the serializer SHALL convert it to valid JSON.

**Validates: Requirements 13.3**

### Property 48: Serialization Round Trip

*For any* valid analytics event object, parsing then serializing then parsing SHALL produce an equivalent object.

**Validates: Requirements 13.4**

### Property 49: Required Field Validation in Parser

*For any* analytics event, the parser SHALL validate that profile_id, event_type, and timestamp are present and correctly typed.

**Validates: Requirements 13.5**

### Property 50: Event Type Metadata Validation

*For any* analytics event, the parser SHALL validate that metadata contains the required fields for its event_type.

**Validates: Requirements 13.6**

### Property 51: ISO 8601 Timestamp Format

*For any* analytics event serialized to JSON, the timestamp SHALL be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ).

**Validates: Requirements 13.7**


## Error Handling

### Tracking Errors

**Philosophy**: Analytics failures should never impact user experience.

**Implementation**:
1. All tracking calls wrapped in try-catch
2. Errors logged to console but not thrown
3. No user-facing error messages for tracking failures
4. Fire-and-forget pattern for all tracking

**Example**:
```typescript
export async function trackMediaView(mediaId: string): Promise<void> {
  try {
    await fetch('/api/analytics/track-media-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_id: mediaId })
    });
  } catch (error) {
    // Silent fail - log but don't throw
    console.error('Failed to track media view:', error);
  }
}
```

### Dashboard Loading Errors

**Philosophy**: Show graceful degradation when data cannot be loaded.

**Implementation**:
1. Each indicator loads independently
2. Failed indicators show error state
3. Other indicators continue to work
4. Retry button for failed indicators

**Error States**:
- Loading: Skeleton UI
- Error: "Não foi possível carregar os dados. Tentar novamente?"
- Empty: "Nenhum dado disponível ainda."

### Geolocation Errors

**Philosophy**: Geolocation failures should not prevent visit tracking.

**Implementation**:
1. Geolocation wrapped in try-catch
2. API failures return "Não identificado"
3. Visit event recorded regardless of geolocation success
4. Cache failures logged but don't block

**Fallback Chain**:
1. Try cache lookup
2. Try external API
3. Return "Não identificado"
4. Record visit with whatever state was determined

### Database Errors

**Philosophy**: Database errors should be logged and reported but not crash the application.

**Implementation**:
1. All database queries wrapped in try-catch
2. Errors logged with context (query, params, error)
3. API routes return 500 with error code
4. Frontend shows error state with retry option

**Error Response Format**:
```typescript
{
  error: {
    code: 'DATABASE_ERROR',
    message: 'Failed to fetch analytics data'
  }
}
```


## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
**Property Tests**: Verify universal properties across all inputs through randomization

Both approaches are complementary and necessary for comprehensive correctness validation.

### Property-Based Testing

**Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property reference
- Tests located in `__tests__/analytics/` directory

**Tag Format**:
```typescript
/**
 * Feature: dashboard-analytics-indicators
 * Property 1: Thumbnail Dimensions
 * 
 * For any media item or story with a thumbnail, the thumbnail dimensions
 * SHALL NOT exceed 80x80 pixels in either width or height.
 */
test('Property 1: Thumbnail dimensions', () => {
  fc.assert(
    fc.property(
      fc.record({
        width: fc.integer({ min: 1, max: 1000 }),
        height: fc.integer({ min: 1, max: 1000 })
      }),
      (dimensions) => {
        const thumbnail = generateThumbnail(dimensions);
        return thumbnail.width <= 80 && thumbnail.height <= 80;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test Coverage**:
- Properties 1-51: All correctness properties implemented as property tests
- Generators for: events, media, profiles, IP addresses, dates
- Shrinking enabled for minimal failing examples

### Unit Testing

**Library**: Vitest (already configured in project)

**Focus Areas**:
1. **API Route Tests**: Test each API endpoint with specific examples
2. **Component Tests**: Test dashboard components with mock data
3. **Service Tests**: Test AnalyticsService and GeolocationService methods
4. **Integration Tests**: Test tracking integration in existing components
5. **Edge Cases**: Empty states, missing data, invalid inputs

**Example Unit Test**:
```typescript
describe('MediaViewsIndicator', () => {
  it('displays empty state when no media views', () => {
    const { getByText } = render(<MediaViewsIndicator data={[]} />);
    expect(getByText('Nenhum dado disponível ainda.')).toBeInTheDocument();
  });

  it('displays media with thumbnails and view counts', () => {
    const data = [
      { media_id: '1', thumbnail_url: '/thumb1.jpg', filename: 'photo.jpg', media_type: 'photo', view_count: 10 }
    ];
    const { getByText, getByAltText } = render(<MediaViewsIndicator data={data} />);
    expect(getByText('photo.jpg')).toBeInTheDocument();
    expect(getByText('10')).toBeInTheDocument();
    expect(getByAltText('photo.jpg')).toHaveAttribute('src', '/thumb1.jpg');
  });

  it('truncates long filenames', () => {
    const data = [
      { 
        media_id: '1', 
        thumbnail_url: '/thumb1.jpg', 
        filename: 'this_is_a_very_long_filename_that_exceeds_thirty_characters.jpg', 
        media_type: 'photo', 
        view_count: 10 
      }
    ];
    const { getByText } = render(<MediaViewsIndicator data={data} />);
    expect(getByText(/this_is_a_very_long_filename\.\.\.$/)).toBeInTheDocument();
  });
});
```

### Test Organization

```
__tests__/
├── analytics/
│   ├── properties/
│   │   ├── tracking.property.test.ts
│   │   ├── dashboard.property.test.ts
│   │   ├── geolocation.property.test.ts
│   │   └── serialization.property.test.ts
│   ├── unit/
│   │   ├── api-routes.test.ts
│   │   ├── analytics-service.test.ts
│   │   ├── geolocation-service.test.ts
│   │   └── thumbnail-service.test.ts
│   ├── integration/
│   │   ├── tracking-integration.test.ts
│   │   └── dashboard-loading.test.ts
│   └── components/
│       ├── MediaViewsIndicator.test.tsx
│       ├── SocialClicksIndicator.test.tsx
│       ├── StoryViewsIndicator.test.tsx
│       ├── VisitsByDayIndicator.test.tsx
│       ├── VisitsByStateIndicator.test.tsx
│       ├── VisibilityRankIndicator.test.tsx
│       └── ContactChannelsIndicator.test.tsx
```

### Test Data Generators

**For Property Tests**:
```typescript
// Generator for analytics events
const analyticsEventArb = fc.record({
  profile_id: fc.uuid(),
  event_type: fc.constantFrom('profile_view', 'media_view', 'social_link_click', 'story_view', 'contact_click'),
  visitor_fingerprint: fc.string({ minLength: 10, maxLength: 100 }),
  metadata: fc.dictionary(fc.string(), fc.anything()),
  created_at: fc.date()
});

// Generator for Brazilian IP addresses
const brazilianIPArb = fc.tuple(
  fc.integer({ min: 1, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

// Generator for media items
const mediaItemArb = fc.record({
  id: fc.uuid(),
  profile_id: fc.uuid(),
  filename: fc.string({ minLength: 1, maxLength: 100 }),
  type: fc.constantFrom('photo', 'video'),
  public_url: fc.webUrl(),
  deleted_at: fc.option(fc.date(), { nil: null })
});
```

### Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Property Test Coverage**: All 51 properties implemented
- **Integration Test Coverage**: All 4 tracking integration points tested

### Continuous Integration

**Test Execution**:
- Run on every commit
- Run on pull requests
- Run nightly with extended property test iterations (1000 runs)

**Performance Tests**:
- Dashboard load time < 2 seconds
- Individual indicator load time < 500ms
- Tracking call overhead < 50ms


## Implementation Plan

### Phase 1: Database Schema and Services

**Tasks**:
1. Create migration for analytics_events table extension
2. Create migration for ip_geolocation_cache table
3. Add indexes for performance
4. Implement GeolocationService
5. Extend AnalyticsService with new methods
6. Create ThumbnailService

**Deliverables**:
- Migration file: `supabase/migrations/XXX_analytics_dashboard.sql`
- Service files: `lib/services/geolocation.service.ts`, `lib/services/thumbnail.service.ts`
- Extended: `lib/services/analytics.service.ts`

### Phase 2: Tracking Implementation

**Tasks**:
1. Create tracking helper functions
2. Integrate tracking in Lightbox (app/page.tsx)
3. Integrate tracking in ExternalLinksDisplay
4. Integrate tracking in StoriesCarousel
5. Update profile_view tracking to include geolocation
6. Create API routes for new tracking endpoints

**Deliverables**:
- Helper file: `lib/utils/analytics-tracking.ts`
- API routes: `/api/analytics/track-media-view`, `/api/analytics/track-social-click`, `/api/analytics/track-story-view`
- Updated components with tracking

### Phase 3: Dashboard API Routes

**Tasks**:
1. Create API route for media views
2. Create API route for social clicks
3. Create API route for story views
4. Create API route for visits by day
5. Create API route for visits by state
6. Create API route for visibility rank
7. Create API route for contact channels
8. Create unified dashboard summary route

**Deliverables**:
- API routes in `/api/analytics/` directory
- Query optimization and testing

### Phase 4: Dashboard UI Components

**Tasks**:
1. Create dashboard page layout
2. Create MediaViewsIndicator component
3. Create SocialClicksIndicator component
4. Create StoryViewsIndicator component
5. Create VisitsByDayIndicator component
6. Create VisitsByStateIndicator component (with Brazil map)
7. Create VisibilityRankIndicator component
8. Create ContactChannelsIndicator component
9. Add Dashboard link to sidebar navigation

**Deliverables**:
- Dashboard page: `app/portal/dashboard/page.tsx`
- Indicator components in `app/portal/dashboard/components/`
- Brazil map SVG component

### Phase 5: Testing

**Tasks**:
1. Write property-based tests for all 51 properties
2. Write unit tests for services
3. Write unit tests for API routes
4. Write component tests for indicators
5. Write integration tests for tracking
6. Performance testing

**Deliverables**:
- Test files in `__tests__/analytics/`
- Test coverage report
- Performance benchmarks

### Phase 6: Documentation and Deployment

**Tasks**:
1. Update API documentation
2. Create user guide for dashboard
3. Deploy database migrations
4. Deploy application code
5. Monitor analytics tracking
6. Verify dashboard performance

**Deliverables**:
- API documentation
- User guide
- Deployment checklist
- Monitoring dashboard


## Database Migration

### Migration File

**Filename**: `supabase/migrations/XXX_analytics_dashboard.sql`

**Contents**:

```sql
-- ============================================================================
-- Analytics Dashboard Migration
-- ============================================================================
-- This migration extends the analytics system to support the dashboard with
-- 7 integrated indicators.
--
-- Changes:
-- 1. Extend analytics_events table with metadata JSONB field
-- 2. Add new event types to CHECK constraint
-- 3. Create ip_geolocation_cache table
-- 4. Add performance indexes
-- 5. Create data retention policy
-- ============================================================================

-- Step 1: Add metadata column to analytics_events (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analytics_events' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE analytics_events ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Step 2: Update event_type CHECK constraint to include new types
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;

ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_event_type_check
  CHECK (event_type IN (
    'profile_view',
    'media_view',
    'social_link_click',
    'story_view',
    'contact_click'
  ));

-- Step 3: Create ip_geolocation_cache table
CREATE TABLE IF NOT EXISTS ip_geolocation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes for performance

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_analytics_profile_event_created 
  ON analytics_events(profile_id, event_type, created_at DESC);

-- GIN indexes for JSONB metadata queries
CREATE INDEX IF NOT EXISTS idx_analytics_metadata_media_id 
  ON analytics_events USING GIN ((metadata->'media_id'));

CREATE INDEX IF NOT EXISTS idx_analytics_metadata_story_id 
  ON analytics_events USING GIN ((metadata->'story_id'));

CREATE INDEX IF NOT EXISTS idx_analytics_metadata_social_network 
  ON analytics_events USING GIN ((metadata->'social_network'));

CREATE INDEX IF NOT EXISTS idx_analytics_metadata_state 
  ON analytics_events USING GIN ((metadata->'state'));

CREATE INDEX IF NOT EXISTS idx_analytics_metadata_contact_channel 
  ON analytics_events USING GIN ((metadata->'contact_channel'));

-- Index for IP cache lookups
CREATE INDEX IF NOT EXISTS idx_ip_cache_ip 
  ON ip_geolocation_cache(ip_address);

CREATE INDEX IF NOT EXISTS idx_ip_cache_created 
  ON ip_geolocation_cache(created_at DESC);

-- Step 5: Create function for data retention policy
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS void AS $$
BEGIN
  -- Delete analytics events older than 12 months
  DELETE FROM analytics_events 
  WHERE created_at < NOW() - INTERVAL '12 months';
  
  -- Delete IP cache entries older than 30 days
  DELETE FROM ip_geolocation_cache 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create scheduled job for cleanup (requires pg_cron extension)
-- Note: This requires pg_cron to be enabled in Supabase
-- Run manually or via cron job if pg_cron is not available
-- SELECT cron.schedule('cleanup-analytics', '0 2 * * *', 'SELECT cleanup_old_analytics_events()');

-- Step 7: Add comment documentation
COMMENT ON TABLE analytics_events IS 'Unified analytics events table for all tracking across the platform';
COMMENT ON COLUMN analytics_events.metadata IS 'JSONB field containing event-specific data (media_id, story_id, social_network, contact_channel, state, etc.)';
COMMENT ON TABLE ip_geolocation_cache IS 'Cache for IP to state geolocation lookups to reduce external API calls';

-- Step 8: Grant permissions (adjust based on your RLS policies)
-- These are examples - adjust based on your security requirements
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_geolocation_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own analytics
CREATE POLICY "Users can read own analytics" ON analytics_events
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can insert analytics events
CREATE POLICY "Service role can insert analytics" ON analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can manage IP cache
CREATE POLICY "Service role can manage IP cache" ON ip_geolocation_cache
  FOR ALL
  USING (true);

-- ============================================================================
-- Migration Complete
-- ============================================================================
```

### Migration Verification

**Post-Migration Checks**:

```sql
-- Verify metadata column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analytics_events' AND column_name = 'metadata';

-- Verify ip_geolocation_cache table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'ip_geolocation_cache';

-- Verify indexes were created
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('analytics_events', 'ip_geolocation_cache')
ORDER BY indexname;

-- Verify event_type constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'analytics_events_event_type_check';

-- Test metadata JSONB queries
SELECT COUNT(*) 
FROM analytics_events 
WHERE metadata->>'media_id' IS NOT NULL;
```

### Rollback Plan

```sql
-- Rollback script (if needed)

-- Drop new indexes
DROP INDEX IF EXISTS idx_analytics_profile_event_created;
DROP INDEX IF EXISTS idx_analytics_metadata_media_id;
DROP INDEX IF EXISTS idx_analytics_metadata_story_id;
DROP INDEX IF EXISTS idx_analytics_metadata_social_network;
DROP INDEX IF EXISTS idx_analytics_metadata_state;
DROP INDEX IF EXISTS idx_analytics_metadata_contact_channel;
DROP INDEX IF EXISTS idx_ip_cache_ip;
DROP INDEX IF EXISTS idx_ip_cache_created;

-- Drop new table
DROP TABLE IF EXISTS ip_geolocation_cache;

-- Remove metadata column (WARNING: This will delete data)
-- ALTER TABLE analytics_events DROP COLUMN IF EXISTS metadata;

-- Restore old event_type constraint
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;
ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_event_type_check
  CHECK (event_type IN ('visit', 'contact_click'));

-- Drop cleanup function
DROP FUNCTION IF EXISTS cleanup_old_analytics_events();
```


## Performance Considerations

### Query Optimization

**Aggregation Strategy**:
- All aggregations performed in database using GROUP BY
- Indexes on (profile_id, event_type, created_at) for fast filtering
- GIN indexes on JSONB metadata for efficient field queries
- LIMIT clauses to prevent excessive data transfer

**Example Optimized Query**:
```sql
-- Optimized media views query
SELECT 
  m.id,
  m.public_url,
  m.filename,
  m.type,
  COUNT(ae.id) as view_count
FROM media m
LEFT JOIN analytics_events ae ON 
  ae.event_type = 'media_view' 
  AND ae.metadata->>'media_id' = m.id::text
  AND ae.profile_id = $1
WHERE m.profile_id = $1 
  AND m.deleted_at IS NULL
GROUP BY m.id
ORDER BY view_count DESC
LIMIT 10;

-- Uses indexes:
-- - idx_analytics_profile_event_created (for ae.profile_id, ae.event_type)
-- - idx_analytics_metadata_media_id (for metadata->>'media_id')
-- - Primary key on media (for m.id)
```

### Caching Strategy

**IP Geolocation Cache**:
- 30-day cache duration
- Reduces external API calls by ~95%
- Indexed lookups (O(log n) complexity)

**Dashboard Data Cache** (Future Enhancement):
- Redis cache for dashboard summary
- 5-minute TTL
- Invalidate on new events (optional)

### Thumbnail Optimization

**Storage**:
- Separate thumbnails folder
- WebP format (30-50% smaller than JPEG)
- 80x80px max dimensions
- Lazy generation for existing media

**Bandwidth Savings**:
- Original image: ~500KB average
- Thumbnail: ~5KB average
- 100x reduction in data transfer for dashboard

### Database Connection Pooling

**Supabase Configuration**:
- Connection pool size: 20 connections
- Idle timeout: 10 seconds
- Max lifetime: 30 minutes

**Query Timeout**:
- Dashboard queries: 5 second timeout
- Tracking inserts: 3 second timeout
- Geolocation lookups: 2 second timeout

### Frontend Performance

**Code Splitting**:
- Dashboard page lazy-loaded
- Chart library (Recharts) code-split
- Brazil map SVG lazy-loaded

**Data Loading**:
- Parallel API calls for all indicators
- Independent loading states
- Progressive rendering (show data as it arrives)

**Bundle Size**:
- Dashboard page: ~50KB gzipped
- Chart library: ~30KB gzipped
- Total overhead: ~80KB


## Security Considerations

### Row Level Security (RLS)

**Analytics Events**:
```sql
-- Users can only read their own analytics
CREATE POLICY "Users can read own analytics" ON analytics_events
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Service role can insert analytics (for tracking)
CREATE POLICY "Service role can insert analytics" ON analytics_events
  FOR INSERT
  WITH CHECK (true);
```

**IP Geolocation Cache**:
```sql
-- Only service role can access IP cache
CREATE POLICY "Service role can manage IP cache" ON ip_geolocation_cache
  FOR ALL
  USING (true);
```

### API Route Authentication

**Dashboard Routes**:
- Require authenticated user
- Verify user owns the profile
- Return 401 for unauthenticated requests
- Return 403 for unauthorized access

**Tracking Routes**:
- No authentication required (public tracking)
- Rate limiting to prevent abuse
- Validate profile_id exists
- Sanitize all inputs

**Example Authentication Check**:
```typescript
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }
  
  // Verify user owns profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
    
  if (!profile) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Access denied' } },
      { status: 403 }
    );
  }
  
  // Proceed with query...
}
```

### Data Privacy

**Visitor Fingerprinting**:
- No PII stored (no names, emails, etc.)
- Fingerprint = IP + User-Agent hash
- Cannot identify individual users
- Compliant with LGPD (Brazilian data protection law)

**Profile Privacy**:
- Users can only see their own analytics
- No cross-profile data exposure
- Visibility rank shows category only, not exact position
- No public leaderboards or rankings

**IP Address Handling**:
- IP addresses not stored in analytics_events
- Only state/country stored
- IP cache separate from analytics
- Cache entries expire after 30 days

### Rate Limiting

**Tracking Endpoints**:
- 100 requests per minute per IP
- 1000 requests per hour per IP
- Prevents spam and abuse

**Dashboard Endpoints**:
- 60 requests per minute per user
- Prevents excessive API usage

**Geolocation API**:
- 45 requests per minute (free tier limit)
- Cache hit rate > 95% reduces actual API calls

### Input Validation

**All API Routes**:
- Validate required fields
- Sanitize string inputs
- Validate UUIDs format
- Validate enum values (event_type, etc.)
- Reject oversized payloads

**Example Validation**:
```typescript
const schema = z.object({
  media_id: z.string().uuid(),
  profile_id: z.string().uuid()
});

const result = schema.safeParse(body);
if (!result.success) {
  return NextResponse.json(
    { error: { code: 'INVALID_INPUT', message: result.error.message } },
    { status: 400 }
  );
}
```

### SQL Injection Prevention

**Parameterized Queries**:
- All queries use Supabase client with parameterization
- No string concatenation for SQL
- JSONB queries use safe operators

**Example Safe Query**:
```typescript
// SAFE: Parameterized query
const { data } = await supabase
  .from('analytics_events')
  .select('*')
  .eq('profile_id', profileId)
  .eq('event_type', 'media_view');

// UNSAFE: Never do this
// const query = `SELECT * FROM analytics_events WHERE profile_id = '${profileId}'`;
```

### CORS Configuration

**Tracking Endpoints**:
- Allow cross-origin requests (for public profiles)
- Validate origin against whitelist
- Set appropriate CORS headers

**Dashboard Endpoints**:
- Same-origin only
- No CORS headers needed


## Future Enhancements

### Phase 2 Features (Post-MVP)

**1. Advanced Filtering**:
- Date range selector for all indicators
- Export data to CSV/PDF
- Compare time periods (this month vs last month)

**2. Real-Time Updates**:
- WebSocket connection for live updates
- Real-time visitor counter
- Live notification when someone views profile

**3. Additional Metrics**:
- Average session duration
- Bounce rate (single-page visits)
- Conversion funnel (view → click → contact)
- Most common visitor paths

**4. Enhanced Geolocation**:
- City-level granularity (not just state)
- International visitor breakdown by country
- Heatmap with intensity visualization

**5. Predictive Analytics**:
- Trend predictions (visits next week)
- Best time to post stories
- Optimal pricing suggestions based on engagement

**6. A/B Testing**:
- Test different profile descriptions
- Test different media ordering
- Measure impact on engagement

### Monitoring and Observability

**Metrics to Track**:
- Dashboard load time (p50, p95, p99)
- API response times
- Tracking success rate
- Geolocation cache hit rate
- Database query performance

**Alerts**:
- Dashboard load time > 3 seconds
- Tracking failure rate > 5%
- Geolocation API errors
- Database connection pool exhaustion

**Logging**:
- All tracking events (for debugging)
- Failed geolocation lookups
- Slow queries (> 3 seconds)
- API errors with context

### Scalability Considerations

**Current Capacity**:
- 10,000 profiles
- 1M events per day
- 100 concurrent dashboard users

**Scaling Strategy**:
- Horizontal scaling: Add more API servers
- Database: Read replicas for dashboard queries
- Caching: Redis for hot data
- CDN: Static assets and thumbnails

**Bottlenecks to Monitor**:
- Database connection pool
- Geolocation API rate limits
- Storage for thumbnails
- JSONB query performance

## Conclusion

This design document provides a comprehensive blueprint for implementing the Dashboard Analytics system with 7 integrated indicators. The design emphasizes:

1. **Unified Infrastructure**: All indicators share common tables, services, and APIs
2. **Performance**: Optimized queries, caching, and thumbnails
3. **User Experience**: Non-intrusive tracking, graceful error handling, responsive UI
4. **Correctness**: 51 properties with property-based testing
5. **Security**: RLS policies, authentication, input validation
6. **Scalability**: Designed to handle growth

The implementation follows a phased approach, starting with database schema and services, then tracking integration, API routes, UI components, and finally comprehensive testing. Each phase builds on the previous one, ensuring a solid foundation for the complete system.

The design is ready for implementation and can be executed as a single integrated story, with all 7 indicators working together from day one.

