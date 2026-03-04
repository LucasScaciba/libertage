# Fluxo de Autenticação Corrigido

## ✅ Novo Fluxo (Correto)

```
Login Google → Validação de Telefone → Onboarding/Planos → Portal
```

### Ordem de Prioridade:

1. **Autenticação** (Google OAuth)
2. **Validação de Telefone** (`phone_verified_at = null`)
3. **Onboarding** (`onboarding_completed = false`)
4. **Portal** (acesso completo)

## 🔄 O Que Foi Alterado

### 1. Callback de Autenticação (`app/api/auth/callback/route.ts`)

**Antes:**
```typescript
// Redirecionava direto para onboarding
if (isNewUser) {
  return NextResponse.redirect(`${origin}/onboarding`);
}
```

**Depois:**
```typescript
// Verifica phone_verified_at PRIMEIRO
if (userData?.phone_verified_at === null) {
  return NextResponse.redirect(`${origin}/phone-validation`);
}

// Depois verifica onboarding
if (!userData?.onboarding_completed) {
  return NextResponse.redirect(`${origin}/onboarding`);
}
```

### 2. Middleware (`middleware.ts`)

**Antes:**
- Verificava phone validation apenas em rotas `/portal` e `/admin`

**Depois:**
- Verifica phone validation em rotas `/portal`, `/admin` E `/onboarding`
- Bloqueia acesso ao onboarding se telefone não validado

### 3. Página de Validação (`app/phone-validation/page.tsx`)

**Antes:**
- Redirecionava para `/portal` após validação

**Depois:**
- Redireciona para `/onboarding` após validação
- Verifica se onboarding já foi completado antes de redirecionar

## 📋 Fluxo Detalhado

### Para Novo Usuário:

1. **Login com Google** → Cria usuário no banco
   - `phone_verified_at = null`
   - `onboarding_completed = false`

2. **Callback redireciona para** `/phone-validation`
   - Usuário valida telefone via SMS
   - `phone_verified_at` é preenchido

3. **Após validação, redireciona para** `/onboarding`
   - Usuário seleciona plano
   - Se plano pago → Stripe Checkout
   - Se plano gratuito → Completa onboarding
   - `onboarding_completed = true`

4. **Após onboarding, redireciona para** `/portal`
   - Acesso completo ao sistema

### Para Usuário Existente:

**Cenário A: Telefone não validado**
```
Login → /phone-validation → /onboarding → /portal
```

**Cenário B: Telefone validado, onboarding incompleto**
```
Login → /onboarding → /portal
```

**Cenário C: Tudo completo**
```
Login → /portal
```

## 🛡️ Proteções do Middleware

O middleware agora protege:

- ✅ `/portal/*` - Requer telefone validado E onboarding completo
- ✅ `/admin/*` - Requer telefone validado E onboarding completo E role admin/moderator
- ✅ `/onboarding` - Requer telefone validado (novo!)

## 🧪 Como Testar

### Teste 1: Novo Usuário Completo

1. Faça logout
2. Use uma nova conta Google (ou limpe o usuário do banco)
3. Faça login
4. **Deve ir para** `/phone-validation`
5. Valide o telefone
6. **Deve ir para** `/onboarding`
7. Selecione um plano
8. **Deve ir para** `/portal`

### Teste 2: Usuário Sem Telefone Validado

```sql
-- Resetar telefone de um usuário
UPDATE users 
SET phone_verified_at = NULL 
WHERE email = 'seu-email@gmail.com';
```

1. Faça login
2. **Deve ir para** `/phone-validation`
3. Tente acessar `/onboarding` manualmente
4. **Deve ser redirecionado** para `/phone-validation`

### Teste 3: Usuário Com Telefone, Sem Onboarding

```sql
-- Resetar onboarding de um usuário
UPDATE users 
SET onboarding_completed = false 
WHERE email = 'seu-email@gmail.com';
```

1. Faça login
2. **Deve ir para** `/onboarding`
3. Tente acessar `/portal` manualmente
4. **Deve ser redirecionado** para `/onboarding`

## ⚠️ Importante

- **Planos pagos**: Após selecionar plano pago, usuário vai para Stripe Checkout
- **Após pagamento**: Stripe webhook completa o onboarding automaticamente
- **Plano gratuito**: Onboarding é completado imediatamente

## 🎯 Benefícios do Novo Fluxo

1. ✅ Validação de telefone acontece ANTES de qualquer pagamento
2. ✅ Evita usuários não verificados no Stripe
3. ✅ Garante que todos os usuários têm telefone validado
4. ✅ Fluxo mais seguro e controlado
5. ✅ Melhor experiência do usuário (valida identidade primeiro)

## 📝 Checklist de Verificação

- [x] Callback redireciona para `/phone-validation` primeiro
- [x] Middleware protege `/onboarding` também
- [x] Página de validação redireciona para `/onboarding`
- [x] Política RLS de INSERT criada
- [x] Fluxo testado com novo usuário
- [ ] Twilio Verify Service SID configurado
- [ ] Teste completo com SMS real
