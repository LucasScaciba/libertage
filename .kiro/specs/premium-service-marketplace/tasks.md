# Plano de Implementação: Premium Service Marketplace

## Visão Geral

Este plano detalha a implementação de uma aplicação marketplace de serviços premium usando Next.js 14+ (App Router) com TypeScript, Supabase (PostgreSQL + Auth + Storage) e Stripe. A implementação segue uma abordagem incremental, construindo a base de dados e autenticação primeiro, depois os recursos principais de perfil e catálogo, seguidos por funcionalidades premium (assinaturas e boosts), e finalmente moderação e analytics.

## Tarefas

- [x] 1. Configurar infraestrutura e banco de dados
  - [x] 1.1 Inicializar projeto Next.js 14+ com TypeScript e configurar estrutura de pastas
    - Criar projeto com App Router habilitado
    - Configurar TypeScript com strict mode
    - Instalar e configurar Tailwind CSS
    - Instalar e configurar shadcn/ui (components.json)
    - Instalar dependências: @supabase/supabase-js, @supabase/auth-helpers-nextjs, stripe, fast-check, geohash
    - _Requisitos: 25.1_

  - [x] 1.2 Criar schema do banco de dados e migrations
    - Criar migration para tabelas: users, profiles, media, availability, features, profile_features
    - Criar migration para tabelas: plans, subscriptions, boosts, reports, audit_logs, analytics_events
    - Definir foreign keys, indexes e constraints conforme design
    - _Requisitos: 25.1, 25.2, 25.3, 25.4_

  - [x] 1.3 Implementar políticas Row Level Security (RLS)
    - Criar políticas RLS para profiles (ownership e public read)
    - Criar políticas RLS para media, availability, subscriptions
    - Criar políticas RLS para reports (admin/moderator access)
    - _Requisitos: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6_

  - [ ]* 1.4 Escrever testes de propriedade para RLS
    - **Property 56: RLS Profile Ownership**
    - **Property 57: RLS Admin Access**
    - **Property 58: RLS Public Profile Access**
    - **Valida: Requisitos 21.1-21.6**

  - [x] 1.5 Criar seed data para feature groups e subscription plans
    - Inserir feature groups predefinidos
    - Inserir planos Free, Premium e Black com limites de mídia
    - _Requisitos: 25.5_

- [x] 2. Implementar autenticação e onboarding
  - [x] 2.1 Configurar Supabase Auth com Google OAuth
    - Configurar provider Google no Supabase
    - Criar rota de callback OAuth em /api/auth/callback
    - Implementar AuthService com getCurrentUser, signInWithGoogle, signOut
    - _Requisitos: 1.1, 1.4_

  - [ ]* 2.2 Escrever teste de propriedade para persistência OAuth
    - **Property 1: OAuth Data Persistence**
    - **Valida: Requisito 1.4**

  - [x] 2.3 Implementar fluxo de onboarding
    - Criar página de onboarding com formulário de telefone e termos
    - Implementar API /api/onboarding/send-verification para envio de SMS
    - Implementar API /api/onboarding/verify-phone para validação de código
    - Implementar API /api/onboarding/complete para finalizar onboarding
    - _Requisitos: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9_

  - [ ]* 2.4 Escrever testes de propriedade para onboarding
    - **Property 2: Onboarding Access Control**
    - **Property 3: Phone Verification Completion**
    - **Property 4: Onboarding Completion Grants Access**
    - **Valida: Requisitos 2.1, 2.5, 2.7, 2.8, 2.9**

  - [x] 2.5 Implementar middleware de autenticação e redirecionamento
    - Criar middleware que verifica status de onboarding
    - Redirecionar usuários não-onboarded para /onboarding
    - Redirecionar usuários onboarded para /portal
    - _Requisitos: 1.2, 1.3, 2.1, 2.8_

  - [ ]* 2.6 Escrever testes unitários para fluxo de autenticação
    - Testar callback OAuth com dados válidos e inválidos
    - Testar redirecionamento baseado em status de onboarding
    - Testar verificação de código SMS

