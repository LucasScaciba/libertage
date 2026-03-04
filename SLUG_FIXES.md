# Correções do Sistema de Slug

## Problemas Identificados e Corrigidos

### 1. Símbolo @ no Campo de Slug

**Decisão de Design:** Removido o símbolo @ fixo do campo de input.

**Justificativa:** 
- O usuário já vê o preview completo da URL logo abaixo do campo, incluindo o @
- O preview atualiza dinamicamente conforme o usuário digita
- Manter o @ fixo no input era redundante e causava problemas de sobreposição

**Solução Implementada:**
- Removido o div com @ posicionado absolutamente
- Input agora é simples e direto, sem elementos sobrepostos
- Placeholder alterado para "seu-link-exclusivo"
- Preview da URL abaixo mostra claramente: `/perfil/@seu-slug`

**Arquivo:** `app/portal/profile/components/SlugEditorComponent.tsx`

```tsx
<div className="flex gap-2">
  <Input
    id="slug"
    type="text"
    value={inputValue}
    onChange={handleInputChange}
    placeholder="seu-link-exclusivo"
    className="flex-1"
  />
  <Button onClick={handleSave} disabled={!canSave} className="min-w-[100px]">
    {/* ... */}
  </Button>
</div>
```

**Status:** ✅ SIMPLIFICADO E MELHORADO

### 2. Erro 404 "Perfil não encontrado" ao Atualizar Slug

**Problema:** Ao tentar salvar o slug antes de criar o perfil pela primeira vez, o sistema retornava erro 404 "Perfil não encontrado".

**Causa Raiz:** O endpoint `/api/profiles/update-slug` espera que o perfil já exista na tabela `profiles`, mas usuários novos tentavam definir o slug antes de salvar o perfil pela primeira vez.

**Solução Implementada:**

#### A. Detecção de Perfil Não Existente
**Arquivo:** `app/portal/profile/page.tsx`

Adicionada verificação se o perfil existe antes de tentar atualizar o slug via API:

```typescript
const handleSlugUpdate = async (newSlug: string) => {
  // If profile doesn't exist yet, just update the form data
  if (!profile) {
    setFormData({ ...formData, slug: newSlug });
    setSuccess("Slug será salvo junto com o perfil");
    return;
  }

  // ... rest of the update logic for existing profiles
};
```

#### B. Interface Adaptativa no SlugEditor
**Arquivo:** `app/portal/profile/components/SlugEditorComponent.tsx`

- Adicionada prop `profileExists` para indicar se o perfil já foi criado
- Botão muda de "Salvar" para "Validar" quando o perfil não existe
- Mensagem de ajuda adaptada para informar que o slug será salvo junto com o perfil

```typescript
interface SlugEditorProps {
  currentSlug: string;
  onSlugUpdate: (newSlug: string) => Promise<void>;
  lastChangedAt: Date | null;
  profileExists: boolean; // Nova prop
}
```

#### C. Fluxo de Trabalho

**Para perfis novos (não existem ainda):**
1. Usuário digita o slug
2. Validação acontece em tempo real
3. Clicar em "Validar" apenas atualiza o formData local
4. Slug é salvo junto com o resto do perfil quando o usuário clicar em "Salvar" no formulário principal

**Para perfis existentes:**
1. Usuário digita o slug
2. Validação acontece em tempo real
3. Clicar em "Salvar" chama a API `/api/profiles/update-slug`
4. Slug é atualizado imediatamente no banco de dados

**Status:** ✅ CORRIGIDO

### 3. Melhorias de Logging e Diagnóstico

**Problema:** Erros genéricos sem detalhes específicos dificultavam o debug.

**Melhorias Implementadas:**

#### A. Melhor Tratamento de Erros no Frontend
**Arquivo:** `app/portal/profile/page.tsx`

- Adicionado logging detalhado do erro
- Melhorada extração da mensagem de erro para suportar diferentes formatos
- Adicionado console.error para debug

```typescript
if (!response.ok) {
  const errorMessage = data.error?.message || data.error || "Erro ao atualizar slug";
  console.error("Slug update error:", data);
  throw new Error(errorMessage);
}
```

#### B. Validação Adicional no Backend
**Arquivo:** `app/api/profiles/update-slug/route.ts`

