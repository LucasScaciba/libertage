# Implementation Plan: Sistema de Links Externos Estilo Linktree

## Overview

Este plano implementa o sistema de Links Externos que permite profissionais premium adicionarem múltiplos links personalizados em seus perfis públicos. A implementação inclui detecção automática de ícones, validação robusta, limites por plano de assinatura, e interface de gerenciamento com reordenação.

## Tasks

- [x] 1. Criar estrutura de banco de dados e tipos TypeScript
  - Criar migration do Supabase para tabela external_links com constraints e indexes
  - Criar políticas RLS para controle de acesso (owner e public read)
  - Definir tipos TypeScript (ExternalLinkRecord, IconKey, inputs)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [ ]* 1.1 Escrever teste de propriedade para ordem única por perfil
  - **Property 1: Unique Display Order Per Profile**
  - **Validates: Requirements 1.2**

- [ ]* 1.2 Escrever teste de propriedade para isolamento de dados
  - **Property 2: Profile Data Isolation**
  - **Validates: Requirements 1.4, 1.5, 1.6, 1.7**

- [ ]* 1.3 Escrever teste de propriedade para acesso público
  - **Property 3: Public Access to Published Profiles**
  - **Validates: Requirements 1.8**

- [x] 2. Implementar serviços de validação
  - [x] 2.1 Criar URLValidatorService com validação de protocolo, domínio e sanitização XSS
    - Implementar validate(), sanitize(), hasValidProtocol(), hasValidDomain()
    - Validar URLs com max 2048 caracteres
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.2 Escrever teste de propriedade para validação de protocolo
    - **Property 4: URL Protocol Validation**
    - **Validates: Requirements 2.1, 2.4**

  - [ ]* 2.3 Escrever teste de propriedade para validação de domínio
    - **Property 5: URL Domain Validation**
    - **Validates: Requirements 2.2, 2.4**

  - [ ]* 2.4 Escrever teste de propriedade para prevenção de XSS
    - **Property 6: XSS Prevention in URLs**
    - **Validates: Requirements 2.5**

  - [x] 2.5 Criar IconDetectorService com mapeamento de domínios
    - Implementar detectIcon() com suporte para Instagram, WhatsApp, LinkedIn, Facebook, Twitter, YouTube, TikTok, GitHub
    - Retornar "link" como padrão para domínios desconhecidos
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_

  - [ ]* 2.6 Escrever testes unitários para detecção de ícones
    - Testar cada domínio conhecido (Instagram, WhatsApp, etc.)
    - Testar domínio desconhecido retorna "link"
    - _Requirements: 3.1-3.11_

  - [ ]* 2.7 Escrever teste de propriedade para ícone padrão
    - **Property 7: Default Icon for Unknown Domains**
    - **Validates: Requirements 3.10**

  - [x] 2.8 Criar PlanValidatorService com verificação de limites
    - Implementar canAddLink(), getLimitForPlan(), getCurrentPlan()
    - Limites: Free (3), Premium (10), Black (ilimitado)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 2.9 Escrever testes unitários para limites de plano
    - Testar limite Free (3 links)
    - Testar limite Premium (10 links)
    - Testar Black ilimitado
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 3. Checkpoint - Validar serviços de validação
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implementar ExternalLinkService
  - [x] 4.1 Criar métodos CRUD básicos
    - Implementar createLink() com validação de plano, URL e detecção de ícone
    - Implementar updateLink() preservando display_order
    - Implementar deleteLink() com reordenação automática
    - Implementar getLinksForProfile() ordenado por display_order
    - Implementar getLinkCount()
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 8.1, 8.2, 8.3_

  - [ ]* 4.2 Escrever teste de propriedade para ordem sequencial na criação
    - **Property 8: Sequential Display Order on Creation**
    - **Validates: Requirements 5.3**

  - [ ]* 4.3 Escrever teste de propriedade para preservação de ordem no update
    - **Property 9: Display Order Preservation on Update**
    - **Validates: Requirements 5.5**

  - [ ]* 4.4 Escrever teste de propriedade para reordenação após deleção
    - **Property 10: Sequential Reordering After Deletion**
    - **Validates: Requirements 5.7**

  - [x] 4.5 Implementar reorderLink() com swap atômico
    - Implementar swap de display_order entre links adjacentes
    - Usar transação para garantir atomicidade
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 4.6 Escrever teste de propriedade para swap atômico
    - **Property 11: Atomic Position Swap**
    - **Validates: Requirements 6.2, 6.3, 6.4**

  - [ ]* 4.7 Escrever teste de propriedade para ordenação consistente
    - **Property 12: Consistent Ordering in Queries**
    - **Validates: Requirements 5.1, 7.1**

  - [ ]* 4.8 Escrever testes unitários para ExternalLinkService
    - Testar criação com display_order correto
    - Testar update preservando ordem
    - Testar deleção com reordenação
    - Testar validação de título (vazio, muito longo, whitespace)
    - _Requirements: 5.1-5.7, 8.1-8.4_

