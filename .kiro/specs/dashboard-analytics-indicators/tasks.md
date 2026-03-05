# Implementation Plan: Dashboard Analytics Indicators

## Overview

Este plano implementa um sistema completo de analytics com 7 indicadores integrados para o dashboard de perfis profissionais. A implementação segue uma abordagem incremental, construindo a infraestrutura base primeiro (database e services), depois tracking, APIs, UI e finalmente testes.

Todos os 7 indicadores compartilham a mesma infraestrutura de eventos, serviços e componentes Shadcn UI, garantindo consistência e reutilização de código.

## Tasks

- [-] 1. Database Schema and Core Services
  - [x] 1.1 Create database migration for analytics_events extension and ip_geolocation_cache table
    - Create file `supabase/migrations/XXX_analytics_dashboard.sql`
    - Add metadata JSONB column to analytics_events
    - Create ip_geolocation_cache table with indexes
    - Add new event types to CHECK constraint (media_view, social_link_click, story_view)
    - Create composite indexes for performance (profile_id, event_type, created_at)
    - Create GIN indexes for JSONB metadata fields
    - Add RLS policies for security
    - Create cleanup function for data retention
    - _Requirements: 9.3, 9.4, 12.1, 12.2, 12.7_

  - [ ]* 1.2 Write property tests for database schema
    - **Property 8: Event Data Completeness** - Validates: Requirements 9.3, 9.4
    - **Property 42: Event Metadata Structure** - Validates: Requirements 12.2
    - **Property 44: Referential Integrity** - Validates: Requirements 12.7

  - [x] 1.3 Implement GeolocationService
    - Create file `lib/services/geolocation.service.ts`
    - Implement getStateFromIP() with IP-API.com integration
    - Implement getCachedState() for cache lookups
    - Implement cacheState() for storing results
    - Implement mapRegionToState() for Brazilian state mapping
    - Handle errors gracefully (return "Não identificado" on failure)
    - _Requirements: 5.1, 5.2, 11.1, 11.2, 11.3, 11.4, 11.5, 11.7_

  - [ ]* 1.4 Write property tests for GeolocationService
    - **Property 20: IP to State Mapping** - Validates: Requirements 5.1
    - **Property 38: Brazilian State Domain** - Validates: Requirements 11.2
    - **Property 39: International IP Handling** - Validates: Requirements 11.3
    - **Property 40: Geolocation Service Failure** - Validates: Requirements 11.4
    - **Property 41: IP Geolocation Caching** - Validates: Requirements 11.5

  - [x] 1.5 Implement ThumbnailService
    - Create file `lib/services/thumbnail.service.ts`
    - Implement generateThumbnail() using Sharp library
    - Resize images to max 80x80px maintaining aspect ratio
    - Convert to WebP format with 80% quality
    - Upload thumbnails to Supabase Storage in thumbnails folder
    - Return thumbnail URL
    - _Requirements: 1.6, 3.4, 10.1_

  - [ ]* 1.6 Write property tests for ThumbnailService
    - **Property 1: Thumbnail Dimensions** - Validates: Requirements 1.6, 3.4

  - [x] 1.7 Extend AnalyticsService with dashboard methods
    - Update file `lib/services/analytics.service.ts`
    - Implement trackMediaView(profileId, mediaId, fingerprint)
    - Implement trackSocialClick(profileId, socialNetwork, fingerprint)
    - Implement trackStoryView(profileId, storyId, fingerprint)
    - Implement getMediaViews(profileId) with aggregation query
    - Implement getSocialClicks(profileId) with aggregation query
    - Implement getStoryViews(profileId) with aggregation query
    - Implement getVisitsByDay(profileId) with 90-day filtering
    - Implement getVisitsByState(profileId) with 90-day filtering
    - Implement getVisibilityRank(profileId) with percentile calculation
    - Implement getContactChannels(profileId) with aggregation query
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 5.3, 6.1, 6.2, 7.1, 7.2, 7.3_

  - [ ]* 1.8 Write property tests for AnalyticsService
    - **Property 9: Media View Tracking** - Validates: Requirements 1.1
    - **Property 13: Social Click Tracking** - Validates: Requirements 2.1
    - **Property 15: Story View Tracking** - Validates: Requirements 3.1
    - **Property 17: Day of Week Aggregation** - Validates: Requirements 4.1
    - **Property 23: Percentile Calculation** - Validates: Requirements 6.1
    - **Property 24: Rank Categorization** - Validates: Requirements 6.2
    - **Property 27: Contact Channel Grouping** - Validates: Requirements 7.2

