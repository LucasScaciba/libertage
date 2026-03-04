# Profile Verification System (US04)

Sistema completo de verificação de identidade para profissionais da plataforma.

## 📋 Documentos

- **[requirements.md](./requirements.md)** - Requisitos funcionais usando padrões EARS e INCOSE
- **[design.md](./design.md)** - Arquitetura técnica, APIs, componentes e fluxos
- **[tasks.md](./tasks.md)** - Lista de tarefas de implementação
- **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** - Status da implementação e instruções de deploy
- **[GUIA_DE_USO.md](./GUIA_DE_USO.md)** - Guia para usuários e administradores

## 🎯 Objetivo

Permitir que profissionais verifiquem suas identidades enviando selfies com documentos oficiais, aumentando a confiança dos usuários da plataforma através de um selo visual de verificação.

## ✨ Funcionalidades

### Para Profissionais
- ✅ Envio de selfie com documento (RG ou CNH)
- ✅ Visualização de status da verificação
- ✅ Reenvio após rejeição ou expiração
- ✅ Selo de verificação no perfil

### Para Administradores
- ✅ Painel de revisão de solicitações
- ✅ Aprovação/rejeição com motivo
- ✅ Visualização de imagens seguras

### Para Usuários Públicos
- ✅ Selo de verificação no catálogo
- ✅ Selo de verificação no perfil público
- ✅ Tooltip com data de verificação

### Sistema
- ✅ Expiração automática após 90 dias
- ✅ Rate limiting (3 submissões/24h)
- ✅ Auditoria completa
- ✅ Storage seguro e privado

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Profissional  │
└────────┬────────┘
         │ Submete selfie + documento
         ↓
┌─────────────────────────────────┐
│  API: /api/verification/submit  │
│  - Valida imagem                │
│  - Comprime                     │
│  - Upload para storage privado  │
│  - Cria registro "pending"      │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ Admin: /admin/verification      │
│  - Lista pendentes              │
│  - Visualiza imagens            │
│  - Aprova/Rejeita               │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  Badge: VerificationBadge       │
│  - Exibido no catálogo          │
│  - Exibido no perfil público    │
│  - Tooltip com data             │
└─────────────────────────────────┘
         │
         ↓ (após 90 dias)
┌─────────────────────────────────┐
│  Cron: /api/cron/expire-*       │
│  - Expira verificações          │
│  - Envia lembretes              │
└─────────────────────────────────┘
```

## 🗄️ Schema do Banco

### profile_verifications
```sql
- id (UUID)
- profile_id (UUID) → profiles.id
- status (enum: not_verified, pending, verified, rejected, expired)
- document_type (enum: RG, CNH)
- selfie_image_path (TEXT)
- submitted_at (TIMESTAMPTZ)
- reviewed_at (TIMESTAMPTZ)
- reviewed_by (UUID) → auth.users.id
- verified_at (TIMESTAMPTZ)
- expires_at (TIMESTAMPTZ)
- rejection_reason (TEXT)
```

### verification_audit_log
```sql
- id (UUID)
- verification_id (UUID) → profile_verifications.id
- action (VARCHAR)
- actor_id (UUID) → auth.users.id
- metadata (JSONB)
- created_at (TIMESTAMPTZ)
```

## 🔐 Segurança

- **Storage Privado**: Imagens em bucket privado com signed URLs (1h)
- **RLS Policies**: Acesso controlado no nível do banco
- **Rate Limiting**: 3 submissões por 24h por usuário
- **Admin Only**: Endpoints de revisão requerem role admin
- **Auditoria**: Todas as ações são logadas automaticamente
- **Auto-Delete**: Imagens deletadas após 30 dias (planejado)

## 📊 Estados da Verificação

```
not_verified → pending → verified → expired
                  ↓
              rejected → pending (nova submissão)
```

## 🚀 Deploy

### 1. Aplicar Migration
```bash
supabase db push
```

### 2. Criar Storage Bucket
- Nome: `verification-images`
- Tipo: Private
- RLS: Enabled

### 3. Configurar Env
```bash
CRON_SECRET=seu_secret_aqui
```

### 4. Deploy
```bash
vercel --prod
```

## 📝 Uso

### Profissional
```
1. Acesse /portal/verification
2. Selecione tipo de documento
3. Faça upload da selfie
4. Aguarde revisão
```

### Admin
```
1. Acesse /admin/verification
2. Revise solicitações pendentes
3. Aprove ou rejeite com motivo
```

## 🧪 Testes

### Manual
1. Submeter verificação como profissional
2. Revisar como admin
3. Verificar badge no catálogo
4. Verificar badge no perfil público
5. Testar expiração (alterar data no DB)

### Automatizado
- Unit tests para services
- Integration tests para APIs
- E2E tests para fluxo completo

## 📈 Métricas

- Taxa de aprovação/rejeição
- Tempo médio de revisão
- Número de verificações ativas
- Taxa de renovação após expiração

## 🔄 Workflow

Este spec foi criado usando o **Requirements-First Workflow**:
1. ✅ Requirements (EARS + INCOSE)
2. ✅ Design (Arquitetura + APIs)
3. ✅ Tasks (Implementação)
4. ✅ Implementation (Código)

## 📚 Referências

- [EARS Patterns](https://alistairmavin.com/ears/)
- [INCOSE Requirements Guide](https://www.incose.org/)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

## 🤝 Contribuindo

Para adicionar funcionalidades:
1. Atualizar requirements.md
2. Atualizar design.md
3. Adicionar tasks em tasks.md
4. Implementar
5. Atualizar IMPLEMENTATION_COMPLETE.md

## 📞 Suporte

Para dúvidas ou problemas, consulte o [GUIA_DE_USO.md](./GUIA_DE_USO.md) ou entre em contato com a equipe técnica.
