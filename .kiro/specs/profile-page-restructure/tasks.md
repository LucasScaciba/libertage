# Implementation Plan: Profile Page Restructure

## Overview

This implementation plan breaks down the profile page restructure into sequential, actionable tasks. The restructure involves creating a new characteristics page, updating the profile edit page with new fields (birthdate picker, service categories), implementing currency formatting, and migrating existing data to the new schema.

The implementation follows a logical sequence: database changes first, then utility functions, followed by new components, API routes, page updates, and finally testing and integration.

## Tasks

- [x] 1. Database migration and schema changes
  - [x] 1.1 Create migration file for profile page restructure
    - Create `supabase/migrations/013_profile_page_restructure.sql`
    - Add birthdate column (DATE type) to profiles table
    - Add service_categories column (JSONB array) to profiles table
    - Add buttocks_type and buttocks_size columns (TEXT type) to profiles table
    - Migrate existing age_attribute values to birthdate (approximate calculation)
    - Migrate service categories from selected_features to service_categories
    - Remove service categories from selected_features array
    - Add indexes for birthdate and service_categories columns
    - Add check constraint for birthdate age range (18-60 years)
    - _Requirements: 3.6, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 2. Implement utility functions
  - [x] 2.1 Create age calculator utility
    - Create `lib/utils/age-calculator.ts`
    - Implement calculateAge function to compute age from birthdate
    - Implement validateAgeRange function with 18-60 year validation
    - Handle edge cases (birthday not yet occurred this year)
    - _Requirements: 3.3, 3.4, 3.5, 3.7, 3.8_
  
  - [ ]* 2.2 Write property test for age calculator
    - **Property 9: Age Calculation Accuracy**
    - **Validates: Requirements 3.7, 3.8**
    - Test that calculated age matches actual age for random birthdates
    - Test edge case where birthday hasn't occurred yet this year
  
  - [x] 2.3 Create currency formatter utility
    - Create `lib/utils/currency-formatter.ts`
    - Implement formatBRL function for Brazilian Real formatting
    - Implement parseBRL function to extract numeric value
    - Implement validateCurrencyInput function for input validation
    - _Requirements: 5.1, 5.3, 5.4, 5.5_
  
  - [ ]* 2.4 Write property tests for currency formatter
    - **Property 5: Currency Formatting**
    - **Validates: Requirements 5.1, 5.4**
    - Test that numeric values are formatted with R$ prefix and correct separators
    - **Property 7: Currency Storage Round Trip**
    - **Validates: Requirement 5.5**
    - Test that format/parse round trip preserves numeric value

- [-] 3. Create new UI components
  - [x] 3.1 Implement BirthdatePicker component
    - Create `app/portal/profile/components/BirthdatePicker.tsx`
    - Use date input with validation
    - Display validation errors for ages < 18 or > 60
    - Format date for display and storage
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 3.2 Write property test for BirthdatePicker validation
    - **Property 3: Birthdate Age Range Validation**
    - **Validates: Requirement 3.3**
    - Test that valid birthdates (ages 18-60) are accepted without errors
  
  - [x] 3.3 Implement CurrencyInput component
    - Create `app/portal/profile/components/CurrencyInput.tsx`
    - Apply currency mask on input
    - Filter non-numeric characters
    - Display helper text "Informe apenas números"
    - Store numeric value without formatting
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 3.4 Write property test for CurrencyInput
    - **Property 6: Currency Input Validation**
    - **Validates: Requirement 5.3**
    - Test that non-numeric characters are rejected or filtered
  
  - [x] 3.5 Implement ServiceCategoriesSelector component
    - Create `app/portal/profile/components/ServiceCategoriesSelector.tsx`
    - Display three options: Massagem, Acompanhante, Chamada de vídeo
    - Support multiple selections
    - Validate at least one category selected
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 3.6 Write property test for multi-select functionality
    - **Property 2: Multi-Select Functionality**
    - **Validates: Requirements 2.3, 7.6**
    - Test that multiple selections are stored correctly in form state

- [ ] 4. Checkpoint - Ensure components render correctly
  - Verify all new components render without errors
  - Test component props and validation
  - Ask the user if questions arise

