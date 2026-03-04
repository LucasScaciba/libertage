# Implementation Plan: Phone Validation After Login

## Overview

This implementation plan breaks down the phone validation feature into discrete coding tasks. The feature requires integrating Twilio Verify API for OTP delivery, implementing rate limiting and cooldown mechanisms, securing phone numbers with encryption, and creating an accessible UI for phone validation. Each task builds incrementally, with checkpoints to ensure stability before proceeding.

## Tasks

- [x] 1. Database schema setup and migrations
  - [x] 1.1 Create database migration for phone validation columns
    - Add columns: phone_security (encrypted text), phone_public (text), phone_verified_at (timestamp), phone_attempts_today (integer), phone_last_attempt_at (timestamp)
    - Create indexes on phone_verified_at and phone_attempts_today for query performance
    - Create database function increment_phone_attempts for atomic counter updates
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 1.2 Configure Supabase encryption for phone_security field
    - Enable pgsodium extension if not already enabled
    - Create encryption key in Supabase Vault named 'phone_encryption_key'
    - Test encryption/decryption functionality
    - _Requirements: 6.1_
  
  - [x] 1.3 Create Row Level Security (RLS) policies for phone validation
    - Create policy: Users can read own phone validation status
    - Create policy: Users can update own phone validation fields
    - Test policies with different user contexts
    - _Requirements: 6.3, 6.4_
  
  - [ ]* 1.4 Write property test for encryption round trip
    - **Property 8: Phone encryption round trip preserves value**
    - **Validates: Requirements 6.1, 6.5**

- [x] 2. Core services implementation
  - [x] 2.1 Implement phone encryption service
    - Create PhoneEncryption class in lib/services/phone-encryption.ts
    - Implement encrypt() method using Supabase pgsodium
    - Implement decrypt() method using Supabase pgsodium
    - Handle encryption errors gracefully
    - _Requirements: 6.1, 6.5_
  
  - [x] 2.2 Implement rate limiter service
    - Create RateLimiter class in lib/services/rate-limiter.ts
    - Implement checkAttemptLimit() to verify daily attempt count
    - Implement checkCooldown() to verify 60-second cooldown
    - Implement incrementAttempts() to update phone_attempts_today
    - Implement updateLastAttempt() to update phone_last_attempt_at
    - Implement resetDailyAttempts() for daily reset functionality
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 5.1, 5.2_
  
  - [ ]* 2.3 Write property tests for rate limiter
    - **Property 4: Failed verification increments attempt counter**
    - **Validates: Requirements 3.5, 4.1, 4.2, 4.6**
    - **Property 5: Cooldown prevents rapid OTP requests**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - **Property 6: Rate limit blocks excessive attempts**
    - **Validates: Requirements 4.3**
    - **Property 7: Daily reset clears attempt counter**
    - **Validates: Requirements 4.5**
  
  - [x] 2.4 Implement OTP service with Twilio integration
    - Create OTPService class in lib/services/otp-service.ts
    - Configure Twilio client with account SID, auth token, and verify service SID
    - Implement sendOTP() using Twilio Verify API create verification endpoint
    - Implement verifyOTP() using Twilio Verify API verification checks endpoint
    - Map Twilio error codes to user-friendly messages (20429, 21211, 21608, 60200, 60202, 60203, 60205)
    - Add logging for all Twilio API interactions
    - _Requirements: 2.1, 2.2, 3.1, 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 2.5 Write property tests for OTP service
    - **Property 12: Twilio error codes map to user-friendly messages**
    - **Validates: Requirements 2.5, 11.3, 11.4**
    - **Property 16: OTP service correctly calls Twilio Verify API**
    - **Validates: Requirements 2.1, 3.1**
    - **Property 17: API logs all Twilio interactions**
    - **Validates: Requirements 11.5**