- [ ] 3. Checkpoint - Verificar autenticação e banco de dados
  - Garantir que todas as migrations rodam sem erros
  - Garantir que login com Google funciona e redireciona corretamente
  - Garantir que onboarding completo permite acesso ao portal
  - Perguntar ao usuário se há dúvidas ou ajustes necessários


- [x] 4. Implementar gerenciamento de perfis
  - [x] 4.1 Criar ProfileService com operações CRUD
    - Implementar createProfile, updateProfile, getProfile, getProfileBySlug
    - Implementar validação de slug único
    - Implementar lógica de cooldown de 90 dias para mudança de slug
    - Implementar checkPublishingEligibility baseado em onboarding e subscription
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.8_

  - [ ]* 4.2 Escrever testes de propriedade para perfis
    - **Property 5: Slug Uniqueness**
    - **Property 6: Slug Change Cooldown**
    - **Property 7: Profile Update Timestamp**
    - **Property 8: Profile Ownership Authorization**
    - **Property 9: Required Fields Validation**
    - **Valida: Requisitos 3.2, 3.3, 3.4, 3.6, 3.7, 3.8**

  - [x] 4.3 Criar APIs de gerenciamento de perfil
    - Implementar GET /api/profiles/me
    - Implementar POST /api/profiles
    - Implementar PATCH /api/profiles/:id
    - Implementar POST /api/profiles/:id/publish
    - Implementar POST /api/profiles/:id/unpublish (admin only)
    - _Requisitos: 3.1, 3.6, 3.7, 8.1_

  - [x] 4.4 Criar interface de edição de perfil no portal do provider
    - Criar formulário com campos: display_name, slug, category, short_description, long_description
    - Adicionar seleção de features de grupos predefinidos
    - Adicionar campos de external_links e pricing_packages
    - Exibir mensagem de erro se slug change cooldown não passou
    - _Requisitos: 3.1, 3.3, 3.4, 3.5, 3.8_

  - [ ]* 4.5 Escrever testes unitários para ProfileService
    - Testar criação de perfil com dados válidos
    - Testar rejeição de slug duplicado
    - Testar cooldown de slug com diferentes timestamps
    - Testar validação de campos obrigatórios

- [x] 5. Implementar gerenciamento de disponibilidade
  - [x] 5.1 Criar componente de configuração de horários
    - Criar interface para adicionar time ranges por dia da semana
    - Permitir marcar dias como indisponíveis
    - Validar que start_time < end_time
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 5.2 Escrever teste de propriedade para validação de horários
    - **Property 10: Time Range Validation**
    - **Valida: Requisito 4.4**

  - [x] 5.3 Criar APIs de gerenciamento de disponibilidade
    - Implementar GET /api/availability/:profileId
    - Implementar POST /api/availability
    - Implementar PATCH /api/availability/:id
    - Implementar DELETE /api/availability/:id
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.4 Exibir schedule de disponibilidade na página pública do perfil
    - Renderizar horários agrupados por dia da semana
    - Mostrar dias marcados como indisponíveis
    - _Requisitos: 4.5, 12.4_

