# Sidebar Content Overlap Fix - Design

## Overview

O bug de sobreposição ocorre porque o componente `SidebarInset` não está aplicando margem esquerda adequada em desktop para compensar o espaço ocupado pelo sidebar fixo. Atualmente, o CSS em `app/globals.css` define regras para aplicar `margin-left` baseado no estado do sidebar (expandido/colapsado), mas essas regras não estão sendo aplicadas corretamente devido a especificidade CSS insuficiente ou conflito com as classes do componente `SidebarInset`.

A estratégia de correção envolve garantir que as regras CSS de margem esquerda tenham precedência adequada e sejam aplicadas corretamente ao elemento `SidebarInset`, mantendo o comportamento mobile inalterado.

## Glossary

- **Bug_Condition (C)**: A condição que desencadeia o bug - quando o layout é renderizado em desktop (largura >= 768px) e o sidebar está visível
- **Property (P)**: O comportamento desejado - o `SidebarInset` deve ter margem esquerda correspondente à largura do sidebar (16rem expandido, 3rem colapsado)
- **Preservation**: Comportamento mobile (largura < 768px) onde o conteúdo ocupa toda a largura sem margem esquerda
- **SidebarInset**: Componente em `components/ui/sidebar.tsx` que envolve o conteúdo principal da aplicação
- **peer**: Classe Tailwind que permite estilizar um elemento baseado no estado de um elemento irmão (sibling)
- **data-state**: Atributo do sidebar que indica se está "expanded" ou "collapsed"
- **data-variant**: Atributo do sidebar que indica a variante visual ("inset" no caso atual)

## Bug Details

### Fault Condition

O bug manifesta quando o layout do portal é renderizado em desktop (largura >= 768px) e o sidebar está presente. O componente `SidebarInset` não está recebendo a margem esquerda adequada, resultando em sobreposição do conteúdo pelo sidebar fixo.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type LayoutRenderContext
  OUTPUT: boolean
  
  RETURN input.viewportWidth >= 768
         AND input.sidebarExists
         AND (input.sidebarState IN ['expanded', 'collapsed'])
         AND NOT contentHasCorrectLeftMargin(input)
