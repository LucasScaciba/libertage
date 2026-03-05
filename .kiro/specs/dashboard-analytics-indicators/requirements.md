# Requirements Document

## Introduction

Este documento especifica os requisitos para o Dashboard Analytics da plataforma Libertage - um sistema integrado de 7 indicadores que permite aos donos de perfis profissionais entenderem como seus perfis estão sendo descobertos, como visitantes interagem com o conteúdo e quais ações de contato estão acontecendo.

O dashboard fornece insights acionáveis sobre visibilidade, engajamento e conversão, utilizando eventos de tracking já existentes e novos eventos específicos para cada tipo de interação.

## Glossary

- **Dashboard_Analytics**: Sistema integrado de visualização de métricas e indicadores de performance do perfil
- **Profile_Owner**: Usuário autenticado que possui um perfil na plataforma e acessa o dashboard
- **Visitor**: Usuário anônimo ou autenticado que visualiza um perfil público
- **Analytics_Event**: Registro de uma ação ou interação rastreada no sistema
- **Media_Item**: Foto ou vídeo armazenado no perfil (não inclui stories)
- **Story**: Vídeo temporário exibido no carrossel de stories
- **Social_Link**: Link para rede social externa configurado no perfil
- **Lightbox**: Modal de visualização ampliada de mídia
- **Contact_Channel**: Método de contato (WhatsApp ou Telegram)
- **Geolocation_Service**: Serviço que mapeia endereço IP para estado brasileiro
- **Visibility_Ranking**: Posição relativa do perfil em comparação com todos os perfis da plataforma
- **Thumbnail**: Versão reduzida de imagem otimizada para performance
- **Active_Media**: Mídia que não foi excluída pelo usuário
- **Shadcn_UI**: Biblioteca de componentes UI utilizada na aplicação
- **Supabase**: Plataforma de banco de dados PostgreSQL e storage utilizada

## Requirements

### Requirement 1: Visualizações de Mídia

**User Story:** Como dono de perfil, quero ver quais mídias (fotos/vídeos) são mais visualizadas no lightbox, para entender qual conteúdo gera mais interesse dos visitantes.

#### Acceptance Criteria

1. WHEN um Visitor abre uma Media_Item no Lightbox, THE Analytics_Event SHALL registrar o evento "media_view" com media_id e timestamp
2. THE Dashboard_Analytics SHALL exibir tabela com thumbnail reduzida, nome do arquivo truncado, tipo de mídia e total de visualizações
3. THE Dashboard_Analytics SHALL ordenar mídias da mais visualizada para a menos visualizada
4. WHEN uma Media_Item é excluída pelo Profile_Owner, THE Dashboard_Analytics SHALL remover os dados de analytics dessa mídia
5. THE Dashboard_Analytics SHALL exibir apenas Active_Media na tabela de visualizações
6. THE Thumbnail SHALL ter dimensões máximas de 80x80 pixels para otimizar performance
7. WHEN o nome do arquivo excede 30 caracteres, THE Dashboard_Analytics SHALL truncar o texto com reticências

### Requirement 2: Cliques nas Redes Sociais

**User Story:** Como dono de perfil, quero saber quais redes sociais recebem mais cliques, para entender quais canais externos geram mais interesse.

#### Acceptance Criteria

1. WHEN um Visitor clica em um Social_Link, THE Analytics_Event SHALL registrar o evento "social_link_click" com social_network e timestamp
2. THE Dashboard_Analytics SHALL exibir tabela com ícone da rede social, nome da rede e quantidade de cliques
3. THE Dashboard_Analytics SHALL ordenar redes sociais da mais clicada para a menos clicada
4. THE Dashboard_Analytics SHALL reutilizar os ícones existentes do componente ExternalLinksDisplay
5. WHEN um Social_Link é removido do perfil, THE Dashboard_Analytics SHALL manter os dados históricos de cliques

### Requirement 3: Visualizações de Stories

**User Story:** Como dono de perfil, quero ver quais stories são mais visualizados, para entender qual tipo de conteúdo temporário gera mais engajamento.

#### Acceptance Criteria

1. WHEN um Visitor abre um Story no modal de visualização, THE Analytics_Event SHALL registrar o evento "story_view" com story_id e timestamp
2. THE Dashboard_Analytics SHALL exibir tabela com thumbnail reduzida, nome do arquivo truncado e quantidade de visualizações
3. THE Dashboard_Analytics SHALL ordenar stories do mais visualizado para o menos visualizado
4. THE Thumbnail SHALL ter dimensões máximas de 80x80 pixels para otimizar performance
5. WHEN o nome do arquivo excede 30 caracteres, THE Dashboard_Analytics SHALL truncar o texto com reticências
6. WHEN um Story expira ou é excluído, THE Dashboard_Analytics SHALL manter os dados históricos de visualizações

### Requirement 4: Dias com Mais Visitas

