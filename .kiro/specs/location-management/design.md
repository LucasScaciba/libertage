# Design Document: Location Management

## Overview

O sistema de gerenciamento de localização permite que usuários gerenciem informações detalhadas de endereço através de uma nova página dedicada "Meu Local", enquanto mantém o campo "Estado Base" existente como fallback para filtros do catálogo. O sistema integra-se com a API ViaCEP para preenchimento automático de endereços brasileiros e exibe informações de localização em perfis públicos quando disponíveis.

### Key Design Decisions

1. **Separação de Responsabilidades**: O campo "Estado Base" permanece na página "Meu Perfil" como informação obrigatória e fallback, enquanto o endereço completo é gerenciado em uma página dedicada "Meu Local".

2. **Integração com ViaCEP**: Utilizamos a API pública ViaCEP para preenchimento automático de endereços, reduzindo erros de digitação e melhorando a experiência do usuário.

3. **Campos Opcionais com Toggle**: O checkbox "Não possuo local de atendimento" permite que profissionais que não atendem em local físico desabilitem os campos de endereço, mantendo apenas o Estado Base para filtros.

4. **Priorização de Dados**: Quando disponível, o Estado do endereço completo tem prioridade sobre o Estado Base para filtros do catálogo, garantindo maior precisão na localização.

5. **Persistência Incremental**: Todos os campos de endereço são salvos individualmente no banco de dados, permitindo salvamento parcial e recuperação de dados em caso de falha.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Profile Page    │         │  My Location     │         │
│  │  (Estado Base)   │         │  Page            │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                             │                    │
│           └──────────┬──────────────────┘                    │
│                      │                                       │
│           ┌──────────▼──────────┐                           │
│           │  Location Service   │                           │
│           └──────────┬──────────┘                           │
└──────────────────────┼──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                     API Layer                                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Profile API     │         │  Location API    │         │
│  │  /api/profiles   │         │  /api/location   │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                             │                    │
│           │         ┌───────────────────┘                    │
│           │         │                                        │
│           │    ┌────▼─────────┐                             │
│           │    │  ViaCEP      │                             │
│           │    │  Integration │                             │
│           │    └──────────────┘                             │
└───────────┼──────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────┐
│                  Data Layer (Supabase)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐           │
│  │  profiles table                              │           │
│  │  - city (Estado Base)                        │           │
│  │  - region (legacy)                           │           │
│  │  - has_no_location (boolean)                 │           │
│  │  - address_cep (string)                      │           │
│  │  - address_street (string)                   │           │
│  │  - address_neighborhood (string)             │           │
│  │  - address_city (string)                     │           │
│  │  - address_state (string)                    │           │
│  │  - address_number (string)                   │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. CEP Lookup Flow
```
User enters CEP → Validate format (8 digits) → Call ViaCEP API
                                                      ↓
                                            ┌─────────┴─────────┐
                                            │                   │
                                         Success            Error
                                            │                   │
                                    Auto-populate         Show error
                                    address fields        Allow manual
                                            │                   │
                                            └─────────┬─────────┘
                                                      ↓
                                              User can edit fields
                                                      ↓
                                                Save to DB
```

#### 2. Profile Display Flow
```
Load Profile → Check address_state exists?
                        │
              ┌─────────┴─────────┐
              │                   │
             Yes                 No
              │                   │
      Use address_state    Use city (Estado Base)
              │                   │
              └─────────┬─────────┘
                        ↓
              Display in catalog/public profile
```

## Components and Interfaces

### Frontend Components

#### 1. MyLocationPage Component
**Location**: `app/portal/location/page.tsx`

**Responsibilities**:
- Render location management form
- Handle address toggle state
- Integrate with ViaCEP for CEP lookup
- Validate and submit location data
- Display loading and error states

**Props**: None (uses internal state and API calls)

**State**:
```typescript
interface LocationFormState {
  hasNoLocation: boolean;
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  number: string;
  isLoadingCep: boolean;
  cepError: string | null;
}
```

#### 2. ProfilePage Component (Modified)
**Location**: `app/portal/profile/page.tsx`

