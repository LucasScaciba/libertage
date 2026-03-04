# Diagnóstico do Fluxo de Assinaturas

## Problema Identificado
Usuários completam o pagamento no Stripe mas a assinatura não é ativada no sistema.

## Análise do Fluxo Atual

### 1. Fluxo Normal (Webhooks)
```
Usuário paga → Stripe envia webhook → handleCheckoutCompleted → Assinatura ativada
```

**Status**: ❌ NÃO FUNCIONA
- `STRIPE_WEBHOOK_SECRET` está vazio no `.env.local`
- Webhooks não podem ser verificados sem o secret
- Todos os webhooks são rejeitados com erro 400

### 2. Fluxo de Fallback (Verificação Manual)
```
Usuário retorna → verify-session API → handleCheckoutCompleted → Assinatura ativada
```

**Status**: ⚠️ PARCIALMENTE FUNCIONA
- Depende do usuário retornar para a página de planos
- Funciona apenas se `session_id` estiver na URL
- Requer que o usuário não feche a aba antes de retornar

## Assinaturas Encontradas no Stripe

Total de assinaturas ativas: 10+
Todas usando o preço antigo: `price_1T5sMrFR1necx3GAACSpCByl` (R$ 1,00)

Exemplo de assinatura recente:
- ID: `sub_1T72fkFR1necx3GAP4P98qHQ`
- Cliente: `cus_U5D19ffKA2gEL5`
- Status: active
- Criada: 2025-01-01

## Problemas Identificados

### 1. Webhook Secret Não Configurado
**Impacto**: CRÍTICO
- Nenhum webhook é processado
- Sistema depende 100% do fallback manual

**Solução**:
1. Configurar webhook no Stripe Dashboard
2. Copiar o signing secret
3. Adicionar ao `.env.local`

### 2. Preços Desatualizados
**Impacto**: MÉDIO
- Usuários estão pagando R$ 1,00 em vez de R$ 49,00
- Banco de dados ainda aponta para preços antigos

**Solução**:
1. Executar `update-stripe-prices.sql` no Supabase
2. Novos checkouts usarão os preços corretos

### 3. Falta de Metadata no Cliente
**Impacto**: BAIXO
- Dificulta rastreamento de clientes
- Não impede funcionamento

**Solução**:
- Adicionar `user_id` no metadata ao criar customer

## Recomendações

### Imediato (Crítico)
1. ✅ Criar novos preços no Stripe (R$ 49 e R$ 99) - FEITO
2. ⏳ Executar SQL para atualizar banco de dados
3. ⏳ Configurar webhook secret

### Curto Prazo
4. Adicionar logs mais detalhados no webhook handler
5. Criar endpoint de diagnóstico para verificar status de assinaturas
6. Implementar retry automático para webhooks falhados

### Longo Prazo
7. Adicionar monitoramento de webhooks
8. Criar dashboard admin para gerenciar assinaturas
9. Implementar notificações para pagamentos falhados

## Como Testar o Fluxo

### Teste 1: Webhook (Requer configuração)
1. Configurar webhook secret
2. Usar Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Fazer um checkout de teste
4. Verificar logs do webhook

### Teste 2: Fallback (Funciona agora)
1. Fazer checkout de teste
2. Completar pagamento
3. Retornar para `/portal/plans?success=true&session_id=XXX`
4. Sistema deve ativar automaticamente

### Teste 3: Sincronização Manual
1. Fazer checkout e completar pagamento
2. Ir para `/portal/plans`
3. Clicar em "Atualizar Plano do Stripe"
4. Sistema deve buscar assinatura do Stripe

## Próximos Passos

1. Configurar webhook secret para produção
2. Testar fluxo completo em ambiente de desenvolvimento
3. Verificar assinaturas existentes e corrigir manualmente se necessário
4. Atualizar documentação com processo de troubleshooting
