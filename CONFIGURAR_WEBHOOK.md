# Como Configurar Webhooks do Stripe

## Opção 1: Desenvolvimento Local (Stripe CLI)

### Passo 1: Instalar Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
# Baixar e instalar
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz
tar -xvf stripe_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

**Windows:**
```bash
# Usar Scoop
scoop install stripe
```

### Passo 2: Fazer Login
```bash
stripe login
```

Isso vai abrir o navegador para você autorizar o CLI.

### Passo 3: Iniciar o Túnel de Webhooks
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Você verá algo como:
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef
```

### Passo 4: Copiar o Secret

Copie o secret que apareceu (começa com `whsec_`) e adicione ao `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef
```

### Passo 5: Reiniciar o Servidor
```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

### Passo 6: Testar

Deixe o `stripe listen` rodando em um terminal e faça um checkout de teste. Você verá os webhooks chegando em tempo real:

```
2025-01-01 10:00:00   --> checkout.session.completed [evt_xxx]
2025-01-01 10:00:01   <-- [200] POST http://localhost:3000/api/webhooks/stripe
```

## Opção 2: Produção (Webhook Permanente)

### Passo 1: Acessar o Stripe Dashboard

1. Ir para: https://dashboard.stripe.com/test/webhooks (para teste)
2. Ou: https://dashboard.stripe.com/webhooks (para produção)

### Passo 2: Adicionar Endpoint

1. Clicar em "Add endpoint"
2. **Endpoint URL**: `https://seu-dominio.com/api/webhooks/stripe`
   - Para teste local com ngrok: `https://xxxx.ngrok.io/api/webhooks/stripe`
   - Para produção: `https://libertage.com/api/webhooks/stripe`

### Passo 3: Selecionar Eventos

Marcar os seguintes eventos:

- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_failed`
- ✅ `invoice.payment_succeeded`

### Passo 4: Copiar o Signing Secret

1. Após criar o endpoint, clicar nele
2. Na seção "Signing secret", clicar em "Reveal"
3. Copiar o secret (começa com `whsec_`)

### Passo 5: Adicionar ao Ambiente

**Para desenvolvimento** (`.env.local`):
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Para produção** (Vercel/Railway/etc):
```bash
# Vercel
vercel env add STRIPE_WEBHOOK_SECRET

# Railway
railway variables set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Ou adicionar manualmente no dashboard da plataforma
```

### Passo 6: Testar o Webhook

No Stripe Dashboard:
1. Ir para o webhook criado
2. Clicar em "Send test webhook"
3. Selecionar `checkout.session.completed`
4. Clicar em "Send test webhook"

Verificar os logs:
- No Dashboard do Stripe: deve mostrar status 200
- No seu servidor: deve mostrar logs de processamento

## Opção 3: Desenvolvimento com ngrok (Alternativa)

Se não quiser usar Stripe CLI, pode usar ngrok:

### Passo 1: Instalar ngrok
```bash
brew install ngrok
# ou baixar de https://ngrok.com/download
```

### Passo 2: Iniciar túnel
```bash
ngrok http 3000
```

Você verá:
```
Forwarding  https://xxxx-xx-xx-xxx-xxx.ngrok.io -> http://localhost:3000
```

### Passo 3: Configurar webhook no Stripe

Use a URL do ngrok: `https://xxxx-xx-xx-xxx-xxx.ngrok.io/api/webhooks/stripe`

### Passo 4: Copiar signing secret e adicionar ao `.env.local`

## Verificação

### Como saber se está funcionando?

1. **Stripe CLI rodando**: Você verá webhooks em tempo real
2. **Logs do servidor**: Deve mostrar:
   ```
   === Checkout Session Completed ===
   Session ID: cs_xxx
   Processing subscription checkout...
   Subscription saved successfully
   ```
3. **Stripe Dashboard**: Status 200 nos webhooks

### Problemas Comuns

#### Erro: "Invalid signature"
**Causa**: Secret incorreto ou não configurado
**Solução**: 
- Verificar se o secret no `.env.local` está correto
- Reiniciar o servidor após adicionar o secret

#### Erro: "Missing stripe-signature header"
**Causa**: Requisição não veio do Stripe
**Solução**: Normal, ignore requisições que não são do Stripe

#### Webhook não chega
**Causa**: URL incorreta ou servidor não acessível
**Solução**:
- Verificar se o servidor está rodando
- Verificar se a URL está correta
- Para localhost, usar Stripe CLI ou ngrok

## Comandos Úteis

### Ver webhooks recentes
```bash
stripe events list --limit 10
```

### Reenviar um webhook
```bash
stripe events resend evt_xxxxx
```

### Ver logs de webhooks
```bash
stripe listen --print-json
```

## Checklist de Configuração

### Desenvolvimento
- [ ] Stripe CLI instalado
- [ ] `stripe login` executado
- [ ] `stripe listen` rodando
- [ ] Secret copiado para `.env.local`
- [ ] Servidor reiniciado
- [ ] Teste realizado com sucesso

### Produção
- [ ] Webhook criado no Dashboard
- [ ] URL de produção configurada
- [ ] Eventos selecionados
- [ ] Secret copiado
- [ ] Variável de ambiente configurada
- [ ] Deploy realizado
- [ ] Teste enviado do Dashboard
- [ ] Status 200 confirmado

## Próximos Passos

Após configurar o webhook:

1. Testar fluxo completo de checkout
2. Verificar que assinatura é ativada automaticamente
3. Testar cancelamento de assinatura
4. Testar falha de pagamento
5. Configurar monitoramento de webhooks falhados

## Recursos

- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)
- [Webhook Events](https://stripe.com/docs/api/events/types)