- [x] 2. Checkpoint - Database and services ready
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Tracking Implementation and Integration
  - [x] 3.1 Create tracking helper functions
    - Create file `lib/utils/analytics-tracking.ts`
    - Implement trackMediaView(mediaId) as async fire-and-forget
    - Implement trackSocialClick(socialNetwork) as async fire-and-forget
    - Implement trackStoryView(storyId) as async fire-and-forget
    - Wrap all calls in try-catch with silent failure
    - Log errors to console but don't throw
    - _Requirements: 9.1, 9.2, 9.5, 9.6_

  - [ ]* 3.2 Write property tests for tracking helpers
    - **Property 31: Silent Tracking Failures** - Validates: Requirements 9.1
    - **Property 32: Async Tracking** - Validates: Requirements 9.2
    - **Property 33: Required Field Validation** - Validates: Requirements 9.5
    - **Property 34: Missing Data Error Logging** - Validates: Requirements 9.6

  - [x] 3.3 Integrate media view tracking in Lightbox
    - Update file `app/page.tsx`
    - Import trackMediaView from analytics-tracking
    - Add tracking call in openGallery function when gallery opens
    - Track media.id from selectedProfile.media array
    - Ensure tracking doesn't block UI
    - _Requirements: 1.1, 9.1, 9.2_

  - [x] 3.4 Integrate social link tracking in ExternalLinksDisplay
    - Update file `app/components/external-links/ExternalLinksDisplay.tsx`
    - Import trackSocialClick from analytics-tracking
    - Add tracking call in link button onClick before opening URL
    - Track link.title as social_network
    - Ensure tracking doesn't block navigation
    - _Requirements: 2.1, 9.1, 9.2_

  - [x] 3.5 Integrate story view tracking in StoriesCarousel
    - Update file `app/components/stories/StoriesCarousel.tsx`
    - Import trackStoryView from analytics-tracking
    - Add tracking call in useEffect when video starts playing
    - Track currentStory.id
    - Ensure one event per story view
    - _Requirements: 3.1, 9.1, 9.2_

  - [x] 3.6 Update profile_view tracking with geolocation
    - Update existing profile_view tracking in `app/api/analytics/visit/route.ts`
    - Import GeolocationService
    - Extract IP address from request headers
    - Call getStateFromIP() to get visitor state
    - Store state in metadata field of analytics_events
    - Handle geolocation failures gracefully
    - _Requirements: 5.1, 5.2, 5.8, 11.4, 11.5, 11.7_

  - [ ]* 3.7 Write integration tests for tracking
    - Test media view tracking integration in Lightbox
    - Test social click tracking integration in ExternalLinksDisplay
    - Test story view tracking integration in StoriesCarousel
    - Test profile_view with geolocation
    - Verify events are recorded in database
    - Verify tracking failures don't break UI

