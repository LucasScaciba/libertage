# Overview das 7 User Stories - Specs Criadas

## Status das Specs

### ✅ US01 - Phone Validation After Login
**Status**: COMPLETA (Requirements + Design + Tasks)
**Localização**: `.kiro/specs/phone-validation-after-login/`
**Resumo**: Sistema de validação de telefone via OTP SMS usando Twilio após primeiro login com Google OAuth. Inclui rate limiting, cooldown, criptografia de dados e interface acessível.

**Principais Componentes**:
- Middleware de autenticação
- API endpoints (send-otp, verify-otp, status)
- Serviços (OTP, Rate Limiter, Encryption)
- UI de validação com acessibilidade
- 22 propriedades de corretude
- 47 sub-tasks implementáveis

---

### ✅ US02 - Stories System  
**Status**: COMPLETA (Requirements + Design + Tasks)
**Localização**: `.kiro/specs/stories-system/`
**Resumo**: Sistema de stories em vídeo com duração de 24 horas, limites por plano (Premium: 1, Black: 5), upload para Supabase Storage, exibição no catálogo e perfil, navegação automática e moderação.

**Principais Componentes**:
- Upload de vídeo (max 18MB, 60s, mp4/mov/avi)
- Expiração automática (cron job)
- Story viewer com lightbox e navegação
- Analytics de visualizações
- Sistema de denúncias
- 12 requisitos principais

---

### 🔄 US03 - Boost System (Impulsionar Anúncio)
**Status**: PENDENTE
**Feature Name**: boost-system

**Resumo Rápido**:
- Compra avulsa de impulsionamento por 2 horas
- Máximo 15 perfis impulsionados simultaneamente
- Exibição na primeira fileira do catálogo
- Ordenação por proximidade de expiração
- Integração com Stripe para pagamento
- Filtros respeitam impulsionamentos

**Componentes Principais**:
- Tabela `boosts` (user_id, expires_at, status, payment_intent_id)
- API de checkout Stripe
- Cron job para expiração
- UI de compra e gerenciamento
- Slot availability check (max 15)

---

### 🔄 US04 - Profile Verification System
**Status**: PENDENTE
**Feature Name**: profile-verification-system

**Resumo Rápido**:
- Upload de selfie com documento (RG ou CNH)
- Estados: not_verified, pending, verified, rejected, expired
- Validade de 90 dias
- Selo de verificação no catálogo, modal e página pública
- Moderação manual por admin
- Tooltip com data de verificação

**Componentes Principais**:
- Tabela `profile_verifications` (user_id, document_type, photo_url, status, verified_at, expires_at)
- Upload para Supabase Storage
- Admin panel para moderação
- Selo visual com tooltip
- Notificações de status

---

### 🔄 US05 - Public Profile Page
**Status**: PENDENTE
**Feature Name**: public-profile-page

**Resumo Rápido**:
- Cada perfil possui slug único (mínimo 4 caracteres)
- URL: site.com/perfil/@slug
- Slug: apenas letras minúsculas, números e "-"
- Preview do link durante cadastro
- Botão "Ver meu perfil público" no dashboard
- SEO otimizado com meta tags

**Componentes Principais**:
- Rota dinâmica `/perfil/[slug]`
- Validação de slug único
- Geração automática de slug a partir do nome
- Meta tags para compartilhamento social
- Analytics de visualizações de perfil

---

### 🔄 US06 - External Links (Linktree Style)
**Status**: PENDENTE
**Feature Name**: external-links-system

**Resumo Rápido**:
- Links externos no perfil (estilo Linktree)
- Cada link: título, URL, ordem de exibição
- Ícone detectado automaticamente pelo domínio
- Drag-and-drop para reordenar
- Limite por plano (Premium: 3, Black: 10)
- Exibição como cards no perfil público

**Componentes Principais**:
- Tabela `profile_links` (user_id, title, url, order, icon)
- Detecção automática de ícones (Instagram, WhatsApp, etc.)
- UI de gerenciamento com drag-and-drop
- Validação de URLs
- Analytics de cliques

---

### 🔄 US07 - Reviews and Ratings System
**Status**: PENDENTE
**Feature Name**: reviews-ratings-system

**Resumo Rápido**:
- Avaliações com nota (1-5 estrelas) e comentário
- Captcha obrigatório para prevenir spam
- Avaliações ocultas por padrão
- Dona do perfil pode escolher exibir/ocultar cada avaliação
- Avaliações não podem ser deletadas pela usuária
- Admin pode moderar futuramente

**Componentes Principais**:
- Tabela `reviews` (profile_id, reviewer_name, rating, comment, visible, created_at)
- Integração com reCAPTCHA
- UI de gerenciamento para dona do perfil
- Cálculo de média de avaliações
- Filtro de avaliações visíveis
- Admin panel para moderação

---

## Próximos Passos

### Opção 1: Criar Specs Completas Restantes
Criar requirements + design + tasks para US03, US04, US05, US06, US07

### Opção 2: Começar Implementação
Executar as tasks da US01 (Phone Validation) que já está completa

### Opção 3: Priorizar Features
Escolher quais features implementar primeiro baseado em prioridade de negócio

## Dependências Entre Features

```
US01 (Phone Validation) → Independente, pode ser implementada primeiro
US02 (Stories) → Depende de planos de assinatura (já existe)
US03 (Boost) → Depende de Stripe (já integrado)
US04 (Verification) → Independente
US05 (Public Profile) → Independente, mas melhora com US06 e US07
US06 (External Links) → Depende de US05 (perfil público)
US07 (Reviews) → Depende de US05 (perfil público)
```

## Recomendação de Ordem de Implementação

1. **US01 - Phone Validation** (Segurança e anti-spam)
2. **US05 - Public Profile Page** (Base para outras features)
3. **US06 - External Links** (Complementa perfil público)
4. **US02 - Stories System** (Engajamento e visibilidade)
5. **US03 - Boost System** (Monetização adicional)
6. **US04 - Profile Verification** (Confiança e autenticidade)
7. **US07 - Reviews System** (Social proof)

## Estimativa de Complexidade

| Feature | Complexidade | Tempo Estimado | Prioridade |
|---------|--------------|----------------|------------|
| US01 - Phone Validation | Alta | 3-5 dias | Alta |
| US02 - Stories | Alta | 4-6 dias | Média |
| US03 - Boost | Média | 2-3 dias | Média |
| US04 - Verification | Média | 2-3 dias | Média |
| US05 - Public Profile | Baixa | 1-2 dias | Alta |
| US06 - External Links | Baixa | 1-2 dias | Média |
| US07 - Reviews | Média | 2-3 dias | Baixa |

**Total Estimado**: 15-24 dias de desenvolvimento
