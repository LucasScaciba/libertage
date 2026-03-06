# Requirements Document

## Introduction

Este documento especifica os requisitos para um sistema completo de pipeline de processamento de mídia (imagens e vídeos). O sistema permite upload, processamento assíncrono, otimização, aplicação de watermark e entrega de conteúdo multimídia através de Supabase Storage, com processamento via Sharp (imagens) e FFmpeg (vídeos).

O objetivo principal é reduzir custos de storage e bandwidth, melhorar performance de carregamento, proteger conteúdo dos usuários com watermark, e processar mídia de forma assíncrona sem bloquear o upload inicial.

## Glossary

- **Media_Upload_API**: API responsável por receber uploads de arquivos de mídia
- **Media_Processor**: Sistema de processamento assíncrono de imagens e vídeos
- **Image_Processor**: Componente que processa imagens usando Sharp
- **Video_Processor**: Componente que processa vídeos usando FFmpeg
- **Storage_Manager**: Gerenciador de armazenamento no Supabase Storage
- **Job_Queue**: Fila de processamento assíncrono de mídia
- **Watermark_Engine**: Sistema de aplicação de marca d'água em mídia
- **HLS_Generator**: Gerador de streaming HLS para vídeos
- **Media_Database**: Banco de dados Postgres com tabela de mídia
- **Variant**: Versão otimizada de uma mídia (diferentes resoluções/formatos)
- **Original_File**: Arquivo de mídia original enviado pelo usuário
- **Media_Record**: Registro no banco de dados representando uma mídia
- **User**: Usuário autenticado do sistema
- **Public_Content**: Conteúdo visível publicamente que requer watermark
- **Private_Content**: Conteúdo privado acessível apenas pelo proprietário

## Requirements

### Requirement 1: Upload de Mídia

**User Story:** Como um usuário, eu quero fazer upload de imagens e vídeos, para que eu possa armazenar e processar meu conteúdo multimídia.

#### Acceptance Criteria

1. WHEN a User submits an image or video file, THE Media_Upload_API SHALL validate the file type
2. WHEN a valid media file is received, THE Storage_Manager SHALL save the Original_File to Supabase Storage in the path `media/{userId}/{mediaId}/original/`
3. WHEN the Original_File is saved, THE Media_Upload_API SHALL create a Media_Record with status "queued"
4. WHEN the Media_Record is created, THE Media_Upload_API SHALL enqueue a processing job in the Job_Queue
5. THE Media_Upload_API SHALL return a response with the media ID within 2 seconds without waiting for processing completion
6. WHEN an invalid file type is submitted, THE Media_Upload_API SHALL return an error message indicating supported formats
7. THE Media_Upload_API SHALL accept image formats: JPEG, PNG, WebP, GIF
8. THE Media_Upload_API SHALL accept video formats: MP4, MOV, AVI, WebM

### Requirement 2: Processamento Assíncrono de Mídia

**User Story:** Como um desenvolvedor, eu quero que o processamento de mídia seja assíncrono, para que uploads não sejam bloqueados por operações demoradas.

#### Acceptance Criteria

1. WHEN a job is enqueued, THE Job_Queue SHALL update the Media_Record status to "processing"
2. WHEN processing starts, THE Media_Processor SHALL determine if the media is an image or video
3. IF the media type is image, THEN THE Media_Processor SHALL delegate to the Image_Processor
4. IF the media type is video, THEN THE Media_Processor SHALL delegate to the Video_Processor
5. WHEN processing completes successfully, THE Media_Processor SHALL update the Media_Record status to "ready"
6. WHEN processing fails, THE Media_Processor SHALL update the Media_Record status to "failed"
7. WHEN processing fails, THE Media_Processor SHALL log the error details in the Media_Record
8. THE Media_Processor SHALL process jobs in the order they were enqueued

### Requirement 3: Processamento de Imagens