**Changes**:
- Update label from "Estado" to "Estado Base"
- Add description text below field
- Maintain existing validation and behavior

#### 3. AppSidebar Component (Modified)
**Location**: `components/app-sidebar.tsx`

**Changes**:
- Add new navigation item "Meu Local" with MapPin icon
- Position after "Meu Perfil" in navigation list

### API Endpoints

#### 1. GET /api/location
**Purpose**: Retrieve user's location data

**Response**:
```typescript
{
  hasNoLocation: boolean;
  cep: string | null;
  street: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  number: string | null;
}
```

#### 2. PATCH /api/location
**Purpose**: Update user's location data

**Request Body**:
```typescript
{
  hasNoLocation: boolean;
  cep?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  number?: string;
}
```

**Validation**:
- If `hasNoLocation` is false, `number` is required
- CEP must be 8 digits if provided
- State must be valid Brazilian state code if provided

**Response**:
```typescript
{
  success: boolean;
  location: LocationData;
}
```

#### 3. GET /api/location/cep/:cep
**Purpose**: Proxy to ViaCEP API for address lookup

**Parameters**:
- `cep`: 8-digit CEP string

**Response**:
```typescript
{
  cep: string;
  logradouro: string;  // street
  bairro: string;      // neighborhood
  localidade: string;  // city
  uf: string;          // state
  erro?: boolean;      // present if CEP not found
}
```

**Error Handling**:
- 404: CEP not found
- 500: ViaCEP API unavailable
- 400: Invalid CEP format

### Services

#### LocationService
**Location**: `lib/services/location.service.ts`

**Methods**:

```typescript
class LocationService {
  /**
   * Fetch address data from ViaCEP API
   * @param cep - 8-digit CEP string
   * @returns Address data or error
   */
  static async fetchAddressByCep(cep: string): Promise<ViaCepResponse>;

  /**
   * Validate CEP format
   * @param cep - CEP string to validate
   * @returns true if valid, false otherwise
   */
  static validateCep(cep: string): boolean;

  /**
   * Validate Brazilian state code
   * @param state - State code to validate
   * @returns true if valid, false otherwise
   */
  static validateStateCode(state: string): boolean;

  /**
   * Get effective state for filtering
   * Prioritizes address_state over city (Estado Base)
   * @param profile - Profile object
   * @returns State code to use for filtering
   */
  static getEffectiveState(profile: Profile): string;

  /**
   * Format address for display
   * @param location - Location data
   * @returns Formatted address string
   */
  static formatAddress(location: LocationData): string;
}
```

#### ViaCepResponse Interface
```typescript
interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}
```

## Data Models

### Database Schema Changes

#### profiles Table (Modified)
```sql
ALTER TABLE profiles
ADD COLUMN has_no_location BOOLEAN DEFAULT FALSE,
ADD COLUMN address_cep VARCHAR(8),
ADD COLUMN address_street TEXT,
ADD COLUMN address_neighborhood TEXT,
ADD COLUMN address_city TEXT,
ADD COLUMN address_state VARCHAR(2),
ADD COLUMN address_number TEXT;

-- Add check constraint for state codes
ALTER TABLE profiles
ADD CONSTRAINT check_address_state_valid 
CHECK (
  address_state IS NULL OR 
  address_state IN (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  )
);

-- Add check constraint for city (Estado Base) - ensure it's never null
ALTER TABLE profiles
ADD CONSTRAINT check_city_not_null 
CHECK (city IS NOT NULL AND city != '');

-- Add index for address_state for filtering performance
CREATE INDEX idx_profiles_address_state ON profiles(address_state);

-- Add comment for clarity
COMMENT ON COLUMN profiles.city IS 'Estado Base - used as fallback when address_state is not available';
COMMENT ON COLUMN profiles.address_state IS 'State from complete address - takes priority over city for filtering';
```

### TypeScript Type Updates

