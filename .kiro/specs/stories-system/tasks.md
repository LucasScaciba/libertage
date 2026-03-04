# Tasks

## 1. Database Setup
- [x] 1.1 Create stories table with indexes
- [x] 1.2 Create story_views table with indexes
- [x] 1.3 Create story_reports table with indexes
- [x] 1.4 Set up RLS policies for stories tables

## 2. Storage Setup
- [x] 2.1 Create Supabase storage bucket for stories
- [x] 2.2 Configure bucket policies and permissions
- [x] 2.3 Test upload and download functionality

## 3. Backend Services
- [x] 3.1 Implement VideoUploadService
- [x] 3.2 Implement StoryPermissionService
- [x] 3.3 Implement StoryExpirationService
- [x] 3.4 Implement StoryAnalyticsService

## 4. API Routes - Upload & Publication
- [x] 4.1 Create POST /api/stories/upload endpoint
- [x] 4.2 Create POST /api/stories/publish endpoint
- [x] 4.3 Add validation and error handling

## 5. API Routes - Retrieval & Management
- [x] 5.1 Create GET /api/stories/catalog endpoint
- [x] 5.2 Create GET /api/stories/user/[userId] endpoint
- [x] 5.3 Create DELETE /api/stories/[storyId] endpoint

## 6. API Routes - Interactions
- [x] 6.1 Create POST /api/stories/[storyId]/view endpoint
- [x] 6.2 Create POST /api/stories/[storyId]/report endpoint
- [x] 6.3 Create GET /api/stories/[storyId]/analytics endpoint

## 7. Cron Job
- [x] 7.1 Create POST /api/cron/expire-stories endpoint
- [x] 7.2 Configure Vercel cron job schedule
- [x] 7.3 Test expiration logic

## 8. Frontend Components - Upload
- [x] 8.1 Create StoryUploadButton component
- [x] 8.2 Create upload modal with file picker
- [x] 8.3 Add video preview and validation
- [x] 8.4 Add upload progress indicator

## 9. Frontend Components - Display
- [x] 9.1 Create StoryIndicator component
- [x] 9.2 Create StoriesCarousel component
- [x] 9.3 Integrate StoriesCarousel in catalog page
- [x] 9.4 Integrate story indicators in public profile page

## 10. Frontend Components - Viewer
- [x] 10.1 Create StoryViewer lightbox component
- [x] 10.2 Add video player with autoplay
- [x] 10.3 Add StoryProgressBar component
- [x] 10.4 Implement navigation (swipe, click, keyboard)
- [x] 10.5 Add automatic advancement after video ends

## 11. Frontend Components - Interactions
- [x] 11.1 Create StoryReportModal component
- [x] 11.2 Add delete button for story owners
- [x] 11.3 Implement view tracking on story open
- [x] 11.4 Create StoryAnalytics dashboard component

## 12. Portal Integration
- [x] 12.1 Create stories management page in portal
- [x] 12.2 Add "Meus Stories" section with list
- [x] 12.3 Add analytics view for each story
- [x] 12.4 Add upload button in portal header

## 13. Testing
- [x] 13.1 Write unit tests for services
- [x] 13.2 Write integration tests for API routes
- [x] 13.3 Write E2E tests for upload flow
- [x] 13.4 Write E2E tests for viewing flow
- [x] 13.5 Test expiration cron job

## 14. Documentation & Launch
- [x] 14.1 Update user documentation
- [x] 14.2 Create admin guide for moderation
- [x] 14.3 Perform manual QA testing
- [x] 14.4 Deploy to production