**User Story:** Como dono de perfil, quero ver em quais dias da semana meu perfil recebe mais visitas, para entender padrões temporais de acesso.

#### Acceptance Criteria

1. THE Dashboard_Analytics SHALL agregar eventos "profile_view" por dia da semana
2. THE Dashboard_Analytics SHALL exibir gráfico de barras utilizando Shadcn_UI Charts
3. THE Dashboard_Analytics SHALL exibir os dias na ordem: Segunda, Terça, Quarta, Quinta, Sexta, Sábado, Domingo
4. THE Dashboard_Analytics SHALL considerar apenas visitas dos últimos 90 dias para o cálculo
5. THE Dashboard_Analytics SHALL exibir o total de visitas em cada barra do gráfico
6. THE Dashboard_Analytics SHALL utilizar cores consistentes com o design system da aplicação

### Requirement 5: Visitas por Estado do Brasil

**User Story:** Como dono de perfil, quero ver de quais estados brasileiros vêm meus visitantes, para entender minha distribuição geográfica.

#### Acceptance Criteria

1. WHEN um Visitor acessa um perfil, THE Geolocation_Service SHALL mapear o endereço IP para um estado brasileiro
2. THE Analytics_Event SHALL armazenar o estado brasileiro junto com o evento "profile_view"
3. THE Dashboard_Analytics SHALL exibir mapa do Brasil com estados coloridos por escala de cinza
4. WHEN um Visitor passa o mouse sobre um estado, THE Dashboard_Analytics SHALL exibir tooltip com nome do estado e quantidade de visitas
5. THE Dashboard_Analytics SHALL aplicar cor mais escura para estados com mais visitas
6. THE Dashboard_Analytics SHALL aplicar cor mais clara para estados com menos visitas
7. THE Dashboard_Analytics SHALL considerar apenas visitas dos últimos 90 dias para o cálculo
8. WHEN o IP não puder ser mapeado para um estado, THE Geolocation_Service SHALL registrar como "Não identificado"

### Requirement 6: Ranking de Visibilidade

**User Story:** Como dono de perfil, quero saber minha posição relativa de visibilidade na plataforma, para entender como meu perfil se compara com outros sem ver dados de terceiros.

#### Acceptance Criteria

1. THE Dashboard_Analytics SHALL calcular a posição percentual do perfil baseada em visitas dos últimos 30 dias
2. THE Dashboard_Analytics SHALL classificar o perfil em uma das faixas: Top 10%, Top 20%, Top 30%, ou Abaixo de 30%
3. THE Dashboard_Analytics SHALL exibir mensagem motivacional específica para cada faixa
4. THE Dashboard_Analytics SHALL NEVER exibir dados de outros perfis ou ranking público
5. THE Dashboard_Analytics SHALL NEVER exibir a posição numérica exata do perfil
6. THE Dashboard_Analytics SHALL atualizar o ranking diariamente
7. WHEN o perfil está no Top 10%, THE Dashboard_Analytics SHALL exibir mensagem de excelência
8. WHEN o perfil está abaixo de 30%, THE Dashboard_Analytics SHALL exibir mensagem de incentivo com dicas de melhoria

### Requirement 7: Contatos por Canal

**User Story:** Como dono de perfil, quero ver quantos contatos recebo por cada canal (WhatsApp, Telegram), para entender qual método de contato é mais utilizado.

#### Acceptance Criteria

1. THE Dashboard_Analytics SHALL utilizar eventos "contact_click" existentes para contabilizar contatos
2. THE Dashboard_Analytics SHALL separar contatos por Contact_Channel (WhatsApp, Telegram)
3. THE Dashboard_Analytics SHALL exibir tabela simples com colunas: Canal e Contatos
4. THE Dashboard_Analytics SHALL exibir apenas canais que estão habilitados no perfil do Profile_Owner
5. WHEN um Contact_Channel é desabilitado no perfil, THE Dashboard_Analytics SHALL manter os dados históricos de cliques
6. THE Dashboard_Analytics SHALL considerar todos os contatos históricos sem limite de tempo

### Requirement 8: Interface do Dashboard

**User Story:** Como dono de perfil, quero acessar um dashboard visualmente consistente e responsivo, para visualizar todos os indicadores de forma clara e organizada.

#### Acceptance Criteria

1. THE Dashboard_Analytics SHALL utilizar componentes do Shadcn_UI para todos os elementos visuais
2. THE Dashboard_Analytics SHALL ser acessível através da rota /portal/dashboard
3. THE Dashboard_Analytics SHALL exibir os 7 indicadores em layout grid responsivo
4. THE Dashboard_Analytics SHALL utilizar Cards do Shadcn_UI para agrupar cada indicador
5. THE Dashboard_Analytics SHALL ser responsivo para dispositivos mobile, tablet e desktop
6. THE Dashboard_Analytics SHALL manter consistência visual com o restante da aplicação
7. THE Dashboard_Analytics SHALL adicionar item "Dashboard" na sidebar de navegação
8. WHEN o Profile_Owner não possui dados suficientes, THE Dashboard_Analytics SHALL exibir mensagem de estado vazio apropriada

