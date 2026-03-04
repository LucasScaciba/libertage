# Guia de Deploy para Produção

## 📋 Checklist Pré-Deploy

### 1. Migrations do Supabase (EXECUTAR PRIMEIRO)

Execute as migrations na seguinte ordem no Supabase de produção:

```sql
-- 1. Sistema de Stories
supabase/migrations/009_stories_system.sql

-- 2. Políticas RLS para Stories
supabase/migrations/011_stories_rls_policies.sql

-- 3. Sistema de Verificação de Perfil
supabase/migrations/010_profile_verification_system.sql

-- 4. Sistema de Links Externos
supabase/migrations/012_external_links_system.sql

-- 5. Reestruturação da Página de Perfil
supabase/migrations/013_profile_page_restructure_EXECUTE_THIS.sql
```

### 2. Criar Bucket de Stories no Supabase Storage

Execute via Supabase Dashboard ou SQL:

```sql
-- Ver arquivo: CREATE_STORIES_BUCKET.sql
-- Criar bucket 'stories' com:
-- - public: true
-- - file_size_limit: 18MB
-- - allowed_mime_types: video/mp4, video/quicktime, image/jpeg, image/png
```

Ou use o MCP Supabase para criar o bucket programaticamente.

### 3. Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no Vercel:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Twilio (para validação de telefone)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=

# Encryption (para telefones)
ENCRYPTION_KEY=
```

### 4. Configurar Webhooks do Stripe

Configure o webhook do Stripe para apontar para:
```
https://seu-dominio.com/api/webhooks/stripe
```

Eventos necessários:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### 5. Configurar Cron Jobs no Vercel

Adicione no `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-stories",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/expire-verifications",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## 🚀 Processo de Deploy

### Passo 1: Commit das Alterações

```bash
# Adicionar todos os arquivos
git add .

# Commit
git commit -m "feat: stories system, profile verification, external links, and profile restructure"

# Push para main
git push origin main
```

### Passo 2: Deploy Automático

O Vercel fará o deploy automaticamente quando você fizer push para `main`.

### Passo 3: Verificar Deploy

1. Acesse o dashboard do Vercel
2. Verifique se o build foi bem-sucedido
3. Teste as funcionalidades principais

## ✅ Testes Pós-Deploy

### 1. Sistema de Stories
- [ ] Upload de story funciona
- [ ] Stories aparecem no carrossel do catálogo
- [ ] Modal de visualização funciona
- [ ] Navegação entre stories funciona
- [ ] Stories expiram após 24h (testar com cron)

### 2. Verificação de Perfil
- [ ] Formulário de verificação funciona
- [ ] Upload de documentos funciona
- [ ] Badge de verificado aparece nos perfis verificados

### 3. Links Externos
- [ ] Adicionar links funciona
- [ ] Reordenar links funciona
- [ ] Links aparecem no perfil público
- [ ] Ícones são detectados corretamente

### 4. Reestruturação de Perfil
- [ ] Página de perfil público funciona (/perfil/[slug])
- [ ] Slug personalizado funciona
- [ ] Validação de slug funciona
- [ ] SEO meta tags estão corretas

### 5. Validação de Telefone
- [ ] Envio de OTP funciona
- [ ] Verificação de OTP funciona
- [ ] Redirecionamento após login funciona

## 🔧 Troubleshooting

### Erro: "Bucket not found"
- Verifique se o bucket 'stories' foi criado no Supabase Storage
- Execute o SQL em CREATE_STORIES_BUCKET.sql

### Erro: "Column does not exist"
- Verifique se todas as migrations foram executadas
- Execute as migrations na ordem correta

### Erro: "RLS policy violation"
- Verifique se as políticas RLS foram criadas
- Execute 011_stories_rls_policies.sql

### Stories não expiram
- Verifique se o cron job está configurado no Vercel
- Teste manualmente: `curl https://seu-dominio.com/api/cron/expire-stories`

## 📊 Monitoramento

Após o deploy, monitore:

1. **Logs do Vercel**: Erros de runtime
2. **Supabase Dashboard**: Uso de storage, queries lentas
3. **Stripe Dashboard**: Webhooks falhando
4. **Analytics**: Uso das novas funcionalidades

## 🎯 Funcionalidades Implementadas

### ✅ Sistema de Stories
- Upload de vídeos (até 18MB)
- Carrossel no catálogo
- Visualização com autoplay
- Expiração automática (24h)
- Limites por plano (Free: 0, Premium: 1, Black: 5)

### ✅ Verificação de Perfil
- Formulário de solicitação
- Upload de documentos
- Painel admin para revisão
- Badge de verificado

### ✅ Links Externos (Estilo Linktree)
- Adicionar/editar/remover links
- Reordenação drag-and-drop
- Detecção automática de ícones
- Validação de URLs
- Limites por plano

### ✅ Reestruturação de Perfil
- Slug personalizado
- Página pública (/perfil/[slug])
- SEO otimizado
- Validação de completude

### ✅ Validação de Telefone
- OTP via Twilio
- Criptografia de telefones
- Rate limiting
- Redirecionamento pós-login

## 📝 Notas Importantes

1. **Backup**: Faça backup do banco de dados antes de executar migrations
2. **Testes**: Teste em staging antes de produção (se disponível)
3. **Rollback**: Mantenha a versão anterior disponível para rollback rápido
4. **Comunicação**: Avise os usuários sobre novas funcionalidades

## 🆘 Suporte

Em caso de problemas:
1. Verifique os logs do Vercel
2. Verifique os logs do Supabase
3. Reverta o deploy se necessário: `vercel rollback`
