# Checklist de Testes - US01: Validação de Telefone

## ✅ Testes Básicos (Já Testados)

- [x] Login com Google OAuth
- [x] Redirecionamento para `/phone-validation`
- [x] Envio de OTP via SMS
- [x] Verificação de OTP válido
- [x] Redirecionamento para `/onboarding` após validação

## 🧪 Testes de Cenários de Erro (Pendentes)

### Teste 1: Formato de Telefone Inválido
- [ ] Digite telefone sem `+`: `5511999999999`
- [ ] Digite telefone com formato errado: `11999999999`
- [ ] Digite telefone com letras: `+55119abc99999`
- **Resultado esperado**: Mensagem de erro "Formato de telefone inválido"

### Teste 2: Cooldown (60 segundos)
- [ ] Envie um OTP
- [ ] Tente reenviar imediatamente (antes de 60 segundos)
- **Resultado esperado**: Botão desabilitado com "Aguarde X segundos"

### Teste 3: Código OTP Inválido
- [ ] Envie um OTP
- [ ] Digite código errado: `000000`
- **Resultado esperado**: Mensagem "Código inválido"

### Teste 4: Rate Limit (5 tentativas/dia)
- [ ] Erre o código OTP 5 vezes
- [ ] Tente enviar novo OTP
- **Resultado esperado**: Mensagem "Limite de tentativas atingido. Tente novamente amanhã"

### Teste 5: Código OTP Expirado
- [ ] Envie um OTP
- [ ] Aguarde mais de 10 minutos
- [ ] Tente verificar o código
- **Resultado esperado**: Mensagem "Código expirado"

### Teste 6: Usuário Já Validado
- [ ] Complete a validação de telefone
- [ ] Tente acessar `/phone-validation` manualmente
- **Resultado esperado**: Redirecionamento automático para `/onboarding` ou `/portal`

### Teste 7: Fluxo Completo de Novo Usuário
- [ ] Faça logout
- [ ] Use nova conta Google
- [ ] Login → `/phone-validation`
- [ ] Valide telefone → `/onboarding`
- [ ] Selecione plano → `/portal` ou Stripe
- **Resultado esperado**: Fluxo completo sem erros

## 📊 Testes de Integração

### Teste 8: Verificar Dados no Banco
```sql
SELECT 
  id, 
  email, 
  phone_verified_at, 
  phone_security, 
  phone_public,
  phone_attempts_today
FROM users 
WHERE email = 'seu-email@gmail.com';
```
- [ ] `phone_verified_at` está preenchido
- [ ] `phone_security` contém o telefone
- [ ] `phone_public` contém o telefone
- [ ] `phone_attempts_today` foi resetado para 0

### Teste 9: Middleware Funcionando
- [ ] Usuário sem telefone validado não acessa `/portal`
- [ ] Usuário sem telefone validado não acessa `/onboarding`
- [ ] Usuário com telefone validado acessa `/onboarding`
- [ ] Usuário com telefone e onboarding completo acessa `/portal`

## 🎨 Testes de UI/UX

### Teste 10: Acessibilidade
- [ ] Navegação por teclado (Tab) funciona
- [ ] Enter submete os formulários
- [ ] Mensagens de erro são anunciadas (ARIA live regions)
- [ ] Inputs têm labels apropriados
- [ ] Loading states são visíveis

### Teste 11: Responsividade
- [ ] Tela funciona em mobile (< 768px)
- [ ] Tela funciona em tablet (768px - 1024px)
- [ ] Tela funciona em desktop (> 1024px)

## 🔒 Testes de Segurança

### Teste 12: Políticas RLS
```sql
-- Tentar acessar telefone de outro usuário (deve falhar)
SELECT phone_security 
FROM users 
WHERE id != auth.uid();
```
- [ ] Não consegue ver telefone de outros usuários

### Teste 13: API Endpoints
- [ ] `/api/phone-validation/send-otp` requer autenticação
- [ ] `/api/phone-validation/verify-otp` requer autenticação
- [ ] `/api/phone-validation/status` requer autenticação
- [ ] Endpoints não expõem `phone_security` nas respostas

## 📝 Notas

- Testes marcados com [x] foram completados
- Testes marcados com [ ] estão pendentes
- Priorize testes de cenários de erro antes de seguir para novas features