### Requirement 9: Tracking de Eventos

**User Story:** Como sistema, quero rastrear eventos de interação dos visitantes de forma não intrusiva, para coletar dados de analytics sem impactar a experiência do usuário.

#### Acceptance Criteria

1. WHEN um Analytics_Event falha ao ser registrado, THE System SHALL continuar a operação normal sem exibir erro ao Visitor
2. THE System SHALL registrar Analytics_Event de forma assíncrona para não bloquear a interface
3. THE System SHALL incluir visitor_fingerprint em todos os Analytics_Event para identificar visitantes únicos
4. THE System SHALL incluir timestamp em todos os Analytics_Event
5. THE System SHALL validar dados obrigatórios antes de registrar Analytics_Event
6. WHEN dados obrigatórios estão ausentes, THE System SHALL registrar erro no log mas não falhar a operação
7. THE System SHALL implementar tracking nos seguintes componentes: Lightbox de mídia, ExternalLinksDisplay, StoriesCarousel, botões de contato

### Requirement 10: Performance e Otimização

**User Story:** Como sistema, quero garantir que o dashboard carregue rapidamente e não impacte a performance da aplicação, para proporcionar boa experiência ao usuário.

#### Acceptance Criteria

1. THE Dashboard_Analytics SHALL utilizar queries otimizadas com agregações no banco de dados
2. THE Dashboard_Analytics SHALL criar índices apropriados nas tabelas de analytics para melhorar performance de queries
3. THE Dashboard_Analytics SHALL utilizar Thumbnail reduzidas ao invés de imagens originais
4. THE Dashboard_Analytics SHALL truncar textos longos para evitar quebra de layout
5. THE Dashboard_Analytics SHALL implementar loading states durante carregamento de dados
6. THE Dashboard_Analytics SHALL carregar indicadores de forma independente para evitar bloqueio
7. WHEN uma query de analytics excede 3 segundos, THE System SHALL registrar warning no log
8. THE Dashboard_Analytics SHALL considerar cache de dados quando apropriado para reduzir carga no banco

### Requirement 11: Geolocalização por IP

**User Story:** Como sistema, quero mapear endereços IP para estados brasileiros de forma confiável, para fornecer dados geográficos precisos no dashboard.

#### Acceptance Criteria

1. THE Geolocation_Service SHALL utilizar serviço de geolocalização confiável para mapear IP para estado
2. THE Geolocation_Service SHALL mapear apenas para estados brasileiros (27 estados + DF)
3. WHEN o IP é de fora do Brasil, THE Geolocation_Service SHALL registrar como "Internacional"
4. WHEN o serviço de geolocalização está indisponível, THE System SHALL registrar visita sem estado
5. THE Geolocation_Service SHALL cachear resultados de geolocalização para IPs já consultados
6. THE Geolocation_Service SHALL respeitar limites de rate da API de geolocalização
7. THE System SHALL armazenar o estado junto com o evento "profile_view" na tabela analytics_events

### Requirement 12: Modelo de Dados

**User Story:** Como sistema, quero estruturar dados de analytics de forma eficiente e escalável, para suportar crescimento da plataforma e queries rápidas.

#### Acceptance Criteria

1. THE System SHALL criar tabela analytics_events com colunas: id, profile_id, event_type, visitor_fingerprint, timestamp, metadata (JSONB)
2. THE System SHALL armazenar dados específicos de cada evento no campo metadata (media_id, story_id, social_network, contact_channel, state)
3. THE System SHALL criar índices em: profile_id, event_type, timestamp
4. THE System SHALL criar índice composto em (profile_id, event_type, timestamp) para otimizar queries do dashboard
5. THE System SHALL implementar política de retenção de dados de analytics (manter últimos 12 meses)
6. THE System SHALL utilizar tipo JSONB para metadata para permitir queries eficientes em campos específicos
7. THE System SHALL validar integridade referencial entre analytics_events e profiles

### Requirement 13: Parser e Serialização de Eventos

**User Story:** Como sistema, quero serializar e deserializar eventos de analytics de forma consistente, para garantir integridade dos dados.

#### Acceptance Criteria

1. THE Event_Parser SHALL parsear eventos de analytics do formato JSON para objetos tipados
2. WHEN um evento inválido é recebido, THE Event_Parser SHALL retornar erro descritivo
3. THE Event_Serializer SHALL formatar objetos de eventos de volta para JSON válido
4. FOR ALL eventos válidos, parsear então serializar então parsear SHALL produzir objeto equivalente (round-trip property)
5. THE Event_Parser SHALL validar tipos de dados obrigatórios (profile_id, event_type, timestamp)
6. THE Event_Parser SHALL validar formato de metadata específico para cada event_type
7. THE Event_Serializer SHALL garantir que timestamps sejam serializados em formato ISO 8601

