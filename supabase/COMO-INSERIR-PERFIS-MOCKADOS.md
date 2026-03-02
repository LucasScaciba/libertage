# Como Inserir Perfis Mockados no Banco de Dados

Este guia explica como inserir os 5 perfis mockados no seu banco de dados Supabase.

## Passo 1: Criar Usuários de Teste

Primeiro, você precisa criar 5 usuários de teste no Supabase Auth:

1. Acesse o Supabase Dashboard
2. Vá em **Authentication** → **Users**
3. Clique em **Add user** → **Create new user**
4. Crie 5 usuários com os seguintes emails:
   - `maria.silva@example.com`
   - `joao.santos@example.com`
   - `ana.costa@example.com`
   - `carlos.oliveira@example.com`
   - `patricia.lima@example.com`
5. Anote os **User IDs (UUIDs)** de cada usuário criado

## Passo 2: Atualizar o Script SQL

1. Abra o arquivo `supabase/seed-mock-profiles.sql`
2. Substitua os placeholders `USER_ID_1_AQUI`, `USER_ID_2_AQUI`, etc. pelos UUIDs reais dos usuários que você criou
3. Exemplo:
   ```sql
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid  -- UUID real do usuário
   ```

## Passo 3: Executar o Script SQL

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New query**
3. Cole o conteúdo do arquivo `seed-mock-profiles.sql` (já com os UUIDs substituídos)
4. Clique em **Run** para executar o script
5. Verifique se os 5 perfis foram criados com sucesso

## Passo 4: Adicionar Fotos aos Perfis (Opcional)

Se quiser adicionar as fotos do Unsplash aos perfis:

### Opção A: Usar URLs Externas (Mais Rápido)

Execute este SQL para inserir as referências das imagens:

```sql
-- Substitua os PROFILE_IDs pelos IDs reais dos perfis criados

-- Maria Silva
INSERT INTO media (profile_id, type, public_url, file_path, display_order)
VALUES ('PROFILE_ID_1', 'image', 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&h=600&fit=crop', 'external/maria-silva.jpg', 1);

-- João Santos
INSERT INTO media (profile_id, type, public_url, file_path, display_order)
VALUES ('PROFILE_ID_2', 'image', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop', 'external/joao-santos.jpg', 1);

-- Ana Costa
INSERT INTO media (profile_id, type, public_url, file_path, display_order)
VALUES ('PROFILE_ID_3', 'image', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop', 'external/ana-costa.jpg', 1);

-- Carlos Oliveira
INSERT INTO media (profile_id, type, public_url, file_path, display_order)
VALUES ('PROFILE_ID_4', 'image', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&h=600&fit=crop', 'external/carlos-oliveira.jpg', 1);

-- Patrícia Lima
INSERT INTO media (profile_id, type, public_url, file_path, display_order)
VALUES ('PROFILE_ID_5', 'image', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&h=600&fit=crop', 'external/patricia-lima.jpg', 1);
```

### Opção B: Fazer Upload para o Supabase Storage

1. Baixe as imagens do Unsplash
2. No Supabase Dashboard, vá em **Storage** → **profile-media**
3. Faça upload das 5 imagens
4. Copie as URLs públicas geradas
5. Insira os registros na tabela `media` com as URLs do Supabase

## Passo 5: Verificar os Perfis

1. Acesse sua aplicação em `http://localhost:3000`
2. Os perfis mockados devem aparecer na listagem
3. Clique em um perfil para abrir o modal e ver os detalhes

## Passo 6: Remover os Dados Mockados do Frontend

Depois que os perfis estiverem no banco de dados, você pode remover os dados mockados do arquivo `app/page.tsx`:

1. Remova a constante `MOCK_PROFILES`
2. Remova o `useEffect` que carrega os dados mockados
3. Descomente as funções `fetchFilters()` e `fetchCatalog()` para buscar dados reais da API

## Troubleshooting

### Erro: "duplicate key value violates unique constraint"
- Verifique se já não existem perfis com os mesmos slugs no banco
- Altere os slugs no script SQL para valores únicos

### Erro: "foreign key constraint"
- Certifique-se de que os User IDs existem na tabela `auth.users`
- Verifique se você substituiu todos os placeholders pelos UUIDs reais

### Perfis não aparecem na listagem
- Verifique se `is_published` está como `true`
- Verifique se `status` está como `'active'`
- Confira se a API `/api/catalog` está funcionando corretamente
