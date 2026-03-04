-- Script para Corrigir Assinatura Manualmente
-- Execute no Supabase SQL Editor

-- PASSO 1: Verificar se os Price IDs estão corretos
SELECT code, name, stripe_price_id 
FROM plans 
WHERE code IN ('premium', 'black');

-- Se os Price IDs estiverem errados, execute:
-- UPDATE plans SET stripe_price_id = 'price_1T74EQFR1necx3GA53Afvm58' WHERE code = 'premium';
-- UPDATE plans SET stripe_price_id = 'price_1T74EUFR1necx3GAJvkOX9js' WHERE code = 'black';

-- PASSO 2: Buscar o user_id pelo email
SELECT id, email, name, onboarding_completed 
FROM users 
WHERE email = 'creativescaciba@gmail.com';

-- PASSO 3: Verificar se já existe assinatura para esse usuário
SELECT s.*, p.code as plan_code, p.name as plan_name
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.user_id = (SELECT id FROM users WHERE email = 'creativescaciba@gmail.com');

-- PASSO 4: Inserir/Atualizar assinatura manualmente
-- Substitua USER_ID_AQUI pelo ID retornado no PASSO 2

DO $$
DECLARE
    v_user_id UUID;
    v_plan_id UUID;
    v_existing_sub_id UUID;
BEGIN
    -- Buscar user_id
    SELECT id INTO v_user_id 
    FROM users 
    WHERE email = 'creativescaciba@gmail.com';
    
    -- Buscar plan_id do Premium
    SELECT id INTO v_plan_id 
    FROM plans 
    WHERE code = 'premium';
    
    -- Verificar se já existe assinatura
    SELECT id INTO v_existing_sub_id
    FROM subscriptions
    WHERE user_id = v_user_id;
    
    IF v_existing_sub_id IS NOT NULL THEN
        -- Atualizar assinatura existente
        UPDATE subscriptions
        SET 
            plan_id = v_plan_id,
            stripe_customer_id = 'cus_U5F0ugHmrUcyZO',
            stripe_subscription_id = 'sub_1T74XCFR1necx3GAJENT4ZV7',
            status = 'active',
            current_period_start = '2025-01-01 19:00:52+00',
            current_period_end = '2025-02-01 19:00:52+00',
            updated_at = NOW()
        WHERE user_id = v_user_id;
        
        RAISE NOTICE 'Assinatura atualizada com sucesso!';
    ELSE
        -- Inserir nova assinatura
        INSERT INTO subscriptions (
            user_id,
            plan_id,
            stripe_customer_id,
            stripe_subscription_id,
            status,
            current_period_start,
            current_period_end
        ) VALUES (
            v_user_id,
            v_plan_id,
            'cus_U5F0ugHmrUcyZO',
            'sub_1T74XCFR1necx3GAJENT4ZV7',
            'active',
            '2025-01-01 19:00:52+00',
            '2025-02-01 19:00:52+00'
        );
        
        RAISE NOTICE 'Assinatura criada com sucesso!';
    END IF;
    
    -- Publicar perfil automaticamente
    UPDATE profiles
    SET status = 'published'
    WHERE user_id = v_user_id;
    
    RAISE NOTICE 'Perfil publicado!';
END $$;

-- PASSO 5: Verificar se funcionou
SELECT 
    u.email,
    u.name,
    p.code as plan_code,
    p.name as plan_name,
    s.status,
    s.stripe_subscription_id,
    s.current_period_end,
    pr.status as profile_status
FROM users u
JOIN subscriptions s ON u.id = s.user_id
JOIN plans p ON s.plan_id = p.id
LEFT JOIN profiles pr ON u.id = pr.user_id
WHERE u.email = 'creativescaciba@gmail.com';
