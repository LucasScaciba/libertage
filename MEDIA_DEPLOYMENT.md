# Media Processing Pipeline - Deployment Guide

Este guia detalha como fazer deploy do sistema de processamento de mídia em produção.

## Pré-requisitos

- Conta Supabase (projeto criado)
- Servidor com Node.js 18+ instalado
- FFmpeg instalado no servidor
- Acesso SSH ao servidor (para worker)

## 1. Configuração do Supabase

### 1.1 Executar Migrations em Produção

As migrations devem ser executadas no banco de dados de produção antes do deploy da aplicação.

#### Opção 1: Via Supabase CLI (Recomendado)

```bash
# 1. Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Login no Supabase
supabase login

# 3. Link com o projeto de produção
supabase link --project-ref your-project-ref

# 4. Verificar migrations pendentes
supabase db diff

# 5. Aplicar todas as migrations
supabase db push

# 6. Verificar que migrations foram aplicadas
supabase db remote commit
```

**Vantagens**:
- ✅ Controle de versão das migrations
- ✅ Rollback facilitado
- ✅ Histórico de mudanças
- ✅ Validação antes de aplicar

#### Opção 2: Via SQL Editor no Supabase Dashboard

```bash
# 1. Acesse o Supabase Dashboard
# 2. Vá em SQL Editor
# 3. Clique em "New query"
# 4. Execute as migrations na ordem:

# Primeiro: Migration da tabela media
# Copie e cole o conteúdo de:
# supabase/migrations/20260306_media_processing_pipeline.sql

# Segundo: Migration do bucket storage
# Copie e cole o conteúdo de:
# supabase/migrations/20260306_media_storage_bucket.sql

# 5. Clique em "Run" para cada migration
```

**Vantagens**:
- ✅ Interface visual
- ✅ Não requer CLI instalado
- ✅ Feedback imediato de erros

**Desvantagens**:
- ❌ Sem controle de versão automático
- ❌ Rollback manual
- ❌ Risco de executar migrations fora de ordem

#### Opção 3: Via psql (Avançado)

```bash
# 1. Obter string de conexão do Supabase
# Dashboard > Settings > Database > Connection string

# 2. Conectar ao banco
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 3. Executar migrations
\i supabase/migrations/20260306_media_processing_pipeline.sql
\i supabase/migrations/20260306_media_storage_bucket.sql

# 4. Verificar tabelas criadas
\dt media

# 5. Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'media';

# 6. Sair
\q
```

#### Verificação Pós-Migration

Após executar as migrations, verifique que tudo foi criado corretamente:

```sql
-- Verificar tabela media existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'media'
);

-- Verificar colunas da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'media'
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'media';

-- Verificar RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'media';

-- Verificar policies RLS
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'media';

-- Verificar trigger updated_at
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'media';

-- Verificar bucket storage
SELECT id, name, public
FROM storage.buckets
WHERE name = 'media';

-- Verificar policies do storage
SELECT name, definition
FROM storage.policies
WHERE bucket_id = 'media';
```

#### Rollback de Migrations (Se Necessário)

Se algo der errado, você pode fazer rollback:

```sql
-- Remover tabela media
DROP TABLE IF EXISTS media CASCADE;

-- Remover bucket storage
DELETE FROM storage.buckets WHERE name = 'media';

-- Remover função de trigger (se existir)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

Depois, corrija a migration e execute novamente.

#### Boas Práticas

- ✅ **Sempre faça backup** antes de executar migrations em produção
- ✅ **Teste migrations** em ambiente de staging primeiro
- ✅ **Execute migrations** em horário de baixo tráfego
- ✅ **Monitore** a execução e verifique logs
- ✅ **Tenha um plano de rollback** pronto
- ✅ **Documente** cada migration executada
- ✅ **Verifique** que todas as dependências foram criadas

#### Troubleshooting

**Erro: "relation already exists"**
```sql
-- A tabela já existe, verificar se está correta
SELECT * FROM media LIMIT 1;

-- Se precisar recriar, primeiro remover
DROP TABLE media CASCADE;
```

**Erro: "permission denied"**
```bash
# Verificar que está usando credenciais corretas
# Usar service_role key ou postgres user
```

**Erro: "function update_updated_at_column() does not exist"**
```sql
-- Criar a função manualmente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 1.1 Executar Migrations

Execute as migrations no banco de produção:

```bash
# Via Supabase CLI
supabase db push

# Ou via SQL Editor no Supabase Dashboard
# Execute os arquivos na ordem:
# 1. supabase/migrations/20260306_media_processing_pipeline.sql
# 2. supabase/migrations/20260306_media_storage_bucket.sql
```

### 1.2 Criar Bucket "media" em Produção

O bucket "media" é onde todos os arquivos de mídia serão armazenados. Ele deve ser criado e configurado corretamente antes do primeiro upload.

#### Opção 1: Via Supabase Dashboard (Mais Fácil)

