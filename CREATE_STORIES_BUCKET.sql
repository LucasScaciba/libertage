-- ============================================
-- SCRIPT PARA CRIAR BUCKET DE STORIES
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================

-- 1. Criar o bucket de stories
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories',
  'stories',
  true,
  18874368, -- 18 MB (limite máximo para stories)
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar RLS (Row Level Security) na tabela storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Stories are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own stories" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own stories" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own stories" ON storage.objects;

-- 4. Criar política: Qualquer pessoa pode visualizar stories (bucket público)
CREATE POLICY "Stories are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

-- 5. Criar política: Usuários autenticados podem fazer upload de seus próprios stories
CREATE POLICY "Users can upload their own stories"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'stories' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Criar política: Usuários podem atualizar seus próprios stories
CREATE POLICY "Users can update their own stories"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'stories'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Criar política: Usuários podem deletar seus próprios stories
CREATE POLICY "Users can delete their own stories"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'stories'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- VERIFICAÇÃO
-- Execute esta query para confirmar que o bucket foi criado:
-- SELECT * FROM storage.buckets WHERE id = 'stories';
-- ============================================
