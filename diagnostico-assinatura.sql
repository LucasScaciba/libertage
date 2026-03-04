-- Script de Diagnóstico de Assinatura
-- Execute no Supabase SQL Editor

-- 1. Verificar se os Price IDs foram atualizados
SELECT 
    code, 
    name, 
    stripe_price_id,
    price as price_display
FROM plans 
WHERE code IN ('free', 'premium', 'black')
ORDER BY 
    CASE code 
        WHEN 'free' THEN 1 
        WHEN 'premium' THEN 2 
        WHEN 'black' THEN 3 
    END;

-- 2. Verificar assinaturas no banco (substitua SEU_EMAIL pelo seu email)
SELECT 
    s.id,
    s.user_id,
    u.email,
    u.name,
    p.code as plan_code,
    p.name as plan_name,
    s.status,
    s.stripe_customer_id,
    s.stripe_subscription_id,
    s.created_at,
    s.current_period_end
FROM subscriptions s
JOIN users u ON s.user_id = u.id
JOIN plans p ON s.plan_id = p.id
WHERE u.email = 'SEU_EMAIL_AQUI'
ORDER BY s.created_at DESC;

-- 3. Verificar se há assinatura ativa
SELECT 
    u.email,
    u.name,
    p.code as current_plan,
    s.status,
    s.stripe_subscription_id
FROM users u
LEFT JOIN subscriptions s ON u.user_id = s.user_id AND s.status = 'active'
LEFT JOIN plans p ON s.plan_id = p.id
WHERE u.email = 'SEU_EMAIL_AQUI';

-- 4. Ver todas as assinaturas do usuário (histórico)
SELECT 
    p.code as plan_code,
    s.status,
    s.stripe_subscription_id,
    s.created_at,
    s.updated_at
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
JOIN users u ON s.user_id = u.id
WHERE u.email = 'SEU_EMAIL_AQUI'
ORDER BY s.created_at DESC;

-- 5. Verificar perfil do usuário
SELECT 
    u.email,
    u.name,
    u.onboarding_completed,
    pr.status as profile_status
FROM users u
LEFT JOIN profiles pr ON u.id = pr.user_id
WHERE u.email = 'SEU_EMAIL_AQUI';