1. **Acessar Storage**
   - Acesse o [Supabase Dashboard](https://app.supabase.com)
   - Selecione seu projeto de produção
   - Clique em **Storage** no menu lateral

2. **Criar Novo Bucket**
   - Clique no botão **"New bucket"**
   - Preencha os campos:

3. **Configurações do Bucket**
   ```
   Nome: media
   Public: ❌ Desabilitado (bucket privado)
   File size limit: 524288000 (500MB em bytes)
   Allowed MIME types: 
     image/jpeg
     image/png
     image/webp
     image/gif
     video/mp4
     video/quicktime
     video/x-msvideo
     video/webm
   ```

4. **Criar Bucket**
   - Clique em **"Create bucket"**
   - Aguarde confirmação

5. **Verificar Criação**
   - O bucket "media" deve aparecer na lista
   - Status deve estar "Active"

#### Opção 2: Via Migration SQL (Automático)

A migration `20260306_media_storage_bucket.sql` já cria o bucket automaticamente:

```sql
-- Criar bucket media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  false,
  524288000, -- 500MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;
```

Se você executou a migration, o bucket já foi criado. Pule para a seção de verificação.

#### Opção 3: Via Supabase API (Programático)

```bash
# Usando curl
curl -X POST 'https://your-project.supabase.co/storage/v1/bucket' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "media",
    "name": "media",
    "public": false,
    "file_size_limit": 524288000,
    "allowed_mime_types": [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/webm"
    ]
  }'
```

```javascript
// Usando JavaScript/TypeScript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const { data, error } = await supabase.storage.createBucket('media', {
  public: false,
  fileSizeLimit: 524288000, // 500MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm'
  ]
});

if (error) {
  console.error('Erro ao criar bucket:', error);
} else {
  console.log('Bucket criado com sucesso:', data);
}
```

#### Configurar Políticas de Acesso (RLS)

Após criar o bucket, configure as políticas de acesso:

```sql
-- Policy 1: Usuários podem fazer upload de suas próprias mídias
CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Usuários podem ler suas próprias mídias
CREATE POLICY "Users can read their own media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Usuários podem atualizar suas próprias mídias
CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Usuários podem deletar suas próprias mídias
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5: Permitir leitura pública de conteúdo com watermark
CREATE POLICY "Public read for watermarked content"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'media' AND
  (
    name LIKE '%_watermarked.webp' OR
    name LIKE '%/hls_watermarked/%'
  )
);
```

**Nota**: Estas policies já estão incluídas na migration `20260306_media_storage_bucket.sql`.

#### Verificar Bucket e Políticas

```sql
-- Verificar que bucket foi criado
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'media';

-- Resultado esperado:
-- id    | name  | public | file_size_limit | allowed_mime_types
-- media | media | false  | 524288000       | {image/jpeg, image/png, ...}

-- Verificar políticas do bucket
SELECT name, definition
FROM storage.policies
WHERE bucket_id = 'media';

-- Deve retornar 5 policies:
-- 1. Users can upload their own media
-- 2. Users can read their own media
-- 3. Users can update their own media
-- 4. Users can delete their own media
-- 5. Public read for watermarked content
```

#### Testar Upload e Download

```bash
# Testar upload (requer autenticação)
curl -X POST \
  'https://your-project.supabase.co/storage/v1/object/media/test-user-id/test-media-id/original/test.jpg' \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: image/jpeg" \
  --data-binary '@test-image.jpg'

# Testar download
curl 'https://your-project.supabase.co/storage/v1/object/media/test-user-id/test-media-id/original/test.jpg' \
  -H "Authorization: Bearer YOUR_USER_JWT"

# Testar signed URL
curl -X POST \
  'https://your-project.supabase.co/storage/v1/object/sign/media/test-user-id/test-media-id/original/test.jpg' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"expiresIn": 3600}'
```

#### Estrutura de Pastas no Bucket

O bucket "media" seguirá esta estrutura:

```
media/
├── {userId}/                          # ID do usuário (UUID)
│   ├── {mediaId}/                     # ID da mídia (UUID)
│   │   ├── original/                  # Arquivo original
│   │   │   └── {filename}.{ext}       # Nome original do arquivo
│   │   ├── images/                    # Variantes de imagem
│   │   │   ├── avatar_64.webp
│   │   │   ├── thumb_240.webp
│   │   │   ├── lightbox_600.webp
│   │   │   ├── lightbox_600_watermarked.webp
│   │   │   ├── large_1200.webp
│   │   │   └── large_1200_watermarked.webp
│   │   ├── hls/                       # Streams HLS sem watermark
│   │   │   ├── 360p/
│   │   │   │   ├── segment_000.ts
│   │   │   │   ├── segment_001.ts
│   │   │   │   └── playlist.m3u8
│   │   │   ├── 720p/
│   │   │   │   └── ...
│   │   │   ├── 1080p/                 # Apenas se vídeo original >= 1080p
│   │   │   │   └── ...
│   │   │   └── master.m3u8
│   │   └── hls_watermarked/           # Streams HLS com watermark
│   │       └── ...
```

#### Configurações Avançadas

**CORS (Cross-Origin Resource Sharing)**

Se precisar acessar o storage de domínios diferentes:

```sql
-- Configurar CORS no bucket
UPDATE storage.buckets
SET cors_allowed_origins = ARRAY['https://your-domain.com', 'https://www.your-domain.com']
WHERE name = 'media';
```

**Cache Control**

Configurar headers de cache para otimizar performance:

```sql
-- Configurar cache headers
UPDATE storage.buckets
SET cache_control = 'public, max-age=31536000, immutable'
WHERE name = 'media';
```

**Limites de Taxa (Rate Limiting)**

O Supabase já aplica rate limiting por padrão:
- Free tier: 50 requests/segundo
- Pro tier: 200 requests/segundo
- Enterprise: Customizável

#### Monitoramento do Storage

**Via Dashboard**:
1. Acesse Storage > Usage
2. Monitore:
   - Total storage usado
   - Número de arquivos
   - Bandwidth usado
   - Requests por segundo

**Via SQL**:
```sql
-- Ver tamanho total do bucket
SELECT 
  bucket_id,
  COUNT(*) as total_files,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
WHERE bucket_id = 'media'
GROUP BY bucket_id;

-- Ver arquivos por usuário
SELECT 
  (storage.foldername(name))[1] as user_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
WHERE bucket_id = 'media'
GROUP BY user_id
ORDER BY SUM((metadata->>'size')::bigint) DESC
LIMIT 10;
```

#### Limpeza e Manutenção

**Remover arquivos órfãos** (arquivos sem registro no banco):

```sql
-- Encontrar arquivos órfãos
SELECT o.name
FROM storage.objects o
WHERE o.bucket_id = 'media'
AND NOT EXISTS (
  SELECT 1 FROM media m
  WHERE o.name LIKE '%' || m.id || '%'
);

-- Deletar arquivos órfãos (cuidado!)
DELETE FROM storage.objects
WHERE bucket_id = 'media'
AND NOT EXISTS (
  SELECT 1 FROM media m
  WHERE name LIKE '%' || m.id || '%'
);
```

**Remover mídias antigas** (opcional):

```sql
-- Deletar mídias com status "failed" mais antigas que 30 dias
DELETE FROM media
WHERE status = 'failed'
AND created_at < NOW() - INTERVAL '30 days';

-- Nota: Os arquivos no storage serão deletados automaticamente
-- devido ao ON DELETE CASCADE nas foreign keys
```

#### Troubleshooting

**Erro: "Bucket already exists"**
```sql
-- Verificar se bucket existe
SELECT * FROM storage.buckets WHERE name = 'media';

-- Se existir, apenas configurar policies
```

**Erro: "Permission denied"**
```bash
# Verificar que está usando service_role key
# Não é possível criar buckets com anon key
```

**Erro: "Invalid MIME type"**
```sql
-- Atualizar tipos MIME permitidos
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm'
]
WHERE name = 'media';
```

**Upload falha com 413 (Payload Too Large)**
```sql
-- Aumentar limite de tamanho
UPDATE storage.buckets
SET file_size_limit = 1048576000 -- 1GB
WHERE name = 'media';
```

### 1.2 Criar Bucket "media"

**Opção 1: Via Supabase Dashboard**

1. Acesse Storage no Supabase Dashboard
2. Clique em "New bucket"
3. Nome: `media`
4. Public: `false` (privado)
5. File size limit: `524288000` (500MB)
6. Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif, video/mp4, video/quicktime, video/x-msvideo, video/webm`

**Opção 2: Via SQL**

A migration `20260306_media_storage_bucket.sql` já cria o bucket automaticamente.

### 1.3 Verificar RLS Policies

Verifique se as policies foram criadas corretamente:

```sql
-- Verificar policies da tabela media
SELECT * FROM pg_policies WHERE tablename = 'media';

-- Verificar policies do storage
SELECT * FROM storage.policies WHERE bucket_id = 'media';
```

## 2. Configuração de Variáveis de Ambiente

### 2.1 Variáveis Obrigatórias

Estas variáveis são **essenciais** para o funcionamento do sistema:

```bash
# Supabase - Configuração do Cliente (Frontend + Backend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase - Service Role Key (APENAS Backend/Worker)
# ⚠️ NUNCA exponha esta chave no frontend!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URL da Aplicação (para callbacks e redirects)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Ambiente
NODE_ENV=production
```

### 2.2 Variáveis Opcionais do Worker

Estas variáveis permitem ajustar o comportamento do worker:

```bash
# Número máximo de jobs processados simultaneamente
# Padrão: 3
# Aumentar para processar mais jobs em paralelo (requer mais CPU/memória)
MEDIA_WORKER_CONCURRENCY=3

# Intervalo de polling da fila em milissegundos
# Padrão: 1000 (1 segundo)
# Reduzir para processamento mais responsivo (aumenta uso de CPU)
MEDIA_WORKER_POLL_INTERVAL=1000
```

### 2.3 Outras Variáveis do Sistema

Estas variáveis já podem estar configuradas no seu projeto:

```bash
# Stripe (para funcionalidades de pagamento)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (para SMS/verificação)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=VA...
TWILIO_PHONE_NUMBER=+1234567890

# Cron Jobs (para tarefas agendadas)
CRON_SECRET=your-secret-key

# Debug/Logging
DEBUG=false
```

### 2.4 Como Obter as Credenciais do Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie as seguintes informações:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **IMPORTANTE**: 
- A `SUPABASE_SERVICE_ROLE_KEY` bypassa todas as políticas RLS
- Nunca exponha esta chave no código frontend
- Use apenas em código server-side e no worker
- Mantenha esta chave segura e rotacione periodicamente

### 2.5 Configuração por Ambiente

#### Desenvolvimento Local (.env.local)

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
DEBUG=true
```

#### Produção (Vercel)

1. Acesse o Vercel Dashboard
2. Vá em **Settings** > **Environment Variables**
3. Adicione cada variável com o valor apropriado
4. Selecione o ambiente: Production, Preview, ou Development

#### Produção (Servidor Próprio)

**Opção 1: Arquivo .env**
```bash
# Criar arquivo .env na raiz do projeto
nano .env

# Adicionar variáveis
NEXT_PUBLIC_SUPABASE_URL=...
# ... outras variáveis
```

**Opção 2: Variáveis de Sistema**
```bash
# Adicionar ao ~/.bashrc ou ~/.profile
export NEXT_PUBLIC_SUPABASE_URL="https://..."
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Recarregar
source ~/.bashrc
```

**Opção 3: PM2 Ecosystem File**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'media-app',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_SUPABASE_URL: 'https://...',
        SUPABASE_SERVICE_ROLE_KEY: 'eyJ...',
        // ... outras variáveis
      }
    },
    {
      name: 'media-worker',
      script: 'npm',
      args: 'run worker',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_SUPABASE_URL: 'https://...',
        SUPABASE_SERVICE_ROLE_KEY: 'eyJ...',
        MEDIA_WORKER_CONCURRENCY: '3',
        // ... outras variáveis
      }
    }
  ]
};

