# Requirements Document

## Introduction

Este documento especifica os requisitos para a funcionalidade de gerenciamento de localização do portal do usuário. A funcionalidade permite que usuários gerenciem seu endereço completo através de uma nova página "Meu Local", enquanto mantém o campo "Estado Base" existente como fallback para filtros do catálogo. O sistema integra-se com a API ViaCEP para preenchimento automático de endereços a partir do CEP.

## Glossary

- **Location_Management_System**: Sistema responsável por gerenciar informações de localização dos usuários
- **Profile_Page**: Página "Meu Perfil" onde usuários gerenciam informações básicas
- **My_Location_Page**: Nova página "Meu Local" para gerenciamento de endereço completo
- **Base_State_Field**: Campo "Estado Base" usado como fallback para filtros quando endereço completo não está disponível
- **Complete_Address**: Conjunto de campos CEP, Rua, Bairro, Cidade, Estado e Número
- **ViaCEP_API**: API externa brasileira para busca de endereços por CEP
- **Catalog_Filter**: Sistema de filtros do catálogo que usa localização para exibir perfis relevantes
- **Public_Profile**: Perfil público do usuário exibido em modais do catálogo e páginas de slug
- **Address_Toggle**: Checkbox "Não possuo local de atendimento" que controla disponibilidade dos campos de endereço

## Requirements

### Requirement 1: Rename Base State Field

**User Story:** Como usuário, eu quero entender claramente a diferença entre "Estado Base" e endereço completo, para que eu saiba qual informação está sendo usada nos filtros do catálogo.

#### Acceptance Criteria

1. THE Profile_Page SHALL display the field label as "Estado Base" instead of "Estado"
2. THE Profile_Page SHALL display the description "Caso você não tenha Local cadastrado no menu Meu Local, vamos utilizar esse estado base para aplicar o filtro no Catálogo" below the Base_State_Field
3. THE Base_State_Field SHALL remain a required field
4. THE Base_State_Field SHALL maintain all existing validation rules

### Requirement 2: Create My Location Page

**User Story:** Como usuário, eu quero uma página dedicada para gerenciar meu endereço completo, para que eu possa fornecer informações detalhadas de localização aos visitantes do meu perfil.

#### Acceptance Criteria

1. THE Location_Management_System SHALL provide a My_Location_Page accessible from the user portal navigation
2. THE My_Location_Page SHALL display an Address_Toggle with the label "Não possuo local de atendimento"
3. WHEN the Address_Toggle is checked, THE My_Location_Page SHALL disable all Complete_Address fields
4. WHEN the Address_Toggle is unchecked, THE My_Location_Page SHALL enable all Complete_Address fields for editing
5. THE My_Location_Page SHALL persist the Address_Toggle state to the database

### Requirement 3: Manage Complete Address Fields

**User Story:** Como usuário, eu quero preencher meu endereço completo com campos específicos, para que visitantes possam ver minha localização detalhada.

#### Acceptance Criteria

1. WHILE the Address_Toggle is unchecked, THE My_Location_Page SHALL display the following fields: CEP, Rua, Bairro, Cidade, Estado, and Número
2. THE My_Location_Page SHALL require the Número field when Address_Toggle is unchecked
3. THE My_Location_Page SHALL allow optional values for CEP, Rua, Bairro, Cidade, and Estado fields when Address_Toggle is unchecked
4. THE My_Location_Page SHALL display the label "Número" for the number field
5. THE My_Location_Page SHALL NOT display a complement field
6. THE My_Location_Page SHALL save Complete_Address data to the database

### Requirement 4: Integrate ViaCEP API

**User Story:** Como usuário, eu quero que o sistema preencha automaticamente meu endereço quando eu digitar o CEP, para que eu economize tempo e evite erros de digitação.

#### Acceptance Criteria

1. WHEN a valid 8-digit CEP is entered, THE Location_Management_System SHALL query the ViaCEP_API
2. WHEN the ViaCEP_API returns address data, THE Location_Management_System SHALL populate Rua, Bairro, Cidade, and Estado fields automatically
3. WHILE the ViaCEP_API request is in progress, THE My_Location_Page SHALL display a loading indicator on the CEP field
4. IF the ViaCEP_API returns an error or invalid CEP, THEN THE Location_Management_System SHALL display an error message to the user
5. IF the ViaCEP_API is unavailable, THEN THE Location_Management_System SHALL display an error message and allow manual entry
6. THE My_Location_Page SHALL allow users to edit all auto-populated fields after ViaCEP_API response
7. THE Location_Management_System SHALL validate that CEP contains exactly 8 digits

### Requirement 5: Display Address in Public Profile

**User Story:** Como visitante do catálogo, eu quero ver o endereço completo do profissional quando disponível, para que eu possa avaliar a proximidade e conveniência.