- [x] 4. Checkpoint - Tracking integrated
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Dashboard API Routes
  - [x] 5.1 Create API route for media views
    - Create file `app/api/analytics/media-views/route.ts`
    - Implement GET handler with authentication check
    - Call AnalyticsService.getMediaViews(profileId)
    - Return array of MediaView objects with thumbnails
    - Handle errors with 500 response
    - _Requirements: 1.2, 1.3, 1.5, 8.1, 8.2_

  - [x] 5.2 Create API route for social clicks
    - Create file `app/api/analytics/social-clicks/route.ts`
    - Implement GET handler with authentication check
    - Call AnalyticsService.getSocialClicks(profileId)
    - Return array of SocialClick objects
    - Handle errors with 500 response
    - _Requirements: 2.2, 2.3, 8.1, 8.2_

  - [x] 5.3 Create API route for story views
    - Create file `app/api/analytics/story-views/route.ts`
    - Implement GET handler with authentication check
    - Call AnalyticsService.getStoryViews(profileId)
    - Return array of StoryView objects with thumbnails
    - Handle errors with 500 response
    - _Requirements: 3.2, 3.3, 8.1, 8.2_

  - [x] 5.4 Create API route for visits by day
    - Create file `app/api/analytics/visits-by-day/route.ts`
    - Implement GET handler with authentication check
    - Call AnalyticsService.getVisitsByDay(profileId)
    - Return array of VisitByDay objects (day_of_week, visit_count)
    - Apply 90-day filtering
    - Handle errors with 500 response
    - _Requirements: 4.1, 4.2, 4.4, 8.1, 8.2_

  - [x] 5.5 Create API route for visits by state
    - Create file `app/api/analytics/visits-by-state/route.ts`
    - Implement GET handler with authentication check
    - Call AnalyticsService.getVisitsByState(profileId)
    - Return array of VisitByState objects (state, visit_count)
    - Apply 90-day filtering
    - Handle errors with 500 response
    - _Requirements: 5.3, 5.7, 8.1, 8.2_

  - [x] 5.6 Create API route for visibility rank
    - Create file `app/api/analytics/visibility-rank/route.ts`
    - Implement GET handler with authentication check
    - Call AnalyticsService.getVisibilityRank(profileId)
    - Return VisibilityRank object (percentile, category, message)
    - Ensure no other profile data is exposed
    - Handle errors with 500 response
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2_

  - [x] 5.7 Create API route for contact channels
    - Create file `app/api/analytics/contact-channels/route.ts`
    - Implement GET handler with authentication check
    - Call AnalyticsService.getContactChannels(profileId)
    - Return array of ContactChannel objects (channel, contact_count)
    - Filter to show only enabled channels
    - Handle errors with 500 response
    - _Requirements: 7.2, 7.3, 7.4, 8.1, 8.2_

  - [x] 5.8 Create unified dashboard summary API route
    - Create file `app/api/analytics/dashboard/route.ts`
    - Implement GET handler with authentication check
    - Call all AnalyticsService methods in parallel
    - Return DashboardData object with all 7 indicators
    - Handle partial failures gracefully
    - _Requirements: 8.1, 8.2, 8.3, 10.6_

  - [ ]* 5.9 Write unit tests for API routes
    - Test authentication and authorization
    - Test successful data retrieval
    - Test error handling (500 responses)
    - Test empty states
    - Test data format validation