// Iniciar com: pm2 start ecosystem.config.js
```

**Opção 4: Docker Environment File**
```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
# ... outras variáveis

# Usar no docker-compose.yml:
# env_file:
#   - .env.production
```

### 2.6 Validação das Variáveis

Após configurar, valide que todas as variáveis estão corretas:

```bash
# Testar conexão com Supabase
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/"

# Verificar variáveis no Node.js
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"

# Verificar variáveis no PM2
pm2 env media-worker
```

### 2.7 Segurança das Variáveis

**Boas Práticas**:
- ✅ Use variáveis de ambiente, nunca hardcode credenciais
- ✅ Adicione `.env*` ao `.gitignore`
- ✅ Use diferentes credenciais para dev/staging/prod
- ✅ Rotacione chaves periodicamente
- ✅ Limite acesso às variáveis de produção
- ✅ Use secrets management em produção (AWS Secrets Manager, Vault, etc.)

**Nunca Faça**:
- ❌ Commitar arquivos `.env` no Git
- ❌ Expor `SUPABASE_SERVICE_ROLE_KEY` no frontend
- ❌ Compartilhar credenciais por email/chat
- ❌ Usar mesmas credenciais em dev e prod
- ❌ Logar valores de variáveis sensíveis

## 2. Configuração de Variáveis de Ambiente

### 2.1 Variáveis Necessárias

Crie/atualize o arquivo `.env.local` (desenvolvimento) ou configure no seu provedor de hosting:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Opcional: Configurações do worker
MEDIA_WORKER_CONCURRENCY=3
MEDIA_WORKER_POLL_INTERVAL=1000
```

