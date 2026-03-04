# Requirements Document

## Introduction

This document specifies requirements for restructuring the profile edit page (/portal/profile) to improve user experience through better field organization, a dedicated characteristics page, and enhanced data collection. The restructure includes moving physical measurements to a new page, merging contact and description sections, replacing age dropdown with birthdate picker, and adding new body characteristic fields.

## Glossary

- **Profile_Edit_Page**: The authenticated user interface at /portal/profile where users edit their profile information
- **Characteristics_Page**: A new dedicated page at /portal/characteristics for managing physical characteristics and services
- **Basic_Info_Section**: The first section of the profile edit page containing essential profile fields
- **Contact_Description_Section**: A merged section combining contact methods and profile descriptions
- **Pricing_Section**: The section where users define their service pricing table
- **Birthdate_Picker**: A date input component for selecting date of birth
- **Age_Calculator**: A utility function that computes age from birthdate
- **Currency_Mask**: An input formatter that displays monetary values in Brazilian Real format (R$)
- **Categories_Field**: A required multi-select field for service categories (Massagem, Acompanhante, Chamada de vídeo)
- **Physical_Measurements**: Height, weight, and foot size characteristics
- **Body_Characteristics**: Physical appearance attributes including ethnicity, body type, hair, eyes, breasts, body hair, buttocks
- **Services_Characteristics**: Service-related attributes including payment methods, service location, clientele, and languages
- **Profile_Completeness_Validator**: A service that calculates profile completion percentage based on required and optional fields
- **Public_Profile**: The frontend display of user profile information visible to other users
- **Database_Schema**: The Supabase database table structure for storing profile data

## Requirements

### Requirement 1: Restructure Basic Information Section

**User Story:** As a profile owner, I want a streamlined basic information section with essential fields only, so that I can quickly update my core profile details without distraction.

#### Acceptance Criteria

1. THE Basic_Info_Section SHALL contain exactly five fields: Nome de Exibição, Slug, Categorias Atendidas, Estado, and Data de Nascimento
2. THE Basic_Info_Section SHALL mark Nome de Exibição, Slug, Categorias Atendidas, Estado, and Data de Nascimento as required fields
3. THE Basic_Info_Section SHALL NOT contain Peso, Altura, or Tamanho do Pé fields
4. WHEN the Basic_Info_Section is rendered, THE Profile_Edit_Page SHALL display fields in the order: Nome de Exibição, Slug, Categorias Atendidas, Estado, Data de Nascimento

### Requirement 2: Add Service Categories Field

**User Story:** As a profile owner, I want to specify which service categories I offer in the basic information section, so that users can immediately understand my primary services.

#### Acceptance Criteria

1. THE Basic_Info_Section SHALL include a Categorias Atendidas field
2. THE Categorias_Field SHALL support selection of Massagem, Acompanhante, and Chamada de vídeo options
3. THE Categorias_Field SHALL allow multiple category selections
4. WHEN a user submits the profile form without selecting at least one category, THE Profile_Edit_Page SHALL display a validation error
5. THE Categorias_Field SHALL replace the existing Serviços field from the features section

### Requirement 3: Replace Age Dropdown with Birthdate Picker

**User Story:** As a profile owner, I want to enter my birthdate instead of selecting age from a dropdown, so that my age automatically updates and remains accurate over time.

#### Acceptance Criteria

1. THE Basic_Info_Section SHALL include a Data de Nascimento field using a Birthdate_Picker component
2. THE Basic_Info_Section SHALL NOT include an Idade dropdown field
3. THE Birthdate_Picker SHALL accept dates representing ages between 18 and 60 years
4. WHEN a user selects a birthdate representing an age less than 18 years, THE Birthdate_Picker SHALL display a validation error
5. WHEN a user selects a birthdate representing an age greater than 60 years, THE Birthdate_Picker SHALL display a validation error
6. THE Database_Schema SHALL store the birthdate value in a date column
7. WHEN the Public_Profile is rendered, THE Age_Calculator SHALL compute age from the stored birthdate
8. THE Public_Profile SHALL display the calculated age value