#### Profile Type Extension
```typescript
// Add to types/index.ts
export interface Profile {
  // ... existing fields ...
  
  // Location fields
  has_no_location: boolean;
  address_cep: string | null;
  address_street: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_number: string | null;
}

export interface LocationData {
  hasNoLocation: boolean;
  cep: string | null;
  street: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  number: string | null;
}

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}
```

### Row Level Security (RLS) Policies

```sql
-- Users can read their own location data
CREATE POLICY "Users can read own location"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own location data
CREATE POLICY "Users can update own location"
ON profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Public can read published profiles with location for display
-- (existing policy already covers this)
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CEP Validation

*For any* CEP input string, the system SHALL accept it for API lookup only if it contains exactly 8 numeric digits, and SHALL prevent form submission for any CEP that fails this validation.

**Validates: Requirements 4.7, 7.1, 7.2, 7.6**

### Property 2: Toggle State Controls Field Availability

*For any* location form state, when the Address_Toggle is checked, all Complete_Address fields SHALL be disabled, and when unchecked, all Complete_Address fields SHALL be enabled for editing.

**Validates: Requirements 2.3, 2.4**

### Property 3: Address Toggle Persistence Round-Trip

*For any* Address_Toggle state (checked or unchecked), saving the form and then reloading the page SHALL result in the same toggle state being displayed.

**Validates: Requirements 2.5, 9.1, 9.3**

### Property 4: Complete Address Persistence Round-Trip

*For any* set of Complete_Address field values, saving the form and then reloading the page SHALL result in the same address data being displayed in all fields.

**Validates: Requirements 3.6, 9.2, 9.4**

### Property 5: Conditional Field Requirement

*For any* location form state where Address_Toggle is unchecked, the form SHALL require the Número field and SHALL allow submission without CEP, Rua, Bairro, Cidade, or Estado fields.

**Validates: Requirements 3.2, 3.3**

### Property 6: ViaCEP Auto-Population

*For any* valid 8-digit CEP that exists in the ViaCEP database, entering it SHALL trigger an API call and SHALL automatically populate the Rua, Bairro, Cidade, and Estado fields with the returned data.

**Validates: Requirements 4.1, 4.2**

### Property 7: ViaCEP Error Handling Preserves Editability

*For any* ViaCEP API error (404, network error, timeout), the system SHALL display an appropriate error message, SHALL keep all address fields enabled for manual entry, and SHALL clear the error message when the user modifies the CEP field.

**Validates: Requirements 4.4, 8.4, 8.5**

### Property 8: Address Display Based on Data Availability

*For any* profile, the public profile (in catalog modals and slug pages) SHALL display the complete formatted address if and only if the profile has Complete_Address data saved.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 9: Address Formatting Consistency

*For any* Complete_Address data with all fields populated, the formatted address string SHALL follow the pattern "Rua, Número - Bairro, Cidade - Estado, CEP".

**Validates: Requirements 5.5**

### Property 10: Effective State Priority Logic

*For any* profile, the function getEffectiveState SHALL return address_state when it is populated, and SHALL return city (Base_State_Field) when address_state is null or empty, ensuring catalog filters use the most specific location data available.

**Validates: Requirements 6.1, 6.2, 6.3, 6.5**

### Property 11: Row Level Security Enforcement

*For any* user attempting to read or modify location data, the database SHALL only allow access to their own profile's location data and SHALL reject attempts to access other users' location data.

**Validates: Requirements 9.6**

### Property 12: Data Integrity on Toggle Change

*For any* profile, when the Address_Toggle is checked (has_no_location = true), all Complete_Address fields SHALL be cleared from the database, and the Base_State_Field SHALL remain unchanged.

**Validates: Requirements 10.1, 10.2**

### Property 13: Base State Non-Null Constraint

*For any* profile at any time, the Base_State_Field (city) SHALL never be null or empty string.

**Validates: Requirements 10.3**

### Property 14: State Code Validation

*For any* state value (whether in Base_State_Field or Complete_Address Estado), the system SHALL only accept values that match valid Brazilian state codes (AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO).

**Validates: Requirements 1.4, 10.4, 10.5**

## Error Handling

### Client-Side Error Handling

#### 1. CEP Validation Errors
**Trigger**: User enters invalid CEP format
**Behavior**:
- Display inline error message below CEP field
- Prevent form submission
- Clear error when user corrects input
**Error Messages**:
- "CEP deve conter exatamente 8 dígitos"
- "CEP deve conter apenas números"

#### 2. ViaCEP API Errors
**Trigger**: API call fails or returns error
**Behavior**:
- Display error message near CEP field
- Keep all fields enabled for manual entry
- Clear error when user modifies CEP
**Error Messages**:
- 404: "CEP não encontrado. Verifique o número digitado."
- Network: "Erro ao buscar CEP. Verifique sua conexão e tente novamente."
- Timeout: "A busca de CEP demorou muito. Tente novamente ou preencha manualmente."

#### 3. Form Validation Errors
**Trigger**: User attempts to submit invalid form
**Behavior**:
- Highlight invalid fields
- Display error messages below each invalid field
- Prevent form submission
- Focus first invalid field
**Error Messages**:
- "Campo obrigatório" (for Número when toggle is unchecked)
- "Estado inválido" (for invalid state codes)

#### 4. Save Errors
**Trigger**: API call to save location data fails
**Behavior**:
- Display toast notification with error
- Keep form data intact
- Allow user to retry
**Error Messages**:
- "Erro ao salvar localização. Tente novamente."
- "Você não tem permissão para modificar esta localização."

### Server-Side Error Handling

#### 1. Authentication Errors
**Status Code**: 401 Unauthorized
**Trigger**: User not authenticated
**Response**:
```json
{
  "error": "Não autenticado",
  "code": "UNAUTHORIZED"
}
```

#### 2. Authorization Errors
**Status Code**: 403 Forbidden
**Trigger**: User attempts to modify another user's location
**Response**:
```json
{
  "error": "Você não tem permissão para modificar esta localização",
  "code": "FORBIDDEN"
}
```

#### 3. Validation Errors
**Status Code**: 400 Bad Request
**Trigger**: Invalid data submitted
**Response**:
```json
{
  "error": "Dados inválidos",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "cep",
    "message": "CEP deve conter exatamente 8 dígitos"
  }
}
```

#### 4. Database Errors
**Status Code**: 500 Internal Server Error
**Trigger**: Database operation fails
**Response**:
```json
{
  "error": "Erro ao salvar dados. Tente novamente.",
  "code": "DATABASE_ERROR"
}
```
**Logging**: Log full error details server-side for debugging

#### 5. ViaCEP Proxy Errors
**Status Code**: Varies (404, 500, 503)
**Trigger**: ViaCEP API unavailable or returns error
**Response**:
```json
{
  "error": "Erro ao buscar CEP",
  "code": "VIACEP_ERROR",
  "details": {
    "cep": "12345678",
    "message": "CEP não encontrado"
  }
}
```

### Error Recovery Strategies

#### 1. Optimistic UI Updates
- Update UI immediately on user action
- Revert changes if API call fails
- Show error notification on failure

#### 2. Retry Logic
- Implement exponential backoff for transient errors
- Maximum 3 retry attempts for ViaCEP API calls
- User-initiated retry for save operations

#### 3. Graceful Degradation
- Allow manual address entry if ViaCEP is unavailable
- Display cached data if real-time fetch fails
- Maintain form state across errors

#### 4. Data Consistency
- Use database transactions for multi-field updates
- Validate data integrity before committing
- Rollback on any validation failure

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Property-Based Testing

**Library**: fast-check (for TypeScript/JavaScript)

**Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: location-management, Property {number}: {property_text}`

