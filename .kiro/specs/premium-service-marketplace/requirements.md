# Requirements Document

## Introduction

This document specifies the requirements for a premium service marketplace web application. The system enables service providers to create and manage public profiles with subscription-based tiers, allows end users to discover and contact providers through a searchable catalog, and provides administrators with moderation and reporting tools. The marketplace uses a freemium model with paid subscriptions (Premium, Black) and optional paid boost features to increase profile visibility.

## Glossary

- **System**: The premium service marketplace web application
- **Provider**: A registered user who creates and manages a service profile
- **Visitor**: An unauthenticated user browsing the public catalog
- **Admin**: A user with administrative privileges to moderate content and manage reports
- **Moderator**: A user with limited administrative privileges to review reports
- **Profile**: A public listing of a provider's services, media, and contact information
- **Catalog**: The public searchable directory of published profiles
- **Boost**: A paid feature that promotes a profile to the top of catalog results for 2 hours
- **Boost_Context**: A combination of geographic region and category used to limit concurrent boosts
- **Subscription**: A recurring payment plan (Free, Premium, or Black) that determines profile features
- **Onboarding**: The mandatory process after first login to collect phone number and accept terms
- **Report**: A user-submitted complaint about a profile
- **Audit_Log**: A record of administrative actions performed in the system
- **Analytics_Event**: A tracked user interaction (profile visit or contact button click)
- **Media_Slot**: An allocated space for uploading photos or videos based on subscription tier
- **Slug**: A unique URL-friendly identifier for a profile
- **Approximate_Location**: A privacy-preserving geographic representation showing neighborhood-level area
- **RLS**: Row Level Security policies in the database
- **Stripe_Webhook**: An HTTP callback from Stripe to sync payment and subscription events

## Requirements

### Requirement 1: User Authentication

**User Story:** As a provider, I want to authenticate using my Google account, so that I can access the platform securely without managing passwords.

#### Acceptance Criteria

1. THE System SHALL provide Google OAuth authentication via Supabase Auth
2. WHEN a user successfully authenticates for the first time, THE System SHALL redirect the user to the onboarding flow
3. WHEN a user successfully authenticates after completing onboarding, THE System SHALL redirect the user to the provider portal
4. THE System SHALL store the user's email, name, and avatar URL from the Google OAuth response

### Requirement 2: Mandatory Onboarding

**User Story:** As a platform administrator, I want all new users to complete onboarding before accessing the provider portal, so that we have verified contact information and legal acceptance.

#### Acceptance Criteria

1. WHEN a user has not completed onboarding, THE System SHALL block access to the provider portal
2. WHEN a user has not completed onboarding, THE System SHALL display the onboarding form
3. THE Onboarding_Form SHALL collect a phone number from the user
4. THE Onboarding_Form SHALL send a verification code to the provided phone number
5. WHEN the user submits a valid verification code, THE System SHALL mark the phone number as verified
6. THE Onboarding_Form SHALL require the user to accept terms and conditions
7. WHEN the user accepts terms and submits a valid verification code, THE System SHALL mark onboarding as complete
8. WHEN onboarding is complete, THE System SHALL grant access to the provider portal
9. THE System SHALL store the phone verification timestamp and terms acceptance timestamp

### Requirement 3: Profile Creation and Management

**User Story:** As a provider, I want to create and edit my service profile, so that potential clients can discover and contact me.

#### Acceptance Criteria

1. WHEN a provider accesses the profile editor, THE System SHALL display a form with fields for display name, slug, category, short description, long description, and external links
2. THE System SHALL validate that the slug is unique across all profiles
3. WHEN a provider attempts to change their slug, THE System SHALL check if 90 days have elapsed since the last slug change
4. IF less than 90 days have elapsed since the last slug change, THEN THE System SHALL reject the slug change and display the next available change date
5. THE System SHALL allow providers to select multiple features from predefined feature groups
6. THE System SHALL save profile changes to the database with an updated timestamp
7. THE System SHALL enforce that only the profile owner can edit their own profile
8. WHEN a provider saves profile changes, THE System SHALL validate all required fields are present