### Requirement 4: Merge Contact and Description Sections

**User Story:** As a profile owner, I want contact information and descriptions in one section, so that I can manage all communication-related content in a single location.

#### Acceptance Criteria

1. THE Profile_Edit_Page SHALL contain a section named "Contato e Descrição"
2. THE Contact_Description_Section SHALL contain WhatsApp field with country code +55 and visibility checkbox
3. THE Contact_Description_Section SHALL contain Telegram username field with visibility checkbox
4. THE Contact_Description_Section SHALL contain Descrição Curta field with 160 character maximum
5. THE Contact_Description_Section SHALL contain Descrição Completa field
6. THE Contact_Description_Section SHALL mark Descrição Curta and Descrição Completa as required fields
7. THE Profile_Edit_Page SHALL NOT contain separate "Contato" and "Descrição" sections

### Requirement 5: Enhance Pricing Input with Currency Formatting

**User Story:** As a profile owner, I want price inputs formatted as Brazilian Real, so that I can easily understand monetary values while entering pricing information.

#### Acceptance Criteria

1. WHEN a user types numeric characters in the Valor field, THE Currency_Mask SHALL format the input as Brazilian Real with R$ prefix
2. THE Pricing_Section SHALL display helper text "Informe apenas números" below the Valor field
3. THE Currency_Mask SHALL accept only numeric input characters
4. THE Currency_Mask SHALL format values with thousands separators and two decimal places
5. THE Database_Schema SHALL store the numeric value without currency formatting

### Requirement 6: Create Characteristics and Services Page

**User Story:** As a profile owner, I want a dedicated page for managing my physical characteristics and service details, so that I can provide comprehensive information without cluttering the main profile page.

#### Acceptance Criteria

1. THE application SHALL provide a route at /portal/characteristics
2. THE Characteristics_Page SHALL be accessible from the sidebar menu with label "Características e Serviços"
3. THE Characteristics_Page SHALL contain two sections: Serviços and Características
4. THE Characteristics_Page SHALL follow the same layout pattern as /portal/links, /portal/media, and /portal/availability pages
5. WHEN a user navigates to /portal/characteristics, THE application SHALL render the Characteristics_Page component

### Requirement 7: Implement Services Section

**User Story:** As a profile owner, I want to specify my service details including payment methods, locations, clientele, and languages, so that potential clients understand my service offerings.

#### Acceptance Criteria

1. THE Characteristics_Page SHALL contain a Serviços section
2. THE Serviços section SHALL include a Formas de pagamento multi-select field
3. THE Serviços section SHALL include a Local de atendimento multi-select field
4. THE Serviços section SHALL include an Atendo multi-select field
5. THE Serviços section SHALL include an Idiomas multi-select field
6. THE Serviços section SHALL allow multiple selections for each field

### Requirement 8: Implement Physical Characteristics Section

**User Story:** As a profile owner, I want to specify my physical characteristics in detail, so that I can provide accurate information to potential clients.

#### Acceptance Criteria

1. THE Characteristics_Page SHALL contain a Características section
2. THE Características section SHALL include an Altura slider ranging from 140cm to 200cm
3. THE Características section SHALL include a Peso slider ranging from 40kg to 150kg
4. THE Características section SHALL include a Tamanho dos pés selector ranging from 33 to 44
5. THE Características section SHALL include single-select fields for Etnia, Corpo, Cabelo, Olhos, Seios, Tamanho dos seios, Pelos corporais, Bumbum, and Tamanho do bumbum
6. THE Physical_Measurements fields SHALL be removed from the Basic_Info_Section

### Requirement 9: Add Buttocks Characteristics

**User Story:** As a profile owner, I want to specify buttocks characteristics, so that I can provide complete physical appearance information.