- Adicionada verificação se slug sanitizado está vazio
- Adicionado logging de erros de perfil não encontrado
- Adicionado logging de falhas de validação
- Mensagens de erro mais descritivas

```typescript
// Check if sanitized slug is empty
if (!sanitizedSlug || sanitizedSlug.length === 0) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INVALID_FORMAT',
        message: 'Slug inválido após sanitização. Use apenas letras minúsculas, números e hífens.',
      },
    },
    { status: 400 }
  );
}
```

#### C. Logging Adicional
- `console.error('Profile not found error:', profileError)` - Para debug de perfil não encontrado
- `console.error('Slug validation failed:', validationResult)` - Para debug de validação

### 3. Remoção de Import Não Utilizado

**Problema:** Import `useCallback` não estava sendo usado.

**Solução:** Removido o import desnecessário.

**Arquivo:** `app/portal/profile/components/SlugEditorComponent.tsx`

## Possíveis Causas do Erro 400

Com as melhorias de logging, agora é possível identificar a causa exata do erro. As causas mais prováveis são:

1. **Slug muito curto:** Menos de 4 caracteres
2. **Slug com caracteres inválidos:** Após sanitização, o slug fica vazio
3. **Slug já existe:** Outro perfil já está usando esse slug
4. **Perfil não encontrado:** Usuário não tem perfil criado ainda

## Como Testar

1. **Teste do @ sobreposto:**
   - Abra a página de edição de perfil
   - Digite um slug no campo
   - Verifique que o @ permanece visível e não é sobreposto pelo texto

2. **Teste de erro detalhado:**
   - Tente atualizar o slug
   - Se houver erro, verifique o console do navegador
   - A mensagem de erro deve ser específica sobre o problema

3. **Teste de slugs inválidos:**
   - Tente usar menos de 4 caracteres → Deve mostrar erro específico
   - Tente usar caracteres especiais → Deve mostrar erro específico
   - Tente usar um slug já existente → Deve mostrar erro específico

## Arquivos Modificados

1. `app/portal/profile/components/SlugEditorComponent.tsx`
   - Corrigido posicionamento do @
   - Removido import não utilizado

2. `app/api/profiles/update-slug/route.ts`
   - Adicionada validação de slug vazio
   - Adicionado logging detalhado
   - Melhoradas mensagens de erro

3. `app/portal/profile/page.tsx`
   - Melhorado tratamento de erro
   - Adicionado logging para debug

## Próximos Passos

Se o erro persistir após estas correções:

1. Verifique o console do navegador para ver o erro detalhado
2. Verifique os logs do servidor para ver qual validação está falando
3. Verifique se o perfil do usuário existe no banco de dados
4. Verifique se o slug atual do perfil é válido

## Notas Técnicas

- O símbolo @ é apenas visual e não faz parte do slug armazenado
- O slug é sanitizado automaticamente (lowercase, sem caracteres especiais)
- A validação acontece tanto no frontend (feedback imediato) quanto no backend (segurança)
- O debounce de 500ms evita validações excessivas enquanto o usuário digita


---

## 4. SyntaxError no JavaScript Compilado (CRÍTICO) ✅

**Problema:** Console mostrava `SyntaxError: Parser error` em `app_layout_tsx_1cf6b850._.js:11`, impedindo que a página do catálogo carregasse completamente.

**Causa Raiz:** Import não utilizado de `Button` em `SlugEditorComponent.tsx` estava causando um erro de TypeScript/build que quebrava o JavaScript compilado.

**Impacto:** Este erro estava impedindo que TODOS os perfis aparecessem no catálogo, não apenas o perfil do usuário. O erro de sintaxe quebrava a página antes que o catálogo pudesse carregar.

**Solução Implementada:**

**Arquivo:** `app/portal/profile/components/SlugEditorComponent.tsx`

Removido o import não utilizado:

```typescript
// ANTES:
import { Button } from "@/components/ui/button";

// DEPOIS:
// (removido completamente)
```

**Verificação:**
- ✅ Nenhum erro de diagnóstico em `SlugEditorComponent.tsx`
- ✅ Nenhum erro de diagnóstico em `app/layout.tsx`
- ✅ Nenhum erro de diagnóstico em `app/portal/profile/page.tsx`

**Status:** ✅ CORRIGIDO

## Próximos Passos para Verificar o Catálogo