- [-] 5. Implement characteristics API routes
  - [x] 5.1 Create GET /api/characteristics endpoint
    - Create `app/api/characteristics/route.ts`
    - Implement GET handler for retrieving user characteristics
    - Extract characteristics from profile and selected_features
    - Return all physical and service characteristics
    - _Requirements: 13.1, 13.5_
  
  - [x] 5.2 Create PUT /api/characteristics endpoint
    - Implement PUT handler in `app/api/characteristics/route.ts`
    - Validate characteristics against features-services.json options
    - Validate numeric ranges (height 140-200, weight 40-150, shoe size 33-44)
    - Update selected_features array and direct columns
    - Return success response with updated characteristics
    - _Requirements: 13.2, 13.3, 13.4_
  
  - [ ]* 5.3 Write property tests for characteristics API validation
    - **Property 21: Characteristics API Validation**
    - **Validates: Requirement 13.3**
    - Test that invalid field values are rejected with 400 error
    - **Property 22: Characteristics API Update**
    - **Validates: Requirement 13.4**
    - Test that valid requests update database successfully
    - **Property 23: Characteristics API Retrieval**
    - **Validates: Requirement 13.5**
    - Test that GET returns all characteristics for authenticated user

- [ ] 6. Update profiles API route
  - [ ] 6.1 Modify /api/profiles to accept new fields
    - Update `app/api/profiles/route.ts` or equivalent
    - Accept birthdate field instead of age_attribute
    - Accept service_categories array
    - Validate birthdate age range (18-60)
    - Validate service categories (at least one required)
    - Update database with new fields
    - _Requirements: 3.6, 2.4, 3.3, 3.4, 3.5_
  
  - [ ]* 6.2 Write property tests for profile API validation
    - **Property 1: Required Field Validation**
    - **Validates: Requirements 1.2, 4.6**
    - Test that submissions without required fields are rejected
    - **Property 8: Birthdate Storage and Retrieval**
    - **Validates: Requirement 3.6**
    - Test that birthdate is preserved exactly in database

- [-] 7. Create CharacteristicsPage
  - [x] 7.1 Implement CharacteristicsPage component
    - Create `app/portal/characteristics/page.tsx`
    - Follow layout pattern from /portal/links, /portal/media, /portal/availability
    - Create Services section with multi-select fields
    - Create Characteristics section with sliders and selectors
    - Load characteristics from /api/characteristics
    - Submit updates to /api/characteristics
    - Display success message on save
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2, 9.3, 12.5_
  
  - [ ]* 7.2 Write unit tests for CharacteristicsPage
    - Test that page renders both Services and Characteristics sections
    - Test that form submission calls API correctly
    - Test that success message displays after save
    - _Requirements: 6.3, 12.5_

- [-] 8. Restructure ProfileEditPage
  - [x] 8.1 Update Basic Information section
    - Modify `app/portal/profile/page.tsx`
    - Remove physical measurements (weight, height, shoe_size)
    - Remove age dropdown field
    - Add BirthdatePicker component for birthdate
    - Add ServiceCategoriesSelector component
    - Ensure field order: Nome de Exibição, Slug, Categorias Atendidas, Estado, Data de Nascimento
    - Mark all five fields as required
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_
  
  - [ ] 8.2 Merge Contact and Description sections
    - Create single "Contato e Descrição" section
    - Include WhatsApp field with country code +55 and visibility checkbox
    - Include Telegram username field with visibility checkbox
    - Include Descrição Curta field with 160 character maximum
    - Include Descrição Completa field
    - Mark Descrição Curta and Descrição Completa as required
    - Remove separate "Contato" and "Descrição" sections
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ] 8.3 Update Pricing section with currency formatting
    - Apply CurrencyInput component to Valor field
    - Display helper text "Informe apenas números"
    - Format values with R$ prefix, thousands separators, two decimals
    - Store numeric values without formatting
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ] 8.4 Remove features section from ProfileEditPage
    - Remove features/services selection (moved to CharacteristicsPage)
    - _Requirements: 2.5, 6.3_
  
  - [ ]* 8.5 Write property test for short description length validation
    - **Property 4: Short Description Length Validation**
    - **Validates: Requirement 4.4**
    - Test that strings > 160 characters are rejected or truncated
  
  - [ ]* 8.6 Write unit tests for ProfileEditPage structure
    - Test that Basic Info section contains exactly 5 fields
    - Test that physical measurements are not in Basic Info
    - Test that Contact and Description are merged
    - Test field ordering matches specification
    - _Requirements: 1.1, 1.3, 1.4, 4.1, 4.7_

- [ ] 9. Checkpoint - Ensure pages work end-to-end
  - Test profile edit flow with new fields
  - Test characteristics page flow
  - Verify data saves correctly to database
  - Ask the user if questions arise

