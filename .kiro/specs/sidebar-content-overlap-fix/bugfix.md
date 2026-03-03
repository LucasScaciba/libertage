# Bugfix Requirements Document

## Introduction

O conteúdo principal da dashboard do portal não está respeitando o espaço ocupado pelo sidebar à esquerda, resultando em sobreposição visual. O conteúdo fica parcialmente ou totalmente escondido atrás do sidebar, prejudicando a usabilidade da aplicação. Este bug afeta a experiência do usuário ao navegar pela dashboard, tornando parte do conteúdo inacessível visualmente.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN o layout do portal é renderizado em desktop (largura >= 768px) com o sidebar expandido THEN o conteúdo principal (SidebarInset) não aplica margem esquerda adequada e fica sobreposto pelo sidebar

1.2 WHEN o layout do portal é renderizado em desktop (largura >= 768px) com o sidebar colapsado THEN o conteúdo principal (SidebarInset) não ajusta a margem esquerda para a largura do sidebar colapsado

1.3 WHEN o usuário alterna entre estados expandido/colapsado do sidebar THEN o conteúdo principal não se ajusta dinamicamente ao novo espaço disponível

### Expected Behavior (Correct)

2.1 WHEN o layout do portal é renderizado em desktop (largura >= 768px) com o sidebar expandido THEN o sistema SHALL aplicar margem esquerda de 16rem (var(--sidebar-width)) ao SidebarInset, garantindo que o conteúdo não fique sobreposto

2.2 WHEN o layout do portal é renderizado em desktop (largura >= 768px) com o sidebar colapsado THEN o sistema SHALL aplicar margem esquerda de 3rem (var(--sidebar-width-icon)) ao SidebarInset, ajustando o espaço disponível

2.3 WHEN o usuário alterna entre estados expandido/colapsado do sidebar THEN o sistema SHALL animar suavemente a transição da margem esquerda do conteúdo principal

### Unchanged Behavior (Regression Prevention)

3.1 WHEN o layout do portal é renderizado em mobile (largura < 768px) THEN o sistema SHALL CONTINUE TO exibir o conteúdo principal sem margem esquerda, ocupando toda a largura da tela

3.2 WHEN o sidebar está em modo mobile e é aberto THEN o sistema SHALL CONTINUE TO sobrepor o conteúdo (comportamento esperado em mobile) sem afetar o layout do conteúdo

3.3 WHEN o SiteHeader é renderizado dentro do SidebarInset THEN o sistema SHALL CONTINUE TO posicionar o header corretamente acima do conteúdo principal

3.4 WHEN o conteúdo da página (children) é renderizado dentro do elemento main THEN o sistema SHALL CONTINUE TO aplicar as classes flex, flex-col e flex-1 corretamente
