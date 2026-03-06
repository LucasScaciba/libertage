# Implementation Plan: Location Management

## Overview

Este plano implementa o sistema de gerenciamento de localização em camadas, começando pela infraestrutura de dados (database schema), seguindo para a camada de serviços e APIs, e finalizando com os componentes de UI. A implementação prioriza a validação incremental através de testes automatizados para garantir que cada componente funcione corretamente antes de prosseguir para o próximo.

## Tasks

- [x] 1. Setup database schema and types
  - [x] 1.1 Create database migration for location fields
    - Add 7 new columns to profiles table: has_no_location, address_cep, address_street, address_neighborhood, address_city, address_state, address_number
    - Add check constraint for valid Brazilian state codes in address_state
    - Add check constraint to ensure city (Estado Base) is never null or empty
    - Add index on address_state for filtering performance
    - Add column comments for clarity
    - Create migration file in supabase/migrations/
    - _Requirements: 9.5, 10.3, 10.4, 10.5_

  - [x] 1.2 Update TypeScript types for Profile and Location
    - Extend Profile interface with location fields in types/index.ts
    - Create LocationData interface for form state
    - Create ViaCepResponse interface for API integration
    - _Requirements: 3.1, 3.6, 4.1_

  - [ ]* 1.3 Write property test for Base State Non-Null Constraint
    - **Property 13: Base State Non-Null Constraint**
    - **Validates: Requirements 10.3**
    - Generate attempts to create/update profiles with null/empty city
    - Verify database constraint prevents null/empty values

- [x] 2. Implement LocationService
  - [x] 2.1 Create LocationService with validation methods
    - Implement validateCep() to check 8-digit numeric format
    - Implement validateStateCode() to validate Brazilian state codes
    - Implement getEffectiveState() to prioritize address_state over city
    - Implement formatAddress() to format address for display
    - Create file at lib/services/location.service.ts
    - _Requirements: 4.7, 7.1, 7.2, 6.1, 6.2, 5.5_

  - [ ]* 2.2 Write property test for CEP Validation
    - **Property 1: CEP Validation**
    - **Validates: Requirements 4.7, 7.1, 7.2, 7.6**
    - Generate random strings with various lengths and character types
    - Verify only 8-digit numeric strings are accepted

  - [ ]* 2.3 Write property test for State Code Validation
    - **Property 14: State Code Validation**
    - **Validates: Requirements 1.4, 10.4, 10.5**
    - Generate random state codes (valid and invalid)
    - Verify only valid Brazilian state codes are accepted

  - [ ]* 2.4 Write property test for Effective State Priority Logic
    - **Property 10: Effective State Priority Logic**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**
    - Generate profiles with various combinations of address_state and city
    - Verify correct state is returned based on priority

  - [ ]* 2.5 Write property test for Address Formatting Consistency
    - **Property 9: Address Formatting Consistency**
    - **Validates: Requirements 5.5**
    - Generate random complete addresses with all fields populated
    - Verify formatted string matches pattern "Rua, Número - Bairro, Cidade - Estado, CEP"

  - [ ]* 2.6 Write unit tests for LocationService
    - Test validateCep() with valid and invalid inputs
    - Test validateStateCode() with all Brazilian states
    - Test getEffectiveState() with various profile states
    - Test formatAddress() with complete and partial addresses
    - _Requirements: 4.7, 7.1, 7.2, 6.1, 6.2, 5.5_

