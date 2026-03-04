# Implementation Plan: Página Pública do Perfil

## Overview

Este plano implementa a funcionalidade de Página Pública do Perfil (US05), permitindo que visitantes acessem perfis através de URLs amigáveis usando slugs únicos. A implementação inclui validação robusta de slugs, geração automática, interface de edição com preview em tempo real, e otimização SEO com meta tags.

## Tasks

- [x] 1. Criar serviços de validação e geração de slugs
  - [x] 1.1 Implementar SlugValidator service
    - Criar `lib/services/slug-validator.ts`
    - Implementar validação de formato (regex, comprimento mínimo)
    - Implementar verificação de unicidade no banco
    - Implementar sanitização de entrada
    - _Requirements: 3.1, 3.2, 10.2, 10.5_
  
  - [ ]* 1.2 Escrever testes de propriedade para SlugValidator
    - **Property 8: Slug Minimum Length Validation**
    - **Property 9: Slug Character Validation**
    - **Property 23: Input Sanitization**
    - **Validates: Requirements 3.1, 3.2, 10.5**
  
  - [ ]* 1.3 Escrever testes unitários para SlugValidator
    - Testar casos específicos (slugs válidos e inválidos)
    - Testar edge cases (strings vazias, muito longas, caracteres especiais)
    - Testar mensagens de erro
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 1.4 Implementar SlugGenerator service
    - Criar `lib/services/slug-generator.ts`
    - Implementar geração a partir do nome (lowercase, substituir espaços)
    - Implementar resolução de colisões com sufixos numéricos
    - Implementar normalização de strings (remover acentos, caracteres especiais)
    - _Requirements: 7.2, 7.3_
  
  - [ ]* 1.5 Escrever testes de propriedade para SlugGenerator
    - **Property 7: Slug Auto-Generation from Name**
    - **Property 19: Slug Collision Resolution**
    - **Validates: Requirements 7.2, 7.3**
  
  - [ ]* 1.6 Escrever testes unitários para SlugGenerator
    - Testar geração de slugs específicos ("Maria Silva" → "maria-silva")
    - Testar nomes com caracteres especiais e acentos
    - Testar resolução de colisões (sufixos -2, -3, etc.)
    - _Requirements: 7.2, 7.3_

- [x] 2. Implementar API endpoints para validação e atualização de slugs
  - [x] 2.1 Criar endpoint POST /api/profiles/validate-slug
    - Criar `app/api/profiles/validate-slug/route.ts`
    - Validar formato do slug usando SlugValidator
    - Verificar unicidade do slug
    - Retornar erros descritivos
    - _Requirements: 2.1, 3.1, 3.2, 10.2, 10.3_
  
  - [ ]* 2.2 Escrever testes de propriedade para validate-slug endpoint
    - **Property 5: Slug Uniqueness Validation**
    - **Property 21: Format Validation Before Persistence**
    - **Validates: Requirements 2.1, 10.2**
  
  - [ ]* 2.3 Escrever testes unitários para validate-slug endpoint
    - Testar validação de formato
    - Testar verificação de unicidade
    - Testar respostas de erro (400 com mensagens descritivas)
    - _Requirements: 2.1, 3.1, 3.2, 10.4_
  
  - [x] 2.4 Criar endpoint PATCH /api/profiles/update-slug
    - Criar `app/api/profiles/update-slug/route.ts`
    - Validar novo slug usando SlugValidator
    - Verificar autorização (usuário só pode atualizar próprio perfil)
    - Atualizar slug e slug_last_changed_at no banco
    - Retornar erros descritivos
    - _Requirements: 2.1, 7.5, 10.2, 10.3, 10.4_
  
  - [ ]* 2.5 Escrever testes de propriedade para update-slug endpoint
    - **Property 6: Slug Persistence**
    - **Property 20: Slug Update Capability**
    - **Property 24: Slug Round-Trip Consistency**
    - **Validates: Requirements 2.4, 7.5**
  
  - [ ]* 2.6 Escrever testes unitários para update-slug endpoint
    - Testar atualização bem-sucedida
    - Testar rejeição de slugs duplicados
    - Testar rejeição de slugs inválidos
    - Testar verificação de autorização
    - _Requirements: 2.1, 2.2, 7.5_

