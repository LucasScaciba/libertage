# Design Document: Profile Page Restructure

## Overview

This design document specifies the technical implementation for restructuring the profile edit page to improve user experience through better field organization, a dedicated characteristics page, and enhanced data collection. The restructure involves:

- Moving physical measurements from the basic info section to a new characteristics page
- Merging contact and description sections for better content organization
- Replacing the age dropdown with a birthdate picker for automatic age calculation
- Adding new body characteristic fields (buttocks type and size)
- Implementing a new service categories field in the basic information section
- Creating dedicated API routes for characteristics management
- Enhancing currency input with Brazilian Real formatting

The design follows the existing application patterns established in the portal pages (links, media, availability) and maintains consistency with the current UI/UX approach.

## Architecture

### System Components

```mermaid
graph TB
    subgraph "Client Layer"
        PE[ProfileEditPage]
        CP[CharacteristicsPage]
        BP[BirthdatePicker]
        CI[CurrencyInput]
        SC[ServiceCategoriesSelector]
    end
    
    subgraph "API Layer"
        PA[/api/profiles]
        CA[/api/characteristics]
        AU[Age Utility]
    end
    
    subgraph "Data Layer"
        DB[(Supabase Database)]
        CONFIG[features-services.json]
    end
    
    subgraph "Services"
        PCS[ProfileCompletenessService]
        VS[ValidationService]
    end
    
    PE --> PA
    PE --> BP
    PE --> CI
    PE --> SC
    CP --> CA
    CP --> CONFIG
    PA --> DB
    CA --> DB
    PA --> PCS
    CA --> VS
    AU --> DB
    PCS --> DB
```

### Data Flow

1. **Profile Edit Flow**
   - User edits basic information on ProfileEditPage
   - Birthdate is selected via BirthdatePicker component
   - Service categories are selected via multi-select component
   - Currency values are formatted via CurrencyInput component
   - Form submission sends data to /api/profiles endpoint
   - Database stores birthdate as date type
   - ProfileCompletenessService validates required fields

2. **Characteristics Management Flow**
   - User navigates to /portal/characteristics
   - CharacteristicsPage loads current characteristics from /api/characteristics
   - User selects physical and service characteristics
   - Form submission sends data to /api/characteristics endpoint
   - Validation service checks values against features-services.json
   - Database stores characteristics in selected_features JSONB array

3. **Public Profile Display Flow**
   - Public profile page loads profile data
   - Age calculator computes age from stored birthdate
   - Characteristics are displayed from selected_features array
   - Buttocks characteristics are displayed when present

## Components and Interfaces

### 1. ProfileEditPage Component

**Location:** `app/portal/profile/page.tsx`

**Responsibilities:**
- Render restructured basic information section
- Manage merged contact and description section
- Handle pricing section with currency formatting
- Coordinate form submission to /api/profiles

**Changes from Current Implementation:**
- Remove physical measurements (weight, height, shoe_size) from basic info section
- Remove age dropdown, add birthdate picker
- Add service categories multi-select field
- Merge contact and description into single section
- Update pricing inputs with currency mask
- Remove features section (moved to characteristics page)

**Interface:**
```typescript
interface ProfileFormData {
  display_name: string;
  slug: string;
  service_categories: string[]; // NEW: replaces selected_features for services
  region: string; // Estado
  birthdate: string; // NEW: replaces age_attribute
  short_description: string;
  long_description: string;
  whatsapp_number: string;
  whatsapp_enabled: boolean;
  telegram_username: string;
  telegram_enabled: boolean;
  pricing_packages: PricingPackage[];
}

interface PricingPackage {
  label: string;
  price: number; // Stored as number, displayed with currency mask
  description?: string;
}
```

### 2. CharacteristicsPage Component

**Location:** `app/portal/characteristics/page.tsx`

**Responsibilities:**
- Render services section with multi-select fields
- Render physical characteristics section with sliders and selectors
- Load characteristics data from /api/characteristics
- Submit characteristics updates to /api/characteristics
- Follow same layout pattern as other portal pages

**Structure:**
```typescript
interface CharacteristicsPageProps {
  profileId: string;
}

interface CharacteristicsFormData {
  // Services
  payment_methods: string[];
  service_locations: string[];
  clientele: string[];
  languages: string[];
  
  // Physical Characteristics
  height: number; // 140-200 cm
  weight: number; // 40-150 kg
  shoe_size: number; // 33-44
  ethnicity: string;
  body_type: string;
  hair_color: string;
  eye_color: string;
  breast_type: string;
  breast_size: string;
  body_hair: string;
  buttocks_type: string; // NEW
  buttocks_size: string; // NEW
}
```