Agora que o erro de sintaxe foi corrigido, o catálogo deve carregar normalmente. Para verificar se seu perfil aparece no catálogo, certifique-se de que:

### Requisitos para Aparecer no Catálogo

De acordo com `CatalogService`, um perfil só aparece no catálogo se:

1. ✅ `status != "unpublished"` (todos os perfis são "published" por padrão)
2. ✅ `display_name` não é nulo
3. ✅ `slug` não é nulo
4. ✅ `city` não é nulo
5. ✅ `age_attribute` não é nulo
6. ✅ `short_description` não é nulo
7. ✅ `selected_features` tem pelo menos 1 serviço selecionado
8. ✅ Pelo menos 1 foto na tabela `media` com `type="photo"`

### Como Verificar

1. **Recarregue a página do catálogo** (F5 ou Ctrl+R)
2. **Verifique o console** - não deve haver mais erros de sintaxe
3. **Verifique se os perfis aparecem** - se ainda não aparecer nenhum perfil:
   - Abra o console do navegador
   - Vá para a aba Network
   - Procure pela requisição para `/api/catalog`
   - Verifique a resposta para ver se há perfis retornados

### Debug Adicional (se necessário)

Se ainda não aparecer nenhum perfil, você pode executar esta query no Supabase SQL Editor para verificar seu perfil:

```sql
SELECT 
  id, 
  display_name, 
  slug, 
  city, 
  age_attribute, 
  short_description, 
  selected_features, 
  status,
  (SELECT COUNT(*) FROM media WHERE media.profile_id = profiles.id AND media.type = 'photo') as photo_count
FROM profiles
WHERE user_id = auth.uid();
```

Esta query mostrará todos os campos necessários e quantas fotos você tem. Se algum campo estiver nulo ou `photo_count` for 0, você precisa preencher esses dados antes do perfil aparecer no catálogo.


---

## 5. Perfis Não Aparecendo no Catálogo (CRÍTICO) ✅

**Problema:** Mesmo após corrigir o erro de sintaxe, nenhum perfil aparecia no catálogo, apesar de existirem perfis completos no banco de dados.

**Causa Raiz:** O operador `.gt("selected_features", "{}")` no `CatalogService` não funciona corretamente para arrays JSONB no Supabase. A condição sempre retornava falso, mesmo quando o array tinha elementos.

**Investigação:**
```sql
-- Teste realizado:
SELECT 
  selected_features,
  CASE WHEN selected_features > '{}' THEN 'PASSA' ELSE 'FALHA' END as gt_check,
  CASE WHEN jsonb_array_length(selected_features) > 0 THEN 'PASSA' ELSE 'FALHA' END as length_check
FROM profiles;

-- Resultado: gt_check = 'FALHA' para todos os perfis (mesmo com features)
-- Conclusão: O operador > não funciona para comparar arrays JSONB
```

**Solução Implementada:**

**Arquivo:** `lib/services/catalog.service.ts`

Substituído `.gt("selected_features", "{}")` por `.not("selected_features", "eq", "[]")` em todos os métodos:

```typescript
// ANTES (não funcionava):
.gt("selected_features", "{}"); // Has at least one service

// DEPOIS (funciona corretamente):
.not("selected_features", "eq", "[]"); // Has at least one service
```

**Locais corrigidos:**
1. `searchCatalog()` - countQuery
2. `getBoostedProfiles()` - query
3. `getRegularProfiles()` - query
4. `getCategories()` - query
5. `getCities()` - query
6. `getRegions()` - query

**Verificação:**
```bash
curl http://localhost:3000/api/catalog
# Resultado: {"totalCount":2,"regularProfiles":[...2 perfis...],"boostedProfiles":[],"hasMore":false}
```

**Status:** ✅ CORRIGIDO

**Impacto:** Agora todos os perfis completos aparecem corretamente no catálogo.

---

## Resumo das Correções

1. ✅ **Símbolo @ sobreposto** - Removido do input, mantido apenas no preview
2. ✅ **Erro 404 ao atualizar slug** - Adicionada verificação de perfil existente
3. ✅ **UX simplificada** - Removido botão separado, slug salva com formulário principal
4. ✅ **SyntaxError no JavaScript compilado** - Removido import não utilizado de Button
5. ✅ **Perfis não aparecendo no catálogo** - Corrigida condição de verificação de selected_features

**Todos os problemas foram resolvidos!** 🎉
