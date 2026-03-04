# Requirements Document

## Introduction

Este documento especifica os requisitos para o sistema de Links Externos estilo Linktree da plataforma Libertage. O sistema permitirá que profissionais premium adicionem múltiplos links personalizados em seus perfis públicos, com detecção automática de ícones baseada no domínio e ordenação customizável. A funcionalidade será integrada ao perfil público e ao portal do profissional, respeitando os limites de cada plano de assinatura.

## Glossary

- **Link_Manager**: Componente responsável pelo gerenciamento de links externos no portal do profissional
- **Link_Display**: Componente responsável pela exibição de links no perfil público
- **External_Link**: Registro de um link externo contendo título, URL, ordem e metadados
- **Icon_Detector**: Serviço que identifica e retorna o ícone apropriado baseado no domínio da URL
- **Professional**: Usuário da plataforma com perfil público
- **Plan_Validator**: Serviço que valida limites de recursos baseado no plano de assinatura
- **URL_Validator**: Serviço que valida formato e segurança de URLs
- **Link_Repository**: Camada de acesso a dados para operações CRUD de links externos
- **RLS_Policy**: Row Level Security policy do Supabase para controle de acesso

## Requirements

### Requirement 1: Armazenamento de Links Externos

**User Story:** Como um profissional, eu quero que meus links externos sejam armazenados de forma segura e estruturada, para que eu possa gerenciá-los de forma confiável.

#### Acceptance Criteria

1. THE Link_Repository SHALL store External_Links with fields: id, profile_id, title, url, display_order, icon_key, created_at, updated_at
2. THE Link_Repository SHALL enforce a unique constraint on (profile_id, display_order)
3. THE Link_Repository SHALL enforce a foreign key constraint on profile_id referencing profiles table
4. THE RLS_Policy SHALL allow professionals to read only their own External_Links
5. THE RLS_Policy SHALL allow professionals to insert External_Links only for their own profile_id
6. THE RLS_Policy SHALL allow professionals to update only their own External_Links
7. THE RLS_Policy SHALL allow professionals to delete only their own External_Links
8. THE RLS_Policy SHALL allow public read access to External_Links for published profiles

### Requirement 2: Validação de URLs

**User Story:** Como um profissional, eu quero que URLs inválidas sejam rejeitadas, para que meu perfil contenha apenas links funcionais.

#### Acceptance Criteria

1. WHEN an External_Link is created or updated, THE URL_Validator SHALL verify the URL starts with http:// or https://
2. WHEN an External_Link is created or updated, THE URL_Validator SHALL verify the URL contains a valid domain
3. WHEN an External_Link is created or updated, THE URL_Validator SHALL reject URLs exceeding 2048 characters
4. IF a URL fails validation, THEN THE Link_Manager SHALL return an error message describing the validation failure
5. THE URL_Validator SHALL sanitize URLs to prevent XSS attacks

### Requirement 3: Detecção Automática de Ícones

**User Story:** Como um profissional, eu quero que ícones sejam detectados automaticamente baseados no domínio, para que meus links tenham uma aparência profissional sem esforço manual.

#### Acceptance Criteria

1. WHEN an External_Link is created or updated, THE Icon_Detector SHALL extract the domain from the URL
2. WHEN the domain matches instagram.com or instagram.com.br, THE Icon_Detector SHALL return icon_key "instagram"
3. WHEN the domain matches whatsapp.com or wa.me or api.whatsapp.com, THE Icon_Detector SHALL return icon_key "whatsapp"
4. WHEN the domain matches linkedin.com, THE Icon_Detector SHALL return icon_key "linkedin"
5. WHEN the domain matches facebook.com or fb.com, THE Icon_Detector SHALL return icon_key "facebook"
6. WHEN the domain matches twitter.com or x.com, THE Icon_Detector SHALL return icon_key "twitter"
7. WHEN the domain matches youtube.com or youtu.be, THE Icon_Detector SHALL return icon_key "youtube"
8. WHEN the domain matches tiktok.com, THE Icon_Detector SHALL return icon_key "tiktok"
9. WHEN the domain matches github.com, THE Icon_Detector SHALL return icon_key "github"
10. WHEN the domain does not match any known pattern, THE Icon_Detector SHALL return icon_key "link"
11. THE Icon_Detector SHALL store the detected icon_key in the External_Link record

### Requirement 4: Limites por Plano de Assinatura

**User Story:** Como administrador da plataforma, eu quero que limites de links sejam aplicados por plano, para que a monetização seja respeitada.

#### Acceptance Criteria

1. WHEN a Professional with plan "Free" attempts to create an External_Link, THE Plan_Validator SHALL reject the operation if the Professional already has 3 or more External_Links
2. WHEN a Professional with plan "Premium" attempts to create an External_Link, THE Plan_Validator SHALL reject the operation if the Professional already has 10 or more External_Links
3. WHEN a Professional with plan "Black" attempts to create an External_Link, THE Plan_Validator SHALL allow the operation regardless of current count
4. IF the limit is exceeded, THEN THE Link_Manager SHALL return an error message indicating the plan limit and suggesting an upgrade
5. THE Plan_Validator SHALL retrieve the current plan from the profiles table

