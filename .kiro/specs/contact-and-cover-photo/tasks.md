# Implementation Plan: Contact and Cover Photo

## Overview

This implementation plan breaks down the contact and cover photo features into discrete coding tasks. The plan follows an incremental approach: first updating backend interfaces and services, then implementing UI components, and finally adding tests. Each task builds on previous work and includes checkpoint validations.

## Tasks

- [x] 1. Update ProfileService interfaces for contact fields
  - Extend CreateProfileInput interface with whatsapp_number, whatsapp_enabled, telegram_username, telegram_enabled as optional fields
  - Extend UpdateProfileInput interface with the same contact fields
  - Ensure TypeScript compilation passes with new interface definitions
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 2. Add contact input fields to Profile Edit Page
  - [x] 2.1 Add WhatsApp number input field in Basic Information Section
    - Create input field with numeric-only filtering
    - Add label indicating Brazilian numbers (+55)
    - Add placeholder text for expected format
    - Wire to formData.whatsapp_number state
    - _Requirements: 1.1, 1.3, 8.1, 8.2, 8.5_
  
  - [x] 2.2 Add WhatsApp visibility checkbox
    - Create checkbox control for enabling/disabling WhatsApp contact
    - Wire to formData.whatsapp_enabled state
    - _Requirements: 1.2, 1.5_
  
  - [x] 2.3 Add Telegram username input field in Basic Information Section
    - Create input field with @ symbol removal filtering
    - Add placeholder text indicating username format without @
    - Wire to formData.telegram_username state
    - _Requirements: 2.1, 2.3, 8.3, 8.4_
  
  - [x] 2.4 Add Telegram visibility checkbox
    - Create checkbox control for enabling/disabling Telegram contact
    - Wire to formData.telegram_enabled state
    - _Requirements: 2.2, 2.5_
  
  - [ ]* 2.5 Write property test for WhatsApp numeric filtering
    - **Property 2: WhatsApp Input Numeric Filtering**
    - **Validates: Requirements 1.3, 8.1**
  
  - [ ]* 2.6 Write property test for Telegram @ symbol removal
    - **Property 3: Telegram Username @ Symbol Removal**
    - **Validates: Requirements 2.3, 8.4**
  
  - [ ]* 2.7 Write unit tests for contact input components
    - Test input field rendering and labels
    - Test checkbox rendering and state
    - Test placeholder text display
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 8.2, 8.3, 8.5_

- [ ] 3. Add cover photo selection UI to media section
  - [x] 3.1 Add "Set as Cover" button for each photo in media section
    - Display button only for media items with type="photo"
    - Hide button for media items with type="video"
    - Wire button click to call MediaService.setCoverImage()
    - _Requirements: 4.1, 4.3, 4.4, 4.5_
  
  - [x] 3.2 Add visual indicator for current cover photo
    - Display badge or icon on media item where is_cover=true
    - Ensure indicator is clearly visible and distinguishable
    - _Requirements: 4.2_
  
  - [x] 3.3 Implement auto-cover logic for first photo upload
    - When uploading first photo and no cover exists, automatically set as cover
    - Ensure logic only applies when media array is empty before upload
    - _Requirements: 5.3_
  
  - [ ]* 3.4 Write property test for cover button display by media type
    - **Property 7: Set as Cover Button Display by Media Type**
    - **Validates: Requirements 4.4, 4.5**
  
  - [ ]* 3.5 Write property test for cover visual indicator
    - **Property 8: Cover Photo Visual Indicator**
    - **Validates: Requirements 4.2**
  
  - [ ]* 3.6 Write property test for setCoverImage invocation
    - **Property 9: MediaService.setCoverImage Invocation**
    - **Validates: Requirements 4.3**
  
  - [ ]* 3.7 Write unit tests for cover photo UI components
    - Test "Set as Cover" button rendering for photos
    - Test button not rendered for videos
    - Test visual indicator display
    - Test auto-cover on first upload
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 5.3_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement MediaService.setCoverImage logic
  - [x] 5.1 Create or update setCoverImage method in MediaService
    - Accept profileId and mediaId as parameters
    - Set is_cover=false for all photos in the profile
    - Set is_cover=true for the selected mediaId
    - Ensure atomic transaction (rollback if any step fails)
    - _Requirements: 5.1, 5.2_
  
  - [x] 5.2 Implement cover deletion behavior
    - When cover photo is deleted, do not auto-assign new cover
    - Ensure all remaining photos have is_cover=false
    - _Requirements: 5.4_
  
  - [ ]* 5.3 Write property test for cover photo uniqueness
    - **Property 10: Cover Photo Uniqueness**
    - **Validates: Requirements 5.1, 5.2**
  
  - [ ]* 5.4 Write property test for no auto-reassignment on deletion
    - **Property 11: No Automatic Cover Reassignment on Deletion**
    - **Validates: Requirements 5.4**
  
  - [ ]* 5.5 Write unit tests for MediaService.setCoverImage
    - Test successful cover setting
    - Test unsetting previous covers
    - Test error handling for invalid mediaId
    - Test error handling for invalid profileId
    - Test transaction rollback on failure
    - _Requirements: 5.1, 5.2, 5.4_