- [ ] 3. Checkpoint - Ensure core services work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Phone validation input validation and utilities
  - [x] 4.1 Create phone number validation utilities
    - Create validation functions in lib/utils/phone-validation.ts
    - Implement validateE164Format() using regex /^\+[1-9]\d{1,14}$/
    - Implement sanitizePhoneNumber() to strip whitespace and formatting characters
    - Create Zod schemas for phone number and OTP validation
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 4.2 Write property tests for phone validation
    - **Property 10: Phone format validation accepts only E.164**
    - **Validates: Requirements 8.1, 8.3**
    - **Property 11: Phone input sanitization normalizes format**
    - **Validates: Requirements 8.4**

- [x] 5. API endpoints implementation
  - [x] 5.1 Create POST /api/phone-validation/send-otp endpoint
    - Create route handler in app/api/phone-validation/send-otp/route.ts
    - Validate user authentication using Supabase session
    - Validate phone number format using Zod schema
    - Check rate limit using RateLimiter.checkAttemptLimit()
    - Check cooldown using RateLimiter.checkCooldown()
    - Send OTP using OTPService.sendOTP()
    - Update phone_last_attempt_at using RateLimiter.updateLastAttempt()
    - Return appropriate success/error responses with status codes
    - _Requirements: 2.1, 2.2, 2.3, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2_
  
  - [x] 5.2 Create POST /api/phone-validation/verify-otp endpoint
    - Create route handler in app/api/phone-validation/verify-otp/route.ts
    - Validate user authentication using Supabase session
    - Validate OTP format using Zod schema
    - Check rate limit using RateLimiter.checkAttemptLimit()
    - Verify OTP using OTPService.verifyOTP()
    - On failure: increment attempts using RateLimiter.incrementAttempts()
    - On success: encrypt phone using PhoneEncryption.encrypt()
    - On success: update phone_security, phone_public, phone_verified_at, reset phone_attempts_today
    - Return appropriate success/error responses
    - _Requirements: 1.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.3, 6.1, 6.2_
  
  - [x] 5.3 Create GET /api/phone-validation/status endpoint
    - Create route handler in app/api/phone-validation/status/route.ts
    - Validate user authentication
    - Query user's phone_verified_at, phone_attempts_today, phone_last_attempt_at
    - Calculate cooldown seconds remaining
    - Return validation status and rate limit information
    - _Requirements: 4.1, 4.2, 5.1_
  
  - [ ]* 5.4 Write unit tests for API endpoints
    - Test send-otp endpoint with valid phone number
    - Test send-otp endpoint with invalid phone format
    - Test send-otp endpoint with active cooldown
    - Test send-otp endpoint with rate limit exceeded
    - Test verify-otp endpoint with valid OTP
    - Test verify-otp endpoint with invalid OTP
    - Test verify-otp endpoint with expired OTP
    - Test verify-otp endpoint with rate limit exceeded
    - Test status endpoint returns correct information
    - _Requirements: 2.5, 3.6, 3.7, 4.4, 5.4_
  
  - [ ]* 5.5 Write property test for API security
    - **Property 9: Encrypted phone never exposed in API responses**
    - **Validates: Requirements 6.3, 6.4**

- [x] 6. Authentication middleware implementation
  - [x] 6.1 Update middleware to enforce phone validation
    - Modify middleware.ts to check phone_verified_at for authenticated users
    - Redirect to /phone-validation if phone_verified_at is null and user accesses /portal routes
    - Allow access to /phone-validation route without phone verification
    - Maintain existing authentication checks
    - _Requirements: 1.1, 1.2, 1.5, 10.1, 10.2_
  
  - [ ]* 6.2 Write property tests for middleware
    - **Property 1: Unverified users are redirected to validation**
    - **Validates: Requirements 1.1, 1.2, 1.5**
    - **Property 13: Session persists during validation flow**
    - **Validates: Requirements 10.1, 10.2, 10.4**
  
  - [ ]* 6.3 Write unit tests for middleware redirect logic
    - Test authenticated user with null phone_verified_at accessing /portal redirects to /phone-validation
    - Test authenticated user with phone_verified_at accessing /portal is allowed
    - Test unauthenticated user accessing /portal redirects to /login
    - Test authenticated user accessing /phone-validation is allowed
    - _Requirements: 1.1, 1.2, 1.5_