- [x] 6. Checkpoint - APIs ready
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Dashboard UI Components
  - [x] 7.1 Create dashboard page layout
    - Create file `app/portal/dashboard/page.tsx`
    - Implement responsive grid layout (2-3 columns desktop, 1 column mobile)
    - Fetch data from /api/analytics/dashboard
    - Implement loading states for all indicators
    - Implement error states with retry buttons
    - Pass data to indicator components
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.6, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 7.2 Create MediaViewsIndicator component
    - Create file `app/portal/dashboard/components/MediaViewsIndicator.tsx`
    - Use Shadcn UI Card, Table, Badge components
    - Display thumbnail (80x80px), filename (truncated), media type, view count
    - Implement empty state message
    - Sort by view_count descending
    - Limit to top 10 items
    - _Requirements: 1.2, 1.3, 1.5, 1.6, 1.7, 8.8_

  - [ ]* 7.3 Write property tests for MediaViewsIndicator
    - **Property 2: Filename Truncation** - Validates: Requirements 1.7
    - **Property 3: Descending Order by Count** - Validates: Requirements 1.3
    - **Property 10: Media Dashboard Display** - Validates: Requirements 1.2
    - **Property 11: Active Media Filtering** - Validates: Requirements 1.5

  - [x] 7.4 Create SocialClicksIndicator component
    - Create file `app/portal/dashboard/components/SocialClicksIndicator.tsx`
    - Use Shadcn UI Card, Table components
    - Reuse getSocialIcon() function from ExternalLinksDisplay
    - Display social network icon, name, click count
    - Implement empty state message
    - Sort by click_count descending
    - _Requirements: 2.2, 2.3, 8.8_

  - [ ]* 7.5 Write property tests for SocialClicksIndicator
    - **Property 3: Descending Order by Count** - Validates: Requirements 2.3
    - **Property 14: Social Dashboard Display** - Validates: Requirements 2.2

  - [x] 7.6 Create StoryViewsIndicator component
    - Create file `app/portal/dashboard/components/StoryViewsIndicator.tsx`
    - Use Shadcn UI Card, Table components
    - Display thumbnail (80x80px), filename (truncated), view count
    - Implement empty state message
    - Sort by view_count descending
    - Limit to top 10 items
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 8.8_

  - [ ]* 7.7 Write property tests for StoryViewsIndicator
    - **Property 2: Filename Truncation** - Validates: Requirements 3.5
    - **Property 3: Descending Order by Count** - Validates: Requirements 3.3
    - **Property 16: Story Dashboard Display** - Validates: Requirements 3.2

  - [x] 7.8 Create VisitsByDayIndicator component
    - Create file `app/portal/dashboard/components/VisitsByDayIndicator.tsx`
    - Use Shadcn UI Card, Chart (Recharts BarChart) components
    - Display bar chart with days of week on X-axis
    - Order days: Segunda (1), Terça (2), Quarta (3), Quinta (4), Sexta (5), Sábado (6), Domingo (0)
    - Show visit count on Y-axis
    - Implement empty state message
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 8.8_

  - [ ]* 7.9 Write property tests for VisitsByDayIndicator
    - **Property 18: Day of Week Display Order** - Validates: Requirements 4.3
    - **Property 19: Day of Week Visit Counts** - Validates: Requirements 4.5

  - [x] 7.10 Create BrazilMap component
    - Create file `app/portal/dashboard/components/BrazilMap.tsx`
    - Implement SVG map of Brazil with all 27 state paths
    - Calculate color scale based on visit counts (lighter to darker grayscale)
    - Implement hover tooltips using Shadcn UI Tooltip
    - Show state name and visit count on hover
    - Handle states with zero visits (gray-100 color)
    - _Requirements: 5.4, 5.5, 5.6, 11.2_

  - [ ]* 7.11 Write property tests for BrazilMap
    - **Property 5: State Color Intensity** - Validates: Requirements 5.5, 5.6
    - **Property 21: Map Tooltip Display** - Validates: Requirements 5.4

  - [x] 7.12 Create VisitsByStateIndicator component
    - Create file `app/portal/dashboard/components/VisitsByStateIndicator.tsx`
    - Use Shadcn UI Card component
    - Integrate BrazilMap component
    - Pass visitsByState data to map
    - Implement empty state message
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 8.8_

  - [x] 7.13 Create VisibilityRankIndicator component
    - Create file `app/portal/dashboard/components/VisibilityRankIndicator.tsx`
    - Use Shadcn UI Card, Badge components
    - Display percentile category (Top 10%, Top 20%, Top 30%, Below 30%)
    - Display motivational message based on category
    - Do NOT show exact rank number or other profile data
    - Implement empty state message
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 8.8_

  - [ ]* 7.14 Write property tests for VisibilityRankIndicator
    - **Property 25: Privacy - No Other Profile Data** - Validates: Requirements 6.4
    - **Property 26: Privacy - No Exact Rank** - Validates: Requirements 6.5

  - [x] 7.15 Create ContactChannelsIndicator component
    - Create file `app/portal/dashboard/components/ContactChannelsIndicator.tsx`
    - Use Shadcn UI Card, Table components
    - Display channel name (WhatsApp, Telegram) and contact count
    - Show only enabled channels
    - Implement empty state message
    - _Requirements: 7.2, 7.3, 7.4, 8.8_

  - [ ]* 7.16 Write property tests for ContactChannelsIndicator
    - **Property 28: Enabled Channels Only** - Validates: Requirements 7.4
    - **Property 29: All Historical Contacts** - Validates: Requirements 7.6

  - [x] 7.17 Add Dashboard link to sidebar navigation
    - Update sidebar navigation component
    - Add "Dashboard" link pointing to /portal/dashboard
    - Use appropriate icon (e.g., chart or analytics icon)
    - Position after main profile sections
    - _Requirements: 8.7_

  - [ ]* 7.18 Write component tests for dashboard UI
    - Test dashboard page loading and error states
    - Test all indicator components with mock data
    - Test empty states for all indicators
    - Test responsive layout
    - Test loading states display correctly