- [x] 6. Implementar upload e gerenciamento de mídia
  - [x] 6.1 Criar MediaService com validação de limites
    - Implementar generateUploadUrl com signed URLs do Supabase Storage
    - Implementar validateMediaLimits baseado no plano de subscription
    - Implementar createMediaRecord, updateMedia, deleteMedia
    - Implementar setCoverImage (apenas uma cover por perfil)
    - _Requisitos: 5.1, 5.2, 5.3, 5.5, 5.6, 5.7, 5.8, 23.1_

  - [ ]* 6.2 Escrever testes de propriedade para mídia
    - **Property 11: Media Upload Limits Enforcement**
    - **Property 12: Signed URL Generation**
    - **Property 13: File Upload Validation**
    - **Property 14: Cover Image Designation**
    - **Property 15: Media Deletion**
    - **Valida: Requisitos 5.1-5.8, 23.1-23.4**

  - [x] 6.3 Criar APIs de gerenciamento de mídia
    - Implementar POST /api/media/upload-url (gera signed URL)
    - Implementar POST /api/media (cria record após upload)
    - Implementar PATCH /api/media/:id (atualiza cover e sort_order)
    - Implementar DELETE /api/media/:id
    - Validar file type (images/videos) e file size no servidor
    - _Requisitos: 5.3, 5.4, 5.5, 5.6, 5.7, 23.2, 23.3, 23.4_

  - [x] 6.4 Criar interface de upload de mídia no portal
    - Criar componente de upload com drag-and-drop
    - Exibir limite atual baseado no plano
    - Permitir reordenar mídia por drag-and-drop
    - Permitir designar cover image
    - Exibir erro se limite excedido
    - _Requisitos: 5.1, 5.2, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 6.5 Escrever testes unitários para MediaService
    - Testar geração de signed URL com expiração
    - Testar validação de tipo de arquivo (permitidos e não permitidos)
    - Testar validação de tamanho (exatamente no limite, 1 byte acima)
    - Testar setCoverImage (apenas uma cover ativa)

- [ ] 7. Checkpoint - Verificar perfis e mídia
  - Garantir que perfis podem ser criados e editados
  - Garantir que slug único é enforçado
  - Garantir que upload de mídia funciona e respeita limites
  - Garantir que disponibilidade pode ser configurada
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [x] 8. Implementar sistema de assinaturas com Stripe
  - [x] 8.1 Criar SubscriptionService
    - Implementar createCheckoutSession para planos Premium e Black
    - Implementar getCustomerPortalUrl para gerenciar assinatura
    - Implementar getCurrentSubscription e getMediaLimits
    - _Requisitos: 6.3, 6.6, 6.7_

  - [ ]* 8.2 Escrever testes de propriedade para subscriptions
    - **Property 16: Subscription Checkout Creation**
    - **Property 17: Subscription Data Persistence**
    - **Property 18: Plan Downgrade Limit Enforcement**
    - **Valida: Requisitos 6.3, 6.5, 6.8**

  - [x] 8.3 Criar APIs de subscription
    - Implementar GET /api/subscriptions/plans
    - Implementar POST /api/subscriptions/checkout
    - Implementar GET /api/subscriptions/portal
    - _Requisitos: 6.3, 6.7_

  - [x] 8.4 Implementar webhook handler do Stripe
    - Criar POST /api/webhooks/stripe com verificação de assinatura
    - Implementar handleCheckoutCompleted (criar/atualizar subscription)
    - Implementar handleSubscriptionUpdated (atualizar status e período)
    - Implementar handleSubscriptionDeleted (marcar como canceled)
    - Implementar handleInvoicePaymentFailed (marcar como past_due)
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 8.5 Escrever testes de propriedade para webhooks
    - **Property 19: Webhook Event Processing**
    - **Property 20: Webhook Signature Verification**
    - **Valida: Requisitos 7.1-7.6**

  - [x] 8.6 Implementar lógica de auto-publish/unpublish de perfis
    - Criar função que verifica onboarding + subscription válida
    - Auto-publicar perfil quando ambos requisitos atendidos
    - Auto-despublicar perfil quando subscription inválida
    - _Requisitos: 8.1, 8.2, 8.3_

  - [ ]* 8.7 Escrever testes de propriedade para auto-publishing
    - **Property 21: Automatic Profile Publishing**
    - **Property 22: Automatic Profile Unpublishing**
    - **Valida: Requisitos 8.1, 8.2, 8.3**

  - [x] 8.8 Criar interface de planos no portal
    - Exibir plano atual e limites
    - Criar botões para upgrade/downgrade
    - Integrar com Stripe Checkout
    - Adicionar link para Customer Portal
    - _Requisitos: 6.3, 6.6, 6.7, 24.3_

  - [ ]* 8.9 Escrever testes unitários para webhook processing
    - Testar cada tipo de evento com payloads de exemplo
    - Testar rejeição de assinatura inválida
    - Testar idempotência (processar mesmo webhook 2x)