**Layout Pattern:**
```tsx
<div className="container">
  <header>
    <h1>Características e Serviços</h1>
    <p>Gerencie suas características físicas e detalhes de serviço</p>
  </header>
  
  <Card>
    <CardHeader>
      <CardTitle>Serviços</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Multi-select fields for services */}
    </CardContent>
  </Card>
  
  <Card>
    <CardHeader>
      <CardTitle>Características</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Sliders and selectors for physical characteristics */}
    </CardContent>
  </Card>
  
  <div className="actions">
    <Button type="submit">Salvar Alterações</Button>
  </div>
</div>
```

### 3. BirthdatePicker Component

**Location:** `app/portal/profile/components/BirthdatePicker.tsx`

**Responsibilities:**
- Provide date input for birthdate selection
- Validate age range (18-60 years)
- Display validation errors for invalid ages
- Format date for display and storage

**Interface:**
```typescript
interface BirthdatePicker Props {
  value: string | null; // ISO date string
  onChange: (date: string) => void;
  error?: string;
}

// Validation logic
function validateBirthdate(date: string): { valid: boolean; error?: string } {
  const birthDate = new Date(date);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ? age - 1
    : age;
  
  if (actualAge < 18) {
    return { valid: false, error: "Você deve ter pelo menos 18 anos" };
  }
  
  if (actualAge > 60) {
    return { valid: false, error: "A idade máxima permitida é 60 anos" };
  }
  
  return { valid: true };
}
```

### 4. CurrencyInput Component

**Location:** `app/portal/profile/components/CurrencyInput.tsx`

**Responsibilities:**
- Format numeric input as Brazilian Real (R$)
- Accept only numeric characters
- Display thousands separators and two decimal places
- Store numeric value without formatting

**Interface:**
```typescript
interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  error?: string;
}

// Formatting logic
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function parseCurrency(formatted: string): number {
  // Remove R$, spaces, and convert comma to dot
  const cleaned = formatted.replace(/[R$\s]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}
```

### 5. ServiceCategoriesSelector Component

**Location:** `app/portal/profile/components/ServiceCategoriesSelector.tsx`

**Responsibilities:**
- Display service category options (Massagem, Acompanhante, Chamada de vídeo)
- Allow multiple category selections
- Validate that at least one category is selected
- Replace existing services field from features section

**Interface:**
```typescript
interface ServiceCategoriesSelectorProps {
  value: string[];
  onChange: (categories: string[]) => void;
  error?: string;
}

const SERVICE_CATEGORIES = [
  "Massagem",
  "Acompanhante",
  "Chamada de vídeo"
];
```

## Data Models

### Database Schema Changes

#### 1. Profiles Table Modifications

**New Columns:**
```sql
-- Add birthdate column (replaces age_attribute)
ALTER TABLE profiles ADD COLUMN birthdate DATE;

-- Add service categories column
ALTER TABLE profiles ADD COLUMN service_categories JSONB DEFAULT '[]';

-- Add buttocks characteristics columns
ALTER TABLE profiles ADD COLUMN buttocks_type TEXT;
ALTER TABLE profiles ADD COLUMN buttocks_size TEXT;

-- Add indexes for new columns
CREATE INDEX idx_profiles_birthdate ON profiles(birthdate);
CREATE INDEX idx_profiles_service_categories ON profiles USING GIN(service_categories);
```

**Column Specifications:**
- `birthdate`: DATE type, nullable initially for migration
- `service_categories`: JSONB array, stores selected service categories
- `buttocks_type`: TEXT, stores buttocks type selection
- `buttocks_size`: TEXT, stores buttocks size selection

**Deprecated Columns:**
- `age_attribute`: Keep for backward compatibility during migration, but no longer used in UI

#### 2. Migration Strategy

**Migration File:** `supabase/migrations/013_profile_page_restructure.sql`

