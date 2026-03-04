# Tasks

## 1. Database Setup
- [x] 1.1 Create profile_verifications table with schema
- [x] 1.2 Create verification_audit_log table
- [x] 1.3 Create database indexes
- [x] 1.4 Create RLS policies
- [ ] 1.5 Create Supabase Storage bucket (verification-images, private)

## 2. Backend Services
- [x] 2.1 Create verification.service.ts with core business logic
- [x] 2.2 Create image-validation.service.ts for image processing
- [ ] 2.3 Create notification.service.ts for email notifications
- [ ] 2.4 Add rate limiting logic to rate-limiter.ts

## 3. API Endpoints - User
- [x] 3.1 Create POST /api/verification/submit endpoint
- [x] 3.2 Create GET /api/verification/status endpoint
- [x] 3.3 Create GET /api/verification/badge/[profileId] endpoint

## 4. API Endpoints - Admin
- [x] 4.1 Create GET /api/verification/admin/pending endpoint
- [x] 4.2 Create POST /api/verification/admin/review endpoint

## 5. API Endpoints - Cron
- [x] 5.1 Create POST /api/cron/expire-verifications endpoint
- [ ] 5.2 Create POST /api/cron/send-expiry-reminders endpoint
- [x] 5.3 Configure vercel.json with cron schedules

## 6. Frontend Components - Verification
- [x] 6.1 Create VerificationSubmitForm component
- [x] 6.2 Create VerificationStatusCard component
- [x] 6.3 Create VerificationBadge component
- [x] 6.4 Create verification portal page at /portal/verification

## 7. Frontend Components - Admin
- [x] 7.1 Create AdminVerificationReview component
- [x] 7.2 Create admin verification page at /admin/verification

## 8. Integration - Badge Display
- [x] 8.1 Integrate VerificationBadge into ProfileCard (catalog)
- [x] 8.2 Integrate VerificationBadge into ProfileModal
- [x] 8.3 Integrate VerificationBadge into PublicProfileClient

## 9. Portal Navigation
- [x] 9.1 Add "Verificação de Perfil" menu item to portal layout
- [x] 9.2 Add notification badge if action needed

## 10. Testing
- [ ] 10.1 Test verification submission flow
- [ ] 10.2 Test admin review flow
- [ ] 10.3 Test badge display in all locations
- [ ] 10.4 Test expiry cron job
- [ ] 10.5 Test rate limiting
- [ ] 10.6 Test email notifications

## 11. Documentation
- [ ] 11.1 Update README with verification feature
- [ ] 11.2 Create admin guide for reviewing verifications
