# Requirements Document

## Introduction

O Stories System é uma funcionalidade que permite profissionais cadastradas na plataforma publicarem vídeos promocionais com duração limitada de 24 horas. Os stories aparecem em destaque no topo do catálogo e no perfil público, oferecendo maior visibilidade baseada no plano de assinatura do usuário.

## Glossary

- **Story**: Um vídeo promocional publicado por um profissional que expira automaticamente após 24 horas
- **Stories_System**: O sistema responsável por gerenciar publicação, exibição e expiração de stories
- **Video_Upload_Service**: O serviço responsável por fazer upload de vídeos para o Supabase Storage
- **Expiration_Service**: O serviço responsável por remover stories expirados automaticamente
- **Story_Viewer**: O componente de interface que exibe stories em formato lightbox com navegação
- **Catalog**: A página principal que lista perfis de profissionais
- **Professional**: Um usuário cadastrado na plataforma que pode publicar stories
- **Active_Story**: Um story que foi publicado e ainda não expirou (menos de 24 horas desde publicação)
- **Subscription_Plan**: O plano de assinatura do usuário (Free, Premium ou Black)
- **Story_Indicator**: O elemento visual circular com foto do perfil que indica a presença de stories

## Requirements

### Requirement 1: Video Upload

**User Story:** Como profissional cadastrada, eu quero fazer upload de vídeos para stories, para que eu possa promover meu perfil.

#### Acceptance Criteria

1. WHEN a Professional uploads a video file, THE Video_Upload_Service SHALL validate the file format is mp4, mov, or avi
2. WHEN a Professional uploads a video file, THE Video_Upload_Service SHALL validate the file size does not exceed 18 MB
3. IF a video file exceeds 18 MB, THEN THE Video_Upload_Service SHALL return an error message "Vídeo excede o tamanho máximo de 18 MB"
4. IF a video file format is invalid, THEN THE Video_Upload_Service SHALL return an error message "Formato de vídeo inválido. Use mp4, mov ou avi"
5. WHEN a valid video file is uploaded, THE Video_Upload_Service SHALL store the video in Supabase Storage and return a video URL

### Requirement 2: Story Publication with Plan Limits

**User Story:** Como profissional cadastrada, eu quero publicar stories respeitando os limites do meu plano, para que eu possa usar o recurso de acordo com minha assinatura.

#### Acceptance Criteria

1. WHEN a Professional with Premium plan attempts to publish a story, THE Stories_System SHALL verify the Professional has fewer than 1 Active_Story
2. WHEN a Professional with Black plan attempts to publish a story, THE Stories_System SHALL verify the Professional has fewer than 5 Active_Stories
3. WHEN a Professional with Free plan attempts to publish a story, THE Stories_System SHALL return an error message "Upgrade para Premium ou Black para publicar stories"
4. IF a Professional exceeds their plan limit, THEN THE Stories_System SHALL return an error message "Limite de stories atingido para seu plano"
5. WHEN publication limits are satisfied, THE Stories_System SHALL create a Story record with video_url, user_id, created_at, expires_at set to 24 hours from creation, and status set to active
6. WHEN a Story is successfully published, THE Stories_System SHALL display the Story in the Catalog within 5 seconds

### Requirement 3: Story Expiration

**User Story:** Como administrador do sistema, eu quero que stories expirem automaticamente após 24 horas, para que o conteúdo permaneça temporário conforme a regra de negócio.

#### Acceptance Criteria

1. WHEN a Story is created, THE Stories_System SHALL set expires_at to exactly 24 hours after created_at
2. THE Expiration_Service SHALL check for expired stories every 5 minutes
3. WHEN the Expiration_Service detects a Story where current time exceeds expires_at, THE Expiration_Service SHALL update the Story status to expired
4. WHEN a Story status is updated to expired, THE Stories_System SHALL remove the Story from all display locations within 5 minutes
5. WHILE a Story status is expired, THE Stories_System SHALL exclude the Story from all queries for active stories

### Requirement 4: Story Display in Catalog

**User Story:** Como visitante da plataforma, eu quero ver stories no topo do catálogo, para que eu possa descobrir conteúdo promocional destacado.

#### Acceptance Criteria

1. WHEN the Catalog page loads, THE Stories_System SHALL display Story_Indicators for all Professionals with Active_Stories at the top of the page
2. THE Stories_System SHALL render each Story_Indicator as a circular element containing the Professional profile photo
3. THE Stories_System SHALL order Story_Indicators by created_at timestamp with most recent first
4. WHEN a Story_Indicator is clicked, THE Story_Viewer SHALL open in a lightbox overlay
5. WHILE the Story_Viewer is open, THE Story_Viewer SHALL display the video in fullscreen mode with playback controls

### Requirement 5: Story Display in Public Profile

**User Story:** Como visitante visualizando um perfil público, eu quero ver os stories ativos do profissional, para que eu possa acessar seu conteúdo promocional.

#### Acceptance Criteria

1. WHEN a public profile page loads, THE Stories_System SHALL display Story_Indicators for all Active_Stories belonging to that Professional
2. THE Stories_System SHALL position Story_Indicators prominently at the top of the profile page
3. WHEN a Story_Indicator is clicked on a profile page, THE Story_Viewer SHALL open with the same behavior as in the Catalog

### Requirement 6: Story Navigation

**User Story:** Como visitante visualizando stories, eu quero navegar entre múltiplos stories, para que eu possa ver todo o conteúdo disponível facilmente.