- [ ] 7. Checkpoint - Ensure backend functionality is complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Phone validation UI components
  - [x] 8.1 Create phone input form component
    - Create PhoneInputForm component in app/phone-validation/components/PhoneInputForm.tsx
    - Add phone number input field with E.164 format placeholder (+55...)
    - Add ARIA labels for accessibility (aria-label="Número de telefone")
    - Implement client-side validation using validateE164Format()
    - Display validation errors below input field
    - Add "Enviar código" button, disabled when phone invalid
    - Implement loading state during OTP send
    - _Requirements: 8.1, 8.2, 8.5, 12.1, 12.2_
  
  - [x] 8.2 Create OTP input form component
    - Create OTPInputForm component in app/phone-validation/components/OTPInputForm.tsx
    - Add 6-digit OTP input field with numeric keyboard on mobile
    - Add ARIA labels for accessibility (aria-label="Código de verificação")
    - Implement auto-focus after OTP sent successfully
    - Add "Verificar" button
    - Implement loading state during verification
    - _Requirements: 3.1, 12.2, 12.6_
  
  - [x] 8.3 Create resend button component with cooldown
    - Create ResendButton component in app/phone-validation/components/ResendButton.tsx
    - Display "Reenviar código" button
    - Show cooldown timer when cooldown active ("Aguarde X segundos")
    - Disable button during cooldown
    - Enable button after 60 seconds elapsed
    - _Requirements: 5.3, 5.4_
  
  - [x] 8.4 Create error message component with ARIA live regions
    - Create ErrorMessage component in app/phone-validation/components/ErrorMessage.tsx
    - Add ARIA live region (aria-live="polite")
    - Display error messages with appropriate styling
    - Support different error types (validation, rate limit, cooldown, service)
    - _Requirements: 12.3_
  
  - [x] 8.5 Create loading indicator component
    - Create LoadingIndicator component in app/phone-validation/components/LoadingIndicator.tsx
    - Display spinner or progress indicator
    - Add ARIA label (aria-label="Carregando")
    - Show during async operations
    - _Requirements: 12.4_

- [x] 9. Phone validation page implementation
  - [x] 9.1 Create phone validation page with complete flow
    - Create page component in app/phone-validation/page.tsx
    - Implement ValidationState interface for state management
    - Integrate PhoneInputForm, OTPInputForm, ResendButton, ErrorMessage, LoadingIndicator
    - Implement handleSendOTP() to call /api/phone-validation/send-otp
    - Implement handleVerifyOTP() to call /api/phone-validation/verify-otp
    - Implement handleResend() with cooldown check
    - Display success message after OTP sent ("Código enviado para [phone number]")
    - Redirect to /portal after successful verification
    - Handle all error scenarios with appropriate messages
    - _Requirements: 1.1, 2.5, 3.6, 3.7, 4.4, 5.3, 12.1, 12.5_
  
  - [x] 9.2 Implement keyboard navigation support
    - Ensure all interactive elements are keyboard accessible
    - Test Tab navigation through form fields
    - Test Enter key submission
    - Test Escape key to clear errors
    - _Requirements: 12.7_
  
  - [ ]* 9.3 Write property tests for UI accessibility
    - **Property 18: UI elements have proper ARIA labels**
    - **Validates: Requirements 12.2**
    - **Property 19: Error messages use ARIA live regions**
    - **Validates: Requirements 12.3**
    - **Property 20: Loading states provide visual feedback**
    - **Validates: Requirements 12.4**
    - **Property 21: Focus management after OTP send**
    - **Validates: Requirements 12.6**
    - **Property 22: Keyboard navigation support**
    - **Validates: Requirements 12.7**

