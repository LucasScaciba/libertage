# Requirements Document

## Introduction

Este documento define os requisitos para a funcionalidade de Página Pública do Perfil, que permite que visitantes acessem perfis de usuários através de URLs amigáveis usando slugs únicos. A feature inclui validação de slugs, preview de URLs, otimização SEO e interface para gerenciamento do slug pessoal.

## Glossary

- **Profile_System**: O sistema responsável por gerenciar perfis de usuários e suas páginas públicas
- **Slug**: Identificador único alfanumérico usado na URL do perfil (ex: "@maria-silva")
- **Visitor**: Qualquer pessoa que acessa a plataforma, autenticada ou não
- **Profile_Owner**: Usuário que possui e gerencia seu próprio perfil
- **Public_Profile_Page**: Página web acessível publicamente que exibe informações do perfil
- **Slug_Validator**: Componente responsável por validar regras de formato e unicidade de slugs
- **SEO_Meta_Generator**: Componente que gera meta tags para otimização de busca e compartilhamento social

## Requirements

### Requirement 1: Acesso à Página Pública do Perfil

**User Story:** Como visitante da plataforma, eu quero acessar uma página pública de perfil através de uma URL amigável, para que eu possa visualizar todas as informações públicas do usuário.

#### Acceptance Criteria

1. WHEN a Visitor accesses a URL in the format "site.com/perfil/@{slug}", THE Profile_System SHALL display the Public_Profile_Page for the corresponding Profile_Owner
2. THE Public_Profile_Page SHALL display all public information including name, avatar, bio, and other public profile data
3. WHEN a Visitor accesses a URL with a non-existent slug, THE Profile_System SHALL display a 404 error page
4. THE Public_Profile_Page SHALL be accessible without authentication

### Requirement 2: Slug Creation and Uniqueness

**User Story:** Como usuário da plataforma, eu quero criar um slug único para meu perfil, para que outras pessoas possam me encontrar através de uma URL personalizada.

#### Acceptance Criteria

1. WHEN a Profile_Owner creates or updates their slug, THE Slug_Validator SHALL verify that the slug is unique across all profiles
2. IF a Profile_Owner attempts to use a slug that already exists, THEN THE Profile_System SHALL return an error message indicating the slug is already in use
3. WHEN a new user registers, THE Profile_System SHALL automatically generate a slug based on the user's name
4. THE Profile_System SHALL store the slug in the users table slug column

### Requirement 3: Slug Format Validation

**User Story:** Como usuário da plataforma, eu quero que meu slug siga regras claras de formatação, para que minha URL seja válida e profissional.

#### Acceptance Criteria

1. THE Slug_Validator SHALL enforce a minimum length of 4 characters for all slugs
2. THE Slug_Validator SHALL accept only lowercase letters, numbers, and hyphens in slugs
3. WHEN a Profile_Owner enters a slug with less than 4 characters, THE Profile_System SHALL display an error message indicating the minimum length requirement
4. WHEN a Profile_Owner enters a slug with invalid characters, THE Profile_System SHALL display an error message listing the allowed characters
5. THE Slug_Validator SHALL reject slugs containing uppercase letters, spaces, or special characters other than hyphens

### Requirement 4: Slug Preview Interface

**User Story:** Como usuário editando meu perfil, eu quero ver um preview da minha URL pública enquanto digito meu slug, para que eu possa visualizar como ficará o link final.

#### Acceptance Criteria

1. WHILE a Profile_Owner is editing their slug, THE Profile_System SHALL display a real-time preview of the complete URL
2. THE Profile_System SHALL format the preview as "site.com/perfil/@{slug}" where {slug} is the current input value
3. WHEN the slug input changes, THE Profile_System SHALL update the preview within 100ms
4. THE Profile_System SHALL display validation status (valid/invalid) alongside the preview

### Requirement 5: Public Profile Access from Dashboard

