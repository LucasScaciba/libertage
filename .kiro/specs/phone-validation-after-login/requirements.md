# Requirements Document

## Introduction

Este documento especifica os requisitos para o sistema de validação de telefone após login via Google OAuth. O sistema garante que usuários recém-cadastrados validem um número de telefone através de OTP SMS antes de acessar o portal, estabelecendo um mecanismo de verificação de identidade e segurança.

## Glossary

- **Authentication_System**: O sistema de autenticação Google OAuth já implementado na aplicação
- **Phone_Validator**: O componente responsável por validar números de telefone via OTP SMS
- **OTP_Generator**: O componente que gera e envia códigos de verificação via Twilio
- **Security_Phone**: O número de telefone validado armazenado de forma criptografada para fins de segurança
- **Public_Phone**: O número de telefone opcional exibido publicamente no perfil do usuário
- **Portal**: A área restrita da aplicação acessível apenas após validação de telefone
- **Rate_Limiter**: O componente que controla limites de tentativas e cooldowns
- **User_Profile**: O perfil público do usuário no sistema
- **Verification_Session**: Uma sessão de validação de telefone com tentativas e timestamps associados

## Requirements

### Requirement 1: Mandatory Phone Validation for New Users

**User Story:** Como administrador do sistema, eu quero que novos usuários validem um telefone após o primeiro login, para que a plataforma garanta que são pessoas reais.

#### Acceptance Criteria

1. WHEN a user completes Google OAuth authentication for the first time, THE Authentication_System SHALL redirect the user to the phone validation screen
2. WHILE the Security_Phone is not validated, THE Portal SHALL deny access to all portal routes
3. WHILE the Security_Phone is not validated, THE User_Profile SHALL prevent profile publication
4. THE Phone_Validator SHALL mark a phone as validated by setting the phone_verified_at timestamp
5. WHEN the Security_Phone is validated, THE Portal SHALL grant full access to portal routes

### Requirement 2: OTP Generation and Delivery

**User Story:** Como usuário recém-cadastrado, eu quero receber um código de verificação via SMS, para que eu possa validar meu telefone.

#### Acceptance Criteria

1. WHEN a user submits a valid phone number, THE OTP_Generator SHALL generate a 6-digit numeric code
2. WHEN the OTP is generated, THE OTP_Generator SHALL send the code via Twilio SMS API within 5 seconds
3. THE OTP_Generator SHALL set the OTP expiration time to 10 minutes from generation
4. WHEN the OTP is sent, THE Phone_Validator SHALL store the hashed OTP value in the database
5. IF the Twilio API returns an error, THEN THE Phone_Validator SHALL display a descriptive error message to the user

### Requirement 3: OTP Verification

**User Story:** Como usuário, eu quero inserir o código recebido via SMS, para que meu telefone seja validado.

#### Acceptance Criteria

1. WHEN a user submits an OTP code, THE Phone_Validator SHALL compare it against the stored hashed value
2. WHEN the OTP matches and is not expired, THE Phone_Validator SHALL set the phone_verified_at timestamp to the current time
3. WHEN the OTP matches, THE Phone_Validator SHALL encrypt and store the phone number in the phone_security field
4. WHEN the OTP matches, THE Phone_Validator SHALL pre-populate the phone_public field with the validated phone number
5. IF the OTP does not match, THEN THE Phone_Validator SHALL increment the phone_attempts_today counter
6. IF the OTP does not match, THEN THE Phone_Validator SHALL display an error message stating "Código inválido"
7. IF the OTP is expired, THEN THE Phone_Validator SHALL display an error message stating "Código expirado"

### Requirement 4: Rate Limiting for Verification Attempts

**User Story:** Como administrador do sistema, eu quero limitar tentativas de verificação, para que o sistema previna abuso e fraude.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL track verification attempts per user per calendar day
2. WHEN a user makes a verification attempt, THE Rate_Limiter SHALL increment the phone_attempts_today counter
3. WHEN the phone_attempts_today counter reaches 5, THE Rate_Limiter SHALL block further verification attempts
4. WHILE the user has reached the daily limit, THE Phone_Validator SHALL display an error message stating "Limite de tentativas atingido. Tente novamente amanhã"
5. WHEN a new calendar day begins (00:00 UTC), THE Rate_Limiter SHALL reset the phone_attempts_today counter to 0
6. THE Rate_Limiter SHALL store the phone_last_attempt_at timestamp for each verification attempt

### Requirement 5: OTP Resend Cooldown

**User Story:** Como administrador do sistema, eu quero impor um cooldown entre reenvios de OTP, para que o sistema previna spam de SMS.

#### Acceptance Criteria

1. WHEN a user requests to resend an OTP, THE Rate_Limiter SHALL check the phone_last_attempt_at timestamp
2. WHEN less than 60 seconds have elapsed since the last OTP send, THE Rate_Limiter SHALL block the resend request
3. WHILE the cooldown is active, THE Phone_Validator SHALL display the remaining seconds until resend is available
4. WHEN 60 seconds have elapsed, THE OTP_Generator SHALL allow a new OTP to be generated and sent
5. WHEN a new OTP is sent, THE Rate_Limiter SHALL update the phone_last_attempt_at timestamp to the current time

### Requirement 6: Security Phone Storage

