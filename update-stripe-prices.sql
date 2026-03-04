-- Atualizar Price IDs do Stripe no banco de dados
-- Execute este script no Supabase SQL Editor

-- Atualizar plano Premium com novo preço de R$ 49,00
UPDATE plans 
SET stripe_price_id = 'price_1T74EQFR1necx3GA53Afvm58'
WHERE code = 'premium';

-- Atualizar plano Black com novo preço de R$ 99,00
UPDATE plans
SET stripe_price_id = 'price_1T74EUFR1necx3GAJvkOX9js'
WHERE code = 'black';

-- Verificar se os IDs foram atualizados corretamente
SELECT code, name, stripe_price_id, price 
FROM plans 
WHERE code IN ('premium', 'black');

-- NOTA: Os preços antigos (price_1T5sMrFR1necx3GAACSpCByl e price_1T5sNjFR1necx3GAzhtTKN6O)
-- continuarão existindo no Stripe para manter o histórico, mas não serão mais usados
-- para novas assinaturas. Apenas os novos Price IDs acima serão utilizados.