**User Story:** Como um usuário, eu quero que minhas imagens sejam otimizadas em múltiplas resoluções, para que elas carreguem rapidamente em diferentes contextos.

#### Acceptance Criteria

1. WHEN the Image_Processor receives an image, THE Image_Processor SHALL generate a variant named "avatar_64" with width 64 pixels
2. WHEN the Image_Processor receives an image, THE Image_Processor SHALL generate a variant named "thumb_240" with width 240 pixels
3. WHEN the Image_Processor receives an image, THE Image_Processor SHALL generate a variant named "lightbox_600" with width 600 pixels
4. WHEN the Image_Processor receives an image, THE Image_Processor SHALL generate a variant named "large_1200" with width 1200 pixels
5. THE Image_Processor SHALL convert all variants to WebP format with quality 80
6. THE Image_Processor SHALL remove EXIF metadata from all variants
7. THE Image_Processor SHALL maintain aspect ratio when resizing images
8. WHEN a variant is generated, THE Image_Processor SHALL save it to `media/{userId}/{mediaId}/images/{variantName}.webp`
9. WHEN all variants are generated, THE Image_Processor SHALL update the Media_Record variants field with all variant URLs

### Requirement 4: Aplicação de Watermark em Imagens

**User Story:** Como um administrador, eu quero aplicar watermark em imagens públicas, para que o conteúdo dos usuários seja protegido.

#### Acceptance Criteria

1. WHEN generating the "lightbox_600" variant, THE Watermark_Engine SHALL apply a watermark to the image
2. WHEN generating the "large_1200" variant, THE Watermark_Engine SHALL apply a watermark to the image
3. THE Watermark_Engine SHALL NOT apply watermark to "avatar_64" and "thumb_240" variants
4. THE Watermark_Engine SHALL use the platform name as watermark text
5. THE Watermark_Engine SHALL position the watermark diagonally across the image
6. THE Watermark_Engine SHALL set watermark opacity between 10% and 15%
7. WHEN a watermark is applied, THE Watermark_Engine SHALL save the watermarked variant with suffix "_watermarked"

### Requirement 5: Processamento de Vídeos

**User Story:** Como um usuário, eu quero que meus vídeos sejam convertidos para streaming adaptativo, para que eles sejam reproduzidos eficientemente em diferentes conexões.

#### Acceptance Criteria

1. WHEN the Video_Processor receives a video, THE HLS_Generator SHALL generate an HLS stream at 360p resolution
2. WHEN the Video_Processor receives a video, THE HLS_Generator SHALL generate an HLS stream at 720p resolution
3. WHERE the original video resolution is 1080p or higher, THE HLS_Generator SHALL generate an HLS stream at 1080p resolution
4. THE HLS_Generator SHALL create a master playlist file named "master.m3u8"
5. WHEN HLS streams are generated, THE HLS_Generator SHALL save them to `media/{userId}/{mediaId}/hls/`
6. THE HLS_Generator SHALL segment videos into 6-second chunks
7. WHEN HLS generation completes, THE Video_Processor SHALL update the Media_Record with video duration and dimensions

### Requirement 6: Watermark em Vídeos

**User Story:** Como um administrador, eu quero aplicar watermark em vídeos públicos, para que o conteúdo dos usuários seja protegido.

#### Acceptance Criteria

1. WHEN the Video_Processor generates HLS streams, THE Watermark_Engine SHALL create a watermarked version
2. THE Watermark_Engine SHALL apply the platform name as watermark text to the video
3. THE Watermark_Engine SHALL position the watermark diagonally across the video frames
4. THE Watermark_Engine SHALL set watermark opacity between 10% and 15%
5. WHEN watermarked streams are generated, THE Watermark_Engine SHALL save them to `media/{userId}/{mediaId}/hls_watermarked/`
6. THE Watermark_Engine SHALL create a separate master playlist for watermarked content

### Requirement 7: Extração de Thumbnails de Vídeos

