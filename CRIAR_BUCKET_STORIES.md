# Como Criar o Bucket de Stories no Supabase

## Problema
O erro "Bucket not found" ocorre porque o bucket `stories` não existe no Supabase Storage.

## Solução

### Opção 1: Via SQL Editor (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `CREATE_STORIES_BUCKET.sql`
6. Cole no editor SQL
7. Clique em **Run** (ou pressione Ctrl+Enter)

### Opção 2: Via Interface do Storage

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**
4. Clique em **New bucket**
5. Configure o bucket:
   - **Name**: `stories`
   - **Public bucket**: ✅ Ativado
   - **File size limit**: `18 MB`
   - **Allowed MIME types**: 
     - `video/mp4`
     - `video/quicktime`
     - `video/x-msvideo`
     - `image/jpeg`
     - `image/png`
6. Clique em **Create bucket**
7. Depois, execute o script `CREATE_STORIES_BUCKET.sql` no SQL Editor para criar as políticas de RLS

## Verificação

Após executar o script, verifique se o bucket foi criado:

```sql
SELECT * FROM storage.buckets WHERE id = 'stories';
```

Você deve ver uma linha com:
- `id`: stories
- `name`: stories
- `public`: true
- `file_size_limit`: 18874368

## Políticas de Segurança (RLS)

O script cria as seguintes políticas:

1. **Visualização pública**: Qualquer pessoa pode ver os stories
2. **Upload restrito**: Apenas usuários autenticados podem fazer upload
3. **Atualização restrita**: Usuários só podem atualizar seus próprios stories
4. **Deleção restrita**: Usuários só podem deletar seus próprios stories

## Estrutura de Pastas

Os vídeos são organizados por usuário:
```
stories/
  └── {user_id}/
      └── {story_id}.mp4
      └── {story_id}_thumb.jpg
```

## Próximos Passos

Após criar o bucket, tente publicar um story novamente. O upload deve funcionar corretamente.
