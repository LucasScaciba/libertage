# Checklist de Migrations para Produção

## ⚠️ IMPORTANTE: Execute na ordem exata!

### Pré-requisitos
- [ ] Backup do banco de dados de produção
- [ ] Acesso ao Supabase Dashboard de produção
- [ ] Acesso ao SQL Editor do Supabase

---

## 1️⃣ Sistema de Stories

### Migration: `009_stories_system.sql`

**O que faz:**
- Cria tabela `stories` (id, user_id, video_url, thumbnail_url, status, expires_at)
- Cria tabela `story_views` (rastreamento de visualizações)
- Cria tabela `story_reports` (denúncias)
- Adiciona coluna `max_stories` na tabela `plans`
- Cria índices para performance

**Como executar:**
1. Abra o SQL Editor no Supabase
2. Cole o conteúdo de `supabase/migrations/009_stories_system.sql`
3. Execute
4. Verifique se as tabelas foram criadas: `SELECT * FROM stories LIMIT 1;`

**Status:** [ ] Executado

---

## 2️⃣ Políticas RLS para Stories

### Migration: `011_stories_rls_policies.sql`

**O que faz:**
- Habilita RLS nas tabelas de stories
- Cria políticas para leitura pública de stories ativos
- Cria políticas para usuários gerenciarem seus próprios stories
- Cria políticas para visualizações e denúncias

**Como executar:**
1. Abra o SQL Editor no Supabase
2. Cole o conteúdo de `supabase/migrations/011_stories_rls_policies.sql`
3. Execute
4. Verifique: `SELECT * FROM pg_policies WHERE tablename = 'stories';`

**Status:** [ ] Executado

---

## 3️⃣ Bucket de Stories no Storage

### Arquivo: `CREATE_STORIES_BUCKET.sql`

**O que faz:**
- Cria bucket `stories` no Supabase Storage
- Configura como público
- Define limite de 18MB por arquivo
- Permite vídeos (mp4, quicktime) e imagens (jpeg, png)
- Cria políticas RLS para upload/delete

**Como executar:**
1. Abra o SQL Editor no Supabase
2. Cole o conteúdo de `CREATE_STORIES_BUCKET.sql`
3. Execute
4. Verifique no Storage: deve aparecer bucket "stories"

**Status:** [ ] Executado

---

## 4️⃣ Sistema de Verificação de Perfil

### Migration: `010_profile_verification_system.sql`

**O que faz:**
- Cria tabela `verification_requests` (solicitações de verificação)
- Adiciona coluna `is_verified` na tabela `profiles`
- Cria índices para performance
- Cria políticas RLS

**Como executar:**
1. Abra o SQL Editor no Supabase
2. Cole o conteúdo de `supabase/migrations/010_profile_verification_system.sql`
3. Execute
4. Verifique: `SELECT * FROM verification_requests LIMIT 1;`

**Status:** [ ] Executado

---

## 5️⃣ Sistema de Links Externos

### Migration: `012_external_links_system.sql`

**O que faz:**
- Cria tabela `external_links` (links estilo Linktree)
- Adiciona colunas `max_external_links` e `can_reorder_links` na tabela `plans`
- Cria índices para performance
- Cria políticas RLS

**Como executar:**
1. Abra o SQL Editor no Supabase
2. Cole o conteúdo de `supabase/migrations/012_external_links_system.sql`
3. Execute
4. Verifique: `SELECT * FROM external_links LIMIT 1;`

**Status:** [ ] Executado

---

## 6️⃣ Reestruturação da Página de Perfil

### Migration: `013_profile_page_restructure_EXECUTE_THIS.sql`

**O que faz:**
- Adiciona coluna `slug` na tabela `profiles`
- Adiciona coluna `slug_last_changed_at` para controle de mudanças
- Cria índice único para slugs
- Cria função para gerar slugs automaticamente
- Popula slugs existentes baseado em display_name

**Como executar:**
1. Abra o SQL Editor no Supabase
2. Cole o conteúdo de `supabase/migrations/013_profile_page_restructure_EXECUTE_THIS.sql`
3. Execute
4. Verifique: `SELECT id, display_name, slug FROM profiles LIMIT 10;`

**Status:** [ ] Executado

---

## ✅ Verificação Final

Após executar todas as migrations, verifique:

```sql
-- 1. Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('stories', 'story_views', 'story_reports', 'verification_requests', 'external_links');

-- 2. Verificar colunas adicionadas em plans
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'plans' 
AND column_name IN ('max_stories', 'max_external_links', 'can_reorder_links');

-- 3. Verificar colunas adicionadas em profiles
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('is_verified', 'slug', 'slug_last_changed_at');

-- 4. Verificar bucket de stories
SELECT * FROM storage.buckets WHERE name = 'stories';

-- 5. Verificar políticas RLS
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('stories', 'story_views', 'story_reports', 'verification_requests', 'external_links')
GROUP BY tablename;
```

**Resultado esperado:**
- 5 tabelas criadas
- 3 colunas em plans
- 3 colunas em profiles
- 1 bucket 'stories'
- Políticas RLS em todas as tabelas

---

## 🚨 Em caso de erro

Se alguma migration falhar:

1. **Não entre em pânico!**
2. Leia a mensagem de erro
3. Verifique se a migration já foi executada antes
4. Se necessário, faça rollback manual:
   - Remova as tabelas criadas: `DROP TABLE IF EXISTS nome_tabela CASCADE;`
   - Remova as colunas adicionadas: `ALTER TABLE nome_tabela DROP COLUMN IF EXISTS nome_coluna;`
5. Corrija o problema e execute novamente

---

## 📝 Notas

- Todas as migrations são idempotentes (podem ser executadas múltiplas vezes)
- Use `IF NOT EXISTS` e `IF EXISTS` para evitar erros
- Sempre faça backup antes de executar migrations em produção
- Teste em staging primeiro, se possível

---

## ✅ Checklist Final

- [ ] Todas as 6 migrations executadas com sucesso
- [ ] Bucket 'stories' criado no Storage
- [ ] Verificação final executada sem erros
- [ ] Backup do banco de dados realizado
- [ ] Deploy do código no Vercel iniciado
