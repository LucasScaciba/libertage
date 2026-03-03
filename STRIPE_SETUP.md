# Configuração do Stripe

## Passo 1: Criar Produtos no Stripe

1. Acesse o [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Clique em "Add product"

### Produto Premium
- **Nome**: Premium
- **Descrição**: Plano Premium - 8 fotos, 2 vídeos, links externos
- **Preço**: R$ 49,00
- **Tipo de cobrança**: Recorrente
- **Frequência**: Mensal
- **Moeda**: BRL

### Produto Black
- **Nome**: Black
- **Descrição**: Plano Black - 12 fotos, 4 vídeos, links externos, stories, boosts
- **Preço**: R$ 99,00
- **Tipo de cobrança**: Recorrente
- **Frequência**: Mensal
- **Moeda**: BRL

## Passo 2: Copiar os Price IDs

Após criar os produtos, você verá os **Price IDs** (começam com `price_`).

Exemplo:
- Premium: `price_1ABC123xyz...`
- Black: `price_1DEF456xyz...`

## Passo 3: Atualizar no Banco de Dados

Execute o seguinte SQL no Supabase SQL Editor, substituindo pelos IDs reais:

```sql
-- Premium Plan
UPDATE plans 
SET stripe_price_id = 'price_SEU_ID_PREMIUM_AQUI'
WHERE code = 'premium';

-- Black Plan
UPDATE plans
SET stripe_price_id = 'price_SEU_ID_BLACK_AQUI'
WHERE code = 'black';
```

## Passo 4: Configurar Webhook

### Para Produção (Obrigatório)

1. Vá em [Webhooks](https://dashboard.stripe.com/webhooks)
2. Clique em "Add endpoint"
3. **Endpoint URL**: `https://seu-dominio.com/api/webhooks/stripe`
4. **Eventos para escutar**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copie o **Signing secret** (começa com `whsec_`)
6. Adicione ao `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_seu_secret_aqui
   ```

### Para Desenvolvimento Local (Opcional)

O sistema possui um mecanismo de fallback que verifica a sessão do Stripe quando o usuário retorna após o pagamento. Isso significa que mesmo sem webhooks configurados, as assinaturas serão ativadas corretamente.

Para testar webhooks localmente, você pode usar o [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Isso fornecerá um signing secret temporário que você pode usar no `.env.local`.

## Verificação

Para verificar se os IDs estão corretos, execute no Supabase:

```sql
SELECT code, name, stripe_price_id 
FROM plans 
WHERE code IN ('premium', 'black');
```

Os IDs devem:
- Começar com `price_`
- Não ter caracteres extras como `$0` no final
- Ser válidos no Stripe Dashboard

## Troubleshooting

### Erro: "No such price"
- Verifique se o Price ID está correto no banco
- Confirme que o preço existe no Stripe Dashboard
- Certifique-se de estar usando a chave correta (test vs live)

### Erro: "Invalid currency"
- Confirme que os preços no Stripe estão em BRL
- Verifique se o valor está correto (4900 = R$ 49,00)

### Assinatura não ativa após pagamento

Se o usuário completou o pagamento mas a assinatura não foi ativada:

1. **Verifique os logs do servidor**: Procure por mensagens de webhook no console
2. **Teste o webhook manualmente**: Use o Stripe Dashboard para enviar um evento de teste
3. **Verifique o fallback**: O sistema possui um mecanismo de verificação automática quando o usuário retorna do checkout. Verifique os logs do navegador (Console) para mensagens de "Verificando sessão do Stripe..."
4. **Verifique o banco de dados**: 
   ```sql
   SELECT * FROM subscriptions WHERE user_id = 'USER_ID_AQUI';
   ```
5. **Ativação manual** (último recurso): Se necessário, você pode ativar manualmente no banco:
   ```sql
   -- Primeiro, obtenha o plan_id do plano desejado
   SELECT id FROM plans WHERE code = 'premium'; -- ou 'black'
   
   -- Depois, atualize a assinatura do usuário
   UPDATE subscriptions 
   SET plan_id = 'PLAN_ID_AQUI', 
       status = 'active',
       stripe_customer_id = 'CUSTOMER_ID_DO_STRIPE',
       stripe_subscription_id = 'SUBSCRIPTION_ID_DO_STRIPE'
   WHERE user_id = 'USER_ID_AQUI';
   ```

### Como encontrar os IDs do Stripe

1. Acesse o [Stripe Dashboard](https://dashboard.stripe.com)
2. Vá em "Customers" e procure pelo email do usuário
3. Clique no cliente para ver:
   - **Customer ID**: Começa com `cus_`
   - **Subscription ID**: Começa com `sub_` (na seção "Subscriptions")
