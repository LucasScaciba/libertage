-- CORREÇÃO RÁPIDA - Execute este script completo no Supabase SQL Editor

-- 1. Atualizar Price IDs (se ainda não fez)
UPDATE plans SET stripe_price_id = 'price_1T74EQFR1necx3GA53Afvm58' WHERE code = 'premium';
UPDATE plans SET stripe_price_id = 'price_1T74EUFR1necx3GAJvkOX9js' WHERE code = 'black';

-- 2. Ativar assinatura Premium para creativescaciba@gmail.com
DO $$
DECLARE
    v_user_id UUID;
    v_plan_id UUID;
BEGIN
    -- Buscar IDs
    SELECT id INTO v_user_id FROM users WHERE email = 'creativescaciba@gmail.com';
    SELECT id INTO v_plan_id FROM plans WHERE code = 'premium';
    
    -- Deletar assinatura antiga se existir
    DELETE FROM subscriptions WHERE user_id = v_user_id;
    
    -- Criar nova assinatura
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
        NOW(),
        NOW() + INTERVAL '30 days'
    );
    
    -- Publicar perfil
    UPDATE profiles SET status = 'published' WHERE user_id = v_user_id;
    
    RAISE NOTICE 'Assinatura Premium ativada com sucesso!';
END $$;

-- 3. Verificar resultado
SELECT 
    u.email,
    p.code as plano,
    s.status,
    pr.status as perfil_status
FROM users u
JOIN subscriptions s ON u.id = s.user_id
JOIN plans p ON s.plan_id = p.id
LEFT JOIN profiles pr ON u.id = pr.user_id
WHERE u.email = 'creativescaciba@gmail.com';
