# Correção das Políticas RLS

## Problema Identificado

O erro `new row violates row-level security policy for table "users"` ocorria porque:

1. Quando um novo usuário fazia login via Google OAuth, o sistema tentava criar um registro na tabela `users`
2. Não havia política RLS que permitisse INSERT na tabela `users`
3. As novas colunas de validação de telefone foram adicionadas, mas as políticas não foram atualizadas

## Correções Aplicadas

### 1. Criada política de INSERT
```sql
CREATE POLICY "Users can insert own data"
ON users
FOR INSERT
TO public
WITH CHECK (auth.uid() = id);
```

### 2. Removidas políticas duplicadas
- Removida: "Users can read own phone status" (duplicada)
- Removida: "Users can update own phone validation" (duplicada)

### 3. Políticas RLS Finais

Agora a tabela `users` tem 3 políticas:

| Política | Comando | Descrição |
|----------|---------|-----------|
| Users can insert own data | INSERT | Permite que usuários autenticados criem seu próprio registro |
| Users can read own data | SELECT | Permite que usuários leiam seus próprios dados |
| Users can update own data | UPDATE | Permite que usuários atualizem seus próprios dados |

## Como Testar Agora

1. **Faça logout** da aplicação
2. **Limpe os cookies** do navegador (ou use aba anônima)
3. **Faça login** novamente com Google
4. O erro não deve mais aparecer
5. Você deve ser redirecionado para `/onboarding`
6. Selecione um plano
7. Você deve ser redirecionado para `/phone-validation` (se `phone_verified_at` for `null`)

## Verificar no Console

Se ainda houver erro, verifique:

1. **Terminal do servidor**: Não deve mais mostrar "Error upserting user"
2. **Console do navegador**: Verifique se há outros erros
3. **Banco de dados**: Confirme que o usuário foi criado

```sql
SELECT id, email, phone_verified_at, onboarding_completed, created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;
```

## Fluxo Esperado Agora

```
Login Google → Callback cria usuário → Onboarding → Seleciona Plano →
  ↓
phone_verified_at = null?
  ↓ SIM
/phone-validation → Valida Telefone → /portal
  ↓ NÃO
/portal (acesso direto)
```

## Próximos Passos

Depois de testar o login:

1. Verifique se consegue criar um novo usuário sem erros
2. Teste o fluxo de validação de telefone
3. Configure o Twilio Verify Service SID se ainda não fez
