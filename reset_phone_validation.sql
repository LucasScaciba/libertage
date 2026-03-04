-- Script para resetar a validação de telefone de um usuário
-- Use este script no Supabase SQL Editor para testar o fluxo de validação

-- OPÇÃO 1: Resetar um usuário específico por email
UPDATE users 
SET 
  phone_verified_at = NULL, 
  phone_security = NULL, 
  phone_public = NULL,
  phone_attempts_today = 0,
  phone_last_attempt_at = NULL
WHERE email = 'seu-email@gmail.com'; -- SUBSTITUA pelo seu email

-- OPÇÃO 2: Resetar todos os usuários (CUIDADO EM PRODUÇÃO!)
-- UPDATE users 
-- SET 
--   phone_verified_at = NULL, 
--   phone_security = NULL, 
--   phone_public = NULL,
--   phone_attempts_today = 0,
--   phone_last_attempt_at = NULL;

-- Verificar o resultado
SELECT 
  id, 
  email, 
  phone_verified_at, 
  phone_public,
  onboarding_completed,
  created_at
FROM users 
WHERE email = 'seu-email@gmail.com'; -- SUBSTITUA pelo seu email
