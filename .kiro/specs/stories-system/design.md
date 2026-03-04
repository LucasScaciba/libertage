# Design Document

## Introduction

Este documento descreve o design técnico do Stories System, uma funcionalidade que permite profissionais publicarem vídeos promocionais temporários (24 horas) com limites baseados em planos de assinatura. O sistema inclui upload de vídeos, exibição em catálogo e perfil público, navegação em lightbox, moderação e analytics.

## Architecture Overview

O Stories System segue a arquitetura Next.js App Router existente com:
- Frontend: React Server Components + Client Components
- Backend: Next.js API Routes
- Storage: Supabase Storage para vídeos
- Database: Supabase PostgreSQL
- Background Jobs: Cron job para expiração automática

## Data Models

### Database Schema

```sql
-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, expired, deleted
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'deleted')),
  CONSTRAINT valid_duration CHECK (duration_seconds > 0 AND duration_seconds <= 60),
  CONSTRAINT valid_file_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 18874368) -- 18 MB
);

CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_expires_at ON stories(expires_at) WHERE status = 'active';
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);

-- Story views table
CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous
  viewer_ip VARCHAR(45), -- For anonymous tracking
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_view_per_user UNIQUE(story_id, viewer_id, viewed_at::DATE),
  CONSTRAINT unique_view_per_ip UNIQUE(story_id, viewer_ip, viewed_at::DATE)
);

CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_viewed_at ON story_views(viewed_at);

-- Story reports table
CREATE TABLE story_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_ip VARCHAR(45),
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, reviewed, dismissed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT valid_report_status CHECK (status IN ('pending', 'reviewed', 'dismissed'))
);

CREATE INDEX idx_story_reports_story_id ON story_reports(story_id);
CREATE INDEX idx_story_reports_status ON story_reports(status);
```

### TypeScript Types

```typescript
// types/story.ts
export type StoryStatus = 'active' | 'expired' | 'deleted';

export interface Story {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  file_size_bytes: number;
  status: StoryStatus;
  created_at: string;
  expires_at: string;
  deleted_at: string | null;
}

export interface StoryWithUser extends Story {
  user: {
    id: string;
    name: string;
    slug: string;
    profile_photo_url: string | null;
  };
}

export interface StoryView {
  id: string;
  story_id: string;
  viewer_id: string | null;
  viewer_ip: string | null;
  viewed_at: string;
}

export interface StoryReport {
  id: string;
  story_id: string;
  reporter_id: string | null;
  reporter_ip: string | null;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
}

export interface StoryAnalytics {
  story_id: string;
  view_count: number;
  unique_viewers: number;
}
```

## API Endpoints

### POST /api/stories/upload
Upload e validação de vídeo

**Request:**
```typescript
// FormData
{
  video: File; // mp4, mov, avi, max 18MB
}
```

**Response:**
```typescript
{
  success: boolean;
  video_url?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  error?: string;
}
```

**Validation:**
- File format: mp4, mov, avi
- File size: <= 18 MB
- Duration: <= 60 seconds

### POST /api/stories/publish
Publica um novo story

**Request:**
```typescript
{
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  file_size_bytes: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  story?: Story;
  error?: string;
}
```

**Business Logic:**
- Verifica plano do usuário (Free = erro, Premium = max 1, Black = max 5)
- Conta stories ativos do usuário
- Calcula expires_at = now + 24 horas
- Cria registro no banco

### GET /api/stories/catalog
Lista stories para exibição no catálogo

**Query Params:**
```typescript
{
  limit?: number; // default 50
  offset?: number; // default 0
}
```

**Response:**
```typescript
{
  stories: StoryWithUser[];
  total: number;
}
```

**Logic:**
- Retorna apenas stories com status = 'active'
- Agrupa por user_id
- Ordena por created_at DESC

### GET /api/stories/user/[userId]
Lista stories de um usuário específico

**Response:**
```typescript
{
  stories: Story[];
}
```

### DELETE /api/stories/[storyId]
Deleta um story (apenas owner)

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

**Logic:**
- Verifica ownership
- Atualiza status para 'deleted'
- Agenda remoção do arquivo do storage

### POST /api/stories/[storyId]/view
Registra visualização de um story

**Request:**
```typescript
{
  viewer_id?: string; // null se anônimo
}
```

**Response:**
```typescript
{
  success: boolean;
}
```

**Logic:**
- Registra view apenas 1x por viewer por dia
- Usa viewer_id se autenticado, senão usa IP

### POST /api/stories/[storyId]/report
Denuncia um story