- [x] 9. Implementar catálogo público e busca
  - [x] 9.1 Criar LocationService para geohash
    - Implementar generateGeohash e truncateGeohash
    - Implementar getApproximateLocation (truncar para 5 caracteres)
    - Implementar decodeGeohash para exibição de mapa
    - _Requisitos: 13.1, 13.2, 13.4_

  - [ ]* 9.2 Escrever testes de propriedade para location privacy
    - **Property 34: Geohash Truncation for Privacy**
    - **Property 35: Exact Address Privacy**
    - **Property 36: Geographic Filtering with Approximate Location**
    - **Valida: Requisitos 13.1, 13.2, 13.3, 13.4**

  - [x] 9.3 Criar CatalogService com busca e filtros
    - Implementar searchCatalog com filtros: search, category, city, region, features
    - Implementar getBoostedProfiles (até 15, ordenados por expiration)
    - Implementar getRegularProfiles (ordenados por updated_at DESC)
    - Aplicar filtros com lógica AND
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 11.1, 11.2_

  - [ ]* 9.4 Escrever testes de propriedade para catálogo
    - **Property 23: Catalog Published Filter**
    - **Property 24: Catalog Search Filtering**
    - **Property 25: Catalog Multi-Filter Conjunction**
    - **Property 26: Profile Card Required Fields**
    - **Property 27: Boosted Section Capacity Limit**
    - **Property 28: Boosted Profiles Filter Matching**
    - **Property 29: Boosted Profiles Expiration Sorting**
    - **Property 30: Catalog Section Ordering**
    - **Property 31: Catalog Pagination**
    - **Valida: Requisitos 8.4, 9.1-9.7, 10.1-10.6, 11.1-11.5**

  - [x] 9.5 Criar API pública de catálogo
    - Implementar GET /api/catalog (público, com rate limiting)
    - Suportar query params: search, category, city, region, features, page, pageSize
    - Retornar boostedProfiles e regularProfiles separadamente
    - _Requisitos: 9.1, 9.2, 9.3, 9.5, 11.3, 11.5, 22.1_

  - [x] 9.6 Criar página pública de catálogo
    - Renderizar seção de boosted profiles no topo (até 15)
    - Renderizar seção de regular profiles abaixo
    - Criar barra de busca e filtros básicos (category, city, region)
    - Criar modal de filtros avançados (features)
    - Implementar paginação com "Show all results"
    - Exibir profile cards com todos campos obrigatórios
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 10.1, 10.2, 10.5, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 9.7 Escrever testes unitários para CatalogService
    - Testar busca com texto vazio, texto parcial, texto completo
    - Testar filtros individuais e combinados
    - Testar paginação (primeira página, última página, página única)
    - Testar exclusão de perfis não-published

- [x] 10. Implementar página pública de perfil
  - [x] 10.1 Criar API pública de perfil
    - Implementar GET /api/profiles/:slug (público)
    - Retornar apenas perfis com status 'published'
    - Incluir media, availability, features, external_links, pricing_packages
    - _Requisitos: 12.1_

  - [x] 10.2 Criar página pública de perfil (/profiles/[slug])
    - Renderizar display_name, descriptions, category
    - Renderizar galeria de mídia com cover em destaque
    - Renderizar botões de contato com external_links
    - Renderizar tabela de pricing_packages
    - Renderizar schedule de availability
    - Renderizar mapa com approximate location (geohash truncado)
    - NÃO exibir phone_number
    - Adicionar botão de report
    - _Requisitos: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 13.2, 13.3_

  - [ ]* 10.3 Escrever testes de propriedade para perfil público
    - **Property 32: Public Profile Required Content**
    - **Property 33: Phone Number Privacy**
    - **Valida: Requisitos 12.1-12.8**

  - [ ]* 10.4 Escrever testes unitários para página de perfil
    - Testar renderização de todos os campos obrigatórios
    - Testar que phone_number não aparece no HTML
    - Testar que perfis não-published retornam 404