END FUNCTION
```

### Examples

- **Exemplo 1**: Desktop com sidebar expandido - Conteúdo deveria ter `margin-left: 16rem` mas tem `margin-left: 0`, resultando em sobreposição
- **Exemplo 2**: Desktop com sidebar colapsado - Conteúdo deveria ter `margin-left: 3rem` mas tem `margin-left: 0`, resultando em sobreposição parcial
- **Exemplo 3**: Usuário alterna de expandido para colapsado - Conteúdo deveria animar de `16rem` para `3rem` mas permanece sem margem
- **Edge case**: Mobile (< 768px) - Conteúdo deve ter `margin-left: 0` (comportamento correto, não deve mudar)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Em mobile (largura < 768px), o conteúdo deve continuar ocupando toda a largura da tela sem margem esquerda
- O sidebar em mobile deve continuar sobrepondo o conteúdo quando aberto (comportamento esperado)
- O `SiteHeader` dentro do `SidebarInset` deve continuar posicionado corretamente
- As classes `flex`, `flex-col`, e `flex-1` do elemento `main` devem continuar funcionando
- A variante "inset" do sidebar deve continuar aplicando bordas arredondadas e sombra
- O comportamento de transição suave do sidebar deve ser preservado

**Scope:**
Todos os inputs que NÃO envolvem renderização em desktop (largura >= 768px) devem ser completamente não afetados por esta correção. Isso inclui:
- Renderização mobile (< 768px)
- Interações com o sidebar em mobile (abrir/fechar overlay)
- Outros componentes dentro do `SidebarInset` (header, main, children)

## Hypothesized Root Cause

Baseado na análise do código, as causas mais prováveis são:

1. **Especificidade CSS Insuficiente**: As regras CSS em `app/globals.css` que aplicam `margin-left` ao `SidebarInset` podem estar sendo sobrescritas pelas classes Tailwind do componente
   - O seletor `[data-sidebar="sidebar-inset"]` pode ter especificidade menor que as classes do componente
   - As classes Tailwind `flex w-full` podem estar resetando a margem

2. **Atributo data-sidebar Ausente**: O componente `SidebarInset` pode não estar recebendo o atributo `data-sidebar="sidebar-inset"` necessário para as regras CSS funcionarem
   - Verificando o código, o componente renderiza um `<main>` mas não adiciona explicitamente o atributo

3. **Conflito com Classes da Variante Inset**: As classes `md:peer-data-[variant=inset]:ml-0` no componente estão explicitamente definindo `margin-left: 0` em desktop, sobrescrevendo as regras globais

4. **Ordem de Aplicação CSS**: As regras em `@layer base` podem estar sendo aplicadas antes das classes Tailwind, resultando em precedência incorreta

## Correctness Properties

Property 1: Fault Condition - Sidebar Content Spacing

_For any_ layout render onde a largura da viewport é >= 768px e o sidebar está presente, o componente SidebarInset SHALL aplicar margem esquerda de 16rem quando o sidebar está expandido (data-state="expanded") e 3rem quando está colapsado (data-state="collapsed"), garantindo que o conteúdo não fique sobreposto pelo sidebar fixo.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Mobile Layout Behavior

_For any_ layout render onde a largura da viewport é < 768px, o componente SidebarInset SHALL produzir exatamente o mesmo resultado que o código original, preservando margem esquerda zero e comportamento de overlay do sidebar em mobile.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assumindo que nossa análise de causa raiz está correta:

**File**: `components/ui/sidebar.tsx`

**Component**: `SidebarInset`

**Specific Changes**:
1. **Adicionar Atributo data-sidebar**: Adicionar `data-sidebar="sidebar-inset"` ao elemento `<main>` renderizado pelo componente
   - Isso permite que as regras CSS em `app/globals.css` identifiquem o elemento corretamente

2. **Remover Classe Conflitante**: Remover ou ajustar a classe `md:peer-data-[variant=inset]:ml-0` que está forçando `margin-left: 0` em desktop
   - Esta classe está sobrescrevendo as regras de margem necessárias

3. **Verificar Regras CSS Globais**: Confirmar que as regras em `app/globals.css` estão corretas e com especificidade adequada
   - As regras atuais parecem corretas, mas podem precisar de ajuste de especificidade

4. **Adicionar Transição Suave**: Garantir que a propriedade `transition` está aplicada para animar mudanças de margem
   - Adicionar `transition-[margin]` ou similar para suavizar a transição entre estados

**File**: `app/globals.css` (se necessário)

**Section**: `@layer base` - Sidebar Inset styles

**Specific Changes**:
5. **Aumentar Especificidade**: Se as regras não estiverem sendo aplicadas, aumentar especificidade usando `!important` ou seletores mais específicos
   - Exemplo: `[data-sidebar="sidebar-inset"].peer-data-[state=expanded]`

6. **Adicionar Transição**: Adicionar propriedade `transition` às regras de margem para animação suave
   - `transition: margin-left 0.3s ease-in-out;`

## Testing Strategy

### Validation Approach

A estratégia de teste segue uma abordagem de duas fases: primeiro, demonstrar o bug no código não corrigido através de testes exploratórios, depois verificar que a correção funciona corretamente e preserva o comportamento existente.

### Exploratory Fault Condition Checking

**Goal**: Demonstrar o bug ANTES de implementar a correção. Confirmar ou refutar a análise de causa raiz. Se refutarmos, precisaremos re-hipotizar.

**Test Plan**: Criar testes que renderizam o layout do portal em diferentes estados e verificam se a margem esquerda está sendo aplicada corretamente. Executar estes testes no código NÃO CORRIGIDO para observar falhas e entender a causa raiz.

**Test Cases**:
1. **Desktop Sidebar Expandido**: Renderizar layout em desktop (1024px) com sidebar expandido, verificar se `SidebarInset` tem `margin-left: 16rem` (falhará no código não corrigido)
2. **Desktop Sidebar Colapsado**: Renderizar layout em desktop (1024px) com sidebar colapsado, verificar se `SidebarInset` tem `margin-left: 3rem` (falhará no código não corrigido)
3. **Transição de Estado**: Alternar sidebar de expandido para colapsado, verificar se margem anima suavemente (falhará no código não corrigido)
4. **Mobile Layout**: Renderizar layout em mobile (375px), verificar se `SidebarInset` tem `margin-left: 0` (deve passar mesmo no código não corrigido)

**Expected Counterexamples**:
- `SidebarInset` não tem margem esquerda em desktop, resultando em sobreposição
- Possíveis causas: atributo `data-sidebar` ausente, classe `ml-0` sobrescrevendo regras, especificidade CSS insuficiente

### Fix Checking

**Goal**: Verificar que para todos os inputs onde a condição de bug existe, a função corrigida produz o comportamento esperado.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderLayout_fixed(input)
  ASSERT hasCorrectLeftMargin(result, input.sidebarState)
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todos os inputs onde a condição de bug NÃO existe, a função corrigida produz o mesmo resultado que a função original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT renderLayout_original(input) = renderLayout_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing é recomendado para preservation checking porque:
- Gera muitos casos de teste automaticamente através do domínio de entrada
- Captura edge cases que testes unitários manuais podem perder
- Fornece garantias fortes de que o comportamento está inalterado para todos os inputs não-buggy

**Test Plan**: Observar comportamento no código NÃO CORRIGIDO primeiro para mobile e outras interações, depois escrever testes baseados em propriedades capturando esse comportamento.

**Test Cases**:
1. **Mobile Layout Preservation**: Observar que layout mobile funciona corretamente no código não corrigido, depois verificar que continua funcionando após correção
2. **Header Positioning Preservation**: Observar que `SiteHeader` está posicionado corretamente no código não corrigido, depois verificar que continua correto após correção
3. **Main Content Classes Preservation**: Observar que classes `flex flex-col flex-1` funcionam no código não corrigido, depois verificar que continuam funcionando após correção
4. **Sidebar Variant Styles Preservation**: Observar que bordas arredondadas e sombra da variante "inset" funcionam no código não corrigido, depois verificar que continuam funcionando após correção

### Unit Tests

- Testar renderização do `SidebarInset` com sidebar expandido em desktop
- Testar renderização do `SidebarInset` com sidebar colapsado em desktop
- Testar renderização do `SidebarInset` em mobile
- Testar edge cases (viewport exatamente 768px, sidebar sem estado definido)

### Property-Based Tests

- Gerar viewports aleatórios >= 768px e verificar que margem esquerda é aplicada corretamente
- Gerar viewports aleatórios < 768px e verificar que comportamento mobile é preservado
- Gerar estados aleatórios do sidebar e verificar que margem corresponde ao estado
- Testar transições entre estados com timings aleatórios

### Integration Tests

- Testar fluxo completo de navegação no portal com sidebar em diferentes estados
- Testar alternância entre expandido/colapsado e verificar que conteúdo se ajusta
- Testar que interações com conteúdo (cliques, scroll) funcionam corretamente sem sobreposição
- Testar que feedback visual (animações, transições) ocorre suavemente