**Property Test Implementation**:

Each correctness property defined above MUST be implemented as a SINGLE property-based test:

1. **Property 1: CEP Validation**
   - Generate random strings with various lengths and character types
   - Verify only 8-digit numeric strings are accepted
   - Verify form submission is prevented for invalid CEPs

2. **Property 2: Toggle State Controls Field Availability**
   - Generate random toggle states (true/false)
   - Verify field disabled state matches toggle state

3. **Property 3: Address Toggle Persistence Round-Trip**
   - Generate random toggle states
   - Save, reload, verify state matches

4. **Property 4: Complete Address Persistence Round-Trip**
   - Generate random address data
   - Save, reload, verify all fields match

5. **Property 5: Conditional Field Requirement**
   - Generate random form states with toggle unchecked
   - Verify Número is required, other fields optional

6. **Property 6: ViaCEP Auto-Population**
   - Generate valid CEPs
   - Mock ViaCEP responses
   - Verify fields are populated correctly

7. **Property 7: ViaCEP Error Handling**
   - Generate various error scenarios
   - Verify error messages and field editability

8. **Property 8: Address Display Based on Data Availability**
   - Generate profiles with and without complete address
   - Verify display logic in both contexts

9. **Property 9: Address Formatting Consistency**
   - Generate random complete addresses
   - Verify formatted string matches pattern