### Requirement 4: Availability Schedule Management

**User Story:** As a provider, I want to set my availability schedule by weekday and time ranges, so that clients know when I am available.

#### Acceptance Criteria

1. THE System SHALL allow providers to configure availability for each weekday
2. THE System SHALL allow providers to add multiple time ranges per weekday
3. THE System SHALL allow providers to mark specific weekdays as unavailable
4. WHEN a provider saves availability changes, THE System SHALL validate that start times are before end times
5. THE System SHALL display the provider's availability schedule on their public profile page

### Requirement 5: Media Upload and Management

**User Story:** As a provider, I want to upload photos and videos to my profile, so that I can showcase my services visually.

#### Acceptance Criteria

1. THE System SHALL limit the number of photos a provider can upload based on their subscription plan
2. THE System SHALL limit the number of videos a provider can upload based on their subscription plan
3. WHEN a provider uploads media, THE System SHALL generate a signed URL for secure upload to Supabase Storage
4. WHEN a provider uploads media, THE System SHALL validate file type and size on the server
5. THE System SHALL allow providers to designate one photo as the cover image
6. THE System SHALL allow providers to reorder media items by changing sort order
7. THE System SHALL allow providers to delete media items
8. WHEN a provider attempts to upload media exceeding their plan limits, THE System SHALL reject the upload and display the current limit

### Requirement 6: Subscription Plan Management

**User Story:** As a provider, I want to subscribe to Premium or Black plans, so that I can access additional features and media slots.

#### Acceptance Criteria

1. THE System SHALL define three subscription tiers: Free, Premium, and Black
2. THE System SHALL configure each plan with maximum photo and video limits
3. WHEN a provider selects a paid plan, THE System SHALL create a Stripe Checkout session
4. WHEN a Stripe Checkout session completes successfully, THE System SHALL create or update the subscription record
5. THE System SHALL store the Stripe customer ID and subscription ID for each provider
6. THE System SHALL display the provider's current plan and limits in the provider portal
7. THE System SHALL provide a link to the Stripe customer portal for subscription management
8. WHEN a provider downgrades their plan, THE System SHALL enforce the new media limits on their next upload attempt

### Requirement 7: Subscription Webhook Processing

**User Story:** As a platform administrator, I want the system to automatically sync subscription status from Stripe, so that provider access reflects their current payment status.

#### Acceptance Criteria

1. WHEN a checkout.session.completed webhook is received, THE System SHALL create or update the subscription record with the plan code and status
2. WHEN a customer.subscription.updated webhook is received, THE System SHALL update the subscription status and current period end date
3. WHEN a customer.subscription.deleted webhook is received, THE System SHALL set the subscription status to canceled
4. WHEN an invoice.payment_failed webhook is received, THE System SHALL set the subscription status to past_due
5. THE System SHALL verify the Stripe webhook signature before processing events
6. IF webhook signature verification fails, THEN THE System SHALL reject the webhook and log the attempt

### Requirement 8: Profile Publishing Rules

**User Story:** As a platform administrator, I want profiles to be automatically published only when onboarding and subscription requirements are met, so that the catalog maintains quality standards.

#### Acceptance Criteria

1. WHEN a provider completes onboarding AND has a valid subscription, THE System SHALL set the profile status to published
2. WHEN a provider's subscription becomes invalid, THE System SHALL set the profile status to unpublished
3. WHERE a provider has a Free tier subscription, THE System SHALL allow profile publishing after onboarding completion
4. THE System SHALL exclude unpublished profiles from the public catalog
5. THE System SHALL display profile status in the provider portal

### Requirement 9: Public Catalog Search and Filtering

**User Story:** As a visitor, I want to search and filter the catalog of service providers, so that I can find providers matching my needs.

#### Acceptance Criteria