**User Story:** Como um usuário, eu quero que thumbnails sejam extraídos dos meus vídeos, para que eles tenham uma imagem de preview.

#### Acceptance Criteria

1. WHEN the Video_Processor receives a video, THE Video_Processor SHALL extract a frame at 2 seconds as thumbnail
2. WHEN a thumbnail is extracted, THE Image_Processor SHALL generate all image variants from the thumbnail
3. THE Image_Processor SHALL apply the same watermark rules to video thumbnails as to regular images
4. WHEN thumbnail variants are generated, THE Video_Processor SHALL update the Media_Record variants field with thumbnail URLs

### Requirement 8: Estrutura de Storage

**User Story:** Como um desenvolvedor, eu quero uma estrutura organizada de storage, para que arquivos sejam facilmente localizados e gerenciados.

#### Acceptance Criteria

1. THE Storage_Manager SHALL use a bucket named "media" for all media files
2. THE Storage_Manager SHALL organize files in the structure `media/{userId}/{mediaId}/original/`
3. THE Storage_Manager SHALL organize image variants in the structure `media/{userId}/{mediaId}/images/`
4. THE Storage_Manager SHALL organize HLS streams in the structure `media/{userId}/{mediaId}/hls/`
5. THE Storage_Manager SHALL organize watermarked HLS streams in the structure `media/{userId}/{mediaId}/hls_watermarked/`
6. THE Storage_Manager SHALL use the user ID from the authenticated session for the userId path segment
7. THE Storage_Manager SHALL generate a unique UUID for each mediaId

### Requirement 9: Banco de Dados de Mídia

**User Story:** Como um desenvolvedor, eu quero armazenar metadados de mídia no banco de dados, para que eu possa consultar e gerenciar o conteúdo.

#### Acceptance Criteria

1. THE Media_Database SHALL have a table named "media"
2. THE Media_Database SHALL store the following fields: id (uuid), user_id (uuid), type (enum: image or video), original_path (text), status (enum: queued, processing, ready, failed), width (integer), height (integer), duration (integer), variants (jsonb), created_at (timestamp), updated_at (timestamp)
3. WHEN a Media_Record is created, THE Media_Database SHALL set status to "queued"
4. WHEN processing starts, THE Media_Database SHALL update status to "processing"
5. WHEN processing completes, THE Media_Database SHALL update status to "ready" and populate the variants field
6. WHEN processing fails, THE Media_Database SHALL update status to "failed"
7. THE Media_Database SHALL store all variant URLs in the variants JSONB field
8. THE Media_Database SHALL automatically set created_at to the current timestamp on insert
9. THE Media_Database SHALL automatically update updated_at to the current timestamp on update

### Requirement 10: Segurança e Controle de Acesso

**User Story:** Como um usuário, eu quero que apenas eu possa acessar minhas mídias privadas, para que meu conteúdo seja protegido.

#### Acceptance Criteria

1. THE Media_Database SHALL implement Row Level Security (RLS) policies
2. THE Media_Database SHALL allow a User to read only their own Media_Records
3. THE Media_Database SHALL allow a User to insert only Media_Records with their own user_id
4. THE Media_Database SHALL allow a User to update only their own Media_Records
5. THE Media_Database SHALL allow a User to delete only their own Media_Records
6. WHEN accessing Private_Content, THE Storage_Manager SHALL generate signed URLs with 1-hour expiration
7. WHEN accessing Public_Content, THE Storage_Manager SHALL serve watermarked variants

### Requirement 11: API de Upload

**User Story:** Como um desenvolvedor frontend, eu quero uma API para fazer upload de mídia, para que eu possa integrar uploads na interface do usuário.

#### Acceptance Criteria