### 2.2 Obter Credenciais do Supabase

1. Acesse o Supabase Dashboard
2. Vá em Settings > API
3. Copie:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **IMPORTANTE**: Nunca exponha a `SUPABASE_SERVICE_ROLE_KEY` no frontend!

## 3. Instalação do FFmpeg no Servidor de Produção

O FFmpeg é **essencial** para o processamento de vídeos. Ele deve estar instalado e acessível no PATH do servidor onde o worker será executado.

### 3.1 Verificar se FFmpeg já está Instalado

```bash
# Verificar se FFmpeg está instalado
ffmpeg -version

# Verificar localização
which ffmpeg

# Verificar codecs disponíveis
ffmpeg -codecs | grep h264
ffmpeg -codecs | grep aac
```

Se o comando retornar a versão do FFmpeg (6.0 ou superior), você pode pular para a seção de verificação.

### 3.2 Instalação por Sistema Operacional

#### Ubuntu/Debian

```bash
# Atualizar repositórios
sudo apt-get update

# Instalar FFmpeg
sudo apt-get install -y ffmpeg

# Verificar instalação
ffmpeg -version

# Instalar codecs adicionais (opcional)
sudo apt-get install -y libx264-dev libx265-dev libvpx-dev libmp3lame-dev
```

**Versão Específica** (se precisar de versão mais recente):

```bash
# Adicionar PPA do FFmpeg
sudo add-apt-repository ppa:savoury1/ffmpeg4
sudo apt-get update

# Instalar versão específica
sudo apt-get install -y ffmpeg
```

#### CentOS/RHEL/Fedora

```bash
# Habilitar repositório EPEL
sudo yum install -y epel-release

# Instalar FFmpeg
sudo yum install -y ffmpeg ffmpeg-devel

# Verificar instalação
ffmpeg -version
```

**CentOS 8/RHEL 8**:

```bash
# Habilitar PowerTools
sudo dnf config-manager --set-enabled powertools

# Instalar RPM Fusion
sudo dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-8.noarch.rpm

# Instalar FFmpeg
sudo dnf install -y ffmpeg ffmpeg-devel

# Verificar instalação
ffmpeg -version
```

#### macOS (Desenvolvimento Local)

```bash
# Usando Homebrew
brew install ffmpeg

# Com codecs adicionais
brew install ffmpeg --with-libvpx --with-libvorbis --with-fdk-aac

# Verificar instalação
ffmpeg -version
```

#### Alpine Linux (Docker)

```dockerfile
# No Dockerfile
FROM node:18-alpine

# Instalar FFmpeg
RUN apk add --no-cache ffmpeg

# Verificar instalação
RUN ffmpeg -version
```

#### Windows (Desenvolvimento Local)

1. **Baixar FFmpeg**:
   - Acesse https://ffmpeg.org/download.html
   - Baixe a versão Windows (builds by BtbN recomendado)
   - Extraia o arquivo ZIP