```sql
-- Step 1: Add new columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthdate DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS service_categories JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS buttocks_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS buttocks_size TEXT;

-- Step 2: Migrate existing age_attribute to birthdate
-- Calculate approximate birthdate from age (use January 1st of birth year)
UPDATE profiles
SET birthdate = DATE(CONCAT((EXTRACT(YEAR FROM NOW()) - age_attribute)::TEXT, '-01-01'))
WHERE age_attribute IS NOT NULL AND birthdate IS NULL;

-- Step 3: Migrate existing services from selected_features to service_categories
-- Extract service categories from selected_features array
UPDATE profiles
SET service_categories = (
  SELECT jsonb_agg(feature)
  FROM jsonb_array_elements_text(selected_features) AS feature
  WHERE feature IN ('Massagem', 'Acompanhante', 'Chamada de vídeo')
)
WHERE selected_features IS NOT NULL 
  AND jsonb_array_length(selected_features) > 0
  AND service_categories = '[]';

-- Step 4: Remove service categories from selected_features
UPDATE profiles
SET selected_features = (
  SELECT jsonb_agg(feature)
  FROM jsonb_array_elements_text(selected_features) AS feature
  WHERE feature NOT IN ('Massagem', 'Acompanhante', 'Chamada de vídeo')
)
WHERE selected_features IS NOT NULL;

-- Step 5: Add indexes
CREATE INDEX IF NOT EXISTS idx_profiles_birthdate ON profiles(birthdate);
CREATE INDEX IF NOT EXISTS idx_profiles_service_categories ON profiles USING GIN(service_categories);

-- Step 6: Add constraints
ALTER TABLE profiles ADD CONSTRAINT check_birthdate_age 
  CHECK (birthdate IS NULL OR (
    EXTRACT(YEAR FROM AGE(birthdate)) >= 18 AND 
    EXTRACT(YEAR FROM AGE(birthdate)) <= 60
  ));
```

### Configuration Updates

#### features-services.json

**New Categories:**
```json
{
  "categories": [
    {
      "id": "buttocks_type",
      "name": "Bumbum",
      "description": "Tipo de bumbum",
      "multiSelect": false,
      "options": [
        "Natural",
        "Com Silicone"
      ]
    },
    {
      "id": "buttocks_size",
      "name": "Tamanho do Bumbum",
      "description": "Tamanho do bumbum",
      "multiSelect": false,
      "options": [
        "Pequeno",
        "Médio",
        "Grande"
      ]
    }
  ]
}
```

**Note:** The existing "services" category will be removed from features-services.json since service categories are now managed separately in the basic info section.

## API Routes

### 1. GET /api/characteristics

**Purpose:** Retrieve user's characteristics data

**Authentication:** Required (authenticated user)

**Request:**
```typescript
// No body, uses authenticated user's session
```

**Response:**
```typescript
interface CharacteristicsResponse {
  characteristics: {
    // Services
    payment_methods: string[];
    service_locations: string[];
    clientele: string[];
    languages: string[];
    
    // Physical
    height: number;
    weight: number;
    shoe_size: number;
    ethnicity: string;
    body_type: string;
    hair_color: string;
    eye_color: string;
    breast_type: string;
    breast_size: string;
    body_hair: string;
    buttocks_type: string;
    buttocks_size: string;
  };
}
```

**Implementation:**
```typescript
// app/api/characteristics/route.ts
export async function GET(request: Request) {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
    
  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  
  // Extract characteristics from selected_features and direct columns
  const characteristics = extractCharacteristics(profile);
  
  return NextResponse.json({ characteristics });
}
```

### 2. PUT /api/characteristics

**Purpose:** Update user's characteristics data

**Authentication:** Required (authenticated user)

**Request:**
```typescript
interface UpdateCharacteristicsRequest {
  payment_methods?: string[];
  service_locations?: string[];
  clientele?: string[];
  languages?: string[];
  height?: number;
  weight?: number;
  shoe_size?: number;
  ethnicity?: string;
  body_type?: string;
  hair_color?: string;
  eye_color?: string;
  breast_type?: string;
  breast_size?: string;
  body_hair?: string;
  buttocks_type?: string;
  buttocks_size?: string;
}
```

**Response:**
```typescript
interface UpdateCharacteristicsResponse {
  success: boolean;
  characteristics: CharacteristicsData;
}
```