1. THE Catalog SHALL display only profiles with published status
2. THE System SHALL provide a search input that filters profiles by display name and description
3. THE System SHALL provide basic filters for category, city, and region
4. THE System SHALL provide an advanced filters modal for feature selection
5. WHEN filters are applied, THE System SHALL return only profiles matching all selected criteria
6. THE System SHALL display profile cards in a responsive grid layout
7. THE Profile_Card SHALL display cover image, display name, short description, age attribute, city, region, online status timestamp, and tier badge

### Requirement 10: Boosted Profiles Section

**User Story:** As a visitor, I want to see promoted profiles at the top of search results, so that I can discover featured providers.

#### Acceptance Criteria

1. WHEN the catalog is displayed, THE System SHALL show a boosted section at the top with up to 15 active boosted profiles
2. WHEN filters are applied, THE Boosted_Section SHALL display only boosted profiles matching the filter criteria
3. WHEN no filters are applied, THE System SHALL order boosted profiles by soonest expiring boost to latest expiring boost
4. WHEN filters are applied, THE System SHALL order boosted profiles by soonest expiring boost to latest expiring boost within the filtered set
5. THE System SHALL display a visual indicator on boosted profile cards
6. THE System SHALL exclude expired boosts from the boosted section

### Requirement 11: Catalog Sorting and Pagination

**User Story:** As a visitor, I want to see relevant results below the boosted section, so that I can browse all available providers.

#### Acceptance Criteria

1. THE System SHALL display non-boosted profiles below the boosted section
2. THE System SHALL order non-boosted profiles by most recently updated first
3. THE System SHALL paginate catalog results with a configurable page size
4. THE System SHALL provide a "Show all results" pagination control
5. WHEN a visitor navigates to the next page, THE System SHALL load the next set of results

### Requirement 12: Public Profile Page

**User Story:** As a visitor, I want to view detailed information about a provider, so that I can decide whether to contact them.

#### Acceptance Criteria

1. WHEN a visitor accesses a profile page, THE System SHALL display the provider's display name, descriptions, category, and media gallery
2. THE System SHALL display contact buttons with external links configured by the provider
3. THE System SHALL display a pricing table with package information configured by the provider
4. THE System SHALL display the provider's availability schedule
5. THE System SHALL display an approximate location map showing neighborhood-level area
6. THE System SHALL display external links configured by the provider
7. THE System SHALL provide a report button for visitors to submit complaints
8. THE System SHALL NOT display the provider's phone number on the public profile

### Requirement 13: Privacy-Preserving Location Display

**User Story:** As a provider, I want my exact location to remain private while still showing my general area, so that I can protect my privacy while being discoverable.

#### Acceptance Criteria

1. WHEN a provider sets their location, THE System SHALL store an approximate location using a truncated geohash
2. THE System SHALL display the approximate location on the public profile page as a neighborhood-level area
3. THE System SHALL NOT display the provider's exact address on the public profile
4. THE System SHALL use the approximate location for geographic filtering in the catalog

### Requirement 14: Analytics Event Tracking

**User Story:** As a provider, I want to track how many visitors view my profile and click my contact buttons, so that I can measure my profile's performance.

#### Acceptance Criteria

1. WHEN a visitor views a profile page, THE System SHALL record a visit analytics event with the profile ID and timestamp
2. WHEN a visitor clicks a contact button, THE System SHALL record a click analytics event with the profile ID, contact method, and timestamp
3. THE System SHALL display visit counts for today, 7 days, 30 days, and 12 months in the provider portal
4. THE System SHALL display click counts by contact method in the provider portal
5. THE System SHALL aggregate analytics events efficiently for dashboard display

### Requirement 15: Boost Purchase and Scheduling

**User Story:** As a provider, I want to purchase boost credits to promote my profile at specific times, so that I can increase my visibility during peak hours.

#### Acceptance Criteria