2. **Adicionar ao PATH**:
   ```powershell
   # Adicionar ao PATH do sistema
   $env:Path += ";C:\ffmpeg\bin"
   
   # Verificar
   ffmpeg -version
   ```

3. **Ou usar Chocolatey**:
   ```powershell
   choco install ffmpeg
   ```

### 3.3 Compilar FFmpeg do Código Fonte (Avançado)

Se precisar de configurações específicas ou hardware acceleration:

```bash
# Instalar dependências de build
sudo apt-get install -y build-essential yasm cmake libtool libc6 libc6-dev \
  unzip wget libnuma1 libnuma-dev

# Baixar FFmpeg
cd /tmp
wget https://ffmpeg.org/releases/ffmpeg-6.0.tar.xz
tar -xf ffmpeg-6.0.tar.xz
cd ffmpeg-6.0

# Configurar com opções desejadas
./configure \
  --prefix=/usr/local \
  --enable-gpl \
  --enable-libx264 \
  --enable-libx265 \
  --enable-libvpx \
  --enable-libmp3lame \
  --enable-nonfree

# Compilar (pode demorar)
make -j$(nproc)

# Instalar
sudo make install

# Verificar
ffmpeg -version
```

### 3.4 Configuração de Hardware Acceleration

Para melhor performance, habilite aceleração por hardware:

#### NVIDIA GPU (NVENC)

```bash
# Instalar drivers NVIDIA
sudo apt-get install -y nvidia-driver-525

# Verificar suporte
ffmpeg -hwaccels

# Deve listar: cuda, nvdec, nvenc

# Testar encoding com GPU
ffmpeg -hwaccel cuda -i input.mp4 -c:v h264_nvenc output.mp4
```

#### Intel Quick Sync (VAAPI)

```bash
# Instalar VAAPI
sudo apt-get install -y vainfo libva-dev

# Verificar suporte
vainfo

# Testar encoding com VAAPI
ffmpeg -hwaccel vaapi -i input.mp4 -c:v h264_vaapi output.mp4
```

#### macOS (VideoToolbox)

```bash
# Já vem habilitado no macOS
# Testar encoding com VideoToolbox
ffmpeg -hwaccel videotoolbox -i input.mp4 -c:v h264_videotoolbox output.mp4
```

### 3.5 Verificação Completa

Após instalar, verifique que todos os recursos necessários estão disponíveis:

```bash
# 1. Verificar versão (deve ser 6.0+)
ffmpeg -version

# 2. Verificar codecs de vídeo
ffmpeg -codecs | grep -E "h264|h265|vp8|vp9"

# Deve mostrar:
# DEV.LS h264    H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10

# 3. Verificar codecs de áudio
ffmpeg -codecs | grep -E "aac|mp3"

# Deve mostrar:
# DEA.L. aac     AAC (Advanced Audio Coding)

# 4. Verificar formatos
ffmpeg -formats | grep -E "mp4|m3u8|ts"

# Deve mostrar:
# E mp4     MP4 (MPEG-4 Part 14)
# E hls     Apple HTTP Live Streaming

# 5. Verificar filtros
ffmpeg -filters | grep -E "scale|drawtext"

# Deve mostrar:
# scale     Scale the input video size and/or convert the image format
# drawtext  Draw text on top of video frames

# 6. Testar conversão simples
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
  -c:v libx264 -preset fast -f mp4 /tmp/test.mp4

# Deve criar arquivo /tmp/test.mp4 sem erros

# 7. Testar HLS
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
  -c:v libx264 -preset fast \
  -hls_time 6 -hls_playlist_type vod \
  -f hls /tmp/test.m3u8

# Deve criar playlist e segmentos

# 8. Testar watermark (drawtext)
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
  -vf "drawtext=text='Test':fontsize=48:fontcolor=white@0.5:x=(w-text_w)/2:y=(h-text_h)/2" \
  -c:v libx264 -preset fast -f mp4 /tmp/test_watermark.mp4

# Deve criar vídeo com texto sobreposto
```

### 3.6 Configuração no Docker

Se estiver usando Docker, adicione FFmpeg ao Dockerfile:

```dockerfile
# Dockerfile
FROM node:18-alpine

# Instalar FFmpeg
RUN apk add --no-cache ffmpeg

# Verificar instalação
RUN ffmpeg -version

# Copiar código da aplicação
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Build Next.js
RUN npm run build

# Expor porta
EXPOSE 3000

# Comando padrão (app)
CMD ["npm", "start"]
```

**Dockerfile separado para Worker**:

```dockerfile
# Dockerfile.worker
FROM node:18-alpine

# Instalar FFmpeg com mais codecs
RUN apk add --no-cache \
  ffmpeg \
  x264 \
  x265

# Verificar instalação
RUN ffmpeg -version

# Copiar código
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Comando para worker
CMD ["npm", "run", "worker"]
```

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - MEDIA_WORKER_CONCURRENCY=3
    restart: always
    # Limitar recursos do worker
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

### 3.7 Otimização de Performance

**Configurar Presets**:

O worker usa preset "fast" por padrão, mas você pode ajustar:

```bash
# Presets disponíveis (do mais rápido ao mais lento):
# ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow

# Mais rápido = menor qualidade/compressão
# Mais lento = melhor qualidade/compressão

# Para produção, "fast" é um bom equilíbrio
```

**Configurar Threads**:

```bash
# FFmpeg usa todos os cores por padrão
# Para limitar (útil em servidores compartilhados):
ffmpeg -threads 4 -i input.mp4 output.mp4
```

**Configurar Buffer**:

```bash
# Aumentar buffer para arquivos grandes
ffmpeg -i input.mp4 -bufsize 2M output.mp4
```

### 3.8 Troubleshooting

**Erro: "ffmpeg: command not found"**

```bash
# Verificar se está no PATH
echo $PATH

# Adicionar ao PATH (temporário)
export PATH=$PATH:/usr/local/bin

# Adicionar ao PATH (permanente)
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc
source ~/.bashrc
```

**Erro: "Unknown encoder 'libx264'"**

```bash
# Reinstalar FFmpeg com suporte a x264
sudo apt-get install -y libx264-dev
sudo apt-get install --reinstall ffmpeg

# Ou compilar do código fonte com --enable-libx264
```

**Erro: "Cannot find a valid device"**

```bash
# Problema com hardware acceleration
# Desabilitar ou usar software encoding

# Verificar dispositivos disponíveis
ls -la /dev/dri/
```

**Performance Ruim**

```bash
# 1. Verificar se está usando hardware acceleration
ffmpeg -hwaccels

# 2. Ajustar preset
# Usar "faster" ou "veryfast" em vez de "fast"

# 3. Reduzir concorrência do worker
# Configurar MEDIA_WORKER_CONCURRENCY=1 ou 2

# 4. Monitorar recursos
top
htop
```

**Erro: "Conversion failed"**

```bash
# Verificar arquivo de entrada
ffprobe input.mp4

# Testar conversão manual
ffmpeg -i input.mp4 -c:v libx264 -preset fast output.mp4

# Ver logs detalhados
ffmpeg -loglevel debug -i input.mp4 output.mp4
```

### 3.9 Monitoramento

**Verificar uso de FFmpeg**:

```bash
# Ver processos FFmpeg ativos
ps aux | grep ffmpeg

# Monitorar uso de CPU/memória
top -p $(pgrep ffmpeg | tr '\n' ',' | sed 's/,$//')

# Ver arquivos temporários
ls -lh /tmp/*.mp4 /tmp/*.ts
```

**Logs do FFmpeg**:

O worker captura logs do FFmpeg automaticamente. Para debug:

```bash
# Ver logs do worker
pm2 logs media-worker

# Filtrar apenas erros do FFmpeg
pm2 logs media-worker | grep -i error
```

### 3.10 Segurança

**Limitar Recursos**:

```bash
# Usar ulimit para limitar recursos do FFmpeg
ulimit -t 600  # Limite de 10 minutos de CPU
ulimit -v 4194304  # Limite de 4GB de memória virtual
```

**Validar Entrada**:

O worker já valida tipos de arquivo, mas você pode adicionar validação extra:

```bash
# Verificar se arquivo é realmente um vídeo
ffprobe -v error -select_streams v:0 -show_entries stream=codec_type -of default=nw=1:nk=1 input.mp4

# Deve retornar: video
```

**Sandbox** (opcional):

```bash
# Executar FFmpeg em container isolado
docker run --rm -v /tmp:/tmp jrottenberg/ffmpeg:6.0-alpine \
  -i /tmp/input.mp4 -c:v libx264 /tmp/output.mp4
```

## 3. Instalação do FFmpeg no Servidor

### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y ffmpeg

# Verificar instalação
ffmpeg -version
```

### CentOS/RHEL

```bash
sudo yum install -y epel-release
sudo yum install -y ffmpeg

# Verificar instalação
ffmpeg -version
```

### Docker

Se estiver usando Docker, adicione ao Dockerfile:

```dockerfile
FROM node:18-alpine

# Instalar FFmpeg
RUN apk add --no-cache ffmpeg

# ... resto do Dockerfile
```

## 4. Deploy da Aplicação Next.js

### 4.1 Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Configurar variáveis de ambiente no Vercel Dashboard
# Settings > Environment Variables
```

### 4.2 Servidor Próprio

```bash
# Build da aplicação
npm run build

# Iniciar em produção
npm run start

# Ou usar PM2
pm2 start npm --name "media-app" -- start
pm2 save
pm2 startup
```

## 5. Deploy do Worker

O worker deve rodar como um processo separado no servidor.

### 5.1 Usando PM2 (Recomendado)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar worker
pm2 start npm --name "media-worker" -- run worker

# Configurar para iniciar no boot
pm2 save
pm2 startup

# Monitorar
pm2 logs media-worker
pm2 status
```

### 5.2 Usando systemd

Crie o arquivo `/etc/systemd/system/media-worker.service`:

```ini
[Unit]
Description=Media Processing Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/your-app
Environment="NODE_ENV=production"
Environment="NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
Environment="SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
ExecStart=/usr/bin/npm run worker
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Ativar e iniciar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable media-worker
sudo systemctl start media-worker

# Verificar status
sudo systemctl status media-worker

# Ver logs
sudo journalctl -u media-worker -f
```

### 5.3 Usando Docker

Crie um `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    command: npm start

  worker:
    build: .
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    command: npm run worker
    restart: always
```

Iniciar:

```bash
docker-compose up -d
```

## 6. Configuração de Políticas do Bucket

### 6.1 Verificar Políticas

```sql
SELECT * FROM storage.policies WHERE bucket_id = 'media';
```

### 6.2 Ajustar Políticas (se necessário)

As políticas já foram criadas pela migration, mas você pode ajustá-las:

```sql
-- Permitir leitura pública de variantes com watermark
CREATE POLICY "Public read for watermarked content"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[3] = 'images' AND
    name LIKE '%_watermarked.webp'
  );