1. THE Media_Upload_API SHALL expose a POST endpoint at "/api/media/upload"
2. WHEN a POST request is received, THE Media_Upload_API SHALL validate the user is authenticated
3. WHEN a POST request is received, THE Media_Upload_API SHALL accept multipart/form-data with a file field
4. WHEN upload succeeds, THE Media_Upload_API SHALL return HTTP 201 with the media ID and status
5. WHEN upload fails, THE Media_Upload_API SHALL return HTTP 400 with error details
6. WHEN the user is not authenticated, THE Media_Upload_API SHALL return HTTP 401
7. THE Media_Upload_API SHALL limit file size to 100MB for images and 500MB for videos

### Requirement 12: API de Consulta de Mídia

**User Story:** Como um desenvolvedor frontend, eu quero consultar metadados de mídia, para que eu possa exibir informações e status de processamento.

#### Acceptance Criteria

1. THE Media_Upload_API SHALL expose a GET endpoint at "/api/media/{id}"
2. WHEN a GET request is received, THE Media_Upload_API SHALL validate the user is authenticated
3. WHEN a GET request is received, THE Media_Upload_API SHALL verify the user owns the requested media
4. WHEN the media exists and user is authorized, THE Media_Upload_API SHALL return HTTP 200 with media metadata and variant URLs
5. WHEN the media does not exist, THE Media_Upload_API SHALL return HTTP 404
6. WHEN the user is not authorized, THE Media_Upload_API SHALL return HTTP 403
7. THE Media_Upload_API SHALL include processing status in the response

### Requirement 13: API de Reprocessamento

**User Story:** Como um usuário, eu quero reprocessar uma mídia, para que eu possa regenerar variantes se necessário.

#### Acceptance Criteria

1. THE Media_Upload_API SHALL expose a POST endpoint at "/api/media/{id}/reprocess"
2. WHEN a POST request is received, THE Media_Upload_API SHALL validate the user is authenticated
3. WHEN a POST request is received, THE Media_Upload_API SHALL verify the user owns the requested media
4. WHEN reprocessing is requested, THE Media_Upload_API SHALL update the Media_Record status to "queued"
5. WHEN reprocessing is requested, THE Media_Upload_API SHALL enqueue a new processing job
6. WHEN reprocessing is enqueued, THE Media_Upload_API SHALL return HTTP 202
7. WHEN the user is not authorized, THE Media_Upload_API SHALL return HTTP 403

### Requirement 14: Regras de Exibição no Frontend

**User Story:** Como um desenvolvedor frontend, eu quero saber quais variantes usar em cada contexto, para que eu exiba a mídia apropriada.

#### Acceptance Criteria

1. WHEN displaying media in a catalog or grid view, THE Frontend SHALL use the "thumb_240" variant
2. WHEN displaying media in a modal or public profile, THE Frontend SHALL use the "lightbox_600_watermarked" variant for images
3. WHEN displaying video in a modal or public profile, THE Frontend SHALL use the "hls_watermarked" stream
4. WHEN displaying media in a private context, THE Frontend SHALL use non-watermarked variants with signed URLs
5. WHEN playing video, THE Frontend SHALL use hls.js library to consume the master.m3u8 playlist
6. WHEN media status is "processing", THE Frontend SHALL display a loading indicator
7. WHEN media status is "failed", THE Frontend SHALL display an error message

### Requirement 15: Parser de Metadados de Mídia

**User Story:** Como um desenvolvedor, eu quero extrair metadados de arquivos de mídia, para que eu possa armazenar informações como dimensões e duração.

#### Acceptance Criteria

1. WHEN the Media_Processor receives an image, THE Media_Processor SHALL extract width and height
2. WHEN the Media_Processor receives a video, THE Media_Processor SHALL extract width, height, and duration
3. WHEN metadata is extracted, THE Media_Processor SHALL update the Media_Record with the extracted values
4. WHEN metadata extraction fails, THE Media_Processor SHALL log the error and continue processing
5. THE Media_Processor SHALL parse metadata before generating variants