- [x] 3. Implement ViaCEP integration
  - [x] 3.1 Add fetchAddressByCep method to LocationService
    - Implement HTTP client call to ViaCEP API (https://viacep.com.br/ws/{cep}/json/)
    - Handle successful responses and parse address data
    - Handle error responses (404, network errors, timeouts)
    - Add retry logic with exponential backoff (max 3 attempts)
    - _Requirements: 4.1, 4.2, 8.1, 8.2, 8.3_

  - [ ]* 3.2 Write property test for ViaCEP Auto-Population
    - **Property 6: ViaCEP Auto-Population**
    - **Validates: Requirements 4.1, 4.2**
    - Generate valid CEPs and mock ViaCEP responses
    - Verify fields are populated correctly with returned data

  - [ ]* 3.3 Write property test for ViaCEP Error Handling
    - **Property 7: ViaCEP Error Handling Preserves Editability**
    - **Validates: Requirements 4.4, 8.4, 8.5**
    - Generate various error scenarios (404, network, timeout)
    - Verify error messages display and fields remain editable

  - [ ]* 3.4 Write unit tests for ViaCEP integration
    - Test successful CEP lookup with mocked API response
    - Test 404 error handling
    - Test network error handling
    - Test timeout handling
    - Test retry logic
    - _Requirements: 4.1, 4.2, 4.4, 8.1, 8.2, 8.3_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Location API endpoints
  - [x] 5.1 Create GET /api/location endpoint
    - Verify user authentication
    - Fetch location data from profiles table for authenticated user
    - Return LocationData object with all address fields
    - Handle errors (401 Unauthorized, 500 Database Error)
    - Create file at app/api/location/route.ts
    - _Requirements: 9.3, 9.4, 9.6_

  - [x] 5.2 Create PATCH /api/location endpoint
    - Verify user authentication and authorization
    - Validate request body (CEP format, state codes, required fields)
    - If hasNoLocation is true, clear all address fields in database
    - If hasNoLocation is false, validate Número is provided
    - Update profiles table with location data
    - Return success response with updated LocationData
    - Handle errors (400 Validation, 401 Unauthorized, 403 Forbidden, 500 Database)
    - _Requirements: 2.5, 3.2, 3.6, 9.1, 9.2, 10.1, 10.2_

  - [x] 5.3 Create GET /api/location/cep/:cep endpoint
    - Validate CEP format (8 digits, numeric)
    - Call LocationService.fetchAddressByCep()
    - Return ViaCEP response data
    - Handle errors (400 Invalid Format, 404 CEP Not Found, 500 ViaCEP Unavailable)
    - Create file at app/api/location/cep/[cep]/route.ts
    - _Requirements: 4.1, 4.4, 4.5, 7.1, 7.2_

  - [ ]* 5.4 Write property test for Row Level Security Enforcement
    - **Property 11: Row Level Security Enforcement**
    - **Validates: Requirements 9.6**
    - Generate requests from different users attempting to access location data
    - Verify users can only access their own data

  - [ ]* 5.5 Write property test for Data Integrity on Toggle Change
    - **Property 12: Data Integrity on Toggle Change**
    - **Validates: Requirements 10.1, 10.2**
    - Generate profiles with address data
    - Toggle has_no_location to true via PATCH endpoint
    - Verify address fields cleared and city preserved

  - [ ]* 5.6 Write unit tests for Location API endpoints
    - Test GET /api/location returns user's data
    - Test GET /api/location returns 401 for unauthenticated users
    - Test PATCH /api/location saves data correctly
    - Test PATCH /api/location validates required fields
    - Test PATCH /api/location clears address when hasNoLocation is true
    - Test PATCH /api/location returns 403 for unauthorized access
    - Test GET /api/location/cep/:cep proxies to ViaCEP
    - Test GET /api/location/cep/:cep validates CEP format
    - _Requirements: 2.5, 3.2, 3.6, 4.1, 7.1, 9.1, 9.2, 9.6_

- [x] 6. Implement My Location Page
  - [x] 6.1 Create MyLocationPage component with form structure
    - Create page component at app/portal/location/page.tsx
    - Implement form state management with LocationFormState interface
    - Add Address_Toggle checkbox with label "Não possuo local de atendimento"
    - Add Complete_Address fields: CEP, Rua, Bairro, Cidade, Estado, Número
    - Implement field enable/disable logic based on toggle state
    - Add loading states for page load and form submission
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.4_

  - [x] 6.2 Implement CEP lookup functionality
    - Add onChange handler for CEP field
    - Validate CEP format on input (8 digits, numeric only)
    - Call GET /api/location/cep/:cep when valid CEP is entered
    - Display loading indicator during API call
    - Auto-populate Rua, Bairro, Cidade, Estado on success
    - Display error messages on failure (404, network, timeout)
    - Clear error message when CEP is modified
    - Keep all fields editable after auto-population
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 6.3 Implement form validation and submission
    - Validate Número is required when toggle is unchecked
    - Validate CEP format before submission
    - Validate state codes before submission
    - Prevent submission on validation errors
    - Call PATCH /api/location on form submit
    - Display success toast on save
    - Display error toast on save failure
    - _Requirements: 3.2, 7.6, 10.4, 10.5_

  - [x] 6.4 Implement data loading on page mount
    - Call GET /api/location on component mount
    - Populate form fields with returned data
    - Set toggle state from hasNoLocation field
    - Handle loading and error states
    - _Requirements: 9.3, 9.4_

  - [ ]* 6.5 Write property test for Toggle State Controls Field Availability
    - **Property 2: Toggle State Controls Field Availability**
    - **Validates: Requirements 2.3, 2.4**
    - Generate random toggle states (true/false)
    - Verify field disabled state matches toggle state in UI

  - [ ]* 6.6 Write property test for Address Toggle Persistence Round-Trip
    - **Property 3: Address Toggle Persistence Round-Trip**
    - **Validates: Requirements 2.5, 9.1, 9.3**
    - Generate random toggle states
    - Save via form submission, reload page, verify state matches

  - [ ]* 6.7 Write property test for Complete Address Persistence Round-Trip
    - **Property 4: Complete Address Persistence Round-Trip**
    - **Validates: Requirements 3.6, 9.2, 9.4**
    - Generate random address data
    - Save via form submission, reload page, verify all fields match

  - [ ]* 6.8 Write property test for Conditional Field Requirement
    - **Property 5: Conditional Field Requirement**
    - **Validates: Requirements 3.2, 3.3**
    - Generate random form states with toggle unchecked
    - Verify Número is required, other fields optional

  - [ ]* 6.9 Write unit tests for MyLocationPage
    - Test component renders correctly
    - Test toggle checkbox controls field visibility
    - Test CEP validation displays error messages
    - Test ViaCEP integration auto-populates fields
    - Test form submission with valid data
    - Test form submission with invalid data
    - Test data loading on mount
    - Test error handling for API failures
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 4.1, 4.2, 7.1, 7.2, 9.3, 9.4_

- [x] 7. Update Profile Page
  - [x] 7.1 Modify Profile Page to rename Estado field
    - Change field label from "Estado" to "Estado Base"
    - Add description text below field: "Caso você não tenha Local cadastrado no menu Meu Local, vamos utilizar esse estado base para aplicar o filtro no Catálogo"
    - Maintain existing validation and required field behavior
    - Update file at app/portal/profile/page.tsx
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 7.2 Write unit tests for Profile Page changes
    - Test "Estado Base" label is displayed
    - Test description text is displayed
    - Test field remains required
    - Test existing validation still works
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 8. Update navigation sidebar
  - [x] 8.1 Add "Meu Local" link to AppSidebar
    - Add new navigation item with label "Meu Local"
    - Use MapPin icon from lucide-react
    - Link to /portal/location
    - Position after "Meu Perfil" in navigation list
    - Update file at components/app-sidebar.tsx
    - _Requirements: 2.1_

  - [ ]* 8.2 Write unit tests for AppSidebar changes
    - Test "Meu Local" link is present
    - Test link has correct href
    - Test link has MapPin icon
    - Test link is positioned after "Meu Perfil"
    - _Requirements: 2.1_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update public profile display
  - [x] 10.1 Modify catalog modal to display complete address
    - Check if profile has Complete_Address data (address_state not null)
    - If yes, display formatted address using LocationService.formatAddress()
    - If no, do not display address section
    - Update relevant catalog modal component
    - _Requirements: 5.1, 5.3, 5.5_

  - [x] 10.2 Modify slug page to display complete address
    - Check if profile has Complete_Address data (address_state not null)
    - If yes, display formatted address using LocationService.formatAddress()
    - If no, do not display address section
    - Update relevant slug page component
    - _Requirements: 5.2, 5.4, 5.5_

  - [ ]* 10.3 Write property test for Address Display Based on Data Availability
    - **Property 8: Address Display Based on Data Availability**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
    - Generate profiles with and without complete address
    - Verify display logic shows address only when data is available

  - [ ]* 10.4 Write unit tests for public profile display
    - Test catalog modal displays address when available
    - Test catalog modal hides address when not available
    - Test slug page displays address when available
    - Test slug page hides address when not available
    - Test address formatting is correct
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 11. Update catalog filtering logic
  - [x] 11.1 Modify catalog filter to use getEffectiveState
    - Import LocationService.getEffectiveState() in catalog filter logic
    - Replace direct city field access with getEffectiveState() call
    - Ensure backward compatibility with existing filters
    - Test filtering with profiles that have address_state
    - Test filtering with profiles that only have city (Estado Base)
    - Update relevant catalog filter component/service
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 11.2 Write unit tests for catalog filtering
    - Test filter uses address_state when available
    - Test filter falls back to city when address_state is null
    - Test filter maintains backward compatibility
    - Test filter includes profiles with matching Base_State_Field
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and error conditions
- Implementation follows a bottom-up approach: database → services → APIs → UI
- All TypeScript code should follow existing project conventions and use shadcn/ui components
- ViaCEP API documentation: https://viacep.com.br/