1. THE System SHALL allow providers to purchase boost credits via Stripe one-off payment
2. WHEN a provider purchases a boost, THE System SHALL create a Stripe Checkout session for the boost amount
3. THE System SHALL allow providers to select a 2-hour time window for their boost
4. WHEN a provider selects a time window, THE System SHALL check boost capacity for that window and context
5. THE System SHALL define boost context as a combination of city/region and category
6. THE System SHALL limit concurrent active boosts to 15 per boost context
7. IF capacity is full for the selected time window, THEN THE System SHALL display the next available time slots
8. WHEN a boost purchase completes successfully, THE System SHALL create a boost record with start time, end time, and scheduled status
9. WHEN the boost start time arrives, THE System SHALL set the boost status to active
10. WHEN the boost end time passes, THE System SHALL set the boost status to expired

### Requirement 16: Boost Webhook Processing

**User Story:** As a platform administrator, I want the system to automatically activate boosts when payment is confirmed, so that providers receive their purchased promotion.

#### Acceptance Criteria

1. WHEN a checkout.session.completed webhook is received for a boost payment, THE System SHALL update the boost record with the payment intent ID and confirm the boost
2. THE System SHALL verify that the boost time window still has available capacity before confirming
3. IF capacity is no longer available, THEN THE System SHALL refund the payment and notify the provider
4. THE System SHALL verify the Stripe webhook signature before processing boost payments

### Requirement 17: Report Submission

**User Story:** As a visitor, I want to report inappropriate profiles, so that the platform maintains quality and safety standards.

#### Acceptance Criteria

1. THE System SHALL provide a report button on each public profile page
2. WHEN a visitor clicks the report button, THE System SHALL display a report form with reason selection and details field
3. THE System SHALL allow anonymous report submission using a browser fingerprint
4. THE System SHALL allow authenticated users to submit reports with their user ID
5. WHEN a report is submitted, THE System SHALL create a report record with status "new"
6. THE System SHALL rate limit report submissions to prevent abuse
7. THE System SHALL validate that the reason and details fields are not empty

### Requirement 18: Report Review Workflow

**User Story:** As an admin or moderator, I want to review and manage submitted reports, so that I can take appropriate action on problematic profiles.

#### Acceptance Criteria

1. THE System SHALL display a list of all reports in the admin backoffice
2. THE System SHALL allow admins and moderators to filter reports by status
3. WHEN an admin or moderator views a report, THE System SHALL display the reported profile, reason, details, and submission timestamp
4. THE System SHALL allow admins and moderators to change report status to under_review, resolved, or dismissed
5. THE System SHALL allow admins to unpublish a profile from the report detail view
6. THE System SHALL allow admins to suspend a user account from the report detail view
7. THE System SHALL allow admins to ban a user account from the report detail view
8. WHEN an admin takes action on a report, THE System SHALL create an audit log entry

### Requirement 19: Role-Based Access Control

**User Story:** As a platform administrator, I want to restrict admin features to authorized users, so that only trusted personnel can moderate content.

#### Acceptance Criteria

1. THE System SHALL define three user roles: provider, moderator, and admin
2. THE System SHALL restrict access to the admin backoffice to users with moderator or admin roles
3. THE System SHALL restrict profile unpublish, user suspend, and user ban actions to users with admin role
4. THE System SHALL allow moderators to view and update report status only
5. WHEN an unauthorized user attempts to access admin routes, THE System SHALL return a 403 Forbidden response
6. THE System SHALL enforce role-based access control using middleware on all admin routes

### Requirement 20: Audit Logging

**User Story:** As a platform administrator, I want to track all administrative actions, so that I can maintain accountability and investigate issues.

#### Acceptance Criteria

1. WHEN an admin unpublishes a profile, THE System SHALL create an audit log entry with the actor, action, profile ID, and timestamp
2. WHEN an admin suspends a user, THE System SHALL create an audit log entry with the actor, action, user ID, and timestamp
3. WHEN an admin bans a user, THE System SHALL create an audit log entry with the actor, action, user ID, and timestamp
4. WHEN an admin or moderator updates a report status, THE System SHALL create an audit log entry with the actor, action, report ID, and timestamp
5. THE System SHALL store additional context in the audit log metadata field as JSON
6. THE System SHALL display audit logs in the admin backoffice with filtering by action type and date range