- [x] 11. Checkpoint - Verificar catálogo e perfis públicos
  - Garantir que catálogo exibe apenas perfis published
  - Garantir que busca e filtros funcionam corretamente
  - Garantir que página de perfil exibe todos os dados
  - Garantir que localização aproximada é exibida (não exata)
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [x] 12. Implementar sistema de boosts
  - [x] 12.1 Criar BoostService com gerenciamento de capacidade
    - Implementar getBoostContext (city:region:category)
    - Implementar checkAvailability (máximo 15 concurrent por context)
    - Implementar getNextAvailableSlots se capacidade cheia
    - Implementar createBoostCheckout com Stripe
    - Implementar confirmBoost após pagamento
    - _Requisitos: 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

  - [ ]* 12.2 Escrever testes de propriedade para boosts
    - **Property 39: Boost Checkout Creation**
    - **Property 40: Boost Capacity Check**
    - **Property 41: Boost Capacity Full Handling**
    - **Property 42: Boost Record Creation**
    - **Property 43: Boost Status Transitions**
    - **Valida: Requisitos 15.2-15.10**

  - [x] 12.3 Criar APIs de boost
    - Implementar GET /api/boosts/availability (com rate limiting)
    - Implementar POST /api/boosts/checkout
    - Implementar GET /api/boosts/me
    - _Requisitos: 15.1, 15.2, 15.3, 22.3_

  - [x] 12.4 Adicionar boost webhook handling
    - Estender POST /api/webhooks/stripe para boost payments
    - Implementar confirmBoost quando checkout.session.completed
    - Verificar capacidade ainda disponível antes de confirmar
    - Implementar refund se capacidade não disponível
    - _Requisitos: 16.1, 16.2, 16.3, 16.4_

  - [ ]* 12.5 Escrever testes de propriedade para boost webhooks
    - **Property 44: Boost Webhook Confirmation**
    - **Property 45: Boost Capacity Conflict Refund**
    - **Valida: Requisitos 16.1, 16.2, 16.3**

  - [x] 12.6 Criar cron jobs para boost status transitions
    - Implementar activateScheduledBoosts (scheduled → active quando start_time chega)
    - Implementar expireActiveBoosts (active → expired quando end_time passa)
    - Configurar execução a cada minuto
    - _Requisitos: 15.9, 15.10_

  - [x] 12.7 Criar interface de compra de boost no portal
    - Exibir seletor de time window (2 horas)
    - Verificar disponibilidade em tempo real
    - Exibir próximos slots disponíveis se cheio
    - Integrar com Stripe Checkout
    - Exibir boosts ativos e agendados
    - _Requisitos: 15.1, 15.2, 15.3, 15.4, 15.7, 24.5_

  - [ ]* 12.8 Escrever testes unitários para BoostService
    - Testar checkAvailability com 14, 15, 16 boosts concurrent
    - Testar detecção de overlap de time windows
    - Testar getNextAvailableSlots retorna slots válidos
    - Testar race condition com transações de banco

- [x] 13. Implementar analytics de perfil
  - [x] 13.1 Criar AnalyticsService
    - Implementar trackVisit (profile_id, fingerprint)
    - Implementar trackContactClick (profile_id, method, fingerprint)
    - Implementar getAnalyticsSummary com agregações por período
    - _Requisitos: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 13.2 Escrever testes de propriedade para analytics
    - **Property 37: Analytics Event Recording**
    - **Property 38: Analytics Aggregation Accuracy**
    - **Valida: Requisitos 14.1-14.4, 24.1, 24.2**

  - [x] 13.3 Criar APIs de analytics
    - Implementar POST /api/analytics/visit (público)
    - Implementar POST /api/analytics/contact-click (público)
    - Implementar GET /api/analytics/dashboard (autenticado)
    - _Requisitos: 14.1, 14.2_

  - [x] 13.4 Integrar tracking na página pública de perfil
    - Chamar trackVisit quando página carrega
    - Chamar trackContactClick quando botão de contato clicado
    - Usar browser fingerprint para visitor_fingerprint
    - _Requisitos: 14.1, 14.2_

  - [x] 13.5 Criar dashboard de analytics no portal
    - Exibir visitor counts: today, 7 days, 30 days, 12 months
    - Exibir click counts agrupados por contact method
    - Exibir gráficos de tendência
    - _Requisitos: 14.3, 14.4, 24.1, 24.2_

  - [ ]* 13.6 Escrever testes unitários para AnalyticsService
    - Testar agregação com diferentes períodos
    - Testar agregação com 1M+ eventos (performance)
    - Testar deduplicação por fingerprint