**Request:**
```typescript
{
  reason: string;
  reporter_id?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### GET /api/stories/[storyId]/analytics
Retorna analytics de um story (apenas owner)

**Response:**
```typescript
{
  story_id: string;
  view_count: number;
  unique_viewers: number;
  views_by_day: Array<{
    date: string;
    count: number;
  }>;
}
```

### POST /api/cron/expire-stories
Cron job para expirar stories (executado a cada 5 minutos)

**Logic:**
- Busca stories com status = 'active' e expires_at < now
- Atualiza status para 'expired'
- Retorna contagem de stories expirados

## Frontend Components

### StoryUploadButton
Botão e modal para upload de stories

**Location:** `app/portal/stories/components/StoryUploadButton.tsx`

**Props:**
```typescript
interface StoryUploadButtonProps {
  userId: string;
  userPlan: 'free' | 'premium' | 'black';
  activeStoriesCount: number;
}
```

**Features:**
- Valida plano antes de abrir modal
- Mostra limite do plano
- Upload com progress bar
- Preview do vídeo antes de publicar
- Validação client-side (formato, tamanho, duração)

### StoriesCarousel
Carrossel de story indicators no topo do catálogo

**Location:** `app/catalogo/components/StoriesCarousel.tsx`

**Props:**
```typescript
interface StoriesCarouselProps {
  stories: StoryWithUser[];
}
```

**Features:**
- Scroll horizontal de story indicators
- Círculos com foto do perfil
- Borda colorida para indicar story ativo
- Click abre StoryViewer

### StoryIndicator
Indicador visual de story (círculo com foto)

**Location:** `app/components/stories/StoryIndicator.tsx`

**Props:**
```typescript
interface StoryIndicatorProps {
  user: {
    name: string;
    profile_photo_url: string | null;
    slug: string;
  };
  hasActiveStory: boolean;
  onClick: () => void;
}
```

### StoryViewer
Lightbox para visualização de stories

**Location:** `app/components/stories/StoryViewer.tsx`

**Props:**
```typescript
interface StoryViewerProps {
  stories: StoryWithUser[];
  initialStoryId: string;
  onClose: () => void;
}
```

**Features:**
- Fullscreen overlay
- Video player com autoplay
- Progress bar no topo
- Navegação: swipe, click lateral, keyboard arrows
- Botão "Denunciar"
- Botão "Deletar" (se owner)
- Avança automaticamente após vídeo terminar
- Registra view ao abrir

### StoryProgressBar
Barra de progresso para stories

**Location:** `app/components/stories/StoryProgressBar.tsx`

**Props:**
```typescript
interface StoryProgressBarProps {
  currentIndex: number;
  totalStories: number;
  progress: number; // 0-100
}
```

### StoryReportModal
Modal para denunciar story

**Location:** `app/components/stories/StoryReportModal.tsx`

**Props:**
```typescript
interface StoryReportModalProps {
  storyId: string;
  isOpen: boolean;
  onClose: () => void;
}
```

### StoryAnalytics
Dashboard de analytics para owner

**Location:** `app/portal/stories/components/StoryAnalytics.tsx`

**Props:**
```typescript
interface StoryAnalyticsProps {
  storyId: string;
}
```

**Features:**
- Total de visualizações
- Visualizações únicas
- Gráfico de views por dia
- Lista de viewers (se disponível)

## Services

### VideoUploadService
Gerencia upload e validação de vídeos

**Location:** `lib/services/video-upload.service.ts`

**Methods:**
```typescript
class VideoUploadService {
  async uploadVideo(file: File): Promise<{
    video_url: string;
    thumbnail_url: string;
    duration_seconds: number;
  }>;
  
  async validateVideo(file: File): Promise<{
    valid: boolean;
    error?: string;
  }>;
  
  async generateThumbnail(videoUrl: string): Promise<string>;
  
  async deleteVideo(videoUrl: string): Promise<void>;
}
```

### StoryExpirationService
Gerencia expiração automática de stories

**Location:** `lib/services/story-expiration.service.ts`

**Methods:**
```typescript
class StoryExpirationService {
  async expireStories(): Promise<number>;
  
  async scheduleExpiration(storyId: string, expiresAt: Date): Promise<void>;
}
```

### StoryPermissionService
Verifica permissões e limites de plano

**Location:** `lib/services/story-permission.service.ts`

**Methods:**
```typescript
class StoryPermissionService {
  async canPublishStory(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
  }>;
  
  async getActiveStoriesCount(userId: string): Promise<number>;
  
  async getStoryLimit(userPlan: string): Promise<number>;
}
```

### StoryAnalyticsService
Gerencia analytics e tracking

**Location:** `lib/services/story-analytics.service.ts`

**Methods:**
```typescript
class StoryAnalyticsService {
  async recordView(storyId: string, viewerId?: string, viewerIp?: string): Promise<void>;
  
  async getStoryAnalytics(storyId: string): Promise<StoryAnalytics>;
  
  async getViewsByDay(storyId: string): Promise<Array<{date: string; count: number}>>;
}
```

## Storage Structure

### Supabase Storage Bucket: `stories`

```
stories/
  {user_id}/
    {story_id}/
      video.mp4
      thumbnail.jpg