**User Story:** Como usuário logado, eu quero acessar minha página pública diretamente do dashboard, para que eu possa visualizar como outros veem meu perfil.

#### Acceptance Criteria

1. THE Profile_System SHALL display a "Ver meu perfil público" button in the user dashboard
2. WHEN a Profile_Owner clicks the "Ver meu perfil público" button, THE Profile_System SHALL navigate to their Public_Profile_Page
3. THE Profile_System SHALL open the Public_Profile_Page in the same tab maintaining the application context

### Requirement 6: SEO Optimization and Social Sharing

**User Story:** Como usuário da plataforma, eu quero que minha página pública seja otimizada para mecanismos de busca e compartilhamento social, para que meu perfil tenha boa visibilidade quando compartilhado.

#### Acceptance Criteria

1. THE SEO_Meta_Generator SHALL generate Open Graph meta tags for each Public_Profile_Page including title, description, and image
2. THE SEO_Meta_Generator SHALL generate Twitter Card meta tags for each Public_Profile_Page
3. THE Public_Profile_Page SHALL include a canonical URL meta tag pointing to the profile's unique URL
4. THE SEO_Meta_Generator SHALL use the Profile_Owner's name as the page title
5. THE SEO_Meta_Generator SHALL use the Profile_Owner's bio as the meta description
6. THE SEO_Meta_Generator SHALL use the Profile_Owner's avatar as the Open Graph image

### Requirement 7: Slug Automatic Generation

**User Story:** Como novo usuário da plataforma, eu quero que um slug seja gerado automaticamente para mim, para que eu tenha uma URL pública funcional desde o início.

#### Acceptance Criteria

1. WHEN a new user completes registration, THE Profile_System SHALL automatically generate a slug from the user's name
2. THE Profile_System SHALL convert the name to lowercase and replace spaces with hyphens
3. IF the generated slug already exists, THE Profile_System SHALL append a numeric suffix to ensure uniqueness
4. THE Profile_System SHALL ensure the auto-generated slug complies with all Slug_Validator rules
5. THE Profile_Owner SHALL be able to change the auto-generated slug at any time

### Requirement 8: Dynamic Route Handling

**User Story:** Como desenvolvedor, eu quero que o sistema use rotas dinâmicas do Next.js, para que as páginas de perfil sejam renderizadas eficientemente.

#### Acceptance Criteria

1. THE Profile_System SHALL implement the profile page using Next.js dynamic route pattern "/perfil/[slug]"
2. WHEN a Public_Profile_Page is requested, THE Profile_System SHALL fetch profile data based on the slug parameter
3. THE Profile_System SHALL return a 404 status code for invalid or non-existent slugs
4. THE Profile_System SHALL use server-side rendering for initial page load to support SEO

### Requirement 9: Database Schema Extension

**User Story:** Como desenvolvedor, eu quero estender o schema do banco de dados para suportar slugs, para que os perfis possam ser identificados por URLs amigáveis.

#### Acceptance Criteria

1. THE Profile_System SHALL add a "slug" column to the users table in Supabase
2. THE slug column SHALL be of type text with a unique constraint
3. THE slug column SHALL be indexed for efficient lookup performance
4. THE Profile_System SHALL create a database trigger or constraint to enforce slug uniqueness at the database level

### Requirement 10: Slug Backend Validation

**User Story:** Como desenvolvedor, eu quero validar slugs no backend, para que a integridade dos dados seja garantida independentemente do cliente.

#### Acceptance Criteria

1. THE Profile_System SHALL implement server-side slug validation in the API layer
2. WHEN a slug update request is received, THE Slug_Validator SHALL verify format rules before database operations
3. WHEN a slug update request is received, THE Slug_Validator SHALL verify uniqueness before database operations
4. IF validation fails, THE Profile_System SHALL return an HTTP 400 error with a descriptive error message
5. THE Profile_System SHALL sanitize slug input to prevent injection attacks