#### Acceptance Criteria

1. THE Características section SHALL include a Bumbum single-select field
2. THE Características section SHALL include a Tamanho do bumbum single-select field
3. THE Database_Schema SHALL include columns for storing Bumbum and Tamanho do bumbum values
4. THE Public_Profile SHALL display Bumbum and Tamanho do bumbum values when provided

### Requirement 10: Update Profile Completeness Validation

**User Story:** As a profile owner, I want accurate profile completion feedback, so that I understand which fields are required for a complete profile.

#### Acceptance Criteria

1. WHEN the Profile_Completeness_Validator calculates completion percentage, THE validator SHALL include Data de Nascimento as a required field
2. WHEN the Profile_Completeness_Validator calculates completion percentage, THE validator SHALL include Categorias Atendidas as a required field
3. WHEN the Profile_Completeness_Validator calculates completion percentage, THE validator SHALL NOT include Idade as a required field
4. WHEN the Profile_Completeness_Validator calculates completion percentage, THE validator SHALL NOT include Peso, Altura, or Tamanho do Pé in the Basic_Info_Section calculation
5. THE Profile_Completeness_Validator SHALL include Características page fields in the overall completion calculation

### Requirement 11: Migrate Existing Profile Data

**User Story:** As a system administrator, I want existing profile data migrated to the new schema, so that no user data is lost during the restructure.

#### Acceptance Criteria

1. WHEN the database migration executes, THE migration SHALL create a birthdate column in the profiles table
2. WHEN the database migration executes, THE migration SHALL create columns for Bumbum and Tamanho do bumbum
3. WHEN the database migration executes, THE migration SHALL create a column for Categorias Atendidas
4. WHEN existing profiles have an Idade value, THE migration SHALL calculate an approximate birthdate
5. WHEN existing profiles have a Serviços value, THE migration SHALL copy the value to Categorias Atendidas
6. THE migration SHALL preserve all existing Physical_Measurements and Body_Characteristics data

### Requirement 12: Maintain User Experience Patterns

**User Story:** As a profile owner, I want consistent navigation and interaction patterns, so that I can efficiently manage my profile across all pages.

#### Acceptance Criteria

1. THE Profile_Edit_Page SHALL maintain tab navigation pattern for keyboard users
2. THE Profile_Edit_Page SHALL maintain required field validation behavior
3. THE Profile_Edit_Page SHALL maintain the welcome modal functionality
4. THE Characteristics_Page SHALL include a sidebar menu item with an appropriate icon
5. WHEN a user saves changes on any profile page, THE application SHALL display a success confirmation message

### Requirement 13: Update API Routes for Characteristics

**User Story:** As a developer, I want dedicated API routes for characteristics data, so that the application can efficiently manage characteristics separately from basic profile information.

#### Acceptance Criteria

1. THE application SHALL provide a GET endpoint at /api/characteristics for retrieving user characteristics
2. THE application SHALL provide a PUT endpoint at /api/characteristics for updating user characteristics
3. WHEN a PUT request is received at /api/characteristics, THE endpoint SHALL validate all field values against allowed options
4. WHEN a PUT request is received at /api/characteristics, THE endpoint SHALL update the database with validated values
5. WHEN a GET request is received at /api/characteristics, THE endpoint SHALL return all characteristics data for the authenticated user

### Requirement 14: Update Features-Services Configuration

**User Story:** As a developer, I want the features-services.json configuration updated, so that the application correctly renders all characteristic options.

#### Acceptance Criteria

1. THE features-services.json configuration SHALL include options for Bumbum field
2. THE features-services.json configuration SHALL include options for Tamanho do bumbum field
3. THE features-services.json configuration SHALL include options for Categorias Atendidas field
4. THE features-services.json configuration SHALL maintain all existing characteristic options
5. WHEN the Characteristics_Page renders, THE page SHALL load options from features-services.json configuration