```

**Bucket Configuration:**
- Public access: true
- Max file size: 18 MB
- Allowed MIME types: video/mp4, video/quicktime, video/x-msvideo
- CDN enabled: true

## Background Jobs

### Story Expiration Cron
**Endpoint:** `/api/cron/expire-stories`
**Schedule:** Every 5 minutes
**Platform:** Vercel Cron Jobs

```typescript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/expire-stories",
    "schedule": "*/5 * * * *"
  }]
}
```

## Security Considerations

1. **Upload Validation:**
   - Client-side: File type, size, duration
   - Server-side: MIME type verification, file size, video metadata

2. **Authorization:**
   - Story deletion: Only owner
   - Analytics access: Only owner
   - Upload: Authenticated users with Premium/Black plan

3. **Rate Limiting:**
   - Upload: 10 requests per hour per user
   - Report: 5 reports per hour per IP
   - View tracking: 1 view per story per day per viewer

4. **Content Moderation:**
   - Report system for inappropriate content
   - Admin dashboard for reviewing reports (future)

## Performance Optimizations

1. **Video Delivery:**
   - CDN caching via Supabase Storage
   - Thumbnail generation for fast preview
   - Lazy loading of video content

2. **Database:**
   - Indexes on frequently queried columns
   - Composite indexes for complex queries
   - Pagination for catalog listing

3. **Frontend:**
   - React Server Components for initial load
   - Client Components for interactive features
   - Optimistic UI updates
   - Video preloading for next story

## Error Handling

### Upload Errors
- File too large: "Vídeo excede o tamanho máximo de 18 MB"
- Invalid format: "Formato de vídeo inválido. Use mp4, mov ou avi"
- Duration exceeded: "Vídeo não pode exceder 60 segundos"
- Upload failed: "Erro ao fazer upload. Tente novamente"

### Publication Errors
- Plan limit: "Limite de stories atingido para seu plano"
- Free plan: "Upgrade para Premium ou Black para publicar stories"
- Network error: "Erro ao publicar story. Verifique sua conexão"

### Viewing Errors
- Story not found: "Story não encontrado ou expirado"
- Video load error: "Erro ao carregar vídeo. Tente novamente"

## Testing Strategy

### Unit Tests
- VideoUploadService validation logic
- StoryPermissionService plan limits
- StoryExpirationService expiration logic

### Integration Tests
- Upload flow: file → storage → database
- Publication flow: validation → creation → display
- Expiration flow: cron → database update → UI update

### E2E Tests
- Complete upload and publish flow
- Story viewing and navigation
- Report submission
- Story deletion

## Correctness Properties

### Property 1: Plan Limit Invariant
```typescript
// For any user at any time:
// Premium: activeStoriesCount <= 1
// Black: activeStoriesCount <= 5
// Free: activeStoriesCount === 0

invariant(user => {
  const count = getActiveStoriesCount(user.id);
  if (user.plan === 'premium') return count <= 1;
  if (user.plan === 'black') return count <= 5;
  if (user.plan === 'free') return count === 0;
});
```

### Property 2: Expiration Time Invariant
```typescript
// For any story:
// expires_at === created_at + 24 hours

invariant(story => {
  const expectedExpiry = addHours(story.created_at, 24);
  return story.expires_at === expectedExpiry;
});
```

### Property 3: Status Transition Validity
```typescript
// Valid transitions:
// active → expired (by cron)
// active → deleted (by owner)
// No other transitions allowed

property(oldStory, newStory => {
  if (oldStory.status === 'active') {
    return newStory.status === 'expired' || newStory.status === 'deleted';
  }
  // Once expired or deleted, status cannot change
  return oldStory.status === newStory.status;
});
```

### Property 4: View Uniqueness
```typescript
// For any story and viewer:
// Maximum 1 view per day

property(storyId, viewerId, date => {
  const views = getViewsForStoryAndViewer(storyId, viewerId, date);
  return views.length <= 1;
});
```

### Property 5: File Size Validation
```typescript
// For any uploaded video:
// file_size_bytes <= 18 * 1024 * 1024 (18 MB)

invariant(story => {
  return story.file_size_bytes <= 18874368;
});
```

### Property 6: Active Story Visibility
```typescript
// For any story with status='active':
// Story appears in catalog and profile queries

property(story => {
  if (story.status === 'active' && story.expires_at > now()) {
    const catalogStories = getCatalogStories();
    const profileStories = getUserStories(story.user_id);
    return catalogStories.includes(story) && profileStories.includes(story);
  }
  return true;
});
```

## Migration Plan

### Phase 1: Database Setup
1. Create tables: stories, story_views, story_reports
2. Create indexes
3. Set up RLS policies

### Phase 2: Storage Setup
1. Create Supabase storage bucket
2. Configure bucket policies
3. Test upload/download

### Phase 3: Backend Implementation
1. Implement API routes
2. Implement services
3. Set up cron job

### Phase 4: Frontend Implementation
1. Implement upload UI
2. Implement story viewer
3. Implement catalog integration
4. Implement profile integration

### Phase 5: Testing & Launch
1. Run test suite
2. Manual QA
3. Soft launch to Premium users
4. Monitor and iterate
5. Full launch

## Future Enhancements

1. **Story Replies:** Allow users to reply to stories via DM
2. **Story Highlights:** Save expired stories as permanent highlights
3. **Story Insights:** Advanced analytics (demographics, engagement rate)
4. **Story Ads:** Sponsored stories for promotion
5. **Story Filters:** AR filters and effects
6. **Story Music:** Add background music to stories