- [x] 5. Checkpoint - Validar serviço principal
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implementar API routes
  - [x] 6.1 Criar POST /api/external-links para criação
    - Validar autenticação e input
    - Chamar ExternalLinkService.createLink()
    - Retornar 201 com link criado ou erros apropriados
    - _Requirements: 5.2, 5.3, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 6.2 Criar PUT /api/external-links/[id] para atualização
    - Validar autenticação, ownership e input
    - Chamar ExternalLinkService.updateLink()
    - Retornar 200 com link atualizado ou erros apropriados
    - _Requirements: 5.4, 5.5, 9.1, 9.4, 9.5_

  - [x] 6.3 Criar DELETE /api/external-links/[id] para remoção
    - Validar autenticação e ownership
    - Chamar ExternalLinkService.deleteLink()
    - Retornar 200 ou erros apropriados
    - _Requirements: 5.6, 5.7, 9.1_

  - [x] 6.4 Criar POST /api/external-links/reorder para reordenação
    - Validar autenticação, ownership e direção (up/down)
    - Chamar ExternalLinkService.reorderLink()
    - Retornar 200 ou erros apropriados
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 9.1_

  - [x] 6.5 Criar GET /api/external-links para listagem pública
    - Permitir acesso público para perfis publicados
    - Retornar links ordenados por display_order
    - _Requirements: 7.1, 10.1_

  - [ ]* 6.6 Escrever testes de integração para API routes
    - Testar cada endpoint com casos de sucesso e erro
    - Testar autenticação e autorização
    - Testar mensagens de erro em português
    - _Requirements: 9.1-9.5_

- [x] 7. Implementar componente Link Manager (Portal)
  - [x] 7.1 Criar ExternalLinksManager component
    - Exibir lista de links com ícones detectados
    - Mostrar contador "X/Y links utilizados"
    - Implementar botões de adicionar, editar, remover
    - Implementar botões de reordenação (up/down arrows)
    - _Requirements: 5.1, 5.2, 5.4, 5.6, 5.8, 5.9, 6.1, 6.2, 6.3_

  - [x] 7.2 Criar formulário de adicionar/editar link
    - Campos: title (required, max 100) e url (required)
    - Validação client-side antes de submit
    - Exibir mensagens de erro em português
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 9.3, 9.4, 9.5_

  - [x] 7.3 Criar modal de confirmação de remoção
    - Exibir ao clicar em "Remover"
    - Confirmar antes de deletar
    - _Requirements: 5.6, 5.7_

  - [ ]* 7.4 Escrever testes unitários para Link Manager
    - Testar renderização da lista
    - Testar formulários de adicionar/editar
    - Testar modal de confirmação
    - Testar botões de reordenação
    - _Requirements: 5.1-5.9, 6.1-6.3_

