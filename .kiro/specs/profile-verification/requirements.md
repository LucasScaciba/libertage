# Requirements Document

## Introduction

O Profile Verification System permite que profissionais cadastradas na plataforma verifiquem suas identidades enviando uma selfie segurando um documento oficial com foto. Este sistema aumenta a confiança dos usuários ao demonstrar autenticidade dos perfis, exibindo um selo visual de verificação em diferentes pontos da interface.

## Glossary

- **Verification_System**: Sistema responsável por gerenciar o processo de verificação de identidade
- **Professional**: Usuário cadastrado na plataforma que deseja verificar seu perfil
- **Verification_Request**: Solicitação de verificação contendo selfie, documento e metadados
- **Verification_Status**: Estado atual da verificação (not_verified, pending, verified, rejected, expired)
- **Verification_Badge**: Selo visual que indica perfil verificado
- **Document_Type**: Tipo de documento aceito (RG ou CNH)
- **Verification_Expiry**: Data de expiração da verificação (90 dias após aprovação)
- **Admin_Panel**: Interface administrativa para revisar solicitações de verificação

## Requirements

### Requirement 1: Submit Verification Request

**User Story:** Como profissional cadastrada, eu quero enviar uma solicitação de verificação com minha selfie e documento, para que eu possa demonstrar autenticidade aos usuários da plataforma.

#### Acceptance Criteria

1. THE Verification_System SHALL accept selfie images in JPEG, PNG, or WebP format up to 10MB
2. THE Verification_System SHALL accept Document_Type values of "RG" or "CNH"
3. WHEN a Professional submits a Verification_Request, THE Verification_System SHALL store the selfie image securely
4. WHEN a Professional submits a Verification_Request, THE Verification_System SHALL set Verification_Status to "pending"
5. WHEN a Professional submits a Verification_Request, THE Verification_System SHALL record the submission timestamp
6. IF a Professional already has a pending Verification_Request, THEN THE Verification_System SHALL reject the new submission with an error message
7. THE Verification_System SHALL validate that the selfie image contains a face before accepting the submission

### Requirement 2: Manage Verification Status

**User Story:** Como administrador, eu quero revisar e aprovar/rejeitar solicitações de verificação, para que apenas perfis autênticos recebam o selo de verificado.

#### Acceptance Criteria

1. THE Verification_System SHALL support five Verification_Status values: "not_verified", "pending", "verified", "rejected", "expired"
2. WHEN an admin approves a Verification_Request, THE Verification_System SHALL set Verification_Status to "verified"
3. WHEN an admin approves a Verification_Request, THE Verification_System SHALL record the verification date
4. WHEN an admin approves a Verification_Request, THE Verification_System SHALL calculate Verification_Expiry as 90 days from verification date
5. WHEN an admin rejects a Verification_Request, THE Verification_System SHALL set Verification_Status to "rejected"
6. WHEN an admin rejects a Verification_Request, THE Verification_System SHALL record a rejection reason
7. WHEN a Verification_Request is rejected, THE Verification_System SHALL allow the Professional to submit a new request

### Requirement 3: Handle Verification Expiry

**User Story:** Como sistema, eu quero expirar verificações após 90 dias, para que as verificações permaneçam atualizadas e confiáveis.

#### Acceptance Criteria

1. WHEN a verification is approved, THE Verification_System SHALL set Verification_Expiry to 90 days from the verification date
2. WHEN current date exceeds Verification_Expiry, THE Verification_System SHALL automatically set Verification_Status to "expired"
3. WHEN Verification_Status becomes "expired", THE Verification_System SHALL allow the Professional to submit a new Verification_Request
4. THE Verification_System SHALL run an automated job daily to check and expire verifications

### Requirement 4: Display Verification Badge

**User Story:** Como usuário da plataforma, eu quero ver um selo de verificação nos perfis verificados, para que eu possa identificar facilmente profissionais autênticas.

#### Acceptance Criteria