**User Story:** Como administrador do sistema, eu quero armazenar o telefone de segurança de forma criptografada, para que dados sensíveis sejam protegidos.

#### Acceptance Criteria

1. WHEN a phone number is validated, THE Phone_Validator SHALL encrypt the phone number using AES-256 encryption
2. THE Phone_Validator SHALL store the encrypted phone number in the phone_security field
3. THE Phone_Validator SHALL never expose the phone_security field in public API responses
4. THE Phone_Validator SHALL never display the phone_security field in the User_Profile public view
5. WHEN the system needs to verify phone ownership, THE Phone_Validator SHALL decrypt the phone_security field for comparison

### Requirement 7: Public Phone Management

**User Story:** Como usuário, eu quero gerenciar o telefone exibido no meu perfil público, para que eu possa controlar qual número é visível.

#### Acceptance Criteria

1. WHEN the Security_Phone is validated, THE User_Profile SHALL pre-populate the phone_public field with the same phone number
2. THE User_Profile SHALL allow the user to edit the phone_public field independently
3. WHEN the user changes the phone_public field to a different number, THE Phone_Validator SHALL require re-validation via OTP
4. WHILE the new phone_public number is not validated, THE User_Profile SHALL not update the displayed phone number
5. THE User_Profile SHALL display the phone_public field in the public profile view
6. WHERE the user clears the phone_public field, THE User_Profile SHALL display no phone number publicly

### Requirement 8: Phone Number Format Validation

**User Story:** Como usuário, eu quero que o sistema valide o formato do meu telefone, para que eu receba feedback imediato sobre erros de digitação.

#### Acceptance Criteria

1. WHEN a user enters a phone number, THE Phone_Validator SHALL validate it follows E.164 international format
2. IF the phone number does not match E.164 format, THEN THE Phone_Validator SHALL display an error message stating "Formato de telefone inválido. Use o formato internacional (+55...)"
3. THE Phone_Validator SHALL accept phone numbers with country code prefix
4. THE Phone_Validator SHALL strip whitespace and formatting characters before validation
5. WHEN the phone number is valid, THE Phone_Validator SHALL enable the "Enviar código" button

### Requirement 9: Database Schema Requirements

**User Story:** Como desenvolvedor, eu quero que o esquema de banco de dados suporte todos os campos necessários, para que o sistema funcione corretamente.

#### Acceptance Criteria

1. THE Authentication_System SHALL ensure the users table contains a phone_security column of type encrypted text
2. THE Authentication_System SHALL ensure the users table contains a phone_public column of type text allowing null values
3. THE Authentication_System SHALL ensure the users table contains a phone_verified_at column of type timestamp allowing null values
4. THE Authentication_System SHALL ensure the users table contains a phone_attempts_today column of type integer with default value 0
5. THE Authentication_System SHALL ensure the users table contains a phone_last_attempt_at column of type timestamp allowing null values
6. THE Authentication_System SHALL create an index on the phone_verified_at column for query performance

### Requirement 10: Session Persistence During Validation

**User Story:** Como usuário, eu quero que minha sessão seja mantida durante a validação, para que eu não precise fazer login novamente.

#### Acceptance Criteria

1. WHILE the user is on the phone validation screen, THE Authentication_System SHALL maintain the active session
2. WHEN the user refreshes the page during validation, THE Phone_Validator SHALL preserve the Verification_Session state
3. IF the user closes the browser during validation, THEN THE Authentication_System SHALL redirect to the phone validation screen on next login
4. THE Phone_Validator SHALL store the pending phone number in the Verification_Session until validation completes
5. WHEN validation completes successfully, THE Phone_Validator SHALL clear the Verification_Session data

### Requirement 11: Twilio Integration

**User Story:** Como desenvolvedor, eu quero integrar com a API do Twilio, para que o sistema possa enviar SMS de forma confiável.

#### Acceptance Criteria

1. THE OTP_Generator SHALL authenticate with Twilio API using account SID and auth token
2. WHEN sending an SMS, THE OTP_Generator SHALL use the Twilio Verify API service
3. IF the Twilio API returns a rate limit error, THEN THE OTP_Generator SHALL display an error message stating "Serviço temporariamente indisponível. Tente novamente em alguns minutos"
4. IF the Twilio API returns an invalid phone number error, THEN THE Phone_Validator SHALL display an error message stating "Número de telefone inválido"
5. THE OTP_Generator SHALL log all Twilio API responses for debugging and audit purposes
6. THE OTP_Generator SHALL handle Twilio webhook callbacks for delivery status updates

### Requirement 12: Accessibility and User Experience

**User Story:** Como usuário, eu quero uma interface clara e acessível, para que eu possa completar a validação facilmente.

#### Acceptance Criteria

1. THE Phone_Validator SHALL display clear instructions stating "Insira seu número de telefone para receber um código de verificação"
2. THE Phone_Validator SHALL use input fields with appropriate ARIA labels for screen readers
3. WHEN an error occurs, THE Phone_Validator SHALL display error messages with ARIA live regions
4. THE Phone_Validator SHALL provide visual feedback during OTP sending with a loading indicator
5. WHEN the OTP is sent successfully, THE Phone_Validator SHALL display a success message stating "Código enviado para [phone number]"
6. THE Phone_Validator SHALL auto-focus the OTP input field after successful code delivery
7. THE Phone_Validator SHALL support keyboard navigation for all interactive elements
