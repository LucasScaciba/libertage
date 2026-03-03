# Requirements Document

## Introduction

This document specifies requirements for two related features in a premium service marketplace profile management system: WhatsApp and Telegram contact integration, and cover photo selection functionality. These features enhance profile visibility and communication options for service providers in the Brazilian market.

## Glossary

- **Profile_Edit_Page**: The page where users edit their profile information (app/portal/profile/page.tsx)
- **Catalog_Page**: The public-facing page displaying service provider profiles (app/page.tsx)
- **Profile_Modal**: The dialog component that displays detailed profile information on the Catalog_Page
- **Media_Item**: A photo or video associated with a profile, stored in the media table
- **Cover_Photo**: The primary photo displayed on catalog cards, marked with is_cover flag
- **Contact_Button**: A clickable button that opens WhatsApp or Telegram communication
- **ProfileService**: The service class managing profile data operations
- **MediaService**: The service class managing media operations including setCoverImage()
- **Basic_Information_Section**: The first section of the Profile_Edit_Page containing core profile fields

## Requirements

### Requirement 1: WhatsApp Contact Integration

**User Story:** As a service provider, I want to add my WhatsApp number to my profile, so that potential clients can contact me directly via WhatsApp.

#### Acceptance Criteria

1. THE Profile_Edit_Page SHALL display a WhatsApp number input field in the Basic_Information_Section
2. THE Profile_Edit_Page SHALL display a WhatsApp visibility checkbox in the Basic_Information_Section
3. WHEN a user enters a WhatsApp number, THE Profile_Edit_Page SHALL accept only numeric digits
4. WHEN a user saves the profile, THE ProfileService SHALL store the WhatsApp number in the whatsapp_number field
5. WHEN a user saves the profile, THE ProfileService SHALL store the visibility preference in the whatsapp_enabled field
6. WHEN whatsapp_enabled is true, THE Profile_Modal SHALL display a WhatsApp contact button
7. THE WhatsApp contact button SHALL have a green background color (#25D366)
8. WHEN a user clicks the WhatsApp button, THE Catalog_Page SHALL open https://wa.me/55{number} in a new browser tab
9. THE WhatsApp URL SHALL prepend +55 (Brazil country code) to the stored number

### Requirement 2: Telegram Contact Integration

**User Story:** As a service provider, I want to add my Telegram username to my profile, so that potential clients can contact me directly via Telegram.

#### Acceptance Criteria

1. THE Profile_Edit_Page SHALL display a Telegram username input field in the Basic_Information_Section
2. THE Profile_Edit_Page SHALL display a Telegram visibility checkbox in the Basic_Information_Section
3. WHEN a user enters a Telegram username, THE Profile_Edit_Page SHALL accept the username without the @ symbol
4. WHEN a user saves the profile, THE ProfileService SHALL store the Telegram username in the telegram_username field
5. WHEN a user saves the profile, THE ProfileService SHALL store the visibility preference in the telegram_enabled field
6. WHEN telegram_enabled is true, THE Profile_Modal SHALL display a Telegram contact button
7. THE Telegram contact button SHALL have a blue background color (#0088cc)
8. WHEN a user clicks the Telegram button, THE Catalog_Page SHALL open https://t.me/{username} in a new browser tab

### Requirement 3: ProfileService Interface Updates

**User Story:** As a developer, I want the ProfileService interfaces to include contact fields, so that TypeScript type checking ensures data consistency.

#### Acceptance Criteria

1. THE CreateProfileInput interface SHALL include whatsapp_number as an optional string field
2. THE CreateProfileInput interface SHALL include whatsapp_enabled as an optional boolean field
3. THE CreateProfileInput interface SHALL include telegram_username as an optional string field
4. THE CreateProfileInput interface SHALL include telegram_enabled as an optional boolean field
5. THE UpdateProfileInput interface SHALL include whatsapp_number as an optional string field
6. THE UpdateProfileInput interface SHALL include whatsapp_enabled as an optional boolean field
7. THE UpdateProfileInput interface SHALL include telegram_username as an optional string field
8. THE UpdateProfileInput interface SHALL include telegram_enabled as an optional boolean field

### Requirement 4: Cover Photo Selection UI

**User Story:** As a service provider, I want to select which photo should be my cover photo, so that I can control which image represents my profile on catalog cards.

#### Acceptance Criteria

1. WHEN a Media_Item is displayed in the Profile_Edit_Page media section, THE Profile_Edit_Page SHALL display a "Set as Cover" button for each photo
2. WHEN a Media_Item has is_cover set to true, THE Profile_Edit_Page SHALL display a visual indicator showing it is the current cover
3. WHEN a user clicks "Set as Cover" on a photo, THE Profile_Edit_Page SHALL call MediaService.setCoverImage()
4. THE "Set as Cover" button SHALL only be displayed for photo type Media_Items
5. THE "Set as Cover" button SHALL not be displayed for video type Media_Items

### Requirement 5: Cover Photo Selection Logic

**User Story:** As a service provider, I want only one photo to be marked as cover at a time, so that my profile has a clear primary image.

#### Acceptance Criteria

1. WHEN MediaService.setCoverImage() is called, THE MediaService SHALL set is_cover to false for all other photos in the profile
2. WHEN MediaService.setCoverImage() is called, THE MediaService SHALL set is_cover to true for the selected Media_Item
3. WHEN a new photo is uploaded and no cover exists, THE Profile_Edit_Page SHALL automatically set the new photo as cover
4. WHEN a cover photo is deleted, THE system SHALL not automatically assign a new cover photo

### Requirement 6: Cover Photo Display on Catalog

**User Story:** As a potential client, I want to see the service provider's chosen cover photo on catalog cards, so that I can quickly identify profiles.

#### Acceptance Criteria

1. WHEN displaying a profile card on the Catalog_Page, THE Catalog_Page SHALL display the Media_Item where is_cover is true
2. WHEN no Media_Item has is_cover set to true, THE Catalog_Page SHALL display the first Media_Item in sort order
3. WHEN no Media_Items exist for a profile, THE Catalog_Page SHALL display no image on the profile card
4. THE cover photo SHALL be displayed with object-fit cover to maintain aspect ratio

### Requirement 7: Contact Button Positioning

**User Story:** As a potential client, I want to easily find contact buttons in the profile modal, so that I can quickly reach out to service providers.

#### Acceptance Criteria

1. WHEN the Profile_Modal displays contact buttons, THE Profile_Modal SHALL position them in the right column sidebar
2. WHEN both WhatsApp and Telegram are enabled, THE Profile_Modal SHALL display both buttons vertically stacked
3. WHEN only WhatsApp is enabled, THE Profile_Modal SHALL display only the WhatsApp button
4. WHEN only Telegram is enabled, THE Profile_Modal SHALL display only the Telegram button
5. WHEN neither contact method is enabled, THE Profile_Modal SHALL display no contact buttons
6. THE contact buttons SHALL be displayed above the pricing information card

### Requirement 8: Input Validation and Formatting

**User Story:** As a service provider, I want clear feedback on input formatting, so that I enter contact information correctly.

#### Acceptance Criteria

1. WHEN a user enters non-numeric characters in the WhatsApp field, THE Profile_Edit_Page SHALL remove non-numeric characters
2. THE WhatsApp input field SHALL display placeholder text indicating the expected format
3. THE Telegram input field SHALL display placeholder text indicating username format without @
4. WHEN a user enters @ in the Telegram field, THE Profile_Edit_Page SHALL remove the @ symbol
5. THE WhatsApp input field SHALL have a label indicating it is for Brazilian numbers (+55)