**Validation Logic:**
```typescript
function validateCharacteristics(data: UpdateCharacteristicsRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const config = featuresServicesConfig;
  
  // Validate each field against allowed options from config
  if (data.ethnicity) {
    const ethnicityOptions = config.categories.find(c => c.id === "ethnicity")?.options || [];
    if (!ethnicityOptions.includes(data.ethnicity)) {
      errors.push("Invalid ethnicity value");
    }
  }
  
  // Validate numeric ranges
  if (data.height && (data.height < 140 || data.height > 200)) {
    errors.push("Height must be between 140 and 200 cm");
  }
  
  if (data.weight && (data.weight < 40 || data.weight > 150)) {
    errors.push("Weight must be between 40 and 150 kg");
  }
  
  if (data.shoe_size && (data.shoe_size < 33 || data.shoe_size > 44)) {
    errors.push("Shoe size must be between 33 and 44");
  }
  
  // Validate buttocks fields
  if (data.buttocks_type) {
    const buttocksTypeOptions = config.categories.find(c => c.id === "buttocks_type")?.options || [];
    if (!buttocksTypeOptions.includes(data.buttocks_type)) {
      errors.push("Invalid buttocks type value");
    }
  }
  
  if (data.buttocks_size) {
    const buttocksSizeOptions = config.categories.find(c => c.id === "buttocks_size")?.options || [];
    if (!buttocksSizeOptions.includes(data.buttocks_size)) {
      errors.push("Invalid buttocks size value");
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

**Implementation:**
```typescript
// app/api/characteristics/route.ts
export async function PUT(request: Request) {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Parse request body
  const body = await request.json();
  
  // Validate characteristics
  const validation = validateCharacteristics(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.errors },
      { status: 400 }
    );
  }
  
  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, selected_features")
    .eq("user_id", user.id)
    .single();
    
  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  
  // Update selected_features array and direct columns
  const updatedFeatures = mergeCharacteristics(profile.selected_features, body);
  
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      selected_features: updatedFeatures,
      height: body.height,
      weight: body.weight,
      shoe_size: body.shoe_size,
      buttocks_type: body.buttocks_type,
      buttocks_size: body.buttocks_size,
    })
    .eq("id", profile.id);
    
  if (updateError) {
    return NextResponse.json({ error: "Failed to update characteristics" }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, characteristics: body });
}
```

### 3. Updates to /api/profiles

**Changes Required:**
- Accept `birthdate` field instead of `age_attribute`
- Accept `service_categories` array
- Validate birthdate age range (18-60)
- Update profile completeness validation

**Modified Request Interface:**
```typescript
interface UpdateProfileRequest {
  display_name?: string;
  slug?: string;
  service_categories?: string[]; // NEW
  region?: string;
  birthdate?: string; // NEW: replaces age_attribute
  short_description?: string;
  long_description?: string;
  whatsapp_number?: string;
  whatsapp_enabled?: boolean;
  telegram_username?: string;
  telegram_enabled?: boolean;
  pricing_packages?: PricingPackage[];
}
```

**Validation Updates:**
```typescript
function validateProfileUpdate(data: UpdateProfileRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate birthdate
  if (data.birthdate) {
    const validation = validateBirthdate(data.birthdate);
    if (!validation.valid) {
      errors.push(validation.error!);
    }
  }
  
  // Validate service categories
  if (data.service_categories) {
    const validCategories = ["Massagem", "Acompanhante", "Chamada de vídeo"];
    const invalidCategories = data.service_categories.filter(
      cat => !validCategories.includes(cat)
    );
    if (invalidCategories.length > 0) {
      errors.push("Invalid service categories");
    }
    if (data.service_categories.length === 0) {
      errors.push("At least one service category is required");
    }
  }
  
  // Existing validations...
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Utility Functions

### Age Calculator

**Location:** `lib/utils/age-calculator.ts`

**Purpose:** Calculate age from birthdate for public profile display

**Implementation:**
```typescript
export function calculateAge(birthdate: string | Date): number {
  const birth = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  // Adjust if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

export function validateAgeRange(birthdate: string | Date): {
  valid: boolean;
  age: number;
  error?: string;
} {
  const age = calculateAge(birthdate);
  
  if (age < 18) {
    return {
      valid: false,
      age,
      error: "Você deve ter pelo menos 18 anos"
    };
  }
  
  if (age > 60) {
    return {
      valid: false,
      age,
      error: "A idade máxima permitida é 60 anos"
    };
  }
  
  return {
    valid: true,
    age
  };
}
```

### Currency Formatter

**Location:** `lib/utils/currency-formatter.ts`

**Purpose:** Format and parse Brazilian Real currency values

**Implementation:**
```typescript
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseBRL(formatted: string): number {
  // Remove currency symbol, spaces, and convert comma to dot
  const cleaned = formatted
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '') // Remove thousands separator
    .replace(',', '.'); // Convert decimal separator
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function validateCurrencyInput(input: string): boolean {
  // Allow only numbers, comma, and dot
  return /^[\d.,]*$/.test(input);
}
```

## Profile Completeness Service Updates

**Location:** `lib/services/profile-completeness.service.ts`

**Changes Required:**
1. Replace `age_attribute` check with `birthdate` check
2. Add `service_categories` check
3. Remove physical measurements from basic info calculation
4. Add characteristics fields to overall completion calculation

**Updated Implementation:**
```typescript
export class ProfileCompletenessService {
  static async checkProfileCompleteness(profileId: string): Promise<ProfileCompletenessCheck> {
    const supabase = await createClient();

    // Get profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (!profile) {
      return {
        isComplete: false,
        missingFields: ["Perfil não encontrado"],
        completionPercentage: 0,
      };
    }

    // Get media count
    const { count: mediaCount } = await supabase
      .from("media")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("type", "photo");

    const missingFields: string[] = [];
    const requiredFields = 7; // Total number of required fields
    let completedFields = 0;

    // Check required fields
    if (!profile.display_name || profile.display_name.trim() === "") {
      missingFields.push("Nome");
    } else {
      completedFields++;
    }

    if (!profile.slug || profile.slug.trim() === "") {
      missingFields.push("Slug");
    } else {
      completedFields++;
    }

    if (!profile.region || profile.region.trim() === "") {
      missingFields.push("Estado");
    } else {
      completedFields++;
    }

    // NEW: Check birthdate instead of age_attribute
    if (!profile.birthdate) {
      missingFields.push("Data de Nascimento");
    } else {
      completedFields++;
    }

    // NEW: Check service categories
    if (!profile.service_categories || profile.service_categories.length === 0) {
      missingFields.push("Categorias de Serviço");
    } else {
      completedFields++;
    }

    if (!mediaCount || mediaCount === 0) {
      missingFields.push("Pelo menos uma foto");
    } else {
      completedFields++;
    }

    if (!profile.short_description || profile.short_description.trim() === "") {
      missingFields.push("Descrição curta");
    } else {
      completedFields++;
    }

    const completionPercentage = Math.round((completedFields / requiredFields) * 100);
    const isComplete = missingFields.length === 0;

    return {
      isComplete,
      missingFields,
      completionPercentage,
    };
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After analyzing the acceptance criteria, I've identified the following properties that can be tested through property-based testing. Many of the requirements are UI structure tests (specific examples) rather than universal properties, but the following represent behaviors that should hold across all valid inputs:

### Property 1: Required Field Validation

*For any* profile form submission without required fields (display_name, slug, service_categories, region, birthdate, short_description, long_description), the system should reject the submission and display appropriate validation errors.

**Validates: Requirements 1.2, 4.6**

### Property 2: Multi-Select Functionality

*For any* multi-select field (service categories, payment methods, service locations, clientele, languages), selecting multiple options should result in all selected options being stored in the form state.

**Validates: Requirements 2.3, 7.6**

### Property 3: Birthdate Age Range Validation

*For any* birthdate that represents an age between 18 and 60 years (inclusive), the birthdate picker should accept the value without validation errors.

**Validates: Requirement 3.3**

### Property 4: Short Description Length Validation

*For any* string input to the short description field, if the length exceeds 160 characters, the system should reject the input or truncate it to 160 characters.

**Validates: Requirement 4.4**

### Property 5: Currency Formatting

*For any* numeric value entered in a pricing field, the currency mask should format it as Brazilian Real with R$ prefix, thousands separators, and two decimal places.

**Validates: Requirements 5.1, 5.4**

### Property 6: Currency Input Validation

*For any* input string containing non-numeric characters (excluding comma and dot), the currency mask should reject or filter out the invalid characters.

**Validates: Requirement 5.3**

### Property 7: Currency Storage Round Trip

*For any* formatted currency value (e.g., "R$ 1.234,56"), when stored in the database and retrieved, the numeric value should be preserved without the formatting (e.g., 1234.56).

**Validates: Requirement 5.5**

### Property 8: Birthdate Storage and Retrieval

*For any* valid birthdate value, when stored in the database as a DATE type and retrieved, the date should be preserved exactly.

**Validates: Requirement 3.6**

### Property 9: Age Calculation Accuracy

*For any* birthdate stored in the database, the calculated age displayed on the public profile should match the actual age computed from the current date and the birthdate.

**Validates: Requirements 3.7, 3.8**

### Property 10: Buttocks Characteristics Display

*For any* profile with buttocks_type and buttocks_size values set, the public profile should display both values when rendered.

**Validates: Requirement 9.4**

### Property 11: Profile Completeness with Birthdate

*For any* profile without a birthdate value, the profile completeness validator should mark the profile as incomplete and include "Data de Nascimento" in the missing fields list.

**Validates: Requirement 10.1**

### Property 12: Profile Completeness with Service Categories

*For any* profile without service categories, the profile completeness validator should mark the profile as incomplete and include "Categorias Atendidas" in the missing fields list.

**Validates: Requirement 10.2**

### Property 13: Profile Completeness Excludes Old Age Field

*For any* profile, the profile completeness validator should not check for the age_attribute field when calculating completion percentage.

**Validates: Requirement 10.3**

### Property 14: Profile Completeness Excludes Physical Measurements from Basic Info

*For any* profile, the profile completeness validator should not include weight, height, or shoe_size in the basic information section completion calculation.

**Validates: Requirement 10.4**

### Property 15: Age Migration Calculation

*For any* existing profile with an age_attribute value, the migration should calculate a birthdate that results in the same age (within the current year).

**Validates: Requirement 11.4**

### Property 16: Service Categories Migration

*For any* existing profile with service values in selected_features, the migration should copy those values to the service_categories field.

**Validates: Requirement 11.5**

### Property 17: Data Preservation During Migration

*For any* existing profile with physical measurements or body characteristics, the migration should preserve all existing data without loss.

**Validates: Requirement 11.6**

### Property 18: Keyboard Navigation

*For any* required field in the profile edit page, pressing Tab should move focus to the next field in the expected order.

**Validates: Requirement 12.1**

### Property 19: Required Field Validation Behavior

*For any* required field in the profile edit page, attempting to submit the form without filling that field should trigger a validation error.

**Validates: Requirement 12.2**

### Property 20: Success Message Display

*For any* successful save operation on any profile page, the system should display a success confirmation message to the user.

**Validates: Requirement 12.5**

### Property 21: Characteristics API Validation

*For any* PUT request to /api/characteristics with field values not in the allowed options from features-services.json, the endpoint should reject the request with a validation error.

**Validates: Requirement 13.3**

### Property 22: Characteristics API Update

*For any* valid PUT request to /api/characteristics, the endpoint should update the database with the provided values and return success.

**Validates: Requirement 13.4**

### Property 23: Characteristics API Retrieval

*For any* authenticated user making a GET request to /api/characteristics, the endpoint should return all characteristics data for that user.

**Validates: Requirement 13.5**

### Property 24: Configuration Preservation

*For any* existing characteristic option in features-services.json before the update, that option should still be present after adding the new buttocks fields.

**Validates: Requirement 14.4**

### Property 25: Configuration Loading

*For any* characteristic field on the Characteristics page, the options displayed should match the options defined in features-services.json for that field's category.

**Validates: Requirement 14.5**

## Error Handling

### Client-Side Error Handling

1. **Form Validation Errors**
   - Display inline validation errors for each field
   - Prevent form submission when validation fails
   - Highlight invalid fields with error styling
   - Show error messages in Portuguese

2. **API Request Errors**
   - Display user-friendly error messages for network failures
   - Handle 401 Unauthorized: redirect to login
   - Handle 404 Not Found: display "Profile not found" message
   - Handle 400 Bad Request: display validation error details
   - Handle 500 Server Error: display generic error message

3. **Date Input Errors**
   - Validate birthdate age range (18-60)
   - Display specific error messages for age violations
   - Prevent invalid date formats

4. **Currency Input Errors**
   - Filter non-numeric characters in real-time
   - Display helper text for expected format
   - Handle edge cases (empty input, very large numbers)

### Server-Side Error Handling

1. **Authentication Errors**
   ```typescript
   if (!user) {
     return NextResponse.json(
       { error: "Unauthorized" },
       { status: 401 }
     );
   }
   ```

2. **Validation Errors**
   ```typescript
   if (!validation.valid) {
     return NextResponse.json(
       { 
         error: "Validation failed", 
         details: validation.errors 
       },
       { status: 400 }
     );
   }
   ```

3. **Database Errors**
   ```typescript
   if (error) {
     console.error("Database error:", error);
     return NextResponse.json(
       { error: "Failed to update profile" },
       { status: 500 }
     );
   }
   ```

4. **Migration Errors**
   - Wrap migration in transaction
   - Rollback on any error
   - Log detailed error information
   - Preserve original data if migration fails

### Error Recovery Strategies

1. **Graceful Degradation**
   - If characteristics API fails, allow basic profile editing
   - If age calculation fails, display birthdate instead
   - If currency formatting fails, display raw number

2. **Data Validation**
   - Validate all inputs before database operations
   - Use database constraints as final safety net
   - Sanitize user inputs to prevent injection

3. **User Feedback**
   - Always provide clear error messages
   - Suggest corrective actions when possible
   - Maintain form state on error (don't clear user input)

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, UI structure, and integration points
- **Property tests**: Verify universal properties across all inputs using randomized test data

### Unit Testing

Unit tests should focus on:

1. **UI Structure Tests** (Examples from requirements)
   - Verify Basic Info section contains exactly 5 fields
   - Verify physical measurements are removed from Basic Info
   - Verify Characteristics page has correct sections
   - Verify sidebar menu includes Characteristics link
   - Verify field ordering matches specification

2. **Edge Cases**
   - Birthdate representing age < 18 (should reject)
   - Birthdate representing age > 60 (should reject)
   - Empty service categories submission (should reject)
   - Short description exactly 160 characters (should accept)
   - Short description 161 characters (should reject/truncate)

3. **Integration Tests**
   - API route authentication
   - Database migration execution
   - Configuration file loading
   - Component rendering with real data

4. **Specific Examples**
   - Welcome modal displays on first visit
   - Success message displays after save
   - Currency formats "1234.56" as "R$ 1.234,56"
   - Age 25 calculates correct birthdate in migration

### Property-Based Testing

**Library Selection:** Use `fast-check` for TypeScript/JavaScript property-based testing

**Configuration:** Each property test should run minimum 100 iterations

**Test Tagging:** Each test must reference its design property
```typescript
// Feature: profile-page-restructure, Property 3: Birthdate Age Range Validation
test('accepts valid birthdates for ages 18-60', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 18, max: 60 }),
      (age) => {
        const birthdate = calculateBirthdateFromAge(age);
        const validation = validateBirthdate(birthdate);
        expect(validation.valid).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test Examples:**

1. **Property 3: Birthdate Age Range Validation**
   ```typescript
   // Generate random birthdates representing ages 18-60
   fc.assert(
     fc.property(
       fc.date({
         min: new Date(new Date().getFullYear() - 60, 0, 1),
         max: new Date(new Date().getFullYear() - 18, 11, 31)
       }),
       (birthdate) => {
         const validation = validateBirthdate(birthdate.toISOString());
         expect(validation.valid).toBe(true);
       }
     )
   );
   ```

2. **Property 5: Currency Formatting**
   ```typescript
   // Generate random numeric values
   fc.assert(
     fc.property(
       fc.float({ min: 0, max: 999999.99 }),
       (value) => {
         const formatted = formatBRL(value);
         expect(formatted).toMatch(/^R\$ [\d.]+,\d{2}$/);
         expect(formatted).toContain('R$');
       }
     )
   );
   ```

3. **Property 7: Currency Storage Round Trip**
   ```typescript
   // Generate random currency values
   fc.assert(
     fc.property(
       fc.float({ min: 0, max: 999999.99 }),
       (originalValue) => {
         const formatted = formatBRL(originalValue);
         const parsed = parseBRL(formatted);
         expect(parsed).toBeCloseTo(originalValue, 2);
       }
     )
   );
   ```

4. **Property 9: Age Calculation Accuracy**
   ```typescript
   // Generate random birthdates
   fc.assert(
     fc.property(
       fc.date({
         min: new Date(1960, 0, 1),
         max: new Date(2005, 11, 31)
       }),
       (birthdate) => {
         const calculatedAge = calculateAge(birthdate);
         const expectedAge = new Date().getFullYear() - birthdate.getFullYear();
         // Allow for birthday not yet occurred this year
         expect(calculatedAge).toBeGreaterThanOrEqual(expectedAge - 1);
         expect(calculatedAge).toBeLessThanOrEqual(expectedAge);
       }
     )
   );
   ```

5. **Property 21: Characteristics API Validation**
   ```typescript
   // Generate random invalid characteristic values
   fc.assert(
     fc.property(
       fc.string().filter(s => !VALID_ETHNICITY_OPTIONS.includes(s)),
       async (invalidEthnicity) => {
         const response = await fetch('/api/characteristics', {
           method: 'PUT',
           body: JSON.stringify({ ethnicity: invalidEthnicity })
         });
         expect(response.status).toBe(400);
       }
     )
   );
   ```

### Test Coverage Goals

- Unit test coverage: 80% minimum
- Property test coverage: All 25 properties implemented
- Integration test coverage: All API routes and database operations
- E2E test coverage: Critical user flows (profile creation, characteristics update)

### Testing Tools

- **Unit Testing:** Jest + React Testing Library
- **Property Testing:** fast-check
- **Integration Testing:** Supertest for API routes
- **E2E Testing:** Playwright or Cypress
- **Database Testing:** Supabase local development environment

## Implementation Notes

### Migration Considerations

1. **Backward Compatibility**
   - Keep `age_attribute` column during transition period
   - Support both age and birthdate in API temporarily
   - Gradual rollout to minimize disruption

2. **Data Integrity**
   - Use database transactions for migration
   - Validate migrated data before committing
   - Create backup before migration
   - Test migration on staging environment first

3. **Rollback Plan**
   - Keep original age_attribute values
   - Document rollback SQL script
   - Monitor for migration errors
   - Have manual data correction procedures ready

### Performance Considerations

1. **Database Queries**
   - Use indexes on birthdate and service_categories columns
   - Optimize characteristics retrieval with single query
   - Cache features-services.json configuration

2. **Client-Side Performance**
   - Lazy load Characteristics page
   - Debounce currency input formatting
   - Minimize re-renders on form updates

3. **API Response Times**
   - Target < 200ms for GET requests
   - Target < 500ms for PUT requests
   - Use database connection pooling

### Security Considerations

1. **Input Validation**
   - Validate all inputs on both client and server
   - Sanitize user inputs to prevent XSS
   - Use parameterized queries to prevent SQL injection

2. **Authentication**
   - Verify user authentication on all API routes
   - Ensure users can only update their own profiles
   - Use Supabase RLS policies for additional security

3. **Data Privacy**
   - Store birthdate securely
   - Only display age on public profiles (not birthdate)
   - Respect user privacy settings for contact information

### Accessibility Considerations

1. **Form Accessibility**
   - Proper label associations for all inputs
   - ARIA labels for custom components
   - Keyboard navigation support
   - Screen reader announcements for validation errors

2. **Date Picker Accessibility**
   - Keyboard-accessible date selection
   - Clear date format instructions
   - Error messages announced to screen readers

3. **Currency Input Accessibility**
   - Clear formatting instructions
   - Announce formatted value to screen readers
   - Support for screen reader currency reading

## Deployment Strategy

### Phase 1: Database Migration
1. Create migration file
2. Test on staging environment
3. Create database backup
4. Run migration on production
5. Verify data integrity

### Phase 2: Backend Updates
1. Deploy new API routes (/api/characteristics)
2. Update existing /api/profiles route
3. Deploy utility functions
4. Update ProfileCompletenessService
5. Test API endpoints

### Phase 3: Frontend Updates
1. Deploy new components (BirthdatePicker, CurrencyInput, ServiceCategoriesSelector)
2. Update ProfileEditPage
3. Deploy CharacteristicsPage
4. Update sidebar navigation
5. Test user flows

### Phase 4: Configuration Updates
1. Update features-services.json
2. Verify configuration loading
3. Test characteristics options display

### Phase 5: Monitoring and Validation
1. Monitor error logs
2. Track user adoption
3. Gather user feedback
4. Fix any issues discovered
5. Optimize performance if needed

## Success Metrics

1. **User Experience**
   - Profile completion rate increases
   - Time to complete profile decreases
   - User satisfaction with new structure

2. **Technical Metrics**
   - Zero data loss during migration
   - API response times within targets
   - No increase in error rates

3. **Business Metrics**
   - More complete profiles in catalog
   - Better search/filter accuracy with service categories
   - Improved profile quality with detailed characteristics

## Future Enhancements

1. **Age Verification**
   - Integrate with ID verification service
   - Validate birthdate against government ID

2. **Advanced Characteristics**
   - Add more body characteristic options
   - Support for custom characteristic values
   - Characteristic-based search filters

3. **Profile Analytics**
   - Track which characteristics drive more views
   - Suggest characteristics to add based on successful profiles
   - A/B test different characteristic displays

4. **Internationalization**
   - Support for multiple languages
   - Localized date formats
   - Currency support for other countries