- [x] 8. Checkpoint - Dashboard UI complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Property-Based Testing Implementation
  - [ ] 9.1 Write property tests for tracking and events
    - Create file `__tests__/analytics/properties/tracking.property.test.ts`
    - Implement Property 9: Media View Tracking
    - Implement Property 13: Social Click Tracking
    - Implement Property 15: Story View Tracking
    - Implement Property 31: Silent Tracking Failures
    - Implement Property 32: Async Tracking
    - Implement Property 33: Required Field Validation
    - Implement Property 34: Missing Data Error Logging
    - Use fast-check with 100+ iterations per property
    - _Requirements: 1.1, 2.1, 3.1, 9.1, 9.2, 9.5, 9.6_

  - [ ] 9.2 Write property tests for dashboard data display
    - Create file `__tests__/analytics/properties/dashboard.property.test.ts`
    - Implement Property 1: Thumbnail Dimensions
    - Implement Property 2: Filename Truncation
    - Implement Property 3: Descending Order by Count
    - Implement Property 4: Historical Data Persistence
    - Implement Property 10: Media Dashboard Display
    - Implement Property 11: Active Media Filtering
    - Implement Property 14: Social Dashboard Display
    - Implement Property 16: Story Dashboard Display
    - Implement Property 18: Day of Week Display Order
    - Implement Property 19: Day of Week Visit Counts
    - Implement Property 30: Empty State Display
    - Use fast-check with 100+ iterations per property
    - _Requirements: 1.2, 1.3, 1.5, 1.6, 1.7, 2.2, 2.3, 2.5, 3.2, 3.3, 3.4, 3.5, 3.6, 4.3, 4.5, 7.5, 8.8_

  - [ ] 9.3 Write property tests for geolocation
    - Create file `__tests__/analytics/properties/geolocation.property.test.ts`
    - Implement Property 5: State Color Intensity
    - Implement Property 6: 90-Day Time Window
    - Implement Property 7: State Storage in Metadata
    - Implement Property 20: IP to State Mapping
    - Implement Property 21: Map Tooltip Display
    - Implement Property 22: Geolocation Error Handling
    - Implement Property 38: Brazilian State Domain
    - Implement Property 39: International IP Handling
    - Implement Property 40: Geolocation Service Failure
    - Implement Property 41: IP Geolocation Caching
    - Use fast-check with 100+ iterations per property
    - _Requirements: 4.4, 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 11.2, 11.3, 11.4, 11.5, 11.7_

  - [ ] 9.4 Write property tests for visibility rank and privacy
    - Create file `__tests__/analytics/properties/rank-privacy.property.test.ts`
    - Implement Property 23: Percentile Calculation
    - Implement Property 24: Rank Categorization
    - Implement Property 25: Privacy - No Other Profile Data
    - Implement Property 26: Privacy - No Exact Rank
    - Use fast-check with 100+ iterations per property
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [ ] 9.5 Write property tests for contact channels and data integrity
    - Create file `__tests__/analytics/properties/data-integrity.property.test.ts`
    - Implement Property 8: Event Data Completeness
    - Implement Property 12: Media Deletion Cascade
    - Implement Property 17: Day of Week Aggregation
    - Implement Property 27: Contact Channel Grouping
    - Implement Property 28: Enabled Channels Only
    - Implement Property 29: All Historical Contacts
    - Implement Property 42: Event Metadata Structure
    - Implement Property 43: Data Retention Policy
    - Implement Property 44: Referential Integrity
    - Use fast-check with 100+ iterations per property
    - _Requirements: 1.4, 4.1, 7.2, 7.4, 7.6, 9.3, 9.4, 12.2, 12.5, 12.7_

  - [ ] 9.6 Write property tests for serialization and performance
    - Create file `__tests__/analytics/properties/serialization.property.test.ts`
    - Implement Property 35: Loading States
    - Implement Property 36: Independent Indicator Loading
    - Implement Property 37: Slow Query Logging
    - Implement Property 45: Event Parsing
    - Implement Property 46: Invalid Event Error
    - Implement Property 47: Event Serialization
    - Implement Property 48: Serialization Round Trip
    - Implement Property 49: Required Field Validation in Parser
    - Implement Property 50: Event Type Metadata Validation
    - Implement Property 51: ISO 8601 Timestamp Format
    - Use fast-check with 100+ iterations per property
    - _Requirements: 10.5, 10.6, 10.7, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [ ] 10. Final checkpoint - All tests passing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Implementation follows incremental approach: database → services → tracking → APIs → UI → tests
- All tracking is async and non-blocking to ensure visitor experience is not impacted
- Dashboard indicators load independently for better UX
- Property-based tests validate universal correctness properties across all inputs
- Unit tests complement property tests with specific examples and edge cases