```

## 7. Monitoramento

### 7.1 Logs do Worker

```bash
# PM2
pm2 logs media-worker

# systemd
sudo journalctl -u media-worker -f

# Docker
docker-compose logs -f worker
```

### 7.2 Métricas

Monitore:
- Tamanho da fila de jobs
- Taxa de sucesso/falha
- Tempo médio de processamento
- Uso de CPU/memória do worker
- Uso de storage no Supabase

### 7.3 Alertas

Configure alertas para:
- Worker parado
- Fila com > 100 jobs
- Taxa de falha > 5%
- Storage > 80% do limite

## 8. Backup

### 8.1 Banco de Dados

O Supabase faz backup automático, mas você pode fazer backups manuais:

```bash
# Via Supabase CLI
supabase db dump -f backup.sql

# Restaurar
supabase db reset
psql -h your-db-host -U postgres -d postgres -f backup.sql
```

### 8.2 Storage

Configure backup do bucket `media`:

```bash
# Usar rclone ou similar para backup periódico
rclone sync supabase:media /backup/media
```

## 9. Escalabilidade

### 9.1 Múltiplos Workers

Para processar mais jobs simultaneamente, execute múltiplas instâncias do worker:

```bash
# PM2 com cluster mode
pm2 start npm --name "media-worker" -i 3 -- run worker
```

⚠️ **Nota**: A implementação atual usa fila in-memory. Para múltiplos workers, migre para Redis (Bull/BullMQ).

### 9.2 Migrar para Redis Queue

Para produção com múltiplos workers:

1. Instalar Bull:
```bash
npm install bull
npm install --save-dev @types/bull
```

2. Configurar Redis:
```bash
# Variável de ambiente
REDIS_URL=redis://localhost:6379
```

3. Atualizar `job-queue.service.ts` para usar Bull

## 10. Troubleshooting

### Worker não inicia

```bash
# Verificar logs
pm2 logs media-worker

# Verificar se FFmpeg está instalado
ffmpeg -version

# Verificar variáveis de ambiente
pm2 env media-worker
```

### Processamento falha

```bash
# Ver logs detalhados
pm2 logs media-worker --lines 100

# Verificar espaço em disco
df -h

# Verificar permissões de /tmp
ls -la /tmp
```

### Storage cheio

```bash
# Verificar uso no Supabase Dashboard
# Storage > Usage

