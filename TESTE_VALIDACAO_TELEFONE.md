# Como Testar a Validação de Telefone

## Problema Identificado

O middleware estava verificando `!userData?.phone_verified_at` que pode ser `undefined` em vez de `null`. Corrigi para verificar explicitamente `=== null`.

## Como Testar Agora

### Opção 1: Limpar o campo phone_verified_at do seu usuário

Execute este SQL no Supabase para resetar seu usuário:

```sql
UPDATE users 
SET phone_verified_at = NULL, 
    phone_security = NULL, 
    phone_public = NULL
WHERE email = 'seu-email@gmail.com';
```

Depois:
1. Faça logout
2. Faça login novamente
3. Tente acessar `/portal` ou `/portal/profile`
4. Você deve ser redirecionado para `/phone-validation`

### Opção 2: Acessar diretamente a página de validação

1. Acesse manualmente: http://localhost:3000/phone-validation
2. Teste o fluxo de validação:
   - Digite um telefone no formato: `+5511999999999`
   - Clique em "Enviar código"
   - Digite o código recebido por SMS
   - Clique em "Verificar"

### Opção 3: Criar um novo usuário

1. Faça logout
2. Crie uma nova conta Google (ou use outra conta)
3. Faça login
4. Selecione um plano
5. Você deve ser redirecionado para `/phone-validation` antes de acessar o portal

## Verificar se o Middleware Está Funcionando

Abra o console do navegador (F12) e veja se há algum erro de redirecionamento.

Ou teste diretamente:
1. Faça login
2. Tente acessar: http://localhost:3000/portal
3. Se `phone_verified_at` for `null`, você deve ser redirecionado para `/phone-validation`

## Configuração Necessária

⚠️ **IMPORTANTE**: Você precisa configurar o Twilio Verify Service SID no `.env.local`:

```bash
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Sem isso, o envio de OTP não funcionará.

## Debug

Se ainda não funcionar, verifique:

1. **Console do navegador**: Procure por erros
2. **Terminal do servidor**: Veja se há erros no middleware
3. **Banco de dados**: Confirme que `phone_verified_at` está `null`

```sql
SELECT id, email, phone_verified_at, onboarding_completed 
FROM users 
WHERE email = 'seu-email@gmail.com';
```

## Fluxo Esperado

```
Login → Onboarding → Seleciona Plano → 
  ↓
phone_verified_at = null?
  ↓ SIM
/phone-validation → Valida Telefone → /portal
  ↓ NÃO
/portal (acesso direto)
```