- [x] 8. Implementar componente Link Display (Perfil Público)
  - [x] 8.1 Criar ExternalLinksDisplay component
    - Buscar links via API pública
    - Renderizar cards com ícone, título e link clicável
    - Aplicar rel="noopener noreferrer" em todos os links
    - Implementar hover effect visual
    - Não renderizar seção se não houver links
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 10.1, 10.2, 10.3_

  - [ ]* 8.2 Escrever teste de propriedade para atributos de segurança
    - **Property 13: Security Attributes on Public Links**
    - **Validates: Requirements 7.4**

  - [ ]* 8.3 Escrever testes unitários para Link Display
    - Testar renderização de cards
    - Testar atributos de segurança (rel)
    - Testar estado vazio (sem links)
    - Testar hover effects
    - _Requirements: 7.1-7.7_

- [x] 9. Implementar componentes de ícones
  - [x] 9.1 Criar IconMapper utility
    - Mapear icon_key para componentes Lucide React
    - Suportar todos os ícones: Instagram, WhatsApp, LinkedIn, Facebook, Twitter, YouTube, TikTok, GitHub, Link
    - Implementar cache de componentes para performance
    - _Requirements: 3.11, 5.8, 7.7, 10.2_

  - [ ]* 9.2 Escrever testes unitários para IconMapper
    - Testar mapeamento de cada icon_key
    - Testar fallback para ícone desconhecido
    - _Requirements: 3.11_

- [x] 10. Integrar com perfil público existente
  - [x] 10.1 Adicionar ExternalLinksDisplay ao PublicProfileClient
    - Integrar componente na página de perfil público
    - Posicionar seção de links de forma apropriada
    - Garantir carregamento eficiente (single query)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 10.1_

  - [x] 10.2 Adicionar ExternalLinksManager ao portal do profissional
    - Integrar componente na página de gerenciamento de perfil
    - Adicionar navegação/tab para gerenciar links
    - _Requirements: 5.1-5.9, 6.1-6.3_

- [x] 11. Implementar validação de títulos
  - [x] 11.1 Adicionar validação de título no ExternalLinkService
    - Validar título não vazio após trim
    - Validar título com max 100 caracteres
    - Aplicar trim automático em títulos
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 11.2 Escrever teste de propriedade para validação de título vazio
    - **Property 14: Title Non-Empty Validation**
    - **Validates: Requirements 8.1, 8.4**

  - [ ]* 11.3 Escrever teste de propriedade para normalização de whitespace
    - **Property 15: Title Whitespace Normalization**
    - **Validates: Requirements 8.3**

- [x] 12. Implementar tratamento de erros completo
  - [x] 12.1 Adicionar mensagens de erro em português
    - Implementar todas as mensagens especificadas no design
    - Garantir mensagens user-friendly e acionáveis
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 12.2 Adicionar logging de erros
    - Logar erros com contexto (user_id, profile_id, operation)
    - Não expor detalhes técnicos ao usuário
    - _Requirements: 9.1_

  - [ ]* 12.3 Escrever testes unitários para tratamento de erros
    - Testar cada categoria de erro (validation, authorization, not found, server)
    - Testar formato de resposta de erro
    - Testar mensagens em português
    - _Requirements: 9.1-9.5_

- [x] 13. Otimizar performance
  - [x] 13.1 Criar index composto no banco de dados
    - Criar index em (profile_id, display_order)
    - _Requirements: 10.4_

  - [x] 13.2 Implementar cache de ícones no frontend
    - Evitar re-renderização desnecessária de ícones
    - _Requirements: 10.2_

  - [x] 13.3 Otimizar queries de links
    - Garantir single query para buscar links com perfil
    - _Requirements: 10.1_

  - [ ]* 13.4 Escrever testes de performance
    - Testar tempo de renderização inicial (< 100ms)
    - Testar eficiência de queries
    - _Requirements: 10.3_

- [x] 14. Checkpoint final - Validar sistema completo
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Cada task referencia requirements específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Property tests validam propriedades universais de corretude
- Unit tests validam exemplos específicos e casos extremos
- Sistema usa TypeScript com Next.js 14 App Router e Supabase
- Todas as mensagens de erro devem estar em português
- RLS policies garantem segurança no nível do banco de dados
