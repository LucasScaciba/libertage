# Mudanças no Sistema de Publicação de Perfis

## Resumo

Implementamos uma nova abordagem para a visibilidade de perfis no catálogo, removendo o sistema manual de "publicar/despublicar" e substituindo por verificação automática de completude.

## Mudanças Implementadas

### 1. Nova Lógica de Publicação

**Antes:**
- Perfis criados com status `draft`
- Usuário precisava clicar em "Publicar Perfil" manualmente
- Botões de "Publicar" e "Despublicar" na interface

**Agora:**
- Todos os perfis são criados com status `published` por padrão
- Perfis só aparecem no catálogo se estiverem completos
- Verificação automática de completude

### 2. Requisitos para Aparecer no Catálogo

Um perfil precisa ter:
1. ✅ Nome (display_name)
2. ✅ Slug
3. ✅ Estado (city)
4. ✅ Idade (age_attribute)
5. ✅ Pelo menos uma foto
6. ✅ Descrição curta (short_description)
7. ✅ Pelo menos um serviço configurado (selected_features)

### 3. Novo Serviço: ProfileCompletenessService

**Arquivo:** `lib/services/profile-completeness.service.ts`

**Métodos:**
- `checkProfileCompleteness(profileId)` - Verifica completude e retorna campos faltantes
- `canShowInCatalog(profileId)` - Verifica se pode aparecer no catálogo
- `generateCompletenessMessage(check)` - Gera mensagem amigável

### 4. Atualização do CatalogService

**Arquivo:** `lib/services/catalog.service.ts`

**Mudanças:**
- Filtros agora verificam completude automaticamente
- Removida verificação de `status === "published"`
- Adicionada verificação de `status !== "unpublished"`
- Queries verificam todos os campos obrigatórios
- Filtro adicional para garantir pelo menos uma foto

### 5. Novo Componente: ProfileCompletenessAlert

**Arquivo:** `app/portal/profile/components/ProfileCompletenessAlert.tsx`

**Funcionalidade:**
- Exibe alerta verde quando perfil está completo
- Exibe alerta amarelo com lista de campos faltantes
- Mostra barra de progresso de completude
- Atualiza automaticamente quando perfil muda

### 6. Novo Endpoint: GET /api/profiles/[id]/completeness

**Arquivo:** `app/api/profiles/[id]/completeness/route.ts`

**Resposta:**
```json
{
  "completeness": {
    "isComplete": false,
    "missingFields": ["Pelo menos uma foto", "Pelo menos um serviço configurado"],
    "completionPercentage": 71
  }
}
```

### 7. Correção de Bug Visual

**Problema:** Texto do slug se sobrepunha ao símbolo @ fixo

**Solução:** Adicionado `pointer-events-none` e `z-10` ao span do @

**Arquivo:** `app/portal/profile/components/SlugEditorComponent.tsx`

### 8. Atualizações na Página de Perfil

**Arquivo:** `app/portal/profile/page.tsx`

**Mudanças:**
- Removidas funções `handlePublish()` e `handleUnpublish()`
- Removidos botões "Publicar Perfil" e "Despublicar Perfil"
- Adicionado componente `ProfileCompletenessAlert`
- Botão "Ver meu perfil público" sempre visível (não depende mais de status)

### 9. Atualização do ProfileService

**Arquivo:** `lib/services/profile.service.ts`

**Mudanças:**
- `createProfile()` agora cria perfis com `status: "published"`
- `getProfileBySlug()` agora retorna perfis com qualquer status exceto "unpublished"

## Status "unpublished"

O status `unpublished` ainda existe e pode ser usado por moderadores/admins para remover perfis do catálogo manualmente (ex: violação de termos). Perfis com este status:
- Não aparecem no catálogo
- Não aparecem em buscas
- Não são acessíveis via URL pública

## Benefícios da Nova Abordagem

1. **Experiência do Usuário Melhorada:**
   - Feedback claro sobre o que falta
   - Barra de progresso visual
   - Sem confusão sobre "publicar" vs "salvar"

2. **Qualidade do Catálogo:**
   - Apenas perfis completos aparecem
   - Reduz perfis vazios ou incompletos
   - Melhora experiência de busca

3. **Simplicidade:**
   - Menos botões e ações
   - Lógica mais clara
   - Menos estados para gerenciar

## Arquivos Criados

- `lib/services/profile-completeness.service.ts`
- `app/portal/profile/components/ProfileCompletenessAlert.tsx`
- `app/api/profiles/[id]/completeness/route.ts`

## Arquivos Modificados

- `lib/services/catalog.service.ts`
- `lib/services/profile.service.ts`
- `app/portal/profile/page.tsx`
- `app/portal/profile/components/SlugEditorComponent.tsx`

## Testes Recomendados

1. ✅ Criar novo perfil e verificar que começa como "published"
2. ✅ Verificar que perfil incompleto não aparece no catálogo
3. ✅ Completar todos os campos e verificar que aparece no catálogo
4. ✅ Verificar alerta de completude mostra campos corretos
5. ✅ Verificar barra de progresso atualiza corretamente
6. ✅ Verificar que @ não se sobrepõe ao texto no campo de slug
7. ✅ Verificar que botão "Ver perfil público" funciona
8. ✅ Verificar que perfis "unpublished" não aparecem no catálogo

## Migração de Dados

**Nota:** Perfis existentes com status "draft" continuarão funcionando, mas não aparecerão no catálogo até que:
1. Sejam completados (todos os campos obrigatórios)
2. OU tenham seu status alterado para "published" manualmente no banco

**Query SQL para migrar perfis draft para published:**
```sql
UPDATE profiles 
SET status = 'published' 
WHERE status = 'draft';
```

## Compatibilidade

- ✅ Mantém compatibilidade com sistema de boosts
- ✅ Mantém compatibilidade com analytics
- ✅ Mantém compatibilidade com sistema de denúncias
- ✅ Mantém compatibilidade com moderação (unpublish)
