# Guia de Teste - Fluxo de Assinatura

## Pré-requisitos

1. ✅ Novos preços criados no Stripe:
   - Premium: `price_1T74EQFR1necx3GA53Afvm58` (R$ 49,00)
   - Black: `price_1T74EUFR1necx3GAJvkOX9js` (R$ 99,00)

2. ⏳ Atualizar banco de dados (OBRIGATÓRIO):
   ```sql
   -- Execute no Supabase SQL Editor
   UPDATE plans 
   SET stripe_price_id = 'price_1T74EQFR1necx3GA53Afvm58'
   WHERE code = 'premium';

   UPDATE plans
   SET stripe_price_id = 'price_1T74EUFR1necx3GAJvkOX9js'
   WHERE code = 'black';
   ```

3. ⏳ Configurar webhook (OPCIONAL para teste, mas OBRIGATÓRIO para produção):
   - Ir para: https://dashboard.stripe.com/test/webhooks
   - Adicionar endpoint: `http://localhost:3000/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, etc.
   - Copiar signing secret e adicionar ao `.env.local`

## Cenário 1: Teste com Webhook (Recomendado)

### Passo 1: Configurar Stripe CLI
```bash
# Instalar Stripe CLI se não tiver
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escutar webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Isso vai gerar um webhook secret temporário. Copie e adicione ao `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Passo 2: Iniciar aplicação
```bash
npm run dev
```

### Passo 3: Fazer checkout
1. Acessar: http://localhost:3000/portal/plans
2. Clicar em "Assinar" no plano Premium ou Black
3. Completar pagamento com cartão de teste: `4242 4242 4242 4242`
4. Verificar logs do Stripe CLI - deve mostrar webhook recebido
5. Verificar logs do servidor - deve mostrar processamento do webhook

### Passo 4: Verificar ativação
1. Retornar para `/portal/plans`
2. Plano deve estar ativo
3. Verificar no Supabase:
   ```sql
   SELECT * FROM subscriptions WHERE user_id = 'SEU_USER_ID';
   ```

## Cenário 2: Teste com Fallback (Sem Webhook)

### Passo 1: Fazer checkout
1. Acessar: http://localhost:3000/portal/plans
2. Clicar em "Assinar" no plano Premium ou Black
3. Completar pagamento com cartão de teste: `4242 4242 4242 4242`

### Passo 2: Retornar automaticamente
- O Stripe vai redirecionar para: `/portal/plans?success=true&session_id=cs_xxx`
- O sistema deve automaticamente chamar `/api/subscriptions/verify-session`
- Verificar console do navegador para logs

### Passo 3: Verificar ativação
- Plano deve estar ativo
- Deve redirecionar para `/portal/profile` após 1 segundo

## Cenário 3: Sincronização Manual

### Quando usar:
- Usuário fechou a aba antes de retornar
- Webhook falhou
- Assinatura foi criada diretamente no Stripe Dashboard

### Passos:
1. Acessar: http://localhost:3000/portal/plans
2. Clicar em "Atualizar Plano do Stripe"
3. Sistema vai:
   - Buscar cliente no Stripe pelo email
   - Buscar assinaturas ativas
   - Sincronizar com banco de dados

## Verificação de Problemas

### Problema: "No plan found for Stripe price ID"

**Causa**: Banco de dados não foi atualizado com novos Price IDs

**Solução**:
```sql
-- Verificar Price IDs no banco
SELECT code, name, stripe_price_id FROM plans;

-- Atualizar se necessário
UPDATE plans 
SET stripe_price_id = 'price_1T74EQFR1necx3GA53Afvm58'
WHERE code = 'premium';
```

### Problema: "Invalid signature" no webhook

**Causa**: Webhook secret incorreto ou não configurado

**Solução**:
1. Verificar `.env.local` tem `STRIPE_WEBHOOK_SECRET`
2. Usar Stripe CLI para gerar secret temporário
3. Ou configurar webhook no Dashboard e copiar secret

### Problema: Assinatura não aparece após pagamento

**Causa**: Webhook não foi processado e usuário não retornou

**Solução**:
1. Usar botão "Atualizar Plano do Stripe"
2. Ou verificar manualmente no Stripe e ativar via SQL:
   ```sql
   -- Buscar assinatura no Stripe primeiro
   -- Depois atualizar no banco
   UPDATE subscriptions 
   SET 
     plan_id = (SELECT id FROM plans WHERE code = 'premium'),
     status = 'active',
     stripe_customer_id = 'cus_xxx',
     stripe_subscription_id = 'sub_xxx'
   WHERE user_id = 'USER_ID';
   ```

## Cartões de Teste Stripe

- Sucesso: `4242 4242 4242 4242`
- Recusado: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`
- Qualquer CVC, data futura, qualquer CEP

## Logs Importantes

### Webhook recebido:
```
=== Checkout Session Completed ===
Session ID: cs_xxx
Session mode: subscription
Customer: cus_xxx
Subscription: sub_xxx
```

### Assinatura ativada:
```
Subscription saved successfully
Profile publish check completed
```

### Erro comum:
```
Error: No plan found for Stripe price ID: price_xxx
```
→ Significa que o banco não foi atualizado

## Checklist Final

Antes de ir para produção:

- [ ] Executar SQL para atualizar Price IDs
- [ ] Configurar webhook no Stripe Dashboard (produção)
- [ ] Adicionar `STRIPE_WEBHOOK_SECRET` no `.env` de produção
- [ ] Testar fluxo completo em ambiente de staging
- [ ] Verificar que preços corretos (R$ 49 e R$ 99) aparecem no checkout
- [ ] Testar cancelamento de assinatura
- [ ] Testar renovação automática
- [ ] Configurar monitoramento de webhooks falhados