#### Acceptance Criteria

1. WHEN a user has Complete_Address data saved, THE Public_Profile SHALL display the complete address in catalog modals
2. WHEN a user has Complete_Address data saved, THE Public_Profile SHALL display the complete address in slug pages
3. WHEN a user does not have Complete_Address data, THE Public_Profile SHALL NOT display address details in catalog modals
4. WHEN a user does not have Complete_Address data, THE Public_Profile SHALL NOT display address details in slug pages
5. THE Public_Profile SHALL format the address as "Rua, Número - Bairro, Cidade - Estado, CEP"

### Requirement 6: Apply Catalog Filtering Logic

**User Story:** Como usuário do catálogo, eu quero ver profissionais relevantes baseados em localização, para que eu encontre serviços disponíveis na minha região.

#### Acceptance Criteria

1. WHEN a user has Complete_Address with Estado field populated, THE Catalog_Filter SHALL use the Complete_Address Estado for filtering
2. WHEN a user does not have Complete_Address or Estado field is empty, THE Catalog_Filter SHALL use the Base_State_Field for filtering
3. THE Catalog_Filter SHALL include profiles with Base_State_Field matching the filter criteria when Complete_Address is not available
4. THE Catalog_Filter SHALL maintain backward compatibility with existing filter logic
5. THE Catalog_Filter SHALL prioritize Complete_Address Estado over Base_State_Field when both are available

### Requirement 7: Validate CEP Format

**User Story:** Como usuário, eu quero receber feedback imediato sobre CEPs inválidos, para que eu possa corrigir erros antes de salvar.

#### Acceptance Criteria

1. WHEN a CEP is entered, THE Location_Management_System SHALL validate that it contains only numeric characters
2. WHEN a CEP is entered, THE Location_Management_System SHALL validate that it contains exactly 8 digits
3. IF a CEP has fewer than 8 digits, THEN THE My_Location_Page SHALL display a validation error message
4. IF a CEP has more than 8 digits, THEN THE My_Location_Page SHALL display a validation error message
5. IF a CEP contains non-numeric characters, THEN THE My_Location_Page SHALL display a validation error message
6. THE My_Location_Page SHALL prevent form submission when CEP validation fails

### Requirement 8: Handle ViaCEP API Errors

**User Story:** Como usuário, eu quero entender o que aconteceu quando a busca de CEP falha, para que eu saiba se devo tentar novamente ou preencher manualmente.

#### Acceptance Criteria

1. IF the ViaCEP_API returns a 404 error, THEN THE Location_Management_System SHALL display the message "CEP não encontrado. Verifique o número digitado."
2. IF the ViaCEP_API returns a network error, THEN THE Location_Management_System SHALL display the message "Erro ao buscar CEP. Verifique sua conexão e tente novamente."
3. IF the ViaCEP_API times out, THEN THE Location_Management_System SHALL display the message "A busca de CEP demorou muito. Tente novamente ou preencha manualmente."
4. WHEN a ViaCEP_API error occurs, THE My_Location_Page SHALL keep all address fields enabled for manual entry
5. WHEN a ViaCEP_API error is displayed, THE Location_Management_System SHALL clear the error message when the user modifies the CEP field

### Requirement 9: Persist Location Data

**User Story:** Como usuário, eu quero que minhas informações de localização sejam salvas de forma confiável, para que eu não precise reinseri-las a cada visita.

#### Acceptance Criteria

1. WHEN the user saves My_Location_Page, THE Location_Management_System SHALL persist Address_Toggle state to the database
2. WHEN the user saves My_Location_Page, THE Location_Management_System SHALL persist all Complete_Address fields to the database
3. WHEN the user loads My_Location_Page, THE Location_Management_System SHALL retrieve and display saved Address_Toggle state
4. WHEN the user loads My_Location_Page, THE Location_Management_System SHALL retrieve and display all saved Complete_Address fields
5. THE Location_Management_System SHALL use Supabase PostgreSQL for data persistence
6. THE Location_Management_System SHALL apply Row Level Security policies to location data

### Requirement 10: Maintain Data Consistency

**User Story:** Como desenvolvedor, eu quero garantir que os dados de localização sejam consistentes entre diferentes partes do sistema, para que não haja conflitos ou informações desatualizadas.

#### Acceptance Criteria

1. WHEN Complete_Address is deleted, THE Location_Management_System SHALL preserve the Base_State_Field value
2. WHEN the Address_Toggle is checked, THE Location_Management_System SHALL clear all Complete_Address fields from the database
3. THE Location_Management_System SHALL ensure Base_State_Field is never null or empty
4. THE Location_Management_System SHALL validate that Estado in Complete_Address matches valid Brazilian state codes when provided
5. THE Location_Management_System SHALL validate that Base_State_Field matches valid Brazilian state codes