1. WHEN Verification_Status is "verified" AND current date is before Verification_Expiry, THE Verification_Badge SHALL be displayed on the profile card in the catalog
2. WHEN Verification_Status is "verified" AND current date is before Verification_Expiry, THE Verification_Badge SHALL be displayed in the profile modal
3. WHEN Verification_Status is "verified" AND current date is before Verification_Expiry, THE Verification_Badge SHALL be displayed on the public profile page
4. WHEN a user hovers over the Verification_Badge, THE Verification_System SHALL display a tooltip with text "Perfil verificado em DD/MM/AAAA"
5. WHEN Verification_Status is NOT "verified" OR current date is after Verification_Expiry, THE Verification_Badge SHALL NOT be displayed

### Requirement 5: Secure Image Storage

**User Story:** Como profissional, eu quero que minhas fotos de verificação sejam armazenadas de forma segura, para que minha privacidade seja protegida.

#### Acceptance Criteria

1. THE Verification_System SHALL store verification images in a private storage bucket
2. THE Verification_System SHALL generate signed URLs with 1-hour expiration for admin review
3. THE Verification_System SHALL NOT expose verification images in public APIs
4. WHEN a Verification_Request is approved or rejected for more than 30 days, THE Verification_System SHALL delete the verification images
5. THE Verification_System SHALL encrypt verification images at rest

### Requirement 6: Admin Review Interface

**User Story:** Como administrador, eu quero uma interface para revisar solicitações pendentes, para que eu possa aprovar ou rejeitar verificações de forma eficiente.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display all Verification_Requests with Verification_Status "pending"
2. THE Admin_Panel SHALL display the selfie image and Document_Type for each pending request
3. THE Admin_Panel SHALL provide "Approve" and "Reject" actions for each pending request
4. WHEN rejecting a request, THE Admin_Panel SHALL require a rejection reason
5. THE Admin_Panel SHALL display submission timestamp for each request
6. THE Admin_Panel SHALL sort requests by submission timestamp (oldest first)

### Requirement 7: Professional Verification Dashboard

**User Story:** Como profissional, eu quero ver o status da minha verificação, para que eu saiba se preciso tomar alguma ação.

#### Acceptance Criteria

1. THE Verification_System SHALL display current Verification_Status to the Professional
2. WHEN Verification_Status is "not_verified", THE Verification_System SHALL display a call-to-action to submit verification
3. WHEN Verification_Status is "pending", THE Verification_System SHALL display an informational message about review in progress
4. WHEN Verification_Status is "verified", THE Verification_System SHALL display the verification date and expiry date
5. WHEN Verification_Status is "rejected", THE Verification_System SHALL display the rejection reason and allow resubmission
6. WHEN Verification_Status is "expired", THE Verification_System SHALL display an expiry message and allow resubmission

### Requirement 8: Notification System

**User Story:** Como profissional, eu quero receber notificações sobre mudanças no status da minha verificação, para que eu fique informada sobre o processo.

#### Acceptance Criteria

1. WHEN Verification_Status changes to "verified", THE Verification_System SHALL send an email notification to the Professional
2. WHEN Verification_Status changes to "rejected", THE Verification_System SHALL send an email notification with the rejection reason
3. WHEN Verification_Status changes to "expired", THE Verification_System SHALL send an email notification 7 days before expiry
4. THE Verification_System SHALL send a reminder email notification 7 days before Verification_Expiry

### Requirement 9: Audit Trail

**User Story:** Como administrador, eu quero um registro de todas as ações de verificação, para que eu possa auditar o processo e resolver disputas.

#### Acceptance Criteria

1. WHEN a Verification_Request is submitted, THE Verification_System SHALL log the event with Professional ID and timestamp
2. WHEN a Verification_Request is approved, THE Verification_System SHALL log the event with admin ID and timestamp
3. WHEN a Verification_Request is rejected, THE Verification_System SHALL log the event with admin ID, rejection reason, and timestamp
4. WHEN a verification expires, THE Verification_System SHALL log the event with timestamp
5. THE Verification_System SHALL retain audit logs for at least 2 years

### Requirement 10: Rate Limiting

**User Story:** Como sistema, eu quero limitar a frequência de submissões de verificação, para que eu possa prevenir abuso do sistema.

#### Acceptance Criteria

1. THE Verification_System SHALL allow a maximum of 3 Verification_Request submissions per Professional per 24-hour period
2. IF a Professional exceeds the rate limit, THEN THE Verification_System SHALL reject the submission with an error message indicating the retry time
3. WHEN a Verification_Request is rejected, THE Verification_System SHALL NOT count it against the rate limit for resubmission
