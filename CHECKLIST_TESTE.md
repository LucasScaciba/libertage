# ✅ Checklist de Teste - Contratação de Plano

## Pré-requisitos
- [x] Login funcionando no localhost
- [x] Webhook secret configurado
- [x] `stripe listen` rodando
- [ ] Banco de dados atualizado com novos Price IDs

## ⚠️ IMPORTANTE: Atualizar Banco de Dados

**ANTES de fazer o checkout**, você PRECISA executar este SQL no Supabase:

```sql
-- Atualizar plano Premium com novo preço de R$ 49,00
UPDATE plans 
SET stripe_price_id = 'price_1T74EQFR1necx3GA53Afvm58'
WHERE code = 'premium';

-- Atualizar plano Black com novo preço de R$ 99,00
UPDATE plans
SET stripe_price_id = 'price_1T74EUFR1necx3GAJvkOX9js'
WHERE code = 'black';

-- Verificar se os IDs foram atualizados corretamente
SELECT code, name, stripe_price_id, price 
FROM plans 
WHERE code IN ('premium', 'black');
```

**Por que isso é importante?**
- Sem isso, o sistema não vai encontrar o plano quando o webhook chegar
- Você verá erro: "No plan found for Stripe price ID"

## Passo a Passo do Teste

### 1. Preparação
- [ ] Servidor Next.js rodando (`npm run dev`)
- [ ] `stripe listen` rodando em outro terminal
- [ ] Console do navegador aberto (F12)
- [ ] SQL executado no Supabase

### 2. Acessar Página de Planos
- [ ] Ir para: http://localhost:3000/portal/plans
- [ ] Verificar que os planos aparecem corretamente
- [ ] Verificar preços: Premium (R$ 49) e Black (R$ 99)

### 3. Iniciar Checkout
- [ ] Clicar em "Assinar" no plano desejado
- [ ] Verificar redirecionamento para Stripe Checkout
- [ ] Verificar que o preço está correto na página do Stripe

### 4. Completar Pagamento
- [ ] Usar cartão de teste: `4242 4242 4242 4242`
- [ ] CVC: qualquer 3 dígitos (ex: 123)
- [ ] Data: qualquer data futura (ex: 12/25)
- [ ] CEP: qualquer (ex: 12345)
- [ ] Clicar em "Pagar"

### 5. Verificar Webhook
No terminal do `stripe listen`, você deve ver:
```
--> checkout.session.completed [evt_xxx]
<-- [200] POST http://localhost:3000/api/webhooks/stripe
```

### 6. Verificar Logs do Servidor
No terminal do Next.js, você deve ver:
```
=== Checkout Session Completed ===
Session ID: cs_xxx
Session mode: subscription
Processing subscription checkout...
Plan found: [plan_id]
Subscription saved successfully
Profile publish check completed
```

### 7. Verificar Redirecionamento
- [ ] Deve retornar para: `/portal/plans?success=true&session_id=cs_xxx`
- [ ] Deve redirecionar automaticamente para: `/portal/profile`
- [ ] Plano deve estar ativo

### 8. Verificar no Banco de Dados
Execute no Supabase:
```sql
-- Verificar assinatura criada
SELECT * FROM subscriptions 
WHERE user_id = 'SEU_USER_ID'
ORDER BY created_at DESC 
LIMIT 1;

-- Verificar perfil publicado
SELECT status FROM profiles 
WHERE user_id = 'SEU_USER_ID';
```

### 9. Verificar no Stripe Dashboard
- [ ] Ir para: https://dashboard.stripe.com/test/subscriptions
- [ ] Verificar que a assinatura foi criada
- [ ] Verificar que o preço está correto (R$ 49 ou R$ 99)

## O Que Observar

### ✅ Sinais de Sucesso
- Webhook recebido com status 200
- Logs mostram "Subscription saved successfully"
- Plano aparece como ativo na interface
- Perfil foi publicado automaticamente
- Registro criado no banco de dados

### ❌ Sinais de Problema

**Erro: "No plan found for Stripe price ID"**
- Causa: Banco não foi atualizado
- Solução: Executar SQL de atualização

**Webhook não chega**
- Causa: `stripe listen` não está rodando
- Solução: Iniciar `stripe listen` novamente

**Erro 400 no webhook**
- Causa: Webhook secret incorreto
- Solução: Verificar `.env.local` e reiniciar servidor

**Assinatura não aparece**
- Causa: Webhook falhou ou não foi processado
- Solução: Usar botão "Atualizar Plano do Stripe"

## Cartões de Teste

### Sucesso
- `4242 4242 4242 4242` - Pagamento aprovado

### Testes Específicos
- `4000 0000 0000 0002` - Cartão recusado
- `4000 0027 6000 3184` - Requer autenticação 3D Secure
- `4000 0000 0000 9995` - Fundos insuficientes

## Após o Teste

### Se funcionou ✅
- [ ] Cancelar a assinatura de teste no Stripe Dashboard
- [ ] Limpar dados de teste do banco se necessário
- [ ] Documentar qualquer problema encontrado

### Se não funcionou ❌
- [ ] Copiar logs de erro completos
- [ ] Verificar checklist novamente
- [ ] Verificar se SQL foi executado
- [ ] Tentar sincronização manual

## Comandos Úteis

### Ver últimos eventos do Stripe
```bash
stripe events list --limit 5
```

### Reenviar um webhook
```bash
stripe events resend evt_xxxxx
```

### Ver logs detalhados
```bash
stripe listen --print-json
```

## Próximos Testes

Após o teste básico funcionar:
- [ ] Testar cancelamento de assinatura
- [ ] Testar upgrade de plano (Premium → Black)
- [ ] Testar downgrade de plano (Black → Premium)
- [ ] Testar renovação automática
- [ ] Testar falha de pagamento