### Requirement 5: Gerenciamento de Links no Portal

**User Story:** Como um profissional, eu quero gerenciar meus links externos no portal, para que eu possa adicionar, editar, remover e reordenar meus links.

#### Acceptance Criteria

1. THE Link_Manager SHALL display all External_Links for the authenticated Professional ordered by display_order ascending
2. WHEN a Professional clicks "Adicionar Link", THE Link_Manager SHALL display a form with fields: title (required, max 100 characters) and url (required)
3. WHEN a Professional submits the add form with valid data, THE Link_Manager SHALL create an External_Link with display_order set to max(existing display_order) + 1
4. WHEN a Professional clicks "Editar" on an External_Link, THE Link_Manager SHALL display a form pre-filled with current title and url
5. WHEN a Professional submits the edit form with valid data, THE Link_Manager SHALL update the External_Link preserving the display_order
6. WHEN a Professional clicks "Remover" on an External_Link, THE Link_Manager SHALL display a confirmation dialog
7. WHEN a Professional confirms removal, THE Link_Manager SHALL delete the External_Link and reorder remaining links to fill the gap
8. THE Link_Manager SHALL display the detected icon next to each External_Link in the management interface
9. THE Link_Manager SHALL display the current count and plan limit (e.g., "3/10 links utilizados")

### Requirement 6: Reordenação de Links

**User Story:** Como um profissional, eu quero reordenar meus links, para que eu possa controlar a ordem de exibição no meu perfil público.

#### Acceptance Criteria

1. THE Link_Manager SHALL display up and down arrow buttons for each External_Link except the first and last
2. WHEN a Professional clicks the up arrow on an External_Link, THE Link_Manager SHALL swap the display_order with the previous External_Link
3. WHEN a Professional clicks the down arrow on an External_Link, THE Link_Manager SHALL swap the display_order with the next External_Link
4. WHEN display_order values are swapped, THE Link_Manager SHALL update both External_Links in a single transaction
5. IF the transaction fails, THEN THE Link_Manager SHALL rollback changes and display an error message

### Requirement 7: Exibição no Perfil Público

**User Story:** Como um visitante, eu quero ver os links externos de um profissional, para que eu possa acessar suas redes sociais e outros recursos.

#### Acceptance Criteria

1. WHEN a visitor accesses a published profile, THE Link_Display SHALL retrieve all External_Links for that profile ordered by display_order ascending
2. THE Link_Display SHALL render each External_Link as a card containing the icon, title, and clickable area
3. WHEN a visitor clicks on an External_Link card, THE Link_Display SHALL open the URL in a new browser tab
4. THE Link_Display SHALL apply rel="noopener noreferrer" to all External_Link anchors for security
5. THE Link_Display SHALL display a visual hover effect on External_Link cards
6. IF a profile has no External_Links, THEN THE Link_Display SHALL not render the links section
7. THE Link_Display SHALL render icons using the icon_key stored in each External_Link

### Requirement 8: Validação de Títulos

**User Story:** Como um profissional, eu quero que títulos de links sejam validados, para que meu perfil mantenha qualidade e consistência.

#### Acceptance Criteria

1. WHEN an External_Link is created or updated, THE Link_Manager SHALL verify the title is not empty
2. WHEN an External_Link is created or updated, THE Link_Manager SHALL verify the title does not exceed 100 characters
3. WHEN an External_Link is created or updated, THE Link_Manager SHALL trim leading and trailing whitespace from the title
4. IF a title fails validation, THEN THE Link_Manager SHALL return an error message describing the validation failure

### Requirement 9: Tratamento de Erros

**User Story:** Como um profissional, eu quero receber mensagens de erro claras, para que eu possa corrigir problemas ao gerenciar meus links.

#### Acceptance Criteria

1. IF a database operation fails, THEN THE Link_Manager SHALL log the error details and return a user-friendly message in Portuguese
2. IF a network error occurs during link creation, THEN THE Link_Manager SHALL display "Erro ao criar link. Verifique sua conexão e tente novamente."
3. IF a plan limit is exceeded, THEN THE Link_Manager SHALL display "Você atingiu o limite de X links do plano Y. Faça upgrade para adicionar mais links."
4. IF a URL validation fails, THEN THE Link_Manager SHALL display "URL inválida. Certifique-se de incluir http:// ou https://"
5. IF a title validation fails, THEN THE Link_Manager SHALL display "O título deve ter entre 1 e 100 caracteres"

### Requirement 10: Performance e Otimização

**User Story:** Como um visitante, eu quero que os links carreguem rapidamente, para que eu tenha uma boa experiência ao visualizar perfis.

#### Acceptance Criteria

1. THE Link_Display SHALL retrieve External_Links using a single database query with the profile data
2. THE Link_Display SHALL cache icon components to avoid re-rendering
3. WHEN rendering multiple External_Links, THE Link_Display SHALL complete initial render within 100ms on standard hardware
4. THE Link_Repository SHALL create a database index on (profile_id, display_order) for efficient querying