#### Acceptance Criteria

1. WHEN the Story_Viewer displays a story from a Professional with multiple Active_Stories, THE Story_Viewer SHALL show navigation controls
2. WHEN a user swipes left on the Story_Viewer, THE Story_Viewer SHALL advance to the next story from the same Professional
3. WHEN a user swipes right on the Story_Viewer, THE Story_Viewer SHALL return to the previous story from the same Professional
4. WHEN a user clicks the right side of the Story_Viewer, THE Story_Viewer SHALL advance to the next story
5. WHEN a user clicks the left side of the Story_Viewer, THE Story_Viewer SHALL return to the previous story
6. WHEN the Story_Viewer reaches the last story of a Professional, THE Story_Viewer SHALL automatically advance to the first story of the next Professional with Active_Stories
7. WHEN the Story_Viewer reaches the first story and user navigates backward, THE Story_Viewer SHALL move to the last story of the previous Professional with Active_Stories

### Requirement 7: Automatic Story Playback

**User Story:** Como visitante visualizando stories, eu quero que os vídeos reproduzam automaticamente em sequência, para que eu tenha uma experiência fluida sem interação manual.

#### Acceptance Criteria

1. WHEN the Story_Viewer opens, THE Story_Viewer SHALL automatically start playing the video
2. WHEN a video finishes playing, THE Story_Viewer SHALL automatically advance to the next story after 500 milliseconds
3. WHILE a video is playing, THE Story_Viewer SHALL display a progress bar showing playback progress
4. WHEN a user pauses a video, THE Story_Viewer SHALL stop automatic advancement
5. WHEN a user resumes a paused video, THE Story_Viewer SHALL restore automatic advancement behavior

### Requirement 8: Story Moderation

**User Story:** Como visitante da plataforma, eu quero denunciar stories inapropriados, para que o conteúdo da plataforma permaneça adequado.

#### Acceptance Criteria

1. WHILE the Story_Viewer is displaying a story, THE Story_Viewer SHALL display a "Denunciar" button
2. WHEN a user clicks the "Denunciar" button, THE Stories_System SHALL open a report form
3. WHEN a user submits a report, THE Stories_System SHALL create a report record with story_id, reporter information, reason, and timestamp
4. WHEN a report is successfully submitted, THE Stories_System SHALL display a confirmation message "Denúncia enviada com sucesso"
5. THE Stories_System SHALL allow multiple reports for the same Story from different users

### Requirement 9: Story Deletion by Owner

**User Story:** Como profissional que publicou um story, eu quero poder deletar meu story antes da expiração, para que eu possa remover conteúdo que não desejo mais exibir.

#### Acceptance Criteria

1. WHEN a Professional views their own Active_Story, THE Stories_System SHALL display a delete button
2. WHEN a Professional clicks the delete button, THE Stories_System SHALL request confirmation with message "Tem certeza que deseja deletar este story?"
3. WHEN a Professional confirms deletion, THE Stories_System SHALL update the Story status to deleted
4. WHEN a Story status is updated to deleted, THE Stories_System SHALL remove the Story from all display locations immediately
5. WHEN a Story is deleted, THE Stories_System SHALL remove the video file from Supabase Storage within 24 hours

### Requirement 10: Story Analytics Tracking

**User Story:** Como profissional que publicou stories, eu quero ver quantas visualizações meus stories receberam, para que eu possa medir o engajamento.

#### Acceptance Criteria

1. WHEN a Story_Viewer opens and displays a story, THE Stories_System SHALL record a view event with story_id, viewer information, and timestamp
2. THE Stories_System SHALL count only one view per unique viewer per Story within a 24-hour period
3. WHEN a Professional views their own story analytics, THE Stories_System SHALL display the total view count
4. WHEN a Professional views their own story analytics, THE Stories_System SHALL display the list of unique viewers
5. WHILE a Story is active, THE Stories_System SHALL update view counts in real-time with maximum 30 seconds delay

### Requirement 11: Video Processing and Optimization

**User Story:** Como profissional fazendo upload de vídeo, eu quero que o sistema processe meu vídeo eficientemente, para que ele carregue rapidamente para os visitantes.

#### Acceptance Criteria

1. WHEN a video is uploaded, THE Video_Upload_Service SHALL generate a thumbnail from the first frame of the video
2. WHEN a video is uploaded, THE Video_Upload_Service SHALL validate the video duration does not exceed 60 seconds
3. IF a video exceeds 60 seconds, THEN THE Video_Upload_Service SHALL return an error message "Vídeo não pode exceder 60 segundos"
4. WHEN a video is stored, THE Video_Upload_Service SHALL set appropriate cache headers for CDN optimization
5. WHEN a video upload is in progress, THE Stories_System SHALL display upload progress percentage to the Professional

### Requirement 12: Story Visibility Permissions

**User Story:** Como profissional, eu quero controlar quem pode ver meus stories, para que eu possa gerenciar minha privacidade.

#### Acceptance Criteria

1. WHEN a Professional publishes a story, THE Stories_System SHALL set default visibility to public
2. WHERE a Professional has a public profile, THE Stories_System SHALL display their Active_Stories to all visitors
3. WHERE a Professional has a private profile, THE Stories_System SHALL display their Active_Stories only to authenticated users
4. WHEN a Professional changes their profile visibility, THE Stories_System SHALL update Story visibility accordingly within 5 seconds