### Requirement 21: Row Level Security Policies

**User Story:** As a platform administrator, I want database-level security policies to prevent unauthorized data access, so that providers can only modify their own profiles.

#### Acceptance Criteria

1. THE System SHALL implement RLS policies that allow providers to read and update only their own profile
2. THE System SHALL implement RLS policies that allow providers to insert, read, update, and delete only their own media
3. THE System SHALL implement RLS policies that allow providers to insert, read, update, and delete only their own availability records
4. THE System SHALL implement RLS policies that allow admins to read and update all profiles
5. THE System SHALL implement RLS policies that allow all authenticated users to read published profiles
6. THE System SHALL implement RLS policies that allow anonymous users to read published profiles

### Requirement 22: Rate Limiting

**User Story:** As a platform administrator, I want to rate limit sensitive operations, so that the system is protected from abuse and excessive load.

#### Acceptance Criteria

1. THE System SHALL rate limit catalog search requests to 60 requests per minute per IP address
2. THE System SHALL rate limit report submissions to 5 submissions per hour per browser fingerprint
3. THE System SHALL rate limit boost slot availability checks to 30 requests per minute per authenticated user
4. WHEN a rate limit is exceeded, THE System SHALL return a 429 Too Many Requests response
5. THE System SHALL include a Retry-After header in rate limit responses

### Requirement 23: File Upload Security

**User Story:** As a platform administrator, I want secure file uploads with validation, so that malicious files cannot be uploaded to the system.

#### Acceptance Criteria

1. WHEN a provider requests to upload media, THE System SHALL generate a signed URL with expiration time
2. THE System SHALL validate file type on the server to allow only image and video formats
3. THE System SHALL validate file size on the server to enforce maximum limits
4. THE System SHALL reject uploads that fail validation and return a descriptive error message
5. THE System SHALL store uploaded files in Supabase Storage with access control policies

### Requirement 24: Provider Performance Dashboard

**User Story:** As a provider, I want to see my profile performance metrics, so that I can understand my visibility and engagement.

#### Acceptance Criteria

1. THE System SHALL display visitor counts for today, 7 days, 30 days, and 12 months
2. THE System SHALL display contact button click counts grouped by contact method
3. THE System SHALL display the provider's current subscription plan and limits
4. THE System SHALL display the number of available boost credits
5. THE System SHALL display the provider's active and scheduled boosts with time windows

### Requirement 25: Database Schema and Migrations

**User Story:** As a developer, I want a well-defined database schema with migrations, so that the data model is consistent and versionable.

#### Acceptance Criteria

1. THE System SHALL define tables for users, profiles, media, availability, features, profile_features, plans, subscriptions, boosts, reports, audit_logs, and analytics_events
2. THE System SHALL define foreign key relationships between related tables
3. THE System SHALL define appropriate indexes for query performance
4. THE System SHALL provide SQL migration scripts to create the schema
5. THE System SHALL provide seed data for feature groups and subscription plans

### Requirement 26: Configuration Parser and Validator

**User Story:** As a developer, I want to parse and validate configuration files for subscription plans and feature definitions, so that the system can be configured without code changes.

#### Acceptance Criteria

1. WHEN the system starts, THE Config_Parser SHALL parse the subscription plans configuration file
2. WHEN the system starts, THE Config_Parser SHALL parse the feature definitions configuration file
3. IF a configuration file is invalid, THEN THE Config_Parser SHALL return a descriptive error with line and column information
4. THE Config_Validator SHALL verify that all required fields are present in plan configurations
5. THE Config_Validator SHALL verify that media limits are positive integers
6. THE Pretty_Printer SHALL format plan and feature configuration objects back into valid configuration files
7. FOR ALL valid configuration objects, parsing then printing then parsing SHALL produce an equivalent object

