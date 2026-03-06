# Media Processing Pipeline

Este documento descreve como usar o sistema de processamento de mídia.

## Visão Geral

O sistema processa imagens e vídeos de forma assíncrona, gerando múltiplas variantes otimizadas e aplicando watermark em conteúdo público.

## Arquitetura

```
Upload → Storage → Database → Job Queue → Worker → Processamento → Variantes
```

## Executando o Worker

O worker é um processo separado que processa jobs da fila.

### Desenvolvimento

```bash
npm run worker
```

### Produção

```bash
# Usando PM2 (recomendado)
pm2 start npm --name "media-worker" -- run worker
pm2 save
pm2 startup

# Ou usando systemd
sudo systemctl start media-worker
```

## Configuração

### Variáveis de Ambiente

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### FFmpeg

O FFmpeg deve estar instalado no sistema:

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

## Uso

### Upload de Mídia

```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/media/upload', {
  method: 'POST',
  body: formData,
});

const { id, status } = await response.json();
// status: "queued"
```

### Consultar Status

```typescript
const response = await fetch(`/api/media/${id}`);
const media = await response.json();

console.log(media.status); // "queued" | "processing" | "ready" | "failed"
console.log(media.variants); // URLs das variantes
```

### Polling de Status

```typescript
async function waitForProcessing(mediaId: string): Promise<Media> {
  while (true) {
    const response = await fetch(`/api/media/${mediaId}`);
    const media = await response.json();

    if (media.status === 'ready') {
      return media;
    }

    if (media.status === 'failed') {
      throw new Error(media.error_message);
    }

    // Aguardar 2 segundos antes de verificar novamente
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

### Reprocessar Mídia

```typescript
const response = await fetch(`/api/media/${id}/reprocess`, {
  method: 'POST',
});

const { status } = await response.json();
// status: "queued"
```

## Variantes de Imagem

| Variante | Largura | Uso | Watermark |
|----------|---------|-----|-----------|
| `avatar_64` | 64px | Thumbnails pequenos | Não |
| `thumb_240` | 240px | Grid de catálogo | Não |
| `lightbox_600` | 600px | Modal de visualização | Sim |
| `lightbox_600_watermarked` | 600px | Visualização pública | Sim |
| `large_1200` | 1200px | Alta resolução | Sim |
| `large_1200_watermarked` | 1200px | Alta resolução pública | Sim |

## Variantes de Vídeo

| Variante | Resolução | Bitrate | Uso |
|----------|-----------|---------|-----|
| `360p` | 360p | 800k | Conexões lentas |
| `720p` | 720p | 2500k | Qualidade padrão |
| `1080p` | 1080p | 5000k | Alta qualidade (condicional) |

### HLS Streaming

```typescript
import Hls from 'hls.js';

const video = document.getElementById('video');
const hls = new Hls();

// Usar versão com watermark para conteúdo público
hls.loadSource(media.variants.hls_master_watermarked.url);
hls.attachMedia(video);
```

## Regras de Exibição

### Catálogo (Grid View)
- Usar `thumb_240` (sem watermark)

### Modal / Perfil Público
- Imagens: `lightbox_600_watermarked`
- Vídeos: `hls_master_watermarked`

### Conteúdo Privado
- Usar variantes sem watermark
- Gerar signed URLs com 1 hora de expiração

```typescript
const { data } = await supabase.storage
  .from('media')
  .createSignedUrl(path, 3600);
```

## Monitoramento

### Stats do Worker

```typescript
import { worker } from '@/lib/workers/media-processor-worker';

const stats = worker.getStats();
console.log(stats);
// {
//   isRunning: true,
//   activeJobs: 2,
//   maxConcurrentJobs: 3,
//   queueStats: {
//     queued: 5,
//     processing: 2,
//     completed: 100,
//     failed: 3
//   }
// }
```

### Logs

O worker registra logs detalhados:

```
[Worker] Starting media processor worker
[Worker] Max concurrent jobs: 3
[Worker] Processing job abc-123 (1/3 active)
[ImageProcessor] Starting processing for media xyz-789
[ImageProcessor] Generated 6 variants
[Worker] Job abc-123 completed successfully
```

## Troubleshooting

### Worker não processa jobs

1. Verificar se o worker está rodando: `ps aux | grep media-worker`
2. Verificar logs do worker
3. Verificar se FFmpeg está instalado: `ffmpeg -version`
4. Verificar variáveis de ambiente

### Processamento falha

1. Verificar logs do worker para detalhes do erro
2. Verificar se o arquivo original existe no storage
3. Verificar se o formato do arquivo é suportado
4. Tentar reprocessar: `POST /api/media/{id}/reprocess`

### Vídeo não reproduz

1. Verificar se HLS foi gerado corretamente
2. Verificar se hls.js está carregado
3. Verificar console do navegador para erros
4. Verificar se o navegador suporta HLS

## Limites

- **Imagens**: 100MB máximo
- **Vídeos**: 500MB máximo
- **Formatos suportados**:
  - Imagens: JPEG, PNG, WebP, GIF
  - Vídeos: MP4, MOV, AVI, WebM
- **Concorrência**: 3 jobs simultâneos por worker
- **Retry**: 3 tentativas com exponential backoff

## Performance

### Tempos Esperados

- Upload: < 2 segundos
- Processamento de imagem (4K): < 30 segundos
- Processamento de vídeo (1080p, 60s): < 5 minutos
- Extração de thumbnail: < 5 segundos

### Otimizações

- Variantes de imagem processadas em paralelo
- Streams HLS processados sequencialmente
- Streaming para arquivos > 10MB
- Hardware acceleration para vídeo (quando disponível)

## Segurança

- Autenticação obrigatória em todas as APIs
- RLS policies garantem isolamento de dados
- Watermark em todo conteúdo público
- Signed URLs para conteúdo privado (1 hora)
- Remoção de metadados EXIF de imagens