- [ ] 10. Update configuration files
  - [ ] 10.1 Update features-services.json
    - Add buttocks_type category with options: Natural, Com Silicone
    - Add buttocks_size category with options: Pequeno, Médio, Grande
    - Remove services category (now managed separately)
    - Verify all existing characteristic options are preserved
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [ ]* 10.2 Write property test for configuration loading
    - **Property 25: Configuration Loading**
    - **Validates: Requirement 14.5**
    - Test that characteristic options match features-services.json
    - **Property 24: Configuration Preservation**
    - **Validates: Requirement 14.4**
    - Test that existing options are preserved after update

- [ ] 11. Update ProfileCompletenessService
  - [ ] 11.1 Modify profile completeness validation
    - Update `lib/services/profile-completeness.service.ts`
    - Check birthdate instead of age_attribute
    - Check service_categories field
    - Remove age_attribute from validation
    - Remove physical measurements from basic info calculation
    - Include characteristics fields in overall completion
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 11.2 Write property tests for profile completeness
    - **Property 11: Profile Completeness with Birthdate**
    - **Validates: Requirement 10.1**
    - Test that profiles without birthdate are marked incomplete
    - **Property 12: Profile Completeness with Service Categories**
    - **Validates: Requirement 10.2**
    - Test that profiles without service categories are marked incomplete
    - **Property 13: Profile Completeness Excludes Old Age Field**
    - **Validates: Requirement 10.3**
    - Test that age_attribute is not checked
    - **Property 14: Profile Completeness Excludes Physical Measurements**
    - **Validates: Requirement 10.4**
    - Test that weight, height, shoe_size not in basic info calculation

- [ ] 12. Update sidebar navigation
  - [ ] 12.1 Add Characteristics menu item to sidebar
    - Update sidebar component (likely in `app/portal` layout or components)
    - Add "Características e Serviços" menu item
    - Link to /portal/characteristics
    - Add appropriate icon for characteristics
    - _Requirements: 6.2, 12.4_
  
  - [ ]* 12.2 Write unit test for sidebar navigation
    - Test that Characteristics link appears in sidebar
    - Test that link navigates to /portal/characteristics
    - _Requirements: 6.2, 12.4_

- [ ] 13. Update public profile display
  - [ ] 13.1 Display calculated age on public profiles
    - Update public profile component (likely `app/perfil/[slug]/PublicProfileClient.tsx`)
    - Use calculateAge utility to compute age from birthdate
    - Display age value (not birthdate) on public profile
    - Display buttocks characteristics when present
    - _Requirements: 3.7, 3.8, 9.4_
  
  - [ ]* 13.2 Write property test for buttocks display
    - **Property 10: Buttocks Characteristics Display**
    - **Validates: Requirement 9.4**
    - Test that profiles with buttocks values display them on public profile

- [ ] 14. Maintain user experience patterns
  - [ ] 14.1 Verify keyboard navigation
    - Test tab navigation through all form fields
    - Ensure focus order matches visual order
    - Test that all interactive elements are keyboard accessible
    - _Requirements: 12.1_
  
  - [ ] 14.2 Verify required field validation behavior
    - Test that required fields show validation errors when empty
    - Test that form submission is blocked when required fields are empty
    - Test that validation errors are cleared when fields are filled
    - _Requirements: 12.2_
  
  - [ ] 14.3 Verify welcome modal functionality
    - Test that welcome modal displays on first visit
    - Test that modal can be dismissed
    - Test that modal doesn't show on subsequent visits
    - _Requirements: 12.3_
  
  - [ ]* 14.4 Write property tests for user experience
    - **Property 18: Keyboard Navigation**
    - **Validates: Requirement 12.1**
    - Test that Tab moves focus to next field in expected order
    - **Property 19: Required Field Validation Behavior**
    - **Validates: Requirement 12.2**
    - Test that submitting without required fields triggers validation error
    - **Property 20: Success Message Display**
    - **Validates: Requirement 12.5**
    - Test that success message displays after any successful save

- [ ] 15. Final checkpoint - Run all tests and verify migration
  - Run database migration on test environment
  - Verify data migration accuracy (age to birthdate, services to categories)
  - Run all unit tests and property tests
  - Test complete user flows end-to-end
  - Verify profile completeness calculations are correct
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and UI structure
- Database migration should be tested thoroughly before production deployment
- The implementation uses TypeScript throughout for type safety
- All API routes require authentication and validate user permissions
- Currency formatting uses Brazilian Real (R$) with proper locale formatting
- Age calculation handles edge cases like birthdays not yet occurred this year
