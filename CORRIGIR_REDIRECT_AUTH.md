# Corrigir Redirect de Autenticação para Localhost

## Problema
Ao fazer login no localhost, o Supabase redireciona para produção em vez de localhost.

## Causa
O Supabase Auth precisa ter as URLs de localhost configuradas como permitidas no Dashboard.

## Solução

### Passo 1: Acessar Configurações do Supabase

1. Ir para: https://supabase.com/dashboard/project/jvimmwjnrwaingwavpws/auth/url-configuration
2. Ou navegar manualmente:
   - Dashboard do Supabase
   - Seu projeto
   - Authentication (menu lateral)
   - URL Configuration

### Passo 2: Adicionar URLs de Localhost

Na seção **Redirect URLs**, adicione:

```
http://localhost:3000/**
http://localhost:3000/api/auth/callback
```

**Importante**: Use `http://localhost:3000/**` com dois asteriscos para permitir qualquer rota.

### Passo 3: Configurar Site URL (Opcional)

Na seção **Site URL**, você pode deixar a URL de produção ou adicionar localhost temporariamente:

```
http://localhost:3000
```

### Passo 4: Salvar

Clique em "Save" no final da página.

## Verificação

Após salvar, teste o login:

1. Limpar cookies do navegador (ou usar aba anônima)
2. Acessar: http://localhost:3000/login
3. Fazer login com Google/GitHub
4. Deve redirecionar para: http://localhost:3000/onboarding (ou /portal)

## Configuração Completa Recomendada

### Redirect URLs (adicionar todas):
```
http://localhost:3000/**
http://localhost:3000/api/auth/callback
https://seu-dominio.com/**
https://seu-dominio.com/api/auth/callback
```

### Site URL:
```
http://localhost:3000
```
(Ou sua URL de produção se preferir)

## Alternativa: Usar Variável de Ambiente

Se você quiser que o Supabase use automaticamente a URL correta, pode configurar no código:

```typescript
// lib/supabase/client.ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
    }
  }
)
```

Mas isso já deve estar configurado. O problema é que o Supabase bloqueia URLs não autorizadas.

## Troubleshooting

### Ainda redireciona para produção?

1. **Limpar cache do navegador**
   - Cmd+Shift+Delete (Mac)
   - Ctrl+Shift+Delete (Windows/Linux)
   - Limpar cookies e cache

2. **Verificar se salvou no Supabase**
   - Recarregar a página de configuração
   - Confirmar que localhost está na lista

3. **Verificar console do navegador**
   - Abrir DevTools (F12)
   - Ver se há erros de CORS ou redirect

4. **Testar em aba anônima**
   - Cmd+Shift+N (Mac)
   - Ctrl+Shift+N (Windows/Linux)

### Erro de CORS?

Se aparecer erro de CORS, adicione também em:
- Authentication → URL Configuration → Additional Redirect URLs

### Múltiplos ambientes?

Se você tem staging/preview, adicione também:
```
https://preview-xxx.vercel.app/**
https://staging.seu-dominio.com/**
```

## Configuração para Produção

Quando for para produção, mantenha ambas as URLs:

```
http://localhost:3000/**          (para desenvolvimento)
https://seu-dominio.com/**        (para produção)
```

Assim você pode desenvolver localmente sem problemas.

## Links Úteis

- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/redirect-urls)
- [Next.js Auth with Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)
