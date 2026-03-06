# Implementation Plan: Media Processing Pipeline

## Overview

Este plano de implementação detalha as tasks necessárias para construir o sistema completo de pipeline de processamento de mídia. O sistema será implementado em TypeScript usando Next.js 16, Supabase (Storage, Auth, Postgres), Sharp para processamento de imagens e FFmpeg para processamento de vídeos.

A implementação segue uma abordagem incremental em 6 fases principais: Setup e Infraestrutura, Core Services, Processadores, APIs, Worker e Frontend Integration. Cada fase constrói sobre a anterior, garantindo que o sistema seja testável e funcional em cada etapa.

## Tasks

- [x] 1. Setup e Infraestrutura
  - [x] 1.1 Criar migration do banco de dados
    - Criar arquivo `supabase/migrations/20260306_media_processing_pipeline.sql`
    - Definir tabela `media` com todos os campos (id, user_id, type, original_path, status, width, height, duration, variants, error_message, created_at, updated_at)
    - Criar índices (idx_media_user_id, idx_media_status, idx_media_created_at, idx_media_type)
    - Criar função e trigger para updated_at automático
    - Implementar RLS policies (SELECT, INSERT, UPDATE, DELETE)
    - _Requirements: 9.1, 9.2, 9.8, 9.9, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 1.2 Escrever testes de propriedade para estrutura do banco
    - **Property 18: Automatic Timestamps**
    - **Property 19: User Data Isolation**
    - **Validates: Requirements 9.8, 9.9, 10.2, 10.3, 10.4, 10.5**

  - [x] 1.3 Configurar bucket no Supabase Storage
    - Criar bucket "media" via Supabase Dashboard ou API
    - Configurar bucket como privado (public: false)
    - Definir limite de tamanho de arquivo (500MB)
    - Configurar tipos MIME permitidos (image/*, video/*)
    - _Requirements: 8.1_

  - [x] 1.4 Instalar dependências de processamento
    - Adicionar Sharp ao package.json (se ainda não estiver presente)
    - Adicionar tipos do Sharp (@types/sharp)
    - Documentar requisito de FFmpeg no README (instalação externa)
    - _Requirements: 3.5, 5.1_

- [x] 2. Core Services - Storage Manager
  - [x] 2.1 Implementar Storage Manager Service
    - Criar arquivo `lib/services/storage-manager.service.ts`
    - Implementar método uploadFile(path, buffer, contentType)
    - Implementar método downloadFile(path)
    - Implementar método deleteFile(path)
    - Implementar método deleteDirectory(path)
    - Implementar método generateSignedUrl(path, expiresIn)
    - Implementar método getPublicUrl(path)
    - Usar streaming para arquivos > 10MB
    - _Requirements: 1.2, 8.2, 8.3, 8.4, 8.5, 10.6, 20.6_

  - [ ]* 2.2 Escrever testes de propriedade para Storage Manager
    - **Property 2: Storage Path Structure**
    - **Property 20: Signed URL Expiration**
    - **Validates: Requirements 1.2, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 10.6**

  - [ ]* 2.3 Escrever testes unitários para Storage Manager
    - Testar upload de arquivo pequeno (< 10MB)
    - Testar upload de arquivo grande (> 10MB) com streaming
    - Testar download de arquivo
    - Testar geração de signed URL
    - Testar deleção de arquivo e diretório

- [x] 3. Core Services - Job Queue
  - [x] 3.1 Implementar Job Queue in-memory (MVP)
    - Criar arquivo `lib/services/job-queue.service.ts`
    - Definir interface JobQueue e ProcessingJob
    - Implementar classe InMemoryJobQueue
    - Implementar método enqueue(job)
    - Implementar método dequeue()
    - Implementar método markProcessing(jobId)
    - Implementar método markComplete(jobId)
    - Implementar método markFailed(jobId, error)
    - _Requirements: 1.4, 2.1, 2.8_

  - [ ]* 3.2 Escrever testes de propriedade para Job Queue
    - **Property 6: FIFO Job Processing**
    - **Validates: Requirements 2.8**

  - [ ]* 3.3 Escrever testes unitários para Job Queue
    - Testar enqueue e dequeue de jobs
    - Testar ordem FIFO
    - Testar marcação de status (processing, complete, failed)
    - Testar fila vazia retorna null

- [x] 4. Core Services - Watermark Engine
  - [x] 4.1 Implementar Watermark Engine
    - Criar arquivo `lib/services/watermark.service.ts`
    - Implementar método applyToImage(imageBuffer, options)
    - Implementar método createDiagonalTextSVG(text, width, height, opacity)
    - Usar Sharp composite para aplicar watermark
    - Configurar opacidade entre 10-15% (default 12%)
    - Configurar posicionamento diagonal (-45 graus)
    - Usar nome da plataforma como texto do watermark
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 4.2 Escrever testes de propriedade para Watermark Engine
    - **Property 11: Watermark Content**
    - **Validates: Requirements 4.4**

  - [ ]* 4.3 Escrever testes unitários para Watermark Engine
    - Testar aplicação de watermark em imagem
    - Testar criação de SVG diagonal
    - Testar opacidade configurável
    - Verificar que watermark não corrompe imagem

- [x] 5. Processadores - Image Processor
  - [x] 5.1 Implementar Image Processor Service
    - Criar arquivo `lib/services/image-processor.service.ts`
    - Definir constante IMAGE_VARIANTS com 4 variantes (avatar_64, thumb_240, lightbox_600, large_1200)
    - Implementar método process(job)
    - Implementar download do arquivo original
    - Implementar extração de metadados (width, height)
    - Implementar geração de variantes em paralelo (Promise.all)
    - Configurar Sharp: resize com fit "inside", withoutEnlargement true
    - Configurar conversão para WebP com quality 80
    - Remover metadados EXIF
    - Aplicar watermark nas variantes lightbox_600 e large_1200
    - Fazer upload de todas as variantes para Storage
    - Atualizar registro no banco com metadados e variantes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.1, 4.2, 4.3, 4.7, 15.1, 15.3, 15.5, 16.1, 16.2, 20.1_

  - [ ]* 5.2 Escrever testes de propriedade para Image Processor
    - **Property 7: Image Variant Completeness**
    - **Property 8: EXIF Metadata Removal**
    - **Property 9: Aspect Ratio Preservation**
    - **Property 10: Image Watermark Application Rules**
    - **Property 30: Image Metadata Extraction**
    - **Property 32: Variant Metadata Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9, 4.1, 4.2, 4.3, 4.7, 15.1, 15.3, 15.5, 16.1, 16.2**

  - [ ]* 5.3 Escrever testes unitários para Image Processor
    - Testar processamento de imagem JPEG
    - Testar processamento de imagem PNG
    - Testar geração de todas as 4 variantes
    - Testar aplicação de watermark apenas em lightbox_600 e large_1200
    - Testar remoção de EXIF
    - Testar preservação de aspect ratio

- [ ] 6. Checkpoint - Validar processamento de imagens
  - Executar testes do Image Processor
  - Verificar que todas as variantes são geradas corretamente
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [x] 7. Processadores - Video Processor
  - [x] 7.1 Implementar Video Processor Service (parte 1: estrutura e thumbnail)
    - Criar arquivo `lib/services/video-processor.service.ts`
    - Definir constante HLS_RESOLUTIONS com 3 resoluções (360p, 720p, 1080p)
    - Implementar método process(job)
    - Implementar download do arquivo original
    - Implementar extração de metadados usando FFmpeg (width, height, duration)
    - Implementar extração de thumbnail no segundo 2
    - Processar thumbnail através do Image Processor
    - _Requirements: 5.7, 7.1, 7.2, 15.2, 15.3_

  - [x] 7.2 Implementar Video Processor Service (parte 2: HLS generation)
    - Implementar método generateHLSStream(inputPath, resolution, job, watermark)
    - Configurar comando FFmpeg com scale, libx264, preset fast
    - Configurar bitrates (800k para 360p, 2500k para 720p, 5000k para 1080p)
    - Configurar segmentação HLS (6 segundos, tipo vod)
    - Aplicar watermark via FFmpeg drawtext filter quando necessário
    - Fazer upload de segmentos e playlists para Storage
    - Gerar streams sequencialmente para evitar sobrecarga
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 20.2, 20.3, 20.4_

  - [x] 7.3 Implementar Video Processor Service (parte 3: master playlists)
    - Implementar método createMasterPlaylist(path, resolutions)
    - Criar master playlist para streams normais (hls/)
    - Criar master playlist para streams com watermark (hls_watermarked/)
    - Determinar resoluções baseado na resolução original (1080p condicional)
    - Atualizar registro no banco com metadados e variantes
    - _Requirements: 5.4, 5.5, 6.6_

  - [ ]* 7.4 Escrever testes de propriedade para Video Processor
    - **Property 12: HLS Resolution Generation**
    - **Property 13: HLS Master Playlist**
    - **Property 14: HLS Segment Duration**
    - **Property 15: Video Metadata Extraction**
    - **Property 16: Video Watermark Separation**
    - **Property 17: Video Thumbnail Processing**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 6.1, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 15.2, 15.3**

  - [ ]* 7.5 Escrever testes unitários para Video Processor
    - Testar extração de metadados de vídeo
    - Testar extração de thumbnail
    - Testar geração de HLS 360p e 720p
    - Testar geração condicional de 1080p
    - Testar criação de master playlists
    - Testar separação de streams com/sem watermark

- [x] 8. Processadores - Media Processor (Orquestrador)
  - [x] 8.1 Implementar Media Processor Service
    - Criar arquivo `lib/services/media-processor.service.ts`
    - Implementar método process(job)
    - Atualizar status do media para "processing"
    - Determinar tipo de mídia (image ou video)
    - Delegar para Image Processor se tipo for "image"
    - Delegar para Video Processor se tipo for "video"
    - Atualizar status para "ready" em caso de sucesso
    - Atualizar status para "failed" com error_message em caso de erro
    - Implementar limpeza de arquivos temporários (sempre executar)
    - Implementar graceful degradation para falhas de watermark
    - Implementar resiliência para falhas parciais de variantes
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 18.1, 18.2, 18.3, 18.4, 18.5, 20.7_

  - [ ]* 8.2 Escrever testes de propriedade para Media Processor
    - **Property 4: Media Processing State Machine**
    - **Property 5: Type-Based Routing**
    - **Property 31: Metadata Extraction Resilience**
    - **Property 34: Graceful Watermark Failure**
    - **Property 35: Partial Variant Failure Resilience**
    - **Property 36: Temporary File Cleanup**
    - **Property 39: Single Original Download**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 9.4, 9.5, 9.6, 15.4, 17.1, 17.2, 17.3, 17.5, 17.6, 18.1, 18.2, 18.3, 18.4, 18.5, 20.7**

  - [ ]* 8.3 Escrever testes unitários para Media Processor
    - Testar roteamento para Image Processor
    - Testar roteamento para Video Processor
    - Testar transições de status (queued → processing → ready)
    - Testar transições de status em caso de erro (queued → processing → failed)
    - Testar limpeza de arquivos temporários em sucesso
    - Testar limpeza de arquivos temporários em falha

- [ ] 9. Checkpoint - Validar processamento completo
  - Executar testes do Media Processor
  - Verificar que roteamento funciona corretamente
  - Verificar que limpeza de arquivos temporários funciona
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [x] 10. APIs - Upload Endpoint
  - [x] 10.1 Implementar POST /api/media/upload
    - Criar arquivo `app/api/media/upload/route.ts`
    - Implementar validação de autenticação (JWT via Supabase)
    - Implementar parsing de multipart/form-data
    - Implementar validação de tipo de arquivo (MIME type)
    - Implementar validação de tamanho (100MB para imagens, 500MB para vídeos)
    - Implementar validação de arquivo não vazio
    - Gerar mediaId (UUID) e paths de storage
    - Fazer upload do arquivo original para Storage
    - Criar registro no banco com status "queued"
    - Enfileirar job de processamento
    - Retornar HTTP 201 com mediaId e status
    - Retornar HTTP 400 para erros de validação
    - Retornar HTTP 401 para usuário não autenticado
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 19.1, 19.2, 19.5_

  - [ ]* 10.2 Escrever testes de propriedade para Upload API
    - **Property 1: File Type Validation**
    - **Property 3: Upload Creates Record and Job**
    - **Property 22: Authentication Enforcement**
    - **Property 23: Upload Success Response**
    - **Property 24: Upload Failure Response**
    - **Property 25: File Size Limits**
    - **Property 37: Empty File Rejection**
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.6, 9.3, 11.2, 11.4, 11.5, 11.6, 11.7, 19.1, 19.2, 19.5**

  - [ ]* 10.3 Escrever testes unitários para Upload API
    - Testar upload de imagem JPEG válida
    - Testar upload de vídeo MP4 válido
    - Testar rejeição de tipo inválido (PDF)
    - Testar rejeição de arquivo muito grande
    - Testar rejeição de arquivo vazio
    - Testar rejeição de usuário não autenticado

- [x] 11. APIs - Query Endpoint
  - [x] 11.1 Implementar GET /api/media/{id}
    - Criar arquivo `app/api/media/[id]/route.ts`
    - Implementar validação de autenticação (JWT via Supabase)
    - Consultar registro no banco usando RLS (garante autorização)
    - Retornar HTTP 200 com metadados completos e URLs de variantes
    - Retornar HTTP 404 se media não existir
    - Retornar HTTP 403 se usuário não for o proprietário (via RLS)
    - Retornar HTTP 401 se usuário não estiver autenticado
    - Incluir status de processamento na resposta
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [ ]* 11.2 Escrever testes de propriedade para Query API
    - **Property 26: Authorization Enforcement**
    - **Property 27: Media Query Success Response**
    - **Property 28: Media Not Found Response**
    - **Validates: Requirements 12.2, 12.3, 12.4, 12.5, 12.6, 12.7**

  - [ ]* 11.3 Escrever testes unitários para Query API
    - Testar consulta de media própria (sucesso)
    - Testar consulta de media de outro usuário (403)
    - Testar consulta de media inexistente (404)
    - Testar consulta sem autenticação (401)
    - Testar resposta inclui todas as variantes

- [x] 12. APIs - Reprocess Endpoint
  - [x] 12.1 Implementar POST /api/media/{id}/reprocess
    - Criar arquivo `app/api/media/[id]/reprocess/route.ts`
    - Implementar validação de autenticação (JWT via Supabase)
    - Consultar registro no banco usando RLS (garante autorização)
    - Atualizar status do media para "queued"
    - Enfileirar novo job de processamento
    - Retornar HTTP 202 com mensagem de confirmação
    - Retornar HTTP 403 se usuário não for o proprietário
    - Retornar HTTP 401 se usuário não estiver autenticado
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

  - [ ]* 12.2 Escrever testes de propriedade para Reprocess API
    - **Property 29: Reprocess State Reset**
    - **Validates: Requirements 13.4, 13.5, 13.6**

  - [ ]* 12.3 Escrever testes unitários para Reprocess API
    - Testar reprocessamento de media própria (sucesso)
    - Testar reprocessamento de media de outro usuário (403)
    - Testar reprocessamento sem autenticação (401)
    - Verificar que status é resetado para "queued"
    - Verificar que novo job é enfileirado

- [x] 13. Worker - Processamento Assíncrono
  - [x] 13.1 Implementar Worker Process
    - Criar arquivo `lib/workers/media-processor-worker.ts`
    - Implementar loop de processamento (dequeue → process → mark complete/failed)
    - Implementar polling da fila (verificar a cada 1 segundo se vazia)
    - Limitar processamento concorrente a 3 jobs por worker
    - Implementar tratamento de erros com logging
    - Implementar graceful shutdown
    - _Requirements: 2.1, 2.5, 2.6, 20.5_

  - [ ]* 13.2 Escrever testes de integração para Worker
    - Testar processamento end-to-end de imagem
    - Testar processamento end-to-end de vídeo
    - Testar tratamento de erro e marcação como "failed"
    - Testar limite de concorrência

  - [x] 13.3 Criar script de execução do worker
    - Criar script `npm run worker` no package.json
    - Documentar como executar o worker em desenvolvimento
    - Documentar como executar o worker em produção
    - _Requirements: 2.1_

- [ ] 14. Checkpoint - Validar fluxo completo
  - Executar worker em desenvolvimento
  - Fazer upload de imagem via API
  - Verificar que processamento ocorre automaticamente
  - Verificar que variantes são geradas
  - Fazer upload de vídeo via API
  - Verificar que HLS é gerado
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [x] 15. Frontend Integration - Componente de Upload
  - [x] 15.1 Criar componente MediaUpload
    - Criar arquivo `app/components/media/MediaUpload.tsx`
    - Implementar input de arquivo com drag-and-drop
    - Implementar validação de tipo no cliente
    - Implementar validação de tamanho no cliente
    - Implementar chamada para POST /api/media/upload
    - Implementar exibição de progresso de upload
    - Implementar polling de status após upload
    - Exibir loading indicator enquanto status for "processing"
    - Exibir erro se status for "failed"
    - Emitir evento quando status for "ready"
    - _Requirements: 14.6, 14.7_

  - [ ]* 15.2 Escrever testes unitários para MediaUpload
    - Testar seleção de arquivo
    - Testar validação de tipo
    - Testar validação de tamanho
    - Testar chamada de API
    - Testar polling de status

- [x] 16. Frontend Integration - Componente de Exibição
  - [x] 16.1 Criar componente MediaDisplay
    - Criar arquivo `app/components/media/MediaDisplay.tsx`
    - Implementar exibição de imagem com seleção de variante por contexto
    - Usar thumb_240 para grid/catalog view
    - Usar lightbox_600_watermarked para modal/public profile
    - Implementar exibição de vídeo com hls.js
    - Usar hls_master_watermarked para public content
    - Usar hls_master com signed URL para private content
    - Implementar fallback para navegadores sem suporte a HLS
    - Exibir loading indicator para status "processing"
    - Exibir mensagem de erro para status "failed"
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 16.2 Escrever testes unitários para MediaDisplay
    - Testar exibição de imagem em grid view
    - Testar exibição de imagem em modal
    - Testar exibição de vídeo com HLS
    - Testar exibição de loading indicator
    - Testar exibição de erro

  - [x] 16.3 Instalar e configurar hls.js
    - Adicionar hls.js ao package.json
    - Adicionar tipos do hls.js (@types/hls.js)
    - Criar hook useHLSPlayer para encapsular lógica de HLS
    - _Requirements: 14.5_

- [ ] 17. Validação e Testes Finais
  - [ ]* 17.1 Escrever testes de propriedade adicionais
    - **Property 33: Variant Serialization Round-Trip**
    - **Property 38: Format Validation**
    - **Property 21: Public Content Watermarking**
    - **Validates: Requirements 16.3, 16.4, 16.5, 19.3, 19.4, 19.6, 10.7**

  - [ ]* 17.2 Escrever testes de integração end-to-end
    - Testar fluxo completo: upload → processamento → consulta → exibição
    - Testar upload de imagem e verificar todas as variantes
    - Testar upload de vídeo e verificar HLS streams
    - Testar reprocessamento de mídia
    - Testar isolamento de dados entre usuários

  - [ ]* 17.3 Executar todos os testes
    - Executar todos os testes unitários
    - Executar todos os testes de propriedade (100 iterações cada)
    - Executar todos os testes de integração
    - Verificar cobertura de testes > 80%

- [-] 18. Documentação e Deploy
  - [ ] 18.1 Criar documentação de uso
    - Documentar como fazer upload de mídia
    - Documentar como consultar status de processamento
    - Documentar como exibir mídia no frontend
    - Documentar estrutura de variantes
    - Documentar regras de watermark
    - Adicionar exemplos de código

  - [x] 18.2 Criar guia de deployment
    - Documentar configuração do Supabase
    - Documentar criação do bucket "media"
    - Documentar execução da migration
    - Documentar configuração de variáveis de ambiente
    - Documentar instalação do FFmpeg no servidor
    - Documentar execução do worker em produção

  - [x] 18.3 Preparar para deploy
    - Verificar todas as variáveis de ambiente estão configuradas
    - Executar migration no banco de produção
    - Criar bucket "media" no Supabase de produção
    - Configurar políticas de bucket
    - Instalar FFmpeg no servidor de produção
    - Configurar worker para executar em produção

- [ ] 19. Checkpoint Final
  - Executar todos os testes em ambiente de staging
  - Fazer upload de teste de imagem e vídeo
  - Verificar que processamento funciona corretamente
  - Verificar que variantes são geradas
  - Verificar que watermark é aplicado
  - Verificar que RLS policies funcionam
  - Perguntar ao usuário se está pronto para deploy em produção

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia os requirements específicos para rastreabilidade
- Checkpoints garantem validação incremental do sistema
- Testes de propriedade validam propriedades universais de correção
- Testes unitários validam exemplos específicos e casos extremos
- A implementação é incremental: cada fase constrói sobre a anterior
- O worker deve ser executado separadamente do servidor Next.js
- FFmpeg deve ser instalado externamente no servidor (não é uma dependência npm)
- Para desenvolvimento local, recomenda-se instalar FFmpeg via Homebrew (macOS) ou apt-get (Linux)
