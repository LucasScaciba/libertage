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
