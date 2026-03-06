# Guia de Atualização dos Indicadores de Analytics

## ✅ MIGRATION APLICADA COM SUCESSO!

A migration foi aplicada com sucesso via Supabase MCP no projeto `premium-service-marketplace`.

## Resumo das Mudanças

Atualizamos os indicadores de "Mídias Mais Visualizadas" e "Stories Mais Visualizados" para trabalhar com a nova estrutura de mídias (`media_processing` table).

## Arquivos Modificados

1. **Migration SQL**: `supabase/migrations/20260306_update_analytics_for_new_media.sql`
   - ✅ Atualiza função `get_media_views()` para buscar de `media_processing`
   - ✅ Usa `variants.thumb_240.url` para thumbnails
   - ✅ Filtra apenas mídias com `status = 'ready'`
   - ✅ Usa `original_path` (não `original_filename`)
   - ✅ Atualiza função `get_story_views()` para usar estrutura correta
   - ✅ Stories não têm `media_id`, usam `video_url` e `thumbnail_url` diretamente

2. **Componente React**: `app/portal/dashboard/components/MediaViewsIndicator.tsx`
   - ✅ Atualizado tipo de `"photo"` para `"image"`
   - ✅ Melhorado display de thumbnails de vídeo (mostra thumbnail + ícone de play)

3. **Serviço**: `lib/services/analytics.service.ts`
   - ✅ Atualizado interface `MediaView` para usar `'image' | 'video'`

## Testes Realizados

### ✅ Função get_media_views
```sql
SELECT * FROM get_media_views('3b4694f2-0470-48f6-bdc9-1a52ba62e973');
```
**Resultado**: Retornou 10 mídias com visualizações, ordenadas por view_count (19, 17, 12, 11, 10, 8, 7, 6, 5, 3)

### ✅ Função get_story_views
```sql
SELECT * FROM get_story_views('3b4694f2-0470-48f6-bdc9-1a52ba62e973');
```
**Resultado**: Funcionando corretamente (retornou array vazio pois não há story views para esse perfil)

## Comportamento Esperado

### Mídias Mais Visualizadas
- ✅ Mostra apenas mídias da tabela `media_processing`
- ✅ Filtra apenas mídias com `status = 'ready'`
- ✅ Usa `variants.thumb_240.url` para thumbnails
- ✅ Tipo: `"image"` ou `"video"` (não mais `"photo"`)
- ✅ Ordena por número de visualizações (descendente)
- ✅ Limite: Top 10 mídias
- ✅ Mostra apenas mídias que têm pelo menos 1 visualização

### Stories Mais Visualizados
- ✅ Busca stories ativos (não expirados e não deletados)
- ✅ Usa `thumbnail_url` e `video_url` diretamente da tabela stories
- ✅ Ordena por número de visualizações (descendente)
- ✅ Limite: Top 10 stories
- ✅ Mostra apenas stories que têm pelo menos 1 visualização

## Próximos Passos

A migration já foi aplicada no banco de dados. Agora você pode:

1. **Testar no Dashboard**: Acesse o portal → Painel e verifique os indicadores
2. **Verificar dados**: Os indicadores devem mostrar as mídias e stories mais visualizados
3. **Gerar visualizações**: Abra perfis públicos e clique em mídias/stories para gerar dados de analytics

## Estrutura das Tabelas

### media_processing
- `id` (UUID)
- `profile_id` (UUID)
- `type` (text): "image" ou "video"
- `original_path` (text): caminho do arquivo original
- `status` (text): "queued", "processing", "ready", "failed"
- `variants` (JSONB): contém URLs das variantes (thumb_240, original, etc.)

### stories
- `id` (UUID)
- `user_id` (UUID)
- `video_url` (text)
- `thumbnail_url` (text)
- `expires_at` (timestamp)
- `deleted_at` (timestamp)

### analytics_events
- `id` (UUID)
- `profile_id` (UUID)
- `event_type` (text): "media_view", "story_view", etc.
- `metadata` (JSONB): contém `media_id` ou `story_id`
- `created_at` (timestamp)