### Requirement 16: Pretty Printer de Configuração de Variantes

**User Story:** Como um desenvolvedor, eu quero serializar configurações de variantes, para que eu possa armazená-las e recuperá-las do banco de dados.

#### Acceptance Criteria

1. WHEN variants are generated, THE Media_Processor SHALL format variant metadata into a JSON structure
2. THE Media_Processor SHALL include the following fields for each variant: name, url, width, height, format, size_bytes
3. WHEN storing variants, THE Media_Processor SHALL serialize the JSON structure to the variants JSONB field
4. WHEN retrieving variants, THE Media_Upload_API SHALL parse the JSONB field into a structured object
5. FOR ALL valid variant configurations, serializing then parsing SHALL produce an equivalent structure (round-trip property)

### Requirement 17: Tratamento de Erros de Processamento

**User Story:** Como um usuário, eu quero ser notificado quando o processamento falhar, para que eu possa tomar ações corretivas.

#### Acceptance Criteria

1. WHEN the Image_Processor encounters an error, THE Media_Processor SHALL update the Media_Record status to "failed"
2. WHEN the Video_Processor encounters an error, THE Media_Processor SHALL update the Media_Record status to "failed"
3. WHEN processing fails, THE Media_Processor SHALL store the error message in the Media_Record
4. WHEN the HLS_Generator fails, THE Media_Processor SHALL log the FFmpeg error output
5. WHEN the Watermark_Engine fails, THE Media_Processor SHALL continue processing without watermark and log a warning
6. WHEN a variant generation fails, THE Media_Processor SHALL attempt to generate remaining variants

### Requirement 18: Limpeza de Arquivos Temporários

**User Story:** Como um administrador, eu quero que arquivos temporários sejam limpos, para que o storage não seja desperdiçado.

#### Acceptance Criteria

1. WHEN the Media_Processor completes processing, THE Media_Processor SHALL delete temporary files from local disk
2. WHEN the Media_Processor fails, THE Media_Processor SHALL delete temporary files from local disk
3. THE Media_Processor SHALL use a temporary directory for processing that is unique per job
4. WHEN downloading the Original_File for processing, THE Media_Processor SHALL store it in the temporary directory
5. WHEN all variants are uploaded to Storage_Manager, THE Media_Processor SHALL remove the temporary directory

### Requirement 19: Validação de Integridade de Arquivos

**User Story:** Como um desenvolvedor, eu quero validar a integridade de arquivos enviados, para que arquivos corrompidos sejam rejeitados.

#### Acceptance Criteria

1. WHEN a file is uploaded, THE Media_Upload_API SHALL verify the file is not empty
2. WHEN a file is uploaded, THE Media_Upload_API SHALL verify the file size is within limits
3. WHEN an image is uploaded, THE Image_Processor SHALL verify the file is a valid image format
4. WHEN a video is uploaded, THE Video_Processor SHALL verify the file is a valid video format
5. WHEN a file fails validation, THE Media_Upload_API SHALL return an error message describing the validation failure
6. WHEN a corrupted file is detected during processing, THE Media_Processor SHALL update status to "failed" with details

### Requirement 20: Otimização de Performance

**User Story:** Como um usuário, eu quero que o processamento seja eficiente, para que minhas mídias fiquem prontas rapidamente.

#### Acceptance Criteria

1. THE Image_Processor SHALL process image variants in parallel when possible
2. THE Video_Processor SHALL use hardware acceleration for video encoding when available
3. THE HLS_Generator SHALL use FFmpeg preset "fast" for encoding
4. WHEN generating multiple HLS resolutions, THE HLS_Generator SHALL process them sequentially to avoid resource exhaustion
5. THE Media_Processor SHALL limit concurrent processing jobs to 3 per worker instance
6. THE Storage_Manager SHALL use streaming uploads for files larger than 10MB
7. THE Media_Processor SHALL download the Original_File only once per processing job