- [ ] 10. Profile management integration
  - [ ] 10.1 Update user profile to display phone_public
    - Modify user profile component to display phone_public field
    - Show phone number only if phone_public is not null
    - Ensure phone_security is never displayed
    - _Requirements: 6.4, 7.5_
  
  - [ ] 10.2 Implement phone_public editing with re-validation
    - Add edit functionality for phone_public field in profile settings
    - When user changes phone_public to different number, trigger OTP validation flow
    - Block profile update until new phone validated
    - Allow clearing phone_public field without validation
    - _Requirements: 7.2, 7.3, 7.4, 7.6_
  
  - [ ]* 10.3 Write property tests for profile phone management
    - **Property 2: Profile publication requires phone verification**
    - **Validates: Requirements 1.3**
    - **Property 15: Changing phone_public requires re-validation**
    - **Validates: Requirements 7.2, 7.3, 7.4**
  
  - [ ]* 10.4 Write unit tests for profile phone display
    - Test phone_public displayed when not null
    - Test no phone displayed when phone_public is null
    - Test phone_security never exposed in profile view
    - _Requirements: 6.4, 7.5_

- [ ] 11. Session and state management
  - [ ] 11.1 Implement validation session persistence
    - Store pending phone number in session during validation
    - Preserve validation state on page refresh
    - Clear validation session data after successful verification
    - _Requirements: 10.2, 10.4, 10.5_
  
  - [ ]* 11.2 Write property test for session management
    - **Property 14: Successful validation clears session state**
    - **Validates: Requirements 10.5**

- [ ] 12. Checkpoint - Ensure frontend functionality is complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Integration and end-to-end testing
  - [ ]* 13.1 Write integration test for complete validation flow
    - Test full flow: login → phone validation screen → send OTP → verify OTP → portal access
    - Test error flow: invalid phone → error message displayed
    - Test rate limit flow: 5 failed attempts → rate limit error
    - Test cooldown flow: rapid resend → cooldown error
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 3.1, 3.2, 4.3, 5.2_
  
  - [ ]* 13.2 Write integration test for Twilio error handling
    - Mock Twilio API responses for different error codes
    - Test error code 20429 (rate limit) → service error message
    - Test error code 21211 (invalid phone) → invalid phone message
    - Test error code 60200 (invalid OTP) → invalid code message
    - Test error code 60203 (expired OTP) → expired code message
    - _Requirements: 2.5, 11.3, 11.4_
  
  - [ ]* 13.3 Write property test for complete validation success
    - **Property 3: Successful validation sets timestamp and encrypts phone**
    - **Validates: Requirements 1.4, 3.2, 3.3, 3.4**

- [x] 14. Environment configuration and deployment preparation
  - [x] 14.1 Configure environment variables
    - Add TWILIO_ACCOUNT_SID to environment configuration
    - Add TWILIO_AUTH_TOKEN to environment configuration
    - Add TWILIO_VERIFY_SERVICE_SID to environment configuration
    - Document environment variables in README or .env.example
    - _Requirements: 11.1_
  
  - [x] 14.2 Create Twilio Verify service
    - Document steps to create Twilio Verify service in Twilio console
    - Configure service settings (10-minute expiration, SMS channel, pt-BR locale)
    - Test service with test phone numbers
    - _Requirements: 11.2_
  
  - [x] 14.3 Add monitoring and logging
    - Implement logging for all phone validation events
    - Log OTP send attempts with user ID and timestamp
    - Log OTP verification attempts with success/failure
    - Log rate limit hits and cooldown triggers
    - Log Twilio API errors with full context
    - _Requirements: 11.5_

- [ ] 15. Final checkpoint and verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- The implementation uses TypeScript throughout as specified in the design document
- Twilio Verify API handles OTP generation, storage, and expiration automatically
- Supabase pgsodium extension provides hardware-accelerated encryption
- All user-facing messages are in Portuguese (pt-BR)
- Property tests use fast-check library with minimum 100 iterations
- Checkpoints ensure incremental validation and allow for user feedback