# Limpar mídias antigas (se necessário)
DELETE FROM media WHERE created_at < NOW() - INTERVAL '90 days' AND status = 'failed';
```

## 11. Checklist de Deploy

### 11.1 Pré-Deploy

**Variáveis de Ambiente**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada (apenas servidor)
- [ ] `NEXT_PUBLIC_APP_URL` configurada (para callbacks)
- [ ] `NODE_ENV=production` configurada
- [ ] Variáveis opcionais do worker:
  - [ ] `MEDIA_WORKER_CONCURRENCY` (padrão: 3)
  - [ ] `MEDIA_WORKER_POLL_INTERVAL` (padrão: 1000ms)

**Banco de Dados**
- [ ] Migration `20260306_media_processing_pipeline.sql` executada
- [ ] Migration `20260306_media_storage_bucket.sql` executada
- [ ] Tabela `media` criada com todos os campos
- [ ] Índices criados (idx_media_user_id, idx_media_status, idx_media_created_at, idx_media_type)
- [ ] Trigger `update_media_updated_at` criado
- [ ] RLS habilitado na tabela `media`
- [ ] Policies RLS criadas (SELECT, INSERT, UPDATE, DELETE)
- [ ] Testar policies com diferentes usuários

**Supabase Storage**
- [ ] Bucket "media" criado
- [ ] Bucket configurado como privado (public: false)
- [ ] Limite de tamanho configurado (500MB)
- [ ] Tipos MIME permitidos configurados
- [ ] Policies do storage criadas
- [ ] Testar upload/download
- [ ] Testar geração de signed URLs

**Servidor**
- [ ] FFmpeg instalado e acessível no PATH
- [ ] Verificar versão do FFmpeg (6.0+)
- [ ] Testar comando FFmpeg básico
- [ ] Espaço em disco suficiente para processamento temporário
- [ ] Permissões de escrita em /tmp ou diretório temporário

### 11.2 Deploy da Aplicação

**Build e Deploy**
- [ ] Executar `npm run build` sem erros
- [ ] Testar aplicação localmente com `npm run start`
- [ ] Deploy para ambiente de produção (Vercel/servidor)
- [ ] Verificar que aplicação está acessível
- [ ] Verificar logs de inicialização

**Testes Pós-Deploy**
- [ ] Endpoint `/api/media/upload` acessível
- [ ] Endpoint `/api/media/{id}` acessível
- [ ] Endpoint `/api/media/{id}/reprocess` acessível
- [ ] Autenticação funcionando
- [ ] RLS policies funcionando

### 11.3 Deploy do Worker

**Escolher Método de Deploy**
- [ ] Opção escolhida: PM2 / systemd / Docker
- [ ] Configuração criada para método escolhido
- [ ] Variáveis de ambiente configuradas no worker

**PM2 (se escolhido)**
- [ ] PM2 instalado globalmente
- [ ] Worker iniciado com `pm2 start npm --name "media-worker" -- run worker`
- [ ] `pm2 save` executado
- [ ] `pm2 startup` configurado
- [ ] Verificar status com `pm2 status`
- [ ] Verificar logs com `pm2 logs media-worker`

**systemd (se escolhido)**
- [ ] Arquivo de serviço criado em `/etc/systemd/system/media-worker.service`
- [ ] `systemctl daemon-reload` executado
- [ ] `systemctl enable media-worker` executado
- [ ] `systemctl start media-worker` executado
- [ ] Verificar status com `systemctl status media-worker`
- [ ] Verificar logs com `journalctl -u media-worker -f`

**Docker (se escolhido)**
- [ ] Dockerfile criado com FFmpeg
- [ ] docker-compose.yml configurado
- [ ] Imagem construída com sucesso
- [ ] Containers iniciados com `docker-compose up -d`
- [ ] Verificar logs com `docker-compose logs -f worker`

### 11.4 Monitoramento e Logs

**Configuração de Logs**
- [ ] Logs do worker acessíveis e legíveis
- [ ] Logs da aplicação Next.js configurados
- [ ] Rotação de logs configurada (se necessário)
- [ ] Nível de log apropriado (info em produção)

**Monitoramento**
- [ ] Monitorar CPU e memória do worker
- [ ] Monitorar tamanho da fila de jobs
- [ ] Monitorar taxa de sucesso/falha
- [ ] Monitorar tempo médio de processamento
- [ ] Monitorar uso de storage no Supabase

**Alertas**
- [ ] Alerta para worker parado
- [ ] Alerta para fila com > 100 jobs
- [ ] Alerta para taxa de falha > 5%
- [ ] Alerta para storage > 80% do limite
- [ ] Alerta para erros críticos

### 11.5 Testes em Produção

**Teste de Upload de Imagem**
- [ ] Upload de imagem JPEG bem-sucedido
- [ ] Status inicial "queued" retornado
- [ ] Worker processa a imagem
- [ ] Status atualizado para "processing"
- [ ] Status final "ready" após processamento
- [ ] Todas as 6 variantes geradas (avatar_64, thumb_240, lightbox_600, lightbox_600_watermarked, large_1200, large_1200_watermarked)
- [ ] Watermark aplicado apenas em lightbox_600 e large_1200
- [ ] URLs das variantes acessíveis

**Teste de Upload de Vídeo**
- [ ] Upload de vídeo MP4 bem-sucedido
- [ ] Status inicial "queued" retornado
- [ ] Worker processa o vídeo
- [ ] Thumbnail extraído no segundo 2
- [ ] HLS streams gerados (360p, 720p, 1080p se aplicável)
- [ ] Master playlists criados (normal e watermarked)
- [ ] Streams HLS reproduzíveis
- [ ] Watermark aplicado nos streams watermarked

**Teste de Segurança**
- [ ] Usuário não autenticado recebe 401
- [ ] Usuário não pode acessar mídia de outro usuário (403)
- [ ] Signed URLs expiram após 1 hora
- [ ] RLS policies impedem acesso não autorizado

**Teste de Erros**
- [ ] Upload de tipo inválido rejeitado (400)
- [ ] Upload de arquivo muito grande rejeitado (400)
- [ ] Upload de arquivo vazio rejeitado (400)
- [ ] Processamento de arquivo corrompido falha gracefully
- [ ] Status "failed" com error_message preenchido

### 11.6 Backup e Recuperação

**Backup**
- [ ] Backup automático do Supabase configurado
- [ ] Backup manual do banco testado
- [ ] Backup do bucket "media" configurado (opcional)
- [ ] Procedimento de restauração documentado

**Recuperação de Desastres**
- [ ] Plano de recuperação documentado
- [ ] Tempo de recuperação estimado (RTO)
- [ ] Ponto de recuperação estimado (RPO)
- [ ] Procedimento de failover testado (se aplicável)

### 11.7 Documentação

**Documentação Técnica**
- [ ] MEDIA_DEPLOYMENT.md atualizado
- [ ] MEDIA_PROCESSING.md disponível
- [ ] Variáveis de ambiente documentadas
- [ ] Procedimentos de troubleshooting documentados

**Documentação Operacional**
- [ ] Runbook para operações comuns
- [ ] Procedimento de restart do worker
- [ ] Procedimento de limpeza de storage
- [ ] Procedimento de reprocessamento em massa

### 11.8 Pós-Deploy

**Validação Final**
- [ ] Todos os testes passando
- [ ] Monitoramento funcionando
- [ ] Alertas testados
- [ ] Equipe treinada
- [ ] Documentação revisada

**Otimização**
- [ ] Performance monitorada por 24h
- [ ] Ajustes de concorrência se necessário
- [ ] Ajustes de recursos se necessário
- [ ] Plano de escalabilidade definido

## 12. Teste em Produção

Após o deploy, teste o fluxo completo:

```bash
# 1. Upload de imagem
curl -X POST https://your-domain.com/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg"

# 2. Verificar status
curl https://your-domain.com/api/media/{mediaId} \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Verificar worker está processando
pm2 logs media-worker
```

## Suporte

Para problemas ou dúvidas:
1. Verificar logs do worker
2. Verificar logs do Supabase
3. Consultar MEDIA_PROCESSING.md para troubleshooting
4. Verificar issues no repositório