- [x] 14. Implementar sistema de reports e moderação
  - [x] 14.1 Criar ReportService
    - Implementar submitReport (anônimo com fingerprint ou autenticado)
    - Implementar canSubmitReport (rate limit check)
    - Implementar listReports com filtros
    - Implementar updateReportStatus
    - _Requisitos: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 18.1, 18.2, 18.4_

  - [ ]* 14.2 Escrever testes de propriedade para reports
    - **Property 46: Anonymous Report Submission**
    - **Property 47: Authenticated Report Submission**
    - **Property 48: Report Submission Rate Limiting**
    - **Property 49: Report Field Validation**
    - **Property 50: Report Status Filtering**
    - **Valida: Requisitos 17.3-17.7, 18.2, 22.2**

  - [x] 14.3 Criar APIs de reports
    - Implementar POST /api/reports (público, com rate limiting)
    - Implementar GET /api/admin/reports (admin/moderator)
    - Implementar PATCH /api/admin/reports/:id (admin/moderator)
    - _Requisitos: 17.1, 17.6, 18.1, 18.4, 22.2_

  - [x] 14.4 Criar APIs de ações administrativas
    - Implementar POST /api/admin/users/:id/suspend (admin only)
    - Implementar POST /api/admin/users/:id/ban (admin only)
    - Todas ações devem criar audit log entries
    - _Requisitos: 18.5, 18.6, 18.7, 18.8, 20.1, 20.2, 20.3_

  - [x] 14.5 Implementar controle de acesso baseado em roles
    - Criar middleware requireRole(role)
    - Proteger rotas /api/admin/* com moderator ou admin
    - Proteger ações de suspend/ban/unpublish com admin only
    - Retornar 403 Forbidden se role insuficiente
    - _Requisitos: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

  - [ ]* 14.6 Escrever testes de propriedade para moderação
    - **Property 51: Admin Moderation Actions**
    - **Property 52: Moderator Report Management**
    - **Property 53: Admin Backoffice Access Control**
    - **Valida: Requisitos 18.4-18.7, 19.2-19.5**

  - [x] 14.7 Criar interface de backoffice admin
    - Criar página de listagem de reports com filtros
    - Criar página de detalhes de report
    - Adicionar botões de ação: update status, unpublish profile, suspend user, ban user
    - Exibir apenas ações permitidas baseado em role
    - _Requisitos: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

  - [x] 14.8 Criar interface de audit logs
    - Implementar GET /api/admin/audit-logs (admin only)
    - Criar página de listagem com filtros por action type e date range
    - Exibir actor, action, target, metadata, timestamp
    - _Requisitos: 20.5, 20.6_

  - [ ]* 14.9 Escrever testes de propriedade para audit logs
    - **Property 54: Audit Log Creation for Admin Actions**
    - **Property 55: Audit Log Metadata Storage**
    - **Valida: Requisitos 18.8, 20.1-20.5**

  - [ ]* 14.10 Escrever testes unitários para moderação
    - Testar cada role com cada endpoint
    - Testar criação de audit log para cada ação
    - Testar rate limiting de reports (5/hora)

- [x] 15. Implementar rate limiting
  - [x] 15.1 Criar RateLimiter utility
    - Implementar checkLimit com Redis ou database-backed storage
    - Implementar incrementCounter
    - Implementar getRemainingRequests
    - _Requisitos: 22.1, 22.2, 22.3, 22.4, 22.5_

  - [ ]* 15.2 Escrever teste de propriedade para rate limiting
    - **Property 59: Rate Limiting Enforcement**
    - **Valida: Requisitos 22.1-22.5**

  - [x] 15.3 Aplicar rate limiting em endpoints sensíveis
    - Aplicar 60/min per IP em GET /api/catalog
    - Aplicar 5/hour per fingerprint em POST /api/reports
    - Aplicar 30/min per user em GET /api/boosts/availability
    - Retornar 429 com Retry-After header quando excedido
    - _Requisitos: 22.1, 22.2, 22.3, 22.4, 22.5_

  - [ ]* 15.4 Escrever testes unitários para rate limiting
    - Testar exatamente no limite (não bloqueia)
    - Testar 1 request acima do limite (bloqueia)
    - Testar reset após time window

- [x] 16. Implementar config parser e validator
  - [x] 16.1 Criar ConfigParser para plans e features
    - Implementar parsePlans e parseFeatures
    - Implementar validatePlanConfig e validateFeatureConfig
    - Implementar prettyPrintPlans e prettyPrintFeatures
    - _Requisitos: 26.1, 26.2, 26.4, 26.5, 26.6_

  - [ ]* 16.2 Escrever testes de propriedade para config parser
    - **Property 60: Config Parser Round Trip**
    - **Property 61: Config Validation Error Reporting**
    - **Property 62: Config Required Fields Validation**
    - **Valida: Requisitos 26.3, 26.4, 26.5, 26.7**

  - [ ]* 16.3 Escrever testes unitários para config parser
    - Testar parsing de config válido
    - Testar parsing de config inválido (campos faltando)
    - Testar pretty print e re-parse (round trip)
    - Testar error reporting com linha e coluna

- [x] 17. Implementar dashboard do provider
  - [x] 17.1 Criar página de dashboard no portal
    - Exibir analytics summary (visits e clicks)
    - Exibir plano atual e limites de mídia
    - Exibir número de boost credits disponíveis
    - Exibir boosts ativos e agendados
    - Adicionar links rápidos para editar perfil, upload mídia, comprar boost
    - _Requisitos: 24.1, 24.2, 24.3, 24.4, 24.5_

  - [ ]* 17.2 Escrever testes de integração para dashboard
    - Testar carregamento de todos os dados
    - Testar exibição correta de limites baseado em plano

- [x] 18. Checkpoint final - Testes end-to-end
  - Garantir que todos os testes de propriedade passam
  - Garantir que todos os testes unitários passam
  - Executar testes end-to-end dos fluxos críticos
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [x] 19. Integração e ajustes finais
  - [x] 19.1 Configurar variáveis de ambiente
    - Documentar todas as env vars necessárias
    - Criar arquivo .env.example
    - _Requisitos: todos_

  - [x] 19.2 Criar documentação de deployment
    - Documentar setup do Supabase (migrations, RLS, storage buckets)
    - Documentar setup do Stripe (webhooks, products, prices)
    - Documentar configuração de cron jobs para boosts
    - _Requisitos: todos_

  - [x] 19.3 Implementar error handling e logging
    - Adicionar error boundaries em componentes React
    - Implementar logging estruturado para erros
    - Implementar retry logic para external services
    - _Requisitos: todos_

  - [x] 19.4 Otimizações de performance
    - Adicionar indexes adicionais se necessário
    - Implementar caching de catalog queries
    - Otimizar queries de analytics
    - _Requisitos: 14.5_

  - [ ]* 19.5 Escrever testes de performance
    - Testar catalog search com 100 concurrent users
    - Testar webhook processing com 1000 events/min
    - Testar analytics dashboard com 1M+ events

- [x] 20. Checkpoint final - Revisão completa
  - Garantir que todos os requisitos foram implementados
  - Garantir que todas as propriedades de correção são validadas
  - Garantir que a aplicação está pronta para deployment
  - Perguntar ao usuário se há dúvidas ou próximos passos

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam propriedades universais de correção
- Testes unitários validam exemplos específicos e edge cases
- A implementação segue uma abordagem bottom-up: infraestrutura → autenticação → perfis → catálogo → features premium → moderação