- [x] 3. Checkpoint - Validar serviços e APIs
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implementar componente de edição de slug com preview
  - [x] 4.1 Criar SlugEditor component
    - Criar `app/portal/profile/components/SlugEditorComponent.tsx`
    - Implementar campo de input para slug
    - Implementar validação em tempo real
    - Implementar preview da URL no formato "site.com/perfil/@{slug}"
    - Implementar indicador de status de validação
    - Implementar debounce para validação de unicidade
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 4.2 Escrever testes de propriedade para SlugEditor
    - **Property 10: URL Preview Format**
    - **Property 11: Validation Status Display**
    - **Validates: Requirements 4.1, 4.2, 4.4**
  
  - [ ]* 4.3 Escrever testes unitários para SlugEditor
    - Testar renderização do preview
    - Testar atualização do preview ao digitar
    - Testar exibição de erros de validação
    - Testar debounce de validação
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 4.4 Integrar SlugEditor na página de edição de perfil
    - Adicionar SlugEditor em `app/portal/profile/page.tsx`
    - Conectar com API de validação e atualização
    - Implementar feedback de sucesso/erro
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Implementar serviço de geração de meta tags SEO
  - [x] 5.1 Criar SEOMetaGenerator service
    - Criar `lib/services/seo-meta-generator.ts`
    - Implementar geração de Open Graph tags
    - Implementar geração de Twitter Card tags
    - Implementar geração de canonical URL
    - Usar display_name como título
    - Usar short_description como descrição
    - Usar cover image como og:image
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ]* 5.2 Escrever testes de propriedade para SEOMetaGenerator
    - **Property 13: Open Graph Meta Tags Generation**
    - **Property 14: Twitter Card Meta Tags Generation**
    - **Property 15: Canonical URL Meta Tag**
    - **Property 16: Page Title from Profile Name**
    - **Property 17: Meta Description from Bio**
    - **Property 18: Open Graph Image from Avatar**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**
  
  - [ ]* 5.3 Escrever testes unitários para SEOMetaGenerator
    - Testar geração de todas as meta tags
    - Testar formatação correta dos valores
    - Testar fallbacks para campos opcionais
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 6. Implementar página pública do perfil com rota dinâmica
  - [x] 6.1 Criar rota dinâmica /perfil/[slug]
    - Criar `app/perfil/[slug]/page.tsx`
    - Implementar Server-Side Rendering (SSR)
    - Buscar dados do perfil via API by-slug
    - Renderizar informações públicas do perfil
    - Tratar erro 404 para slugs inexistentes
    - _Requirements: 1.1, 1.2, 1.3, 8.1, 8.4_
  
  - [ ]* 6.2 Escrever testes de propriedade para página pública
    - **Property 1: Slug Resolution**
    - **Property 2: Complete Profile Data Display**
    - **Property 3: Non-Existent Slug Returns 404**
    - **Property 4: Unauthenticated Access**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
  
  - [ ]* 6.3 Escrever testes unitários para página pública
    - Testar renderização de perfil válido
    - Testar retorno de 404 para slug inexistente
    - Testar acesso sem autenticação
    - Testar exibição de todos os campos públicos
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 6.4 Integrar SEOMetaGenerator na página pública
    - Gerar meta tags dinamicamente usando SEOMetaGenerator
    - Adicionar meta tags no head da página
    - Implementar generateMetadata do Next.js
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 7. Checkpoint - Validar página pública e SEO
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implementar botão de acesso ao perfil público no dashboard
  - [x] 8.1 Adicionar botão "Ver meu perfil público" no dashboard
    - Adicionar botão em `app/portal/profile/page.tsx` ou componente relevante
    - Implementar navegação para /perfil/@{slug}
    - Usar slug do perfil do usuário logado
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 8.2 Escrever testes de propriedade para navegação
    - **Property 12: Profile Navigation**
    - **Validates: Requirements 5.2**
  
  - [ ]* 8.3 Escrever testes unitários para botão de navegação
    - Testar renderização do botão
    - Testar navegação ao clicar
    - Testar URL correta com slug do usuário
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 9. Implementar geração automática de slug no registro
  - [x] 9.1 Integrar SlugGenerator no fluxo de criação de perfil
    - Modificar lógica de criação de perfil para gerar slug automaticamente
    - Usar SlugGenerator.generateUnique() com nome do usuário
    - Garantir que slug seja salvo na criação do perfil
    - _Requirements: 2.3, 7.1, 7.2, 7.3_
  
  - [ ]* 9.2 Escrever testes de integração para auto-geração
    - Testar criação de perfil com geração automática de slug
    - Testar resolução de colisões (múltiplos usuários com mesmo nome)
    - Testar conformidade com regras de validação
    - _Requirements: 2.3, 7.1, 7.2, 7.3_

- [x] 10. Implementar tratamento de erros e validações
  - [x] 10.1 Adicionar tratamento de erros no frontend
    - Implementar exibição de mensagens de erro inline no SlugEditor
    - Implementar toast notifications para erros de rede
    - Implementar página de erro 404 amigável
    - Desabilitar botão de salvar enquanto houver erros
    - _Requirements: 3.3, 3.4, 10.4_
  
  - [x] 10.2 Adicionar tratamento de erros no backend
    - Implementar captura de erros de constraint violation
    - Implementar tradução de erros técnicos para mensagens amigáveis
    - Implementar logging de erros para debugging
    - Garantir códigos de erro HTTP corretos (400, 403, 404, 500)
    - _Requirements: 2.2, 10.4_
  
  - [ ]* 10.3 Escrever testes de propriedade para tratamento de erros
    - **Property 22: Validation Error Response Format**
    - **Validates: Requirements 10.4**
  
  - [ ]* 10.4 Escrever testes unitários para tratamento de erros
    - Testar todos os tipos de erro (validação, autorização, não encontrado)
    - Testar mensagens de erro descritivas
    - Testar códigos de status HTTP corretos
    - _Requirements: 2.2, 3.3, 3.4, 10.4_

- [ ] 11. Testes de integração end-to-end
  - [ ]* 11.1 Testar fluxo completo de registro
    - Registrar novo usuário → Verificar slug auto-gerado → Acessar perfil público
    - _Requirements: 2.3, 7.1, 7.2, 1.1_
  
  - [ ]* 11.2 Testar fluxo completo de atualização de slug
    - Editar slug → Validar → Salvar → Verificar mudança de URL → Acessar nova URL
    - _Requirements: 7.5, 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 11.3 Testar fluxo de SEO e compartilhamento
    - Criar perfil → Acessar página pública → Verificar meta tags no HTML
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ]* 11.4 Testar fluxo de navegação do dashboard
    - Login → Acessar dashboard → Clicar "Ver meu perfil público" → Verificar página pública
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 12. Final checkpoint - Validação completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Property tests validam propriedades universais de corretude
- Unit tests validam exemplos específicos e edge cases
- A implementação usa TypeScript/Next.js conforme o design
- Todos os serviços devem implementar sanitização de entrada para segurança
- APIs devem retornar erros descritivos e códigos HTTP apropriados