10. **Property 10: Effective State Priority Logic**
    - Generate profiles with various combinations of address_state and city
    - Verify correct state is returned

11. **Property 11: Row Level Security Enforcement**
    - Generate requests from different users
    - Verify access control is enforced

12. **Property 12: Data Integrity on Toggle Change**
    - Generate profiles with address data
    - Toggle has_no_location to true
    - Verify address fields cleared, city preserved

13. **Property 13: Base State Non-Null Constraint**
    - Attempt to create/update profiles with null/empty city
    - Verify constraint is enforced

14. **Property 14: State Code Validation**
    - Generate random state codes (valid and invalid)
    - Verify only valid Brazilian state codes are accepted

### Unit Testing

**Focus Areas**:

1. **UI Component Tests**
   - MyLocationPage renders correctly
   - Profile page displays "Estado Base" label and description
   - Navigation includes "Meu Local" link
   - Toggle checkbox controls field visibility
   - Loading states display correctly

2. **Form Validation Tests**
   - Required field validation (Número when toggle unchecked)
   - CEP format validation (8 digits, numeric only)
   - State code validation (valid Brazilian states)
   - Form submission prevention on validation errors

3. **API Integration Tests**
   - GET /api/location returns user's location data
   - PATCH /api/location saves location data correctly
   - GET /api/location/cep/:cep proxies to ViaCEP
   - Error responses have correct status codes and messages

4. **Service Layer Tests**
   - LocationService.validateCep() validates format correctly
   - LocationService.validateStateCode() validates state codes
   - LocationService.getEffectiveState() returns correct priority
   - LocationService.formatAddress() formats correctly

5. **Error Handling Tests**
   - ViaCEP 404 error displays correct message
   - Network errors display correct message
   - Timeout errors display correct message
   - Error messages clear on CEP modification

6. **Edge Cases**
   - Empty form submission
   - Partial address data
   - Toggle state changes with existing data
   - Concurrent save operations
   - Special characters in address fields

7. **Integration Tests**
   - End-to-end flow: enter CEP → auto-populate → save → reload
   - Profile display with and without address
   - Catalog filtering with address_state vs city
   - RLS policy enforcement

### Test Data

**Valid Brazilian State Codes**:
```typescript
const VALID_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];
```

**Sample Valid CEPs**:
```typescript
const SAMPLE_CEPS = [
  '01310100', // Av. Paulista, São Paulo
  '20040020', // Centro, Rio de Janeiro
  '30130100', // Centro, Belo Horizonte
  '40020000', // Centro, Salvador
  '80010000', // Centro, Curitiba
];
```

**Sample Address Data**:
```typescript
const SAMPLE_ADDRESS = {
  cep: '01310100',
  street: 'Avenida Paulista',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  number: '1578'
};
```

### Test Coverage Goals

- **Line Coverage**: Minimum 80%
- **Branch Coverage**: Minimum 75%
- **Function Coverage**: Minimum 85%
- **Critical Paths**: 100% (CEP validation, data persistence, RLS policies)

### Continuous Integration

- Run all tests on every pull request
- Block merge if any test fails
- Generate coverage reports
- Alert on coverage decrease