- [ ] 6. Add contact buttons to Profile Modal in Catalog Page
  - [x] 6.1 Create WhatsApp contact button component
    - Display button with green background (#25D366)
    - Generate URL: https://wa.me/55{whatsapp_number}
    - Open URL in new tab on click
    - Only render when whatsapp_enabled=true
    - _Requirements: 1.6, 1.7, 1.8, 1.9, 7.3_
  
  - [x] 6.2 Create Telegram contact button component
    - Display button with blue background (#0088cc)
    - Generate URL: https://t.me/{telegram_username}
    - Open URL in new tab on click
    - Only render when telegram_enabled=true
    - _Requirements: 2.6, 2.7, 2.8, 7.4_
  
  - [x] 6.3 Position contact buttons in Profile Modal right column
    - Place buttons above pricing information card
    - Stack buttons vertically when both are enabled
    - Handle all visibility combinations (both, WhatsApp only, Telegram only, neither)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ]* 6.4 Write property test for WhatsApp URL generation
    - **Property 4: WhatsApp URL Generation with Country Code**
    - **Validates: Requirements 1.8, 1.9**
  
  - [ ]* 6.5 Write property test for Telegram URL generation
    - **Property 5: Telegram URL Generation**
    - **Validates: Requirements 2.8**
  
  - [ ]* 6.6 Write property test for contact button conditional rendering
    - **Property 6: Contact Button Conditional Rendering**
    - **Validates: Requirements 1.6, 2.6, 7.2, 7.3, 7.4, 7.5**
  
  - [ ]* 6.7 Write unit tests for contact button components
    - Test button colors (#25D366 for WhatsApp, #0088cc for Telegram)
    - Test URL generation and new tab behavior
    - Test conditional rendering based on enabled flags
    - Test button positioning and stacking
    - _Requirements: 1.6, 1.7, 1.8, 2.6, 2.7, 2.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 7. Update catalog card to display cover photo
  - [x] 7.1 Implement cover photo query and display logic
    - Query media items for is_cover=true
    - If cover exists, display that media item
    - If no cover, display first media item by sort_order
    - If no media items, display no image
    - Apply object-fit: cover for consistent aspect ratio
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 7.2 Write property test for cover photo display priority
    - **Property 12: Cover Photo Display Priority**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  
  - [ ]* 7.3 Write unit tests for catalog card cover photo display
    - Test cover photo display when is_cover=true
    - Test fallback to first photo when no cover
    - Test no image display when no media items
    - Test object-fit: cover styling
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 8. Implement contact data persistence
  - [x] 8.1 Update ProfileService.updateProfile to handle contact fields
    - Ensure whatsapp_number, whatsapp_enabled, telegram_username, telegram_enabled are included in update payload
    - Verify database persistence of all contact fields
    - _Requirements: 1.4, 1.5, 2.4, 2.5_
  
  - [ ]* 8.2 Write property test for contact data persistence round trip
    - **Property 1: Contact Data Persistence Round Trip**
    - **Validates: Requirements 1.4, 1.5, 2.4, 2.5**
  
  - [ ]* 8.3 Write unit tests for ProfileService contact field updates
    - Test successful save of contact fields
    - Test retrieval of saved contact data
    - Test error handling for database failures
    - _Requirements: 1.4, 1.5, 2.4, 2.5_

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and UI component behavior
- All contact fields are optional to maintain backward compatibility
- MediaService.setCoverImage() must be atomic to prevent data inconsistency
- Contact buttons only appear when corresponding enabled flags are true
